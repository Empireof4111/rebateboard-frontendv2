import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { useMergedTbiBrands } from "@/lib/tbi-merge";
import { Shield, CheckCircle2, TrendingUp, Award, ArrowRight, Info } from "lucide-react";

export const Route = createFileRoute("/tbi/")({
  head: () => ({
    meta: [
      { title: "Trusted Brand Index (TBI) — RebateBoard" },
      { name: "description", content: "Discover the most trusted trading platforms ranked by verified trader data." },
    ],
  }),
  component: TBIPage,
});

function statusBadge(status: "full" | "partial" | "preliminary") {
  if (status === "full") return <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">★ Recommended</span>;
  if (status === "partial") return <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-300">⚠ Emerging</span>;
  return <span className="rounded-full bg-fuchsia-500/15 px-2 py-0.5 text-[10px] font-semibold text-fuchsia-300">● New</span>;
}

function TBIPage() {
  const merged = useMergedTbiBrands();
  const top10 = merged.slice(0, 10);


  return (
    <div className="min-h-screen bg-[#0b0418] text-foreground">
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 py-8">
        {/* HERO */}
        <section className="glass relative overflow-hidden rounded-3xl p-10">
          <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-fuchsia-500/20 blur-3xl" />
          <div className="absolute -left-10 bottom-0 h-60 w-60 rounded-full bg-violet-500/20 blur-3xl" />
          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-fuchsia-200">
              <Shield className="h-3.5 w-3.5" /> Trust Engine v2.0
            </div>
            <h1 className="mt-4 text-4xl font-bold leading-tight md:text-5xl">
              Trusted Brand Index <span className="bg-gradient-to-r from-fuchsia-400 to-violet-300 bg-clip-text text-transparent">(TBI)</span>
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-muted-foreground md:text-base">
              Discover the most trusted trading platforms based on real trader data — not paid rankings, not opinions, just verified evidence.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3 text-xs">
              <div className="glass-pill rounded-full px-3 py-1.5"><CheckCircle2 className="mr-1 inline h-3 w-3 text-emerald-400" /> Transparent Formula</div>
              <div className="glass-pill rounded-full px-3 py-1.5"><CheckCircle2 className="mr-1 inline h-3 w-3 text-emerald-400" /> No Paid Boosting</div>
              <div className="glass-pill rounded-full px-3 py-1.5"><CheckCircle2 className="mr-1 inline h-3 w-3 text-emerald-400" /> Verified Reviews Only</div>
            </div>
          </div>
        </section>

        {/* TOP 10 */}
        <section className="mt-8">
          <div className="mb-5 flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-bold">Top 10 Trusted Brands</h2>
              <p className="mt-1 text-sm text-muted-foreground">All brands ranked by score — Recommended, Emerging and New shown together.</p>
            </div>
            <Link to="/tbi/explore" className="hidden items-center gap-1 text-xs text-fuchsia-300 hover:text-fuchsia-200 sm:flex">
              Explore All Brands <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

            {top10.map((b, i) => (
              <Link
                key={b.slug}
                to="/tbi/brand/$slug"
                params={{ slug: b.slug }}
                className="glass group relative overflow-hidden rounded-2xl p-5 transition hover:border-fuchsia-400/40 hover:shadow-[0_0_30px_rgba(192,132,252,0.15)]"
              >
                <div className="absolute right-3 top-3 rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-muted-foreground">#{i + 1}</div>
                <div className="flex items-start gap-3">
                  <div className={`grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br ${b.logoColor} text-sm font-bold text-white shadow-lg`}>
                    {b.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate font-semibold">{b.name}</h3>
                      {statusBadge(b.status)}
                    </div>
                    <div className="text-xs text-muted-foreground">{b.category}</div>
                  </div>
                </div>
                <div className="mt-4 flex items-end justify-between">
                  <div>
                    <div className="text-3xl font-bold tracking-tight">{b.score.toFixed(1)}<span className="text-sm text-muted-foreground">/10</span></div>
                    <div className="text-[11px] text-muted-foreground">Confidence: <span className="text-emerald-300">{b.confidence}</span></div>
                  </div>
                  <div className="text-right text-[11px] text-muted-foreground">
                    {b.reviewCount} reviews<br />
                    <span className="text-emerald-300">{b.verifiedReviews} verified</span>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-1.5 rounded-lg bg-white/5 px-3 py-2 text-xs">
                  <Award className="h-3.5 w-3.5 text-amber-300" /> {b.tag}
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* WHY */}
        <section className="mt-10 grid gap-4 md:grid-cols-3">
          {[
            { icon: Shield, title: "Verified Trader Data", text: "Every score is backed by real, KYC-verified trader feedback and on-chain payout proofs." },
            { icon: TrendingUp, title: "Live Recalibration", text: "TBI updates every 24h as new reviews, payouts, and complaints flow in." },
            { icon: Info, title: "Open Formula", text: "TBI = 40% structural data + 60% trader experience. No hidden weighting." },
          ].map((c) => (
            <div key={c.title} className="glass rounded-2xl p-5">
              <c.icon className="h-5 w-5 text-fuchsia-300" />
              <div className="mt-2 font-semibold">{c.title}</div>
              <p className="mt-1 text-xs text-muted-foreground">{c.text}</p>
            </div>
          ))}
        </section>

        {/* CTA */}
        <section className="mt-10 glass flex flex-col items-center justify-between gap-4 rounded-3xl p-8 md:flex-row">
          <div>
            <h3 className="text-xl font-bold">Looking beyond the top 10?</h3>
            <p className="mt-1 text-sm text-muted-foreground">Browse hundreds of trust profiles across prop firms, brokers and exchanges.</p>
          </div>
          <Link to="/tbi/explore" className="rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-600 px-6 py-2.5 text-sm font-semibold shadow-[0_0_30px_rgba(192,132,252,0.4)]">
            Explore All Brands →
          </Link>
        </section>
      </main>
    <SiteFooter />
    </div>
  );
}
