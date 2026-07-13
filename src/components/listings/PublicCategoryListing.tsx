import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowUpRight,
  BadgePercent,
  Check,
  ChevronDown,
  Copy,
  Eye,
  Filter,
  Heart,
  MapPin,
  MessageSquare,
  RefreshCw,
  Rocket,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Star,
  TrendingUp,
  UserCheck,
  UserPlus,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { API_BASE_URL, apiRequest } from "@/lib/api";
import {
  followAdminBrand,
  unfollowAdminBrand,
  type AdminBrandRecord,
} from "@/lib/admin-brands-api";
import { useAuth } from "@/lib/auth";
import {
  readCompareSelection,
  toggleCompareSelection,
} from "@/lib/compare-selection";
import { resolveCountryDisplay } from "@/lib/country-format";
import type { ListingCategoryConfig } from "@/lib/listing-categories";
import {
  isPublishedBrand,
  publicTbiStageTheme,
  resolveBrandTbiState,
} from "@/lib/public-brand";

const PAGE_SIZE = 12;

type FilterGroup = {
  name: string;
  options: string[];
};

type Metric = {
  label: string;
  value: string;
  tone?: "success" | "primary";
};

type SortMode = "recommended" | "recent" | "tbi" | "name";

function cleanText(value: unknown) {
  if (value === null || value === undefined) return "";
  const text = String(value).trim();
  const normalized = text.toLowerCase();
  if (
    !text ||
    text === "\u2014" ||
    ["null", "undefined", "n/a", "na", "none", "-", "--"].includes(normalized)
  ) {
    return "";
  }
  return text;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function firstText(...values: unknown[]) {
  for (const value of values) {
    const text = cleanText(value);
    if (text) return text;
  }
  return "";
}

function firstListText(value: unknown, limit = 3) {
  const values = Array.isArray(value)
    ? value.map(cleanText)
    : cleanText(value)
        .split(/[\n,;|]+/)
        .map((item) => item.trim());
  return values.filter(Boolean).slice(0, limit).join(", ");
}

function parseNumber(value: unknown) {
  const match = cleanText(value).replace(/,/g, "").match(/\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : null;
}

function parseMoney(value: unknown) {
  const text = cleanText(value).toLowerCase().replace(/,/g, "");
  const match = text.match(/\$?\s*(\d+(?:\.\d+)?)\s*([km])?/);
  if (!match) return null;
  const amount = Number(match[1]);
  if (match[2] === "k") return amount * 1_000;
  if (match[2] === "m") return amount * 1_000_000;
  return amount;
}

function normalizeUrl(value: unknown) {
  const url = cleanText(value);
  if (!url) return "";
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

function resolveMediaUrl(...values: unknown[]) {
  const value = firstText(...values);
  if (!value) return "";
  if (/^(https?:|data:|blob:)/i.test(value)) return value;
  const apiOrigin = API_BASE_URL.replace(/\/api\/v1$/i, "");
  if (value.startsWith("/api/v1/")) return `${apiOrigin}${value}`;
  if (value.startsWith("/file/")) return `${API_BASE_URL}${value}`;
  if (value.startsWith("/")) return `${apiOrigin}${value}`;
  return `${API_BASE_URL}/file/view?key=${encodeURIComponent(value)}`;
}

function scoreOutOf100(value: unknown) {
  const raw = Number(value ?? 0);
  if (!Number.isFinite(raw) || raw <= 0) return 0;
  return raw > 10 ? Math.min(100, raw) : Math.min(100, raw * 10);
}

function tbiLabel(value: unknown) {
  const score = scoreOutOf100(value);
  if (!score) return "Pending";
  return `${Math.round(score)}/100`;
}

function compactCount(value: unknown) {
  const count = Number(value ?? 0);
  if (count >= 1_000_000) return `${Number((count / 1_000_000).toFixed(1))}M`;
  if (count >= 1_000) return `${Number((count / 1_000).toFixed(1))}K`;
  return count.toLocaleString();
}

function countryForBrand(brand: AdminBrandRecord) {
  const identity = asRecord(brand.identity);
  const profile = asRecord(brand.profile);
  const country = resolveCountryDisplay(
    identity.country,
    identity.hq,
    identity.location,
    profile.country,
    profile.hq,
  );
  return {
    code: country.code,
    flag: country.flag,
    label:
      firstText(identity.country, identity.hq, identity.location, profile.country, profile.hq) ||
      country.label ||
      "Global",
  };
}

function searchableText(brand: AdminBrandRecord) {
  return [
    brand.name,
    brand.slug,
    brand.category,
    brand.status,
    brand.identity,
    brand.broker,
    brand.prop,
    brand.exchange,
    brand.tool,
    brand.editorial,
    brand.profile,
    brand.cashback,
  ]
    .flatMap((value) =>
      value && typeof value === "object" ? Object.values(value as Record<string, unknown>) : [value],
    )
    .flatMap((value) => (Array.isArray(value) ? value : [value]))
    .map((value) => (typeof value === "object" ? JSON.stringify(value) : cleanText(value)))
    .join(" ")
    .toLowerCase();
}

function matchesCategory(brand: AdminBrandRecord, config: ListingCategoryConfig) {
  if (config.categoryFilters.includes(brand.category)) {
    if (config.exactCategoryOnly) return true;
    return brand.category !== "Other" || Boolean(config.matchKeywords?.length);
  }
  if (config.exactCategoryOnly || !config.matchKeywords?.length) return false;
  const text = searchableText(brand);
  return config.matchKeywords.some((keyword) => text.includes(keyword.toLowerCase()));
}

function brandDescription(brand: AdminBrandRecord) {
  const identity = asRecord(brand.identity);
  const editorial = asRecord(brand.editorial);
  const profile = asRecord(brand.profile);
  return (
    firstText(identity.tagline, identity.description, editorial.verdict, profile.publicFeedback) ||
    `${brand.name} has a published RebateBoard profile. Open the details page for its complete data.`
  );
}

function brandWebsite(brand: AdminBrandRecord) {
  const identity = asRecord(brand.identity);
  return normalizeUrl(firstText(brand.website, identity.website, identity.url));
}

function promoData(brand: AdminBrandRecord) {
  const cashback = asRecord(brand.cashback);
  const prop = asRecord(brand.prop);
  const tool = asRecord(brand.tool);
  const code = firstText(prop.discountCode, prop.promoCode, tool.discountCode, cashback.code);
  const rate = firstText(
    prop.discountPercentage,
    prop.discountPct,
    prop.discount,
    cashback.maxPct,
    cashback.defaultPct,
    cashback.cashbackPct,
    cashback.cashbackPercent,
    cashback.percent,
    cashback.rebatePct,
  );
  const flags = asRecord(brand.flags);
  const label = rate
    ? /\d/.test(rate) && !/%/.test(rate)
      ? `${rate}% cashback`
      : /off|cashback|rebate/i.test(rate)
        ? rate
        : `${rate} cashback`
    : flags.cashbackEligible === true
      ? "Cashback eligible"
      : "";
  return { code, label };
}

function metricRows(
  brand: AdminBrandRecord,
  profile: ListingCategoryConfig["metricProfile"],
): Metric[] {
  const broker = asRecord(brand.broker);
  const prop = asRecord(brand.prop);
  const exchange = asRecord(brand.exchange);
  const tool = asRecord(brand.tool);
  const profileData = asRecord(brand.profile);
  const cashback = asRecord(brand.cashback);

  if (profile === "broker") {
    return [
      {
        label: "Min deposit",
        value: firstText(broker.minDeposit, broker.depositMin) || "Not provided",
        tone: "success",
      },
      {
        label: "Max leverage",
        value: firstText(broker.maxLeverage, profileData.leverageOverall) || "Not provided",
        tone: "primary",
      },
      { label: "Spreads", value: firstText(broker.spreads) || "Not provided" },
      { label: "Accounts", value: firstListText(broker.accountTypes, 2) || "Not provided" },
    ];
  }

  if (profile === "exchange") {
    const enabledFeatures = [
      cleanText(exchange.spot) === "Yes" ? "Spot" : "",
      cleanText(exchange.futures) === "Yes" ? "Futures" : "",
      cleanText(exchange.copyTrading) === "Yes" ? "Copy trading" : "",
      cleanText(exchange.fiatOnRamp) === "Yes" ? "Fiat on-ramp" : "",
      cleanText(exchange.staking) === "Yes" ? "Staking" : "",
    ].filter(Boolean);
    return [
      {
        label: "Min deposit",
        value: firstText(exchange.minDeposit, exchange.depositMin) || "Not provided",
        tone: "success",
      },
      {
        label: "Trading fee",
        value: firstText(exchange.fees, exchange.makerTaker) || "Not provided",
        tone: "primary",
      },
      { label: "KYC", value: firstText(exchange.kyc) || "Not provided" },
      {
        label: "Features",
        value: enabledFeatures.join(", ") || firstListText(exchange.supportedAssets, 2) || "Not provided",
      },
    ];
  }

  if (profile === "tool" || profile === "education") {
    return [
      {
        label: profile === "education" ? "Format" : "Type",
        value: firstText(tool.type, brand.category),
        tone: "success",
      },
      {
        label: "Pricing",
        value: firstText(tool.pricing, prop.pricing, cashback.terms) || "Not provided",
        tone: "primary",
      },
      {
        label: "Best for",
        value:
          firstListText(tool.bestFor, 2) ||
          firstListText(asRecord(brand.editorial).bestFor, 2) ||
          "Not provided",
      },
      {
        label: "Platforms",
        value: firstListText(tool.platforms, 2) || firstListText(tool.integrations, 2) || "Not provided",
      },
    ];
  }

  return [
    {
      label: "Max allocation",
      value: firstText(prop.maxAlloc, prop.maxAllocation) || "See details",
      tone: "success",
    },
    {
      label: "Profit split",
      value: firstText(prop.profitSplit) || "See details",
      tone: "primary",
    },
    {
      label: "From",
      value: firstText(prop.pricing, prop.startingFee, prop.price) || "See pricing",
    },
    {
      label: "Payout",
      value: firstText(prop.payoutSchedule, prop.payoutFreq, brand.payouts) || "See details",
    },
  ];
}

function sortByRankAndTrust(a: AdminBrandRecord, b: AdminBrandRecord) {
  const rankA = Number(a.rankOverride ?? 9999);
  const rankB = Number(b.rankOverride ?? 9999);
  if (rankA !== rankB) return rankA - rankB;
  return scoreOutOf100(b.tbi) - scoreOutOf100(a.tbi);
}

function sortBrands(brands: AdminBrandRecord[], mode: SortMode) {
  return [...brands].sort((a, b) => {
    if (mode === "recent") {
      return Date.parse(b.createdAt ?? "") - Date.parse(a.createdAt ?? "");
    }
    if (mode === "tbi") return scoreOutOf100(b.tbi) - scoreOutOf100(a.tbi);
    if (mode === "name") return a.name.localeCompare(b.name);
    return sortByRankAndTrust(a, b);
  });
}

function filterText(brand: AdminBrandRecord, source: "broker" | "prop" | "exchange" | "tool") {
  return JSON.stringify(asRecord(brand[source])).toLowerCase();
}

function brokerRegulators(brands: AdminBrandRecord[]) {
  const known = [
    "FCA",
    "ASIC",
    "CySEC",
    "FSCA",
    "FSA",
    "FSC",
    "CMA",
    "DFSA",
    "MAS",
    "NFA",
    "CFTC",
    "BaFin",
  ];
  const body = brands.map((brand) => filterText(brand, "broker")).join(" ");
  return known.filter((name) => new RegExp(`\\b${name}\\b`, "i").test(body));
}

function countryOptions(brands: AdminBrandRecord[]) {
  return Array.from(
    new Set(
      brands
        .map((brand) => countryForBrand(brand))
        .filter((country) => country.label && country.label !== "Global")
        .map((country) => `${country.flag ? `${country.flag} ` : ""}${country.label}`),
    ),
  ).sort();
}

function filterGroupsFor(
  config: ListingCategoryConfig,
  brands: AdminBrandRecord[],
): FilterGroup[] {
  const common: FilterGroup[] = [
    {
      name: "Trust & Rewards",
      options: ["Fully Unlocked", "Partial Unlock", "Preliminary", "Cashback", "Has Reviews"],
    },
  ];
  const countries = countryOptions(brands);

  if (config.metricProfile === "broker") {
    return [
      { name: "Regulators", options: brokerRegulators(brands) },
      { name: "Commission ($)", options: ["Up to $1", "$1 - $5", "$6 - $10", "$10+"] },
      { name: "Spread Type", options: ["Floating Spread", "Fixed Spread"] },
      { name: "Minimum Deposit", options: ["$0 - $100", "$101 - $200", "$201 - $500", "$500+"] },
      {
        name: "Accounts",
        options: ["Standard Account", "Mini/Micro Account", "VIP/Premium Account", "ECN Account"],
      },
      { name: "Products", options: ["Forex", "CFDs", "Commodity", "Index", "Crypto"] },
      ...common,
      ...(countries.length ? [{ name: "Country", options: countries }] : []),
    ].filter((group) => group.options.length > 0);
  }

  if (config.metricProfile === "exchange") {
    return [
      { name: "Regulation", options: ["NYDFS", "FCA", "MAS", "VARA", "Unregulated"] },
      { name: "Min Deposit", options: ["$0 - $10", "$11 - $100", "$101 - $500", "$500+"] },
      { name: "Trading Fee", options: ["0 - 0.10%", "0.11 - 0.25%", "0.26 - 0.50%", "0.50%+"] },
      { name: "KYC Level", options: ["Tier 1 (Basic)", "Tier 2 (Verified)", "Tier 3 (Full)"] },
      {
        name: "Features",
        options: ["Fiat On-ramp", "Spot", "Futures", "Staking", "Copy Trading"],
      },
      ...common,
      ...(countries.length ? [{ name: "Country", options: countries }] : []),
    ];
  }

  if (config.metricProfile === "prop") {
    return [
      {
        name: "Program Type",
        options: ["1-Step Challenge", "2-Step Challenge", "Instant Funding", "Evaluation"],
      },
      {
        name: "Max Allocation",
        options: ["Up to $100k", "$100k - $500k", "$500k - $1M", "$1M+"],
      },
      { name: "Profit Split", options: ["70 - 79%", "80 - 89%", "90 - 100%"] },
      { name: "Starting Fee", options: ["Under $50", "$50 - $100", "$100 - $250", "$250+"] },
      { name: "Payout Frequency", options: ["On Request", "Weekly", "Bi-weekly", "Monthly"] },
      { name: "Markets", options: ["Forex", "Futures", "Crypto", "Stocks"] },
      ...common,
      ...(countries.length ? [{ name: "Country", options: countries }] : []),
    ];
  }

  return [
    {
      name: config.metricProfile === "education" ? "Learning Format" : "Product Type",
      options:
        config.metricProfile === "education"
          ? ["Course", "Mentorship", "Community", "Research"]
          : ["Web", "Desktop", "Mobile", "Plugin", "API"],
    },
    { name: "Pricing", options: ["Free", "Free Trial", "Subscription", "One-time"] },
    { name: "Features", options: ["Analytics", "Automation", "AI", "Alerts", "Integrations"] },
    ...common,
    ...(countries.length ? [{ name: "Country", options: countries }] : []),
  ];
}

function inRange(
  value: number | null,
  option: string,
  ranges: Record<string, [number, number]>,
) {
  if (value === null) return false;
  const range = ranges[option];
  return range ? value >= range[0] && value <= range[1] : false;
}

function optionMatches(
  brand: AdminBrandRecord,
  group: string,
  option: string,
) {
  const broker = asRecord(brand.broker);
  const prop = asRecord(brand.prop);
  const exchange = asRecord(brand.exchange);
  const tool = asRecord(brand.tool);
  const brokerText = filterText(brand, "broker");
  const propText = filterText(brand, "prop");
  const exchangeText = filterText(brand, "exchange");
  const toolText = filterText(brand, "tool");

  if (group === "Trust & Rewards") {
    const state = resolveBrandTbiState(brand);
    if (option === "Fully Unlocked") return state === "full";
    if (option === "Partial Unlock") return state === "partial";
    if (option === "Preliminary") return state === "preliminary";
    if (option === "Cashback") return Boolean(promoData(brand).label);
    if (option === "Has Reviews") return Number(brand.reviewsCount ?? 0) > 0;
  }

  if (group === "Country") {
    const country = countryForBrand(brand);
    return option.endsWith(country.label);
  }

  if (group === "Regulators") return brokerText.includes(option.toLowerCase());
  if (group === "Commission ($)") {
    const commissionText = firstText(broker.commission);
    const amount = /commission[- ]?free|zero commission/i.test(commissionText)
      ? 0
      : parseNumber(commissionText);
    return inRange(amount, option, {
      "Up to $1": [0, 1],
      "$1 - $5": [1.0001, 5],
      "$6 - $10": [5.0001, 10],
      "$10+": [10.0001, Number.POSITIVE_INFINITY],
    });
  }
  if (group === "Spread Type") {
    const spread = firstText(broker.spreads).toLowerCase();
    return option === "Fixed Spread" ? spread.includes("fixed") : Boolean(spread) && !spread.includes("fixed");
  }
  if (group === "Minimum Deposit") {
    return inRange(parseMoney(firstText(broker.minDeposit, broker.depositMin)), option, {
      "$0 - $100": [0, 100],
      "$101 - $200": [100.0001, 200],
      "$201 - $500": [200.0001, 500],
      "$500+": [500.0001, Number.POSITIVE_INFINITY],
    });
  }
  if (group === "Accounts") {
    const aliases: Record<string, string[]> = {
      "Standard Account": ["standard"],
      "Mini/Micro Account": ["mini", "micro", "cent"],
      "VIP/Premium Account": ["vip", "premium", "bespoke", "pro"],
      "ECN Account": ["ecn", "raw spread", "zero"],
    };
    return aliases[option].some((value) => brokerText.includes(value));
  }
  if (group === "Products") {
    const aliases: Record<string, string[]> = {
      Forex: ["forex", "fx"],
      CFDs: ["cfd"],
      Commodity: ["commodity", "commodities", "metals", "energy"],
      Index: ["index", "indices"],
      Crypto: ["crypto", "bitcoin"],
    };
    return aliases[option].some((value) => brokerText.includes(value));
  }

  if (group === "Regulation") {
    const licenses = `${firstText(exchange.licenses)} ${exchangeText}`.toLowerCase();
    return option === "Unregulated"
      ? !licenses || /unregulated|not regulated/.test(licenses)
      : licenses.includes(option.toLowerCase());
  }
  if (group === "Min Deposit") {
    return inRange(parseMoney(firstText(exchange.minDeposit, exchange.depositMin)), option, {
      "$0 - $10": [0, 10],
      "$11 - $100": [10.0001, 100],
      "$101 - $500": [100.0001, 500],
      "$500+": [500.0001, Number.POSITIVE_INFINITY],
    });
  }
  if (group === "Trading Fee") {
    return inRange(parseNumber(firstText(exchange.fees, exchange.makerTaker)), option, {
      "0 - 0.10%": [0, 0.1],
      "0.11 - 0.25%": [0.1001, 0.25],
      "0.26 - 0.50%": [0.2501, 0.5],
      "0.50%+": [0.5001, Number.POSITIVE_INFINITY],
    });
  }
  if (group === "KYC Level") {
    const kyc = firstText(exchange.kyc).toLowerCase();
    if (option.startsWith("Tier 1")) return /tier\s*1|basic/.test(kyc);
    if (option.startsWith("Tier 2")) return /tier\s*2|verified|standard/.test(kyc);
    return /tier\s*3|full|enhanced/.test(kyc);
  }
  if (group === "Features") {
    const aliases: Record<string, string[]> = {
      "Fiat On-ramp": ["fiat", "on-ramp", "onramp"],
      Spot: ["spot"],
      Futures: ["futures", "perpetual", "perp"],
      Staking: ["staking", "earn"],
      "Copy Trading": ["copy trading", "copytrading"],
      Analytics: ["analytics"],
      Automation: ["automation", "automated"],
      AI: [" ai ", "artificial intelligence"],
      Alerts: ["alert", "signal"],
      Integrations: ["integration", "api"],
    };
    return aliases[option]?.some((value) => `${exchangeText} ${toolText}`.includes(value)) ?? false;
  }

  if (group === "Program Type") {
    const aliases: Record<string, string[]> = {
      "1-Step Challenge": ["1-step", "1 step", "one-step"],
      "2-Step Challenge": ["2-step", "2 step", "two-step"],
      "Instant Funding": ["instant"],
      Evaluation: ["evaluation", "challenge", "phase"],
    };
    return aliases[option].some((value) => propText.includes(value));
  }
  if (group === "Max Allocation") {
    return inRange(parseMoney(firstText(prop.maxAlloc, prop.maxAllocation)), option, {
      "Up to $100k": [0, 100_000],
      "$100k - $500k": [100_000.01, 500_000],
      "$500k - $1M": [500_000.01, 1_000_000],
      "$1M+": [1_000_000.01, Number.POSITIVE_INFINITY],
    });
  }
  if (group === "Profit Split") {
    return inRange(parseNumber(prop.profitSplit), option, {
      "70 - 79%": [70, 79.999],
      "80 - 89%": [80, 89.999],
      "90 - 100%": [90, 100],
    });
  }
  if (group === "Starting Fee") {
    return inRange(parseMoney(firstText(prop.pricing, prop.startingFee, prop.price)), option, {
      "Under $50": [0, 49.999],
      "$50 - $100": [50, 100],
      "$100 - $250": [100.001, 250],
      "$250+": [250.001, Number.POSITIVE_INFINITY],
    });
  }
  if (group === "Payout Frequency") {
    const payout = firstText(prop.payoutSchedule, prop.payoutFreq, brand.payouts).toLowerCase();
    if (option === "On Request") return /request|on demand|anytime/.test(payout);
    if (option === "Bi-weekly") return /bi[- ]?weekly|14 day|fortnight/.test(payout);
    if (option === "Weekly") return /weekly|7 day/.test(payout) && !/bi[- ]?weekly/.test(payout);
    return /monthly|30 day/.test(payout);
  }
  if (group === "Markets") return propText.includes(option.toLowerCase());

  if (group === "Product Type" || group === "Learning Format") {
    return toolText.includes(option.toLowerCase());
  }
  if (group === "Pricing") {
    const pricing = firstText(tool.pricing).toLowerCase();
    if (option === "Free") return /\bfree\b/.test(pricing) && !/trial/.test(pricing);
    if (option === "Free Trial") return /trial/.test(pricing);
    if (option === "Subscription") return /month|annual|subscription/.test(pricing);
    return /one[- ]?time|lifetime/.test(pricing);
  }

  return true;
}

function matchesSelectedFilters(
  brand: AdminBrandRecord,
  filters: Record<string, string[]>,
) {
  return Object.entries(filters).every(
    ([group, options]) =>
      options.length === 0 || options.some((option) => optionMatches(brand, group, option)),
  );
}

function selectedFilterCount(filters: Record<string, string[]>) {
  return Object.values(filters).reduce((sum, options) => sum + options.length, 0);
}

function ListingSkeleton() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="skeleton-card rounded-2xl p-4 ring-1 ring-white/10">
          <div className="flex items-start gap-3">
            <div className="skeleton h-14 w-14 rounded-[17px]" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="skeleton h-4 w-2/3" />
              <div className="skeleton h-3 w-4/5" />
              <div className="skeleton h-3 w-1/2" />
            </div>
            <div className="skeleton h-7 w-7 rounded-full" />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {Array.from({ length: 4 }).map((__, metricIndex) => (
              <div key={metricIndex} className="skeleton h-16 rounded-xl" />
            ))}
          </div>
          <div className="mt-3 skeleton h-10 rounded-xl" />
          <div className="mt-3 grid grid-cols-2 gap-1.5">
            <div className="skeleton h-8 rounded-full" />
            <div className="skeleton h-8 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

function StatePanel({
  icon: Icon,
  title,
  body,
  action,
}: {
  icon: LucideIcon;
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/12 bg-white/[0.045] p-8 text-center">
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-primary/18 text-primary ring-1 ring-primary/25">
        <Icon className="h-5 w-5" />
      </div>
      <h2 className="mt-4 text-base font-bold text-white">{title}</h2>
      <p className="mx-auto mt-2 max-w-lg text-xs leading-5 text-white/55">{body}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

function BrandLogo({
  brand,
  size = "card",
}: {
  brand: AdminBrandRecord;
  size?: "card" | "recommendation";
}) {
  const [failed, setFailed] = useState(false);
  const identity = asRecord(brand.identity);
  const profile = asRecord(brand.profile);
  const src = resolveMediaUrl(
    brand.thumbnail,
    identity.logo,
    identity.logoUrl,
    profile.logo,
    profile.logoUrl,
  );
  const initials = brand.name
    .split(/\s+/)
    .map((word) => word[0])
    .join("")
    .slice(0, 3)
    .toUpperCase();
  const sizeClass =
    size === "recommendation"
      ? "h-[52px] w-[52px] rounded-[16px]"
      : "h-14 w-14 rounded-[17px]";

  return (
    <div
      className={`grid ${sizeClass} shrink-0 place-items-center overflow-hidden ${
        src && !failed ? "bg-white/[0.04] ring-1 ring-white/10" : "bg-primary/20"
      }`}
    >
      {src && !failed ? (
        <img
          src={src}
          alt={`${brand.name} logo`}
          className="h-full w-full object-contain p-1"
          loading="lazy"
          onError={() => setFailed(true)}
        />
      ) : (
        <span className="text-xs font-black text-white">{initials}</span>
      )}
    </div>
  );
}

function Rating({ score }: { score: number }) {
  const normalized = Math.round(score / 2);
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          className={`h-3 w-3 ${
            index < normalized ? "fill-primary text-primary" : "text-white/18"
          }`}
        />
      ))}
    </div>
  );
}

function BrandCard({
  brand,
  config,
  compared,
  copiedCode,
  followBusy,
  onCompare,
  onCopy,
  onFollow,
}: {
  brand: AdminBrandRecord;
  config: ListingCategoryConfig;
  compared: boolean;
  copiedCode: string | null;
  followBusy: boolean;
  onCompare: (brand: AdminBrandRecord) => void;
  onCopy: (code: string) => void;
  onFollow: (brand: AdminBrandRecord) => void;
}) {
  const country = countryForBrand(brand);
  const stage = publicTbiStageTheme(resolveBrandTbiState(brand));
  const score = scoreOutOf100(brand.tbi);
  const promo = promoData(brand);
  const website = brandWebsite(brand);
  const metrics = metricRows(brand, config.metricProfile);

  return (
    <article className="glass flex h-full flex-col overflow-hidden rounded-2xl p-4 ring-1 ring-violet-400/20 transition duration-200 hover:-translate-y-0.5 hover:bg-white/[0.07] hover:ring-primary/35">
      <div className="flex items-start gap-3">
        <div className="relative shrink-0">
          <BrandLogo brand={brand} />
          <span
            className={`absolute -bottom-1 -right-1 grid h-4 w-4 place-items-center rounded-full ring-2 ring-[var(--rb-bg-input)] ${stage.dot}`}
            title={stage.label}
          >
            <ShieldCheck className="h-2.5 w-2.5 text-white" />
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <Link
                to="/firm/$firmId"
                params={{ firmId: brand.slug || brand.id }}
                className="block truncate text-sm font-bold text-white hover:text-primary"
              >
                {brand.name}
              </Link>
              <p className="mt-0.5 line-clamp-1 text-[10px] text-white/48">
                {brandDescription(brand)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onFollow(brand)}
              disabled={followBusy}
              className={`grid h-7 w-7 shrink-0 place-items-center rounded-full transition ${
                brand.isFollowing
                  ? "bg-primary/25 text-primary"
                  : "bg-white/[0.055] text-white/45 hover:text-primary"
              }`}
              aria-label={brand.isFollowing ? `Unfollow ${brand.name}` : `Follow ${brand.name}`}
            >
              <Heart className={`h-3.5 w-3.5 ${brand.isFollowing ? "fill-current" : ""}`} />
            </button>
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-white/65">
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3 w-3 text-primary" />
              {country.flag && <span>{country.flag}</span>}
              {country.code || country.label}
            </span>
            <span>TBI {tbiLabel(brand.tbi)}</span>
            <span className="inline-flex items-center gap-1">
              <Users className="h-3 w-3 text-primary" />
              {compactCount(brand.followersCount)}
            </span>
            <span className="inline-flex items-center gap-1">
              <MessageSquare className="h-3 w-3 text-primary" />
              {compactCount(brand.reviewsCount)}
            </span>
          </div>
          <div className="mt-1.5 flex items-center gap-1.5 text-[10px]">
            <Rating score={score / 10} />
            <span className="font-bold text-white/75">{(score / 20).toFixed(1)}</span>
            <span className={`ml-auto rounded-full px-2 py-0.5 text-[9px] font-bold ring-1 ${stage.chip}`}>
              {stage.label}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        {metrics.map((metric) => (
          <div key={metric.label} className="min-w-0 rounded-lg bg-white/[0.045] p-2 ring-1 ring-white/10">
            <div className="text-[9px] font-bold uppercase tracking-[0.1em] text-white/40">
              {metric.label}
            </div>
            <div
              title={metric.value}
              className={`mt-0.5 truncate text-sm font-bold ${
                metric.tone === "success"
                  ? "text-emerald-300"
                  : metric.tone === "primary"
                    ? "text-fuchsia-300"
                    : "text-white"
              }`}
            >
              {metric.value}
            </div>
          </div>
        ))}
      </div>

      {promo.code ? (
        <button
          type="button"
          onClick={() => onCopy(promo.code)}
          className="mt-3 flex w-full items-center justify-between rounded-lg border border-dashed border-primary/45 bg-primary/10 px-3 py-2 text-left transition hover:bg-primary/16"
        >
          <div className="min-w-0">
            <div className="truncate text-[9px] font-bold uppercase tracking-[0.1em] text-primary">
              {promo.label || "Promo code"}
            </div>
            <div className="truncate font-mono text-sm font-black tracking-wider text-white">
              {promo.code}
            </div>
          </div>
          <span className="ml-3 inline-flex shrink-0 items-center gap-1 text-[10px] font-semibold text-primary">
            {copiedCode === promo.code ? (
              <>
                <Check className="h-3 w-3" /> Copied
              </>
            ) : (
              <>
                <Copy className="h-3 w-3" /> Copy
              </>
            )}
          </span>
        </button>
      ) : (
        <div className="mt-3 flex min-h-12 items-center justify-between rounded-lg border border-primary/20 bg-primary/[0.08] px-3 py-2">
          <div>
            <div className="text-[9px] font-bold uppercase tracking-[0.1em] text-primary">
              Rebate status
            </div>
            <div className="text-xs font-bold text-white">{promo.label || "Check profile for availability"}</div>
          </div>
          <BadgePercent className="h-4 w-4 text-primary" />
        </div>
      )}

      <div className="mt-auto pt-3">
        <div className="grid grid-cols-2 gap-1.5">
          {website ? (
            <a
              href={website}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-1 rounded-full rb-gradient-primary px-2 py-2 text-[10px] font-bold text-white transition hover:brightness-110"
            >
              <Rocket className="h-3 w-3" /> Visit Website
            </a>
          ) : (
            <span className="inline-flex items-center justify-center rounded-full bg-white/[0.055] px-2 py-2 text-[10px] font-bold text-white/40 ring-1 ring-white/10">
              Website pending
            </span>
          )}
          <Link
            to="/firm/$firmId"
            params={{ firmId: brand.slug || brand.id }}
            className="inline-flex items-center justify-center gap-1 rounded-full bg-white/[0.075] px-2 py-2 text-[10px] font-bold text-white ring-1 ring-white/15 transition hover:bg-white/[0.12]"
          >
            <Eye className="h-3 w-3" /> View Details
          </Link>
        </div>
        <button
          type="button"
          onClick={() => onFollow(brand)}
          disabled={followBusy}
          className={`mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-full px-2 py-1.5 text-[10px] font-bold ring-1 transition ${
            brand.isFollowing
              ? "bg-white text-violet-950 ring-white/80"
              : "bg-white/[0.055] text-white ring-white/12 hover:bg-white/[0.1]"
          }`}
        >
          {brand.isFollowing ? <UserCheck className="h-3 w-3" /> : <UserPlus className="h-3 w-3" />}
          {followBusy ? "Updating..." : brand.isFollowing ? "Following" : "Follow"}
        </button>
        <label className="mt-2 flex items-center gap-1.5 text-[10px] text-white/48">
          <input
            type="checkbox"
            checked={compared}
            onChange={() => onCompare(brand)}
            className="h-3.5 w-3.5 accent-primary"
          />
          Add to compare
        </label>
      </div>
    </article>
  );
}

function RecommendationCard({ brand }: { brand: AdminBrandRecord }) {
  const stage = publicTbiStageTheme(resolveBrandTbiState(brand));
  const firstMetric = metricRows(brand, /broker/i.test(brand.category) ? "broker" : /exchange/i.test(brand.category) ? "exchange" : /prop/i.test(brand.category) ? "prop" : "tool")[0];

  return (
    <Link
      to="/firm/$firmId"
      params={{ firmId: brand.slug || brand.id }}
      className="group flex min-w-0 items-center gap-3 rounded-2xl border border-white/10 bg-black/15 p-3 transition hover:border-primary/35 hover:bg-white/[0.065]"
    >
      <BrandLogo brand={brand} size="recommendation" />
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-black text-white group-hover:text-primary">{brand.name}</div>
        <div className="mt-1 flex items-center gap-2">
          <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ring-1 ${stage.chip}`}>
            {stage.label}
          </span>
          <span className="text-[10px] font-bold text-white/60">TBI {tbiLabel(brand.tbi)}</span>
        </div>
        <div className="mt-1 truncate text-[10px] text-white/45">
          {firstMetric.label}: <span className="font-semibold text-white/70">{firstMetric.value}</span>
        </div>
      </div>
      <ArrowUpRight className="h-4 w-4 shrink-0 text-white/35 transition group-hover:text-primary" />
    </Link>
  );
}

function FilterSidebar({
  groups,
  selected,
  openGroups,
  onToggleGroup,
  onToggleOption,
  onClear,
}: {
  groups: FilterGroup[];
  selected: Record<string, string[]>;
  openGroups: Record<string, boolean>;
  onToggleGroup: (group: string) => void;
  onToggleOption: (group: string, option: string) => void;
  onClear: () => void;
}) {
  const count = selectedFilterCount(selected);
  return (
    <aside className="glass rounded-2xl p-4 ring-1 ring-violet-400/20">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <div className="text-xs font-black text-white">Filters</div>
          <div className="text-[10px] text-white/42">{count} active</div>
        </div>
        {count > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="inline-flex items-center gap-1 rounded-full bg-white/[0.07] px-2 py-1 text-[10px] font-bold text-white/65 ring-1 ring-white/10 hover:text-white"
          >
            <X className="h-3 w-3" /> Clear
          </button>
        )}
      </div>
      {groups.map((group, index) => {
        const isOpen = openGroups[group.name] ?? index < 2;
        return (
          <div key={group.name} className={index ? "mt-3 border-t border-white/10 pt-3" : ""}>
            <button
              type="button"
              onClick={() => onToggleGroup(group.name)}
              className="flex w-full items-center justify-between gap-3 text-left text-xs font-bold text-white/88"
              aria-expanded={isOpen}
            >
              <span>{group.name}</span>
              <ChevronDown
                className={`h-3.5 w-3.5 shrink-0 text-white/45 transition-transform ${
                  isOpen ? "" : "-rotate-90"
                }`}
              />
            </button>
            {isOpen && (
              <div className="mt-2 space-y-1.5">
                {group.options.map((option) => (
                  <label
                    key={option}
                    className="flex cursor-pointer items-start gap-2 text-[11px] leading-4 text-white/55 hover:text-white/80"
                  >
                    <input
                      type="checkbox"
                      checked={(selected[group.name] ?? []).includes(option)}
                      onChange={() => onToggleOption(group.name, option)}
                      className="mt-0.5 h-3.5 w-3.5 shrink-0 accent-primary"
                    />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </aside>
  );
}

export function PublicCategoryListing({ config }: { config: ListingCategoryConfig }) {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [brands, setBrands] = useState<AdminBrandRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("recommended");
  const [filters, setFilters] = useState<Record<string, string[]>>({});
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [comparedIds, setComparedIds] = useState<string[]>(() =>
    readCompareSelection(),
  );
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [followBusy, setFollowBusy] = useState<string | null>(null);

  const loadBrands = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await apiRequest<AdminBrandRecord[]>(
        "/admin-brand/public-list?page=0&size=250",
        { method: "GET", cache: "no-store", token },
      );
      setBrands((response.payload ?? []).filter(isPublishedBrand));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load listings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadBrands();
  }, [token]);

  useEffect(() => {
    setFilters({});
    setSearch("");
    setSortMode("recommended");
    setVisibleCount(PAGE_SIZE);
  }, [config.id]);

  const categoryBrands = useMemo(
    () => brands.filter((brand) => matchesCategory(brand, config)),
    [brands, config],
  );
  const filterGroups = useMemo(
    () => filterGroupsFor(config, categoryBrands),
    [config, categoryBrands],
  );
  const filteredBrands = useMemo(() => {
    const query = search.trim().toLowerCase();
    const matches = categoryBrands.filter(
      (brand) =>
        (!query || searchableText(brand).includes(query)) &&
        matchesSelectedFilters(brand, filters),
    );
    return sortBrands(matches, sortMode);
  }, [categoryBrands, filters, search, sortMode]);
  const visibleBrands = filteredBrands.slice(0, visibleCount);
  const recommendedBrands = useMemo(() => {
    return categoryBrands
      .filter((brand) => {
        const flags = asRecord(brand.flags);
        return flags.recommended === true || flags.editorPick === true || flags.featured === true;
      })
      .sort(sortByRankAndTrust)
      .slice(0, 4);
  }, [categoryBrands]);

  const toggleFilter = (group: string, option: string) => {
    setFilters((current) => {
      const currentOptions = current[group] ?? [];
      const nextOptions = currentOptions.includes(option)
        ? currentOptions.filter((item) => item !== option)
        : [...currentOptions, option];
      const next = { ...current };
      if (nextOptions.length) next[group] = nextOptions;
      else delete next[group];
      return next;
    });
    setVisibleCount(PAGE_SIZE);
  };

  const toggleCompare = (brand: AdminBrandRecord) => {
    setComparedIds((current) => toggleCompareSelection(current, brand.id));
  };

  const toggleFollow = async (brand: AdminBrandRecord) => {
    if (!token) {
      void navigate({ to: "/login" });
      return;
    }
    const previous = brands;
    setFollowBusy(brand.id);
    setBrands((current) =>
      current.map((item) =>
        item.id === brand.id
          ? {
              ...item,
              isFollowing: !item.isFollowing,
              followersCount: Math.max(
                0,
                Number(item.followersCount ?? 0) + (item.isFollowing ? -1 : 1),
              ),
            }
          : item,
      ),
    );
    try {
      const updated = brand.isFollowing
        ? await unfollowAdminBrand(brand.id, token)
        : await followAdminBrand(brand.id, token);
      setBrands((current) =>
        current.map((item) => (item.id === updated.id ? { ...item, ...updated } : item)),
      );
    } catch {
      setBrands(previous);
    } finally {
      setFollowBusy(null);
    }
  };

  const copyPromo = (code: string) => {
    void navigator.clipboard?.writeText(code);
    setCopiedCode(code);
    window.setTimeout(() => setCopiedCode(null), 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a0b2e] via-[#1f0d3d] to-[#150829] text-white">
      <SiteHeader />
      <main className="container-app relative py-6">
        <div className="pointer-events-none absolute left-1/3 top-10 h-[420px] w-[420px] rounded-full bg-primary/10 blur-[120px]" />

        <div className="relative mb-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-primary">
              {config.eyebrow}
            </div>
            <h1 className="mt-1 text-2xl font-black text-white">{config.title}</h1>
            <p className="mt-1 max-w-xl text-xs leading-5 text-white/52">{config.description}</p>
          </div>
          <div className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto">
            <label className="relative min-w-0 flex-1 lg:w-80">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/42" />
              <input
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setVisibleCount(PAGE_SIZE);
                }}
                placeholder={config.searchPlaceholder}
                className="h-11 w-full rounded-full bg-white/[0.075] pl-10 pr-4 text-sm font-semibold text-white outline-none ring-1 ring-white/14 placeholder:text-white/34 focus:ring-primary/55"
              />
            </label>
            {comparedIds.length > 0 && (
              <Link
                to="/compare"
                className="inline-flex h-11 items-center justify-center rounded-full bg-primary px-4 text-xs font-bold text-white"
              >
                Compare {comparedIds.length}
              </Link>
            )}
          </div>
        </div>

        {!loading && !error && recommendedBrands.length > 0 && (
          <section className="relative mb-4 overflow-hidden rounded-2xl border border-white/12 bg-white/[0.04] p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <div>
                  <h2 className="text-sm font-black text-white">Recommended Brands</h2>
                  <p className="text-[10px] text-white/42">Admin-featured profiles for this category.</p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/12 px-3 py-1 text-[10px] font-bold text-primary ring-1 ring-primary/20">
                <ShieldCheck className="h-3 w-3" /> Featured by RebateBoard
              </span>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
              {recommendedBrands.map((brand) => (
                <RecommendationCard key={brand.id} brand={brand} />
              ))}
            </div>
          </section>
        )}

        <section className="relative mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/12 bg-white/[0.04] p-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setMobileFiltersOpen((value) => !value)}
              className="inline-flex items-center gap-2 rounded-full bg-white/[0.07] px-3 py-2 text-xs font-bold text-white ring-1 ring-white/12 lg:hidden"
            >
              <Filter className="h-3.5 w-3.5 text-primary" />
              Filters
              {selectedFilterCount(filters) > 0 && (
                <span className="rounded-full bg-primary px-1.5 py-0.5 text-[9px]">
                  {selectedFilterCount(filters)}
                </span>
              )}
            </button>
            <label className="inline-flex items-center gap-2 rounded-full bg-white/[0.06] px-3 ring-1 ring-white/10">
              <TrendingUp className="h-3.5 w-3.5 text-primary" />
              <select
                value={sortMode}
                onChange={(event) => {
                  setSortMode(event.target.value as SortMode);
                  setVisibleCount(PAGE_SIZE);
                }}
                className="h-9 bg-transparent pr-1 text-xs font-bold text-white outline-none"
                aria-label="Sort listings"
              >
                <option value="recommended" className="bg-[var(--rb-bg-input)]">Recommended</option>
                <option value="recent" className="bg-[var(--rb-bg-input)]">Recently Added</option>
                <option value="tbi" className="bg-[var(--rb-bg-input)]">Highest TBI</option>
                <option value="name" className="bg-[var(--rb-bg-input)]">Brand Name</option>
              </select>
            </label>
          </div>
          <span className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-white/[0.055] px-3 py-2 text-[11px] font-semibold text-white/55 ring-1 ring-white/10 sm:w-auto">
            <SlidersHorizontal className="h-3.5 w-3.5 text-primary" />
            {filteredBrands.length} {filteredBrands.length === 1 ? "brand" : "brands"}
          </span>
        </section>

        {mobileFiltersOpen && (
          <div className="relative mb-4 lg:hidden">
            <FilterSidebar
              groups={filterGroups}
              selected={filters}
              openGroups={openGroups}
              onToggleGroup={(group) =>
                setOpenGroups((current) => ({ ...current, [group]: !(current[group] ?? true) }))
              }
              onToggleOption={toggleFilter}
              onClear={() => setFilters({})}
            />
          </div>
        )}

        <div className="relative grid gap-4 lg:grid-cols-[240px_minmax(0,1fr)]">
          <div className="hidden self-start lg:sticky lg:top-[9.5rem] lg:block">
            <FilterSidebar
              groups={filterGroups}
              selected={filters}
              openGroups={openGroups}
              onToggleGroup={(group) =>
                setOpenGroups((current) => ({ ...current, [group]: !(current[group] ?? true) }))
              }
              onToggleOption={toggleFilter}
              onClear={() => setFilters({})}
            />
          </div>

          <div className="min-w-0">
            {loading ? (
              <ListingSkeleton />
            ) : error ? (
              <StatePanel
                icon={AlertCircle}
                title="Listings could not be loaded"
                body={error}
                action={
                  <button
                    type="button"
                    onClick={loadBrands}
                    className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-bold text-white"
                  >
                    <RefreshCw className="h-3.5 w-3.5" /> Try again
                  </button>
                }
              />
            ) : categoryBrands.length === 0 ? (
              <StatePanel
                icon={Sparkles}
                title={`${config.title} are coming to RebateBoard`}
                body={`There are no published ${config.title.toLowerCase()} yet. Once the research team publishes a brand from the admin dashboard, its logo, profile, category facts, TBI state, and available rewards will appear here automatically.`}
              />
            ) : filteredBrands.length === 0 ? (
              <StatePanel
                icon={Search}
                title="No brands match these filters"
                body="Clear one or more filters, try another search term, or switch the sorting option."
                action={
                  <button
                    type="button"
                    onClick={() => {
                      setFilters({});
                      setSearch("");
                    }}
                    className="rounded-full bg-white/[0.08] px-4 py-2 text-xs font-bold text-white ring-1 ring-white/14"
                  >
                    Clear filters
                  </button>
                }
              />
            ) : (
              <>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {visibleBrands.map((brand) => (
                    <BrandCard
                      key={brand.id}
                      brand={brand}
                      config={config}
                      compared={comparedIds.includes(brand.id)}
                      copiedCode={copiedCode}
                      followBusy={followBusy === brand.id}
                      onCompare={toggleCompare}
                      onCopy={copyPromo}
                      onFollow={toggleFollow}
                    />
                  ))}
                </div>
                {visibleCount < filteredBrands.length && (
                  <div className="mt-5 flex justify-center">
                    <button
                      type="button"
                      onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
                      className="rounded-full bg-white/[0.075] px-5 py-2.5 text-xs font-bold text-white ring-1 ring-white/14 transition hover:bg-white/[0.12]"
                    >
                      Load more brands
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
