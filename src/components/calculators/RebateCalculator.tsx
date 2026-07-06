import { useEffect, useMemo, useState } from "react";
import { BadgePercent, Gift, Save } from "lucide-react";
import {
  fetchPublicAdminBrands,
  type AdminBrandRecord,
} from "@/lib/admin-brands-api";

type RebateCalculatorProps = {
  compact?: boolean;
  onResult?: (value: string) => void;
  showSaveAction?: boolean;
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function firstNumber(...values: unknown[]) {
  for (const value of values) {
    const match = String(value ?? "").match(/\d+(?:\.\d+)?/);
    if (match) return Number(match[0]);
  }
  return null;
}

function rebateRate(brand?: AdminBrandRecord) {
  if (!brand) return null;
  const cashback = asRecord(brand.cashback);
  return firstNumber(
    cashback.maxPct,
    cashback.defaultPct,
    cashback.cashbackPct,
    cashback.cashbackPercent,
    cashback.percent,
    cashback.rebatePct,
  );
}

function commissionRate(brand?: AdminBrandRecord) {
  if (!brand) return null;
  const broker = asRecord(brand.broker);
  const commission = String(broker.commission ?? "");
  if (/commission[- ]?free|zero commission/i.test(commission)) return 0;
  return firstNumber(commission);
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="mb-1 flex items-center justify-between gap-3">
        <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/48">
          {label}
        </span>
        {hint && <span className="text-[10px] font-semibold text-primary">{hint}</span>}
      </div>
      {children}
    </label>
  );
}

const inputClass =
  "h-10 w-full rounded-xl border border-white/10 bg-white/[0.055] px-3 text-sm font-semibold text-white outline-none transition focus:border-primary/60 focus:ring-2 focus:ring-primary/15";

export function RebateCalculator({
  compact = false,
  onResult,
  showSaveAction = true,
}: RebateCalculatorProps) {
  const [type, setType] = useState("Forex");
  const [lot, setLot] = useState(1);
  const [trades, setTrades] = useState(10);
  const [brandId, setBrandId] = useState("");
  const [brands, setBrands] = useState<AdminBrandRecord[]>([]);
  const [pct, setPct] = useState(30);
  const [commission, setCommission] = useState(7);

  useEffect(() => {
    let active = true;
    fetchPublicAdminBrands().then((items) => {
      if (!active) return;
      const eligible = items.filter((brand) => {
        const rate = rebateRate(brand);
        const flags = asRecord(brand.flags);
        return rate !== null || flags.cashbackEligible === true;
      });
      const options = eligible.length ? eligible : items;
      setBrands(options);
      setBrandId((current) => current || options[0]?.id || "");
    });
    return () => {
      active = false;
    };
  }, []);

  const selectedBrand = useMemo(
    () => brands.find((brand) => brand.id === brandId),
    [brandId, brands],
  );

  useEffect(() => {
    const liveRate = rebateRate(selectedBrand);
    const liveCommission = commissionRate(selectedBrand);
    if (liveRate !== null) setPct(Math.min(80, Math.max(0, liveRate)));
    if (liveCommission !== null) setCommission(Math.max(0, liveCommission));
  }, [selectedBrand]);

  useEffect(() => {
    if (selectedBrand) return;
    setCommission(type === "Crypto" ? 8 : type === "Indices" ? 6 : 7);
  }, [selectedBrand, type]);

  const totalCommission = commission * lot * trades;
  const rebate = (totalCommission * pct) / 100;
  const perTrade = trades > 0 ? rebate / trades : 0;
  const monthly = rebate * 4;
  const withRebate = totalCommission - rebate;
  const result = `Rebate $${rebate.toFixed(2)} (${pct.toFixed(0)}% cashback)`;

  return (
    <div
      className={`grid gap-4 ${
        compact ? "grid-cols-1" : "grid-cols-1 md:grid-cols-[1.05fr_.95fr]"
      }`}
    >
      <div className="space-y-3">
        <div className={compact ? "grid grid-cols-2 gap-3" : "grid grid-cols-2 gap-3"}>
          <Field label="Asset type">
            <select value={type} onChange={(event) => setType(event.target.value)} className={inputClass}>
              {["Forex", "Crypto", "Indices"].map((option) => (
                <option key={option} value={option} className="bg-[#150829]">
                  {option}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Rebate rate" hint={`${pct}%`}>
            <input
              type="number"
              min={0}
              max={80}
              value={pct}
              onChange={(event) => setPct(Math.min(80, Math.max(0, Number(event.target.value))))}
              className={inputClass}
            />
          </Field>
        </div>

        <Field label="Broker / firm">
          <select
            value={brandId}
            onChange={(event) => setBrandId(event.target.value)}
            className={inputClass}
          >
            {brands.length === 0 ? (
              <option value="" className="bg-[#150829]">
                Published brands load automatically
              </option>
            ) : (
              brands.map((brand) => (
                <option key={brand.id} value={brand.id} className="bg-[#150829]">
                  {brand.name}
                </option>
              ))
            )}
          </select>
        </Field>

        <div className="grid grid-cols-3 gap-3">
          <Field label="Lot size">
            <input
              type="number"
              min={0}
              step={0.1}
              value={lot}
              onChange={(event) => setLot(Math.max(0, Number(event.target.value)))}
              className={inputClass}
            />
          </Field>
          <Field label="Trades">
            <input
              type="number"
              min={0}
              step={1}
              value={trades}
              onChange={(event) => setTrades(Math.max(0, Number(event.target.value)))}
              className={inputClass}
            />
          </Field>
          <Field label="Commission / lot">
            <input
              type="number"
              min={0}
              step={0.5}
              value={commission}
              onChange={(event) => setCommission(Math.max(0, Number(event.target.value)))}
              className={inputClass}
            />
          </Field>
        </div>
      </div>

      <div className="flex min-h-[180px] flex-col rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/15 via-white/[0.04] to-transparent p-4">
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-primary">
          <BadgePercent className="h-4 w-4" />
          Estimated rebate
        </div>
        <div className="mt-2 text-3xl font-black text-emerald-300">${rebate.toFixed(2)}</div>
        <div className="mt-3 space-y-1.5 text-xs text-white/70">
          <div className="flex justify-between gap-3">
            <span>Per trade</span>
            <span className="font-mono font-bold text-white">${perTrade.toFixed(2)}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span>Monthly estimate</span>
            <span className="font-mono font-bold text-emerald-300">${monthly.toFixed(2)}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span>Cost after rebate</span>
            <span className="font-mono font-bold text-white">${withRebate.toFixed(2)}</span>
          </div>
        </div>
        <p className="mt-auto pt-3 text-[10px] leading-4 text-white/42">
          Estimate only. Final cashback follows the selected brand, account, and eligible trading activity.
        </p>
        {showSaveAction && onResult && (
          <button
            type="button"
            onClick={() => onResult(result)}
            className="mt-3 inline-flex items-center justify-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-bold text-white transition hover:brightness-110"
          >
            <Save className="h-3.5 w-3.5" />
            Save result
          </button>
        )}
      </div>

      {compact && (
        <div className="flex items-center gap-2 text-[10px] text-white/45">
          <Gift className="h-3.5 w-3.5 text-primary" />
          Brand rates are loaded from the RebateBoard admin system when available.
        </div>
      )}
    </div>
  );
}
