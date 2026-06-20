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

export type RrPurchasePricing = {
  pricePerRr: number;
  minPurchaseRr: number;
  maxPurchaseRr: number;
  salesActive: boolean;
};

export type RrPurchasePackage = {
  id: string;
  name: string;
  amountRr: number;
  bonusRr: number;
  badge: string;
  enabled: boolean;
  displayOrder?: number;
  amountUsd?: number;
  totalRr?: number;
};

export type RrPurchaseLog = {
  id: string;
  buyer?: string;
  rrAmount: number;
  baseRr?: number;
  bonusRr?: number;
  amountUsd: number;
  status: "successful" | "pending" | "failed";
  when: string;
  reference: string;
};

export type RrPurchaseAdminBoard = {
  pricing: RrPurchasePricing;
  packages: RrPurchasePackage[];
  logs: RrPurchaseLog[];
  stats: {
    totalPurchases: number;
    rrSold: number;
    gmv: number;
    buyers: number;
  };
};

export type RrPurchaseCatalog = {
  pricing: RrPurchasePricing;
  wallet: {
    usdBalance: number;
    rrBalance: number;
  };
  packages: RrPurchasePackage[];
  purchases: RrPurchaseLog[];
};

export async function fetchRrPurchaseAdminBoard() {
  const response = await apiRequest<RrPurchaseAdminBoard>("/rr-purchase/admin/board", {
    method: "GET",
    token: readToken(),
  });
  if (!response.payload) throw new Error("Missing RR purchase admin payload");
  return response.payload;
}

export async function saveRrPurchaseConfig(input: RrPurchasePricing) {
  const response = await apiRequest<RrPurchaseAdminBoard>("/rr-purchase/admin/config", {
    method: "PUT",
    token: readToken(),
    body: input,
  });
  if (!response.payload) throw new Error("Missing RR purchase admin payload");
  return response.payload;
}

export async function saveRrPurchasePackage(input: Partial<RrPurchasePackage> & {
  name: string;
  amountRr: number;
  bonusRr: number;
}) {
  const response = await apiRequest<RrPurchaseAdminBoard>("/rr-purchase/admin/package", {
    method: "POST",
    token: readToken(),
    body: input,
  });
  if (!response.payload) throw new Error("Missing RR purchase admin payload");
  return response.payload;
}

export async function deleteRrPurchasePackage(packageId: string) {
  const response = await apiRequest<RrPurchaseAdminBoard>(`/rr-purchase/admin/package/${packageId}`, {
    method: "DELETE",
    token: readToken(),
  });
  if (!response.payload) throw new Error("Missing RR purchase admin payload");
  return response.payload;
}

export async function fetchRrPurchaseCatalog() {
  const response = await apiRequest<RrPurchaseCatalog>("/rr-purchase/catalog", {
    method: "GET",
    token: readToken(),
  });
  if (!response.payload) throw new Error("Missing RR purchase catalog payload");
  return response.payload;
}

export async function buyRr(input: { packageId?: number; amountRr?: number }) {
  const response = await apiRequest<{
    purchase: RrPurchaseLog & { totalRr?: number };
    user: { id: string; rrBalance: number };
    wallet: { usdBalance: number; balanceRR: number };
    catalog: RrPurchaseCatalog;
  }>("/rr-purchase/buy", {
    method: "POST",
    token: readToken(),
    body: input,
  });
  if (!response.payload) throw new Error("Missing RR purchase result");
  return response.payload;
}
