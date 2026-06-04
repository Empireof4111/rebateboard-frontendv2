import { apiRequest } from "@/lib/api";

type StoredSession = {
  token?: string | null;
};

export type AdminWalletRecord = {
  id: number;
  walletId: number;
  accountNumber: string;
  address: string;
  status: string;
  balance: number;
  prevBalance: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
  userId: number;
  userName: string;
  userEmail: string;
};

export type AdminWalletLogRecord = {
  id: number;
  activity: string;
  amount: number;
  status: string;
  ref: string;
  channel: string;
  narration?: string;
  createdAt: string;
  recipientName?: string;
  senderName?: string;
};

export type AdminWithdrawalRecord = {
  id: number;
  userId: number;
  userName: string;
  walletId: number;
  method: string;
  destination: string;
  amount: number;
  status: "pending" | "approved" | "paid" | "rejected";
  rawStatus: string;
  submittedAt: string;
  updatedAt: string;
  narration?: string;
};

type WalletListPayload = {
  page: Array<{
    id: number;
    accountNumber: string;
    address: string;
    status: string;
    balance: number;
    prevBalance: number;
    currency: string;
    createdAt: string;
    updatedAt: string;
    userId: number;
    user?: {
      id: number;
      name?: string;
      fullName?: string;
      emailAddress?: string;
      email?: string;
    };
  }>;
};

type WalletLogsPayload = {
  page: Array<{
    id: number;
    activity: string;
    amount: number;
    status: string;
    ref: string;
    channel: string;
    narration?: string;
    createdAt: string;
    recipient?: { name?: string; fullName?: string };
    sender?: { name?: string; fullName?: string };
  }>;
};

type WithdrawalListPayload = {
  page: Array<{
    id: number;
    userId: number;
    walletId: number;
    channel: string;
    amount: number;
    status: string;
    narration?: string;
    bankName?: string;
    accountName?: string;
    accountNumber?: string | number;
    walletAddress?: string;
    walletType?: string;
    createdAt: string;
    updatedAt: string;
  }>;
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

function normalizeWallet(record: WalletListPayload["page"][number]): AdminWalletRecord {
  return {
    id: record.id,
    walletId: record.id,
    accountNumber: record.accountNumber,
    address: record.address,
    status: record.status,
    balance: Number(record.balance ?? 0),
    prevBalance: Number(record.prevBalance ?? 0),
    currency: record.currency ?? "USD",
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    userId: record.userId,
    userName: record.user?.fullName ?? record.user?.name ?? `User ${record.userId}`,
    userEmail: record.user?.emailAddress ?? record.user?.email ?? "",
  };
}

function normalizeWithdrawalStatus(status: string): AdminWithdrawalRecord["status"] {
  const value = (status || "").toUpperCase();
  if (value === "PENDING") return "pending";
  if (value === "APPROVED") return "approved";
  if (value === "SUCCESSFUL" || value === "ACTIVE") return "paid";
  if (value === "DECLINED" || value === "CANCELED") return "rejected";
  return "pending";
}

export async function fetchAdminWallets(query = "") {
  const path = query.trim()
    ? `/wallet/search?page=0&size=100&q=${encodeURIComponent(query.trim())}`
    : "/wallet/list?page=0&size=100";
  const response = await apiRequest<WalletListPayload>(path, {
    method: "GET",
    token: getAuthToken(),
  });
  return (response.payload?.page ?? []).map(normalizeWallet);
}

export async function updateAdminWalletStatus(walletId: number, status: string) {
  await apiRequest(`/wallet/status/${walletId}?status=${encodeURIComponent(status)}`, {
    method: "PUT",
    token: getAuthToken(),
  });
}

export async function adjustAdminWallet(input: {
  userId: number;
  amount: number;
  type: "CREDIT" | "DEBIT" | "UPDATE";
  narration?: string;
}) {
  await apiRequest("/wallet/adjustment", {
    method: "POST",
    token: getAuthToken(),
    body: input,
  });
}

export async function fetchAdminWalletLogs(userId: number) {
  const response = await apiRequest<WalletLogsPayload>(`/wallet/logs/${userId}?page=0&size=100`, {
    method: "GET",
    token: getAuthToken(),
  });

  return (response.payload?.page ?? []).map((log) => ({
    id: log.id,
    activity: log.activity,
    amount: Number(log.amount ?? 0),
    status: log.status,
    ref: log.ref,
    channel: log.channel,
    narration: log.narration,
    createdAt: log.createdAt,
    recipientName: log.recipient?.fullName ?? log.recipient?.name,
    senderName: log.sender?.fullName ?? log.sender?.name,
  })) as AdminWalletLogRecord[];
}

export async function fetchAdminWithdrawals(status?: string) {
  const query = status && status !== "all" ? `&status=${encodeURIComponent(status.toUpperCase())}` : "";
  const response = await apiRequest<WithdrawalListPayload>(`/wallet/withdrawal-request/list?page=0&size=100${query}`, {
    method: "GET",
    token: getAuthToken(),
  });

  const withdrawals = response.payload?.page ?? [];
  const walletOwners = await fetchAdminWallets();
  const byUserId = new Map(walletOwners.map((wallet) => [wallet.userId, wallet]));

  return withdrawals.map((withdrawal) => {
    const owner = byUserId.get(withdrawal.userId);
    const destination = withdrawal.channel?.toLowerCase().includes("bank")
      ? [withdrawal.bankName, withdrawal.accountName, withdrawal.accountNumber].filter(Boolean).join(" · ")
      : [withdrawal.walletType, withdrawal.walletAddress].filter(Boolean).join(" · ");

    return {
      id: withdrawal.id,
      userId: withdrawal.userId,
      userName: owner?.userName ?? `User ${withdrawal.userId}`,
      walletId: withdrawal.walletId,
      method: withdrawal.channel,
      destination,
      amount: Number(withdrawal.amount ?? 0),
      status: normalizeWithdrawalStatus(withdrawal.status),
      rawStatus: withdrawal.status,
      submittedAt: withdrawal.createdAt,
      updatedAt: withdrawal.updatedAt,
      narration: withdrawal.narration,
    };
  });
}

export async function updateAdminWithdrawalStatus(id: number, status: "APPROVED" | "DECLINED" | "SUCCESSFUL") {
  await apiRequest(`/wallet/withdrawal-request/status/${id}?status=${status}`, {
    method: "PUT",
    token: getAuthToken(),
  });
}
