/**
 * TBI Brand Onboarding Engine
 * ----------------------------
 * Single source of truth for the B2B trust onboarding flow:
 *   - category configs (prop firm, broker, exchange, tool)
 *   - score calculation (preliminary, partial, full)
 *   - submission store (sessionStorage backed, reactive via useSyncExternalStore)
 *   - mock magic-link auth for the brand Trust Dashboard
 *   - admin queue helpers (approve / reject / flag)
 *
 * When backend lands, swap the storage helpers — the React surface stays.
 */
import { useSyncExternalStore } from "react";

/* ============================================================
 * TYPES
 * ============================================================ */

export type BrandCategory = "prop_firm" | "broker" | "exchange" | "tool";

export type TrustScoreMode = "none" | "preliminary" | "partial" | "full";

export type ReviewStatus = "pending" | "approved" | "rejected" | "changes_requested";

export type UploadedFile = {
  id: string;
  name: string;
  size?: number;
  status: "uploading" | "uploaded" | "error";
  url?: string; // data URL in mock mode
};

export type BrandApplicationSettings = {
  enabled: boolean;
  updatedAt?: string;
};

export type BrandSubmission = {
  id: string;
  category: BrandCategory;
  brandName: string;
  contactEmail: string;
  contactName: string;
  status: ReviewStatus;
  onboardingStatus: "draft" | "submitted" | "published" | "rejected";
  submittedAt: string;
  reviewedAt?: string;
  reviewNote?: string;
  // form data (free-shape; keyed by step)
  data: Record<string, any>;
  // synced trust state
  preliminaryScore: number | null; // capped 0–6.5
  trustScore: number | null;       // 0–10 once unlocked
  trustScoreMode: TrustScoreMode;
  reviewCount: number;
  completionPercent: number;
  publicSlug?: string;
  brandToken: string; // mock magic-link token
  breakdown: TrustBreakdown;
};

export type TrustBreakdown = {
  transparency: number;     // 0–10
  proof: number;            // 0–10
  community: number | null; // 0–10 or null when locked
  conditions: number;       // 0–10
  experience: number | null;// 0–10 or null when locked
};

/* ============================================================
 * CATEGORY CONFIGS (steps + per-category fields)
 * ============================================================ */

export const CATEGORY_META: Record<BrandCategory, { label: string; tagline: string; emoji: string }> = {
  prop_firm: { label: "Prop Firm",       tagline: "Funded trader programs & challenges", emoji: "🏆" },
  broker:    { label: "Broker",          tagline: "Forex, CFD, futures brokers",         emoji: "🏦" },
  exchange:  { label: "Crypto Exchange", tagline: "Spot, derivatives & on-chain",        emoji: "₿"  },
  tool:      { label: "Trading Tool",    tagline: "Software, signals, analytics",        emoji: "🛠️" },
};

export const STEP_DEFS: { id: string; title: string; subtitle: string; description: string }[] = [
  { id: "identity",      title: "Brand Identity",        subtitle: "Step 1",          description: "Tell traders who you are." },
  { id: "model",         title: "How does your firm operate?", subtitle: "Business Model", description: "Help traders understand how your brand works." },
  { id: "proof",         title: "Trust & Proof",         subtitle: "Verification",    description: "Upload documents that strengthen your trust foundation." },
  { id: "infra",         title: "Platform & Infrastructure", subtitle: "Tech Stack",  description: "Where and how traders actually trade with you." },
  { id: "community",     title: "Community & Presence",  subtitle: "Social Proof",    description: "Where traders can find and verify you." },
  { id: "economics",     title: "Economics & Conditions", subtitle: "Pricing",        description: "Costs, splits, and payout policies." },
  { id: "rebateboard",   title: "RebateBoard Integration", subtitle: "Partnership",   description: "Cashback, codes, and featured placement." },
  { id: "review",        title: "Final Review",          subtitle: "Submit",          description: "Lock in your trust profile." },
];

/* ============================================================
 * SCORING ENGINE
 * ============================================================ */

const PRELIM_CAP = 6.5;
const PARTIAL_MIN = 5;
const FULL_MIN = 10;

/** Compute completion percentage based on filled fields per step. */
export function computeCompletion(data: Record<string, any>): number {
  const steps = STEP_DEFS.filter((s) => s.id !== "review");
  const filled = steps.reduce((acc, s) => {
    const stepData = data[s.id] ?? {};
    const keys = Object.keys(stepData);
    const nonEmpty = keys.filter((k) => {
      const v = stepData[k];
      if (Array.isArray(v)) return v.length > 0;
      if (typeof v === "string") return v.trim().length > 0;
      return v != null;
    });
    return acc + (keys.length === 0 ? 0 : nonEmpty.length / Math.max(keys.length, 4));
  }, 0);
  return Math.round((filled / steps.length) * 100);
}

/** Compute the trust breakdown from raw submission data. */
export function computeBreakdown(data: Record<string, any>, reviewCount: number): TrustBreakdown {
  const identity = data.identity ?? {};
  const proof = data.proof ?? {};
  const economics = data.economics ?? {};
  const community = data.community ?? {};
  const infra = data.infra ?? {};

  const transparency = Math.min(10,
    (identity.brandName ? 1.5 : 0) +
    (identity.website ? 1.2 : 0) +
    (identity.yearFounded ? 1.0 : 0) +
    (identity.country ? 0.8 : 0) +
    (identity.regulation ? 2.5 : 0) +
    (identity.entityName ? 1.0 : 0) +
    (proof.registrationDocs?.length ? 2.0 : 0)
  );

  const proofScore = Math.min(10,
    (proof.registrationDocs?.length ? 2.5 : 0) +
    (proof.payoutProof?.length ? 3.0 : 0) +
    (proof.reserveProof?.length ? 2.0 : 0) +
    (Number(proof.activeTraders) > 0 ? 1.0 : 0) +
    (Number(proof.fundedTraders) > 0 ? 1.5 : 0)
  );

  const conditions = Math.min(10,
    (economics.profitSplit ? 2.0 : 0) +
    (economics.payoutFrequency ? 2.0 : 0) +
    (economics.refundPolicy ? 1.5 : 0) +
    (economics.hiddenFees === "no" ? 2.5 : economics.hiddenFees === "yes" ? 0.5 : 0) +
    (economics.avgChallengeCost ? 1.0 : 0) +
    (infra.platforms?.length ? 1.0 : 0)
  );

  const communityCount =
    (community.trustpilot ? 1 : 0) +
    (community.discord ? 1 : 0) +
    (community.telegram ? 1 : 0) +
    (community.twitter ? 1 : 0) +
    (community.youtube ? 1 : 0) +
    (community.instagram ? 1 : 0);
  const communityScore = reviewCount < PARTIAL_MIN
    ? null
    : Math.min(10, communityCount * 1.2 + Math.min(reviewCount, 50) * 0.1);

  const experienceScore = reviewCount < FULL_MIN ? null : Math.min(10, 6 + Math.log2(reviewCount) * 0.4);

  return {
    transparency: round(transparency),
    proof: round(proofScore),
    community: communityScore == null ? null : round(communityScore),
    conditions: round(conditions),
    experience: experienceScore == null ? null : round(experienceScore),
  };
}

function round(n: number) { return Math.round(n * 10) / 10; }

/** Compute score, capped according to unlock state. */
export function computeScore(breakdown: TrustBreakdown, reviewCount: number): { score: number | null; mode: TrustScoreMode; cap: number } {
  const submitted = breakdown.transparency > 0 || breakdown.proof > 0;
  if (!submitted) return { score: null, mode: "none", cap: 10 };

  // Structural avg = transparency, proof, conditions
  const structural = (breakdown.transparency + breakdown.proof + breakdown.conditions) / 3;

  if (reviewCount < PARTIAL_MIN) {
    // Preliminary — capped at 6.5
    const score = Math.min(PRELIM_CAP, round(structural * 0.65));
    return { score: round(score), mode: "preliminary", cap: PRELIM_CAP };
  }

  if (reviewCount < FULL_MIN) {
    // Partial — structural 50%, community 50%, capped at ~8.5
    const community = breakdown.community ?? 6;
    const score = Math.min(8.5, structural * 0.5 + community * 0.5);
    return { score: round(score), mode: "partial", cap: 10 };
  }

  // Full — structural 40% + experience 60%
  const experience = breakdown.experience ?? 7;
  const score = round(structural * 0.4 + experience * 0.6);
  return { score, mode: "full", cap: 10 };
}

export function unlockState(reviewCount: number): "locked" | "partial" | "full" {
  if (reviewCount >= FULL_MIN) return "full";
  if (reviewCount >= PARTIAL_MIN) return "partial";
  return "locked";
}

export const UNLOCK_THRESHOLDS = { partial: PARTIAL_MIN, full: FULL_MIN, prelimCap: PRELIM_CAP };

/** Improvement suggestions sorted by impact. */
export function improvementSuggestions(submission: BrandSubmission): { text: string; scoreImpact?: string; priority?: "high" | "medium" | "low" }[] {
  const out: { text: string; scoreImpact?: string; priority?: "high" | "medium" | "low" }[] = [];
  const proof = submission.data.proof ?? {};
  const community = submission.data.community ?? {};
  const economics = submission.data.economics ?? {};

  if (!proof.payoutProof?.length) out.push({ text: "Upload payout proof", scoreImpact: "+0.6", priority: "high" });
  if (!proof.registrationDocs?.length) out.push({ text: "Add company registration documents", scoreImpact: "+0.5", priority: "high" });
  if (submission.reviewCount < PARTIAL_MIN) out.push({ text: `Get ${PARTIAL_MIN - submission.reviewCount} more verified review${PARTIAL_MIN - submission.reviewCount === 1 ? "" : "s"} to begin unlocking`, priority: "high" });
  else if (submission.reviewCount < FULL_MIN) out.push({ text: `Get ${FULL_MIN - submission.reviewCount} more reviews to fully unlock TBI`, priority: "high" });
  if (!proof.reserveProof?.length) out.push({ text: "Add reserve / liquidity proof", scoreImpact: "+0.4", priority: "medium" });
  if (!community.trustpilot) out.push({ text: "Link your Trustpilot profile", scoreImpact: "+0.2", priority: "low" });
  if (!economics.refundPolicy) out.push({ text: "Publish refund policy", scoreImpact: "+0.2", priority: "low" });
  return out.slice(0, 6);
}

/* ============================================================
 * APPLICATION SETTINGS + DRAFTS
 * ============================================================ */

const SETTINGS_KEY = "rb-brand-application-settings";
const DRAFT_KEY = "rb-brand-application-drafts";
const STORAGE_KEY = "rb-tbi-submissions";
const DEFAULT_BRAND_APPLICATION_SETTINGS: BrandApplicationSettings = { enabled: true };
let cache: BrandSubmission[] | null = null;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((fn) => fn());
}

function readJson<T>(key: string, fallback: T, storage: Storage | undefined): T {
  if (!storage) return fallback;
  try {
    const raw = storage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T, storage: Storage | undefined) {
  if (!storage) return;
  try {
    storage.setItem(key, JSON.stringify(value));
  } catch {}
}

function getLocalStorage(): Storage | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}

export function getBrandApplicationSettings(): BrandApplicationSettings {
  return readJson<BrandApplicationSettings>(SETTINGS_KEY, DEFAULT_BRAND_APPLICATION_SETTINGS, getLocalStorage());
}

export function setBrandApplicationSettings(patch: Partial<BrandApplicationSettings>): BrandApplicationSettings {
  const next = { ...getBrandApplicationSettings(), ...patch, updatedAt: new Date().toISOString() };
  writeJson(SETTINGS_KEY, next, getLocalStorage());
  emit();
  return next;
}

export function useBrandApplicationSettings(): BrandApplicationSettings {
  return useSyncExternalStore(subscribe, getBrandApplicationSettings, getBrandApplicationSettings);
}

export function getApplicationDraft(category: BrandCategory): Record<string, any> | null {
  const drafts = readJson<Record<string, Record<string, any>>>(DRAFT_KEY, {}, getLocalStorage());
  return drafts[category] ?? null;
}

export function saveApplicationDraft(category: BrandCategory, data: Record<string, any>) {
  const storage = getLocalStorage();
  const drafts = readJson<Record<string, Record<string, any>>>(DRAFT_KEY, {}, storage);
  writeJson(DRAFT_KEY, { ...drafts, [category]: data }, storage);
  emit();
}

export function clearApplicationDraft(category: BrandCategory) {
  const storage = getLocalStorage();
  const drafts = readJson<Record<string, Record<string, any>>>(DRAFT_KEY, {}, storage);
  delete drafts[category];
  writeJson(DRAFT_KEY, drafts, storage);
  emit();
}

/* ============================================================
 * SUBMISSION STORE (in-memory + sessionStorage)
 * ============================================================ */

function load(): BrandSubmission[] {
  if (cache) return cache;
  if (typeof window === "undefined") { cache = SEED; return cache; }
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) { cache = JSON.parse(raw); return cache!; }
  } catch {}
  cache = SEED;
  return cache;
}

function save(next: BrandSubmission[]) {
  cache = next;
  if (typeof window !== "undefined") {
    try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
  }
  emit();
}

function subscribe(fn: () => void) { listeners.add(fn); return () => listeners.delete(fn); }

export function useBrandSubmissions(): BrandSubmission[] {
  return useSyncExternalStore(subscribe, () => load(), () => load());
}

export function useBrandSubmission(id: string): BrandSubmission | undefined {
  const all = useBrandSubmissions();
  return all.find((s) => s.id === id);
}

export function useBrandSubmissionByToken(token: string): BrandSubmission | undefined {
  const all = useBrandSubmissions();
  return all.find((s) => s.brandToken === token);
}

export function getSubmissions(): BrandSubmission[] { return load(); }

export function createSubmission(partial: { category: BrandCategory; brandName: string; contactEmail: string; contactName: string; data?: Record<string, any> }): BrandSubmission {
  const id = `tbi_${Math.random().toString(36).slice(2, 10)}`;
  const brandToken = `tk_${Math.random().toString(36).slice(2, 14)}`;
  const data = partial.data ?? {};
  const breakdown = computeBreakdown(data, 0);
  const { score, mode } = computeScore(breakdown, 0);
  const sub: BrandSubmission = {
    id,
    category: partial.category,
    brandName: partial.brandName,
    contactEmail: partial.contactEmail,
    contactName: partial.contactName,
    status: "pending",
    onboardingStatus: "draft",
    submittedAt: new Date().toISOString(),
    data,
    preliminaryScore: mode === "preliminary" ? score : null,
    trustScore: score,
    trustScoreMode: mode,
    reviewCount: 0,
    completionPercent: computeCompletion(data),
    brandToken,
    breakdown,
    publicSlug: partial.brandName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
  };
  save([sub, ...load()]);
  return sub;
}

export function updateSubmission(id: string, patch: Partial<BrandSubmission> & { data?: Record<string, any> }): BrandSubmission | undefined {
  const all = load();
  const idx = all.findIndex((s) => s.id === id);
  if (idx === -1) return undefined;
  const merged = { ...all[idx], ...patch, data: patch.data ? { ...all[idx].data, ...patch.data } : all[idx].data };
  // recompute synced fields
  const breakdown = computeBreakdown(merged.data, merged.reviewCount);
  const { score, mode } = computeScore(breakdown, merged.reviewCount);
  merged.breakdown = breakdown;
  merged.trustScore = score;
  merged.trustScoreMode = mode;
  merged.preliminaryScore = mode === "preliminary" ? score : null;
  merged.completionPercent = computeCompletion(merged.data);
  const next = [...all];
  next[idx] = merged;
  save(next);
  return merged;
}

export function submitForReview(id: string): BrandSubmission | undefined {
  return updateSubmission(id, { onboardingStatus: "submitted", submittedAt: new Date().toISOString() });
}

export function approveSubmission(id: string, note?: string): BrandSubmission | undefined {
  return updateSubmission(id, { status: "approved", onboardingStatus: "published", reviewedAt: new Date().toISOString(), reviewNote: note });
}

export function rejectSubmission(id: string, note?: string): BrandSubmission | undefined {
  return updateSubmission(id, { status: "rejected", onboardingStatus: "rejected", reviewedAt: new Date().toISOString(), reviewNote: note });
}

export function requestChanges(id: string, note: string): BrandSubmission | undefined {
  return updateSubmission(id, { status: "changes_requested", reviewedAt: new Date().toISOString(), reviewNote: note });
}

/** Bump review count (admin demo helper to simulate trader reviews coming in). */
export function bumpReviewCount(id: string, delta: number) {
  const sub = load().find((s) => s.id === id);
  if (!sub) return;
  updateSubmission(id, { reviewCount: Math.max(0, sub.reviewCount + delta) });
}

/* ============================================================
 * MOCK MAGIC LINK
 * ============================================================ */

export function buildMagicLink(submission: BrandSubmission): string {
  if (typeof window === "undefined") return `/business/trust-dashboard?token=${submission.brandToken}`;
  return `${window.location.origin}/business/trust-dashboard?token=${submission.brandToken}`;
}

/* ============================================================
 * SEED DATA — couple of pending requests so admin queue isn't empty
 * ============================================================ */

const SEED: BrandSubmission[] = [
  {
    id: "tbi_seed01",
    category: "prop_firm",
    brandName: "PrimeEdge Capital",
    contactEmail: "ceo@primeedge.io",
    contactName: "Marcus Reeves",
    status: "pending",
    onboardingStatus: "submitted",
    submittedAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    brandToken: "tk_demoseed01",
    publicSlug: "primeedge-capital",
    reviewCount: 0,
    completionPercent: 92,
    data: {
      identity: { brandName: "PrimeEdge Capital", website: "https://primeedge.io", yearFounded: "2023", country: "Estonia", regulation: "Private Entity", entityName: "PrimeEdge OÜ" },
      model: { challengeType: "two_step", revenueModel: "challenge_fees", payoutType: "real", accountModel: "scaled" },
      proof: { activeTraders: 1240, fundedTraders: 86, registrationDocs: [{ id: "f1", name: "registration.pdf", status: "uploaded" }], payoutProof: [{ id: "f2", name: "payouts-q1.pdf", status: "uploaded" }] },
      infra: { platforms: ["MT5", "cTrader"], liquidityProviders: ["Match-Trade"], technologyProvider: "white_label" },
      community: { trustpilot: "https://trustpilot.com/primeedge", discord: "https://discord.gg/primeedge", twitter: "https://x.com/primeedge" },
      economics: { avgChallengeCost: "$199", profitSplit: "85%", payoutFrequency: "biweekly", refundPolicy: "yes", hiddenFees: "no" },
      rebateboard: { offerCashback: "yes", discountCode: "PRIME15", featuredInterest: "yes" },
    },
    preliminaryScore: 6.1,
    trustScore: 6.1,
    trustScoreMode: "preliminary",
    breakdown: { transparency: 8.0, proof: 7.5, community: null, conditions: 9.0, experience: null },
  },
  {
    id: "tbi_seed02",
    category: "exchange",
    brandName: "Helix DEX",
    contactEmail: "biz@helix.dex",
    contactName: "Anya Volkov",
    status: "pending",
    onboardingStatus: "submitted",
    submittedAt: new Date(Date.now() - 1000 * 60 * 60 * 28).toISOString(),
    brandToken: "tk_demoseed02",
    publicSlug: "helix-dex",
    reviewCount: 6,
    completionPercent: 78,
    data: {
      identity: { brandName: "Helix DEX", website: "https://helix.dex", yearFounded: "2022", country: "Cayman", regulation: "Pending VARA" },
      proof: { registrationDocs: [{ id: "f1", name: "incorp.pdf", status: "uploaded" }] },
      community: { discord: "https://discord.gg/helix", twitter: "https://x.com/helixdex" },
      economics: { profitSplit: "—", payoutFrequency: "instant", hiddenFees: "no" },
    },
    preliminaryScore: null,
    trustScore: 5.8,
    trustScoreMode: "partial",
    breakdown: { transparency: 6.0, proof: 5.5, community: 6.5, conditions: 6.0, experience: null },
  },
];
