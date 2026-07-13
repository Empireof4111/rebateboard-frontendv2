import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Coins, Plus, RefreshCcw, Save, ShoppingCart, Trash2, Users } from "lucide-react";
import { PageHeader, Panel, Pill, StatCard } from "@/components/superadmin/AdminUI";
import { toast } from "@/components/superadmin/AdminActions";
import {
  deleteRrPurchasePackage,
  fetchRrPurchaseAdminBoard,
  saveRrPurchaseConfig,
  saveRrPurchasePackage,
  type RrPurchaseAdminBoard,
  type RrPurchasePackage,
} from "@/lib/rr-purchase-api";

export const Route = createFileRoute("/superadmin/rr-purchases")({
  component: RrPurchasesPage,
});

function RrPurchasesPage() {
  const [board, setBoard] = useState<RrPurchaseAdminBoard | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const payload = await fetchRrPurchaseAdminBoard();
        if (!cancelled) setBoard(payload);
      } catch (error) {
        if (!cancelled) toast.error(error instanceof Error ? error.message : "Failed to load RR purchases");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const pricing = board?.pricing ?? {
    pricePerRr: 0.01,
    minPurchaseRr: 50,
    maxPurchaseRr: 100000,
    salesActive: true,
  };
  const packages = board?.packages ?? [];
  const logs = board?.logs ?? [];
  const metrics = board?.stats ?? {
    totalPurchases: 0,
    rrSold: 0,
    gmv: 0,
    buyers: 0,
  };

  function patchPricing<K extends keyof typeof pricing>(key: K, value: (typeof pricing)[K]) {
    setBoard((current) => current ? { ...current, pricing: { ...current.pricing, [key]: value } } : current);
  }

  function updatePackage<K extends keyof RrPurchasePackage>(id: string, key: K, value: RrPurchasePackage[K]) {
    setBoard((current) =>
      current
        ? { ...current, packages: current.packages.map((item) => (item.id === id ? { ...item, [key]: value } : item)) }
        : current,
    );
  }

  function addPackage() {
    setBoard((current) =>
      current
        ? {
            ...current,
            packages: [
              ...current.packages,
              {
                id: `draft-${Date.now()}`,
                name: "",
                amountRr: 100,
                bonusRr: 0,
                badge: "",
                enabled: true,
                displayOrder: current.packages.length,
              },
            ],
          }
        : current,
    );
  }

  async function removePackage(id: string) {
    if (id.startsWith("draft-")) {
      setBoard((current) =>
        current ? { ...current, packages: current.packages.filter((item) => item.id !== id) } : current,
      );
      return;
    }

    try {
      setSaving(true);
      const payload = await deleteRrPurchasePackage(id);
      setBoard(payload);
      toast.success("Package removed");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to delete package");
    } finally {
      setSaving(false);
    }
  }

  async function persistPackage(item: RrPurchasePackage) {
    try {
      setSaving(true);
      const payload = await saveRrPurchasePackage({
        ...(item.id.startsWith("draft-") ? {} : { id: Number(item.id) }),
        name: item.name,
        amountRr: item.amountRr,
        bonusRr: item.bonusRr,
        badge: item.badge,
        enabled: item.enabled,
        displayOrder: item.displayOrder,
      });
      setBoard(payload);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save RR package");
    } finally {
      setSaving(false);
    }
  }

  async function resetPricing() {
    try {
      setSaving(true);
      const payload = await saveRrPurchaseConfig({
        pricePerRr: 0.01,
        minPurchaseRr: 50,
        maxPurchaseRr: 100000,
        salesActive: true,
      });
      setBoard(payload);
      toast.success("RR pricing reset to defaults");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to reset RR pricing");
    } finally {
      setSaving(false);
    }
  }

  async function savePricing() {
    try {
      setSaving(true);
      const payload = await saveRrPurchaseConfig(pricing);
      setBoard(payload);
      toast.success("RR pricing saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save RR pricing");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="RR Purchases"
        subtitle="Set the RR price, manage quick-buy packages, and review every top-up."
        actions={<Pill tone={pricing.salesActive ? "good" : "warn"}>{pricing.salesActive ? "Sales active" : "Sales paused"}</Pill>}
      />

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Purchases" value={String(metrics.totalPurchases)} delta="Recorded top-ups" tone="flat" />
        <StatCard label="RR Sold" value={String(metrics.rrSold)} delta="Base + bonus RR delivered" tone="flat" />
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
            onChange={(value) => patchPricing("pricePerRr", value)}
          />
          <MetricInput
            label="Min purchase (RR)"
            value={pricing.minPurchaseRr}
            onChange={(value) => patchPricing("minPurchaseRr", value)}
          />
          <MetricInput
            label="Max purchase (RR)"
            value={pricing.maxPurchaseRr}
            onChange={(value) => patchPricing("maxPurchaseRr", value)}
          />
        </div>

        <label className="mt-4 inline-flex items-center gap-2 text-sm text-white">
          <input
            type="checkbox"
            checked={pricing.salesActive}
            onChange={(event) => patchPricing("salesActive", event.target.checked)}
            className="h-4 w-4 rounded border-white/20 bg-white/10 accent-sky-500"
          />
          Sales active
        </label>

        <div className="mt-4">
          <button
            type="button"
            onClick={savePricing}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-full rb-gradient-primary px-4 py-2 text-xs font-semibold text-white shadow-[0_0_24px_rgba(192,132,252,0.28)]"
          >
            <Save className="h-3.5 w-3.5" />
            Save pricing
          </button>
        </div>
      </Panel>

      <Panel
        title="Quick-buy packages"
        action={
          <div className="flex items-center gap-2">
            <Pill tone="neutral">{packages.length} packages</Pill>
            <button
              type="button"
              onClick={addPackage}
              className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/15"
            >
              <Plus className="h-3.5 w-3.5" />
              Add package
            </button>
          </div>
        }
      >
        <div className="space-y-3">
          {loading && packages.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] px-4 py-8 text-center text-sm text-muted-foreground">
              Loading RR packages...
            </div>
          ) : null}
          {packages.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 ring-1 ring-white/5"
            >
              <div className="grid gap-2 md:grid-cols-[1fr_0.9fr_0.9fr_1fr_auto]">
                <input
                  value={item.name}
                  onChange={(event) => updatePackage(item.id, "name", event.target.value)}
                  onBlur={() => void persistPackage(item)}
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
                    onBlur={() => void persistPackage(item)}
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
                    onBlur={() => void persistPackage(item)}
                    className={`${fieldClassName} pl-10`}
                    placeholder="Bonus"
                  />
                </div>
                <input
                  value={item.badge}
                  onChange={(event) => updatePackage(item.id, "badge", event.target.value)}
                  onBlur={() => void persistPackage(item)}
                  className={fieldClassName}
                  placeholder="Badge"
                />
                <div className="flex items-center justify-end gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
                  <label className="inline-flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      checked={item.enabled}
                      onChange={(event) => {
                        updatePackage(item.id, "enabled", event.target.checked);
                        void persistPackage({ ...item, enabled: event.target.checked });
                      }}
                      className="h-4 w-4 rounded border-white/20 bg-white/10 accent-sky-500"
                    />
                    <span className={`text-xs font-semibold ${item.enabled ? "text-sky-300" : "text-muted-foreground"}`}>
                      Enabled
                    </span>
                  </label>
                  <button
                    type="button"
                    onClick={() => removePackage(item.id)}
                    disabled={saving}
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

        <div className="mt-4 text-xs text-muted-foreground">
          Package edits save back to the live RR purchase engine and immediately affect the user-side catalog.
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
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="pb-3">Buyer</th>
                  <th className="pb-3">RR</th>
                  <th className="pb-3">GMV</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Reference</th>
                  <th className="pb-3">When</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td className="py-3 text-white">{log.buyer}</td>
                    <td className="py-3 text-amber-300">{log.rrAmount}</td>
                    <td className="py-3 text-white">${log.amountUsd.toFixed(2)}</td>
                    <td className="py-3">
                      <Pill tone={log.status === "successful" ? "good" : log.status === "pending" ? "warn" : "neutral"}>
                        {log.status}
                      </Pill>
                    </td>
                    <td className="py-3 font-mono text-xs text-muted-foreground">{log.reference}</td>
                    <td className="py-3 text-muted-foreground">{new Date(log.when).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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
      <div className="mb-3 grid h-10 w-10 place-items-center rounded-xl bg-white/10 text-violet-300 ring-1 ring-white/10">
        <Icon className="h-4 w-4" />
      </div>
      <div className="text-sm font-semibold text-white">{title}</div>
      <div className="mt-1 text-xs leading-relaxed text-muted-foreground">{text}</div>
    </div>
  );
}

const fieldClassName =
  "w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-muted-foreground focus:border-violet-400/40 focus:bg-white/[0.07]";
