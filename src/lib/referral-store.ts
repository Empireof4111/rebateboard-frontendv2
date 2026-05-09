/**
 * Referral system — every signed-in user automatically owns a referral code.
 * Tracks the full funnel: click → signup → qualified (KYC / first deposit) → paid.
 *
 * Storage:
 *   - codes:       { userId → ReferralProfile }   (one per user)
 *   - events:      ReferralEvent[]                (append-only funnel log)
 *   - payouts:     ReferralPayout[]               (admin-issued payouts)
 *
 * Persistence: localStorage so user dashboard + admin both observe the same data
 * across tabs. When the API arrives, swap the read/write helpers and the rest
 * of the system stays identical.
 */

import { useEffect, useMemo, useState, useCallback } from "react";

/* ---------- types ---------- */

export type ReferralProfile = {
  userId: string;
  userName: string;
  email: string;
  code: string;                 // 8-char readable id, e.g. "AIDEN-7K2"
  createdAt: number;
  commissionPct: number;        // % share of referee revenue (default 20)
  rrPerSignup: number;          // RR awarded per qualified signup (default 250)
  customSlug?: string;          // user-chosen vanity (rebateboard.com/r/aidenpro)
  status: "active" | "suspended";
  notes?: string;
};

export type ReferralEventKind = "click" | "signup" | "qualified" | "revenue";

export type ReferralEvent = {
  id: string;
  code: string;                 // referrer's code
  kind: ReferralEventKind;
  refereeName?: string;         // present after signup
  refereeEmail?: string;
  source?: string;              // utm_source / channel
  amount?: number;              // USD revenue (for kind="revenue")
  createdAt: number;
};

export type ReferralPayout = {
  id: string;
  code: string;
  userName: string;
  amount: number;
  method: "wallet" | "manual";
  note?: string;
  createdAt: number;
};

/* ---------- storage ---------- */

const KEYS = {
  codes: "rb-referrals:codes",
  events: "rb-referrals:events",
  payouts: "rb-referrals:payouts",
  pendingRef: "rb-referrals:pending-ref", // code captured from URL before signup
};

type Listener = () => void;
const listeners = new Set<Listener>();
function emit() { listeners.forEach((l) => l()); }
function subscribe(fn: Listener) { listeners.add(fn); return () => listeners.delete(fn); }

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch { return fallback; }
}
function write<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
  emit();
}

/* ---------- code generation ---------- */

function makeCode(name: string): string {
  const base = (name || "trader").replace(/[^a-zA-Z]/g, "").slice(0, 6).toUpperCase() || "TRADER";
  const rand = Math.random().toString(36).slice(2, 5).toUpperCase();
  return `${base}-${rand}`;
}

/* ---------- profile API ---------- */

export function getAllProfiles(): ReferralProfile[] {
  return read<ReferralProfile[]>(KEYS.codes, []);
}

export function getReferralProfile(userId: string): ReferralProfile | undefined {
  return getAllProfiles().find((p) => p.userId === userId);
}

export function getOrCreateReferralProfile(input: {
  userId: string; userName: string; email: string;
}): ReferralProfile {
  const all = getAllProfiles();
  const existing = all.find((p) => p.userId === input.userId);
  if (existing) return existing;

  // ensure code uniqueness across the population
  let code = makeCode(input.userName);
  while (all.some((p) => p.code === code)) code = makeCode(input.userName);

  const profile: ReferralProfile = {
    userId: input.userId,
    userName: input.userName,
    email: input.email,
    code,
    createdAt: Date.now(),
    commissionPct: 20,
    rrPerSignup: 250,
    status: "active",
  };
  write(KEYS.codes, [profile, ...all]);
  return profile;
}

export function updateReferralProfile(userId: string, patch: Partial<ReferralProfile>) {
  const all = getAllProfiles();
  const next = all.map((p) => (p.userId === userId ? { ...p, ...patch } : p));
  write(KEYS.codes, next);
}

/** Returns true if the slug is unique (or unchanged for the same user). */
export function isSlugAvailable(slug: string, ownerUserId?: string): boolean {
  const v = slug.trim().toLowerCase();
  if (!v) return false;
  if (!/^[a-z0-9_-]{3,24}$/.test(v)) return false;
  return !getAllProfiles().some((p) => p.customSlug?.toLowerCase() === v && p.userId !== ownerUserId);
}

/* ---------- event capture ---------- */

export function getEvents(): ReferralEvent[] {
  return read<ReferralEvent[]>(KEYS.events, []);
}

function pushEvent(ev: Omit<ReferralEvent, "id" | "createdAt"> & { createdAt?: number }) {
  const row: ReferralEvent = {
    id: `re_${Math.random().toString(36).slice(2, 10)}`,
    createdAt: ev.createdAt ?? Date.now(),
    ...ev,
  };
  write(KEYS.events, [row, ...getEvents()]);
  return row;
}

/** Capture a `?ref=CODE` from any landing page. Stays for 30 days. */
export function captureRefFromUrl() {
  if (typeof window === "undefined") return;
  const params = new URLSearchParams(window.location.search);
  const code = params.get("ref")?.trim().toUpperCase();
  if (!code) return;
  // store as pending until signup completes
  localStorage.setItem(KEYS.pendingRef, JSON.stringify({ code, at: Date.now() }));
  // also log a click event so the referrer sees traffic immediately
  pushEvent({ code, kind: "click", source: params.get("utm_source") ?? "link" });
}

export function getPendingRef(): { code: string; at: number } | null {
  return read<{ code: string; at: number } | null>(KEYS.pendingRef, null);
}

export function clearPendingRef() {
  if (typeof window !== "undefined") localStorage.removeItem(KEYS.pendingRef);
  emit();
}

/** Called from signup completion. Records signup + clears pending. */
export function recordReferralSignup(input: { refereeName: string; refereeEmail: string }) {
  const pending = getPendingRef();
  if (!pending) return;
  // Expire after 30 days
  if (Date.now() - pending.at > 1000 * 60 * 60 * 24 * 30) { clearPendingRef(); return; }
  pushEvent({ code: pending.code, kind: "signup", refereeName: input.refereeName, refereeEmail: input.refereeEmail });
  clearPendingRef();
}

/** Mark a referee as qualified (KYC done / first deposit). */
export function markQualified(input: { code: string; refereeEmail: string }) {
  pushEvent({ code: input.code, kind: "qualified", refereeEmail: input.refereeEmail });
}

/** Log a revenue event from the referee — used to compute pending commission. */
export function recordReferralRevenue(input: { code: string; refereeEmail?: string; amount: number; source?: string }) {
  pushEvent({ code: input.code, kind: "revenue", refereeEmail: input.refereeEmail, amount: input.amount, source: input.source });
}

/* ---------- payouts ---------- */

export function getPayouts(): ReferralPayout[] {
  return read<ReferralPayout[]>(KEYS.payouts, []);
}

export function recordPayout(input: { code: string; userName: string; amount: number; method?: "wallet" | "manual"; note?: string }) {
  const row: ReferralPayout = {
    id: `rp_${Math.random().toString(36).slice(2, 10)}`,
    code: input.code,
    userName: input.userName,
    amount: input.amount,
    method: input.method ?? "wallet",
    note: input.note,
    createdAt: Date.now(),
  };
  write(KEYS.payouts, [row, ...getPayouts()]);
  return row;
}

/* ---------- analytics ---------- */

export type ReferralStats = {
  clicks: number;
  signups: number;
  qualified: number;
  totalRevenue: number;
  earnedLifetime: number;
  paid: number;
  pending: number;
  conversion: number;          // signups / clicks
  qualifyRate: number;         // qualified / signups
};

export function computeStats(profile: ReferralProfile): ReferralStats {
  const events = getEvents().filter((e) => e.code === profile.code);
  const clicks = events.filter((e) => e.kind === "click").length;
  const signups = events.filter((e) => e.kind === "signup").length;
  const qualified = events.filter((e) => e.kind === "qualified").length;
  const totalRevenue = events.filter((e) => e.kind === "revenue").reduce((s, e) => s + (e.amount ?? 0), 0);
  const earnedLifetime = totalRevenue * (profile.commissionPct / 100);
  const paid = getPayouts().filter((p) => p.code === profile.code).reduce((s, p) => s + p.amount, 0);
  const pending = Math.max(0, earnedLifetime - paid);
  return {
    clicks,
    signups,
    qualified,
    totalRevenue,
    earnedLifetime,
    paid,
    pending,
    conversion: clicks ? signups / clicks : 0,
    qualifyRate: signups ? qualified / signups : 0,
  };
}

export type RefereeRow = {
  email: string;
  name?: string;
  signupAt: number;
  qualifiedAt?: number;
  revenue: number;
  commission: number;
};

export function getReferees(profile: ReferralProfile): RefereeRow[] {
  const events = getEvents().filter((e) => e.code === profile.code);
  const map = new Map<string, RefereeRow>();
  for (const e of events) {
    const key = (e.refereeEmail ?? "anon").toLowerCase();
    if (!map.has(key)) map.set(key, { email: e.refereeEmail ?? "—", name: e.refereeName, signupAt: e.createdAt, revenue: 0, commission: 0 });
    const row = map.get(key)!;
    if (e.kind === "signup") { row.signupAt = e.createdAt; if (e.refereeName) row.name = e.refereeName; }
    if (e.kind === "qualified") row.qualifiedAt = e.createdAt;
    if (e.kind === "revenue") row.revenue += e.amount ?? 0;
  }
  for (const r of map.values()) r.commission = r.revenue * (profile.commissionPct / 100);
  return Array.from(map.values()).sort((a, b) => b.signupAt - a.signupAt);
}

/* ---------- React hooks ---------- */

export function useReferralProfile(user: { id: string; name: string; email: string } | null | undefined) {
  const [profile, setProfile] = useState<ReferralProfile | null>(() =>
    user ? getOrCreateReferralProfile({ userId: user.id, userName: user.name, email: user.email }) : null,
  );

  useEffect(() => {
    if (!user) { setProfile(null); return; }
    const p = getOrCreateReferralProfile({ userId: user.id, userName: user.name, email: user.email });
    setProfile(p);
    const off = subscribe(() => setProfile(getReferralProfile(user.id) ?? p));
    return () => { off(); };
  }, [user?.id, user?.name, user?.email]);

  const update = useCallback((patch: Partial<ReferralProfile>) => {
    if (!user) return;
    updateReferralProfile(user.id, patch);
  }, [user?.id]);

  return { profile, update };
}

export function useReferralData(profile: ReferralProfile | null) {
  const [tick, setTick] = useState(0);
  useEffect(() => { const off = subscribe(() => setTick((t) => t + 1)); return () => { off(); }; }, []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => {
    if (!profile) return { stats: null, referees: [], events: [] as ReferralEvent[], payouts: [] as ReferralPayout[] };
    return {
      stats: computeStats(profile),
      referees: getReferees(profile),
      events: getEvents().filter((e) => e.code === profile.code).slice(0, 50),
      payouts: getPayouts().filter((p) => p.code === profile.code),
    };
  }, [profile?.code, profile?.commissionPct, tick]);
}

export function useAllReferrals() {
  const [tick, setTick] = useState(0);
  useEffect(() => { const off = subscribe(() => setTick((t) => t + 1)); return () => { off(); }; }, []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => {
    const profiles = getAllProfiles();
    return profiles.map((p) => ({ profile: p, stats: computeStats(p) }));
  }, [tick]);
}

/* ---------- link helpers ---------- */

export function buildShareUrl(profile: ReferralProfile, source?: string): string {
  const origin = typeof window !== "undefined" ? window.location.origin : "https://rebateboard.com";
  const slug = profile.customSlug ? `/r/${profile.customSlug}` : `/?ref=${encodeURIComponent(profile.code)}`;
  const sep = slug.includes("?") ? "&" : "?";
  return `${origin}${slug}${source ? `${sep}utm_source=${encodeURIComponent(source)}` : ""}`;
}

/* ---------- demo seed (non-destructive) ---------- */
// Seed a couple of fake events so the dashboard has shape on first paint.
// Only runs once per user/profile.
export function seedDemoForProfile(profile: ReferralProfile) {
  const existing = getEvents().some((e) => e.code === profile.code);
  if (existing) return;
  const now = Date.now();
  const events: ReferralEvent[] = [
    { id: "s1", code: profile.code, kind: "click", source: "twitter", createdAt: now - 1000 * 60 * 60 * 24 * 6 },
    { id: "s2", code: profile.code, kind: "click", source: "tiktok",  createdAt: now - 1000 * 60 * 60 * 24 * 5 },
    { id: "s3", code: profile.code, kind: "click", source: "discord", createdAt: now - 1000 * 60 * 60 * 24 * 4 },
    { id: "s4", code: profile.code, kind: "signup", refereeName: "Mateo R.", refereeEmail: "mateo@gmail.com", createdAt: now - 1000 * 60 * 60 * 24 * 4 },
    { id: "s5", code: profile.code, kind: "click", source: "twitter", createdAt: now - 1000 * 60 * 60 * 24 * 3 },
    { id: "s6", code: profile.code, kind: "signup", refereeName: "Jana K.", refereeEmail: "jana@trade.io", createdAt: now - 1000 * 60 * 60 * 24 * 3 },
    { id: "s7", code: profile.code, kind: "qualified", refereeEmail: "mateo@gmail.com", createdAt: now - 1000 * 60 * 60 * 24 * 2 },
    { id: "s8", code: profile.code, kind: "revenue", refereeEmail: "mateo@gmail.com", amount: 180, source: "FundingPips", createdAt: now - 1000 * 60 * 60 * 24 * 2 },
    { id: "s9", code: profile.code, kind: "click", source: "youtube", createdAt: now - 1000 * 60 * 60 * 24 * 1 },
    { id: "s10", code: profile.code, kind: "revenue", refereeEmail: "mateo@gmail.com", amount: 120, source: "Exness", createdAt: now - 1000 * 60 * 60 * 12 },
  ];
  write(KEYS.events, [...events.reverse(), ...getEvents()]);
}
