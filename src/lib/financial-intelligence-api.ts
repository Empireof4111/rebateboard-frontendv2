import { apiRequest } from "@/lib/api";
import type { Trade, TradingPlan } from "@/lib/trading-plan";

type StoredSession = {
  token?: string | null;
};

export type FinancialSummary = {
  totalInvested: number;
  totalReturned: number;
  totalCashback: number;
  totalPayouts: number;
  netProfit: number;
  roiPct: number | null;
  eventCount: number;
  pendingCount: number;
  byBrand: Array<{
    brand: string;
    income: number;
    expense: number;
    net: number;
    roiPct: number | null;
  }>;
  monthly: Array<{ month: string; income: number; expense: number; net: number }>;
};

export type FinancialDashboard = {
  generatedAt: string;
  summary: FinancialSummary;
  journalSummary: {
    totalTrades: number;
    wins: number;
    losses: number;
    winRate: number;
    netPnl: number;
    averageR: number;
  };
  leakage: Array<{
    type: string;
    tone: string;
    title: string;
    body: string;
    amount?: number;
  }>;
  recommendations: string[];
  plan: TradingPlan | null;
  recentLedger: unknown[];
  recentTrades: unknown[];
};

function getAuthToken() {
  if (typeof window === "undefined") return null;

  try {
    const raw = localStorage.getItem("rb_auth_session");
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredSession;
    return parsed.token ?? null;
  } catch {
    return null;
  }
}

export async function fetchFinancialDashboard() {
  const response = await apiRequest<FinancialDashboard>("/financial-intelligence/dashboard", {
    method: "GET",
    token: getAuthToken(),
  });
  if (!response.payload) throw new Error("Missing financial intelligence dashboard.");
  return response.payload;
}

export async function syncTradingPlanToBackend(plan: TradingPlan) {
  const token = getAuthToken();
  if (!token) return null;
  const response = await apiRequest<TradingPlan>("/financial-intelligence/trading-plan", {
    method: "POST",
    token,
    body: plan,
  });
  return response.payload ?? null;
}

export async function saveJournalTradeToBackend(trade: Trade) {
  const token = getAuthToken();
  if (!token) return null;
  const response = await apiRequest("/financial-intelligence/journal", {
    method: "POST",
    token,
    body: trade,
  });
  return response.payload ?? null;
}

export async function addFinancialLedgerEvent(input: {
  direction: "income" | "expense";
  category: string;
  amount: number;
  currency?: string;
  brand?: string;
  occurredAt?: string;
  metadata?: Record<string, unknown>;
}) {
  const token = getAuthToken();
  if (!token) return null;
  const response = await apiRequest("/financial-intelligence/ledger", {
    method: "POST",
    token,
    body: input,
  });
  return response.payload ?? null;
}
