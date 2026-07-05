import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Sparkles, X, Megaphone, Flame, ArrowRight } from "lucide-react";
import {
  pickActiveAd,
  trackClick,
  trackImpression,
  trendingSlides,
  type DashboardAd,
  type AdSlide,
} from "@/lib/dashboard-ads";
import { fetchPublicAdverts } from "@/lib/public-adverts-api";

/**
 * Top-of-dashboard ad banner. Renders the highest-priority active ad picked
 * from the superadmin "Dashboard Ads" manager. Re-resolves whenever the route
 * changes so opening a new sidebar page can rotate to a fresh banner.
 */
export function DashboardAdBanner({ pathname }: { pathname: string }) {
  const [ad, setAd] = useState<DashboardAd | null>(() => pickActiveAd());
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const impressedFor = useRef<string | null>(null);

  // re-pick on route change so every page can show the freshest banner
  useEffect(() => {
    let active = true;
    const fallback = pickActiveAd();
    setAd(fallback);

    fetchPublicAdverts("dashboard").then((ads) => {
      if (!active) return;
      setAd(ads.find((item) => item.active) ?? fallback);
    });

    return () => {
      active = false;
    };
  }, [pathname]);

  // listen for live admin updates
  useEffect(() => {
    let active = true;
    const resolveAd = () => {
      const fallback = pickActiveAd();
      setAd(fallback);

      fetchPublicAdverts("dashboard").then((ads) => {
        if (!active) return;
        setAd(ads.find((item) => item.active) ?? fallback);
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
    trackImpression(ad.id);
  }, [ad]);

  if (!ad || dismissed.has(ad.id)) return null;

  const onClick = () => trackClick(ad.id);
  const onClose = () => setDismissed((s) => new Set(s).add(ad.id));

  return (
    <div className="mb-4 animate-fade-in">
      <AdRenderer ad={ad} onClick={onClick} onClose={onClose} />
    </div>
  );
}

function AdRenderer({ ad, onClick, onClose }: { ad: DashboardAd; onClick: () => void; onClose: () => void }) {
  if (ad.format === "marquee") return <Marquee ad={ad} onClick={onClick} onClose={onClose} />;
  if (ad.format === "single") return <Single ad={ad} onClick={onClick} onClose={onClose} />;
  if (ad.format === "carousel") return <Carousel ad={ad} onClick={onClick} onClose={onClose} />;
  return <Trending ad={ad} onClick={onClick} onClose={onClose} />;
}

function Shell({
  children,
  accent,
  onClose,
}: {
  children: React.ReactNode;
  accent?: string;
  onClose: () => void;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-r ${accent ?? "from-fuchsia-500/20 to-violet-600/20"} backdrop-blur-xl`}
    >
      <div className="absolute inset-0 bg-[#150829]/40" />
      <div className="relative">{children}</div>
      <button
        onClick={onClose}
        aria-label="Dismiss banner"
        className="absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-full bg-white/10 text-white/70 transition hover:bg-white/20 hover:text-white"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}

function Marquee({ ad, onClick, onClose }: { ad: DashboardAd; onClick: () => void; onClose: () => void }) {
  return (
    <Shell accent={ad.accent} onClose={onClose}>
      <Link
        to={ad.href ?? "/dashboard"}
        onClick={onClick}
        className="flex items-center gap-3 px-4 py-2 text-xs font-medium text-white"
      >
        <Megaphone className="h-3.5 w-3.5 shrink-0 text-accent" />
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

function Single({ ad, onClick, onClose }: { ad: DashboardAd; onClick: () => void; onClose: () => void }) {
  return (
    <Shell accent={ad.accent} onClose={onClose}>
      <div className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:gap-4 sm:px-5 sm:py-3.5">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/15">
          <Sparkles className="h-5 w-5 text-white" />
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

function Carousel({ ad, onClick, onClose }: { ad: DashboardAd; onClick: () => void; onClose: () => void }) {
  const slides = ad.slides ?? [];
  return (
    <Shell accent={ad.accent ?? "from-violet-600/20 to-fuchsia-500/20"} onClose={onClose}>
      <div className="flex items-center gap-2 px-3 py-2 sm:px-4">
        <div className="flex shrink-0 items-center gap-1.5 rounded-full bg-white/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
          <Flame className="h-3 w-3" /> Featured
        </div>
        <div className="flex flex-1 gap-2 overflow-x-auto scrollbar-none">
          {slides.map((s, i) => (
            <SlideChip key={i} slide={s} onClick={onClick} />
          ))}
        </div>
      </div>
    </Shell>
  );
}

function Trending({ ad, onClick, onClose }: { ad: DashboardAd; onClick: () => void; onClose: () => void }) {
  const slides = useMemo(() => trendingSlides(ad.trendingLimit ?? 5), [ad.trendingLimit]);
  return (
    <Shell accent="from-amber-500/20 to-fuchsia-500/20" onClose={onClose}>
      <div className="flex items-center gap-2 px-3 py-2 sm:px-4">
        <div className="flex shrink-0 items-center gap-1.5 rounded-full bg-white/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
          <Flame className="h-3 w-3 text-amber-300" /> Trending
        </div>
        <div className="flex flex-1 gap-2 overflow-x-auto scrollbar-none">
          {slides.map((s, i) => (
            <SlideChip key={i} slide={s} onClick={onClick} />
          ))}
        </div>
      </div>
    </Shell>
  );
}

function SlideChip({ slide, onClick }: { slide: AdSlide; onClick: () => void }) {
  return (
    <Link
      to={slide.href}
      onClick={onClick}
      className="group inline-flex shrink-0 items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-white ring-1 ring-white/15 transition hover:bg-white/20"
    >
      <span
        className={`grid h-5 w-5 place-items-center rounded-full text-[9px] font-bold text-white ${slide.accent?.includes("bg-gradient") ? slide.accent : `bg-gradient-to-r ${slide.accent ?? "from-fuchsia-500 to-violet-600"}`}`}
      >
        {slide.label.slice(0, 1)}
      </span>
      <span className="font-semibold">{slide.label}</span>
      {slide.sub && <span className="text-[10px] text-white/70">· {slide.sub}</span>}
      <ArrowRight className="h-3 w-3 text-white/60 transition group-hover:translate-x-0.5" />
    </Link>
  );
}
