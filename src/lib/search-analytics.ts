/**
 * Global Search analytics — captures every query/click made through the
 * landing-page Global Search modal, plus admin-curated trending lists.
 *
 * Storage: localStorage (so events persist across the demo session even
 * after a refresh). When the real backend lands, swap these helpers for
 * fetch / react-query — call sites stay identical.
 */

export type SearchEvent = {
  id: string;
  /** "search" = a query was submitted; "click" = a result was opened */
  type: "search" | "click" | "no_results";
  term: string;
  /** Result label that was opened (for click events) */
  resultLabel?: string;
  /** Group of opened result, e.g. "Brokers", "Prop Firms" */
  resultGroup?: string;
  /** Destination route */
  to?: string;
  /** Source surface — e.g. "landing", "header" */
  surface: string;
  /** ISO timestamp */
  at: string;
};

const EVENTS_KEY = "rb_search_events";
const TRENDING_KEY = "rb_trending_config";
const MAX_EVENTS = 5000;

/* ---------------- events ---------------- */

export function readSearchEvents(): SearchEvent[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(EVENTS_KEY);
    if (raw) return JSON.parse(raw) as SearchEvent[];
  } catch {/* ignore */}
  // Seed with realistic demo data on first read so the dashboard isn't empty.
  const seed = seedEvents();
  try { localStorage.setItem(EVENTS_KEY, JSON.stringify(seed)); } catch {/* ignore */}
  return seed;
}

function writeEvents(events: SearchEvent[]) {
  if (typeof window === "undefined") return;
  const trimmed = events.slice(0, MAX_EVENTS);
  try { localStorage.setItem(EVENTS_KEY, JSON.stringify(trimmed)); } catch {/* ignore */}
  // Notify listeners (admin-store-style pub/sub)
  try { window.dispatchEvent(new CustomEvent("rb:search-events")); } catch {/* ignore */}
}

export function logSearchEvent(ev: Omit<SearchEvent, "id" | "at"> & { at?: string }) {
  const row: SearchEvent = {
    id: `se_${Math.random().toString(36).slice(2, 9)}`,
    at: ev.at ?? new Date().toISOString(),
    ...ev,
  };
  const all = readSearchEvents();
  writeEvents([row, ...all]);
}

export function clearSearchEvents() {
  writeEvents([]);
}

/* ---------------- aggregations ---------------- */

export function countTopTerms(events: SearchEvent[], limit = 10) {
  const map = new Map<string, number>();
  events
    .filter((e) => e.type === "search" || e.type === "no_results")
    .forEach((e) => {
      const k = e.term.trim().toLowerCase();
      if (!k) return;
      map.set(k, (map.get(k) ?? 0) + 1);
    });
  return Array.from(map.entries())
    .map(([term, count]) => ({ term, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

export function countTopClickedBrands(events: SearchEvent[], limit = 10) {
  const map = new Map<string, { count: number; group: string; to: string }>();
  events
    .filter((e) => e.type === "click" && e.resultLabel)
    .forEach((e) => {
      const key = e.resultLabel!;
      const cur = map.get(key);
      if (cur) cur.count += 1;
      else map.set(key, { count: 1, group: e.resultGroup ?? "—", to: e.to ?? "#" });
    });
  return Array.from(map.entries())
    .map(([label, v]) => ({ label, ...v }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

export function countNoResults(events: SearchEvent[], limit = 10) {
  const map = new Map<string, number>();
  events.filter((e) => e.type === "no_results").forEach((e) => {
    const k = e.term.trim().toLowerCase();
    if (!k) return;
    map.set(k, (map.get(k) ?? 0) + 1);
  });
  return Array.from(map.entries())
    .map(([term, count]) => ({ term, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

export function dailyTrend(events: SearchEvent[], days = 30) {
  const out: { date: string; searches: number; clicks: number }[] = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    out.push({ date: key.slice(5), searches: 0, clicks: 0 });
  }
  const idx = new Map(out.map((r, i) => [r.date, i]));
  events.forEach((e) => {
    const k = e.at.slice(5, 10);
    const i = idx.get(k);
    if (i == null) return;
    if (e.type === "click") out[i].clicks += 1;
    else out[i].searches += 1;
  });
  return out;
}

/* ---------------- trending config (manual override + auto) ---------------- */

export type TrendingConfig = {
  searches: { mode: "auto" | "manual"; items: string[] };
  brands: { mode: "auto" | "manual"; items: string[] };
};

const DEFAULT_CONFIG: TrendingConfig = {
  searches: { mode: "auto", items: ["FTMO", "Binance", "MyForexFunds", "ICMarkets", "Bybit", "Payouts today", "Best rebates"] },
  brands: { mode: "auto", items: [] },
};

export function readTrendingConfig(): TrendingConfig {
  if (typeof window === "undefined") return DEFAULT_CONFIG;
  try {
    const raw = localStorage.getItem(TRENDING_KEY);
    if (raw) return { ...DEFAULT_CONFIG, ...JSON.parse(raw) } as TrendingConfig;
  } catch {/* ignore */}
  return DEFAULT_CONFIG;
}

export function writeTrendingConfig(cfg: TrendingConfig) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(TRENDING_KEY, JSON.stringify(cfg)); } catch {/* ignore */}
  try { window.dispatchEvent(new CustomEvent("rb:trending-config")); } catch {/* ignore */}
}

/** Resolve the live trending searches list (auto = top terms from analytics) */
export function resolveTrendingSearches(limit = 8): string[] {
  const cfg = readTrendingConfig();
  if (cfg.searches.mode === "manual") return cfg.searches.items.slice(0, limit);
  const top = countTopTerms(readSearchEvents(), limit).map((t) => titleCase(t.term));
  if (top.length === 0) return cfg.searches.items.slice(0, limit);
  return top;
}

/** Resolve the live trending brands list — returns brand labels */
export function resolveTrendingBrands(limit = 6): string[] {
  const cfg = readTrendingConfig();
  if (cfg.brands.mode === "manual" && cfg.brands.items.length > 0) {
    return cfg.brands.items.slice(0, limit);
  }
  const top = countTopClickedBrands(readSearchEvents(), limit).map((b) => b.label);
  return top;
}

function titleCase(s: string) {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

/* ---------------- seed ---------------- */

function seedEvents(): SearchEvent[] {
  const terms = [
    "FTMO", "Binance", "MyForexFunds", "ICMarkets", "Bybit",
    "Payouts today", "Best rebates", "Pepperstone", "The5ers", "Funded Next",
    "OKX", "BlueBerry", "EightCap", "Topstep", "Apex Trader",
  ];
  const noResultTerms = ["forex bonus 2025", "100% deposit", "scam check", "instant payout"];
  const brandClicks: { label: string; group: string; to: string }[] = [
    { label: "FTMO", group: "Prop Firms", to: "/tbi/brand/ftmo" },
    { label: "Binance", group: "Exchanges", to: "/tbi/brand/binance" },
    { label: "ICMarkets", group: "Brokers", to: "/tbi/brand/icmarkets" },
    { label: "Pepperstone", group: "Brokers", to: "/tbi/brand/pepperstone" },
    { label: "Bybit", group: "Exchanges", to: "/tbi/brand/bybit" },
    { label: "MyForexFunds", group: "Prop Firms", to: "/tbi/brand/myforexfunds" },
  ];
  const out: SearchEvent[] = [];
  const now = Date.now();
  for (let d = 29; d >= 0; d--) {
    const base = now - d * 86400_000;
    const searchCount = 30 + Math.floor(Math.random() * 70);
    for (let i = 0; i < searchCount; i++) {
      const t = terms[Math.floor(Math.random() * terms.length)];
      out.push({
        id: `se_seed_${d}_${i}`,
        type: "search",
        term: t,
        surface: "landing",
        at: new Date(base - Math.floor(Math.random() * 86400_000)).toISOString(),
      });
    }
    const clickCount = Math.floor(searchCount * 0.55);
    for (let i = 0; i < clickCount; i++) {
      const b = brandClicks[Math.floor(Math.random() * brandClicks.length)];
      out.push({
        id: `se_seed_c_${d}_${i}`,
        type: "click",
        term: b.label,
        resultLabel: b.label,
        resultGroup: b.group,
        to: b.to,
        surface: "landing",
        at: new Date(base - Math.floor(Math.random() * 86400_000)).toISOString(),
      });
    }
    const nrCount = Math.floor(Math.random() * 5);
    for (let i = 0; i < nrCount; i++) {
      const t = noResultTerms[Math.floor(Math.random() * noResultTerms.length)];
      out.push({
        id: `se_seed_nr_${d}_${i}`,
        type: "no_results",
        term: t,
        surface: "landing",
        at: new Date(base - Math.floor(Math.random() * 86400_000)).toISOString(),
      });
    }
  }
  return out.sort((a, b) => b.at.localeCompare(a.at));
}
