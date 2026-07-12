import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  Brain,
  CalendarDays,
  Clock3,
  ExternalLink,
  Filter,
  Globe2,
  RefreshCw,
  ShieldAlert,
  Timer,
} from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export const Route = createFileRoute("/economic-calendar")({
  head: () => ({
    meta: [
      { title: "Economic Calendar | RebateBoard" },
      {
        name: "description",
        content:
          "Track economic events, trading sessions, session overlaps, and market-preparation guidance before high-impact releases.",
      },
    ],
  }),
  component: EconomicCalendarPage,
});

const TIMEZONES = [
  "auto",
  "UTC",
  "America/New_York",
  "Europe/London",
  "Europe/Berlin",
  "Asia/Tokyo",
  "Australia/Sydney",
  "Africa/Lagos",
  "Asia/Dubai",
  "Asia/Singapore",
];

type SessionId = "sydney" | "tokyo" | "london" | "newyork";

type MarketSession = {
  id: SessionId;
  name: string;
  zone: string;
  openHour: number;
  closeHour: number;
  markets: string[];
  note: string;
};

const SESSIONS: MarketSession[] = [
  {
    id: "sydney",
    name: "Sydney",
    zone: "Australia/Sydney",
    openHour: 8,
    closeHour: 17,
    markets: ["AUD", "NZD", "Asia-Pacific indices"],
    note: "Often quieter, useful for AUD/NZD preparation.",
  },
  {
    id: "tokyo",
    name: "Tokyo / Asia",
    zone: "Asia/Tokyo",
    openHour: 9,
    closeHour: 18,
    markets: ["JPY", "AUD/JPY", "Asian indices"],
    note: "Important for JPY pairs and Asia risk tone.",
  },
  {
    id: "london",
    name: "London",
    zone: "Europe/London",
    openHour: 8,
    closeHour: 17,
    markets: ["EUR", "GBP", "Gold", "Major FX"],
    note: "Usually the deepest European liquidity window.",
  },
  {
    id: "newyork",
    name: "New York",
    zone: "America/New_York",
    openHour: 8,
    closeHour: 17,
    markets: ["USD", "CAD", "US indices", "Gold"],
    note: "Important for USD releases and US equity flows.",
  },
];

function EconomicCalendarPage() {
  const browserTz = typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "UTC";
  const [timezone, setTimezone] = useState("auto");
  const [now, setNow] = useState(() => new Date());
  const selectedTimezone = timezone === "auto" ? browserTz : timezone;

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const sessionStates = useMemo(
    () => SESSIONS.map((session) => getSessionState(session, now, selectedTimezone)),
    [now, selectedTimezone],
  );
  const active = sessionStates.filter((session) => session.active);
  const overlap = resolveOverlap(active.map((session) => session.id));

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#3d1364_0%,#140821_55%,#0a0613_100%)] text-white">
      <SiteHeader />
      <main className="container-app space-y-6 py-8 sm:py-12">
        <section className="rounded-[2rem] border border-white/10 bg-white/[0.045] p-6 shadow-[0_30px_100px_rgba(0,0,0,0.35)] md:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/15 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-violet-100 ring-1 ring-primary/20">
                <CalendarDays className="h-3.5 w-3.5" />
                Market Preparation
              </div>
              <h1 className="mt-5 text-4xl font-black leading-tight md:text-6xl">Economic Calendar</h1>
              <p className="mt-4 text-base leading-8 text-white/68">
                Track important market events, active trading sessions, and high-impact releases before they affect forex, crypto, commodities, and global indices.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <a href="#calendar" className="rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-600 px-5 py-3 text-center text-sm font-black text-white">
                View Today’s Events
              </a>
              <a href="#filters" className="rounded-full border border-white/12 px-5 py-3 text-center text-sm font-bold text-white/80">
                High Impact Only
              </a>
            </div>
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.045] p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-2xl font-black">Live Trading Sessions</h2>
                <p className="mt-1 text-sm text-white/58">Session times and calendar context use the selected timezone.</p>
              </div>
              <label className="flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 py-2 text-sm text-white/75">
                <Globe2 className="h-4 w-4 text-violet-200" />
                <select
                  value={timezone}
                  onChange={(event) => setTimezone(event.target.value)}
                  className="bg-transparent text-sm text-white outline-none [color-scheme:dark]"
                >
                  {TIMEZONES.map((zone) => (
                    <option key={zone} value={zone}>{zone === "auto" ? `Auto (${browserTz})` : zone}</option>
                  ))}
                </select>
              </label>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {sessionStates.map((session) => (
                <article
                  key={session.id}
                  className={`relative overflow-hidden rounded-3xl border p-4 transition ${
                    session.active
                      ? "border-emerald-300/35 bg-emerald-400/10 shadow-[0_0_50px_rgba(52,211,153,0.10)]"
                      : "border-white/10 bg-white/[0.035]"
                  }`}
                >
                  {session.active && <div className="absolute inset-x-5 top-0 h-px animate-pulse bg-emerald-300/70" />}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-base font-black">{session.name}</h3>
                      <p className="mt-1 text-xs text-white/55">{session.localOpen} - {session.localClose}</p>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${
                      session.active ? "bg-emerald-400/18 text-emerald-200" : "bg-white/8 text-white/55"
                    }`}>
                      {session.active ? "Live" : "Closed"}
                    </span>
                  </div>
                  <div className="mt-4 flex items-center gap-2 text-xs text-white/68">
                    <Timer className="h-4 w-4 text-violet-200" />
                    {session.active ? `Closes in ${session.timeRemaining}` : `Opens in ${session.timeRemaining}`}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {session.markets.map((market) => (
                      <span key={market} className="rounded-full bg-white/8 px-2 py-1 text-[10px] font-bold text-white/68">{market}</span>
                    ))}
                  </div>
                  <p className="mt-3 text-xs leading-5 text-white/50">{session.note}</p>
                </article>
              ))}
            </div>
            {overlap && (
              <div className="mt-4 rounded-3xl border border-cyan-300/20 bg-cyan-400/10 p-4">
                <div className="flex items-center gap-2 text-sm font-black text-cyan-100">
                  <Activity className="h-4 w-4" />
                  {overlap.title}
                </div>
                <p className="mt-2 text-sm leading-6 text-white/62">{overlap.body}</p>
              </div>
            )}
          </div>

          <SessionTimeline sessions={sessionStates} timezone={selectedTimezone} now={now} />
        </section>

        <section id="filters" className="rounded-[2rem] border border-white/10 bg-white/[0.045] p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="flex items-center gap-2 text-sm font-black">
              <Filter className="h-4 w-4 text-violet-200" />
              Calendar Filters
            </div>
            <div className="flex flex-wrap gap-2">
              {["Today", "Tomorrow", "This Week", "High", "Medium", "Low", "USD", "EUR", "GBP", "JPY", "Watched Only"].map((filter) => (
                <button key={filter} className="rounded-full border border-white/10 bg-white/[0.045] px-3 py-1.5 text-xs font-bold text-white/68 transition hover:border-primary/35 hover:text-white">
                  {filter}
                </button>
              ))}
            </div>
            <span className="lg:ml-auto rounded-full bg-white/8 px-3 py-1.5 text-xs text-white/55">
              Timezone: {selectedTimezone}
            </span>
          </div>
        </section>

        <section id="calendar" className="grid gap-5 xl:grid-cols-[1fr_360px]">
          <TradingViewCalendar timezone={selectedTimezone} />
          <aside className="space-y-4">
            <RebetaPreparationCard />
            <article className="rounded-[2rem] border border-white/10 bg-white/[0.045] p-5">
              <div className="flex items-center gap-2 text-sm font-black">
                <ShieldAlert className="h-4 w-4 text-cyan-200" />
                Journal Context
              </div>
              <p className="mt-3 text-sm leading-7 text-white/60">
                RebateBoard can later connect trade timestamps, instrument, selected timezone, and event proximity so Rebeta can identify whether losses cluster near high-impact releases.
              </p>
            </article>
          </aside>
        </section>

        <section className="rounded-[2rem] border border-white/10 bg-white/[0.045] p-6 md:p-8">
          <h2 className="text-3xl font-black">Trading Around Economic News</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[
              "High-impact means the event has historically created larger market reactions, not guaranteed direction.",
              "Spreads may widen and slippage may occur around fast releases.",
              "Prop-firm rules differ. Always confirm whether news trading is allowed.",
              "Review open exposure before major releases, especially correlated positions.",
              "Avoid impulsive entries immediately after a headline without a plan.",
              "Journal your news-adjacent trades so Rebeta can help identify patterns later.",
            ].map((item) => (
              <div key={item} className="rounded-3xl border border-white/10 bg-black/15 p-4 text-sm leading-6 text-white/64">
                {item}
              </div>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/dashboard/trading-plan" className="rounded-full border border-white/12 px-4 py-2 text-sm font-bold text-white/78">Trading Plan</Link>
            <Link to="/dashboard/trades" className="rounded-full border border-white/12 px-4 py-2 text-sm font-bold text-white/78">Trading Journal</Link>
            <Link to="/dashboard/ai-coach" className="rounded-full border border-white/12 px-4 py-2 text-sm font-bold text-white/78">Ask Rebeta</Link>
            <Link to="/academy" className="rounded-full border border-white/12 px-4 py-2 text-sm font-bold text-white/78">Academy</Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

function TradingViewCalendar({ timezone }: { timezone: string }) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setLoaded(true), 1200);
    return () => window.clearTimeout(timer);
  }, [timezone]);

  return (
    <article className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.045]">
      <div className="flex items-center justify-between gap-3 border-b border-white/10 p-4">
        <div>
          <h2 className="text-xl font-black">Economic Events</h2>
          <p className="mt-1 text-xs text-white/50">Powered by TradingView. Times should be checked against your selected trading platform.</p>
        </div>
        <a
          href="https://www.tradingview.com/economic-calendar/"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-full bg-white/8 px-3 py-2 text-xs font-bold text-white/72 hover:text-white"
        >
          TradingView <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>
      <div className="relative min-h-[620px] bg-[#0f071b]">
        {!loaded && !failed && (
          <div className="absolute inset-0 z-10 grid place-items-center bg-[#0f071b]">
            <div className="w-full max-w-lg space-y-3 p-6">
              <div className="h-8 animate-pulse rounded-full bg-white/10" />
              <div className="h-24 animate-pulse rounded-3xl bg-white/8" />
              <div className="h-24 animate-pulse rounded-3xl bg-white/8" />
              <div className="h-24 animate-pulse rounded-3xl bg-white/8" />
            </div>
          </div>
        )}
        {failed ? (
          <div className="grid min-h-[620px] place-items-center p-6 text-center">
            <div>
              <Clock3 className="mx-auto h-10 w-10 text-violet-200" />
              <h3 className="mt-4 text-xl font-black">The economic calendar is temporarily unavailable.</h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-7 text-white/58">Please retry or view TradingView directly while the widget reconnects.</p>
              <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
                <button onClick={() => setFailed(false)} className="inline-flex items-center justify-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-bold">
                  <RefreshCw className="h-4 w-4" /> Retry
                </button>
                <a href="https://www.tradingview.com/economic-calendar/" target="_blank" rel="noreferrer" className="rounded-full border border-white/12 px-4 py-2 text-sm font-bold text-white/78">
                  View TradingView
                </a>
              </div>
            </div>
          </div>
        ) : (
          <iframe
            key={timezone}
            title="TradingView Economic Calendar"
            src={`https://www.tradingview.com/economic-calendar/widget/?colorTheme=dark&isTransparent=true&locale=en#timezone=${encodeURIComponent(timezone)}`}
            className="h-[620px] w-full border-0"
            loading="lazy"
            onLoad={() => setLoaded(true)}
            onError={() => setFailed(true)}
          />
        )}
      </div>
    </article>
  );
}

function RebetaPreparationCard() {
  return (
    <article className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-primary/14 to-white/[0.035] p-5">
      <div className="flex items-center gap-2 text-sm font-black">
        <Brain className="h-4 w-4 text-violet-200" />
        Rebeta Market Preparation
      </div>
      <ul className="mt-4 space-y-3 text-sm leading-6 text-white/63">
        {[
          "Review open exposure before high-impact releases.",
          "Check spread and execution conditions.",
          "Confirm your prop firm’s news-trading rules.",
          "Avoid impulsive entries and confirm stop-loss placement.",
          "Journal trades taken near major releases.",
        ].map((item) => (
          <li key={item} className="flex gap-3">
            <span className="mt-2 h-1.5 w-1.5 rounded-full bg-violet-200" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}

function SessionTimeline({ sessions, timezone, now }: { sessions: ReturnType<typeof getSessionState>[]; timezone: string; now: Date }) {
  const currentHour = Number(formatInZone(now, timezone, { hour: "numeric", hour12: false }));
  return (
    <article className="rounded-[2rem] border border-white/10 bg-white/[0.045] p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-black">24h Session Timeline</h2>
          <p className="mt-1 text-sm text-white/55">{timezone}</p>
        </div>
        <Clock3 className="h-5 w-5 text-violet-200" />
      </div>
      <div className="mt-6 space-y-4">
        {sessions.map((session) => (
          <div key={session.id}>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="font-bold text-white/82">{session.name}</span>
              <span className="text-white/45">{session.localOpen} - {session.localClose}</span>
            </div>
            <div className="relative h-4 overflow-hidden rounded-full bg-white/8">
              <div
                className={`absolute inset-y-0 rounded-full ${session.active ? "bg-emerald-300/60" : "bg-violet-300/28"}`}
                style={{ left: `${session.timelineStart}%`, width: `${session.timelineWidth}%` }}
              />
              <div className="absolute inset-y-[-2px] w-px bg-white" style={{ left: `${(currentHour / 24) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
      <p className="mt-5 rounded-3xl border border-white/10 bg-black/15 p-4 text-sm leading-6 text-white/58">
        The marker shows your current selected-timezone hour. Use this as preparation context, not a prediction of market direction.
      </p>
    </article>
  );
}

function getSessionState(session: MarketSession, now: Date, displayTimezone: string) {
  const localHour = Number(formatInZone(now, session.zone, { hour: "numeric", hour12: false }));
  const localMinute = Number(formatInZone(now, session.zone, { minute: "numeric" }));
  const localDecimal = localHour + localMinute / 60;
  const active = localDecimal >= session.openHour && localDecimal < session.closeHour;
  const targetHour = active ? session.closeHour : localDecimal < session.openHour ? session.openHour : session.openHour + 24;
  const hoursRemaining = Math.max(0, targetHour - localDecimal);
  const timelineStart = (convertSessionHourToDisplay(session, session.openHour, now, displayTimezone) / 24) * 100;
  const timelineEnd = (convertSessionHourToDisplay(session, session.closeHour, now, displayTimezone) / 24) * 100;
  const timelineWidth = timelineEnd >= timelineStart ? timelineEnd - timelineStart : 100 - timelineStart + timelineEnd;

  return {
    ...session,
    active,
    localOpen: formatSessionTime(session, session.openHour, displayTimezone, now),
    localClose: formatSessionTime(session, session.closeHour, displayTimezone, now),
    timeRemaining: formatDuration(hoursRemaining),
    timelineStart,
    timelineWidth: Math.max(4, timelineWidth),
  };
}

function convertSessionHourToDisplay(session: MarketSession, hour: number, now: Date, displayTimezone: string) {
  const parts = zonedParts(now, session.zone);
  const date = new Date(Date.UTC(parts.year, parts.month - 1, parts.day, hour, 0, 0));
  return Number(formatInZone(date, displayTimezone, { hour: "numeric", hour12: false }));
}

function formatSessionTime(session: MarketSession, hour: number, displayTimezone: string, now: Date) {
  const parts = zonedParts(now, session.zone);
  const date = new Date(Date.UTC(parts.year, parts.month - 1, parts.day, hour, 0, 0));
  return formatInZone(date, displayTimezone, { hour: "2-digit", minute: "2-digit", hour12: false });
}

function zonedParts(date: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const get = (type: string) => Number(parts.find((part) => part.type === type)?.value || 0);
  return { year: get("year"), month: get("month"), day: get("day") };
}

function formatInZone(date: Date, timezone: string, options: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat("en-US", { timeZone: timezone, ...options }).format(date);
}

function formatDuration(hours: number) {
  const totalMinutes = Math.round(hours * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h <= 0) return `${m}m`;
  return `${h}h ${m}m`;
}

function resolveOverlap(activeIds: SessionId[]) {
  const has = (id: SessionId) => activeIds.includes(id);
  if (has("london") && has("newyork")) {
    return {
      title: "London-New York Overlap",
      body: "Typically one of the highest-liquidity periods for major forex pairs such as EUR/USD, GBP/USD, USD/JPY, gold, and major indices.",
    };
  }
  if (has("sydney") && has("tokyo")) {
    return {
      title: "Sydney-Tokyo Overlap",
      body: "A useful Asia-Pacific window for AUD, NZD, and JPY pairs. Liquidity can improve, but direction is never guaranteed.",
    };
  }
  return null;
}
