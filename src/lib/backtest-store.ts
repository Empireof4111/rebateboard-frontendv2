// Backtest Lab — schemas + lightweight store (Phase 2)
// In-memory + localStorage so saved reports/strategies persist across navigation.

import { useSyncExternalStore } from "react";
import {
  mockReports,
  mockTrades,
  type BacktestReport,
  type BacktestTrade,
} from "./backtest-data";

export type StrategyTemplate = {
  id: string;
  name: string;
  market: string;
  symbol: string;
  timeframe: string;
  session: string;
  range: string;
  startBalance: number;
  riskPerTrade: number;
  description: string;
  rules: {
    entry: string;
    exit: string;
    risk: string;
    filters: string;
    invalidation: string;
    fees: string;
  };
  createdAt: string;
};

export type ImportedTradeBatch = {
  id: string;
  source: string; // e.g. "MT5 Statement", "Binance CSV"
  account: string;
  range: string;
  startBalance: number;
  currency: string;
  trades: number;
  createdAt: string;
};

const REPORTS_KEY = "rb.backtest.reports.v1";
const TEMPLATES_KEY = "rb.backtest.templates.v1";
const IMPORTS_KEY = "rb.backtest.imports.v1";

const isBrowser = typeof window !== "undefined";

function safeGet<T>(key: string, fallback: T): T {
  if (!isBrowser) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function safeSet<T>(key: string, value: T) {
  if (!isBrowser) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch { /* ignore */ }
}

// ---- state caches (referentially stable for useSyncExternalStore) ----
let reportsState: BacktestReport[] = safeGet<BacktestReport[]>(REPORTS_KEY, mockReports);
let templatesState: StrategyTemplate[] = safeGet<StrategyTemplate[]>(TEMPLATES_KEY, defaultTemplates());
let importsState: ImportedTradeBatch[] = safeGet<ImportedTradeBatch[]>(IMPORTS_KEY, []);

const listeners = new Set<() => void>();
function emit() { listeners.forEach((l) => l()); }
function subscribe(cb: () => void) { listeners.add(cb); return () => { listeners.delete(cb); }; }

// ---- public API ----
export function getReports() { return reportsState; }
export function getTemplates() { return templatesState; }
export function getImports() { return importsState; }
export function getReportTrades(_reportId: string): BacktestTrade[] {
  // Phase 1: return mock trade rows for any report.
  return mockTrades;
}

export function addReport(r: Omit<BacktestReport, "id" | "createdAt" | "status">) {
  const report: BacktestReport = {
    ...r,
    id: `bt-${Date.now()}`,
    createdAt: new Date().toISOString().slice(0, 10),
    status: "completed",
  };
  reportsState = [report, ...reportsState];
  safeSet(REPORTS_KEY, reportsState);
  emit();
  return report;
}

export function deleteReport(id: string) {
  reportsState = reportsState.filter((r) => r.id !== id);
  safeSet(REPORTS_KEY, reportsState);
  emit();
}

export function addTemplate(t: Omit<StrategyTemplate, "id" | "createdAt">) {
  const tpl: StrategyTemplate = {
    ...t,
    id: `tpl-${Date.now()}`,
    createdAt: new Date().toISOString().slice(0, 10),
  };
  templatesState = [tpl, ...templatesState];
  safeSet(TEMPLATES_KEY, templatesState);
  emit();
  return tpl;
}

export function addImport(i: Omit<ImportedTradeBatch, "id" | "createdAt">) {
  const imp: ImportedTradeBatch = {
    ...i,
    id: `imp-${Date.now()}`,
    createdAt: new Date().toISOString().slice(0, 10),
  };
  importsState = [imp, ...importsState];
  safeSet(IMPORTS_KEY, importsState);
  emit();
  return imp;
}

// ---- Template "Use" preset (in-memory hand-off to NewStrategy) ----
let presetState: StrategyTemplate | null = null;
const presetListeners = new Set<() => void>();
function emitPreset() { presetListeners.forEach((l) => l()); }
export function setPreset(t: StrategyTemplate | null) { presetState = t; emitPreset(); }
export function consumePreset(): StrategyTemplate | null {
  const p = presetState; presetState = null; emitPreset(); return p;
}
export function usePresetSubscribe() {
  return useSyncExternalStore(
    (cb) => { presetListeners.add(cb); return () => { presetListeners.delete(cb); }; },
    () => presetState, () => presetState,
  );
}

// ---- React hooks ----
export function useReports() {
  return useSyncExternalStore(subscribe, getReports, getReports);
}
export function useTemplates() {
  return useSyncExternalStore(subscribe, getTemplates, getTemplates);
}
export function useImports() {
  return useSyncExternalStore(subscribe, getImports, getImports);
}

function defaultTemplates(): StrategyTemplate[] {
  const base = (overrides: Partial<StrategyTemplate>): StrategyTemplate => ({
    id: `tpl-seed-${Math.random().toString(36).slice(2, 8)}`,
    name: "Untitled",
    market: "Forex",
    symbol: "EURUSD",
    timeframe: "15m",
    session: "London",
    range: "6 months",
    startBalance: 10000,
    riskPerTrade: 1,
    description: "",
    rules: {
      entry: "Break of structure + retest",
      exit: "TP at 2R, trail after 1R",
      risk: "1% per trade, daily loss cap 3%",
      filters: "Tue–Thu, no news ±30min",
      invalidation: "Skip if range > 60 pips",
      fees: "Spread 0.8 pip, $7/lot, +$2.3/lot cashback",
    },
    createdAt: "2026-04-01",
    ...overrides,
  });
  return [
    base({ name: "London Asian Range Break", market: "Forex", symbol: "EURUSD" }),
    base({ name: "BTC Mean Reversion", market: "Crypto", symbol: "BTCUSDT", timeframe: "1h", session: "24/7" }),
    base({ name: "NY Open Momentum", market: "Indices", symbol: "US100", timeframe: "5m", session: "New York" }),
    base({ name: "Gold News Fade", market: "Commodities", symbol: "XAUUSD", timeframe: "30m", session: "London" }),
  ];
}
