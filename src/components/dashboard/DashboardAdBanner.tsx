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

type DisplayAdSlide = AdSlide & {
  tags?: string[];
  meta?: string;
};

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
    <div className="mb-6 pt-2 animate-fade-in">
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
      className={`relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-r ${accent ?? "from-violet-500/20 to-violet-600/20"} backdrop-blur-xl`}
    >
      <div className="absolute inset-0 bg-[rgba(18,18,25,0.40)]" />
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
        <Megaphone className="h-3.5 w-3.5 shrink-0 text-violet-200" />
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
          <Sparkles className="h-5 w-5 text-violet-100" />
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
    <div className="overflow-hidden py-1">
      <div className="flex items-stretch gap-3 overflow-x-auto pb-2 pt-1 scrollbar-none">
      {slides.map((s, i) => (
        <SlideChip key={i} slide={s} badge="Featured" onClick={onClick} />
      ))}
      </div>
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
    <div className="overflow-hidden py-1">
      <div className="flex items-stretch gap-3 overflow-x-auto pb-2 pt-1 scrollbar-none">
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
    </div>
  );
}

function trendingSlidesFromBrands(brands: AdminBrandRecord[], limit: number): DisplayAdSlide[] {
  return [...brands]
    .filter((brand) => brand.visibility === "published")
    .sort((a, b) => Number(b.tbi || 0) - Number(a.tbi || 0))
    .slice(0, limit)
    .map((brand) => {
      const tbi = Number(brand.tbi || 0);
      const tags = [brand.category].filter(Boolean).slice(0, 2);
      return {
        brandSlug: brand.slug,
        label: brand.name,
        sub: tbi > 0 ? `TBI ${tbi.toFixed(1)}/100` : "Preliminary TBI",
        tags,
        meta: brand.payouts ? `${brand.payouts} payouts` : undefined,
        href: `/firm/${brand.slug || brand.id}`,
        image: brand.thumbnail || brand.cover,
      };
    });
}

function SlideChip({ slide, badge, onClick }: { slide: DisplayAdSlide; badge: string; onClick: () => void }) {
  const tags = slide.tags?.filter(Boolean).slice(0, 2) ?? [];

  return (
    <Link
      to={slide.href}
      onClick={onClick}
      className="group/slide relative flex min-w-[260px] max-w-[330px] shrink-0 items-center gap-3 rounded-3xl border border-white/10 bg-white/[0.075] px-4 py-3 text-xs font-medium text-white shadow-[0_18px_42px_rgba(0,0,0,0.18)] transition hover:border-primary/35 hover:bg-white/[0.105] sm:min-w-[300px]"
    >
      <span
        className={`relative grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-2xl text-sm font-black text-white ring-1 ring-white/12 ${slide.image ? "bg-white/[0.04]" : "rb-gradient-primary"}`}
      >
        {slide.image ? (
          <img src={slide.image} alt="" className="h-full w-full object-contain" loading="lazy" />
        ) : (
          slide.label.slice(0, 1)
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-start justify-between gap-2">
          <span className="truncate text-sm font-black leading-5">{slide.label}</span>
          <span className="shrink-0 rounded-full bg-primary/80 px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.14em] text-white shadow-[0_4px_14px_rgba(90,34,241,0.26)]">
            {badge}
          </span>
        </span>
        <span className="mt-1 flex flex-wrap gap-1.5">
          {tags.length > 0 ? (
            tags.map((tag) => (
              <span key={tag} className="rounded-full border border-white/10 bg-white/[0.07] px-2 py-0.5 text-[10px] font-bold text-white/70">
                {tag}
              </span>
            ))
          ) : slide.sub ? (
            <span className="rounded-full border border-white/10 bg-white/[0.07] px-2 py-0.5 text-[10px] font-bold text-white/70">
              {slide.sub}
            </span>
          ) : null}
        </span>
        {tags.length > 0 && slide.sub && (
          <span className="mt-1 block truncate text-[10px] font-semibold text-white/48">{slide.sub}</span>
        )}
        {slide.meta && <span className="mt-0.5 block truncate text-[10px] text-white/42">{slide.meta}</span>}
      </span>
      <ArrowRight className="h-3.5 w-3.5 shrink-0 text-white/55 transition group-hover/slide:translate-x-0.5" />
    </Link>
  );
}
