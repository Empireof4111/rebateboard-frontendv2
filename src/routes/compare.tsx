import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowUpRight,
  Check,
  Clock3,
  Eye,
  Info,
  LoaderCircle,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import type { AdminBrandRecord } from "@/lib/admin-brands-api";
import { API_BASE_URL, apiRequest } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import {
  MAX_COMPARE_BRANDS,
  readCompareSelection,
  writeCompareSelection,
} from "@/lib/compare-selection";
import {
  publicTbiStageTheme,
  resolveBrandTbiState,
} from "@/lib/public-brand";

export const Route = createFileRoute("/compare")({
  head: () => ({
    meta: [
      {
        title: "Compare Trading Brands Side by Side | RebateBoard",
      },
      {
        name: "description",
        content:
          "Compare up to four brokers, prop firms, exchanges, and trading products using live RebateBoard data.",
      },
    ],
  }),
  component: ComparePage,
});

type DataRecord = Record<string, unknown>;
type RecentComparison = { brandIds: string[]; ts: number };
type CompareRow = {
  label: string;
  value: (brand: AdminBrandRecord) => string;
};

const RECENT_KEY = "rb_recent_comparisons_v2";
const EMPTY_VALUE = "Not provided";

function asRecord(value: unknown): DataRecord {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as DataRecord)
    : {};
}

function cleanText(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (Array.isArray(value)) {
    return value.map(cleanText).filter(Boolean).join(", ");
  }
  const text = String(value).trim();
  if (
    !text ||
    ["null", "undefined", "n/a", "na", "none", "-", "--"].includes(
      text.toLowerCase(),
    )
  ) {
    return "";
  }
  return text;
}

function firstText(...values: unknown[]) {
  for (const value of values) {
    const text = cleanText(value);
    if (text) return text;
  }
  return "";
}

function sectionValue(
  brand: AdminBrandRecord,
  section: keyof AdminBrandRecord,
  ...keys: string[]
) {
  const record = asRecord(brand[section]);
  return firstText(...keys.map((key) => record[key]));
}

function resolveMediaUrl(value: unknown) {
  const source = cleanText(value);
  if (!source) return "";
  if (/^(https?:|data:|blob:)/i.test(source)) return source;
  const origin = API_BASE_URL.replace(/\/api\/v1$/i, "");
  if (source.startsWith("/api/v1/")) return `${origin}${source}`;
  if (source.startsWith("/file/")) return `${API_BASE_URL}${source}`;
  if (source.startsWith("/")) return `${origin}${source}`;
  return `${API_BASE_URL}/file/view?key=${encodeURIComponent(source)}`;
}

function scoreOutOfTen(brand: AdminBrandRecord) {
  const score = Number(brand.tbi || 0);
  return score > 10 ? score / 10 : score;
}

function categoryGroup(brand: AdminBrandRecord) {
  if (brand.category.includes("Prop Firm")) return "prop";
  if (brand.category === "Forex Broker") return "broker";
  if (brand.category === "Crypto Exchange") return "exchange";
  return "product";
}

function cashbackLabel(brand: AdminBrandRecord) {
  const cashback = asRecord(brand.cashback);
  const eligible = firstText(cashback.eligible).toLowerCase();
  const percent = firstText(
    cashback.maxPct,
    cashback.defaultPct,
    cashback.percentage,
    cashback.rate,
  );
  if (percent) return `Up to ${percent.replace(/%$/, "")}%`;
  if (["yes", "true", "1"].includes(eligible)) return "Available";
  if (["no", "false", "0"].includes(eligible)) return "Not available";
  return EMPTY_VALUE;
}

function websiteLabel(brand: AdminBrandRecord) {
  const website = firstText(brand.website, asRecord(brand.identity).website);
  if (!website) return EMPTY_VALUE;
  try {
    return new URL(
      /^https?:\/\//i.test(website) ? website : `https://${website}`,
    ).hostname.replace(/^www\./, "");
  } catch {
    return website;
  }
}

function challengeValue(brand: AdminBrandRecord, ...keys: string[]) {
  const challenges = Array.isArray(brand.challenges) ? brand.challenges : [];
  return firstText(
    ...challenges.flatMap((challenge) => {
      const row = asRecord(challenge);
      return keys.map((key) => row[key]);
    }),
  );
}

function comparisonRows(brands: AdminBrandRecord[]): CompareRow[] {
  const groups = new Set(brands.map(categoryGroup));
  const rows: CompareRow[] = [
    { label: "Category", value: (brand) => brand.category },
    {
      label: "TBI score",
      value: (brand) => {
        const score = scoreOutOfTen(brand);
        return score > 0 ? `${score.toFixed(1)} / 10` : "Preliminary";
      },
    },
    {
      label: "Trust level",
      value: (brand) =>
        publicTbiStageTheme(resolveBrandTbiState(brand)).label,
    },
    {
      label: "Country / HQ",
      value: (brand) =>
        firstText(
          sectionValue(brand, "identity", "country", "hq", "headquarters"),
          sectionValue(brand, "profile", "country", "hq"),
        ) || EMPTY_VALUE,
    },
    {
      label: "Founded",
      value: (brand) =>
        sectionValue(brand, "identity", "founded", "yearFounded") ||
        EMPTY_VALUE,
    },
    {
      label: "Public reviews",
      value: (brand) => String(Number(brand.reviewsCount || 0)),
    },
    {
      label: "Cashback",
      value: cashbackLabel,
    },
    {
      label: "Payout record",
      value: (brand) => cleanText(brand.payouts) || EMPTY_VALUE,
    },
    {
      label: "Website",
      value: websiteLabel,
    },
  ];

  if (groups.has("prop")) {
    rows.push(
      {
        label: "Program type",
        value: (brand) =>
          firstText(
            sectionValue(
              brand,
              "prop",
              "programType",
              "fundingModel",
              "evaluationType",
            ),
            challengeValue(brand, "program", "programType", "steps"),
          ) || EMPTY_VALUE,
      },
      {
        label: "Maximum allocation",
        value: (brand) =>
          sectionValue(
            brand,
            "prop",
            "maxAllocation",
            "maximumAllocation",
            "allocation",
          ) || EMPTY_VALUE,
      },
      {
        label: "Profit split",
        value: (brand) =>
          firstText(
            sectionValue(brand, "prop", "profitSplit", "maxProfitSplit"),
            challengeValue(brand, "profitSplit"),
          ) || EMPTY_VALUE,
      },
      {
        label: "Starting fee",
        value: (brand) =>
          firstText(
            sectionValue(brand, "prop", "startingFee", "fees", "price"),
            challengeValue(brand, "price", "fee"),
          ) || EMPTY_VALUE,
      },
      {
        label: "Payout frequency",
        value: (brand) =>
          firstText(
            sectionValue(
              brand,
              "prop",
              "payoutFrequency",
              "payoutCycle",
            ),
            challengeValue(brand, "payoutFrequency", "payout"),
          ) || EMPTY_VALUE,
      },
      {
        label: "Trading platforms",
        value: (brand) =>
          firstText(
            sectionValue(brand, "prop", "platforms", "tradingPlatforms"),
            sectionValue(brand, "profile", "platforms"),
          ) || EMPTY_VALUE,
      },
      {
        label: "Maximum daily loss",
        value: (brand) =>
          firstText(
            sectionValue(brand, "prop", "dailyLoss", "maxDailyLoss"),
            challengeValue(brand, "dailyLoss", "maxDailyLoss"),
          ) || EMPTY_VALUE,
      },
      {
        label: "Maximum overall loss",
        value: (brand) =>
          firstText(
            sectionValue(brand, "prop", "maxLoss", "maxDrawdown"),
            challengeValue(brand, "maxLoss", "maxDrawdown"),
          ) || EMPTY_VALUE,
      },
    );
  }

  if (groups.has("broker")) {
    rows.push(
      {
        label: "Regulation",
        value: (brand) =>
          sectionValue(
            brand,
            "broker",
            "regulations",
            "regulators",
            "licenses",
          ) || EMPTY_VALUE,
      },
      {
        label: "Minimum deposit",
        value: (brand) =>
          sectionValue(brand, "broker", "minDeposit", "minimumDeposit") ||
          EMPTY_VALUE,
      },
      {
        label: "Maximum leverage",
        value: (brand) =>
          sectionValue(brand, "broker", "maxLeverage", "leverage") ||
          EMPTY_VALUE,
      },
      {
        label: "Spreads",
        value: (brand) =>
          sectionValue(brand, "broker", "spreads", "spreadType") ||
          EMPTY_VALUE,
      },
      {
        label: "Commission",
        value: (brand) =>
          sectionValue(brand, "broker", "commission", "commissions") ||
          EMPTY_VALUE,
      },
      {
        label: "Account types",
        value: (brand) =>
          sectionValue(brand, "broker", "accountTypes", "accounts") ||
          EMPTY_VALUE,
      },
      {
        label: "Products / assets",
        value: (brand) =>
          sectionValue(brand, "broker", "assets", "products", "instruments") ||
          EMPTY_VALUE,
      },
      {
        label: "Trading platforms",
        value: (brand) =>
          sectionValue(brand, "broker", "platforms", "tradingPlatforms") ||
          EMPTY_VALUE,
      },
      {
        label: "Withdrawal speed",
        value: (brand) =>
          sectionValue(brand, "broker", "withdrawalSpeed") || EMPTY_VALUE,
      },
    );
  }

  if (groups.has("exchange")) {
    rows.push(
      {
        label: "Regulation",
        value: (brand) =>
          sectionValue(
            brand,
            "exchange",
            "regulation",
            "regulations",
            "licenses",
          ) || EMPTY_VALUE,
      },
      {
        label: "Minimum deposit",
        value: (brand) =>
          sectionValue(brand, "exchange", "minDeposit", "minimumDeposit") ||
          EMPTY_VALUE,
      },
      {
        label: "Spot trading fee",
        value: (brand) =>
          sectionValue(brand, "exchange", "spotFee", "tradingFee") ||
          EMPTY_VALUE,
      },
      {
        label: "Futures trading fee",
        value: (brand) =>
          sectionValue(brand, "exchange", "futuresFee", "derivativesFee") ||
          EMPTY_VALUE,
      },
      {
        label: "KYC level",
        value: (brand) =>
          sectionValue(brand, "exchange", "kycLevel", "kyc") || EMPTY_VALUE,
      },
      {
        label: "Supported assets",
        value: (brand) =>
          sectionValue(brand, "exchange", "assets", "coins", "products") ||
          EMPTY_VALUE,
      },
      {
        label: "Key features",
        value: (brand) =>
          sectionValue(
            brand,
            "exchange",
            "features",
            "products",
            "services",
          ) || EMPTY_VALUE,
      },
    );
  }

  if (groups.has("product")) {
    rows.push(
      {
        label: "Pricing",
        value: (brand) =>
          sectionValue(brand, "tool", "pricing", "price", "plans") ||
          EMPTY_VALUE,
      },
      {
        label: "Key features",
        value: (brand) =>
          firstText(
            sectionValue(brand, "tool", "features", "capabilities"),
            sectionValue(brand, "editorial", "keyFeatures"),
          ) || EMPTY_VALUE,
      },
      {
        label: "Platforms",
        value: (brand) =>
          sectionValue(brand, "tool", "platforms", "supportedPlatforms") ||
          EMPTY_VALUE,
      },
      {
        label: "Integrations",
        value: (brand) =>
          sectionValue(brand, "tool", "integrations") || EMPTY_VALUE,
      },
      {
        label: "Best for",
        value: (brand) =>
          firstText(
            sectionValue(brand, "tool", "bestFor"),
            sectionValue(brand, "editorial", "bestFor"),
          ) || EMPTY_VALUE,
      },
    );
  }

  return rows.filter((row) =>
    brands.some((brand) => row.value(brand) !== EMPTY_VALUE),
  );
}

function readRecent(): RecentComparison[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(RECENT_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveRecent(brandIds: string[]) {
  if (typeof window === "undefined" || brandIds.length < 2) return;
  const key = brandIds.join("|");
  const next = [
    { brandIds, ts: Date.now() },
    ...readRecent().filter((item) => item.brandIds.join("|") !== key),
  ].slice(0, 6);
  window.localStorage.setItem(RECENT_KEY, JSON.stringify(next));
}

function BrandLogo({
  brand,
  size = "normal",
}: {
  brand: AdminBrandRecord;
  size?: "normal" | "small";
}) {
  const [failed, setFailed] = useState(false);
  const logo = resolveMediaUrl(
    firstText(
      brand.thumbnail,
      asRecord(brand.identity).logo,
      asRecord(brand.profile).logo,
    ),
  );
  const sizeClass =
    size === "small" ? "h-10 w-10 rounded-xl" : "h-14 w-14 rounded-2xl";
  const initials = brand.name
    .split(/\s+/)
    .map((word) => word[0])
    .join("")
    .slice(0, 3)
    .toUpperCase();

  return (
    <span
      className={`grid ${sizeClass} shrink-0 place-items-center overflow-hidden ${
        logo && !failed ? "bg-transparent" : "bg-primary/20"
      }`}
    >
      {logo && !failed ? (
        <img
          src={logo}
          alt={`${brand.name} logo`}
          className="h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <span className="text-[10px] font-black text-white">{initials}</span>
      )}
    </span>
  );
}

function ComparePage() {
  const { token } = useAuth();
  const [brands, setBrands] = useState<AdminBrandRecord[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>(() =>
    readCompareSelection(),
  );
  const [recent, setRecent] = useState<RecentComparison[]>([]);
  const [category, setCategory] = useState("all");
  const [trust, setTrust] = useState("all");
  const [cashbackOnly, setCashbackOnly] = useState(false);
  const [search, setSearch] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadBrands = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await apiRequest<AdminBrandRecord[]>(
        "/admin-brand/public-list?page=0&size=250",
        { method: "GET", cache: "no-store", token },
      );
      setBrands(
        (response.payload ?? []).filter(
          (brand) => brand.visibility === "published",
        ),
      );
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load brands.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadBrands();
  }, [token]);

  useEffect(() => {
    setRecent(readRecent());
  }, []);

  useEffect(() => {
    writeCompareSelection(selectedIds);
    if (selectedIds.length >= 2) {
      saveRecent(selectedIds);
      setRecent(readRecent());
    }
  }, [selectedIds]);

  useEffect(() => {
    if (!loading && brands.length) {
      setSelectedIds((current) =>
        current.filter((id) => brands.some((brand) => brand.id === id)),
      );
    }
  }, [brands, loading]);

  const categories = useMemo(
    () =>
      [...new Set(brands.map((brand) => brand.category))].sort((a, b) =>
        a.localeCompare(b),
      ),
    [brands],
  );

  const selectedBrands = useMemo(
    () =>
      selectedIds
        .map((id) => brands.find((brand) => brand.id === id))
        .filter(Boolean) as AdminBrandRecord[],
    [brands, selectedIds],
  );

  const filteredBrands = useMemo(() => {
    const query = search.trim().toLowerCase();
    return brands.filter((brand) => {
      const stage = publicTbiStageTheme(resolveBrandTbiState(brand)).label;
      const searchable = [
        brand.name,
        brand.category,
        cleanText(brand.identity),
        cleanText(brand.editorial),
      ]
        .join(" ")
        .toLowerCase();
      return (
        (category === "all" || brand.category === category) &&
        (trust === "all" || stage === trust) &&
        (!cashbackOnly || cashbackLabel(brand) !== EMPTY_VALUE) &&
        (!query || searchable.includes(query))
      );
    });
  }, [brands, cashbackOnly, category, search, trust]);

  const rows = useMemo(
    () => comparisonRows(selectedBrands),
    [selectedBrands],
  );
  const trustOptions = useMemo(
    () =>
      [
        ...new Set(
          brands.map(
            (brand) =>
              publicTbiStageTheme(resolveBrandTbiState(brand)).label,
          ),
        ),
      ].sort(),
    [brands],
  );

  const addBrand = (id: string) => {
    setSelectedIds((current) =>
      current.includes(id) || current.length >= MAX_COMPARE_BRANDS
        ? current
        : [...current, id],
    );
  };
  const removeBrand = (id: string) =>
    setSelectedIds((current) => current.filter((brandId) => brandId !== id));

  const gridTemplate = {
    gridTemplateColumns: `minmax(10rem,.8fr) repeat(${Math.max(
      selectedBrands.length,
      1,
    )}, minmax(12rem,1fr))`,
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(126,48,190,0.22),transparent_34%),linear-gradient(145deg,#130522,#210a3a_55%,#12051f)] text-white">
      <SiteHeader />
      <main className="container-app pb-12 pt-5 sm:pt-8">
        <section className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-primary">
              Live brand intelligence
            </div>
            <h1 className="mt-1 text-2xl font-black sm:text-3xl">
              Compare Trading Brands
            </h1>
            <p className="mt-2 max-w-2xl text-xs leading-5 text-white/52">
              Select a category, choose up to four brands, and compare the
              actual information published through RebateBoard.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setPickerOpen((open) => !open)}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-primary px-4 text-xs font-bold text-white shadow-[0_10px_28px_rgba(124,77,255,0.28)]"
          >
            {pickerOpen ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {pickerOpen ? "Close brand picker" : "Add a brand"}
          </button>
        </section>

        <section className="mb-4 rounded-2xl border border-white/12 bg-white/[0.045] p-3">
          <div className="grid gap-2 md:grid-cols-[1.2fr_.8fr_.8fr_auto]">
            <label className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/38" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search brands..."
                className="h-10 w-full rounded-xl bg-white/[0.055] pl-10 pr-3 text-xs text-white outline-none ring-1 ring-white/10 placeholder:text-white/32 focus:ring-primary/45"
              />
            </label>
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="h-10 rounded-xl bg-[#24103c] px-3 text-xs font-semibold text-white outline-none ring-1 ring-white/10"
            >
              <option value="all">All categories</option>
              {categories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            <select
              value={trust}
              onChange={(event) => setTrust(event.target.value)}
              className="h-10 rounded-xl bg-[#24103c] px-3 text-xs font-semibold text-white outline-none ring-1 ring-white/10"
            >
              <option value="all">All trust levels</option>
              {trustOptions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            <label className="flex h-10 cursor-pointer items-center justify-center gap-2 rounded-xl bg-white/[0.055] px-3 text-xs font-semibold text-white/72 ring-1 ring-white/10">
              <input
                type="checkbox"
                checked={cashbackOnly}
                onChange={(event) => setCashbackOnly(event.target.checked)}
                className="accent-violet-500"
              />
              Cashback
            </label>
          </div>
        </section>

        {recent.length > 0 && (
          <section className="mb-4 flex items-center gap-2 overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.03] p-3 no-scrollbar">
            <span className="flex shrink-0 items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-white/42">
              <Clock3 className="h-3.5 w-3.5" /> Recent
            </span>
            {recent.map((item) => {
              const names = item.brandIds
                .map((id) => brands.find((brand) => brand.id === id)?.name)
                .filter(Boolean);
              if (names.length < 2) return null;
              return (
                <button
                  key={`${item.ts}-${item.brandIds.join("-")}`}
                  type="button"
                  onClick={() => setSelectedIds(item.brandIds)}
                  className="shrink-0 rounded-full bg-white/[0.055] px-3 py-1.5 text-[10px] font-semibold text-white/72 ring-1 ring-white/10 hover:text-white"
                >
                  {names.join(" vs ")}
                </button>
              );
            })}
          </section>
        )}

        {error ? (
          <section className="rounded-2xl border border-rose-300/16 bg-rose-400/[0.06] p-10 text-center">
            <AlertCircle className="mx-auto h-7 w-7 text-rose-200" />
            <h2 className="mt-3 text-base font-bold">Brands could not be loaded</h2>
            <p className="mt-1 text-xs text-white/48">{error}</p>
            <button
              type="button"
              onClick={() => void loadBrands()}
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-bold"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Try again
            </button>
          </section>
        ) : loading ? (
          <section className="grid min-h-72 place-items-center rounded-2xl border border-white/10 bg-white/[0.035]">
            <div className="text-center">
              <LoaderCircle className="mx-auto h-7 w-7 animate-spin text-primary" />
              <p className="mt-3 text-xs text-white/48">
                Loading live brand data...
              </p>
            </div>
          </section>
        ) : (
          <>
            <section className="mb-4 rounded-2xl border border-white/12 bg-white/[0.045] p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-black">Selected brands</h2>
                  <p className="text-[10px] text-white/42">
                    {selectedBrands.length} of {MAX_COMPARE_BRANDS} selected
                  </p>
                </div>
                {selectedBrands.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedIds([])}
                    className="text-[10px] font-bold text-white/46 hover:text-white"
                  >
                    Clear all
                  </button>
                )}
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {selectedBrands.map((brand) => {
                  const theme = publicTbiStageTheme(
                    resolveBrandTbiState(brand),
                  );
                  return (
                    <article
                      key={brand.id}
                      className="relative min-h-28 rounded-2xl bg-white/[0.04] p-3 ring-1 ring-white/10"
                    >
                      <button
                        type="button"
                        onClick={() => removeBrand(brand.id)}
                        aria-label={`Remove ${brand.name}`}
                        className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-white/[0.07] text-white/62 hover:bg-white/[0.12] hover:text-white"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                      <div className="flex items-center gap-3 pr-7">
                        <BrandLogo brand={brand} />
                        <div className="min-w-0">
                          <h3 className="truncate text-sm font-black">
                            {brand.name}
                          </h3>
                          <p className="truncate text-[10px] text-white/42">
                            {brand.category}
                          </p>
                          <span
                            className={`mt-1.5 inline-flex rounded-full px-2 py-0.5 text-[9px] font-bold ring-1 ${theme.chip}`}
                          >
                            {theme.label}
                          </span>
                        </div>
                      </div>
                    </article>
                  );
                })}
                {selectedBrands.length < MAX_COMPARE_BRANDS && (
                  <button
                    type="button"
                    onClick={() => setPickerOpen(true)}
                    className="grid min-h-28 place-items-center rounded-2xl border border-dashed border-white/16 text-xs font-bold text-white/42 transition hover:border-primary/55 hover:text-white"
                  >
                    <span className="text-center">
                      <Plus className="mx-auto mb-1 h-5 w-5" /> Add brand
                    </span>
                  </button>
                )}
              </div>
            </section>

            {pickerOpen && (
              <section className="mb-4 rounded-2xl border border-white/12 bg-[#1b0a30]/96 p-4 shadow-[0_24px_80px_rgba(4,1,10,0.42)]">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal className="h-4 w-4 text-primary" />
                    <div>
                      <h2 className="text-sm font-black">Choose brands</h2>
                      <p className="text-[10px] text-white/42">
                        Showing {filteredBrands.length} live records
                      </p>
                    </div>
                  </div>
                </div>
                {filteredBrands.length ? (
                  <div className="grid max-h-[30rem] gap-2 overflow-y-auto pr-1 sm:grid-cols-2 xl:grid-cols-3">
                    {filteredBrands.map((brand) => {
                      const selected = selectedIds.includes(brand.id);
                      const disabled =
                        !selected &&
                        selectedIds.length >= MAX_COMPARE_BRANDS;
                      return (
                        <button
                          key={brand.id}
                          type="button"
                          disabled={disabled}
                          onClick={() =>
                            selected
                              ? removeBrand(brand.id)
                              : addBrand(brand.id)
                          }
                          className={`flex min-h-16 items-center gap-3 rounded-xl p-2.5 text-left ring-1 transition ${
                            selected
                              ? "bg-primary/18 ring-primary/45"
                              : "bg-white/[0.035] ring-white/10 hover:bg-white/[0.075]"
                          } disabled:cursor-not-allowed disabled:opacity-35`}
                        >
                          <BrandLogo brand={brand} size="small" />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-xs font-bold">
                              {brand.name}
                            </span>
                            <span className="block truncate text-[10px] text-white/42">
                              {brand.category}
                            </span>
                          </span>
                          <span
                            className={`grid h-6 w-6 shrink-0 place-items-center rounded-full ${
                              selected
                                ? "bg-primary text-white"
                                : "bg-white/[0.06] text-white/36"
                            }`}
                          >
                            {selected ? (
                              <Check className="h-3.5 w-3.5" />
                            ) : (
                              <Plus className="h-3.5 w-3.5" />
                            )}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-xl bg-white/[0.035] p-8 text-center text-xs text-white/44 ring-1 ring-white/10">
                    No brands match the selected filters.
                  </div>
                )}
              </section>
            )}

            {selectedBrands.length < 2 ? (
              <section className="rounded-2xl border border-white/12 bg-white/[0.04] p-10 text-center">
                <ShieldCheck className="mx-auto h-8 w-8 text-primary" />
                <h2 className="mt-3 text-base font-black">
                  Select at least two brands
                </h2>
                <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-white/46">
                  Use the brand picker or an “Add to compare” checkbox on any
                  public listing page.
                </p>
                <button
                  type="button"
                  onClick={() => setPickerOpen(true)}
                  className="mt-4 rounded-full bg-primary px-4 py-2 text-xs font-bold"
                >
                  Choose brands
                </button>
              </section>
            ) : (
              <section className="overflow-hidden rounded-2xl border border-white/12 bg-white/[0.04]">
                <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
                  <h2 className="text-sm font-black">Side-by-side comparison</h2>
                  <Info className="h-3.5 w-3.5 text-white/36" />
                </div>
                <div className="overflow-x-auto">
                  <div className="min-w-max">
                    <div
                      className="grid items-stretch border-b border-white/10 bg-white/[0.025]"
                      style={gridTemplate}
                    >
                      <div className="flex items-center px-4 py-3 text-[10px] font-black uppercase tracking-wider text-white/38">
                        Data point
                      </div>
                      {selectedBrands.map((brand) => (
                        <div
                          key={brand.id}
                          className="border-l border-white/10 px-3 py-3"
                        >
                          <div className="flex items-center gap-2">
                            <BrandLogo brand={brand} size="small" />
                            <div className="min-w-0">
                              <div className="truncate text-xs font-black">
                                {brand.name}
                              </div>
                              <div className="mt-1 flex gap-2">
                                <Link
                                  to="/firm/$firmId"
                                  params={{ firmId: brand.slug }}
                                  className="inline-flex items-center gap-1 text-[9px] font-bold text-primary hover:text-white"
                                >
                                  <Eye className="h-3 w-3" /> Profile
                                </Link>
                                {brand.website && (
                                  <a
                                    href={brand.website}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1 text-[9px] font-bold text-white/45 hover:text-white"
                                  >
                                    Website
                                    <ArrowUpRight className="h-3 w-3" />
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    {rows.map((row, index) => (
                      <div
                        key={row.label}
                        className={`grid border-b border-white/[0.07] last:border-b-0 ${
                          index % 2 ? "bg-white/[0.015]" : ""
                        }`}
                        style={gridTemplate}
                      >
                        <div className="px-4 py-3 text-[11px] font-semibold text-white/48">
                          {row.label}
                        </div>
                        {selectedBrands.map((brand) => (
                          <div
                            key={brand.id}
                            className="border-l border-white/[0.07] px-3 py-3 text-xs font-semibold leading-5 text-white/82"
                          >
                            {row.value(brand)}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
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
