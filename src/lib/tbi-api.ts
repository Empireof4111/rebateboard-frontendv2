import { apiRequest } from "@/lib/api";

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
  cover?: string;
  confidence: TbiConfidence;
  confidenceFactor: number;
  state: TbiState;
  visibility: string;
  status: string;
  trustLabel: string;
  scoreDisplay: string;
  rawScore: number;
  finalScore: number;
  preliminaryScore: number;
  riskPenalty: number;
  components: {
    ut: number;
    pr: number;
    ts: number;
    rc: number;
    tc: number;
    cx: number;
  };
  componentExplanations: Record<string, string>;
  reviewCount: number;
  verifiedReviewCount: number;
  weightedReviewMass: number;
  reviewDistribution: Array<{ stars: number; count: number }>;
  complaints: {
    total: number;
    pending: number;
    resolved: number;
  };
  riskEvents: Array<{
    kind: string;
    impact: number;
    title: string;
    detail: string;
  }>;
  trustEngine: {
    formula: string;
    rawScore: number;
    confidenceFactor: number;
    riskPenalty: number;
    computedFinalScore?: number;
    finalScore: number;
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

export type TbiAdminPatch = Partial<{
  visibility: string;
  status: string;
  stateOverride: TbiState;
  confidenceOverride: TbiConfidence;
  manualFinalScore: number | null;
  manualRiskPenalty: number;
  unlockFullTbi: boolean;
  suspendVisibility: boolean;
  riskEvents: TbiProfile["riskEvents"];
  riskSignals: Record<string, unknown>;
  performanceInsights: TbiProfile["performanceInsights"];
  trust: Record<string, unknown>;
}>;

export async function fetchTbiTop() {
  const response = await apiRequest<TbiProfile[]>("/tbi/top", { method: "GET" });
  return response.payload ?? [];
}

export async function fetchTbiExplore() {
  const response = await apiRequest<TbiProfile[]>("/tbi/explore", { method: "GET" });
  return response.payload ?? [];
}

export async function fetchTbiBrand(slug: string) {
  const response = await apiRequest<TbiProfile>(`/tbi/brand/${slug}`, { method: "GET" });
  return response.payload ?? null;
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
  if (state === "full") return "Full Verified";
  if (state === "partial") return "Limited Data";
  return "Preliminary";
}

export function tbiStateTone(state: TbiState) {
  if (state === "full") return "bg-emerald-500/15 text-emerald-300 ring-emerald-400/30";
  if (state === "partial") return "bg-amber-500/15 text-amber-300 ring-amber-400/30";
  return "bg-fuchsia-500/15 text-fuchsia-300 ring-fuchsia-400/30";
}

export function tbiConfidenceTone(confidence: TbiConfidence) {
  if (confidence === "High") return "text-emerald-300";
  if (confidence === "Medium") return "text-amber-300";
  return "text-fuchsia-300";
}

export function tbiLabelTone(label: string) {
  if (label === "Elite Trusted" || label === "Highly Trusted") {
    return "text-emerald-300";
  }
  if (label === "Trusted" || label === "Moderate Risk") {
    return "text-amber-300";
  }
  return "text-rose-300";
}
