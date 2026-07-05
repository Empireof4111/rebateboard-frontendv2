import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { EmptyState, PageHeader, Panel, Pill, StatCard } from "@/components/dashboard/Primitives";
import { useAuth } from "@/lib/auth";
import { fetchMyReviews } from "@/lib/reviews-api";
import type { ReviewRecord } from "@/lib/reviews-store";
import { summarize, useTrt } from "@/lib/trt-store";
import { useTrades } from "@/lib/trading-plan";
import { CheckCircle2, ClipboardCheck, LineChart, Share2, Star, Trophy } from "lucide-react";

export const Route = createFileRoute("/dashboard/profile")({
  component: ProfilePage,
});

function formatPct(value: number | null) {
  if (value == null) return "Not tracked";
  return `${value >= 0 ? "+" : ""}${value.toFixed(0)}%`;
}

function ProfilePage() {
  const { user } = useAuth();
  const trades = useTrades();
  const trt = useTrt();
  const [reviews, setReviews] = useState<ReviewRecord[]>([]);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [shareStatus, setShareStatus] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchMyReviews()
      .then((data) => {
        if (!cancelled) setReviews(data.page);
      })
      .catch((error) => {
        if (!cancelled) setReviewError(error instanceof Error ? error.message : "Unable to load review history");
      });
    return () => { cancelled = true; };
  }, []);

  const summary = useMemo(() => summarize(trt, "all"), [trt]);
  const approvedReviews = reviews.filter((review) => review.status === "approved").length;
  const avgAdherence = trades.length
    ? Math.round(trades.reduce((sum, trade) => sum + Number(trade.adherence ?? 0), 0) / trades.length)
    : null;
  const achievements = [
    user?.onboardingCompleted ? { label: "Profile completed", icon: CheckCircle2 } : null,
    trades.length > 0 ? { label: "First trade logged", icon: LineChart } : null,
    approvedReviews > 0 ? { label: "Approved reviewer", icon: Star } : null,
    (user?.rrBalance ?? 0) > 0 ? { label: "RR earner", icon: Trophy } : null,
    summary.roiPct != null && summary.roiPct > 0 ? { label: "Positive ROI tracked", icon: ClipboardCheck } : null,
  ].filter(Boolean) as { label: string; icon: typeof CheckCircle2 }[];

  if (!user) return null;

  async function shareProfile() {
    const url = `${window.location.origin}/dashboard/profile`;
    setShareStatus(null);
    try {
      if (navigator.share) {
        await navigator.share({ title: "RebateBoard profile", text: user?.name ?? "RebateBoard trader profile", url });
        setShareStatus("Shared");
        return;
      }
      await navigator.clipboard.writeText(url);
      setShareStatus("Profile link copied");
    } catch {
      setShareStatus("Unable to share profile");
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Profile"
        subtitle="Your trading identity, stats, and history."
        actions={
          <button
            type="button"
            onClick={() => void shareProfile()}
            className="glass-pill inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-white"
          >
            <Share2 className="h-3.5 w-3.5" />
            Share Card
          </button>
        }
      />

      {shareStatus && <div className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-xs text-white">{shareStatus}</div>}

      <Panel title="Identity">
        <div className="flex items-center gap-4">
          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-violet-400 to-fuchsia-600 text-lg font-bold text-white">
            {user.name.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="truncate text-xl font-bold text-white">{user.fullName || user.name}</div>
            <div className="truncate text-xs text-muted-foreground">{user.email}</div>
            <div className="mt-1 flex flex-wrap gap-2">
              {user.status && <Pill tone={user.status === "ACTIVE" ? "success" : "default"}>{user.status}</Pill>}
              {user.country && <Pill>{user.country}</Pill>}
              {user.onboardingCompleted ? <Pill tone="success">Profile complete</Pill> : <Pill tone="warning">Profile incomplete</Pill>}
            </div>
          </div>
        </div>
      </Panel>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Trader Score" value={user.traderScore ? user.traderScore.toFixed(1) : "Not scored"} accent="primary" />
        <StatCard label="True ROI" value={formatPct(summary.roiPct)} accent={summary.roiPct != null && summary.roiPct >= 0 ? "success" : "warning"} />
        <StatCard label="Trades" value={trades.length.toLocaleString()} hint={avgAdherence == null ? "No journal data" : `${avgAdherence}% adherence`} accent="primary" />
        <StatCard label="Reviews" value={reviews.length.toLocaleString()} hint={reviewError ?? `${approvedReviews} approved`} accent={reviewError ? "warning" : "success"} />
      </div>

      <Panel title="Achievements">
        {achievements.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {achievements.map(({ label, icon: Icon }) => (
              <Pill key={label} tone="warning"><Icon className="h-3 w-3" />{label}</Pill>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Trophy}
            title="No achievements yet"
            description="Complete your profile, log trades, submit reviews, and earn RR to unlock profile achievements."
          />
        )}
      </Panel>
    </div>
  );
}
