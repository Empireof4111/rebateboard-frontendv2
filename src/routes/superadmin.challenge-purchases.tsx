import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  CircleDollarSign,
  ClipboardCheck,
  Coins,
  Download,
  Funnel,
  Search,
  ShoppingCart,
  Sparkles,
  Trophy,
} from "lucide-react";
import { DataTable, PageHeader, Panel, Pill, StatCard } from "@/components/superadmin/AdminUI";
import { adminBrands } from "@/lib/admin-data";
import { toast } from "@/components/superadmin/AdminActions";

export const Route = createFileRoute("/superadmin/challenge-purchases")({
  component: ChallengePurchasesPage,
});

type FunnelStep = "buy_click" | "checkout" | "finalized" | "reward_chosen" | "claim_guide_viewed";

type PurchaseRow = {
  id: string;
  buyerEmail: string;
  firm: string;
  program: string;
  step: FunnelStep;
  amountUsd: number;
  rrPoints: number;
  rewardPreference: "cashback" | "rr" | "mixed";
  when: string;
};

const MOCK_ROWS: PurchaseRow[] = [];

const FUNNEL_LABELS: Record<FunnelStep, string> = {
  buy_click: "Buy click",
  checkout: "Checkout",
  finalized: "Finalized",
  reward_chosen: "Reward chosen",
  claim_guide_viewed: "Claim guide viewed",
};

const STEP_OPTIONS: Array<{ value: FunnelStep | "all"; label: string }> = [
  { value: "all", label: "All steps" },
  { value: "buy_click", label: "Buy click" },
  { value: "checkout", label: "Checkout" },
  { value: "finalized", label: "Finalized" },
  { value: "reward_chosen", label: "Reward chosen" },
  { value: "claim_guide_viewed", label: "Claim guide viewed" },
];

function ChallengePurchasesPage() {
  const [query, setQuery] = useState("");
  const [firmFilter, setFirmFilter] = useState<string>("all");
  const [stepFilter, setStepFilter] = useState<FunnelStep | "all">("all");
  const rows = MOCK_ROWS;

  const filteredRows = useMemo(() => {
    const term = query.trim().toLowerCase();

    return rows.filter((row) => {
      const matchesTerm =
        !term ||
        row.buyerEmail.toLowerCase().includes(term) ||
        row.firm.toLowerCase().includes(term) ||
        row.program.toLowerCase().includes(term);

      const matchesFirm = firmFilter === "all" || row.firm === firmFilter;
      const matchesStep = stepFilter === "all" || row.step === stepFilter;

      return matchesTerm && matchesFirm && matchesStep;
    });
  }, [firmFilter, query, rows, stepFilter]);

  const metrics = useMemo(() => {
    const totalBuyClicks = rows.filter((row) => row.step === "buy_click").length;
    const finalizedPurchases = rows.filter((row) => row.step === "finalized").length;
    const gmvTracked = rows.reduce((sum, row) => sum + row.amountUsd, 0);
    const rrPointsEmitted = rows.reduce((sum, row) => sum + row.rrPoints, 0);

    return {
      totalBuyClicks,
      finalizedPurchases,
      gmvTracked,
      rrPointsEmitted,
      conversionRate: totalBuyClicks > 0 ? Math.round((finalizedPurchases / totalBuyClicks) * 100) : 0,
    };
  }, [rows]);

  const topFirms = useMemo(() => {
    const totals = new Map<string, number>();

    rows.forEach((row) => {
      totals.set(row.firm, (totals.get(row.firm) ?? 0) + row.amountUsd);
    });

    return [...totals.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [rows]);

  const rewardMix = useMemo(() => {
    const totals = {
      cashback: 0,
      rr: 0,
      mixed: 0,
    };

    rows.forEach((row) => {
      totals[row.rewardPreference] += 1;
    });

    return totals;
  }, [rows]);

  const funnelStats = useMemo(() => {
    const total = rows.length;

    return [
      { label: "Buy click", count: rows.filter((row) => row.step === "buy_click").length },
      { label: "Checkout", count: rows.filter((row) => row.step === "checkout").length },
      { label: "Finalized", count: rows.filter((row) => row.step === "finalized").length },
      { label: "Reward chosen", count: rows.filter((row) => row.step === "reward_chosen").length },
      { label: "Claim guide viewed", count: rows.filter((row) => row.step === "claim_guide_viewed").length },
    ].map((item) => ({
      ...item,
      pct: total > 0 ? Math.round((item.count / total) * 100) : item.label === "Buy click" ? 100 : 0,
    }));
  }, [rows]);

  const firmOptions = useMemo(() => {
    const relevant = adminBrands
      .filter((brand) =>
        brand.category === "Prop Firm" ||
        brand.category === "Futures Prop Firm" ||
        brand.category === "Crypto Prop Firm" ||
        brand.category === "Stock Prop Firm" ||
        brand.category === "DEX Prop Firm",
      )
      .map((brand) => brand.name);

    return ["all", ...relevant];
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Challenge Purchases"
        subtitle='Live funnel from "Buy" click to claimed cashback — synced from every entry point.'
        actions={<Pill tone="good">Tracking live</Pill>}
      />

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Buy Clicks" value={String(metrics.totalBuyClicks)} delta="Entry-point clicks" tone="flat" />
        <StatCard label="Finalized Purchases" value={String(metrics.finalizedPurchases)} delta={`${metrics.conversionRate}% conversion`} tone="flat" />
        <StatCard label="GMV Tracked" value={`$${metrics.gmvTracked.toFixed(2)}`} delta="Confirmed challenge value" tone="flat" />
        <StatCard label="RR Points Emitted" value={String(metrics.rrPointsEmitted)} delta="Purchase-linked rewards" tone="flat" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr_0.9fr]">
        <Panel title="Top Firms by GMV" action={<Trophy className="h-3.5 w-3.5 text-fuchsia-300" />}>
          {topFirms.length === 0 ? (
            <EmptyPanelText />
          ) : (
            <div className="space-y-3">
              {topFirms.map(([firm, value], index) => (
                <div key={firm} className="flex items-center justify-between rounded-xl bg-white/[0.03] px-3 py-3 ring-1 ring-white/10">
                  <div className="flex items-center gap-3">
                    <div className="grid h-8 w-8 place-items-center rounded-lg bg-white/10 text-xs font-bold text-white">
                      {index + 1}
                    </div>
                    <div className="text-sm font-semibold text-white">{firm}</div>
                  </div>
                  <div className="text-sm font-bold text-fuchsia-300">${value.toFixed(2)}</div>
                </div>
              ))}
            </div>
          )}
        </Panel>

        <Panel title="Reward Preference Mix" action={<Sparkles className="h-3.5 w-3.5 text-fuchsia-300" />}>
          {rows.length === 0 ? (
            <EmptyPanelText />
          ) : (
            <div className="space-y-3">
              <MixRow label="Cashback" value={rewardMix.cashback} />
              <MixRow label="RR" value={rewardMix.rr} />
              <MixRow label="Mixed" value={rewardMix.mixed} />
            </div>
          )}
        </Panel>

        <Panel title="Funnel" action={<Funnel className="h-3.5 w-3.5 text-fuchsia-300" />}>
          <div className="space-y-3">
            {funnelStats.map((item) => (
              <div key={item.label}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="font-semibold text-white">{item.label}</span>
                  <span className="text-muted-foreground">
                    {item.count} · {item.pct}%
                  </span>
                </div>
                <div className="h-2 rounded-full bg-white/10">
                  <div
                    className="h-2 rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-500"
                    style={{ width: `${Math.max(item.pct, item.label === "Buy click" ? 100 : 0)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <Panel title="Purchase log" action={<Pill tone="neutral">{filteredRows.length} rows</Pill>}>
        <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search email, firm, program..."
              className="w-full rounded-full border border-white/10 bg-white/[0.04] py-2.5 pl-10 pr-4 text-sm text-white outline-none transition placeholder:text-muted-foreground focus:border-fuchsia-400/40 focus:bg-white/[0.07]"
            />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <select
              value={firmFilter}
              onChange={(event) => setFirmFilter(event.target.value)}
              className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white outline-none transition focus:border-fuchsia-400/40"
            >
              {firmOptions.map((firm) => (
                <option key={firm} value={firm} className="bg-[#150829] text-white">
                  {firm === "all" ? "All firms" : firm}
                </option>
              ))}
            </select>

            <select
              value={stepFilter}
              onChange={(event) => setStepFilter(event.target.value as FunnelStep | "all")}
              className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white outline-none transition focus:border-fuchsia-400/40"
            >
              {STEP_OPTIONS.map((option) => (
                <option key={option.value} value={option.value} className="bg-[#150829] text-white">
                  {option.label}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => toast.success("Challenge purchases export started")}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_0_24px_rgba(192,132,252,0.28)]"
            >
              <Download className="h-4 w-4" />
              Export
            </button>
          </div>
        </div>

        <DataTable
          head={
            <>
              <th>Buyer</th>
              <th>Firm</th>
              <th>Program</th>
              <th>Step</th>
              <th>GMV</th>
              <th>RR</th>
              <th>Reward</th>
              <th>When</th>
            </>
          }
        >
          {filteredRows.length === 0 ? (
            <tr>
              <td colSpan={8} className="text-center text-sm text-muted-foreground">
                No challenge purchase records yet.
              </td>
            </tr>
          ) : (
            filteredRows.map((row) => (
              <tr key={row.id}>
                <td className="font-mono text-xs">{row.buyerEmail}</td>
                <td className="font-semibold text-white">{row.firm}</td>
                <td className="text-white/80">{row.program}</td>
                <td><Pill tone="neutral">{FUNNEL_LABELS[row.step]}</Pill></td>
                <td className="font-semibold text-amber-300">${row.amountUsd.toFixed(2)}</td>
                <td className="font-semibold text-fuchsia-300">{row.rrPoints}</td>
                <td>
                  <div className="capitalize text-white/80">{row.rewardPreference}</div>
                </td>
                <td className="text-xs text-muted-foreground">{row.when}</td>
              </tr>
            ))
          )}
        </DataTable>
      </Panel>
    </div>
  );
}

function EmptyPanelText() {
  return (
    <div className="grid min-h-[220px] place-items-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02] text-sm text-muted-foreground">
      No data yet
    </div>
  );
}

function MixRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-white/[0.03] px-3 py-3 ring-1 ring-white/10">
      <div className="text-sm font-semibold text-white">{label}</div>
      <div className="inline-flex items-center gap-2 text-sm font-bold text-fuchsia-300">
        <Coins className="h-4 w-4" />
        {value}
      </div>
    </div>
  );
}
