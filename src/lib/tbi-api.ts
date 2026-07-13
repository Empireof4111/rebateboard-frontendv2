import { API_BASE_URL, apiRequest } from "@/lib/api";

const AUTH_STORAGE_KEY = "rb_auth_session";

function readToken() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { token?: string | null };
    return parsed.token ?? null;
  } catch {
    return null;
  }
}

export type TbiState = "preliminary" | "partial" | "full";
export type TbiVisibility = "hidden" | TbiState;
export type PlatformVisibility = "draft" | "tbi_only" | "public" | "unpublished" | "suspended";
export type TbiConfidence = "High" | "Medium" | "Low";
export type TbiCategory = "Prop Firm" | "Broker" | "Exchange" | "Tool";

export type TbiProfile = {
  id: string;
  slug: string;
  name: string;
  category: TbiCategory;
  fullCategory: string;
  website: string;
  region: string;
  logo?: string;
  logoUrl?: string;
  thumbnail?: string;
  brandLogo?: string;
  favicon?: string;
  cover?: string;
  identity?: {
    logo?: string;
    logoUrl?: string;
    website?: string;
    [key: string]: unknown;
  };
  profile?: {
    logo?: string;
    logoUrl?: string;
    [key: string]: unknown;
  };
  confidence: TbiConfidence;
  confidenceFactor: number;
  state: TbiState;
  scoreState?: TbiState;
  scoreStateLabel?: string;
  lastUpdated?: string;
  visibility: string;
  platformVisibility?: PlatformVisibility;
  tbiVisibility?: TbiVisibility;
  adminOverrideStatus?: TbiState | null;
  effectiveStatus?: TbiState;
  calculatedUnlockStatus?: TbiState;
  rankingEligible?: boolean;
  rankingEligibilityReasons?: string[];
  rankingExcluded?: boolean;
  status: string;
  trustLabel: string;
  scoreDisplay: string;
  rawScore: number;
  finalScore: number;
  preliminaryScore: number;
  rawScore100?: number;
  finalScore100?: number;
  score100?: number;
  preliminaryScore100?: number;
  riskPenalty: number;
  components: {
    ut: number;
    pr: number;
    ts: number;
    rc: number;
    tc: number;
    cx: number;
  };
  componentBreakdown?: Array<{
    key: keyof TbiProfile["components"];
    code: string;
    label: string;
    score: number;
    weight: number;
    weightDecimal: number;
    contribution: number;
    explanation: string;
    source: string;
  }>;
  componentExplanations: Record<string, string>;
  reviewCount: number;
  verifiedReviewCount: number;
  weightedReviewMass: number;
  reviewDistribution: Array<{ stars: number; count: number }>;
  ratingDistribution?: Array<{
    rating: number;
    count: number;
    percentage: number;
    verified: number;
    unverified: number;
    effectOnUserTrust: number;
  }>;
  reviewStats?: {
    totalReviews: number;
    verifiedTraderReviews: number;
    activeTraderReviews: number;
    recentReviews: number;
    oldReviews: number;
    averageRawRating: number;
    averageRating5: number;
    weightedRating: number;
    totalWeight: number;
    contributionToUserTrust: number;
    contributionToFinalScore: number;
    rows: Array<{
      id: string;
      reviewer: string;
      rating: number;
      score: number;
      verificationStatus: string;
      activityStatus: string;
      recency: string;
      ageDays: number;
      weight: number;
      weightedScore: number;
      weightedContribution: number;
      reviewStatus: string;
      contributedToTbi: boolean;
    }>;
  };
  reviewWeightRules?: {
    baseReviewWeight: number;
    verifiedTraderMultiplier: number;
    activeTraderMultiplier: number;
    recentReviewMultiplier: number;
    oldReviewMultiplier: number;
  };
  complaints: {
    total: number;
    pending: number;
    resolved: number;
    open?: number;
    rejected?: number;
    invalid?: number;
    trend?: string;
    riskPenaltyImpact?: number;
  };
  complaintStats?: {
    total: number;
    open: number;
    resolved: number;
    rejected: number;
    invalid: number;
    categories: Array<{ label: string; count: number }>;
    severity: Array<{ label: string; count: number }>;
    trend: string;
    riskPenaltyImpact: number;
    affectsCustomerExperience: boolean;
    affectsPayoutReliability: boolean;
    affectsConfidence: boolean;
    impactExplanation: string;
  };
  activeRiskFlags?: Array<{
    kind: string;
    impact: number;
    title: string;
    detail: string;
  }>;
  riskEvents: Array<{
    kind: string;
    impact: number;
    title: string;
    detail: string;
  }>;
  trustEngine: {
    formula: string;
    formulaParts?: Array<{
      code: string;
      label: string;
      score: number;
      weight: number;
      contribution: number;
      display: string;
    }>;
    rawScore: number;
    confidenceFactor: number;
    riskPenalty: number;
    computedFinalScore?: number;
    finalScore: number;
    scoreSource?: "formula" | "manual" | "preliminary" | string;
    finalScoreNote?: string;
    calculation?: {
      rawScore: number;
      confidenceFactor: number;
      riskPenalty: number;
      computedFinalScore?: number;
      finalScore: number;
      scoreSource?: "formula" | "manual" | "preliminary" | string;
      finalScoreNote?: string;
      expression: string;
    };
  };
  performanceInsights: {
    avgRoi: number;
    avgWinRate: number;
    payoutPatterns: string;
    commonComplaints: string[];
  };
  recentChanges: Array<{
    title: string;
    detail: string;
    impact: number;
  }>;
  improvementActions: string[];
  reviews: Array<{
    id: string;
    user: string;
    verified: boolean;
    activityLevel: string;
    recency: string;
    score: number;
    comment: string;
    proofs: unknown[];
  }>;
  structural: {
    profileCompleteness: number;
    transparencyChecklist: Record<string, boolean>;
    regulationTier: string;
  };
};

function text(value: unknown) {
  const raw = String(value ?? "").trim();
  if (!raw || /^(null|undefined|n\/a|na|none|false|-|—)$/i.test(raw)) return "";
  return raw;
}

function logoText(value: unknown) {
  if (typeof value === "string") return text(value);
  if (value && typeof value === "object") {
    const row = value as Record<string, unknown>;
    return (
      text(row.url) ||
      text(row.src) ||
      text(row.key) ||
      text(row.path) ||
      text(row.logo) ||
      text(row.logoUrl)
    );
  }
  return "";
}

export function tbiMediaUrl(value: unknown) {
  const raw = logoText(value);
  if (!raw) return "";
  if (/^(https?:|data:|blob:)/i.test(raw)) return raw;

  const apiOrigin = API_BASE_URL.replace(/\/api\/v1$/i, "");
  if (raw.startsWith("/api/v1/")) return `${apiOrigin}${raw}`;
  if (raw.startsWith("/file/")) return `${API_BASE_URL}${raw}`;
  if (raw.startsWith("/")) return `${apiOrigin}${raw}`;

  return `${API_BASE_URL}/file/view?key=${encodeURIComponent(raw)}`;
}

export function tbiProfileLogo(profile: Pick<TbiProfile, "logo" | "logoUrl" | "thumbnail" | "brandLogo" | "favicon" | "website" | "identity" | "profile">) {
  const candidates = [
    profile.logo,
    profile.logoUrl,
    profile.thumbnail,
    profile.brandLogo,
    profile.favicon,
    profile.identity?.logo,
    profile.identity?.logoUrl,
    profile.profile?.logo,
    profile.profile?.logoUrl,
  ]
    .map((value) => logoText(value))
    .filter(Boolean);

  const direct = candidates.find((value) => value && !/^(null|undefined)$/i.test(value));
  if (direct) return tbiMediaUrl(direct);

  const website = typeof profile.website === "string" ? profile.website.trim() : "";
  if (!website) return "";
  const host = website
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .split("/")[0];
  return host ? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=128` : "";
}

export type TbiAdminPatch = Partial<{
  visibility: string;
  platformVisibility: PlatformVisibility;
  tbiVisibility: TbiVisibility;
  status: string;
  stateOverride: TbiState;
  overrideReason: string;
  confidenceOverride: TbiConfidence;
  manualFinalScore: number | null;
  manualRiskPenalty: number;
  unlockFullTbi: boolean;
  suspendVisibility: boolean;
  rankingEligible: boolean;
  rankingExcluded: boolean;
  rankingExclusionReason: string;
  riskEvents: TbiProfile["riskEvents"];
  riskSignals: Record<string, unknown>;
  performanceInsights: TbiProfile["performanceInsights"];
  trust: Record<string, unknown>;
}>;

export async function fetchTbiTop() {
  try {
    const response = await apiRequest<TbiProfile[]>("/tbi/top", {
      method: "GET",
      cache: "no-store",
    });
    return response.payload ?? [];
  } catch {
    return [];
  }
}

export async function fetchTbiExplore() {
  try {
    const response = await apiRequest<TbiProfile[]>("/tbi/explore", {
      method: "GET",
      cache: "no-store",
    });
    return response.payload ?? [];
  } catch {
    return [];
  }
}

export async function fetchTbiBrand(slug: string) {
  try {
    const response = await apiRequest<TbiProfile>(`/tbi/brand/${slug}`, {
      method: "GET",
      cache: "no-store",
    });
    return response.payload ?? null;
  } catch {
    return null;
  }
}

export async function fetchAdminTbiProfiles() {
  const response = await apiRequest<TbiProfile[]>("/tbi/admin/list", {
    method: "GET",
    token: readToken(),
  });
  return response.payload ?? [];
}

export async function updateAdminTbiProfile(brandId: string, patch: TbiAdminPatch) {
  const response = await apiRequest<TbiProfile>(`/tbi/admin/${brandId}`, {
    method: "PUT",
    token: readToken(),
    body: patch,
  });
  if (!response.payload) throw new Error("Missing TBI payload");
  return response.payload;
}

export function tbiStateLabel(state: TbiState) {
  if (state === "full") return "Full Unlock";
  if (state === "partial") return "Partial Unlock";
  return "Preliminary";
}

export function tbiStateTone(state: TbiState) {
  if (state === "full") return "bg-emerald-500/15 text-emerald-300 ring-emerald-400/30";
  if (state === "partial") return "bg-sky-500/15 text-sky-300 ring-sky-400/30";
  return "bg-violet-500/12 text-violet-200 ring-violet-300/25";
}

export function tbiConfidenceTone(confidence: TbiConfidence) {
  if (confidence === "High") return "text-emerald-300";
  if (confidence === "Medium") return "text-sky-300";
  return "text-violet-300";
}

export function tbiLabelTone(label: string) {
  if (label === "Elite Trusted" || label === "Highly Trusted") {
    return "text-emerald-300";
  }
  if (label === "Trusted" || label === "Moderate Risk") {
    return "text-sky-300";
  }
  return "text-rose-300";
}

export function tbiScore100(profile: Pick<TbiProfile, "finalScore" | "finalScore100" | "score100">) {
  const direct = Number(profile.finalScore100 ?? profile.score100);
  if (Number.isFinite(direct) && direct > 0) return Math.round(direct);
  const fallback = Number(profile.finalScore ?? 0);
  if (!Number.isFinite(fallback) || fallback <= 0) return 0;
  return Math.round(fallback > 10 ? fallback : fallback * 10);
}
