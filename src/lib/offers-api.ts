import { apiRequest } from "@/lib/api";
import type { AdminOffer, OfferCategory } from "@/lib/admin-data";

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

export { type AdminOffer, type OfferCategory };

export async function fetchAdminOffers() {
  const response = await apiRequest<AdminOffer[]>("/admin-offer/list", {
    method: "GET",
    token: readToken(),
  });
  return response.payload ?? [];
}

export async function fetchPublicOffers() {
  const response = await apiRequest<AdminOffer[]>("/admin-offer/public-list", {
    method: "GET",
  });
  return response.payload ?? [];
}

export async function createAdminOffer(input: Partial<AdminOffer>) {
  const response = await apiRequest<AdminOffer>("/admin-offer/", {
    method: "POST",
    body: input,
    token: readToken(),
  });
  if (!response.payload) throw new Error("Missing offer payload");
  return response.payload;
}

export async function updateAdminOffer(id: string, input: Partial<AdminOffer>) {
  const response = await apiRequest<AdminOffer>(`/admin-offer/${id}`, {
    method: "PUT",
    body: input,
    token: readToken(),
  });
  if (!response.payload) throw new Error("Missing offer payload");
  return response.payload;
}

export async function deleteAdminOffer(id: string) {
  await apiRequest(`/admin-offer/${id}`, {
    method: "DELETE",
    token: readToken(),
  });
}
