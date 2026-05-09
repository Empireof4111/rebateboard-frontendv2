import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { getTBIBrand } from "@/lib/tbi-data";
import { Shield, CheckCircle2, AlertTriangle, TrendingUp, Star, ArrowLeft, Info, X } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export const Route = createFileRoute("/tbi/brand/$slug")({
  loader: ({ params }) => {
    const brand = getTBIBrand(params.slug);
    if (!brand) throw notFound();
    return brand;
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.name ?? "Brand"} TBI Score — RebateBoard` },
      { name: "description", content: `Trusted Brand Index profile for ${loaderData?.name ?? "this brand"}.` },
    ],
  }),
  component: BrandPage,
  notFoundComponent: () => (
    <div className="min-h-screen bg-[#0b0418] text-foreground">
      <SiteHeader />
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h1 className="text-3xl font-bold">Brand not found</h1>
        <Link to="/tbi/explore" className="mt-4 inline-block text-fuchsia-300">← Back to Explore</Link>
      </div>
    </div>
  ),
});

function ScoreBar({ label, value, max = 10, locked }: { label: string; value: number; max?: number; locked?: boolean }) {
  const pct = locked ? 0 : (value / max) * 100;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className={`font-semibold ${locked ? "text-muted-foreground" : "text-foreground"}`}>{locked ? "Locked" : value.toFixed(1)}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/5">
        <div className={`h-full rounded-full ${locked ? "bg-white/10" : "bg-gradient-to-r from-fuchsia-500 to-violet-500"}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function BrandPage() {
  const b = Route.useLoaderData();
  const [showBreakdown, setShowBreakdown] = useState(false);

  const structural = (b.breakdown.transparency + b.breakdown.proof + b.breakdown.conditions) / 3;
  const experience = b.breakdown.experience ?? 0;

  return (
    <div className="min-h-screen bg-[#0b0418] text-foreground">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Link to="/tbi/explore" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3 w-3" /> Back to Explore
        </Link>

        {/* HEADER */}
        <section className="glass mt-3 rounded-3xl p-6 md:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center">
            <div className={`grid h-20 w-20 shrink-0 place-items-center rounded-2xl bg-gradient-to-br ${b.logoColor} text-xl font-bold text-white shadow-lg`}>
              {b.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-3xl font-bold">{b.name}</h1>
                <span className="rounded-full bg-white/5 px-2 py-0.5 text-xs text-muted-foreground">{b.category}</span>
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {b.website} · {b.country} · {b.regulation}
              </div>
            </div>
            <div className="text-right">
              <div className="text-5xl font-bold">{b.score.toFixed(1)}<span className="text-base text-muted-foreground">/{b.maxScore}</span></div>
              {b.status === "full" && <div className="mt-1 text-xs text-emerald-300"><CheckCircle2 className="mr-1 inline h-3 w-3" /> Fully Verified · Confidence {b.confidence}</div>}
              {b.status === "partial" && <div className="mt-1 text-xs text-amber-300"><AlertTriangle className="mr-1 inline h-3 w-3" /> Limited reviews</div>}
              {b.status === "preliminary" && <div className="mt-1 text-xs text-fuchsia-300">Preliminary · No trader reviews yet</div>}
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <button onClick={() => setShowBreakdown(true)} className="rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-600 px-5 py-2 text-xs font-semibold">View Score Breakdown</button>
            <button className="glass-pill rounded-full px-5 py-2 text-xs">Read Reviews</button>
            <button className="glass-pill rounded-full px-5 py-2 text-xs">Write Review</button>
          </div>
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          {/* LEFT */}
          <div className="space-y-6">
            {/* BREAKDOWN */}
            <section className="glass rounded-2xl p-6">
              <h2 className="flex items-center gap-2 text-lg font-bold"><Shield className="h-4 w-4 text-fuchsia-300" /> TBI Breakdown</h2>
              <div className="mt-4 space-y-3">
                <ScoreBar label="Transparency" value={b.breakdown.transparency} />
                <ScoreBar label="Proof Strength" value={b.breakdown.proof} />
                <ScoreBar label="Community Trust" value={b.breakdown.community} locked={b.breakdown.community === 0} />
                <ScoreBar label="Trading Conditions" value={b.breakdown.conditions} />
                <ScoreBar label="Trader Experience" value={experience} locked={experience === 0} />
              </div>
            </section>

            {/* HOW CALCULATED */}
            <section className="glass rounded-2xl p-6">
              <h2 className="flex items-center gap-2 text-lg font-bold"><Info className="h-4 w-4 text-fuchsia-300" /> How TBI Is Calculated</h2>
              <p className="mt-2 text-sm text-muted-foreground">TBI combines structural brand data with verified trader experience.</p>
              <div className="mt-4 overflow-hidden rounded-xl bg-white/5">
                <div className="flex h-10 text-[11px] font-semibold">
                  <div className="grid place-items-center bg-violet-500/30 text-violet-100" style={{ width: "40%" }}>40% Brand Data</div>
                  <div className="grid place-items-center bg-fuchsia-500/30 text-fuchsia-100" style={{ width: "60%" }}>60% Trader Experience</div>
                </div>
              </div>
              {experience === 0 && <div className="mt-3 rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-200">⚠ Trader experience not yet available — preliminary data only.</div>}
            </section>

            {/* REVIEWS */}
            <section className="glass rounded-2xl p-6">
              <div className="flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-lg font-bold"><Star className="h-4 w-4 text-amber-300" /> Reviews</h2>
                <div className="text-xs text-muted-foreground">Total: <b className="text-foreground">{b.reviewCount}</b> · Verified: <b className="text-emerald-300">{b.verifiedReviews}</b></div>
              </div>
              {b.reviews.length === 0 ? (
                <div className="mt-4 rounded-lg bg-white/5 px-4 py-6 text-center text-xs text-muted-foreground">No reviews yet. Be the first to review.</div>
              ) : (
                <div className="mt-4 space-y-3">
                  {b.reviews.map((r: any, i: number) => (
                    <div key={i} className="rounded-xl bg-white/5 p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-fuchsia-500 to-violet-600 text-[10px] font-bold">{r.user.slice(0, 2).toUpperCase()}</div>
                          <div className="text-sm font-semibold">{r.user}</div>
                          {r.verified && <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] text-emerald-300">✓ Verified</span>}
                        </div>
                        <div className="flex items-center gap-1 text-xs"><Star className="h-3 w-3 fill-amber-300 text-amber-300" /> <span className="font-semibold">{r.score.toFixed(1)}</span></div>
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">{r.comment}</p>
                      <div className="mt-1 text-[10px] text-muted-foreground">{r.date}</div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* RIGHT */}
          <div className="space-y-6">
            {/* PERFORMANCE */}
            {b.performance && (
              <section className="glass rounded-2xl p-6">
                <h3 className="flex items-center gap-2 text-sm font-bold"><TrendingUp className="h-4 w-4 text-emerald-300" /> RebateBoard Edge</h3>
                <p className="mt-1 text-[11px] text-muted-foreground">Aggregated performance of traders using {b.name}.</p>
                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2">
                    <span className="text-xs text-muted-foreground">Avg ROI</span>
                    <span className="text-sm font-bold text-emerald-300">+{b.performance.avgRoi}%</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2">
                    <span className="text-xs text-muted-foreground">Avg Win Rate</span>
                    <span className="text-sm font-bold">{b.performance.avgWinRate}%</span>
                  </div>
                  <div className="rounded-lg bg-white/5 px-3 py-2">
                    <div className="text-[10px] text-muted-foreground">Common Mistake</div>
                    <div className="mt-1 text-xs">{b.performance.commonMistake}</div>
                  </div>
                </div>
              </section>
            )}

            {/* FLAG */}
            {b.flag && (
              <section className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5">
                <div className="flex items-center gap-2 text-amber-200"><AlertTriangle className="h-4 w-4" /> <span className="text-sm font-bold">Risk Flag</span></div>
                <p className="mt-2 text-xs text-amber-100">{b.flag}</p>
              </section>
            )}

            {/* IMPROVE */}
            <section className="glass rounded-2xl p-6">
              <h3 className="text-sm font-bold">Improve Your Score (For Brands)</h3>
              <ul className="mt-3 space-y-2 text-xs text-muted-foreground">
                <li>+ Get more verified trader reviews</li>
                <li>+ Upload proof documents (payouts, regulation)</li>
                <li>+ Improve transparency disclosures</li>
                <li>+ Resolve open complaints</li>
              </ul>
            </section>
          </div>
        </div>
      </main>

      {/* BREAKDOWN MODAL */}
      {showBreakdown && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur" onClick={() => setShowBreakdown(false)}>
          <div className="glass relative w-full max-w-2xl rounded-3xl p-6" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowBreakdown(false)} className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full bg-white/5 hover:bg-white/10">
              <X className="h-4 w-4" />
            </button>
            <h2 className="text-2xl font-bold">Score Breakdown</h2>
            <div className="mt-4 text-center">
              <div className="text-6xl font-bold">{b.score.toFixed(1)}<span className="text-xl text-muted-foreground">/{b.maxScore}</span></div>
              <div className="mt-1 text-xs text-muted-foreground">Final TBI Score</div>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-white/5 p-4">
                <div className="text-[11px] text-muted-foreground">Structural Score (40%)</div>
                <div className="mt-1 text-2xl font-bold text-violet-300">{structural.toFixed(1)}</div>
                <Progress value={structural * 10} className="mt-2" />
              </div>
              <div className="rounded-2xl bg-white/5 p-4">
                <div className="text-[11px] text-muted-foreground">Experience Score (60%)</div>
                <div className="mt-1 text-2xl font-bold text-fuchsia-300">{experience ? experience.toFixed(1) : "—"}</div>
                <Progress value={experience * 10} className="mt-2" />
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {[
                { k: "Identity & Regulation", v: b.breakdown.transparency, e: "Verified entity, jurisdiction, licensing." },
                { k: "Proof Strength", v: b.breakdown.proof, e: "On-chain payouts, audit trails, public disclosures." },
                { k: "Community Trust", v: b.breakdown.community, e: "Sentiment from verified traders." },
                { k: "Trading Conditions", v: b.breakdown.conditions, e: "Spreads, commissions, payout speed, rules." },
                { k: "Trader Experience", v: b.breakdown.experience ?? 0, e: "Real outcomes from RebateBoard users." },
              ].map((m) => (
                <div key={m.k} className="rounded-xl bg-white/5 p-3">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold">{m.k}</div>
                    <div className="text-sm">{m.v ? m.v.toFixed(1) : "Locked"}</div>
                  </div>
                  <div className="mt-0.5 text-[11px] text-muted-foreground">{m.e}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    <SiteFooter />
    </div>
  );
}
