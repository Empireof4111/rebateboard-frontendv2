// Trader Return Tracker (TRT) — user-facing module.
// Single route with internal tabs (Overview, Transactions, Accounts, Payouts,
// Insights, Share Card). The URL stays /dashboard/accounts for backward
// compatibility, but the product is now framed as "Trader Return Tracker".
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Plus, Wallet, ArrowDownToLine, ArrowUpFromLine, Bot, Target, BarChart3,
  Building2, Receipt, Lightbulb, Share2, Filter, Edit3, Trash2, Search, Download,
} from "lucide-react";
import { PageHeader, Panel, Pill } from "@/components/dashboard/Primitives";
import {
  TrackerKpiCard, InsightCard, DirectionPill, StatusPill, AccountStatusPill, BrandBadge, EmptyTracker,
} from "@/components/trt/Primitives";
import { TransactionDrawer } from "@/components/trt/TransactionDrawer";
import { AccountModal } from "@/components/trt/AccountModal";
import { ShareCardBuilder } from "@/components/trt/ShareCardBuilder";
import {
  useTrt, summarize, timelineByMonth, breakdownByBrand, breakdownByCategory,
  generateInsights, removeTransaction, removeAccount, mergeLedgerEvents, money, labelCategory, labelAccountType,
  type Period, type TrtDirection,
} from "@/lib/trt-store";
import { fetchFinancialLedgerEvents } from "@/lib/financial-intelligence-api";

export const Route = createFileRoute("/dashboard/accounts")({
  head: () => ({
    meta: [
      { title: "Trader Return Tracker — RebateBoard" },
      { name: "description", content: "Track every dollar in and out of your trading: prop fees, broker deposits, payouts, rebates, tools, and education." },
    ],
  }),
  component: TrtPage,
});

type Tab = "overview" | "expenses" | "income" | "accounts" | "payouts" | "insights" | "share";

function TrtPage() {
  const trt = useTrt();
  const [tab, setTab] = useState<Tab>("overview");
  const [period, setPeriod] = useState<Period>("all");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [drawerDirection, setDrawerDirection] = useState<TrtDirection>("expense");

  const summary = useMemo(() => summarize(trt, period), [trt, period]);
  const lifetime = useMemo(() => summarize(trt, "all"), [trt]);
  const insights = useMemo(() => generateInsights(trt), [trt]);

  useEffect(() => {
    let cancelled = false;
    fetchFinancialLedgerEvents({ page: 0, size: 100 })
      .then((events) => {
        if (!cancelled) mergeLedgerEvents(events as unknown as Array<Record<string, any>>);
      })
      .catch(() => {
        // Keep local TRT records available if live ledger sync is temporarily unavailable.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const openDrawer = (d: TrtDirection = "expense") => {
    setDrawerDirection(d);
    setDrawerOpen(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Trader Return Tracker"
        subtitle="Every dollar you spend on trading and every dollar it earns back. Spot wins, leaks, and what to do next."
        actions={
          <>
            <PeriodPicker value={period} onChange={setPeriod} />
            <button
              onClick={() => openDrawer("income")}
              className="glass-pill inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-white"
            >
              <ArrowDownToLine className="h-3.5 w-3.5 text-success" /> Add income
            </button>
            <button
              onClick={() => openDrawer("expense")}
              className="inline-flex items-center gap-1.5 rounded-full rb-gradient-primary px-3 py-1.5 text-xs font-bold text-white shadow-[0_0_22px_rgba(192,132,252,0.45)]"
            >
              <Plus className="h-3.5 w-3.5" /> Add transaction
            </button>
          </>
        }
      />

      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
        <TrackerKpiCard
          label="Net PnL"
          value={money(summary.net)}
          accent={summary.net >= 0 ? "success" : "destructive"}
          trend={summary.net >= 0 ? "up" : "down"}
          hint={summary.txCount === 0 ? "No data yet" : `${summary.txCount} txns`}
        />
        <TrackerKpiCard
          label="Total spend"
          value={money(summary.expense)}
          accent="warning"
          hint="What you put in"
        />
        <TrackerKpiCard
          label="Total income"
          value={money(summary.income)}
          accent="success"
          hint="What came back"
        />
        <TrackerKpiCard
          label="True ROI"
          value={summary.roiPct == null ? "—" : `${summary.roiPct.toFixed(0)}%`}
          accent={summary.roiPct == null ? "primary" : summary.roiPct >= 0 ? "success" : "destructive"}
          hint={summary.expense === 0 ? "No expense logged" : "Income ÷ spend − 1"}
          trend={summary.roiPct == null ? undefined : summary.roiPct >= 0 ? "up" : "down"}
        />
        <TrackerKpiCard
          label="Cost recovery"
          value={`${summary.costRecoveryPct.toFixed(0)}%`}
          accent="primary"
          hint="Income ÷ spend"
        />
      </div>

      {/* Tabs */}
      <div className="glass flex flex-wrap items-center gap-1 rounded-2xl p-1 ring-1 ring-white/10">
        {(
          [
            { id: "overview", label: "Overview", icon: BarChart3 },
            { id: "expenses", label: "Expenses", icon: ArrowUpFromLine },
            { id: "income", label: "Income", icon: ArrowDownToLine },
            { id: "accounts", label: "Accounts", icon: Building2 },
            { id: "payouts", label: "Payouts", icon: Wallet },
            { id: "insights", label: "Insights", icon: Lightbulb },
            { id: "share", label: "Share Card", icon: Share2 },
          ] as { id: Tab; label: string; icon: typeof BarChart3 }[]
        ).map(({ id, label, icon: Icon }) => {
          const active = tab === id;
          return (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition ${active ? "bg-white/10 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]" : "text-muted-foreground hover:bg-white/5 hover:text-white"}`}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          );
        })}
      </div>

      {tab === "overview" && (
        <OverviewTab
          period={period}
          insights={insights}
          onAdd={() => openDrawer("expense")}
          onShareJump={() => setTab("share")}
        />
      )}
      {tab === "expenses" && <Ledger direction="expense" period={period} onAdd={() => openDrawer("expense")} />}
      {tab === "income" && <Ledger direction="income" period={period} onAdd={() => openDrawer("income")} />}
      {tab === "accounts" && <AccountsTab onAdd={() => setAccountOpen(true)} />}
      {tab === "payouts" && <PayoutsTab onAdd={() => openDrawer("income")} />}
      {tab === "insights" && (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {insights.length === 0 ? (
            <div className="md:col-span-2 lg:col-span-3">
              <EmptyTracker
                icon={Bot}
                title="No insights yet"
                description="Log a few transactions and we'll surface where money is being made, lost, or wasted."
              />
            </div>
          ) : insights.map((i) => <InsightCard key={i.id} insight={i} />)}
        </div>
      )}
      {tab === "share" && <ShareCardBuilder />}

      {/* Lifetime context strip */}
      {tab !== "share" && (
        <Panel title="Lifetime overview" action={<Pill tone="primary">All-time</Pill>}>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Stat label="Income" value={money(lifetime.income)} tone="success" />
            <Stat label="Spend" value={money(lifetime.expense)} tone="destructive" />
            <Stat label="Net" value={money(lifetime.net)} tone={lifetime.net >= 0 ? "success" : "destructive"} />
            <Stat label="Transactions" value={lifetime.txCount.toString()} />
          </div>
        </Panel>
      )}

      <TransactionDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} defaultDirection={drawerDirection} />
      <AccountModal open={accountOpen} onClose={() => setAccountOpen(false)} />
    </div>
  );
}

// ---------- Overview tab ----------

function OverviewTab({
  period, insights, onAdd, onShareJump,
}: {
  period: Period;
  insights: ReturnType<typeof generateInsights>;
  onAdd: () => void;
  onShareJump: () => void;
}) {
  const trt = useTrt();
  const tl = useMemo(() => timelineByMonth(trt, 6), [trt]);
  const byBrand = useMemo(() => breakdownByBrand(trt, period).slice(0, 6), [trt, period]);
  const byCat = useMemo(() => breakdownByCategory(trt, period), [trt, period]);
  const recent = useMemo(() => trt.transactions.slice(0, 6), [trt]);

  if (trt.transactions.length === 0) {
    return (
      <EmptyTracker
        icon={Receipt}
        title="Start tracking your trading ROI"
        description="Log every challenge fee, broker deposit, payout, and rebate. We'll show you what's working and where money leaks."
        action={
          <div className="flex flex-wrap justify-center gap-2">
            <button onClick={onAdd} className="inline-flex items-center gap-1.5 rounded-full rb-gradient-primary px-3 py-1.5 text-xs font-bold text-white">
              <Plus className="h-3.5 w-3.5" /> Add challenge fee
            </button>
            <button onClick={onAdd} className="glass-pill rounded-full px-3 py-1.5 text-xs text-white">Add payout</button>
            <button onClick={onAdd} className="glass-pill rounded-full px-3 py-1.5 text-xs text-white">Add broker deposit</button>
          </div>
        }
      />
    );
  }

  return (
    <div className="space-y-5">
      {/* Insights row */}
      {insights.length > 0 && (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {insights.slice(0, 4).map((i) => <InsightCard key={i.id} insight={i} />)}
        </div>
      )}

      {/* Charts row */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Income vs spend" action={<Pill tone="primary">Last 6 months</Pill>}>
          <IncomeExpenseBars data={tl} />
        </Panel>
        <Panel title="By brand" action={<Building2 className="h-3.5 w-3.5 text-muted-foreground" />}>
          <BrandBars data={byBrand} />
        </Panel>
        <Panel title="By category" action={<Pill>{byCat.length}</Pill>}>
          <CategoryList data={byCat.sort((a, b) => b.expense + b.income - (a.expense + a.income)).slice(0, 6)} />
        </Panel>
      </div>

      {/* Recent activity */}
      <Panel
        title="Recent activity"
        action={
          <button onClick={onShareJump} className="glass-pill inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] text-white">
            <Share2 className="h-3 w-3" /> Build share card
          </button>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="text-left text-muted-foreground">
              <tr className="border-b border-white/5">
                <th className="py-2 font-medium">Date</th>
                <th className="font-medium">Direction</th>
                <th className="font-medium">Type</th>
                <th className="font-medium">Brand</th>
                <th className="text-right font-medium">Amount</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((t) => (
                <tr key={t.id} className="border-b border-white/5 text-white/90">
                  <td className="py-2.5">{new Date(t.date).toLocaleDateString()}</td>
                  <td><DirectionPill d={t.direction} /></td>
                  <td>{labelCategory(t.category)}</td>
                  <td><BrandBadge brand={t.brand} /></td>
                  <td className={`text-right font-semibold tabular-nums ${t.direction === "income" ? "text-success" : "text-destructive"}`}>
                    {t.direction === "income" ? "+" : "−"}{money(t.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

// ---------- Ledger (expenses/income) ----------

function Ledger({ direction, period, onAdd }: { direction: TrtDirection; period: Period; onAdd: () => void }) {
  const trt = useTrt();
  const [q, setQ] = useState("");

  const items = useMemo(() => {
    const term = q.trim().toLowerCase();
    return trt.transactions
      .filter((t) => t.direction === direction)
      .filter((t) => period === "all" ? true : true)
      .filter((t) =>
        !term ||
        t.brand.name.toLowerCase().includes(term) ||
        labelCategory(t.category).toLowerCase().includes(term) ||
        (t.notes ?? "").toLowerCase().includes(term),
      );
  }, [trt, direction, period, q]);

  const total = items.reduce((s, t) => s + t.amount, 0);

  return (
    <div className="space-y-4">
      <div className="glass flex flex-wrap items-center gap-2 rounded-2xl p-2.5 ring-1 ring-white/10">
        <div className="flex flex-1 items-center gap-2 px-2">
          <Search className="h-3.5 w-3.5 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={`Search ${direction === "income" ? "income" : "expense"}…`}
            className="w-full bg-transparent text-sm text-white outline-none placeholder:text-muted-foreground"
          />
        </div>
        <Pill tone={direction === "income" ? "success" : "warning"}>
          {direction === "income" ? "+" : "−"}{money(total)}
        </Pill>
        <button onClick={onAdd} className="inline-flex items-center gap-1.5 rounded-full rb-gradient-primary px-3 py-1.5 text-xs font-bold text-white">
          <Plus className="h-3.5 w-3.5" /> Add {direction === "income" ? "income" : "expense"}
        </button>
      </div>

      {items.length === 0 ? (
        <EmptyTracker
          icon={direction === "income" ? ArrowDownToLine : ArrowUpFromLine}
          title={direction === "income" ? "No income logged" : "No expenses logged"}
          description={direction === "income" ? "Track payouts, rebates, and withdrawals to see what trading is paying you back." : "Track every dollar you spend on trading — fees, deposits, tools, education."}
          action={
            <button onClick={onAdd} className="inline-flex items-center gap-1.5 rounded-full rb-gradient-primary px-3 py-1.5 text-xs font-bold text-white">
              <Plus className="h-3.5 w-3.5" /> Add {direction === "income" ? "income" : "expense"}
            </button>
          }
        />
      ) : (
        <div className="glass overflow-hidden rounded-2xl ring-1 ring-white/10">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="text-left text-muted-foreground">
                <tr className="border-b border-white/5 bg-white/[0.02]">
                  <th className="px-3 py-2 font-medium">Date</th>
                  <th className="font-medium">Type</th>
                  <th className="font-medium">Brand</th>
                  <th className="font-medium">Account</th>
                  <th className="text-right font-medium">Amount</th>
                  <th className="font-medium">Status</th>
                  <th className="font-medium" aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {items.map((t) => {
                  const acct = trt.accounts.find((a) => a.id === t.accountId);
                  return (
                    <tr key={t.id} className="border-b border-white/5 text-white/90">
                      <td className="px-3 py-2.5 whitespace-nowrap">{new Date(t.date).toLocaleDateString()}</td>
                      <td>{labelCategory(t.category)}</td>
                      <td><BrandBadge brand={t.brand} /></td>
                      <td className="text-muted-foreground">{acct?.name ?? "—"}</td>
                      <td className={`text-right font-semibold tabular-nums ${t.direction === "income" ? "text-success" : "text-destructive"}`}>
                        {t.direction === "income" ? "+" : "−"}{money(t.amount)}
                      </td>
                      <td><StatusPill status={t.status} /></td>
                      <td className="pr-3 text-right">
                        <button
                          onClick={() => removeTransaction(t.id)}
                          className="grid h-7 w-7 place-items-center rounded-lg text-muted-foreground transition hover:bg-destructive/15 hover:text-destructive"
                          aria-label="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------- Accounts tab ----------

function AccountsTab({ onAdd }: { onAdd: () => void }) {
  const trt = useTrt();
  const stats = useMemo(() => {
    const total = trt.accounts.length;
    const active = trt.accounts.filter((a) => a.status === "active" || a.status === "funded").length;
    const funded = trt.accounts.filter((a) => a.status === "funded").length;
    const breached = trt.accounts.filter((a) => a.status === "breached" || a.status === "closed").length;
    const fees = trt.transactions
      .filter((t) => t.direction === "expense" && (t.category === "challenge_fee" || t.category === "reset_fee"))
      .reduce((s, t) => s + t.amount, 0);
    const linkedIncome = trt.transactions
      .filter((t) => t.direction === "income" && t.accountId)
      .reduce((s, t) => s + t.amount, 0);
    return { total, active, funded, breached, fees, linkedIncome };
  }, [trt]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        <TrackerKpiCard label="Total accounts" value={stats.total.toString()} />
        <TrackerKpiCard label="Active" value={stats.active.toString()} accent="primary" />
        <TrackerKpiCard label="Funded" value={stats.funded.toString()} accent="success" />
        <TrackerKpiCard label="Breached/Closed" value={stats.breached.toString()} accent="destructive" />
        <TrackerKpiCard label="Fees paid" value={money(stats.fees)} accent="warning" />
        <TrackerKpiCard label="Linked income" value={money(stats.linkedIncome)} accent="success" />
      </div>

      <div className="flex items-center justify-end">
        <button onClick={onAdd} className="inline-flex items-center gap-1.5 rounded-full rb-gradient-primary px-3 py-1.5 text-xs font-bold text-white">
          <Plus className="h-3.5 w-3.5" /> Add account
        </button>
      </div>

      {trt.accounts.length === 0 ? (
        <EmptyTracker icon={Building2} title="No accounts yet" description="Add a prop, broker, or exchange account to start linking transactions." />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {trt.accounts.map((a) => {
            const txs = trt.transactions.filter((t) => t.accountId === a.id);
            const spent = txs.filter((t) => t.direction === "expense").reduce((s, t) => s + t.amount, 0);
            const earned = txs.filter((t) => t.direction === "income").reduce((s, t) => s + t.amount, 0);
            const net = earned - spent;
            return (
              <div key={a.id} className="glass card-hover rounded-2xl p-4 ring-1 ring-white/10">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-bold text-white">{a.name}</div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
                      <BrandBadge brand={a.brand} />
                      <span>· {labelAccountType(a.type)}</span>
                      {a.size ? <span>· {money(a.size)}</span> : null}
                    </div>
                  </div>
                  <AccountStatusPill status={a.status} />
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                  <Stat label="Spent" value={money(spent)} tone="destructive" small />
                  <Stat label="Earned" value={money(earned)} tone="success" small />
                  <Stat label="Net" value={money(net)} tone={net >= 0 ? "success" : "destructive"} small />
                </div>
                <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>{txs.length} txns linked</span>
                  <button
                    onClick={() => removeAccount(a.id)}
                    className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-muted-foreground hover:bg-destructive/15 hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" /> Remove
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ---------- Payouts tab ----------

function PayoutsTab({ onAdd }: { onAdd: () => void }) {
  const trt = useTrt();
  const payouts = useMemo(() => {
    return trt.transactions
      .filter((t) => t.category === "payout")
      .sort((a, b) => +new Date(b.date) - +new Date(a.date));
  }, [trt]);
  const total = payouts.filter((p) => p.status !== "cancelled").reduce((s, t) => s + t.amount, 0);
  const avg = payouts.length ? total / payouts.length : 0;
  const pending = payouts.filter((p) => p.status === "pending").length;
  const cancelled = payouts.filter((p) => p.status === "cancelled").length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <TrackerKpiCard label="Total payouts" value={payouts.length.toString()} accent="primary" />
        <TrackerKpiCard label="Total amount" value={money(total)} accent="success" />
        <TrackerKpiCard label="Avg payout" value={money(avg)} />
        <TrackerKpiCard label="Pending / Cancelled" value={`${pending} / ${cancelled}`} accent="warning" />
      </div>
      <div className="flex items-center justify-end">
        <button onClick={onAdd} className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-[0_0_18px_rgba(16,185,129,0.4)]">
          <Plus className="h-3.5 w-3.5" /> Add payout
        </button>
      </div>
      {payouts.length === 0 ? (
        <EmptyTracker
          icon={Wallet}
          title="No payouts yet"
          description="Log payouts privately — you can decide later what to share publicly via the Share Card."
        />
      ) : (
        <div className="glass overflow-hidden rounded-2xl ring-1 ring-white/10">
          <table className="w-full text-xs">
            <thead className="text-left text-muted-foreground">
              <tr className="border-b border-white/5 bg-white/[0.02]">
                <th className="px-3 py-2 font-medium">Date</th>
                <th className="font-medium">Brand</th>
                <th className="font-medium">Account</th>
                <th className="text-right font-medium">Amount</th>
                <th className="font-medium">Status</th>
                <th className="font-medium">Notes</th>
              </tr>
            </thead>
            <tbody>
              {payouts.map((p) => {
                const acct = trt.accounts.find((a) => a.id === p.accountId);
                return (
                  <tr key={p.id} className="border-b border-white/5 text-white/90">
                    <td className="px-3 py-2.5 whitespace-nowrap">{new Date(p.date).toLocaleDateString()}</td>
                    <td><BrandBadge brand={p.brand} /></td>
                    <td className="text-muted-foreground">{acct?.name ?? "—"}</td>
                    <td className="text-right font-semibold tabular-nums text-success">+{money(p.amount)}</td>
                    <td><StatusPill status={p.status} /></td>
                    <td className="text-muted-foreground">{p.notes ?? "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ---------- Tiny stat ----------

function Stat({ label, value, tone, small }: { label: string; value: string; tone?: "success" | "destructive"; small?: boolean }) {
  const color = tone === "success" ? "text-success" : tone === "destructive" ? "text-destructive" : "text-white";
  return (
    <div>
      <div className={`${small ? "text-[9px]" : "text-[10px]"} font-bold uppercase tracking-widest text-muted-foreground`}>{label}</div>
      <div className={`${small ? "text-sm" : "text-base"} mt-0.5 font-bold tabular-nums ${color}`}>{value}</div>
    </div>
  );
}

// ---------- Period picker ----------

function PeriodPicker({ value, onChange }: { value: Period; onChange: (p: Period) => void }) {
  const opts: { id: Period; label: string }[] = [
    { id: "7d", label: "7d" },
    { id: "30d", label: "30d" },
    { id: "90d", label: "90d" },
    { id: "ytd", label: "YTD" },
    { id: "all", label: "All" },
  ];
  return (
    <div className="glass-pill flex items-center gap-0.5 rounded-full p-0.5 ring-1 ring-white/10">
      {opts.map((o) => (
        <button
          key={o.id}
          onClick={() => onChange(o.id)}
          className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition ${value === o.id ? "bg-white/15 text-white" : "text-muted-foreground hover:text-white"}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

// ---------- Charts ----------

function IncomeExpenseBars({ data }: { data: { label: string; income: number; expense: number; net: number }[] }) {
  const max = Math.max(1, ...data.flatMap((d) => [d.income, d.expense]));
  return (
    <div className="space-y-3">
      <div className="flex h-40 items-end justify-between gap-2">
        {data.map((d) => (
          <div key={d.label} className="flex flex-1 flex-col items-center gap-1">
            <div className="flex h-full w-full items-end justify-center gap-1">
              <div className="w-2.5 rounded-t-md bg-gradient-to-t from-emerald-600 to-emerald-400" style={{ height: `${(d.income / max) * 100}%` }} title={`Income ${money(d.income)}`} />
              <div className="w-2.5 rounded-t-md bg-gradient-to-t from-rose-700 to-rose-400" style={{ height: `${(d.expense / max) * 100}%` }} title={`Expense ${money(d.expense)}`} />
            </div>
            <div className="text-[10px] text-muted-foreground">{d.label}</div>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-end gap-3 text-[10px] text-muted-foreground">
        <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-400" /> Income</span>
        <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-rose-500" /> Expense</span>
      </div>
    </div>
  );
}

function BrandBars({ data }: { data: { brand: { name: string; custom?: boolean }; income: number; expense: number }[] }) {
  if (data.length === 0) return <p className="text-xs text-muted-foreground">No brand activity yet.</p>;
  const max = Math.max(1, ...data.map((d) => d.income + d.expense));
  return (
    <ul className="space-y-2.5">
      {data.map((d) => {
        const total = d.income + d.expense;
        const incPct = (d.income / max) * 100;
        const expPct = (d.expense / max) * 100;
        return (
          <li key={d.brand.name}>
            <div className="flex items-center justify-between text-[11px]">
              <span className="truncate text-white/90">{d.brand.name}</span>
              <span className="tabular-nums text-muted-foreground">{money(total)}</span>
            </div>
            <div className="mt-1 flex h-1.5 w-full gap-px overflow-hidden rounded-full bg-white/5">
              <div className="bg-gradient-to-r from-emerald-500 to-emerald-400" style={{ width: `${incPct}%` }} />
              <div className="bg-gradient-to-r from-rose-600 to-rose-400" style={{ width: `${expPct}%` }} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function CategoryList({ data }: { data: { category: string; income: number; expense: number }[] }) {
  if (data.length === 0) return <p className="text-xs text-muted-foreground">No category breakdown yet.</p>;
  return (
    <ul className="space-y-2 text-xs">
      {data.map((c) => {
        const net = c.income - c.expense;
        return (
          <li key={c.category} className="flex items-center justify-between gap-2">
            <span className="truncate text-white/90">{labelCategory(c.category as never)}</span>
            <span className={`tabular-nums font-semibold ${net >= 0 ? "text-success" : "text-destructive"}`}>
              {net >= 0 ? "+" : "−"}{money(Math.abs(net))}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
