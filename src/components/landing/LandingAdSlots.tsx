/**
 * Landing-page ad slots powered by the superadmin "Dashboard Ads" manager.
 * Each slot resolves the highest-priority active ad for its placement and
 * gracefully renders nothing (or a fallback) when no ad is configured.
 */
import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, TrendingUp, ArrowRight } from "lucide-react";
import {
  pickActiveAdFor,
  hydrateSlide,
  trackClick,
  trackImpression,
  type DashboardAd,
  type AdSlide,
  type SponsorLogo,
} from "@/lib/dashboard-ads";

function useActiveAd(placement: Parameters<typeof pickActiveAdFor>[0]) {
  const [ad, setAd] = useState<DashboardAd | null>(() => pickActiveAdFor(placement));
  useEffect(() => {
    const refresh = () => setAd(pickActiveAdFor(placement));
    window.addEventListener("rb:dashboard-ads", refresh);
    return () => window.removeEventListener("rb:dashboard-ads", refresh);
  }, [placement]);
  useEffect(() => { if (ad) trackImpression(ad.id); }, [ad?.id]);
  return ad;
}

/** 4-slide rotating hero card on the landing page. */
export function LandingHeroAdCard({ fallbackImage }: { fallbackImage: string }) {
  const ad = useActiveAd("landing-hero");
  const slides: AdSlide[] = (ad?.slides ?? []).map(hydrateSlide);
  const [i, setI] = useState(0);

  useEffect(() => {
    if (slides.length < 2) return;
    const t = setInterval(() => setI((x) => (x + 1) % slides.length), 5000);
    return () => clearInterval(t);
  }, [slides.length]);

  const current = slides[i];
  const image = current?.image || fallbackImage;

  return (
    <div className="glass-strong relative overflow-hidden rounded-3xl">
      <img src={image} alt={current?.label ?? "Featured"} className="h-64 w-full object-cover sm:h-80" width={1024} height={768} />
      <div className="absolute inset-x-0 bottom-0 p-5">
        <Link
          to={current?.href ?? "/blog"}
          onClick={() => ad && trackClick(ad.id)}
          className="glass block rounded-2xl p-4 transition hover:bg-white/[0.07]"
        >
          <p className="line-clamp-2 text-sm font-semibold text-white">{current?.label ?? "Featured story"}</p>
          {current?.sub && <p className="mt-1 line-clamp-2 text-[11px] text-muted-foreground">{current.sub}</p>}
          <div className="mt-3 flex items-center gap-2 text-[10px] text-muted-foreground">
            <TrendingUp className="h-3 w-3" /> rebateboard.com
            <span className="ml-auto">{slides.length ? `${i + 1}/${slides.length}` : ""}</span>
          </div>
        </Link>
      </div>
      {slides.length > 1 && (
        <>
          <button
            aria-label="Previous slide"
            onClick={() => setI((x) => (x - 1 + slides.length) % slides.length)}
            className="absolute left-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full bg-black/40 text-white backdrop-blur hover:bg-black/60"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            aria-label="Next slide"
            onClick={() => setI((x) => (x + 1) % slides.length)}
            className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full bg-black/40 text-white backdrop-blur hover:bg-black/60"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5">
            {slides.map((_, j) => (
              <span key={j} className={`h-1 rounded-full transition-all ${j === i ? "w-6 bg-white" : "w-1.5 bg-white/40"}`} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/** Sponsored partners logo strip under the hero headline. */
export function LandingSponsorsStrip({ fallback }: { fallback: SponsorLogo[] }) {
  const ad = useActiveAd("landing-sponsors");
  const sponsors: SponsorLogo[] = ad?.sponsors?.length ? ad.sponsors : fallback;

  return (
    <div className="mt-8">
      <div className="eyebrow mb-3">Sponsored partners</div>
      <div className="flex flex-wrap gap-3">
        {sponsors.map((b) => {
          const tagBadge =
            b.tag === "featured"
              ? "bg-amber-500/80 text-black"
              : b.tag === "ad"
              ? "bg-fuchsia-500/80 text-white"
              : "bg-white/15 text-white";
          const inner = (
            <div
              className={`relative grid h-14 w-14 place-items-center overflow-hidden rounded-md bg-gradient-to-br ${b.color ?? "from-violet-500 to-fuchsia-600"} text-[10px] font-semibold text-white/90 shadow-lg ring-1 ring-white/20`}
              title={`${b.name} — ${b.tag ?? "Sponsored"}`}
            >
              <span className="opacity-90">{b.initial ?? b.name.slice(0, 2)}</span>
              {b.tag && (
                <span className={`absolute -top-1 -right-1 rounded-full px-1.5 py-0.5 text-[7px] font-bold uppercase tracking-wider ${tagBadge}`}>
                  {b.tag === "featured" ? "★" : b.tag === "ad" ? "Ad" : "Sp"}
                </span>
              )}
            </div>
          );
          return b.href ? (
            <Link key={b.id} to={b.href} onClick={() => ad && trackClick(ad.id)}>{inner}</Link>
          ) : (
            <div key={b.id}>{inner}</div>
          );
        })}
      </div>
    </div>
  );
}

/** "Advertise Here" promo box near the cashback calculator. */
export function LandingAdvertiseBox() {
  const ad = useActiveAd("landing-advertise");
  const headline = ad?.headline ?? "Advertise Here";
  const sub = ad?.sub ?? "Reach thousands of active traders and investors. Premium placements convert.";
  const cta = ad?.cta ?? "Get Started";
  const href = ad?.href ?? "/business/join";

  return (
    <div className="glass rounded-3xl p-6">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-lg font-semibold">{headline}</h3>
        <span className="glass-pill rounded-full px-2 py-0.5 text-[10px]">Sponsored</span>
      </div>
      <p className="text-xs text-muted-foreground">{sub}</p>
      <Link
        to={href}
        onClick={() => ad && trackClick(ad.id)}
        className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-600 px-4 py-1.5 text-xs font-semibold text-white"
      >
        {cta} <ArrowRight className="h-3 w-3" />
      </Link>
    </div>
  );
}
