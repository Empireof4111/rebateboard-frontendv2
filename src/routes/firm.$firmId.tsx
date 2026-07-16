import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Play,
  ChevronDown,
  Headphones,
  WalletCards,
  ClipboardCheck,
  LineChart,
  CircleDollarSign,
  ReceiptText,
  Gauge,
  MonitorCog,
  BookOpen,
  ShieldCheck,
  Ban,
  ThumbsUp,
  ListChecks,
  BadgeCheck,
  Camera,
  Copy,
  Linkedin,
  Mail,
  MessageSquare,
  UserCheck,
  UserPlus,
  Rocket,
  Info,
  TimerReset,
  type LucideIcon,
} from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { VerificationBadge } from "@/components/VerificationBadge";
import { FirmReviews } from "@/components/firm/FirmReviews";
import { FirmChallenges } from "@/components/firm/FirmChallenges";
import { FirmComplaints } from "@/components/firm/FirmComplaints";
import { FirmAnnouncements } from "@/components/firm/FirmAnnouncements";
import {
  fetchPublicAdminBrand,
  followAdminBrand,
  unfollowAdminBrand,
  updateAdminBrand,
} from "@/lib/admin-brands-api";
import { API_BASE_URL } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { resolveCountryDisplay } from "@/lib/country-format";
import { uploadMediaFile } from "@/lib/media-api";
import { validateFileSize } from "@/lib/upload-limits";
import {
  normalizePropFirmProfile,
  type NormalizedPropFirmProfile,
  type ProfileCard,
  type ProfileCountry,
  type ProfileLogoItem,
  type ProfileRow,
  type ProfileRule,
} from "@/lib/prop-firm-profile";
import { TBI_BRANDS } from "@/lib/tbi-data";
import { fetchTbiBrand, type TbiProfile } from "@/lib/tbi-api";
import { fetchPublicOffers, type AdminOffer } from "@/lib/offers-api";
import { resolveBrandTbiState } from "@/lib/public-brand";

export const Route = createFileRoute("/firm/$firmId")({
  head: ({ params }) => {
    const name = decodeURIComponent(params.firmId).replace(/-/g, " ");
    return {
      meta: [
        { title: `${name} — Firm Details · RebateBoard` },
        {
          name: "description",
          content: `Full breakdown of ${name}: funding program, account options, trading rules, scaling plan, payouts, fees, and more.`,
        },
        { property: "og:title", content: `${name} — Firm Details` },
        {
          property: "og:description",
          content: `Full breakdown of ${name}: funding, rules, payouts, fees, and more.`,
        },
      ],
    };
  },
  component: FirmDetailsPage,
});

const sideTabs = [
  { id: "overview", label: "Overview" },
  { id: "trading-rules", label: "Trading Rules" },
  { id: "scaling-plan", label: "Scaling Plan" },
  { id: "profit-payout", label: "Profit Split & Payout" },
  { id: "cashback-rebate", label: "Cashback / Rebate" },
  { id: "fees-pricing", label: "Fees and Pricing" },
  { id: "instruments-leverage", label: "Supported Instrument & Leverage" },
  { id: "platform-technology", label: "Platform & Technology" },
  { id: "community-education", label: "Community & Education" },
  { id: "regulation-trust", label: "Regulation and Trust" },
  { id: "customer-support", label: "Customer Support" },
  { id: "restricted-countries", label: "Restricted Countries" },
  { id: "pros-cons", label: "Pros & Cons" },
] as const;

type SideSectionId = (typeof sideTabs)[number]["id"];

/* ================================================================
 * Saved-brand lookup (mirrors the admin "rb-admin:brands" payload)
 * ================================================================ */
type SavedBrand = {
  id?: string;
  name: string;
  slug?: string;
  category?: string;
  thumbnail?: string;
  cover?: string;
  website?: string;
  primaryColor?: string;
  visibility?: "draft" | "published" | "hidden" | "archived";
  status?: string;
  identity?: {
    founded?: string;
    hq?: string;
    country?: string;
    location?: string;
    tagline?: string;
    description?: string;
    supportEmail?: string;
    editorial?: string;
    website?: string;
  };
  founder?: { ceo?: string; founderLi?: string; founderX?: string; yt?: string; tags?: string };
  broker?: Record<string, string>;
  prop?: Record<string, string>;
  exchange?: Record<string, string>;
  tool?: Record<string, string>;
  editorial?: {
    keyFeatures?: string;
    tradingConditions?: string;
    pros?: string;
    cons?: string;
    bestFor?: string;
    verdict?: string;
  };
  profile?: {
    leverageOverall?: string;
    leverageByAsset?: string;
    timeLimit?: string;
    overnightHolding?: string;
    community?: string;
    supportChannels?: string;
    supportResponse?: string;
    supportCommunity?: string;
    restrictedCountries?: string;
    country?: string;
    legalEntity?: string;
    transparencyNote?: string;
    publicFeedback?: string;
  };
  cashback?: {
    defaultPct?: number;
    maxPct?: number;
    type?: string;
    terms?: string;
    affiliateLink?: string;
    howTraderEarns?: string;
    note?: string;
  };
  challenges?: Array<{
    price?: number;
    originalPrice?: number;
    program?: string;
    size?: string;
    discountCode?: string;
  }>;
  trust?: {
    tbi?: number;
    licenseNo?: string;
    legalEntity?: string;
    transparencyNote?: string;
    publicFeedback?: string;
  };
  complaints?: number;
  followersCount?: number;
  reviewsCount?: number;
  isFollowing?: boolean;
  tbi?: number;
};

type ProfileAssets = {
  avatar?: string;
  banner?: string;
};

const profileAssetsKey = (firmId: string) => `rb-firm-profile-assets:${firmId}`;
const brandSessionKey = "rb_brand_session_v1";
const publicForexPropFirmCacheKey = "rb_public_forex_prop_firms_v4";

type BrandOwnerSession = {
  slug?: string;
  role?: string;
};

function readBrandOwnerSession(): BrandOwnerSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(brandSessionKey);
    return raw ? (JSON.parse(raw) as BrandOwnerSession) : null;
  } catch {
    return null;
  }
}

function isAdminRole(role?: string | null) {
  return String(role || "").toUpperCase() === "ADMIN";
}

function isPropFirmCategory(category?: string) {
  return /prop|funding|challenge/i.test(String(category || ""));
}

function reviewProviderTypeForCategory(category?: string) {
  const value = String(category || "").toLowerCase();
  if (value.includes("broker")) return "Broker";
  if (value.includes("exchange") || value.includes("crypto")) return "Exchange";
  if (value.includes("tool") || value.includes("software") || value.includes("journal")) {
    return "Tool";
  }
  return "Prop Firm";
}

function listingPathForCategory(category?: string) {
  const value = String(category || "").toLowerCase();

  if (value.includes("broker")) return "/brokers";
  if (value.includes("exchange")) return "/exchanges";
  if (value.includes("crypto prop")) return "/crypto-prop-firms";
  if (value.includes("futures prop") || value.includes("future")) return "/futures-prop-firms";
  if (value.includes("stock prop") || value.includes("stock")) return "/stock-prop-firms";
  if (value.includes("dex")) return "/dex-prop-firms";
  if (value.includes("copy")) return "/copy-trading-platforms";
  if (value.includes("platform")) return "/trading-platforms";
  if (value.includes("software")) return "/trading-software";
  if (value.includes("tool")) return "/trading-tools";
  if (value.includes("education") || value.includes("academy")) return "/education-providers";
  if (value.includes("signal")) return "/signal-providers";

  return "/programs";
}

function buildReviewHref(slug: string, category?: string) {
  const params = new URLSearchParams({
    itemSlug: slug,
    providerType: reviewProviderTypeForCategory(category),
  });
  return `/review?${params.toString()}`;
}

type BrandTopTab =
  | "Overview"
  | "Reviews"
  | "Funding Programs"
  | "Complaints"
  | "Payouts"
  | "Announcement"
  | "TBI Breakdown"
  | "Offers";

function socialUrl(value?: string, network?: "x" | "linkedin") {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;
  const handle = raw.replace(/^@/, "");
  if (network === "x") return `https://x.com/${handle}`;
  if (network === "linkedin")
    return raw.includes("/") ? `https://${raw}` : `https://www.linkedin.com/in/${handle}`;
  return raw;
}

function meaningfulText(value: unknown) {
  const raw = String(value ?? "").trim();
  if (!raw || /^(null|none|n\/a|na|undefined|false)$/i.test(raw)) return "";
  return raw;
}

function numberFromValue(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const text = meaningfulText(value);
  if (!text) return 0;
  const match = text.match(/\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : 0;
}

function firstMeaningful(...values: unknown[]) {
  for (const value of values) {
    const text = meaningfulText(value);
    if (text) return text;
  }
  return "";
}

function externalUrl(value?: string) {
  const raw = meaningfulText(value);
  if (!raw) return "";
  return /^https?:\/\//i.test(raw) ? raw : `https://${raw.replace(/^\/+/, "")}`;
}

function youtubeVideoId(value?: string) {
  const raw = meaningfulText(value);
  if (!raw) return "";

  try {
    const parsed = new URL(externalUrl(raw));
    if (parsed.hostname.includes("youtu.be")) return parsed.pathname.replace(/^\/+/, "").split("/")[0];
    if (parsed.searchParams.get("v")) return parsed.searchParams.get("v") || "";
    const parts = parsed.pathname.split("/").filter(Boolean);
    const marker = parts.findIndex((part) => ["embed", "shorts", "live"].includes(part));
    if (marker >= 0) return parts[marker + 1] || "";
  } catch {
    return "";
  }

  return "";
}

function youtubeThumbnailUrl(value?: string) {
  const videoId = youtubeVideoId(value);
  return videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : "";
}

function resolveMediaUrl(...values: unknown[]) {
  const value = firstMeaningful(...values);
  if (!value) return "";
  if (/^(https?:|data:|blob:)/i.test(value)) return value;

  const apiOrigin = API_BASE_URL.replace(/\/api\/v1$/i, "");
  if (value.startsWith("/api/v1/")) return `${apiOrigin}${value}`;
  if (value.startsWith("/file/")) return `${API_BASE_URL}${value}`;
  if (value.startsWith("/")) return `${apiOrigin}${value}`;

  return `${API_BASE_URL}/file/view?key=${encodeURIComponent(value)}`;
}

function discountInfo(brand: SavedBrand | null) {
  const prop = (brand?.prop ?? {}) as Record<string, unknown>;
  const cashback = (brand?.cashback ?? {}) as Record<string, unknown>;
  const challengeCode = brand?.challenges
    ?.map((challenge) => meaningfulText(challenge.discountCode))
    .find(Boolean);
  const percent =
    [
      prop.discountPercentage,
      prop.discountPct,
      prop.discount,
      prop.cashbackPct,
      cashback.maxPct,
      cashback.defaultPct,
    ]
      .map(numberFromValue)
      .find((value) => value > 0) ?? 0;
  const code = firstMeaningful(prop.discountCode, prop.promoCode, prop.couponCode, challengeCode);
  const cashbackEligible =
    /^(yes|true|eligible)$/i.test(meaningfulText(cashback.eligible)) || percent > 0;
  return {
    percent,
    code,
    hasOffer: cashbackEligible || Boolean(code),
    offerLabel: percent ? `${percent}% OFF` : cashbackEligible ? "Cashback available" : "",
    description: firstMeaningful(
      cashback.terms,
      cashback.howTraderEarns,
      cashback.type,
      cashback.note,
    ),
  };
}

type ProfileOfferInfo = {
  hasOffer: boolean;
  label: string;
  discountLabel: string;
  code: string;
  description: string;
  terms: string;
  ctaUrl: string;
  accentFrom: string;
  accentTo: string;
};

function profileOfferInfo(brand: SavedBrand | null, offer: AdminOffer | null): ProfileOfferInfo {
  const brandDiscount = discountInfo(brand);
  const category = String(brand?.category || "");
  const isBroker = /broker/i.test(category);
  const isExchange = /exchange|crypto/i.test(category);
  const defaultLabel = isBroker
    ? "Cashback available"
    : isExchange
      ? "Rewards available"
      : "Offer live";
  const defaultDescription = isBroker
    ? "RebateBoard cashback details for this broker."
    : isExchange
      ? "RebateBoard reward details for this exchange."
      : "Verified RebateBoard promotion for this brand.";
  const discountLabel = firstMeaningful(offer?.discount, brandDiscount.offerLabel);
  const code = firstMeaningful(offer?.code, brandDiscount.code);
  const description = firstMeaningful(
    offer?.description,
    offer?.title,
    brandDiscount.description,
    brandDiscount.hasOffer ? defaultDescription : "",
  );
  const terms = firstMeaningful(offer?.terms, brandDiscount.description);
  const ctaUrl = externalUrl(
    firstMeaningful(
      offer?.ctaUrl,
      brand?.cashback?.affiliateLink,
      brand?.website,
      brand?.identity?.website,
    ),
  );

  return {
    hasOffer: Boolean(offer || brandDiscount.hasOffer || discountLabel || code),
    label: defaultLabel,
    discountLabel: discountLabel || defaultLabel,
    code,
    description,
    terms,
    ctaUrl,
    accentFrom: offer?.accentFrom || (isBroker ? "#22c55e" : isExchange ? "#38bdf8" : "#7e4dff"),
    accentTo: offer?.accentTo || (isBroker ? "#7e4dff" : isExchange ? "#7e4dff" : "#5a22f1"),
  };
}

function readStoredProfileAssets(firmId: string): ProfileAssets {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(profileAssetsKey(firmId));
    return raw ? (JSON.parse(raw) as ProfileAssets) : {};
  } catch {
    return {};
  }
}

function writeStoredProfileAssets(firmId: string, assets: ProfileAssets) {
  if (typeof window === "undefined") return;
  try {
    if (assets.avatar || assets.banner) {
      localStorage.setItem(profileAssetsKey(firmId), JSON.stringify(assets));
    } else {
      localStorage.removeItem(profileAssetsKey(firmId));
    }
  } catch {
    // Large local images can exceed browser storage. The preview still works for the current session.
  }
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const sizeError = validateFileSize(file);
    if (sizeError) {
      reject(new Error(sizeError));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function normalizeTbiScore(value?: number) {
  if (!value || Number.isNaN(value)) return 7.3;
  // Backend TBI profiles are 0-10. Admin-brand TBI values are stored as 0-100.
  if (value > 100) return 10;
  return value > 10 ? value / 10 : value;
}

function compactCount(value: number) {
  if (value >= 1000) return `${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}K`;
  return value.toLocaleString();
}

type TbiMetric = {
  key: keyof TbiProfile["components"];
  label: string;
  short: string;
  value: number;
  weight: number;
};

const tbiMetricMeta: Array<Omit<TbiMetric, "value">> = [
  { key: "ut", label: "User Trust", short: "UT", weight: 30 },
  { key: "pr", label: "Payout Reliability", short: "PR", weight: 25 },
  { key: "ts", label: "Transparency", short: "TS", weight: 15 },
  { key: "rc", label: "Regulation & Compliance", short: "RC", weight: 10 },
  { key: "tc", label: "Trading Conditions", short: "TC", weight: 10 },
  { key: "cx", label: "Customer Experience", short: "CX", weight: 10 },
];

function clampScore(value: unknown, fallback = 0) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.min(10, Math.max(0, numeric));
}

function scoreFromTextPresence(value: unknown, score: number, fallback: number) {
  return meaningfulText(value) ? score : fallback;
}

function derivedTbiMetricValue(key: TbiMetric["key"], brand: SavedBrand | null, score: number) {
  const trust = (brand?.trust ?? {}) as Record<string, unknown>;
  const prop = (brand?.prop ?? {}) as Record<string, unknown>;
  const profile = (brand?.profile ?? {}) as Record<string, unknown>;
  const editorial = (brand?.editorial ?? {}) as Record<string, unknown>;
  const base = clampScore(score, 0);

  switch (key) {
    case "ut":
      return clampScore(trust.userTrust ?? trust.ut ?? trust.rating, base);
    case "pr":
      return clampScore(
        trust.payoutReliability ?? trust.pr,
        scoreFromTextPresence(
          prop.payoutSchedule || prop.payoutFreq || brand?.payouts,
          Math.max(base, 6.5),
          Math.max(base - 1, 0),
        ),
      );
    case "ts":
      return clampScore(
        trust.transparency ?? trust.ts,
        scoreFromTextPresence(
          profile.transparencyNote || editorial.verdict || editorial.keyFeatures,
          Math.max(base - 0.2, 0),
          Math.max(base - 1.3, 0),
        ),
      );
    case "rc":
      return clampScore(
        trust.regulationCompliance ?? trust.regulation ?? trust.rc,
        scoreFromTextPresence(
          trust.licenseNo || trust.legalEntity || profile.legalEntity,
          Math.max(base - 0.5, 0),
          Math.min(base, 5),
        ),
      );
    case "tc":
      return clampScore(
        trust.tradingConditionsScore ?? trust.tc,
        scoreFromTextPresence(
          prop.profitSplit || prop.maxAllocation || prop.rules,
          Math.max(base - 0.4, 0),
          Math.max(base - 1.1, 0),
        ),
      );
    case "cx":
      return clampScore(
        trust.customerExperienceScore ?? trust.cx,
        scoreFromTextPresence(
          brand?.identity?.supportEmail || profile.supportChannels || profile.supportResponse,
          Math.max(base - 0.3, 0),
          Math.max(base - 1.2, 0),
        ),
      );
    default:
      return base;
  }
}

function tbiMetricsForProfile(
  brand: SavedBrand | null,
  profile: TbiProfile | null,
  score: number,
): TbiMetric[] {
  return tbiMetricMeta.map((metric) => ({
    ...metric,
    value: clampScore(
      profile?.components?.[metric.key],
      derivedTbiMetricValue(metric.key, brand, score),
    ),
  }));
}

function scoreOutOf100(score: number) {
  return Math.round(clampScore(score) * 1000) / 100;
}

function polygonPoints(count: number, radius: number, center = 128) {
  return Array.from({ length: count })
    .map((_, index) => {
      const angle = -Math.PI / 2 + (index * 2 * Math.PI) / count;
      return `${center + Math.cos(angle) * radius},${center + Math.sin(angle) * radius}`;
    })
    .join(" ");
}

function valuePolygonPoints(metrics: TbiMetric[], radius = 72, center = 128) {
  return metrics
    .map((metric, index) => {
      const angle = -Math.PI / 2 + (index * 2 * Math.PI) / metrics.length;
      const distance = radius * (metric.value / 10);
      return `${center + Math.cos(angle) * distance},${center + Math.sin(angle) * distance}`;
    })
    .join(" ");
}

function tbiStageTheme(stage?: TbiProfile["state"]) {
  if (stage === "full") {
    return {
      label: "Fully Unlocked",
      caption: "Premium gold trust engine",
      background:
        "radial-gradient(circle at 88% 12%, rgba(255, 201, 40, 0.34), transparent 28%), radial-gradient(circle at 12% 86%, rgba(126, 77, 255, 0.20), transparent 36%), linear-gradient(145deg, #271c08 0%, #161219 52%, #0f0b10 100%)",
      ring: "ring-[rgba(255,201,40,0.34)]",
      glow: "bg-[rgba(255,201,40,0.20)]",
      badge: "text-[#241600]",
      badgeStyle: { background: "var(--rb-gradient-full-unlock)" },
      radarA: "#ffd866",
      radarB: "#ffc928",
      radarFillA: "#ffd866",
      radarFillB: "#7e4dff",
      bar: "from-[var(--rb-gold-500)] via-[var(--rb-gold-300)] to-[var(--rb-gold-400)]",
      chip: "bg-[rgba(255,201,40,0.14)] text-[var(--rb-gold-200)] ring-[rgba(255,201,40,0.30)]",
    };
  }

  if (stage === "partial") {
    return {
      label: "Partial Unlock",
      caption: "Bronze trust engine",
      background:
        "radial-gradient(circle at 88% 12%, rgba(199, 137, 74, 0.25), transparent 28%), radial-gradient(circle at 14% 84%, rgba(90, 34, 241, 0.14), transparent 36%), linear-gradient(145deg, #2d1b10 0%, #171119 54%, #0f0b18 100%)",
      ring: "ring-[rgba(199,137,74,0.26)]",
      glow: "bg-[rgba(199,137,74,0.16)]",
      badge: "from-[#e0ad72] via-[#c7894a] to-[#8c552c] text-[#1f1207]",
      radarA: "#e0ad72",
      radarB: "#c7894a",
      radarFillA: "#e0ad72",
      radarFillB: "#7e4dff",
      bar: "from-[#e0ad72] via-[#c7894a] to-violet-300",
      chip: "bg-[rgba(199,137,74,0.14)] text-[#f1c28b] ring-[rgba(199,137,74,0.24)]",
    };
  }

  return {
    label: "Preliminary",
    caption: "Silver trust engine",
    background:
      "radial-gradient(circle at 88% 12%, rgba(226, 232, 240, 0.30), transparent 28%), radial-gradient(circle at 16% 84%, rgba(126, 77, 255, 0.16), transparent 36%), linear-gradient(145deg, #313642 0%, #171522 54%, #0f0b18 100%)",
    ring: "ring-slate-100/28",
    glow: "bg-slate-200/16",
    badge: "from-slate-100 via-slate-300 to-slate-400 text-[#111827]",
    radarA: "#e2e8f0",
    radarB: "#94a3b8",
    radarFillA: "#e2e8f0",
    radarFillB: "#7e4dff",
    bar: "from-slate-200 via-slate-300 to-violet-300",
    chip: "bg-slate-100/14 text-slate-50 ring-slate-100/25",
  };
}

function TbiScoreCard({
  brand,
  profile,
  score,
  onViewBreakdown,
}: {
  brand: SavedBrand | null;
  profile: TbiProfile | null;
  score: number;
  onViewBreakdown?: () => void;
}) {
  const metrics = tbiMetricsForProfile(brand, profile, score);
  const score100 = scoreOutOf100(score);
  const center = 112;
  const radarRadius = 62;
  const stage = brand ? resolveBrandTbiState(brand, profile) : (profile?.state ?? "preliminary");
  const theme = tbiStageTheme(stage);
  const trustLabel = profile?.trustLabel || "Trust intelligence review";
  const confidence = profile?.confidence || "Preliminary confidence";

  return (
    <aside
      className={`relative self-start overflow-hidden rounded-3xl p-5 text-white shadow-2xl shadow-black/25 ring-1 ${theme.ring}`}
      style={{ background: theme.background }}
    >
      <div className={`absolute -right-20 -top-20 h-56 w-56 rounded-full ${theme.glow} blur-3xl`} />
      <div className="absolute inset-x-6 top-0 h-px bg-white/25" />
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-white/65">
              TBI Score
            </div>
            <span
              className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] ring-1 ${theme.chip}`}
            >
              {theme.label}
            </span>
          </div>
          <div className="mt-5 flex items-end gap-2">
            <span className="text-5xl font-black leading-none text-white">
              {score100.toFixed(2)}
            </span>
            <span className="pb-1 text-xl text-white/65">/100</span>
          </div>
          <div className="mt-2 text-xs text-white/70">
            {trustLabel} · {theme.caption}
          </div>
        </div>
        <div
          className={`grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br ${theme.badge} ring-1 ring-white/30`}
          style={theme.badgeStyle}
        >
          <BadgeCheck className="h-5 w-5" />
        </div>
      </div>

      <div className="relative mt-4 overflow-hidden rounded-2xl bg-black/[0.12] ring-1 ring-white/10">
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:28px_28px] opacity-30" />
        <svg
          viewBox="0 0 224 224"
          role="img"
          aria-label={`${brand?.name ?? "Brand"} TBI component radar`}
          className="relative mx-auto h-44 w-full max-w-[300px] motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95 motion-safe:duration-700 sm:h-48"
        >
          <defs>
            <radialGradient id="tbiSummaryRadarGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={theme.radarFillA} stopOpacity="0.92" />
              <stop offset="100%" stopColor={theme.radarFillB} stopOpacity="0.24" />
            </radialGradient>
            <linearGradient id="tbiSummaryRadarStroke" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stopColor={theme.radarA} />
              <stop offset="100%" stopColor={theme.radarB} />
            </linearGradient>
          </defs>

          {[0.25, 0.5, 0.75, 1].map((step) => (
            <polygon
              key={step}
              points={polygonPoints(metrics.length, radarRadius * step, center)}
              fill="none"
              stroke="rgba(255,255,255,0.17)"
              strokeWidth="1"
            />
          ))}
          {metrics.map((metric, index) => {
            const angle = -Math.PI / 2 + (index * 2 * Math.PI) / metrics.length;
            return (
              <line
                key={metric.key}
                x1={center}
                y1={center}
                x2={center + Math.cos(angle) * radarRadius}
                y2={center + Math.sin(angle) * radarRadius}
                stroke="rgba(255,255,255,0.14)"
                strokeWidth="1"
              />
            );
          })}
          <polygon
            points={valuePolygonPoints(metrics, radarRadius, center)}
            fill="url(#tbiSummaryRadarGlow)"
            stroke="url(#tbiSummaryRadarStroke)"
            strokeWidth="2"
            className="transition-all duration-700 ease-out"
          />
          {metrics.map((metric, index) => {
            const angle = -Math.PI / 2 + (index * 2 * Math.PI) / metrics.length;
            const dotRadius = radarRadius * (metric.value / 10);
            const labelRadius = 88;
            const labelX = center + Math.cos(angle) * labelRadius;
            const labelY = center + Math.sin(angle) * labelRadius;
            return (
              <g key={metric.key}>
                <title>{`${metric.label}: ${metric.value.toFixed(1)}/10`}</title>
                <circle
                  cx={center + Math.cos(angle) * dotRadius}
                  cy={center + Math.sin(angle) * dotRadius}
                  r="3"
                  fill={theme.radarA}
                  stroke="#fff"
                  strokeWidth="1"
                  className="transition-all duration-700 ease-out"
                />
                <text
                  x={labelX}
                  y={labelY}
                  textAnchor={
                    labelX > center + 10 ? "start" : labelX < center - 10 ? "end" : "middle"
                  }
                  dominantBaseline="middle"
                  fill="rgba(255,255,255,0.72)"
                  fontSize="9"
                  fontWeight="700"
                >
                  {metric.short}
                </text>
              </g>
            );
          })}
          <circle cx={center} cy={center} r="5" fill={theme.radarA} stroke="#fff" strokeWidth="2" />
        </svg>
      </div>

      <div className="relative mt-5 overflow-hidden rounded-2xl bg-black/[0.12] p-4 ring-1 ring-white/10">
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:32px_32px] opacity-30" />
        <div className="relative">
          <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/50">
            Trust summary
          </div>
          <p className="mt-2 text-sm font-semibold leading-6 text-white/90">{trustLabel}</p>
          <p className="mt-1 text-xs leading-5 text-white/62">
            {confidence}. Open the complete breakdown for methodology, component scores,
            weighted reviews, and complaint impact.
          </p>
        </div>
      </div>

      {onViewBreakdown ? (
        <button
          type="button"
          onClick={onViewBreakdown}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-[#1a0b2e] transition duration-200 hover:bg-white/90 active:scale-[0.99]"
        >
          <ListChecks className="h-4 w-4" />
          View Full TBI Breakdown
        </button>
      ) : null}
    </aside>
  );
}

function safeDecode(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function slugifyLookup(value: string) {
  return safeDecode(value)
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function brandLookupCandidates(slugOrName: string) {
  const decoded = safeDecode(slugOrName).trim();
  const slug = slugifyLookup(decoded);
  const displayName = decoded.replace(/-/g, " ").trim();
  const stripped = slug
    .replace(/-(pro|broker|exchange)$/i, "")
    .replace(/-(stellar|standard|classic|challenge)$/i, "")
    .replace(/-trader-funding$/i, "");

  return Array.from(
    new Set(
      [slug, stripped, slugOrName, decoded, displayName, slugifyLookup(displayName)]
        .map((value) => String(value || "").trim())
        .filter(Boolean),
    ),
  );
}

const FALLBACK_REBATE_PCT: Record<string, number> = {
  exness: 60,
  "ic-markets": 55,
  pepperstone: 50,
  fundingpips: 60,
  ftmo: 80,
  the5ers: 40,
  myforexfunds: 35,
  bybit: 40,
  binance: 35,
  okx: 30,
  apex: 45,
};

function fallbackBrandFromStaticData(candidates: string[]): SavedBrand | null {
  const targets = new Set(candidates.map((candidate) => slugifyLookup(candidate)));
  const tbiBrand = TBI_BRANDS.find(
    (candidate) =>
      targets.has(candidate.slug) ||
      targets.has(slugifyLookup(candidate.name)) ||
      candidate.slug.split("-").some((part) => targets.has(part)),
  );

  if (!tbiBrand) return null;

  return {
    name: tbiBrand.name,
    slug: tbiBrand.slug,
    category: tbiBrand.category,
    website: `https://${tbiBrand.website}`,
    tbi: tbiBrand.score,
    identity: {
      hq: tbiBrand.country,
      tagline: tbiBrand.tag,
    },
    cashback: FALLBACK_REBATE_PCT[tbiBrand.slug]
      ? { maxPct: FALLBACK_REBATE_PCT[tbiBrand.slug] }
      : undefined,
  };
}

function useSavedBrand(slugOrName: string, token?: string | null) {
  const [brand, setBrand] = useState<SavedBrand | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    setLoading(true);
    const candidates = brandLookupCandidates(slugOrName);
    const targets = new Set(candidates.map((candidate) => candidate.trim().toLowerCase()));
    const findCachedBrand = () => {
      if (typeof window === "undefined") return null;
      try {
        const adminRaw = sessionStorage.getItem("rb-admin:brands");
        const publicRaw = localStorage.getItem(publicForexPropFirmCacheKey);
        const adminList: SavedBrand[] = adminRaw ? JSON.parse(adminRaw) : [];
        const publicList: SavedBrand[] = publicRaw ? JSON.parse(publicRaw) : [];
        const list = [...publicList, ...adminList].filter(
          (brand) => !brand.visibility || brand.visibility === "published",
        );
        return (
          list.find(
            (b) =>
              (b.slug && targets.has(b.slug.toLowerCase())) ||
              (b.name && targets.has(b.name.trim().toLowerCase())) ||
              (b.name && targets.has(slugifyLookup(b.name))),
          ) ?? null
        );
      } catch {
        return null;
      }
    };
    const fallbackBrand = () => fallbackBrandFromStaticData(candidates);

    setBrand(findCachedBrand() ?? fallbackBrand());
    async function fetchBrand() {
      for (const candidate of candidates) {
        try {
          const payload = await fetchPublicAdminBrand(candidate, token);
          if (active && payload) {
            setBrand(payload as unknown as SavedBrand);
            setLoading(false);
            return;
          }
        } catch {
          // Try the next reasonable slug/name variant before falling back to cached data.
        }
      }

      if (active) {
        setBrand((current) => current ?? findCachedBrand() ?? fallbackBrand());
        setLoading(false);
      }
    }

    fetchBrand().catch(() => {
      if (active) {
        setBrand((current) => current ?? findCachedBrand() ?? fallbackBrand());
        setLoading(false);
      }
    });

    return () => {
      active = false;
    };
  }, [slugOrName, token]);
  return { brand, loading };
}

function offerMatchesBrand(offer: AdminOffer, brand: SavedBrand | null, slugOrName: string) {
  if (brand?.id && offer.brandId && String(offer.brandId) === String(brand.id)) return true;

  const targets = new Set(
    [...brandLookupCandidates(slugOrName), brand?.slug, brand?.name]
      .map((value) => slugifyLookup(String(value || "")))
      .filter(Boolean),
  );

  return targets.has(slugifyLookup(offer.brand));
}

function pickBrandOffer(offers: AdminOffer[], brand: SavedBrand | null, slugOrName: string) {
  return (
    offers
      .filter((offer) => offer.status === "active" && offerMatchesBrand(offer, brand, slugOrName))
      .sort((a, b) => {
        if (Boolean(a.pinned) !== Boolean(b.pinned))
          return Number(Boolean(b.pinned)) - Number(Boolean(a.pinned));
        return String(b.createdAt ?? "").localeCompare(String(a.createdAt ?? ""));
      })[0] ?? null
  );
}

function usePublicBrandOffer(brand: SavedBrand | null, slugOrName: string) {
  const [offer, setOffer] = useState<AdminOffer | null>(null);

  useEffect(() => {
    let active = true;
    setOffer(null);

    fetchPublicOffers()
      .then((offers) => {
        if (active) setOffer(pickBrandOffer(offers, brand, slugOrName));
      })
      .catch(() => {
        if (active) setOffer(null);
      });

    return () => {
      active = false;
    };
  }, [brand, slugOrName]);

  return offer;
}

const sectionIconMap: Record<string, LucideIcon> = {
  Overview: Info,
  "Trading Rules": ClipboardCheck,
  "Scaling Plan": LineChart,
  "Profit Split & Payout": CircleDollarSign,
  "Cashback / Rebate": WalletCards,
  "Fees and Pricing": ReceiptText,
  "Supported Instrument & Leverage": Gauge,
  "Platform & Technology": MonitorCog,
  "Community & Education": BookOpen,
  "Regulation and Trust": ShieldCheck,
  "Customer Support": Headphones,
  "Restricted Countries": Ban,
  "Pros & Cons": ThumbsUp,
  "TBI Breakdown": ListChecks,
};

const BRAND_PROFILE_STICKY_GAP = 6;
const BRAND_PROFILE_TAB_TO_SECTION_GAP = 10;
const BRAND_PROFILE_HEADER_FALLBACK = 172;

function FormattedText({ value, className = "" }: { value: string; className?: string }) {
  const raw = String(value || "");
  const shouldSplitInline =
    !/^https?:\/\//i.test(raw.trim()) && /(?:\r?\n|;|\s\|\s)/.test(raw);
  const lines = raw
    .split(shouldSplitInline ? /\r?\n|;|\s\|\s/ : /\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length <= 1) return <span className={className}>{raw}</span>;

  return (
    <div className={`space-y-1.5 ${className}`}>
      {lines.map((line, index) => {
        const withoutBullet = line.replace(/^[-•*]\s*/, "");
        const isBullet = withoutBullet !== line || /^\d+[.)]\s+/.test(line);

        if (!isBullet) return <p key={`${line}-${index}`}>{line}</p>;

        return (
          <div key={`${line}-${index}`} className="flex gap-2">
            <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-violet-300" />
            <span>{withoutBullet}</span>
          </div>
        );
      })}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const Icon = sectionIconMap[title] ?? ListChecks;

  return (
    <section className="border-b border-white/10 py-8 first:pt-0 last:border-b-0 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-3 motion-safe:duration-500">
      <div className="mb-5 flex items-center gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-violet-500/12 text-violet-200 ring-1 ring-violet-300/25">
          <Icon className="h-4 w-4" />
        </span>
        <h3 className="text-xl font-bold tracking-tight text-white sm:text-2xl">{title}</h3>
      </div>
      {children}
    </section>
  );
}

function EmptyBlock({ children = "Not available" }: { children?: React.ReactNode }) {
  return (
    <div className="rounded-xl border-2 border-dashed border-white/10 bg-white/5 p-6 text-center text-[11px] text-muted-foreground">
      {children}
    </div>
  );
}

function VideoReviewCard({ name, url }: { name: string; url: string }) {
  const thumbnail = youtubeThumbnailUrl(url);
  const hasVideo = Boolean(url);
  const inner = (
    <div className="group relative aspect-video overflow-hidden rounded-2xl bg-gradient-to-br from-violet-500/25 via-violet-600/20 to-sky-500/15 ring-1 ring-white/10">
      {thumbnail ? (
        <img
          src={thumbnail}
          alt={`${name} video review thumbnail`}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
          loading="lazy"
        />
      ) : null}
      <div className="absolute inset-0 bg-gradient-to-t from-[#12061f]/80 via-[#12061f]/10 to-transparent" />
      <div className="absolute inset-0 grid place-items-center">
        <span className="grid h-14 w-14 place-items-center rounded-full bg-white text-[#1a0b2e] shadow-[0_0_32px_rgba(255,255,255,0.25)] transition group-hover:scale-105">
          <Play className="ml-0.5 h-6 w-6 fill-current" />
        </span>
      </div>
      <div className="absolute inset-x-0 bottom-0 p-4">
        <div className="text-xs font-semibold text-white">
          {hasVideo ? "Watch video review" : "Video review unavailable"}
        </div>
      </div>
    </div>
  );

  if (!hasVideo) return inner;

  return (
    <a href={url} target="_blank" rel="noreferrer" aria-label={`Watch ${name} video review`}>
      {inner}
    </a>
  );
}

function InfoRows({ rows }: { rows: ProfileRow[] }) {
  if (!rows.length) return <EmptyBlock />;

  return (
    <div className="overflow-hidden border-y border-white/10">
      <dl className="divide-y divide-white/10 text-sm">
        {rows.map((row) => (
          <div
            key={`${row.label}-${row.value}`}
            className="grid gap-2 py-3 sm:grid-cols-[190px_1fr]"
          >
            <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-white/45">
              {row.label}
            </dt>
            <dd className="min-w-0 break-words font-medium leading-relaxed text-white/86">
              <FormattedText value={row.value} />
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function DataCard({ card, index }: { card: ProfileCard; index: number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4 transition duration-300 hover:border-violet-300/30 hover:bg-white/[0.04]">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-violet-500/12 text-[10px] font-bold text-violet-100 ring-1 ring-violet-300/20">
          {index + 1}
        </span>
        <div className="min-w-0">
          <div className="text-sm font-semibold text-white">{card.title}</div>
          <div className="mt-1 text-xs leading-relaxed text-white/68">
            <FormattedText value={card.body} />
          </div>
          {card.meta ? (
            <div className="mt-3 inline-flex rounded-full bg-violet-500/15 px-2.5 py-1 text-[10px] font-bold text-violet-100 ring-1 ring-violet-300/20">
              {card.meta}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function CardGrid({
  cards,
  columns = "lg:grid-cols-4",
}: {
  cards: ProfileCard[];
  columns?: string;
}) {
  if (!cards.length) return <EmptyBlock />;

  return (
    <div className={`grid gap-3 sm:grid-cols-2 ${columns}`}>
      {cards.map((card, index) => (
        <DataCard key={`${card.title}-${index}`} card={card} index={index} />
      ))}
    </div>
  );
}

function CardRows({ cards }: { cards: ProfileCard[] }) {
  return (
    <InfoRows
      rows={cards.map((card) => ({
        label: card.title,
        value: card.meta ? `${card.body}; ${card.meta}` : card.body,
      }))}
    />
  );
}

function LogoChip({ item }: { item: ProfileLogoItem }) {
  const [failed, setFailed] = useState(false);
  const initials = item.name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <span className="inline-flex min-h-11 max-w-full items-center gap-2 rounded-xl bg-white/[0.04] px-3 py-2 text-[11px] font-semibold text-white/85 ring-1 ring-white/10">
      {item.logo && !failed ? (
        <span className="grid h-7 w-7 shrink-0 place-items-center overflow-hidden rounded-lg bg-white/[0.06] ring-1 ring-white/10">
          <img
            src={item.logo}
            alt=""
            className="h-6 w-6 object-contain"
            loading="lazy"
            onError={() => setFailed(true)}
          />
        </span>
      ) : (
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-violet-500/20 text-[10px] font-black text-violet-100 ring-1 ring-violet-300/20">
          {initials || "RB"}
        </span>
      )}
      <span className="min-w-0 truncate">{item.name}</span>
    </span>
  );
}

function LogoChipList({ title, items }: { title: string; items: ProfileLogoItem[] }) {
  return (
    <div>
      <div className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-white/45">
        {title}
      </div>
      {items.length ? (
        <div className="flex flex-wrap gap-2">
          {items.map((item) => (
            <LogoChip key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <div className="text-[11px] text-muted-foreground">Not provided</div>
      )}
    </div>
  );
}

function CountryChip({ country }: { country: ProfileCountry }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-white/[0.045] px-3 py-1.5 text-xs font-semibold text-white/86 ring-1 ring-white/10">
      {country.flag ? <span className="text-base leading-none">{country.flag}</span> : null}
      <span>{country.name}</span>
    </span>
  );
}

function RuleList({ rules }: { rules: ProfileRule[] }) {
  const [open, setOpen] = useState<string | null>(null);

  if (!rules.length) return null;

  return (
    <div className="mt-6 divide-y divide-white/10 border-y border-white/10">
      {rules.map((rule, index) => {
        const id = `${rule.question}-${index}`;
        const isOpen = open === id || (open === rule.question && index === 0);
        return (
        <div
          key={id}
          className="transition-colors hover:bg-white/[0.025]"
        >
          <button
            type="button"
            onClick={() => setOpen(isOpen ? null : id)}
            className="flex w-full items-center justify-between gap-4 py-4 text-left"
            aria-expanded={isOpen}
          >
            <span className="text-sm font-semibold text-white">{rule.question}</span>
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white/[0.04] text-white/70 ring-1 ring-white/10">
              <ChevronDown
                className={`h-4 w-4 transition-transform duration-300 ${
                  isOpen ? "rotate-180 text-violet-200" : ""
                }`}
              />
            </span>
          </button>
          <div
            className={`grid transition-all duration-300 ease-out ${
              isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
            }`}
          >
            <div className="overflow-hidden">
              <p className="pb-4 pr-12 text-xs leading-relaxed text-white/68">{rule.answer}</p>
            </div>
          </div>
        </div>
        );
      })}
    </div>
  );
}

function ProsConsList({
  label,
  tone,
  items,
}: {
  label: string;
  tone: "pro" | "con";
  items: string[];
}) {
  const isPro = tone === "pro";

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
      <div
        className={`mb-2 inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold ring-1 ${
          isPro
            ? "bg-emerald-500/20 text-emerald-50 ring-emerald-400/30"
            : "bg-rose-500/20 text-rose-50 ring-rose-400/30"
        }`}
      >
        {isPro ? <BadgeCheck className="h-3.5 w-3.5" /> : <Ban className="h-3.5 w-3.5" />}
        {label}
      </div>
      {items.length ? (
        <ul className="space-y-2">
          {items.map((item) => (
            <li
              key={item}
              className="flex gap-2 text-xs leading-relaxed text-white/75"
            >
              {isPro ? (
                <BadgeCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-300" />
              ) : (
                <Ban className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-300" />
              )}
              <span>{item}</span>
            </li>
          ))}
        </ul>
      ) : (
        <div className="text-[11px] text-muted-foreground">Not provided</div>
      )}
    </div>
  );
}

function TbiIndexContent({
  brand,
  profile,
  score,
}: {
  brand: SavedBrand | null;
  profile: TbiProfile | null;
  score: number;
}) {
  const metrics = tbiMetricsForProfile(brand, profile, score);
  const componentBreakdown =
    profile?.componentBreakdown?.length
      ? profile.componentBreakdown
      : metrics.map((metric) => ({
          key: metric.key,
          code: metric.short,
          label: metric.label,
          score: metric.value,
          weight: metric.weight,
          weightDecimal: metric.weight / 100,
          contribution: Number((metric.value * (metric.weight / 100)).toFixed(2)),
          explanation: profile?.componentExplanations?.[metric.key] ?? "Calculated from available brand data.",
          source: "Brand trust profile",
        }));
  const reviewStats = profile?.reviewStats;
  const reviewRows = reviewStats?.rows ?? [];
  const ratingDistribution = profile?.ratingDistribution ?? [];
  const complaintStats = profile?.complaintStats;
  const riskFlags = profile?.activeRiskFlags ?? profile?.riskEvents ?? [];
  const formulaParts =
    profile?.trustEngine?.formulaParts ??
    componentBreakdown.map((component) => ({
      code: component.code,
      label: component.label,
      score: component.score,
      weight: component.weightDecimal,
      contribution: component.contribution,
      display: `(${component.score} x ${component.weightDecimal.toFixed(2)})`,
    }));
  const scoreStateLabel =
    profile?.scoreStateLabel ??
    (profile?.state === "full" ? "Full TBI" : profile?.state === "partial" ? "Partial" : "Preliminary");
  const updatedAt = profile?.lastUpdated
    ? new Date(profile.lastUpdated).toLocaleString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "Not provided";
  const rawScore = Number(profile?.rawScore ?? 0);
  const confidenceFactor = Number(profile?.confidenceFactor ?? 0);
  const riskPenalty = Number(profile?.riskPenalty ?? 0);
  const finalScore = Number(profile?.finalScore ?? score);
  const computedFinalScore = Number(
    profile?.trustEngine?.calculation?.computedFinalScore ?? profile?.trustEngine?.computedFinalScore ?? finalScore,
  );
  const scoreSource = profile?.trustEngine?.scoreSource ?? profile?.trustEngine?.calculation?.scoreSource ?? "formula";
  const finalScoreNote =
    profile?.trustEngine?.finalScoreNote ??
    profile?.trustEngine?.calculation?.finalScoreNote ??
    "Final TBI is calculated from the weighted component formula.";
  const formulaText = `${profile?.trustEngine?.formula ?? "TBI = (UT x 0.30) + (PR x 0.25) + (TS x 0.15) + (RC x 0.10) + (TC x 0.10) + (CX x 0.10)"}\n${formulaParts
    .map((part) => part.display)
    .join(" + ")}\nRaw Score: ${rawScore.toFixed(2)}\nConfidence Factor: ${confidenceFactor.toFixed(2)}\nRisk Penalty: ${riskPenalty.toFixed(2)}\nFormula Score: ${computedFinalScore.toFixed(2)} / 10\nFinal TBI: ${finalScore.toFixed(2)} / 10\nScore Source: ${scoreSource}\n${finalScoreNote}`;
  const summaryItems = [
    { label: "Final TBI", value: `${finalScore.toFixed(2)} / 10` },
    { label: "Trust label", value: profile?.trustLabel ?? "Not provided" },
    { label: "Confidence", value: profile?.confidence ?? "Not provided" },
    { label: "Score state", value: scoreStateLabel },
    { label: "Last updated", value: updatedAt },
    { label: "Reviews used", value: String(profile?.reviewCount ?? 0) },
    { label: "Verified reviews", value: String(profile?.verifiedReviewCount ?? 0) },
    { label: "Complaints", value: String(profile?.complaints?.total ?? 0) },
  ];

  return (
    <div className="mt-4 min-w-0">
        <Section title="TBI Breakdown">
          <div className="mb-5 rounded-2xl bg-white/[0.035] p-4 ring-1 ring-white/10">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="text-sm font-bold text-white">Transparency & Trust Center</div>
                <p className="mt-1 max-w-2xl text-xs leading-6 text-muted-foreground">
                  This view uses the backend TBI engine values, approved reviews, and complaint records to explain why this brand has its current score.
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigator.clipboard?.writeText(formulaText)}
                className="inline-flex items-center gap-2 rounded-full bg-white/[0.06] px-3 py-1.5 text-[11px] font-semibold text-white ring-1 ring-white/10 transition hover:bg-white/[0.1]"
              >
                <Copy className="h-3.5 w-3.5" /> Copy Formula
              </button>
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
              {summaryItems.map((item) => (
                <div key={item.label} className="rounded-xl bg-black/15 p-3 ring-1 ring-white/10">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    {item.label}
                  </div>
                  <div className="mt-1 text-sm font-bold text-white">{item.value}</div>
                </div>
              ))}
            </div>
            <div className="mt-3 text-[11px] leading-5 text-muted-foreground">
              Pending and rejected reviews are excluded from TBI. Complaint penalties are applied only when the backend trust engine has active risk events.
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {componentBreakdown.map((metric) => (
              <div key={metric.key} className="rounded-xl bg-white/[0.04] p-3 ring-1 ring-white/10">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-[11px] font-semibold text-white">{metric.label}</div>
                    <div className="mt-1 text-[10px] text-muted-foreground">
                      {metric.code} · {metric.weight}% weight · {metric.contribution.toFixed(2)} contribution
                    </div>
                  </div>
                  <div className="text-lg font-black">{Number(metric.score).toFixed(1)}</div>
                </div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
                  <span
                    className="block h-full rounded-full bg-gradient-to-r from-slate-200 via-sky-300 to-violet-300"
                    style={{ width: `${Math.min(100, Number(metric.score) * 10)}%` }}
                  />
                </div>
                <p className="mt-3 text-[11px] leading-5 text-muted-foreground">{metric.explanation}</p>
                <div className="mt-2 rounded-lg bg-black/15 px-2.5 py-2 text-[10px] text-white/60 ring-1 ring-white/10">
                  Source: {metric.source}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-2xl bg-white/[0.035] p-4 ring-1 ring-white/10">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-sm font-bold text-white">Formula Transparency</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  The formula below is returned by the backend. Manual or preliminary final scores are clearly marked.
                </div>
              </div>
              <div className="rounded-full bg-violet-500/12 px-3 py-1 text-[11px] font-semibold text-violet-100 ring-1 ring-violet-300/20">
                Verify this score
              </div>
            </div>
            <div className="mt-4 rounded-xl bg-black/20 p-3 font-mono text-[11px] leading-6 text-white/80 ring-1 ring-white/10">
              <div>{profile?.trustEngine?.formula ?? "TBI = (UT x 0.30) + (PR x 0.25) + (TS x 0.15) + (RC x 0.10) + (TC x 0.10) + (CX x 0.10)"}</div>
              <div className="mt-2 text-violet-100">{formulaParts.map((part) => part.display).join(" + ")}</div>
              <div className="mt-2 grid gap-1 sm:grid-cols-2">
                <span>Raw Score: {rawScore.toFixed(2)}</span>
                <span>Confidence Factor: {confidenceFactor.toFixed(2)}</span>
                <span>Risk Penalty: {riskPenalty.toFixed(2)}</span>
                <span>Formula Score: {computedFinalScore.toFixed(2)} / 10</span>
                <span>Final TBI: {finalScore.toFixed(2)} / 10</span>
              </div>
              <div className="mt-3 rounded-lg bg-white/[0.05] px-3 py-2 text-[11px] leading-5 text-muted-foreground ring-1 ring-white/10">
                <span className="font-semibold text-white">Score source: {scoreSource}</span> · {finalScoreNote}
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-2xl bg-white/[0.035] p-4 ring-1 ring-white/10">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-sm font-bold text-white">Review Weight Breakdown</div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Approved reviews only. Verified, active, and recent traders carry more trust weight.
                </p>
              </div>
              <div className="rounded-full bg-white/[0.06] px-3 py-1 text-[11px] font-semibold text-white ring-1 ring-white/10">
                Weighted rating {Number(reviewStats?.weightedRating ?? 0).toFixed(2)}
              </div>
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-3 xl:grid-cols-6">
              {[
                ["Total", reviewStats?.totalReviews ?? 0],
                ["Verified", reviewStats?.verifiedTraderReviews ?? 0],
                ["Active", reviewStats?.activeTraderReviews ?? 0],
                ["Recent", reviewStats?.recentReviews ?? 0],
                ["Old", reviewStats?.oldReviews ?? 0],
                ["Weight mass", reviewStats?.totalWeight ?? 0],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl bg-black/15 p-3 ring-1 ring-white/10">
                  <div className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">{label}</div>
                  <div className="mt-1 text-sm font-black text-white">{String(value)}</div>
                </div>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-[10px] text-white/65">
              <span className="rounded-full bg-white/[0.05] px-2.5 py-1 ring-1 ring-white/10">Base review weight = 1.0</span>
              <span className="rounded-full bg-white/[0.05] px-2.5 py-1 ring-1 ring-white/10">Verified Trader = x2.0</span>
              <span className="rounded-full bg-white/[0.05] px-2.5 py-1 ring-1 ring-white/10">Active Trader = x1.5</span>
              <span className="rounded-full bg-white/[0.05] px-2.5 py-1 ring-1 ring-white/10">Recent Review = x1.2</span>
              <span className="rounded-full bg-white/[0.05] px-2.5 py-1 ring-1 ring-white/10">Old Review = x0.7</span>
            </div>

            {reviewRows.length ? (
              <div className="mt-4 overflow-hidden rounded-xl ring-1 ring-white/10">
                <div className="hidden overflow-x-auto md:block">
                  <table className="min-w-full divide-y divide-white/10 text-left text-xs">
                    <thead className="bg-white/[0.04] text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                      <tr>
                        <th className="px-3 py-2">Reviewer</th>
                        <th className="px-3 py-2">Rating</th>
                        <th className="px-3 py-2">Verification</th>
                        <th className="px-3 py-2">Activity</th>
                        <th className="px-3 py-2">Recency</th>
                        <th className="px-3 py-2">Weight</th>
                        <th className="px-3 py-2">Weighted</th>
                        <th className="px-3 py-2">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {reviewRows.slice(0, 12).map((row) => (
                        <tr key={row.id} className="text-white/80">
                          <td className="px-3 py-2 font-semibold text-white">{row.reviewer}</td>
                          <td className="px-3 py-2">{Number(row.score).toFixed(1)}/10</td>
                          <td className="px-3 py-2">{row.verificationStatus}</td>
                          <td className="px-3 py-2">{row.activityStatus}</td>
                          <td className="px-3 py-2">{row.recency}</td>
                          <td className="px-3 py-2">{Number(row.weight).toFixed(2)}</td>
                          <td className="px-3 py-2">{Number(row.weightedScore).toFixed(2)}</td>
                          <td className="px-3 py-2">{row.reviewStatus}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="grid gap-2 p-2 md:hidden">
                  {reviewRows.slice(0, 8).map((row) => (
                    <div key={row.id} className="rounded-lg bg-black/15 p-3 ring-1 ring-white/10">
                      <div className="flex items-center justify-between gap-3">
                        <div className="font-semibold text-white">{row.reviewer}</div>
                        <div className="text-xs font-bold text-violet-100">{Number(row.score).toFixed(1)}/10</div>
                      </div>
                      <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] text-muted-foreground">
                        <span>{row.verificationStatus}</span>
                        <span>{row.activityStatus}</span>
                        <span>{row.recency}</span>
                        <span>Weight {Number(row.weight).toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <EmptyBlock>No approved reviews are available yet.</EmptyBlock>
            )}
          </div>

          <div className="mt-4 grid gap-4 xl:grid-cols-2">
            <div className="rounded-2xl bg-white/[0.035] p-4 ring-1 ring-white/10">
              <div className="text-sm font-bold text-white">Rating Distribution</div>
              <div className="mt-3 space-y-2">
                {ratingDistribution.length ? (
                  ratingDistribution.map((item) => (
                    <div key={item.rating} className="grid grid-cols-[42px_1fr_46px] items-center gap-2 text-xs">
                      <div className="font-semibold text-white">{item.rating}/10</div>
                      <div className="h-2 overflow-hidden rounded-full bg-white/10">
                        <span
                          className="block h-full rounded-full bg-gradient-to-r from-violet-300 to-violet-400"
                          style={{ width: `${Math.min(100, item.percentage)}%` }}
                        />
                      </div>
                      <div className="text-right text-muted-foreground">{item.count}</div>
                    </div>
                  ))
                ) : (
                  <EmptyBlock>No rating distribution is available yet.</EmptyBlock>
                )}
              </div>
            </div>

            <div className="rounded-2xl bg-white/[0.035] p-4 ring-1 ring-white/10">
              <div className="text-sm font-bold text-white">Complaints & Risk Impact</div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {[
                  ["Total", complaintStats?.total ?? 0],
                  ["Open", complaintStats?.open ?? 0],
                  ["Resolved", complaintStats?.resolved ?? 0],
                  ["Rejected", complaintStats?.rejected ?? 0],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-xl bg-black/15 p-3 ring-1 ring-white/10">
                    <div className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">{label}</div>
                    <div className="mt-1 text-sm font-black text-white">{String(value)}</div>
                  </div>
                ))}
              </div>
              <div className="mt-3 rounded-xl bg-black/15 p-3 text-xs leading-6 text-white/75 ring-1 ring-white/10">
                {complaintStats?.impactExplanation ?? "No active complaints are currently affecting this score."}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {(complaintStats?.categories ?? []).slice(0, 5).map((category) => (
                  <span key={category.label} className="rounded-full bg-white/[0.05] px-2.5 py-1 text-[10px] text-white/70 ring-1 ring-white/10">
                    {category.label}: {category.count}
                  </span>
                ))}
                {!complaintStats?.categories?.length && (
                  <span className="text-[11px] text-muted-foreground">No active complaint categories.</span>
                )}
              </div>
              <div className="mt-3 text-[11px] text-muted-foreground">
                Trend: {complaintStats?.trend ?? "Stable"} · Risk flags: {riskFlags.length}
              </div>
            </div>
          </div>
        </Section>
    </div>
  );
}

function profileSectionDomId(id: SideSectionId) {
  return `firm-profile-section-${id}`;
}

function renderSection(
  sectionId: SideSectionId,
  profile: NormalizedPropFirmProfile,
): React.ReactNode {
  switch (sectionId) {
    case "overview":
      return (
        <Section title="Overview">
          <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_360px] md:items-start">
            <p className="max-w-3xl text-sm leading-7 text-white/74 sm:text-base sm:leading-8">
              {profile.overview.description}
            </p>
            <VideoReviewCard name={profile.name} url={profile.overview.videoReviewUrl} />
          </div>
        </Section>
      );

    case "trading-rules":
      return (
        <Section title="Trading Rules">
          <InfoRows rows={profile.tradingRules} />
          <RuleList rules={profile.customRules} />
        </Section>
      );

    case "scaling-plan":
      return (
        <Section title="Scaling Plan">
          <CardGrid cards={profile.scalingCards} columns="lg:grid-cols-3" />
        </Section>
      );

    case "profit-payout":
      return (
        <Section title="Profit Split & Payout">
          <CardGrid cards={profile.payoutCards} columns="lg:grid-cols-3" />
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <LogoChipList title="Payout Methods" items={profile.payoutMethods} />
            <LogoChipList title="Withdrawal Methods" items={profile.withdrawalMethods} />
          </div>
        </Section>
      );

    case "cashback-rebate":
      return (
        <Section title="Cashback / Rebate">
          <CardGrid cards={profile.cashbackCards} columns="lg:grid-cols-4" />
          <div className="mt-6">
            <InfoRows rows={profile.cashbackRows} />
          </div>
        </Section>
      );

    case "fees-pricing":
      return (
        <Section title="Fees and Pricing">
          <CardGrid cards={profile.pricingCards} />
        </Section>
      );

    case "instruments-leverage":
      return (
        <Section title="Supported Instrument & Leverage">
          <InfoRows rows={profile.instrumentRows} />
        </Section>
      );

    case "platform-technology":
      return (
        <Section title="Platform & Technology">
          <div className="grid gap-6 md:grid-cols-2">
            <LogoChipList title="Trading Platforms" items={profile.tradingPlatforms} />
            <LogoChipList title="Payment Gateways" items={profile.paymentMethods} />
          </div>
          <div className="mt-6">
            <CardGrid cards={profile.platformCards} />
          </div>
        </Section>
      );

    case "community-education":
      return (
        <Section title="Community & Education">
          <CardRows cards={profile.communityCards} />
        </Section>
      );

    case "regulation-trust":
      return (
        <Section title="Regulation and Trust">
          <CardRows cards={profile.regulationCards} />
        </Section>
      );

    case "customer-support":
      return (
        <Section title="Customer Support">
          <InfoRows rows={profile.supportRows} />
        </Section>
      );

    case "restricted-countries":
      return (
        <Section title="Restricted Countries">
          {profile.restrictedCountries.length ? (
            <div className="flex flex-wrap gap-2">
              {profile.restrictedCountries.map((country) => (
                <CountryChip key={`${country.code}-${country.name}`} country={country} />
              ))}
            </div>
          ) : (
            <EmptyBlock>No country restrictions on file.</EmptyBlock>
          )}
        </Section>
      );

    case "pros-cons":
      return (
        <Section title="Pros & Cons">
          <div className="grid gap-3 md:grid-cols-2">
            <ProsConsList label="Pros" tone="pro" items={profile.pros} />
            <ProsConsList label="Cons" tone="con" items={profile.cons} />
          </div>
        </Section>
      );

    default:
      return null;
  }
}

function FirmDetailsSkeleton() {
  return (
    <div className="relative min-h-screen overflow-x-clip bg-[var(--rb-bg-canvas)] text-white">
      <SiteHeader />
      <div className="glow-orb h-[600px] w-[600px] -left-40 top-20 opacity-35" />
      <div className="glow-orb h-[700px] w-[700px] right-0 top-[40%] opacity-30" />
      <div className="container-app relative pb-10 pt-3 sm:pt-4">
        <div className="grid items-stretch gap-5 lg:grid-cols-[minmax(0,1fr)_390px] xl:grid-cols-[minmax(0,1fr)_440px] 2xl:grid-cols-[minmax(0,1fr)_480px]">
          <div className="glass-strong overflow-hidden rounded-3xl bg-[rgba(18,18,25,0.90)] ring-1 ring-violet-400/20">
            <div className="skeleton h-24 rounded-none sm:h-28 lg:h-32 xl:h-[136px]" />
            <div className="px-5 pb-5 sm:px-6">
              <div className="-mt-8 flex flex-col items-start gap-3 sm:-mt-11 sm:flex-row sm:items-end sm:justify-between">
                <div className="skeleton h-20 w-20 rounded-[22px] sm:h-28 sm:w-28 sm:rounded-[26px]" />
                <div className="flex w-full flex-wrap gap-2 sm:w-auto">
                  <div className="skeleton h-9 w-28 rounded-full" />
                  <div className="skeleton h-9 w-28 rounded-full" />
                </div>
              </div>
              <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
                <div className="min-w-0 space-y-3">
                  <div className="skeleton h-8 w-2/3 rounded-xl" />
                  <div className="skeleton h-4 w-full rounded-full" />
                  <div className="skeleton h-4 w-4/5 rounded-full" />
                  <div className="flex flex-wrap gap-2 pt-1">
                    <div className="skeleton h-7 w-24 rounded-full" />
                    <div className="skeleton h-7 w-28 rounded-full" />
                    <div className="skeleton h-7 w-20 rounded-full" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="skeleton h-16 rounded-2xl" />
                  <div className="skeleton h-16 rounded-2xl" />
                </div>
              </div>
            </div>
          </div>
          <div className="glass-strong rounded-3xl p-5 ring-1 ring-white/10">
            <div className="skeleton h-5 w-40 rounded-full" />
            <div className="mt-5 grid grid-cols-2 gap-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="skeleton h-20 rounded-2xl" />
              ))}
            </div>
            <div className="mt-5 skeleton h-12 rounded-2xl" />
            <div className="mt-3 skeleton h-12 rounded-2xl" />
          </div>
        </div>
        <div className="mt-5 grid gap-5 lg:grid-cols-[240px_minmax(0,1fr)]">
          <div className="glass rounded-2xl p-4 ring-1 ring-white/10">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="skeleton mb-2 h-8 rounded-full" />
            ))}
          </div>
          <div className="glass rounded-2xl p-6 ring-1 ring-white/10">
            <div className="skeleton h-7 w-52 rounded-xl" />
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="skeleton h-24 rounded-2xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PayoutsComingSoon({ firmName }: { firmName: string }) {
  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-violet-300/18 bg-[rgba(18,18,25,0.92)] p-6 text-white shadow-[0_24px_80px_rgba(0,0,0,0.28)] ring-1 ring-white/8 md:p-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(126,77,255,0.20),transparent_34%),radial-gradient(circle_at_92%_18%,rgba(90,34,241,0.14),transparent_28%)]" />
      <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-center">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-violet-500/14 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-violet-100 ring-1 ring-violet-300/24">
            <TimerReset className="h-3.5 w-3.5" />
            Payout intelligence preview
          </div>
          <h2 className="mt-4 text-2xl font-black tracking-tight md:text-3xl">
            Verified payout insights for {firmName} are being prepared.
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-white/68">
            We are preparing a premium payout transparency layer with verified payout timelines,
            proof-backed settlement data, processing windows, and reliability signals. This section
            is paused until the data source is ready, so RebateBoard does not show placeholder payout claims.
          </p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/[0.045] p-5">
          <div className="text-[10px] font-black uppercase tracking-[0.18em] text-white/42">
            Planned Signals
          </div>
          <div className="mt-4 space-y-3 text-sm text-white/72">
            {[
              "Verified payout proofs",
              "Average processing windows",
              "Method and currency breakdown",
              "Delay and dispute visibility",
            ].map((item) => (
              <div key={item} className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-violet-300" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function FirmDetailsPage() {
  const { firmId } = Route.useParams();
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const { brand, loading: brandLoading } = useSavedBrand(firmId, token);
  const publishedOffer = usePublicBrandOffer(brand, firmId);
  const name = brand?.name ?? decodeURIComponent(firmId).replace(/-/g, " ");
  const profileData = normalizePropFirmProfile(brand, name);
  const [activeIdx, setActiveIdx] = useState(0);
  const isPropFirm = isPropFirmCategory(brand?.category);
  const topTabs = useMemo<BrandTopTab[]>(() => {
    const tabs: BrandTopTab[] = ["Overview", "Reviews"];
    if (isPropFirm) tabs.push("Funding Programs", "Payouts");
    tabs.push("Complaints", "Offers", "Announcement", "TBI Breakdown");
    return tabs;
  }, [isPropFirm]);
  const [topTab, setTopTab] = useState<BrandTopTab>("Overview");
  const tabsRef = useRef<HTMLDivElement>(null);
  const [stickyMetrics, setStickyMetrics] = useState({
    headerHeight: BRAND_PROFILE_HEADER_FALLBACK,
    tabsHeight: 48,
  });
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [profileAssets, setProfileAssets] = useState<ProfileAssets>(() =>
    readStoredProfileAssets(firmId),
  );
  const [assetOverrides, setAssetOverrides] = useState<ProfileAssets>({});
  const [profileAssetsFor, setProfileAssetsFor] = useState(firmId);
  const [followState, setFollowState] = useState({ followersCount: 0, isFollowing: false });
  const [followBusy, setFollowBusy] = useState(false);
  const [brandOwnerSession, setBrandOwnerSession] = useState<BrandOwnerSession | null>(() =>
    readBrandOwnerSession(),
  );
  const [copiedCode, setCopiedCode] = useState(false);
  const [uploadingAsset, setUploadingAsset] = useState<keyof ProfileAssets | null>(null);
  const [tbiProfile, setTbiProfile] = useState<TbiProfile | null>(null);

  const logoInitials = (brand?.name ?? name)
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 3)
    .toUpperCase();
  const displayAvatar = resolveMediaUrl(
    assetOverrides.avatar,
    brand?.thumbnail,
    profileAssets.avatar,
  );
  const displayBanner = resolveMediaUrl(assetOverrides.banner, brand?.cover, profileAssets.banner);
  const handle = `@${(brand?.slug || firmId).replace(/[^a-z0-9_-]/gi, "").toLowerCase()}`;
  const supportEmail = brand?.identity?.supportEmail || "";
  const profileOffer = profileOfferInfo(brand, publishedOffer);
  const signupUrl =
    profileOffer.ctaUrl ||
    externalUrl(
      firstMeaningful(brand?.cashback?.affiliateLink, brand?.website, brand?.identity?.website),
    );
  const brandTbiScore = normalizeTbiScore(
    Number(
      brand?.trust?.tbiScore100 ?? brand?.trust?.tbiScore ?? brand?.trust?.tbi ?? brand?.tbi ?? 73,
    ),
  );
  const tbiScore = tbiProfile
    ? normalizeTbiScore(Number(tbiProfile.finalScore || tbiProfile.preliminaryScore || 0))
    : brandTbiScore;
  const country = resolveCountryDisplay(
    brand?.identity?.country,
    brand?.identity?.hq,
    brand?.profile?.country,
  );
  const xUrl = socialUrl(brand?.founder?.founderX, "x");
  const linkedInUrl = socialUrl(brand?.founder?.founderLi, "linkedin");
  const brandSlug = brand?.slug || firmId;
  const reviewHref = buildReviewHref(brandSlug, brand?.category);
  const tbiStage = brand
    ? resolveBrandTbiState(brand, tbiProfile)
    : (tbiProfile?.state ?? "preliminary");
  const isAdmin = isAdminRole(user?.role);
  const isBrandOwner = brandOwnerSession?.slug?.toLowerCase() === brandSlug.toLowerCase();
  const canEditProfile = isAdmin || isBrandOwner;
  const followerCount = compactCount(followState.followersCount);
  const stickyTabsTop = stickyMetrics.headerHeight + BRAND_PROFILE_STICKY_GAP;
  const stickySidebarTop =
    stickyTabsTop + stickyMetrics.tabsHeight + BRAND_PROFILE_TAB_TO_SECTION_GAP;
  const backToListingsPath = listingPathForCategory(brand?.category);

  useEffect(() => {
    setProfileAssets(readStoredProfileAssets(firmId));
    setAssetOverrides({});
    setProfileAssetsFor(firmId);
    setFollowState({ followersCount: 0, isFollowing: false });
    setBrandOwnerSession(readBrandOwnerSession());
  }, [firmId]);

  useEffect(() => {
    setFollowState({
      followersCount: Number(brand?.followersCount ?? 0),
      isFollowing: Boolean(brand?.isFollowing),
    });
  }, [brand?.id, brand?.followersCount, brand?.isFollowing]);

  useEffect(() => {
    if (profileAssetsFor === firmId) writeStoredProfileAssets(firmId, profileAssets);
  }, [firmId, profileAssets, profileAssetsFor]);

  useEffect(() => {
    let active = true;
    const slug = brand?.slug || firmId;
    setTbiProfile(null);

    fetchTbiBrand(slug)
      .then((profile) => {
        if (active) setTbiProfile(profile);
      })
      .catch(() => {
        if (active) setTbiProfile(null);
      });

    return () => {
      active = false;
    };
  }, [brand?.slug, firmId]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const header =
      document.querySelector<HTMLElement>("[data-site-header-surface]") ??
      document.querySelector<HTMLElement>("[data-site-header]") ??
      document.querySelector<HTMLElement>("header.fixed");
    const tabs = tabsRef.current;

    let frame = 0;
    const updateStickyMetrics = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
      const headerBottom = Math.ceil(header?.getBoundingClientRect().bottom ?? BRAND_PROFILE_HEADER_FALLBACK);
      const headerHeight = Math.max(headerBottom, BRAND_PROFILE_HEADER_FALLBACK);
      const tabsHeight = Math.ceil(tabs?.getBoundingClientRect().height ?? 48);

      setStickyMetrics((current) =>
        current.headerHeight === headerHeight && current.tabsHeight === tabsHeight
          ? current
          : { headerHeight, tabsHeight },
      );
      });
    };

    updateStickyMetrics();
    const observer = new ResizeObserver(updateStickyMetrics);
    if (header) observer.observe(header);
    if (tabs) observer.observe(tabs);
    window.addEventListener("resize", updateStickyMetrics);
    window.addEventListener("scroll", updateStickyMetrics, { passive: true });

    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("resize", updateStickyMetrics);
      window.removeEventListener("scroll", updateStickyMetrics);
    };
  }, []);

  useEffect(() => {
    if (!topTabs.includes(topTab)) setTopTab("Overview");
  }, [topTab, topTabs]);

  useEffect(() => {
    if (topTab !== "Overview" || typeof window === "undefined") return;

    let frame = 0;
    const updateActiveSection = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        const offset = window.matchMedia("(min-width: 1024px)").matches
          ? stickySidebarTop + 8
          : stickyMetrics.headerHeight + 12;
        const marker = window.scrollY + offset;
        let nextIndex = 0;

        sideTabs.forEach((section, index) => {
          const node = document.getElementById(profileSectionDomId(section.id));
          if (node && node.offsetTop <= marker) nextIndex = index;
        });

        setActiveIdx(nextIndex);
      });
    };

    updateActiveSection();
    window.addEventListener("scroll", updateActiveSection, { passive: true });
    window.addEventListener("resize", updateActiveSection);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", updateActiveSection);
      window.removeEventListener("resize", updateActiveSection);
    };
  }, [stickyMetrics.headerHeight, stickySidebarTop, topTab]);

  function scrollToProfileSection(section: (typeof sideTabs)[number], index: number) {
    setActiveIdx(index);
    const node = document.getElementById(profileSectionDomId(section.id));
    if (!node || typeof window === "undefined") return;
    const offset = window.matchMedia("(min-width: 1024px)").matches
      ? stickySidebarTop + 8
      : stickyMetrics.headerHeight + 12;
    const top = node.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: "smooth" });
  }

  async function handleAssetFile(kind: keyof ProfileAssets, file?: File | null) {
    if (!file || !file.type.startsWith("image/")) return;
    if (!canEditProfile) return;

    setUploadingAsset(kind);
    try {
      if (isAdmin && brand?.id) {
        const uploaded = await uploadMediaFile(file, {
          folder: kind === "banner" ? "brands/covers" : "brands/logos",
          prefix: brandSlug || name,
        });
        await updateAdminBrand(
          brand.id,
          kind === "banner" ? { cover: uploaded.url } : { thumbnail: uploaded.url },
        );
        setAssetOverrides((current) => ({ ...current, [kind]: uploaded.url }));
        setProfileAssets((current) => ({ ...current, [kind]: uploaded.url }));
        return;
      }

      const dataUrl = await fileToDataUrl(file);
      setAssetOverrides((current) => ({ ...current, [kind]: dataUrl }));
      setProfileAssets((current) => ({ ...current, [kind]: dataUrl }));
    } finally {
      setUploadingAsset(null);
    }
  }

  async function copyDiscountCode(code: string) {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(true);
      window.setTimeout(() => setCopiedCode(false), 1400);
    } catch {
      setCopiedCode(false);
    }
  }

  async function toggleFollow() {
    if (!brand?.id) return;
    if (!token) {
      void navigate({ to: "/login" });
      return;
    }
    if (followBusy) return;

    setFollowBusy(true);
    const previous = followState;
    const next = {
      followersCount: Math.max(0, followState.followersCount + (followState.isFollowing ? -1 : 1)),
      isFollowing: !followState.isFollowing,
    };
    setFollowState(next);

    try {
      const updated = followState.isFollowing
        ? await unfollowAdminBrand(brand.id, token)
        : await followAdminBrand(brand.id, token);
      setFollowState({
        followersCount: Number(updated.followersCount ?? next.followersCount),
        isFollowing: Boolean(updated.isFollowing ?? next.isFollowing),
      });
    } catch {
      setFollowState(previous);
    } finally {
      setFollowBusy(false);
    }
  }

  if (brandLoading) {
    return <FirmDetailsSkeleton />;
  }

  return (
    <div className="relative min-h-screen overflow-x-clip bg-[var(--rb-bg-canvas)] text-white">
      <SiteHeader />
      <div className="glow-orb h-[600px] w-[600px] -left-40 top-20 opacity-35" />
      <div className="glow-orb h-[700px] w-[700px] right-0 top-[40%] opacity-30" />

      <div className="container-app relative pb-6 pt-3 sm:pt-4">
        <div className="grid items-stretch gap-5 lg:grid-cols-[minmax(0,1fr)_390px] xl:grid-cols-[minmax(0,1fr)_440px] 2xl:grid-cols-[minmax(0,1fr)_480px]">
          <div className="glass-strong h-full overflow-hidden rounded-3xl bg-[rgba(18,18,25,0.90)] ring-1 ring-violet-400/20">
            <div className="relative h-28 overflow-hidden bg-[var(--rb-bg-section)] sm:h-32 lg:h-36 xl:h-[152px]">
              {displayBanner ? (
                <img
                  src={displayBanner}
                  alt={`${name} banner`}
                  className="h-full w-full object-cover object-center"
                />
              ) : (
                <div className="h-full w-full bg-[radial-gradient(circle_at_18%_18%,rgba(90,34,241,0.16),transparent_32%),radial-gradient(circle_at_82%_22%,rgba(126,77,255,0.10),transparent_34%),linear-gradient(135deg,var(--rb-bg-section)_0%,var(--rb-bg-card)_52%,var(--rb-bg-canvas)_100%)]">
                  <div className="absolute inset-x-0 bottom-0 h-20 bg-[linear-gradient(180deg,transparent,rgba(9,9,13,0.78))]" />
                  <div className="absolute left-8 top-12 h-px w-[70%] rotate-[-8deg] bg-violet-300/20 shadow-[0_0_26px_rgba(90,34,241,0.32)]" />
                  <div className="absolute bottom-10 right-10 h-px w-[45%] rotate-[-14deg] bg-violet-200/18 shadow-[0_0_22px_rgba(126,77,255,0.26)]" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-black/[0.02] to-black/15" />
              <button
                onClick={() => navigate({ to: backToListingsPath })}
                className="absolute left-4 top-4 z-10 inline-flex items-center gap-2 rounded-full bg-[rgba(18,18,25,0.72)] px-3.5 py-2 text-xs font-semibold text-white ring-1 ring-white/18 shadow-lg shadow-black/20 backdrop-blur-xl transition hover:bg-[rgba(27,25,38,0.86)] hover:ring-white/28"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Back
              </button>
              {canEditProfile ? (
                <>
                  <button
                    type="button"
                    onClick={() => bannerInputRef.current?.click()}
                    className="absolute right-4 top-4 inline-flex items-center gap-2 rounded-full bg-black/45 px-3 py-1.5 text-xs font-semibold text-white ring-1 ring-white/20 backdrop-blur hover:bg-black/60"
                  >
                    <Camera className="h-3.5 w-3.5" />{" "}
                    {uploadingAsset === "banner" ? "Saving..." : "Banner"}
                  </button>
                  <input
                    ref={bannerInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(event) => {
                      void handleAssetFile("banner", event.currentTarget.files?.[0]);
                      event.currentTarget.value = "";
                    }}
                  />
                </>
              ) : null}
            </div>

            <div className="px-5 pb-5 sm:px-6">
              <div className="min-w-0">
                <div className="-mt-5 flex flex-col items-start gap-4 sm:-mt-7 sm:flex-row sm:items-end sm:justify-between">
                  <div className="relative h-[72px] w-[72px] shrink-0 overflow-hidden rounded-[20px] border border-white/12 bg-[var(--rb-bg-card)] shadow-[0_16px_40px_rgba(0,0,0,0.34)] ring-4 ring-[var(--rb-bg-canvas)] sm:h-24 sm:w-24 sm:rounded-[24px]">
                    {displayAvatar ? (
                      <img
                        src={displayAvatar}
                        alt={name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="grid h-full w-full place-items-center bg-primary/20 text-lg font-bold text-white sm:text-2xl">
                        {logoInitials || "RB"}
                      </div>
                    )}
                    {canEditProfile ? (
                      <>
                        <button
                          type="button"
                          onClick={() => avatarInputRef.current?.click()}
                          className="absolute bottom-1.5 right-1.5 grid h-8 w-8 place-items-center rounded-full bg-[var(--rb-bg-elevated)] text-white ring-2 ring-white/70 hover:bg-violet-700"
                          aria-label="Change profile image"
                        >
                          <Camera className="h-3.5 w-3.5" />
                        </button>
                        <input
                          ref={avatarInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(event) => {
                            void handleAssetFile("avatar", event.currentTarget.files?.[0]);
                            event.currentTarget.value = "";
                          }}
                        />
                      </>
                    ) : null}
                  </div>

                  <div className="grid w-full grid-cols-2 gap-2 pt-1 sm:w-auto sm:flex sm:translate-y-3 sm:flex-wrap sm:items-center sm:justify-end">
                    <a
                      href={
                        supportEmail
                          ? `mailto:${supportEmail}?subject=Message for ${encodeURIComponent(name)}`
                          : undefined
                      }
                      onClick={(event) => {
                        if (!supportEmail) event.preventDefault();
                      }}
                      aria-disabled={!supportEmail}
                      className={`inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-xs font-semibold ring-1 ${
                        supportEmail
                          ? "bg-white/10 text-white ring-white/15 hover:bg-white/15"
                          : "cursor-not-allowed bg-white/5 text-white/35 ring-white/10"
                      }`}
                    >
                      <Mail className="h-3.5 w-3.5" /> Message
                    </a>
                    <a
                      href={reviewHref}
                      className="inline-flex items-center justify-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-white ring-1 ring-white/15 transition hover:bg-white/15"
                    >
                      <MessageSquare className="h-3.5 w-3.5" /> Review
                    </a>
                    <a
                      href={signupUrl || undefined}
                      target={signupUrl ? "_blank" : undefined}
                      rel={signupUrl ? "noreferrer" : undefined}
                      onClick={(event) => {
                        if (!signupUrl) event.preventDefault();
                      }}
                      aria-disabled={!signupUrl}
                      className={`col-span-2 inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-xs font-bold ring-1 transition sm:col-span-1 ${
                        signupUrl
                          ? "rb-gradient-primary text-white ring-violet-300/40 hover:brightness-110"
                          : "cursor-not-allowed bg-white/5 text-white/35 ring-white/10"
                      }`}
                    >
                      <Rocket className="h-3.5 w-3.5" /> Sign Up
                    </a>
                    <button
                      type="button"
                      onClick={() => void toggleFollow()}
                      className={`col-span-2 inline-flex items-center justify-center gap-2 rounded-full px-5 py-2 text-xs font-bold ring-1 transition sm:col-span-1 ${
                        followState.isFollowing
                          ? "bg-white text-[#1a0b2e] ring-white/70 hover:bg-rose-50 hover:text-rose-700"
                          : "rb-gradient-primary text-white ring-violet-300/40 hover:brightness-110"
                      } ${!brand?.id ? "opacity-60" : ""}`}
                    >
                      {followState.isFollowing ? (
                        <UserCheck className="h-3.5 w-3.5" />
                      ) : (
                        <UserPlus className="h-3.5 w-3.5" />
                      )}
                      {followState.isFollowing ? "Unfollow" : "Follow"}
                    </button>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-2xl font-bold leading-tight sm:text-4xl">{name}</h1>
                    <VerificationBadge state={tbiStage} />
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                    <span>{handle}</span>
                    {brand?.founder?.ceo ? (
                      <>
                        <span className="text-white/25">·</span>
                        <span>
                          CEO <b className="font-semibold text-white">{brand.founder.ceo}</b>
                        </span>
                      </>
                    ) : null}
                    {xUrl ? (
                      <a
                        href={xUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="grid h-7 w-7 place-items-center rounded-full bg-black text-xs font-black text-white ring-1 ring-white/15 hover:bg-white hover:text-black"
                        aria-label={`${name} on X`}
                      >
                        X
                      </a>
                    ) : null}
                    {linkedInUrl ? (
                      <a
                        href={linkedInUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="grid h-7 w-7 place-items-center rounded-full bg-[#0a66c2] text-white ring-1 ring-white/15 hover:brightness-110"
                        aria-label={`${name} on LinkedIn`}
                      >
                        <Linkedin className="h-4 w-4" />
                      </a>
                    ) : null}
                  </div>
                </div>

                <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/80">
                  {brand?.identity?.tagline ||
                    brand?.identity?.description ||
                    `Trading profile for ${name}, including funding details, payout behavior, reviews, complaints, and trust signals.`}
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
                  <span>
                    <b className="font-semibold text-white">{followerCount}</b> Followers
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    {country.flag ? (
                      <span className="text-base leading-none">{country.flag}</span>
                    ) : null}
                    <b className="font-semibold text-white">{country.label}</b> Country
                  </span>
                  <span>
                    <b className="font-semibold text-white">{brand?.identity?.founded ?? "—"}</b>{" "}
                    Year
                  </span>
                </div>

                {profileOffer.hasOffer ? (
                  <div className="mt-5 max-w-4xl">
                    <div
                      className="relative isolate overflow-hidden rounded-[30px] border border-white/12 bg-[rgba(22,22,31,0.96)] text-white shadow-[0_24px_70px_rgba(0,0,0,0.30)]"
                      style={{
                        boxShadow: "0 24px 70px rgba(0,0,0,0.34), 0 0 42px rgba(90,34,241,0.18)",
                      }}
                    >
                      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_16%_0%,rgba(90,34,241,0.16),transparent_34%),radial-gradient(circle_at_88%_38%,rgba(126,77,255,0.13),transparent_32%)]" />
                      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/24 to-transparent" />
                      <div className="relative grid min-h-[166px] sm:grid-cols-[minmax(0,1fr)_248px]">
                        <div className="relative px-5 py-5 sm:px-6 sm:py-6">
                          <div className="absolute -right-3 top-0 hidden h-full border-r border-dashed border-white/18 sm:block" />
                          <div className="absolute -right-6 -top-6 hidden h-12 w-12 rounded-full bg-[var(--rb-bg-canvas)] sm:block" />
                          <div className="absolute -bottom-6 -right-6 hidden h-12 w-12 rounded-full bg-[var(--rb-bg-canvas)] sm:block" />
                          <div className="flex items-center gap-2">
                            <span className="rounded-full bg-violet-500/14 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-violet-100 ring-1 ring-violet-300/24">
                              RebateBoard Voucher
                            </span>
                            {profileOffer.terms ? (
                              <span
                                title={profileOffer.terms}
                                className="grid h-5 w-5 place-items-center rounded-full bg-white/[0.08] text-white/70 ring-1 ring-white/10"
                              >
                                <Info className="h-3 w-3" />
                              </span>
                            ) : null}
                          </div>
                          <div className="mt-3 text-4xl font-black leading-none tracking-tight sm:text-5xl">
                            {profileOffer.discountLabel}
                          </div>
                          <p className="mt-3 line-clamp-2 max-w-xl text-sm font-semibold leading-relaxed text-white/70">
                            {profileOffer.description ||
                              "Verified RebateBoard offer for this brand."}
                          </p>
                        </div>

                        <div className="relative flex flex-col justify-center gap-3 border-t border-dashed border-white/16 bg-[linear-gradient(135deg,#5A22F1,#7E4DFF)] px-5 py-5 text-white sm:border-l sm:border-t-0">
                          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(255,255,255,0.18),transparent_32%),linear-gradient(180deg,rgba(255,255,255,0.10),transparent)]" />
                          <div className="relative text-center text-[10px] font-black uppercase tracking-[0.22em] text-white/76">
                            Use Code
                          </div>
                          {profileOffer.code ? (
                            <button
                              type="button"
                              onClick={() => void copyDiscountCode(profileOffer.code)}
                              className="relative inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--rb-bg-input)] px-4 py-3 text-base font-black tracking-[0.12em] text-white shadow-lg shadow-black/25 ring-1 ring-white/22 transition hover:scale-[1.02] hover:ring-white/36"
                            >
                              <Copy className="h-4 w-4" />
                              {copiedCode ? "Copied" : profileOffer.code}
                            </button>
                          ) : profileOffer.ctaUrl ? (
                            <a
                              href={profileOffer.ctaUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="relative inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--rb-bg-input)] px-4 py-3 text-sm font-black text-white shadow-lg shadow-black/25 ring-1 ring-white/22 transition hover:scale-[1.02] hover:ring-white/36"
                            >
                              Claim Offer
                            </a>
                          ) : (
                            <div className="relative rounded-2xl bg-[var(--rb-bg-input)] px-4 py-3 text-center text-sm font-black text-white ring-1 ring-white/22">
                              No code needed
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}

                {canEditProfile && (profileAssets.avatar || profileAssets.banner) && (
                  <button
                    type="button"
                    onClick={() => {
                      setAssetOverrides({});
                      setProfileAssets({});
                    }}
                    className="mt-3 rounded-full bg-white/5 px-3 py-1 text-[10px] font-semibold text-white/70 ring-1 ring-white/10 hover:text-white"
                  >
                    Reset visuals
                  </button>
                )}
              </div>
            </div>
          </div>

          <TbiScoreCard
            brand={brand}
            profile={tbiProfile}
            score={tbiScore}
            onViewBreakdown={() => setTopTab("TBI Breakdown")}
          />
        </div>

        <div
          ref={tabsRef}
          className="sticky z-[49] mt-4 flex justify-center rounded-2xl bg-[rgba(18,18,25,0.97)] px-2 py-2 shadow-[0_18px_50px_rgba(0,0,0,0.38)] ring-1 ring-white/12 backdrop-blur-2xl lg:px-3"
          style={{ top: `${stickyTabsTop}px` }}
        >
          <div className="no-scrollbar flex max-w-full flex-nowrap items-center justify-start gap-2 overflow-x-auto overscroll-x-contain py-0.5 lg:justify-center">
            {topTabs.map((t) => (
              <button
                key={t}
                onClick={(event) => {
                  setTopTab(t);
                  event.currentTarget.scrollIntoView({
                    behavior: "smooth",
                    inline: "center",
                    block: "nearest",
                  });
                }}
                className={
                  "shrink-0 rounded-full px-4 py-1.5 text-[11px] font-semibold ring-1 transition duration-200 " +
                  (topTab === t
                    ? "bg-white text-[#1a0b2e] ring-white/60 shadow-[0_0_20px_rgba(255,255,255,0.16)]"
                    : "bg-violet-300/20 text-white ring-violet-300/20 hover:bg-violet-300/30")
                }
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {topTab === "Reviews" ? (
          <div className="mt-4">
            <FirmReviews firmName={name} firmSlug={firmId} />
          </div>
        ) : topTab === "Funding Programs" ? (
          <div className="mt-4">
            <FirmChallenges
              firmName={name}
              brandId={brand?.id == null ? undefined : String(brand.id)}
              brandLogo={displayAvatar}
              category={brand?.category || "Prop Firm"}
              checkoutLink={signupUrl}
              challenges={brand?.challenges}
              stickyTop={stickySidebarTop}
            />
          </div>
        ) : topTab === "Complaints" ? (
          <div className="mt-4">
            <FirmComplaints firmName={name} firmSlug={firmId} />
          </div>
        ) : topTab === "Payouts" ? (
          <div className="mt-4">
            <PayoutsComingSoon firmName={name} />
          </div>
        ) : topTab === "Announcement" ? (
          <div className="mt-4">
            <FirmAnnouncements firmName={name} />
          </div>
        ) : topTab === "TBI Breakdown" ? (
          <TbiIndexContent brand={brand} profile={tbiProfile} score={tbiScore} />
        ) : topTab === "Offers" ? (
          <div className="mt-4 rounded-[28px] border border-white/10 bg-[rgba(22,22,31,0.94)] p-4 shadow-[0_18px_52px_rgba(0,0,0,0.24)]">
            {profileOffer.hasOffer ? (
              <div className="relative isolate overflow-hidden rounded-[26px] border border-dashed border-white/14 bg-[rgba(18,18,25,0.82)]">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_0%,rgba(90,34,241,0.14),transparent_34%)]" />
                <div className="relative grid md:grid-cols-[minmax(0,1fr)_250px] md:items-stretch">
                  <div className="p-5 md:p-6">
                    <div className="inline-flex rounded-full bg-violet-500/14 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-violet-100 ring-1 ring-violet-300/24">
                      RebateBoard Voucher
                    </div>
                    <h2 className="mt-3 text-4xl font-black tracking-tight text-white">
                      {profileOffer.discountLabel}
                    </h2>
                    <p className="mt-2 text-sm font-medium leading-relaxed text-white/68">
                      {profileOffer.description ||
                        "A verified RebateBoard offer is available for this brand."}
                    </p>
                  </div>
                  <div className="relative flex flex-col justify-center gap-3 border-t border-dashed border-white/16 bg-[linear-gradient(135deg,#5A22F1,#7E4DFF)] p-5 md:border-l md:border-t-0">
                    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(255,255,255,0.18),transparent_32%),linear-gradient(180deg,rgba(255,255,255,0.10),transparent)]" />
                    <div className="relative text-center text-[10px] font-black uppercase tracking-[0.22em] text-white/76">
                      Use Code
                    </div>
                    {profileOffer.code ? (
                      <button
                        type="button"
                        onClick={() => void copyDiscountCode(profileOffer.code)}
                        className="relative inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--rb-bg-input)] px-4 py-3 text-base font-black tracking-[0.12em] text-white shadow-lg shadow-black/25 ring-1 ring-white/22 transition hover:bg-[var(--rb-bg-card-hover)]"
                      >
                        <Copy className="h-4 w-4" />
                        {copiedCode ? "Copied" : profileOffer.code}
                      </button>
                    ) : profileOffer.ctaUrl ? (
                      <a
                        href={profileOffer.ctaUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="relative inline-flex items-center justify-center rounded-2xl bg-[var(--rb-bg-input)] px-4 py-3 text-sm font-black text-white shadow-lg shadow-black/25 ring-1 ring-white/22"
                      >
                        Claim Offer
                      </a>
                    ) : null}
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center">
                <div className="text-base font-semibold text-white">No active offer yet</div>
                <p className="mt-2 text-sm text-white/60">
                  Cashback, rebate, and partner offers will appear here when available.
                </p>
              </div>
            )}
          </div>
        ) : topTab !== "Overview" ? (
          <div className="mt-4 glass rounded-2xl p-10 text-center text-sm text-muted-foreground ring-1 ring-white/10">
            <div className="text-base font-semibold text-white">{topTab}</div>
            <p className="mt-2">This section is not available for this profile yet.</p>
          </div>
        ) : (
          <div className="mt-4 grid gap-6 lg:grid-cols-[230px_minmax(0,1fr)]">
            <aside
              className="self-start lg:sticky lg:z-30 lg:overflow-y-auto lg:pr-1"
              style={{
                top: `${stickySidebarTop}px`,
                maxHeight: `calc(100dvh - ${stickySidebarTop + 18}px)`,
              }}
            >
              <div className="mb-3 hidden text-[10px] font-bold uppercase tracking-[0.2em] text-white/35 lg:block">
                Overview
              </div>
              <ul className="flex gap-1 overflow-x-auto border-b border-white/10 pb-2 lg:block lg:space-y-1 lg:overflow-visible lg:border-b-0 lg:border-l lg:border-white/10 lg:pb-0">
                {sideTabs.map((section, i) => (
                  <li key={section.id} className="shrink-0 lg:shrink">
                    <button
                      onClick={() => scrollToProfileSection(section, i)}
                      className={
                        "relative whitespace-nowrap rounded-full px-3 py-1.5 text-left text-[11px] font-semibold transition lg:w-full lg:rounded-none lg:py-2 lg:pl-4 " +
                        (i === activeIdx
                          ? "bg-violet-300/[0.18] text-white ring-1 ring-violet-300/25 lg:bg-transparent lg:ring-0"
                          : "text-white/45 hover:bg-white/[0.04] hover:text-white/85 lg:hover:bg-transparent")
                      }
                    >
                      {i === activeIdx ? (
                        <span className="absolute left-0 top-1/2 hidden h-5 w-0.5 -translate-y-1/2 rounded-full bg-violet-300 lg:block" />
                      ) : null}
                      {section.label}
                    </button>
                  </li>
                ))}
              </ul>
            </aside>

            <div className="min-w-0 animate-in fade-in slide-in-from-right-4 duration-300">
              {sideTabs.map((section, index) => (
                <div
                  key={section.id}
                  id={profileSectionDomId(section.id)}
                  style={{ scrollMarginTop: `${stickySidebarTop + 8}px` }}
                  className={`transition duration-500 motion-safe:transform ${
                    index === activeIdx
                      ? "translate-y-0 opacity-100"
                      : "opacity-85 lg:translate-y-1 lg:opacity-75"
                  }`}
                >
                  {renderSection(section.id, profileData)}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <SiteFooter />
    </div>
  );
}
