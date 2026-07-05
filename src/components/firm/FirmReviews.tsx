import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Star, ChevronDown, CheckCircle2, MessageSquare, Send, ShieldCheck } from "lucide-react";
import { fetchPublicReviews } from "@/lib/reviews-api";
import { type ReviewRecord, useReviews } from "@/lib/reviews-store";

type Review = {
  id: string;
  user: string;
  flag: string;
  date: string;
  accountSize: string;
  program: string;
  reachPayout: string;
  proofUrl?: string;
  experience: string;
  overall: number;
  weight: "low" | "medium" | "high" | null;
  body: string;
  scores: {
    customerCare: number;
    paymentSpeed: number;
    tradingCondition: number;
    userFriendliness: number;
    payoutSpeed: number;
  };
  likedMost: string;
  comments: { user: string; date: string; body: string }[];
};

const FALLBACK_REVIEWS: Review[] = [
  {
    id: "r1",
    user: "Basiru YY",
    flag: "🇳🇬",
    date: "11:12am · 23 March, 2026",
    accountSize: "$100,000",
    program: "1 Step",
    reachPayout: "1 Step",
    experience: "1 Year",
    overall: 4,
    weight: null,
    body: "Solid firm with consistent payouts. Dashboard is clean and onboarding was quick. The 1-step program suited my style and reaching payout was straightforward once I followed the rules. Customer support replied within hours.",
    scores: {
      customerCare: 5,
      paymentSpeed: 5,
      tradingCondition: 4,
      userFriendliness: 5,
      payoutSpeed: 5,
    },
    likedMost:
      "The platform feels mature — quick withdrawals, transparent rules, and a real dashboard. I never had to chase support to get paid, and the payout proof gallery in the community gave me confidence before joining.",
    comments: [
      {
        user: "Ahmed K.",
        date: "11:30am · 23 March, 2026",
        body: "Same experience here. Got my first payout in under 24 hours after request.",
      },
      {
        user: "Sara L.",
        date: "12:02pm · 23 March, 2026",
        body: "Their support team is genuinely responsive. Big plus for new traders.",
      },
    ],
  },
  {
    id: "r2",
    user: "Marko D.",
    flag: "🇩🇪",
    date: "08:40am · 22 March, 2026",
    accountSize: "$50,000",
    program: "2 Step",
    reachPayout: "2 Step",
    experience: "8 Months",
    overall: 5,
    weight: "high",
    body: "Top-tier prop firm. Passed both phases in 9 days. Spreads are tight and execution is fast. Payout in crypto landed within 6 hours.",
    scores: {
      customerCare: 5,
      paymentSpeed: 5,
      tradingCondition: 5,
      userFriendliness: 4,
      payoutSpeed: 5,
    },
    likedMost:
      "Speed of payout and the quality of the trading conditions. No tricks, no hidden rules.",
    comments: [
      {
        user: "Liam P.",
        date: "09:11am · 22 March, 2026",
        body: "Confirmed — fastest payout I've seen from any prop firm.",
      },
    ],
  },
  {
    id: "r3",
    user: "Aisha M.",
    flag: "🇦🇪",
    date: "06:18pm · 19 March, 2026",
    accountSize: "$25,000",
    program: "Instant",
    reachPayout: "Instant",
    experience: "3 Months",
    overall: 3,
    weight: "medium",
    body: "Good for beginners but the instant funded plan has tight daily loss limits. Be careful with news trading.",
    scores: {
      customerCare: 4,
      paymentSpeed: 4,
      tradingCondition: 3,
      userFriendliness: 4,
      payoutSpeed: 4,
    },
    likedMost: "Onboarding is smooth and you can start trading the same day.",
    comments: [],
  },
];

const ratings = ["All Rating", "5 stars", "4 stars", "3 stars", "2 stars", "1 star"] as const;

function StarRow({ value, total = 5 }: { value: number; total?: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: total }).map((_, i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${i < value ? "fill-fuchsia-400 text-fuchsia-400" : "text-white/15"}`}
        />
      ))}
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/[0.04] p-2.5 text-center ring-1 ring-white/10">
      <div className="text-[9px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-1 text-sm font-bold text-white">{value}</div>
    </div>
  );
}

function ScoreCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-white/[0.04] p-3 ring-1 ring-white/10">
      <div className="text-xs font-semibold text-white">{label}</div>
      <div className="mt-2">
        <StarRow value={value} />
      </div>
      <div className="mt-1 text-[11px] text-muted-foreground">{value}/5</div>
    </div>
  );
}

export function FirmReviews({ firmName, firmSlug }: { firmName: string; firmSlug?: string }) {
  const [filter, setFilter] = useState<(typeof ratings)[number]>("All Rating");
  const [openFilter, setOpenFilter] = useState(false);
  const [comment, setComment] = useState("");
  const [remoteReviews, setRemoteReviews] = useState<ReviewRecord[] | null>(null);
  const [remoteLoaded, setRemoteLoaded] = useState(false);

  const userReviews = useReviews(
    firmSlug ? { brandSlug: firmSlug, status: "approved" } : undefined,
  );

  useEffect(() => {
    let active = true;
    setRemoteLoaded(false);
    fetchPublicReviews(firmSlug)
      .then((reviews) => {
        if (!active) return;
        setRemoteReviews(reviews);
      })
      .catch(() => {
        if (!active) return;
        setRemoteReviews(null);
      })
      .finally(() => {
        if (active) setRemoteLoaded(true);
      });

    return () => {
      active = false;
    };
  }, [firmSlug]);

  const reviewSource = remoteReviews ?? userReviews;
  const submitted: Review[] = useMemo(
    () =>
      reviewSource.map((r) => ({
        id: r.id,
        user: r.userName,
        flag: r.country ?? "🌍",
        date: new Date(r.submittedAt).toLocaleString(undefined, {
          hour: "numeric",
          minute: "2-digit",
          day: "numeric",
          month: "short",
          year: "numeric",
        }),
        accountSize: r.accountSize,
        program: r.evaluationSteps ?? "—",
        reachPayout: r.evaluationSteps ?? "—",
        proofUrl: r.proofs[0]?.dataUrl,
        experience: r.experience,
        overall: r.ratings.overall,
        weight: r.proofs.length > 0 ? "high" : null,
        body: r.body,
        scores: {
          customerCare: r.ratings.customerCare,
          paymentSpeed: r.ratings.paymentSpeed,
          tradingCondition: r.ratings.tradingConditions,
          userFriendliness: r.ratings.userFriendliness,
          payoutSpeed: r.ratings.payoutSpeed,
        },
        likedMost: r.likedMost ?? "",
        comments: [],
      })),
    [reviewSource],
  );

  const allReviews = useMemo(() => {
    if (firmSlug || submitted.length || remoteLoaded) return submitted;
    return FALLBACK_REVIEWS;
  }, [firmSlug, remoteLoaded, submitted]);

  const list = useMemo(() => {
    if (filter === "All Rating") return allReviews;
    const stars = parseInt(filter[0], 10);
    return allReviews.filter((r) => r.overall === stars);
  }, [filter, allReviews]);

  return (
    <div className="space-y-5">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm font-semibold text-white">
          Total Reviews <span className="ml-1 text-fuchsia-300">{allReviews.length}</span>
        </div>
        <div className="flex items-center gap-2">
          {firmSlug && (
            <Link
              to="/review"
              search={{ itemSlug: firmSlug }}
              className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-600 px-4 py-1.5 text-xs font-bold text-white shadow-[0_0_18px_rgba(192,132,252,0.5)] hover:scale-[1.02] transition"
            >
              <MessageSquare className="h-3.5 w-3.5" /> Drop a Review
            </Link>
          )}
          <div className="relative">
            <button
              onClick={() => setOpenFilter((s) => !s)}
              className="inline-flex items-center gap-2 rounded-full bg-white/[0.06] px-4 py-1.5 text-xs font-medium text-white ring-1 ring-white/10 hover:bg-white/[0.1]"
            >
              {filter} <ChevronDown className="h-3.5 w-3.5" />
            </button>
            {openFilter && (
              <div className="absolute right-0 z-10 mt-1 w-36 overflow-hidden rounded-xl bg-[#1d0e3a] ring-1 ring-white/10 shadow-xl">
                {ratings.map((r) => (
                  <button
                    key={r}
                    onClick={() => {
                      setFilter(r);
                      setOpenFilter(false);
                    }}
                    className={`block w-full px-3 py-2 text-left text-xs hover:bg-white/10 ${filter === r ? "text-fuchsia-300" : "text-white"}`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {list.map((r) => (
        <article
          key={r.id}
          className="glass relative overflow-hidden rounded-2xl p-5 ring-1 ring-white/10"
        >
          {/* glow */}
          <div className="pointer-events-none absolute -inset-x-10 -top-20 h-40 bg-fuchsia-500/10 blur-3xl" />

          {/* TOP ROW */}
          <div className="relative grid gap-4 lg:grid-cols-[1fr_auto]">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-fuchsia-400 to-violet-600 text-sm font-bold text-white">
                  {r.user
                    .split(" ")
                    .map((s) => s[0])
                    .join("")
                    .slice(0, 2)}
                </div>
                <CheckCircle2 className="absolute -right-1 -top-1 h-4 w-4 rounded-full bg-[#1a0b2e] text-fuchsia-400" />
              </div>
              <div>
                <div className="flex items-center gap-1.5 text-base font-bold text-white">
                  {r.user} <span>{r.flag}</span>
                </div>
                <div className="text-[11px] text-muted-foreground">{r.date}</div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 lg:justify-end">
              <MetricCard label="Account Size" value={r.accountSize} />
              <MetricCard label="Program" value={r.program} />
              <MetricCard label="Reach Payout" value={r.reachPayout} />
              <div className="grid h-[58px] w-[68px] place-items-center rounded-xl bg-gradient-to-br from-fuchsia-500/20 to-violet-600/20 text-[9px] uppercase text-muted-foreground ring-1 ring-white/10">
                Proof of use
              </div>
              <MetricCard label="Experience" value={r.experience} />
              <div className="ml-1 text-right">
                <div className="text-[10px] uppercase text-muted-foreground">Overall Rating</div>
                <div className="mt-0.5 flex items-center gap-2">
                  <span className="text-2xl font-extrabold text-white">{r.overall.toFixed(1)}</span>
                  <StarRow value={r.overall} />
                </div>
                <div className="mt-1 flex items-center justify-end gap-1.5 text-[10px] text-muted-foreground">
                  Review weight
                  <span
                    className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${r.weight === null ? "bg-white/10 text-muted-foreground" : r.weight === "high" ? "bg-emerald-500/20 text-emerald-300" : r.weight === "medium" ? "bg-amber-500/20 text-amber-300" : "bg-fuchsia-500/20 text-fuchsia-300"}`}
                  >
                    {r.weight ?? "null"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="my-4 h-px bg-white/10" />

          {/* BODY */}
          <h3 className="text-xl font-bold text-white">{firmName}</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{r.body}</p>

          {/* SCORES */}
          <div className="mt-4 grid gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
            <ScoreCard label="Customer Care" value={r.scores.customerCare} />
            <ScoreCard label="Payment Speed" value={r.scores.paymentSpeed} />
            <ScoreCard label="Trading Condition" value={r.scores.tradingCondition} />
            <ScoreCard label="User Friendliness" value={r.scores.userFriendliness} />
            <ScoreCard label="Payout Speed" value={r.scores.payoutSpeed} />
          </div>

          {/* LIKED MOST + COMMENTS */}
          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            <div className="rounded-2xl bg-white/[0.03] p-4 ring-1 ring-white/10">
              <div className="text-sm font-semibold text-white">Liked Most</div>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{r.likedMost}</p>
            </div>

            <div className="rounded-2xl bg-white/[0.03] p-4 ring-1 ring-white/10">
              <div className="flex items-center justify-between">
                <div className="inline-flex items-center gap-2 text-sm font-semibold text-white">
                  <MessageSquare className="h-4 w-4" /> Comments
                  <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-muted-foreground">
                    {r.comments.length}
                  </span>
                </div>
                <button className="rounded-full bg-fuchsia-500/30 px-3 py-1 text-[10px] font-semibold text-white ring-1 ring-fuchsia-300/30 hover:bg-fuchsia-500/50">
                  Drop Comment
                </button>
              </div>

              <div className="mt-3 max-h-[200px] space-y-3 overflow-y-auto pr-1">
                {r.comments.length === 0 && (
                  <div className="rounded-lg bg-white/[0.03] p-3 text-center text-[11px] text-muted-foreground">
                    Be the first to comment.
                  </div>
                )}
                {r.comments.map((c, i) => (
                  <div key={i} className="rounded-lg bg-white/[0.04] p-3">
                    <div className="flex items-center gap-2">
                      <div className="grid h-6 w-6 place-items-center rounded-full bg-gradient-to-br from-fuchsia-400 to-violet-600 text-[10px] font-bold text-white">
                        {c.user
                          .split(" ")
                          .map((s) => s[0])
                          .join("")
                          .slice(0, 2)}
                      </div>
                      <div>
                        <div className="text-[11px] font-semibold text-white">{c.user}</div>
                        <div className="text-[9px] text-muted-foreground">{c.date}</div>
                      </div>
                    </div>
                    <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
                      {c.body}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-3 flex items-center gap-2 rounded-full bg-white/[0.04] px-3 py-1.5 ring-1 ring-white/10">
                <input
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Write a reply…"
                  className="w-full bg-transparent text-xs text-white outline-none placeholder:text-muted-foreground"
                />
                <button className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-fuchsia-500 to-violet-600 text-white">
                  <Send className="h-3 w-3" />
                </button>
              </div>
            </div>
          </div>
        </article>
      ))}

      {remoteLoaded && !list.length ? (
        <div className="glass rounded-2xl p-8 text-center text-sm text-muted-foreground ring-1 ring-white/10">
          No approved reviews are available for this brand yet.
        </div>
      ) : null}
    </div>
  );
}
