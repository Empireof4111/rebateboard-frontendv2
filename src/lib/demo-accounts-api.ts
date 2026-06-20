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
    const parsed = JSON.parse(raw) as StoredSession;
    return parsed.token ?? null;
  } catch {
    return null;
  }
}

export type DemoAccountPlatform = "MT4" | "MT5" | "cTrader" | "DXtrade" | "TradingView";
export type DemoAccountStatus = "draft" | "published" | "archived";

export type DemoAccountRecord = {
  id: string;
  brandId: string;
  brand: string;
  slug: string;
  category: string;
  logo?: string;
  plan: string;
  platform: string;
  countries: string;
  accountId: string;
  password: string;
  investorPassword: string;
  server: string;
  terminalUrl: string;
  notes: string;
  status: DemoAccountStatus;
  verified: boolean;
  hot: boolean;
  enabled: boolean;
  displayOrder: number;
  credentialVersion: number;
  lastRotatedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type DemoAccountsBoard = {
  rows: DemoAccountRecord[];
  stats: {
    total: number;
    verified: number;
    platforms: number;
    platformLabels?: string;
    hot: number;
    published?: number;
  };
};

export async function fetchAdminDemoAccountsBoard() {
  const response = await apiRequest<DemoAccountsBoard>("/demo-account/admin/board", {
    method: "GET",
    token: readToken(),
  });
  if (!response.payload) throw new Error("Missing demo accounts payload");
  return response.payload;
}

export async function saveDemoAccount(input: Partial<DemoAccountRecord> & {
  brandId?: string;
  brand?: string;
  plan: string;
  platform: string;
  accountId: string;
}) {
  const response = await apiRequest<DemoAccountsBoard>("/demo-account/admin", {
    method: "POST",
    token: readToken(),
    body: {
      ...input,
      brandId: input.brandId ? Number(input.brandId) : null,
      brandName: input.brand,
    },
  });
  if (!response.payload) throw new Error("Missing demo accounts payload");
  return response.payload;
}

export async function updateDemoAccount(
  recordId: string,
  input: Partial<DemoAccountRecord> & {
    brandId?: string;
    brand?: string;
    plan: string;
    platform: string;
    accountId: string;
  },
) {
  const response = await apiRequest<DemoAccountsBoard>(`/demo-account/admin/${recordId}`, {
    method: "PUT",
    token: readToken(),
    body: {
      ...input,
      brandId: input.brandId ? Number(input.brandId) : null,
      brandName: input.brand,
    },
  });
  if (!response.payload) throw new Error("Missing demo accounts payload");
  return response.payload;
}

export async function rotateDemoAccount(recordId: string, input?: {
  password?: string;
  investorPassword?: string;
  note?: string;
}) {
  const response = await apiRequest<DemoAccountsBoard>(`/demo-account/admin/${recordId}/rotate`, {
    method: "POST",
    token: readToken(),
    body: input ?? {},
  });
  if (!response.payload) throw new Error("Missing demo accounts payload");
  return response.payload;
}

export async function deleteDemoAccount(recordId: string) {
  const response = await apiRequest<DemoAccountsBoard>(`/demo-account/admin/${recordId}`, {
    method: "DELETE",
    token: readToken(),
  });
  if (!response.payload) throw new Error("Missing demo accounts payload");
  return response.payload;
}

export async function fetchPublicDemoAccounts(query = "", platform = "") {
  const params = new URLSearchParams();
  if (query.trim()) params.set("q", query.trim());
  if (platform.trim() && platform !== "all") params.set("platform", platform.trim());
  const suffix = params.toString() ? `?${params.toString()}` : "";

  const response = await apiRequest<DemoAccountsBoard>(`/demo-account/public-list${suffix}`, {
    method: "GET",
  });
  if (!response.payload) throw new Error("Missing demo accounts payload");
  return response.payload;
}
