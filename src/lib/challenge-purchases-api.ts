import { apiRequest } from "@/lib/api";

const AUTH_STORAGE_KEY = "rb_auth_session";

type StoredSession = {
  token?: string | null;
};

function readToken() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    return (JSON.parse(raw) as StoredSession).token ?? null;
  } catch {
    return null;
  }
}

export type ChallengePurchaseStep =
  | "buy_click"
  | "checkout"
  | "reward_chosen"
  | "claim_guide_viewed"
  | "finalized"
  | "intent_created"
  | "redirected_to_partner"
  | "pending_purchase"
  | "user_marked_completed"
  | "proof_submitted"
  | "under_review"
  | "approved"
  | "rejected"
  | "reward_credited";

export type ChallengePurchaseRow = {
  id: string;
  buyerName?: string | null;
  buyerEmail?: string;
  firm: string;
  program: string;
  step: ChallengePurchaseStep;
  amountUsd: number;
  originalAmountUsd?: number;
  rrPoints: number;
  rewardPreference: "cashback" | "rr" | "mixed";
  when: string;
  source?: string;
  reference?: string;
  brandId?: string | null;
  programId?: string | null;
  accountId?: string | null;
  accountSize?: string | null;
  market?: string | null;
  promoCode?: string | null;
  cashbackLabel?: string | null;
  partnerTrackingUrl?: string | null;
  guestSessionId?: string | null;
  purchaseSessionReference?: string | null;
  proofUrls?: string[];
  statusHistory?: Array<{ status: string; at: string; note?: string }>;
  linkedClaimId?: number | null;
  linkedClaimStatus?: string | null;
};

export type ChallengePurchaseAdminBoard = {
  summary: {
    totalBuyClicks: number;
    finalizedPurchases: number;
    gmvTracked: number;
    rrPointsEmitted: number;
    conversionRate: number;
  };
  topFirms: Array<{ firm: string; gmv: number }>;
  rewardMix: { cashback: number; rr: number; mixed: number };
  funnel: Array<{ step: ChallengePurchaseStep; count: number; pct: number }>;
  rows: ChallengePurchaseRow[];
};

export type ChallengePurchaseMyBoard = {
  rows: ChallengePurchaseRow[];
};

export async function fetchChallengePurchaseAdminBoard() {
  const response = await apiRequest<ChallengePurchaseAdminBoard>("/challenge-purchase/admin/board", {
    method: "GET",
    token: readToken(),
  });
  if (!response.payload) throw new Error("Missing challenge purchases payload");
  return response.payload;
}

export async function fetchMyChallengePurchases() {
  const response = await apiRequest<ChallengePurchaseMyBoard>("/challenge-purchase/my", {
    method: "GET",
    token: readToken(),
  });
  if (!response.payload) throw new Error("Missing challenge purchases payload");
  return response.payload;
}

export async function trackChallengePurchaseEvent(input: {
  firm: string;
  category?: string;
  program?: string;
  accountSize?: string;
  amountUsd?: number;
  rrPoints?: number;
  rewardPreference?: "cashback" | "rr" | "mixed";
  step: ChallengePurchaseStep;
  source?: string;
  note?: string;
  reference?: string;
  email?: string;
}) {
  const response = await apiRequest<{
    id: number;
    reference?: string | null;
    step: ChallengePurchaseStep;
  }>("/challenge-purchase/track", {
    method: "POST",
    token: readToken(),
    body: input,
  });
  return response.payload;
}

export type PurchaseRewardPreference = "cashback" | "rr" | "mixed";

export async function createChallengePurchaseSession(input: {
  firm: string;
  category?: string;
  brandId?: string;
  program?: string;
  programId?: string;
  accountId?: string;
  accountSize?: string;
  market?: string;
  amountUsd?: number;
  originalAmountUsd?: number;
  rrPoints?: number;
  cashbackLabel?: string;
  promoCode?: string;
  rewardPreference?: PurchaseRewardPreference;
  partnerTrackingUrl: string;
  source?: string;
  guestSessionId?: string;
  email?: string;
  attribution?: Record<string, unknown>;
  deviceMetadata?: Record<string, unknown>;
}) {
  const response = await apiRequest<{
    id: number;
    reference: string;
    status: ChallengePurchaseStep;
    partnerTrackingUrl: string;
  }>("/challenge-purchase/session", {
    method: "POST",
    token: readToken(),
    body: input,
  });
  if (!response.payload) throw new Error("Checkout session could not be prepared");
  return response.payload;
}

export async function updateChallengePurchaseSession(input: {
  reference: string;
  status:
    | "redirected_to_partner"
    | "pending_purchase"
    | "user_marked_completed"
    | "proof_submitted"
    | "under_review"
    | "approved"
    | "rejected"
    | "reward_credited";
  email?: string;
  proofUrls?: string[];
  note?: string;
}) {
  const response = await apiRequest<{
    id: number;
    reference: string;
    status: ChallengePurchaseStep;
  }>("/challenge-purchase/session/status", {
    method: "POST",
    token: readToken(),
    body: input,
  });
  if (!response.payload) throw new Error("Checkout status could not be updated");
  return response.payload;
}
