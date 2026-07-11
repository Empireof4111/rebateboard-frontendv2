// Trading Plan + Journal store — Plan → Trade → Review → Improve loop.
// Persists to localStorage; framework-agnostic, with a tiny pub/sub for React.

export type TradingStyle = "scalping" | "intraday" | "swing" | "position";
export type MarketType = "forex" | "crypto" | "futures" | "stocks" | "indices" | "commodities";
export type Session = "asia" | "london" | "ny" | "sydney";
export type Experience = "beginner" | "intermediate" | "advanced" | "pro";

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
  rr: number;
  pips?: number;
  points?: number;
  percentageGain?: number;
  rMultiple?: number;
  rewardRatio?: number;
  winLossStatus?: "win" | "loss" | "breakeven";
  quality?: "A" | "B" | "C";
  satisfaction?: number; // 1-5
  // media (premium)
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

function readPlanState(): TradingPlan {
  return safeGet<TradingPlan>(PLAN_KEY, defaultPlan);
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
  emit();
}
export function updatePlan(patch: Partial<TradingPlan>) {
  savePlan({ ...getPlan(), ...patch });
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
export function deleteTrade(id: string) {
  tradesState = tradesState.filter((t) => t.id !== id);
  safeSet(TRADES_KEY, tradesState);
  emit();
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

export function calcPnL(entry: number, exit: number, lot: number, direction: "long" | "short") {
  return calculateTradeMetrics({ market: "stocks", entry, exit, lot, direction }).pnl;
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
  const costs = (Number(input.commission) || 0) + (Number(input.fees) || 0);
  const signedMove = input.direction === "long" ? exit - entry : entry - exit;
  const rawPoints = signedMove;
  const multiplier = contractMultiplier(input.market, input.asset);
  const pnl = rawPoints * lot * multiplier - costs;
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
  const rMultiple = riskAmount > 0 ? pnl / riskAmount : 0;
  const winLossStatus = Math.abs(pnl) < 0.000001 ? "breakeven" : pnl > 0 ? "win" : "loss";

  return {
    pnl: roundMetric(pnl),
    pips: roundMetric(pips),
    points: roundMetric(points),
    percentageGain: roundMetric(percentageGain),
    rMultiple: roundMetric(rMultiple),
    rewardRatio: roundMetric(rewardRatio),
    riskAmount: roundMetric(riskAmount),
    winLossStatus,
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
import { useSyncExternalStore } from "react";
export function useTradingPlan() {
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
