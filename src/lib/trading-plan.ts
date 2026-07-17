// Trading Plan + Journal store — Plan → Trade → Review → Improve loop.
// Persists to localStorage; framework-agnostic, with a tiny pub/sub for React.

export type TradingStyle = "scalping" | "intraday" | "swing" | "position";
export type MarketType = "forex" | "crypto" | "futures" | "stocks" | "indices" | "commodities";
export type Session = "asia" | "london" | "ny" | "sydney";
export type Experience = "beginner" | "intermediate" | "advanced" | "pro";
export type TradeOutcome = "profit" | "loss" | "breakeven" | "pending";
export type TradeResultSource =
  | "manual"
  | "csv_import"
  | "broker_import"
  | "exchange_import"
  | "calculated"
  | "legacy_unverified";

export type TraderProfile = {
  style: TradingStyle;
  markets: MarketType[];
  experience: Experience;
  sessions: Session[];
  riskTolerance: "low" | "medium" | "high";
};

export type Strategy = {
  id: string;
  name: string;
  description: string;
  entryModel: string;
  confirmation: string;
  invalidation: string;
  targetLogic: string;
  riskPerTrade: number; // %
  minRR: number;
};

export type TradingRules = {
  maxTradesPerDay: number;
  maxDailyLossPct: number;
  maxRiskPerTradePct: number;
  allowedSessions: Session[];
  noTradeConditions: string[]; // free-text tags: "high-impact news", "tilt", etc
};

export type PsychologyRules = {
  stopAfterLosses: number;
  emotionalTriggers: string[];
  behaviorRestrictions: string[];
};

export type ChecklistItem = { id: string; label: string; required: boolean };

export type TradingPlan = {
  profile: TraderProfile | null;
  strategies: Strategy[];
  rules: TradingRules;
  psychology: PsychologyRules;
  checklist: ChecklistItem[];
  premium: boolean;
  updatedAt: string;
};

export type Emotion = "calm" | "confident" | "fomo" | "fearful" | "angry" | "tilt" | "neutral";

export type Trade = {
  id: string;
  backendId?: string | number;
  createdAt: string;
  asset: string;
  market: MarketType;
  direction: "long" | "short";
  entry: number;
  exit: number;
  lot: number;
  riskPct: number;
  stop: number;
  target: number;
  session: Session;
  venue?: string;
  instrumentId?: string;
  instrumentDisplayName?: string;
  instrumentSource?: string;
  contract?: string;
  instrumentMode?: string;
  leverage?: number;
  commission?: number;
  fees?: number;
  // strategy & context
  strategyId: string | null;
  setupType?: string;
  htfBias?: string;
  narrative?: string;
  entryReason?: string;
  confirmation?: string;
  // execution & psychology
  emotionBefore?: Emotion;
  emotionAfter?: Emotion;
  confidence?: number; // 1-10
  mistakes?: string[];
  ruleFollowed?: boolean;
  checklistChecked?: string[]; // ids
  // results
  pnl: number;
  outcome?: TradeOutcome;
  grossPnl?: number | null;
  netPnl?: number | null;
  pnlCurrency?: string;
  resultSource?: TradeResultSource;
  resultNotes?: string;
  rr: number;
  pips?: number;
  points?: number;
  percentageGain?: number;
  rMultiple?: number;
  rewardRatio?: number;
  winLossStatus?: "win" | "loss" | "breakeven";
  quality?: "A" | "B" | "C";
  satisfaction?: number; // 1-5
  // media
  beforeImg?: string;
  afterImg?: string;
  // computed
  adherence: number; // 0-100
  violations: string[];
};

const PLAN_KEY = "rb_trading_plan";
const TRADES_KEY = "rb_journal_trades";

const defaultPlan: TradingPlan = {
  profile: null,
  strategies: [],
  rules: {
    maxTradesPerDay: 5,
    maxDailyLossPct: 3,
    maxRiskPerTradePct: 1,
    allowedSessions: ["london", "ny"],
    noTradeConditions: ["High-impact news", "Tilt / emotional"],
  },
  psychology: {
    stopAfterLosses: 2,
    emotionalTriggers: ["Revenge trading", "FOMO"],
    behaviorRestrictions: ["No trading after 2 losses", "No trading outside plan sessions"],
  },
  checklist: [
    { id: "trend", label: "Trend confirmed on HTF", required: true },
    { id: "structure", label: "Structure valid (BoS / liquidity)", required: true },
    { id: "entry", label: "Entry model present", required: true },
    { id: "risk", label: "Risk defined (SL placed)", required: true },
    { id: "rr", label: "RR ≥ plan minimum", required: true },
  ],
  premium: false,
  updatedAt: new Date().toISOString(),
};

type Listener = () => void;
const listeners = new Set<Listener>();
function emit() { listeners.forEach((l) => l()); }
export function subscribe(fn: Listener) { listeners.add(fn); return () => listeners.delete(fn); }

function safeGet<T>(key: string, fallback: T): T {
  try {
    if (typeof window === "undefined") return fallback;
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch { return fallback; }
}
function safeSet(key: string, val: unknown) {
  try { if (typeof window !== "undefined") localStorage.setItem(key, JSON.stringify(val)); } catch {}
}

let backendPlanSyncTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleBackendPlanSync(plan: TradingPlan) {
  if (typeof window === "undefined") return;
  if (backendPlanSyncTimer) clearTimeout(backendPlanSyncTimer);
  backendPlanSyncTimer = setTimeout(() => {
    import("@/lib/financial-intelligence-api")
      .then(({ syncTradingPlanToBackend }) => syncTradingPlanToBackend(plan))
      .catch(() => {
        // Local plan remains the instant fallback; backend sync is best-effort.
      });
  }, 900);
}

function normalizePlan(value: Partial<TradingPlan> | null | undefined): TradingPlan {
  const next = value ?? {};
  return {
    ...defaultPlan,
    ...next,
    profile: next.profile ?? defaultPlan.profile,
    strategies: Array.isArray(next.strategies) ? next.strategies : defaultPlan.strategies,
    rules: {
      ...defaultPlan.rules,
      ...(next.rules ?? {}),
      allowedSessions: Array.isArray(next.rules?.allowedSessions)
        ? next.rules.allowedSessions
        : defaultPlan.rules.allowedSessions,
      noTradeConditions: Array.isArray(next.rules?.noTradeConditions)
        ? next.rules.noTradeConditions
        : defaultPlan.rules.noTradeConditions,
    },
    psychology: {
      ...defaultPlan.psychology,
      ...(next.psychology ?? {}),
      emotionalTriggers: Array.isArray(next.psychology?.emotionalTriggers)
        ? next.psychology.emotionalTriggers
        : defaultPlan.psychology.emotionalTriggers,
      behaviorRestrictions: Array.isArray(next.psychology?.behaviorRestrictions)
        ? next.psychology.behaviorRestrictions
        : defaultPlan.psychology.behaviorRestrictions,
    },
    checklist: Array.isArray(next.checklist) ? next.checklist : defaultPlan.checklist,
    premium: Boolean(next.premium ?? defaultPlan.premium),
    updatedAt: next.updatedAt || defaultPlan.updatedAt,
  };
}

function readPlanState(): TradingPlan {
  return normalizePlan(safeGet<TradingPlan>(PLAN_KEY, defaultPlan));
}

function readTradesState(): Trade[] {
  return safeGet<Trade[]>(TRADES_KEY, []);
}

let planState: TradingPlan = readPlanState();
let tradesState: Trade[] = readTradesState();

export function getPlan(): TradingPlan {
  return planState;
}
export function savePlan(plan: TradingPlan) {
  const next = { ...plan, updatedAt: new Date().toISOString() };
  planState = next;
  safeSet(PLAN_KEY, next);
  scheduleBackendPlanSync(next);
  emit();
}
export function updatePlan(patch: Partial<TradingPlan>) {
  savePlan({ ...getPlan(), ...patch });
}

let backendPlanHydrationStarted = false;

export async function hydrateTradingPlanFromBackend(force = false) {
  if (typeof window === "undefined") return planState;
  if (backendPlanHydrationStarted && !force) return planState;
  backendPlanHydrationStarted = true;

  try {
    const { fetchTradingPlanFromBackend } = await import("@/lib/financial-intelligence-api");
    const fetchedPlan = await fetchTradingPlanFromBackend();
    if (!fetchedPlan) return planState;
    const remotePlan = normalizePlan(fetchedPlan);

    const localUpdatedAt = +new Date(planState.updatedAt || 0);
    const remoteUpdatedAt = +new Date(remotePlan.updatedAt || 0);
    const localLooksEmpty =
      planState.strategies.length === 0 &&
      !planState.profile &&
      +new Date(planState.updatedAt || 0) === +new Date(defaultPlan.updatedAt || 0);

    if (localLooksEmpty || remoteUpdatedAt >= localUpdatedAt) {
      planState = remotePlan;
      safeSet(PLAN_KEY, planState);
      emit();
    } else if (localUpdatedAt > remoteUpdatedAt) {
      scheduleBackendPlanSync(planState);
    }
  } catch {
    // Local plan remains available when backend hydration is unavailable.
  }

  return planState;
}

export function getTrades(): Trade[] {
  return tradesState;
}
export function addTrade(t: Trade) {
  const list = [t, ...tradesState];
  tradesState = list;
  safeSet(TRADES_KEY, list);
  emit();
}
export function mergeBackendTrades(records: Array<Record<string, any>>) {
  if (!Array.isArray(records)) return;
  if (records.length === 0) {
    const localOnly = tradesState.filter((trade) => !trade.backendId);
    if (localOnly.length !== tradesState.length) {
      tradesState = localOnly;
      safeSet(TRADES_KEY, tradesState);
      emit();
    }
    return;
  }
  const mapped = records.map(mapBackendTrade).filter(Boolean) as Trade[];
  if (mapped.length === 0) return;
  const byId = new Map<string, Trade>();
  for (const trade of mapped) byId.set(trade.id, trade);
  for (const trade of tradesState) {
    if (!trade.backendId && !byId.has(trade.id)) byId.set(trade.id, trade);
  }
  tradesState = [...byId.values()].sort(
    (a, b) => +new Date(b.createdAt) - +new Date(a.createdAt),
  );
  safeSet(TRADES_KEY, tradesState);
  emit();
}
export function deleteTrade(id: string) {
  tradesState = tradesState.filter((t) => t.id !== id);
  safeSet(TRADES_KEY, tradesState);
  emit();
}

function asNumber(value: unknown, fallback = 0) {
  const next = Number(value ?? fallback);
  return Number.isFinite(next) ? next : fallback;
}

function asMarket(value: unknown): MarketType {
  const raw = String(value || "forex").toLowerCase();
  if (["forex", "crypto", "futures", "stocks", "indices", "commodities"].includes(raw)) {
    return raw as MarketType;
  }
  return "forex";
}

function asSession(value: unknown): Session {
  const raw = String(value || "london").toLowerCase();
  if (["asia", "london", "ny", "sydney"].includes(raw)) return raw as Session;
  return "london";
}

function asOutcome(value: unknown): TradeOutcome {
  const raw = String(value || "pending").toLowerCase();
  if (raw === "profit" || raw === "loss" || raw === "breakeven" || raw === "pending") return raw;
  if (raw === "win") return "profit";
  return "pending";
}

function asResultSource(value: unknown): TradeResultSource {
  const raw = String(value || "manual").toLowerCase();
  if (
    raw === "manual" ||
    raw === "csv_import" ||
    raw === "broker_import" ||
    raw === "exchange_import" ||
    raw === "calculated" ||
    raw === "legacy_unverified"
  ) {
    return raw;
  }
  return "manual";
}

function mapBackendTrade(record: Record<string, any>): Trade | null {
  const raw = (record.raw && typeof record.raw === "object" ? record.raw : {}) as Partial<Trade>;
  const createdAt = String(record.tradedAt || record.createdAt || raw.createdAt || new Date().toISOString());
  const id = String(raw.id || `backend:${record.id}`);
  const entry = asNumber(record.entryPrice ?? raw.entry);
  const exit = asNumber(record.exitPrice ?? raw.exit);
  const stop = asNumber(record.stopLoss ?? raw.stop);
  const target = asNumber(record.takeProfit ?? raw.target);
  const lot = asNumber(record.positionSize ?? raw.lot, 1);
  const outcome = asOutcome(record.outcome ?? raw.outcome);
  const netPnl = record.netPnl === null || record.netPnl === undefined ? raw.netPnl ?? null : asNumber(record.netPnl);
  const grossPnl = record.grossPnl === null || record.grossPnl === undefined ? raw.grossPnl ?? null : asNumber(record.grossPnl);
  return {
    ...raw,
    id,
    backendId: record.id,
    createdAt,
    asset: String(record.asset || raw.asset || "Unknown"),
    market: asMarket(record.market ?? raw.market),
    direction: String(record.direction || raw.direction || "long").toLowerCase() === "short" ? "short" : "long",
    entry,
    exit,
    lot,
    riskPct: asNumber(raw.riskPct),
    stop,
    target,
    session: asSession(record.session ?? raw.session),
    instrumentId: String(record.instrumentId || raw.instrumentId || "") || undefined,
    instrumentDisplayName: String(record.instrumentDisplayName || raw.instrumentDisplayName || "") || undefined,
    instrumentSource: String(record.instrumentSource || raw.instrumentSource || "") || undefined,
    strategyId: String(record.strategy || raw.strategyId || "") || null,
    narrative: String(record.notes || raw.narrative || "") || undefined,
    pnl: asNumber(record.pnl ?? raw.pnl),
    outcome,
    grossPnl,
    netPnl,
    fees: asNumber(record.fees ?? raw.fees),
    pnlCurrency: String(record.pnlCurrency || raw.pnlCurrency || "USD"),
    resultSource: asResultSource(record.resultSource ?? raw.resultSource),
    resultNotes: String(record.resultNotes || raw.resultNotes || "") || undefined,
    rr: asNumber(record.rMultiple ?? raw.rr ?? raw.rMultiple),
    rMultiple: asNumber(record.rMultiple ?? raw.rMultiple ?? raw.rr),
    percentageGain: asNumber(record.percentageGain ?? raw.percentageGain),
    beforeImg: String((record.screenshots as any)?.before || raw.beforeImg || "") || undefined,
    afterImg: String((record.screenshots as any)?.after || raw.afterImg || "") || undefined,
    adherence: asNumber(raw.adherence),
    violations: Array.isArray(raw.violations) ? raw.violations : [],
  };
}

// --- helpers ---

export function detectSession(d = new Date()): Session {
  const h = d.getUTCHours();
  if (h >= 0 && h < 7) return "asia";
  if (h >= 7 && h < 12) return "london";
  if (h >= 12 && h < 21) return "ny";
  return "sydney";
}

export function calcRR(entry: number, stop: number, target: number, direction: "long" | "short") {
  const risk = direction === "long" ? entry - stop : stop - entry;
  const reward = direction === "long" ? target - entry : entry - target;
  if (risk <= 0) return 0;
  return Math.max(0, reward / risk);
}

export function calcPnL(_entry: number, _exit: number, _lot: number, _direction: "long" | "short") {
  return 0;
}

export type TradeCalculationInput = {
  market: MarketType;
  asset?: string;
  direction: "long" | "short";
  entry: number;
  exit: number;
  stop?: number;
  target?: number;
  lot: number;
  commission?: number;
  fees?: number;
};

export type TradeCalculationResult = {
  pnl: number;
  pips: number;
  points: number;
  percentageGain: number;
  rMultiple: number;
  rewardRatio: number;
  riskAmount: number;
  winLossStatus: "win" | "loss" | "breakeven";
};

export type TradeAnalyticsSummary = {
  totalTrades: number;
  netPnl: number;
  winRate: number;
  averageR: number;
  profitFactor: number;
  adherence: number;
  violations: number;
  wins: number;
  losses: number;
};

function forexPipSize(asset = "") {
  const normalized = asset.toUpperCase();
  if (normalized.includes("JPY")) return 0.01;
  if (normalized.includes("XAU") || normalized.includes("XAG")) return 0.1;
  return 0.0001;
}

function contractMultiplier(market: MarketType, asset = "") {
  const normalized = asset.toUpperCase();
  if (market === "forex") {
    if (normalized.includes("XAU") || normalized.includes("XAG")) return 100;
    return 100_000;
  }
  if (market === "indices" || market === "futures") return 1;
  if (market === "commodities") return normalized.includes("XAU") ? 100 : 1;
  return 1;
}

export function calculateTradeMetrics(input: TradeCalculationInput): TradeCalculationResult {
  const entry = Number(input.entry) || 0;
  const exit = Number(input.exit) || 0;
  const stop = Number(input.stop) || 0;
  const target = Number(input.target) || 0;
  const lot = Number(input.lot) || 0;
  const signedMove = input.direction === "long" ? exit - entry : entry - exit;
  const rawPoints = signedMove;
  const multiplier = contractMultiplier(input.market, input.asset);
  const pips = input.market === "forex" ? rawPoints / forexPipSize(input.asset) : 0;
  const points = input.market === "forex" ? 0 : rawPoints;
  const percentageGain = entry > 0 ? (signedMove / entry) * 100 : 0;

  const riskDistance = stop > 0
    ? input.direction === "long" ? entry - stop : stop - entry
    : 0;
  const rewardDistance = target > 0
    ? input.direction === "long" ? target - entry : entry - target
    : 0;
  const riskAmount = Math.max(0, riskDistance * lot * multiplier);
  const rewardRatio = riskDistance > 0 ? Math.max(0, rewardDistance / riskDistance) : 0;
  const rMultiple = riskDistance > 0 ? signedMove / riskDistance : 0;
  const winLossStatus = Math.abs(signedMove) < 0.000001 ? "breakeven" : signedMove > 0 ? "win" : "loss";

  return {
    // Launch-safe: monetary P&L is manually entered by the trader.
    // Price fields only describe the trade until a contract-spec engine exists.
    pnl: 0,
    pips: roundMetric(pips),
    points: roundMetric(points),
    percentageGain: roundMetric(percentageGain),
    rMultiple: roundMetric(rMultiple),
    rewardRatio: roundMetric(rewardRatio),
    riskAmount: roundMetric(riskAmount),
    winLossStatus,
  };
}

export function calculateManualTradeResult(
  outcome: TradeOutcome = "pending",
  absoluteAmount: number | null | undefined,
  fees: number | null | undefined,
) {
  const safeFees = Math.max(0, roundMetric(Number(fees) || 0));
  const amount = Math.max(0, roundMetric(Number(absoluteAmount) || 0));
  if (outcome === "pending") {
    return { grossPnl: null, netPnl: null, pnl: 0, winLossStatus: "breakeven" as const };
  }
  if (outcome === "breakeven") {
    const netPnl = roundMetric(0 - safeFees);
    return { grossPnl: 0, netPnl, pnl: netPnl, winLossStatus: "breakeven" as const };
  }
  const grossPnl = outcome === "profit" ? amount : -amount;
  const netPnl = roundMetric(grossPnl - safeFees);
  return {
    grossPnl,
    netPnl,
    pnl: netPnl,
    winLossStatus: outcome === "profit" ? "win" as const : "loss" as const,
  };
}

export function resolveTradeNetPnl(trade: Trade): number | null {
  if (trade.outcome === "pending") return null;
  if (trade.netPnl !== undefined && trade.netPnl !== null && Number.isFinite(Number(trade.netPnl))) {
    return Number(trade.netPnl);
  }
  if (trade.resultSource && trade.resultSource !== "legacy_unverified" && Number.isFinite(Number(trade.pnl))) {
    return Number(trade.pnl);
  }
  return null;
}

export function resolveTradeOutcome(trade: Trade): TradeOutcome {
  if (trade.outcome) return trade.outcome;
  const pnl = resolveTradeNetPnl(trade);
  if (pnl == null) return "pending";
  if (pnl > 0) return "profit";
  if (pnl < 0) return "loss";
  return "breakeven";
}

export function formatTradePnl(trade: Trade) {
  const value = resolveTradeNetPnl(trade);
  const currency = trade.pnlCurrency || "USD";
  if (value == null) return "Result Pending";
  const sign = value > 0 ? "+" : value < 0 ? "-" : "";
  return `${sign}${currency} ${Math.abs(value).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

export function summarizeTrades(trades: Trade[]): TradeAnalyticsSummary {
  const totalTrades = trades.length;
  const completed = trades
    .map((trade) => ({ trade, pnl: resolveTradeNetPnl(trade), outcome: resolveTradeOutcome(trade) }))
    .filter((row) => row.pnl !== null);
  const completedTrades = completed.length;
  const wins = completed.filter((row) => row.outcome === "profit" || Number(row.pnl) > 0).length;
  const losses = completed.filter((row) => row.outcome === "loss" || Number(row.pnl) < 0).length;
  const netPnl = roundMetric(completed.reduce((sum, row) => sum + Number(row.pnl || 0), 0));
  const grossProfit = completed.reduce((sum, row) => sum + Math.max(0, Number(row.pnl || 0)), 0);
  const grossLoss = Math.abs(completed.reduce((sum, row) => sum + Math.min(0, Number(row.pnl || 0)), 0));
  const averageR = totalTrades
    ? roundMetric(trades.reduce((sum, trade) => sum + Number((trade.rMultiple ?? trade.rr) || 0), 0) / totalTrades)
    : 0;
  const adherence = totalTrades
    ? Math.round(trades.reduce((sum, trade) => sum + Number(trade.adherence || 0), 0) / totalTrades)
    : 0;

  return {
    totalTrades,
    netPnl,
    winRate: completedTrades ? Math.round((wins / completedTrades) * 100) : 0,
    averageR,
    profitFactor: grossLoss > 0 ? roundMetric(grossProfit / grossLoss) : grossProfit > 0 ? roundMetric(grossProfit) : 0,
    adherence,
    violations: trades.reduce((sum, trade) => sum + (trade.violations?.length ?? 0), 0),
    wins,
    losses,
  };
}

function roundMetric(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.round(value * 100) / 100;
}

export type AdherenceResult = { score: number; violations: string[] };

export function computeAdherence(t: Partial<Trade>, plan = getPlan()): AdherenceResult {
  const violations: string[] = [];
  let total = 0;
  let passed = 0;

  // session
  total++;
  if (t.session && plan.rules.allowedSessions.includes(t.session)) passed++;
  else if (t.session) violations.push(`Entered outside allowed session (${t.session})`);

  // risk
  total++;
  if ((t.riskPct ?? 0) <= plan.rules.maxRiskPerTradePct) passed++;
  else violations.push(`Risk ${t.riskPct}% exceeds plan max ${plan.rules.maxRiskPerTradePct}%`);

  // strategy + RR
  const strat = plan.strategies.find((s) => s.id === t.strategyId);
  total++;
  if (strat) passed++;
  else violations.push("No strategy selected from plan");

  total++;
  const minRR = strat?.minRR ?? 1.5;
  if ((t.rr ?? 0) >= minRR) passed++;
  else violations.push(`RR ${(t.rr ?? 0).toFixed(2)} below minimum ${minRR}`);

  // checklist
  const required = plan.checklist.filter((c) => c.required);
  const checked = new Set(t.checklistChecked ?? []);
  required.forEach((c) => {
    total++;
    if (checked.has(c.id)) passed++;
    else violations.push(`Checklist missed: ${c.label}`);
  });

  // rule followed self-report
  if (t.ruleFollowed === false) violations.push("User flagged: rule broken");

  const score = total === 0 ? 0 : Math.round((passed / total) * 100);
  return { score, violations };
}

export function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

// React hook
import { useEffect, useSyncExternalStore } from "react";
export function useTradingPlan() {
  useEffect(() => {
    void hydrateTradingPlanFromBackend();
  }, []);

  return useSyncExternalStore(
    (cb) => subscribe(cb),
    () => getPlan(),
    () => defaultPlan,
  );
}
export function useTrades() {
  return useSyncExternalStore(
    (cb) => subscribe(cb),
    () => getTrades(),
    () => [] as Trade[],
  );
}
