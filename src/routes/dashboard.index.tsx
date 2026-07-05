import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { useAuth, usePersonalization } from "@/lib/auth";
import { PageHeader, StatCard, Panel, Pill } from "@/components/dashboard/Primitives";
import { MiniLineChart, SourceBars } from "@/components/dashboard/Charts";
import {
  TrendingUp, TrendingDown, Sparkles, AlertTriangle, Activity,
  Plus, Star, Building2, Bot, Lightbulb, Target,
  Wallet, ArrowDownToLine, Send, Users, Zap, ArrowRight, ClipboardCheck, Bug,
} from "lucide-react";
import { openAddTrade } from "@/lib/ui-bus";
import { tickStreak, getStreakConfig } from "@/lib/rr-rewards";
import { financeApi, type WalletSummary, type WalletTransaction } from "@/lib/finance-api";
import { completeDailyTask, fetchMyDailyTasks, type DailyTaskUserBoard } from "@/lib/daily-tasks-api";
import { toast } from "@/components/superadmin/AdminActions";
import { useI18n } from "@/lib/i18n";

function fmtUSD(n: number) {
  return `$${n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export const Route = createFileRoute("/dashboard/")({
  component: DashboardHome,
});

function DashboardHome() {
  const { t } = useI18n();
  const { user, token } = useAuth();
  const [summary, setSummary] = useState<WalletSummary | null>(null);
  const [recentTx, setRecentTx] = useState<WalletTransaction[]>([]);
  const [earningsBySource, setEarningsBySource] = useState<{ source: string; amount: number }[]>([]);
  const [earningsTimeline, setEarningsTimeline] = useState<{ month: string; amount: number }[]>([]);
  const [referralStats, setReferralStats] = useState<{ total: number; thisMonth: number } | null>(null);
  const [dailyTaskBoard, setDailyTaskBoard] = useState<DailyTaskUserBoard | null>(null);
  const [claimingTaskId, setClaimingTaskId] = useState("");

  const load = useCallback(async () => {
    if (!token) return;
    const [sumRes, txRes, brkRes, timeRes, refRes] = await Promise.allSettled([
      financeApi.getWalletSummary(token),
      financeApi.getTransactions(token, { size: 5 }),
      financeApi.getEarningsBreakdown(token),
      financeApi.getEarningsTimeline(token),
      financeApi.getReferralStats(token),
    ]);
    if (sumRes.status === "fulfilled" && sumRes.value.payload) setSummary(sumRes.value.payload);
    if (txRes.status === "fulfilled" && txRes.value.payload) setRecentTx(txRes.value.payload.page);
    if (brkRes.status === "fulfilled" && brkRes.value.payload) setEarningsBySource(brkRes.value.payload);
    if (timeRes.status === "fulfilled" && timeRes.value.payload) setEarningsTimeline(timeRes.value.payload);
    if (refRes.status === "fulfilled" && refRes.value.payload) setReferralStats(refRes.value.payload);
    try {
      const taskBoard = await fetchMyDailyTasks();
      setDailyTaskBoard(taskBoard);
    } catch {
      // Keep dashboard stable if daily task engine is unavailable.
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const cfg = getStreakConfig();
    if (cfg.enabled && (cfg.qualifier === "login" || cfg.qualifier === "any_activity")) {
      tickStreak();
    }
  }, []);
  const { primaryMarketLabel, goalLabel } = usePersonalization();
  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return t("dashboard.greetingMorning");
    if (h < 18) return t("dashboard.greetingAfternoon");
    return t("dashboard.greetingEvening");
  })();
  const subtitle = primaryMarketLabel || goalLabel
    ? `${t("dashboard.tunedFor")} ${primaryMarketLabel ?? t("dashboard.yourMarkets")}${goalLabel ? ` · ${t("dashboard.goal")}: ${goalLabel}` : ""}.`
    : t("dashboard.commandCenter");

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${greeting}, ${user?.name?.split(" ")[0] ?? t("dashboard.trader")}.`}
        subtitle={subtitle}
        actions={
          <>
            <Link to={"/dashboard/trading-plan" as string} className="glass-pill inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-white">
              <ClipboardCheck className="h-3.5 w-3.5 text-accent" /> {t("dashboard.nav.tradingPlan")}
            </Link>
            <button onClick={openAddTrade} className="glass-pill inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-white">
              <Plus className="h-3.5 w-3.5" /> {t("dashboard.addTrade")}
            </button>
            <Link to={"/dashboard/ai-coach" as string} className="rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-600 px-3 py-1.5 text-xs font-semibold text-white shadow-[0_0_20px_rgba(192,132,252,0.45)]">
              {t("dashboard.askRebeta")}
            </Link>
          </>
        }
      />

      {/* Section 1 — Money First */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        <StatCard label={t("dashboard.walletBalance")} value={summary ? `$${Number(summary.balance).toLocaleString()}` : "—"} trend="up" accent="success" />
        <StatCard label={t("dashboard.totalCashback")} value={summary ? `$${Number(summary.totalEarned).toLocaleString(undefined, { maximumFractionDigits: 0 })}` : "—"} hint={t("dashboard.allTime")} trend="up" accent="success" />
        <StatCard label={t("dashboard.rrBalance")} value={user ? String(Math.round(user.rrBalance)) : "—"} accent="warning" />
        <StatCard label={t("dashboard.totalWithdrawn")} value={summary ? `$${Number(summary.totalWithdrawn).toLocaleString(undefined, { maximumFractionDigits: 0 })}` : "—"} hint={t("dashboard.lifetime")} accent="primary" />
        <StatCard label={t("dashboard.pending")} value={summary ? `$${Number(summary.pendingWithdrawals).toLocaleString()}` : "—"} hint={t("dashboard.withdrawals")} accent="warning" />
        <StatCard label={t("dashboard.referrals")} value={referralStats ? String(referralStats.total) : "—"} hint={referralStats ? `+${referralStats.thisMonth} ${t("dashboard.thisMonthPlus")}` : ""} />
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
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{t("dashboard.availableToWithdraw")}</div>
              <div className="text-2xl font-bold text-white">{summary ? `$${Number(summary.availableForWithdrawal).toLocaleString(undefined, { minimumFractionDigits: 2 })}` : "—"}</div>
              <div className="text-[11px] text-muted-foreground">
                {t("dashboard.pending")} {summary ? fmtUSD(Number(summary.pendingWithdrawals)) : "—"}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to={"/dashboard/wallet" as string} className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-[0_0_20px_rgba(16,185,129,0.4)]">
              <ArrowDownToLine className="h-3.5 w-3.5" /> {t("dashboard.withdraw")}
            </Link>
            <Link to={"/dashboard/wallet" as string} className="glass-pill inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-white">
              <Send className="h-3.5 w-3.5" /> {t("dashboard.transfer")}
            </Link>
            <Link to={"/dashboard/wallet" as string} className="glass-pill inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-white">
              {t("dashboard.openWallet")} <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Earnings Intelligence */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title={t("dashboard.earningsOverTime")} action={<Pill tone="success">6m</Pill>}>
          {earningsTimeline.length > 0
            ? <MiniLineChart data={earningsTimeline.map((d) => ({ label: d.month, amount: d.amount }))} height={140} />
            : <div className="h-[140px] flex items-center justify-center text-xs text-muted-foreground">{t("dashboard.noDataYet")}</div>}
          <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>{t("dashboard.last6Months")}</span>
            <Link to={"/dashboard/wallet" as string} className="text-accent hover:underline">{t("dashboard.viewWallet")} →</Link>
          </div>
        </Panel>

        <Panel title={t("dashboard.cashbackBySource")} action={<Building2 className="h-3.5 w-3.5 text-muted-foreground" />}>
          {earningsBySource.length > 0
            ? <SourceBars data={earningsBySource.slice(0, 6)} color="from-emerald-400 to-fuchsia-500" />
            : <div className="flex items-center justify-center py-8 text-xs text-muted-foreground">{t("dashboard.noEarningsYet")}</div>}
        </Panel>

        <Panel title={t("dashboard.earningsIntelligence")} action={<Pill tone="primary">AI</Pill>}>
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
                {t("dashboard.compareBrokers")} <ArrowRight className="h-3 w-3" />
              </Link>
            </li>
          </ul>
        </Panel>
      </div>

      {/* Referral summary */}
      <div className="glass grid gap-4 rounded-2xl p-5 ring-1 ring-white/10 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-muted-foreground">
            <Users className="h-3.5 w-3.5" /> {t("dashboard.referrals")}
          </div>
          <div className="mt-1 text-2xl font-bold text-white">{referralStats?.total ?? "—"}</div>
          <div className="text-[11px] text-muted-foreground">{t("dashboard.tradersReferred")}</div>
        </div>
        <div>
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{t("dashboard.thisMonth")}</div>
          <div className="mt-1 text-2xl font-bold text-white">+{referralStats?.thisMonth ?? "—"}</div>
          <div className="text-[11px] text-muted-foreground">{t("dashboard.newSignups")}</div>
        </div>
        <div className="flex items-end justify-end">
          <Link to={"/dashboard/referrals" as string} className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-600 px-3 py-1.5 text-xs font-semibold text-white shadow-[0_0_20px_rgba(192,132,252,0.45)]">
            {t("dashboard.inviteEarn")} <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* Section 2 — Today */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title={t("dashboard.today")} action={<Pill tone="success">{t("dashboard.live")}</Pill>}>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <div className="text-[10px] uppercase text-muted-foreground">{t("dashboard.pnl")}</div>
              <div className="mt-1 text-xl font-bold text-success">+$412</div>
              <div className="text-[10px] text-muted-foreground">+1.6% R</div>
            </div>
            <div>
              <div className="text-[10px] uppercase text-muted-foreground">{t("dashboard.trades")}</div>
              <div className="mt-1 text-xl font-bold text-white">3</div>
              <div className="text-[10px] text-muted-foreground">2W · 1L</div>
            </div>
            <div>
              <div className="text-[10px] uppercase text-muted-foreground">{t("dashboard.risk")}</div>
              <div className="mt-1 text-xl font-bold text-success">{t("dashboard.safe")}</div>
              <div className="text-[10px] text-muted-foreground">0 {t("dashboard.violations")}</div>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2 text-xs text-white/80">
            <Activity className="h-4 w-4 text-success" />
            {t("dashboard.guardrails")}: <span className="font-semibold text-success">{t("dashboard.allClear")}</span>
          </div>
        </Panel>

        {/* Section 3 — Rebeta Snapshot */}
        <Panel
          title="Rebeta Snapshot"
          action={
            <Link to={"/dashboard/ai-coach" as string} className="text-[11px] text-accent hover:underline">
              Open Rebeta →
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
        <Panel title="Recent activity" action={<Link to={"/dashboard/wallet" as string} className="text-[11px] text-accent hover:underline">View all →</Link>}>
          <ul className="space-y-3 text-xs">
            {recentTx.length === 0 && <li className="py-4 text-center text-muted-foreground">No recent activity.</li>}
            {recentTx.map((t) => {
              const isCredit = t.activity === "CREDIT";
              const Icon = isCredit ? TrendingUp : ArrowDownToLine;
              const color = isCredit ? "text-success" : "text-muted-foreground";
              const amt = `${isCredit ? "+" : "−"}$${Number(t.amount).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
              const when = new Date(t.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" });
              return (
                <li key={t.id} className="flex items-center gap-3">
                  <div className={`grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white/5 ${color}`}>
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex-1 text-white/90 truncate">{t.narration ?? t.channel}</div>
                  <span className={`font-semibold ${color}`}>{amt}</span>
                  <span className="text-[10px] text-muted-foreground">{when}</span>
                </li>
              );
            })}
          </ul>
        </Panel>
      </div>

      {/* Section 5 — Quick Actions */}
      <div className="grid gap-4 lg:grid-cols-[1.3fr_0.9fr]">
        <Panel title="Today's tasks" action={<Pill tone="warning">{dailyTaskBoard?.stats.remaining ?? 0} left</Pill>}>
          {!dailyTaskBoard || dailyTaskBoard.tasks.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.03] px-4 py-8 text-center text-sm text-muted-foreground">
              No live tasks from superadmin right now.
            </div>
          ) : (
            <div className="space-y-3">
              {dailyTaskBoard.tasks.slice(0, 4).map((task) => (
                <div key={task.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-white">{task.title}</div>
                      <div className="mt-1 text-xs text-white/65">{task.description}</div>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                        <span>{task.category}</span>
                        <span>·</span>
                        <span>{task.quantity}/day</span>
                        <span>·</span>
                        <span className="text-amber-300">+{task.rrReward} RR</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {task.url ? (
                        <a
                          href={task.url}
                          target="_blank"
                          rel="noreferrer"
                          className="glass-pill inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[11px] text-white"
                        >
                          Open task <ArrowRight className="h-3 w-3" />
                        </a>
                      ) : null}
                      <button
                        type="button"
                        disabled={task.completedToday || claimingTaskId === task.id}
                        onClick={async () => {
                          try {
                            setClaimingTaskId(task.id);
                            const payload = await completeDailyTask(task.id);
                            setDailyTaskBoard(payload);
                            toast.success(`Claimed ${task.rrReward} RR`);
                          } catch (error) {
                            toast.error(error instanceof Error ? error.message : "Unable to claim task");
                          } finally {
                            setClaimingTaskId("");
                          }
                        }}
                        className={`rounded-full px-3 py-1.5 text-[11px] font-semibold ${
                          task.completedToday
                            ? "bg-emerald-500/15 text-emerald-300"
                            : "bg-gradient-to-r from-fuchsia-500 to-violet-600 text-white"
                        }`}
                      >
                        {task.completedToday ? "Completed" : claimingTaskId === task.id ? "Claiming..." : "Claim RR"}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>

        <Panel title="Daily task progress" action={<Pill tone="success">Live</Pill>}>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <div className="text-[10px] uppercase text-muted-foreground">Available</div>
              <div className="mt-1 text-xl font-bold text-white">{dailyTaskBoard?.stats.total ?? 0}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase text-muted-foreground">Completed</div>
              <div className="mt-1 text-xl font-bold text-emerald-300">{dailyTaskBoard?.stats.completedToday ?? 0}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase text-muted-foreground">RR Claimed</div>
              <div className="mt-1 text-xl font-bold text-amber-300">{dailyTaskBoard?.stats.rrClaimedToday ?? 0}</div>
            </div>
          </div>
          <div className="mt-4 rounded-xl bg-white/5 px-3 py-2 text-xs text-white/80">
            Superadmin controls these tasks from <b>/superadmin/daily-tasks</b>. As soon as they publish or disable tasks there, this block updates from the live backend.
          </div>
        </Panel>
      </div>

      <Panel title="Quick Actions">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          {[
            { onClick: openAddTrade, icon: Plus, label: "Add Trade" },
            { to: "/dashboard/trading-plan", icon: ClipboardCheck, label: "Trading Plan" },
            { to: "/dashboard/reviews", icon: Star, label: "Write Review" },
            { to: "/dashboard/brands", icon: Building2, label: "Explore Firms" },
            { to: "/bug-bounty", icon: Bug, label: "Report Bug" },
            { to: "/dashboard/ai-coach", icon: Bot, label: "Ask Rebeta" },
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
