/**
 * Onboarding analytics — bridges signup questionnaire answers into the
 * Superadmin Analytics surface. Persists every submission into the shared
 * admin store under "onboardingSubmissions" so charts update in real time
 * whenever a new user finishes (or skips) the questionnaire.
 */
import {
  type OnboardingAnswers,
  type Market,
  type TradingExperience,
  type MonthlyVolume,
  type AcquisitionSource,
  type PrimaryGoal,
} from "@/lib/auth";
import { pushCollection, readCollection, newId } from "@/lib/admin-store";

export type OnboardingSubmission = {
  id: string;
  userId: string;
  email: string;
  fullName?: string;
  country?: string;
  submittedAt: string; // ISO
  completed: boolean;
  answers: OnboardingAnswers;
};

const KEY = "onboardingSubmissions";

/* ---------- Seed data so analytics is meaningful from day 1 ---------- */

const SEED_COUNTRIES = ["🇺🇸 USA", "🇳🇬 Nigeria", "🇬🇧 UK", "🇮🇳 India", "🇿🇦 South Africa", "🇦🇪 UAE", "🇩🇪 Germany", "🇧🇷 Brazil"];
const SEED_NAMES = [
  "Ada Obi", "Liam Brown", "Sofia Chen", "Marcus Lee", "Aisha Khan", "Noah Smith",
  "Mia García", "Tomás Silva", "Hana Park", "Kunle Adebayo", "Emma Müller", "Yusuf Demir",
  "Olivia Davis", "Raj Patel", "Zara Ahmed", "Ethan Wright", "Lara Costa", "Felix Wagner",
];

const MARKETS: Market[] = ["forex", "crypto", "indices", "stocks", "commodities", "propfirms"];
const EXPERIENCES: TradingExperience[] = ["beginner", "intermediate", "advanced"];
const VOLUMES: MonthlyVolume[] = ["lt1k", "1k_10k", "10k_50k", "gt50k"];
const SOURCES: AcquisitionSource[] = ["tiktok", "twitter", "youtube", "google", "referral", "other"];
const GOALS: PrimaryGoal[] = ["reduce_costs", "find_brokers", "track_performance", "earn_rewards", "improve_strategy"];

// Weighted picker so the seed feels realistic, not uniform.
function weightedPick<T>(opts: { v: T; w: number }[]): T {
  const total = opts.reduce((s, o) => s + o.w, 0);
  let r = Math.random() * total;
  for (const o of opts) { r -= o.w; if (r <= 0) return o.v; }
  return opts[0].v;
}

function pickMarkets(): Market[] {
  // 1–3 markets, biased toward forex + crypto.
  const pool: { v: Market; w: number }[] = [
    { v: "forex", w: 9 }, { v: "crypto", w: 8 }, { v: "indices", w: 4 },
    { v: "stocks", w: 5 }, { v: "commodities", w: 2 }, { v: "propfirms", w: 6 },
  ];
  const count = 1 + Math.floor(Math.random() * 3);
  const out = new Set<Market>();
  while (out.size < count) out.add(weightedPick(pool));
  return [...out];
}

function makeSeed(): OnboardingSubmission[] {
  const out: OnboardingSubmission[] = [];
  const now = Date.now();
  for (let i = 0; i < 64; i++) {
    const daysAgo = Math.floor(Math.random() * 30); // last 30 days
    const submittedAt = new Date(now - daysAgo * 24 * 60 * 60 * 1000 - Math.floor(Math.random() * 86_400_000)).toISOString();
    const name = SEED_NAMES[i % SEED_NAMES.length];
    const country = SEED_COUNTRIES[i % SEED_COUNTRIES.length];
    const completed = Math.random() > 0.12; // ~88% completion
    out.push({
      id: newId("ob"),
      userId: newId("u"),
      email: `${name.toLowerCase().replace(/\s+/g, ".")}.${i}@demo.io`,
      fullName: name,
      country,
      submittedAt,
      completed,
      answers: {
        preferredMarkets: pickMarkets(),
        currentPlatform: ["MT4", "MT5", "cTrader", "TradingView", "Binance", "Bybit", "—"][Math.floor(Math.random() * 7)],
        tradingExperience: weightedPick([
          { v: "beginner" as const, w: 4 },
          { v: "intermediate" as const, w: 6 },
          { v: "advanced" as const, w: 3 },
        ]),
        monthlyVolume: weightedPick([
          { v: "lt1k" as const, w: 5 },
          { v: "1k_10k" as const, w: 7 },
          { v: "10k_50k" as const, w: 4 },
          { v: "gt50k" as const, w: 2 },
        ]),
        acquisitionSource: weightedPick([
          { v: "tiktok" as const, w: 6 },
          { v: "twitter" as const, w: 5 },
          { v: "youtube" as const, w: 7 },
          { v: "google" as const, w: 4 },
          { v: "referral" as const, w: 3 },
          { v: "other" as const, w: 2 },
        ]),
        primaryGoal: weightedPick([
          { v: "reduce_costs" as const, w: 6 },
          { v: "find_brokers" as const, w: 5 },
          { v: "track_performance" as const, w: 4 },
          { v: "earn_rewards" as const, w: 7 },
          { v: "improve_strategy" as const, w: 3 },
        ]),
      },
    });
  }
  return out;
}

/* ---------- Public API ---------- */

export function getSubmissions(): OnboardingSubmission[] {
  return readCollection<OnboardingSubmission>(KEY, makeSeed());
}

export function recordOnboardingSubmission(input: {
  userId: string;
  email: string;
  fullName?: string;
  country?: string;
  answers: OnboardingAnswers;
  completed: boolean;
}) {
  pushCollection<OnboardingSubmission>(
    KEY,
    {
      id: newId("ob"),
      userId: input.userId,
      email: input.email,
      fullName: input.fullName,
      country: input.country,
      submittedAt: new Date().toISOString(),
      completed: input.completed,
      answers: input.answers,
    },
    makeSeed(),
  );
}

/* ---------- Aggregations for charts ---------- */

export function countBy<K extends string>(rows: OnboardingSubmission[], pick: (r: OnboardingSubmission) => K | null | undefined): Record<K, number> {
  const out = {} as Record<K, number>;
  for (const r of rows) {
    const k = pick(r);
    if (k == null) continue;
    out[k] = (out[k] ?? 0) + 1;
  }
  return out;
}

export function dailyTrend(rows: OnboardingSubmission[], days = 30): { date: string; signups: number; completed: number }[] {
  const out: { date: string; signups: number; completed: number }[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const dayRows = rows.filter((r) => r.submittedAt.slice(0, 10) === key);
    out.push({
      date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      signups: dayRows.length,
      completed: dayRows.filter((r) => r.completed).length,
    });
  }
  return out;
}

export const MARKET_LABEL: Record<Market, string> = {
  forex: "Forex", crypto: "Crypto", indices: "Indices",
  stocks: "Stocks", commodities: "Commodities", propfirms: "Prop Firms",
};
export const EXPERIENCE_LABEL: Record<TradingExperience, string> = {
  beginner: "Beginner", intermediate: "Intermediate", advanced: "Advanced",
};
export const VOLUME_LABEL: Record<MonthlyVolume, string> = {
  lt1k: "< $1K", "1k_10k": "$1K – $10K", "10k_50k": "$10K – $50K", gt50k: "> $50K",
};
export const SOURCE_LABEL: Record<AcquisitionSource, string> = {
  tiktok: "TikTok", twitter: "X / Twitter", youtube: "YouTube",
  google: "Google", referral: "Referral", other: "Other",
};
export const GOAL_LABEL: Record<PrimaryGoal, string> = {
  reduce_costs: "Reduce costs",
  find_brokers: "Find brokers",
  track_performance: "Track performance",
  earn_rewards: "Earn rewards",
  improve_strategy: "Improve strategy",
};

export const ALL_MARKETS = MARKETS;
export const ALL_EXPERIENCES = EXPERIENCES;
export const ALL_VOLUMES = VOLUMES;
export const ALL_SOURCES = SOURCES;
export const ALL_GOALS = GOALS;
