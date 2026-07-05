import { useCallback, useEffect, useMemo, useState } from "react";
import { ApiError, apiRequest } from "@/lib/api";

export type NotificationKind =
  | "rr"
  | "review"
  | "referral"
  | "claim"
  | "withdrawal"
  | "tbi"
  | "system";

export type NotificationItem = {
  id: string;
  kind: NotificationKind;
  title: string;
  body?: string;
  href?: string;
  createdAt: string;
  read: boolean;
};

type NotificationStatus = "idle" | "loading" | "success" | "error";

type BackendNotification = {
  id?: string | number;
  title?: string;
  subject?: string;
  category?: string | null;
  body?: unknown;
  status?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

type Paginated<T> = {
  page?: T[];
  size?: number;
  currentPage?: number;
  totalPages?: number;
};

const KIND_ROUTES: Record<NotificationKind, string> = {
  rr: "/dashboard/rewards",
  review: "/dashboard/reviews",
  referral: "/dashboard/referrals",
  claim: "/dashboard/claims",
  withdrawal: "/dashboard/wallet",
  tbi: "/dashboard/tbi",
  system: "/dashboard",
};

function kindFromCategory(category?: string | null): NotificationKind {
  const value = String(category ?? "").toLowerCase();
  if (value.includes("reward") || value.includes("rr")) return "rr";
  if (value.includes("review")) return "review";
  if (value.includes("refer")) return "referral";
  if (value.includes("cashback") || value.includes("claim")) return "claim";
  if (value.includes("withdraw")) return "withdrawal";
  if (value.includes("tbi") || value.includes("trust")) return "tbi";
  return "system";
}

function bodyToText(body: unknown): string | undefined {
  if (body == null) return undefined;
  if (typeof body === "string") return body;
  if (typeof body === "number" || typeof body === "boolean") return String(body);
  if (typeof body === "object") {
    const record = body as Record<string, unknown>;
    const message = record.message ?? record.body ?? record.text ?? record.description;
    if (typeof message === "string") return message;
  }
  return undefined;
}

function normalizeNotification(input: BackendNotification): NotificationItem {
  const kind = kindFromCategory(input.category);
  const status = String(input.status ?? "").toUpperCase();
  const read = status === "SEEN" || status === "READ" || status === "ACTIVE";
  const body = bodyToText(input.body);

  return {
    id: String(input.id ?? crypto.randomUUID()),
    kind,
    title: input.title ?? input.subject ?? "Notification",
    body,
    href: KIND_ROUTES[kind],
    createdAt: input.createdAt ?? input.updatedAt ?? new Date().toISOString(),
    read,
  };
}

async function fetchNotifications(token: string): Promise<NotificationItem[]> {
  try {
    const response = await apiRequest<Paginated<BackendNotification>>("/notification/list?page=0&size=50", {
      method: "GET",
      token,
    });
    const page = Array.isArray(response.payload?.page) ? response.payload.page : [];
    return page.map(normalizeNotification).sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  } catch (error) {
    if (error instanceof ApiError && /no user found|no notification found/i.test(error.message)) return [];
    throw error;
  }
}

async function setNotificationRead(token: string, id: string) {
  await apiRequest(`/notification/${id}?status=SEEN`, {
    method: "PUT",
    token,
  });
}

export function useNotifications(token?: string | null) {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [status, setStatus] = useState<NotificationStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!token) {
      setItems([]);
      setStatus("idle");
      setError(null);
      return;
    }

    setStatus((current) => (current === "success" ? "success" : "loading"));
    setError(null);
    try {
      const next = await fetchNotifications(token);
      setItems(next);
      setStatus("success");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Unable to load notifications");
    }
  }, [token]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const markRead = useCallback(async (id: string) => {
    setItems((current) => current.map((item) => (item.id === id ? { ...item, read: true } : item)));
    if (!token) return;
    try {
      await setNotificationRead(token, id);
    } catch {
      void refresh();
    }
  }, [refresh, token]);

  const markAllRead = useCallback(async () => {
    const unreadIds = items.filter((item) => !item.read).map((item) => item.id);
    setItems((current) => current.map((item) => ({ ...item, read: true })));
    if (!token || unreadIds.length === 0) return;
    try {
      await Promise.all(unreadIds.map((id) => setNotificationRead(token, id)));
    } catch {
      void refresh();
    }
  }, [items, refresh, token]);

  const unread = useMemo(() => items.filter((item) => !item.read).length, [items]);

  return { items, unread, status, error, refresh, markRead, markAllRead };
}
