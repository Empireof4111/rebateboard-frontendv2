import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth, usePersonalization } from "@/lib/auth";
import { PageHeader, StatCard, Panel, Pill } from "@/components/dashboard/Primitives";
import { MiniLineChart, SourceBars } from "@/components/dashboard/Charts";
import { fetchWalletDashboard, type WalletDashboardPayload, type WalletDashboardTransaction } from "@/lib/wallet-api";
import {
  TrendingUp, TrendingDown, Sparkles, AlertTriangle, Activity,
  Plus, Star, Building2, Bot, Lightbulb, Target,
  Wallet, ArrowDownToLine, Send, Users, Zap, ArrowRight, ClipboardCheck,
} from "lucide-react";
import { openAddTrade } from "@/lib/ui-bus";
import { tickStreak, getStreakConfig } from "@/lib/rr-rewards";

function fmtUSD(n: number) {
  return `$${n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function fmtUSDFixed(n: number) {
  return `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatShortDate(input: string) {
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return input;
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function monthKey(input: string) {
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(input: string) {
  const [year, month] = input.split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleString(undefined, { month: "short" });
}

function buildTimeline(transactions: WalletDashboardTransaction[]) {
  const now = new Date();
  const months = Array.from({ length: 6 }).map((_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
    return {
      key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
      label: date.toLocaleString(undefined, { month: "short" }),
      amount: 0,
    };
  });

  for (const tx of transactions) {
    if (tx.amount <= 0) continue;
    const key = monthKey(tx.date);
    const month = months.find((entry) => entry.key === key);
    if (month) month.amount += tx.amount;
  }

  return months.map(({ label, amount }) => ({ label, amount: Math.round(amount * 100) / 100 }));
}

function buildSourceBars(transactions: WalletDashboardTransaction[]) {
  const map = new Map<string, number>();
  for (const tx of transactions) {
    if (tx.amount <= 0) continue;
    const key = tx.brandName || tx.source || "Wallet Activity";
    map.set(key, (map.get(key) || 0) + tx.amount);
  }

  return Array.from(map.entries())
    .map(([source, amount]) => ({ source, amount: Math.round(amount * 100) / 100 }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 6);
}

function buildActivityFeed(transactions: WalletDashboardTransaction[]) {
  return transactions.slice(0, 4).map((tx) => {
    const isOutgoing = tx.amount < 0 || tx.type === "Withdrawal";
    const icon =
      tx.type === "Cashback" ? TrendingUp :
      tx.type === "Reward" ? Sparkles :
      tx.type === "Referral" ? Users :
      tx.type === "Transfer" ? Send :
      ArrowDownToLine;

    const color =
      tx.type === "Cashback" ? "text-success" :
      tx.type === "Reward" ? "text-primary" :
      tx.type === "Referral" ? "text-accent" :
      isOutgoing ? "text-destructive" :
      "text-white";

    const direction = isOutgoing ? "-" : "+";
    const text = `${tx.type} · ${tx.brandName || tx.source} · ${direction}${fmtUSD(Math.abs(tx.amount))}`;

    return {
      id: tx.id,
      icon,
      color,
      text,
      time: formatShortDate(tx.date),
    };
  });
}

export const Route = createFileRoute("/dashboard/")({
  component: DashboardHome,
});

function DashboardHome() {
  const { user } = useAuth();
  const [walletDashboard, setWalletDashboard] = useState<WalletDashboardPayload | null>(null);
  const [walletLoading, setWalletLoading] = useState(true);
  const [walletError, setWalletError] = useState<string | null>(null);

  useEffect(() => {
    const cfg = getStreakConfig();
    if (cfg.enabled && (cfg.qualifier === "login" || cfg.qualifier === "any_activity")) {
      tickStreak();
    }
  }, []);

  useEffect(() => {
    let active = true;
    setWalletLoading(true);
    setWalletError(null);

    fetchWalletDashboard()
      .then((payload) => {
        if (!active) return;
        setWalletDashboard(payload);
      })
      .catch((error: Error) => {
        if (!active) return;
        setWalletError(error.message || "Unable to load dashboard data.");
      })
      .finally(() => {
        if (!active) return;
        setWalletLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const { primaryMarketLabel, goalLabel } = usePersonalization();
  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  })();
  const subtitle = primaryMarketLabel || goalLabel
    ? `Tuned for ${primaryMarketLabel ?? "your markets"}${goalLabel ? ` · Goal: ${goalLabel}` : ""}.`
    : "Here's your command center — live wallet activity, rewards, and next moves.";

  const summary = walletDashboard?.summary;
  const transactions = walletDashboard?.transactions ?? [];
  const withdrawals = walletDashboard?.withdrawals ?? [];
  const timeline = buildTimeline(transactions);
  const sourceBars = buildSourceBars(transactions);
  const activityFeed = buildActivityFeed(transactions);

  const cashbackTransactions = transactions.filter((tx) => tx.type === "Cashback" && tx.amount > 0);
  const rewardTransactions = transactions.filter((tx) => tx.type === "Reward" && tx.amount > 0);
  const referralTransactions = transactions.filter((tx) => tx.type === "Referral" && tx.amount > 0);
  const todayKey = new Date().toDateString();
  const todayTransactions = transactions.filter((tx) => new Date(tx.date).toDateString() === todayKey);
  const todayInflow = todayTransactions
    .filter((tx) => tx.amount > 0)
    .reduce((sum, tx) => sum + tx.amount, 0);
  const todayOutflow = todayTransactions
    .filter((tx) => tx.amount < 0)
    .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
  const monthLabelCurrent = new Date().toLocaleString(undefined, { month: "short" });
  const monthAmount = timeline[timeline.length - 1]?.amount ?? 0;
  const previousMonthAmount = timeline[timeline.length - 2]?.amount ?? 0;
  const monthTrendPct =
    previousMonthAmount > 0
      ? Math.round(((monthAmount - previousMonthAmount) / previousMonthAmount) * 100)
      : monthAmount > 0
      ? 100
      : 0;

  const topSource = sourceBars[0];
  const recentWithdrawal = withdrawals[0];
  const walletStatus = walletDashboard?.wallet.status || "UNKNOWN";
  const walletReady = !walletLoading && !walletError && !!walletDashboard;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${greeting}, ${user?.name?.split(" ")[0] ?? "Trader"}.`}
        subtitle={subtitle}
        actions={
          <>
            <Link to={"/dashboard/trading-plan" as string} className="glass-pill inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-white">
              <ClipboardCheck className="h-3.5 w-3.5 text-accent" /> Trading Plan
            </Link>
            <button onClick={openAddTrade} className="glass-pill inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-white">
              <Plus className="h-3.5 w-3.5" /> Add Trade
            </button>
            <Link to={"/dashboard/ai-coach" as string} className="rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-600 px-3 py-1.5 text-xs font-semibold text-white shadow-[0_0_20px_rgba(192,132,252,0.45)]">
              Ask AI
            </Link>
          </>
        }
      />

      {walletError ? (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200">
          {walletError}
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        <StatCard
          label="Wallet Balance"
          value={walletReady ? fmtUSDFixed(summary!.balance) : "$0.00"}
          hint={walletReady ? `${summary!.transactionCount} logged activities` : "Loading..."}
          trend="up"
          accent="success"
        />
        <StatCard
          label="Total Cashback"
          value={fmtUSDFixed(cashbackTransactions.reduce((sum, tx) => sum + tx.amount, 0))}
          hint={`${cashbackTransactions.length} cashback credits`}
          trend={cashbackTransactions.length ? "up" : "neutral"}
          accent="success"
        />
        <StatCard
          label="RR Balance"
          value={`${Math.round(user?.rrBalance ?? 0).toLocaleString()} RR`}
          hint={`≈ ${fmtUSDFixed((user?.rrBalance ?? 0) / 100)} cash`}
          accent="warning"
        />
        <StatCard
          label="Total Withdrawn"
          value={walletReady ? fmtUSDFixed(summary!.totalWithdrawn) : "$0.00"}
          hint={`${withdrawals.filter((item) => item.status === "paid").length} paid withdrawals`}
          accent="primary"
        />
        <StatCard
          label="This Month"
          value={fmtUSDFixed(monthAmount)}
          hint={`${monthLabelCurrent} ${monthTrendPct >= 0 ? "+" : ""}${monthTrendPct}% vs last month`}
          trend={monthTrendPct > 0 ? "up" : monthTrendPct < 0 ? "down" : "neutral"}
          accent="primary"
        />
        <StatCard
          label="Wallet Status"
          value={walletStatus}
          hint={walletReady ? `${summary!.withdrawalCount} withdrawal requests` : "Loading..."}
          accent={walletStatus === "ACTIVE" ? "success" : "warning"}
        />
      </div>

      <div className="glass relative overflow-hidden rounded-2xl p-5 ring-1 ring-white/10">
        <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-gradient-to-br from-emerald-500/30 to-fuchsia-500/20 blur-3xl" />
        <div className="relative grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
          <div className="flex items-center gap-4">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-[0_0_30px_rgba(16,185,129,0.4)]">
              <Wallet className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Available to withdraw</div>
              <div className="text-2xl font-bold text-white">
                {walletReady ? fmtUSDFixed(summary!.availableForWithdrawal) : "$0.00"}
              </div>
              <div className="text-[11px] text-muted-foreground">
                Pending {walletReady ? fmtUSDFixed(summary!.pendingWithdrawals) : "$0.00"} · Last payout{" "}
                {recentWithdrawal ? `${fmtUSDFixed(recentWithdrawal.amount)} (${recentWithdrawal.status})` : "none yet"}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to={"/dashboard/wallet" as string} className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-[0_0_20px_rgba(16,185,129,0.4)]">
              <ArrowDownToLine className="h-3.5 w-3.5" /> Withdraw
            </Link>
            <Link to={"/dashboard/wallet" as string} className="glass-pill inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-white">
              <Send className="h-3.5 w-3.5" /> Transfer
            </Link>
            <Link to={"/dashboard/wallet" as string} className="glass-pill inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-white">
              Open Wallet <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Earnings over time" action={<Pill tone={monthTrendPct > 0 ? "success" : monthTrendPct < 0 ? "destructive" : "default"}>{monthTrendPct >= 0 ? "+" : ""}{monthTrendPct}% MoM</Pill>}>
          <MiniLineChart data={timeline} height={140} />
          <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>Last 6 months</span>
            <Link to={"/dashboard/wallet" as string} className="text-accent hover:underline">View wallet →</Link>
          </div>
        </Panel>

        <Panel title="Cashback by source" action={<Building2 className="h-3.5 w-3.5 text-muted-foreground" />}>
          {sourceBars.length ? (
            <SourceBars data={sourceBars} color="from-emerald-400 to-fuchsia-500" />
          ) : (
            <div className="rounded-xl bg-white/5 p-4 text-xs text-muted-foreground">
              No cashback sources recorded yet.
            </div>
          )}
        </Panel>

        <Panel title="Earnings Intelligence" action={<Pill tone="primary">Live</Pill>}>
          <ul className="space-y-2.5 text-xs">
            <li className="flex gap-2 rounded-lg bg-emerald-500/10 p-2.5">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
              <span className="text-white">
                <b>{topSource ? topSource.source : "No source yet"}</b>
                {topSource ? ` has contributed ${fmtUSDFixed(topSource.amount)} to your wallet so far.` : " will appear here once you earn cashback."}
              </span>
            </li>
            <li className="flex gap-2 rounded-lg bg-fuchsia-500/10 p-2.5">
              <Zap className="mt-0.5 h-4 w-4 shrink-0 text-fuchsia-400" />
              <span className="text-white">
                You have <b>{transactions.length}</b> wallet activities with{" "}
                <b>{cashbackTransactions.length}</b> cashback credits recorded.
              </span>
            </li>
            <li className="flex gap-2 rounded-lg bg-amber-500/10 p-2.5">
              <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
              <span className="text-white">
                Your rewards wallet holds <b>{Math.round(user?.rrBalance ?? 0).toLocaleString()} RR</b>, worth about{" "}
                <b>{fmtUSDFixed((user?.rrBalance ?? 0) / 100)}</b>.
              </span>
            </li>
            <li>
              <Link to={"/dashboard/brands" as string} className="mt-1 inline-flex items-center gap-1 text-[11px] text-accent hover:underline">
                Compare brands → <ArrowRight className="h-3 w-3" />
              </Link>
            </li>
          </ul>
        </Panel>
      </div>

      <div className="glass grid gap-4 rounded-2xl p-5 ring-1 ring-white/10 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-muted-foreground">
            <Users className="h-3.5 w-3.5" /> Wallet activity
          </div>
          <div className="mt-1 text-2xl font-bold text-white">{transactions.length}</div>
          <div className="text-[11px] text-muted-foreground">Total logged entries</div>
        </div>
        <div>
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Rewards earned</div>
          <div className="mt-1 text-2xl font-bold text-emerald-400">{fmtUSDFixed(rewardTransactions.reduce((sum, tx) => sum + tx.amount, 0))}</div>
          <div className="text-[11px] text-muted-foreground">{rewardTransactions.length} reward credits</div>
        </div>
        <div>
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Referral credits</div>
          <div className="mt-1 text-2xl font-bold text-white">{fmtUSDFixed(referralTransactions.reduce((sum, tx) => sum + tx.amount, 0))}</div>
          <div className="text-[11px] text-muted-foreground">{referralTransactions.length} referral payouts</div>
        </div>
        <div className="flex items-end justify-end">
          <Link to={"/dashboard/wallet" as string} className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-600 px-3 py-1.5 text-xs font-semibold text-white shadow-[0_0_20px_rgba(192,132,252,0.45)]">
            Open wallet <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Today" action={<Pill tone="success">Live</Pill>}>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <div className="text-[10px] uppercase text-muted-foreground">Money in</div>
              <div className="mt-1 text-xl font-bold text-success">{fmtUSDFixed(todayInflow)}</div>
              <div className="text-[10px] text-muted-foreground">{todayTransactions.filter((tx) => tx.amount > 0).length} credits</div>
            </div>
            <div>
              <div className="text-[10px] uppercase text-muted-foreground">Money out</div>
              <div className="mt-1 text-xl font-bold text-white">{fmtUSDFixed(todayOutflow)}</div>
              <div className="text-[10px] text-muted-foreground">{todayTransactions.filter((tx) => tx.amount < 0).length} debits</div>
            </div>
            <div>
              <div className="text-[10px] uppercase text-muted-foreground">Pending</div>
              <div className="mt-1 text-xl font-bold text-success">{walletReady ? summary!.pendingWithdrawals > 0 ? "Watch" : "Clear" : "..."}</div>
              <div className="text-[10px] text-muted-foreground">{walletReady ? `${fmtUSDFixed(summary!.pendingWithdrawals)} pending` : "Loading..."}</div>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2 text-xs text-white/80">
            <Activity className="h-4 w-4 text-success" />
            Wallet guardrails: <span className="font-semibold text-success">{walletStatus === "ACTIVE" ? "Active and ready" : walletStatus}</span>
          </div>
        </Panel>

        <Panel
          title="Live Snapshot"
          action={
            <Link to={"/dashboard/wallet" as string} className="text-[11px] text-accent hover:underline">
              Open wallet →
            </Link>
          }
        >
          <ul className="space-y-2.5 text-xs">
            <li className="flex gap-2">
              <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
              <span className="text-white/90">
                {cashbackTransactions.length
                  ? `Cashback makes up the largest share of your wallet credits with ${cashbackTransactions.length} recorded entries.`
                  : "Your first cashback credits will appear here as soon as partner activity is tracked."}
              </span>
            </li>
            <li className="flex gap-2">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span className="text-white/90">
                {recentWithdrawal
                  ? `Latest withdrawal: ${fmtUSDFixed(recentWithdrawal.amount)} via ${recentWithdrawal.method} (${recentWithdrawal.status}).`
                  : "No withdrawal request has been submitted yet."}
              </span>
            </li>
            <li className="flex gap-2">
              <TrendingUp className="mt-0.5 h-4 w-4 shrink-0 text-success" />
              <span className="text-white/90">
                {topSource
                  ? `${topSource.source} is currently your top wallet source.`
                  : "Once you have multiple credit sources, your strongest source will show here."}
              </span>
            </li>
            <li className="flex gap-2 rounded-lg bg-warning/10 p-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
              <span className="text-white">
                <b>Watch:</b> {walletReady && summary!.pendingWithdrawals > 0
                  ? `${fmtUSDFixed(summary!.pendingWithdrawals)} is currently waiting in pending withdrawals.`
                  : "No pending withdrawal pressure right now."}
              </span>
            </li>
            <li className="flex gap-2 rounded-lg bg-destructive/10 p-2">
              <TrendingDown className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
              <span className="text-white">
                <b>Outflow:</b> {fmtUSDFixed(summary?.totalDebited ?? 0)} has moved out of the wallet across transfers and withdrawals.
              </span>
            </li>
          </ul>
        </Panel>

        <Panel title="Activity" action={<Link to={"/dashboard/wallet" as string} className="text-[11px] text-accent hover:underline">View all →</Link>}>
          <ul className="space-y-3 text-xs">
            {activityFeed.length ? activityFeed.map((a) => {
              const Icon = a.icon;
              return (
                <li key={a.id} className="flex items-center gap-3">
                  <div className={`grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white/5 ${a.color}`}>
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex-1 text-white/90">{a.text}</div>
                  <span className="text-[10px] text-muted-foreground">{a.time}</span>
                </li>
              );
            }) : (
              <li className="rounded-xl bg-white/5 p-3 text-muted-foreground">
                No wallet activity yet.
              </li>
            )}
          </ul>
        </Panel>
      </div>

      <Panel title="Quick Actions">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          {[
            { onClick: openAddTrade, icon: Plus, label: "Add Trade" },
            { to: "/dashboard/trading-plan", icon: ClipboardCheck, label: "Trading Plan" },
            { to: "/dashboard/reviews", icon: Star, label: "Write Review" },
            { to: "/dashboard/brands", icon: Building2, label: "Explore Firms" },
            { to: "/dashboard/ai-coach", icon: Bot, label: "Ask AI" },
          ].map((q) => {
            const Icon = q.icon;
            const cls = "group flex flex-col items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-4 transition hover:border-primary/40 hover:bg-white/[0.06]";
            const inner = (
              <>
                <Icon className="h-5 w-5 text-accent transition group-hover:scale-110" />
                <span className="text-xs font-medium text-white">{q.label}</span>
              </>
            );
            return q.onClick ? (
              <button key={q.label} onClick={q.onClick} className={cls}>{inner}</button>
            ) : (
              <Link key={q.label} to={q.to as string} className={cls}>{inner}</Link>
            );
          })}
        </div>
      </Panel>
    </div>
  );
}
