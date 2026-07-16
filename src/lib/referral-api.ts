import { apiRequest, type ApiResponse } from "./api";

export type ReferralProfile = {
  id: number;
  userId: number;
  code: string;
  commissionPct: number;
  rrPerSignup: number;
  customSlug?: string;
  status: "active" | "suspended";
  createdAt: string;
};

export type ReferralStats = {
  clicks: number;
  signups: number;
  qualified: number;
  revenue: number;
  earned: number;
  paid: number;
  pending: number;
  rrEarned?: number;
  pendingReferrals?: number;
  expiredReferrals?: number;
  clickToSignupCvr: string;
  signupToQualifiedRate: string;
  profile: ReferralProfile;
};

export type ReferralEvent = {
  id: number;
  profileId: number;
  kind: "click" | "signup" | "qualified" | "revenue";
  refereeName?: string;
  refereeEmail?: string;
  source?: string;
  amount?: number;
  createdAt: string;
};

export type ReferralPayout = {
  id: number;
  profileId: number;
  amount: number;
  method: "wallet" | "manual";
  note?: string;
  createdAt: string;
};

export type RefereeRow = {
  email: string;
  name?: string;
  signupAt: string;
  qualified: boolean;
  revenue: number;
  commission: number;
};

export type ReferralResolution = {
  code: string;
  customSlug?: string | null;
  attributionToken: string;
  expiresAt: string;
  redirectTo: string;
};

export const referralApi = {
  async getOrCreateProfile(token: string): Promise<ApiResponse<ReferralProfile>> {
    return apiRequest("/referral/my", { token });
  },

  async updateProfile(token: string, patch: { customSlug?: string; status?: string }): Promise<ApiResponse<ReferralProfile>> {
    return apiRequest("/referral/my", { method: "PUT", token, body: patch });
  },

  async getStats(token: string): Promise<ApiResponse<ReferralStats>> {
    return apiRequest("/referral/stats", { token });
  },

  async getEvents(token: string, page = 0, size = 50): Promise<ApiResponse<{ page: ReferralEvent[] }>> {
    return apiRequest(`/referral/events?page=${page}&size=${size}`, { token });
  },

  async getPayouts(token: string): Promise<ApiResponse<ReferralPayout[]>> {
    return apiRequest("/referral/payouts", { token });
  },

  async getReferees(token: string): Promise<ApiResponse<RefereeRow[]>> {
    return apiRequest("/referral/referees", { token });
  },

  async captureClick(code: string, source?: string): Promise<ApiResponse<{ code: string }>> {
    return apiRequest("/referral/capture", { method: "POST", body: { code, source } });
  },

  async resolveLink(identifier: string, source?: string, campaign?: string): Promise<ApiResponse<ReferralResolution>> {
    return apiRequest("/referral/resolve", {
      method: "POST",
      body: { identifier, source, campaign },
    });
  },

  async adminListProfiles(token: string, page = 0, size = 30): Promise<ApiResponse<{ page: (ReferralProfile & { user: any })[] }>> {
    return apiRequest(`/referral/admin/list?page=${page}&size=${size}`, { token });
  },

  async adminRecordPayout(token: string, profileId: number, amount: number, method: string, note?: string): Promise<ApiResponse<ReferralPayout>> {
    return apiRequest("/referral/admin/payout", { method: "POST", token, body: { profileId, amount, method, note } });
  },
};
