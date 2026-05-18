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

export type AdminBrandStatus = "verified" | "review" | "flagged" | "draft";
export type AdminBrandCategory =
  | "Prop Firm"
  | "Forex Broker"
  | "Crypto Exchange"
  | "Futures Prop Firm"
  | "Crypto Prop Firm"
  | "Stock Prop Firm"
  | "DEX Prop Firm"
  | "Trading Software"
  | "Trading Tool"
  | "Education Provider"
  | "Other";

export type AdminBrandRecord = {
  id: string;
  name: string;
  slug: string;
  category: AdminBrandCategory;
  visibility: "draft" | "published" | "hidden" | "archived";
  status: AdminBrandStatus;
  tbi: number;
  payouts: string;
  complaints: number;
  rankOverride?: number | null;
  thumbnail?: string;
  cover?: string;
  screenshots?: string[];
  website?: string;
  supportEmail?: string;
  primaryColor?: string;
  identity?: Record<string, unknown>;
  founder?: Record<string, unknown>;
  broker?: Record<string, unknown>;
  prop?: Record<string, unknown>;
  exchange?: Record<string, unknown>;
  tool?: Record<string, unknown>;
  editorial?: Record<string, unknown>;
  profile?: Record<string, unknown>;
  cashback?: Record<string, unknown>;
  challenges?: Record<string, unknown>[];
  trust?: Record<string, unknown>;
  seo?: Record<string, unknown>;
  flags?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
};

export async function fetchAdminBrands() {
  const response = await apiRequest<AdminBrandRecord[]>("/admin-brand/list", {
    method: "GET",
    token: readToken(),
  });
  return response.payload ?? [];
}

export async function createAdminBrand(input: Partial<AdminBrandRecord>) {
  const response = await apiRequest<AdminBrandRecord>("/admin-brand/", {
    method: "POST",
    body: input,
    token: readToken(),
  });
  if (!response.payload) throw new Error("Missing brand payload");
  return response.payload;
}

export async function updateAdminBrand(id: string, input: Partial<AdminBrandRecord>) {
  const response = await apiRequest<AdminBrandRecord>(`/admin-brand/${id}`, {
    method: "PUT",
    body: input,
    token: readToken(),
  });
  if (!response.payload) throw new Error("Missing brand payload");
  return response.payload;
}

export async function deleteAdminBrand(id: string) {
  await apiRequest(`/admin-brand/${id}`, {
    method: "DELETE",
    token: readToken(),
  });
}
