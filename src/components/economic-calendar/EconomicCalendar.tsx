import { useEffect, useMemo, useState } from "react";
import {
  Activity, AlertTriangle, ArrowDownRight, ArrowUpRight, Bell, Brain,
  Calendar as CalendarIcon, ChevronDown, Filter, Globe2, LineChart, Radio,
  Search, Sparkles, TrendingUp, Zap,
} from "lucide-react";
import {
  AssetClass, EconEvent, Impact, SESSIONS, activeSessions,
  buildEventsForRange, formatLocalTime, impactTone, nextSessionChange,
  relativeTime, volatilityColor,
} from "@/lib/economic-calendar-data";
import { Pill } from "@/components/dashboard/Primitives";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

type Mode = "beginner" | "pro";

const ASSET_TABS: { id: AssetClass | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "forex", label: "Forex" },
  { id: "crypto", label: "Crypto" },
  { id: "indices", label: "Indices" },
  { id: "commodities", label: "Commodities" },
];

const IMPACT_COLORS: Record<Impact, string> = {
  high: "bg-red-500",
  medium: "bg-amber-400",
  low: "bg-emerald-400",
};

const WATCHLIST = ["EURUSD", "XAUUSD", "BTCUSD", "NASDAQ"];

type RangePreset = "today" | "week" | "weekdays" | "month" | "custom";

function startOfDay(d: Date) { const x = new Date(d); x.setHours(0,0,0,0); return x; }
function endOfDay(d: Date) { const x = new Date(d); x.setHours(23,59,59,999); return x; }
function addDays(d: Date, n: number) { const x = new Date(d); x.setDate(x.getDate()+n); return x; }

function rangeFromPreset(preset: Exclude<RangePreset, "custom">, base = new Date()): { from: Date; to: Date } {
  const today = startOfDay(base);
  if (preset === "today") return { from: today, to: endOfDay(today) };
  if (preset === "week") {
    const dow = today.getDay();
    const monOffset = dow === 0 ? -6 : 1 - dow;
    const mon = addDays(today, monOffset);
    return { from: mon, to: endOfDay(addDays(mon, 6)) };
  }
  if (preset === "weekdays") {
    const dow = today.getDay();
    const monOffset = dow === 0 ? -6 : 1 - dow;
    const mon = addDays(today, monOffset);
    return { from: mon, to: endOfDay(addDays(mon, 4)) };
  }
  // month
  const first = new Date(today.getFullYear(), today.getMonth(), 1);
  const last = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  return { from: first, to: endOfDay(last) };
}

const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
function fmtDate(d: Date) {
  // Stable across server/client (avoids locale-dependent "May 2" vs "2 May").
  return `${MONTHS_SHORT[d.getMonth()]} ${d.getDate()}`;
}

const PRESET_LABELS: Record<RangePreset, string> = {
  today: "Today",
  weekdays: "This week (Mon–Fri)",
  week: "This week (Mon–Sun)",
  month: "This month",
  custom: "Custom",
};

// Stable epoch shared across SSR + first client render to prevent hydration
// mismatches in any time-dependent UI (event freshness, "released" state, etc).
// We snap to the nearest hour so the deterministic data engine produces the
// exact same output server-side and client-side on first paint.
function stableNow(): Date {
  // Snap to the current UTC hour so SSR (UTC) and client (any TZ) agree
  // on the deterministic "now" used for first paint.
  const d = new Date();
  d.setUTCMinutes(0, 0, 0);
  return d;
}

export function EconomicCalendar({ embedded = false }: { embedded?: boolean }) {
  const [now, setNow] = useState(() => stableNow());
  const [mounted, setMounted] = useState(false);
  const [mode, setMode] = useState<Mode>("pro");
  const [asset, setAsset] = useState<AssetClass | "all">("all");
  const [impactFilter, setImpactFilter] = useState<Impact | "all">("all");
  const [sessionFilter, setSessionFilter] = useState<string>("all");
  const [watchlistOnly, setWatchlistOnly] = useState(false);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [preset, setPreset] = useState<RangePreset>("today");
  const [customRange, setCustomRange] = useState<{ from?: Date; to?: Date }>({});

  useEffect(() => {
    setMounted(true);
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);

  const { from, to } = useMemo(() => {
    if (preset === "custom" && customRange.from && customRange.to) {
      return { from: startOfDay(customRange.from), to: endOfDay(customRange.to) };
    }
    return rangeFromPreset(preset === "custom" ? "today" : preset, now);
  }, [preset, customRange, now]);

  const events = useMemo(() => buildEventsForRange(from, to, now), [from, to, now]);
  const sessions = activeSessions(now);
  const next = nextSessionChange(now);

  const filtered = events.filter((e) => {
    const tms = new Date(e.time).getTime();
    if (tms < from.getTime() || tms > to.getTime()) return false;
    if (asset !== "all" && e.asset !== asset) return false;
    if (impactFilter !== "all" && e.impact !== impactFilter) return false;
    if (watchlistOnly && !e.pairsAffected.some((p) => WATCHLIST.includes(p))) return false;
    if (search && !`${e.title} ${e.currency} ${e.pairsAffected.join(" ")}`.toLowerCase().includes(search.toLowerCase())) return false;
    if (sessionFilter !== "all") {
      const evtH = new Date(e.time).getUTCHours();
      const s = SESSIONS.find((x) => x.id === sessionFilter);
      if (!s) return true;
      const hit = s.openUtc < s.closeUtc ? evtH >= s.openUtc && evtH < s.closeUtc : evtH >= s.openUtc || evtH < s.closeUtc;
      if (!hit) return false;
    }
    return true;
  });

  const upcomingHighImpact = events
    .filter((e) => new Date(e.time).getTime() > now.getTime() && e.impact === "high")
    .slice(0, 3);

  const marketBias = useMemo(() => {
    const score = events.reduce((acc, e) => acc + (e.bias === "bullish" ? 1 : e.bias === "bearish" ? -1 : 0), 0);
    return score > 1 ? "USD Bullish" : score < -1 ? "USD Bearish" : "Mixed / Range";
  }, [events]);

  return (
    <div className={embedded ? "" : "min-h-screen bg-[var(--rb-bg-canvas)] text-white"}>
      <div className={embedded ? "space-y-6" : "mx-auto max-w-7xl space-y-6 px-4 py-8"}>
        {/* HEADER */}
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-violet-400" />
              <span className="text-[11px] uppercase tracking-[0.25em] text-violet-300/80">RebateBoard Intelligence</span>
            </div>
            <h1 className="mt-1 bg-gradient-to-r from-white via-violet-200 to-violet-300 bg-clip-text text-2xl font-bold text-transparent md:text-4xl">
              Economic Calendar
            </h1>
            <p className="mt-1 text-sm text-white/60">
              Not just events — what they <span className="text-white">mean</span> and what to <span className="text-white">do</span>.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="glass flex items-center rounded-full p-1 text-[11px]">
              <button
                onClick={() => setMode("beginner")}
                className={`rounded-full px-3 py-1.5 ${mode === "beginner" ? "bg-emerald-500/20 text-emerald-300" : "text-white/50 hover:text-white"}`}
              >
                🟢 Beginner
              </button>
              <button
                onClick={() => setMode("pro")}
                className={`rounded-full px-3 py-1.5 ${mode === "pro" ? "bg-violet-500/20 text-violet-300" : "text-white/50 hover:text-white"}`}
              >
                🔴 Pro
              </button>
            </div>
            <button className="glass rounded-full p-2 text-white/70 hover:text-white"><Bell className="h-4 w-4" /></button>
          </div>
        </div>

        {/* WHAT MATTERS NOW STRIP */}
        <WhatMattersNow upcoming={upcomingHighImpact} marketBias={marketBias} now={now} />

        {/* SESSION INTELLIGENCE BAR */}
        <SessionBar sessions={sessions} next={next} now={now} mounted={mounted} />

        {/* DATE RANGE */}
        <div className="glass flex flex-wrap items-center gap-2 rounded-2xl p-3">
          <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-white/50">
            <CalendarIcon className="h-3.5 w-3.5 text-violet-300" /> Date range
          </div>
          <div className="flex flex-wrap gap-1">
            {(["today", "weekdays", "week", "month"] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPreset(p)}
                className={cn(
                  "rounded-full px-3 py-1 text-[11px] transition",
                  preset === p
                    ? "bg-violet-500/20 text-violet-200 ring-1 ring-violet-400/40"
                    : "bg-white/5 text-white/60 hover:text-white",
                )}
              >
                {PRESET_LABELS[p]}
              </button>
            ))}
            <Popover>
              <PopoverTrigger asChild>
                <button
                  className={cn(
                    "flex items-center gap-1 rounded-full px-3 py-1 text-[11px] transition",
                    preset === "custom"
                      ? "bg-violet-500/20 text-violet-200 ring-1 ring-violet-400/40"
                      : "bg-white/5 text-white/60 hover:text-white",
                  )}
                >
                  <CalendarIcon className="h-3 w-3" />
                  {preset === "custom" && customRange.from && customRange.to
                    ? `${fmtDate(customRange.from)} – ${fmtDate(customRange.to)}`
                    : "Custom"}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="range"
                  selected={customRange as { from: Date; to?: Date }}
                  onSelect={(r) => {
                    setCustomRange(r ?? {});
                    if (r?.from && r?.to) setPreset("custom");
                  }}
                  numberOfMonths={2}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>
          <span className="ml-auto text-[10px] text-white/50">
            {fmtDate(from)} → {fmtDate(to)}
          </span>
        </div>

        {/* FILTERS */}
        <div className="glass rounded-2xl p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 py-1.5">
              <Search className="h-3.5 w-3.5 text-white/40" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search event, currency, pair…"
                className="w-44 bg-transparent text-xs outline-none placeholder:text-white/30"
              />
            </div>
            <div className="flex flex-wrap gap-1">
              {ASSET_TABS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setAsset(t.id)}
                  className={`rounded-full px-3 py-1 text-[11px] transition ${asset === t.id ? "bg-violet-500/20 text-violet-200 ring-1 ring-violet-400/40" : "bg-white/5 text-white/60 hover:text-white"}`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <Divider />
            <div className="flex flex-wrap gap-1">
              {(["all", "high", "medium", "low"] as const).map((i) => (
                <button
                  key={i}
                  onClick={() => setImpactFilter(i)}
                  className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] transition ${impactFilter === i ? "bg-white/15 text-white ring-1 ring-white/20" : "bg-white/5 text-white/50 hover:text-white"}`}
                >
                  {i !== "all" && <span className={`h-2 w-2 rounded-full ${IMPACT_COLORS[i as Impact]}`} />}
                  {i === "all" ? "All impact" : i}
                </button>
              ))}
            </div>
            <Divider />
            <select
              value={sessionFilter}
              onChange={(e) => setSessionFilter(e.target.value)}
              className="rounded-full bg-white/5 px-3 py-1 text-[11px] text-white/70 outline-none"
            >
              <option value="all">All sessions</option>
              {SESSIONS.map((s) => (
                <option key={s.id} value={s.id}>{s.flag} {s.label}</option>
              ))}
            </select>
            <button
              onClick={() => setWatchlistOnly((v) => !v)}
              className={`flex items-center gap-1 rounded-full px-3 py-1 text-[11px] transition ${watchlistOnly ? "bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-400/40" : "bg-white/5 text-white/60 hover:text-white"}`}
            >
              <Filter className="h-3 w-3" /> Watchlist only
            </button>
            <span className="ml-auto text-[10px] text-white/40">{filtered.length} events</span>
          </div>
        </div>

        {/* EVENT GRID + SIDEBAR */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="space-y-3 lg:col-span-2">
            {filtered.length === 0 && (
              <div className="glass rounded-2xl p-8 text-center text-sm text-white/50">
                No events match your filters.
              </div>
            )}
            {mounted && filtered.map((e) => (
              <EventCard
                key={e.id}
                event={e}
                now={now}
                expanded={expanded === e.id}
                onToggle={() => setExpanded((p) => (p === e.id ? null : e.id))}
                mode={mode}
              />
            ))}
            {!mounted && (
              <div className="glass rounded-2xl p-8 text-center text-sm text-white/40">Loading events…</div>
            )}
          </div>

          <div className="space-y-4">
            <SessionHeatmap now={now} events={events} />
            <BiasPanel marketBias={marketBias} mode={mode} />
            <WatchlistPanel events={events} />
          </div>
        </div>
      </div>
    </div>
  );
}

function Divider() {
  return <span className="hidden h-4 w-px bg-white/10 sm:inline-block" />;
}

/* ─────────────── What Matters Now ─────────────── */
function WhatMattersNow({
  upcoming, marketBias, now,
}: { upcoming: EconEvent[]; marketBias: string; now: Date }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-violet-500/20 bg-gradient-to-r from-violet-500/10 via-violet-500/5 to-transparent p-4">
      <div className="pointer-events-none absolute -top-10 -right-10 h-40 w-40 rounded-full bg-violet-500/20 blur-3xl" />
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-violet-500" />
          </span>
          <span className="text-[11px] uppercase tracking-wider text-violet-300">What matters now</span>
        </div>

        {upcoming[0] ? (
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-300" />
            <span className="text-white">High impact {relativeTime(upcoming[0].time, now)}</span>
            <span className="text-white/60">→</span>
            <span className="font-semibold">{upcoming[0].flag} {upcoming[0].title}</span>
          </div>
        ) : (
          <span className="text-white/60">No major events scheduled.</span>
        )}

        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-orange-300" />
          <span className="text-white/80">XAUUSD vol spike expected</span>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-emerald-300" />
          <span className="text-[11px] uppercase tracking-wider text-white/50">Market bias</span>
          <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-semibold text-emerald-300">{marketBias}</span>
        </div>
      </div>
    </div>
  );
}

/* ─────────────── Session Intelligence Bar ─────────────── */
function SessionBar({
  sessions, next, now, mounted,
}: { sessions: ReturnType<typeof activeSessions>; next: ReturnType<typeof nextSessionChange>; now: Date; mounted: boolean }) {
  const tz = mounted ? Intl.DateTimeFormat().resolvedOptions().timeZone : "UTC";
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
      {SESSIONS.map((s) => {
        const live = sessions.some((a) => a.id === s.id);
        return (
          <div
            key={s.id}
            className={`glass relative overflow-hidden rounded-2xl p-4 transition ${live ? "ring-1 ring-emerald-400/40" : "opacity-70"}`}
          >
            {live && (
              <div className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                <Radio className="h-2.5 w-2.5" /> LIVE
              </div>
            )}
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <span className="text-base">{s.flag}</span> {s.label}
            </div>
            <div className="mt-2 grid grid-cols-2 gap-1 text-[10px] text-white/60">
              <span>Liquidity</span><span className="text-right text-white">{s.liquidity}</span>
              <span>Volatility</span><span className="text-right text-white">{s.volatility}</span>
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              {s.pairs.map((p) => (
                <span key={p} className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] text-white/70">{p}</span>
              ))}
            </div>
            {mounted && live && next.session.id === s.id && (
              <div className="mt-2 text-[10px] text-emerald-300/80">
                {next.type === "closes" ? "Closes" : "Opens"} in ~{Math.round(next.in * 60)}m
              </div>
            )}
          </div>
        );
      })}
      <div className="md:col-span-4 text-right text-[10px] text-white/40">
        Times in your timezone: <span className="text-white/70">{tz}</span>{mounted && <> · Updated {now.toLocaleTimeString()}</>}
      </div>
    </div>
  );
}

/* ─────────────── Event Card ─────────────── */
function EventCard({
  event: e, now, expanded, onToggle, mode,
}: { event: EconEvent; now: Date; expanded: boolean; onToggle: () => void; mode: Mode }) {
  const released = !!e.actual;
  const beat =
    released && e.forecast && e.actual
      ? parseFloat(e.actual) > parseFloat(e.forecast)
      : null;
  const insight = released
    ? beat ? e.insightIfBeat : e.insightIfMiss
    : `Pre-event bias: ${e.insightIfBeat}`;

  return (
    <div className={`glass overflow-hidden rounded-2xl border ${e.impact === "high" ? "border-red-500/20" : e.impact === "medium" ? "border-amber-400/15" : "border-white/5"} transition hover:border-white/20`}>
      <button onClick={onToggle} className="block w-full text-left">
        <div className="flex items-stretch">
          {/* Left rail: time + impact */}
          <div className="flex w-20 shrink-0 flex-col items-center justify-center border-r border-white/5 bg-black/20 p-3">
            <div className="text-[10px] uppercase text-white/40">{relativeTime(e.time, now)}</div>
            <div className="mt-0.5 text-base font-bold text-white">{formatLocalTime(e.time)}</div>
            <span className={`mt-2 h-1.5 w-8 rounded-full ${IMPACT_COLORS[e.impact]}`} />
          </div>

          {/* Body */}
          <div className="min-w-0 flex-1 p-3.5">
            <div className="flex items-center gap-2">
              <span className="text-base">{e.flag}</span>
              <span className="text-[10px] font-semibold text-white/70">{e.currency}</span>
              <Pill tone={impactTone(e.impact) as "default" | "destructive" | "warning"}>{e.impact}</Pill>
              <Pill tone="primary">{e.asset}</Pill>
              {released && (
                <Pill tone={beat ? "success" : "destructive"}>
                  {beat ? "BEAT" : "MISS"}
                </Pill>
              )}
              <span className="ml-auto text-[10px] text-white/40">Vol {e.volatilityScore.toFixed(1)}/10</span>
            </div>
            <div className="mt-1 truncate text-sm font-semibold text-white">{e.title}</div>

            {/* Volatility bar */}
            <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-white/5">
              <div
                className={`h-full bg-gradient-to-r ${volatilityColor(e.volatilityScore)}`}
                style={{ width: `${e.volatilityScore * 10}%` }}
              />
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px]">
              <span className="text-white/40">Forecast <span className="text-white">{e.forecast ?? "—"}</span></span>
              <span className="text-white/40">Previous <span className="text-white">{e.previous ?? "—"}</span></span>
              <span className="text-white/40">Actual <span className={released ? (beat ? "text-emerald-300" : "text-red-300") : "text-white/50"}>{e.actual ?? "—"}</span></span>
              <span className="text-white/40">Pairs <span className="text-white">{e.pairsAffected.slice(0, 3).join(", ")}</span></span>
              <ChevronDown className={`ml-auto h-4 w-4 text-white/40 transition ${expanded ? "rotate-180" : ""}`} />
            </div>

            {/* AI insight (always visible, one line) */}
            <div className="mt-2 flex items-start gap-2 rounded-lg border border-violet-500/15 bg-violet-500/5 p-2 text-[11px]">
              <Brain className="mt-0.5 h-3.5 w-3.5 shrink-0 text-violet-300" />
              <span className="text-white/80">{insight}</span>
            </div>
          </div>
        </div>
      </button>

      {expanded && (
        <div className="grid grid-cols-1 gap-4 border-t border-white/5 bg-black/20 p-4 md:grid-cols-2">
          {/* Historical reactions */}
          <div>
            <div className="mb-2 text-[10px] uppercase tracking-wider text-white/40">Last 5 reactions</div>
            <div className="flex items-end gap-1">
              {e.history.map((h, i) => (
                <div
                  key={i}
                  className={`h-10 flex-1 rounded ${h === "up" ? "bg-emerald-500/40" : h === "down" ? "bg-red-500/40" : "bg-white/10"}`}
                  style={{ height: `${24 + i * 4}px` }}
                />
              ))}
            </div>
            <div className="mt-2 text-[10px] text-white/50">
              {e.history.filter((x) => x === "up").length}/5 bullish for base currency
            </div>

            {mode === "pro" && (
              <div className="mt-3 grid grid-cols-2 gap-2 text-[10px]">
                <Stat label="Bias" value={e.bias} />
                <Stat label="Asset class" value={e.asset} />
                <Stat label="Volatility" value={`${e.volatilityScore.toFixed(1)}/10`} />
                <Stat label="Pairs" value={e.pairsAffected.length.toString()} />
              </div>
            )}
          </div>

          {/* Post-release reaction */}
          <div>
            <div className="mb-2 flex items-center justify-between text-[10px] uppercase tracking-wider text-white/40">
              <span>Post-release reaction</span>
              {e.reaction && (
                <span className={`flex items-center gap-1 ${e.reaction.movePips >= 0 ? "text-emerald-300" : "text-red-300"}`}>
                  {e.reaction.movePips >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                  {e.reaction.movePips >= 0 ? "+" : ""}{e.reaction.movePips} pips
                </span>
              )}
            </div>
            {e.reaction ? (
              <>
                <Sparkline points={e.reaction.spark} positive={e.reaction.movePips >= 0} />
                <div className="mt-2 flex items-center gap-3 text-[10px]">
                  <span className="rounded bg-orange-500/15 px-2 py-0.5 text-orange-300">
                    Vol +{e.reaction.volatilitySpikePct}%
                  </span>
                  <span className="text-white/60">{e.reaction.summary}</span>
                </div>
              </>
            ) : (
              <div className="rounded-lg border border-dashed border-white/10 p-4 text-center text-[11px] text-white/40">
                <LineChart className="mx-auto mb-1 h-4 w-4" />
                Awaiting release. Reaction will appear here in real time.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-white/5 p-2">
      <div className="text-white/40">{label}</div>
      <div className="mt-0.5 font-semibold text-white">{value}</div>
    </div>
  );
}

function Sparkline({ points, positive }: { points: number[]; positive: boolean }) {
  const w = 280, h = 60, pad = 4;
  const min = Math.min(...points), max = Math.max(...points);
  const range = max - min || 1;
  const stepX = (w - pad * 2) / Math.max(points.length - 1, 1);
  const y = (v: number) => h - pad - ((v - min) / range) * (h - pad * 2);
  const d = points.map((v, i) => `${i === 0 ? "M" : "L"}${(pad + i * stepX).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const color = positive ? "#34d399" : "#f87171";
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full">
      <defs>
        <linearGradient id={`spark-${positive ? "g" : "r"}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.4" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${d} L${w - pad},${h - pad} L${pad},${h - pad} Z`} fill={`url(#spark-${positive ? "g" : "r"})`} />
      <path d={d} fill="none" stroke={color} strokeWidth="1.5" />
    </svg>
  );
}

/* ─────────────── Sidebar widgets ─────────────── */
function SessionHeatmap({ now, events }: { now: Date; events: EconEvent[] }) {
  const cells = Array.from({ length: 24 }, (_, h) => {
    const evtAtHour = events.filter((e) => new Date(e.time).getUTCHours() === h);
    const intensity = evtAtHour.reduce((s, e) => s + e.volatilityScore, 0);
    return { h, intensity, count: evtAtHour.length };
  });
  const max = Math.max(...cells.map((c) => c.intensity), 1);
  const currentH = now.getUTCHours();

  return (
    <div className="glass rounded-2xl p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-sm font-semibold text-white">
          <Activity className="h-4 w-4 text-violet-300" /> Volatility Heatmap (UTC)
        </div>
        <span className="text-[10px] text-white/40">24h</span>
      </div>
      <div className="grid grid-cols-12 gap-1">
        {cells.map((c) => {
          const opacity = 0.1 + (c.intensity / max) * 0.85;
          const isNow = c.h === currentH;
          return (
            <div
              key={c.h}
              title={`${c.h}:00 UTC · ${c.count} event(s)`}
              className={`relative aspect-square rounded ${isNow ? "ring-1 ring-violet-400" : ""}`}
              style={{ background: `rgba(126,77,255,${opacity})` }}
            >
              {isNow && <span className="absolute -top-1 -right-1 h-1.5 w-1.5 animate-pulse rounded-full bg-violet-400" />}
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex items-center justify-between text-[9px] text-white/40">
        <span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>23:00</span>
      </div>
    </div>
  );
}

function BiasPanel({ marketBias, mode }: { marketBias: string; mode: Mode }) {
  return (
    <div className="glass rounded-2xl p-4">
      <div className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-white">
        <Globe2 className="h-4 w-4 text-emerald-300" /> Macro Bias
      </div>
      <div className="rounded-xl bg-gradient-to-br from-emerald-500/20 to-transparent p-3">
        <div className="text-[10px] uppercase tracking-wider text-emerald-300/80">Today</div>
        <div className="mt-1 text-xl font-bold text-white">{marketBias}</div>
        <div className="mt-2 text-[11px] text-white/60">
          {mode === "beginner"
            ? "Most events today lean USD-positive. Be careful shorting USD into data."
            : "Net bias derived from event lean across the day. Cross-reference with positioning data and DXY structure."}
        </div>
      </div>
    </div>
  );
}

function WatchlistPanel({ events }: { events: EconEvent[] }) {
  const counts = WATCHLIST.map((p) => ({
    pair: p,
    count: events.filter((e) => e.pairsAffected.includes(p)).length,
  }));
  return (
    <div className="glass rounded-2xl p-4">
      <div className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-white">
        <Sparkles className="h-4 w-4 text-violet-300" /> Your Watchlist
      </div>
      <ul className="space-y-1.5 text-[12px]">
        {counts.map((c) => (
          <li key={c.pair} className="flex items-center justify-between rounded-lg bg-white/5 px-2.5 py-1.5">
            <span className="font-semibold text-white">{c.pair}</span>
            <span className="text-white/50">{c.count} event{c.count === 1 ? "" : "s"} today</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
