/**
 * In-memory admin collection store with sessionStorage persistence + a small
 * "event-bus" of cross-module helpers so every Superadmin module connects:
 *
 *   Cashback  → Wallet → Withdrawal → Transaction → Audit
 *   Affiliate → Wallet → Transaction
 *   Claim     → Wallet → Transaction
 *   Review/Complaint → TBI → Brand
 *   RR earn/spend    → RR ledger
 *
 * Everything is in-memory + sessionStorage today. When the NestJS API arrives,
 * swap the implementations of these helpers with fetch / react-query — the call
 * sites in the pages stay identical.
 */
import { useCallback, useEffect, useState } from "react";

const STORAGE_PREFIX = "rb-admin:";

type Listener = () => void;
const listeners = new Map<string, Set<Listener>>();
const cache = new Map<string, unknown[]>();

function load<T>(key: string, seed: T[]): T[] {
  if (cache.has(key)) return cache.get(key) as T[];
  if (typeof window !== "undefined") {
    try {
      const raw = sessionStorage.getItem(STORAGE_PREFIX + key);
      if (raw) {
        const parsed = JSON.parse(raw) as T[];
        cache.set(key, parsed);
        return parsed;
      }
    } catch {}
  }
  cache.set(key, seed as unknown[]);
  return seed;
}

function save<T>(key: string, value: T[]) {
  cache.set(key, value as unknown[]);
  if (typeof window !== "undefined") {
    try { sessionStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value)); } catch {}
  }
  listeners.get(key)?.forEach((fn) => fn());
}

function subscribe(key: string, fn: Listener) {
  if (!listeners.has(key)) listeners.set(key, new Set());
  listeners.get(key)!.add(fn);
  return () => listeners.get(key)!.delete(fn);
}

/** Direct read/write helpers for cross-module orchestration (no React). */
export function readCollection<T>(key: string, seed: T[] = []): T[] {
  return load<T>(key, seed);
}
export function writeCollection<T>(key: string, value: T[]) { save<T>(key, value); }
export function patchCollection<T extends { id: string }>(key: string, id: string, patch: Partial<T>, seed: T[] = []) {
  const current = load<T>(key, seed);
  save(key, current.map((x) => (x.id === id ? { ...x, ...patch } : x)));
}
export function pushCollection<T>(key: string, item: T, seed: T[] = []) {
  const current = load<T>(key, seed);
  save(key, [item, ...current]);
}

export function useAdminCollection<T extends { id: string }>(key: string, seed: T[]) {
  const [items, setItems] = useState<T[]>(() => load<T>(key, seed));

  useEffect(() => {
    const unsub = subscribe(key, () => setItems([...load<T>(key, seed)]));
    return () => { unsub(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const replace = useCallback((next: T[]) => save(key, next), [key]);

  const add = useCallback((item: T) => {
    const current = load<T>(key, seed);
    save(key, [item, ...current]);
  }, [key, seed]);

  const update = useCallback((id: string, patch: Partial<T>) => {
    const current = load<T>(key, seed);
    save(key, current.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  }, [key, seed]);

  const remove = useCallback((id: string) => {
    const current = load<T>(key, seed);
    save(key, current.filter((x) => x.id !== id));
  }, [key, seed]);

  const reset = useCallback(() => save(key, seed), [key, seed]);

  return { items, add, update, remove, replace, reset };
}

export function newId(prefix = "id") {
  return `${prefix}_${Math.random().toString(36).slice(2, 8)}`;
}

/* ============================================================
 * EVENT BUS — cross-module orchestration
 * ============================================================ */

type WalletShape = {
  walletId: string;
  userId: string;
  name: string;
  available: number;
  pending: number;
  totalEarned: number;
  totalWithdrawn: number;
  status: "active" | "frozen";
  arr?: number; // RebateBoard reward token
};

type TxShape = {
  id: string;
  date: string;
  user: string;
  reference: string;
  type: string;
  amount: number;
  currency: "USD" | "ARR" | "NGN";
  channel: "System" | "Admin" | "Bank" | "Crypto";
  narration: string;
  status: "pending" | "successful" | "failed" | "reversed";
  createdBy: string;
};

type AuditShape = { id: string; actor: string; action: string; target: string; time: string };

type RrLedgerShape = { id: string; user: string; type: string; amount: string; balance: string; time: string };

const nowDate = () => {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.toLocaleString("en-US", { month: "short" })} ${d.getDate()}, ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const ref = () => `REF-${Math.floor(Math.random() * 900000 + 100000)}`;

/** Append a transaction row, used by every money-moving action. */
export function addTransaction(tx: Partial<TxShape> & { user: string; type: string; amount: number; narration: string }) {
  const row: TxShape = {
    id: newId("tr"),
    date: nowDate(),
    reference: ref(),
    currency: "USD",
    channel: "System",
    status: "successful",
    createdBy: "@admin",
    ...tx,
  } as TxShape;
  pushCollection<TxShape>("transactions", row);
  addAudit({ actor: tx.createdBy ?? "@admin", action: `${row.type} $${row.amount.toFixed(2)}`, target: row.user });
  return row;
}

/** Append an audit log entry. */
export function addAudit(a: { actor: string; action: string; target: string }) {
  const row: AuditShape = { id: newId("a"), time: "just now", ...a };
  pushCollection<AuditShape>("audit", row);
}

/** Find a wallet by userId or display name. Falls back to seed if missing. */
function findWallet(walletsSeed: WalletShape[], userKey: string): WalletShape | undefined {
  const all = readCollection<WalletShape>("userWallets", walletsSeed);
  return all.find((w) => w.userId === userKey || w.name === userKey || w.walletId === userKey);
}

/** Credit USD or ARR to a wallet. Bucket controls available vs pending. */
export function creditWallet(opts: {
  walletsSeed: WalletShape[];
  userKey: string;
  amount: number;
  bucket?: "available" | "pending";
  currency?: "USD" | "ARR";
  narration: string;
  type?: string;
  by?: string;
}) {
  const { walletsSeed, userKey, amount, bucket = "available", currency = "USD", narration, type = "Manual Credit", by = "@admin" } = opts;
  const wallets = readCollection<WalletShape>("userWallets", walletsSeed);
  const w = wallets.find((x) => x.userId === userKey || x.name === userKey || x.walletId === userKey);
  if (!w) {
    addTransaction({ user: userKey, type, amount, narration: `${narration} (no wallet found)`, status: "failed", createdBy: by, currency });
    return false;
  }
  const next = wallets.map((x) => {
    if (x.walletId !== w.walletId) return x;
    if (currency === "ARR") return { ...x, arr: (x.arr ?? 0) + amount };
    if (bucket === "pending") return { ...x, pending: x.pending + amount, totalEarned: x.totalEarned + amount };
    return { ...x, available: x.available + amount, totalEarned: x.totalEarned + amount };
  });
  writeCollection("userWallets", next);
  addTransaction({ user: w.name, type, amount, narration, createdBy: by, currency });
  return true;
}

/** Debit USD or ARR from a wallet. */
export function debitWallet(opts: {
  walletsSeed: WalletShape[];
  userKey: string;
  amount: number;
  currency?: "USD" | "ARR";
  narration: string;
  type?: string;
  by?: string;
  countWithdrawn?: boolean;
}) {
  const { walletsSeed, userKey, amount, currency = "USD", narration, type = "Manual Debit", by = "@admin", countWithdrawn = false } = opts;
  const wallets = readCollection<WalletShape>("userWallets", walletsSeed);
  const w = wallets.find((x) => x.userId === userKey || x.name === userKey || x.walletId === userKey);
  if (!w) {
    addTransaction({ user: userKey, type, amount, narration: `${narration} (no wallet)`, status: "failed", createdBy: by, currency });
    return false;
  }
  const next = wallets.map((x) => {
    if (x.walletId !== w.walletId) return x;
    if (currency === "ARR") return { ...x, arr: Math.max(0, (x.arr ?? 0) - amount) };
    return {
      ...x,
      available: Math.max(0, x.available - amount),
      totalWithdrawn: countWithdrawn ? x.totalWithdrawn + amount : x.totalWithdrawn,
    };
  });
  writeCollection("userWallets", next);
  addTransaction({ user: w.name, type, amount, narration, createdBy: by, currency });
  return true;
}

/** Move wallet pending → available (e.g. cashback clears). */
export function clearPending(opts: { walletsSeed: WalletShape[]; userKey: string; amount: number; narration: string }) {
  const { walletsSeed, userKey, amount, narration } = opts;
  const wallets = readCollection<WalletShape>("userWallets", walletsSeed);
  const w = wallets.find((x) => x.userId === userKey || x.name === userKey);
  if (!w) return false;
  const next = wallets.map((x) => x.walletId === w.walletId ? { ...x, pending: Math.max(0, x.pending - amount), available: x.available + amount } : x);
  writeCollection("userWallets", next);
  addTransaction({ user: w.name, type: "Cashback Cleared", amount, narration, createdBy: "system" });
  return true;
}

/** Toggle wallet frozen / active. */
export function setWalletStatus(opts: { walletsSeed: WalletShape[]; walletId: string; status: "active" | "frozen" }) {
  const wallets = readCollection<WalletShape>("userWallets", opts.walletsSeed);
  writeCollection("userWallets", wallets.map((x) => x.walletId === opts.walletId ? { ...x, status: opts.status } : x));
  const w = wallets.find((x) => x.walletId === opts.walletId);
  if (w) addAudit({ actor: "@admin", action: `Wallet ${opts.status === "frozen" ? "frozen" : "unfrozen"}`, target: w.name });
}

/* ===== RR ledger ===== */
export function addRrEntry(opts: { user: string; type: string; amount: number; balance?: number; }) {
  const sign = opts.amount >= 0 ? "+" : "";
  pushCollection<RrLedgerShape>("rrLedger", {
    id: newId("tx"),
    user: opts.user,
    type: opts.type,
    amount: `${sign}${opts.amount} RR`,
    balance: `${opts.balance ?? 0} RR`,
    time: "just now",
  });
}

/* ===== TBI recompute =====
 * Formula: weighted average of payout reliability (30%), complaint rate (25%),
 * verified review average (20%), transparency (15%), community signal (10%).
 * For the demo we infer from current store state; admin can override.
 */
type BrandShape = { id: string; name: string; tbi: number; complaints: number; status: string; tbiOverride?: number | null };
type ReviewShape = { id: string; brand: string; rating: number; status?: string };
type ComplaintShape = { id: string; brand: string; status: string; severity: string };

export function recomputeTbiForBrand(brandSeed: BrandShape[], reviewsSeed: ReviewShape[], complaintsSeed: ComplaintShape[], brandName: string) {
  const brands = readCollection<BrandShape>("brands", brandSeed);
  const reviews = readCollection<ReviewShape>("reviews", reviewsSeed).filter((r) => r.brand === brandName && (!r.status || r.status === "approved"));
  const complaints = readCollection<ComplaintShape>("openComplaints", complaintsSeed).filter((c) => c.brand === brandName);
  const b = brands.find((x) => x.name === brandName);
  if (!b) return;
  if (b.tbiOverride != null) return; // respect manual override

  const reviewAvg = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 20 : 80; // 0–100
  const cRate = complaints.length;
  const complaintScore = Math.max(0, 100 - cRate * 4);
  const payoutReliability = b.status === "verified" ? 90 : b.status === "review" ? 70 : 55;
  const transparency = b.status === "verified" ? 88 : 72;
  const community = Math.min(100, 60 + reviews.length * 2);

  const score = Math.round(
    payoutReliability * 0.30 +
    complaintScore   * 0.25 +
    reviewAvg        * 0.20 +
    transparency     * 0.15 +
    community        * 0.10
  );

  writeCollection<BrandShape>("brands", brands.map((x) => x.name === brandName ? { ...x, tbi: Math.max(0, Math.min(100, score)) } : x));
  addAudit({ actor: "system", action: `TBI auto-recomputed → ${score}`, target: brandName });
}

export function recomputeAllTbi(brandSeed: BrandShape[], reviewsSeed: ReviewShape[], complaintsSeed: ComplaintShape[]) {
  const brands = readCollection<BrandShape>("brands", brandSeed);
  brands.forEach((b) => recomputeTbiForBrand(brandSeed, reviewsSeed, complaintsSeed, b.name));
}

/** Direct calculator — pure function, no side effects. */
export function calculateTbi(input: {
  payoutReliability: number;  // 0–100
  complaintScore: number;     // 0–100 (higher = fewer complaints)
  reviewAvg: number;          // 0–100
  transparency: number;       // 0–100
  community: number;          // 0–100
}) {
  return Math.round(
    input.payoutReliability * 0.30 +
    input.complaintScore    * 0.25 +
    input.reviewAvg         * 0.20 +
    input.transparency      * 0.15 +
    input.community         * 0.10
  );
}
