import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { EyeOff, Pin, Sparkles, Trophy, Zap } from "lucide-react";
import { DataTable, PageHeader, Panel, Pill, StatCard, StatusPill } from "@/components/superadmin/AdminUI";
import { fetchAdminBrands, type AdminBrandRecord } from "@/lib/admin-brands-api";
import { toast } from "@/components/superadmin/AdminActions";

export const Route = createFileRoute("/superadmin/top-sellers")({
  component: TopSellersPage,
});

type SellerCategory =
  | "Futures Prop Firm"
  | "Crypto Prop Firm"
  | "Prop Firm"
  | "Forex Broker"
  | "Crypto Exchange"
  | "Trading Software"
  | "Education Provider";

type TimeRange = "Last 30 days" | "This month" | "This quarter" | "This year" | "All time";

type SellerOverride = {
  pinned?: boolean;
  featured?: boolean;
  hidden?: boolean;
  boost?: number;
};

const OVERRIDES_KEY = "rb.top-sellers.overrides";

const CATEGORY_TABS: SellerCategory[] = [
  "Futures Prop Firm",
  "Crypto Prop Firm",
  "Prop Firm",
  "Forex Broker",
  "Crypto Exchange",
  "Trading Software",
  "Education Provider",
];

const CATEGORY_LABELS: Record<SellerCategory, string> = {
  "Futures Prop Firm": "Futures Prop Firms",
  "Crypto Prop Firm": "Crypto Prop Firms",
  "Prop Firm": "Forex Prop Firms",
  "Forex Broker": "Forex Brokers",
  "Crypto Exchange": "Crypto Exchanges",
  "Trading Software": "Trading Tools & Software",
  "Education Provider": "Education Providers",
};

const TIME_RANGES: TimeRange[] = [
  "Last 30 days",
  "This month",
  "This quarter",
  "This year",
  "All time",
];

function readOverrides() {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(OVERRIDES_KEY) || "{}") as Record<string, SellerOverride>;
  } catch {
    return {};
  }
}

function persistOverrides(next: Record<string, SellerOverride>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(OVERRIDES_KEY, JSON.stringify(next));
}

function TopSellersPage() {
  const [brands, setBrands] = useState<AdminBrandRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<SellerCategory>("Futures Prop Firm");
  const [range, setRange] = useState<TimeRange>("This month");
  const [overrides, setOverrides] = useState<Record<string, SellerOverride>>(() => readOverrides());

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const rows = await fetchAdminBrands();
        if (!cancelled) setBrands(rows);
      } catch (error) {
        if (!cancelled) {
          toast.error(error instanceof Error ? error.message : "Unable to load seller brands");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const visibleBrands = useMemo(() => {
    return brands
      .filter((brand) => brand.category === category)
      .filter((brand) => !overrides[brand.id]?.hidden)
      .map((brand, index) => {
        const brandOverride = overrides[brand.id] ?? {};
        const baseScore = Number(brand.rankOverride ?? brand.tbi ?? 0);
        const boost = Number(brandOverride.boost ?? 0);
        const score = baseScore + boost;

        return {
          brand,
          score,
          boost,
          override: brandOverride,
          baseIndex: index,
        };
      })
      .sort((a, b) => {
        if (Boolean(a.override.pinned) !== Boolean(b.override.pinned)) {
          return a.override.pinned ? -1 : 1;
        }
        if (b.score !== a.score) return b.score - a.score;
        return a.baseIndex - b.baseIndex;
      });
  }, [brands, category, overrides]);

  const hiddenCount = useMemo(
    () => brands.filter((brand) => brand.category === category && overrides[brand.id]?.hidden).length,
    [brands, category, overrides],
  );

  const overrideCount = useMemo(
    () =>
      visibleBrands.filter(
        (row) => row.override.pinned || row.override.featured || row.override.hidden || row.boost > 0,
      ).length + hiddenCount,
    [hiddenCount, visibleBrands],
  );

  const pinnedCount = useMemo(
    () => visibleBrands.filter((row) => row.override.pinned).length,
    [visibleBrands],
  );

  const featuredCount = useMemo(
    () => visibleBrands.filter((row) => row.override.featured).length,
    [visibleBrands],
  );

  function patchOverride(brandId: string, patch: Partial<SellerOverride>) {
    setOverrides((current) => {
      const next = {
        ...current,
        [brandId]: {
          ...(current[brandId] ?? {}),
          ...patch,
        },
      };
      persistOverrides(next);
      return next;
    });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Top Sellers"
        subtitle="Auto-ranked by finalized challenge purchases per category. Pin, feature, hide, or boost any brand to override the ranking."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Pill tone="neutral">{visibleBrands.length} visible</Pill>
            <Pill tone="good">{overrideCount} overrides</Pill>
          </div>
        }
      />

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Ranked Brands" value={String(visibleBrands.length)} delta={CATEGORY_LABELS[category]} tone="flat" />
        <StatCard label="Overrides" value={String(overrideCount)} delta="Pins, features, hides, boosts" tone="flat" />
        <StatCard label="Pinned" value={String(pinnedCount)} delta="Locked top placements" tone="flat" />
        <StatCard label="Featured" value={String(featuredCount)} delta="Highlighted brands" tone="flat" />
      </div>

      <Panel title="Ranking Workspace" action={<Pill tone="good">{range}</Pill>}>
        <div className="flex flex-wrap items-center gap-2">
          {CATEGORY_TABS.map((tab) => {
            const active = category === tab;

            return (
              <button
                key={tab}
                type="button"
                onClick={() => setCategory(tab)}
                className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                  active
                    ? "bg-fuchsia-500 text-white shadow-[0_8px_24px_rgba(217,70,239,0.25)]"
                    : "bg-white/10 text-muted-foreground hover:bg-white/15 hover:text-white"
                }`}
              >
                {CATEGORY_LABELS[tab]}
              </button>
            );
          })}
        </div>

        <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="text-xs text-muted-foreground">
            {visibleBrands.length} brands · {overrideCount} overrides
          </div>
          <div className="flex flex-wrap gap-2">
            {TIME_RANGES.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setRange(option)}
                className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                  range === option
                    ? "bg-white/15 text-white"
                    : "bg-white/10 text-muted-foreground hover:bg-white/15 hover:text-white"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5">
          <DataTable
            head={
              <>
                <th>#</th>
                <th>Brand</th>
                <th>Sales</th>
                <th>GMV</th>
                <th>Score</th>
                <th>Status</th>
                <th>Actions</th>
              </>
            }
          >
            {loading ? (
              <tr>
                <td colSpan={7} className="text-center text-sm text-muted-foreground">
                  Loading top sellers...
                </td>
              </tr>
            ) : visibleBrands.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center text-sm text-muted-foreground">
                  No ranked brands yet in {CATEGORY_LABELS[category]}.
                </td>
              </tr>
            ) : (
              visibleBrands.map((row, index) => {
                const { brand, override, boost, score } = row;
                const status = override.featured
                  ? "approved"
                  : override.pinned
                    ? "scheduled"
                    : brand.visibility === "published"
                      ? "active"
                      : "draft";

                return (
                  <tr key={brand.id}>
                    <td className="text-lg font-semibold text-white">{index + 1}</td>
                    <td>
                      <div className="flex items-center gap-3">
                        {brand.thumbnail ? (
                          <img
                            src={brand.thumbnail}
                            alt={brand.name}
                            className="h-10 w-10 rounded-xl object-cover ring-1 ring-white/10"
                          />
                        ) : (
                          <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/8 text-sm font-bold text-white/80 ring-1 ring-white/10">
                            {brand.name.slice(0, 1).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="text-sm font-semibold text-white">{brand.name}</div>
                          <div className="text-xs text-muted-foreground">{brand.category}</div>
                        </div>
                      </div>
                    </td>
                    <td className="text-sm text-white/75">—</td>
                    <td className="text-sm text-white/75">—</td>
                    <td className="text-sm font-semibold text-fuchsia-300">{score}</td>
                    <td>
                      <StatusPill status={status} />
                    </td>
                    <td>
                      <div className="flex flex-wrap gap-2">
                        <ActionChip
                          active={Boolean(override.pinned)}
                          icon={<Pin className="h-3 w-3" />}
                          label="Pin"
                          onClick={() => patchOverride(brand.id, { pinned: !override.pinned })}
                        />
                        <ActionChip
                          active={Boolean(override.featured)}
                          icon={<Sparkles className="h-3 w-3" />}
                          label="Feature"
                          onClick={() => patchOverride(brand.id, { featured: !override.featured })}
                        />
                        <ActionChip
                          active={Boolean(override.hidden)}
                          icon={<EyeOff className="h-3 w-3" />}
                          label="Hide"
                          onClick={() => patchOverride(brand.id, { hidden: !override.hidden })}
                        />
                        <button
                          type="button"
                          onClick={() => patchOverride(brand.id, { boost: boost + 50 })}
                          className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-semibold text-white transition hover:bg-white/15"
                        >
                          <Zap className="h-3 w-3" />
                          {boost > 0 ? boost : 0}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </DataTable>
        </div>

        <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Trophy className="h-3.5 w-3.5 text-fuchsia-300" />
            <span>
              Sales come from the Challenge Purchases store. Recorded mock purchases are not connected yet, so ranking currently follows brand score plus local overrides.
            </span>
          </div>
        </div>
      </Panel>
    </div>
  );
}

function ActionChip({
  active,
  icon,
  label,
  onClick,
}: {
  active?: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[11px] font-semibold transition ${
        active
          ? "bg-fuchsia-500/20 text-white ring-1 ring-fuchsia-400/30"
          : "bg-white/10 text-white hover:bg-white/15"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
