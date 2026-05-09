import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar, Cell,
} from "recharts";
import { Download, MousePointerClick, AlertTriangle, Flame, Save, RotateCcw, Plus, X, Trash2 } from "lucide-react";
import { PageHeader, Panel, StatCard } from "@/components/superadmin/AdminUI";
import { toast } from "@/components/superadmin/AdminActions";
import {
  type SearchEvent,
  readSearchEvents,
  clearSearchEvents,
  countTopTerms,
  countTopClickedBrands,
  countNoResults,
  dailyTrend,
  readTrendingConfig,
  writeTrendingConfig,
  type TrendingConfig,
} from "@/lib/search-analytics";
import { TBI_BRANDS } from "@/lib/tbi-data";

export const Route = createFileRoute("/superadmin/search-analytics")({
  head: () => ({ meta: [{ title: "Search Analytics — Superadmin" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: SearchAnalyticsPage,
});

const COLORS = ["#d946ef", "#a855f7", "#8b5cf6", "#6366f1", "#3b82f6", "#06b6d4", "#10b981", "#f59e0b"];

function useEvents() {
  const [events, setEvents] = useState<SearchEvent[]>(() => readSearchEvents());
  useEffect(() => {
    const refresh = () => setEvents(readSearchEvents());
    window.addEventListener("rb:search-events", refresh);
    return () => window.removeEventListener("rb:search-events", refresh);
  }, []);
  return [events, setEvents] as const;
}

function SearchAnalyticsPage() {
  const [events, setEvents] = useEvents();
  const [range, setRange] = useState<7 | 30 | 90>(30);

  const filtered = useMemo(() => {
    const cutoff = Date.now() - range * 86400_000;
    return events.filter((e) => new Date(e.at).getTime() >= cutoff);
  }, [events, range]);

  const totalSearches = filtered.filter((e) => e.type === "search" || e.type === "no_results").length;
  const totalClicks = filtered.filter((e) => e.type === "click").length;
  const noResults = filtered.filter((e) => e.type === "no_results").length;
  const ctr = totalSearches ? Math.round((totalClicks / totalSearches) * 100) : 0;

  const trend = useMemo(() => dailyTrend(filtered, range), [filtered, range]);
  const topTerms = useMemo(() => countTopTerms(filtered, 10), [filtered]);
  const topBrands = useMemo(() => countTopClickedBrands(filtered, 10), [filtered]);
  const noResultsTerms = useMemo(() => countNoResults(filtered, 8), [filtered]);

  function exportCsv() {
    const rows = [["timestamp", "type", "term", "result", "group", "to", "surface"]];
    filtered.forEach((e) => rows.push([e.at, e.type, e.term, e.resultLabel ?? "", e.resultGroup ?? "", e.to ?? "", e.surface]));
    const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `search-analytics-${range}d.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported");
  }

  function resetEvents() {
    if (!confirm("Clear all search analytics events? This cannot be undone.")) return;
    clearSearchEvents();
    setEvents([]);
    toast.info("Search events cleared");
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Search Analytics" subtitle="Live insights from the global search modal — terms, clicks, gaps, and trends." actions={
        <div className="flex items-center gap-2">
          {([7, 30, 90] as const).map((d) => (
            <button key={d} onClick={() => setRange(d)} className={`rounded-full px-3 py-1.5 text-xs font-semibold ring-1 transition ${range === d ? "bg-fuchsia-500/20 text-fuchsia-200 ring-fuchsia-400/40" : "bg-white/5 text-muted-foreground ring-white/10 hover:text-white"}`}>{d}d</button>
          ))}
          <button onClick={exportCsv} className="ml-2 inline-flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1.5 text-xs font-semibold text-white ring-1 ring-white/10 hover:bg-white/10"><Download className="h-3.5 w-3.5" /> CSV</button>
          <button onClick={resetEvents} className="inline-flex items-center gap-1.5 rounded-full bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-300 ring-1 ring-red-400/30 hover:bg-red-500/20"><Trash2 className="h-3.5 w-3.5" /> Reset</button>
        </div>
      } />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Total Searches" value={totalSearches.toLocaleString()} />
        <StatCard label="Result Clicks" value={totalClicks.toLocaleString()} tone="up" />
        <StatCard label="Click-through Rate" value={`${ctr}%`} />
        <StatCard label="No-result Queries" value={noResults.toLocaleString()} tone={noResults > 0 ? "down" : "flat"} />
      </div>

      <Panel title="Daily Trend">
        <div className="h-64 w-full">
          <ResponsiveContainer>
            <AreaChart data={trend}>
              <defs>
                <linearGradient id="gSearch" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#d946ef" stopOpacity={0.6} /><stop offset="100%" stopColor="#d946ef" stopOpacity={0} /></linearGradient>
                <linearGradient id="gClick" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#10b981" stopOpacity={0.6} /><stop offset="100%" stopColor="#10b981" stopOpacity={0} /></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="date" tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 10 }} />
              <YAxis tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 10 }} />
              <Tooltip contentStyle={{ background: "#1a0d36", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12 }} />
              <Area type="monotone" dataKey="searches" stroke="#d946ef" fill="url(#gSearch)" strokeWidth={2} />
              <Area type="monotone" dataKey="clicks" stroke="#10b981" fill="url(#gClick)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Top Search Terms" action={<Flame className="h-4 w-4 text-fuchsia-300" />}>
          <div className="h-64 w-full">
            <ResponsiveContainer>
              <BarChart data={topTerms} layout="vertical" margin={{ left: 80 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis type="number" tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 10 }} />
                <YAxis type="category" dataKey="term" tick={{ fill: "rgba(255,255,255,0.7)", fontSize: 11 }} width={100} />
                <Tooltip contentStyle={{ background: "#1a0d36", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12 }} />
                <Bar dataKey="count" radius={[0, 8, 8, 0]}>
                  {topTerms.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Top Clicked Brands" action={<MousePointerClick className="h-4 w-4 text-emerald-300" />}>
          <ul className="space-y-2">
            {topBrands.length === 0 && <li className="px-3 py-8 text-center text-sm text-muted-foreground">No clicks yet.</li>}
            {topBrands.map((b, i) => (
              <li key={b.label} className="flex items-center justify-between gap-3 rounded-lg bg-white/[0.03] px-3 py-2 ring-1 ring-white/5">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="grid h-6 w-6 place-items-center rounded-full text-[10px] font-bold text-white" style={{ background: COLORS[i % COLORS.length] }}>{i + 1}</span>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-white">{b.label}</div>
                    <div className="truncate text-[11px] text-muted-foreground">{b.group}</div>
                  </div>
                </div>
                <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-semibold text-emerald-300">{b.count} clicks</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <Panel title="No-result Queries (content gaps)" action={<AlertTriangle className="h-4 w-4 text-amber-300" />}>
        {noResultsTerms.length === 0 ? (
          <div className="px-3 py-8 text-center text-sm text-muted-foreground">No empty searches in this window — nice.</div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {noResultsTerms.map((t) => (
              <span key={t.term} className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 px-3 py-1.5 text-xs text-amber-200 ring-1 ring-amber-400/30">
                {t.term}
                <span className="rounded-full bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-bold">{t.count}</span>
              </span>
            ))}
          </div>
        )}
      </Panel>

      <TrendingEditor topTermSuggestions={topTerms.map((t) => t.term)} topBrandSuggestions={topBrands.map((b) => b.label)} />

      <Panel title="Recent Events">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="text-left text-[10px] uppercase tracking-wider text-muted-foreground">
              <tr><th className="px-2 py-2">Time</th><th className="px-2 py-2">Type</th><th className="px-2 py-2">Term</th><th className="px-2 py-2">Result</th><th className="px-2 py-2">Group</th></tr>
            </thead>
            <tbody>
              {filtered.slice(0, 25).map((e) => (
                <tr key={e.id} className="border-t border-white/5 text-white">
                  <td className="px-2 py-2 text-muted-foreground">{new Date(e.at).toLocaleString()}</td>
                  <td className="px-2 py-2"><span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${e.type === "click" ? "bg-emerald-500/15 text-emerald-300" : e.type === "no_results" ? "bg-amber-500/15 text-amber-300" : "bg-fuchsia-500/15 text-fuchsia-300"}`}>{e.type}</span></td>
                  <td className="px-2 py-2">{e.term}</td>
                  <td className="px-2 py-2">{e.resultLabel ?? "—"}</td>
                  <td className="px-2 py-2 text-muted-foreground">{e.resultGroup ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

/* --------- Trending editor --------- */

function TrendingEditor({ topTermSuggestions, topBrandSuggestions }: { topTermSuggestions: string[]; topBrandSuggestions: string[] }) {
  const [cfg, setCfg] = useState<TrendingConfig>(() => readTrendingConfig());
  const [dirty, setDirty] = useState(false);
  const [newTerm, setNewTerm] = useState("");
  const [newBrand, setNewBrand] = useState("");

  function update(next: TrendingConfig) { setCfg(next); setDirty(true); }
  function save() { writeTrendingConfig(cfg); setDirty(false); toast.success("Trending config saved — live on landing search"); }
  function reset() { const fresh = readTrendingConfig(); setCfg(fresh); setDirty(false); toast.info("Reverted to saved values"); }

  function addTerm() { const v = newTerm.trim(); if (!v) return; update({ ...cfg, searches: { ...cfg.searches, items: [...cfg.searches.items, v] } }); setNewTerm(""); }
  function removeTerm(t: string) { update({ ...cfg, searches: { ...cfg.searches, items: cfg.searches.items.filter((x) => x !== t) } }); }
  function addBrand() { const v = newBrand.trim(); if (!v) return; update({ ...cfg, brands: { ...cfg.brands, items: [...cfg.brands.items, v] } }); setNewBrand(""); }
  function removeBrand(b: string) { update({ ...cfg, brands: { ...cfg.brands, items: cfg.brands.items.filter((x) => x !== b) } }); }

  const allBrandNames = TBI_BRANDS.map((b) => b.name);

  return (
    <Panel
      title="Trending Editor"
      action={
        <div className="flex items-center gap-2">
          {dirty && <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-300">Unsaved</span>}
          <button onClick={reset} className="inline-flex items-center gap-1 rounded-full bg-white/5 px-3 py-1 text-[11px] text-white ring-1 ring-white/10 hover:bg-white/10"><RotateCcw className="h-3 w-3" /> Reset</button>
          <button onClick={save} className="inline-flex items-center gap-1 rounded-full bg-fuchsia-500/20 px-3 py-1 text-[11px] font-semibold text-fuchsia-200 ring-1 ring-fuchsia-400/40 hover:bg-fuchsia-500/30"><Save className="h-3 w-3" /> Save</button>
        </div>
      }
    >
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Searches */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-white">Trending searches</h4>
            <ModeToggle mode={cfg.searches.mode} onChange={(m) => update({ ...cfg, searches: { ...cfg.searches, mode: m } })} />
          </div>
          <p className="text-[11px] text-muted-foreground">{cfg.searches.mode === "auto" ? "Auto: live top-search terms from analytics. Manual list below is the fallback." : "Manual: only the items below are shown to users."}</p>

          <div className="flex flex-wrap gap-2">
            {cfg.searches.items.map((t) => (
              <span key={t} className="inline-flex items-center gap-1.5 rounded-full bg-fuchsia-500/15 px-3 py-1 text-xs text-fuchsia-200 ring-1 ring-fuchsia-400/30">
                {t}
                <button onClick={() => removeTerm(t)} className="opacity-70 hover:opacity-100"><X className="h-3 w-3" /></button>
              </span>
            ))}
            {cfg.searches.items.length === 0 && <span className="text-[11px] text-muted-foreground">No items.</span>}
          </div>

          <div className="flex items-center gap-2">
            <input value={newTerm} onChange={(e) => setNewTerm(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addTerm()} placeholder="Add a term…" className="flex-1 rounded-lg bg-white/5 px-3 py-1.5 text-xs text-white outline-none ring-1 ring-white/10 placeholder:text-muted-foreground focus:ring-fuchsia-400/40" />
            <button onClick={addTerm} className="inline-flex items-center gap-1 rounded-lg bg-white/5 px-3 py-1.5 text-xs text-white ring-1 ring-white/10 hover:bg-white/10"><Plus className="h-3 w-3" /> Add</button>
          </div>

          {topTermSuggestions.length > 0 && (
            <div>
              <div className="mb-1 text-[10px] uppercase tracking-wider text-muted-foreground">Suggestions from analytics</div>
              <div className="flex flex-wrap gap-1.5">
                {topTermSuggestions.filter((s) => !cfg.searches.items.some((i) => i.toLowerCase() === s.toLowerCase())).slice(0, 8).map((s) => (
                  <button key={s} onClick={() => update({ ...cfg, searches: { ...cfg.searches, items: [...cfg.searches.items, s] } })} className="rounded-full bg-white/5 px-2 py-0.5 text-[11px] text-white ring-1 ring-white/10 hover:bg-fuchsia-500/15">+ {s}</button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Brands */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-white">Trending brands</h4>
            <ModeToggle mode={cfg.brands.mode} onChange={(m) => update({ ...cfg, brands: { ...cfg.brands, mode: m } })} />
          </div>
          <p className="text-[11px] text-muted-foreground">{cfg.brands.mode === "auto" ? "Auto: most-clicked brands from search analytics." : "Manual: pick brands to feature."}</p>

          <div className="flex flex-wrap gap-2">
            {cfg.brands.items.map((b) => (
              <span key={b} className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-xs text-emerald-200 ring-1 ring-emerald-400/30">
                {b}
                <button onClick={() => removeBrand(b)} className="opacity-70 hover:opacity-100"><X className="h-3 w-3" /></button>
              </span>
            ))}
            {cfg.brands.items.length === 0 && <span className="text-[11px] text-muted-foreground">No items.</span>}
          </div>

          <div className="flex items-center gap-2">
            <input value={newBrand} onChange={(e) => setNewBrand(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addBrand()} placeholder="Add a brand…" list="brand-options" className="flex-1 rounded-lg bg-white/5 px-3 py-1.5 text-xs text-white outline-none ring-1 ring-white/10 placeholder:text-muted-foreground focus:ring-emerald-400/40" />
            <datalist id="brand-options">{allBrandNames.map((n) => <option key={n} value={n} />)}</datalist>
            <button onClick={addBrand} className="inline-flex items-center gap-1 rounded-lg bg-white/5 px-3 py-1.5 text-xs text-white ring-1 ring-white/10 hover:bg-white/10"><Plus className="h-3 w-3" /> Add</button>
          </div>

          {topBrandSuggestions.length > 0 && (
            <div>
              <div className="mb-1 text-[10px] uppercase tracking-wider text-muted-foreground">Suggestions from analytics</div>
              <div className="flex flex-wrap gap-1.5">
                {topBrandSuggestions.filter((s) => !cfg.brands.items.some((i) => i.toLowerCase() === s.toLowerCase())).slice(0, 8).map((s) => (
                  <button key={s} onClick={() => update({ ...cfg, brands: { ...cfg.brands, items: [...cfg.brands.items, s] } })} className="rounded-full bg-white/5 px-2 py-0.5 text-[11px] text-white ring-1 ring-white/10 hover:bg-emerald-500/15">+ {s}</button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Panel>
  );
}

function ModeToggle({ mode, onChange }: { mode: "auto" | "manual"; onChange: (m: "auto" | "manual") => void }) {
  return (
    <div className="inline-flex rounded-full bg-white/5 p-0.5 ring-1 ring-white/10">
      {(["auto", "manual"] as const).map((m) => (
        <button key={m} onClick={() => onChange(m)} className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase ${mode === m ? "bg-fuchsia-500/30 text-white" : "text-muted-foreground hover:text-white"}`}>{m}</button>
      ))}
    </div>
  );
}
