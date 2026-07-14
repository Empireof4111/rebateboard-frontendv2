import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ClipboardCheck, Search, Filter, Plus, RefreshCw, Upload, Building2, Clock, CheckCircle2 } from "lucide-react";
import { ClaimDetailDrawer } from "@/components/dashboard/ClaimDetailDrawer";
import { EmptyStateAction, GuidedEmptyState } from "@/components/dashboard/Primitives";
import { useAuth } from "@/lib/auth";
import { financeApi, type CashbackClaim } from "@/lib/finance-api";
import { ApiError } from "@/lib/api";
import { fetchMyChallengePurchases, type ChallengePurchaseRow } from "@/lib/challenge-purchases-api";

export const Route = createFileRoute("/dashboard/claims")({
  head: () => ({
    meta: [
      { title: "My Claims — RebateBoard" },
      { name: "description", content: "Track every cashback claim you've submitted, see status, evidence and review notes." },
    ],
  }),
  component: ClaimsPage,
});

// Map backend CashbackClaim to the shape ClaimDetailDrawer expects
type UIClaimStatus = "pending" | "processing" | "needs_action" | "approved" | "paid" | "rejected" | "expired";
type UIClaim = {
  id: string;
  user: string;
  partner: string;
  partnerCategory: string;
  accountId: string;
  type: string;
  amount: number;
  evidence: number;
  evidenceUrls: string[];
  registeredEmail?: string;
  orderId?: string;
  payoutTarget: string;
  submitted: string;
  status: UIClaimStatus;
  note?: string;
  approvedAt?: string;
  approvedBy?: string;
  payoutMethod?: string;
  payoutTxRef?: string;
};

function mapClaim(c: CashbackClaim): UIClaim {
  const statusMap: Record<string, UIClaimStatus> = {
    PENDING: "pending",
    PROCESSING: "processing",
    NEEDS_ACTION: "needs_action",
    APPROVED: "approved",
    PAID: "paid",
    DECLINED: "rejected",
    REJECTED: "rejected",
    EXPIRED: "expired",
  };
  return {
    id: String(c.id),
    user: c.user?.name ?? `User #${c.userId}`,
    partner: c.partner,
    partnerCategory: c.partnerCategory ?? "",
    accountId: c.accountId ?? "",
    type: c.type,
    amount: Number(c.amount),
    evidence: c.evidence,
    evidenceUrls: c.evidenceUrls ?? [],
    registeredEmail: c.registeredEmail,
    orderId: c.orderId,
    payoutTarget: c.payoutTarget,
    submitted: new Date(c.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }),
    status: statusMap[c.status] ?? "pending",
    note: c.note,
    approvedAt: c.approvedAt ? new Date(c.approvedAt).toLocaleDateString() : undefined,
    approvedBy: c.approvedBy?.name,
    payoutMethod: c.payoutMethod,
    payoutTxRef: c.payoutTxRef,
  };
}

function ClaimsPage() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [rawClaims, setRawClaims] = useState<CashbackClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [challengeRows, setChallengeRows] = useState<ChallengePurchaseRow[]>([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"all" | UIClaimStatus>("all");
  const [brandFilter, setBrandFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState<"all" | "7d" | "30d" | "90d">("all");
  const [accountTypeFilter, setAccountTypeFilter] = useState("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const load = useCallback(async (pageNum = 0) => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const [claimsRes, challengeRes] = await Promise.all([
        financeApi.getMyClaims(token, { page: pageNum, size: 30 }),
        pageNum === 0 ? fetchMyChallengePurchases() : Promise.resolve(null),
      ]);
      if (claimsRes.payload) {
        setRawClaims(pageNum === 0 ? claimsRes.payload.page : (prev) => [...prev, ...claimsRes.payload!.page]);
        setTotalPages(claimsRes.payload.totalPages);
        setPage(pageNum);
      }
      if (pageNum === 0 && challengeRes?.rows) {
        setChallengeRows(challengeRes.rows);
      }
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Unable to load claims.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(0); }, [load]);

  const claims = useMemo(() => rawClaims.map(mapClaim), [rawClaims]);

  const brands = useMemo(() => Array.from(new Set(claims.map((c) => c.partner).filter(Boolean))).sort(), [claims]);
  const accountTypes = useMemo(() => Array.from(new Set(claims.map((c) => c.type).filter(Boolean))).sort(), [claims]);
  const filtered = useMemo(() => claims.filter((c) => {
    if (status !== "all" && c.status !== status) return false;
    if (brandFilter !== "all" && c.partner !== brandFilter) return false;
    if (accountTypeFilter !== "all" && c.type !== accountTypeFilter) return false;
    if (dateFilter !== "all") {
      const submitted = new Date(c.submitted).getTime();
      const now = Date.now();
      const days = dateFilter === "7d" ? 7 : dateFilter === "30d" ? 30 : 90;
      if (!Number.isFinite(submitted) || now - submitted > days * 24 * 60 * 60 * 1000) return false;
    }
    return q.trim() === "" ||
      c.partner.toLowerCase().includes(q.toLowerCase()) ||
      c.id.toLowerCase().includes(q.toLowerCase()) ||
      c.accountId.toLowerCase().includes(q.toLowerCase());
  }), [accountTypeFilter, brandFilter, claims, dateFilter, q, status]);

  const totals = useMemo(() => ({
    pending: claims.filter((c) => c.status === "pending").reduce((s, c) => s + c.amount, 0),
    processing: claims.filter((c) => c.status === "processing").length,
    needsAction: claims.filter((c) => c.status === "needs_action").length,
    approved: claims.filter((c) => c.status === "approved").reduce((s, c) => s + c.amount, 0),
    paid: claims.filter((c) => c.status === "paid").reduce((s, c) => s + c.amount, 0),
    rejected: claims.filter((c) => c.status === "rejected").length,
    expired: claims.filter((c) => c.status === "expired").length,
  }), [claims]);

  const open = openId ? claims.find((c) => c.id === openId) : null;

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <button onClick={() => navigate({ to: "/dashboard/wallet" })} className="mb-2 inline-flex items-center gap-1 text-xs text-white/60 hover:text-white">
            ← Back to Wallet
          </button>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-white">
            <ClipboardCheck className="h-6 w-6 text-violet-300" /> My cashback claims
          </h1>
          <p className="mt-1 text-sm text-white/60">Every claim you submit lives here — with proof, timeline, and payout target.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => load(0)} className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-white">
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
          <button onClick={() => navigate({ to: "/dashboard/wallet" })} className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-2 text-xs font-semibold text-white shadow">
            <Plus className="h-3.5 w-3.5" /> New claim
          </button>
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-4">
        <Stat label="Pending" value={`$${totals.pending.toFixed(2)}`} tone="violet" />
        <Stat label="Processing" value={`${totals.processing}`} tone="sky" />
        <Stat label="Needs Action" value={`${totals.needsAction}`} tone="violet" />
        <Stat label="Approved" value={`$${totals.approved.toFixed(2)}`} tone="sky" />
        <Stat label="Paid" value={`$${totals.paid.toFixed(2)}`} tone="emerald" />
        <Stat label="Rejected" value={`${totals.rejected}`} tone="rose" />
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-white">Challenge purchase journey</div>
            <p className="mt-1 text-xs text-white/50">Recent prop-firm buy clicks, reward choices, and claim milestones tracked from your challenge flow.</p>
          </div>
          <div className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/70">{challengeRows.length} events</div>
        </div>
        <div className="mt-3 grid gap-2 md:grid-cols-3">
          {challengeRows.slice(0, 6).map((row) => (
            <div key={row.id} className="rounded-xl border border-white/10 bg-black/20 p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="text-sm font-semibold text-white">{row.firm}</div>
                <span className="rounded-full bg-violet-500/15 px-2 py-0.5 text-[10px] text-violet-200">
                  {purchaseStatusLabel(row.step)}
                </span>
              </div>
              <div className="mt-1 text-xs text-white/60">{row.program}</div>
              <div className="mt-2 flex items-center justify-between text-xs">
                <span className="text-violet-200">${row.amountUsd.toFixed(2)}</span>
                <span className="text-white/50">{new Date(row.when).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
          {challengeRows.length === 0 && (
            <div className="rounded-xl border border-dashed border-white/10 bg-black/20 px-4 py-6 text-center text-sm text-white/45 md:col-span-3">
              Challenge purchase activity will start appearing here after you interact with a prop-firm checkout or submit a challenge cashback claim.
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-3">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/40" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search partner, account, claim ID…"
            className="w-full rounded-lg border border-white/10 bg-black/30 py-2 pl-9 pr-3 text-sm text-white placeholder:text-white/40 focus:border-accent focus:outline-none" />
        </div>
        <div className="flex max-w-full items-center gap-1.5 overflow-x-auto pb-1">
          <Filter className="h-3.5 w-3.5 text-white/40" />
          {(["all", "pending", "processing", "needs_action", "approved", "paid", "rejected", "expired"] as const).map((s) => (
            <button key={s} onClick={() => setStatus(s)}
              className={`rounded-full px-3 py-1.5 text-xs ${status === s ? "bg-accent text-black" : "bg-white/5 text-white/70 hover:bg-white/10"}`}>
              {formatStatusLabel(s)}
            </button>
          ))}
        </div>
        <select value={brandFilter} onChange={(e) => setBrandFilter(e.target.value)} className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-xs text-white">
          <option value="all">All brands</option>
          {brands.map((brand) => <option key={brand} value={brand}>{brand}</option>)}
        </select>
        <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value as typeof dateFilter)} className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-xs text-white">
          <option value="all">All dates</option>
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
        </select>
        <select value={accountTypeFilter} onChange={(e) => setAccountTypeFilter(e.target.value)} className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-xs text-white">
          <option value="all">All account types</option>
          {accountTypes.map((type) => <option key={type} value={type}>{type}</option>)}
        </select>
      </div>

      {error && claims.length === 0 ? (
        <div className="rounded-xl border border-rose-400/20 bg-rose-500/[0.06] px-4 py-8 text-center">
          <p className="text-sm font-semibold text-white">Claims could not be loaded</p>
          <p className="mt-1 text-xs text-rose-100/75">{error}</p>
          <button type="button" onClick={() => void load(0)} className="mt-4 rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/15">
            Try again
          </button>
        </div>
      ) : loading && claims.length === 0 ? (
        <div className="grid gap-3 md:grid-cols-2">
          {[0, 1, 2, 3].map((item) => (
            <div key={item} className="h-20 animate-pulse rounded-xl border border-white/10 bg-white/[0.04]" />
          ))}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-white/10 bg-white/5">
          <div className="hidden grid-cols-12 gap-2 border-b border-white/10 bg-white/5 px-4 py-2 text-[11px] uppercase tracking-wide text-white/50 sm:grid">
            <div className="col-span-3">Partner</div>
            <div className="col-span-2">Type</div>
            <div className="col-span-2">Account</div>
            <div className="col-span-2 text-right">Amount</div>
            <div className="col-span-2">Submitted</div>
            <div className="col-span-1 text-right">Status</div>
          </div>
          {filtered.length === 0 && (
            <div className="p-4">
              <GuidedEmptyState
                icon={Upload}
                title={claims.length === 0 ? "Submit your first cashback claim" : "No claims match your filters"}
                description={claims.length === 0
                  ? "Choose an eligible brand, attach proof, select your payout wallet, and RebateBoard will track the review timeline here."
                  : "Clear one or two filters, or search another brand, account ID, or claim reference."}
                action={
                  <button onClick={() => navigate({ to: "/dashboard/wallet" })}>
                    <EmptyStateAction>{claims.length === 0 ? "Submit Cashback" : "Open Wallet"}</EmptyStateAction>
                  </button>
                }
                preview={<ExampleClaimPreview />}
              />
            </div>
          )}
          {filtered.map((c) => (
            <button key={c.id} onClick={() => setOpenId(c.id)}
              className="grid w-full grid-cols-2 gap-2 border-b border-white/5 px-4 py-3 text-left text-sm hover:bg-white/5 sm:grid-cols-12">
              <div className="col-span-2 sm:col-span-3 font-medium text-white">
                {c.partner}
                <div className="text-[11px] text-white/40 sm:hidden">#{c.id}</div>
              </div>
              <div className="col-span-1 sm:col-span-2 text-white/70">{c.type}</div>
              <div className="col-span-1 sm:col-span-2 text-white/60 font-mono text-xs">{c.accountId || "—"}</div>
              <div className="col-span-1 sm:col-span-2 text-right font-semibold text-white">${c.amount.toFixed(2)}</div>
              <div className="col-span-1 sm:col-span-2 text-white/50 text-xs">{c.submitted}</div>
              <div className="col-span-2 sm:col-span-1 sm:text-right">
                <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${
                  c.status === "paid" ? "bg-emerald-500/15 text-emerald-300"
                  : c.status === "approved" ? "bg-sky-500/15 text-sky-300"
                  : c.status === "processing" ? "bg-violet-500/15 text-violet-200"
                  : c.status === "needs_action" ? "bg-amber-500/15 text-amber-200"
                  : c.status === "rejected" ? "bg-rose-500/15 text-rose-300"
                  : c.status === "expired" ? "bg-white/10 text-white/45"
                  : "bg-violet-500/15 text-violet-200"
                }`}>{formatStatusLabel(c.status)}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {totalPages > 1 && page < totalPages - 1 && (
        <div className="flex justify-center">
          <button onClick={() => load(page + 1)} disabled={loading} className="rounded-full bg-white/10 px-4 py-1.5 text-xs text-white disabled:opacity-40">
            {loading ? "Preparing…" : "Load more"}
          </button>
        </div>
      )}

      {open && <ClaimDetailDrawer claim={open as any} onClose={() => setOpenId(null)} />}
    </div>
  );
}

function purchaseStatusLabel(step: string) {
  const labels: Record<string, string> = {
    buy_click: "Program selected",
    checkout: "Checkout opened",
    reward_chosen: "Reward selected",
    claim_guide_viewed: "Claim guide viewed",
    finalized: "Completed",
    intent_created: "Started",
    redirected_to_partner: "Sent to partner",
    pending_purchase: "Waiting for purchase",
    user_marked_completed: "Purchase marked complete",
    proof_submitted: "Proof submitted",
    under_review: "Under review",
    approved: "Approved",
    rejected: "Rejected",
    reward_credited: "Reward credited",
  };
  return labels[step] || "In progress";
}

function formatStatusLabel(status: "all" | UIClaimStatus) {
  const labels: Record<"all" | UIClaimStatus, string> = {
    all: "All",
    pending: "Pending",
    processing: "Processing",
    needs_action: "Needs Action",
    approved: "Approved",
    paid: "Paid",
    rejected: "Rejected",
    expired: "Expired",
  };
  return labels[status];
}

function ExampleClaimPreview() {
  return (
    <div className="grid gap-2 text-xs text-white/70 sm:grid-cols-4">
      <div className="flex items-center gap-2 rounded-xl bg-white/[0.035] px-3 py-2">
        <Building2 className="h-3.5 w-3.5 text-violet-300" />
        FundingPips
      </div>
      <div className="flex items-center gap-2 rounded-xl bg-white/[0.035] px-3 py-2">
        <Upload className="h-3.5 w-3.5 text-violet-300" />
        Proof attached
      </div>
      <div className="flex items-center gap-2 rounded-xl bg-white/[0.035] px-3 py-2">
        <Clock className="h-3.5 w-3.5 text-violet-300" />
        Under review
      </div>
      <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 px-3 py-2 text-emerald-200">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Paid to wallet
      </div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone: "violet" | "emerald" | "rose" | "sky" }) {
  const ring = tone === "emerald" ? "from-emerald-500/20" : tone === "violet" ? "from-violet-500/20" : tone === "sky" ? "from-sky-500/20" : "from-rose-500/20";
  return (
    <div className={`rounded-xl border border-white/10 bg-gradient-to-br ${ring} to-transparent p-4`}>
      <div className="text-[11px] uppercase tracking-wide text-white/60">{label}</div>
      <div className="mt-1 text-2xl font-bold text-white">{value}</div>
    </div>
  );
}
