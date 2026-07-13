import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { BadgePercent, Plus, RefreshCw, Save, Trash2 } from "lucide-react";
import { PageHeader, Panel, StatCard } from "@/components/superadmin/AdminUI";
import { toast } from "@/components/superadmin/AdminActions";
import {
  fetchAdminBrands,
  updateAdminBrand,
  type AdminBrandRecord,
} from "@/lib/admin-brands-api";
import type { CashbackCalculatorRate } from "@/components/calculators/RebateCalculator";

export const Route = createFileRoute("/superadmin/cashback-calculator")({
  head: () => ({
    meta: [
      { title: "Cashback Calculator — Superadmin" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: CashbackCalculatorAdminPage,
});

const inputCls =
  "w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white placeholder:text-muted-foreground focus:border-fuchsia-400/40 focus:outline-none";

const assetOptions = ["Forex", "Indices", "Metals", "Crypto", "Stocks", "Futures", "Commodities"];
const categoryOptions = ["Forex Broker", "Prop Firm", "Futures Prop Firm", "Crypto Exchange", "Trading Tool"];

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function brandRates(brand?: AdminBrandRecord): CashbackCalculatorRate[] {
  const cashback = asRecord(brand?.cashback);
  return Array.isArray(cashback.calculatorRates)
    ? cashback.calculatorRates.filter((rate): rate is CashbackCalculatorRate => Boolean(rate && typeof rate === "object"))
    : [];
}

function newRate(): CashbackCalculatorRate {
  return {
    id: Math.random().toString(36).slice(2, 10),
    asset: "Forex",
    accountType: "Standard",
    rebatePerLot: 0,
    percentage: 30,
    currency: "USD",
    active: true,
  };
}

function CashbackCalculatorAdminPage() {
  const [brands, setBrands] = useState<AdminBrandRecord[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [category, setCategory] = useState("Forex Broker");
  const [rates, setRates] = useState<CashbackCalculatorRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await fetchAdminBrands();
      setBrands(rows);
      const preferred = rows.find((brand) => /exness/i.test(brand.name)) ?? rows[0];
      setSelectedId((current) => current || preferred?.id || "");
    } catch {
      toast.error("Brand records could not be loaded");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filteredBrands = useMemo(() => {
    const rows = brands.filter((brand) => !category || brand.category === category);
    return rows.length ? rows : brands;
  }, [brands, category]);

  const selectedBrand = useMemo(
    () => brands.find((brand) => brand.id === selectedId),
    [brands, selectedId],
  );

  useEffect(() => {
    if (selectedBrand) setRates(brandRates(selectedBrand));
  }, [selectedBrand]);

  useEffect(() => {
    if (filteredBrands.length && !filteredBrands.some((brand) => brand.id === selectedId)) {
      setSelectedId(filteredBrands[0].id);
    }
  }, [filteredBrands, selectedId]);

  const updateRate = (index: number, patch: Partial<CashbackCalculatorRate>) => {
    setRates((current) => current.map((rate, i) => (i === index ? { ...rate, ...patch } : rate)));
  };

  const save = async () => {
    if (!selectedBrand) return;
    setSaving(true);
    try {
      const cashback = asRecord(selectedBrand.cashback);
      const next = await updateAdminBrand(selectedBrand.id, {
        cashback: {
          ...cashback,
          calculatorRates: rates.map((rate) => ({
            ...rate,
            rebatePerLot: Number(rate.rebatePerLot ?? 0),
            percentage: Number(rate.percentage ?? 0),
            currency: String(rate.currency || "USD").toUpperCase(),
            active: rate.active !== false,
          })),
        },
      });
      setBrands((current) => current.map((brand) => (brand.id === next.id ? next : brand)));
      toast.success("Calculator rates saved");
    } catch {
      toast.error("Unable to save calculator rates");
    } finally {
      setSaving(false);
    }
  };

  const activeRateCount = brands.reduce((total, brand) => total + brandRates(brand).filter((rate) => rate.active !== false).length, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cashback Calculator"
        subtitle="Manage broker, prop firm, exchange, asset, and account-type rates used by the public rebate calculator."
        actions={
          <button
            type="button"
            onClick={load}
            className="grid h-8 w-8 place-items-center rounded-full bg-white/5 text-white ring-1 ring-white/10"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Brands" value={String(brands.length)} delta="available" />
        <StatCard label="Active rates" value={String(activeRateCount)} delta="calculator-ready" />
        <StatCard label="Selected" value={selectedBrand?.name ?? "None"} delta={selectedBrand?.category ?? "Pick a brand"} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
        <Panel title="Brand source">
          <div className="space-y-3">
            <Field label="Category">
              <select className={inputCls} value={category} onChange={(event) => setCategory(event.target.value)}>
                {categoryOptions.map((option) => (
                  <option key={option} value={option} className="bg-[var(--rb-bg-elevated)]">
                    {option}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Brand">
              <select className={inputCls} value={selectedId} onChange={(event) => setSelectedId(event.target.value)}>
                {filteredBrands.map((brand) => (
                  <option key={brand.id} value={brand.id} className="bg-[var(--rb-bg-elevated)]">
                    {brand.name} · {brand.category}
                  </option>
                ))}
              </select>
            </Field>
            <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/15 text-primary ring-1 ring-primary/25">
                  <BadgePercent className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">{selectedBrand?.name ?? "No brand selected"}</div>
                  <div className="text-xs text-muted-foreground">
                    Rates save into this brand's cashback profile.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Panel>

        <Panel
          title="Calculator rates"
          action={
            <button
              type="button"
              onClick={() => setRates((current) => [...current, newRate()])}
              className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-white/15"
            >
              <Plus className="h-3 w-3" />
              Add rate
            </button>
          }
        >
          {rates.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/10 p-6 text-center text-xs text-muted-foreground">
              No calculator rates yet. Add a rate to make this brand available in the live rebate calculator.
            </div>
          ) : (
            <div className="space-y-3">
              {rates.map((rate, index) => (
                <div key={rate.id ?? index} className="rounded-2xl border border-white/10 bg-white/[0.025] p-3">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <Field label="Asset">
                      <select className={inputCls} value={rate.asset ?? "Forex"} onChange={(event) => updateRate(index, { asset: event.target.value })}>
                        {assetOptions.map((option) => (
                          <option key={option} value={option} className="bg-[var(--rb-bg-elevated)]">
                            {option}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Account type">
                      <input className={inputCls} value={rate.accountType ?? ""} onChange={(event) => updateRate(index, { accountType: event.target.value })} />
                    </Field>
                    <Field label="Currency">
                      <input className={inputCls} value={rate.currency ?? "USD"} onChange={(event) => updateRate(index, { currency: event.target.value.toUpperCase() })} />
                    </Field>
                    <Field label="Rebate per lot">
                      <input type="number" step="0.01" className={inputCls} value={String(rate.rebatePerLot ?? 0)} onChange={(event) => updateRate(index, { rebatePerLot: event.target.value })} />
                    </Field>
                    <Field label="Percentage">
                      <input type="number" step="0.1" className={inputCls} value={String(rate.percentage ?? 0)} onChange={(event) => updateRate(index, { percentage: event.target.value })} />
                    </Field>
                    <div className="flex items-end gap-2">
                      <label className="flex h-10 flex-1 items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 text-xs text-white">
                        <input
                          type="checkbox"
                          checked={rate.active !== false}
                          onChange={(event) => updateRate(index, { active: event.target.checked })}
                          className="h-4 w-4 rounded border-white/20 bg-white/10"
                        />
                        Active
                      </label>
                      <button
                        type="button"
                        onClick={() => setRates((current) => current.filter((_, i) => i !== index))}
                        className="grid h-10 w-10 place-items-center rounded-lg bg-white/10 text-muted-foreground hover:bg-rose-500/20 hover:text-rose-300"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={save}
              disabled={!selectedBrand || saving}
              className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-2 text-xs font-semibold text-white shadow-[0_0_24px_rgba(16,185,129,0.45)] disabled:opacity-40"
            >
              <Save className="h-3.5 w-3.5" />
              {saving ? "Saving…" : "Save rates"}
            </button>
          </div>
        </Panel>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
