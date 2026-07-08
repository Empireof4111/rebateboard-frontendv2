import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Sparkles, Megaphone, ArrowRight } from "lucide-react";
import {
  type DashboardAd,
  type AdSlide,
} from "@/lib/dashboard-ads";
import { fetchPublicAdminBrands, type AdminBrandRecord } from "@/lib/admin-brands-api";
import {
  fetchPublicAdverts,
  trackPublicAdvertClick,
  trackPublicAdvertImpression,
} from "@/lib/public-adverts-api";

/**
 * Top-of-dashboard ad banner. Renders the highest-priority active ad picked
 * from the superadmin "Dashboard Ads" manager. Re-resolves whenever the route
 * changes so opening a new sidebar page can rotate to a fresh banner.
 */
export function DashboardAdBanner({ pathname }: { pathname: string }) {
  const [ad, setAd] = useState<DashboardAd | null>(null);
  const impressedFor = useRef<string | null>(null);

  // re-pick on route change so every page can show the freshest banner
  useEffect(() => {
    let active = true;

    fetchPublicAdverts("dashboard").then((ads) => {
      if (!active) return;
      setAd(ads.find(isRenderableDashboardAd) ?? null);
    });

    return () => {
      active = false;
    };
  }, [pathname]);

  // listen for live admin updates
  useEffect(() => {
    let active = true;
    const resolveAd = () => {
      fetchPublicAdverts("dashboard").then((ads) => {
        if (!active) return;
        setAd(ads.find(isRenderableDashboardAd) ?? null);
      });
    };
    const onChange = () => resolveAd();

    resolveAd();
    window.addEventListener("rb:dashboard-ads", onChange);
    return () => {
      active = false;
      window.removeEventListener("rb:dashboard-ads", onChange);
    };
  }, []);

  // record impression once per ad id per mount cycle
  useEffect(() => {
    if (!ad) return;
    if (impressedFor.current === ad.id) return;
    impressedFor.current = ad.id;
    void trackPublicAdvertImpression(ad.id);
  }, [ad]);

  if (!ad) return null;

  const onClick = () => {
    void trackPublicAdvertClick(ad.id);
  };

  return (
    <div className="mb-4 animate-fade-in">
      <AdRenderer ad={ad} onClick={onClick} />
    </div>
  );
}

function AdRenderer({ ad, onClick }: { ad: DashboardAd; onClick: () => void }) {
  if (ad.format === "marquee") return <Marquee ad={ad} onClick={onClick} />;
  if (ad.format === "single") return <Single ad={ad} onClick={onClick} />;
  if (ad.format === "carousel") return <Carousel ad={ad} onClick={onClick} />;
  return <Trending ad={ad} onClick={onClick} />;
}

function hasPublicCopy(value: unknown) {
  const text = String(value ?? "").trim();
  return Boolean(text && text !== "Untitled banner" && text !== "Draft banner");
}

function isRenderableDashboardAd(ad: DashboardAd) {
  if (!ad.active) return false;
  if (ad.format === "marquee") return hasPublicCopy(ad.headline);
  if (ad.format === "single") return Boolean(ad.image || hasPublicCopy(ad.headline));
  if (ad.format === "carousel") return Boolean(ad.slides?.length);
  return true;
}

function Shell({
  children,
  accent,
}: {
  children: React.ReactNode;
  accent?: string;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-r ${accent ?? "from-fuchsia-500/20 to-violet-600/20"} backdrop-blur-xl`}
    >
      <div className="absolute inset-0 bg-[#150829]/40" />
      <div className="relative">{children}</div>
    </div>
  );
}

function Marquee({ ad, onClick }: { ad: DashboardAd; onClick: () => void }) {
  return (
    <Shell accent={ad.accent}>
      <Link
        to={ad.href ?? "/dashboard"}
        onClick={onClick}
        className="flex items-center gap-3 px-4 py-2 text-xs font-medium text-white"
      >
        <Megaphone className="h-3.5 w-3.5 shrink-0 text-fuchsia-200" />
        <div className="relative flex-1 overflow-hidden">
          <div className="flex animate-[marquee_28s_linear_infinite] whitespace-nowrap">
            <span className="pr-12">{ad.headline}</span>
            <span className="pr-12">{ad.headline}</span>
          </div>
        </div>
        <ArrowRight className="h-3.5 w-3.5 shrink-0 text-white/70" />
      </Link>
      <style>{`@keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }`}</style>
    </Shell>
  );
}

function Single({ ad, onClick }: { ad: DashboardAd; onClick: () => void }) {
  const image = ad.image;

  if (image) {
    return (
      <Link
        to={ad.href ?? "/dashboard"}
        onClick={onClick}
        aria-label="Advertisement"
        className="block overflow-hidden rounded-2xl transition-opacity hover:opacity-95"
      >
        <img
          src={image}
          alt=""
          className="block max-h-36 w-full object-contain"
          loading="lazy"
        />
      </Link>
    );
  }

  return (
    <Shell accent={ad.accent}>
      <div className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:gap-4 sm:px-5 sm:py-3.5">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/15">
          <Sparkles className="h-5 w-5 text-fuchsia-100" />
        </div>
        <div className="flex-1">
          <div className="text-sm font-semibold text-white">{ad.headline}</div>
          {ad.sub && <div className="text-xs text-white/80">{ad.sub}</div>}
        </div>
        <Link
          to={ad.href ?? "/dashboard"}
          onClick={onClick}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold text-white ring-1 ring-white/20 transition hover:bg-white/25"
        >
          {ad.cta ?? "Learn more"} <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </Shell>
  );
}

function Carousel({ ad, onClick }: { ad: DashboardAd; onClick: () => void }) {
  const slides = ad.slides ?? [];
  if (slides.length === 0) return null;

  return (
    <div className="group overflow-hidden py-1">
      <div className="flex w-max items-center gap-2 overflow-x-auto scrollbar-none motion-safe:animate-[dashboard-brand-drift_18s_ease-in-out_infinite_alternate] group-hover:[animation-play-state:paused]">
      {slides.map((s, i) => (
        <SlideChip key={i} slide={s} badge="Featured" onClick={onClick} />
      ))}
      </div>
      <style>{`@keyframes dashboard-brand-drift { from { transform: translateX(0); } to { transform: translateX(-18px); } }`}</style>
    </div>
  );
}

function Trending({ ad, onClick }: { ad: DashboardAd; onClick: () => void }) {
  const [liveSlides, setLiveSlides] = useState<AdSlide[]>([]);

  useEffect(() => {
    let active = true;
    fetchPublicAdminBrands().then((brands) => {
      if (!active) return;
      setLiveSlides(trendingSlidesFromBrands(brands, ad.trendingLimit ?? 5));
    });
    return () => {
      active = false;
    };
  }, [ad.trendingLimit]);

  return (
    <div className="group overflow-hidden py-1">
      <div className="flex w-max items-center gap-2 overflow-x-auto scrollbar-none motion-safe:animate-[dashboard-brand-drift_18s_ease-in-out_infinite_alternate] group-hover:[animation-play-state:paused]">
      {liveSlides.length > 0 ? (
        liveSlides.map((s, i) => (
          <SlideChip key={i} slide={s} badge="Recommended" onClick={onClick} />
        ))
      ) : (
        <span className="rounded-full bg-white/10 px-3 py-1.5 text-xs text-white/70 ring-1 ring-white/15">
          Published brand data will appear here
        </span>
      )}
      </div>
      <style>{`@keyframes dashboard-brand-drift { from { transform: translateX(0); } to { transform: translateX(-18px); } }`}</style>
    </div>
  );
}

function categoryAccent(brand: AdminBrandRecord) {
  const category = String(brand.category ?? "");
  if (category.includes("Crypto")) return "from-cyan-400 to-blue-600";
  if (category.includes("Broker")) return "from-emerald-400 to-teal-600";
  if (category.includes("Tool") || category.includes("Software")) return "from-violet-500 to-fuchsia-600";
  return "from-fuchsia-500 to-violet-600";
}

function trendingSlidesFromBrands(brands: AdminBrandRecord[], limit: number): AdSlide[] {
  return [...brands]
    .filter((brand) => brand.visibility === "published")
    .sort((a, b) => Number(b.tbi || 0) - Number(a.tbi || 0))
    .slice(0, limit)
    .map((brand) => {
      const tbi = Number(brand.tbi || 0);
      return {
        brandSlug: brand.slug,
        label: brand.name,
        sub: tbi > 0 ? `TBI ${tbi.toFixed(1)}/100` : "Preliminary",
        href: `/firm/${brand.slug || brand.id}`,
        accent: categoryAccent(brand),
        image: brand.thumbnail || brand.cover,
      };
    });
}

function SlideChip({ slide, badge, onClick }: { slide: AdSlide; badge: string; onClick: () => void }) {
  return (
    <Link
      to={slide.href}
      onClick={onClick}
      className="group/slide relative inline-flex shrink-0 items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-white ring-1 ring-white/15 transition hover:bg-white/20"
    >
      <span
        className={`relative grid h-7 w-7 place-items-center overflow-hidden rounded-full text-[9px] font-bold text-white ring-1 ring-white/10 ${slide.image ? "bg-white/[0.04]" : slide.accent?.includes("bg-gradient") ? slide.accent : `bg-gradient-to-r ${slide.accent ?? "from-fuchsia-500 to-violet-600"}`}`}
      >
        {slide.image ? (
          <img src={slide.image} alt="" className="h-full w-full object-cover" loading="lazy" />
        ) : (
          slide.label.slice(0, 1)
        )}
      </span>
      <span className="font-semibold">{slide.label}</span>
      {slide.sub && <span className="text-[10px] text-white/70">· {slide.sub}</span>}
      <span className="pointer-events-none absolute -top-1 right-2 rounded-full bg-primary/90 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide text-white shadow-[0_4px_14px_rgba(168,85,247,0.3)]">
        {badge}
      </span>
      <ArrowRight className="h-3 w-3 text-white/60 transition group-hover:translate-x-0.5" />
    </Link>
  );
}
