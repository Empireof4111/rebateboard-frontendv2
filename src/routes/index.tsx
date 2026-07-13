import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  Search,
  ChevronDown,
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
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { X, Check, XCircle, Info, Eye, ShoppingCart } from "lucide-react";
import heroChart from "@/assets/hero-chart.jpg";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { RebateCalculator } from "@/components/calculators/RebateCalculator";
import { OfferCard, OfferDetailModal } from "@/components/offers/OfferCard";
import {
  adminBrands as seedAdminBrands,
  offers as seedOffers,
  type AdminOffer,
  type OfferCategory,
} from "@/lib/admin-data";
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
import { writeCompareSelection } from "@/lib/compare-selection";
import {
  LandingHeroAdCard,
  LandingSponsorsStrip,
  LandingAdvertiseBox,
} from "@/components/landing/LandingAdSlots";
import { LiveCashbackActivityCard } from "@/components/landing/LiveCashbackActivityCard";
import { fetchPublicAdverts } from "@/lib/public-adverts-api";
import type { DashboardAd } from "@/lib/dashboard-ads";
import { Flame } from "lucide-react";
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

const reviewBars = [
  { stars: 5, value: 84, count: "2.1k" },
  { stars: 4, value: 50, count: "1.0k" },
  { stars: 3, value: 28, count: "620" },
  { stars: 2, value: 12, count: "240" },
  { stars: 1, value: 4, count: "60" },
];

const steps: {
  n: number;
  title: string;
  bullets?: string[];
  desc?: string;
  cta?: { label: string; action: string };
}[] = [
  {
    n: 1,
    title: "How It Works",
    desc: "Welcome to the Cashback Support Page for prop firm purchases on RebateBoard. Here, we'll guide you through everything you need to know about how to qualify for cashback, submit a request, and receive your rewards.",
  },
  {
    n: 2,
    title: "How to Qualify for Rebate",
    bullets: [
      "To receive cashback when purchasing a prop firm account:",
      "Use Our Affiliate Link & Discount Code",
      "You must use RebateBoard's affiliate link and promo/discount code during your purchase.",
      "Without this, we won't receive any commission from the firm, and cashback will not be possible.",
    ],
  },
  {
    n: 3,
    title: "How to Claim Your Rebate",
    cta: { label: "Join Our Discord Server", action: "Join" },
    bullets: [
      "Open a Cashback Ticket",
      "Go to the #Creat-Ticket channel.",
      'Select the "Cashback Details" category.',
      "Submit Your Cashback Request",
    ],
  },
  {
    n: 4,
    title: "Provide the Following",
    bullets: [
      "Invoice ID from the prop firm",
      "Screenshot showing the account purchase (must include email or account ID)",
      "Email Address used during the purchase",
      "Alternatively, you can also contact our support:",
      "Email: support@rebateboard.com",
      "Telegram: @RebateBoard",
    ],
  },
  {
    n: 5,
    title: "Verification Process",
    bullets: [
      "Our team will confirm your purchase and verify if we've received a commission from the prop firm.",
      "After successful verification, 50% of our commission will be credited to your RebateBoard Wallet.",
      "You can track your earnings via your dashboard.",
    ],
  },
  {
    n: 6,
    title: "Important Notes",
    bullets: [
      "Commission Type Varies: Some prop firms pay us only after you complete your first project (i.e., pass the challenge).",
      "If this applies, we'll indicate it clearly on the cashback listing.",
      "Others pay on every purchase, and you'll get cashback as soon as we're paid.",
      "Cashback only applies to purchases made via our official affiliate links and codes.",
    ],
  },
  {
    n: 7,
    title: "Transparency & Proof",
    bullets: [
      "We believe in full transparency:",
      "We'll share screenshots or commission reports showing what we earned.",
      "Your cashback = 50% of our total commission for your account purchase.",
    ],
  },
  {
    n: 8,
    title: "Need Help?",
    bullets: [
      "If you're confused or stuck:",
      "Message us on Discord",
      "Email our team directly",
      "Reach out via Telegram chat",
    ],
  },
];

const FACEBOOK_REVIEWS_URL =
  "https://www.facebook.com/profile.php?id=61577216030797&mibextid=wwXIfr&mibextid=wwXIfr";

const offersData = {
  reviews: [
    {
      broker: "IC Markets",
      title: "Trusted by 200k+ traders",
      meta: "4.8 ★ · 2,140 reviews",
      tag: "Top Rated",
    },
    {
      broker: "Pepperstone",
      title: "Award-winning execution speed",
      meta: "4.7 ★ · 1,820 reviews",
      tag: "Editor's Pick",
    },
    {
      broker: "Exness",
      title: "Tight spreads on majors",
      meta: "4.6 ★ · 1,510 reviews",
      tag: "Popular",
    },
    {
      broker: "XM Group",
      title: "Great for beginners",
      meta: "4.5 ★ · 1,230 reviews",
      tag: "Recommended",
    },
  ],
  offers: [
    {
      broker: "Bybit",
      title: "Up to $30,000 deposit bonus",
      meta: "Crypto · New users",
      tag: "Limited",
    },
    {
      broker: "Bitget",
      title: "$6,200 welcome rewards",
      meta: "Crypto · KYC required",
      tag: "Hot",
    },
    { broker: "OctaFX", title: "50% deposit bonus", meta: "Forex · All accounts", tag: "Bonus" },
    { broker: "FBS", title: "$140 no-deposit bonus", meta: "Forex · Verified", tag: "Free" },
  ],
  rebates: [
    {
      broker: "IC Markets",
      title: "$7 per lot cashback",
      meta: "Forex · Standard account",
      tag: "Daily Payout",
    },
    {
      broker: "Pepperstone",
      title: "Up to 80% commission back",
      meta: "Forex · Razor account",
      tag: "High",
    },
    {
      broker: "Binance",
      title: "20% trading fee rebate",
      meta: "Crypto · Spot & Futures",
      tag: "Lifetime",
    },
    { broker: "OKX", title: "30% maker rebate", meta: "Crypto · Pro tier", tag: "Pro" },
  ],
  compare: [
    {
      broker: "IC Markets vs Pepperstone",
      title: "Spreads, fees, leverage side-by-side",
      meta: "Forex brokers",
      tag: "Compare",
    },
    {
      broker: "Bybit vs Binance",
      title: "Funding rates & liquidity match-up",
      meta: "Crypto exchanges",
      tag: "Compare",
    },
    {
      broker: "XM vs Exness",
      title: "Execution & withdrawals",
      meta: "Forex brokers",
      tag: "Compare",
    },
    {
      broker: "OKX vs Bitget",
      title: "Fees, products & rebates",
      meta: "Crypto exchanges",
      tag: "Compare",
    },
  ],
} as const;

type OfferTab = keyof typeof offersData;
const offerTabs: { key: OfferTab; label: string }[] = [
  { key: "reviews", label: "Reviews" },
  { key: "offers", label: "Offers" },
  { key: "rebates", label: "Rebates" },
  { key: "compare", label: "Compare" },
];

function slugifyBrandName(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

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

const fallbackBrands: AdminBrandRecord[] = seedAdminBrands.map((brand) => ({
  id: brand.id,
  name: brand.name,
  slug: slugifyBrandName(brand.name),
  category: brand.category as AdminBrandCategory,
  visibility: "published",
  status: brand.status,
  tbi: brand.tbi,
  payouts: brand.payouts,
  complaints: brand.complaints,
  rankOverride: brand.rankOverride ?? null,
  thumbnail: brand.thumbnail,
  website: brand.website,
}));

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
      badge: "border-[#f6d77a]/35 bg-[#f6d77a]/16 text-[#ffe8a3] shadow-[0_0_18px_rgba(246,215,122,0.16)]",
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
      badge: "border-[#d7a06a]/35 bg-[#d7a06a]/14 text-[#ffd1a3] shadow-[0_0_16px_rgba(215,160,106,0.13)]",
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
    <span className={`inline-flex h-8 min-w-8 items-center justify-center gap-1 rounded-full border px-2 text-[12px] font-black ${theme.badge}`}>
      {Icon ? <Icon className="h-3.5 w-3.5" strokeWidth={2.8} /> : null}
      {rank}
    </span>
  );
}

function LandingRankingSkeleton() {
  return (
    <div className="mt-4 space-y-2" aria-label="Loading rankings">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="skeleton-card grid grid-cols-[auto_auto_1fr_auto] items-center gap-3 rounded-2xl p-2.5">
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
          <div className="flex items-center gap-1.5" aria-label={`${activeIndex + 1} of ${items.length}`}>
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
    return <span className="grid h-4 w-4 place-items-center rounded-full bg-[#1877F2] text-[11px] font-black text-white">f</span>;
  }
  if (source === "rebateboard") return <ShieldCheck className="h-3.5 w-3.5 text-emerald-300" />;
  if (source === "discord" || source === "telegram") return <MessageCircle className="h-3.5 w-3.5 text-violet-300" />;
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
          <span className="rb-icon-tile h-8 w-8 rounded-full">
            {icon}
          </span>
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
  const iconClass =
    "rb-icon-tile h-8 w-8 rounded-xl";
  const labelClass = "min-w-0 text-[11px] font-bold leading-tight text-white/90 sm:text-xs";

  return (
    <div className="grid gap-2 text-xs text-white/82 sm:grid-cols-3">
      <Link
        to="/signup"
        className={linkClass}
      >
        <span className={`${iconClass} hero-action-ring ring-seq-1`}>
          <Rocket className="h-[18px] w-[18px]" strokeWidth={3} />
        </span>
        <span className={labelClass}>{t("hero.getStarted")}</span>
      </Link>
      <Link
        to="/offers"
        className={linkClass}
      >
        <span className={`${iconClass} hero-action-ring ring-seq-2`}>
          <BadgePercent className="h-[18px] w-[18px]" strokeWidth={3} />
        </span>
        <span className={labelClass}>{t("hero.cashback")}</span>
      </Link>
      <Link
        to="/tbi"
        className={linkClass}
      >
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
            <p className="mt-3 text-sm font-semibold text-white">Homepage videos coming soon</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Fresh trading walkthroughs and platform guides will appear here soon.
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
          <iframe
            className="h-full w-full"
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
            title={current.headline || current.name}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
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
            {current.description || current.sub || "Watch the latest RebateBoard walkthroughs and trading insights."}
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
        <div className="flex justify-center gap-1.5 pb-3">
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
                {sideIndex === 0 ? <Users className="h-5 w-5" /> : <Building2 className="h-5 w-5" />}
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

function StepCard({
  step,
}: {
  step: {
    n: number;
    title: string;
    bullets?: string[];
    desc?: string;
    cta?: { label: string; action: string };
  };
}) {
  return (
    <div className="rounded-2xl bg-white/[0.04] p-4 ring-1 ring-white/10 backdrop-blur-sm">
      <div className="mb-3 flex items-center gap-2">
        <span className="grid h-7 w-7 place-items-center rounded-full bg-white text-[11px] font-bold text-violet-900">
          {step.n}
        </span>
        <span className="text-sm font-semibold">{step.title}</span>
      </div>
      {step.cta && (
        <div className="mb-2 flex items-center justify-between rounded-full bg-white/10 px-3 py-1 ring-1 ring-white/15">
          <span className="text-[11px]">{step.cta.label}</span>
          <button className="rounded-full bg-violet-400/40 px-3 py-0.5 text-[10px] font-semibold ring-1 ring-violet-300/40">
            {step.cta.action}
          </button>
        </div>
      )}
      {step.desc && <p className="text-[11px] leading-relaxed text-white/75">{step.desc}</p>}
      {step.bullets && (
        <ul className="space-y-1.5 text-[11px] leading-relaxed text-white/75">
          {step.bullets.map((b, i) => (
            <li key={i} className="flex gap-1.5">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-white/60" />
              <span>{b}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Index() {
  const { t, language } = useI18n();
  const compactHeroCopy = language !== "en";
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [offerTab, setOfferTab] = useState<OfferTab>("reviews");
  const [compareOpen, setCompareOpen] = useState<null | { a: string; b: string }>(null);
  const [activeOffer, setActiveOffer] = useState<AdminOffer | null>(null);
  const [liveOffers, setLiveOffers] = useState<AdminOffer[]>(seedOffers);
  const [offersLoading, setOffersLoading] = useState(true);
  const [liveBrands, setLiveBrands] = useState<AdminBrandRecord[]>(fallbackBrands);
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
        if (!cancelled) setLiveOffers(offers.length ? offers : seedOffers);
      } catch {
        if (!cancelled) setLiveOffers(seedOffers);
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
        if (!cancelled) setLiveBrands(publishedBrands.length ? publishedBrands : fallbackBrands);
      } catch {
        if (!cancelled) setLiveBrands(fallbackBrands);
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

  const topOffers = enrichedOffers
    .filter((o) => o.status === "active")
    .sort((a, b) => Number(!!b.pinned) - Number(!!a.pinned))
    .slice(0, 6);
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
                  compactHeroCopy ? "mt-3 text-sm sm:text-base md:text-[1.05rem]" : "mt-4 text-base sm:text-lg"
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
            loading={offersLoading}
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

        {/* TESTIMONIALS */}
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
                    <span className="grid h-5 w-5 place-items-center rounded-full bg-white text-[13px] font-black text-[#1877F2]">f</span>
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

        {/* Legacy marketplace preview retained in source for migration reference only. */}
        {false && <section className="mt-10 sm:mt-12">
          <div className="mb-6 text-center">
            <div className="text-xs uppercase tracking-widest text-muted-foreground">
              Marketplace
            </div>
            <h2 className="mt-1 text-2xl font-bold sm:text-3xl">
              Exclusive offers, rebates & broker insights
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Switch tabs to explore reviews, deposit bonuses, cashback rebates and head-to-head
              comparisons.
            </p>
          </div>

          {/* Pill tab switcher */}
          <div className="mx-auto mb-6 flex w-fit items-center gap-1 rounded-full bg-gradient-to-r from-violet-900/60 to-violet-900/40 p-1.5 ring-1 ring-violet-400/20 backdrop-blur">
            {offerTabs.map((t) => {
              const active = offerTab === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => setOfferTab(t.key)}
                  className={
                    "rounded-full px-5 py-2 text-xs font-semibold transition " +
                    (active
                      ? "rb-gradient-primary text-white shadow-[0_0_20px_rgba(192,132,252,0.45)]"
                      : "text-violet-100/80 hover:text-white")
                  }
                >
                  {t.label}
                </button>
              );
            })}
          </div>

          {/* Big content card */}
          <div className="glass-strong relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-900/40 via-violet-900/20 to-transparent p-6 ring-1 ring-violet-400/20 sm:p-8">
            {offerTab === "reviews" && (
              <div>
                <div className="flex items-start justify-between gap-4">
                  <h3 className="text-3xl font-bold sm:text-4xl">Reviews</h3>
                  <div className="rounded-full bg-white/5 px-4 py-1.5 text-xs ring-1 ring-white/10">
                    March 2021 — February 2026
                  </div>
                </div>
                <div className="mt-6 grid gap-6 lg:grid-cols-3">
                  <div>
                    <div className="text-xs text-muted-foreground">Total Review</div>
                    <div className="mt-1 flex items-center gap-2">
                      <div className="text-4xl font-bold">10.0k</div>
                      <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-300 ring-1 ring-emerald-400/30">
                        21% ↑
                      </span>
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">
                      Growth in review on this year
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Average Rating</div>
                    <div className="mt-1 flex items-center gap-2">
                      <div className="text-4xl font-bold">4.0</div>
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <Star
                            key={n}
                            className={
                              "h-4 w-4 " +
                              (n <= 4 ? "fill-violet-300 text-violet-300" : "text-violet-300/35")
                            }
                          />
                        ))}
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">
                      Average rating on this year
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    {reviewBars.map((b) => (
                      <div key={b.stars} className="flex items-center gap-2 text-[11px]">
                        <span className="w-3 text-muted-foreground">{b.stars}</span>
                        <Star className="h-3 w-3 fill-violet-300 text-violet-300" />
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/5">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-violet-500 to-orange-400"
                            style={{ width: `${b.value}%` }}
                          />
                        </div>
                        <span className="w-10 text-right text-muted-foreground">{b.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-8 grid gap-6 lg:grid-cols-[260px_1fr]">
                  <div className="space-y-3">
                    <div className="glass-pill flex items-center gap-3 rounded-2xl p-3">
                      <div className="grid h-10 w-10 place-items-center rounded-full bg-white text-[10px] font-bold text-violet-700">
                        ACY
                      </div>
                      <div>
                        <div className="text-xs font-semibold">ACY Securities</div>
                        <div className="text-[10px] text-muted-foreground">Total review: 14</div>
                      </div>
                    </div>
                    <div className="glass-pill flex items-center gap-3 rounded-2xl p-3">
                      <div className="text-xl font-bold">4.0</div>
                      <div>
                        <div className="text-xs font-semibold">Basiru YY</div>
                        <div className="text-[10px] text-muted-foreground">
                          12am — 23 March 2025
                        </div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold">Latest review</h4>
                    <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                      Lorem Ipsum is simply dummy text of the printing and typesetting industry.
                      Lorem Ipsum has been the industry's standard dummy text ever since the 1500s,
                      when an unknown printer took a galley of type and scrambled it to make a type
                      specimen book. It has survived not only five centuries, but also the leap into
                      electronic typesetting, remaining essentially unchanged.
                    </p>
                    <div className="mt-5 flex items-center gap-2">
                      <button className="rounded-full bg-white/5 px-4 py-2 text-xs font-semibold ring-1 ring-white/10 hover:bg-white/10">
                        Helpful (24)
                      </button>
                      <button className="rounded-full bg-white/5 px-4 py-2 text-xs font-semibold ring-1 ring-white/10 hover:bg-white/10">
                        Send Message
                      </button>
                      <button className="grid h-9 w-9 place-items-center rounded-full bg-white/5 ring-1 ring-white/10 hover:bg-white/10">
                        ♥
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {offerTab === "rebates" && (
              <div>
                <div className="flex items-start justify-between gap-4">
                  <h3 className="text-3xl font-bold capitalize sm:text-4xl">
                    How Our Rebate Works
                  </h3>
                  <div className="rounded-full bg-white/5 px-4 py-1.5 text-xs ring-1 ring-white/10">
                    8 simple steps
                  </div>
                </div>
                <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  {steps.slice(0, 4).map((s) => (
                    <StepCard key={s.n} step={s} />
                  ))}
                </div>
                <div className="relative my-6 hidden lg:block">
                  <div className="absolute left-0 right-0 top-1/2 h-px bg-white/30" />
                  <div className="relative grid grid-cols-4">
                    {[0, 1, 2, 3].map((i) => (
                      <div key={i} className="flex flex-col items-center">
                        <div className="h-6 w-px bg-white/30" />
                        <div className="h-2 w-2 rounded-full bg-white/70" />
                        <div className="h-6 w-px bg-white/30" />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-2 lg:mt-0 lg:grid-cols-4">
                  {steps.slice(4, 8).map((s) => (
                    <StepCard key={s.n} step={s} />
                  ))}
                </div>
              </div>
            )}

            {offerTab !== "reviews" && offerTab !== "rebates" && (
              <div>
                <div className="flex items-start justify-between gap-4">
                  <h3 className="text-3xl font-bold capitalize sm:text-4xl">{offerTab}</h3>
                  <div className="rounded-full bg-white/5 px-4 py-1.5 text-xs ring-1 ring-white/10">
                    Updated weekly
                  </div>
                </div>
                <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {offersData[offerTab].map((o, i) => (
                    <div
                      key={`${offerTab}-${i}`}
                      className="glass group relative overflow-hidden rounded-2xl p-4 transition hover:bg-white/[0.06]"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="grid h-8 w-8 place-items-center rounded-lg rb-gradient-primary text-[10px] font-bold">
                            {o.broker.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="text-xs font-semibold">{o.broker}</div>
                        </div>
                        <span className="rounded-full bg-violet-500/20 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-violet-200 ring-1 ring-violet-400/30">
                          {o.tag}
                        </span>
                      </div>
                      <h4 className="mt-3 text-sm font-semibold leading-snug">{o.title}</h4>
                      <div className="mt-1 text-[10px] text-muted-foreground">{o.meta}</div>
                      {offerTab === "compare" ? (
                        <button
                          onClick={() => {
                            const [a, b] = o.broker.split(/\s+vs\s+/i);
                            setCompareOpen({
                              a: a?.trim() || "Brand A",
                              b: b?.trim() || "Brand B",
                            });
                          }}
                          className="mt-4 inline-flex items-center gap-1 text-[11px] font-semibold text-violet-300 transition group-hover:text-violet-200"
                        >
                          View details <ArrowUpRight className="h-3 w-3" />
                        </button>
                      ) : (
                        <Link
                          to="/firm/$firmId"
                          params={{ firmId: encodeURIComponent(o.broker.replace(/\s+/g, "-")) }}
                          className="mt-4 inline-flex items-center gap-1 text-[11px] font-semibold text-violet-300 transition group-hover:text-violet-200"
                        >
                          View details <ArrowUpRight className="h-3 w-3" />
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>}

        {/* TOP OFFERS PREVIEW */}
        {false && <section className="mt-10 sm:mt-12">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-violet-500/15 px-3 py-1 text-[11px] font-semibold text-violet-300 ring-1 ring-violet-400/30">
                <Flame className="h-3 w-3" /> Hot promos
              </div>
              <h2 className="mt-2 text-2xl font-bold sm:text-3xl">Top offers right now</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Hand-picked promos across prop firms, brokers, exchanges &amp; tools.
              </p>
            </div>
            <Link
              to="/offers"
              className="rounded-full rb-gradient-primary px-5 py-2 text-xs font-semibold shadow-[0_0_20px_rgba(192,132,252,0.4)]"
            >
              View all offers →
            </Link>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {topOffers.map((o) => (
              <OfferCard key={o.id} offer={o} onOpen={setActiveOffer} />
            ))}
          </div>
        </section>}

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

        {/* AI BACKTEST LAB */}
        <section className="relative mt-10 overflow-hidden rounded-3xl border border-white/10 bg-[rgba(22,22,31,0.94)] p-6 shadow-[0_18px_52px_rgba(0,0,0,0.24)] ring-1 ring-violet-500/12 md:p-8">
          <div className="pointer-events-none absolute left-[-10%] top-[-20%] h-[400px] w-[400px] rounded-full bg-violet-500/[0.08] blur-[120px]" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_0%,rgba(90,34,241,0.12),transparent_36%),radial-gradient(circle_at_88%_18%,rgba(126,77,255,0.07),transparent_30%)]" />
          <div className="relative">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-500/15 px-3 py-1 text-[11px] font-semibold text-violet-300 ring-1 ring-violet-400/30">
              ✨ NEW • AI Backtest Lab
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

      <LiveCompareDialog
        open={compareOpen}
        brands={liveBrands}
        onClose={() => setCompareOpen(null)}
      />
      <OfferDetailModal offer={activeOffer} onClose={() => setActiveOffer(null)} />
    </div>
  );
}

function LiveCompareDialog({
  open,
  brands,
  onClose,
}: {
  open: null | { a: string; b: string };
  brands: AdminBrandRecord[];
  onClose: () => void;
}) {
  const selected = useMemo(() => {
    if (!open) return [];
    const names = [open.a, open.b].map((name) => name.trim().toLowerCase());
    return brands.filter((brand) => names.includes(brand.name.trim().toLowerCase()));
  }, [brands, open]);

  return (
    <Dialog open={!!open} onOpenChange={(value) => !value && onClose()}>
      <DialogContent className="max-w-xl border-white/15 bg-[var(--rb-bg-elevated)] p-5 text-white">
        <div>
          <h2 className="text-lg font-black">Compare selected brands</h2>
          <p className="mt-1 text-xs leading-5 text-white/48">
            Continue to the live comparison workspace for category-specific data,
            TBI status, cashback, pricing, and trading conditions.
          </p>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {selected.map((brand) => (
            <div
              key={brand.id}
              className="flex items-center gap-3 rounded-2xl bg-white/[0.045] p-3 ring-1 ring-white/10"
            >
              <span
                className={`grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-2xl ${
                  brand.thumbnail ? "bg-transparent" : "bg-primary/20"
                }`}
              >
                {brand.thumbnail ? (
                  <img
                    src={brand.thumbnail}
                    alt={`${brand.name} logo`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-[10px] font-black">
                    {initials(brand.name)}
                  </span>
                )}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-bold">{brand.name}</span>
                <span className="block truncate text-[10px] text-white/42">
                  {brand.category}
                </span>
              </span>
            </div>
          ))}
        </div>
        {selected.length < 2 && (
          <p className="mt-3 rounded-xl bg-white/[0.04] p-3 text-xs text-white/48 ring-1 ring-white/10">
            One or more legacy selections are no longer public. Choose current
            brands in the comparison workspace.
          </p>
        )}
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-white/[0.06] px-4 py-2 text-xs font-bold text-white/72 ring-1 ring-white/10"
          >
            Cancel
          </button>
          <Link
            to="/compare"
            onClick={() => {
              if (selected.length) {
                writeCompareSelection(selected.map((brand) => brand.id));
              }
              onClose();
            }}
            className="rounded-full bg-primary px-4 py-2 text-xs font-bold text-white"
          >
            Open comparison
          </Link>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CompareDialog({
  open,
  onClose,
}: {
  open: null | { a: string; b: string };
  onClose: () => void;
}) {
  const [view, setView] = useState<"compare" | "addFirm">("compare");
  const brands = open ? [open.a, open.b] : [];
  const firmGrid = Array.from({ length: 12 }).map(() => "ACY Securities");
  const brokerFilterOptions: Record<string, string[]> = {
    Regulators: ["FCA", "ASIC", "CySEC", "NFA"],
    "Commission($)": ["$1", "$1 - $5", "$6 - $10", "$10+"],
    "Spread Type": ["Floating Spread", "Fixed Spread"],
    "Minimum Deposit": ["$0 - $100", "$101 - $200", "$500 - $1,000", "$10,000+"],
    Accounts: ["Standard Account", "Mini/Micro Account", "VIP/Premium Account", "ECN Account"],
    Products: ["Forex", "CFDs", "Commodities", "Indices", "Crypto"],
  };

  const FilterSidebar = (
    <div className="glass self-start rounded-2xl p-4 ring-1 ring-violet-400/20">
      {Object.entries(brokerFilterOptions).map(([group, options], i) => (
        <div key={group} className={i > 0 ? "mt-3 border-t border-white/10 pt-3" : ""}>
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold">{group}</div>
            <ChevronDown className="h-3 w-3" />
          </div>
          <div className="mt-2 space-y-1.5 text-[11px] text-muted-foreground">
            {options.map((option) => (
              <label key={option} className="flex items-center gap-2">
                <input type="checkbox" className="accent-violet-400" /> {option}
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
  const overviewRows: {
    label: string;
    values: [string, string];
    icon?: "yes" | "no" | "allowed";
  }[] = [
    { label: "Challenge Type", values: ["2 - Step", "2 - Step"] },
    { label: "Profit Target", values: ["10% / 5%", "10% / 5%"] },
    { label: "Max. Daily Loss", values: ["5%", "5%"] },
    { label: "Max Overall Loss", values: ["10%", "10%"] },
    { label: "Profit Split", values: ["80%", "80%"] },
    { label: "Refundable Fee", values: ["Yes", "Yes"], icon: "yes" },
    { label: "First Payout", values: ["14 Days", "14 Days"] },
    { label: "Payout Frequency", values: ["Bi - Weekly", "Bi - Weekly"] },
    { label: "Scaling Plan", values: ["Yes", "Yes"], icon: "yes" },
    { label: "New Trading", values: ["No", "Allowed"] },
    { label: "Platforms", values: ["MT$, MT5, cTrader", "MT$, MT5, cTrader"] },
  ];

  return (
    <Dialog
      open={!!open}
      onOpenChange={(v) => {
        if (!v) {
          setView("compare");
          onClose();
        }
      }}
    >
      <DialogContent className="max-w-[1100px] border-violet-400/18 bg-[rgba(18,18,25,0.98)] p-0 text-white shadow-[0_28px_90px_rgba(0,0,0,0.44)]">
        <div className="max-h-[90vh] overflow-y-auto p-6">
          {/* Header */}
          <div className="glass-strong mb-4 flex items-center justify-between rounded-2xl bg-violet-900/30 p-4 ring-1 ring-violet-400/20">
            <div>
              <h2 className="text-xl font-bold">Compare Prop Firm</h2>
              <p className="text-[11px] text-muted-foreground">
                Compare rules, payout, pricing and features side by side
              </p>
            </div>
            <div className="glass-pill hidden items-center gap-2 rounded-full px-3 py-1.5 md:flex">
              <Search className="h-3.5 w-3.5 text-muted-foreground" />
              <input
                placeholder="search firm"
                className="w-44 bg-transparent text-xs outline-none placeholder:text-muted-foreground"
              />
            </div>
            <div className="flex items-center gap-2">
              <button className="rounded-full bg-violet-300/30 px-4 py-1.5 text-xs font-semibold ring-1 ring-violet-300/40">
                How it works
              </button>
              <button
                onClick={() => setView(view === "addFirm" ? "compare" : "addFirm")}
                className="inline-flex items-center gap-1 rounded-full bg-violet-300/30 px-4 py-1.5 text-xs font-semibold ring-1 ring-violet-300/40"
              >
                <Plus className="h-3 w-3" /> {view === "addFirm" ? "Back to Compare" : "Add Firm"}
              </button>
            </div>
          </div>

          {view === "compare" ? (
            <div className="grid gap-4 lg:grid-cols-[1fr_220px]">
              {/* Left column: top row (count + brand cards) + Overview */}
              <div className="space-y-4">
                <div className="grid gap-4 lg:grid-cols-[180px_1fr]">
                  {/* Selected count */}
                  <div className="glass rounded-2xl p-4 ring-1 ring-violet-400/20">
                    <div className="text-sm font-semibold">Regulators</div>
                    <div className="mt-2 text-xs text-muted-foreground">2 / 2</div>
                    <div className="mt-2 text-[11px] text-muted-foreground">
                      Select up to 2 firms to compare
                    </div>
                    <button className="mt-4 text-[11px] text-muted-foreground hover:text-white">
                      🗑 Clear all
                    </button>
                  </div>

                  {/* Brand cards */}
                  <div className="glass rounded-2xl p-4 ring-1 ring-violet-400/20">
                    <div className="grid grid-cols-2 gap-3">
                      {brands.map((name, i) => (
                        <div
                          key={i}
                          className="relative rounded-xl bg-white/[0.04] p-3 ring-1 ring-white/10"
                        >
                          <button className="absolute right-2 top-2 grid h-5 w-5 place-items-center rounded-full bg-white/10 text-[10px]">
                            <X className="h-3 w-3" />
                          </button>
                          <div className="flex items-center gap-3">
                            <div className="grid h-12 w-12 place-items-center rounded-lg bg-white text-[10px] font-bold text-violet-700">
                              {name.slice(0, 3).toUpperCase()}
                            </div>
                            <div>
                              <div className="text-xs font-semibold">{name}</div>
                              <div className="mt-0.5 inline-flex items-center gap-1 text-[10px]">
                                <Star className="h-3 w-3 fill-violet-300 text-violet-300" /> 4.7{" "}
                                <span className="text-muted-foreground">(2,001)</span>
                              </div>
                            </div>
                          </div>
                          <button className="mt-3 w-full rounded-full bg-violet-300/30 py-1.5 text-[11px] font-semibold ring-1 ring-violet-300/40">
                            Visit Website
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Overview */}
                <div className="glass rounded-2xl p-5 ring-1 ring-violet-400/20">
                  <div className="mb-4 flex items-center gap-2">
                    <h3 className="text-lg font-bold">Overview</h3>
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="space-y-1">
                    {overviewRows.map((row) => (
                      <div
                        key={row.label}
                        className="grid grid-cols-[1.2fr_1fr_1fr] items-center gap-3 rounded-lg px-2 py-2 text-xs odd:bg-white/[0.02]"
                      >
                        <div className="text-muted-foreground">▤ {row.label}</div>
                        {row.values.map((v, i) => (
                          <div key={i} className="text-center">
                            {v === "Yes" ? (
                              <span className="inline-flex items-center gap-1 text-emerald-400">
                                <Check className="h-3 w-3" /> Yes
                              </span>
                            ) : v === "No" ? (
                              <span className="inline-flex items-center gap-1 text-rose-400">
                                <XCircle className="h-3 w-3" /> No
                              </span>
                            ) : (
                              <span>{v}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>

                  {/* Pricing */}
                  <div className="mt-6 border-t border-white/10 pt-4">
                    <div className="mb-3 flex items-center gap-2">
                      <h3 className="text-base font-bold">Pricing (Popular Size)</h3>
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="grid grid-cols-[1.2fr_1fr_1fr] items-center gap-3 text-xs">
                      <div className="inline-flex items-center gap-2 text-muted-foreground">
                        <span className="grid h-7 w-7 place-items-center rounded-full bg-violet-500/30">
                          $
                        </span>
                        $100,000 Account
                      </div>
                      {brands.map((_, i) => (
                        <div key={i} className="text-center">
                          <div className="text-base font-bold">$520</div>
                          <button className="mt-2 w-full rounded-full bg-violet-300/30 py-1.5 text-[11px] font-semibold ring-1 ring-violet-300/40">
                            See all pricing
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {FilterSidebar}
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
              {FilterSidebar}

              {/* Firm grid */}
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {firmGrid.map((name, i) => (
                  <div key={i} className="glass rounded-2xl p-3 ring-1 ring-violet-400/20">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="grid h-12 w-12 place-items-center rounded-lg bg-white text-[10px] font-bold text-violet-700">
                          ACY
                        </div>
                        <span className="absolute -right-1 -top-1 grid h-4 w-4 place-items-center rounded-full bg-violet-500 text-[8px]">
                          <Check className="h-2.5 w-2.5" />
                        </span>
                      </div>
                      <div>
                        <div className="text-sm font-semibold">{name}</div>
                        <div className="mt-0.5 flex items-center gap-1 text-[10px]">
                          <Star className="h-3 w-3 fill-violet-300 text-violet-300" />
                          <Star className="h-3 w-3 fill-violet-300 text-violet-300" />
                          <Star className="h-3 w-3 fill-violet-300 text-violet-300" />
                          <Star className="h-3 w-3 fill-violet-300 text-violet-300" />
                          <Star className="h-3 w-3 text-violet-300/35" />
                          <span className="ml-1 font-semibold">4.0</span>
                        </div>
                        <div className="text-[10px] text-muted-foreground">Total Review : 4</div>
                      </div>
                    </div>
                    <div className="mt-3 space-y-2">
                      <div className="flex items-center gap-1.5">
                        <button className="inline-flex flex-1 min-w-0 items-center justify-center gap-1 rounded-full bg-violet-300/30 px-2 py-1.5 text-[10px] font-semibold ring-1 ring-violet-300/40">
                          <ShoppingCart className="h-3 w-3 shrink-0" />{" "}
                          <span className="truncate">Sign up</span>
                        </button>
                        <Link
                          to="/firm/$firmId"
                          params={{ firmId: encodeURIComponent(name.replace(/\s+/g, "-")) }}
                          onClick={() => onClose()}
                          className="inline-flex flex-1 min-w-0 items-center justify-center gap-1 rounded-full bg-violet-300/30 px-2 py-1.5 text-[10px] font-semibold ring-1 ring-violet-300/40"
                        >
                          <Eye className="h-3 w-3 shrink-0" />{" "}
                          <span className="truncate">View Details</span>
                        </Link>
                      </div>
                      <label className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                        <input type="checkbox" className="accent-violet-400" /> Add to compare
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
