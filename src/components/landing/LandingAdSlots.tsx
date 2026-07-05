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
import { fetchPublicAdverts } from "@/lib/public-adverts-api";
import { useI18n } from "@/lib/i18n";

function useActiveAd(placement: Parameters<typeof pickActiveAdFor>[0]) {
  const [ad, setAd] = useState<DashboardAd | null>(() => pickActiveAdFor(placement));

  useEffect(() => {
    let active = true;
    const refresh = () => setAd(pickActiveAdFor(placement));

    fetchPublicAdverts(placement).then((ads) => {
      if (!active) return;
      const liveAd = ads.find((item) => item.active) ?? null;
      setAd(liveAd ?? pickActiveAdFor(placement));
    });

    window.addEventListener("rb:dashboard-ads", refresh);
    return () => {
      active = false;
      window.removeEventListener("rb:dashboard-ads", refresh);
    };
  }, [placement]);

  useEffect(() => { if (ad) trackImpression(ad.id); }, [ad?.id]);
  return ad;
}

function slidesForAd(ad: DashboardAd | null, fallbackImage: string): AdSlide[] {
  const slides = (ad?.slides ?? []).map(hydrateSlide);
  if (!ad) return [];

  const primarySlide =
    ad.image || (!slides.length && (ad.headline || ad.name))
      ? {
          label: ad.headline || ad.name,
          sub: ad.sub,
          href: ad.href || "/blog",
          image: ad.image || fallbackImage,
          accent: ad.accent,
        }
      : null;

  return [primarySlide, ...slides].filter((slide): slide is AdSlide => Boolean(slide));
}

/** 4-slide rotating hero card on the landing page. */
export function LandingHeroAdCard({
  fallbackImage,
  className = "",
}: {
  fallbackImage: string;
  className?: string;
}) {
  const ad = useActiveAd("landing-hero");
  const slides = slidesForAd(ad, fallbackImage);
  const [i, setI] = useState(0);

  useEffect(() => {
    if (slides.length < 2) return;
    const t = setInterval(() => setI((x) => (x + 1) % slides.length), 5000);
    return () => clearInterval(t);
  }, [slides.length]);

  useEffect(() => {
    if (i >= slides.length) setI(0);
  }, [i, slides.length]);

  const current = slides[i] ?? slides[0];
  const image = current?.image || fallbackImage;

  return (
    <div
      className={`glass-strong relative min-h-[18rem] overflow-hidden rounded-[2rem] sm:min-h-[20rem] ${className}`}
    >
      <img
        src={image}
        alt={current?.label ?? "Featured"}
        className="absolute inset-0 h-full w-full object-cover"
        width={1024}
        height={640}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#10051f]/92 via-[#10051f]/10 to-black/10" />
      <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
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
  const { t } = useI18n();
  const ad = useActiveAd("landing-sponsors");
  const sponsors: SponsorLogo[] = ad?.sponsors?.length ? ad.sponsors : fallback;

  return (
    <div className="mt-4">
      <div className="eyebrow mb-3">{t("hero.sponsoredPartners")}</div>
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
