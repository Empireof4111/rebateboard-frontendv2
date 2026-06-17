import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Coins, RefreshCcw, Save, ShoppingCart, Trash2, Users } from "lucide-react";
import { PageHeader, Panel, Pill, StatCard } from "@/components/superadmin/AdminUI";
import { toast } from "@/components/superadmin/AdminActions";

export const Route = createFileRoute("/superadmin/rr-purchases")({
  component: RrPurchasesPage,
});

type PurchasePackage = {
  id: string;
  name: string;
  amountRr: number;
  bonusRr: number;
  badge: string;
  enabled: boolean;
};

type PurchaseLog = {
  id: string;
  buyer: string;
  rrAmount: number;
  amountUsd: number;
  status: "successful" | "pending" | "failed";
  when: string;
};

const DEFAULT_PRICING = {
  pricePerRr: 0.01,
  minPurchaseRr: 50,
  maxPurchaseRr: 100000,
};

const DEFAULT_PACKAGES: PurchasePackage[] = [
  { id: "pkg-1", name: "Starter", amountRr: 100, bonusRr: 0, badge: "badge", enabled: true },
  { id: "pkg-2", name: "Growth", amountRr: 500, bonusRr: 25, badge: "popular", enabled: true },
  { id: "pkg-3", name: "Pro", amountRr: 1000, bonusRr: 75, badge: "best value", enabled: true },
  { id: "pkg-4", name: "Whale", amountRr: 5000, bonusRr: 500, badge: "vip", enabled: false },
];

const DEFAULT_LOGS: PurchaseLog[] = [];

function RrPurchasesPage() {
  const [pricing, setPricing] = useState(DEFAULT_PRICING);
  const [packages, setPackages] = useState<PurchasePackage[]>(DEFAULT_PACKAGES);
  const [logs] = useState<PurchaseLog[]>(DEFAULT_LOGS);

  const metrics = useMemo(() => {
    const totalPurchases = logs.length;
    const rrSold = logs.reduce((sum, log) => sum + log.rrAmount, 0);
    const gmv = logs.reduce((sum, log) => sum + log.amountUsd, 0);
    const buyers = new Set(logs.map((log) => log.buyer)).size;

    return { totalPurchases, rrSold, gmv, buyers };
  }, [logs]);

  function updatePackage<K extends keyof PurchasePackage>(id: string, key: K, value: PurchasePackage[K]) {
    setPackages((current) =>
      current.map((item) => (item.id === id ? { ...item, [key]: value } : item)),
    );
  }

  function removePackage(id: string) {
    setPackages((current) => current.filter((item) => item.id !== id));
  }

  function resetPricing() {
    setPricing(DEFAULT_PRICING);
    toast.success("RR pricing reset to defaults");
  }

  function savePricing() {
    toast.success("RR pricing saved");
  }

  function savePackages() {
    toast.success("Quick-buy packages saved");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="RR Purchases"
        subtitle="Set the RR price, manage quick-buy packages, and review every top-up."
        actions={<Pill tone="good">Sales active</Pill>}
      />

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Purchases" value={String(metrics.totalPurchases)} delta="Recorded top-ups" tone="flat" />
        <StatCard label="RR Sold" value={String(metrics.rrSold)} delta="Across all packages" tone="flat" />
        <StatCard label="GMV" value={`$${metrics.gmv.toFixed(2)}`} delta="Gross merchant value" tone="flat" />
        <StatCard label="Buyers" value={String(metrics.buyers)} delta="Unique users" tone="flat" />
      </div>

      <Panel
        title="Global pricing"
        action={
          <button
            type="button"
            onClick={resetPricing}
            className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/15"
          >
            <RefreshCcw className="h-3.5 w-3.5" />
            Reset defaults
          </button>
        }
      >
        <div className="grid gap-4 md:grid-cols-3">
          <MetricInput
            label="Price per 1 RR ($)"
            value={pricing.pricePerRr}
            step={0.01}
            onChange={(value) => setPricing((current) => ({ ...current, pricePerRr: value }))}
          />
          <MetricInput
            label="Min purchase (RR)"
            value={pricing.minPurchaseRr}
            onChange={(value) => setPricing((current) => ({ ...current, minPurchaseRr: value }))}
          />
          <MetricInput
            label="Max purchase (RR)"
            value={pricing.maxPurchaseRr}
            onChange={(value) => setPricing((current) => ({ ...current, maxPurchaseRr: value }))}
          />
        </div>

        <div className="mt-4">
          <button
            type="button"
            onClick={savePricing}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-600 px-4 py-2 text-xs font-semibold text-white shadow-[0_0_24px_rgba(192,132,252,0.28)]"
          >
            <Save className="h-3.5 w-3.5" />
            Save pricing
          </button>
        </div>
      </Panel>

      <Panel
        title="Quick-buy packages"
        action={<Pill tone="neutral">{packages.length} packages</Pill>}
      >
        <div className="space-y-3">
          {packages.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 ring-1 ring-white/5"
            >
              <div className="grid gap-2 md:grid-cols-[1fr_0.9fr_0.9fr_1fr_auto]">
                <input
                  value={item.name}
                  onChange={(event) => updatePackage(item.id, "name", event.target.value)}
                  className={fieldClassName}
                  placeholder="Package name"
                />
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    RR
                  </span>
                  <input
                    type="number"
                    min={0}
                    value={item.amountRr}
                    onChange={(event) => updatePackage(item.id, "amountRr", Number(event.target.value) || 0)}
                    className={`${fieldClassName} pl-10`}
                    placeholder="Amount"
                  />
                </div>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    RR
                  </span>
                  <input
                    type="number"
                    min={0}
                    value={item.bonusRr}
                    onChange={(event) => updatePackage(item.id, "bonusRr", Number(event.target.value) || 0)}
                    className={`${fieldClassName} pl-10`}
                    placeholder="Bonus"
                  />
                </div>
                <input
                  value={item.badge}
                  onChange={(event) => updatePackage(item.id, "badge", event.target.value)}
                  className={fieldClassName}
                  placeholder="Badge"
                />
                <div className="flex items-center justify-end gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
                  <label className="inline-flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      checked={item.enabled}
                      onChange={(event) => updatePackage(item.id, "enabled", event.target.checked)}
                      className="h-4 w-4 rounded border-white/20 bg-white/10 accent-sky-500"
                    />
                    <span className={`text-xs font-semibold ${item.enabled ? "text-sky-300" : "text-muted-foreground"}`}>
                      Enabled
                    </span>
                  </label>
                  <button
                    type="button"
                    onClick={() => removePackage(item.id)}
                    className="grid h-7 w-7 place-items-center rounded-full bg-rose-500/10 text-rose-300 transition hover:bg-rose-500/20"
                    aria-label={`Delete ${item.name}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4">
          <button
            type="button"
            onClick={savePackages}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-600 px-4 py-2 text-xs font-semibold text-white shadow-[0_0_24px_rgba(192,132,252,0.28)]"
          >
            <Save className="h-3.5 w-3.5" />
            Save packages
          </button>
        </div>
      </Panel>

      <Panel title="Purchase activity" action={<Pill tone="neutral">Top-ups</Pill>}>
        {logs.length === 0 ? (
          <div className="grid gap-3 md:grid-cols-3">
            <EmptyMetricCard
              icon={ShoppingCart}
              title="No purchases yet"
              text="RR sales will appear here once users begin topping up through the live purchase flow."
            />
            <EmptyMetricCard
              icon={Coins}
              title="No RR sold"
              text="Package performance, bonus usage, and conversion data will populate automatically."
            />
            <EmptyMetricCard
              icon={Users}
              title="No buyers yet"
              text="Unique buyers and their latest top-up activity will appear in this panel."
            />
          </div>
        ) : null}
      </Panel>
    </div>
  );
}

function MetricInput({
  label,
  value,
  onChange,
  step = 1,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  step?: number;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      <input
        type="number"
        min={0}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value) || 0)}
        className={fieldClassName}
      />
    </label>
  );
}

function EmptyMetricCard({
  icon: Icon,
  title,
  text,
}: {
  icon: typeof ShoppingCart;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 ring-1 ring-white/5">
      <div className="mb-3 grid h-10 w-10 place-items-center rounded-xl bg-white/10 text-fuchsia-300 ring-1 ring-white/10">
        <Icon className="h-4 w-4" />
      </div>
      <div className="text-sm font-semibold text-white">{title}</div>
      <div className="mt-1 text-xs leading-relaxed text-muted-foreground">{text}</div>
    </div>
  );
}

const fieldClassName =
  "w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-muted-foreground focus:border-fuchsia-400/40 focus:bg-white/[0.07]";
