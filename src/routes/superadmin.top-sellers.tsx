import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { EyeOff, Pin, Star, Trophy, Zap } from "lucide-react";
import { DataTable, PageHeader, Panel, Pill, StatCard, StatusPill } from "@/components/superadmin/AdminUI";
import {
  fetchTopSellerBoard,
  updateTopSellerOverride,
  type SellerCategory,
  type TimeRange,
  type TopSellerBoardRecord,
  type TopSellerRowRecord,
} from "@/lib/top-sellers-api";
import { toast } from "@/components/superadmin/AdminActions";

export const Route = createFileRoute("/superadmin/top-sellers")({
  component: TopSellersPage,
});

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

function TopSellersPage() {
  const [board, setBoard] = useState<TopSellerBoardRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingBrandId, setSavingBrandId] = useState<string>("");
  const [category, setCategory] = useState<SellerCategory>("Futures Prop Firm");
  const [range, setRange] = useState<TimeRange>("This month");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const payload = await fetchTopSellerBoard(category, range);
        if (!cancelled) setBoard(payload);
      } catch (error) {
        if (!cancelled) {
          toast.error(error instanceof Error ? error.message : "Unable to load top sellers");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    setLoading(true);
    void load();
    return () => {
      cancelled = true;
    };
  }, [category, range]);

  const visibleBrands = board?.rows ?? [];
  const hiddenCount = board?.summary.hiddenCount ?? 0;
  const overrideCount = board?.summary.overrideCount ?? 0;
  const pinnedCount = board?.summary.pinnedCount ?? 0;
  const featuredCount = board?.summary.featuredCount ?? 0;

  async function patchOverride(brandId: string, patch: Partial<TopSellerRowRecord["override"]>) {
    try {
      setSavingBrandId(brandId);
      const payload = await updateTopSellerOverride(brandId, {
        category,
        timeRange: range,
        ...patch,
      });
      setBoard(payload);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update top seller override");
    } finally {
      setSavingBrandId("");
    }
  }

  const headerPills = useMemo(
    () => (
      <div className="flex flex-wrap items-center gap-2">
        <Pill tone="neutral">{visibleBrands.length} visible</Pill>
        <Pill tone="good">{overrideCount} overrides</Pill>
      </div>
    ),
    [overrideCount, visibleBrands.length],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Top Sellers"
        subtitle="Auto-ranked by finalized challenge purchases per category. Pin, feature, hide, or boost any brand to override the ranking."
        actions={headerPills}
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
                    ? "bg-violet-500 text-white shadow-[0_8px_24px_rgba(126,77,255,0.25)]"
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
            {visibleBrands.length} brands · {overrideCount} overrides · {hiddenCount} hidden
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
              visibleBrands.map((row) => {
                const { brand, override, score, sales, gmv } = row;
                const isSaving = savingBrandId === brand.id;

                return (
                  <tr key={brand.id}>
                    <td className="text-lg font-semibold text-white">{row.rank}</td>
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
                    <td className="text-sm text-white/75">{sales.toLocaleString()}</td>
                    <td className="text-sm text-white/75">${Number(gmv || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td className="text-sm font-semibold text-violet-300">{score}</td>
                    <td>
                      <StatusPill status={row.status} />
                    </td>
                    <td>
                      <div className="flex flex-wrap gap-2">
                        <ActionChip
                          active={Boolean(override.pinned)}
                          disabled={isSaving}
                          icon={<Pin className="h-3 w-3" />}
                          label="Pin"
                          onClick={() => void patchOverride(brand.id, { pinned: !override.pinned })}
                        />
                        <ActionChip
                          active={Boolean(override.featured)}
                          disabled={isSaving}
                          icon={<Star className="h-3 w-3" />}
                          label="Feature"
                          onClick={() => void patchOverride(brand.id, { featured: !override.featured })}
                        />
                        <ActionChip
                          active={Boolean(override.hidden)}
                          disabled={isSaving}
                          icon={<EyeOff className="h-3 w-3" />}
                          label="Hide"
                          onClick={() => void patchOverride(brand.id, { hidden: !override.hidden })}
                        />
                        <button
                          type="button"
                          disabled={isSaving}
                          onClick={() => void patchOverride(brand.id, { boost: override.boost + 50 })}
                          className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-semibold text-white transition hover:bg-white/15 disabled:opacity-60"
                        >
                          <Zap className="h-3 w-3" />
                          {override.boost > 0 ? override.boost : 0}
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
            <Trophy className="h-3.5 w-3.5 text-violet-300" />
            <span>
              Ranking now pulls real tracked purchase volume from the cashback ledger for the selected category and date range. Pin, feature, hide, and boost still work as admin overrides on top of the live revenue order.
            </span>
          </div>
        </div>
      </Panel>
    </div>
  );
}

function ActionChip({
  active,
  disabled,
  icon,
  label,
  onClick,
}: {
  active?: boolean;
  disabled?: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[11px] font-semibold transition disabled:opacity-60 ${
        active
          ? "bg-violet-500/20 text-white ring-1 ring-violet-400/30"
          : "bg-white/10 text-white hover:bg-white/15"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
