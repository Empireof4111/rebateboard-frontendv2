import { apiRequest } from "@/lib/api";

/**
 * Global Search analytics helpers.
 *
 * We still keep a tiny local mirror so the modal feels responsive, but the
 * source of truth is now the backend endpoints.
 */

export type SearchEvent = {
  id: string;
  type: "search" | "click" | "no_results";
  term: string;
  resultLabel?: string;
  resultGroup?: string;
  to?: string;
  surface: string;
  at: string;
};

const EVENTS_KEY = "rb_search_events";
const TRENDING_KEY = "rb_trending_config";
const MAX_EVENTS = 5000;
const SESSION_KEY = "rb_search_session_id";

export type TrendingConfig = {
  searches: { mode: "auto" | "manual"; items: string[]; resolved?: string[] };
  brands: { mode: "auto" | "manual"; items: string[]; resolved?: string[] };
  updatedAt?: string;
};

const DEFAULT_CONFIG: TrendingConfig = {
  searches: {
    mode: "auto",
    items: ["FTMO", "Binance", "MyForexFunds", "ICMarkets", "Bybit", "Payouts today", "Best rebates"],
    resolved: [],
  },
  brands: { mode: "auto", items: [], resolved: [] },
  updatedAt: new Date(0).toISOString(),
};

export function readSearchEvents(): SearchEvent[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(EVENTS_KEY);
    if (raw) return JSON.parse(raw) as SearchEvent[];
  } catch {}
  return [];
}

function writeEvents(events: SearchEvent[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(EVENTS_KEY, JSON.stringify(events.slice(0, MAX_EVENTS)));
  } catch {}
  try {
    window.dispatchEvent(new CustomEvent("rb:search-events"));
  } catch {}
}

function readSearchSessionId() {
  if (typeof window === "undefined") return "server";
  try {
    const existing = localStorage.getItem(SESSION_KEY);
    if (existing) return existing;
    const created = `search_${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(SESSION_KEY, created);
    return created;
  } catch {
    return `search_${Math.random().toString(36).slice(2, 10)}`;
  }
}

export function logSearchEvent(ev: Omit<SearchEvent, "id" | "at"> & { at?: string }) {
  const row: SearchEvent = {
    id: `se_${Math.random().toString(36).slice(2, 9)}`,
    at: ev.at ?? new Date().toISOString(),
    ...ev,
  };
  const all = readSearchEvents();
  writeEvents([row, ...all]);

  void apiRequest("/search-analytics/event", {
    method: "POST",
    body: {
      type: ev.type,
      term: ev.term,
      resultLabel: ev.resultLabel,
      resultGroup: ev.resultGroup,
      to: ev.to,
      surface: ev.surface,
      sessionId: readSearchSessionId(),
    },
  }).catch(() => {
    // Search analytics must never block user navigation.
  });
}

export function clearSearchEvents() {
  writeEvents([]);
}

export function countTopTerms(events: SearchEvent[], limit = 10) {
  const map = new Map<string, number>();
  events
    .filter((e) => e.type === "search" || e.type === "no_results")
    .forEach((e) => {
      const key = e.term.trim().toLowerCase();
      if (!key) return;
      map.set(key, (map.get(key) ?? 0) + 1);
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
      const key = e.resultLabel as string;
      const current = map.get(key);
      if (current) current.count += 1;
      else map.set(key, { count: 1, group: e.resultGroup ?? "-", to: e.to ?? "#" });
    });
  return Array.from(map.entries())
    .map(([label, value]) => ({ label, ...value }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

export function countNoResults(events: SearchEvent[], limit = 10) {
  const map = new Map<string, number>();
  events
    .filter((e) => e.type === "no_results")
    .forEach((e) => {
      const key = e.term.trim().toLowerCase();
      if (!key) return;
      map.set(key, (map.get(key) ?? 0) + 1);
    });
  return Array.from(map.entries())
    .map(([term, count]) => ({ term, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

export function dailyTrend(events: SearchEvent[], days = 30) {
  const out: { date: string; searches: number; clicks: number }[] = [];
  const index = new Map<string, number>();
  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const date = new Date();
    date.setDate(date.getDate() - offset);
    const key = date.toISOString().slice(0, 10);
    out.push({ date: date.toLocaleDateString("en-US", { month: "short", day: "2-digit" }), searches: 0, clicks: 0 });
    index.set(key, out.length - 1);
  }
  events.forEach((event) => {
    const key = event.at.slice(0, 10);
    const rowIndex = index.get(key);
    if (rowIndex == null) return;
    if (event.type === "click") out[rowIndex].clicks += 1;
    else out[rowIndex].searches += 1;
  });
  return out;
}

export function readTrendingConfig(): TrendingConfig {
  if (typeof window === "undefined") return DEFAULT_CONFIG;
  try {
    const raw = localStorage.getItem(TRENDING_KEY);
    if (raw) return { ...DEFAULT_CONFIG, ...JSON.parse(raw) } as TrendingConfig;
  } catch {}
  return DEFAULT_CONFIG;
}

export function writeTrendingConfig(cfg: TrendingConfig) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(TRENDING_KEY, JSON.stringify(cfg));
  } catch {}
  try {
    window.dispatchEvent(new CustomEvent("rb:trending-config"));
  } catch {}
}

export async function fetchPublicSearchTrending() {
  const response = await apiRequest<TrendingConfig>("/search-analytics/public/trending", {
    method: "GET",
  });
  if (!response.payload) throw new Error("Missing public search trending payload");
  return response.payload;
}

export function resolveTrendingSearches(limit = 8): string[] {
  const cfg = readTrendingConfig();
  if (cfg.searches.mode === "manual") return cfg.searches.items.slice(0, limit);
  const top = countTopTerms(readSearchEvents(), limit).map((item) => titleCase(item.term));
  if (top.length === 0) return cfg.searches.items.slice(0, limit);
  return top;
}

export function resolveTrendingBrands(limit = 6): string[] {
  const cfg = readTrendingConfig();
  if (cfg.brands.mode === "manual" && cfg.brands.items.length > 0) {
    return cfg.brands.items.slice(0, limit);
  }
  return countTopClickedBrands(readSearchEvents(), limit).map((item) => item.label);
}

function titleCase(value: string) {
  return value.replace(/\b\w/g, (char) => char.toUpperCase());
}
