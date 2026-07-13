import type { Trade } from "@/lib/trading-plan";
import { resolveTradeNetPnl, resolveTradeOutcome } from "@/lib/trading-plan";

export type ConsistencyCalculationMethod =
  | "best_day_over_total_net_profit"
  | "best_day_over_total_positive_profit"
  | "top_n_days_over_total"
  | "custom";

export type ConsistencyRule = {
  id: string;
  brandId?: string;
  programId?: string;
  name: string;
  calculationMethod: ConsistencyCalculationMethod;
  thresholdPercentage: number;
  thresholdDirection: "maximum" | "minimum";
  topDayCount?: number;
  includeLossDays: boolean;
  ruleDescription: string;
  sourceUrl?: string;
  lastVerifiedAt?: string;
  isActive: boolean;
};

export type DailyProfitEntry = {
  id: string;
  label: string;
  amount: number;
};

export type ProfitConsistencyInput = {
  totalNetProfit: number;
  highestProfitableDay: number;
  rule: ConsistencyRule;
};

export type ProfitConsistencyStatus =
  | "within_limit"
  | "above_limit"
  | "not_calculable"
  | "no_rule";

export type ProfitConsistencyResult = {
  consistencyPercentage: number | null;
  status: ProfitConsistencyStatus;
  totalNetProfit: number;
  highestProfitableDay: number;
  ruleLimit: number | null;
  remainingAllowance: number | null;
  additionalProfitRequired: number;
  maximumBestDayAtCurrentProfit: number | null;
  message: string;
};

export const GENERIC_CONSISTENCY_RULES: ConsistencyRule[] = [
  {
    id: "generic-30",
    name: "Generic 30% Max Best-Day Rule",
    calculationMethod: "best_day_over_total_net_profit",
    thresholdPercentage: 30,
    thresholdDirection: "maximum",
    includeLossDays: true,
    ruleDescription:
      "Best profitable day divided by total net profit. Confirm the latest rule with your provider.",
    isActive: true,
  },
  {
    id: "generic-40",
    name: "Generic 40% Max Best-Day Rule",
    calculationMethod: "best_day_over_total_net_profit",
    thresholdPercentage: 40,
    thresholdDirection: "maximum",
    includeLossDays: true,
    ruleDescription:
      "A looser generic planning threshold for firms that use a maximum best-day consistency rule.",
    isActive: true,
  },
  {
    id: "none",
    name: "No Rule Selected",
    calculationMethod: "best_day_over_total_net_profit",
    thresholdPercentage: 0,
    thresholdDirection: "maximum",
    includeLossDays: true,
    ruleDescription: "Use this when you only want the mathematical consistency percentage.",
    isActive: true,
  },
];

export function roundCalculatorValue(value: number, decimals = 2) {
  if (!Number.isFinite(value)) return 0;
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

export function dailyEntriesToConsistencyInput(
  entries: DailyProfitEntry[],
  rule: ConsistencyRule,
): ProfitConsistencyInput {
  const values = entries.map((entry) => Number(entry.amount) || 0);
  const totalNetProfit = values.reduce((sum, value) => sum + value, 0);
  const highestProfitableDay = Math.max(0, ...values.filter((value) => value > 0));
  return {
    totalNetProfit: roundCalculatorValue(totalNetProfit),
    highestProfitableDay: roundCalculatorValue(highestProfitableDay),
    rule,
  };
}

export function calculateProfitConsistency(input: ProfitConsistencyInput): ProfitConsistencyResult {
  const totalNetProfit = roundCalculatorValue(Number(input.totalNetProfit) || 0);
  const highestProfitableDay = roundCalculatorValue(Math.max(0, Number(input.highestProfitableDay) || 0));
  const limit = Number(input.rule.thresholdPercentage) || 0;
  const limitDecimal = limit / 100;
  const noRule = input.rule.id === "none" || limit <= 0;

  if (totalNetProfit === 0) {
    return {
      consistencyPercentage: null,
      status: "not_calculable",
      totalNetProfit,
      highestProfitableDay,
      ruleLimit: noRule ? null : limit,
      remainingAllowance: null,
      additionalProfitRequired: 0,
      maximumBestDayAtCurrentProfit: noRule ? null : roundCalculatorValue(totalNetProfit * limitDecimal),
      message: "Consistency cannot be calculated until total net profit is above zero.",
    };
  }

  if (totalNetProfit < 0) {
    return {
      consistencyPercentage: null,
      status: "not_calculable",
      totalNetProfit,
      highestProfitableDay,
      ruleLimit: noRule ? null : limit,
      remainingAllowance: null,
      additionalProfitRequired: 0,
      maximumBestDayAtCurrentProfit: noRule ? null : roundCalculatorValue(totalNetProfit * limitDecimal),
      message: "Profit consistency is not applicable while the overall result is negative.",
    };
  }

  if (highestProfitableDay <= 0) {
    return {
      consistencyPercentage: null,
      status: "not_calculable",
      totalNetProfit,
      highestProfitableDay,
      ruleLimit: noRule ? null : limit,
      remainingAllowance: null,
      additionalProfitRequired: 0,
      maximumBestDayAtCurrentProfit: noRule ? null : roundCalculatorValue(totalNetProfit * limitDecimal),
      message: "No profitable day is available for consistency analysis.",
    };
  }

  const consistencyPercentage = roundCalculatorValue((highestProfitableDay / totalNetProfit) * 100);
  const maximumBestDayAtCurrentProfit = noRule ? null : roundCalculatorValue(totalNetProfit * limitDecimal);
  const remainingAllowance = noRule || maximumBestDayAtCurrentProfit === null
    ? null
    : roundCalculatorValue(maximumBestDayAtCurrentProfit - highestProfitableDay);
  const additionalProfitRequired = noRule || limitDecimal <= 0 || consistencyPercentage <= limit
    ? 0
    : roundCalculatorValue(Math.max(0, highestProfitableDay / limitDecimal - totalNetProfit));

  return {
    consistencyPercentage,
    status: noRule ? "no_rule" : consistencyPercentage <= limit ? "within_limit" : "above_limit",
    totalNetProfit,
    highestProfitableDay,
    ruleLimit: noRule ? null : limit,
    remainingAllowance,
    additionalProfitRequired,
    maximumBestDayAtCurrentProfit,
    message: noRule
      ? "No rule selected. Showing the mathematical best-day consistency percentage only."
      : consistencyPercentage <= limit
        ? "This result is within the selected maximum consistency rule."
        : "This result is above the selected maximum consistency rule.",
  };
}

export function buildDailyEntriesFromTrades(trades: Trade[], currency = "USD"): DailyProfitEntry[] {
  const grouped = new Map<string, number>();
  trades.forEach((trade) => {
    if ((trade.pnlCurrency || "USD").toUpperCase() !== currency.toUpperCase()) return;
    if (trade.resultSource === "legacy_unverified") return;
    if (resolveTradeOutcome(trade) === "pending") return;
    const pnl = resolveTradeNetPnl(trade);
    if (pnl === null) return;
    const day = new Date(trade.createdAt).toISOString().slice(0, 10);
    grouped.set(day, roundCalculatorValue((grouped.get(day) ?? 0) + pnl));
  });
  return [...grouped.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([label, amount], index) => ({ id: `journal-${index}-${label}`, label, amount }));
}

export function formatCalculatorMoney(value: number, currency = "USD") {
  const sign = value > 0 ? "+" : value < 0 ? "-" : "";
  return `${sign}${currency} ${Math.abs(value).toLocaleString(undefined, {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  })}`;
}
