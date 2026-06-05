/**
 * Finance & OPS API service — single source of truth for all wallet,
 * transaction, withdrawal, and cashback API calls.
 *
 * Usage:
 *   import { financeApi } from "@/lib/finance-api"
 *   const { payload } = await financeApi.getWalletSummary(token)
 */

import { apiRequest, type ApiResponse } from "./api";

// ─── Shared Types ────────────────────────────────────────────────────────────

export type PaginatedResult<T> = {
  page: T[];
  size: number;
  currentPage: number;
  totalPages: number;
};

export type WalletSummary = {
  balance: number;
  accountNumber: string;
  address: string;
  status: string;
  currency: string;
  totalEarned: number;
  totalWithdrawn: number;
  pendingWithdrawals: number;
  availableForWithdrawal: number;
  approvedWithdrawals: number;
};

export type WalletTransaction = {
  id: number;
  userId: number;
  walletId: number;
  activity: "CREDIT" | "DEBIT" | "UPDATE";
  senderId?: number;
  recipientId?: number;
  narration?: string;
  ref: string;
  channel: string;
  amount: number;
  status: string;
  executedById?: number;
  createdAt: string;
  updatedAt: string;
  user?: { id: number; name: string; emailAddress: string };
  sender?: { id: number; name: string };
  recipient?: { id: number; name: string };
};

export type Wallet = {
  id: number;
  userId: number;
  accountNumber: string;
  address: string;
  balance: number;
  prevBalance?: number;
  status: string;
  currency: string;
  createdAt: string;
  updatedAt: string;
  user?: { id: number; name: string; emailAddress: string };
  available?: number;
  pending?: number;
  earned?: number;
  withdrawn?: number;
  rr?: number;
};

export type WithdrawalRequest = {
  id: number;
  bankName?: string;
  accountName?: string;
  accountNumber?: string;
  walletAddress?: string;
  walletType?: string;
  channel: string;
  amount: number;
  narration?: string;
  status: string;
  currency: string;
  walletId: number;
  userId: number;
  createdAt: string;
  updatedAt: string;
  User?: { id: number; name: string; emailAddress: string };
};

export type CashbackClaim = {
  id: number;
  userId: number;
  partner: string;
  partnerCategory?: string;
  accountId?: string;
  registeredEmail?: string;
  orderId?: string;
  type: string;
  amount: number;
  evidence: number;
  evidenceUrls?: string[];
  payoutTarget: string;
  status: string;
  note?: string;
  approvedAt?: string;
  approvedById?: number;
  payoutMethod?: string;
  payoutTxRef?: string;
  createdAt: string;
  updatedAt: string;
  user?: { id: number; name: string; emailAddress: string };
  approvedBy?: { id: number; name: string };
};

export type CashbackEntry = {
  id: number;
  userId: number;
  partner: string;
  category: string;
  volumeLots: number;
  commissionGenerated: number;
  rebatePercent: number;
  rebateEarned: number;
  rebatePaid: number;
  pending: number;
  status: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
  user?: { id: number; name: string; emailAddress: string };
};

export type AdminFinanceStats = {
  totalWallets: number;
  totalBalance: number;
  totalCredits: number;
  totalDebits: number;
  pendingWithdrawals: number;
  pendingWithdrawalCount: number;
  approvedWithdrawals: number;
  paidWithdrawals: number;
};

export type ClaimStats = {
  total: number;
  pending: number;
  approved: number;
  paid: number;
  rejected: number;
  totalAmountPaid: number;
};

export type PartnerRequestRecord = {
  id: number;
  userId: number;
  brand: string;
  brandCategory?: string;
  toEmail: string;
  subject: string;
  body: string;
  partnerCode?: string;
  affiliateLink?: string;
  registeredEmail?: string;
  accountId: string;
  status: string; // queued | sent | acknowledged | rejected
  sentAt?: string;
  adminNote?: string;
  createdAt: string;
  updatedAt: string;
  user?: { id: number; name: string; emailAddress: string };
};

export type PartnerRequestStats = {
  total: number;
  queued: number;
  sent: number;
  acknowledged: number;
  rejected: number;
};

export type AffiliateRecord = {
  id: number;
  userId: number;
  partner: string;
  partnerCategory?: string;
  structure?: string;
  subIBs: number;
  referrals: number;
  earnedTotal: number;
  pendingAmount: number;
  tier: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  user?: { id: number; name: string; emailAddress: string };
};

export type AffiliateStats = {
  total: number;
  active: number;
  totalEarned: number;
  totalPending: number;
  totalSubIBs: number;
  totalReferrals: number;
};

export type DisputeRecord = {
  id: number;
  title: string;
  brandName?: string;
  brandSlug?: string;
  name: string;
  emailAddress: string;
  accountId: string;
  description?: string;
  complaintCategory?: string;
  severity: string;
  status: string;
  anonymous: boolean;
  credibility: number;
  upvotes: number;
  comments: number;
  adminNote?: string;
  createdAt: string;
  updatedAt: string;
  reportedBy?: { id: number; name: string; emailAddress: string };
};

export type DisputeStats = {
  total: number;
  open: number;
  resolved: number;
  resolved30d: number;
  rejected: number;
};

export type EntryStats = {
  totalCommission: number;
  totalEarned: number;
  totalPaid: number;
  totalPending: number;
};

// ─── Wallet ───────────────────────────────────────────────────────────────────

export const financeApi = {
  // Get current user's wallet summary (balance + lifetime stats)
  getWalletSummary(token: string): Promise<ApiResponse<WalletSummary>> {
    return apiRequest<WalletSummary>("/wallet/summary", { token });
  },

  // Get current user's wallet entity
  getWallet(token: string): Promise<ApiResponse<Wallet>> {
    return apiRequest<Wallet>("/wallet/", { token });
  },

  // Get transaction history (filtered)
  getTransactions(
    token: string,
    params: { page?: number; size?: number; userId?: number; activity?: string; channel?: string; status?: string } = {},
  ): Promise<ApiResponse<PaginatedResult<WalletTransaction>>> {
    const q = new URLSearchParams();
    if (params.page !== undefined) q.set("page", String(params.page));
    if (params.size !== undefined) q.set("size", String(params.size));
    if (params.userId) q.set("userId", String(params.userId));
    if (params.activity) q.set("activity", params.activity);
    if (params.channel) q.set("channel", params.channel);
    if (params.status) q.set("status", params.status);
    return apiRequest<PaginatedResult<WalletTransaction>>(`/wallet/transactions?${q}`, { token });
  },

  // Get wallet logs (legacy endpoint, user-scoped)
  getWalletLogs(token: string, page = 0, size = 30): Promise<ApiResponse<PaginatedResult<WalletTransaction>>> {
    return apiRequest<PaginatedResult<WalletTransaction>>(`/wallet/logs?page=${page}&size=${size}`, { token });
  },

  // Admin: get all wallets
  getAllWallets(token: string, page = 0, size = 30): Promise<ApiResponse<PaginatedResult<Wallet>>> {
    return apiRequest<PaginatedResult<Wallet>>(`/wallet/list?page=${page}&size=${size}`, { token });
  },

  // Admin: search wallets
  searchWallets(token: string, q: string, page = 0, size = 30): Promise<ApiResponse<PaginatedResult<Wallet>>> {
    return apiRequest<PaginatedResult<Wallet>>(`/wallet/search?q=${encodeURIComponent(q)}&page=${page}&size=${size}`, { token });
  },

  // Admin: finance platform stats
  getAdminFinanceStats(token: string): Promise<ApiResponse<AdminFinanceStats>> {
    return apiRequest<AdminFinanceStats>("/wallet/admin/finance-stats", { token });
  },

  // Admin: fund a specific user's wallet
  fundWallet(token: string, body: { userId: number; amount: number; narration?: string }): Promise<ApiResponse<Wallet>> {
    return apiRequest<Wallet>("/wallet/funding", { method: "POST", body, token });
  },

  // Admin: adjust a user's wallet (CREDIT/DEBIT/UPDATE)
  adjustWallet(token: string, body: { userId: number; amount: number; type: string; narration?: string }): Promise<ApiResponse<Wallet>> {
    return apiRequest<Wallet>("/wallet/adjustment", { method: "POST", body, token });
  },

  // Admin: bulk adjust selected wallets
  bulkAdjustWallets(token: string, body: { rows: { userId: number; amount: number; type: string; narration?: string }[] }): Promise<ApiResponse<{ results: ApiResponse<Wallet>[] }>> {
    return apiRequest<{ results: ApiResponse<Wallet>[] }>("/wallet/bulk-adjustment", { method: "POST", body, token });
  },

  // Admin: bulk fund wallets via Excel link
  bulkFundWallets(token: string, body: { link: string }): Promise<ApiResponse<unknown>> {
    return apiRequest("/wallet/bulk-funding", { method: "POST", body, token });
  },

  // User: transfer funds to another user
  transferFunds(token: string, body: { recipient: string; amount: number; narration?: string }): Promise<ApiResponse<Wallet>> {
    return apiRequest<Wallet>("/wallet/transfer", { method: "POST", body, token });
  },

  // User: check wallet balance by account number
  getWalletBalance(token: string, accountNumber: string): Promise<ApiResponse<{ name: string; accountNumber: string }>> {
    return apiRequest(`/wallet/balance?accountNumber=${encodeURIComponent(accountNumber)}`, { token });
  },

  // ─── Withdrawals ────────────────────────────────────────────────────────────

  // User: request a withdrawal
  requestWithdrawal(token: string, body: {
    channel: string; amount: number; narration?: string;
    bankName?: string; accountName?: string; accountNumber?: string;
    walletAddress?: string; walletType?: string;
  }): Promise<ApiResponse<WithdrawalRequest>> {
    return apiRequest<WithdrawalRequest>("/wallet/withdrawal-request", { method: "POST", body, token });
  },

  // User: get own withdrawal requests
  getMyWithdrawals(token: string, params: { page?: number; size?: number; status?: string } = {}): Promise<ApiResponse<PaginatedResult<WithdrawalRequest>>> {
    const q = new URLSearchParams();
    if (params.page !== undefined) q.set("page", String(params.page));
    if (params.size !== undefined) q.set("size", String(params.size));
    if (params.status) q.set("status", params.status);
    return apiRequest<PaginatedResult<WithdrawalRequest>>(`/wallet/withdrawal-request/list?${q}`, { token });
  },

  // Admin: get all withdrawal requests
  getAllWithdrawals(token: string, params: { page?: number; size?: number; status?: string } = {}): Promise<ApiResponse<PaginatedResult<WithdrawalRequest>>> {
    const q = new URLSearchParams();
    if (params.page !== undefined) q.set("page", String(params.page));
    if (params.size !== undefined) q.set("size", String(params.size));
    if (params.status) q.set("status", params.status);
    return apiRequest<PaginatedResult<WithdrawalRequest>>(`/wallet/withdrawal-request/list?${q}`, { token });
  },

  // Admin: update withdrawal status (ACTIVE=approve, DECLINED=reject, PAID-like)
  updateWithdrawalStatus(token: string, id: number, status: string): Promise<ApiResponse<WithdrawalRequest>> {
    return apiRequest<WithdrawalRequest>(`/wallet/withdrawal-request/status/${id}?status=${status}`, { method: "PUT", token });
  },

  // Admin: update a wallet status (ACTIVE/INACTIVE)
  updateWalletStatus(token: string, id: number, status: string): Promise<ApiResponse<Wallet>> {
    return apiRequest<Wallet>(`/wallet/status/${id}?status=${status}`, { method: "PUT", token });
  },

  // User/Admin: cancel a pending withdrawal
  cancelWithdrawal(token: string, id: number): Promise<ApiResponse<{ id: number; status: string }>> {
    return apiRequest(`/wallet/withdrawal-request/${id}`, { method: "DELETE", token });
  },

  // ─── Cashback Claims ────────────────────────────────────────────────────────

  // User: submit a cashback claim
  submitClaim(token: string, body: {
    partner: string; partnerCategory?: string; amount: number;
    accountId?: string; registeredEmail?: string; orderId?: string;
    evidenceUrls?: string[]; payoutTarget?: string; note?: string; type?: string;
  }): Promise<ApiResponse<CashbackClaim>> {
    return apiRequest<CashbackClaim>("/cashback/claim", { method: "POST", body, token });
  },

  // User: get own claims
  getMyClaims(token: string, params: { page?: number; size?: number; status?: string } = {}): Promise<ApiResponse<PaginatedResult<CashbackClaim>>> {
    const q = new URLSearchParams();
    if (params.page !== undefined) q.set("page", String(params.page));
    if (params.size !== undefined) q.set("size", String(params.size));
    if (params.status) q.set("status", params.status);
    return apiRequest<PaginatedResult<CashbackClaim>>(`/cashback/my-claims?${q}`, { token });
  },

  // User/Admin: get claim stats
  getClaimStats(token: string): Promise<ApiResponse<ClaimStats>> {
    return apiRequest<ClaimStats>("/cashback/claims/stats", { token });
  },

  // Admin: get all claims
  getAllClaims(token: string, params: { page?: number; size?: number; status?: string; userId?: number } = {}): Promise<ApiResponse<PaginatedResult<CashbackClaim>>> {
    const q = new URLSearchParams();
    if (params.page !== undefined) q.set("page", String(params.page));
    if (params.size !== undefined) q.set("size", String(params.size));
    if (params.status) q.set("status", params.status);
    if (params.userId) q.set("userId", String(params.userId));
    return apiRequest<PaginatedResult<CashbackClaim>>(`/cashback/claims?${q}`, { token });
  },

  // Admin: approve/reject/pay a claim
  updateClaimStatus(token: string, id: number, body: { status: string; note?: string; payoutMethod?: string; payoutTxRef?: string }): Promise<ApiResponse<CashbackClaim>> {
    return apiRequest<CashbackClaim>(`/cashback/claim/${id}/status`, { method: "PUT", body, token });
  },

  // ─── Cashback Entries (Ledger) ───────────────────────────────────────────────

  // Admin: create a cashback entry
  createEntry(token: string, body: {
    userId: number; partner: string; category?: string;
    volumeLots?: number; commissionGenerated: number; rebatePercent?: number; note?: string;
  }): Promise<ApiResponse<CashbackEntry>> {
    return apiRequest<CashbackEntry>("/cashback/entry", { method: "POST", body, token });
  },

  // Admin: get all cashback entries
  getAllEntries(token: string, params: { page?: number; size?: number; status?: string; userId?: number } = {}): Promise<ApiResponse<PaginatedResult<CashbackEntry>>> {
    const q = new URLSearchParams();
    if (params.page !== undefined) q.set("page", String(params.page));
    if (params.size !== undefined) q.set("size", String(params.size));
    if (params.status) q.set("status", params.status);
    if (params.userId) q.set("userId", String(params.userId));
    return apiRequest<PaginatedResult<CashbackEntry>>(`/cashback/entries?${q}`, { token });
  },

  // Admin: approve an entry → credits wallet
  approveEntry(token: string, id: number): Promise<ApiResponse<CashbackEntry>> {
    return apiRequest<CashbackEntry>(`/cashback/entry/${id}/approve`, { method: "PUT", token });
  },

  // Admin: update a cashback entry
  updateEntry(token: string, id: number, body: Partial<{
    userId: number; partner: string; category: string;
    volumeLots: number; commissionGenerated: number; rebatePercent: number; note: string;
  }>): Promise<ApiResponse<CashbackEntry>> {
    return apiRequest<CashbackEntry>(`/cashback/entry/${id}`, { method: "PUT", body, token });
  },

  // Admin: recalculate all auto cashback entries
  recalculateEntries(token: string): Promise<ApiResponse<{ recalculated: number }>> {
    return apiRequest("/cashback/entries/recalculate", { method: "POST", token });
  },

  // Admin: get cashback entry stats
  getEntryStats(token: string): Promise<ApiResponse<EntryStats>> {
    return apiRequest<EntryStats>("/cashback/entries/stats", { token });
  },

  // ─── Partner Requests ────────────────────────────────────────────────────────

  createPartnerRequest(token: string, body: {
    brand: string; brandCategory?: string; toEmail: string; subject: string; body: string;
    partnerCode?: string; affiliateLink?: string; registeredEmail?: string; accountId: string;
  }): Promise<ApiResponse<PartnerRequestRecord>> {
    return apiRequest<PartnerRequestRecord>("/partner-request/", { method: "POST", body, token });
  },

  getAllPartnerRequests(token: string, params: { page?: number; size?: number; status?: string } = {}): Promise<ApiResponse<PaginatedResult<PartnerRequestRecord>>> {
    const q = new URLSearchParams();
    if (params.page !== undefined) q.set("page", String(params.page));
    if (params.size !== undefined) q.set("size", String(params.size));
    if (params.status) q.set("status", params.status);
    return apiRequest<PaginatedResult<PartnerRequestRecord>>(`/partner-request/list?${q}`, { token });
  },

  getPartnerRequestStats(token: string): Promise<ApiResponse<PartnerRequestStats>> {
    return apiRequest<PartnerRequestStats>("/partner-request/stats", { token });
  },

  updatePartnerRequestStatus(token: string, id: number, body: { status: string; adminNote?: string }): Promise<ApiResponse<PartnerRequestRecord>> {
    return apiRequest<PartnerRequestRecord>(`/partner-request/${id}/status`, { method: "PUT", body, token });
  },

  // ─── Affiliates ──────────────────────────────────────────────────────────────

  getAllAffiliates(token: string, params: { page?: number; size?: number } = {}): Promise<ApiResponse<PaginatedResult<AffiliateRecord>>> {
    const q = new URLSearchParams();
    if (params.page !== undefined) q.set("page", String(params.page));
    if (params.size !== undefined) q.set("size", String(params.size));
    return apiRequest<PaginatedResult<AffiliateRecord>>(`/affiliate/list?${q}`, { token });
  },

  getAffiliateStats(token: string): Promise<ApiResponse<AffiliateStats>> {
    return apiRequest<AffiliateStats>("/affiliate/stats", { token });
  },

  updateAffiliate(token: string, id: number, body: Partial<{ partner: string; partnerCategory: string; structure: string; subIBs: number; referrals: number; earnedTotal: number; pendingAmount: number; tier: string; active: boolean }>): Promise<ApiResponse<AffiliateRecord>> {
    return apiRequest<AffiliateRecord>(`/affiliate/${id}`, { method: "PUT", body, token });
  },

  payAffiliate(token: string, id: number, body: { amount: number; narration?: string }): Promise<ApiResponse<AffiliateRecord>> {
    return apiRequest<AffiliateRecord>(`/affiliate/${id}/pay`, { method: "POST", body, token });
  },

  createAffiliate(token: string, body: { userId: number; partner: string; partnerCategory?: string; structure?: string; tier?: string }): Promise<ApiResponse<AffiliateRecord>> {
    return apiRequest<AffiliateRecord>("/affiliate/", { method: "POST", body, token });
  },

  // ─── Disputes (Reports) ──────────────────────────────────────────────────────

  getAdminDisputes(token: string): Promise<ApiResponse<DisputeRecord[]>> {
    return apiRequest<DisputeRecord[]>("/report/admin-list", { token });
  },

  getDisputeStats(token: string): Promise<ApiResponse<DisputeStats>> {
    return apiRequest<DisputeStats>("/report/admin-stats", { token });
  },

  updateDisputeStatus(token: string, id: number, body: { status: string; adminNote?: string }): Promise<ApiResponse<DisputeRecord>> {
    return apiRequest<DisputeRecord>(`/report/${id}/moderate`, { method: "PUT", body, token });
  },

  // ─── User earnings charts ─────────────────────────────────────────────────

  getEarningsBreakdown(token: string): Promise<ApiResponse<{ source: string; amount: number }[]>> {
    return apiRequest<{ source: string; amount: number }[]>("/wallet/earnings-breakdown", { token });
  },

  getEarningsTimeline(token: string): Promise<ApiResponse<{ month: string; amount: number }[]>> {
    return apiRequest<{ month: string; amount: number }[]>("/wallet/earnings-timeline", { token });
  },

  getRrStats(token: string): Promise<ApiResponse<{ balance: number; earned30d: number; lifetimeEarned: number }>> {
    return apiRequest<{ balance: number; earned30d: number; lifetimeEarned: number }>("/wallet/rr-stats", { token });
  },

  // ─── Referrals ────────────────────────────────────────────────────────────

  getReferralStats(token: string): Promise<ApiResponse<{ total: number; thisMonth: number; referralCode: number }>> {
    return apiRequest<{ total: number; thisMonth: number; referralCode: number }>("/user/referral-stats", { token });
  },

  // ─── User partner requests (linked accounts view) ─────────────────────────

  getMyPartnerRequests(token: string, params: { page?: number; size?: number } = {}): Promise<ApiResponse<PaginatedResult<PartnerRequestRecord>>> {
    const q = new URLSearchParams();
    if (params.page !== undefined) q.set("page", String(params.page));
    if (params.size !== undefined) q.set("size", String(params.size));
    return apiRequest<PaginatedResult<PartnerRequestRecord>>(`/partner-request/my?${q}`, { token });
  },

  // ─── Analytics ───────────────────────────────────────────────────────────────

  getAnalytics(token: string): Promise<ApiResponse<Record<string, number>>> {
    return apiRequest("/analytic/", { token });
  },

  getFinanceAnalytics(token: string): Promise<ApiResponse<AdminFinanceStats & { netFlow: number }>> {
    return apiRequest("/analytic/finance", { token });
  },
};
