import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
  Star,
  Play,
  Plus,
  Minus,
  Youtube,
  BadgePercent,
  Building2,
  Crown,
  Medal,
  Trophy,
  Rocket,
  ShieldCheck,
  Users,
  Gift,
  WalletCards,
  BrainCircuit,
  Headphones,
  Target,
  BarChart3,
  Megaphone,
  Handshake,
  Globe2,
  MessageCircle,
  FlaskConical,
} from "lucide-react";
import { ConsentGate } from "@/components/cookies/CookieConsentUI";
import heroChart from "@/assets/hero-chart.jpg";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { RebateCalculator } from "@/components/calculators/RebateCalculator";
import { OfferCard, OfferDetailModal } from "@/components/offers/OfferCard";
import type { AdminOffer, OfferCategory } from "@/lib/admin-data";
import { fetchPublicOffers } from "@/lib/offers-api";
import {
  fetchPublicAdminBrands,
  type AdminBrandCategory,
  type AdminBrandRecord,
} from "@/lib/admin-brands-api";
import { enrichOffersWithBrandAssets, type OfferBrandFields } from "@/lib/offer-brand-assets";
import { fetchTbiExplore, type TbiProfile } from "@/lib/tbi-api";
import { fetchPublicFaqs, type Faq } from "@/lib/admin-api";
import { isPublishedBrand, publicTbiStageTheme, resolveBrandTbiState } from "@/lib/public-brand";
import { useI18n, type TranslationKey } from "@/lib/i18n";
import {
  LandingHeroAdCard,
  LandingSponsorsStrip,
  LandingAdvertiseBox,
} from "@/components/landing/LandingAdSlots";
import { RebateBoardHelpBot } from "@/components/landing/RebateBoardHelpBot";
import { LiveCashbackActivityCard } from "@/components/landing/LiveCashbackActivityCard";
import { fetchPublicAdverts } from "@/lib/public-adverts-api";
import type { DashboardAd } from "@/lib/dashboard-ads";
import {
  fetchHomepageCashbackActivityStats,
  type HomepageCashbackActivityStats,
} from "@/lib/cashback-activity-api";
import { fetchPublicTestimonials, type FeaturedTestimonial } from "@/lib/testimonials-api";
import { resolvePublicFaqContent } from "@/lib/public-faq-content";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  component: Index,
});

const FACEBOOK_REVIEWS_URL =
  "https://www.facebook.com/profile.php?id=61577216030797&mibextid=wwXIfr&mibextid=wwXIfr";

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

const offerRankingTabs: { key: OfferCategory; labelKey: TranslationKey; to: string }[] = [
  { key: "Prop Firms", labelKey: "nav.propFirms", to: "/offers" },
  { key: "Brokers", labelKey: "nav.brokers", to: "/offers" },
  { key: "Exchanges", labelKey: "nav.cryptoExchanges", to: "/offers" },
  { key: "Tools", labelKey: "nav.tools", to: "/offers" },
];

const brokerExchangeTabs = [
  { id: "brokers", label: "Brokers", categories: ["Forex Broker"] as const, to: "/brokers" },
  {
    id: "exchanges",
    label: "Exchanges",
    categories: ["Crypto Exchange"] as const,
    to: "/exchanges",
  },
] as const;

const proFirmTabs = [
  { id: "forex", label: "Forex", categories: ["Prop Firm"] as const, to: "/programs" },
  { id: "futures", label: "Futures", categories: ["Futures Prop Firm"] as const, to: "/programs" },
  { id: "crypto", label: "Crypto", categories: ["Crypto Prop Firm"] as const, to: "/programs" },
  { id: "stocks", label: "Stocks", categories: ["Stock Prop Firm"] as const, to: "/programs" },
] as const;

type BrokerExchangeTabId = (typeof brokerExchangeTabs)[number]["id"];
type ProFirmTabId = (typeof proFirmTabs)[number]["id"];

function sortRankedBrands(brands: AdminBrandRecord[], categories: readonly AdminBrandCategory[]) {
  return brands
    .filter(isPublishedBrand)
    .filter((brand) => categories.includes(brand.category))
    .sort((a, b) => {
      const rankA = a.rankOverride ?? Number.POSITIVE_INFINITY;
      const rankB = b.rankOverride ?? Number.POSITIVE_INFINITY;
      if (rankA !== rankB) return rankA - rankB;
      if (b.tbi !== a.tbi) return b.tbi - a.tbi;
      return a.complaints - b.complaints;
    })
    .slice(0, 5);
}

function sortRankedOffers<T extends AdminOffer>(items: T[], category: OfferCategory) {
  return items
    .filter((offer) => offer.status === "active" && offer.category === category)
    .sort((a, b) => {
      if (Number(!!b.pinned) !== Number(!!a.pinned)) return Number(!!b.pinned) - Number(!!a.pinned);
      return b.uses - a.uses;
    })
    .slice(0, 5);
}

function landingRankTheme(rank: number) {
  if (rank === 1) {
    return {
      Icon: Crown,
      badge:
        "border-[#f6d77a]/35 bg-[#f6d77a]/16 text-[#ffe8a3] shadow-[0_0_18px_rgba(246,215,122,0.16)]",
      card: "border-[#f6d77a]/18",
    };
  }
  if (rank === 2) {
    return {
      Icon: Medal,
      badge: "border-white/28 bg-white/12 text-white shadow-[0_0_16px_rgba(255,255,255,0.11)]",
      card: "border-white/16",
    };
  }
  if (rank === 3) {
    return {
      Icon: Trophy,
      badge:
        "border-[#d7a06a]/35 bg-[#d7a06a]/14 text-[#ffd1a3] shadow-[0_0_16px_rgba(215,160,106,0.13)]",
      card: "border-[#d7a06a]/16",
    };
  }
  return {
    Icon: null,
    badge: "border-white/12 bg-white/[0.065] text-white/82",
    card: "border-white/10",
  };
}

function LandingRankBadge({ rank }: { rank: number }) {
  const theme = landingRankTheme(rank);
  const Icon = theme.Icon;
  return (
    <span
      className={`inline-flex h-8 min-w-8 items-center justify-center gap-1 rounded-full border px-2 text-[12px] font-black ${theme.badge}`}
    >
      {Icon ? <Icon className="h-3.5 w-3.5" strokeWidth={2.8} /> : null}
      {rank}
    </span>
  );
}

function LandingRankingSkeleton() {
  return (
    <div className="mt-4 space-y-2" aria-label="Loading rankings">
      {Array.from({ length: 5 }).map((_, index) => (
        <div
          key={index}
          className="skeleton-card grid grid-cols-[auto_auto_1fr_auto] items-center gap-3 rounded-2xl p-2.5"
        >
          <div className="skeleton h-8 w-8 rounded-full" />
          <div className="skeleton h-11 w-11 rounded-[14px]" />
          <div className="min-w-0 space-y-2">
            <div className="skeleton h-3.5 w-3/5" />
            <div className="skeleton h-5 w-4/5 rounded-full" />
          </div>
          <div className="space-y-1.5">
            <div className="skeleton h-4 w-9" />
            <div className="skeleton h-2.5 w-7" />
          </div>
        </div>
      ))}
    </div>
  );
}

function TestimonialSkeletonGrid() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3" aria-label="Loading testimonials">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="skeleton-card rounded-[20px] p-5">
          <div className="flex gap-1">
            {Array.from({ length: 5 }).map((__, starIndex) => (
              <div key={starIndex} className="skeleton h-4 w-4 rounded-full" />
            ))}
          </div>
          <div className="mt-4 space-y-2">
            <div className="skeleton h-3 w-full rounded-full" />
            <div className="skeleton h-3 w-11/12 rounded-full" />
            <div className="skeleton h-3 w-4/5 rounded-full" />
          </div>
          <div className="mt-5 flex items-center gap-3">
            <div className="skeleton h-11 w-11 rounded-full" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="skeleton h-3.5 w-36 rounded-full" />
              <div className="skeleton h-3 w-44 rounded-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function TestimonialCarousel({ items }: { items: FeaturedTestimonial[] }) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const scrollByCard = (direction: "previous" | "next") => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const card = scroller.querySelector<HTMLElement>("[data-testimonial-card]");
    const distance = card ? card.offsetWidth + 16 : scroller.clientWidth;
    scroller.scrollBy({ left: direction === "next" ? distance : -distance, behavior: "smooth" });
  };

  return (
    <div className="relative">
      <div
        ref={scrollerRef}
        onScroll={(event) => {
          const target = event.currentTarget;
          const card = target.querySelector<HTMLElement>("[data-testimonial-card]");
          if (!card) return;
          const next = Math.round(target.scrollLeft / Math.max(1, card.offsetWidth + 16));
          setActiveIndex(Math.max(0, Math.min(items.length - 1, next)));
        }}
        className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2"
        aria-label="Featured trader testimonials"
      >
        {items.map((item) => (
          <div
            key={item.id}
            data-testimonial-card
            className="w-[86%] shrink-0 snap-center sm:w-[calc((100%_-_1rem)/2)] lg:w-[calc((100%_-_2rem)/3)]"
          >
            <TestimonialCard item={item} />
          </div>
        ))}
      </div>

      {items.length > 1 && (
        <div className="mt-4 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => scrollByCard("previous")}
            className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-white transition hover:border-violet-300/40 hover:bg-violet-500/10"
            aria-label="Previous testimonial"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div
            className="flex items-center gap-1.5"
            aria-label={`${activeIndex + 1} of ${items.length}`}
          >
            {items.map((item, index) => (
              <span
                key={item.id}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  index === activeIndex ? "w-5 bg-violet-400" : "w-1.5 bg-white/20",
                )}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() => scrollByCard("next")}
            className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-white transition hover:border-violet-300/40 hover:bg-violet-500/10"
            aria-label="Next testimonial"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}

function TestimonialCard({ item }: { item: FeaturedTestimonial }) {
  const displayText = item.shortExcerpt || item.reviewText;
  const date = formatReviewDate(item.reviewedAt);
  const sourceIcon = sourceBadgeIcon(item.source);

  return (
    <article className="flex h-full min-h-[260px] flex-col rounded-[20px] border border-white/[0.08] bg-[rgba(22,22,31,0.94)] p-5 shadow-[0_12px_32px_rgba(0,0,0,0.22)] transition hover:-translate-y-0.5 hover:border-violet-300/35 hover:shadow-[0_18px_42px_rgba(45,18,105,0.20)]">
      <div className="flex items-center justify-between gap-3">
        <RatingStars rating={item.rating} />
        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.045] px-2.5 py-1 text-[10px] font-bold text-violet-100">
          {sourceIcon}
          {item.sourceLabel}
        </span>
      </div>

      <p className="mt-4 line-clamp-4 text-sm leading-6 text-[var(--rb-text-secondary)]">
        “{displayText}”
      </p>

      <div className="mt-auto pt-5">
        <div className="flex items-center gap-3">
          <TestimonialAvatar item={item} />
          <div className="min-w-0">
            <div className="truncate text-sm font-bold text-white">{item.reviewerName}</div>
            <div className="mt-0.5 truncate text-[11px] text-muted-foreground">
              {[item.reviewerRole, item.reviewerCountry].filter(Boolean).join(" · ") || "Trader"}
            </div>
            {date && <div className="mt-0.5 text-[10px] text-muted-foreground">{date}</div>}
          </div>
        </div>

        {item.originalReviewUrl && (
          <a
            href={item.originalReviewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-violet-200 transition hover:text-white"
            data-analytics="testimonial-original-review"
          >
            View original review
            <ArrowUpRight className="h-3.5 w-3.5" />
          </a>
        )}
      </div>
    </article>
  );
}

function RatingStars({ rating }: { rating: number }) {
  const safeRating = Math.max(1, Math.min(5, Number(rating) || 5));
  return (
    <div className="inline-flex items-center gap-1" aria-label={`${safeRating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, index) => {
        const filled = index < Math.round(safeRating);
        return (
          <Star
            key={index}
            className={cn("h-4 w-4", filled ? "fill-amber-300 text-amber-300" : "text-white/20")}
          />
        );
      })}
    </div>
  );
}

function TestimonialAvatar({ item }: { item: FeaturedTestimonial }) {
  const initials = item.reviewerName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  if (item.reviewerAvatarUrl) {
    return (
      <img
        src={item.reviewerAvatarUrl}
        alt=""
        className="h-11 w-11 shrink-0 rounded-full object-cover ring-1 ring-white/12"
        loading="lazy"
      />
    );
  }

  return (
    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-violet-300/20 bg-violet-500/12 text-xs font-black text-violet-100">
      {initials || "RB"}
    </div>
  );
}

function sourceBadgeIcon(source: FeaturedTestimonial["source"]) {
  if (source === "facebook") {
    return (
      <span className="grid h-4 w-4 place-items-center rounded-full bg-[#1877F2] text-[11px] font-black text-white">
        f
      </span>
    );
  }
  if (source === "rebateboard") return <ShieldCheck className="h-3.5 w-3.5 text-emerald-300" />;
  if (source === "discord" || source === "telegram")
    return <MessageCircle className="h-3.5 w-3.5 text-violet-300" />;
  return <Globe2 className="h-3.5 w-3.5 text-violet-300" />;
}

function formatReviewDate(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function BrandRankRow({
  brand,
  rank,
  tbiProfile,
}: {
  brand: AdminBrandRecord;
  rank: number;
  tbiProfile?: TbiProfile;
}) {
  const stage = resolveBrandTbiState(brand, tbiProfile);
  const theme = publicTbiStageTheme(stage);
  const rankTheme = landingRankTheme(rank);

  return (
    <Link
      to="/firm/$firmId"
      params={{ firmId: brand.slug }}
      className={`ranking-card-enter group grid grid-cols-[auto_auto_1fr_auto] items-center gap-3 rounded-2xl border bg-white/[0.035] p-2.5 ring-1 ring-white/10 transition hover:bg-white/[0.075] hover:ring-violet-300/25 ${rankTheme.card}`}
      style={{ animationDelay: `${Math.min(rank - 1, 9) * 40}ms` }}
    >
      <LandingRankBadge rank={rank} />
      <div
        className={`grid h-11 w-11 place-items-center overflow-hidden rounded-[14px] text-[10px] font-black ${
          brand.thumbnail ? "bg-white/[0.035]" : "bg-primary/20 text-white"
        }`}
      >
        {brand.thumbnail ? (
          <img
            src={brand.thumbnail}
            alt={`${brand.name} logo`}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          initials(brand.name)
        )}
      </div>
      <div className="min-w-0">
        <div className="flex min-w-0 items-center gap-2">
          <div className="truncate text-sm font-semibold text-white">{brand.name}</div>
        </div>
        <div className="mt-1 flex min-w-0 flex-wrap items-center gap-1.5">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-semibold ring-1 ${theme.chip}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${theme.dot}`} />
            {theme.label}
          </span>
          <span className="truncate text-[10px] text-muted-foreground">{brand.category}</span>
        </div>
      </div>
      <div className="text-right">
        <div className="text-base font-black text-white">{(brand.tbi / 10).toFixed(1)}</div>
        <div className="text-[9px] uppercase tracking-wide text-muted-foreground">TBI</div>
      </div>
    </Link>
  );
}

function RankingPanel({
  title,
  icon,
  tabs,
  active,
  onChange,
  rows,
  tbiProfilesBySlug,
  loading = false,
}: {
  title: string;
  icon: ReactNode;
  tabs: readonly { id: string; label: string; to: string }[];
  active: string;
  onChange: (id: string) => void;
  rows: AdminBrandRecord[];
  tbiProfilesBySlug: Map<string, TbiProfile>;
  loading?: boolean;
}) {
  const { t } = useI18n();
  const activeTab = tabs.find((tab) => tab.id === active) ?? tabs[0];

  return (
    <div className="liquid-glass rounded-[1.75rem] p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="rb-icon-tile h-8 w-8 rounded-full">{icon}</span>
          <h2 className="text-base font-bold">{title}</h2>
        </div>
        <Link to={activeTab.to} className="text-xs font-semibold text-white/70 hover:text-white">
          {t("common.viewAll")} <ArrowUpRight className="ml-0.5 inline h-3 w-3" />
        </Link>
      </div>
      <div className="mt-4 flex flex-wrap gap-1.5">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`rounded-full px-3 py-1 text-[11px] font-semibold ring-1 transition ${
              active === tab.id
                ? "bg-cyan-400/20 text-cyan-100 ring-cyan-300/35"
                : "bg-white/[0.045] text-muted-foreground ring-white/10 hover:bg-white/[0.075] hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {loading ? (
        <LandingRankingSkeleton />
      ) : (
        <div className="mt-4 space-y-2">
          {rows.length ? (
            rows.map((brand, index) => (
              <BrandRankRow
                key={brand.id}
                brand={brand}
                rank={index + 1}
                tbiProfile={tbiProfilesBySlug.get(brand.slug)}
              />
            ))
          ) : (
            <div className="rounded-2xl bg-white/[0.035] p-5 text-center text-xs text-muted-foreground ring-1 ring-white/10">
              {t("home.noRankedBrands")}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function HeroActionStrip() {
  const { t } = useI18n();
  const linkClass =
    "group flex min-w-0 items-center gap-2 rounded-2xl bg-white/[0.055] px-3 py-2.5 ring-1 ring-white/10 transition hover:bg-white/[0.09] hover:ring-violet-300/35";
  const iconClass = "rb-icon-tile h-8 w-8 rounded-xl";
  const labelClass = "min-w-0 text-[11px] font-bold leading-tight text-white/90 sm:text-xs";

  return (
    <div className="grid gap-2 text-xs text-white/82 sm:grid-cols-3">
      <Link to="/signup" className={linkClass}>
        <span className={`${iconClass} hero-action-ring ring-seq-1`}>
          <Rocket className="h-[18px] w-[18px]" strokeWidth={3} />
        </span>
        <span className={labelClass}>{t("hero.getStarted")}</span>
      </Link>
      <Link to="/offers" className={linkClass}>
        <span className={`${iconClass} hero-action-ring ring-seq-2`}>
          <BadgePercent className="h-[18px] w-[18px]" strokeWidth={3} />
        </span>
        <span className={labelClass}>{t("hero.cashback")}</span>
      </Link>
      <Link to="/tbi" className={linkClass}>
        <span className={`${iconClass} hero-action-ring ring-seq-3`}>
          <ShieldCheck className="h-[18px] w-[18px]" strokeWidth={3} />
        </span>
        <span className={labelClass}>{t("hero.aiTrustScores")}</span>
      </Link>
    </div>
  );
}

function youtubeIdFromUrl(url?: string) {
  const value = String(url ?? "").trim();
  if (!value) return "";
  const patterns = [
    /youtu\.be\/([^?&#/]+)/i,
    /youtube\.com\/watch\?[^#]*v=([^?&#]+)/i,
    /youtube\.com\/embed\/([^?&#/]+)/i,
    /youtube\.com\/shorts\/([^?&#/]+)/i,
  ];
  for (const pattern of patterns) {
    const match = value.match(pattern);
    if (match?.[1]) return match[1];
  }
  return "";
}

function videoThumbnail(video: DashboardAd) {
  const explicit = video.thumbnail || video.image;
  if (explicit) return explicit;
  const id = youtubeIdFromUrl(video.videoUrl || video.href);
  return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : "";
}

function HomepageVideoSlider() {
  const [videos, setVideos] = useState<DashboardAd[]>([]);
  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    let mounted = true;
    fetchPublicAdverts("homepage-video").then((items) => {
      if (!mounted) return;
      setVideos(items.filter((item) => item.active).slice(0, 5));
      setActive(0);
      setPlaying(false);
    });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (playing || videos.length < 2) return;
    const timer = window.setInterval(() => {
      setActive((index) => (index + 1) % videos.length);
    }, 6500);
    return () => window.clearInterval(timer);
  }, [playing, videos.length]);

  const current = videos[active];
  const videoId = youtubeIdFromUrl(current?.videoUrl || current?.href);
  const thumbnail = current ? videoThumbnail(current) : "";
  const hasVideos = videos.length > 0;

  const go = (direction: -1 | 1) => {
    if (videos.length < 2) return;
    setPlaying(false);
    setActive((index) => (index + direction + videos.length) % videos.length);
  };

  if (!hasVideos) {
    return (
      <div className="glass-strong rounded-3xl p-5">
        <div className="grid h-52 place-items-center rounded-2xl border border-dashed border-white/10 bg-white/[0.035] text-center sm:h-56">
          <div>
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-primary/15 text-primary ring-1 ring-primary/25">
              <Youtube className="h-5 w-5" />
            </div>
            <p className="mt-3 text-sm font-semibold text-white">
              Featured videos are being curated
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Fresh trading walkthroughs and platform guides will appear here once they are
              published.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-strong overflow-hidden rounded-3xl transition duration-300 hover:-translate-y-0.5">
      <div className="relative aspect-video overflow-hidden rounded-t-3xl bg-white/[0.035]">
        {playing && videoId ? (
          <ConsentGate
            category="functional"
            fallback={
              <div className="grid h-full place-items-center bg-white/[0.035] p-5 text-center">
                <div>
                  <Youtube className="mx-auto h-8 w-8 text-violet-200" />
                  <p className="mt-3 text-sm font-bold text-white">
                    Enable functional cookies to play this video.
                  </p>
                </div>
              </div>
            }
          >
            <iframe
              className="h-full w-full"
              src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
              title={current.headline || current.name}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </ConsentGate>
        ) : thumbnail ? (
          <img
            src={thumbnail}
            alt={current.headline || current.name || "Homepage video"}
            className="h-full w-full object-cover transition duration-500"
            loading="lazy"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-primary/20 via-white/[0.04] to-transparent" />
        )}
        {!playing && (
          <button
            type="button"
            onClick={() => setPlaying(true)}
            className="absolute inset-0 grid place-items-center bg-black/10 transition hover:bg-black/20"
            aria-label="Play homepage video"
          >
            <span className="glass-strong grid h-14 w-14 place-items-center rounded-full transition duration-300 hover:scale-105 sm:h-16 sm:w-16">
              <Play className="h-5 w-5 fill-white sm:h-6 sm:w-6" />
            </span>
          </button>
        )}
        {videos.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              className="absolute left-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-black/35 text-white backdrop-blur transition hover:bg-black/50"
              aria-label="Previous video"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              className="absolute right-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-black/35 text-white backdrop-blur transition hover:bg-black/50"
              aria-label="Next video"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </>
        )}
      </div>
      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-bold text-white">
            {current.headline || current.name || "Featured RebateBoard video"}
          </h3>
          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
            {current.description ||
              current.sub ||
              "Watch the latest RebateBoard walkthroughs and trading insights."}
          </p>
        </div>
        <a
          href={current.videoUrl || current.href || "#"}
          target="_blank"
          rel="noreferrer"
          className="glass-pill inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold transition hover:bg-white/15"
        >
          <Youtube className="h-3.5 w-3.5" />
          YouTube
        </a>
      </div>
      {videos.length > 1 && (
        <div className="hidden justify-center gap-1.5 pb-3 sm:flex">
          {videos.map((video, index) => (
            <button
              type="button"
              key={video.id}
              onClick={() => {
                setActive(index);
                setPlaying(false);
              }}
              className={`h-1.5 rounded-full transition-all ${index === active ? "w-8 bg-white" : "w-2 bg-white/35 hover:bg-white/60"}`}
              aria-label={`Show video ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

type TrustMetric = {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  icon: ReactNode;
};

function useInViewOnce<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (visible) return;
    const node = ref.current;
    if (!node) return;
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.25 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [visible]);

  return [ref, visible] as const;
}

function AnimatedMetricValue({
  value,
  active,
  prefix = "",
  suffix = "",
}: {
  value: number;
  active: boolean;
  prefix?: string;
  suffix?: string;
}) {
  const [display, setDisplay] = useState(0);
  const hasRun = useRef(false);

  useEffect(() => {
    if (!active || hasRun.current) return;
    hasRun.current = true;
    const duration = 950;
    const start = performance.now();

    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(value * eased));
      if (progress < 1) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  }, [active, value]);

  return (
    <span>
      {prefix}
      {display.toLocaleString()}
      {suffix}
    </span>
  );
}

function TrustMetricsStrip({ metrics }: { metrics: TrustMetric[] }) {
  const [ref, visible] = useInViewOnce<HTMLDivElement>();

  return (
    <section ref={ref} className="mt-6 sm:mt-8">
      <div className="glass rounded-[1.75rem] p-3 sm:p-4">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => (
            <div
              key={metric.label}
              className="flex items-center gap-3 rounded-2xl bg-white/[0.035] px-4 py-4 ring-1 ring-white/10 transition duration-300 hover:bg-white/[0.055]"
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/15 text-primary ring-1 ring-primary/25">
                {metric.icon}
              </span>
              <span className="min-w-0">
                <span className="block text-2xl font-black leading-none text-white sm:text-3xl">
                  <AnimatedMetricValue
                    active={visible}
                    value={metric.value}
                    prefix={metric.prefix}
                    suffix={metric.suffix}
                  />
                </span>
                <span className="mt-1 block truncate text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                  {metric.label}
                </span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const traderBenefits = [
  {
    title: "Real Cashback on Every Trade",
    copy: "Automatic rebates paid into your wallet with clear tracking and no chasing.",
    icon: WalletCards,
  },
  {
    title: "Verified Brands Only",
    copy: "Independent TBI signals help traders assess brands with greater confidence.",
    icon: ShieldCheck,
  },
  {
    title: "Rewards That Compound",
    copy: "Earn RR from meaningful activity and progress toward tools, perks, and rewards.",
    icon: Gift,
  },
  {
    title: "Pro-Grade Tools, Free",
    copy: "Backtesting, analytics, calculators, trading journals, and intelligent insights.",
    icon: BrainCircuit,
  },
  {
    title: "Community of Traders",
    copy: "Real reviews, shared payout insight, and experiences traders can verify.",
    icon: Users,
  },
  {
    title: "Human Support, Always",
    copy: "Practical help for cashback, claims, rewards, and partner-related questions.",
    icon: Headphones,
  },
];

const partnerBenefits = [
  {
    title: "Qualified Trader Audience",
    copy: "Reach intent-driven traders actively evaluating brands and trading products.",
    icon: Target,
  },
  {
    title: "Trust You Can Showcase",
    copy: "Independent trust signals help credible brands stand out clearly.",
    icon: ShieldCheck,
  },
  {
    title: "Transparent Performance",
    copy: "Follow clicks, signups, conversions, rewards, and payouts with clearer visibility.",
    icon: BarChart3,
  },
  {
    title: "Marketing That Scales",
    copy: "Offers, reviews, awards, and editorial visibility build value over time.",
    icon: Megaphone,
  },
  {
    title: "Fair, Pay-for-Results",
    copy: "Grow through measurable trader actions and meaningful conversions.",
    icon: Handshake,
  },
  {
    title: "Global Reach, Local Fit",
    copy: "Country-aware discovery helps brands appear where they matter most.",
    icon: Globe2,
  },
];

function WhyRebateBoardSection() {
  const sides = [
    {
      eyebrow: "For Traders",
      title: "Trade smarter. Earn more back.",
      benefits: traderBenefits,
      primary: { label: "Create Free Trader Account", to: "/signup" },
      secondary: { label: "Browse Cashback Offers", to: "/cashback" },
    },
    {
      eyebrow: "For Brands & Partners",
      title: "Grow with trust. Pay for results.",
      benefits: partnerBenefits,
      primary: { label: "List Your Brand", to: "/business/join" },
      secondary: { label: "Become an Affiliate", to: "/business/join" },
    },
  ] as const;

  return (
    <section className="mt-10 sm:mt-12">
      <div className="text-center">
        <span className="inline-flex rounded-full bg-primary/12 px-3 py-1 text-[11px] font-bold text-primary ring-1 ring-primary/25">
          Why RebateBoard
        </span>
        <h2 className="mt-4 text-3xl font-bold sm:text-4xl">
          One platform. <span className="text-gradient">Two winning sides.</span>
        </h2>
        <p className="mx-auto mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          Whether you trade the markets or run a brand that serves them, RebateBoard is built to
          make the relationship fairer, faster, and more rewarding.
        </p>
      </div>
      <div className="mt-7 grid gap-4 lg:grid-cols-2">
        {sides.map((side, sideIndex) => (
          <article
            key={side.eyebrow}
            className="glass-strong rounded-3xl p-5 ring-1 ring-white/10 sm:p-7"
          >
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-full bg-primary/18 text-primary ring-1 ring-primary/30">
                {sideIndex === 0 ? (
                  <Users className="h-5 w-5" />
                ) : (
                  <Building2 className="h-5 w-5" />
                )}
              </span>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
                  {side.eyebrow}
                </p>
                <h3 className="mt-1 text-xl font-bold sm:text-2xl">{side.title}</h3>
              </div>
            </div>
            <div className="mt-6 grid gap-x-5 sm:grid-cols-2">
              {side.benefits.map(({ title, copy, icon: Icon }) => (
                <div
                  key={title}
                  className="flex gap-3 border-b border-white/8 py-4 transition duration-300 hover:translate-x-1"
                >
                  <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/12 text-primary ring-1 ring-primary/20">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-white">{title}</span>
                    <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
                      {copy}
                    </span>
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to={side.primary.to}
                className="rounded-full bg-primary px-5 py-2.5 text-xs font-bold text-white transition hover:brightness-110"
              >
                {side.primary.label}
              </Link>
              <Link
                to={side.secondary.to}
                className="rounded-full bg-white/5 px-5 py-2.5 text-xs font-bold text-white ring-1 ring-white/15 transition hover:bg-white/10"
              >
                {side.secondary.label}
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function FaqSkeletonGrid() {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="glass rounded-2xl p-4">
          <div className="skeleton h-3 w-4/5" />
          <div className="mt-4 space-y-2">
            <div className="skeleton h-2.5 w-full" />
            <div className="skeleton h-2.5 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

function ExclusiveOffersPanel({
  offers,
  active,
  onChange,
  onSelect,
  loading = false,
}: {
  offers: (AdminOffer & OfferBrandFields)[];
  active: OfferCategory;
  onChange: (category: OfferCategory) => void;
  onSelect: (offer: AdminOffer) => void;
  loading?: boolean;
}) {
  const { t } = useI18n();
  const activeTab = offerRankingTabs.find((tab) => tab.key === active) ?? offerRankingTabs[0];

  return (
    <div className="liquid-glass rounded-[1.75rem] p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="rb-icon-tile h-8 w-8 rounded-full">
            <BadgePercent className="h-4 w-4" />
          </span>
          <h2 className="text-base font-bold">{t("home.exclusiveOffers")}</h2>
        </div>
        <Link to={activeTab.to} className="text-xs font-semibold text-white/70 hover:text-white">
          {t("common.viewAll")} <ArrowUpRight className="ml-0.5 inline h-3 w-3" />
        </Link>
      </div>
      <div className="mt-4 flex flex-wrap gap-1.5">
        {offerRankingTabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => onChange(tab.key)}
            className={`rounded-full px-3 py-1 text-[11px] font-semibold ring-1 transition ${
              active === tab.key
                ? "bg-violet-400/20 text-violet-100 ring-violet-300/35"
                : "bg-white/[0.045] text-muted-foreground ring-white/10 hover:bg-white/[0.075] hover:text-white"
            }`}
          >
            {t(tab.labelKey)}
          </button>
        ))}
      </div>
      <div className="mt-4 space-y-2">
        {loading ? (
          <LandingRankingSkeleton />
        ) : offers.length ? (
          offers.map((offer, index) => (
            <button
              key={offer.id}
              type="button"
              onClick={() => onSelect(offer)}
              className="group grid w-full grid-cols-[auto_1fr_auto] items-center gap-3 rounded-2xl bg-white/[0.035] p-2.5 text-left ring-1 ring-white/10 transition hover:bg-white/[0.075] hover:ring-violet-300/25"
            >
              <span
                className={`grid h-11 w-11 place-items-center overflow-hidden rounded-[14px] text-[10px] font-black ${
                  "brandLogo" in offer && offer.brandLogo
                    ? "bg-transparent"
                    : "bg-primary/20 text-white"
                }`}
              >
                {"brandLogo" in offer && offer.brandLogo ? (
                  <img
                    src={offer.brandLogo}
                    alt={`${offer.brand} logo`}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  initials(offer.brand) || index + 1
                )}
              </span>
              <span className="min-w-0">
                <span className="flex min-w-0 items-center gap-2">
                  <span className="truncate text-sm font-semibold text-white">{offer.brand}</span>
                  {offer.pinned && (
                    <Star className="h-3.5 w-3.5 shrink-0 fill-violet-300 text-violet-300" />
                  )}
                </span>
                <span className="mt-1 flex min-w-0 items-center gap-1.5">
                  <span className="truncate text-[11px] text-muted-foreground">{offer.title}</span>
                  {offer.mode === "flyer" && (
                    <span className="shrink-0 rounded-full bg-white/10 px-1.5 py-0.5 text-[8px] font-bold uppercase text-white/60 ring-1 ring-white/10">
                      Flyer
                    </span>
                  )}
                </span>
              </span>
              <span className="text-right">
                <span className="block rounded-full bg-violet-400/15 px-2 py-1 text-xs font-black text-violet-100 ring-1 ring-violet-300/25">
                  {offer.discount ?? "Deal"}
                </span>
                <span className="mt-1 block text-[9px] uppercase tracking-wide text-muted-foreground">
                  {offer.code ?? "Open"}
                </span>
              </span>
            </button>
          ))
        ) : (
          <div className="rounded-2xl bg-white/[0.035] p-5 text-center text-xs text-muted-foreground ring-1 ring-white/10">
            {t("home.noOffers")}
          </div>
        )}
      </div>
    </div>
  );
}

function Index() {
  const { t, language } = useI18n();
  const compactHeroCopy = language !== "en";
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [activeOffer, setActiveOffer] = useState<AdminOffer | null>(null);
  const [liveOffers, setLiveOffers] = useState<AdminOffer[]>([]);
  const [offersLoading, setOffersLoading] = useState(true);
  const [liveBrands, setLiveBrands] = useState<AdminBrandRecord[]>([]);
  const [brandsLoading, setBrandsLoading] = useState(true);
  const [tbiProfiles, setTbiProfiles] = useState<TbiProfile[]>([]);
  const [homeFaqs, setHomeFaqs] = useState<Faq[]>([]);
  const [homeFaqsLoading, setHomeFaqsLoading] = useState(true);
  const [testimonials, setTestimonials] = useState<FeaturedTestimonial[]>([]);
  const [testimonialsLoading, setTestimonialsLoading] = useState(true);
  const [cashbackActivityStats, setCashbackActivityStats] =
    useState<HomepageCashbackActivityStats | null>(null);
  const [calculatorBrand, setCalculatorBrand] = useState<AdminBrandRecord | null>(null);
  const [offerCategory, setOfferCategory] = useState<OfferCategory>("Prop Firms");
  const [brokerExchangeTab, setBrokerExchangeTab] = useState<BrokerExchangeTabId>("brokers");
  const [proFirmTab, setProFirmTab] = useState<ProFirmTabId>("forex");

  useEffect(() => {
    let cancelled = false;

    async function loadOffers() {
      setOffersLoading(true);
      try {
        const offers = await fetchPublicOffers();
        if (!cancelled) setLiveOffers(offers);
      } catch {
        if (!cancelled) setLiveOffers([]);
      } finally {
        if (!cancelled) setOffersLoading(false);
      }
    }

    void loadOffers();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadTestimonials() {
      setTestimonialsLoading(true);
      try {
        const rows = await fetchPublicTestimonials(12);
        if (!cancelled) setTestimonials(rows);
      } catch {
        if (!cancelled) setTestimonials([]);
      } finally {
        if (!cancelled) setTestimonialsLoading(false);
      }
    }

    void loadTestimonials();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadBrands() {
      setBrandsLoading(true);
      try {
        const brands = await fetchPublicAdminBrands();
        const publishedBrands = brands.filter(isPublishedBrand);
        if (!cancelled) setLiveBrands(publishedBrands);
      } catch {
        if (!cancelled) setLiveBrands([]);
      } finally {
        if (!cancelled) setBrandsLoading(false);
      }
    }

    void loadBrands();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadTbiProfiles() {
      try {
        const profiles = await fetchTbiExplore();
        if (!cancelled) {
          setTbiProfiles(profiles.filter((profile) => profile.visibility === "published"));
        }
      } catch {
        if (!cancelled) setTbiProfiles([]);
      }
    }

    void loadTbiProfiles();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadFaqs() {
      setHomeFaqsLoading(true);
      try {
        const rows = await fetchPublicFaqs();
        if (!cancelled) setHomeFaqs(resolvePublicFaqContent(rows, 8));
      } catch {
        if (!cancelled) setHomeFaqs(resolvePublicFaqContent([], 8));
      } finally {
        if (!cancelled) setHomeFaqsLoading(false);
      }
    }

    void loadFaqs();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadCashbackStats() {
      try {
        const stats = await fetchHomepageCashbackActivityStats();
        if (!cancelled) setCashbackActivityStats(stats);
      } catch {
        if (!cancelled) setCashbackActivityStats(null);
      }
    }

    void loadCashbackStats();
    return () => {
      cancelled = true;
    };
  }, []);

  const activeBrokerExchangeTab =
    brokerExchangeTabs.find((tab) => tab.id === brokerExchangeTab) ?? brokerExchangeTabs[0];
  const activeProFirmTab = proFirmTabs.find((tab) => tab.id === proFirmTab) ?? proFirmTabs[0];
  const tbiProfilesBySlug = useMemo(() => {
    const map = new Map<string, TbiProfile>();
    tbiProfiles.forEach((profile) => map.set(profile.slug, profile));
    return map;
  }, [tbiProfiles]);
  const brokerExchangeRows = useMemo(
    () => sortRankedBrands(liveBrands, activeBrokerExchangeTab.categories),
    [activeBrokerExchangeTab.categories, liveBrands],
  );
  const proFirmRows = useMemo(
    () => sortRankedBrands(liveBrands, activeProFirmTab.categories),
    [activeProFirmTab.categories, liveBrands],
  );
  const enrichedOffers = useMemo(
    () => enrichOffersWithBrandAssets(liveOffers, liveBrands),
    [liveBrands, liveOffers],
  );
  const activeOfferRows = useMemo(
    () => sortRankedOffers(enrichedOffers, offerCategory),
    [enrichedOffers, offerCategory],
  );

  const publishedBrandCount = liveBrands.filter(isPublishedBrand).length;
  const trustMetrics = useMemo(
    () => [
      {
        label: "Traders Joined",
        value: Math.max(1000, cashbackActivityStats?.active_cashback_traders ?? 1000),
        suffix: "+",
        icon: <Users className="h-4 w-4" />,
      },
      {
        label: "Trading Brands Listed",
        value: Math.max(20, publishedBrandCount || 0),
        suffix: "+",
        icon: <Building2 className="h-4 w-4" />,
      },
      {
        label: "Cashback Paid",
        value: 2000,
        prefix: "$",
        suffix: "+",
        icon: <BadgePercent className="h-4 w-4" />,
      },
      {
        label: "Giveaways Distributed",
        value: 80000,
        prefix: "$",
        suffix: "+",
        icon: <Gift className="h-4 w-4" />,
      },
    ],
    [cashbackActivityStats, publishedBrandCount],
  );

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Ambient glow orbs */}
      <div className="glow-orb h-[600px] w-[600px] -left-40 top-20" />
      <div className="glow-orb h-[700px] w-[700px] right-0 top-[40%] opacity-60" />
      <div className="glow-orb h-[500px] w-[500px] left-1/3 bottom-20 opacity-50" />

      <SiteHeader />
      <div className="container-app relative pb-5 pt-2 sm:pb-6 sm:pt-3">
        {/* HERO */}
        <section className="grid gap-6 lg:grid-cols-[1.05fr_1fr] lg:items-start lg:gap-6">
          <div>
            <div className="flex flex-col lg:min-h-[22rem] xl:min-h-[23.5rem]">
              <h1
                className={`max-w-3xl break-words font-bold leading-[1.04] ${
                  compactHeroCopy
                    ? "text-3xl sm:text-4xl md:text-[3.35rem] xl:text-[3.55rem]"
                    : "text-4xl sm:text-5xl md:text-6xl xl:text-[4rem]"
                }`}
              >
                {t("hero.headlineLead")}{" "}
                <span className="text-gradient">{t("hero.headlineAccent")}</span>
              </h1>
              <p
                className={`max-w-2xl break-words leading-relaxed text-muted-foreground ${
                  compactHeroCopy
                    ? "mt-3 text-sm sm:text-base md:text-[1.05rem]"
                    : "mt-4 text-base sm:text-lg"
                }`}
              >
                {t("hero.subheadline")}
              </p>
              <div className="mt-5">
                <HeroActionStrip />
              </div>
            </div>
          </div>

          <div>
            {/* Hero rotating ad card */}
            <LandingHeroAdCard fallbackImage={heroChart} className="lg:h-[22rem] xl:h-[23.5rem]" />
            {/* Sponsored company logos */}
            <LandingSponsorsStrip />
          </div>
        </section>

        {/* EXCLUSIVE OFFERS / RANKINGS */}
        <section className="mt-8 grid gap-4 xl:grid-cols-3">
          <ExclusiveOffersPanel
            offers={activeOfferRows}
            active={offerCategory}
            onChange={setOfferCategory}
            onSelect={setActiveOffer}
            loading={offersLoading || brandsLoading}
          />
          <RankingPanel
            title={t("home.topBrokersExchanges")}
            icon={<Building2 className="h-4 w-4" />}
            tabs={brokerExchangeTabs}
            active={brokerExchangeTab}
            onChange={(id) => setBrokerExchangeTab(id as BrokerExchangeTabId)}
            rows={brokerExchangeRows}
            tbiProfilesBySlug={tbiProfilesBySlug}
            loading={brandsLoading}
          />
          <RankingPanel
            title={t("home.topPropFirms")}
            icon={<Trophy className="h-4 w-4" />}
            tabs={proFirmTabs}
            active={proFirmTab}
            onChange={(id) => setProFirmTab(id as ProFirmTabId)}
            rows={proFirmRows}
            tbiProfilesBySlug={tbiProfilesBySlug}
            loading={brandsLoading}
          />
        </section>

        <WhyRebateBoardSection />
        <TrustMetricsStrip metrics={trustMetrics} />

        {/* YOUTUBE / ADVERTISE / CASHBACK */}
        <section id="cashback-calculator" className="mt-10 scroll-mt-32 sm:mt-12">
          <h2 className="mb-6 text-center text-2xl font-bold sm:text-3xl">Latest YouTube Videos</h2>
          <div className="grid items-stretch gap-4 lg:grid-cols-2">
            <div className="flex h-full min-h-0 flex-col gap-4">
              <div className="shrink-0">
                <HomepageVideoSlider />
              </div>
              {/* Featured partner banner */}
              <LandingAdvertiseBox className="lg:min-h-[10rem] lg:flex-1 lg:aspect-auto" />
            </div>

            <div className="flex h-full min-h-0 flex-col gap-4">
              <div className="glass rounded-3xl p-5 sm:p-6">
                <div className="mb-4 flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/20 text-primary ring-1 ring-primary/30">
                    <BadgePercent className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Rebate Calculator</h3>
                    <p className="text-[11px] text-muted-foreground">
                      Estimate cashback using live RebateBoard brands.
                    </p>
                  </div>
                </div>
                <RebateCalculator
                  compact
                  showSaveAction={false}
                  onSelectedBrandChange={setCalculatorBrand}
                />
              </div>
              <LiveCashbackActivityCard selectedBrand={calculatorBrand} />
            </div>
          </div>
        </section>

        {/* COMMUNITY REVIEWS */}
        {(testimonialsLoading || testimonials.length > 0) && (
          <section className="mt-10 sm:mt-12" aria-labelledby="landing-testimonials-heading">
            <div className="mb-6 text-center">
              <h2 id="landing-testimonials-heading" className="text-2xl font-bold sm:text-3xl">
                What Traders Are Saying
              </h2>
              <p className="mx-auto mt-2 max-w-2xl text-sm text-muted-foreground">
                Real experiences from traders across the RebateBoard community.
              </p>
              <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-violet-200/80">
                Every featured testimonial includes its original source.
              </p>
            </div>

            {testimonialsLoading ? (
              <TestimonialSkeletonGrid />
            ) : (
              <>
                <TestimonialCarousel items={testimonials} />
                <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
                  <a
                    href={FACEBOOK_REVIEWS_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full rb-gradient-primary px-5 py-3 text-sm font-bold text-white shadow-[0_12px_30px_rgba(90,34,241,0.28)] transition hover:-translate-y-0.5 sm:w-auto"
                    data-analytics="testimonial-facebook-reviews"
                  >
                    <span className="grid h-5 w-5 place-items-center rounded-full bg-white text-[13px] font-black text-[#1877F2]">
                      f
                    </span>
                    Read More Reviews on Facebook
                  </a>
                  <Link
                    to="/review"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-violet-300/30 bg-white/[0.035] px-5 py-3 text-sm font-bold text-white transition hover:border-violet-300/55 hover:bg-violet-500/10 sm:w-auto"
                    data-analytics="testimonial-share-experience"
                  >
                    <MessageCircle className="h-4 w-4 text-violet-300" />
                    Share Your Experience
                  </Link>
                </div>
              </>
            )}
          </section>
        )}

        {/* FAQ */}
        <section className="mt-10 sm:mt-12">
          <h2 className="mb-6 text-center text-2xl font-bold sm:text-3xl">
            Frequently Asked Questions (FAQs)
          </h2>
          {homeFaqsLoading ? (
            <FaqSkeletonGrid />
          ) : homeFaqs.length === 0 ? (
            <div className="glass rounded-2xl p-6 text-center text-xs text-muted-foreground">
              Helpful trading answers will appear here soon.
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {homeFaqs.map((faq, i) => (
                <button
                  key={faq.id}
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  aria-expanded={openFaq === i}
                  className="glass rounded-2xl p-4 text-left transition hover:bg-white/[0.06]"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-medium">{faq.question}</span>
                    {openFaq === i ? (
                      <Minus className="h-4 w-4 shrink-0" />
                    ) : (
                      <Plus className="h-4 w-4 shrink-0" />
                    )}
                  </div>
                  <div
                    className={cn(
                      "grid transition-[grid-template-rows,opacity] duration-300 ease-out",
                      openFaq === i ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
                    )}
                  >
                    <div className="overflow-hidden">
                      <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
          <div className="mt-6 flex justify-center">
            <Link
              to="/faqs"
              className="rounded-full rb-gradient-primary px-6 py-2 text-xs font-semibold shadow-[0_0_20px_rgba(192,132,252,0.4)]"
            >
              View All FAQs
            </Link>
          </div>
        </section>

        {/* AI ANALYSIS LAB */}
        <section className="relative mt-10 overflow-hidden rounded-3xl border border-white/10 bg-[rgba(22,22,31,0.94)] p-6 shadow-[0_18px_52px_rgba(0,0,0,0.24)] ring-1 ring-violet-500/12 md:p-8">
          <div className="pointer-events-none absolute left-[-10%] top-[-20%] h-[400px] w-[400px] rounded-full bg-violet-500/[0.08] blur-[120px]" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_0%,rgba(90,34,241,0.12),transparent_36%),radial-gradient(circle_at_88%_18%,rgba(126,77,255,0.07),transparent_30%)]" />
          <div className="relative">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-500/15 px-3 py-1 text-[11px] font-semibold text-violet-300 ring-1 ring-violet-400/30">
              <FlaskConical className="h-3.5 w-3.5" />
              NEW • AI Backtest Lab
            </span>
            <h2 className="mt-4 max-w-3xl text-3xl font-bold leading-tight text-white md:text-4xl lg:text-5xl">
              Backtest Smarter. Trade Better.{" "}
              <span className="bg-gradient-to-r from-violet-400 to-violet-400 bg-clip-text text-transparent">
                Earn More Back.
              </span>
            </h2>
            <p className="mt-3 max-w-2xl text-sm text-muted-foreground md:text-base">
              Describe your strategy or upload your real trades. RebateBoard AI analyzes your
              performance, fees, risk, and cashback impact in minutes.
            </p>
            <p className="mt-2 max-w-2xl text-xs italic text-violet-300/80">
              "Most traders do not need another signal. They need to understand their own data."
            </p>

            <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              {[
                {
                  t: "AI Strategy Backtesting",
                  d: "Turn your trading idea into a structured backtest without coding.",
                },
                {
                  t: "Real Trade Analysis",
                  d: "Upload broker, exchange, or prop firm history and see what is really working.",
                },
                {
                  t: "Backtest vs Real",
                  d: "Compare your strategy performance with your actual trading behavior.",
                },
                {
                  t: "Cashback Impact",
                  d: "See how fees affect results — and how cashback improves net performance.",
                },
                {
                  t: "AI Trade Insights",
                  d: "Discover your best days, worst habits, strongest assets, and hidden weaknesses.",
                },
              ].map((c) => (
                <div key={c.t} className="glass rounded-2xl p-4">
                  <div className="text-sm font-semibold text-white">{c.t}</div>
                  <div className="mt-2 text-xs text-muted-foreground">{c.d}</div>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/dashboard/backtest"
                className="rounded-full rb-gradient-primary px-6 py-3 text-sm font-semibold text-white shadow-[0_0_30px_rgba(192,132,252,0.45)]"
              >
                Join RebateBoard 2.0
              </Link>
              <Link
                to="/dashboard/backtest"
                className="glass-pill rounded-full px-6 py-3 text-sm font-semibold text-white"
              >
                Analyze Your Trading Performance
              </Link>
            </div>
          </div>
        </section>
      </div>

      <SiteFooter />

      <OfferDetailModal offer={activeOffer} onClose={() => setActiveOffer(null)} />
      <RebateBoardHelpBot />
    </div>
  );
}
