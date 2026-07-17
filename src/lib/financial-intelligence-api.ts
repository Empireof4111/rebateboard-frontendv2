import { apiRequest } from "@/lib/api";
import type { Trade, TradingPlan } from "@/lib/trading-plan";

type StoredSession = {
  token?: string | null;
};

export type BackendJournalTrade = {
  id: number | string;
  asset?: string;
  market?: string;
  direction?: string;
  entryPrice?: number | string;
  exitPrice?: number | string;
  stopLoss?: number | string;
  takeProfit?: number | string;
  positionSize?: number | string;
  pnl?: number | string;
  outcome?: string;
  grossPnl?: number | string | null;
  fees?: number | string;
  netPnl?: number | string | null;
  pnlCurrency?: string;
  resultSource?: string;
  resultNotes?: string | null;
  rMultiple?: number | string;
  percentageGain?: number | string;
  result?: string;
  strategy?: string | null;
  instrumentId?: string | null;
  instrumentDisplayName?: string | null;
  instrumentSource?: string | null;
  session?: string | null;
  notes?: string | null;
  screenshots?: Record<string, unknown> | null;
  raw?: Record<string, unknown> | null;
  tradedAt?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type BackendLedgerEvent = {
  id: number | string;
  source?: string;
  sourceId?: string;
  direction?: string;
  category?: string;
  brand?: string | null;
  brandId?: string | null;
  accountId?: string | null;
  amount?: number | string;
  currency?: string;
  status?: string;
  verified?: boolean;
  occurredAt?: string;
  metadata?: Record<string, unknown> | null;
  createdAt?: string;
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

export function getFinancialAuthToken() {
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
    token: getFinancialAuthToken(),
  });
  if (!response.payload) throw new Error("Missing financial intelligence dashboard.");
  return response.payload;
}

export async function syncTradingPlanToBackend(plan: TradingPlan) {
  const token = getFinancialAuthToken();
  if (!token) return null;
  const response = await apiRequest<TradingPlan>("/financial-intelligence/trading-plan", {
    method: "POST",
    token,
    body: plan,
  });
  return response.payload ?? null;
}

export async function fetchTradingPlanFromBackend() {
  const token = getFinancialAuthToken();
  if (!token) return null;
  const response = await apiRequest<TradingPlan | null>("/financial-intelligence/trading-plan", {
    method: "GET",
    token,
  });
  return response.payload ?? null;
}

export async function saveJournalTradeToBackend(trade: Trade) {
  const token = getFinancialAuthToken();
  if (!token) return null;
  const response = await apiRequest("/financial-intelligence/journal", {
    method: "POST",
    token,
    body: trade,
  });
  return response.payload ?? null;
}

export async function fetchJournalTradesFromBackend() {
  const token = getFinancialAuthToken();
  if (!token) return [];
  const response = await apiRequest<BackendJournalTrade[]>("/financial-intelligence/journal", {
    method: "GET",
    token,
  });
  return response.payload ?? [];
}

export async function deleteJournalTradeFromBackend(trade: Pick<Trade, "id" | "backendId"> | string) {
  const token = getFinancialAuthToken();
  if (!token) return null;
  const tradeId = typeof trade === "string" ? trade : trade.backendId ?? trade.id;
  if (!tradeId) return null;
  const response = await apiRequest(`/financial-intelligence/journal/${encodeURIComponent(String(tradeId))}`, {
    method: "DELETE",
    token,
  });
  return response.payload ?? null;
}

export async function fetchFinancialLedgerEvents(params: { page?: number; size?: number; maxPages?: number } = {}) {
  const token = getFinancialAuthToken();
  if (!token) return [];
  const size = params.size ?? 100;
  const startPage = params.page ?? 0;
  const maxPages = params.maxPages ?? 5;
  const out: BackendLedgerEvent[] = [];

  for (let page = startPage; page < startPage + maxPages; page += 1) {
    const q = new URLSearchParams();
    q.set("page", String(page));
    q.set("size", String(size));
    const response = await apiRequest<{
      page: BackendLedgerEvent[];
      size: number;
      currentPage: number;
      totalPages: number;
    }>(`/financial-intelligence/ledger?${q.toString()}`, {
      method: "GET",
      token,
    });
    const items = response.payload?.page ?? [];
    out.push(...items);
    const totalPages = response.payload?.totalPages ?? page + 1;
    if (items.length < size || page + 1 >= totalPages) break;
  }

  return out;
}

export async function addFinancialLedgerEvent(input: {
  sourceId?: string;
  direction: "income" | "expense";
  category: string;
  amount: number;
  currency?: string;
  status?: string;
  brand?: string;
  brandId?: string;
  accountId?: string;
  occurredAt?: string;
  metadata?: Record<string, unknown>;
}) {
  const token = getFinancialAuthToken();
  if (!token) return null;
  const response = await apiRequest("/financial-intelligence/ledger", {
    method: "POST",
    token,
    body: input,
  });
  return response.payload ?? null;
}
