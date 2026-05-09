import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth, usePersonalization } from "@/lib/auth";
import { PageHeader, StatCard, Panel, Pill } from "@/components/dashboard/Primitives";
import { MiniLineChart, SourceBars } from "@/components/dashboard/Charts";
import {
  walletSummary, earningsBySource, earningsTimeline,
} from "@/lib/wallet-data";
import {
  TrendingUp, TrendingDown, Sparkles, AlertTriangle, Activity,
  Plus, Upload, Star, Building2, Bot, Lightbulb, Target,
  Wallet, ArrowDownToLine, Send, Users, Zap, ArrowRight, ClipboardCheck,
} from "lucide-react";
import { openAddTrade } from "@/lib/ui-bus";
import { tickStreak, getStreakConfig } from "@/lib/rr-rewards";

function fmtUSD(n: number) {
  return `$${n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export const Route = createFileRoute("/dashboard/")({
  component: DashboardHome,
});

function DashboardHome() {
  const { user } = useAuth();
  useEffect(() => {
    const cfg = getStreakConfig();
    if (cfg.enabled && (cfg.qualifier === "login" || cfg.qualifier === "any_activity")) {
      tickStreak();
    }
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
    : "Here's your command center — performance, signals, and next moves.";

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

      {/* Section 1 — Money First */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Wallet Balance" value={`$${walletSummary.balance.toLocaleString()}`} hint={`+${fmtUSD(walletSummary.cashbackThisMonth)} this month`} trend="up" accent="success" />
        <StatCard label="Total Cashback" value={`$${walletSummary.totalEarned.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} hint="All-time" trend="up" accent="success" />
        <StatCard label="RR Balance" value={`${user?.rrBalance.toFixed(0) ?? walletSummary.rrBalance}`} hint={`≈ ${fmtUSD(walletSummary.rrCashValue)} cash`} accent="warning" />
        <StatCard label="Total Withdrawn" value={`$${walletSummary.totalWithdrawn.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} hint="Lifetime" accent="primary" />
        <StatCard label="True ROI" value="194%" hint="Net +$16,390" trend="up" accent="primary" />
        <StatCard label="Active Accounts" value="6" hint="3 prop · 2 broker · 1 cex" />
      </div>

      {/* Wallet Hero */}
      <div className="glass relative overflow-hidden rounded-2xl p-5 ring-1 ring-white/10">
        <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-gradient-to-br from-emerald-500/30 to-fuchsia-500/20 blur-3xl" />
        <div className="relative grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
          <div className="flex items-center gap-4">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-[0_0_30px_rgba(16,185,129,0.4)]">
              <Wallet className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Available to withdraw</div>
              <div className="text-2xl font-bold text-white">${walletSummary.availableForWithdrawal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
              <div className="text-[11px] text-muted-foreground">
                Pending {fmtUSD(walletSummary.pendingWithdrawals)} · This month +{fmtUSD(walletSummary.cashbackThisMonth)}
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

      {/* Earnings Intelligence */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Earnings over time" action={<Pill tone="success">+15% MoM</Pill>}>
          <MiniLineChart data={earningsTimeline.map((d) => ({ label: d.month, amount: d.amount }))} height={140} />
          <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>Last 6 months</span>
            <Link to={"/dashboard/wallet" as string} className="text-accent hover:underline">View wallet →</Link>
          </div>
        </Panel>

        <Panel title="Cashback by source" action={<Building2 className="h-3.5 w-3.5 text-muted-foreground" />}>
          <SourceBars data={earningsBySource.slice(0, 6)} color="from-emerald-400 to-fuchsia-500" />
        </Panel>

        <Panel title="Earnings Intelligence" action={<Pill tone="primary">AI</Pill>}>
          <ul className="space-y-2.5 text-xs">
            <li className="flex gap-2 rounded-lg bg-emerald-500/10 p-2.5">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
              <span className="text-white"><b>You earned $1,240</b> from Exness in the last 6 months.</span>
            </li>
            <li className="flex gap-2 rounded-lg bg-fuchsia-500/10 p-2.5">
              <Zap className="mt-0.5 h-4 w-4 shrink-0 text-fuchsia-400" />
              <span className="text-white">Switching <b>Bybit → Binance</b> could earn <b>+30%</b> more on crypto volume.</span>
            </li>
            <li className="flex gap-2 rounded-lg bg-amber-500/10 p-2.5">
              <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
              <span className="text-white">You're <b>216 RR</b> away from a $25K prop discount.</span>
            </li>
            <li>
              <Link to={"/dashboard/brands" as string} className="mt-1 inline-flex items-center gap-1 text-[11px] text-accent hover:underline">
                Compare brokers <ArrowRight className="h-3 w-3" />
              </Link>
            </li>
          </ul>
        </Panel>
      </div>

      {/* Referral summary */}
      <div className="glass grid gap-4 rounded-2xl p-5 ring-1 ring-white/10 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-muted-foreground">
            <Users className="h-3.5 w-3.5" /> Referrals
          </div>
          <div className="mt-1 text-2xl font-bold text-white">12</div>
          <div className="text-[11px] text-muted-foreground">Active traders</div>
        </div>
        <div>
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Lifetime earned</div>
          <div className="mt-1 text-2xl font-bold text-emerald-400">$612</div>
          <div className="text-[11px] text-muted-foreground">From referrals</div>
        </div>
        <div>
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">This month</div>
          <div className="mt-1 text-2xl font-bold text-white">+$84</div>
          <div className="text-[11px] text-muted-foreground">3 new signups</div>
        </div>
        <div className="flex items-end justify-end">
          <Link to={"/dashboard/referrals" as string} className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-600 px-3 py-1.5 text-xs font-semibold text-white shadow-[0_0_20px_rgba(192,132,252,0.45)]">
            Invite & Earn <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* Section 2 — Today */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Today" action={<Pill tone="success">Live</Pill>}>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <div className="text-[10px] uppercase text-muted-foreground">PnL</div>
              <div className="mt-1 text-xl font-bold text-success">+$412</div>
              <div className="text-[10px] text-muted-foreground">+1.6% R</div>
            </div>
            <div>
              <div className="text-[10px] uppercase text-muted-foreground">Trades</div>
              <div className="mt-1 text-xl font-bold text-white">3</div>
              <div className="text-[10px] text-muted-foreground">2W · 1L</div>
            </div>
            <div>
              <div className="text-[10px] uppercase text-muted-foreground">Risk</div>
              <div className="mt-1 text-xl font-bold text-success">Safe</div>
              <div className="text-[10px] text-muted-foreground">0 violations</div>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2 text-xs text-white/80">
            <Activity className="h-4 w-4 text-success" />
            Guardrails: <span className="font-semibold text-success">All clear</span>
          </div>
        </Panel>

        {/* Section 3 — AI Snapshot */}
        <Panel
          title="AI Snapshot"
          action={
            <Link to={"/dashboard/ai-coach" as string} className="text-[11px] text-accent hover:underline">
              Open coach →
            </Link>
          }
        >
          <ul className="space-y-2.5 text-xs">
            <li className="flex gap-2">
              <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
              <span className="text-white/90">Your win rate jumps to <b>71%</b> in London session.</span>
            </li>
            <li className="flex gap-2">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span className="text-white/90">EURUSD is your strongest pair this month (+8.2R).</span>
            </li>
            <li className="flex gap-2">
              <TrendingUp className="mt-0.5 h-4 w-4 shrink-0 text-success" />
              <span className="text-white/90">Discipline score trending up: 6.2 → 7.1.</span>
            </li>
            <li className="flex gap-2 rounded-lg bg-warning/10 p-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
              <span className="text-white"><b>Recommendation:</b> Cap trades at 4/day after 2 consecutive losses.</span>
            </li>
            <li className="flex gap-2 rounded-lg bg-destructive/10 p-2">
              <TrendingDown className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
              <span className="text-white"><b>Warning:</b> NY session win rate dropped to 38% this week.</span>
            </li>
          </ul>
        </Panel>

        {/* Activity feed */}
        <Panel title="Activity" action={<Link to={"/dashboard/profile" as string} className="text-[11px] text-accent hover:underline">View all →</Link>}>
          <ul className="space-y-3 text-xs">
            {[
              { icon: TrendingUp, color: "text-success", text: "Trade logged · EURUSD +0.8R", time: "12m ago" },
              { icon: Star, color: "text-accent", text: "Review posted · FTMO (4★)", time: "1h ago" },
              { icon: Sparkles, color: "text-primary", text: "Earned 24 RR · daily journal", time: "3h ago" },
              { icon: Target, color: "text-success", text: "Milestone unlocked · 30-day streak", time: "Yesterday" },
            ].map((a, i) => {
              const Icon = a.icon;
              return (
                <li key={i} className="flex items-center gap-3">
                  <div className={`grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white/5 ${a.color}`}>
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex-1 text-white/90">{a.text}</div>
                  <span className="text-[10px] text-muted-foreground">{a.time}</span>
                </li>
              );
            })}
          </ul>
        </Panel>
      </div>

      {/* Section 5 — Quick Actions */}
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
