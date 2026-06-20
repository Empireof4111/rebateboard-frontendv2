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
  | "finalized";

export type ChallengePurchaseRow = {
  id: string;
  buyerEmail?: string;
  firm: string;
  program: string;
  step: ChallengePurchaseStep;
  amountUsd: number;
  rrPoints: number;
  rewardPreference: "cashback" | "rr" | "mixed";
  when: string;
  source?: string;
  reference?: string;
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
