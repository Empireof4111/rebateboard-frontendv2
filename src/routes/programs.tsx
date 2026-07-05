import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  BadgePercent,
  Check,
  ChevronDown,
  Copy,
  Eye,
  Flame,
  MapPin,
  MessageSquare,
  RefreshCw,
  Rocket,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  TrendingUp,
  UserCheck,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { API_BASE_URL } from "@/lib/api";
import {
  fetchPublicAdminBrands,
  followAdminBrand,
  unfollowAdminBrand,
  type AdminBrandCategory,
  type AdminBrandRecord,
} from "@/lib/admin-brands-api";
import { useAuth } from "@/lib/auth";
import { resolveCountryDisplay } from "@/lib/country-format";
import { isPublishedBrand } from "@/lib/public-brand";

export const Route = createFileRoute("/programs")({
  head: () => ({
    meta: [
      { title: "All Prop Firms - Funded Trader Challenges | RebateBoard" },
      {
        name: "description",
        content:
          "Browse every prop firm. Compare max allocation, profit split, fees and grab exclusive promo codes.",
      },
      { property: "og:title", content: "All Prop Firms - RebateBoard" },
      {
        property: "og:description",
        content: "Funded trader prop firms with promo codes, allocation limits, and profit splits.",
      },
    ],
  }),
  component: ProgramsPage,
});

const FOREX_PROP_FIRM_CATEGORY: AdminBrandCategory = "Prop Firm";
const PROGRAM_CACHE_KEY = "rb_public_forex_prop_firms_v4";

type Program = {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  maxAllocation: string;
  profitSplit: string;
  startingFee: string;
  promo: string;
  promoOff: string;
  rating: number;
  tbiLabel: string;
  payout: string;
  countryCode: string;
  countryFlag: string;
  countryName: string;
  followersCount: number;
  reviewsCount: number;
  isFollowing: boolean;
  hot: boolean;
  verified: boolean;
  programTypes: string[];
  maxAllocationAmount: number | null;
  profitSplitValue: number | null;
  startingFeeAmount: number | null;
  payoutTags: string[];
  logo?: string;
  website?: string;
};

type FilterGroup = { name: string; options: string[] };

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

function firstCleanText(...values: unknown[]) {
  for (const value of values) {
    const text = cleanText(value);
    if (text) return text;
  }
  return "";
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};
}

function activeChallenges(value: unknown): Record<string, unknown>[] {
  if (!Array.isArray(value)) return [];
  return value.map(asRecord).filter((challenge) => challenge.active !== false);
}

function firstChallengeText(challenges: Record<string, unknown>[], keys: string[]) {
  for (const challenge of challenges) {
    for (const key of keys) {
      const text = cleanText(challenge[key]);
      if (text) return text;
    }
  }
  return "";
}

function parseMoneyAmount(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const text = cleanText(value)
    .toLowerCase()
    .replace(/[$,\s]/g, "");
  const match = text.match(/^(\d+(?:\.\d+)?)(k|m)?$/);
  if (!match) return null;
  const amount = Number(match[1]);
  if (!Number.isFinite(amount)) return null;
  const suffix = match[2];
  if (suffix === "m") return amount * 1_000_000;
  if (suffix === "k") return amount * 1_000;
  return amount;
}

function parseMoneyAmounts(value: unknown) {
  const text = cleanText(value);
  if (!text) return [];
  const matches = text.match(/\$?\d[\d,.]*(?:\.\d+)?\s*[kKmM]?/g) ?? [];
  return matches
    .map((match) => parseMoneyAmount(match))
    .filter((amount): amount is number => typeof amount === "number" && Number.isFinite(amount));
}

function maxMoneyAmount(value: unknown) {
  const amounts = parseMoneyAmounts(value);
  return amounts.length ? Math.max(...amounts) : null;
}

function minMoneyAmount(value: unknown) {
  const amounts = parseMoneyAmounts(value);
  return amounts.length ? Math.min(...amounts) : null;
}

function formatCompactUsd(amount: number) {
  if (amount >= 1_000_000) {
    return `$${Number((amount / 1_000_000).toFixed(1)).toLocaleString("en-US")}M`;
  }
  if (amount >= 1_000) {
    return `$${Number((amount / 1_000).toFixed(1)).toLocaleString("en-US")}K`;
  }
  return amount.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

function formatMoneyish(value: unknown) {
  const text = cleanText(value);
  if (!text) return "";
  const amount = parseMoneyAmount(text);
  const moneyOnly = /^[\s$,\d.kmKM]+$/.test(text);
  return amount && moneyOnly ? formatCompactUsd(amount) : text;
}

function formatCurrency(value: number) {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: value >= 100 ? 0 : 2,
  });
}

function normalizePercent(value: unknown, suffix = "") {
  const text = cleanText(value);
  if (!text) return "";
  const match = text.match(/\d+(?:\.\d+)?/);
  if (!match) return text;
  const percent = text.includes("%") ? match[0] : `${Number(match[0])}`;
  const base = `${percent}%`;
  return suffix ? `${base} ${suffix}` : base;
}

function resolveStartingFee(prop: Record<string, unknown>, challenges: Record<string, unknown>[]) {
  const pricing = firstCleanText(prop.pricing, prop.startingFee, prop.price);
  if (pricing) return pricing;

  const prices = challenges
    .map((challenge) => parseMoneyAmount(challenge.price))
    .filter((price): price is number => typeof price === "number" && price > 0);
  return prices.length ? formatCurrency(Math.min(...prices)) : "See pricing";
}

function resolveStartingFeeAmount(
  prop: Record<string, unknown>,
  challenges: Record<string, unknown>[],
) {
  const direct = minMoneyAmount(firstCleanText(prop.pricing, prop.startingFee, prop.price));
  if (direct !== null) return direct;

  const prices = challenges
    .map((challenge) => minMoneyAmount(challenge.price))
    .filter((price): price is number => typeof price === "number" && price > 0);
  return prices.length ? Math.min(...prices) : null;
}

function resolveMaxAllocation(
  prop: Record<string, unknown>,
  challenges: Record<string, unknown>[],
) {
  const direct = firstCleanText(prop.maxAlloc, prop.maxAllocation, prop.maximumAllocation);
  if (direct) return formatMoneyish(direct);

  const sizes = challenges
    .map((challenge) => parseMoneyAmount(challenge.size))
    .filter((size): size is number => typeof size === "number" && size > 0);
  return sizes.length ? formatCompactUsd(Math.max(...sizes)) : "See details";
}

function resolveMaxAllocationAmount(
  prop: Record<string, unknown>,
  challenges: Record<string, unknown>[],
) {
  const direct = maxMoneyAmount(
    firstCleanText(prop.maxAlloc, prop.maxAllocation, prop.maximumAllocation),
  );
  if (direct !== null) return direct;

  const sizes = challenges
    .map((challenge) => maxMoneyAmount(challenge.size))
    .filter((size): size is number => typeof size === "number" && size > 0);
  return sizes.length ? Math.max(...sizes) : null;
}

function parsePercentValue(value: unknown) {
  const text = cleanText(value);
  const match = text.match(/\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : null;
}

function resolveProgramTypes(prop: Record<string, unknown>, challenges: Record<string, unknown>[]) {
  const haystack = [
    prop.evalType,
    prop.programType,
    prop.type,
    prop.fundingType,
    ...challenges.flatMap((challenge) => [challenge.program, challenge.type, challenge.name]),
  ]
    .map(cleanText)
    .join(" ")
    .toLowerCase();
  const types = new Set<string>();

  if (/(^|\D)1\s*[- ]?\s*step|one\s*[- ]?\s*step/.test(haystack)) types.add("1-Step Challenge");
  if (/(^|\D)2\s*[- ]?\s*step|two\s*[- ]?\s*step/.test(haystack)) types.add("2-Step Challenge");
  if (/instant/.test(haystack)) types.add("Instant Funding");
  if (/evaluation|challenge|phase/.test(haystack) || !types.size) types.add("Evaluation");

  return Array.from(types);
}

function resolvePayoutTags(value: string) {
  const text = value.toLowerCase();
  const tags = new Set<string>();
  if (/request|on\s*demand|anytime/.test(text)) tags.add("On Request");
  if (/bi[-\s]?weekly|14\s*day|fortnight/.test(text)) tags.add("Bi-weekly");
  if (/weekly|7\s*day|10\s*day/.test(text)) tags.add("Weekly");
  if (/monthly|30\s*day/.test(text)) tags.add("Monthly");
  return Array.from(tags);
}

function compactCount(value: number) {
  if (value >= 1_000_000) return `${Number((value / 1_000_000).toFixed(1))}M`;
  if (value >= 1_000) return `${Number((value / 1_000).toFixed(value >= 10_000 ? 0 : 1))}K`;
  return value.toLocaleString();
}

function resolvePromo(
  prop: Record<string, unknown>,
  cashback: Record<string, unknown>,
  challenges: Record<string, unknown>[],
) {
  const code = firstCleanText(
    prop.discountCode,
    prop.promoCode,
    firstChallengeText(challenges, ["discountCode", "promoCode", "code"]),
  );
  const discount = firstCleanText(prop.discountPercentage, prop.discountPct, prop.discount);
  if (discount) {
    return { code, label: normalizePercent(discount, "OFF") };
  }

  const cashbackPct = firstCleanText(
    cashback.maxPct,
    cashback.defaultPct,
    cashback.percent,
    cashback.rebatePct,
  );
  if (cashbackPct) {
    return { code, label: `Up to ${normalizePercent(cashbackPct)} cashback` };
  }

  return { code, label: code ? "Promo Code" : "Cashback eligible" };
}

function resolveCountry(brand: AdminBrandRecord) {
  const identity = asRecord(brand.identity);
  const profile = asRecord(brand.profile);
  const country = resolveCountryDisplay(
    identity.country,
    identity.hq,
    identity.location,
    profile.country,
  );
  return { code: country.code, flag: country.flag, name: country.label };
}

function normalizeUrl(value: unknown) {
  const url = cleanText(value);
  if (!url) return "";
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

function resolveMediaUrl(...values: unknown[]) {
  const value = firstCleanText(...values);
  if (!value) return "";
  if (/^(https?:|data:|blob:)/i.test(value)) return value;

  const apiOrigin = API_BASE_URL.replace(/\/api\/v1$/i, "");
  if (value.startsWith("/api/v1/")) return `${apiOrigin}${value}`;
  if (value.startsWith("/file/")) return `${API_BASE_URL}${value}`;
  if (value.startsWith("/")) return `${apiOrigin}${value}`;

  return `${API_BASE_URL}/file/view?key=${encodeURIComponent(value)}`;
}

function tbiDisplay(value: unknown) {
  const raw = Number(value ?? 0);
  const score = Number.isFinite(raw) ? raw : 0;
  if (score > 10) {
    return {
      rating: Math.max(0, Math.min(5, score / 20)),
      label: `${Math.round(score)}/100`,
    };
  }
  return {
    rating: Math.max(0, Math.min(5, score / 2)),
    label: `${Number(score.toFixed(1))}/10`,
  };
}

function normalizeProgram(brand: AdminBrandRecord): Program {
  const identity = asRecord(brand.identity);
  const founder = asRecord(brand.founder);
  const prop = asRecord(brand.prop);
  const cashback = asRecord(brand.cashback);
  const flags = asRecord(brand.flags);
  const challenges = activeChallenges(brand.challenges);
  const country = resolveCountry(brand);
  const promo = resolvePromo(prop, cashback, challenges);
  const tbi = tbiDisplay(brand.tbi);
  const discountIsHot = /\d/.test(promo.label) && /off|cashback/i.test(promo.label);
  const payout =
    firstCleanText(
      prop.payoutSchedule,
      prop.payoutFreq,
      firstChallengeText(challenges, ["payoutFreq", "payoutSchedule"]),
      brand.payouts,
    ) || "See details";
  const profitSplit =
    firstCleanText(prop.profitSplit, firstChallengeText(challenges, ["profitSplit"])) ||
    "See details";

  return {
    id: brand.id,
    slug: brand.slug,
    name: brand.name,
    tagline: firstCleanText(identity.tagline, identity.description, founder.tags, brand.category),
    maxAllocation: resolveMaxAllocation(prop, challenges),
    profitSplit,
    startingFee: resolveStartingFee(prop, challenges),
    promo: promo.code,
    promoOff: promo.label,
    rating: tbi.rating,
    tbiLabel: tbi.label,
    payout,
    countryCode: country.code,
    countryFlag: country.flag,
    countryName: country.name,
    followersCount: Number(brand.followersCount ?? 0),
    reviewsCount: Number(brand.reviewsCount ?? 0),
    isFollowing: Boolean(brand.isFollowing),
    hot:
      Boolean(flags.featured) ||
      discountIsHot ||
      (typeof brand.rankOverride === "number" && brand.rankOverride <= 3),
    verified: brand.visibility === "published",
    programTypes: resolveProgramTypes(prop, challenges),
    maxAllocationAmount: resolveMaxAllocationAmount(prop, challenges),
    profitSplitValue: parsePercentValue(profitSplit),
    startingFeeAmount: resolveStartingFeeAmount(prop, challenges),
    payoutTags: resolvePayoutTags(payout),
    logo: resolveMediaUrl(brand.thumbnail, brand.cover),
    website: normalizeUrl(brand.website || identity.website),
  };
}

function ProgramLogo({ program }: { program: Program }) {
  const [failed, setFailed] = useState(false);

  if (program.logo && !failed) {
    return (
      <div className="h-12 w-12 overflow-hidden rounded-lg bg-white/5 ring-1 ring-white/10">
        <img
          src={program.logo}
          alt={`${program.name} logo`}
          className="h-full w-full object-cover object-center"
          style={{ transform: "scale(1.25)" }}
          onError={() => setFailed(true)}
        />
      </div>
    );
  }

  return (
    <div className="grid h-12 w-12 place-items-center rounded-lg bg-gradient-to-br from-violet-300 to-fuchsia-400 text-[10px] font-bold text-violet-900">
      {program.name.slice(0, 3).toUpperCase()}
    </div>
  );
}

function readCachedBrands() {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(PROGRAM_CACHE_KEY);
    const items = raw ? (JSON.parse(raw) as AdminBrandRecord[]) : [];
    return items.filter(isPublishedBrand).map((brand) => ({ ...brand, isFollowing: false }));
  } catch {
    return [];
  }
}

function writeCachedBrands(brands: AdminBrandRecord[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      PROGRAM_CACHE_KEY,
      JSON.stringify(brands.map((brand) => ({ ...brand, isFollowing: false }))),
    );
  } catch {
    // Local storage is only an optimization for slow dev databases.
  }
}

function countryOption(program: Program) {
  return [program.countryFlag, program.countryCode || program.countryName]
    .filter(Boolean)
    .join(" ");
}

function selectedCount(selectedFilters: Record<string, string[]>) {
  return Object.values(selectedFilters).reduce((sum, values) => sum + values.length, 0);
}

function optionMatchesProgram(program: Program, group: string, option: string) {
  if (group === "Program Type") return program.programTypes.includes(option);

  if (group === "Max Allocation") {
    const value = program.maxAllocationAmount;
    if (value === null) return false;
    if (option === "Up to $100k") return value <= 100_000;
    if (option === "$100k - $500k") return value > 100_000 && value <= 500_000;
    if (option === "$500k - $1M") return value > 500_000 && value <= 1_000_000;
    if (option === "$1M+") return value > 1_000_000;
  }

  if (group === "Profit Split") {
    const value = program.profitSplitValue;
    if (value === null) return false;
    if (option === "70 - 79%") return value >= 70 && value < 80;
    if (option === "80 - 89%") return value >= 80 && value < 90;
    if (option === "90 - 100%") return value >= 90;
  }

  if (group === "Starting Fee") {
    const value = program.startingFeeAmount;
    if (value === null) return false;
    if (option === "Under $50") return value < 50;
    if (option === "$50 - $100") return value >= 50 && value <= 100;
    if (option === "$100 - $250") return value > 100 && value <= 250;
    if (option === "$250+") return value > 250;
  }

  if (group === "Payout Frequency") return program.payoutTags.includes(option);
  if (group === "Country") return countryOption(program) === option;

  if (group === "Trust Signals") {
    if (option === "Verified") return program.verified;
    if (option === "TBI 7+") return program.rating >= 3.5;
    if (option === "Has Promo")
      return Boolean(program.promo) || /off|cashback/i.test(program.promoOff);
    if (option === "Has Reviews") return program.reviewsCount > 0;
    if (option === "Following") return program.isFollowing;
  }

  return true;
}

function programMatchesFilters(program: Program, selectedFilters: Record<string, string[]>) {
  return Object.entries(selectedFilters).every(([group, options]) => {
    if (!options.length) return true;
    return options.some((option) => optionMatchesProgram(program, group, option));
  });
}

function ProgramsPage() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [cachedBrands] = useState(() => readCachedBrands());
  const [brands, setBrands] = useState<AdminBrandRecord[]>(cachedBrands);
  const [loading, setLoading] = useState(cachedBrands.length === 0);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const [compare, setCompare] = useState<string[]>([]);
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>({});
  const [openFilters, setOpenFilters] = useState<Record<string, boolean>>({});
  const [followBusy, setFollowBusy] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);

    fetchPublicAdminBrands(FOREX_PROP_FIRM_CATEGORY, token)
      .then((items) => {
        if (!active) return;
        const forexPropFirms = items.filter(
          (item) => item.category === FOREX_PROP_FIRM_CATEGORY && isPublishedBrand(item),
        );
        setBrands(forexPropFirms);
        writeCachedBrands(forexPropFirms);
        setError(null);
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Could not load prop firms");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [token]);

  const programs = useMemo(
    () =>
      brands
        .filter((brand) => brand.category === FOREX_PROP_FIRM_CATEGORY && isPublishedBrand(brand))
        .map(normalizeProgram),
    [brands],
  );

  const filterGroups = useMemo<FilterGroup[]>(() => {
    const countryOptions = Array.from(new Set(programs.map(countryOption).filter(Boolean))).sort();
    return [
      {
        name: "Program Type",
        options: ["1-Step Challenge", "2-Step Challenge", "Instant Funding", "Evaluation"],
      },
      { name: "Max Allocation", options: ["Up to $100k", "$100k - $500k", "$500k - $1M", "$1M+"] },
      { name: "Profit Split", options: ["70 - 79%", "80 - 89%", "90 - 100%"] },
      { name: "Starting Fee", options: ["Under $50", "$50 - $100", "$100 - $250", "$250+"] },
      { name: "Payout Frequency", options: ["On Request", "Weekly", "Bi-weekly", "Monthly"] },
      ...(countryOptions.length ? [{ name: "Country", options: countryOptions }] : []),
      {
        name: "Trust Signals",
        options: ["Verified", "TBI 7+", "Has Promo", "Has Reviews", "Following"],
      },
    ];
  }, [programs]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    const byFilters = programs.filter((program) => programMatchesFilters(program, selectedFilters));
    if (!term) return byFilters;
    return byFilters.filter((program) =>
      [
        program.name,
        program.tagline,
        program.countryCode,
        program.countryName,
        program.payout,
        program.promo,
      ]
        .join(" ")
        .toLowerCase()
        .includes(term),
    );
  }, [programs, search, selectedFilters]);

  const trendingPrograms = useMemo(() => {
    const hot = programs.filter((program) => program.hot);
    return (hot.length ? hot : programs).slice(0, 6);
  }, [programs]);

  const toggleCompare = (id: string) => {
    setCompare((prev) =>
      prev.includes(id)
        ? prev.filter((value) => value !== id)
        : prev.length >= 4
          ? prev
          : [...prev, id],
    );
  };

  const toggleFilter = (group: string, option: string) => {
    setSelectedFilters((current) => {
      const values = current[group] ?? [];
      const nextValues = values.includes(option)
        ? values.filter((value) => value !== option)
        : [...values, option];
      const next = { ...current };
      if (nextValues.length) next[group] = nextValues;
      else delete next[group];
      return next;
    });
  };

  const toggleFilterGroup = (group: string) => {
    setOpenFilters((current) => ({ ...current, [group]: !(current[group] ?? true) }));
  };

  const replaceBrand = (updated: AdminBrandRecord) => {
    setBrands((current) =>
      current.map((brand) => (brand.id === updated.id ? { ...brand, ...updated } : brand)),
    );
  };

  const toggleFollow = async (program: Program) => {
    if (!token) {
      void navigate({ to: "/login" });
      return;
    }

    const previous = {
      followersCount: program.followersCount,
      isFollowing: program.isFollowing,
    };
    const next = {
      followersCount: Math.max(0, program.followersCount + (program.isFollowing ? -1 : 1)),
      isFollowing: !program.isFollowing,
    };

    setFollowBusy(program.id);
    setError(null);
    setBrands((current) =>
      current.map((brand) =>
        brand.id === program.id
          ? { ...brand, followersCount: next.followersCount, isFollowing: next.isFollowing }
          : brand,
      ),
    );

    try {
      const updated = program.isFollowing
        ? await unfollowAdminBrand(program.id, token)
        : await followAdminBrand(program.id, token);
      replaceBrand({
        ...updated,
        followersCount: Number(updated.followersCount ?? next.followersCount),
        isFollowing: Boolean(updated.isFollowing ?? next.isFollowing),
      });
    } catch (err) {
      setBrands((current) =>
        current.map((brand) =>
          brand.id === program.id
            ? {
                ...brand,
                followersCount: previous.followersCount,
                isFollowing: previous.isFollowing,
              }
            : brand,
        ),
      );
      setError(err instanceof Error ? err.message : "Could not update follow status");
    } finally {
      setFollowBusy(null);
    }
  };

  const copyPromo = (code: string) => {
    if (!code) return;
    navigator.clipboard?.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a0b2e] via-[#1f0d3d] to-[#150829] text-white">
      <SiteHeader />

      <div className="container-app relative py-6">
        <div className="glow-orb h-[500px] w-[500px] left-1/3 top-20 opacity-50" />

        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Forex Prop Firms</h1>
            <p className="text-xs text-muted-foreground">
              Uploaded admin records with live firm details, rebate data and TBI signals.
            </p>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            <div className="relative w-full sm:w-72">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/45" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="h-10 w-full rounded-full bg-white/10 pl-9 pr-3 text-sm text-white outline-none ring-1 ring-white/15 placeholder:text-white/35 focus:ring-fuchsia-300/60"
                placeholder="Search prop firms"
              />
            </div>
            {compare.length > 0 && (
              <Link
                to="/compare"
                className="rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-600 px-4 py-2 text-xs font-semibold shadow-[0_0_20px_rgba(192,132,252,0.5)]"
              >
                Compare {compare.length}
              </Link>
            )}
          </div>
        </div>

        {(loading || error) && (
          <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl bg-white/8 px-3 py-2 text-xs text-white/75 ring-1 ring-white/10">
            {loading ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin text-fuchsia-200" />
                Syncing Forex prop firms from admin uploads
              </>
            ) : (
              <>
                <AlertCircle className="h-3.5 w-3.5 text-orange-300" />
                {error}
              </>
            )}
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
          <aside className="glass self-start rounded-2xl p-4 ring-1 ring-violet-400/20">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div>
                <div className="text-xs font-bold">Filters</div>
                <div className="text-[10px] text-white/45">
                  {selectedCount(selectedFilters)} active
                </div>
              </div>
              {selectedCount(selectedFilters) > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedFilters({})}
                  className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-1 text-[10px] font-semibold text-white/70 ring-1 ring-white/10 hover:text-white"
                >
                  <X className="h-3 w-3" /> Clear
                </button>
              )}
            </div>
            {filterGroups.map((group, index) => {
              const isOpen = openFilters[group.name] ?? true;
              return (
                <div
                  key={group.name}
                  className={index > 0 ? "mt-3 border-t border-white/10 pt-3" : ""}
                >
                  <button
                    type="button"
                    onClick={() => toggleFilterGroup(group.name)}
                    className="flex w-full items-center justify-between rounded-md text-left transition hover:text-fuchsia-100"
                    aria-expanded={isOpen}
                  >
                    <div className="text-xs font-semibold">{group.name}</div>
                    <ChevronDown
                      className={`h-3 w-3 transition-transform ${isOpen ? "" : "-rotate-90"}`}
                    />
                  </button>
                  {isOpen && (
                    <div className="mt-2 space-y-1.5 text-[11px] text-muted-foreground">
                      {group.options.map((option) => (
                        <label key={option} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={(selectedFilters[group.name] ?? []).includes(option)}
                            onChange={() => toggleFilter(group.name, option)}
                            className="accent-fuchsia-400"
                          />{" "}
                          {option}
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </aside>

          <div className="space-y-4">
            {filtered.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {filtered.map((program) => {
                  const isCompared = compare.includes(program.id);
                  return (
                    <div
                      key={program.id}
                      className="glass relative overflow-hidden rounded-2xl p-4 ring-1 ring-violet-400/20"
                    >
                      <div className="flex items-start gap-3">
                        <div className="relative shrink-0">
                          <ProgramLogo program={program} />
                          {program.verified && (
                            <span className="absolute -bottom-1 -right-1 grid h-4 w-4 place-items-center rounded-full bg-emerald-500 ring-2 ring-[#1f0d3d]">
                              <ShieldCheck className="h-2.5 w-2.5" />
                            </span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-semibold">{program.name}</div>
                          <div className="truncate text-[10px] text-muted-foreground">
                            {program.tagline}
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] text-white/70">
                            <span className="inline-flex items-center gap-1">
                              <MapPin className="h-3 w-3 text-fuchsia-200" />
                              {program.countryFlag && <span>{program.countryFlag}</span>}
                              {program.countryCode || program.countryName}
                            </span>
                            <span>TBI {program.tbiLabel}</span>
                            <span className="inline-flex items-center gap-1">
                              <Users className="h-3 w-3 text-fuchsia-200" />
                              {compactCount(program.followersCount)}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <MessageSquare className="h-3 w-3 text-fuchsia-200" />
                              {compactCount(program.reviewsCount)}
                            </span>
                          </div>
                          <div className="mt-1 flex items-center gap-1 text-[10px]">
                            {[0, 1, 2, 3, 4].map((star) => (
                              <Star
                                key={star}
                                className={`h-3 w-3 ${star < Math.round(program.rating) ? "fill-yellow-400 text-yellow-400" : "text-yellow-400/30"}`}
                              />
                            ))}
                            <span className="ml-1 font-semibold">{program.rating.toFixed(1)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <div className="rounded-lg bg-white/5 p-2 ring-1 ring-white/10">
                          <div className="flex items-center gap-1 text-[9px] uppercase tracking-wide text-muted-foreground">
                            <TrendingUp className="h-2.5 w-2.5" /> Max Allocation
                          </div>
                          <div className="mt-0.5 text-sm font-bold text-emerald-300">
                            {program.maxAllocation}
                          </div>
                        </div>
                        <div className="rounded-lg bg-white/5 p-2 ring-1 ring-white/10">
                          <div className="text-[9px] uppercase tracking-wide text-muted-foreground">
                            Profit Split
                          </div>
                          <div className="mt-0.5 text-sm font-bold text-fuchsia-300">
                            {program.profitSplit}
                          </div>
                        </div>
                        <div className="rounded-lg bg-white/5 p-2 ring-1 ring-white/10">
                          <div className="text-[9px] uppercase tracking-wide text-muted-foreground">
                            From
                          </div>
                          <div className="mt-0.5 text-sm font-bold">{program.startingFee}</div>
                        </div>
                        <div className="rounded-lg bg-white/5 p-2 ring-1 ring-white/10">
                          <div className="text-[9px] uppercase tracking-wide text-muted-foreground">
                            Payout
                          </div>
                          <div className="mt-0.5 text-sm font-bold">{program.payout}</div>
                        </div>
                      </div>

                      {program.promo ? (
                        <button
                          onClick={() => copyPromo(program.promo)}
                          className="mt-3 flex w-full items-center justify-between rounded-lg border border-dashed border-fuchsia-300/50 bg-fuchsia-300/10 px-3 py-2 text-left transition hover:bg-fuchsia-300/20"
                        >
                          <div>
                            <div className="text-[9px] uppercase tracking-wide text-fuchsia-200">
                              {program.promoOff} | Promo Code
                            </div>
                            <div className="font-mono text-sm font-bold tracking-wider">
                              {program.promo}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 text-[10px] text-fuchsia-200">
                            {copied === program.promo ? (
                              <>
                                <Check className="h-3 w-3" /> Copied
                              </>
                            ) : (
                              <>
                                <Copy className="h-3 w-3" /> Copy
                              </>
                            )}
                          </div>
                        </button>
                      ) : (
                        <div className="mt-3 flex items-center justify-between rounded-lg border border-fuchsia-300/30 bg-fuchsia-300/10 px-3 py-2">
                          <div>
                            <div className="text-[9px] uppercase tracking-wide text-fuchsia-200">
                              Rebate Status
                            </div>
                            <div className="text-sm font-bold">{program.promoOff}</div>
                          </div>
                          <BadgePercent className="h-4 w-4 text-fuchsia-200" />
                        </div>
                      )}

                      <div className="mt-3 grid grid-cols-2 gap-1.5">
                        {program.website ? (
                          <a
                            href={program.website}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center justify-center gap-1 rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-600 px-2 py-1.5 text-[10px] font-semibold shadow-[0_0_20px_rgba(192,132,252,0.4)]"
                          >
                            <Rocket className="h-3 w-3" /> Sign Up
                          </a>
                        ) : (
                          <button
                            disabled
                            className="inline-flex items-center justify-center gap-1 rounded-full bg-white/10 px-2 py-1.5 text-[10px] font-semibold text-white/45 ring-1 ring-white/10"
                          >
                            <Rocket className="h-3 w-3" /> Sign Up
                          </button>
                        )}
                        <Link
                          to="/firm/$firmId"
                          params={{ firmId: program.slug }}
                          className="inline-flex items-center justify-center gap-1 rounded-full bg-white/10 px-2 py-1.5 text-[10px] font-semibold ring-1 ring-white/20 hover:bg-white/15"
                        >
                          <Eye className="h-3 w-3" /> View Details
                        </Link>
                      </div>
                      <button
                        type="button"
                        disabled={followBusy === program.id}
                        onClick={() => void toggleFollow(program)}
                        className={`mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-full px-2 py-1.5 text-[10px] font-semibold ring-1 transition ${
                          program.isFollowing
                            ? "bg-white text-violet-950 ring-white/80 hover:bg-rose-50 hover:text-rose-700"
                            : "bg-white/8 text-white ring-white/15 hover:bg-white/14"
                        } ${followBusy === program.id ? "opacity-60" : ""}`}
                      >
                        {program.isFollowing ? (
                          <UserCheck className="h-3 w-3" />
                        ) : (
                          <UserPlus className="h-3 w-3" />
                        )}
                        {followBusy === program.id
                          ? "Updating..."
                          : program.isFollowing
                            ? "Following"
                            : "Follow"}
                      </button>
                      <label className="mt-2 flex items-center gap-1.5 text-[10px] text-muted-foreground">
                        <input
                          type="checkbox"
                          checked={isCompared}
                          onChange={() => toggleCompare(program.id)}
                          className="accent-fuchsia-400"
                        />{" "}
                        Add to compare{" "}
                        {compare.length >= 4 && !isCompared && (
                          <span className="text-orange-300">(max 4)</span>
                        )}
                      </label>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-2xl bg-white/8 p-8 text-center ring-1 ring-white/10">
                <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-white/10">
                  <AlertCircle className="h-5 w-5 text-fuchsia-200" />
                </div>
                <h2 className="mt-3 text-sm font-semibold">No Forex prop firms found</h2>
                <p className="mt-1 text-xs text-white/55">
                  {search
                    ? "Try another search term."
                    : "Once admin uploads active Forex prop firms, they will appear here."}
                </p>
              </div>
            )}

            {trendingPrograms.length > 0 && (
              <div className="rounded-2xl border border-white/15 bg-white/[0.045] p-5 text-white shadow-[0_22px_70px_rgba(14,4,36,0.25)] backdrop-blur-2xl">
                <div className="mb-3 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-bold">Trending Forex prop firm promos</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {trendingPrograms.map((program) => (
                    <Link
                      key={program.id}
                      to="/firm/$firmId"
                      params={{ firmId: program.slug }}
                      className="inline-flex items-center gap-2 rounded-full bg-primary/15 px-3 py-1.5 text-[11px] font-semibold text-white ring-1 ring-primary/25 transition hover:bg-primary/25"
                    >
                      <Flame className="h-3 w-3" /> {program.name} - {program.promoOff}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
