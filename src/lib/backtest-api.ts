import { apiRequest } from "@/lib/api";
import type { BacktestReport, BacktestTrade } from "@/lib/backtest-data";
import type { ImportedTradeBatch, StrategyTemplate } from "@/lib/backtest-store";

const AUTH_STORAGE_KEY = "rb_auth_session";

type StoredSession = {
  token?: string | null;
};

function readToken() {
  if (typeof window === "undefined") return null;

  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredSession;
    return parsed.token ?? null;
  } catch {
    return null;
  }
}

export type BacktestRules = {
  entry: string;
  exit: string;
  risk: string;
  filters: string;
  invalidation: string;
  fees: string;
};

export type BacktestBoard = {
  reports: BacktestReport[];
  templates: StrategyTemplate[];
  imports: ImportedTradeBatch[];
  stats: {
    totalBacktests: number;
    savedStrategies: number;
    imports: number;
    bestStrategy: BacktestReport | null;
    feesAnalyzed: number;
    lastReport: BacktestReport | null;
  };
};

export type InterpretBacktestPayload = {
  description: string;
  symbol: string;
  timeframe: string;
  session: string;
  riskPerTrade: string | number;
  maxTrades: string | number;
};

export type RunBacktestPayload = InterpretBacktestPayload & {
  name: string;
  market: string;
  range: string;
  startBalance: string | number;
  rules?: BacktestRules;
};

export type ImportBacktestTradesPayload = {
  source: string;
  account: string;
  range: string;
  startBalance: string | number;
  currency: string;
  rows: Record<string, string>[];
  mapping: Record<string, string | null>;
};

export async function fetchBacktestBoard() {
  const response = await apiRequest<BacktestBoard>("/backtest/board", {
    method: "GET",
    token: readToken(),
  });
  if (!response.payload) throw new Error("Missing backtest board payload");
  return response.payload;
}

export async function interpretBacktestStrategy(payload: InterpretBacktestPayload) {
  const response = await apiRequest<{ interpretation: BacktestRules }>("/backtest/interpret", {
    method: "POST",
    token: readToken(),
    body: payload,
  });
  if (!response.payload) throw new Error("Missing strategy interpretation payload");
  return response.payload;
}

export async function saveBacktestTemplate(payload: RunBacktestPayload) {
  const response = await apiRequest<StrategyTemplate>("/backtest/templates", {
    method: "POST",
    token: readToken(),
    body: payload,
  });
  if (!response.payload) throw new Error("Missing saved template payload");
  return response.payload;
}

export async function runBacktestStrategy(payload: RunBacktestPayload) {
  const response = await apiRequest<{ report: BacktestReport; trades: BacktestTrade[] }>("/backtest/run", {
    method: "POST",
    token: readToken(),
    body: payload,
  });
  if (!response.payload) throw new Error("Missing backtest run payload");
  return response.payload;
}

export async function importBacktestTrades(payload: ImportBacktestTradesPayload) {
  const response = await apiRequest<{
    import: ImportedTradeBatch;
    report: BacktestReport;
    trades: BacktestTrade[];
  }>("/backtest/import-trades", {
    method: "POST",
    token: readToken(),
    body: payload,
  });
  if (!response.payload) throw new Error("Missing trade import payload");
  return response.payload;
}

export async function generateBacktestInsights(reportId: string) {
  const response = await apiRequest<{
    insights: { title: string; text: string; tone: "success" | "warn" | "info" | "danger" }[];
  }>("/backtest/insights", {
    method: "POST",
    token: readToken(),
    body: { reportId: Number(reportId) },
  });
  if (!response.payload) throw new Error("Missing backtest insights payload");
  return response.payload;
}

export async function deleteBacktestReport(reportId: string) {
  const response = await apiRequest<{ deleted: string }>(`/backtest/reports/${reportId}`, {
    method: "DELETE",
    token: readToken(),
  });
  if (!response.payload) throw new Error("Missing deleted report payload");
  return response.payload;
}

export async function fetchBacktestReportTrades(reportId: string) {
  const response = await apiRequest<BacktestTrade[]>(`/backtest/reports/${reportId}/trades`, {
    method: "GET",
    token: readToken(),
  });
  if (!response.payload) throw new Error("Missing report trades payload");
  return response.payload;
}
