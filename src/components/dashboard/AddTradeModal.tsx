import { useEffect, useMemo, useState } from "react";
import { X, ChevronLeft, ChevronRight, Camera, Check, AlertTriangle, Sparkles, ShieldCheck } from "lucide-react";
import {
  addTrade, calculateTradeMetrics, computeAdherence, detectSession, uid, useTradingPlan,
  type Emotion, type MarketType, type Session, type Trade,
} from "@/lib/trading-plan";
import { saveJournalTradeToBackend } from "@/lib/financial-intelligence-api";

type Mode = "quick" | "advanced";

const EMOTIONS: Emotion[] = ["calm", "confident", "neutral", "fomo", "fearful", "angry", "tilt"];
const MISTAKES = ["No SL", "Moved SL", "Overleverage", "Revenge trade", "Chased entry", "Closed early", "FOMO entry", "Ignored bias"];
const MARKET_CONFIG: Record<MarketType, { label: string; sizeLabel: string; assets: string[]; helper: string }> = {
  forex: { label: "Forex", sizeLabel: "Lot size", assets: ["EURUSD", "GBPUSD", "USDJPY", "XAUUSD", "AUDUSD"], helper: "Pairs, pips, sessions, lot size, and trade cost." },
  crypto: { label: "Crypto", sizeLabel: "Position size", assets: ["BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT"], helper: "Exchange, spot/futures mode, leverage, and fees." },
  futures: { label: "Futures", sizeLabel: "Contracts", assets: ["ES", "NQ", "YM", "GC", "CL"], helper: "Contracts, session, points, and rule adherence." },
  indices: { label: "Indices", sizeLabel: "Position size", assets: ["NAS100", "SPX500", "US30", "GER40", "UK100"], helper: "Index, session, points, and execution quality." },
  commodities: { label: "Commodities", sizeLabel: "Position size", assets: ["XAUUSD", "XAGUSD", "USOIL", "UKOIL", "NGAS"], helper: "Commodity movement, session context, and drawdown risk." },
  stocks: { label: "Stocks", sizeLabel: "Shares", assets: ["AAPL", "TSLA", "NVDA", "MSFT", "META"], helper: "Shares, entry/exit, fees, and percentage return." },
};
const MARKET_OPTIONS = Object.keys(MARKET_CONFIG) as MarketType[];

export function AddTradeModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const plan = useTradingPlan();
  const [mode, setMode] = useState<Mode>("quick");
  const [step, setStep] = useState(0);
  const [savedTrade, setSavedTrade] = useState<Trade | null>(null);
  const [form, setForm] = useState<Partial<Trade>>(() => ({
    asset: "EURUSD",
    market: "forex",
    direction: "long",
    entry: 0, exit: 0, lot: 1, stop: 0, target: 0, riskPct: 1,
    session: detectSession(),
    strategyId: plan.strategies[0]?.id ?? null,
    checklistChecked: [],
    mistakes: [],
    ruleFollowed: true,
    confidence: 7,
    satisfaction: 3,
    quality: "B",
  }));

  useEffect(() => {
    if (open) { setStep(0); setSavedTrade(null); }
  }, [open]);

  const set = <K extends keyof Trade>(k: K, v: Trade[K]) => setForm((f) => ({ ...f, [k]: v }));
  const setMarket = (market: MarketType) => {
    setForm((f) => ({
      ...f,
      market,
      asset: MARKET_CONFIG[market].assets[0],
      venue: market === "crypto" ? f.venue || "Binance" : f.venue,
      instrumentMode: market === "crypto" ? f.instrumentMode || "spot" : f.instrumentMode,
    }));
  };

  const calculation = useMemo(
    () => calculateTradeMetrics({
      market: (form.market as MarketType) ?? "forex",
      asset: form.asset,
      direction: (form.direction as "long" | "short") ?? "long",
      entry: form.entry ?? 0,
      exit: form.exit ?? 0,
      stop: form.stop,
      target: form.target,
      lot: form.lot ?? 0,
      commission: form.commission,
      fees: form.fees,
    }),
    [form.asset, form.commission, form.direction, form.entry, form.exit, form.fees, form.lot, form.market, form.stop, form.target],
  );
  const pnl = calculation.pnl;
  const rr = calculation.rewardRatio;

  const adherence = useMemo(
    () => computeAdherence({ ...form, rr, pnl }, plan),
    [form, rr, pnl, plan],
  );
  const validationNotes = useMemo(() => validateTrade(form), [form]);

  const steps = mode === "quick"
    ? ["Trade", "Result"]
    : ["Details", "Strategy & Context", "Execution & Psychology", "Result", "Screenshots"];

  if (!open) return null;

  if (savedTrade) {
    return (
      <div className="fixed inset-0 z-[100] grid place-items-center bg-black/70 p-3 backdrop-blur-sm">
        <div className="glass w-full max-w-md rounded-2xl p-6 text-center ring-1 ring-white/10">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-success/15 text-success ring-1 ring-success/25">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h2 className="mt-4 text-lg font-bold text-white">Trade Saved Successfully</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
            Rebeta will use this trade in your future performance analysis, journal summaries, and risk coaching.
          </p>
          <div className="mt-4 grid grid-cols-3 gap-2 rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-xs">
            <Metric label="PnL" value={`${savedTrade.pnl >= 0 ? "+" : "−"}$${Math.abs(savedTrade.pnl).toFixed(2)}`} tone={savedTrade.pnl >= 0 ? "success" : "destructive"} />
            <Metric label="R Multiple" value={`${(savedTrade.rMultiple ?? savedTrade.rr).toFixed(2)}R`} />
            <Metric label="Adherence" value={`${savedTrade.adherence}%`} tone={savedTrade.adherence >= 80 ? "success" : "default"} />
          </div>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <button onClick={() => { setSavedTrade(null); setStep(0); }} className="glass-pill rounded-full px-4 py-2 text-xs font-semibold text-white">
              Log another
            </button>
            <button onClick={onClose} className="rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-600 px-4 py-2 text-xs font-semibold text-white">
              View journal
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleSave = () => {
    const trade: Trade = {
      id: uid("t"),
      createdAt: new Date().toISOString(),
      asset: form.asset || "—",
      market: (form.market as MarketType) ?? "forex",
      direction: (form.direction as "long" | "short") ?? "long",
      entry: form.entry ?? 0,
      exit: form.exit ?? 0,
      lot: form.lot ?? 0,
      riskPct: form.riskPct ?? 0,
      stop: form.stop ?? 0,
      target: form.target ?? 0,
      session: (form.session as Session) ?? detectSession(),
      venue: form.venue,
      contract: form.contract,
      instrumentMode: form.instrumentMode,
      leverage: form.leverage,
      commission: form.commission,
      fees: form.fees,
      strategyId: form.strategyId ?? null,
      setupType: form.setupType,
      htfBias: form.htfBias,
      narrative: form.narrative,
      entryReason: form.entryReason,
      confirmation: form.confirmation,
      emotionBefore: form.emotionBefore,
      emotionAfter: form.emotionAfter,
      confidence: form.confidence,
      mistakes: form.mistakes ?? [],
      ruleFollowed: form.ruleFollowed,
      checklistChecked: form.checklistChecked ?? [],
      pnl,
      rr,
      quality: form.quality,
      satisfaction: form.satisfaction,
      beforeImg: form.beforeImg,
      afterImg: form.afterImg,
      pips: calculation.pips,
      points: calculation.points,
      percentageGain: calculation.percentageGain,
      rMultiple: calculation.rMultiple,
      rewardRatio: calculation.rewardRatio,
      winLossStatus: calculation.winLossStatus,
      adherence: adherence.score,
      violations: adherence.violations,
    };
    addTrade(trade);
    saveJournalTradeToBackend(trade).catch(() => {
      // Local journal remains the instant fallback; backend sync retries can be added later.
    });
    // Credit RR through the existing rewards rules.
    import("@/lib/rr-rewards").then(({ awardRr, tickStreak, getStreakConfig }) => {
      awardRr("trade_log", { premium: !!plan.premium });
      const cfg = getStreakConfig();
      if (cfg.qualifier === "trade_log" || cfg.qualifier === "any_activity") tickStreak();
    });
    setSavedTrade(trade);
  };

  const next = () => setStep((s) => Math.min(s + 1, steps.length - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-black/70 p-3 backdrop-blur-sm">
      <div className="glass relative w-full max-w-2xl overflow-hidden rounded-2xl ring-1 ring-white/10">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/5 px-5 py-3">
          <div>
            <h2 className="text-base font-bold text-white">Log Trade</h2>
            <p className="text-[11px] text-muted-foreground">Step {step + 1} of {steps.length} — {steps[step]}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex rounded-full bg-white/5 p-1 text-[10px]">
              <button onClick={() => { setMode("quick"); setStep(0); }} className={`rounded-full px-2 py-1 ${mode === "quick" ? "bg-white/15 text-white" : "text-muted-foreground"}`}>Quick</button>
              <button onClick={() => { setMode("advanced"); setStep(0); }} className={`rounded-full px-2 py-1 ${mode === "advanced" ? "bg-white/15 text-white" : "text-muted-foreground"}`}>Advanced</button>
            </div>
            <button onClick={onClose} className="text-muted-foreground hover:text-white"><X className="h-4 w-4" /></button>
          </div>
        </div>

        {/* Adherence bar */}
        <div className="border-b border-white/5 bg-white/[0.02] px-5 py-2">
          <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-muted-foreground">
            <span>Plan Adherence</span>
            <span className={adherence.score >= 80 ? "text-success" : adherence.score >= 50 ? "text-fuchsia-300" : "text-destructive"}>{adherence.score}%</span>
          </div>
          <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-white/10">
            <div className={`h-full transition-all ${adherence.score >= 80 ? "bg-success" : adherence.score >= 50 ? "bg-accent" : "bg-destructive"}`} style={{ width: `${adherence.score}%` }} />
          </div>
          {adherence.violations.length > 0 && (
            <div className="mt-1.5 flex items-start gap-1 text-[10px] text-destructive">
              <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
              <span>{adherence.violations[0]}{adherence.violations.length > 1 ? ` · +${adherence.violations.length - 1} more` : ""}</span>
            </div>
          )}
          {validationNotes.length > 0 && (
            <div className="mt-1.5 space-y-1">
              {validationNotes.slice(0, 2).map((note) => (
                <div key={note} className="flex items-start gap-1 text-[10px] text-orange-100">
                  <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0 text-orange-200" />
                  <span>{note}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Body */}
        <div className="max-h-[55vh] overflow-y-auto px-5 py-4">
          {/* Quick Mode */}
          {mode === "quick" && step === 0 && (
            <div className="grid grid-cols-2 gap-3">
              <Field label="Market"><Select value={form.market} onChange={(v) => setMarket(v as MarketType)} options={MARKET_OPTIONS} labels={MARKET_OPTIONS.map((m) => MARKET_CONFIG[m].label)} /></Field>
              <Field label="Asset"><Select value={form.asset} onChange={(v) => set("asset", v)} options={MARKET_CONFIG[(form.market as MarketType) ?? "forex"].assets} /></Field>
              <Field label="Direction">
                <Toggle a="long" b="short" value={form.direction as string} onChange={(v) => set("direction", v as "long" | "short")} />
              </Field>
              <Field label="Entry"><Num value={form.entry} onChange={(v) => set("entry", v)} /></Field>
              <Field label="Stop"><Num value={form.stop} onChange={(v) => set("stop", v)} /></Field>
              <Field label="Target"><Num value={form.target} onChange={(v) => set("target", v)} /></Field>
              <Field label={MARKET_CONFIG[(form.market as MarketType) ?? "forex"].sizeLabel}><Num value={form.lot} onChange={(v) => set("lot", v)} /></Field>
              <Field label="Risk %"><Num value={form.riskPct} onChange={(v) => set("riskPct", v)} step={0.1} /></Field>
              <Field label="Session"><Select value={form.session} onChange={(v) => set("session", v as Session)} options={["asia", "london", "ny", "sydney"]} /></Field>
              <div className="col-span-2 rounded-xl border border-violet-300/15 bg-violet-300/10 p-3 text-xs text-violet-50">
                {MARKET_CONFIG[(form.market as MarketType) ?? "forex"].helper}
              </div>
            </div>
          )}
          {mode === "quick" && step === 1 && (
            <QuickResult form={form} set={set} pnl={pnl} rr={rr} plan={plan} />
          )}

          {/* Advanced */}
          {mode === "advanced" && step === 0 && (
            <div className="grid grid-cols-2 gap-3">
              <Field label="Market">
                <Select value={form.market} onChange={(v) => setMarket(v as MarketType)} options={MARKET_OPTIONS} labels={MARKET_OPTIONS.map((m) => MARKET_CONFIG[m].label)} />
              </Field>
              <Field label="Asset"><Select value={form.asset} onChange={(v) => set("asset", v)} options={MARKET_CONFIG[(form.market as MarketType) ?? "forex"].assets} /></Field>
              {form.market === "crypto" && (
                <>
                  <Field label="Exchange"><Text value={form.venue ?? ""} onChange={(v) => set("venue", v)} placeholder="Binance, Bybit..." /></Field>
                  <Field label="Mode"><Select value={form.instrumentMode ?? "spot"} onChange={(v) => set("instrumentMode", v)} options={["spot", "futures"]} /></Field>
                  <Field label="Leverage"><Num value={form.leverage} onChange={(v) => set("leverage", v)} /></Field>
                  <Field label="Fees"><Num value={form.fees} onChange={(v) => set("fees", v)} step={0.01} /></Field>
                </>
              )}
              {(form.market === "futures" || form.market === "indices") && (
                <Field label="Contract"><Text value={form.contract ?? ""} onChange={(v) => set("contract", v)} placeholder="e.g. NQ mini, CFD" /></Field>
              )}
              <Field label="Direction"><Toggle a="long" b="short" value={form.direction as string} onChange={(v) => set("direction", v as "long" | "short")} /></Field>
              <Field label="Session"><Select value={form.session} onChange={(v) => set("session", v as Session)} options={["asia", "london", "ny", "sydney"]} /></Field>
              <Field label="Entry"><Num value={form.entry} onChange={(v) => set("entry", v)} /></Field>
              <Field label="Stop"><Num value={form.stop} onChange={(v) => set("stop", v)} /></Field>
              <Field label="Target"><Num value={form.target} onChange={(v) => set("target", v)} /></Field>
              <Field label={MARKET_CONFIG[(form.market as MarketType) ?? "forex"].sizeLabel}><Num value={form.lot} onChange={(v) => set("lot", v)} /></Field>
              <Field label="Risk %"><Num value={form.riskPct} onChange={(v) => set("riskPct", v)} step={0.1} /></Field>
              <Field label="Commission"><Num value={form.commission} onChange={(v) => set("commission", v)} step={0.01} /></Field>
              <div className="col-span-2 rounded-lg bg-white/[0.04] p-3 text-xs">
                <span className="text-muted-foreground">Planned reward profile: </span><b className="text-white">{rr.toFixed(2)}R</b>
                <span className="ml-2 text-muted-foreground">{MARKET_CONFIG[(form.market as MarketType) ?? "forex"].helper}</span>
              </div>
            </div>
          )}

          {mode === "advanced" && step === 1 && (
            <div className="space-y-3">
              <Field label="Strategy">
                {plan.strategies.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-white/10 p-3 text-xs text-muted-foreground">
                    No strategies defined. <a href="/dashboard/trading-plan" className="text-fuchsia-300 underline">Create one →</a>
                  </div>
                ) : (
                  <Select value={form.strategyId ?? ""} onChange={(v) => set("strategyId", v)} options={plan.strategies.map((s) => s.id)} labels={plan.strategies.map((s) => s.name)} />
                )}
              </Field>
              <Field label="Setup type"><Text value={form.setupType ?? ""} onChange={(v) => set("setupType", v)} placeholder="e.g. Liquidity sweep + FVG" /></Field>
              <Field label="Higher timeframe bias"><Text value={form.htfBias ?? ""} onChange={(v) => set("htfBias", v)} placeholder="e.g. Bullish 4H" /></Field>
              <Field label="Entry reason"><Area value={form.entryReason ?? ""} onChange={(v) => set("entryReason", v)} /></Field>
              <Field label="Confirmation used"><Text value={form.confirmation ?? ""} onChange={(v) => set("confirmation", v)} /></Field>
              <Field label="Narrative"><Area value={form.narrative ?? ""} onChange={(v) => set("narrative", v)} /></Field>
            </div>
          )}

          {mode === "advanced" && step === 2 && (
            <div className="space-y-3">
              <Field label="Emotion before"><Chips options={EMOTIONS} value={form.emotionBefore ?? ""} onChange={(v) => set("emotionBefore", v as Emotion)} /></Field>
              <Field label="Confidence (1-10)">
                <input type="range" min={1} max={10} value={form.confidence ?? 7} onChange={(e) => set("confidence", Number(e.target.value))} className="w-full" />
                <div className="text-right text-xs text-muted-foreground">{form.confidence}/10</div>
              </Field>
              <Field label="Pre-trade checklist">
                <div className="grid grid-cols-1 gap-1.5">
                  {plan.checklist.map((c) => {
                    const checked = (form.checklistChecked ?? []).includes(c.id);
                    return (
                      <label key={c.id} className={`flex cursor-pointer items-center gap-2 rounded-lg border p-2 text-xs ${checked ? "border-success/40 bg-success/10" : "border-white/10 bg-white/[0.03]"}`}>
                        <input type="checkbox" checked={checked} onChange={(e) => {
                          const list = new Set(form.checklistChecked ?? []);
                          if (e.target.checked) list.add(c.id); else list.delete(c.id);
                          set("checklistChecked", Array.from(list));
                        }} />
                        <span className="text-white">{c.label}</span>
                        {c.required && <span className="ml-auto text-[9px] text-fuchsia-300">required</span>}
                      </label>
                    );
                  })}
                </div>
              </Field>
              <Field label="Rule followed?">
                <Toggle a="yes" b="no" value={form.ruleFollowed ? "yes" : "no"} onChange={(v) => set("ruleFollowed", v === "yes")} />
              </Field>
              {form.ruleFollowed === false && (
                <Field label="Mistake tags"><Chips multi options={MISTAKES} value={form.mistakes ?? []} onChange={(v) => set("mistakes", v as string[])} /></Field>
              )}
            </div>
          )}

          {mode === "advanced" && step === 3 && (
            <QuickResult form={form} set={set} pnl={pnl} rr={rr} plan={plan} advanced />
          )}

          {mode === "advanced" && step === 4 && (
            <ScreenshotStep form={form} set={set} />
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-2 border-t border-white/5 bg-white/[0.02] px-5 py-3">
          <button onClick={back} disabled={step === 0} className="glass-pill inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs text-white disabled:opacity-40">
            <ChevronLeft className="h-3.5 w-3.5" /> Back
          </button>
          {step < steps.length - 1 ? (
            <button onClick={next} className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-600 px-4 py-1.5 text-xs font-semibold text-white">
              Next <ChevronRight className="h-3.5 w-3.5" />
            </button>
          ) : (
            <button onClick={handleSave} className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-1.5 text-xs font-semibold text-white">
              <Check className="h-3.5 w-3.5" /> Save Trade
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function QuickResult({ form, set, pnl, rr, plan, advanced }: { form: Partial<Trade>; set: <K extends keyof Trade>(k: K, v: Trade[K]) => void; pnl: number; rr: number; plan: ReturnType<typeof useTradingPlan>; advanced?: boolean }) {
  return (
    <div className="space-y-3">
      <Field label="Exit price"><Num value={form.exit} onChange={(v) => set("exit", v)} /></Field>
      <div className="grid grid-cols-2 gap-2 rounded-xl bg-white/[0.04] p-3 text-xs">
        <div><span className="text-muted-foreground">PnL</span><div className={`text-base font-bold ${pnl >= 0 ? "text-success" : "text-destructive"}`}>{pnl >= 0 ? "+" : ""}{pnl.toFixed(2)}</div></div>
        <div><span className="text-muted-foreground">RR achieved</span><div className="text-base font-bold text-white">{rr.toFixed(2)}</div></div>
      </div>
      {advanced && (
        <>
          <Field label="Trade quality"><Toggle3 options={["A", "B", "C"]} value={form.quality as string} onChange={(v) => set("quality", v as "A" | "B" | "C")} /></Field>
          <Field label="Outcome satisfaction (1-5)">
            <input type="range" min={1} max={5} value={form.satisfaction ?? 3} onChange={(e) => set("satisfaction", Number(e.target.value))} className="w-full" />
          </Field>
          <Field label="Emotion after"><Chips options={EMOTIONS} value={form.emotionAfter ?? ""} onChange={(v) => set("emotionAfter", v as Emotion)} /></Field>
        </>
      )}
      <div className="rounded-xl border border-primary/30 bg-primary/10 p-3 text-xs text-white">
        <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-fuchsia-300"><Sparkles className="h-3 w-3" /> Rebeta Preview</div>
        <p className="mt-1">{plan.strategies.length === 0 ? "Set up a strategy in Trading Plan to unlock deeper insights." : `Adherence will roll into your Trader Score. ${rr < 1.5 ? "Watch low-RR setups." : "Solid RR profile."}`}</p>
      </div>
    </div>
  );
}

function ScreenshotStep({ form, set }: { form: Partial<Trade>; set: <K extends keyof Trade>(k: K, v: Trade[K]) => void }) {
  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-violet-300/15 bg-violet-300/10 p-3 text-xs leading-relaxed text-violet-50">
        Upload before and after chart screenshots for richer Rebeta review. Screenshots are available to every trader during launch.
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {(["before", "after"] as const).map((k) => {
          const key = k === "before" ? "beforeImg" : "afterImg";
          const val = form[key];
          return (
            <label key={k} className="group relative grid h-36 cursor-pointer place-items-center overflow-hidden rounded-xl border border-dashed border-white/15 bg-white/[0.03] text-xs text-muted-foreground transition hover:border-violet-300/35 hover:bg-white/[0.06]">
              {val ? (
                <>
                  <img src={val} alt={`${k} trade screenshot`} className="h-full w-full rounded-xl object-cover" />
                  <span className="absolute bottom-2 left-2 rounded-full bg-black/55 px-2 py-1 text-[10px] font-semibold text-white backdrop-blur">Replace {k}</span>
                </>
              ) : (
                <div className="flex flex-col items-center gap-1"><Camera className="h-5 w-5" /><span className="capitalize">{k} trade</span></div>
              )}
              <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => {
                const f = e.target.files?.[0]; if (!f) return;
                const r = new FileReader(); r.onload = () => set(key as keyof Trade, r.result as string); r.readAsDataURL(f);
              }} />
            </label>
          );
        })}
      </div>
    </div>
  );
}

function validateTrade(form: Partial<Trade>) {
  const notes: string[] = [];
  const direction = (form.direction as "long" | "short") ?? "long";
  const entry = Number(form.entry) || 0;
  const stop = Number(form.stop) || 0;
  const target = Number(form.target) || 0;
  const riskPct = Number(form.riskPct) || 0;
  if (entry > 0 && stop > 0) {
    if (direction === "long" && stop >= entry) notes.push("For a long trade, stop loss should usually sit below entry.");
    if (direction === "short" && stop <= entry) notes.push("For a short trade, stop loss should usually sit above entry.");
  }
  if (entry > 0 && target > 0) {
    if (direction === "long" && target <= entry) notes.push("For a long trade, take profit should usually sit above entry.");
    if (direction === "short" && target >= entry) notes.push("For a short trade, take profit should usually sit below entry.");
  }
  if (riskPct > 3) notes.push("Risk is above 3%. Confirm this fits your plan before saving.");
  if ((form.market === "crypto" || form.market === "futures") && Number(form.leverage) > 20) notes.push("High leverage can distort risk. Double-check position size and stop distance.");
  return notes;
}

function Metric({ label, value, tone = "default" }: { label: string; value: string; tone?: "default" | "success" | "destructive" }) {
  const toneClass = tone === "success" ? "text-success" : tone === "destructive" ? "text-destructive" : "text-white";
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">{label}</div>
      <div className={`mt-1 font-bold tabular-nums ${toneClass}`}>{value}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-[10px] uppercase tracking-wider text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}
function Text({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white outline-none focus:border-primary/60" />;
}
function Area({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={3} className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white outline-none focus:border-primary/60" />;
}
function Num({ value, onChange, step }: { value: number | undefined; onChange: (v: number) => void; step?: number }) {
  return <input type="number" step={step ?? "any"} value={value ?? 0} onChange={(e) => onChange(Number(e.target.value))} className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white outline-none focus:border-primary/60" />;
}
function Select({ value, onChange, options, labels }: { value: string | undefined; onChange: (v: string) => void; options: string[]; labels?: string[] }) {
  return (
    <select value={value ?? ""} onChange={(e) => onChange(e.target.value)} className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white outline-none">
      {options.map((o, i) => <option key={o} value={o} className="bg-[#150829]">{labels?.[i] ?? o}</option>)}
    </select>
  );
}
function Toggle({ a, b, value, onChange }: { a: string; b: string; value: string | undefined; onChange: (v: string) => void }) {
  return (
    <div className="flex rounded-lg bg-white/5 p-1 text-xs">
      {[a, b].map((opt) => (
        <button key={opt} type="button" onClick={() => onChange(opt)} className={`flex-1 rounded-md px-2 py-1.5 capitalize ${value === opt ? "bg-white/15 text-white" : "text-muted-foreground"}`}>{opt}</button>
      ))}
    </div>
  );
}
function Toggle3({ options, value, onChange }: { options: string[]; value: string | undefined; onChange: (v: string) => void }) {
  return (
    <div className="flex rounded-lg bg-white/5 p-1 text-xs">
      {options.map((opt) => (
        <button key={opt} type="button" onClick={() => onChange(opt)} className={`flex-1 rounded-md px-2 py-1.5 ${value === opt ? "bg-white/15 text-white" : "text-muted-foreground"}`}>{opt}</button>
      ))}
    </div>
  );
}
function Chips({ options, value, onChange, multi }: { options: string[]; value: string | string[]; onChange: (v: string | string[]) => void; multi?: boolean }) {
  const arr = Array.isArray(value) ? value : value ? [value] : [];
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => {
        const active = arr.includes(o);
        return (
          <button key={o} type="button" onClick={() => {
            if (multi) {
              const set = new Set(arr); active ? set.delete(o) : set.add(o);
              onChange(Array.from(set));
            } else onChange(active ? "" : o);
          }} className={`rounded-full px-2.5 py-1 text-[11px] capitalize ${active ? "bg-primary/30 text-white ring-1 ring-primary/40" : "bg-white/5 text-muted-foreground"}`}>{o}</button>
        );
      })}
    </div>
  );
}
