// Trader ROI Tracker (TRT) — local store + types + insight engine.
// Used by the user dashboard module and aggregated by the superadmin
// analytics page. Data is persisted in localStorage so the experience feels
// real across reloads. Replace with API-backed calls when wiring to Cloud.

import { useSyncExternalStore } from "react";
import { adminBrands } from "@/lib/admin-data";

// ---------- Types ----------

export type TrtDirection = "income" | "expense";

export type TrtCategory =
  // expense
  | "challenge_fee"
  | "reset_fee"
  | "platform_subscription"
  | "tool_subscription"
  | "education"
  | "broker_deposit"
  | "data_feed"
  | "vps"
  | "other_expense"
  // income
  | "payout"
  | "rebate"
  | "broker_withdrawal"
  | "affiliate"
  | "scholarship"
  | "other_income";

export type TrtAccountType =
  | "prop_challenge"
  | "prop_funded"
  | "broker_live"
  | "broker_demo"
  | "exchange"
  | "tool_subscription";

export type TrtAccountStatus = "active" | "funded" | "passed" | "breached" | "closed" | "cancelled";

export type TrtBrand = {
  id: string;          // listed-brand id, OR `custom:<slug>`
  name: string;
  category?: string;
  custom?: boolean;
};

export type TrtAccount = {
  id: string;
  name: string;          // "FTMO 100K Phase 1"
  brand: TrtBrand;
  type: TrtAccountType;
  size?: number;         // capital, USD
  phase?: "phase_1" | "phase_2" | "funded" | "verification";
  status: TrtAccountStatus;
  openedAt: string;      // ISO
  notes?: string;
};

export type TrtTransaction = {
  id: string;
  date: string;             // ISO
  direction: TrtDirection;
  category: TrtCategory;
  brand: TrtBrand;
  accountId?: string;
  amount: number;           // in original currency
  currency: string;         // ISO 4217 — default USD
  status: "confirmed" | "pending" | "cancelled";
  notes?: string;
  createdAt: string;
};

export type TrtPayout = {
  id: string;
  txId: string;             // backing transaction
  method?: string;          // "Bank wire", "USDT TRC20"
  proofUrl?: string;
};

export type TrtState = {
  baseCurrency: string;
  transactions: TrtTransaction[];
  accounts: TrtAccount[];
  payouts: TrtPayout[];
};

// ---------- Persistence ----------

const KEY = "rb.trt.v1";

function seed(): TrtState {
  const now = Date.now();
  const day = (n: number) => new Date(now - n * 86_400_000).toISOString();
  const ftmo: TrtBrand = { id: "b_02", name: "FTMO", category: "Prop Firm" };
  const ic: TrtBrand = { id: "b_10", name: "IC Markets", category: "Forex Broker" };
  const tv: TrtBrand = { id: "b_13", name: "TradingView", category: "Trading Software" };
  const bybit: TrtBrand = { id: "b_07", name: "Bybit", category: "Crypto Exchange" };

  const accounts: TrtAccount[] = [
    { id: "ac_1", name: "FTMO 100K Phase 1", brand: ftmo, type: "prop_challenge", size: 100_000, phase: "phase_1", status: "passed", openedAt: day(72) },
    { id: "ac_2", name: "FTMO 100K Funded", brand: ftmo, type: "prop_funded", size: 100_000, phase: "funded", status: "funded", openedAt: day(40) },
    { id: "ac_3", name: "IC Markets Live", brand: ic, type: "broker_live", status: "active", openedAt: day(180) },
    { id: "ac_4", name: "Bybit Spot", brand: bybit, type: "exchange", status: "active", openedAt: day(220) },
  ];

  const tx = (over: Partial<TrtTransaction>): TrtTransaction => ({
    id: `tx_${Math.random().toString(36).slice(2, 9)}`,
    date: day(0),
    direction: "expense",
    category: "challenge_fee",
    brand: ftmo,
    amount: 0,
    currency: "USD",
    status: "confirmed",
    createdAt: day(0),
    ...over,
  });

  const transactions: TrtTransaction[] = [
    tx({ date: day(72), direction: "expense", category: "challenge_fee", brand: ftmo, accountId: "ac_1", amount: 540, notes: "FTMO 100K challenge" }),
    tx({ date: day(40), direction: "income", category: "payout", brand: ftmo, accountId: "ac_2", amount: 3200, notes: "First profit split" }),
    tx({ date: day(12), direction: "income", category: "payout", brand: ftmo, accountId: "ac_2", amount: 4200, notes: "Second payout" }),
    tx({ date: day(60), direction: "expense", category: "platform_subscription", brand: tv, amount: 60, notes: "TradingView Pro+ monthly" }),
    tx({ date: day(30), direction: "expense", category: "platform_subscription", brand: tv, amount: 60 }),
    tx({ date: day(2), direction: "expense", category: "platform_subscription", brand: tv, amount: 60 }),
    tx({ date: day(180), direction: "expense", category: "broker_deposit", brand: ic, accountId: "ac_3", amount: 5000, notes: "Initial funding" }),
    tx({ date: day(20), direction: "income", category: "rebate", brand: ic, accountId: "ac_3", amount: 312, notes: "Monthly rebate" }),
    tx({ date: day(50), direction: "income", category: "rebate", brand: ic, accountId: "ac_3", amount: 268 }),
    tx({ date: day(80), direction: "income", category: "rebate", brand: ic, accountId: "ac_3", amount: 244 }),
    tx({ date: day(220), direction: "expense", category: "broker_deposit", brand: bybit, accountId: "ac_4", amount: 1200 }),
    tx({ date: day(15), direction: "income", category: "rebate", brand: bybit, accountId: "ac_4", amount: 96 }),
    tx({ date: day(120), direction: "expense", category: "education", brand: { id: "custom:ict", name: "ICT Mentorship", custom: true }, amount: 800, notes: "Mentorship program" }),
    tx({ date: day(95), direction: "expense", category: "challenge_fee", brand: { id: "b_05", name: "E8 Markets", category: "Prop Firm" }, amount: 320, status: "confirmed", notes: "Failed challenge" }),
    tx({ date: day(55), direction: "expense", category: "reset_fee", brand: { id: "b_05", name: "E8 Markets", category: "Prop Firm" }, amount: 95 }),
  ];

  const payouts: TrtPayout[] = [
    { id: "p_1", txId: transactions[1]!.id, method: "USDT TRC20" },
    { id: "p_2", txId: transactions[2]!.id, method: "Bank wire" },
  ];

  return { baseCurrency: "USD", transactions, accounts, payouts };
}

let state: TrtState = load();

function load(): TrtState {
  if (typeof window === "undefined") return seed();
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return seed();
    return JSON.parse(raw) as TrtState;
  } catch {
    return seed();
  }
}

function persist() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

const subs = new Set<() => void>();
function emit() { subs.forEach((fn) => fn()); }
function subscribe(fn: () => void) { subs.add(fn); return () => { subs.delete(fn); }; }

// ---------- Public API ----------

export function getTrt(): TrtState { return state; }

export function useTrt(): TrtState {
  return useSyncExternalStore(subscribe, () => state, () => state);
}

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

export function listBrands(): TrtBrand[] {
  return adminBrands.map((b) => ({ id: b.id, name: b.name, category: b.category }));
}

export function makeCustomBrand(name: string): TrtBrand {
  const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  return { id: `custom:${slug || uid("c")}`, name: name.trim(), custom: true };
}

export function addTransaction(input: Omit<TrtTransaction, "id" | "createdAt">) {
  const t: TrtTransaction = { ...input, id: uid("tx"), createdAt: new Date().toISOString() };
  state = { ...state, transactions: [t, ...state.transactions] };
  // If it's a payout, also add a TrtPayout entry
  if (t.direction === "income" && t.category === "payout") {
    state = { ...state, payouts: [{ id: uid("p"), txId: t.id }, ...state.payouts] };
  }
  persist(); emit();
  return t;
}

export function updateTransaction(id: string, patch: Partial<TrtTransaction>) {
  state = {
    ...state,
    transactions: state.transactions.map((t) => (t.id === id ? { ...t, ...patch } : t)),
  };
  persist(); emit();
}

export function removeTransaction(id: string) {
  state = {
    ...state,
    transactions: state.transactions.filter((t) => t.id !== id),
    payouts: state.payouts.filter((p) => p.txId !== id),
  };
  persist(); emit();
}

export function addAccount(input: Omit<TrtAccount, "id">) {
  const a: TrtAccount = { ...input, id: uid("ac") };
  state = { ...state, accounts: [a, ...state.accounts] };
  persist(); emit();
  return a;
}

export function updateAccount(id: string, patch: Partial<TrtAccount>) {
  state = {
    ...state,
    accounts: state.accounts.map((a) => (a.id === id ? { ...a, ...patch } : a)),
  };
  persist(); emit();
}

export function removeAccount(id: string) {
  state = {
    ...state,
    accounts: state.accounts.filter((a) => a.id !== id),
    transactions: state.transactions.map((t) =>
      t.accountId === id ? { ...t, accountId: undefined } : t,
    ),
  };
  persist(); emit();
}

export function setBaseCurrency(c: string) {
  state = { ...state, baseCurrency: c };
  persist(); emit();
}

// ---------- Aggregations ----------

export type Period = "7d" | "30d" | "90d" | "ytd" | "all";

export function withinPeriod(iso: string, period: Period): boolean {
  if (period === "all") return true;
  const t = new Date(iso).getTime();
  const now = Date.now();
  if (period === "ytd") return new Date(iso).getFullYear() === new Date().getFullYear();
  const days = period === "7d" ? 7 : period === "30d" ? 30 : 90;
  return now - t <= days * 86_400_000;
}

export type TrtSummary = {
  income: number;
  expense: number;
  net: number;
  roiPct: number | null; // null when expense=0
  costRecoveryPct: number; // capped 0..100+
  txCount: number;
};

export function summarize(state: TrtState, period: Period = "all"): TrtSummary {
  let income = 0, expense = 0, count = 0;
  for (const t of state.transactions) {
    if (t.status === "cancelled") continue;
    if (!withinPeriod(t.date, period)) continue;
    count++;
    if (t.direction === "income") income += t.amount;
    else expense += t.amount;
  }
  const net = income - expense;
  const roiPct = expense === 0 ? null : (net / expense) * 100;
  const costRecoveryPct = expense === 0 ? 0 : Math.min(100, (income / expense) * 100);
  return { income, expense, net, roiPct, costRecoveryPct, txCount: count };
}

export function timelineByMonth(state: TrtState, months = 6) {
  const now = new Date();
  const buckets: { key: string; label: string; income: number; expense: number; net: number }[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    const label = d.toLocaleString(undefined, { month: "short" });
    buckets.push({ key, label, income: 0, expense: 0, net: 0 });
  }
  for (const t of state.transactions) {
    if (t.status === "cancelled") continue;
    const d = new Date(t.date);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    const b = buckets.find((x) => x.key === key);
    if (!b) continue;
    if (t.direction === "income") b.income += t.amount;
    else b.expense += t.amount;
  }
  for (const b of buckets) b.net = b.income - b.expense;
  return buckets;
}

export function breakdownByBrand(state: TrtState, period: Period = "all") {
  const map = new Map<string, { brand: TrtBrand; income: number; expense: number }>();
  for (const t of state.transactions) {
    if (t.status === "cancelled") continue;
    if (!withinPeriod(t.date, period)) continue;
    const cur = map.get(t.brand.id) ?? { brand: t.brand, income: 0, expense: 0 };
    if (t.direction === "income") cur.income += t.amount;
    else cur.expense += t.amount;
    map.set(t.brand.id, cur);
  }
  return Array.from(map.values()).sort(
    (a, b) => b.income + b.expense - (a.income + a.expense),
  );
}

export function breakdownByCategory(state: TrtState, period: Period = "all") {
  const map = new Map<TrtCategory, { category: TrtCategory; income: number; expense: number }>();
  for (const t of state.transactions) {
    if (t.status === "cancelled") continue;
    if (!withinPeriod(t.date, period)) continue;
    const cur = map.get(t.category) ?? { category: t.category, income: 0, expense: 0 };
    if (t.direction === "income") cur.income += t.amount;
    else cur.expense += t.amount;
    map.set(t.category, cur);
  }
  return Array.from(map.values());
}

// ---------- Insight engine ----------

export type TrtInsight = {
  id: string;
  tone: "positive" | "watch" | "leak";
  title: string;
  body: string;
  metric?: string;
};

export function generateInsights(state: TrtState): TrtInsight[] {
  const out: TrtInsight[] = [];
  const all = summarize(state, "all");
  const last30 = summarize(state, "30d");
  const byBrand = breakdownByBrand(state, "all");

  // Best ROI brand (income > expense)
  const ranked = byBrand
    .filter((b) => b.expense > 0 && b.income > 0)
    .map((b) => ({ ...b, roi: ((b.income - b.expense) / b.expense) * 100 }))
    .sort((a, b) => b.roi - a.roi);
  if (ranked[0]) {
    out.push({
      id: "best-roi",
      tone: "positive",
      title: `${ranked[0].brand.name} is your best ROI brand`,
      body: `You've netted ${money(ranked[0].income - ranked[0].expense)} on ${money(ranked[0].expense)} spend.`,
      metric: `${ranked[0].roi.toFixed(0)}% ROI`,
    });
  }

  // Most expensive category (no income)
  const cats = breakdownByCategory(state, "all")
    .map((c) => ({ ...c, net: c.income - c.expense }))
    .sort((a, b) => a.net - b.net);
  const worstCat = cats.find((c) => c.expense > 0 && c.income === 0);
  if (worstCat) {
    out.push({
      id: "worst-cat",
      tone: "leak",
      title: `${labelCategory(worstCat.category)} is leaking money`,
      body: `You spent ${money(worstCat.expense)} with no income generated yet from this category.`,
      metric: money(worstCat.expense),
    });
  }

  // Failed prop cost burden
  const failed = state.transactions
    .filter((t) => t.status !== "cancelled" && (t.category === "challenge_fee" || t.category === "reset_fee"))
    .reduce((s, t) => s + (t.direction === "expense" ? t.amount : 0), 0);
  if (failed > 200) {
    out.push({
      id: "failed-prop",
      tone: "watch",
      title: "Prop firm fees are stacking up",
      body: `You've spent ${money(failed)} on challenge & reset fees. Compare cheaper-fee firms before the next attempt.`,
      metric: money(failed),
    });
  }

  // Rebate offset
  const rebates = state.transactions
    .filter((t) => t.category === "rebate" && t.status !== "cancelled")
    .reduce((s, t) => s + t.amount, 0);
  if (rebates > 0 && all.expense > 0) {
    const offsetPct = Math.min(100, (rebates / all.expense) * 100);
    out.push({
      id: "rebate-offset",
      tone: "positive",
      title: "Rebates are offsetting your costs",
      body: `Rebate income covers ${offsetPct.toFixed(0)}% of your total trading spend.`,
      metric: money(rebates),
    });
  }

  // Recent trend
  if (last30.expense > 0) {
    const share = (last30.expense / Math.max(1, all.expense)) * 100;
    if (share > 40) {
      out.push({
        id: "recent-spike",
        tone: "watch",
        title: "Spending picked up this month",
        body: `${share.toFixed(0)}% of your lifetime spend happened in the last 30 days.`,
        metric: money(last30.expense),
      });
    }
  }

  return out.slice(0, 5);
}

// ---------- Helpers ----------

export function money(n: number, currency = "USD") {
  const sign = n < 0 ? "-" : "";
  return `${sign}${currency === "USD" ? "$" : ""}${Math.abs(n).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

export function labelCategory(c: TrtCategory): string {
  const map: Record<TrtCategory, string> = {
    challenge_fee: "Challenge fees",
    reset_fee: "Resets",
    platform_subscription: "Platform subs",
    tool_subscription: "Tool subs",
    education: "Education",
    broker_deposit: "Broker deposits",
    data_feed: "Data feeds",
    vps: "VPS",
    other_expense: "Other expense",
    payout: "Payouts",
    rebate: "Rebates",
    broker_withdrawal: "Broker withdrawals",
    affiliate: "Affiliate income",
    scholarship: "Scholarship",
    other_income: "Other income",
  };
  return map[c];
}

export function labelAccountType(t: TrtAccountType): string {
  const map: Record<TrtAccountType, string> = {
    prop_challenge: "Prop · Challenge",
    prop_funded: "Prop · Funded",
    broker_live: "Broker · Live",
    broker_demo: "Broker · Demo",
    exchange: "Exchange",
    tool_subscription: "Tool subscription",
  };
  return map[t];
}

export function labelStatus(s: TrtAccountStatus): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export const EXPENSE_CATEGORIES: TrtCategory[] = [
  "challenge_fee", "reset_fee", "platform_subscription", "tool_subscription",
  "education", "broker_deposit", "data_feed", "vps", "other_expense",
];

export const INCOME_CATEGORIES: TrtCategory[] = [
  "payout", "rebate", "broker_withdrawal", "affiliate", "scholarship", "other_income",
];

// Quick templates for the universal add flow
export type TrtTemplate = {
  id: string;
  label: string;
  direction: TrtDirection;
  category: TrtCategory;
};

export const QUICK_TEMPLATES: TrtTemplate[] = [
  { id: "tpl_chal", label: "Challenge fee", direction: "expense", category: "challenge_fee" },
  { id: "tpl_pay", label: "Payout received", direction: "income", category: "payout" },
  { id: "tpl_dep", label: "Broker deposit", direction: "expense", category: "broker_deposit" },
  { id: "tpl_with", label: "Broker withdrawal", direction: "income", category: "broker_withdrawal" },
  { id: "tpl_sub", label: "Tool subscription", direction: "expense", category: "tool_subscription" },
  { id: "tpl_ment", label: "Mentorship", direction: "expense", category: "education" },
  { id: "tpl_reb", label: "Rebate income", direction: "income", category: "rebate" },
];
