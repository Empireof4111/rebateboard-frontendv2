/**
 * Landing-page ad slots powered by the superadmin "Dashboard Ads" manager.
 * Each slot resolves the highest-priority active ad for its placement and
 * gracefully renders nothing (or a fallback) when no ad is configured.
 */
import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, TrendingUp, ArrowRight } from "lucide-react";
import {
  hydrateSlide,
  type DashboardAd,
  type AdSlide,
  type SponsorLogo,
  type AdPlacement,
} from "@/lib/dashboard-ads";
import {
  fetchPublicAdverts,
  trackPublicAdvertClick,
  trackPublicAdvertImpression,
} from "@/lib/public-adverts-api";
import { useI18n } from "@/lib/i18n";

type HeroSlide = AdSlide & {
  ad: DashboardAd;
};

function hasPublicCopy(value: unknown) {
  const text = String(value ?? "").trim();
  return Boolean(text && text !== "Untitled banner" && text !== "Draft banner");
}

function isRenderableForPlacement(ad: DashboardAd, placement: AdPlacement) {
  if (!ad.active || ad.placement !== placement) return false;
  if (placement === "landing-sponsors") return Boolean(ad.sponsors?.length);
  if (placement === "landing-advertise") {
    return Boolean(ad.image || hasPublicCopy(ad.headline) || hasPublicCopy(ad.sub));
  }
  if (placement === "landing-hero") {
    return Boolean(
      ad.image ||
        hasPublicCopy(ad.headline) ||
        ad.slides?.some((slide) => hasPublicCopy(slide.label) || Boolean(slide.image)),
    );
  }
  return true;
}

function usePlacementAds(placement: AdPlacement) {
  const [ads, setAds] = useState<DashboardAd[]>([]);

  useEffect(() => {
    let active = true;
    const refresh = () => {
      fetchPublicAdverts(placement).then((ads) => {
        if (!active) return;
        setAds(
          ads
            .filter((item) => isRenderableForPlacement(item, placement))
            .sort((a, b) => Number(b.priority ?? 0) - Number(a.priority ?? 0)),
        );
      });
    };

    refresh();
    window.addEventListener("rb:dashboard-ads", refresh);
    return () => {
      active = false;
      window.removeEventListener("rb:dashboard-ads", refresh);
    };
  }, [placement]);

  return ads;
}

function useActiveAd(placement: AdPlacement) {
  const ads = usePlacementAds(placement);
  const ad = ads[0] ?? null;

  useEffect(() => {
    if (!ad) return;
    void trackPublicAdvertImpression(ad.id);
  }, [ad?.id]);

  return ad;
}

function trackAdClick(ad: DashboardAd | null) {
  if (!ad) return;
  void trackPublicAdvertClick(ad.id);
}

function heroSlideTag(slide: HeroSlide) {
  if (slide.source === "blog") return "Editorial";
  if (slide.ad.format === "single") return "Ad";
  if (slide.ad.format === "carousel") return "Featured";
  if (slide.ad.format === "trending") return "Trending";
  return "Sponsored";
}

function heroSlideLabel(slide: HeroSlide) {
  if (hasPublicCopy(slide.label)) return slide.label;
  if (hasPublicCopy(slide.ad.cta)) return slide.ad.cta!;
  return "Sponsored campaign";
}

function slidesForAds(ads: DashboardAd[], fallbackImage: string): HeroSlide[] {
  const slides = ads.flatMap((ad) => {
    const hydratedSlides: HeroSlide[] = (ad.slides ?? [])
      .map(hydrateSlide)
      .filter((slide) => hasPublicCopy(slide.label) || Boolean(slide.image))
      .map((slide) => ({
        ...slide,
        image: slide.image || fallbackImage,
        ad,
      }));

    const primarySlide: HeroSlide | null =
      ad.image || hasPublicCopy(ad.headline) || hasPublicCopy(ad.sub)
        ? {
            label: hasPublicCopy(ad.headline) ? ad.headline! : "Sponsored campaign",
            sub: ad.sub,
            href: ad.href || "/blog",
            image: ad.image || fallbackImage,
            accent: ad.accent,
            ad,
          }
        : null;

    return [primarySlide, ...hydratedSlides].filter((slide): slide is HeroSlide => Boolean(slide));
  });

  return slides.slice(0, 4);
}

/** 4-slide rotating hero card on the landing page. */
export function LandingHeroAdCard({
  fallbackImage,
  className = "",
}: {
  fallbackImage: string;
  className?: string;
}) {
  const ads = usePlacementAds("landing-hero");
  const slides = slidesForAds(ads, fallbackImage);
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
  const hasCampaign = Boolean(current);
  const label = current ? heroSlideLabel(current) : "";
  const tag = current ? heroSlideTag(current) : "";

  useEffect(() => {
    if (!current?.ad) return;
    void trackPublicAdvertImpression(current.ad.id);
  }, [current?.ad?.id]);

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
      {hasCampaign && (
        <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
          <Link
            to={current.href}
            onClick={() => trackAdClick(current.ad)}
            className="glass block rounded-2xl p-4 transition hover:bg-white/[0.07]"
          >
            <div className="mb-2 inline-flex rounded-full bg-white/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.16em] text-fuchsia-100 ring-1 ring-white/15">
              {tag}
            </div>
            <p className="line-clamp-2 text-sm font-semibold text-white">{label}</p>
            {current.sub && <p className="mt-1 line-clamp-2 text-[11px] text-muted-foreground">{current.sub}</p>}
            <div className="mt-3 flex items-center gap-2 text-[10px] text-muted-foreground">
              <TrendingUp className="h-3 w-3" /> rebateboard.com
              <span className="ml-auto">{slides.length ? `${i + 1}/${slides.length}` : ""}</span>
            </div>
          </Link>
        </div>
      )}
      {!hasCampaign && (
        <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
          <div className="glass rounded-2xl p-4">
            <p className="text-sm font-semibold text-white">Featured placement ready</p>
            <p className="mt-1 text-[11px] text-muted-foreground">Campaigns added in Superadmin Ads will appear here.</p>
          </div>
        </div>
      )}
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
export function LandingSponsorsStrip() {
  const { t } = useI18n();
  const ad = useActiveAd("landing-sponsors");
  const sponsors: SponsorLogo[] = ad?.sponsors ?? [];

  if (sponsors.length === 0) return null;

  return (
    <div className="mt-4 flex w-full items-center gap-2 overflow-x-auto no-scrollbar">
      <div className="eyebrow shrink-0">{t("hero.sponsoredPartners")}</div>
      <div className="flex shrink-0 items-center gap-2">
        {sponsors.map((b) => {
          const inner = (
            <div
              className={`relative grid h-11 w-11 place-items-center overflow-hidden rounded-md ${b.logo ? "bg-white/[0.06]" : `bg-gradient-to-br ${b.color ?? "from-violet-500 to-fuchsia-600"}`} text-[10px] font-semibold text-white/90 shadow-lg ring-1 ring-white/20`}
              title={b.name}
            >
              {b.logo ? (
                <img
                  src={b.logo}
                  alt={b.name}
                  className="h-8 w-8 rounded-sm object-contain"
                  loading="lazy"
                />
              ) : (
                <span className="opacity-90">{b.initial ?? b.name.slice(0, 2)}</span>
              )}
            </div>
          );
          return b.href ? (
            <Link key={b.id} to={b.href} onClick={() => trackAdClick(ad)}>{inner}</Link>
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
  if (!ad) return null;

  const headline = ad.headline ?? ad.name;
  const sub = ad.sub ?? "";
  const cta = ad.cta ?? "Learn more";
  const href = ad.href ?? "/business/join";

  if (ad.image) {
    return (
      <Link
        to={href}
        onClick={() => trackAdClick(ad)}
        aria-label={headline || "Sponsored advert"}
        className="block overflow-hidden rounded-3xl transition-opacity hover:opacity-95"
      >
        <img
          src={ad.image}
          alt={headline || "Sponsored advert"}
          className="block max-h-56 w-full object-contain"
          loading="lazy"
        />
      </Link>
    );
  }

  return (
    <div className="glass rounded-3xl p-6">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-lg font-semibold">{headline}</h3>
        <span className="glass-pill rounded-full px-2 py-0.5 text-[10px]">Sponsored</span>
      </div>
      <p className="text-xs text-muted-foreground">{sub}</p>
      <Link
        to={href}
        onClick={() => trackAdClick(ad)}
        className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-600 px-4 py-1.5 text-xs font-semibold text-white"
      >
        {cta} <ArrowRight className="h-3 w-3" />
      </Link>
    </div>
  );
}
