import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth, usePersonalization } from "@/lib/auth";
import { PageHeader, StatCard, Panel, Pill, EmptyState } from "@/components/dashboard/Primitives";
import { DashboardChecklist } from "@/components/dashboard/OnboardingChecklist";
import { MiniLineChart, SourceBars } from "@/components/dashboard/Charts";
import {
  TrendingUp, Bot, AlertTriangle, Activity,
  Plus, Star, Building2, Lightbulb,
  Wallet, ArrowDownToLine, Send, Users, Zap, ArrowRight, ClipboardCheck, Bug, Gift,
  CheckCircle2, Target,
} from "lucide-react";
import { openAddTrade } from "@/lib/ui-bus";
import { financeApi, type WalletSummary, type WalletTransaction } from "@/lib/finance-api";
import { completeDailyTask, fetchMyDailyTasks, type DailyTaskUserBoard } from "@/lib/daily-tasks-api";
import { toast } from "@/components/superadmin/AdminActions";
import { useI18n } from "@/lib/i18n";
import { resolveTradeNetPnl, resolveTradeOutcome, useTrades, useTradingPlan } from "@/lib/trading-plan";
import { fetchMyReviews } from "@/lib/reviews-api";
import { getNextUnlock, getTraderLevelProgress, PROGRESSION_TASKS } from "@/lib/trader-levels";

function fmtUSD(n: number) {
  return `$${n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function displayMoney(value: number | null | undefined, hasActivity = true) {
  if (value === null || value === undefined) return "Preparing";
  if (!hasActivity && Math.abs(Number(value)) < 0.01) return "No Data Yet";
  return `$${Number(value).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

function displayCount(value: number | null | undefined, hasActivity = true) {
  if (value === null || value === undefined) return "Preparing";
  if (!hasActivity && Number(value) === 0) return "No Data Yet";
  return Number(value).toLocaleString();
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
  const [reviewCount, setReviewCount] = useState(0);
  const [claimCount, setClaimCount] = useState(0);
  const [linkedAccountsCount, setLinkedAccountsCount] = useState(0);
  const [localNow, setLocalNow] = useState(() => new Date());
  const trades = useTrades();
  const tradingPlan = useTradingPlan();

  const load = useCallback(async () => {
    if (!token) return;
    const [sumRes, txRes, brkRes, timeRes, refRes, reviewRes, claimRes, partnerRes] = await Promise.allSettled([
      financeApi.getWalletSummary(token),
      financeApi.getTransactions(token, { size: 5 }),
      financeApi.getEarningsBreakdown(token),
      financeApi.getEarningsTimeline(token),
      financeApi.getReferralStats(token),
      fetchMyReviews(0, 1),
      financeApi.getMyClaims(token, { page: 0, size: 1 }),
      financeApi.getMyPartnerRequests(token, { page: 0, size: 1 }),
    ]);
    if (sumRes.status === "fulfilled" && sumRes.value.payload) setSummary(sumRes.value.payload);
    if (txRes.status === "fulfilled" && txRes.value.payload) setRecentTx(txRes.value.payload.page);
    if (brkRes.status === "fulfilled" && brkRes.value.payload) setEarningsBySource(brkRes.value.payload);
    if (timeRes.status === "fulfilled" && timeRes.value.payload) setEarningsTimeline(timeRes.value.payload);
    if (refRes.status === "fulfilled" && refRes.value.payload) setReferralStats(refRes.value.payload);
    if (reviewRes.status === "fulfilled") setReviewCount(reviewRes.value.page.length);
    if (claimRes.status === "fulfilled" && claimRes.value.payload) setClaimCount(claimRes.value.payload.page.length);
    if (partnerRes.status === "fulfilled" && partnerRes.value.payload) setLinkedAccountsCount(partnerRes.value.payload.page.length);
    try {
      const taskBoard = await fetchMyDailyTasks();
      setDailyTaskBoard(taskBoard);
    } catch {
      // Keep dashboard stable if daily task engine is unavailable.
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const updateLocalClock = () => setLocalNow(new Date());
    updateLocalClock();
    const timer = window.setInterval(updateLocalClock, 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const { marketLabels, goalLabels } = usePersonalization();
  const hasTradingPlan = Boolean(
    tradingPlan.profile || tradingPlan.strategies.length > 0 || tradingPlan.checklist.length > 0,
  );
  const walletHasActivity = Boolean(summary && (
    Number(summary.balance) > 0
    || Number(summary.totalEarned) > 0
    || Number(summary.totalWithdrawn) > 0
    || Number(summary.pendingWithdrawals) > 0
    || recentTx.length > 0
  ));
  const topEarningSource = useMemo(() => {
    return [...earningsBySource].sort((a, b) => b.amount - a.amount)[0] ?? null;
  }, [earningsBySource]);
  const todayTradeStats = useMemo(() => {
    const todayKey = new Date().toDateString();
    const todayTrades = trades.filter((trade) => new Date(trade.createdAt).toDateString() === todayKey);
    const completed = todayTrades.map((trade) => resolveTradeNetPnl(trade)).filter((value): value is number => value !== null);
    const pnl = completed.reduce((sum, value) => sum + value, 0);
    const wins = todayTrades.filter((trade) => resolveTradeOutcome(trade) === "profit").length;
    const losses = todayTrades.filter((trade) => resolveTradeOutcome(trade) === "loss").length;
    const violations = todayTrades.reduce((sum, trade) => sum + (trade.violations?.length ?? 0), 0);
    const adherence = todayTrades.length
      ? Math.round(todayTrades.reduce((sum, trade) => sum + Number(trade.adherence || 0), 0) / todayTrades.length)
      : 0;
    return { todayTrades, pnl, wins, losses, violations, adherence };
  }, [trades]);
  const journalSnapshot = useMemo(() => {
    const completedTrades = trades.filter((trade) => resolveTradeNetPnl(trade) !== null);
    const wins = completedTrades.filter((trade) => resolveTradeOutcome(trade) === "profit").length;
    const winRate = completedTrades.length ? Math.round((wins / completedTrades.length) * 100) : 0;
    const adherence = trades.length
      ? Math.round(trades.reduce((sum, trade) => sum + Number(trade.adherence || 0), 0) / trades.length)
      : 0;
    const violations = trades.reduce((sum, trade) => sum + (trade.violations?.length ?? 0), 0);
    const byAsset = trades.reduce<Record<string, { pnl: number; count: number }>>((acc, trade) => {
      const key = trade.asset || "Unknown";
      acc[key] = acc[key] ?? { pnl: 0, count: 0 };
      acc[key].pnl += resolveTradeNetPnl(trade) ?? 0;
      acc[key].count += 1;
      return acc;
    }, {});
    const strongestAsset = Object.entries(byAsset).sort((a, b) => b[1].pnl - a[1].pnl)[0] ?? null;
    return { winRate, adherence, violations, strongestAsset };
  }, [trades]);
  const levelProgress = useMemo(() => getTraderLevelProgress(user?.rrBalance), [user?.rrBalance]);
  const nextUnlock = useMemo(() => getNextUnlock(user?.rrBalance), [user?.rrBalance]);
  const journeyItems = useMemo(() => [
    { label: "Profile Completed", done: Boolean(user?.onboardingCompleted || Number(user?.profileCompletion ?? 0) >= 80) },
    { label: `${reviewCount} Reviews Submitted`, done: reviewCount > 0 },
    { label: `${linkedAccountsCount} Trading Accounts Linked`, done: linkedAccountsCount > 0 },
    { label: "Cashback Claimed", done: claimCount > 0 },
    { label: levelProgress.current.name, done: true },
  ], [claimCount, levelProgress.current.name, linkedAccountsCount, reviewCount, user?.onboardingCompleted, user?.profileCompletion]);
  const greeting = useMemo(() => {
    const h = localNow.getHours();
    if (h < 12) return t("dashboard.greetingMorning");
    if (h < 18) return t("dashboard.greetingAfternoon");
    return t("dashboard.greetingEvening");
  }, [localNow, t]);
  const visibleMarkets = marketLabels.slice(0, 3).join(", ");
  const visibleGoals = goalLabels.slice(0, 2).join(", ");
  const subtitle = visibleMarkets || visibleGoals
    ? `${t("dashboard.tunedFor")} ${visibleMarkets || t("dashboard.yourMarkets")}${visibleGoals ? ` · ${t("dashboard.goal")}: ${visibleGoals}` : ""}.`
    : t("dashboard.commandCenter");

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${greeting}, ${user?.name?.split(" ")[0] ?? t("dashboard.trader")}.`}
        subtitle={subtitle}
        actions={
          <>
            <Link to={"/dashboard/trading-plan" as string} className="glass-pill inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-white">
              <ClipboardCheck className="h-3.5 w-3.5 text-violet-300" /> {t("dashboard.nav.tradingPlan")}
            </Link>
            <button onClick={openAddTrade} className="glass-pill inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-white">
              <Plus className="h-3.5 w-3.5" /> {t("dashboard.addTrade")}
            </button>
            <Link to={"/dashboard/ai-coach" as string} className="rounded-full rb-gradient-primary px-3 py-1.5 text-xs font-semibold text-white shadow-[0_0_20px_rgba(192,132,252,0.45)]">
              {t("dashboard.askRebeta")}
            </Link>
          </>
        }
      />

      <DashboardChecklist
        signals={{
          linkedAccounts: linkedAccountsCount,
          reviews: reviewCount,
          claims: claimCount,
          trades: trades.length,
          hasTradingPlan,
        }}
      />

      <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <Panel title="Trading Journey" action={<Pill tone="primary"><Target className="h-3 w-3" />Current Goal</Pill>}>
          <div className="grid gap-3 md:grid-cols-[1fr_0.9fr]">
            <div className="space-y-2">
              {journeyItems.map((item) => (
                <div key={item.label} className="flex items-center gap-2 rounded-xl bg-white/[0.035] px-3 py-2 text-xs">
                  <span className={`grid h-6 w-6 place-items-center rounded-full ${item.done ? "bg-emerald-500/15 text-emerald-300" : "bg-white/10 text-muted-foreground"}`}>
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  </span>
                  <span className={item.done ? "text-white" : "text-muted-foreground"}>{item.label}</span>
                </div>
              ))}
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Current Goal</div>
              <div className="mt-1 text-sm font-semibold text-white">{nextUnlock.title}</div>
              <p className="mt-1 text-xs text-muted-foreground">{nextUnlock.subtitle}</p>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-violet-400 transition-[width] duration-500" style={{ width: `${nextUnlock.progress}%` }} />
              </div>
              <div className="mt-2 text-[11px] text-muted-foreground">{Math.round(nextUnlock.progress)}% complete</div>
            </div>
          </div>
        </Panel>

        <Panel title="Next Unlock" action={<Pill tone="primary"><Gift className="h-3 w-3" />{nextUnlock.remaining.toLocaleString()} RR left</Pill>}>
          <div className="rounded-2xl border border-primary/20 bg-primary/[0.06] p-4">
            <div className="text-lg font-bold text-white">{nextUnlock.title}</div>
            <p className="mt-1 text-sm text-muted-foreground">{nextUnlock.subtitle}</p>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/[0.07]">
              <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-violet-400 transition-[width] duration-500" style={{ width: `${nextUnlock.progress}%` }} />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
              {PROGRESSION_TASKS.slice(0, 4).map((task) => (
                <Link key={task.label} to={task.href as string} className="rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2 text-white/80 transition hover:bg-white/[0.07] hover:text-white">
                  {task.label} <span className="text-violet-200">+{task.reward} RR</span>
                </Link>
              ))}
            </div>
          </div>
        </Panel>
      </div>

      {/* Section 1 — Money First */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        <StatCard label={t("dashboard.walletBalance")} value={displayMoney(summary?.balance, walletHasActivity)} trend={walletHasActivity ? "up" : "neutral"} accent="success" />
        <StatCard label={t("dashboard.totalCashback")} value={displayMoney(summary?.totalEarned, walletHasActivity)} hint={t("dashboard.allTime")} trend={walletHasActivity ? "up" : "neutral"} accent="success" />
        <StatCard label={t("dashboard.rrBalance")} value={displayCount(user?.rrBalance, Number(user?.rrBalance ?? 0) > 0)} hint={levelProgress.current.name} accent="primary" />
        <StatCard label={t("dashboard.totalWithdrawn")} value={displayMoney(summary?.totalWithdrawn, walletHasActivity)} hint={t("dashboard.lifetime")} accent="primary" />
        <StatCard label={t("dashboard.pending")} value={displayMoney(summary?.pendingWithdrawals, walletHasActivity)} hint={t("dashboard.withdrawals")} accent="warning" />
        <StatCard label={t("dashboard.referrals")} value={displayCount(referralStats?.total, Number(referralStats?.total ?? 0) > 0)} hint={referralStats && referralStats.thisMonth > 0 ? `+${referralStats.thisMonth} ${t("dashboard.thisMonthPlus")}` : ""} />
      </div>

      {/* Wallet Hero */}
      <div className="glass relative overflow-hidden rounded-2xl p-5 ring-1 ring-white/10">
        <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-gradient-to-br from-emerald-500/30 to-violet-500/20 blur-3xl" />
        <div className="relative grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
          <div className="flex items-center gap-4">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-[0_0_30px_rgba(16,185,129,0.4)]">
              <Wallet className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{t("dashboard.availableToWithdraw")}</div>
              <div className="text-2xl font-bold text-white">
                {summary && walletHasActivity
                  ? `$${Number(summary.availableForWithdrawal).toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                  : summary
                    ? "Awaiting Activity"
                    : "Preparing"}
              </div>
              <div className="text-[11px] text-muted-foreground">
                {summary && walletHasActivity
                  ? `${t("dashboard.pending")} ${fmtUSD(Number(summary.pendingWithdrawals))}`
                  : "Cashback and withdrawals will appear here."}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to={(walletHasActivity ? "/dashboard/wallet" : "/dashboard/brands") as string} className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-[0_0_20px_rgba(16,185,129,0.4)]">
              <ArrowDownToLine className="h-3.5 w-3.5" /> {walletHasActivity ? t("dashboard.withdraw") : "Explore Programs"}
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
            <Link to={"/dashboard/wallet" as string} className="text-violet-300 hover:underline">{t("dashboard.viewWallet")} →</Link>
          </div>
        </Panel>

        <Panel title={t("dashboard.cashbackBySource")} action={<Building2 className="h-3.5 w-3.5 text-muted-foreground" />}>
          {earningsBySource.length > 0
            ? <SourceBars data={earningsBySource.slice(0, 6)} color="from-emerald-400 to-violet-500" />
            : <div className="flex items-center justify-center py-8 text-xs text-muted-foreground">{t("dashboard.noEarningsYet")}</div>}
        </Panel>

        <Panel title={t("dashboard.earningsIntelligence")} action={<Pill tone="primary">AI</Pill>}>
          {summary || topEarningSource || user ? (
            <ul className="space-y-2.5 text-xs">
              {topEarningSource ? (
                <li className="flex gap-2 rounded-lg bg-emerald-500/10 p-2.5">
                  <Bot className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                  <span className="text-white"><b>{topEarningSource.source}</b> is your top tracked earning source at <b>{fmtUSD(Number(topEarningSource.amount))}</b>.</span>
                </li>
              ) : (
                <li className="flex gap-2 rounded-lg bg-white/5 p-2.5">
                  <Bot className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="text-white/75">No cashback earnings have landed yet. Link an account or submit a claim to start tracking.</span>
                </li>
              )}
              {summary && Number(summary.pendingWithdrawals) > 0 ? (
                <li className="flex gap-2 rounded-lg bg-violet-500/10 p-2.5">
                  <Zap className="mt-0.5 h-4 w-4 shrink-0 text-violet-200" />
                  <span className="text-white">You have <b>{fmtUSD(Number(summary.pendingWithdrawals))}</b> in pending withdrawals.</span>
                </li>
              ) : (
                <li className="flex gap-2 rounded-lg bg-violet-500/10 p-2.5">
                  <Zap className="mt-0.5 h-4 w-4 shrink-0 text-violet-400" />
                  <span className="text-white">Available wallet balance is <b>{summary && walletHasActivity ? fmtUSD(Number(summary.availableForWithdrawal)) : "No Data Yet"}</b>.</span>
                </li>
              )}
              <li className="flex gap-2 rounded-lg bg-primary/10 p-2.5">
                <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-violet-300" />
                <span className="text-white">Current RR balance: <b>{Number(user?.rrBalance ?? 0) > 0 ? `${Math.round(user?.rrBalance ?? 0).toLocaleString()} RR` : "No Data Yet"}</b>.</span>
              </li>
              <li>
                <Link to={"/dashboard/brands" as string} className="mt-1 inline-flex items-center gap-1 text-[11px] text-violet-300 hover:underline">
                  {t("dashboard.compareBrokers")} <ArrowRight className="h-3 w-3" />
                </Link>
              </li>
            </ul>
          ) : (
            <EmptyState
              icon={Lightbulb}
              title="No earnings insights yet"
              description="Wallet and cashback intelligence appears after you connect accounts, earn cashback, or submit claims."
            />
          )}
        </Panel>
      </div>

      {/* Referral summary */}
      <div className="glass grid gap-4 rounded-2xl p-5 ring-1 ring-white/10 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-muted-foreground">
            <Users className="h-3.5 w-3.5" /> {t("dashboard.referrals")}
          </div>
          <div className="mt-1 text-2xl font-bold text-white">{referralStats && referralStats.total > 0 ? referralStats.total : "No Data Yet"}</div>
          <div className="text-[11px] text-muted-foreground">{t("dashboard.tradersReferred")}</div>
        </div>
        <div>
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{t("dashboard.thisMonth")}</div>
          <div className="mt-1 text-2xl font-bold text-white">{referralStats && referralStats.thisMonth > 0 ? `+${referralStats.thisMonth}` : "No Data Yet"}</div>
          <div className="text-[11px] text-muted-foreground">{t("dashboard.newSignups")}</div>
        </div>
        <div className="flex items-end justify-end">
          <Link to={"/dashboard/referrals" as string} className="inline-flex items-center gap-1.5 rounded-full rb-gradient-primary px-3 py-1.5 text-xs font-semibold text-white shadow-[0_0_20px_rgba(192,132,252,0.45)]">
            {t("dashboard.inviteEarn")} <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* Section 2 — Today */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title={t("dashboard.today")} action={<Pill tone="success">{t("dashboard.live")}</Pill>}>
          {todayTradeStats.todayTrades.length === 0 ? (
            <EmptyState
              icon={Activity}
              title="No trades logged today"
              description="Log today’s trades to see PnL, win/loss count, rule adherence, and guardrail status."
              action={<button onClick={openAddTrade} className="rounded-full rb-gradient-primary px-3 py-1.5 text-xs font-semibold text-white">Add trade</button>}
            />
          ) : (
            <>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <div className="text-[10px] uppercase text-muted-foreground">{t("dashboard.pnl")}</div>
                  <div className={`mt-1 text-xl font-bold ${todayTradeStats.pnl >= 0 ? "text-success" : "text-destructive"}`}>{todayTradeStats.pnl >= 0 ? "+" : "−"}${Math.abs(todayTradeStats.pnl).toFixed(2)}</div>
                  <div className="text-[10px] text-muted-foreground">{todayTradeStats.adherence}% adherence</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase text-muted-foreground">{t("dashboard.trades")}</div>
                  <div className="mt-1 text-xl font-bold text-white">{todayTradeStats.todayTrades.length}</div>
                  <div className="text-[10px] text-muted-foreground">{todayTradeStats.wins}W · {todayTradeStats.losses}L</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase text-muted-foreground">{t("dashboard.risk")}</div>
                  <div className={`mt-1 text-xl font-bold ${todayTradeStats.violations === 0 ? "text-success" : "text-violet-300"}`}>
                    {todayTradeStats.violations === 0 ? t("dashboard.safe") : "Review"}
                  </div>
                  <div className="text-[10px] text-muted-foreground">{todayTradeStats.violations} {t("dashboard.violations")}</div>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2 text-xs text-white/80">
                <Activity className={`h-4 w-4 ${todayTradeStats.violations === 0 ? "text-success" : "text-violet-300"}`} />
                {t("dashboard.guardrails")}: <span className={`font-semibold ${todayTradeStats.violations === 0 ? "text-success" : "text-violet-300"}`}>{todayTradeStats.violations === 0 ? t("dashboard.allClear") : `${todayTradeStats.violations} item(s) to review`}</span>
              </div>
            </>
          )}
        </Panel>

        {/* Section 3 — Rebeta Snapshot */}
        <Panel
          title="Rebeta Snapshot"
          action={
            <Link to={"/dashboard/ai-coach" as string} className="text-[11px] text-violet-300 hover:underline">
              Open Rebeta →
            </Link>
          }
        >
          {trades.length === 0 ? (
            <EmptyState
              icon={Bot}
              title="AI insights need trade data"
              description="Rebeta journal insights will appear after enough trades are logged."
              action={<button onClick={openAddTrade} className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white">Log trade</button>}
            />
          ) : (
            <ul className="space-y-2.5 text-xs">
              <li className="flex gap-2">
                <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-violet-300" />
                <span className="text-white/90">Logged trades: <b>{trades.length}</b> · win rate <b>{journalSnapshot.winRate}%</b>.</span>
              </li>
              {journalSnapshot.strongestAsset && (
                <li className="flex gap-2">
                  <Bot className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span className="text-white/90"><b>{journalSnapshot.strongestAsset[0]}</b> is your strongest logged asset at <b>{journalSnapshot.strongestAsset[1].pnl >= 0 ? "+" : "−"}${Math.abs(journalSnapshot.strongestAsset[1].pnl).toFixed(2)}</b>.</span>
                </li>
              )}
              <li className="flex gap-2">
                <TrendingUp className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                <span className="text-white/90">Average plan adherence is <b>{journalSnapshot.adherence}%</b>.</span>
              </li>
              <li className={`flex gap-2 rounded-lg p-2 ${journalSnapshot.violations === 0 ? "bg-emerald-500/10" : "bg-warning/10"}`}>
                <AlertTriangle className={`mt-0.5 h-4 w-4 shrink-0 ${journalSnapshot.violations === 0 ? "text-success" : "text-violet-300"}`} />
                <span className="text-white"><b>{journalSnapshot.violations === 0 ? "Guardrail:" : "Review:"}</b> {journalSnapshot.violations === 0 ? "No journal rule violations recorded." : `${journalSnapshot.violations} rule violation(s) recorded across your journal.`}</span>
              </li>
            </ul>
          )}
        </Panel>

        {/* Activity feed */}
        <Panel title="Recent activity" action={<Link to={"/dashboard/wallet" as string} className="text-[11px] text-violet-300 hover:underline">View all →</Link>}>
          {recentTx.length === 0 ? (
            <EmptyState
              icon={Wallet}
              title="No wallet activity yet"
              description="Cashback credits, withdrawals, and RR movements will appear here after your first activity."
              action={<Link to={"/dashboard/brands" as string} className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/15">Browse Programs</Link>}
            />
          ) : (
            <ul className="space-y-3 text-xs">
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
          )}
        </Panel>
      </div>

      {/* Section 5 — Quick Actions */}
      <div className="grid gap-4 lg:grid-cols-[1.3fr_0.9fr]">
        <Panel title="Today's tasks" action={<Pill tone="warning">{dailyTaskBoard?.stats.remaining ? `${dailyTaskBoard.stats.remaining} left` : "No live tasks"}</Pill>}>
          {!dailyTaskBoard || dailyTaskBoard.tasks.length === 0 ? (
            <EmptyState
              icon={Gift}
              title="No live tasks today"
              description="When reward tasks are published, they will appear here with the RR you can earn."
              action={<Link to={"/dashboard/rewards" as string} className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/15">View Rewards</Link>}
            />
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
                        <span className="text-violet-200">+{task.rrReward} RR</span>
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
                            : "rb-gradient-primary text-white"
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
              <div className="mt-1 text-xl font-bold text-white">{dailyTaskBoard?.stats.total ? dailyTaskBoard.stats.total : "No Data Yet"}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase text-muted-foreground">Completed</div>
              <div className="mt-1 text-xl font-bold text-emerald-300">{dailyTaskBoard?.stats.completedToday ? dailyTaskBoard.stats.completedToday : "No Data Yet"}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase text-muted-foreground">RR Claimed</div>
              <div className="mt-1 text-xl font-bold text-violet-200">{dailyTaskBoard?.stats.rrClaimedToday ? dailyTaskBoard.stats.rrClaimedToday : "No Data Yet"}</div>
            </div>
          </div>
          <div className="mt-4 rounded-xl bg-white/5 px-3 py-2 text-xs text-white/80">
            New missions will appear automatically. Complete them to earn RR and maintain your Trading Streak.
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
                <Icon className="h-5 w-5 text-violet-300 transition group-hover:scale-110" />
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
