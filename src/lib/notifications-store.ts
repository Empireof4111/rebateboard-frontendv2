/**
 * User notifications store — feeds the bell icon in DashboardLayout.
 * Persists in localStorage. Add events from anywhere via pushNotification().
 */
import { useEffect, useState } from "react";

export type NotificationKind =
  | "rr"          // RR earned / spent
  | "review"      // review approved/rejected/replied
  | "referral"    // referral converted
  | "claim"       // claim status change
  | "tbi"         // TBI score moved
  | "system";     // generic

export type NotificationItem = {
  id: string;
  kind: NotificationKind;
  title: string;
  body?: string;
  href?: string;          // where the card should link to
  createdAt: string;      // ISO
  read: boolean;
};

const KEY = "rb_notifications_v1";
type Listener = () => void;
const listeners = new Set<Listener>();

function load(): NotificationItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as NotificationItem[];
  } catch {}
  // seed
  const seed: NotificationItem[] = [
    { id: "n_w1", kind: "system", title: "Welcome to RebateBoard", body: "Your trader OS is ready. Connect a brand to start earning.", createdAt: new Date(Date.now() - 60 * 60_000).toISOString(), read: false, href: "/dashboard/brands" },
    { id: "n_rr1", kind: "rr", title: "+50 RR — Daily streak", body: "Keep your streak alive to multiply tomorrow's reward.", createdAt: new Date(Date.now() - 6 * 60_000).toISOString(), read: false, href: "/dashboard/rewards" },
  ];
  localStorage.setItem(KEY, JSON.stringify(seed));
  return seed;
}

function save(items: NotificationItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(items));
  listeners.forEach((fn) => fn());
}

export function getNotifications(): NotificationItem[] {
  return load().sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
}

export function pushNotification(input: Omit<NotificationItem, "id" | "createdAt" | "read">) {
  const item: NotificationItem = {
    ...input,
    id: `n_${Math.random().toString(36).slice(2, 10)}`,
    createdAt: new Date().toISOString(),
    read: false,
  };
  save([item, ...load()]);
  return item;
}

export function markAllRead() {
  save(load().map((n) => ({ ...n, read: true })));
}

export function markRead(id: string) {
  save(load().map((n) => (n.id === id ? { ...n, read: true } : n)));
}

export function clearAll() { save([]); }

export function useNotifications() {
  const [items, setItems] = useState<NotificationItem[]>(() => getNotifications());
  useEffect(() => {
    const fn = () => setItems(getNotifications());
    listeners.add(fn);
    return () => { listeners.delete(fn); };
  }, []);
  const unread = items.filter((n) => !n.read).length;
  return { items, unread, markAllRead, markRead };
}
