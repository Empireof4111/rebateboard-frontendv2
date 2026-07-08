import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { EmptyState, PageHeader, Panel, Pill, SkeletonCard, StatCard } from "@/components/dashboard/Primitives";
import { useAuth } from "@/lib/auth";
import { financeApi } from "@/lib/finance-api";
import { fetchMyReviews } from "@/lib/reviews-api";
import type { ReviewRecord } from "@/lib/reviews-store";
import { useTrades } from "@/lib/trading-plan";
import { getTraderLevelProgress, PROGRESSION_TASKS } from "@/lib/trader-levels";
import {
  Activity,
  BarChart3,
  CheckCircle2,
  ClipboardCheck,
  LineChart,
  ShieldCheck,
  Star,
  Target,
  TrendingUp,
  UserCheck,
  Wallet,
} from "lucide-react";

export const Route = createFileRoute("/dashboard/tbi")({
  component: TraderTBIPage,
});

type TbiSignal = {
  label: string;
  score: number | null;
  weight: number;
  source: string;
  action: string;
  href: string;
};

function clampScore(value: number) {
  return Math.min(10, Math.max(0, value));
}

function scoreLabel(score: number | null, activeSignals: number) {
  if (score == null || activeSignals < 2) return "Not Enough Activity";
  if (score >= 8) return "Strong";
  if (score >= 6) return "Building";
  return "Needs Attention";
}

function formatScore(score: number | null, activeSignals: number) {
  return score == null || activeSignals < 2 ? "Not Enough Activity" : `${score.toFixed(1)} / 10`;
}

function TraderTBIPage() {
  const { user, token } = useAuth();
  const trades = useTrades();
  const [reviews, setReviews] = useState<ReviewRecord[]>([]);
  const [claimCount, setClaimCount] = useState(0);
  const [linkedAccountsCount, setLinkedAccountsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const [reviewRes, claimRes, partnerRes] = await Promise.allSettled([
        fetchMyReviews(0, 100),
        token ? financeApi.getMyClaims(token, { page: 0, size: 100 }) : Promise.resolve(null),
        token ? financeApi.getMyPartnerRequests(token, { page: 0, size: 100 }) : Promise.resolve(null),
      ]);
      if (cancelled) return;
      if (reviewRes.status === "fulfilled") setReviews(reviewRes.value.page);
      if (claimRes.status === "fulfilled") setClaimCount(claimRes.value?.payload?.page.length ?? 0);
      if (partnerRes.status === "fulfilled") setLinkedAccountsCount(partnerRes.value?.payload?.page.length ?? 0);
      setLoading(false);
    }
    void load();
    return () => { cancelled = true; };
  }, [token]);

  const levelProgress = useMemo(() => getTraderLevelProgress(user?.rrBalance), [user?.rrBalance]);
  const approvedReviews = reviews.filter((review) => review.status === "approved");
  const proofBackedReviews = approvedReviews.filter((review) => (review.proofs ?? []).length > 0);
  const recentApprovedReviews = approvedReviews.filter((review) => {
    const submitted = new Date(review.submittedAt).getTime();
    return Number.isFinite(submitted) && Date.now() - submitted < 90 * 24 * 60 * 60 * 1000;
  });
  const adherenceValues = trades.map((trade) => Number(trade.adherence ?? 0)).filter((value) => Number.isFinite(value) && value > 0);
  const avgAdherence = adherenceValues.length
    ? adherenceValues.reduce((sum, value) => sum + value, 0) / adherenceValues.length
    : null;

  const signals: TbiSignal[] = [
    {
      label: "Profile Completion",
      score: clampScore(Number(user?.profileCompletion ?? 0) / 10),
      weight: 20,
      source: "Profile fields and onboarding status",
      action: "Complete Profile",
      href: "/dashboard/profile",
    },
    {
      label: "Verified Reviews",
      score: approvedReviews.length ? clampScore((approvedReviews.length * 2) + proofBackedReviews.length + (recentApprovedReviews.length * 0.5)) : null,
      weight: 20,
      source: "Approved reviews and proof-backed contributions",
      action: "Write Review",
      href: "/dashboard/reviews",
    },
    {
      label: "Journal Consistency",
      score: trades.length ? clampScore(trades.length * 1.5) : null,
      weight: 20,
      source: "Logged trades in your journal",
      action: "Add Trade",
      href: "/dashboard/trades",
    },
    {
      label: "Cashback Participation",
      score: claimCount || linkedAccountsCount ? clampScore((claimCount * 2.5) + (linkedAccountsCount * 2)) : null,
      weight: 15,
      source: "Cashback claims and linked accounts",
      action: "Explore Cashback",
      href: "/dashboard/wallet",
    },
    {
      label: "Trader Level",
      score: clampScore((levelProgress.progress / 100) * 4 + (levelProgress.current.minRr > 0 ? 4 : 1)),
      weight: 15,
      source: "RR balance and progression activity",
      action: "View Rewards",
      href: "/dashboard/rewards",
    },
    {
      label: "Plan Discipline",
      score: avgAdherence == null ? null : clampScore(avgAdherence / 10),
      weight: 10,
      source: "Trade adherence and plan-following data",
      action: "Create Trading Plan",
      href: "/dashboard/trading-plan",
    },
  ];

  const activeSignals = signals.filter((signal) => signal.score != null && signal.score > 0).length;
  const rawScore = signals.reduce((sum, signal) => sum + ((signal.score ?? 0) * signal.weight) / 100, 0);
  const traderScore = activeSignals >= 2 ? clampScore(rawScore) : null;
  const confidence = activeSignals >= 5 ? "High" : activeSignals >= 3 ? "Medium" : "Preliminary";
  const timeline = [
    (user?.profileCompletion ?? 0) >= 80 ? "Profile completed" : null,
    linkedAccountsCount > 0 ? `${linkedAccountsCount} account${linkedAccountsCount === 1 ? "" : "s"} linked` : null,
    approvedReviews.length > 0 ? `${approvedReviews.length} approved review${approvedReviews.length === 1 ? "" : "s"}` : null,
    claimCount > 0 ? `${claimCount} cashback claim${claimCount === 1 ? "" : "s"} submitted` : null,
    trades.length > 0 ? `${trades.length} journal trade${trades.length === 1 ? "" : "s"} logged` : null,
    levelProgress.rr > 0 ? `${levelProgress.rr.toLocaleString()} RR earned` : null,
  ].filter(Boolean) as string[];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Trader TBI"
        subtitle="Your personal trust, consistency, and contribution profile inside RebateBoard."
      />

      {loading ? (
        <div className="grid gap-3 md:grid-cols-2">
          {[0, 1, 2, 3].map((item) => <SkeletonCard key={item} lines={4} />)}
        </div>
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <Panel title="Current Trader TBI" action={<Pill tone="primary"><ShieldCheck className="h-3 w-3" />{confidence}</Pill>}>
              <div className="grid gap-4 sm:grid-cols-[0.9fr_1.1fr]">
                <div className="rounded-2xl border border-primary/20 bg-primary/[0.06] p-4">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Personal score</div>
                  <div className="mt-3 text-3xl font-bold text-white">{formatScore(traderScore, activeSignals)}</div>
                  <div className="mt-2 text-sm text-fuchsia-100">{scoreLabel(traderScore, activeSignals)}</div>
                  <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                    Trader TBI grows from verified activity, journal consistency, account links, cashback participation, and RR progression.
                  </p>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <StatCard label="Approved Reviews" value={approvedReviews.length ? String(approvedReviews.length) : "No Data Yet"} accent="primary" />
                  <StatCard label="Linked Accounts" value={linkedAccountsCount ? String(linkedAccountsCount) : "No Data Yet"} accent="success" />
                  <StatCard label="Journal Trades" value={trades.length ? String(trades.length) : "No Data Yet"} accent="primary" />
                  <StatCard label="Trader Level" value={levelProgress.current.name} hint={`${levelProgress.rr.toLocaleString()} RR`} accent="primary" />
                </div>
              </div>
            </Panel>

            <Panel title="Performance vs Community">
              <div className="space-y-3">
                <div className="rounded-xl border border-white/10 bg-white/[0.035] p-3">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Your activity depth</div>
                  <div className="mt-1 text-lg font-semibold text-white">{activeSignals >= 3 ? "Building a reliable profile" : "More activity needed"}</div>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.035] p-3">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Community benchmark</div>
                  <div className="mt-1 text-sm font-semibold text-white">Available after more verified activity</div>
                </div>
                <Link to="/dashboard/reviews" className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-600 px-3 py-1.5 text-xs font-semibold text-white">
                  Submit Verified Review
                </Link>
              </div>
            </Panel>
          </div>

          <Panel title="Personal Score Breakdown" action={<Pill tone="primary"><BarChart3 className="h-3 w-3" />Weighted signals</Pill>}>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {signals.map((signal) => {
                const width = signal.score == null ? 0 : Math.min(100, signal.score * 10);
                return (
                  <div key={signal.label} className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-white">{signal.label}</div>
                        <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{signal.source}</p>
                      </div>
                      <Pill tone="primary">{signal.weight}%</Pill>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
                      <span>Score</span>
                      <span className="font-semibold text-white">{signal.score == null ? "No Data Yet" : `${signal.score.toFixed(1)} / 10`}</span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/[0.06]">
                      <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-400 transition-[width] duration-500" style={{ width: `${width}%` }} />
                    </div>
                    <Link to={signal.href as string} className="mt-3 inline-flex text-[11px] font-semibold text-fuchsia-200 hover:text-white">
                      {signal.action}
                    </Link>
                  </div>
                );
              })}
            </div>
          </Panel>

          <div className="grid gap-4 lg:grid-cols-2">
            <Panel title="Trust Timeline" action={<Pill tone="success"><Activity className="h-3 w-3" />Live</Pill>}>
              {timeline.length ? (
                <div className="space-y-2">
                  {timeline.map((item) => (
                    <div key={item} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2 text-sm text-white/85">
                      <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                      {item}
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={Target}
                  title="No trust events yet"
                  description="Complete your profile, link an account, write a review, or log a trade to start building your Trader TBI."
                  action={<Link to="/dashboard/profile" className="rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground">Complete Profile</Link>}
                />
              )}
            </Panel>

            <Panel title="Actions That Improve Trader TBI" action={<Pill tone="primary"><TrendingUp className="h-3 w-3" />Next steps</Pill>}>
              <div className="grid gap-2 sm:grid-cols-2">
                {[
                  ...PROGRESSION_TASKS,
                  { label: "Maintain Trading Streak", reward: 0, href: "/dashboard/rewards" },
                  { label: "Use Journal", reward: 0, href: "/dashboard/trades" },
                ].map((task) => (
                  <Link key={task.label} to={task.href as string} className="rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2.5 text-xs text-white/85 transition hover:bg-white/[0.07] hover:text-white">
                    <div className="font-semibold text-white">{task.label}</div>
                    <div className="mt-0.5 text-fuchsia-200">{task.reward ? `+${task.reward} RR` : "Improves trust depth"}</div>
                  </Link>
                ))}
              </div>
            </Panel>
          </div>

          <Panel title="Performance History">
            {trades.length || reviews.length || claimCount ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard label="Reviews Submitted" value={reviews.length ? String(reviews.length) : "No Data Yet"} accent="primary" />
                <StatCard label="Proof-backed Reviews" value={proofBackedReviews.length ? String(proofBackedReviews.length) : "No Data Yet"} accent="success" />
                <StatCard label="Cashback Claims" value={claimCount ? String(claimCount) : "No Data Yet"} accent="primary" />
                <StatCard label="Plan Adherence" value={avgAdherence == null ? "No Data Yet" : `${Math.round(avgAdherence)}%`} accent="success" />
              </div>
            ) : (
              <EmptyState
                icon={LineChart}
                title="No performance history yet"
                description="Start with one meaningful action so your personal trust profile can begin to form."
                action={<Link to="/dashboard/trades" className="rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground">Add Your First Trade</Link>}
              />
            )}
          </Panel>
        </>
      )}
    </div>
  );
}
