import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { X, Calculator, TrendingUp, Wallet, Info, Bot } from "lucide-react";

type Broker = { name: string; commissionPerLot: number; cashbackPct: number };

const BROKERS: Broker[] = [
  { name: "IC Markets", commissionPerLot: 7, cashbackPct: 60 },
  { name: "Pepperstone", commissionPerLot: 7, cashbackPct: 55 },
  { name: "FP Markets", commissionPerLot: 6, cashbackPct: 65 },
  { name: "Exness", commissionPerLot: 8, cashbackPct: 50 },
  { name: "Tickmill", commissionPerLot: 4, cashbackPct: 70 },
  { name: "Custom", commissionPerLot: 7, cashbackPct: 60 },
];

const fmt = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 });

export function RebateCalculatorModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [brokerIdx, setBrokerIdx] = useState(0);
  const [lots, setLots] = useState(50);
  const [commission, setCommission] = useState(BROKERS[0].commissionPerLot);
  const [cashback, setCashback] = useState(BROKERS[0].cashbackPct);

  const monthly = useMemo(() => lots * commission * (cashback / 100), [lots, commission, cashback]);
  const yearly = monthly * 12;

  if (!open) return null;

  function selectBroker(i: number) {
    setBrokerIdx(i);
    const b = BROKERS[i];
    if (b.name !== "Custom") {
      setCommission(b.commissionPerLot);
      setCashback(b.cashbackPct);
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[2147483000] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-[var(--rb-bg-card)] ring-1 ring-white/10 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative bg-gradient-to-br from-violet-500/20 via-violet-500/15 to-transparent p-5">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-full bg-white/10 p-1.5 text-white ring-1 ring-white/10 hover:bg-white/20"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-xl rb-gradient-primary ring-1 ring-white/10">
              <Calculator className="h-4 w-4 text-white" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Rebate Calculator</h2>
              <p className="text-[11px] text-muted-foreground">Estimate your cashback in seconds.</p>
            </div>
          </div>
        </div>

        <div className="space-y-4 p-5">
          {/* Broker */}
          <div>
            <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Broker preset
            </label>
            <div className="flex flex-wrap gap-1.5">
              {BROKERS.map((b, i) => (
                <button
                  key={b.name}
                  onClick={() => selectBroker(i)}
                  className={
                    "rounded-full px-3 py-1.5 text-[11px] ring-1 transition " +
                    (brokerIdx === i
                      ? "bg-violet-300/20 text-white ring-violet-300/50"
                      : "bg-white/[0.04] text-white/80 ring-white/10 hover:bg-white/[0.08]")
                  }
                >
                  {b.name}
                </button>
              ))}
            </div>
          </div>

          {/* Lots */}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Monthly volume (lots)
              </label>
              <span className="text-xs font-semibold text-white">{lots.toLocaleString()}</span>
            </div>
            <input
              type="range"
              min={1}
              max={500}
              value={lots}
              onChange={(e) => setLots(Number(e.target.value))}
              className="w-full accent-violet-400"
            />
            <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
              <span>1</span><span>100</span><span>250</span><span>500</span>
            </div>
          </div>

          {/* Commission + Cashback */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Commission / lot ($)
              </label>
              <input
                type="number"
                min={0}
                step={0.5}
                value={commission}
                onChange={(e) => {
                  setCommission(Number(e.target.value));
                  setBrokerIdx(BROKERS.length - 1);
                }}
                className="w-full rounded-lg bg-white/5 px-3 py-2 text-sm text-white ring-1 ring-white/10 outline-none focus:ring-violet-300/40"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Cashback rate (%)
              </label>
              <input
                type="number"
                min={0}
                max={100}
                step={1}
                value={cashback}
                onChange={(e) => {
                  setCashback(Number(e.target.value));
                  setBrokerIdx(BROKERS.length - 1);
                }}
                className="w-full rounded-lg bg-white/5 px-3 py-2 text-sm text-white ring-1 ring-white/10 outline-none focus:ring-violet-300/40"
              />
            </div>
          </div>

          {/* Result */}
          <div className="rounded-2xl bg-gradient-to-br from-violet-500/15 to-violet-500/15 p-4 ring-1 ring-violet-300/30">
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-white/80">
              <Bot className="h-3 w-3 text-violet-200" /> Estimated cashback
            </div>
            <div className="mt-2 grid grid-cols-2 gap-3">
              <div>
                <div className="text-[10px] text-muted-foreground">Per month</div>
                <div className="text-2xl font-bold text-white">{fmt(monthly)}</div>
              </div>
              <div>
                <div className="text-[10px] text-muted-foreground">Per year</div>
                <div className="text-2xl font-bold text-emerald-300">{fmt(yearly)}</div>
              </div>
            </div>
            <div className="mt-3 flex items-start gap-1.5 text-[10px] text-muted-foreground">
              <Info className="mt-0.5 h-3 w-3 shrink-0" />
              <span>Estimate only. Actual rebates depend on broker, account type, and instruments traded.</span>
            </div>
          </div>

          {/* CTA */}
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={onClose}
              className="rounded-full bg-white/5 px-4 py-2 text-xs font-semibold text-white ring-1 ring-white/10 hover:bg-white/10"
            >
              Close
            </button>
            <a
              href="/signup"
              className="inline-flex items-center gap-1.5 rounded-full rb-gradient-primary px-4 py-2 text-xs font-semibold text-white shadow-[0_8px_24px_-8px_rgba(126,77,255,0.6)]"
            >
              <Wallet className="h-3 w-3" /> Start earning cashback
              <TrendingUp className="h-3 w-3" />
            </a>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
