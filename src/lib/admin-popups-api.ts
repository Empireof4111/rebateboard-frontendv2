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

export type AdminPopupRecord = {
  id: number;
  title: string;
  description: string;
  actionURL?: string;
  actionText?: string;
  thumbnail?: string;
  trigger?: string;
  audience?: string;
  startAt?: string | null;
  endAt?: string | null;
  status?: string;
  views?: number;
  clicks?: number;
  createdAt?: string;
  updatedAt?: string;
};

export type AdminPopupInput = {
  title: string;
  description: string;
  actionURL?: string;
  actionText?: string;
  thumbnail?: string;
  trigger?: string;
  audience?: string;
  startAt?: string;
  endAt?: string;
  status?: string;
};

export async function fetchAdminPopups() {
  const response = await apiRequest<{ page: AdminPopupRecord[] }>("/popup/list?page=0&size=100", {
    method: "GET",
    token: readToken(),
  });
  return response.payload?.page ?? [];
}

export async function createAdminPopup(input: AdminPopupInput) {
  const response = await apiRequest<AdminPopupRecord>("/popup/", {
    method: "POST",
    body: input,
    token: readToken(),
  });
  if (!response.payload) throw new Error("Missing pop-up payload");
  return response.payload;
}

export async function updateAdminPopup(id: number, input: Partial<AdminPopupInput> & { views?: number; clicks?: number }) {
  const response = await apiRequest<AdminPopupRecord>(`/popup/${id}`, {
    method: "PUT",
    body: input,
    token: readToken(),
  });
  if (!response.payload) throw new Error("Missing pop-up payload");
  return response.payload;
}

export async function deleteAdminPopup(id: number) {
  await apiRequest(`/popup/${id}`, {
    method: "DELETE",
    token: readToken(),
  });
}
