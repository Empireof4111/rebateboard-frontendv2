import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  AlertCircle,
  ArrowUpRight,
  BadgePercent,
  BarChart3,
  Boxes,
  CheckCircle2,
  Clock3,
  ExternalLink,
  Filter,
  Globe2,
  Heart,
  RefreshCw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Star,
  TrendingUp,
  Users,
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
import { resolveCountryDisplay } from "@/lib/country-format";
import type { ListingCategoryConfig } from "@/lib/listing-categories";
import { isPublishedBrand, publicTbiStageTheme, resolveBrandTbiState } from "@/lib/public-brand";

const PAGE_SIZE = 12;

type Metric = {
  label: string;
  value: string;
};

function cleanText(value: unknown) {
  if (value === null || value === undefined) return "";
  const text = String(value).trim();
  const normalized = text.toLowerCase();
  if (!text || ["null", "undefined", "n/a", "na", "none", "-", "--"].includes(normalized)) {
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

function firstListText(value: unknown) {
  if (Array.isArray(value)) return value.map(cleanText).filter(Boolean).slice(0, 4).join(", ");
  return cleanText(value);
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

function scoreOutOfTen(value: unknown) {
  const raw = Number(value ?? 0);
  if (!Number.isFinite(raw) || raw <= 0) return 0;
  return raw > 10 ? Math.min(10, raw / 10) : Math.min(10, raw);
}

function tbiLabel(value: unknown) {
  const raw = Number(value ?? 0);
  if (!Number.isFinite(raw) || raw <= 0) return "TBI pending";
  if (raw > 10) return `${Number(raw.toFixed(raw >= 100 ? 0 : 1))}/100`;
  return `${Number(raw.toFixed(1))}/10`;
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
  const name = firstText(identity.country, identity.hq, identity.location, profile.country, profile.hq);
  return {
    code: country.code,
    flag: country.flag,
    label: name || country.label || "Global",
  };
}

function searchableText(brand: AdminBrandRecord) {
  const identity = asRecord(brand.identity);
  const broker = asRecord(brand.broker);
  const prop = asRecord(brand.prop);
  const exchange = asRecord(brand.exchange);
  const tool = asRecord(brand.tool);
  const editorial = asRecord(brand.editorial);
  const profile = asRecord(brand.profile);
  const cashback = asRecord(brand.cashback);

  return [
    brand.name,
    brand.slug,
    brand.category,
    brand.status,
    brand.payouts,
    identity.description,
    identity.tagline,
    broker.regulations,
    broker.platforms,
    broker.assets,
    prop.platform,
    prop.instruments,
    prop.evalType,
    exchange.supportedAssets,
    exchange.fees,
    tool.type,
    tool.features,
    tool.bestFor,
    tool.platforms,
    tool.integrations,
    editorial.keyFeatures,
    editorial.bestFor,
    editorial.verdict,
    profile.restrictedCountries,
    cashback.terms,
  ]
    .flatMap((value) => (Array.isArray(value) ? value : [value]))
    .map(cleanText)
    .filter(Boolean)
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
    firstText(identity.description, identity.tagline, editorial.verdict, profile.publicFeedback) ||
    "No editorial summary has been published yet."
  );
}

function promoLabel(brand: AdminBrandRecord) {
  const cashback = asRecord(brand.cashback);
  const prop = asRecord(brand.prop);
  const tool = asRecord(brand.tool);
  const percent = firstText(
    cashback.cashbackPct,
    cashback.cashbackPercent,
    cashback.percent,
    cashback.rebatePct,
    prop.discount,
    prop.discountCode,
    tool.discountCode,
  );

  if (!percent) return brand.flags && asRecord(brand.flags).cashbackEligible ? "Cashback eligible" : "";
  return /\d/.test(percent) && !/%|off|cashback|rebate/i.test(percent)
    ? `Up to ${percent}% cashback`
    : percent;
}

function metricRows(brand: AdminBrandRecord, profile: ListingCategoryConfig["metricProfile"]): Metric[] {
  const broker = asRecord(brand.broker);
  const prop = asRecord(brand.prop);
  const exchange = asRecord(brand.exchange);
  const tool = asRecord(brand.tool);
  const profileData = asRecord(brand.profile);
  const cashback = asRecord(brand.cashback);

  if (profile === "broker") {
    return [
      { label: "Regulation", value: firstListText(broker.regulations) || "Not provided" },
      { label: "Min deposit", value: firstText(broker.minDeposit, broker.depositMin) || "Not provided" },
      { label: "Leverage", value: firstText(broker.maxLeverage, profileData.leverageOverall) || "Not provided" },
      { label: "Platforms", value: firstListText(broker.platforms) || "Not provided" },
    ];
  }

  if (profile === "exchange") {
    return [
      { label: "Assets", value: firstListText(exchange.supportedAssets) || "Not provided" },
      { label: "Fees", value: firstText(exchange.fees, exchange.makerTaker) || "Not provided" },
      { label: "KYC", value: firstText(exchange.kyc) || "Not provided" },
      { label: "Security", value: firstText(exchange.security) || "Not provided" },
    ];
  }

  if (profile === "tool" || profile === "education") {
    return [
      { label: profile === "education" ? "Format" : "Type", value: firstText(tool.type, brand.category) },
      { label: "Pricing", value: firstText(tool.pricing, prop.pricing, cashback.terms) || "Not provided" },
      { label: "Best for", value: firstListText(tool.bestFor) || firstListText(asRecord(brand.editorial).bestFor) || "Not provided" },
      { label: "Platforms", value: firstListText(tool.platforms) || firstListText(tool.integrations) || "Not provided" },
    ];
  }

  return [
    { label: "Max allocation", value: firstText(prop.maxAlloc, prop.maxAllocation) || "Not provided" },
    { label: "Profit split", value: firstText(prop.profitSplit) || "Not provided" },
    { label: "Starting fee", value: firstText(prop.pricing, prop.startingFee, prop.price) || "See pricing" },
    { label: "Payout", value: firstText(prop.payoutSchedule, prop.payoutFreq, brand.payouts) || "Not provided" },
  ];
}

function brandWebsite(brand: AdminBrandRecord) {
  const identity = asRecord(brand.identity);
  return normalizeUrl(firstText(brand.website, identity.website, identity.url));
}

function sortByRankAndTrust(a: AdminBrandRecord, b: AdminBrandRecord) {
  const rankA = Number(a.rankOverride ?? 9999);
  const rankB = Number(b.rankOverride ?? 9999);
  if (rankA !== rankB) return rankA - rankB;
  return scoreOutOfTen(b.tbi) - scoreOutOfTen(a.tbi);
}

function pickFeatured(brands: AdminBrandRecord[]) {
  const featured = brands
    .filter((brand) => {
      const flags = asRecord(brand.flags);
      return flags.featured === true || flags.editorPick === true || Number(brand.rankOverride ?? 999) <= 3;
    })
    .sort(sortByRankAndTrust);

  return (featured.length ? featured : [...brands].sort(sortByRankAndTrust)).slice(0, 6);
}

function pickRecommended(brands: AdminBrandRecord[]) {
  const recommended = brands
    .filter((brand) => {
      const flags = asRecord(brand.flags);
      return flags.recommended === true || flags.editorPick === true;
    })
    .sort(sortByRankAndTrust);

  return (recommended.length ? recommended : [...brands].sort(sortByRankAndTrust)).slice(0, 8);
}

function pickLatest(brands: AdminBrandRecord[]) {
  return [...brands]
    .sort((a, b) => Date.parse(b.createdAt ?? "") - Date.parse(a.createdAt ?? ""))
    .slice(0, 8);
}

function ListingSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="rounded-[28px] border border-white/15 bg-white/[0.04] p-5">
          <div className="h-16 rounded-2xl bg-white/10" />
          <div className="mt-5 h-5 w-2/3 rounded bg-white/10" />
          <div className="mt-3 h-4 w-full rounded bg-white/10" />
          <div className="mt-2 h-4 w-4/5 rounded bg-white/10" />
          <div className="mt-5 grid grid-cols-2 gap-2">
            <div className="h-16 rounded-2xl bg-white/10" />
            <div className="h-16 rounded-2xl bg-white/10" />
            <div className="h-16 rounded-2xl bg-white/10" />
            <div className="h-16 rounded-2xl bg-white/10" />
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
  action?: ReactNode;
}) {
  return (
    <div className="rounded-[28px] border border-white/15 bg-white/[0.045] p-8 text-center shadow-[0_24px_70px_rgba(15,5,35,0.35)]">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary/20 text-primary ring-1 ring-primary/30">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="mt-5 text-xl font-bold text-white">{title}</h3>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-white/65">{body}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

function BrandLogo({ brand }: { brand: AdminBrandRecord }) {
  const src = resolveMediaUrl(brand.thumbnail, asRecord(brand.identity).logo, brand.cover);
  const initials = brand.name
    .split(/\s+/)
    .map((word) => word[0])
    .join("")
    .slice(0, 3)
    .toUpperCase();

  return (
    <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-2xl bg-black/30 ring-1 ring-white/15">
      {src ? (
        <img
          src={src}
          alt={`${brand.name} logo`}
          className="h-full w-full object-contain p-1.5"
          loading="lazy"
          onError={(event) => {
            event.currentTarget.style.display = "none";
          }}
        />
      ) : (
        <span className="text-sm font-black text-white">{initials}</span>
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
          className={`h-3.5 w-3.5 ${
            index < normalized ? "fill-primary text-primary" : "text-white/20"
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
  onCompare,
  onFollow,
}: {
  brand: AdminBrandRecord;
  config: ListingCategoryConfig;
  compared: boolean;
  onCompare: (brand: AdminBrandRecord) => void;
  onFollow: (brand: AdminBrandRecord) => void;
}) {
  const country = countryForBrand(brand);
  const stage = publicTbiStageTheme(resolveBrandTbiState(brand));
  const score = scoreOutOfTen(brand.tbi);
  const promo = promoLabel(brand);
  const website = brandWebsite(brand);
  const metrics = metricRows(brand, config.metricProfile);

  return (
    <article className="group flex h-full flex-col rounded-[28px] border border-white/15 bg-white/[0.055] p-5 shadow-[0_22px_70px_rgba(14,4,36,0.28)] backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-primary/45 hover:bg-white/[0.08]">
      <div className="flex items-start gap-4">
        <BrandLogo brand={brand} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to="/firm/$firmId"
              params={{ firmId: brand.slug || brand.id }}
              className="truncate text-lg font-black tracking-tight text-white hover:text-primary"
            >
              {brand.name}
            </Link>
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold ring-1 ${stage.chip}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${stage.dot}`} />
              {stage.label}
            </span>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-white/55">
            <span>{brand.category}</span>
            <span className="h-1 w-1 rounded-full bg-white/30" />
            <span>
              {country.flag ? `${country.flag} ` : ""}
              {country.label}
            </span>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <Rating score={score} />
            <span className="text-xs font-bold text-white/80">{tbiLabel(brand.tbi)}</span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onFollow(brand)}
          className={`grid h-10 w-10 shrink-0 place-items-center rounded-full border transition ${
            brand.isFollowing
              ? "border-primary/50 bg-primary/25 text-primary"
              : "border-white/15 bg-white/[0.04] text-white/60 hover:border-primary/40 hover:text-primary"
          }`}
          aria-label={brand.isFollowing ? `Unfollow ${brand.name}` : `Follow ${brand.name}`}
        >
          <Heart className={`h-4 w-4 ${brand.isFollowing ? "fill-current" : ""}`} />
        </button>
      </div>

      <p className="mt-4 line-clamp-3 min-h-[66px] text-sm leading-6 text-white/66">
        {brandDescription(brand)}
      </p>

      <div className="mt-4 grid grid-cols-2 gap-2">
        {metrics.map((metric) => (
          <div key={`${brand.id}-${metric.label}`} className="rounded-2xl border border-white/10 bg-black/18 p-3">
            <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/38">
              {metric.label}
            </div>
            <div className="mt-1 truncate text-sm font-bold text-white">{metric.value}</div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {promo && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-3 py-1 text-[11px] font-bold text-primary ring-1 ring-primary/30">
            <BadgePercent className="h-3.5 w-3.5" />
            {promo}
          </span>
        )}
        {(brand.reviewsCount ?? 0) > 0 && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.06] px-3 py-1 text-[11px] font-semibold text-white/70 ring-1 ring-white/10">
            <Users className="h-3.5 w-3.5" />
            {brand.reviewsCount} reviews
          </span>
        )}
      </div>

      <div className="mt-auto pt-5">
        <div className="grid grid-cols-2 gap-2">
          <Link
            to="/firm/$firmId"
            params={{ firmId: brand.slug || brand.id }}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-white/[0.08] px-4 py-2.5 text-xs font-bold text-white ring-1 ring-white/15 transition hover:bg-white/[0.12]"
          >
            Details <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
          {website ? (
            <a
              href={website}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-600 px-4 py-2.5 text-xs font-bold text-white shadow-[0_14px_40px_rgba(168,85,247,0.35)] transition hover:brightness-110"
            >
              Visit <ExternalLink className="h-3.5 w-3.5" />
            </a>
          ) : (
            <span className="inline-flex items-center justify-center rounded-full bg-white/[0.05] px-4 py-2.5 text-xs font-bold text-white/45 ring-1 ring-white/10">
              Website pending
            </span>
          )}
        </div>
        <label className="mt-3 flex items-center gap-2 text-xs font-medium text-white/55">
          <input
            type="checkbox"
            checked={compared}
            onChange={() => onCompare(brand)}
            className="h-4 w-4 rounded border-white/20 bg-white/10 accent-primary"
          />
          Add to compare
        </label>
      </div>
    </article>
  );
}

function MiniBrandLink({ brand }: { brand: AdminBrandRecord }) {
  const stage = publicTbiStageTheme(resolveBrandTbiState(brand));
  return (
    <Link
      to="/firm/$firmId"
      params={{ firmId: brand.slug || brand.id }}
      className="group flex min-w-[220px] flex-1 items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.055] p-3 transition hover:border-primary/40 hover:bg-white/[0.08]"
    >
      <BrandLogo brand={brand} />
      <div className="min-w-0">
        <div className="truncate text-sm font-bold text-white group-hover:text-primary">{brand.name}</div>
        <div className="mt-1 flex items-center gap-2 text-[11px] text-white/55">
          <span>{tbiLabel(brand.tbi)}</span>
          <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ring-1 ${stage.chip}`}>
            {stage.label}
          </span>
        </div>
      </div>
    </Link>
  );
}

export function PublicCategoryListing({ config }: { config: ListingCategoryConfig }) {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [brands, setBrands] = useState<AdminBrandRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<"all" | "full" | "partial" | "preliminary">("all");
  const [cashbackOnly, setCashbackOnly] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [comparedIds, setComparedIds] = useState<string[]>([]);

  const loadBrands = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await apiRequest<AdminBrandRecord[]>(
        "/admin-brand/public-list?page=0&size=250",
        {
          method: "GET",
          cache: "no-store",
          token,
        },
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
    setVisibleCount(PAGE_SIZE);
  }, [config.id, search, stageFilter, cashbackOnly]);

  const categoryBrands = useMemo(
    () => brands.filter((brand) => matchesCategory(brand, config)).sort(sortByRankAndTrust),
    [brands, config],
  );

  const filteredBrands = useMemo(() => {
    const query = search.trim().toLowerCase();
    return categoryBrands.filter((brand) => {
      const matchesSearch = !query || searchableText(brand).includes(query);
      const state = resolveBrandTbiState(brand);
      const flags = asRecord(brand.flags);
      const cashback = asRecord(brand.cashback);
      const hasCashback =
        flags.cashbackEligible === true ||
        Boolean(firstText(cashback.cashbackPct, cashback.cashbackPercent, cashback.percent, cashback.terms));
      return matchesSearch && (stageFilter === "all" || state === stageFilter) && (!cashbackOnly || hasCashback);
    });
  }, [categoryBrands, search, stageFilter, cashbackOnly]);

  const visibleBrands = filteredBrands.slice(0, visibleCount);
  const featuredBrands = useMemo(() => pickFeatured(categoryBrands), [categoryBrands]);
  const recommendedBrands = useMemo(() => pickRecommended(categoryBrands), [categoryBrands]);
  const latestBrands = useMemo(() => pickLatest(categoryBrands), [categoryBrands]);

  const stats = useMemo(() => {
    const countries = new Set(categoryBrands.map((brand) => countryForBrand(brand).code).filter(Boolean));
    const scores = categoryBrands.map((brand) => scoreOutOfTen(brand.tbi)).filter((score) => score > 0);
    const avgTbi = scores.length
      ? Number((scores.reduce((sum, score) => sum + score, 0) / scores.length).toFixed(1))
      : 0;
    const cashbackCount = categoryBrands.filter((brand) => promoLabel(brand)).length;

    return [
      { label: "Listed brands", value: categoryBrands.length.toLocaleString(), icon: Boxes },
      { label: "Average TBI", value: avgTbi ? avgTbi.toFixed(1) : "Pending", icon: BarChart3 },
      { label: "Cashback ready", value: cashbackCount.toLocaleString(), icon: BadgePercent },
      { label: "Countries", value: countries.size.toLocaleString(), icon: Globe2 },
    ];
  }, [categoryBrands]);

  const toggleCompare = (brand: AdminBrandRecord) => {
    setComparedIds((current) =>
      current.includes(brand.id)
        ? current.filter((id) => id !== brand.id)
        : current.length >= 4
          ? current
          : [...current, brand.id],
    );
  };

  const toggleFollow = async (brand: AdminBrandRecord) => {
    if (!token) {
      void navigate({ to: "/login" });
      return;
    }

    const previous = brands;
    setBrands((current) =>
      current.map((item) =>
        item.id === brand.id
          ? {
              ...item,
              isFollowing: !item.isFollowing,
              followersCount: Math.max(0, Number(item.followersCount ?? 0) + (item.isFollowing ? -1 : 1)),
            }
          : item,
      ),
    );

    try {
      const updated = brand.isFollowing
        ? await unfollowAdminBrand(brand.id, token)
        : await followAdminBrand(brand.id, token);
      setBrands((current) => current.map((item) => (item.id === updated.id ? updated : item)));
    } catch {
      setBrands(previous);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(168,85,247,0.28),transparent_34%),linear-gradient(135deg,#170628,#21083f_42%,#10041f)] text-white">
      <SiteHeader />

      <main className="container-app relative space-y-8 py-8 md:py-10">
        <section className="relative overflow-hidden rounded-[32px] border border-white/15 bg-white/[0.045] p-6 shadow-[0_28px_90px_rgba(12,3,30,0.38)] backdrop-blur-2xl md:p-8">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/15 px-3 py-1 text-[11px] font-black uppercase tracking-[0.2em] text-primary ring-1 ring-primary/25">
                <Sparkles className="h-3.5 w-3.5" />
                {config.eyebrow}
              </div>
              <h1 className="mt-4 text-4xl font-black tracking-tight text-white md:text-6xl">
                {config.title}
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-white/66 md:text-lg">
                {config.description}
              </p>
            </div>
            <div className="grid min-w-[min(100%,520px)] grid-cols-2 gap-3 md:grid-cols-4">
              {stats.map((stat) => (
                <div key={stat.label} className="rounded-2xl border border-white/12 bg-black/18 p-4">
                  <stat.icon className="h-5 w-5 text-primary" />
                  <div className="mt-3 text-2xl font-black text-white">{stat.value}</div>
                  <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.15em] text-white/42">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-[28px] border border-white/15 bg-white/[0.045] p-4 backdrop-blur-2xl">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex min-w-0 flex-1 flex-col gap-3 md:flex-row md:items-center">
              <label className="relative min-w-0 flex-1">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/45" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder={config.searchPlaceholder}
                  className="h-12 w-full rounded-full border border-white/15 bg-black/20 pl-11 pr-4 text-sm font-semibold text-white outline-none transition placeholder:text-white/38 focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
                />
              </label>
              <div className="flex flex-wrap gap-2">
                {(["all", "full", "partial", "preliminary"] as const).map((stage) => (
                  <button
                    key={stage}
                    type="button"
                    onClick={() => setStageFilter(stage)}
                    className={`rounded-full px-4 py-2 text-xs font-bold capitalize transition ${
                      stageFilter === stage
                        ? "bg-primary text-white shadow-[0_10px_30px_rgba(168,85,247,0.28)]"
                        : "bg-white/[0.06] text-white/62 ring-1 ring-white/10 hover:bg-white/[0.1] hover:text-white"
                    }`}
                  >
                    {stage === "all" ? "All TBI" : stage}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setCashbackOnly((value) => !value)}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition ${
                  cashbackOnly
                    ? "bg-primary text-white"
                    : "bg-white/[0.06] text-white/65 ring-1 ring-white/10 hover:bg-white/[0.1] hover:text-white"
                }`}
              >
                <Filter className="h-4 w-4" />
                Cashback
              </button>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/[0.06] px-4 py-2 text-xs font-semibold text-white/60 ring-1 ring-white/10">
                <SlidersHorizontal className="h-4 w-4 text-primary" />
                {filteredBrands.length} results
              </span>
              {comparedIds.length > 0 && (
                <Link
                  to="/compare"
                  className="rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-600 px-4 py-2 text-xs font-bold text-white shadow-[0_12px_32px_rgba(168,85,247,0.35)]"
                >
                  Compare {comparedIds.length}
                </Link>
              )}
            </div>
          </div>
        </section>

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
                className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-white"
              >
                <RefreshCw className="h-4 w-4" />
                Try again
              </button>
            }
          />
        ) : categoryBrands.length === 0 ? (
          <StatePanel
            icon={Boxes}
            title="No live listings in this category yet"
            body="Publish brands from the admin dashboard and they will appear here automatically with their logo, TBI state, cashback status, and profile data."
          />
        ) : (
          <>
            {featuredBrands.length > 0 && (
              <section className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-black text-white">{config.featuredLabel}</h2>
                    <p className="mt-1 text-sm text-white/55">
                      Editorial picks, high TBI brands, and priority listings from the live database.
                    </p>
                  </div>
                  <CheckCircle2 className="hidden h-6 w-6 text-primary sm:block" />
                </div>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {featuredBrands.slice(0, 3).map((brand) => (
                    <BrandCard
                      key={brand.id}
                      brand={brand}
                      config={config}
                      compared={comparedIds.includes(brand.id)}
                      onCompare={toggleCompare}
                      onFollow={toggleFollow}
                    />
                  ))}
                </div>
              </section>
            )}

            {recommendedBrands.length > 0 && (
              <section className="rounded-[28px] border border-white/15 bg-white/[0.045] p-5 shadow-[0_22px_70px_rgba(14,4,36,0.25)] backdrop-blur-2xl">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-primary">
                      <TrendingUp className="h-4 w-4" />
                      Recommended
                    </div>
                    <h2 className="mt-1 text-xl font-black text-white">Recommended Brands</h2>
                  </div>
                  <div className="flex items-center gap-2 rounded-full bg-white/[0.06] px-3 py-1.5 text-xs font-semibold text-white/60 ring-1 ring-white/10">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                    Real admin data
                  </div>
                </div>
                <div className="mt-5 flex flex-wrap gap-3">
                  {recommendedBrands.map((brand) => (
                    <MiniBrandLink key={brand.id} brand={brand} />
                  ))}
                </div>
              </section>
            )}

            <section className="space-y-4">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black text-white">{config.allLabel}</h2>
                  <p className="mt-1 text-sm text-white/55">
                    Search and filter the full live category database.
                  </p>
                </div>
                <span className="rounded-full bg-white/[0.06] px-3 py-1.5 text-xs font-semibold text-white/60 ring-1 ring-white/10">
                  Showing {visibleBrands.length} of {filteredBrands.length}
                </span>
              </div>

              {filteredBrands.length === 0 ? (
                <StatePanel
                  icon={Search}
                  title="No listings match your filters"
                  body="Try a broader search, switch the TBI filter back to all, or clear the cashback-only filter."
                />
              ) : (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {visibleBrands.map((brand) => (
                    <BrandCard
                      key={brand.id}
                      brand={brand}
                      config={config}
                      compared={comparedIds.includes(brand.id)}
                      onCompare={toggleCompare}
                      onFollow={toggleFollow}
                    />
                  ))}
                </div>
              )}

              {visibleCount < filteredBrands.length && (
                <div className="flex justify-center pt-2">
                  <button
                    type="button"
                    onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
                    className="rounded-full bg-white/[0.08] px-5 py-2.5 text-sm font-bold text-white ring-1 ring-white/15 transition hover:bg-white/[0.12]"
                  >
                    Load more listings
                  </button>
                </div>
              )}
            </section>

            {latestBrands.length > 0 && (
              <section className="rounded-[28px] border border-white/15 bg-black/15 p-5 backdrop-blur-xl">
                <div className="flex items-center gap-2">
                  <Clock3 className="h-4 w-4 text-primary" />
                  <h2 className="text-lg font-black text-white">Recently Added</h2>
                </div>
                <div className="mt-4 flex flex-wrap gap-3">
                  {latestBrands.map((brand) => (
                    <MiniBrandLink key={brand.id} brand={brand} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
