// Backtest Lab — schemas + lightweight store (Phase 2)
// In-memory + localStorage so saved reports/strategies persist across navigation.

import { useSyncExternalStore } from "react";
import type { BacktestReport, BacktestTrade } from "./backtest-data";

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
const TRADES_KEY = "rb.backtest.trades.v1";

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
let reportsState: BacktestReport[] = safeGet<BacktestReport[]>(REPORTS_KEY, []);
let templatesState: StrategyTemplate[] = safeGet<StrategyTemplate[]>(TEMPLATES_KEY, []);
let importsState: ImportedTradeBatch[] = safeGet<ImportedTradeBatch[]>(IMPORTS_KEY, []);
let reportTradesState: Record<string, BacktestTrade[]> = safeGet<Record<string, BacktestTrade[]>>(TRADES_KEY, {});

const listeners = new Set<() => void>();
function emit() { listeners.forEach((l) => l()); }
function subscribe(cb: () => void) { listeners.add(cb); return () => { listeners.delete(cb); }; }

// ---- public API ----
export function getReports() { return reportsState; }
export function getTemplates() { return templatesState; }
export function getImports() { return importsState; }
export function getReportTrades(reportId: string): BacktestTrade[] {
  return reportTradesState[reportId] ?? [];
}

export function setReports(next: BacktestReport[]) {
  reportsState = Array.isArray(next) ? next : [];
  safeSet(REPORTS_KEY, reportsState);
  emit();
}

export function setTemplates(next: StrategyTemplate[]) {
  templatesState = Array.isArray(next) ? next : [];
  safeSet(TEMPLATES_KEY, templatesState);
  emit();
}

export function setImports(next: ImportedTradeBatch[]) {
  importsState = Array.isArray(next) ? next : [];
  safeSet(IMPORTS_KEY, importsState);
  emit();
}

export function upsertReport(report: BacktestReport) {
  reportsState = [report, ...reportsState.filter((item) => item.id !== report.id)];
  safeSet(REPORTS_KEY, reportsState);
  emit();
}

export function upsertTemplate(template: StrategyTemplate) {
  templatesState = [template, ...templatesState.filter((item) => item.id !== template.id)];
  safeSet(TEMPLATES_KEY, templatesState);
  emit();
}

export function upsertImport(entry: ImportedTradeBatch) {
  importsState = [entry, ...importsState.filter((item) => item.id !== entry.id)];
  safeSet(IMPORTS_KEY, importsState);
  emit();
}

export function setReportTrades(reportId: string, trades: BacktestTrade[]) {
  reportTradesState = { ...reportTradesState, [reportId]: Array.isArray(trades) ? trades : [] };
  safeSet(TRADES_KEY, reportTradesState);
  emit();
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
  const nextTrades = { ...reportTradesState };
  delete nextTrades[id];
  reportTradesState = nextTrades;
  safeSet(REPORTS_KEY, reportsState);
  safeSet(TRADES_KEY, reportTradesState);
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
