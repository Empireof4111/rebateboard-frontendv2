import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import {
  fetchTbiTop,
  tbiProfileLogo,
  type TbiProfile,
  tbiConfidenceTone,
  tbiLabelTone,
  tbiScore100,
  tbiStateTone,
} from "@/lib/tbi-api";
import { AlertTriangle, ArrowRight, CheckCircle2, Crown, Info, Medal, Shield, Trophy } from "lucide-react";

export const Route = createFileRoute("/tbi/")({
  head: () => ({
    meta: [
      { title: "Trusted Brand Index (TBI) - RebateBoard" },
      {
        name: "description",
        content:
          "Explore RebateBoard's Trusted Brand Index and see which fully qualified brands have earned public trust ranking.",
      },
    ],
  }),
  component: TBIPage,
});

function rankTheme(rank: number) {
  if (rank === 1) {
    return {
      Icon: Crown,
      label: "#1",
      badge: "border-[#f6d77a]/35 bg-[#f6d77a]/15 text-[#ffe8a3] shadow-[0_0_22px_rgba(246,215,122,0.18)]",
      card: "border-[#f6d77a]/30 shadow-[0_0_34px_rgba(246,215,122,0.11)]",
      glow: "shadow-[0_0_28px_rgba(246,215,122,0.25)] ring-[#f6d77a]/35",
    };
  }
  if (rank === 2) {
    return {
      Icon: Medal,
      label: "#2",
      badge: "border-white/28 bg-white/12 text-white shadow-[0_0_20px_rgba(255,255,255,0.12)]",
      card: "border-white/20 shadow-[0_0_30px_rgba(255,255,255,0.08)]",
      glow: "shadow-[0_0_24px_rgba(226,232,240,0.18)] ring-white/28",
    };
  }
  if (rank === 3) {
    return {
      Icon: Trophy,
      label: "#3",
      badge: "border-[#d7a06a]/35 bg-[#d7a06a]/14 text-[#ffd1a3] shadow-[0_0_20px_rgba(215,160,106,0.15)]",
      card: "border-[#d7a06a]/24 shadow-[0_0_28px_rgba(215,160,106,0.09)]",
      glow: "shadow-[0_0_24px_rgba(215,160,106,0.18)] ring-[#d7a06a]/30",
    };
  }
  if (rank <= 5) {
    return {
      Icon: Trophy,
      label: `#${rank}`,
      badge: "border-fuchsia-300/25 bg-fuchsia-300/12 text-fuchsia-100 shadow-[0_0_18px_rgba(217,70,239,0.13)]",
      card: "border-fuchsia-300/18 shadow-[0_0_26px_rgba(217,70,239,0.08)]",
      glow: "shadow-[0_0_22px_rgba(217,70,239,0.18)] ring-fuchsia-300/24",
    };
  }
  return {
    Icon: null,
    label: `#${rank}`,
    badge: "border-white/10 bg-white/5 text-muted-foreground",
    card: "border-white/10",
    glow: "ring-white/10",
  };
}

function RankBadge({ rank }: { rank: number }) {
  const theme = rankTheme(rank);
  const Icon = theme.Icon;
  return (
    <div className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-black ${theme.badge}`}>
      {Icon ? <Icon className="h-3 w-3" strokeWidth={2.4} /> : null}
      {theme.label}
    </div>
  );
}

function BrandAvatar({ brand, rank }: { brand: TbiProfile; rank?: number }) {
  const [failed, setFailed] = useState(false);
  const logo = tbiProfileLogo(brand);
  const glow = rank && rank <= 5 ? rankTheme(rank).glow : "ring-white/10";
  useEffect(() => setFailed(false), [logo]);
  if (logo && !failed) {
    return (
      <img
        src={logo}
        alt={brand.name}
        className={`h-12 w-12 rounded-2xl bg-white/[0.04] object-contain p-1 ring-1 ${glow}`}
        onError={() => setFailed(true)}
        loading="lazy"
      />
    );
  }
  return (
    <div className={`grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-fuchsia-500 to-violet-600 text-sm font-bold text-white ring-1 ${glow}`}>
      {brand.name.slice(0, 2).toUpperCase()}
    </div>
  );
}

function SkeletonLine({ className = "" }: { className?: string }) {
  return <div className={`skeleton rounded-full ${className}`} />;
}

function RankingSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-label="Loading fully unlocked rankings">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="skeleton-card rounded-3xl p-5">
          <div className="flex items-start gap-3">
            <div className="skeleton h-12 w-12 rounded-2xl" />
            <div className="min-w-0 flex-1 space-y-2">
              <SkeletonLine className="h-4 w-2/3" />
              <SkeletonLine className="h-3 w-1/2" />
            </div>
            <SkeletonLine className="h-5 w-8" />
          </div>
          <div className="mt-6 space-y-2">
            <SkeletonLine className="h-10 w-28" />
            <SkeletonLine className="h-3 w-24" />
          </div>
          <div className="mt-5 rounded-2xl bg-white/5 p-3">
            <SkeletonLine className="h-3 w-24" />
            <div className="mt-3 flex gap-2">
              <SkeletonLine className="h-6 w-14" />
              <SkeletonLine className="h-6 w-14" />
              <SkeletonLine className="h-6 w-20" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function TBIPage() {
  const [brands, setBrands] = useState<TbiProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchTbiTop()
      .then((payload) => {
        if (!active) return;
        setBrands(payload);
        setError(null);
      })
      .catch((err: Error) => {
        if (!active) return;
        setError(err.message || "Unable to load TBI rankings.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#0b0418] text-foreground">
      <SiteHeader />
      <main className="container-app py-6 sm:py-8">
        <section className="glass relative overflow-hidden rounded-3xl p-8 md:p-10">
          <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-fuchsia-500/20 blur-3xl" />
          <div className="absolute -left-10 bottom-0 h-60 w-60 rounded-full bg-violet-500/20 blur-3xl" />
          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-fuchsia-200">
              <Shield className="h-3.5 w-3.5" /> Trust Engine v2.0
            </div>
            <h1 className="mt-4 text-4xl font-bold leading-tight md:text-5xl">
              Trusted Brand Index <span className="bg-gradient-to-r from-fuchsia-400 to-violet-300 bg-clip-text text-transparent">(TBI)</span>
            </h1>
            <p className="mt-3 max-w-3xl text-sm text-muted-foreground md:text-base">
              TBI is RebateBoard&apos;s trust infrastructure layer. It combines weighted trader experience,
              payout reliability, transparency, regulation, trading conditions, and customer experience into
              a public trust profile.
            </p>
            <div className="mt-6 grid gap-3 text-xs md:grid-cols-3">
              <div className="glass-pill rounded-2xl px-4 py-3">
                <CheckCircle2 className="mr-1 inline h-3.5 w-3.5 text-emerald-400" /> Only fully unlocked profiles are ranked here
              </div>
              <div className="glass-pill rounded-2xl px-4 py-3">
                <Info className="mr-1 inline h-3.5 w-3.5 text-fuchsia-300" /> Confidence adjustment prevents low-data manipulation
              </div>
              <div className="glass-pill rounded-2xl px-4 py-3">
                <AlertTriangle className="mr-1 inline h-3.5 w-3.5 text-rose-300" /> Risk penalties surface payout and complaint pressure
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          <div className="glass rounded-3xl p-6">
            <h2 className="text-2xl font-bold">How public trust works</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl bg-white/5 p-4">
                <div className="text-sm font-semibold text-white">Preliminary Profile</div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Structural score only. No recommendation, no ranking, and no trust label.
                </p>
              </div>
              <div className="rounded-2xl bg-white/5 p-4">
                <div className="text-sm font-semibold text-white">Partial TBI</div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Some trader experience is available, but confidence is still limited.
                </p>
              </div>
              <div className="rounded-2xl bg-white/5 p-4">
                <div className="text-sm font-semibold text-white">Full TBI</div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Enough verified trader history to unlock rankings and public trust comparison.
                </p>
              </div>
            </div>
          </div>

          <div className="glass rounded-3xl p-6">
            <h2 className="text-lg font-bold">Why only some brands appear here</h2>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li>Brands must have enough verified trader reviews.</li>
              <li>Confidence must be strong enough to avoid low-data distortion.</li>
              <li>Risk penalties can reduce visibility if trust conditions deteriorate.</li>
              <li>Preliminary and partial profiles are still visible on Explore, not in ranked top 10.</li>
            </ul>
          </div>
        </section>

        <section className="mt-10">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold">Top 10 Fully Unlocked Brands</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Only full TBI profiles with enough verified data are eligible for this public ranking.
              </p>
            </div>
            <Link to="/tbi/explore" className="hidden items-center gap-1 text-xs text-fuchsia-300 hover:text-fuchsia-200 sm:flex">
              Explore all trust profiles <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {loading ? (
            <RankingSkeleton />
          ) : error ? (
            <div className="rounded-3xl border border-rose-500/30 bg-rose-500/10 p-6 text-sm text-rose-200">{error}</div>
          ) : !brands.length ? (
            <div className="glass rounded-3xl p-8 text-sm text-muted-foreground">
              No brands currently meet full-unlock ranking requirements.
              <div className="mt-2 text-xs">
                Brands need Full Unlock status, enough verified data, sufficient confidence, and public ranking eligibility before they appear here.
              </div>
            </div>
          ) : brands.length === 1 ? (
            <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
              <div className="glass rounded-3xl p-6">
                <div className="text-sm font-semibold text-white">One brand currently meets full ranking eligibility.</div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Fully Unlocked Rankings only include brands with enough verified reviews, confidence, active public visibility, and no critical unresolved trust flags.
                </p>
                <Link to="/tbi/explore" className="mt-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-white hover:bg-white/15">
                  Explore all TBI profiles <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
              {brands.map((brand, index) => (
                <Link
                  key={brand.id}
                  to="/tbi/brand/$slug"
                  params={{ slug: brand.slug }}
                  className={`glass ranking-card-enter group relative overflow-hidden rounded-3xl p-6 transition hover:border-fuchsia-400/40 hover:shadow-[0_0_30px_rgba(192,132,252,0.15)] ${rankTheme(index + 1).card}`}
                  style={{ animationDelay: `${Math.min(index, 9) * 45}ms` }}
                >
                  <div className="absolute right-5 top-5">
                    <RankBadge rank={index + 1} />
                  </div>
                  <div className="flex items-start gap-4">
                    <BrandAvatar brand={brand} rank={index + 1} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate text-xl font-semibold">{brand.name}</h3>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${tbiStateTone("full")}`}>
                          Full Unlock
                        </span>
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {brand.fullCategory} {brand.region ? `- ${brand.region}` : ""}
                      </div>
                    </div>
                  </div>
                  <div className="mt-6">
                    <div className="text-5xl font-bold">
                      {tbiScore100(brand)}
                      <span className="text-base text-muted-foreground"> / 100</span>
                    </div>
                    <div className={`mt-1 text-sm font-semibold ${tbiLabelTone(brand.trustLabel)}`}>{brand.trustLabel}</div>
                  </div>
                  <div className="mt-5 flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <span className={tbiConfidenceTone(brand.confidence)}>{brand.confidence} confidence</span>
                    <span>{brand.reviewCount} reviews</span>
                    <span>{brand.verifiedReviewCount} verified</span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {brands.map((brand, index) => (
                <Link
                  key={brand.id}
                  to="/tbi/brand/$slug"
                  params={{ slug: brand.slug }}
                  className={`glass ranking-card-enter group relative overflow-hidden rounded-3xl p-5 transition hover:border-fuchsia-400/40 hover:shadow-[0_0_30px_rgba(192,132,252,0.15)] ${rankTheme(index + 1).card}`}
                  style={{ animationDelay: `${Math.min(index, 9) * 45}ms` }}
                >
                  <div className="absolute right-4 top-4">
                    <RankBadge rank={index + 1} />
                  </div>
                  <div className="flex items-start gap-3">
                    <BrandAvatar brand={brand} rank={index + 1} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate font-semibold">{brand.name}</h3>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${tbiStateTone("full")}`}>
                          Full Verified
                        </span>
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {brand.fullCategory} {brand.region ? `- ${brand.region}` : ""}
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 flex items-end justify-between">
                    <div>
                      <div className="text-3xl font-bold">
                        {tbiScore100(brand)}
                        <span className="text-sm text-muted-foreground"> / 100</span>
                      </div>
                      <div className={`text-[11px] ${tbiLabelTone(brand.trustLabel)}`}>{brand.trustLabel}</div>
                    </div>
                    <div className="text-right text-[11px] text-muted-foreground">
                      {brand.reviewCount} reviews
                      <br />
                      <span className={tbiConfidenceTone(brand.confidence)}>{brand.confidence} confidence</span>
                    </div>
                  </div>

                  <div className="mt-4 rounded-2xl bg-white/5 p-3 text-xs text-muted-foreground">
                    <div className="font-semibold text-white">Quick insights</div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className="rounded-full bg-white/5 px-2 py-1">UT {brand.components.ut.toFixed(1)}</span>
                      <span className="rounded-full bg-white/5 px-2 py-1">PR {brand.components.pr.toFixed(1)}</span>
                      <span className="rounded-full bg-white/5 px-2 py-1">Penalty {brand.riskPenalty.toFixed(1)}</span>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between text-xs text-fuchsia-300">
                    <span>View Profile</span>
                    <span>View Breakdown</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
