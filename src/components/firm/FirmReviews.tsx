import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { AlertCircle, BadgeCheck, ExternalLink, FileText, MessageSquare, ShieldCheck, Star } from "lucide-react";
import { fetchPublicReviews } from "@/lib/reviews-api";
import type { ReviewRecord } from "@/lib/reviews-store";

const RATING_FILTERS = ["All Rating", "5 stars", "4 stars", "3 stars", "2 stars", "1 star"] as const;

export function FirmReviews({ firmName, firmSlug }: { firmName: string; firmSlug?: string }) {
  const [filter, setFilter] = useState<(typeof RATING_FILTERS)[number]>("All Rating");
  const [reviews, setReviews] = useState<ReviewRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(false);
    fetchPublicReviews(firmSlug)
      .then((data) => {
        if (active) setReviews(data);
      })
      .catch(() => active && setError(true))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [firmSlug]);

  const stats = useMemo(() => {
    const total = reviews.length;
    const average = total
      ? reviews.reduce((sum, review) => sum + Number(review.ratings.overall || 0), 0) / total
      : 0;
    const verified = reviews.filter((review) => review.verifiedTrader || review.proofs.length > 0).length;
    const distribution = [5, 4, 3, 2, 1].map((rating) => ({
      rating,
      count: reviews.filter((review) => Math.round(review.ratings.overall) === rating).length,
    }));
    return { total, average, verified, distribution };
  }, [reviews]);

  const list = useMemo(() => {
    if (filter === "All Rating") return reviews;
    const stars = Number(filter[0]);
    return reviews.filter((review) => Math.round(review.ratings.overall) === stars);
  }, [filter, reviews]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="glass rounded-2xl p-5 ring-1 ring-white/10">
          <div className="h-4 w-40 animate-pulse rounded bg-white/10" />
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="h-20 animate-pulse rounded-xl bg-white/5" />
            <div className="h-20 animate-pulse rounded-xl bg-white/5" />
            <div className="h-20 animate-pulse rounded-xl bg-white/5" />
          </div>
        </div>
        {Array.from({ length: 2 }).map((_, index) => <ReviewSkeleton key={index} />)}
      </div>
    );
  }

  if (error) {
    return (
      <ReviewState
        icon={AlertCircle}
        title="We couldn’t load reviews right now"
        body="Please try again shortly."
      />
    );
  }

  return (
    <div className="space-y-5">
      <div className="glass rounded-2xl p-5 ring-1 ring-white/10">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-sm font-semibold text-white">Verified Reviews</div>
            <p className="mt-1 text-xs text-muted-foreground">
              Reviews for {firmName} are connected to User Trust and TBI contribution after verification.
            </p>
          </div>
          {firmSlug ? (
            <Link
              to="/review"
              search={{ itemSlug: firmSlug }}
              className="inline-flex items-center gap-1.5 rounded-full rb-gradient-primary px-4 py-1.5 text-xs font-bold text-white shadow-[0_0_18px_rgba(192,132,252,0.5)] transition hover:scale-[1.02]"
            >
              <MessageSquare className="h-3.5 w-3.5" /> Write a Review
            </Link>
          ) : null}
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-[220px_1fr]">
          <div className="rounded-xl bg-white/[0.04] p-4 ring-1 ring-white/10">
            <div className="text-3xl font-bold text-white">{stats.average ? stats.average.toFixed(1) : "Pending"}</div>
            <StarRow value={stats.average} />
            <div className="mt-2 text-[11px] text-muted-foreground">
              {stats.total} published reviews · {stats.verified} verified
            </div>
          </div>
          <div className="space-y-2">
            {stats.distribution.map(({ rating, count }) => (
              <div key={rating} className="grid grid-cols-[54px_1fr_32px] items-center gap-2 text-[11px] text-muted-foreground">
                <span>{rating} stars</span>
                <div className="h-2 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-violet-400 to-violet-500"
                    style={{ width: `${stats.total ? (count / stats.total) * 100 : 0}%` }}
                  />
                </div>
                <span className="text-right text-white/75">{count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-1.5">
          {RATING_FILTERS.map((rating) => (
            <button
              key={rating}
              type="button"
              onClick={() => setFilter(rating)}
              className={`rounded-full px-3 py-1.5 text-[10px] font-semibold transition ${
                filter === rating
                  ? "bg-violet-500/15 text-white ring-1 ring-violet-300/35"
                  : "bg-white/5 text-muted-foreground ring-1 ring-white/10 hover:text-white"
              }`}
            >
              {rating}
            </button>
          ))}
        </div>
      </div>

      {stats.total === 0 ? (
        <ReviewState
          icon={ShieldCheck}
          title="No verified reviews yet"
          body="Be the first to share your experience and help improve this brand’s trust data."
          action={firmSlug ? (
            <Link to="/review" search={{ itemSlug: firmSlug }} className="rounded-full rb-gradient-primary px-4 py-2 text-xs font-semibold text-white">
              Write a Review
            </Link>
          ) : null}
        />
      ) : list.length === 0 ? (
        <ReviewState
          icon={ShieldCheck}
          title="No reviews match this rating"
          body="Choose another rating filter to continue reading verified trader feedback."
        />
      ) : (
        list.map((review) => <ReviewCard key={review.id} review={review} firmName={firmName} />)
      )}
    </div>
  );
}

function ReviewCard({ review, firmName }: { review: ReviewRecord; firmName: string }) {
  return (
    <article className="glass relative overflow-hidden rounded-2xl p-5 ring-1 ring-white/10 transition hover:-translate-y-0.5 hover:ring-violet-300/30">
      <div className="pointer-events-none absolute -inset-x-10 -top-20 h-40 bg-violet-500/10 blur-3xl" />
      <div className="relative flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="grid h-12 w-12 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-violet-400 to-violet-600 text-sm font-bold text-white ring-1 ring-white/10">
              {review.userAvatarUrl ? (
                <img src={review.userAvatarUrl} alt={`${review.userName} profile`} className="h-full w-full object-cover" loading="lazy" />
              ) : (
                initials(review.userName)
              )}
            </div>
            {review.verifiedTrader || review.proofs.length > 0 ? (
              <BadgeCheck className="absolute -right-1 -top-1 h-4 w-4 rounded-full bg-[var(--rb-bg-elevated)] text-emerald-300" />
            ) : null}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-1.5 text-base font-bold text-white">
              {review.userName}
              {review.country ? <span className="text-sm">{review.country}</span> : null}
            </div>
            <div className="text-[11px] text-muted-foreground">
              {new Date(review.submittedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{review.reviewType || "Trading Experience"}</div>
          <div className="mt-1 flex items-center justify-end gap-2">
            <span className="text-2xl font-extrabold text-white">{review.ratings.overall.toFixed(1)}</span>
            <StarRow value={review.ratings.overall} />
          </div>
        </div>
      </div>

      <div className="relative my-4 h-px bg-white/10" />
      <h3 className="relative text-xl font-bold text-white">{firmName}</h3>
      <p className="relative mt-2 text-sm leading-relaxed text-muted-foreground">{review.body}</p>
      {review.proofs.length > 0 && <ProofStrip proofs={review.proofs} />}

      <div className="relative mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {scoreEntries(review).map(([label, value]) => (
          <ScoreCard key={label} label={label} value={value} />
        ))}
      </div>

      <div className="relative mt-4 flex flex-wrap gap-2 text-[11px]">
        {review.verifiedTrader ? <TrustBadge label="Verified Trader" /> : null}
        {review.proofs.length > 0 ? <TrustBadge label={`${review.proofs.length} Public Proof${review.proofs.length === 1 ? "" : "s"}`} /> : null}
        {review.verifiedPayout ? <TrustBadge label="Verified Payout" /> : null}
        {review.contributedToTbi ? <TrustBadge label="TBI Contribution" /> : null}
      </div>
    </article>
  );
}

function ProofStrip({ proofs }: { proofs: ReviewRecord["proofs"] }) {
  return (
    <div className="relative mt-4 rounded-2xl border border-white/10 bg-black/15 p-3">
      <div className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-200">
        <ShieldCheck className="h-3 w-3" />
        User-provided proof
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {proofs.slice(0, 5).map((proof) => (
          <a
            key={proof.id}
            href={proof.dataUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group/proof relative grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-xl border border-white/10 bg-white/[0.04]"
            aria-label={`Open proof ${proof.name}`}
          >
            {proof.type?.startsWith("image/") ? (
              <img src={proof.dataUrl} alt={proof.name} className="h-full w-full object-cover transition group-hover/proof:scale-105" loading="lazy" />
            ) : (
              <FileText className="h-6 w-6 text-violet-200" />
            )}
            <span className="absolute bottom-1 right-1 rounded-full bg-black/70 p-1 text-white">
              <ExternalLink className="h-3 w-3" />
            </span>
          </a>
        ))}
        {proofs.length > 5 && (
          <span className="grid h-20 w-20 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-xs font-bold text-white/75">
            +{proofs.length - 5}
          </span>
        )}
      </div>
    </div>
  );
}

function scoreEntries(review: ReviewRecord) {
  const labels: Record<string, string> = {
    customerCare: "Customer Support",
    tradingConditions: "Trading Conditions",
    paymentSpeed: "Payments",
    userFriendliness: "Platform Experience",
    payoutSpeed: "Payout Reliability",
    transparency: "Transparency",
    regulationTrust: "Regulation & Trust",
    executionQuality: "Execution",
    spreadsFees: "Spreads & Fees",
  };
  return Object.entries(review.ratings)
    .filter(([key]) => key !== "overall")
    .filter(([, value]) => Number(value) > 0)
    .slice(0, 4)
    .map(([key, value]) => [labels[key] ?? titleCase(key), Number(value)] as const);
}

function StarRow({ value, total = 5 }: { value: number; total?: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: total }).map((_, i) => (
        <Star key={i} className={`h-3.5 w-3.5 ${i < Math.round(value) ? "fill-violet-400 text-violet-400" : "text-white/15"}`} />
      ))}
    </div>
  );
}

function ScoreCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-white/[0.04] p-3 ring-1 ring-white/10">
      <div className="text-xs font-semibold text-white">{label}</div>
      <div className="mt-2"><StarRow value={value} /></div>
      <div className="mt-1 text-[11px] text-muted-foreground">{value}/5</div>
    </div>
  );
}

function TrustBadge({ label }: { label: string }) {
  return <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-1 text-emerald-200 ring-1 ring-emerald-300/20"><BadgeCheck className="h-3 w-3" />{label}</span>;
}

function ReviewState({
  icon: Icon,
  title,
  body,
  action,
}: {
  icon: typeof ShieldCheck;
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="glass rounded-2xl p-8 text-center ring-1 ring-white/10">
      <Icon className="mx-auto h-7 w-7 text-violet-300" />
      <h3 className="mt-3 text-lg font-bold text-white">{title}</h3>
      <p className="mx-auto mt-1 max-w-lg text-sm text-muted-foreground">{body}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

function ReviewSkeleton() {
  return <div className="glass animate-pulse rounded-2xl p-5 ring-1 ring-white/10"><div className="flex gap-3"><div className="h-12 w-12 rounded-full bg-white/10" /><div className="flex-1 space-y-2"><div className="h-3 w-1/3 rounded bg-white/10" /><div className="h-2 w-1/2 rounded bg-white/5" /></div></div><div className="mt-4 h-2 rounded bg-white/5" /><div className="mt-2 h-2 w-4/5 rounded bg-white/5" /></div>;
}

function initials(name: string) {
  return name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase() || "RB";
}

function titleCase(value: string) {
  return value.replace(/([A-Z])/g, " $1").replace(/^./, (letter) => letter.toUpperCase());
}
