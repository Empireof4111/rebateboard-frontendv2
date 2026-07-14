import { apiRequest, type ApiResponse } from "./api";

// ─── Config Types ──────────────────────────────────────────────────────────
export type RrRule = {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
  freeAmount: number;
  premiumAmount: number;
};

export type RrTier = {
  id: string;
  name: string;
  rank: number;
  multiplier: number;
  dailyCap: number;
  requirements: { approvedReviews: number; streakDays: number; verifiedEmail: boolean };
  perks: string[];
};

export type RrCaps = {
  dailyCap: number;
  weeklyCap: number;
  cooldowns: Record<string, number>;
  dailyActionLimit: Record<string, number>;
};

export type RrSocialRule = {
  id: string;
  label: string;
  network: string;
  url: string;
  handle: string;
  reward: number;
  enabled: boolean;
  verification: "handle" | "email" | "manual";
  description: string;
};

export type RrStreakConfig = {
  enabled: boolean;
  qualifier: "login" | "trade_log" | "any_activity";
  graceHours: number;
  milestones: { id: string; label: string; days: number; reward: number; enabled: boolean }[];
};

export type RrSpendRule = {
  id: string;
  label: string;
  description: string;
  category: string;
  accountSize?: string;
  eligibleBrandIds?: number[];
  cost: number;
  tierGate: string | null;
  stock: number | null;
  redeemed: number;
  enabled: boolean;
};

export type RrPlatformSettings = {
  brandApplications?: {
    enabled?: boolean;
    updatedAt?: string | null;
  };
};

export type RrAllConfig = {
  earn_rules: RrRule[];
  tiers: RrTier[];
  caps: RrCaps;
  social_rules: RrSocialRule[];
  streak_config: RrStreakConfig;
  spend_rules: RrSpendRule[];
  platform_settings?: RrPlatformSettings;
};

export type RrClaim = {
  id: number;
  userId: number;
  socialId: string;
  proof: string;
  status: "pending" | "approved" | "rejected";
  amount: number;
  rejectionReason?: string;
  createdAt: string;
  user?: { id: number; name: string; emailAddress: string };
};

export type RrRedemptionClaim = {
  id: number;
  userId: number;
  user?: { id: number; name: string; emailAddress: string } | null;
  spendRuleId: string;
  rewardLabel: string;
  accountSize?: string;
  cost: number;
  brandId: number;
  brandName: string;
  brandSlug?: string;
  brandCategory?: string;
  status: "pending" | "approved" | "rejected" | "fulfilled";
  rejectionReason?: string;
  details?: Record<string, unknown>;
  reviewedById?: number;
  reviewedAt?: string;
  createdAt: string;
  updatedAt?: string;
};

export type RrStats = {
  totalUsersWithRr: number;
  totalRrCirculating: number;
  totalClaims: number;
  pendingClaims: number;
  approvedClaims: number;
};

export type RrUserStreak = {
  id: number;
  userId: number;
  current: number;
  longest: number;
  lastDay: string;
  claimedMilestones: string[];
};

export const rrApi = {
  async getPublicPlatformSettings(): Promise<ApiResponse<RrPlatformSettings>> {
    return apiRequest("/rr/public/platform-settings", { method: "GET", cache: "no-store" });
  },

  async getConfig(token: string): Promise<ApiResponse<RrAllConfig>> {
    return apiRequest("/rr/config", { token });
  },

  async updateConfig(token: string, key: string, value: any): Promise<ApiResponse<any>> {
    return apiRequest(`/rr/config/${key}`, { method: "PUT", token, body: { value } });
  },

  async resetConfig(token: string, key: string): Promise<ApiResponse<any>> {
    return apiRequest(`/rr/config/${key}/reset`, { method: "POST", token });
  },

  async getClaims(token: string, page = 0, size = 30, status?: string): Promise<ApiResponse<{ page: RrClaim[]; size: number; currentPage: number; totalPages: number }>> {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    if (status && status !== "all") params.set("status", status);
    return apiRequest(`/rr/claims?${params}`, { token });
  },

  async submitClaim(token: string, socialId: string, proof: string): Promise<ApiResponse<RrClaim>> {
    return apiRequest("/rr/claims", { method: "POST", token, body: { socialId, proof } });
  },

  async reviewClaim(token: string, claimId: number, status: string, rejectionReason?: string): Promise<ApiResponse<RrClaim>> {
    return apiRequest(`/rr/claims/${claimId}/status`, { method: "PUT", token, body: { status, rejectionReason } });
  },

  async getRedemptionClaims(token: string, page = 0, size = 50, status?: string): Promise<ApiResponse<{ page: RrRedemptionClaim[]; size: number; currentPage: number; totalPages: number }>> {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    if (status && status !== "all") params.set("status", status);
    return apiRequest(`/rr/redemption-claims?${params}`, { token });
  },

  async submitRedemptionClaim(token: string, spendRuleId: string, brandId: number, notes?: string): Promise<ApiResponse<RrRedemptionClaim>> {
    return apiRequest("/rr/redemption-claims", { method: "POST", token, body: { spendRuleId, brandId, notes } });
  },

  async reviewRedemptionClaim(token: string, claimId: number, status: string, rejectionReason?: string): Promise<ApiResponse<RrRedemptionClaim>> {
    return apiRequest(`/rr/redemption-claims/${claimId}/status`, { method: "PUT", token, body: { status, rejectionReason } });
  },

  async getStats(token: string): Promise<ApiResponse<RrStats>> {
    return apiRequest("/rr/stats", { token });
  },

  async getLedger(token: string, page = 0, size = 50): Promise<ApiResponse<{ topUsers: any[]; ledger: any[]; page: number; size: number }>> {
    return apiRequest(`/rr/ledger?page=${page}&size=${size}`, { token });
  },

  async awardRr(token: string, userId: number, amount: number, narration: string): Promise<ApiResponse<any>> {
    return apiRequest("/rr/award", { method: "POST", token, body: { userId, amount, narration } });
  },

  async getStreak(token: string): Promise<ApiResponse<RrUserStreak>> {
    return apiRequest("/rr/streak", { token });
  },

  async tickStreak(token: string): Promise<ApiResponse<{ streak: RrUserStreak; awarded: number }>> {
    return apiRequest("/rr/streak/tick", { method: "POST", token });
  },
};
