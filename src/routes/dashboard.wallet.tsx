import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState, useCallback } from "react";
import {
  Wallet, ArrowDownToLine, Send, Bot, X, ChevronRight, ArrowUpRight,
  ArrowDownLeft, Filter, Search, CheckCircle2, Clock, CircleDollarSign,
  TrendingUp, Building2, Zap, Upload, Coins, Banknote, IdCard,
} from "lucide-react";
import { PageHeader, Panel, Pill } from "@/components/dashboard/Primitives";
import { fetchPublicAdminBrands, type AdminBrandRecord } from "@/lib/admin-brands-api";
import { LinkAccountModal } from "@/components/dashboard/LinkAccountModal";
import { useAuth } from "@/lib/auth";
import { financeApi, type WalletSummary, type PartnerRequestRecord } from "@/lib/finance-api";
import { ApiError } from "@/lib/api";
import { formatUploadLimit, validateFileSize } from "@/lib/upload-limits";

const PAYOUT_PREF_KEY = "rb-user:payoutPref";
type PayoutTarget = "rr-wallet" | "rebate-wallet" | "revete-wallet" | "broker-wallet";
type PayoutPref = { default: PayoutTarget };
const defaultPref: PayoutPref = { default: "rebate-wallet" };
type TxStatus = "Pending" | "Approved" | "Credited" | "Withdrawn" | "Completed";
type WalletTransaction = {
  id: string;
  date: string;
  source: "Forex Broker" | "Prop Firm" | "Crypto Exchange" | "Futures Broker" | "Internal" | "System";
  brandName: string;
  type: "Cashback" | "Referral" | "Transfer" | "Reward" | "Withdrawal";
  volumeLots?: number;
  commissionGenerated?: number;
  rebatePercent?: number;
  amount: number;
  status: TxStatus;
  note?: string;
  direction?: "in" | "out";
  counterpartyName?: string;
  counterpartyHandle?: string;
};

export const Route = createFileRoute("/dashboard/wallet")({
  head: () => ({
    meta: [
      { title: "Wallet — RebateBoard" },
      { name: "description", content: "Your trader wallet: balances, cashback transactions, withdrawals and internal transfers." },
    ],
  }),
  component: WalletPage,
});

function fmtUSD(n: number) {
  const sign = n < 0 ? "−" : "";
  return `${sign}$${Math.abs(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}
function formatPayoutTarget(value: string) {
  if (value === "rr-wallet") return "RR wallet";
  if (value === "broker-wallet") return "Broker wallet";
  return "Rebate wallet";
}

const statusTone: Record<TxStatus, "success" | "warning" | "primary" | "default"> = {
  Credited: "success",
  Approved: "primary",
  Pending: "warning",
  Withdrawn: "default",
  Completed: "success",
};

function WalletPage() {
  const { token, user } = useAuth();
  const [summary, setSummary] = useState<WalletSummary | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [internalTransfers, setInternalTransfers] = useState<WalletTransaction[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const [earningsBySource, setEarningsBySource] = useState<{ source: string; amount: number }[]>([]);
  const [earningsTimeline, setEarningsTimeline] = useState<{ month: string; amount: number }[]>([]);
  const [linkedAccts, setLinkedAccts] = useState<PartnerRequestRecord[]>([]);

  const [tab, setTab] = useState<"all" | "cashback" | "referral" | "transfer" | "withdrawal">("all");
  const [query, setQuery] = useState("");
  const [selectedTx, setSelectedTx] = useState<WalletTransaction | null>(null);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [claimOpen, setClaimOpen] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [pref, setPref] = useState<PayoutPref>(defaultPref);
  const checkoutClaim = useMemo(() => {
    if (typeof window === "undefined") return null;
    const params = new URLSearchParams(window.location.search);
    if (params.get("claim") !== "1") return null;
    return {
      purchaseSessionReference: params.get("purchaseSession") || "",
      partner: params.get("partner") || "",
      amount: params.get("amount") || "",
      email: params.get("email") || "",
    };
  }, []);

  useEffect(() => {
    if (checkoutClaim?.purchaseSessionReference) setClaimOpen(true);
  }, [checkoutClaim]);

  // Map backend WalletLog to the UI's WalletTransaction shape
  const mapLog = useCallback((log: import("@/lib/finance-api").WalletTransaction): WalletTransaction => {
    const channelToSource = (ch: string): WalletTransaction["source"] => {
      if (ch === "Wallet Transfer") return "Internal";
      if (ch === "Cashback") return "Prop Firm";
      if (ch === "Rebateboard" || ch === "Adjustment") return "System";
      return "System";
    };
    const activityToType = (act: string, ch: string): WalletTransaction["type"] => {
      if (act === "DEBIT" && ch === "Wallet Transfer") return "Transfer";
      if (act === "DEBIT") return "Withdrawal";
      if (ch === "Cashback") return "Cashback";
      if (ch === "Transfer" || ch === "Wallet Transfer") return "Transfer";
      if (ch === "Rebateboard" || ch === "Funding") return "Reward";
      return "Cashback";
    };
    const statusMap: Record<string, TxStatus> = {
      SUCCESSFUL: log.activity === "DEBIT" ? "Withdrawn" : "Credited",
      PENDING: "Pending",
      APPROVED: "Approved",
    };
    return {
      id: String(log.id),
      date: log.createdAt,
      source: channelToSource(log.channel),
      brandName: log.narration ?? log.channel,
      type: activityToType(log.activity, log.channel),
      amount: log.activity === "DEBIT" ? -Math.abs(Number(log.amount)) : Math.abs(Number(log.amount)),
      status: statusMap[log.status] ?? "Pending",
      note: log.narration,
    };
  }, []);

  const loadData = useCallback(async () => {
    if (!token) return;
    setLoadingData(true);
    try {
      const [summaryRes, logsRes, brkRes, timeRes, acctRes] = await Promise.allSettled([
        financeApi.getWalletSummary(token),
        financeApi.getTransactions(token, { size: 50 }),
        financeApi.getEarningsBreakdown(token),
        financeApi.getEarningsTimeline(token),
        financeApi.getMyPartnerRequests(token, { size: 50 }),
      ]);
      if (summaryRes.status === "fulfilled" && summaryRes.value.payload) setSummary(summaryRes.value.payload);
      if (logsRes.status === "fulfilled" && logsRes.value.payload) {
        const all = logsRes.value.payload.page.map(mapLog);
        setTransactions(all.filter((t) => t.type !== "Transfer" || t.amount >= 0));
        setInternalTransfers(logsRes.value.payload.page
          .filter((l) => l.channel === "Wallet Transfer")
          .map((l): WalletTransaction => ({
            ...mapLog(l),
            source: "Internal",
            type: "Transfer",
          }))
        );
      }
      if (brkRes.status === "fulfilled" && brkRes.value.payload) setEarningsBySource(brkRes.value.payload);
      if (timeRes.status === "fulfilled" && timeRes.value.payload) setEarningsTimeline(timeRes.value.payload);
      if (acctRes.status === "fulfilled" && acctRes.value.payload) setLinkedAccts(acctRes.value.payload.page);
    } catch (e) {
      console.error("Wallet load failed", e);
    } finally {
      setLoadingData(false);
    }
  }, [token, mapLog]);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(PAYOUT_PREF_KEY);
      if (raw) setPref(JSON.parse(raw));
    } catch {}
  }, []);
  const updatePref = (next: PayoutPref) => {
    setPref(next);
    try { sessionStorage.setItem(PAYOUT_PREF_KEY, JSON.stringify(next)); } catch {}
  };

  // Derive summary values — fall back to 0 while loading
  const walletSummary = {
    balance: summary?.balance ?? 0,
    totalEarned: summary?.totalEarned ?? 0,
    availableForWithdrawal: summary?.availableForWithdrawal ?? 0,
    pendingWithdrawals: summary?.pendingWithdrawals ?? 0,
    totalWithdrawn: summary?.totalWithdrawn ?? 0,
    cashbackThisMonth: transactions.filter((t) => {
      const d = new Date(t.date);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() && t.amount > 0;
    }).reduce((s, t) => s + t.amount, 0),
    rrBalance: user?.rrBalance ?? 0,
  };
  const kycVerified =
    user?.kycStatus === "verified" ||
    ((user?.verified ?? 0) > 0 && (user?.kycLevel ?? 0) > 0);

  const walletTransactions = transactions;
  const topEarningSource = useMemo(() => {
    return [...earningsBySource].sort((a, b) => b.amount - a.amount)[0] ?? null;
  }, [earningsBySource]);

  const filtered = useMemo(() => {
    return walletTransactions.filter((t) => {
      if (tab !== "all" && t.type.toLowerCase() !== tab) return false;
      if (query && !`${t.brandName} ${t.source} ${t.type}`.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
  }, [walletTransactions, tab, query]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Wallet"
        subtitle="Your financial control center — every cashback, referral, and transfer in one place."
        actions={
          <>
            <button onClick={() => setTransferOpen(true)} className="glass-pill inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-white">
              <Send className="h-3.5 w-3.5" /> Internal Transfer
            </button>
            <button onClick={() => setWithdrawOpen(true)} className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 px-3 py-1.5 text-xs font-semibold text-white shadow-[0_0_20px_rgba(16,185,129,0.45)]">
              <ArrowDownToLine className="h-3.5 w-3.5" /> Withdraw
            </button>
          </>
        }
      />

      {/* Wallet hero */}
      <div className="glass relative overflow-hidden rounded-3xl p-6 ring-1 ring-emerald-400/20">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-gradient-to-br from-emerald-400/30 to-violet-500/20 blur-3xl" />
        <div className="relative grid gap-6 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-muted-foreground">
              <Wallet className="h-3.5 w-3.5 text-emerald-400" /> Wallet Balance
            </div>
            <div className="mt-2 text-4xl font-bold text-white md:text-5xl">{fmtUSD(walletSummary.balance)}</div>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <Pill tone="success"><TrendingUp className="h-3 w-3" /> +{fmtUSD(walletSummary.cashbackThisMonth)} this month</Pill>
              <span>· RR balance: <b className="text-white">{Math.round(walletSummary.rrBalance).toLocaleString()} RR</b></span>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button onClick={() => setWithdrawOpen(true)} className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-400">
                <ArrowDownToLine className="h-3.5 w-3.5" /> Withdraw funds
              </button>
              <button onClick={() => setTransferOpen(true)} className="glass-pill inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-white">
                <Send className="h-3.5 w-3.5" /> Send to user
              </button>
              <button onClick={() => setLinkOpen(true)} className="inline-flex items-center gap-1.5 rounded-full rb-gradient-primary px-3 py-1.5 text-xs font-semibold text-white shadow-[0_0_20px_rgba(192,132,252,0.45)]">
                <Building2 className="h-3.5 w-3.5" /> Link account · earn
              </button>
              <button onClick={() => setClaimOpen(true)} className="glass-pill inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-white">
                <Bot className="h-3.5 w-3.5 text-violet-300" /> Claim cashback
              </button>
              <Link to="/dashboard/claims" className="glass-pill inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-white/80 hover:text-white">
                View all claims →
              </Link>
            </div>
          </div>

          <div className="space-y-2">
            <MiniStat label="Total Earned" value={fmtUSD(walletSummary.totalEarned)} icon={<CircleDollarSign className="h-3.5 w-3.5 text-emerald-400" />} />
            <MiniStat label="Available" value={fmtUSD(walletSummary.availableForWithdrawal)} icon={<CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />} />
          </div>
          <div className="space-y-2">
            <MiniStat label="Pending Withdrawal" value={fmtUSD(walletSummary.pendingWithdrawals)} icon={<Clock className="h-3.5 w-3.5 text-violet-300" />} />
            <MiniStat label="Total Withdrawn" value={fmtUSD(walletSummary.totalWithdrawn)} icon={<ArrowDownToLine className="h-3.5 w-3.5 text-muted-foreground" />} />
          </div>
        </div>
      </div>

      {/* Earnings intelligence */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Earnings over time" action={<Pill tone="primary">6m</Pill>}>
          {earningsTimeline.length > 0
            ? <MiniLineChart data={earningsTimeline} />
            : <div className="flex h-[120px] items-center justify-center text-xs text-muted-foreground">No data yet.</div>}
        </Panel>
        <Panel title="Cashback by source">
          {earningsBySource.length === 0
            ? <div className="flex h-[100px] items-center justify-center text-xs text-muted-foreground">No earnings data yet.</div>
            : <div className="space-y-2">
              {earningsBySource.map((s) => {
                const max = Math.max(...earningsBySource.map((x) => x.amount));
                const pct = (s.amount / max) * 100;
                return (
                  <div key={s.source}>
                    <div className="flex items-center justify-between text-[11px] text-white/80">
                      <span className="flex items-center gap-1.5"><Building2 className="h-3 w-3 text-muted-foreground" />{s.source}</span>
                      <span className="font-semibold text-white">{fmtUSD(s.amount)}</span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/5">
                      <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-violet-500" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>}
        </Panel>
        <Panel title="Earnings Intelligence" action={<Pill tone="primary"><Zap className="h-3 w-3" />AI</Pill>}>
          {topEarningSource || linkedAccts.length > 0 || summary ? (
            <div className="space-y-3 text-xs">
              {topEarningSource ? (
                <Insight tone="success" text={<><b>{topEarningSource.source}</b> is your top tracked earning source at <b>{fmtUSD(topEarningSource.amount)}</b>.</>} />
              ) : (
                <Insight tone="primary" text={<>No source-level earnings yet. Linked accounts and approved cashback entries will populate this insight.</>} />
              )}
              {linkedAccts.length > 0 ? (
                <Insight tone="primary" text={<><b>{linkedAccts.length}</b> linked account request{linkedAccts.length === 1 ? "" : "s"} found. Pending requests update when the partner connection is confirmed.</>} />
              ) : (
                <Insight tone="warning" text={<>No linked partner accounts yet. Link a broker, prop firm, or exchange to enable automated cashback tracking.</>} />
              )}
              {summary && Number(summary.pendingWithdrawals) > 0 ? (
                <Insight tone="warning" text={<><b>{fmtUSD(Number(summary.pendingWithdrawals))}</b> is pending withdrawal review.</>} />
              ) : (
                <Insight tone="success" text={<>Available withdrawal balance: <b>{fmtUSD(Number(summary?.availableForWithdrawal ?? 0))}</b>.</>} />
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.03] px-4 py-8 text-center text-xs text-muted-foreground">
              Earnings intelligence appears after wallet activity, linked accounts, or cashback claims are recorded.
            </div>
          )}
        </Panel>
      </div>

      {/* Transactions */}
      <div className="glass rounded-2xl p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-white">Transactions</h3>
            <p className="text-[11px] text-muted-foreground">Click any row to see the cashback breakdown.</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="glass-pill flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-white">
              <Search className="h-3 w-3 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search broker, type…"
                className="w-32 bg-transparent outline-none placeholder:text-muted-foreground md:w-48"
              />
            </div>
            <Pill><Filter className="h-3 w-3" />Filter</Pill>
          </div>
        </div>

        <div className="mb-3 flex flex-wrap gap-1.5">
          {(["all", "cashback", "referral", "transfer", "withdrawal"] as const).map((k) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={`rounded-full px-3 py-1 text-[11px] font-medium capitalize transition ${
                tab === k ? "bg-white/15 text-white" : "bg-white/5 text-muted-foreground hover:text-white"
              }`}
            >
              {k}
            </button>
          ))}
        </div>

        {/* Desktop table */}
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full text-xs">
            <thead className="text-left text-muted-foreground">
              <tr className="border-b border-white/5">
                <th className="py-2 font-medium">Date</th>
                <th className="font-medium">Source</th>
                <th className="font-medium">Type</th>
                <th className="font-medium text-right">Volume</th>
                <th className="font-medium text-right">Commission</th>
                <th className="font-medium text-right">Rebate %</th>
                <th className="font-medium text-right">Amount</th>
                <th className="font-medium">Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <tr key={t.id} onClick={() => setSelectedTx(t)} className="cursor-pointer border-b border-white/5 text-white/90 transition hover:bg-white/5">
                  <td className="py-3">{fmtDate(t.date)}</td>
                  <td><div className="font-semibold text-white">{t.brandName}</div><div className="text-[10px] text-muted-foreground">{t.source}</div></td>
                  <td><Pill tone={t.type === "Cashback" ? "success" : t.type === "Referral" ? "primary" : t.type === "Withdrawal" ? "destructive" : "default"}>{t.type}</Pill></td>
                  <td className="text-right">{t.volumeLots ? `${t.volumeLots} lots` : "—"}</td>
                  <td className="text-right">{t.commissionGenerated ? fmtUSD(t.commissionGenerated) : "—"}</td>
                  <td className="text-right">{t.rebatePercent ? `${t.rebatePercent}%` : "—"}</td>
                  <td className={`text-right font-semibold ${t.amount >= 0 ? "text-success" : "text-destructive"}`}>{fmtUSD(t.amount)}</td>
                  <td><Pill tone={statusTone[t.status]}>{t.status}</Pill></td>
                  <td className="text-right"><ChevronRight className="ml-auto h-3.5 w-3.5 text-muted-foreground" /></td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={9} className="py-6 text-center text-muted-foreground">No transactions match.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="space-y-2 md:hidden">
          {filtered.map((t) => (
            <button key={t.id} onClick={() => setSelectedTx(t)} className="block w-full rounded-xl border border-white/10 bg-white/[0.03] p-3 text-left">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-white">{t.brandName}</div>
                  <div className="text-[10px] text-muted-foreground">{fmtDate(t.date)} · {t.source}</div>
                </div>
                <div className={`text-sm font-bold ${t.amount >= 0 ? "text-success" : "text-destructive"}`}>{fmtUSD(t.amount)}</div>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <Pill tone={t.type === "Cashback" ? "success" : "default"}>{t.type}</Pill>
                <Pill tone={statusTone[t.status]}>{t.status}</Pill>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Internal transfers */}
      <Panel title="Internal Transfer History">
        <div className="space-y-2">
          {internalTransfers.map((tr) => (
            <div key={tr.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <div className="flex items-center gap-3">
                <div className={`grid h-9 w-9 place-items-center rounded-full ${tr.direction === "in" ? "bg-emerald-500/15 text-emerald-400" : "bg-violet-500/15 text-violet-400"}`}>
                  {tr.direction === "in" ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">{tr.direction === "in" ? "From" : "To"} {tr.counterpartyName}</div>
                  <div className="text-[10px] text-muted-foreground">{tr.counterpartyHandle} · {fmtDate(tr.date)}</div>
                </div>
              </div>
              <div className="text-right">
                <div className={`text-sm font-bold ${tr.direction === "in" ? "text-success" : "text-white"}`}>
                  {tr.direction === "in" ? "+" : "−"}{fmtUSD(tr.amount)}
                </div>
                <Pill tone={tr.status === "Completed" ? "success" : "warning"}>{tr.status}</Pill>
              </div>
            </div>
          ))}
        </div>
      </Panel>

      {/* Default payout preference */}
      <Panel title="Default payout preference" action={<Pill tone="primary">Profile-wide</Pill>}>
        <p className="mb-3 text-[11px] text-muted-foreground">
          Where should new cashback land by default? You can override this every time you submit a claim.
        </p>
        <div className="grid gap-2 md:grid-cols-3">
          <PrefOption
            active={pref.default === "rr-wallet"} onClick={() => updatePref({ default: "rr-wallet" })}
            icon={<Bot className="h-4 w-4 text-violet-300" />}
            title="RR (Reward) wallet"
            desc="System auto-credits — no proof required when you used our affiliate link."
          />
          <PrefOption
            active={pref.default === "rebate-wallet" || pref.default === "revete-wallet"} onClick={() => updatePref({ default: "rebate-wallet" })}
            icon={<Wallet className="h-4 w-4 text-emerald-300" />}
            title="Rebate USD wallet"
            desc="Cash credited to this wallet. Withdrawable to USDT / Bank."
          />
          <PrefOption
            active={pref.default === "broker-wallet"} onClick={() => updatePref({ default: "broker-wallet" })}
            icon={<Building2 className="h-4 w-4 text-violet-300" />}
            title="Back to broker wallet"
            desc="Available only on supported brokers / exchanges."
          />
        </div>
      </Panel>

      {/* Linked accounts — partner attach requests */}
      <Panel title={`Linked accounts (${linkedAccts.length})`} action={
        <button onClick={() => setLinkOpen(true)} className="inline-flex items-center gap-1.5 rounded-full rb-gradient-primary px-3 py-1.5 text-[11px] font-bold text-white">
          + Link new
        </button>
      }>
        {linkedAccts.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-white/10 bg-white/5 p-6 text-center text-xs text-muted-foreground">
            No linked accounts yet. Link a broker or exchange to start earning automatic cashback.
          </div>
        ) : (
          <div className="space-y-2">
            {linkedAccts.map((la) => {
              const statusTone = la.status === "acknowledged" ? "success" : la.status === "rejected" ? "destructive" : "warning";
              const statusLabel = la.status === "acknowledged" ? "Active" : la.status === "queued" ? "Pending attach" : la.status;
              return (
                <div key={la.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] p-3">
                  <div className="flex items-center gap-3">
                    <div className="grid h-9 w-9 place-items-center rounded-full bg-violet-500/15 text-violet-300"><Building2 className="h-4 w-4" /></div>
                    <div>
                      <div className="text-sm font-semibold text-white">{la.brand} · <span className="font-mono text-[11px] text-muted-foreground">{la.accountId}</span></div>
                      <div className="text-[10px] text-muted-foreground">
                        {la.brandCategory || "Partner"}{la.payoutTarget ? ` · ${formatPayoutTarget(la.payoutTarget)}` : ""}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <Pill tone={statusTone}>{statusLabel}</Pill>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Panel>

      {/* Modals */}
      {selectedTx && <CashbackBreakdown tx={selectedTx} onClose={() => setSelectedTx(null)} />}
      {withdrawOpen && token && (
        <WithdrawModal
          token={token}
          walletSummary={walletSummary}
          kycVerified={kycVerified}
          onClose={() => setWithdrawOpen(false)}
          onSuccess={loadData}
        />
      )}
      {transferOpen && token && <TransferModal token={token} onClose={() => setTransferOpen(false)} onSuccess={loadData} />}
      {claimOpen && token && user && (
        <ClaimCashbackModal
          token={token}
          userId={user.id}
          defaultPref={pref.default}
          purchaseContext={checkoutClaim ?? undefined}
          onClose={() => setClaimOpen(false)}
          onSuccess={loadData}
        />
      )}
      {linkOpen && token && (
        <LinkAccountModal
          token={token}
          currentUser={user?.name ?? "RebateBoard user"}
          onClose={() => setLinkOpen(false)}
          onLinked={() => loadData()}
        />
      )}
    </div>
  );
}

function PrefOption({ active, onClick, icon, title, desc }: { active: boolean; onClick: () => void; icon: React.ReactNode; title: string; desc: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left rounded-xl p-3 ring-1 transition ${active ? "bg-gradient-to-br from-violet-500/15 to-violet-600/10 ring-violet-400/40" : "bg-white/[0.03] ring-white/10 hover:ring-white/20"}`}
    >
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-sm font-semibold text-white">{title}</span>
        {active && <CheckCircle2 className="ml-auto h-4 w-4 text-emerald-300" />}
      </div>
      <div className="mt-1 text-[11px] text-muted-foreground">{desc}</div>
    </button>
  );
}

function MiniStat({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
      <div className="flex items-center gap-1.5 text-[10px] uppercase text-muted-foreground">{icon}{label}</div>
      <div className="mt-1 text-lg font-bold text-white">{value}</div>
    </div>
  );
}

function Insight({ tone, text }: { tone: "success" | "warning" | "primary"; text: React.ReactNode }) {
  const ring = tone === "success" ? "ring-emerald-400/30" : tone === "warning" ? "ring-violet-400/25" : "ring-primary/30";
  return (
    <div className={`rounded-xl bg-white/[0.04] p-3 text-white/85 ring-1 ${ring}`}>{text}</div>
  );
}

function MiniLineChart({ data }: { data: { month: string; amount: number }[] }) {
  const w = 320, h = 120, pad = 16;
  const max = Math.max(...data.map((d) => d.amount));
  const points = data.map((d, i) => {
    const x = pad + (i * (w - pad * 2)) / (data.length - 1);
    const y = h - pad - (d.amount / max) * (h - pad * 2);
    return `${x},${y}`;
  }).join(" ");
  return (
    <div>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full">
        <defs>
          <linearGradient id="lg" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="rgb(16,185,129)" stopOpacity="0.5" />
            <stop offset="100%" stopColor="rgb(16,185,129)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polyline points={points} fill="none" stroke="rgb(16,185,129)" strokeWidth="2" />
        <polygon points={`${pad},${h - pad} ${points} ${w - pad},${h - pad}`} fill="url(#lg)" />
      </svg>
      <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
        {data.map((d) => <span key={d.month}>{d.month}</span>)}
      </div>
    </div>
  );
}

function ModalShell({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-black/70 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="glass w-full max-w-md rounded-2xl p-5 ring-1 ring-white/10" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">{title}</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-white"><X className="h-4 w-4" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function CashbackBreakdown({ tx, onClose }: { tx: WalletTransaction; onClose: () => void }) {
  return (
    <ModalShell title="Transaction Breakdown" onClose={onClose}>
      <div className="space-y-3 text-sm">
        <div className="rounded-xl bg-white/[0.04] p-4">
          <div className="text-[11px] uppercase text-muted-foreground">{tx.source}</div>
          <div className="text-lg font-bold text-white">{tx.brandName}</div>
          <div className="mt-1 text-[11px] text-muted-foreground">{fmtDate(tx.date)} · {tx.type}</div>
        </div>
        <Row label="Trade Volume" value={tx.volumeLots ? `${tx.volumeLots} lots` : "—"} />
        <Row label="Commission Generated" value={tx.commissionGenerated ? fmtUSD(tx.commissionGenerated) : "—"} />
        <Row label="Rebate Share" value={tx.rebatePercent ? `${tx.rebatePercent}%` : "—"} />
        <div className="rounded-xl bg-emerald-500/10 p-4 ring-1 ring-emerald-400/30">
          <div className="text-[11px] uppercase text-emerald-300">Final Cashback</div>
          <div className="mt-1 text-2xl font-bold text-white">{fmtUSD(tx.amount)}</div>
          <div className="mt-1 flex items-center gap-1.5 text-[11px] text-emerald-300">
            <CheckCircle2 className="h-3.5 w-3.5" /> {tx.status === "Credited" ? "Credited to wallet" : tx.status}
          </div>
        </div>
        {tx.note && <div className="text-[11px] text-muted-foreground">Note: {tx.note}</div>}
      </div>
    </ModalShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold text-white">{value}</span>
    </div>
  );
}

function WithdrawModal({
  token,
  walletSummary,
  kycVerified,
  onClose,
  onSuccess,
}: {
  token: string;
  walletSummary: { availableForWithdrawal: number };
  kycVerified: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("USDT (TRC20)");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    const amt = Number(amount);
    if (!amt || amt <= 0) { setError("Enter a valid amount"); return; }
    if (amt > walletSummary.availableForWithdrawal) { setError("Insufficient balance"); return; }
    if (!address.trim()) { setError("Destination address / account required"); return; }
    setLoading(true);
    setError("");
    try {
      const isCrypto = method.startsWith("USDT");
      await financeApi.requestWithdrawal(token, {
        channel: method,
        amount: amt,
        ...(isCrypto ? { walletAddress: address, walletType: method } : { accountNumber: address }),
        narration: `Withdrawal via ${method}`,
      });
      onSuccess();
      onClose();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Request failed");
    } finally {
      setLoading(false);
    }
  };

  if (!kycVerified) {
    return (
      <ModalShell title="Verification required" onClose={onClose}>
        <div className="text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-primary/15 text-violet-200 ring-1 ring-primary/25">
            <IdCard className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-base font-semibold text-white">Verify your identity to withdraw</h3>
          <p className="mx-auto mt-2 max-w-sm text-xs leading-relaxed text-muted-foreground">
            Identity verification is required before withdrawals can be processed. Your wallet balance remains available while verification is reviewed.
          </p>
          <Link
            to="/dashboard/profile"
            onClick={onClose}
            className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl rb-gradient-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 active:scale-[0.99]"
          >
            <IdCard className="h-4 w-4" /> Go to Verification
          </Link>
        </div>
      </ModalShell>
    );
  }

  return (
    <ModalShell title="Withdraw funds" onClose={onClose}>
      <div className="space-y-3">
        <div>
          <label className="text-[11px] uppercase text-muted-foreground">Amount (USD)</label>
          <input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white outline-none focus:border-emerald-400/50" />
          <div className="mt-1 text-[11px] text-muted-foreground">Available: {fmtUSD(walletSummary.availableForWithdrawal)}</div>
        </div>
        <div>
          <label className="text-[11px] uppercase text-muted-foreground">Method</label>
          <select value={method} onChange={(e) => setMethod(e.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white outline-none">
            <option>USDT (TRC20)</option>
            <option>USDT (ERC20)</option>
            <option>Bank Transfer</option>
            <option>PayPal</option>
          </select>
        </div>
        <div>
          <label className="text-[11px] uppercase text-muted-foreground">
            {method.startsWith("USDT") ? "Wallet address" : "Account number / email"}
          </label>
          <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder={method.startsWith("USDT") ? "T… or 0x…" : "Account / email"} className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white outline-none focus:border-emerald-400/50" />
        </div>
        {error && <p className="text-[11px] text-rose-400">{error}</p>}
        <button onClick={submit} disabled={loading} className="mt-2 w-full rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
          {loading ? "Submitting…" : "Request withdrawal"}
        </button>
      </div>
    </ModalShell>
  );
}

function TransferModal({ token, onClose, onSuccess }: { token: string; onClose: () => void; onSuccess: () => void }) {
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [narration, setNarration] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    if (!recipient.trim()) { setError("Recipient required"); return; }
    const amt = Number(amount);
    if (!amt || amt <= 0) { setError("Enter a valid amount"); return; }
    setLoading(true);
    setError("");
    try {
      await financeApi.transferFunds(token, { recipient: recipient.trim(), amount: amt, narration: narration.trim() || undefined });
      onSuccess();
      onClose();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Transfer failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalShell title="Send to another user" onClose={onClose}>
      <div className="space-y-3">
        <div>
          <label className="text-[11px] uppercase text-muted-foreground">Recipient account number</label>
          <input value={recipient} onChange={(e) => setRecipient(e.target.value)} placeholder="Account number…" className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white outline-none focus:border-violet-400/50" />
        </div>
        <div>
          <label className="text-[11px] uppercase text-muted-foreground">Amount (USD)</label>
          <input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white outline-none focus:border-violet-400/50" />
        </div>
        <div>
          <label className="text-[11px] uppercase text-muted-foreground">Note (optional)</label>
          <input value={narration} onChange={(e) => setNarration(e.target.value)} placeholder="What's it for?" className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white outline-none focus:border-violet-400/50" />
        </div>
        {error && <p className="text-[11px] text-rose-400">{error}</p>}
        <button onClick={submit} disabled={loading} className="mt-2 w-full rounded-xl rb-gradient-primary py-2.5 text-sm font-semibold text-white disabled:opacity-50">
          {loading ? "Sending…" : "Send instantly"}
        </button>
        <p className="text-center text-[10px] text-muted-foreground">Internal transfers are free and instant.</p>
      </div>
    </ModalShell>
  );
}

/* =====================================================================
 * Claim Cashback modal — submits to backend via API
 * ===================================================================== */
type BrandLike = {
  name: string;
  category: string;
  cashback?: {
    supportsApiAuto?: boolean;
    supportsRebateWallet?: boolean;
    supportsReveteWallet?: boolean;
    requiresManualClaim?: boolean;
    proofRequired?: { screenshot?: boolean; registeredEmail?: boolean; accountId?: boolean; orderId?: boolean };
  };
};

function mapClaimBrand(brand: AdminBrandRecord): BrandLike {
  return {
    name: brand.name,
    category: brand.category,
    cashback: brand.cashback as BrandLike["cashback"],
  };
}

function ClaimCashbackModal({
  token,
  userId: _userId,
  defaultPref,
  purchaseContext,
  onClose,
  onSuccess,
}: {
  token: string;
  userId: string;
  defaultPref: PayoutTarget;
  purchaseContext?: {
    purchaseSessionReference: string;
    partner: string;
    amount: string;
    email: string;
  };
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [allBrands, setAllBrands] = useState<BrandLike[]>([]);
  const [brandsLoading, setBrandsLoading] = useState(true);
  const [brandsError, setBrandsError] = useState("");
  const [partner, setPartner] = useState(purchaseContext?.partner ?? "");
  const [accountId, setAccountId] = useState("");
  const [registeredEmail, setRegisteredEmail] = useState(purchaseContext?.email ?? "");
  const [orderId, setOrderId] = useState("");
  const [amount, setAmount] = useState(purchaseContext?.amount ?? "");
  const [note, setNote] = useState("");
  const [files, setFiles] = useState<string[]>([]);
  const [target, setTarget] = useState<PayoutTarget>(defaultPref);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    setBrandsLoading(true);
    fetchPublicAdminBrands(undefined, token)
      .then((brands) => {
        if (!alive) return;
        const supported = brands
          .filter((brand) => Boolean(brand.cashback) || ["Prop Firm", "Forex Broker", "Crypto Exchange", "Futures Prop Firm", "Crypto Prop Firm"].includes(brand.category))
          .map(mapClaimBrand);
        setAllBrands(supported);
        setPartner((current) =>
          current && supported.some((brand) => brand.name === current)
            ? current
            : supported[0]?.name || "",
        );
        setBrandsError("");
      })
      .catch((err) => {
        if (!alive) return;
        setAllBrands([]);
        setBrandsError(err instanceof Error ? err.message : "Unable to load cashback partners.");
      })
      .finally(() => {
        if (alive) setBrandsLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [token]);

  const brand = allBrands.find((b) => b.name === partner);
  const cat = brand?.category ?? "";
  const isAutoCategory = cat === "Forex Broker" || cat === "Crypto Exchange";
  const rawCb = brand?.cashback ?? {};
  const cb = {
    supportsApiAuto: rawCb.supportsApiAuto ?? isAutoCategory,
    supportsRebateWallet: rawCb.supportsRebateWallet ?? rawCb.supportsReveteWallet ?? true,
    requiresManualClaim: rawCb.requiresManualClaim ?? !isAutoCategory,
    proofRequired: rawCb.proofRequired ?? { screenshot: true, registeredEmail: true, accountId: true, orderId: false },
  };
  const proof = cb.proofRequired;
  const proofNeeded = target !== "rr-wallet" || cb.requiresManualClaim;

  const onFile = async (fl: FileList | null) => {
    if (!fl) return;
    const next: string[] = [];
    for (const f of Array.from(fl).slice(0, 4)) {
      const sizeError = validateFileSize(f);
      if (sizeError) {
        setError(sizeError);
        continue;
      }
      const url = await new Promise<string>((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(String(r.result));
        r.onerror = rej;
        r.readAsDataURL(f);
      });
      next.push(url);
    }
    setFiles((prev) => [...prev, ...next].slice(0, 4));
  };

  const submit = async () => {
    const amt = Number(amount);
    setError("");
    if (!partner) { setError("Pick a published cashback partner"); return; }
    if (!amt || amt <= 0) { setError("Enter a valid amount"); return; }
    if (proofNeeded) {
      if (proof.accountId && !accountId.trim()) { setError("Account ID is required for this partner"); return; }
      if (proof.registeredEmail && !registeredEmail.trim()) { setError("Registered email is required"); return; }
      if (proof.orderId && !orderId.trim()) { setError("Order / Tx ID is required"); return; }
      if (proof.screenshot && files.length === 0) { setError("Upload at least one screenshot as proof"); return; }
    }
    setLoading(true);
    try {
      await financeApi.submitClaim(token, {
        partner,
        partnerCategory: cat,
        accountId: accountId.trim() || undefined,
        registeredEmail: registeredEmail.trim() || undefined,
        orderId: orderId.trim() || undefined,
        purchaseSessionReference: purchaseContext?.purchaseSessionReference || undefined,
        type: "Cashback",
        amount: amt,
        evidenceUrls: files,
        payoutTarget: target,
        note: note.trim() || undefined,
      });
      onSuccess();
      onClose();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to submit claim");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalShell title="Claim cashback" onClose={onClose}>
      <div className="space-y-3 max-h-[75vh] overflow-y-auto pr-1">
        {/* Partner */}
        <div>
          <label className="text-[11px] uppercase text-muted-foreground">Partner</label>
          <select value={partner} onChange={(e) => setPartner(e.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white outline-none focus:border-violet-400/50">
            {brandsLoading && <option value="">Preparing partners...</option>}
            {!brandsLoading && allBrands.length === 0 && <option value="">No cashback partners available</option>}
            {allBrands.map((b) => <option key={b.name} value={b.name}>{b.name} — {b.category}</option>)}
          </select>
          {brandsError && <div className="mt-1 text-[10px] text-rose-300">{brandsError}</div>}
          <div className="mt-1 text-[10px] text-muted-foreground">
            {cb.supportsApiAuto ? "✓ Automatic payout supported" : "Manual proof required"}
            {cb.supportsRebateWallet ? " · Rebate wallet supported" : ""}
          </div>
        </div>

        {/* Payout target — overrides default */}
        <div>
          <label className="text-[11px] uppercase text-muted-foreground">Receive as</label>
          <div className="mt-1 grid grid-cols-3 gap-1.5">
            <ChoiceChip active={target === "rr-wallet"} onClick={() => setTarget("rr-wallet")} icon={<Coins className="h-3 w-3" />} label="RR" />
            <ChoiceChip active={target === "rebate-wallet" || target === "revete-wallet"} onClick={() => setTarget("rebate-wallet")} icon={<Banknote className="h-3 w-3" />} label="Rebate" disabled={!cb.supportsRebateWallet} />
            <ChoiceChip active={target === "broker-wallet"} onClick={() => setTarget("broker-wallet")} icon={<Building2 className="h-3 w-3" />} label="Broker" disabled={!cb.supportsApiAuto} />
          </div>
          <div className="mt-1 text-[10px] text-muted-foreground">
            {target === "rr-wallet" && !cb.requiresManualClaim
              ? "Auto-credited if you used our affiliate link — no proof needed."
              : "Cash payout — proof required."}
          </div>
        </div>

        {/* Amount */}
        <div>
          <label className="text-[11px] uppercase text-muted-foreground">Amount (USD)</label>
          <input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" inputMode="decimal" className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white outline-none focus:border-violet-400/50" />
        </div>

        {/* Proof fields (only when needed) */}
        {proofNeeded && (
          <div className="space-y-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
            <div className="text-[11px] font-semibold uppercase text-white">Proof of purchase / trade</div>
            {proof.accountId && (
              <Labeled label="Account ID at partner">
                <input value={accountId} onChange={(e) => setAccountId(e.target.value)} placeholder="e.g. EX-882144" className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white outline-none" />
              </Labeled>
            )}
            {proof.registeredEmail && (
              <Labeled label="Email used to register at partner">
                <input value={registeredEmail} onChange={(e) => setRegisteredEmail(e.target.value)} placeholder="you@example.com" className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white outline-none" />
              </Labeled>
            )}
            {proof.orderId && (
              <Labeled label="Order / Transaction ID">
                <input value={orderId} onChange={(e) => setOrderId(e.target.value)} placeholder="ORD-…" className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white outline-none" />
              </Labeled>
            )}
            {proof.screenshot && (
              <Labeled label="Screenshot / receipt (up to 4)">
                <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-white/15 bg-white/[0.03] px-3 py-3 text-xs text-muted-foreground hover:bg-white/[0.06]">
                  <Upload className="h-4 w-4" /> Click to upload images up to {formatUploadLimit()}
                  <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => onFile(e.target.files)} />
                </label>
                {files.length > 0 && (
                  <div className="mt-2 grid grid-cols-4 gap-1.5">
                    {files.map((u, i) => (
                      <div key={i} className="relative">
                        <img src={u} alt={`proof ${i}`} className="h-14 w-full rounded-md object-cover ring-1 ring-white/10" />
                        <button type="button" onClick={() => setFiles((f) => f.filter((_, j) => j !== i))} className="absolute -right-1 -top-1 grid h-4 w-4 place-items-center rounded-full bg-rose-500 text-white"><X className="h-2.5 w-2.5" /></button>
                      </div>
                    ))}
                  </div>
                )}
              </Labeled>
            )}
          </div>
        )}

        {/* Note */}
        <div>
          <label className="text-[11px] uppercase text-muted-foreground">Note (optional)</label>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="Anything we should know…" className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white outline-none focus:border-violet-400/50" />
        </div>

        {error && <p className="text-[11px] text-rose-400">{error}</p>}
        <button onClick={submit} disabled={loading} className="mt-1 w-full rounded-xl rb-gradient-primary py-2.5 text-sm font-semibold text-white disabled:opacity-50">
          {loading ? "Submitting…" : "Submit claim for review"}
        </button>
        <p className="text-center text-[10px] text-muted-foreground">Our team reviews every claim within 24h. You'll see status updates in this wallet.</p>
      </div>
    </ModalShell>
  );
}

function Labeled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1 text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      {children}
    </div>
  );
}

function ChoiceChip({ active, onClick, icon, label, disabled }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-[11px] font-semibold ring-1 transition disabled:cursor-not-allowed disabled:opacity-40 ${active ? "rb-gradient-primary text-white ring-violet-400/40" : "bg-white/5 text-white ring-white/10 hover:ring-white/20"}`}
    >
      {icon}{label}
    </button>
  );
}
