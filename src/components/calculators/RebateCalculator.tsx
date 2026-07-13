import { useEffect, useMemo, useRef, useState } from "react";
import { BadgePercent, Check, ChevronDown, Save, Search } from "lucide-react";
import {
  fetchPublicAdminBrands,
  type AdminBrandRecord,
} from "@/lib/admin-brands-api";
import { brandInitials, brandLogoUrl } from "@/lib/brand-assets";

type RebateCalculatorProps = {
  compact?: boolean;
  onResult?: (value: string) => void;
  onSelectedBrandChange?: (brand: AdminBrandRecord | null) => void;
  showSaveAction?: boolean;
};

export type CashbackCalculatorRate = {
  id?: string;
  asset?: string;
  accountType?: string;
  rebatePerLot?: number | string;
  percentage?: number | string;
  currency?: string;
  active?: boolean;
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

function calculatorRates(brand?: AdminBrandRecord): CashbackCalculatorRate[] {
  if (!brand) return [];
  const cashback = asRecord(brand.cashback);
  const rows = Array.isArray(cashback.calculatorRates) ? cashback.calculatorRates : [];
  return rows
    .filter((row): row is CashbackCalculatorRate => Boolean(row && typeof row === "object"))
    .filter((row) => row.active !== false);
}

function useAnimatedNumber(value: number, duration = 520) {
  const [display, setDisplay] = useState(value);
  const previous = useRef(value);

  useEffect(() => {
    const from = previous.current;
    const to = Number.isFinite(value) ? value : 0;
    previous.current = to;

    if (Math.abs(from - to) < 0.01) {
      setDisplay(to);
      return;
    }

    let frame = 0;
    const started = performance.now();
    const tick = (now: number) => {
      const progress = Math.min(1, (now - started) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(from + (to - from) * eased);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [duration, value]);

  return display;
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
  onSelectedBrandChange,
  showSaveAction = true,
}: RebateCalculatorProps) {
  const [type, setType] = useState("Forex");
  const [accountType, setAccountType] = useState("Standard");
  const [lot, setLot] = useState(1);
  const [trades, setTrades] = useState(20);
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
      setBrandId((current) => current || options.find((brand) => /exness/i.test(brand.name))?.id || options[0]?.id || "");
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
    onSelectedBrandChange?.(selectedBrand ?? null);
  }, [onSelectedBrandChange, selectedBrand]);
  const rates = useMemo(() => calculatorRates(selectedBrand), [selectedBrand]);
  const assetOptions = useMemo(() => {
    const values = Array.from(new Set(rates.map((rate) => String(rate.asset ?? "").trim()).filter(Boolean)));
    return values.length ? values : ["Forex", "Crypto", "Indices"];
  }, [rates]);
  const accountOptions = useMemo(() => {
    const byAsset = rates.filter((rate) => !rate.asset || rate.asset === type);
    const values = Array.from(new Set(byAsset.map((rate) => String(rate.accountType ?? "").trim()).filter(Boolean)));
    return values.length ? values : ["Standard"];
  }, [rates, type]);
  const selectedRate = useMemo(() => {
    return (
      rates.find((rate) => rate.asset === type && rate.accountType === accountType) ??
      rates.find((rate) => rate.asset === type) ??
      rates[0]
    );
  }, [accountType, rates, type]);

  useEffect(() => {
    if (assetOptions.length && !assetOptions.includes(type)) setType(assetOptions[0]);
  }, [assetOptions, type]);

  useEffect(() => {
    if (accountOptions.length && !accountOptions.includes(accountType)) setAccountType(accountOptions[0]);
  }, [accountOptions, accountType]);

  useEffect(() => {
    const liveRate = firstNumber(selectedRate?.percentage) ?? rebateRate(selectedBrand);
    const liveCommission = commissionRate(selectedBrand);
    if (liveRate !== null) setPct(Math.min(80, Math.max(0, liveRate)));
    if (liveCommission !== null) setCommission(Math.max(0, liveCommission));
  }, [selectedBrand, selectedRate]);

  useEffect(() => {
    if (selectedBrand) return;
    setCommission(type === "Crypto" ? 8 : type === "Indices" ? 6 : 7);
  }, [selectedBrand, type]);

  const totalCommission = commission * lot * trades;
  const rebatePerLot = firstNumber(selectedRate?.rebatePerLot);
  const rebate = rebatePerLot !== null ? rebatePerLot * lot * trades : (totalCommission * pct) / 100;
  const perTrade = trades > 0 ? rebate / trades : 0;
  const monthly = rebate * 4;
  const withRebate = totalCommission - rebate;
  const animatedRebate = useAnimatedNumber(rebate);
  const currency = String(selectedRate?.currency || "USD").toUpperCase();
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
              {assetOptions.map((option) => (
                <option key={option} value={option} className="bg-[var(--rb-bg-elevated)]">
                  {option}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Account type">
            <select value={accountType} onChange={(event) => setAccountType(event.target.value)} className={inputClass}>
              {accountOptions.map((option) => (
                <option key={option} value={option} className="bg-[var(--rb-bg-elevated)]">
                  {option}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="Broker / firm">
          <BrandPicker brands={brands} selectedId={brandId} onSelect={setBrandId} />
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
        <Field
          label="Cashback basis"
          hint={rebatePerLot !== null ? `${currency} ${rebatePerLot}/lot` : `${pct}%`}
        >
          <input
            type="number"
            min={0}
            max={rebatePerLot !== null ? undefined : 80}
            step={rebatePerLot !== null ? 0.1 : 1}
            value={rebatePerLot !== null ? rebatePerLot : pct}
            onChange={(event) => {
              if (rebatePerLot !== null) return;
              setPct(Math.min(80, Math.max(0, Number(event.target.value))));
            }}
            readOnly={rebatePerLot !== null}
            className={`${inputClass} ${rebatePerLot !== null ? "cursor-default opacity-80" : ""}`}
          />
        </Field>
      </div>

      <div className="flex min-h-[180px] flex-col rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/15 via-white/[0.04] to-transparent p-4">
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-primary">
          <BadgePercent className="h-4 w-4" />
          Estimated rebate
        </div>
        <div className="mt-2 text-3xl font-black text-emerald-300">
          {currency === "USD" ? "$" : `${currency} `}
          {animatedRebate.toFixed(2)}
        </div>
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

    </div>
  );
}

function BrandPicker({
  brands,
  selectedId,
  onSelect,
}: {
  brands: AdminBrandRecord[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement | null>(null);
  const selected = brands.find((brand) => brand.id === selectedId);
  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return brands.slice(0, 12);
    return brands
      .filter((brand) => `${brand.name} ${brand.category}`.toLowerCase().includes(term))
      .slice(0, 16);
  }, [brands, query]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  if (brands.length === 0) {
    return (
      <div className={`${inputClass} flex items-center text-white/45`}>
        Published brands load automatically
      </div>
    );
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={`${inputClass} flex items-center gap-2 pr-2 text-left`}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {selected ? (
          <>
            <BrandAvatar brand={selected} className="h-6 w-6 rounded-lg" />
            <span className="min-w-0 flex-1 truncate">{selected.name}</span>
            <span className="hidden shrink-0 text-[10px] font-bold uppercase tracking-[0.12em] text-white/42 sm:inline">
              {selected.category}
            </span>
          </>
        ) : (
          <span className="flex-1 text-white/45">Select a listed brand</span>
        )}
        <ChevronDown className={`h-4 w-4 shrink-0 text-white/45 transition ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-[calc(100%+0.4rem)] z-30 overflow-hidden rounded-2xl border border-white/12 bg-[rgba(18,18,25,0.98)] shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl">
          <div className="flex items-center gap-2 border-b border-white/8 px-3 py-2">
            <Search className="h-4 w-4 text-white/42" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search brands..."
              className="h-8 min-w-0 flex-1 bg-transparent text-sm font-semibold text-white outline-none placeholder:text-white/35"
              autoFocus
            />
          </div>
          <div className="max-h-64 overflow-y-auto p-1.5">
            {visible.map((brand) => {
              const active = brand.id === selectedId;
              return (
                <button
                  key={brand.id}
                  type="button"
                  onClick={() => {
                    onSelect(brand.id);
                    setOpen(false);
                    setQuery("");
                  }}
                  className={`flex w-full items-center gap-2 rounded-xl px-2 py-2 text-left transition ${
                    active ? "bg-violet-500/16 text-white" : "text-white/82 hover:bg-white/[0.06] hover:text-white"
                  }`}
                  role="option"
                  aria-selected={active}
                >
                  <BrandAvatar brand={brand} className="h-8 w-8 rounded-xl" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold">{brand.name}</span>
                    <span className="block truncate text-[11px] text-white/45">{brand.category}</span>
                  </span>
                  {active && <Check className="h-4 w-4 shrink-0 text-violet-200" />}
                </button>
              );
            })}
            {visible.length === 0 && (
              <div className="px-3 py-5 text-center text-xs text-white/45">No matching brands found.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function BrandAvatar({ brand, className }: { brand: AdminBrandRecord; className: string }) {
  const [failed, setFailed] = useState(false);
  const logo = brandLogoUrl(brand);
  const initials = brandInitials(brand.name);

  return (
    <span className={`grid shrink-0 place-items-center overflow-hidden bg-white/[0.06] ${className}`}>
      {logo && !failed ? (
        <img
          src={logo}
          alt=""
          className="h-full w-full object-cover"
          loading="lazy"
          onError={() => setFailed(true)}
        />
      ) : (
        <span className="text-[10px] font-black text-violet-100">{initials || "RB"}</span>
      )}
    </span>
  );
}
