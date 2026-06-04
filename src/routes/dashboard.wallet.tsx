import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Wallet, ArrowDownToLine, Send, Sparkles, X, ChevronRight, ArrowUpRight,
  ArrowDownLeft, Filter, Search, CheckCircle2, Clock, CircleDollarSign,
  TrendingUp, Building2, Zap, Upload, Coins, Banknote,
} from "lucide-react";
import { PageHeader, Panel, Pill } from "@/components/dashboard/Primitives";
import {
  createWalletTransfer,
  createWalletWithdrawal,
  fetchWalletDashboard,
  type WalletDashboardPayload,
  type WalletDashboardTransaction,
} from "@/lib/wallet-api";
import { adminBrands, type Claim, type LinkedAccount, type PayoutTarget } from "@/lib/admin-data";
import { pushCollection, newId, useAdminCollection } from "@/lib/admin-store";
import { LinkAccountModal } from "@/components/dashboard/LinkAccountModal";
import { useAuth } from "@/lib/auth";

const PAYOUT_PREF_KEY = "rb-user:payoutPref";
type PayoutPref = { default: PayoutTarget };
const defaultPref: PayoutPref = { default: "rebate-wallet" };
type TxStatus = WalletDashboardTransaction["status"];

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

const statusTone: Record<TxStatus, "success" | "warning" | "primary" | "default"> = {
  Credited: "success",
  Approved: "primary",
  Pending: "warning",
  Withdrawn: "default",
};

function WalletPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<"all" | "cashback" | "referral" | "transfer" | "withdrawal">("all");
  const [query, setQuery] = useState("");
  const [selectedTx, setSelectedTx] = useState<WalletDashboardTransaction | null>(null);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [claimOpen, setClaimOpen] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [pref, setPref] = useState<PayoutPref>(defaultPref);
  const [walletDashboard, setWalletDashboard] = useState<WalletDashboardPayload | null>(null);
  const [walletLoading, setWalletLoading] = useState(true);
  const [walletError, setWalletError] = useState<string | null>(null);
  const { items: linkedAccts } = useAdminCollection<LinkedAccount>("linkedAccounts", []);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(PAYOUT_PREF_KEY);
      if (raw) setPref(JSON.parse(raw));
    } catch {}
  }, []);

  const loadWalletDashboard = async () => {
    setWalletLoading(true);
    setWalletError(null);
    try {
      const payload = await fetchWalletDashboard();
      setWalletDashboard(payload);
    } catch (error) {
      setWalletError(error instanceof Error ? error.message : "Unable to load wallet");
    } finally {
      setWalletLoading(false);
    }
  };

  useEffect(() => {
    void loadWalletDashboard();
  }, []);

  const updatePref = (next: PayoutPref) => {
    setPref(next);
    try { sessionStorage.setItem(PAYOUT_PREF_KEY, JSON.stringify(next)); } catch {}
  };

  const walletSummary = walletDashboard?.summary ?? {
    balance: 0,
    totalEarned: 0,
    totalDebited: 0,
    availableForWithdrawal: 0,
    pendingWithdrawals: 0,
    totalWithdrawn: 0,
    transactionCount: 0,
    withdrawalCount: 0,
  };
  const walletTransactions = walletDashboard?.transactions ?? [];
  const internalTransfers = useMemo(() => {
    return walletTransactions
      .filter((t) => t.type === "Transfer")
      .map((t) => ({
        id: t.id,
        date: t.date,
        direction: t.amount >= 0 ? "in" as const : "out" as const,
        counterpartyName: t.brandName,
        counterpartyHandle: t.note || t.ref || "Internal transfer",
        amount: Math.abs(t.amount),
        status: t.status === "Pending" ? "Pending" as const : "Completed" as const,
      }));
  }, [walletTransactions]);
  const earningsBySource = useMemo(() => {
    const grouped = new Map<string, number>();
    walletTransactions
      .filter((t) => t.amount > 0 && (t.type === "Cashback" || t.type === "Referral" || t.type === "Reward"))
      .forEach((t) => {
        grouped.set(t.brandName, (grouped.get(t.brandName) ?? 0) + t.amount);
      });

    return Array.from(grouped.entries())
      .map(([source, amount]) => ({ source, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 6);
  }, [walletTransactions]);
  const earningsTimeline = useMemo(() => {
    const grouped = new Map<string, number>();
    walletTransactions
      .filter((t) => t.amount > 0)
      .forEach((t) => {
        const bucket = new Date(t.date).toLocaleDateString(undefined, { month: "short" });
        grouped.set(bucket, (grouped.get(bucket) ?? 0) + t.amount);
      });

    const points = Array.from(grouped.entries()).map(([month, amount]) => ({ month, amount }));
    return points.length ? points.slice(-6) : [{ month: "Now", amount: 0 }];
  }, [walletTransactions]);

  const filtered = useMemo(() => {
    return walletTransactions.filter((t) => {
      if (tab !== "all" && t.type.toLowerCase() !== tab) return false;
      if (query && !`${t.brandName} ${t.source} ${t.type}`.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
  }, [tab, query, walletTransactions]);

  if (walletLoading) {
    return <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-sm text-white/70">Loading wallet...</div>;
  }

  if (walletError) {
    return (
      <div className="space-y-3 rounded-2xl border border-rose-400/20 bg-rose-500/10 p-6 text-sm text-rose-100">
        <div>Unable to load wallet: {walletError}</div>
        <button onClick={() => void loadWalletDashboard()} className="rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-white">
          Retry
        </button>
      </div>
    );
  }

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
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-gradient-to-br from-emerald-400/30 to-fuchsia-500/20 blur-3xl" />
        <div className="relative grid gap-6 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-muted-foreground">
              <Wallet className="h-3.5 w-3.5 text-emerald-400" /> Wallet Balance
            </div>
            <div className="mt-2 text-4xl font-bold text-white md:text-5xl">{fmtUSD(walletSummary.balance)}</div>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <Pill tone="success"><TrendingUp className="h-3 w-3" /> {walletSummary.transactionCount} transactions tracked</Pill>
              <span>· Wallet ID: <b className="text-white">{walletDashboard?.wallet.accountNumber ?? "—"}</b></span>
              {user && <span>· Owner: <b className="text-white">{user.fullName ?? user.name}</b></span>}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button onClick={() => setWithdrawOpen(true)} className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-400">
                <ArrowDownToLine className="h-3.5 w-3.5" /> Withdraw funds
              </button>
              <button onClick={() => setTransferOpen(true)} className="glass-pill inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-white">
                <Send className="h-3.5 w-3.5" /> Send to user
              </button>
              <button onClick={() => setLinkOpen(true)} className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-600 px-3 py-1.5 text-xs font-semibold text-white shadow-[0_0_20px_rgba(192,132,252,0.45)]">
                <Building2 className="h-3.5 w-3.5" /> Link account · earn
              </button>
              <button onClick={() => setClaimOpen(true)} className="glass-pill inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-white">
                <Sparkles className="h-3.5 w-3.5 text-accent" /> Claim cashback
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
            <MiniStat label="Pending Withdrawal" value={fmtUSD(walletSummary.pendingWithdrawals)} icon={<Clock className="h-3.5 w-3.5 text-amber-400" />} />
            <MiniStat label="Total Withdrawn" value={fmtUSD(walletSummary.totalWithdrawn)} icon={<ArrowDownToLine className="h-3.5 w-3.5 text-muted-foreground" />} />
          </div>
        </div>
      </div>

      {/* Earnings intelligence */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Earnings over time" action={<Pill tone="primary">6m</Pill>}>
          <MiniLineChart data={earningsTimeline} />
        </Panel>
        <Panel title="Cashback by source">
          <div className="space-y-2">
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
                    <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-fuchsia-500" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>
        <Panel title="Earnings Intelligence" action={<Pill tone="primary"><Zap className="h-3 w-3" />AI</Pill>}>
          <div className="space-y-3 text-xs">
            <Insight tone="success" text={<>Total credited into this wallet so far: <b>{fmtUSD(walletSummary.totalEarned)}</b>.</>} />
            <Insight tone="warning" text={<>Pending withdrawals currently hold <b>{fmtUSD(walletSummary.pendingWithdrawals)}</b>.</>} />
            <Insight tone="primary" text={<>Completed withdrawals paid out so far: <b>{fmtUSD(walletSummary.totalWithdrawn)}</b>.</>} />
          </div>
        </Panel>
      </div>

      {/* Transactions */}
      <div className="glass rounded-2xl p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-white">Transactions</h3>
            <p className="text-[11px] text-muted-foreground">Click any row to see the wallet activity breakdown.</p>
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
                <th className="font-medium">Channel</th>
                <th className="font-medium">Reference</th>
                <th className="font-medium text-right">Activity</th>
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
                  <td>{t.channel ?? "—"}</td>
                  <td className="font-mono text-[10px] text-muted-foreground">{t.ref ?? "—"}</td>
                  <td className="text-right">{t.activity ?? "—"}</td>
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
                <div className={`grid h-9 w-9 place-items-center rounded-full ${tr.direction === "in" ? "bg-emerald-500/15 text-emerald-400" : "bg-fuchsia-500/15 text-fuchsia-400"}`}>
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
            icon={<Sparkles className="h-4 w-4 text-amber-300" />}
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
            icon={<Building2 className="h-4 w-4 text-fuchsia-300" />}
            title="Back to broker wallet"
            desc="Available only on supported brokers / exchanges with API."
          />
        </div>
      </Panel>

      {/* Linked accounts */}
      <Panel title={`Linked accounts (${linkedAccts.length})`} action={
        <button onClick={() => setLinkOpen(true)} className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-600 px-3 py-1.5 text-[11px] font-bold text-white">
          + Link new
        </button>
      }>
        {linkedAccts.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-white/10 bg-white/5 p-6 text-center text-xs text-muted-foreground">
            No linked accounts yet. Link a broker or exchange to start earning automatic cashback.
          </div>
        ) : (
          <div className="space-y-2">
            {linkedAccts.map((la) => (
              <div key={la.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] p-3">
                <div className="flex items-center gap-3">
                  <div className="grid h-9 w-9 place-items-center rounded-full bg-fuchsia-500/15 text-fuchsia-300"><Building2 className="h-4 w-4" /></div>
                  <div>
                    <div className="text-sm font-semibold text-white">{la.brand} · <span className="font-mono text-[11px] text-muted-foreground">{la.accountId}</span></div>
                    <div className="text-[10px] text-muted-foreground">{la.brandCategory} · {la.isNewAccount ? "Created via our link" : "Existing account attached"}</div>
                  </div>
                </div>
                <div className="text-right">
                  <Pill tone={la.status === "active" ? "success" : la.status === "pending-attach" ? "warning" : "destructive"}>
                    {la.status === "pending-attach" ? "Pending attach" : la.status}
                  </Pill>
                  <div className="mt-1 text-[10px] text-muted-foreground">→ {la.payoutTarget}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>

      {/* Modals */}
      {selectedTx && <CashbackBreakdown tx={selectedTx} onClose={() => setSelectedTx(null)} />}
      {withdrawOpen && <WithdrawModal onClose={() => setWithdrawOpen(false)} onSuccess={() => void loadWalletDashboard()} availableAmount={walletSummary.availableForWithdrawal} />}
      {transferOpen && <TransferModal onClose={() => setTransferOpen(false)} onSuccess={() => void loadWalletDashboard()} />}
      {claimOpen && <ClaimCashbackModal defaultPref={pref.default} onClose={() => setClaimOpen(false)} />}
      {linkOpen && <LinkAccountModal onClose={() => setLinkOpen(false)} />}
    </div>
  );
}

function PrefOption({ active, onClick, icon, title, desc }: { active: boolean; onClick: () => void; icon: React.ReactNode; title: string; desc: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left rounded-xl p-3 ring-1 transition ${active ? "bg-gradient-to-br from-fuchsia-500/15 to-violet-600/10 ring-fuchsia-400/40" : "bg-white/[0.03] ring-white/10 hover:ring-white/20"}`}
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
  const ring = tone === "success" ? "ring-emerald-400/30" : tone === "warning" ? "ring-amber-400/30" : "ring-primary/30";
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

function CashbackBreakdown({ tx, onClose }: { tx: WalletDashboardTransaction; onClose: () => void }) {
  return (
    <ModalShell title="Transaction Breakdown" onClose={onClose}>
      <div className="space-y-3 text-sm">
        <div className="rounded-xl bg-white/[0.04] p-4">
          <div className="text-[11px] uppercase text-muted-foreground">{tx.source}</div>
          <div className="text-lg font-bold text-white">{tx.brandName}</div>
          <div className="mt-1 text-[11px] text-muted-foreground">{fmtDate(tx.date)} · {tx.type}</div>
        </div>
        <Row label="Channel" value={tx.channel ?? "—"} />
        <Row label="Reference" value={tx.ref ?? "—"} />
        <Row label="Activity" value={tx.activity ?? "—"} />
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

function WithdrawModal({ onClose, onSuccess, availableAmount }: { onClose: () => void; onSuccess: () => void; availableAmount: number }) {
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("USDT (TRC20)");
  const [destination, setDestination] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const isBank = method === "Bank Transfer";
  const submit = async () => {
    const numericAmount = Number(amount);
    if (!numericAmount || numericAmount <= 0) return;
    setSubmitting(true);
    try {
      await createWalletWithdrawal({
        channel: method,
        amount: numericAmount,
        walletAddress: isBank ? undefined : destination,
        walletType: isBank ? undefined : method,
        bankName: isBank ? "Bank Transfer" : undefined,
        accountName: isBank ? destination : undefined,
      });
      onSuccess();
      onClose();
    } finally {
      setSubmitting(false);
    }
  };
  return (
    <ModalShell title="Withdraw funds" onClose={onClose}>
      <div className="space-y-3">
        <div>
          <label className="text-[11px] uppercase text-muted-foreground">Amount (USD)</label>
          <input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white outline-none focus:border-emerald-400/50" />
          <div className="mt-1 text-[11px] text-muted-foreground">Available: {fmtUSD(availableAmount)}</div>
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
          <label className="text-[11px] uppercase text-muted-foreground">{isBank ? "Bank account details" : "Wallet address"}</label>
          <input value={destination} onChange={(e) => setDestination(e.target.value)} placeholder={isBank ? "Account name / number" : "USDT wallet address"} className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white outline-none focus:border-emerald-400/50" />
        </div>
        <button onClick={() => void submit()} disabled={submitting} className="mt-2 w-full rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
          {submitting ? "Submitting..." : "Request withdrawal"}
        </button>
      </div>
    </ModalShell>
  );
}

function TransferModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const submit = async () => {
    const numericAmount = Number(amount);
    if (!recipient.trim() || !numericAmount || numericAmount <= 0) return;
    setSubmitting(true);
    try {
      await createWalletTransfer({
        recipient: recipient.trim(),
        amount: numericAmount,
      });
      onSuccess();
      onClose();
    } finally {
      setSubmitting(false);
    }
  };
  return (
    <ModalShell title="Send to another user" onClose={onClose}>
      <div className="space-y-3">
        <div>
          <label className="text-[11px] uppercase text-muted-foreground">Recipient wallet account number</label>
          <input value={recipient} onChange={(e) => setRecipient(e.target.value)} placeholder="Enter recipient account number" className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white outline-none focus:border-fuchsia-400/50" />
        </div>
        <div>
          <label className="text-[11px] uppercase text-muted-foreground">Amount (USD)</label>
          <input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white outline-none focus:border-fuchsia-400/50" />
        </div>
        <button onClick={() => void submit()} disabled={submitting} className="mt-2 w-full rounded-xl bg-gradient-to-r from-fuchsia-500 to-violet-600 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
          {submitting ? "Sending..." : "Send instantly"}
        </button>
        <p className="text-center text-[10px] text-muted-foreground">Internal transfers are free and instant.</p>
      </div>
    </ModalShell>
  );
}

/* =====================================================================
 * Claim Cashback modal — wires to /superadmin/claims via shared store
 * ===================================================================== */
type BrandLike = { name: string; category: string; cashback?: { supportsApiAuto?: boolean; supportsRebateWallet?: boolean; supportsReveteWallet?: boolean; requiresManualClaim?: boolean; proofRequired?: { screenshot?: boolean; registeredEmail?: boolean; accountId?: boolean; orderId?: boolean } } };

function ClaimCashbackModal({ defaultPref, onClose }: { defaultPref: PayoutTarget; onClose: () => void }) {
  // Brands list = admin brands seed (auto-merge anything saved by superadmin)
  const customBrands = useMemo<BrandLike[]>(() => {
    try {
      const raw = sessionStorage.getItem("rb-admin:brands");
      return raw ? (JSON.parse(raw) as BrandLike[]) : [];
    } catch { return []; }
  }, []);
  const allBrands: BrandLike[] = useMemo(
    () => [...customBrands, ...adminBrands.map((b) => ({ name: b.name, category: b.category }))],
    [customBrands]
  );

  const [partner, setPartner] = useState<string>(allBrands[0]?.name ?? "");
  const [accountId, setAccountId] = useState("");
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [orderId, setOrderId] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [files, setFiles] = useState<string[]>([]);
  const [target, setTarget] = useState<PayoutTarget>(defaultPref);

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

  const submit = () => {
    const amt = Number(amount);
    if (!partner) return alert("Pick a partner");
    if (!amt || amt <= 0) return alert("Enter a valid amount");
    if (proofNeeded) {
      if (proof.accountId && !accountId.trim()) return alert("Account ID is required for this partner");
      if (proof.registeredEmail && !registeredEmail.trim()) return alert("Registered email is required for this partner");
      if (proof.orderId && !orderId.trim()) return alert("Order / Tx ID is required for this partner");
      if (proof.screenshot && files.length === 0) return alert("Upload at least one screenshot as proof");
    }
    const claim: Claim = {
      id: newId("cl"),
      user: "Aiden Park", // demo user — would come from auth
      partner,
      partnerCategory: cat,
      accountId: accountId.trim(),
      type: "Cashback",
      amount: amt,
      evidence: files.length,
      evidenceUrls: files,
      registeredEmail: registeredEmail.trim() || undefined,
      orderId: orderId.trim() || undefined,
      payoutTarget: target,
      submitted: "just now",
      status: "pending",
      note: note.trim() || undefined,
    };
    pushCollection<Claim>("claims", claim, []);
    onClose();
  };

  return (
    <ModalShell title="Claim cashback" onClose={onClose}>
      <div className="space-y-3 max-h-[75vh] overflow-y-auto pr-1">
        {/* Partner */}
        <div>
          <label className="text-[11px] uppercase text-muted-foreground">Partner</label>
          <select value={partner} onChange={(e) => setPartner(e.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white outline-none focus:border-fuchsia-400/50">
            {allBrands.map((b) => <option key={b.name} value={b.name}>{b.name} — {b.category}</option>)}
          </select>
          <div className="mt-1 text-[10px] text-muted-foreground">
            {cb.supportsApiAuto ? "✓ API auto-payout supported" : "Manual proof required"}
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
          <input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" inputMode="decimal" className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white outline-none focus:border-fuchsia-400/50" />
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
                  <Upload className="h-4 w-4" /> Click to upload images
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
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="Anything we should know…" className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white outline-none focus:border-fuchsia-400/50" />
        </div>

        <button onClick={submit} className="mt-1 w-full rounded-xl bg-gradient-to-r from-fuchsia-500 to-violet-600 py-2.5 text-sm font-semibold text-white">
          Submit claim for review
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
      className={`flex items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-[11px] font-semibold ring-1 transition disabled:cursor-not-allowed disabled:opacity-40 ${active ? "bg-gradient-to-r from-fuchsia-500 to-violet-600 text-white ring-fuchsia-400/40" : "bg-white/5 text-white ring-white/10 hover:ring-white/20"}`}
    >
      {icon}{label}
    </button>
  );
}
