import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import {
  fetchTbiBrand,
  type TbiProfile,
  tbiConfidenceTone,
  tbiLabelTone,
  tbiScore100,
  tbiStateLabel,
  tbiStateTone,
} from "@/lib/tbi-api";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Shield,
  Star,
  TrendingUp,
} from "lucide-react";

export const Route = createFileRoute("/tbi/brand/$slug")({
  head: () => ({
    meta: [
      { title: "TBI Brand Profile - RebateBoard" },
      {
        name: "description",
        content: "Deep trust profile showing score breakdown, confidence, risks, and trader experience.",
      },
    ],
  }),
  component: BrandPage,
});

const componentMeta = [
  { key: "ut", label: "User Trust", weight: "30%" },
  { key: "pr", label: "Payout Reliability", weight: "25%" },
  { key: "ts", label: "Transparency", weight: "15%" },
  { key: "rc", label: "Regulation & Compliance", weight: "10%" },
  { key: "tc", label: "Trading Conditions", weight: "10%" },
  { key: "cx", label: "Customer Experience", weight: "10%" },
] as const;

function BrandAvatar({ profile }: { profile: TbiProfile }) {
  const [failed, setFailed] = useState(false);
  if (profile.logo && !failed) {
    return (
      <img
        src={profile.logo}
        alt={profile.name}
        className="h-20 w-20 rounded-3xl object-cover ring-1 ring-white/10"
        onError={() => setFailed(true)}
      />
    );
  }
  return (
    <div className="grid h-20 w-20 place-items-center rounded-3xl bg-gradient-to-br from-fuchsia-500 to-violet-600 text-xl font-bold text-white">
      {profile.name.slice(0, 2).toUpperCase()}
    </div>
  );
}

function BrandPage() {
  const { slug } = Route.useParams();
  const [profile, setProfile] = useState<TbiProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    ut: true,
    pr: true,
  });

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchTbiBrand(slug)
      .then((payload) => {
        if (!active) return;
        setProfile(payload);
        setError(null);
      })
      .catch((err: Error) => {
        if (!active) return;
        setError(err.message || "Unable to load this trust profile.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [slug]);

  const ratingBars = useMemo(() => {
    if (!profile) return [];
    return componentMeta.map((entry) => ({
      ...entry,
      value: profile.components[entry.key],
      explanation: profile.componentExplanations[entry.key],
    }));
  }, [profile]);

  return (
    <div className="min-h-screen bg-[#0b0418] text-foreground">
      <SiteHeader />
      <main className="container-app py-6 sm:py-8">
        <Link to="/tbi/explore" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3 w-3" /> Back to Explore
        </Link>

        {loading ? (
          <div className="glass mt-4 rounded-3xl p-8 text-sm text-muted-foreground">Loading trust profile...</div>
        ) : error || !profile ? (
          <div className="mt-4 rounded-3xl border border-rose-500/30 bg-rose-500/10 p-6 text-sm text-rose-200">
            {error || "Brand profile not found."}
          </div>
        ) : (
          <>
            <section className="glass mt-4 rounded-3xl p-6 md:p-8">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
                <BrandAvatar profile={profile} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-3xl font-bold">{profile.name}</h1>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${tbiStateTone(profile.state)}`}>
                      {tbiStateLabel(profile.state)}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    <span>{profile.fullCategory}</span>
                    {profile.website ? <span>{profile.website}</span> : null}
                    {profile.region ? <span>{profile.region}</span> : null}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-5xl font-bold">
                    {tbiScore100(profile)}
                    <span className="text-base text-muted-foreground"> / 100</span>
                  </div>
                  <div className={`mt-1 text-sm font-semibold ${tbiLabelTone(profile.trustLabel)}`}>{profile.trustLabel}</div>
                  <div className={`mt-1 text-xs ${tbiConfidenceTone(profile.confidence)}`}>
                    {profile.confidence} confidence · factor {profile.confidenceFactor.toFixed(2)}
                  </div>
                </div>
              </div>
            </section>

            <div className="mt-6 grid gap-6 xl:grid-cols-[1.5fr_0.95fr]">
              <div className="space-y-6">
                <section className="glass rounded-3xl p-6">
                  <div className="flex items-center gap-2 text-lg font-bold">
                    <Shield className="h-4 w-4 text-fuchsia-300" /> Trust Breakdown
                  </div>
                  <div className="mt-4 space-y-3">
                    {ratingBars.map((entry) => {
                      const open = openSections[entry.key];
                      return (
                        <div key={entry.key} className="rounded-2xl bg-white/5 p-4">
                          <button
                            onClick={() =>
                              setOpenSections((current) => ({ ...current, [entry.key]: !current[entry.key] }))
                            }
                            className="flex w-full items-center justify-between gap-3 text-left"
                          >
                            <div>
                              <div className="text-sm font-semibold text-white">
                                {entry.label} <span className="text-xs text-muted-foreground">· {entry.weight}</span>
                              </div>
                              <div className="mt-1 text-xs text-muted-foreground">
                                {Math.round(entry.value * 10)} / 100
                              </div>
                            </div>
                            {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                          </button>
                          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/5">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-600"
                              style={{ width: `${Math.max(0, Math.min(100, entry.value * 10))}%` }}
                            />
                          </div>
                          {open ? (
                            <div className="mt-3 text-sm text-muted-foreground">
                              {entry.explanation}
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                </section>

                <section className="glass rounded-3xl p-6">
                  <div className="text-lg font-bold">Score Engine Visualization</div>
                  <div className="mt-4 grid gap-3 md:grid-cols-4">
                    <MetricCard label="Raw Score" value={profile.rawScore.toFixed(2)} />
                    <MetricCard label="Confidence Factor" value={profile.confidenceFactor.toFixed(2)} />
                    <MetricCard label="Risk Penalty" value={profile.riskPenalty.toFixed(2)} tone={profile.riskPenalty < 0 ? "bad" : "neutral"} />
                    <MetricCard
                      label="Final TBI"
                      value={`${tbiScore100(profile)} / 100`}
                      tone="good"
                    />
                  </div>
                  <div className="mt-4 rounded-2xl bg-white/5 p-4 text-sm text-muted-foreground">
                    <div className="font-semibold text-white">Formula</div>
                    <div className="mt-2">{profile.trustEngine.formula}</div>
                  </div>
                </section>

                <section className="glass rounded-3xl p-6">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2 text-lg font-bold">
                      <Star className="h-4 w-4 text-fuchsia-300" /> Review System
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {profile.reviewCount} reviews · {profile.verifiedReviewCount} verified · weight {profile.weightedReviewMass.toFixed(1)}
                    </div>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-5">
                    {profile.reviewDistribution.map((entry) => (
                      <div key={entry.stars} className="rounded-2xl bg-white/5 p-3 text-center">
                        <div className="text-lg font-bold text-white">{entry.stars}</div>
                        <div className="text-[11px] text-muted-foreground">stars</div>
                        <div className="mt-2 text-sm font-semibold text-fuchsia-200">{entry.count}</div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-5 space-y-3">
                    {profile.reviews.length ? (
                      profile.reviews.map((review) => (
                        <div key={review.id} className="rounded-2xl bg-white/5 p-4">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex flex-wrap items-center gap-2">
                              <div className="font-semibold text-white">{review.user}</div>
                              {review.verified ? (
                                <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                                  <CheckCircle2 className="mr-1 inline h-3 w-3" /> Verified Trader
                                </span>
                              ) : null}
                              <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-muted-foreground">
                                {review.activityLevel}
                              </span>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(review.recency).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="mt-2 text-sm text-muted-foreground">{review.comment || "No comment provided."}</div>
                          <div className="mt-3 text-xs text-sky-300">Weighted score: {Math.round(review.score * 10)} / 100</div>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-2xl bg-white/5 p-6 text-sm text-muted-foreground">
                        No trader reviews are contributing yet.
                      </div>
                    )}
                  </div>
                </section>
              </div>

              <div className="space-y-6">
                <section className="glass rounded-3xl p-6">
                  <div className="flex items-center gap-2 text-lg font-bold">
                    <TrendingUp className="h-4 w-4 text-emerald-300" /> Performance Insights
                  </div>
                  <div className="mt-4 grid gap-3">
                    <MetricCard label="Trader ROI" value={`${profile.performanceInsights.avgRoi}%`} />
                    <MetricCard label="Average Win Rate" value={`${profile.performanceInsights.avgWinRate}%`} />
                    <div className="rounded-2xl bg-white/5 p-4">
                      <div className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Payout patterns</div>
                      <div className="mt-2 text-sm text-white">{profile.performanceInsights.payoutPatterns}</div>
                    </div>
                    <div className="rounded-2xl bg-white/5 p-4">
                      <div className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Common complaints</div>
                      <div className="mt-2 space-y-2 text-sm text-white">
                        {profile.performanceInsights.commonComplaints.length ? (
                          profile.performanceInsights.commonComplaints.map((entry) => (
                            <div key={entry}>{entry}</div>
                          ))
                        ) : (
                          <div className="text-muted-foreground">No repeated complaint pattern yet.</div>
                        )}
                      </div>
                    </div>
                  </div>
                </section>

                <section className="glass rounded-3xl p-6">
                  <div className="flex items-center gap-2 text-lg font-bold">
                    <AlertTriangle className="h-4 w-4 text-orange-300" /> Risk Flags
                  </div>
                  <div className="mt-4 space-y-3">
                    {profile.riskEvents.length ? (
                      profile.riskEvents.map((event) => (
                        <div key={`${event.kind}-${event.title}`} className="rounded-2xl border border-orange-500/20 bg-orange-500/10 p-4">
                          <div className="flex items-center justify-between gap-3">
                            <div className="font-semibold text-orange-100">{event.title}</div>
                            <div className="text-xs font-semibold text-orange-300">{event.impact.toFixed(2)}</div>
                          </div>
                          <div className="mt-2 text-sm text-orange-50/90">{event.detail}</div>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-2xl bg-white/5 p-4 text-sm text-muted-foreground">
                        No active risk events are affecting this profile right now.
                      </div>
                    )}
                  </div>
                </section>

                <section className="glass rounded-3xl p-6">
                  <div className="text-lg font-bold">Improvement Section</div>
                  <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                    {profile.improvementActions.map((entry) => (
                      <div key={entry} className="rounded-2xl bg-white/5 px-4 py-3">
                        {entry}
                      </div>
                    ))}
                  </div>
                </section>

                <section className="glass rounded-3xl p-6">
                  <div className="text-lg font-bold">What changed recently?</div>
                  <div className="mt-4 space-y-3">
                    {profile.recentChanges.length ? (
                      profile.recentChanges.map((entry) => (
                        <div key={`${entry.title}-${entry.detail}`} className="rounded-2xl bg-white/5 p-4">
                          <div className="flex items-center justify-between gap-3">
                            <div className="font-semibold text-white">{entry.title}</div>
                            <div className={`text-xs font-semibold ${entry.impact < 0 ? "text-rose-300" : "text-emerald-300"}`}>
                              {entry.impact > 0 ? "+" : ""}
                              {entry.impact.toFixed(2)}
                            </div>
                          </div>
                          <div className="mt-2 text-sm text-muted-foreground">{entry.detail}</div>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-2xl bg-white/5 p-4 text-sm text-muted-foreground">
                        No recent trust-impact events recorded.
                      </div>
                    )}
                  </div>
                </section>
              </div>
            </div>
          </>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}

function MetricCard({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "neutral" | "good" | "bad";
}) {
  const toneClass =
    tone === "good"
      ? "text-emerald-300"
      : tone === "bad"
      ? "text-rose-300"
      : "text-white";
  return (
    <div className="rounded-2xl bg-white/5 p-4">
      <div className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{label}</div>
      <div className={`mt-2 text-2xl font-bold ${toneClass}`}>{value}</div>
    </div>
  );
}
