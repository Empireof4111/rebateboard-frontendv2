import { apiRequest } from "@/lib/api";

type StoredSession = {
  token?: string | null;
};

export type WalletDashboardTransaction = {
  id: string;
  date: string;
  source: string;
  brandName: string;
  type: "Cashback" | "Referral" | "Transfer" | "Reward" | "Withdrawal";
  amount: number;
  status: "Pending" | "Approved" | "Credited" | "Withdrawn";
  note?: string;
  ref?: string;
  channel?: string;
  activity?: string;
  accountNumber?: string;
};

export type WalletDashboardWithdrawal = {
  id: string;
  amount: number;
  method: string;
  destination: string;
  status: "pending" | "approved" | "paid" | "rejected";
  rawStatus: string;
  narration?: string;
  submittedAt: string;
  updatedAt: string;
};

export type WalletDashboardPayload = {
  wallet: {
    id: number;
    accountNumber: string;
    address: string;
    status: string;
    currency: string;
    balance: number;
    prevBalance: number;
    createdAt: string;
    updatedAt: string;
  };
  summary: {
    balance: number;
    totalEarned: number;
    totalDebited: number;
    availableForWithdrawal: number;
    pendingWithdrawals: number;
    totalWithdrawn: number;
    transactionCount: number;
    withdrawalCount: number;
  };
  transactions: WalletDashboardTransaction[];
  withdrawals: WalletDashboardWithdrawal[];
};

export type WalletTransferInput = {
  recipient: string;
  amount: number;
  narration?: string;
};

export type WalletWithdrawalInput = {
  channel: string;
  amount: number;
  narration?: string;
  bankName?: string;
  accountName?: string;
  accountNumber?: string;
  walletAddress?: string;
  walletType?: string;
};

function getAuthToken() {
  if (typeof window === "undefined") return null;

  try {
    const raw = localStorage.getItem("rb_auth_session");
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredSession;
    return parsed.token ?? null;
  } catch {
    return null;
  }
}

export async function fetchWalletDashboard() {
  const response = await apiRequest<WalletDashboardPayload>("/wallet/dashboard", {
    method: "GET",
    token: getAuthToken(),
  });
  if (!response.payload) throw new Error("Missing wallet dashboard response");
  return response.payload;
}

export async function createWalletTransfer(input: WalletTransferInput) {
  const response = await apiRequest("/wallet/transfer", {
    method: "POST",
    body: input,
    token: getAuthToken(),
  });
  return response;
}

export async function createWalletWithdrawal(input: WalletWithdrawalInput) {
  const response = await apiRequest("/wallet/withdrawal-request", {
    method: "POST",
    body: input,
    token: getAuthToken(),
  });
  return response;
}
