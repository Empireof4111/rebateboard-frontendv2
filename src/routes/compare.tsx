import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowUpRight,
  Check,
  Clock3,
  Eye,
  Info,
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
  overview?: boolean;
  comparable?: "highest" | "lowest" | "supported";
};
type CompareMode = "overview" | "full";
type DetailState = {
  row: CompareRow;
  brand: AdminBrandRecord;
  value: string;
} | null;

const RECENT_KEY = "rb_recent_comparisons_v2";
const MODE_KEY = "rb_compare_mode_v2";
const EMPTY_VALUE = "Not provided";
const LONG_VALUE_LENGTH = 74;

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

function collectSearchText(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return cleanText(value);
  }
  if (Array.isArray(value)) {
    return value.map(collectSearchText).filter(Boolean).join(" ");
  }
  if (typeof value === "object") {
    return Object.values(value as DataRecord).map(collectSearchText).filter(Boolean).join(" ");
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
  return score > 0 ? Math.min(100, Math.max(0, score)) : 0;
}

function readCompareMode(): CompareMode {
  if (typeof window === "undefined") return "overview";
  return window.localStorage.getItem(MODE_KEY) === "full" ? "full" : "overview";
}

function summarizeCellValue(value: string) {
  const normalized = cleanText(value) || EMPTY_VALUE;
  return normalized.replace(/\s+/g, " ");
}

function isMissingValue(value: string) {
  const normalized = summarizeCellValue(value).toLowerCase();
  return normalized === EMPTY_VALUE.toLowerCase() || normalized === "not available" || normalized === "not applicable";
}

function isLongValue(value: string) {
  return summarizeCellValue(value).length > LONG_VALUE_LENGTH || /[.;]\s/.test(value);
}

function categoryGroup(brand: AdminBrandRecord) {
  const category = brand.category.toLowerCase();
  if (category.includes("prop firm")) return "prop";
  if (category.includes("broker")) return "broker";
  if (category.includes("exchange")) return "exchange";
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
    { label: "Category", overview: true, value: (brand) => brand.category },
    {
      label: "TBI score",
      overview: true,
      comparable: "highest",
      value: (brand) => {
        const score = scoreOutOfTen(brand);
        return score > 0 ? `${score.toFixed(0)} / 100` : "Preliminary";
      },
    },
    {
      label: "Trust level",
      overview: true,
      value: (brand) =>
        publicTbiStageTheme(resolveBrandTbiState(brand)).label,
    },
    {
      label: "Country / HQ",
      overview: true,
      value: (brand) =>
        firstText(
          sectionValue(brand, "identity", "country", "hq", "headquarters"),
          sectionValue(brand, "profile", "country", "hq"),
        ) || EMPTY_VALUE,
    },
    {
      label: "Founded",
      overview: false,
      value: (brand) =>
        sectionValue(brand, "identity", "founded", "yearFounded") ||
        EMPTY_VALUE,
    },
    {
      label: "Public reviews",
      overview: false,
      value: (brand) => String(Number(brand.reviewsCount || 0)),
    },
    {
      label: "Cashback",
      overview: true,
      comparable: "supported",
      value: cashbackLabel,
    },
    {
      label: "Payout record",
      overview: true,
      value: (brand) => cleanText(brand.payouts) || EMPTY_VALUE,
    },
    {
      label: "Website",
      overview: false,
      value: websiteLabel,
    },
  ];

  if (groups.has("prop")) {
    rows.push(
      {
        label: "Program type",
        overview: true,
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
        overview: true,
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
        overview: true,
        comparable: "highest",
        value: (brand) =>
          firstText(
            sectionValue(brand, "prop", "profitSplit", "maxProfitSplit"),
            challengeValue(brand, "profitSplit"),
          ) || EMPTY_VALUE,
      },
      {
        label: "Starting fee",
        overview: true,
        comparable: "lowest",
        value: (brand) =>
          firstText(
            sectionValue(brand, "prop", "startingFee", "fees", "price"),
            challengeValue(brand, "price", "fee"),
          ) || EMPTY_VALUE,
      },
      {
        label: "Payout frequency",
        overview: true,
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
        overview: true,
        value: (brand) =>
          firstText(
            sectionValue(brand, "prop", "platforms", "tradingPlatforms"),
            sectionValue(brand, "profile", "platforms"),
          ) || EMPTY_VALUE,
      },
      {
        label: "Maximum daily loss",
        overview: false,
        value: (brand) =>
          firstText(
            sectionValue(brand, "prop", "dailyLoss", "maxDailyLoss"),
            challengeValue(brand, "dailyLoss", "maxDailyLoss"),
          ) || EMPTY_VALUE,
      },
      {
        label: "Maximum overall loss",
        overview: false,
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
        overview: true,
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
        label: "Operating entities",
        overview: false,
        value: (brand) =>
          sectionValue(brand, "broker", "entities", "operatingEntities", "entity") ||
          EMPTY_VALUE,
      },
      {
        label: "Minimum deposit",
        overview: true,
        comparable: "lowest",
        value: (brand) =>
          sectionValue(brand, "broker", "minDeposit", "minimumDeposit") ||
          EMPTY_VALUE,
      },
      {
        label: "Maximum leverage",
        overview: true,
        value: (brand) =>
          sectionValue(brand, "broker", "maxLeverage", "leverage") ||
          EMPTY_VALUE,
      },
      {
        label: "Spreads",
        overview: true,
        comparable: "lowest",
        value: (brand) =>
          sectionValue(brand, "broker", "spreads", "spreadType") ||
          EMPTY_VALUE,
      },
      {
        label: "Commission",
        overview: true,
        comparable: "lowest",
        value: (brand) =>
          sectionValue(brand, "broker", "commission", "commissions") ||
          EMPTY_VALUE,
      },
      {
        label: "Account types",
        overview: false,
        value: (brand) =>
          sectionValue(brand, "broker", "accountTypes", "accounts") ||
          EMPTY_VALUE,
      },
      {
        label: "Products / assets",
        overview: true,
        value: (brand) =>
          sectionValue(brand, "broker", "assets", "products", "instruments") ||
          EMPTY_VALUE,
      },
      {
        label: "Trading platforms",
        overview: true,
        value: (brand) =>
          sectionValue(brand, "broker", "platforms", "tradingPlatforms") ||
          EMPTY_VALUE,
      },
      {
        label: "Deposit methods",
        overview: false,
        value: (brand) =>
          sectionValue(brand, "broker", "depositMethods", "deposits", "fundingMethods") ||
          EMPTY_VALUE,
      },
      {
        label: "Withdrawal methods",
        overview: false,
        value: (brand) =>
          sectionValue(brand, "broker", "withdrawalMethods", "withdrawals") ||
          EMPTY_VALUE,
      },
      {
        label: "Withdrawal speed",
        overview: true,
        value: (brand) =>
          sectionValue(brand, "broker", "withdrawalSpeed") || EMPTY_VALUE,
      },
      {
        label: "Customer support",
        overview: false,
        value: (brand) =>
          firstText(
            sectionValue(brand, "broker", "support", "customerSupport"),
            brand.supportEmail,
          ) || EMPTY_VALUE,
      },
    );
  }

  if (groups.has("exchange")) {
    rows.push(
      {
        label: "Regulation",
        overview: true,
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
        overview: true,
        comparable: "lowest",
        value: (brand) =>
          sectionValue(brand, "exchange", "minDeposit", "minimumDeposit") ||
          EMPTY_VALUE,
      },
      {
        label: "Spot trading fee",
        overview: true,
        comparable: "lowest",
        value: (brand) =>
          sectionValue(brand, "exchange", "spotFee", "tradingFee") ||
          EMPTY_VALUE,
      },
      {
        label: "Futures trading fee",
        overview: true,
        comparable: "lowest",
        value: (brand) =>
          sectionValue(brand, "exchange", "futuresFee", "derivativesFee") ||
          EMPTY_VALUE,
      },
      {
        label: "KYC level",
        overview: false,
        value: (brand) =>
          sectionValue(brand, "exchange", "kycLevel", "kyc") || EMPTY_VALUE,
      },
      {
        label: "Supported assets",
        overview: true,
        value: (brand) =>
          sectionValue(brand, "exchange", "assets", "coins", "products") ||
          EMPTY_VALUE,
      },
      {
        label: "Fiat support",
        overview: true,
        comparable: "supported",
        value: (brand) =>
          sectionValue(brand, "exchange", "fiatSupport", "fiat", "fiatMethods") ||
          EMPTY_VALUE,
      },
      {
        label: "Deposit methods",
        overview: false,
        value: (brand) =>
          sectionValue(brand, "exchange", "depositMethods", "deposits", "fundingMethods") ||
          EMPTY_VALUE,
      },
      {
        label: "Withdrawal methods",
        overview: false,
        value: (brand) =>
          sectionValue(brand, "exchange", "withdrawalMethods", "withdrawals") ||
          EMPTY_VALUE,
      },
      {
        label: "Proof of reserves",
        overview: true,
        comparable: "supported",
        value: (brand) =>
          sectionValue(brand, "exchange", "proofOfReserves", "reserves") ||
          EMPTY_VALUE,
      },
      {
        label: "Security features",
        overview: false,
        value: (brand) =>
          sectionValue(brand, "exchange", "security", "securityFeatures") ||
          EMPTY_VALUE,
      },
      {
        label: "Key features",
        overview: false,
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
        overview: true,
        value: (brand) =>
          sectionValue(brand, "tool", "pricing", "price", "plans") ||
          EMPTY_VALUE,
      },
      {
        label: "Key features",
        overview: true,
        value: (brand) =>
          firstText(
            sectionValue(brand, "tool", "features", "capabilities"),
            sectionValue(brand, "editorial", "keyFeatures"),
          ) || EMPTY_VALUE,
      },
      {
        label: "Platforms",
        overview: true,
        value: (brand) =>
          sectionValue(brand, "tool", "platforms", "supportedPlatforms") ||
          EMPTY_VALUE,
      },
      {
        label: "Integrations",
        overview: false,
        value: (brand) =>
          sectionValue(brand, "tool", "integrations") || EMPTY_VALUE,
      },
      {
        label: "Best for",
        overview: true,
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

function comparableNumber(value: string) {
  const match = summarizeCellValue(value).replace(/,/g, "").match(/-?\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : null;
}

function cellHighlight(row: CompareRow, brand: AdminBrandRecord, brands: AdminBrandRecord[]) {
  const value = row.value(brand);
  if (isMissingValue(value) || !row.comparable) return "";
  if (row.comparable === "supported") {
    return /available|yes|true|supported|enabled|proof|fiat/i.test(value) ? "Supported" : "";
  }
  const current = comparableNumber(value);
  if (current === null) return "";
  const values = brands
    .map((item) => comparableNumber(row.value(item)))
    .filter((item): item is number => item !== null);
  if (values.length < 2) return "";
  const target = row.comparable === "highest" ? Math.max(...values) : Math.min(...values);
  if (current !== target) return "";
  return row.comparable === "highest" ? "Highest" : "Lowest";
}

function CompareValueCell({
  brand,
  row,
  selectedBrands,
  onDetails,
}: {
  brand: AdminBrandRecord;
  row: CompareRow;
  selectedBrands: AdminBrandRecord[];
  onDetails: (detail: DetailState) => void;
}) {
  const rawValue = row.value(brand);
  const value = summarizeCellValue(rawValue);
  const missing = isMissingValue(value);
  const long = isLongValue(value);
  const highlight = cellHighlight(row, brand, selectedBrands);

  return (
    <div className="min-h-[3.25rem] border-l border-white/[0.07] px-2.5 py-2.5 text-xs font-semibold leading-5 text-white/82 sm:px-3">
      <div className="flex items-start justify-between gap-2">
        <span
          className={`min-w-0 ${long ? "line-clamp-2" : ""} ${
            missing ? "text-white/36" : "text-white/82"
          }`}
          title={long ? undefined : value}
        >
          {value}
        </span>
        {long && (
          <button
            type="button"
            onClick={() => onDetails({ row, brand, value })}
            className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white/[0.06] text-primary ring-1 ring-white/10 transition hover:bg-primary/15 hover:text-white"
            aria-label={`View full ${row.label} details for ${brand.name}`}
          >
            <Info className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      {highlight && (
        <span className="mt-1.5 inline-flex rounded-full border border-primary/25 bg-primary/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.1em] text-primary">
          {highlight}
        </span>
      )}
    </div>
  );
}

function CompareSkeleton() {
  return (
    <section className="overflow-hidden rounded-2xl border border-white/12 bg-white/[0.04]">
      <div className="grid grid-cols-[9rem_repeat(3,minmax(10rem,1fr))] border-b border-white/10">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="border-l border-white/10 p-3 first:border-l-0">
            <div className="h-4 w-20 animate-pulse rounded-full bg-white/10" />
            {index > 0 && <div className="mt-3 h-9 w-28 animate-pulse rounded-xl bg-white/10" />}
          </div>
        ))}
      </div>
      {Array.from({ length: 7 }).map((_, row) => (
        <div key={row} className="grid grid-cols-[9rem_repeat(3,minmax(10rem,1fr))] border-b border-white/[0.07]">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="border-l border-white/[0.07] p-3 first:border-l-0">
              <div className="h-3.5 w-full animate-pulse rounded-full bg-white/10" />
            </div>
          ))}
        </div>
      ))}
    </section>
  );
}

function DetailDrawer({ detail, onClose }: { detail: DetailState; onClose: () => void }) {
  if (!detail) return null;
  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-end bg-black/60 p-0 backdrop-blur-sm sm:p-4" role="dialog" aria-modal="true">
      <button className="absolute inset-0 cursor-default" type="button" aria-label="Close details" onClick={onClose} />
      <aside className="relative max-h-[86vh] w-full overflow-y-auto rounded-t-3xl border border-white/10 bg-[rgba(18,18,25,0.98)] p-5 shadow-[0_24px_90px_rgba(0,0,0,0.55)] sm:max-w-md sm:rounded-3xl">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <BrandLogo brand={detail.brand} size="small" />
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-primary">{detail.row.label}</p>
              <h2 className="truncate text-base font-black text-white">{detail.brand.name}</h2>
            </div>
          </div>
          <button type="button" onClick={onClose} className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/[0.06] text-white/60 hover:bg-white/[0.1] hover:text-white" aria-label="Close details">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm leading-7 text-white/82">
          {detail.value}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            to="/firm/$firmId"
            params={{ firmId: detail.brand.slug }}
            className="inline-flex items-center gap-2 rounded-full rb-gradient-primary px-4 py-2 text-xs font-black text-white"
          >
            View brand profile
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
          {detail.brand.website && (
            <a href={detail.brand.website} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-xs font-bold text-white/80 hover:text-white">
              Visit website
            </a>
          )}
        </div>
      </aside>
    </div>
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
  const [mode, setMode] = useState<CompareMode>(() => readCompareMode());
  const [detail, setDetail] = useState<DetailState>(null);

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
    if (typeof window !== "undefined") window.localStorage.setItem(MODE_KEY, mode);
  }, [mode]);

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
    const selectedGroup = selectedBrands[0] ? categoryGroup(selectedBrands[0]) : "";
    return brands.filter((brand) => {
      const stage = publicTbiStageTheme(resolveBrandTbiState(brand)).label;
      const searchable = [
        brand.name,
        brand.slug,
        brand.category,
        brand.website,
        brand.supportEmail,
        collectSearchText(brand.identity),
        collectSearchText(brand.profile),
        collectSearchText(brand.broker),
        collectSearchText(brand.prop),
        collectSearchText(brand.exchange),
        collectSearchText(brand.tool),
        collectSearchText(brand.editorial),
        collectSearchText(brand.cashback),
        collectSearchText(brand.challenges),
        collectSearchText(brand.seo),
      ]
        .join(" ")
        .toLowerCase();
      return (
        (!selectedGroup || selectedIds.includes(brand.id) || categoryGroup(brand) === selectedGroup) &&
        (category === "all" || brand.category === category) &&
        (trust === "all" || stage === trust) &&
        (!cashbackOnly || cashbackLabel(brand) !== EMPTY_VALUE) &&
        (!query || searchable.includes(query))
      );
    });
  }, [brands, cashbackOnly, category, search, selectedBrands, selectedIds, trust]);

  const rows = useMemo(
    () => comparisonRows(selectedBrands),
    [selectedBrands],
  );
  const visibleRows = useMemo(
    () => rows.filter((row) => mode === "full" || row.overview !== false),
    [mode, rows],
  );
  const shouldShowPicker =
    pickerOpen || Boolean(search.trim()) || selectedBrands.length < 2;
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
    setPickerOpen(true);
  };
  const removeBrand = (id: string) =>
    setSelectedIds((current) => current.filter((brandId) => brandId !== id));

  const gridTemplate = {
    gridTemplateColumns: `minmax(8.5rem,9.5rem) repeat(${Math.max(
      selectedBrands.length,
      1,
    )}, minmax(10.5rem,13rem))`,
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
                onFocus={() => setPickerOpen(true)}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPickerOpen(true);
                }}
                placeholder="Search brands, brokers, exchanges, categories..."
                className="h-10 w-full rounded-xl bg-white/[0.055] pl-10 pr-3 text-xs text-white outline-none ring-1 ring-white/10 placeholder:text-white/32 focus:ring-primary/45"
              />
            </label>
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="h-10 rounded-xl bg-[var(--rb-bg-input)] px-3 text-xs font-semibold text-white outline-none ring-1 ring-white/10"
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
              className="h-10 rounded-xl bg-[var(--rb-bg-input)] px-3 text-xs font-semibold text-white outline-none ring-1 ring-white/10"
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
          <CompareSkeleton />
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

            {shouldShowPicker && (
              <section className="mb-4 rounded-2xl border border-white/12 bg-[rgba(18,18,25,0.96)] p-4 shadow-[0_24px_80px_rgba(4,1,10,0.42)]">
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
                  {(search || category !== "all" || trust !== "all" || cashbackOnly) && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearch("");
                        setCategory("all");
                        setTrust("all");
                        setCashbackOnly(false);
                      }}
                      className="rounded-full bg-white/[0.06] px-3 py-1.5 text-[10px] font-bold text-white/58 ring-1 ring-white/10 transition hover:bg-white/[0.1] hover:text-white"
                    >
                      Clear filters
                    </button>
                  )}
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
                    <Search className="mx-auto mb-2 h-5 w-5 text-white/35" />
                    <p>No brands match the selected filters.</p>
                    <p className="mt-1 text-[10px] text-white/32">
                      Try a brand name, broker name, category, country, or website.
                    </p>
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
                <div className="flex flex-col gap-3 border-b border-white/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-black">Side-by-side comparison</h2>
                    <Info className="h-3.5 w-3.5 text-white/36" />
                    <span className="text-[10px] text-white/36">
                      {visibleRows.length} rows
                    </span>
                  </div>
                  <div className="grid grid-cols-2 rounded-full border border-white/10 bg-white/[0.045] p-1">
                    {[
                      ["overview", "Overview"],
                      ["full", "Full comparison"],
                    ].map(([value, label]) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setMode(value as CompareMode)}
                        className={`rounded-full px-3 py-1.5 text-[11px] font-black transition ${
                          mode === value
                            ? "rb-gradient-primary text-white"
                            : "text-white/48 hover:bg-white/[0.06] hover:text-white"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="compare-scroll relative max-h-[76vh] overflow-auto">
                  <div className="min-w-max pb-1">
                    <div
                      className="sticky top-0 z-30 grid items-stretch border-b border-white/10 bg-[rgba(19,13,31,0.98)] backdrop-blur-xl"
                      style={gridTemplate}
                    >
                      <div className="sticky left-0 z-40 flex items-center border-r border-white/10 bg-[rgba(19,13,31,0.98)] px-3 py-2.5 text-[10px] font-black uppercase tracking-wider text-white/42 backdrop-blur-xl sm:px-4">
                        Data point
                      </div>
                      {selectedBrands.map((brand) => (
                        <div
                          key={brand.id}
                          className="relative border-l border-white/10 px-2.5 py-2.5 sm:px-3"
                        >
                          <div className="flex items-center gap-2 pr-7">
                            <BrandLogo brand={brand} size="small" />
                            <div className="min-w-0">
                              <div className="truncate text-xs font-black leading-4">
                                {brand.name}
                              </div>
                              <div className="truncate text-[9px] font-semibold text-white/38">
                                {brand.category}
                              </div>
                              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                                <span className="rounded-full bg-white/[0.06] px-1.5 py-0.5 text-[8px] font-black text-white/68 ring-1 ring-white/10">
                                  {scoreOutOfTen(brand) > 0 ? `${scoreOutOfTen(brand).toFixed(0)}/100` : "TBI"}
                                </span>
                                <span
                                  className={`rounded-full px-1.5 py-0.5 text-[8px] font-black ring-1 ${publicTbiStageTheme(resolveBrandTbiState(brand)).chip}`}
                                >
                                  {publicTbiStageTheme(resolveBrandTbiState(brand)).label}
                                </span>
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
                            <button
                              type="button"
                              onClick={() => removeBrand(brand.id)}
                              aria-label={`Remove ${brand.name}`}
                              className="absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-full bg-white/[0.07] text-white/52 hover:bg-white/[0.12] hover:text-white"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    {visibleRows.map((row, index) => (
                      <div
                        key={row.label}
                        className={`grid border-b border-white/[0.07] last:border-b-0 ${
                          index % 2 ? "bg-white/[0.015]" : ""
                        }`}
                        style={gridTemplate}
                      >
                        <div className="sticky left-0 z-20 flex min-h-[3.25rem] items-center border-r border-white/[0.07] bg-[rgba(18,13,30,0.98)] px-3 py-2.5 text-[11px] font-black text-white/58 backdrop-blur-xl sm:px-4">
                          {row.label}
                        </div>
                        {selectedBrands.map((brand) => (
                          <CompareValueCell
                            key={brand.id}
                            brand={brand}
                            row={row}
                            selectedBrands={selectedBrands}
                            onDetails={setDetail}
                          />
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
      <DetailDrawer detail={detail} onClose={() => setDetail(null)} />
      <SiteFooter />
    </div>
  );
}
