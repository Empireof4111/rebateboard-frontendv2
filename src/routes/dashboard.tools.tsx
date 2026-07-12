import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Calculator, DollarSign, TrendingUp, ArrowLeftRight, Gift, Search,
  Star, History, Sparkles, X, Save, BookPlus, Share2, AlertTriangle,
} from "lucide-react";
import { PageHeader, Panel, Pill, StatCard } from "@/components/dashboard/Primitives";
import { useTrades } from "@/lib/trading-plan";
import { RebateCalculator } from "@/components/calculators/RebateCalculator";

export const Route = createFileRoute("/dashboard/tools")({
  head: () => ({
    meta: [
      { title: "Trading Tools — RebateBoard" },
      { name: "description", content: "Calculate, simulate, and optimize your trading decisions instantly." },
    ],
  }),
  component: ToolsPage,
});

type ToolKey = "fees" | "margin" | "profit" | "currency" | "rebate";

type ToolMeta = {
  key: ToolKey;
  title: string;
  description: string;
  icon: typeof Calculator;
  preview: string;
  accent: string;
};

const TOOLS: ToolMeta[] = [
  { key: "rebate",   title: "Rebate Calculator",   description: "Estimate how much cashback you earn per trade", icon: Gift,           preview: "Cashback estimate", accent: "from-fuchsia-500 to-violet-600" },
  { key: "fees",     title: "Fees Calculator",     description: "Calculate spread + commission cost",            icon: DollarSign,     preview: "Fee estimate",      accent: "from-violet-400 to-fuchsia-500" },
  { key: "margin",   title: "Margin Calculator",   description: "Required margin for any position",              icon: Calculator,     preview: "Margin estimate",   accent: "from-cyan-400 to-blue-600" },
  { key: "profit",   title: "Profit Calculator",   description: "Profit, loss, pips and RR ratio",               icon: TrendingUp,     preview: "PnL scenario",      accent: "from-emerald-400 to-teal-600" },
  { key: "currency", title: "Currency Converter",  description: "Convert across 20+ currencies",                 icon: ArrowLeftRight, preview: "Manual rate mode",   accent: "from-pink-400 to-rose-600" },
];

function ToolsPage() {
  const trades = useTrades();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<ToolKey | null>(null);
  const [favs, setFavs] = useState<ToolKey[]>(["rebate"]);
  const [history, setHistory] = useState<{ tool: ToolKey; value: string; ts: number }[]>([]);

  const filtered = useMemo(
    () => TOOLS.filter(t => (t.title + t.description).toLowerCase().includes(query.toLowerCase())),
    [query]
  );

  const toggleFav = (k: ToolKey) =>
    setFavs(f => (f.includes(k) ? f.filter(x => x !== k) : [...f, k]));

  const logResult = (tool: ToolKey, value: string) =>
    setHistory(h => [{ tool, value, ts: Date.now() }, ...h].slice(0, 8));

  const activeMeta = TOOLS.find(t => t.key === active);
  const journalGuidance = useMemo(() => {
    if (trades.length === 0) return null;
    const avgLot = trades.reduce((sum, trade) => sum + Number(trade.lot ?? 0), 0) / trades.length;
    const avgR = trades.reduce((sum, trade) => sum + Number(trade.rr ?? 0), 0) / trades.length;
    const mostTradedAsset = Object.entries(
      trades.reduce<Record<string, number>>((acc, trade) => {
        const key = trade.asset?.toUpperCase() || "UNKNOWN";
        acc[key] = (acc[key] ?? 0) + 1;
        return acc;
      }, {}),
    ).sort((a, b) => b[1] - a[1])[0]?.[0];
    return { avgLot, avgR, mostTradedAsset };
  }, [trades]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Trading Tools"
        subtitle="Calculate, simulate, and optimize your trading decisions instantly."
        actions={
          <div className="glass flex items-center gap-2 rounded-full px-3 py-1.5">
            <Search className="h-3.5 w-3.5 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search tools… (margin, rebate, profit)"
              className="w-56 bg-transparent text-xs text-white outline-none placeholder:text-muted-foreground"
            />
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Tools available" value={String(TOOLS.length)} hint="Live & connected" accent="primary" />
        <StatCard label="Saved calculations" value={String(history.length)} hint="This session" accent="success" />
        <StatCard label="Favorites" value={String(favs.length)} hint="Pinned tools" accent="warning" />
        <StatCard label="Journal context" value={trades.length ? `${trades.length} trades` : "No trades"} hint={trades.length ? "Based on journal" : "Manual mode"} accent="primary" />
      </div>

      {favs.length > 0 && (
        <Panel title="Quick access" action={<Pill tone="primary">Pinned</Pill>}>
          <div className="flex flex-wrap gap-2">
            {favs.map(k => {
              const t = TOOLS.find(x => x.key === k)!;
              const Icon = t.icon;
              return (
                <button
                  key={k}
                  onClick={() => setActive(k)}
                  className="glass-pill inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs text-white hover:bg-white/15"
                >
                  <Icon className="h-3.5 w-3.5 text-fuchsia-300" />
                  {t.title}
                </button>
              );
            })}
          </div>
        </Panel>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((t) => {
          const Icon = t.icon;
          const isFav = favs.includes(t.key);
          return (
            <div key={t.key} className="glass group relative overflow-hidden rounded-2xl p-5">
              <div className={`absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br ${t.accent} opacity-20 blur-2xl`} />
              <div className="flex items-start justify-between">
                <div className={`grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br ${t.accent} text-white shadow-lg`}>
                  <Icon className="h-5 w-5" />
                </div>
                <button
                  onClick={() => toggleFav(t.key)}
                  className={`rounded-full p-1.5 transition ${isFav ? "text-fuchsia-300" : "text-muted-foreground hover:text-white"}`}
                  aria-label="Pin tool"
                >
                  <Star className={`h-4 w-4 ${isFav ? "fill-current" : ""}`} />
                </button>
              </div>
              <h3 className="mt-3 text-sm font-semibold text-white">{t.title}</h3>
              <p className="mt-1 text-xs text-muted-foreground">{t.description}</p>
              <div className="mt-3 text-[11px] text-fuchsia-300">Mode · {t.preview}</div>
              <button
                onClick={() => setActive(t.key)}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-600 px-3 py-2 text-xs font-semibold text-white shadow-[0_0_20px_rgba(192,132,252,0.35)] transition hover:brightness-110"
              >
                Open Tool
              </button>
            </div>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel
          title="Recent calculations"
          action={<History className="h-4 w-4 text-muted-foreground" />}
        >
          {history.length === 0 ? (
            <p className="text-xs text-muted-foreground">No calculations yet. Open a tool to get started.</p>
          ) : (
            <ul className="space-y-2">
              {history.map((h, i) => (
                <li key={i} className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2 text-xs">
                  <span className="text-white">{TOOLS.find(t => t.key === h.tool)?.title}</span>
                  <span className="text-fuchsia-300 font-mono">{h.value}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Journal guidance" action={<Sparkles className="h-4 w-4 text-fuchsia-300" />}>
          {journalGuidance ? (
            <ul className="space-y-2 text-xs">
              <li className="rounded-xl bg-white/5 p-3 text-white/85">
                Average logged position size: <span className="text-fuchsia-300">{journalGuidance.avgLot.toFixed(2)} lots</span>. Use the rebate calculator to estimate cashback on similar trades.
              </li>
              <li className="rounded-xl bg-white/5 p-3 text-white/85">
                Average logged RR: <span className="font-semibold text-success">{journalGuidance.avgR.toFixed(2)}R</span>. Use the <button onClick={() => setActive("profit")} className="text-fuchsia-300 underline">Profit Calculator</button> to test alternate targets.
              </li>
              {journalGuidance.mostTradedAsset && (
                <li className="rounded-xl bg-white/5 p-3 text-white/85">
                  Most logged asset: <span className="text-fuchsia-300">{journalGuidance.mostTradedAsset}</span>. Keep calculator assumptions aligned with that market.
                </li>
              )}
            </ul>
          ) : (
            <p className="text-xs leading-relaxed text-muted-foreground">
              Journal-based guidance will appear after you log trades. Calculators are available now in manual estimate mode.
            </p>
          )}
        </Panel>
      </div>

      {active && activeMeta && (
        <ToolModal
          meta={activeMeta}
          onClose={() => setActive(null)}
          onSave={(value) => logResult(active, value)}
        />
      )}
    </div>
  );
}

function ToolModal({
  meta, onClose, onSave,
}: { meta: ToolMeta; onClose: () => void; onSave: (v: string) => void }) {
  const Icon = meta.icon;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-6">
      <div className="glass relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-t-3xl border border-white/10 sm:rounded-3xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-[#150829]/90 px-5 py-4 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className={`grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br ${meta.accent} text-white`}>
              <Icon className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">{meta.title}</h2>
              <p className="text-[11px] text-muted-foreground">{meta.description}</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-full p-2 text-muted-foreground hover:bg-white/10 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-5">
          {meta.key === "fees" && <FeesCalculator onResult={onSave} />}
          {meta.key === "margin" && <MarginCalculator onResult={onSave} />}
          {meta.key === "profit" && <ProfitCalculator onResult={onSave} />}
          {meta.key === "currency" && <CurrencyConverter onResult={onSave} />}
          {meta.key === "rebate" && <RebateCalculator onResult={onSave} />}
        </div>
      </div>
    </div>
  );
}

/* ==================== Reusable inputs ==================== */

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</span>
        {hint && <span className="text-[10px] text-muted-foreground/70">{hint}</span>}
      </div>
      {children}
    </label>
  );
}

function NumberInput({ value, onChange, step = 1, min }: { value: number; onChange: (v: number) => void; step?: number; min?: number }) {
  return (
    <input
      type="number"
      value={value}
      step={step}
      min={min}
      onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
      className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-accent/60"
    />
  );
}

function Select({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-accent/60"
    >
      {options.map(o => <option key={o} value={o} className="bg-[#150829]">{o}</option>)}
    </select>
  );
}

function PresetRow({ presets, onPick }: { presets: { label: string; value: number }[]; onPick: (v: number) => void }) {
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {presets.map(p => (
        <button
          key={p.label}
          onClick={() => onPick(p.value)}
          className="rounded-full bg-white/5 px-2 py-1 text-[10px] text-white/80 hover:bg-white/15"
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}

function ResultActions({ value, onSave }: { value: string; onSave: (v: string) => void }) {
  return (
    <div className="mt-4 flex flex-wrap gap-2">
      <button onClick={() => onSave(value)} className="glass-pill inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-white hover:bg-white/15">
        <Save className="h-3.5 w-3.5 text-fuchsia-300" /> Save result
      </button>
      <button className="glass-pill inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-white hover:bg-white/15">
        <BookPlus className="h-3.5 w-3.5 text-fuchsia-300" /> Use in trade
      </button>
      <button className="glass-pill inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-white hover:bg-white/15">
        <Share2 className="h-3.5 w-3.5 text-fuchsia-300" /> Share
      </button>
    </div>
  );
}

function TwoCol({ left, right }: { left: React.ReactNode; right: React.ReactNode }) {
  return (
    <div className="grid gap-5 md:grid-cols-2">
      <div className="space-y-3">{left}</div>
      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-5">{right}</div>
    </div>
  );
}

/* ==================== Calculators ==================== */

function FeesCalculator({ onResult }: { onResult: (v: string) => void }) {
  const [asset, setAsset] = useState("EUR/USD");
  const [lot, setLot] = useState(1);
  const [spread, setSpread] = useState(1.4);
  const [commission, setCommission] = useState(7);
  const [trades, setTrades] = useState(10);
  const [rebatePct, setRebatePct] = useState(50);

  const pipValue = 10; // simplified: $10/pip per standard lot
  const spreadCost = spread * pipValue * lot * trades;
  const commissionCost = commission * lot * trades;
  const total = spreadCost + commissionCost;
  const rebate = (commissionCost * rebatePct) / 100;
  const net = total - rebate;

  return (
    <TwoCol
      left={
        <>
          <Field label="Asset"><Select value={asset} onChange={setAsset} options={["EUR/USD","GBP/USD","XAU/USD","BTC/USD","US30","NAS100"]} /></Field>
          <Field label="Lot size">
            <NumberInput value={lot} onChange={setLot} step={0.1} min={0} />
            <PresetRow presets={[{label:"0.1 lot",value:0.1},{label:"1 lot",value:1},{label:"5 lots",value:5}]} onPick={setLot} />
          </Field>
          <Field label="Spread (pips)"><NumberInput value={spread} onChange={setSpread} step={0.1} min={0} /></Field>
          <Field label="Commission ($/lot)"><NumberInput value={commission} onChange={setCommission} step={0.5} min={0} /></Field>
          <Field label="Number of trades">
            <NumberInput value={trades} onChange={setTrades} step={1} min={0} />
            <PresetRow presets={[{label:"10",value:10},{label:"50",value:50},{label:"100",value:100}]} onPick={setTrades} />
          </Field>
          <Field label="Rebate %"><NumberInput value={rebatePct} onChange={setRebatePct} step={5} min={0} /></Field>
        </>
      }
      right={
        <>
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Total cost</div>
          <div className="mt-1 text-3xl font-bold text-destructive">${total.toFixed(2)}</div>
          <div className="mt-3 space-y-1 text-xs text-white/85">
            <div className="flex justify-between"><span>Spread cost</span><span className="font-mono">${spreadCost.toFixed(2)}</span></div>
            <div className="flex justify-between"><span>Commission</span><span className="font-mono">${commissionCost.toFixed(2)}</span></div>
          </div>

          <div className="my-4 h-px bg-white/10" />

          <div className="rounded-xl bg-gradient-to-br from-fuchsia-500/15 to-violet-600/10 p-3 ring-1 ring-fuchsia-400/20">
            <div className="text-[11px] uppercase tracking-wider text-fuchsia-300">With RebateBoard</div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-success">${net.toFixed(2)}</span>
              <span className="text-[11px] text-muted-foreground">net cost</span>
            </div>
            <div className="mt-1 text-[11px] text-success">Rebate earned: ${rebate.toFixed(2)}</div>
          </div>

          <ResultActions value={`Fees $${total.toFixed(2)} → net $${net.toFixed(2)}`} onSave={onResult} />
        </>
      }
    />
  );
}

function MarginCalculator({ onResult }: { onResult: (v: string) => void }) {
  const [asset, setAsset] = useState("EUR/USD");
  const [lot, setLot] = useState(1);
  const [leverage, setLeverage] = useState(100);
  const [ccy, setCcy] = useState("USD");

  const contractSize = 100000;
  const required = (contractSize * lot) / leverage;
  const risky = leverage >= 500;

  return (
    <TwoCol
      left={
        <>
          <Field label="Asset"><Select value={asset} onChange={setAsset} options={["EUR/USD","GBP/USD","USD/JPY","XAU/USD","BTC/USD"]} /></Field>
          <Field label="Lot size">
            <NumberInput value={lot} onChange={setLot} step={0.1} min={0} />
            <PresetRow presets={[{label:"0.1",value:0.1},{label:"1",value:1},{label:"10",value:10}]} onPick={setLot} />
          </Field>
          <Field label="Leverage" hint={`1:${leverage}`}>
            <input type="range" min={1} max={1000} value={leverage} onChange={(e) => setLeverage(parseInt(e.target.value))} className="w-full accent-fuchsia-500" />
            <PresetRow presets={[{label:"1:30",value:30},{label:"1:100",value:100},{label:"1:500",value:500}]} onPick={setLeverage} />
          </Field>
          <Field label="Account currency"><Select value={ccy} onChange={setCcy} options={["USD","EUR","GBP","NGN","JPY"]} /></Field>
        </>
      }
      right={
        <>
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Required margin</div>
          <div className="mt-1 text-3xl font-bold text-white">{ccy} {required.toFixed(2)}</div>
          <div className="mt-2 text-xs text-destructive">Free margin impact: -{ccy} {required.toFixed(2)}</div>
          {risky && (
            <div className="mt-4 flex items-start gap-2 rounded-xl bg-warning/10 p-3 text-[11px] text-fuchsia-300 ring-1 ring-warning/20">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5" />
              High leverage increases liquidation risk. Consider reducing position size.
            </div>
          )}
          <ResultActions value={`Margin ${ccy} ${required.toFixed(2)} @ 1:${leverage}`} onSave={onResult} />
        </>
      }
    />
  );
}

function ProfitCalculator({ onResult }: { onResult: (v: string) => void }) {
  const [asset, setAsset] = useState("EUR/USD");
  const [lot, setLot] = useState(1);
  const [entry, setEntry] = useState(1.085);
  const [exit, setExit] = useState(1.103);
  const [dir, setDir] = useState("Buy");

  const pipSize = 0.0001;
  const pips = ((dir === "Buy" ? exit - entry : entry - exit)) / pipSize;
  const profit = pips * 10 * lot;
  const rr = Math.abs(pips / 10);
  const isWin = profit >= 0;

  return (
    <TwoCol
      left={
        <>
          <Field label="Asset"><Select value={asset} onChange={setAsset} options={["EUR/USD","GBP/USD","XAU/USD","BTC/USD"]} /></Field>
          <Field label="Direction"><Select value={dir} onChange={setDir} options={["Buy","Sell"]} /></Field>
          <Field label="Lot size">
            <NumberInput value={lot} onChange={setLot} step={0.1} min={0} />
            <PresetRow presets={[{label:"0.1",value:0.1},{label:"1",value:1},{label:"5",value:5}]} onPick={setLot} />
          </Field>
          <Field label="Entry price"><NumberInput value={entry} onChange={setEntry} step={0.0001} /></Field>
          <Field label="Exit price (scenario)" hint="Drag slider">
            <NumberInput value={exit} onChange={setExit} step={0.0001} />
            <input type="range" min={entry - 0.05} max={entry + 0.05} step={0.0001} value={exit} onChange={(e) => setExit(parseFloat(e.target.value))} className="mt-2 w-full accent-fuchsia-500" />
          </Field>
        </>
      }
      right={
        <>
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{isWin ? "Profit" : "Loss"}</div>
          <div className={`mt-1 text-3xl font-bold ${isWin ? "text-success" : "text-destructive"}`}>
            {isWin ? "+" : ""}${profit.toFixed(2)}
          </div>
          <div className="mt-3 space-y-1 text-xs text-white/85">
            <div className="flex justify-between"><span>Pips</span><span className="font-mono">{pips.toFixed(1)}</span></div>
            <div className="flex justify-between"><span>RR ratio</span><span className="font-mono">{rr.toFixed(2)}</span></div>
            <div className="flex justify-between"><span>Direction</span><span>{dir}</span></div>
          </div>
          <ResultActions value={`${isWin ? "+" : ""}$${profit.toFixed(2)} (${pips.toFixed(1)} pips)`} onSave={onResult} />
        </>
      }
    />
  );
}

function CurrencyConverter({ onResult }: { onResult: (v: string) => void }) {
  const RATES: Record<string, number> = { USD: 1, EUR: 0.92, GBP: 0.79, NGN: 1500, JPY: 156, USDT: 1 };
  const [from, setFrom] = useState("USD");
  const [to, setTo] = useState("NGN");
  const [amount, setAmount] = useState(100);

  const result = (amount / RATES[from]) * RATES[to];
  const swap = () => { const f = from; setFrom(to); setTo(f); };

  return (
    <TwoCol
      left={
        <>
          <Field label="Amount"><NumberInput value={amount} onChange={setAmount} step={1} min={0} /></Field>
          <Field label="From"><Select value={from} onChange={setFrom} options={Object.keys(RATES)} /></Field>
          <button onClick={swap} className="glass-pill inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-white hover:bg-white/15">
            <ArrowLeftRight className="h-3.5 w-3.5 text-fuchsia-300" /> Swap
          </button>
          <Field label="To"><Select value={to} onChange={setTo} options={Object.keys(RATES)} /></Field>
          <div>
            <div className="mb-1 text-[11px] uppercase tracking-wider text-muted-foreground">Popular pairs</div>
            <PresetRow
              presets={[
                { label: "USD → NGN", value: 0 },
                { label: "USD → EUR", value: 1 },
                { label: "USDT → NGN", value: 2 },
              ]}
              onPick={(v) => {
                const map = [["USD","NGN"],["USD","EUR"],["USDT","NGN"]] as const;
                setFrom(map[v][0]); setTo(map[v][1]);
              }}
            />
          </div>
        </>
      }
      right={
        <>
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Converted</div>
          <div className="mt-1 text-3xl font-bold text-white">
            {result.toLocaleString(undefined, { maximumFractionDigits: 2 })} <span className="text-base text-fuchsia-300">{to}</span>
          </div>
          <div className="mt-2 text-xs text-muted-foreground">{amount} {from} ≈ {result.toLocaleString(undefined, { maximumFractionDigits: 2 })} {to}</div>
          <ResultActions value={`${amount} ${from} = ${result.toFixed(2)} ${to}`} onSave={onResult} />
        </>
      }
    />
  );
}
