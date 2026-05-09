/**
 * RR Rewards — single source of truth for the entire RebateRewards economy.
 *
 * Owns:
 *   • Earn rules (recurring actions: trade log, review, …)
 *   • Social / one-shot rules (follow IG, subscribe newsletter, …) with
 *     verification (handle / email submitted by user) + once-per-user enforcement.
 *   • Spend rules (cash conversion, course unlock, …)
 *   • Award engine — credits user wallet + writes to ledger.
 *   • Analytics aggregation (earned / redeemed / offered / unique users).
 *
 * All admin edits are persisted to localStorage so the Superadmin RR Control
 * Center stays in sync with the user-facing dashboards across reloads.
 */

import { useSyncExternalStore } from "react";
import { addRrEntry } from "@/lib/admin-store";

/* ============================================================
 * Types
 * ============================================================ */

export type RrActionId =
  | "academy_course_complete"
  | "trade_log"
  | "review_submit"
  | "referral_kyc"
  | "complaint_evidence";

export type RrSocialId =
  | "follow_instagram"
  | "follow_twitter"
  | "subscribe_youtube"
  | "follow_tiktok"
  | "join_telegram"
  | "join_discord"
  | "subscribe_newsletter";

export type RrSpendId = string;

export type RrRule = {
  id: RrActionId;
  label: string;
  description: string;
  enabled: boolean;
  free: number;
  premium: number;
};

export type RrSocialRule = {
  id: RrSocialId;
  label: string;
  network: "instagram" | "twitter" | "youtube" | "tiktok" | "telegram" | "discord" | "email";
  url: string;          // where we send the user
  handle: string;       // our official handle / channel — used for verification UI
  reward: number;       // RR awarded (one time per user)
  enabled: boolean;
  verification: "handle" | "email" | "manual"; // what we collect to confirm
  description: string;
};

export type RrSpendCategory =
  | "cash" | "discount" | "fees" | "academy"
  | "boost"      // cashback / feature boosts
  | "partner"    // partner brand discount codes
  | "badge"      // profile badges / flair
  | "raffle"     // giveaway entries
  | "other";

export type RrSpendRule = {
  id: RrSpendId;
  label: string;
  description: string;
  cost: number;
  category: RrSpendCategory;
  enabled: boolean;
  /** Minimum tier index required (0 = New). Defaults to 0. */
  tierGate?: number;
  /** Optional total stock (undefined = unlimited). */
  stock?: number;
  /** How many already redeemed (locally tracked). */
  redeemed?: number;
};

/* Tiers — action-based contributor levels (reviews + streak + verified) */
export type RrTier = {
  id: string;
  name: string;
  /** Order index (0 = lowest). Used as gate for redemptions / multipliers. */
  rank: number;
  /** Earn multiplier applied on top of base RR (1 = no boost, 1.25 = +25%). */
  multiplier: number;
  /** Daily RR cap for this tier (0 = no cap). Overrides global cap when higher. */
  dailyCap: number;
  /** Requirements — user must meet ALL to qualify. */
  requirements: {
    approvedReviews: number;
    streakDays: number;
    verifiedEmail: boolean;
  };
  perks: string[];
};

/* Anti-abuse caps & cooldowns */
export type RrCaps = {
  /** Global per-user daily RR cap (0 = no cap). Tier dailyCap can raise it. */
  dailyCap: number;
  /** Global per-user weekly RR cap (0 = no cap). */
  weeklyCap: number;
  /** Per-action cooldowns in seconds. */
  cooldowns: Partial<Record<RrActionId, number>>;
  /** Daily action limit per user — caps how many times an action can fire. */
  dailyActionLimit: Partial<Record<RrActionId, number>>;
};

export type RrClaim = {
  id: string;            // e.g. "follow_instagram:user@me"
  socialId: RrSocialId;
  userId: string;
  proof: string;         // handle / email submitted
  status: "pending" | "approved" | "rejected";
  amount: number;
  submittedAt: string;
  reviewedAt?: string;
};

/* ============================================================
 * Defaults (shipped seed)
 * ============================================================ */

const STORAGE = {
  rules: "rb-rr-rules-v1",
  social: "rb-rr-social-v1",
  spend: "rb-rr-spend-v1",
  claims: "rb-rr-claims-v1",
  balance: "rb-rr-balance-v1",
  streakCfg: "rb-rr-streak-cfg-v1",
  streakState: "rb-rr-streak-state-v1",
  tiers: "rb-rr-tiers-v1",
  caps: "rb-rr-caps-v1",
  usage: "rb-rr-usage-v1",       // per-user per-day usage tracker
  contrib: "rb-rr-contrib-v1",   // per-user contribution counters (reviews, verified, etc.)
};

/* Streaks */
export type RrStreakMilestone = {
  id: string;
  days: number;        // milestone trigger (e.g. 7, 14, 30)
  reward: number;      // RR awarded once milestone hit
  label: string;
  enabled: boolean;
};

export type RrStreakConfig = {
  enabled: boolean;
  /** What counts as a "qualifying day" — used in copy & validation hooks */
  qualifier: "login" | "trade_log" | "any_activity";
  /** Grace window in hours after midnight before streak breaks (default 0) */
  graceHours: number;
  milestones: RrStreakMilestone[];
};

export type RrStreakState = {
  current: number;
  longest: number;
  lastDay: string | null;        // YYYY-MM-DD
  claimedMilestones: string[];   // milestone ids already paid
};

const DEFAULT_RULES: RrRule[] = [
  { id: "academy_course_complete", label: "Complete Academy course", description: "Awarded after final exam pass + certificate issued.", enabled: true, free: 25, premium: 50 },
  { id: "trade_log",               label: "Log a trade (journal)",   description: "Awarded each time a user logs a trade in the journal.", enabled: true, free: 2,  premium: 5  },
  { id: "review_submit",           label: "Submit verified review",   description: "Awarded when a brand review is approved.",              enabled: true, free: 12, premium: 20 },
  { id: "referral_kyc",            label: "Refer a friend (KYC passed)", description: "Awarded when an invited user completes KYC.",       enabled: true, free: 50, premium: 75 },
  { id: "complaint_evidence",      label: "Submit complaint with evidence", description: "Awarded when a complaint is filed with proof.",  enabled: true, free: 15, premium: 25 },
];

const DEFAULT_SOCIAL: RrSocialRule[] = [
  { id: "follow_instagram",   label: "Follow on Instagram", network: "instagram", url: "https://instagram.com/rebateboard",     handle: "@rebateboard",     reward: 30, enabled: true, verification: "handle", description: "Follow our official Instagram and submit your handle." },
  { id: "follow_twitter",     label: "Follow on X (Twitter)", network: "twitter",  url: "https://x.com/rebateboard",            handle: "@rebateboard",     reward: 30, enabled: true, verification: "handle", description: "Follow @rebateboard on X to claim." },
  { id: "subscribe_youtube",  label: "Subscribe on YouTube", network: "youtube",   url: "https://youtube.com/@rebateboard",     handle: "@rebateboard",     reward: 50, enabled: true, verification: "handle", description: "Subscribe to our YouTube channel." },
  { id: "follow_tiktok",      label: "Follow on TikTok",     network: "tiktok",    url: "https://tiktok.com/@rebateboard",      handle: "@rebateboard",     reward: 25, enabled: true, verification: "handle", description: "Follow us on TikTok." },
  { id: "join_telegram",      label: "Join Telegram channel", network: "telegram", url: "https://t.me/rebateboard",             handle: "@rebateboard",     reward: 25, enabled: true, verification: "handle", description: "Join our Telegram." },
  { id: "join_discord",       label: "Join Discord server",   network: "discord",  url: "https://discord.gg/rebateboard",       handle: "RebateBoard#0001", reward: 25, enabled: true, verification: "handle", description: "Join our Discord community." },
  { id: "subscribe_newsletter", label: "Subscribe to newsletter", network: "email", url: "/#newsletter",                        handle: "newsletter@rebateboard.com", reward: 20, enabled: true, verification: "email", description: "Subscribe to the weekly RebateBoard newsletter." },
];

const DEFAULT_SPEND: RrSpendRule[] = [
  { id: "sp_cash100",   label: "Convert 100 RR → $1",      description: "Cash credited to wallet instantly.",         cost: 100, category: "cash",     enabled: true, tierGate: 0 },
  { id: "sp_boost2x",   label: "2× cashback boost (7 days)", description: "Doubles cashback on partner brokers for one week.", cost: 400, category: "boost", enabled: true, tierGate: 1 },
  { id: "sp_propfirm",  label: "25% off prop firm checkout", description: "Apply at supported prop firm checkout.",   cost: 500, category: "discount", enabled: true, tierGate: 1 },
  { id: "sp_fees",      label: "30% trading fee discount (30d)", description: "Activate on partner brokers.",         cost: 750, category: "fees",     enabled: true, tierGate: 2 },
  { id: "sp_course",    label: "Unlock premium course",     description: "Unlock any premium Academy course.",         cost: 300, category: "academy",  enabled: true, tierGate: 0 },
  { id: "sp_partner1",  label: "FundingPips — 15% off code", description: "Single-use partner discount code.",        cost: 600, category: "partner",  enabled: true, tierGate: 1, stock: 50, redeemed: 0 },
  { id: "sp_badge_v",   label: "Verified Contributor badge", description: "Profile + leaderboard flair.",              cost: 250, category: "badge",    enabled: true, tierGate: 2 },
  { id: "sp_raffle",    label: "Weekly $100 raffle entry",   description: "1 entry into the weekly cash raffle.",     cost: 75,  category: "raffle",   enabled: true, tierGate: 0 },
  { id: "sp_boost",     label: "Boost a brand review",       description: "Promote your review on brand page.",        cost: 50,  category: "other",    enabled: false, tierGate: 0 },
];

const DEFAULT_STREAK: RrStreakConfig = {
  enabled: true,
  qualifier: "any_activity",
  graceHours: 6,
  milestones: [
    { id: "st_3",  days: 3,  reward: 25,  label: "3-day spark",      enabled: true },
    { id: "st_7",  days: 7,  reward: 75,  label: "7-day streak",     enabled: true },
    { id: "st_14", days: 14, reward: 200, label: "2-week disciplined", enabled: true },
    { id: "st_30", days: 30, reward: 500, label: "30-day milestone", enabled: true },
    { id: "st_60", days: 60, reward: 1200, label: "60-day grinder",  enabled: true },
    { id: "st_100", days: 100, reward: 2500, label: "Century club",  enabled: true },
  ],
};

const DEFAULT_TIERS: RrTier[] = [
  { id: "t_new",      name: "New",                rank: 0, multiplier: 1.0,  dailyCap: 200,  requirements: { approvedReviews: 0,  streakDays: 0,  verifiedEmail: false }, perks: ["Basic earn rate", "Access to cash + academy redemptions"] },
  { id: "t_active",   name: "Active",             rank: 1, multiplier: 1.1,  dailyCap: 400,  requirements: { approvedReviews: 1,  streakDays: 3,  verifiedEmail: true  }, perks: ["+10% RR multiplier", "Unlock partner discounts"] },
  { id: "t_verified", name: "Verified",           rank: 2, multiplier: 1.25, dailyCap: 800,  requirements: { approvedReviews: 3,  streakDays: 7,  verifiedEmail: true  }, perks: ["+25% RR multiplier", "Unlock fee discount + badges"] },
  { id: "t_trusted",  name: "Trusted Contributor", rank: 3, multiplier: 1.5,  dailyCap: 1500, requirements: { approvedReviews: 10, streakDays: 21, verifiedEmail: true  }, perks: ["+50% RR multiplier", "Priority claim review", "Higher daily cap"] },
  { id: "t_elite",    name: "Elite Contributor",  rank: 4, multiplier: 2.0,  dailyCap: 3000, requirements: { approvedReviews: 25, streakDays: 60, verifiedEmail: true  }, perks: ["+100% RR multiplier", "Early access to new rewards", "Private partner deals"] },
];

const DEFAULT_CAPS: RrCaps = {
  dailyCap: 500,
  weeklyCap: 2500,
  cooldowns: {
    review_submit: 60 * 60 * 6,        // 6h between reviews
    referral_kyc: 0,
    trade_log: 30,                     // 30s between trade-log credits
    complaint_evidence: 60 * 60 * 24,  // 1/day
    academy_course_complete: 0,
  },
  dailyActionLimit: {
    trade_log: 20,
    review_submit: 3,
    complaint_evidence: 2,
    referral_kyc: 10,
    academy_course_complete: 5,
  },
};

/* Per-user contribution counters — drives tier qualification */
export type RrContribution = {
  approvedReviews: number;
  verifiedEmail: boolean;
  // streakDays comes from streakStateCache.current
};

/* Per-user usage tracker for caps + cooldowns */
type RrUsage = {
  day: string;                                  // YYYY-MM-DD
  weekStart: string;                            // YYYY-MM-DD (Mon)
  dayTotal: number;
  weekTotal: number;
  actionCounts: Partial<Record<RrActionId, number>>;
  lastAction: Partial<Record<RrActionId, number>>; // ms epoch
};

/* ============================================================
 * Generic store
 * ============================================================ */

const listeners = new Set<() => void>();
const emit = () => {
  // bust any memoized snapshots
  try { invalidateAnalytics(); } catch {}
  listeners.forEach((l) => l());
  if (typeof window !== "undefined") window.dispatchEvent(new Event("rb-rr-rules-update"));
};

function read<T>(key: string, seed: T): T {
  if (typeof window === "undefined") return seed;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : seed;
  } catch {
    return seed;
  }
}
function write<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
  emit();
}

let rulesCache: RrRule[] = mergeRules(read<RrRule[]>(STORAGE.rules, DEFAULT_RULES), DEFAULT_RULES);
let socialCache: RrSocialRule[] = mergeRules(read<RrSocialRule[]>(STORAGE.social, DEFAULT_SOCIAL), DEFAULT_SOCIAL);
let spendCache: RrSpendRule[] = mergeRules(read<RrSpendRule[]>(STORAGE.spend, DEFAULT_SPEND), DEFAULT_SPEND);
let claimsCache: RrClaim[] = read<RrClaim[]>(STORAGE.claims, []);
let streakCfgCache: RrStreakConfig = mergeStreak(read<RrStreakConfig>(STORAGE.streakCfg, DEFAULT_STREAK), DEFAULT_STREAK);
let streakStateCache: Record<string, RrStreakState> = read<Record<string, RrStreakState>>(STORAGE.streakState, {});
let tiersCache: RrTier[] = mergeRules(read<RrTier[]>(STORAGE.tiers, DEFAULT_TIERS), DEFAULT_TIERS).sort((a, b) => a.rank - b.rank);
let capsCache: RrCaps = { ...DEFAULT_CAPS, ...read<RrCaps>(STORAGE.caps, DEFAULT_CAPS), cooldowns: { ...DEFAULT_CAPS.cooldowns, ...(read<RrCaps>(STORAGE.caps, DEFAULT_CAPS).cooldowns ?? {}) }, dailyActionLimit: { ...DEFAULT_CAPS.dailyActionLimit, ...(read<RrCaps>(STORAGE.caps, DEFAULT_CAPS).dailyActionLimit ?? {}) } };
let usageCache: Record<string, RrUsage> = read<Record<string, RrUsage>>(STORAGE.usage, {});
let contribCache: Record<string, RrContribution> = read<Record<string, RrContribution>>(STORAGE.contrib, {});

function mergeStreak(stored: RrStreakConfig, def: RrStreakConfig): RrStreakConfig {
  const map = new Map(stored.milestones?.map((m) => [m.id, m] as const) ?? []);
  const merged = def.milestones.map((d) => map.get(d.id) ?? d);
  stored.milestones?.forEach((m) => { if (!def.milestones.find((d) => d.id === m.id)) merged.push(m); });
  return { ...def, ...stored, milestones: merged };
}

function mergeRules<T extends { id: string }>(stored: T[], defaults: T[]): T[] {
  const map = new Map(stored.map((r) => [r.id, r] as const));
  // ensure new defaults appear; preserve admin overrides for existing ids
  const merged = defaults.map((d) => map.get(d.id) ?? d);
  // include any custom rules added by admin that aren't in defaults
  stored.forEach((s) => { if (!defaults.find((d) => d.id === s.id)) merged.push(s); });
  return merged;
}

/* ============================================================
 * Earn rules (recurring)
 * ============================================================ */

export function getRrRules(): RrRule[] { return rulesCache; }
export function getRrRule(id: RrActionId): RrRule | undefined { return rulesCache.find((r) => r.id === id); }
export function updateRrRule(id: RrActionId, patch: Partial<RrRule>) {
  rulesCache = rulesCache.map((r) => (r.id === id ? { ...r, ...patch } : r));
  write(STORAGE.rules, rulesCache);
}
export function resetRrRules() { rulesCache = DEFAULT_RULES; write(STORAGE.rules, rulesCache); }
export function useRrRules(): RrRule[] {
  return useSyncExternalStore(sub, () => rulesCache, () => DEFAULT_RULES);
}

/* ============================================================
 * Social / one-shot rules
 * ============================================================ */

export function getSocialRules(): RrSocialRule[] { return socialCache; }
export function updateSocialRule(id: RrSocialId, patch: Partial<RrSocialRule>) {
  socialCache = socialCache.map((r) => (r.id === id ? { ...r, ...patch } : r));
  write(STORAGE.social, socialCache);
}
export function resetSocialRules() { socialCache = DEFAULT_SOCIAL; write(STORAGE.social, socialCache); }
export function useSocialRules(): RrSocialRule[] {
  return useSyncExternalStore(sub, () => socialCache, () => DEFAULT_SOCIAL);
}

/* ============================================================
 * Spend rules
 * ============================================================ */

export function getSpendRules(): RrSpendRule[] { return spendCache; }
export function updateSpendRule(id: RrSpendId, patch: Partial<RrSpendRule>) {
  spendCache = spendCache.map((r) => (r.id === id ? { ...r, ...patch } : r));
  write(STORAGE.spend, spendCache);
}
export function addSpendRule(rule: Omit<RrSpendRule, "id"> & { id?: string }) {
  const id = rule.id ?? `sp_${Math.random().toString(36).slice(2, 8)}`;
  spendCache = [...spendCache, { ...rule, id }];
  write(STORAGE.spend, spendCache);
}
export function removeSpendRule(id: RrSpendId) {
  spendCache = spendCache.filter((r) => r.id !== id);
  write(STORAGE.spend, spendCache);
}
export function resetSpendRules() { spendCache = DEFAULT_SPEND; write(STORAGE.spend, spendCache); }
export function useSpendRules(): RrSpendRule[] {
  return useSyncExternalStore(sub, () => spendCache, () => DEFAULT_SPEND);
}

/* ============================================================
 * Claims (social once-per-user)
 * ============================================================ */

export function getClaims(): RrClaim[] { return claimsCache; }
export function useClaims(): RrClaim[] {
  return useSyncExternalStore(sub, () => claimsCache, () => [] as RrClaim[]);
}
export function userClaim(userId: string, socialId: RrSocialId): RrClaim | undefined {
  return claimsCache.find((c) => c.userId === userId && c.socialId === socialId);
}
export function submitSocialClaim(opts: { userId: string; socialId: RrSocialId; proof: string }): { ok: boolean; reason?: string; claim?: RrClaim } {
  const rule = socialCache.find((r) => r.id === opts.socialId);
  if (!rule || !rule.enabled) return { ok: false, reason: "This reward is currently unavailable." };
  if (userClaim(opts.userId, opts.socialId)) return { ok: false, reason: "You already claimed this reward." };
  if (!opts.proof || opts.proof.trim().length < 2) return { ok: false, reason: "Please enter your handle / email so we can verify." };

  const claim: RrClaim = {
    id: `${opts.socialId}:${opts.userId}`,
    socialId: opts.socialId,
    userId: opts.userId,
    proof: opts.proof.trim(),
    status: "pending",
    amount: rule.reward,
    submittedAt: new Date().toISOString(),
  };
  claimsCache = [claim, ...claimsCache];
  write(STORAGE.claims, claimsCache);
  return { ok: true, claim };
}
export function reviewClaim(claimId: string, decision: "approved" | "rejected") {
  const claim = claimsCache.find((c) => c.id === claimId);
  if (!claim || claim.status !== "pending") return;
  claimsCache = claimsCache.map((c) => c.id === claimId ? { ...c, status: decision, reviewedAt: new Date().toISOString() } : c);
  write(STORAGE.claims, claimsCache);
  if (decision === "approved") {
    const rule = socialCache.find((r) => r.id === claim.socialId);
    creditWalletDirect(claim.amount, rule?.label ?? "Social reward", claim.userId);
  }
}

/* ============================================================
 * Award engine (recurring earn rules)
 * ============================================================ */

function readBalance(): number {
  if (typeof window === "undefined") return 0;
  const raw = localStorage.getItem(STORAGE.balance);
  return raw ? Number(raw) || 0 : 5000;
}
function writeBalance(next: number) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE.balance, String(next));
  window.dispatchEvent(new Event("rb-academy-update"));
  // also notify RR analytics / streak hooks subscribed via `sub`
  emit();
}

function creditWalletDirect(amount: number, label: string, user = "@me") {
  const next = readBalance() + amount;
  writeBalance(next);
  try { addRrEntry({ user, type: label, amount, balance: next }); } catch {}
  return next;
}

export type AwardResult = {
  awarded: boolean;
  amount: number;
  baseAmount?: number;
  multiplier?: number;
  reason?: "disabled" | "unknown" | "zero" | "cooldown" | "daily_cap" | "weekly_cap" | "action_limit" | "tier_locked";
  retryInSec?: number;
  newBalance?: number;
};

/* ---------- Usage / cap helpers ---------- */
const _todayKey = () => new Date().toISOString().slice(0, 10);
function _weekStartKey(d = new Date()): string {
  const day = d.getUTCDay();           // 0=Sun..6=Sat
  const diff = (day + 6) % 7;          // days since Monday
  const m = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - diff));
  return m.toISOString().slice(0, 10);
}
function getUsage(user: string): RrUsage {
  const today = _todayKey();
  const week = _weekStartKey();
  const u = usageCache[user];
  if (!u) return { day: today, weekStart: week, dayTotal: 0, weekTotal: 0, actionCounts: {}, lastAction: {} };
  let next = u;
  if (u.day !== today) next = { ...next, day: today, dayTotal: 0, actionCounts: {} };
  if (u.weekStart !== week) next = { ...next, weekStart: week, weekTotal: 0 };
  return next;
}
function commitUsage(user: string, u: RrUsage) {
  usageCache = { ...usageCache, [user]: u };
  write(STORAGE.usage, usageCache);
}

export function awardRr(actionId: RrActionId, opts: { premium?: boolean; user?: string } = {}): AwardResult {
  const user = opts.user ?? "@me";
  const rule = getRrRule(actionId);
  if (!rule) return { awarded: false, amount: 0, reason: "unknown" };
  if (!rule.enabled) return { awarded: false, amount: 0, reason: "disabled" };

  const base = opts.premium ? rule.premium : rule.free;
  if (base <= 0) return { awarded: false, amount: 0, reason: "zero" };

  // Cooldown
  const cooldownSec = capsCache.cooldowns[actionId] ?? 0;
  const usage = getUsage(user);
  const lastMs = usage.lastAction[actionId] ?? 0;
  const sinceSec = (Date.now() - lastMs) / 1000;
  if (cooldownSec > 0 && sinceSec < cooldownSec) {
    return { awarded: false, amount: 0, reason: "cooldown", retryInSec: Math.ceil(cooldownSec - sinceSec) };
  }

  // Daily action limit
  const limit = capsCache.dailyActionLimit[actionId] ?? 0;
  const taken = usage.actionCounts[actionId] ?? 0;
  if (limit > 0 && taken >= limit) {
    return { awarded: false, amount: 0, reason: "action_limit" };
  }

  // Tier multiplier + per-tier daily cap (overrides global if higher)
  const tier = getUserTier(user);
  const multiplier = tier.multiplier ?? 1;
  let amount = Math.round(base * multiplier);

  const dailyCap = Math.max(capsCache.dailyCap, tier.dailyCap || 0);
  const weeklyCap = capsCache.weeklyCap;
  if (dailyCap > 0 && usage.dayTotal + amount > dailyCap) {
    const remaining = Math.max(0, dailyCap - usage.dayTotal);
    if (remaining <= 0) return { awarded: false, amount: 0, reason: "daily_cap" };
    amount = remaining;
  }
  if (weeklyCap > 0 && usage.weekTotal + amount > weeklyCap) {
    const remaining = Math.max(0, weeklyCap - usage.weekTotal);
    if (remaining <= 0) return { awarded: false, amount: 0, reason: "weekly_cap" };
    amount = Math.min(amount, remaining);
  }

  const label = `${rule.label}${opts.premium ? " (Premium)" : ""}${multiplier > 1 ? ` ×${multiplier.toFixed(2)}` : ""}`;
  const newBalance = creditWalletDirect(amount, label, user);

  commitUsage(user, {
    ...usage,
    dayTotal: usage.dayTotal + amount,
    weekTotal: usage.weekTotal + amount,
    actionCounts: { ...usage.actionCounts, [actionId]: taken + 1 },
    lastAction: { ...usage.lastAction, [actionId]: Date.now() },
  });

  return { awarded: true, amount, baseAmount: base, multiplier, newBalance };
}

export function spendRr(spendId: RrSpendId, user = "@me"): { ok: boolean; reason?: string; newBalance?: number } {
  const rule = spendCache.find((r) => r.id === spendId);
  if (!rule || !rule.enabled) return { ok: false, reason: "Unavailable" };
  const tier = getUserTier(user);
  if ((rule.tierGate ?? 0) > tier.rank) {
    const required = tiersCache.find((t) => t.rank === (rule.tierGate ?? 0));
    return { ok: false, reason: `Requires ${required?.name ?? "higher"} tier` };
  }
  if (rule.stock !== undefined && (rule.redeemed ?? 0) >= rule.stock) {
    return { ok: false, reason: "Out of stock" };
  }
  const balance = readBalance();
  if (balance < rule.cost) return { ok: false, reason: `Need ${rule.cost - balance} more RR` };
  const next = balance - rule.cost;
  writeBalance(next);
  if (rule.stock !== undefined) {
    spendCache = spendCache.map((r) => r.id === spendId ? { ...r, redeemed: (r.redeemed ?? 0) + 1 } : r);
    write(STORAGE.spend, spendCache);
  }
  try { addRrEntry({ user, type: `Spend — ${rule.label}`, amount: -rule.cost, balance: next }); } catch {}
  return { ok: true, newBalance: next };
}

/* ============================================================
 * Tiers — action-based contributor levels
 * ============================================================ */
export function getTiers(): RrTier[] { return tiersCache; }
export function useTiers(): RrTier[] {
  return useSyncExternalStore(sub, () => tiersCache, () => DEFAULT_TIERS);
}
export function updateTier(id: string, patch: Partial<RrTier>) {
  tiersCache = tiersCache.map((t) => t.id === id ? { ...t, ...patch, requirements: { ...t.requirements, ...(patch.requirements ?? {}) } } : t).sort((a, b) => a.rank - b.rank);
  write(STORAGE.tiers, tiersCache);
}
export function resetTiers() { tiersCache = DEFAULT_TIERS; write(STORAGE.tiers, tiersCache); }

export function getUserContribution(user = "@me"): RrContribution {
  return contribCache[user] ?? { approvedReviews: 0, verifiedEmail: false };
}
export function setUserContribution(user: string, patch: Partial<RrContribution>) {
  const cur = getUserContribution(user);
  contribCache = { ...contribCache, [user]: { ...cur, ...patch } };
  write(STORAGE.contrib, contribCache);
}
export function bumpApprovedReviews(user = "@me", by = 1) {
  setUserContribution(user, { approvedReviews: getUserContribution(user).approvedReviews + by });
}

export function getUserTier(user = "@me"): RrTier {
  const contrib = getUserContribution(user);
  const streak = streakStateCache[user]?.current ?? 0;
  // Highest tier whose requirements are all met
  let best = tiersCache[0];
  for (const t of tiersCache) {
    const r = t.requirements;
    const ok = contrib.approvedReviews >= r.approvedReviews
      && streak >= r.streakDays
      && (!r.verifiedEmail || contrib.verifiedEmail);
    if (ok && t.rank > (best?.rank ?? -1)) best = t;
  }
  return best;
}
export function useUserTier(user = "@me"): RrTier {
  return useSyncExternalStore(sub, () => getUserTier(user), () => DEFAULT_TIERS[0]);
}
/** Progress toward the next tier (0..1). Returns null if user is at top tier. */
export function getNextTierProgress(user = "@me"): { next: RrTier; pct: number; missing: string[] } | null {
  const cur = getUserTier(user);
  const next = tiersCache.find((t) => t.rank === cur.rank + 1);
  if (!next) return null;
  const contrib = getUserContribution(user);
  const streak = streakStateCache[user]?.current ?? 0;
  const r = next.requirements;
  const missing: string[] = [];
  let parts = 0, done = 0;
  parts++; done += Math.min(1, contrib.approvedReviews / Math.max(1, r.approvedReviews));
  if (contrib.approvedReviews < r.approvedReviews) missing.push(`${r.approvedReviews - contrib.approvedReviews} more approved review${r.approvedReviews - contrib.approvedReviews === 1 ? "" : "s"}`);
  parts++; done += Math.min(1, streak / Math.max(1, r.streakDays));
  if (streak < r.streakDays) missing.push(`${r.streakDays - streak}-day streak`);
  if (r.verifiedEmail) {
    parts++; done += contrib.verifiedEmail ? 1 : 0;
    if (!contrib.verifiedEmail) missing.push("verify email");
  }
  return { next, pct: Math.round((done / parts) * 100), missing };
}

/* ============================================================
 * Caps & cooldowns
 * ============================================================ */
export function getCaps(): RrCaps { return capsCache; }
export function useCaps(): RrCaps {
  return useSyncExternalStore(sub, () => capsCache, () => DEFAULT_CAPS);
}
export function updateCaps(patch: Partial<RrCaps>) {
  capsCache = {
    ...capsCache, ...patch,
    cooldowns: { ...capsCache.cooldowns, ...(patch.cooldowns ?? {}) },
    dailyActionLimit: { ...capsCache.dailyActionLimit, ...(patch.dailyActionLimit ?? {}) },
  };
  write(STORAGE.caps, capsCache);
}
export function resetCaps() { capsCache = DEFAULT_CAPS; write(STORAGE.caps, capsCache); }
export function getUsageFor(user = "@me"): RrUsage { return getUsage(user); }
export function useUsageFor(user = "@me"): RrUsage {
  return useSyncExternalStore(sub, () => getUsage(user), () => ({ day: "", weekStart: "", dayTotal: 0, weekTotal: 0, actionCounts: {}, lastAction: {} }));
}

/* ============================================================
 * Analytics
 * ============================================================ */

export type RrAnalytics = {
  circulating: number;
  earnedTotal: number;
  redeemedTotal: number;
  socialRewardsOffered: number;
  uniqueClaimers: number;
  pendingClaims: number;
  approvedClaims: number;
  earnRulesActive: number;
  spendRulesActive: number;
  socialRulesActive: number;
  streakActiveUsers: number;
  streakLongestActive: number;
  streakMilestonesActive: number;
  streakRewardsOffered: number;
};

export function computeAnalytics(): RrAnalytics {
  const circulating = readBalance();
  const claims = claimsCache;
  const earnedFromSocial = claims.filter((c) => c.status === "approved").reduce((s, c) => s + c.amount, 0);
  const uniqueClaimers = new Set(claims.map((c) => c.userId)).size;
  const states = Object.values(streakStateCache);
  return {
    circulating,
    earnedTotal: 12_400_000 + earnedFromSocial,
    redeemedTotal: 4_180_000,
    socialRewardsOffered: socialCache.filter((r) => r.enabled).reduce((s, r) => s + r.reward, 0),
    uniqueClaimers,
    pendingClaims: claims.filter((c) => c.status === "pending").length,
    approvedClaims: claims.filter((c) => c.status === "approved").length,
    earnRulesActive: rulesCache.filter((r) => r.enabled).length,
    spendRulesActive: spendCache.filter((r) => r.enabled).length,
    socialRulesActive: socialCache.filter((r) => r.enabled).length,
    streakActiveUsers: states.filter((s) => s.current > 0).length,
    streakLongestActive: states.reduce((m, s) => Math.max(m, s.current), 0),
    streakMilestonesActive: streakCfgCache.milestones.filter((m) => m.enabled).length,
    streakRewardsOffered: streakCfgCache.milestones.filter((m) => m.enabled).reduce((s, m) => s + m.reward, 0),
  };
}
let analyticsSnap: RrAnalytics | null = null;
let analyticsKey = "";
function getAnalyticsSnap(): RrAnalytics {
  const key = `${rulesCache.length}|${socialCache.length}|${spendCache.length}|${claimsCache.length}|${streakCfgCache.milestones.length}|${streakCfgCache.enabled}|${Object.keys(streakStateCache).length}|${typeof window !== "undefined" ? localStorage.getItem(STORAGE.balance) ?? "" : ""}`;
  if (analyticsSnap && analyticsKey === key) return analyticsSnap;
  analyticsKey = key;
  analyticsSnap = computeAnalytics();
  return analyticsSnap;
}
function invalidateAnalytics() { analyticsSnap = null; analyticsKey = ""; }
export function useRrAnalytics(): RrAnalytics {
  return useSyncExternalStore(sub, getAnalyticsSnap, getAnalyticsSnap);
}

/* ============================================================
 * Streaks — admin config + per-user state + auto award
 * ============================================================ */

export function getStreakConfig(): RrStreakConfig { return streakCfgCache; }
export function useStreakConfig(): RrStreakConfig {
  return useSyncExternalStore(sub, () => streakCfgCache, () => DEFAULT_STREAK);
}
export function updateStreakConfig(patch: Partial<Omit<RrStreakConfig, "milestones">>) {
  streakCfgCache = { ...streakCfgCache, ...patch };
  write(STORAGE.streakCfg, streakCfgCache);
}
export function updateStreakMilestone(id: string, patch: Partial<RrStreakMilestone>) {
  streakCfgCache = {
    ...streakCfgCache,
    milestones: streakCfgCache.milestones.map((m) => m.id === id ? { ...m, ...patch } : m),
  };
  write(STORAGE.streakCfg, streakCfgCache);
}
export function addStreakMilestone(m: Omit<RrStreakMilestone, "id"> & { id?: string }) {
  const id = m.id ?? `st_${Math.random().toString(36).slice(2, 7)}`;
  streakCfgCache = { ...streakCfgCache, milestones: [...streakCfgCache.milestones, { ...m, id }].sort((a, b) => a.days - b.days) };
  write(STORAGE.streakCfg, streakCfgCache);
}
export function removeStreakMilestone(id: string) {
  streakCfgCache = { ...streakCfgCache, milestones: streakCfgCache.milestones.filter((m) => m.id !== id) };
  write(STORAGE.streakCfg, streakCfgCache);
}
export function resetStreakConfig() {
  streakCfgCache = DEFAULT_STREAK;
  write(STORAGE.streakCfg, streakCfgCache);
}

const todayKey = () => new Date().toISOString().slice(0, 10);
const dayDiff = (a: string, b: string) => Math.round((Date.parse(b) - Date.parse(a)) / 86_400_000);

export function getStreakState(user = "@me"): RrStreakState {
  return streakStateCache[user] ?? EMPTY_STREAK;
}
const EMPTY_STREAK: RrStreakState = { current: 0, longest: 0, lastDay: null, claimedMilestones: [] };
export function useStreakState(user = "@me"): RrStreakState {
  // Stable snapshot: same reference between ticks unless cache for this user changes.
  return useSyncExternalStore(
    sub,
    () => streakStateCache[user] ?? EMPTY_STREAK,
    () => EMPTY_STREAK,
  );
}

export type StreakTickResult = {
  current: number;
  longest: number;
  awarded: { milestone: RrStreakMilestone; amount: number }[];
  changed: boolean;
};

/**
 * Record activity for today. Returns updated state + any milestone rewards
 * automatically credited to the user's RR wallet.
 *
 * Call sites:
 *   • dashboard load (qualifier === "login" | "any_activity")
 *   • trade log success (qualifier === "trade_log" | "any_activity")
 */
export function tickStreak(user = "@me"): StreakTickResult {
  if (!streakCfgCache.enabled) {
    const s = getStreakState(user);
    return { current: s.current, longest: s.longest, awarded: [], changed: false };
  }
  const prev = getStreakState(user);
  const today = todayKey();
  if (prev.lastDay === today) {
    return { current: prev.current, longest: prev.longest, awarded: [], changed: false };
  }
  const rawDiff = prev.lastDay ? dayDiff(prev.lastDay, today) : 1;
  // Grace window: a 2-day gap still counts as "next day" if within graceHours of midnight.
  const graceMs = (streakCfgCache.graceHours ?? 0) * 3_600_000;
  const nowOffset = Date.now() - Date.parse(today);
  const withinGrace = rawDiff === 2 && nowOffset <= graceMs;
  const isNextDay = rawDiff === 1 || withinGrace;
  const nextCurrent = isNextDay ? prev.current + 1 : 1;

  // Determine milestones BEFORE committing wallet writes
  const hits = streakCfgCache.milestones.filter(
    (m) => m.enabled && m.days === nextCurrent && !prev.claimedMilestones.includes(m.id),
  );

  const next: RrStreakState = {
    ...prev,
    current: nextCurrent,
    lastDay: today,
    longest: Math.max(prev.longest, nextCurrent),
    claimedMilestones: [...prev.claimedMilestones, ...hits.map((h) => h.id)],
  };

  // Commit state FIRST so any subscriber re-render sees the new streak,
  // then credit wallets (each credit triggers its own emit).
  streakStateCache = { ...streakStateCache, [user]: next };
  write(STORAGE.streakState, streakStateCache);

  const awarded = hits.map((m) => {
    creditWalletDirect(m.reward, `Streak — ${m.label} (${m.days}d)`, user);
    return { milestone: m, amount: m.reward };
  });

  return { current: next.current, longest: next.longest, awarded, changed: true };
}

/** Admin override: reset a user's streak (e.g. fraud) */
export function resetUserStreak(user: string) {
  if (!streakStateCache[user]) return;
  streakStateCache = { ...streakStateCache, [user]: { current: 0, longest: streakStateCache[user].longest, lastDay: null, claimedMilestones: [] } };
  write(STORAGE.streakState, streakStateCache);
}


/* ============================================================
 * Subscribe helper (shared)
 * ============================================================ */
function sub(cb: () => void) {
  listeners.add(cb);
  const onStorage = () => cb();
  if (typeof window !== "undefined") window.addEventListener("rb-rr-rules-update", onStorage);
  return () => {
    listeners.delete(cb);
    if (typeof window !== "undefined") window.removeEventListener("rb-rr-rules-update", onStorage);
  };
}
