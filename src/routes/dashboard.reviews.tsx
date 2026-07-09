import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { PageHeader, Panel, Pill, EmptyState, SkeletonCard } from "@/components/dashboard/Primitives";
import { AlertCircle, ClipboardCheck, Star } from "lucide-react";
import { fetchMyReviews } from "@/lib/reviews-api";
import type { ReviewRecord, ReviewStatus } from "@/lib/reviews-store";

export const Route = createFileRoute("/dashboard/reviews")({
  component: ReviewsPage,
});

function ReviewsPage() {
  const [reviews, setReviews] = useState<ReviewRecord[]>([]);
  const [status, setStatus] = useState<"all" | ReviewStatus>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const payload = await fetchMyReviews(0, 100, status === "all" ? undefined : status);
      setReviews(payload.page);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load your reviews.");
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => { load(); }, [load]);

  const totals = useMemo(() => ({
    pending: reviews.filter((r) => r.status === "pending").length,
    approved: reviews.filter((r) => r.status === "approved").length,
    rejected: reviews.filter((r) => r.status === "rejected").length,
    rrAwarded: reviews.reduce((sum, r) => sum + Number(r.rrAwarded ?? 0), 0),
    tbiDelta: reviews.reduce((sum, r) => sum + Number(r.tbiDelta ?? 0), 0),
  }), [reviews]);

  return (
    <div className="space-y-6">
      <PageHeader title="Reviews" subtitle="Share your experience — your reviews shape TBI." actions={
        <Link to="/review" className="rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-600 px-3 py-1.5 text-xs font-semibold text-white shadow-[0_0_20px_rgba(192,132,252,0.45)]">Write Review</Link>
      } />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <ReviewStat label="Pending" value={totals.pending} tone="warning" />
        <ReviewStat label="Approved" value={totals.approved} tone="success" />
        <ReviewStat label="Rejected" value={totals.rejected} tone="destructive" />
        <ReviewStat label="RR Awarded" value={totals.rrAwarded} tone="primary" />
      </div>

      <Panel title="Your Reviews" action={
        <div className="flex flex-wrap gap-1.5">
          {(["all", "pending", "approved", "rejected", "needs_info"] as const).map((next) => (
            <button
              key={next}
              type="button"
              onClick={() => setStatus(next)}
              className={`rounded-full px-2.5 py-1 text-[10px] font-semibold capitalize ${
                status === next ? "bg-white/15 text-white" : "bg-white/5 text-white/60 hover:text-white"
              }`}
            >
              {next === "all" ? "All" : REVIEW_STATUS_LABELS[next]}
            </button>
          ))}
        </div>
      }>
        {loading ? (
          <div className="grid gap-3 md:grid-cols-2">
            <SkeletonCard lines={4} />
            <SkeletonCard lines={4} />
          </div>
        ) : error ? (
          <EmptyState
            icon={AlertCircle}
            title="Reviews could not be loaded"
            description={error}
            action={<button onClick={load} className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white">Retry</button>}
          />
        ) : reviews.length === 0 ? (
          <EmptyState
            icon={ClipboardCheck}
            title="You have not submitted any reviews yet"
            description="Help other traders by sharing your experience. Submitted reviews appear here with moderation status and any RR/TBI impact."
            action={<Link to="/review" className="rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-600 px-3 py-1.5 text-xs font-semibold text-white">Write your first review</Link>}
          />
        ) : (
          <ul className="space-y-3">
            {reviews.map((review) => (
              <li key={review.id} className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-white">{review.brandName}</div>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                      <span>{review.providerType}</span>
                      <span>·</span>
                      <span>{new Date(review.submittedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <StatusPill status={review.status} />
                    <div className="flex">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-3.5 w-3.5 ${
                            i < Math.round(review.ratings.overall)
                              ? "fill-fuchsia-300 text-fuchsia-300"
                              : "text-white/15"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <p className="mt-3 line-clamp-3 text-xs leading-relaxed text-white/80">{review.body || "No written review provided."}</p>
                <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
                  {review.tbiDelta !== undefined && (
                    <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-emerald-300 ring-1 ring-emerald-400/20">
                      TBI {review.tbiDelta >= 0 ? "+" : ""}{review.tbiDelta.toFixed(2)}
                    </span>
                  )}
                  {review.rrAwarded ? (
                    <span className="rounded-full bg-fuchsia-500/10 px-2 py-1 text-fuchsia-200 ring-1 ring-fuchsia-400/20">
                      +{review.rrAwarded} RR
                    </span>
                  ) : null}
                  {review.adminNote && (
                    <span className="rounded-full bg-white/10 px-2 py-1 text-white/70 ring-1 ring-white/10">
                      Moderation note available
                    </span>
                  )}
                </div>
                {review.adminNote && (
                  <div className="mt-3 rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-[11px] text-white/70">
                    {review.adminNote}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel title="Review Impact" action={<Pill tone="primary">Live</Pill>}>
        {reviews.length === 0 ? (
          <p className="text-sm text-muted-foreground">TBI and RR impact appears after your reviews are moderated by the team.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-3">
            <Impact label="Approved reviews" value={String(totals.approved)} />
            <Impact label="Net TBI contribution" value={`${totals.tbiDelta >= 0 ? "+" : ""}${totals.tbiDelta.toFixed(2)}`} />
            <Impact label="RR awarded" value={`${totals.rrAwarded} RR`} />
          </div>
        )}
      </Panel>
    </div>
  );
}

function ReviewStat({ label, value, tone }: { label: string; value: number; tone: "success" | "warning" | "destructive" | "primary" }) {
  const toneClass = {
    success: "ring-emerald-400/25 text-emerald-300",
    warning: "ring-fuchsia-400/25 text-fuchsia-200",
    destructive: "ring-rose-400/25 text-rose-300",
    primary: "ring-fuchsia-400/25 text-fuchsia-300",
  }[tone];
  return (
    <div className={`glass rounded-2xl p-4 ring-1 ${toneClass}`}>
      <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</div>
      <div className="mt-1.5 text-2xl font-bold text-white tabular-nums">{value}</div>
    </div>
  );
}

function StatusPill({ status }: { status: ReviewStatus }) {
  const tone = status === "approved" ? "success" : status === "rejected" ? "destructive" : "warning";
  return <Pill tone={tone}>{REVIEW_STATUS_LABELS[status] ?? "Pending Verification"}</Pill>;
}

const REVIEW_STATUS_LABELS: Record<ReviewStatus, string> = {
  pending: "Pending Verification",
  approved: "Published",
  rejected: "Rejected",
  needs_info: "Needs More Information",
};

function Impact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-1 text-lg font-bold text-white">{value}</div>
    </div>
  );
}
