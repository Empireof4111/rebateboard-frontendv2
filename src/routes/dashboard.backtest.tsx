import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  FlaskConical, Upload, Calendar, FileText,
  BookOpen, Zap, GitCompare, Wallet, AlertTriangle,
  CheckCircle2, Info, Plus, Play, Save, Pencil, Brain, ShieldAlert,
  FileUp, X,
} from "lucide-react";
import { EmptyState, PageHeader, StatCard, Panel, Pill } from "@/components/dashboard/Primitives";
import { importSources, type BacktestReport, type BacktestTrade } from "@/lib/backtest-data";
import {
  useReports, useTemplates, useImports,
  deleteReport, getReportTrades,
  setImports, setReportTrades, setReports, setTemplates,
  setPreset, consumePreset,
  upsertImport, upsertReport, upsertTemplate,
} from "@/lib/backtest-store";
import {
  parseCsv, autoMap, aggregate, TRADE_FIELDS,
  type ParsedCsv, type TradeField,
} from "@/lib/csv-parser";
import { buildEquityCurve, pathFromCurve, buildCalendar } from "@/lib/chart-utils";
import {
  deleteBacktestReport,
  fetchBacktestBoard,
  fetchBacktestReportTrades,
  generateBacktestInsights,
  importBacktestTrades,
  interpretBacktestStrategy,
  runBacktestStrategy,
  saveBacktestTemplate,
} from "@/lib/backtest-api";
import { formatUploadLimit, validateFileSize } from "@/lib/upload-limits";

export const Route = createFileRoute("/dashboard/backtest")({
  head: () => ({
    meta: [
      { title: "AI Backtest Lab — RebateBoard" },
      { name: "description", content: "Backtest strategies and analyze real trades with AI-powered insights." },
    ],
  }),
  component: BacktestLab,
});

type Tab =
  | "overview" | "new" | "real" | "reports" | "calendar"
  | "templates" | "insights" | "compare" | "saved";

const tabs: { id: Tab; label: string; icon: typeof FlaskConical }[] = [
  { id: "overview", label: "Overview", icon: FlaskConical },
  { id: "new", label: "New Strategy", icon: Plus },
  { id: "real", label: "Real Trades", icon: Upload },
  { id: "reports", label: "Reports", icon: FileText },
  { id: "calendar", label: "Calendar", icon: Calendar },
  { id: "templates", label: "Templates", icon: BookOpen },
  { id: "insights", label: "AI Insights", icon: Brain },
  { id: "compare", label: "Compare", icon: GitCompare },
  { id: "saved", label: "Saved", icon: Save },
];

function BacktestLab() {
  const [tab, setTab] = useState<Tab>("overview");
  const [syncState, setSyncState] = useState<"loading" | "ready" | "offline">("loading");
  const [syncMessage, setSyncMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    fetchBacktestBoard()
      .then((board) => {
        if (cancelled) return;
        setReports(board.reports);
        setTemplates(board.templates);
        setImports(board.imports);
        setSyncState("ready");
        setSyncMessage("");
      })
      .catch((error) => {
        if (cancelled) return;
        setSyncState("offline");
        setSyncMessage(error?.message ?? "Backtest sync is temporarily unavailable. Your saved local lab data is still available.");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Backtest Lab"
        subtitle="Trade Intelligence • Stop guessing. Backtest your strategy and your real trades in minutes."
       actions={
          <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-violet-500/20 to-violet-600/20 px-3 py-1.5 text-[11px] font-semibold text-violet-300 ring-1 ring-violet-400/30">
            <FlaskConical className="h-3.5 w-3.5" /> NEW
          </span>
        }
      />

      {syncState !== "ready" && (
        <div
          className={`rounded-xl border px-3 py-2 text-xs ${
            syncState === "loading"
              ? "border-cyan-400/20 bg-cyan-500/10 text-cyan-200"
              : "border-violet-400/20 bg-violet-500/10 text-violet-100"
          }`}
        >
          {syncState === "loading" ? "Syncing Backtest Lab with your dashboard data..." : syncMessage}
        </div>
      )}

      <div className="glass flex flex-wrap gap-1 rounded-2xl p-1.5">
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition ${
                active
                  ? "rb-gradient-primary text-white shadow-[0_0_20px_rgba(192,132,252,0.4)]"
                  : "text-muted-foreground hover:bg-white/5 hover:text-white"
              }`}
            >
              <Icon className="h-3.5 w-3.5" /> {t.label}
            </button>
          );
        })}
      </div>

      {tab === "overview" && <Overview onNav={setTab} />}
      {tab === "new" && <NewStrategy onRun={() => setTab("reports")} onSavedTemplate={() => setTab("templates")} />}
      {tab === "real" && <RealTrades onAnalyze={() => setTab("reports")} />}
      {tab === "reports" && <Reports />}
      {tab === "calendar" && <CalendarView />}
      {tab === "templates" && <Templates onUse={() => setTab("new")} />}
      {tab === "insights" && <Insights />}
      {tab === "compare" && <Compare />}
      {tab === "saved" && <Saved />}

      <Disclaimer />
    </div>
  );
}

function Overview({ onNav }: { onNav: (t: Tab) => void }) {
  const reports = useReports();
  const templates = useTemplates();
  const imports = useImports();
  const best = reports.reduce((b, r) => (r.profitFactor > (b?.profitFactor ?? 0) ? r : b), reports[0]);
  const savedTrades = reports.flatMap((report) => getReportTrades(report.id));
  const feesLogged = savedTrades.reduce((sum, trade) => sum + Number(trade.fees ?? 0), 0);
  const cashbackLogged = savedTrades.reduce((sum, trade) => sum + Number(trade.cashback ?? 0), 0);
  const importedTrades = imports.reduce((sum, item) => sum + Number(item.trades ?? 0), 0);
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <StatCard label="Total Backtests" value={String(reports.length)} hint="Saved reports" accent="primary" />
        <StatCard label="Saved Strategies" value={String(templates.length)} hint={`${templates.length} templates`} accent="primary" />
        <StatCard label="Best Strategy" value={best?.name.slice(0, 16) ?? "—"} hint={`PF ${best?.profitFactor.toFixed(2) ?? "—"}`} trend="up" accent="success" />
        <StatCard label="Real Trade Reports" value={String(reports.filter((report) => report.source === "real-trades").length)} hint="Imported histories" accent="warning" />
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Imported Batches" value={String(imports.length)} accent="primary" />
        <StatCard label="Imported Trades" value={String(importedTrades)} accent="primary" />
        <StatCard label="Fees Logged" value={`$${feesLogged.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} accent="primary" />
        <StatCard label="Cashback Logged" value={`$${cashbackLogged.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} accent="success" />
        <StatCard label="Last Report" value={reports[0]?.createdAt ?? "—"} accent="primary" />
      </div>

      <Panel title="Quick actions">
        <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-5">
          {[
            { label: "Run New Backtest", icon: Play, t: "new" as Tab, color: "from-emerald-500 to-teal-600" },
            { label: "Upload Trade History", icon: Upload, t: "real" as Tab, color: "from-violet-500 to-violet-600" },
            { label: "Connect Wallet", icon: Wallet, t: "real" as Tab, color: "from-violet-500 to-violet-600" },
            { label: "Compare Strategy vs Real", icon: GitCompare, t: "compare" as Tab, color: "from-cyan-500 to-blue-600" },
            { label: "View AI Insights", icon: Brain, t: "insights" as Tab, color: "from-violet-500 to-rose-600" },
          ].map((a) => {
            const Icon = a.icon;
            return (
              <button
                key={a.label}
                onClick={() => onNav(a.t)}
                className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${a.color} p-4 text-left text-white transition hover:scale-[1.02]`}
              >
                <Icon className="mb-2 h-5 w-5" />
                <div className="text-sm font-semibold">{a.label}</div>
              </button>
            );
          })}
        </div>
      </Panel>

      <Panel title="Recent reports">
        <ReportsTable rows={reports} compact />
      </Panel>
    </div>
  );
}

function NewStrategy({ onRun, onSavedTemplate }: { onRun: () => void; onSavedTemplate: () => void }) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [form, setForm] = useState({
    name: "", market: "Forex", symbol: "EURUSD", timeframe: "15m",
    session: "London", range: "", startBalance: "", riskPerTrade: "1", maxTrades: "3",
    description: "",
  });
  const [interpretation, setInterpretation] = useState<{ entry: string; exit: string; risk: string; filters: string; invalidation: string; fees: string } | null>(null);
  const [interpretLoading, setInterpretLoading] = useState(false);
  const [interpretErr, setInterpretErr] = useState<string>("");
  const [runLoading, setRunLoading] = useState(false);
  const [templateLoading, setTemplateLoading] = useState(false);

  // Consume preset from Templates tab once on mount.
  useEffect(() => {
    const p = consumePreset();
    if (p) {
      setForm((s) => ({
        ...s,
        name: p.name, market: p.market, symbol: p.symbol, timeframe: p.timeframe,
        session: p.session, range: p.range,
        startBalance: String(p.startBalance), riskPerTrade: String(p.riskPerTrade),
        description: p.description || "",
      }));
      setInterpretation({
        entry: p.rules.entry, exit: p.rules.exit, risk: p.rules.risk,
        filters: p.rules.filters, invalidation: p.rules.invalidation, fees: p.rules.fees,
      });
      setStep(2);
    }
  }, []);

  const upd = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((s) => ({ ...s, [k]: e.target.value }));

  const fields: { l: string; k: keyof typeof form }[] = [
    { l: "Strategy name", k: "name" },
    { l: "Market", k: "market" },
    { l: "Symbol", k: "symbol" },
    { l: "Timeframe", k: "timeframe" },
    { l: "Session", k: "session" },
    { l: "Date range", k: "range" },
    { l: "Starting balance", k: "startBalance" },
    { l: "Risk per trade %", k: "riskPerTrade" },
    { l: "Max trades / day", k: "maxTrades" },
  ];

  const interpret = async () => {
    setInterpretErr(""); setInterpretLoading(true);
    try {
      const res = await interpretBacktestStrategy({
        description: form.description,
        symbol: form.symbol,
        timeframe: form.timeframe,
        session: form.session,
        riskPerTrade: form.riskPerTrade,
        maxTrades: form.maxTrades,
      });
      setInterpretation(res.interpretation);
      setStep(2);
    } catch (e: any) {
      setInterpretErr(e?.message ?? "Interpretation failed");
    } finally { setInterpretLoading(false); }
  };

  const rules = interpretation ?? {
    entry: `Break of ${form.session} session range, retest of structure.`,
    exit: "TP at 2R, SL below/above range. Trailing after 1R.",
    risk: `${form.riskPerTrade}% per trade, max ${form.maxTrades}/day, daily loss cap 3%.`,
    filters: `${form.session} session on ${form.symbol} (${form.timeframe}). No news within 30min.`,
    invalidation: "Skip if range > 60 pips or volatility ATR < 12.",
    fees: "Spread 0.8 pip, commission $7/lot. Cashback +$2.3/lot.",
  };

  const saveTemplate = async () => {
    setTemplateLoading(true);
    setInterpretErr("");
    try {
      const template = await saveBacktestTemplate({
        name: form.name,
        market: form.market,
        symbol: form.symbol,
        timeframe: form.timeframe,
        session: form.session,
        range: form.range,
        startBalance: form.startBalance,
        riskPerTrade: form.riskPerTrade,
        maxTrades: form.maxTrades,
        description: form.description || rules.entry,
        rules,
      });
      upsertTemplate(template);
      onSavedTemplate();
    } catch (error: any) {
      setInterpretErr(error?.message ?? "Template save failed");
    } finally {
      setTemplateLoading(false);
    }
  };

  const runBacktest = async () => {
    setStep(3);
    setRunLoading(true);
    setInterpretErr("");
    try {
      const result = await runBacktestStrategy({
        name: form.name,
        market: form.market,
        symbol: form.symbol,
        timeframe: form.timeframe,
        session: form.session,
        range: form.range,
        startBalance: form.startBalance,
        riskPerTrade: form.riskPerTrade,
        maxTrades: form.maxTrades,
        description: form.description || rules.entry,
        rules,
      });
      upsertReport(result.report);
      setReportTrades(result.report.id, result.trades);
      onRun();
    } catch (error: any) {
      setInterpretErr(error?.message ?? "Backtest run failed");
      setStep(2);
    } finally {
      setRunLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {[1, 2, 3].map((s) => (
          <span
            key={s}
            className={`flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold ${
              step >= s ? "rb-gradient-primary text-white" : "bg-white/10 text-muted-foreground"
            }`}
          >
            {s}
          </span>
        ))}
        <span>Step {step} of 3 — {step === 1 ? "Describe Strategy" : step === 2 ? "AI Interpretation" : "Run Backtest"}</span>
      </div>

      {step === 1 && (
        <Panel title="Describe your strategy in natural language">
          <textarea
            value={form.description}
            onChange={upd("description")}
            placeholder="I trade EURUSD during London on the 15m timeframe. I enter on Asian range break, SL below range, TP at 2R, risk 1% per trade, avoid news, only Tue–Thu…"
            className="min-h-[120px] w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white outline-none placeholder:text-muted-foreground focus:border-violet-400/40"
          />
          <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {fields.map((f) => (
              <div key={f.k}>
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground">{f.l}</label>
                <input
                  value={form[f.k]}
                  onChange={upd(f.k)}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none"
                />
              </div>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            {["News filter", "Cashback impact", "Trailing stop", "Break-even rule"].map((t) => (
              <label key={t} className="flex items-center gap-2 rounded-full bg-white/5 px-3 py-1.5 text-xs text-white">
                <input type="checkbox" defaultChecked className="accent-violet-500" /> {t}
              </label>
            ))}
          </div>
          {interpretErr && (
            <div className="mt-3 flex items-center gap-2 rounded-lg bg-rose-500/10 px-3 py-2 text-xs text-rose-300 ring-1 ring-rose-400/30">
              <AlertTriangle className="h-3.5 w-3.5" /> {interpretErr}
            </div>
          )}
          <div className="mt-5 flex justify-end gap-2">
            <button
              onClick={() => { setInterpretation(null); setStep(2); }}
              className="rounded-xl bg-white/10 px-4 py-2 text-sm text-white"
            >
              Skip — use defaults
            </button>
            <button
              onClick={interpret}
              disabled={interpretLoading}
              className="inline-flex items-center gap-1.5 rounded-xl rb-gradient-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {interpretLoading
                ? <span className="h-3.5 w-3.5 animate-spin rounded-full border border-white border-t-transparent" />
                : <Brain className="h-3.5 w-3.5" />}
              {interpretLoading ? "Interpreting…" : "Interpret with AI →"}
            </button>
          </div>
        </Panel>
      )}

      {step === 2 && (
        <Panel title={interpretation ? "AI interpretation of your strategy" : "Default rule preview"}>
          <div className="grid gap-3 md:grid-cols-2">
            {[
              { t: "Entry rules", v: rules.entry },
              { t: "Exit rules", v: rules.exit },
              { t: "Risk rules", v: rules.risk },
              { t: "Filters", v: rules.filters },
              { t: "Invalidation", v: rules.invalidation },
              { t: "Fees & cashback", v: rules.fees },
            ].map((c) => (
              <div key={c.t} className="rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="text-[11px] uppercase tracking-wider text-violet-300">{c.t}</div>
                <div className="mt-1 text-sm text-white/90">{c.v}</div>
              </div>
            ))}
          </div>
          {interpretErr && (
            <div className="mt-3 flex items-center gap-2 rounded-lg bg-rose-500/10 px-3 py-2 text-xs text-rose-300 ring-1 ring-rose-400/30">
              <AlertTriangle className="h-3.5 w-3.5" /> {interpretErr}
            </div>
          )}
          <div className="mt-5 flex flex-wrap justify-end gap-2">
            <button onClick={() => setStep(1)} className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 px-4 py-2 text-sm text-white">
              <Pencil className="h-3.5 w-3.5" /> Edit Rules
            </button>
            <button
              onClick={saveTemplate}
              disabled={templateLoading}
              className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 px-4 py-2 text-sm text-white disabled:opacity-50"
            >
              <Save className="h-3.5 w-3.5" /> Save as Template
            </button>
            <button
              onClick={runBacktest}
              disabled={runLoading}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {runLoading ? <span className="h-3.5 w-3.5 animate-spin rounded-full border border-white border-t-transparent" /> : <Play className="h-3.5 w-3.5" />}
              {runLoading ? "Running..." : "Confirm & Run Backtest"}
            </button>
          </div>
        </Panel>
      )}

      {step === 3 && (
        <Panel title="Running backtest…">
          <div className="grid place-items-center py-12">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-violet-400 border-t-transparent" />
            <p className="mt-3 text-sm text-muted-foreground">Crunching 6 months of EURUSD 15m data…</p>
          </div>
        </Panel>
      )}
    </div>
  );
}

function RealTrades({ onAnalyze }: { onAnalyze: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [parsed, setParsed] = useState<ParsedCsv | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [mapping, setMapping] = useState<Record<TradeField, string | null>>(
    {} as Record<TradeField, string | null>,
  );
  const [meta, setMeta] = useState({
    source: "MT5 Statement", account: "",
    range: "", startBalance: "", currency: "USD",
  });
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string>("");
  const [analyzeLoading, setAnalyzeLoading] = useState(false);

  const stats = useMemo(
    () => (parsed ? aggregate(parsed.rows, mapping) : null),
    [parsed, mapping],
  );

  const handleFiles = async (files: FileList | null) => {
    setError("");
    const file = files?.[0];
    if (!file) return;
    if (!/\.(csv|txt)$/i.test(file.name)) {
      setError("Please upload a .csv or .txt file. Excel and HTML statements are not supported in this launch.");
      return;
    }
    const sizeError = validateFileSize(file);
    if (sizeError) {
      setError(sizeError);
      return;
    }
    const text = await file.text();
    const p = parseCsv(text);
    if (!p.headers.length) { setError("Could not detect any columns in this file."); return; }
    setParsed(p);
    setFileName(file.name);
    setMapping(autoMap(p.headers));
  };

  const reset = () => { setParsed(null); setFileName(""); setMapping({} as any); setError(""); };

  const analyze = async () => {
    if (!parsed || !stats) return;
    setAnalyzeLoading(true);
    setError("");
    try {
      const result = await importBacktestTrades({
        source: meta.source,
        account: meta.account,
        range: meta.range,
        startBalance: meta.startBalance,
        currency: meta.currency,
        rows: parsed.rows,
        mapping,
      });
      upsertImport(result.import);
      upsertReport(result.report);
      setReportTrades(result.report.id, result.trades);
      onAnalyze();
    } catch (err: any) {
      setError(err?.message ?? "Trade import analysis failed");
    } finally {
      setAnalyzeLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {!parsed && (
        <Panel title="Connect or upload trading data">
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <button
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
              className={`group rounded-2xl border border-dashed p-5 text-left transition ${
                dragOver ? "border-violet-400 bg-violet-500/10" : "border-white/15 bg-white/5 hover:border-violet-400/40 hover:bg-violet-500/5"
              }`}
            >
              <Upload className="mb-2 h-5 w-5 text-violet-300" />
              <div className="text-sm font-semibold text-white">Upload CSV / Statement</div>
              <div className="mt-1 text-[11px] text-muted-foreground">Drag, drop or click. Max {formatUploadLimit()}.</div>
            </button>
            {[
              { l: "Connect Exchange API", icon: Zap, hint: "Read-only connection is not enabled in this launch" },
              { l: "Paste Wallet Address", icon: Wallet, hint: "On-chain import is not enabled in this launch" },
              { l: "Manual Trade Import", icon: Pencil, hint: "Use journal Add Trade" },
            ].map((c) => {
              const Icon = c.icon;
              return (
                <div key={c.l} className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-5 opacity-60">
                  <Icon className="mb-2 h-5 w-5 text-violet-300" />
                  <div className="text-sm font-semibold text-white">{c.l}</div>
                  <div className="mt-1 text-[11px] text-muted-foreground">{c.hint}</div>
                </div>
              );
            })}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.txt,text/csv"
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
          {error && (
            <div className="mt-3 flex items-center gap-2 rounded-lg bg-rose-500/10 px-3 py-2 text-xs text-rose-300 ring-1 ring-rose-400/30">
              <AlertTriangle className="h-3.5 w-3.5" /> {error}
            </div>
          )}
          <Panel title="Supported sources" >
            <div className="flex flex-wrap gap-2">
              {importSources.map((s) => (
                <span key={s} className="rounded-full bg-white/5 px-3 py-1 text-[11px] text-white/85 ring-1 ring-white/10">{s}</span>
              ))}
            </div>
          </Panel>
        </Panel>
      )}

      {parsed && (
        <>
          <Panel
            title={`Imported: ${fileName}`}
            action={
              <button onClick={reset} className="inline-flex items-center gap-1 rounded-lg bg-white/10 px-2.5 py-1 text-[11px] text-white">
                <X className="h-3 w-3" /> Remove
              </button>
            }
          >
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <Pill tone="success"><FileUp className="mr-1 inline h-3 w-3" /> {parsed.rawCount} rows</Pill>
              <Pill tone="default">{parsed.headers.length} columns</Pill>
              <span className="text-muted-foreground">Review the column mapping below, then analyze.</span>
            </div>
          </Panel>

          <div className="grid gap-4 md:grid-cols-2">
            <Panel title="Account details">
              <div className="space-y-3">
                {([
                  { l: "Platform / Provider", k: "source" as const },
                  { l: "Account name", k: "account" as const },
                  { l: "Date range", k: "range" as const },
                  { l: "Starting balance", k: "startBalance" as const },
                  { l: "Currency", k: "currency" as const },
                ]).map((f) => (
                  <div key={f.k}>
                    <label className="text-[10px] uppercase tracking-wider text-muted-foreground">{f.l}</label>
                    <input
                      value={meta[f.k]}
                      onChange={(e) => setMeta((s) => ({ ...s, [f.k]: e.target.value }))}
                      className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
                    />
                  </div>
                ))}
              </div>
            </Panel>

            <Panel title="Column mapping">
              <div className="grid grid-cols-1 gap-2 text-xs">
                {TRADE_FIELDS.map((f) => (
                  <div key={f} className="flex items-center justify-between gap-2 rounded-lg bg-white/5 px-3 py-2">
                    <span className="capitalize text-white">{f}</span>
                    <select
                      value={mapping[f] ?? ""}
                      onChange={(e) =>
                        setMapping((m) => ({ ...m, [f]: e.target.value || null }))
                      }
                      className="max-w-[60%] rounded-md border border-white/10 bg-background px-2 py-1 text-xs text-white"
                    >
                      <option value="">— skip —</option>
                      {parsed.headers.map((h) => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </Panel>
          </div>

          {stats && (
            <Panel title="Live preview (computed from mapping)">
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <StatCard label="Trades" value={String(stats.trades)} accent="primary" />
                <StatCard label="Net P&L" value={`${stats.netPnl >= 0 ? "+" : ""}$${stats.netPnl.toLocaleString()}`} trend={stats.netPnl >= 0 ? "up" : "down"} accent={stats.netPnl >= 0 ? "success" : "destructive"} />
                <StatCard label="Win Rate" value={`${stats.winRate}%`} accent="primary" />
                <StatCard label="Profit Factor" value={stats.profitFactor.toFixed(2)} accent={stats.profitFactor >= 1.3 ? "success" : "warning"} />
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
                <StatCard label="Wins / Losses" value={`${stats.wins} / ${stats.losses}`} accent="primary" />
                <StatCard label="Fees" value={`$${stats.fees.toLocaleString()}`} accent="warning" />
                <StatCard label="Max Drawdown" value={`$${stats.maxDD.toLocaleString()}`} trend="down" accent="destructive" />
                <StatCard label="Best / Worst Day" value={`${stats.bestDay} / ${stats.worstDay}`} accent="primary" />
              </div>
            </Panel>
          )}

          <Panel title="Preview rows (first 8)">
            <div className="-mx-5 overflow-x-auto px-5">
              <table className="w-full text-left text-xs">
                <thead className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  <tr>{parsed.headers.map((h) => <th key={h} className="px-2 py-2 whitespace-nowrap">{h}</th>)}</tr>
                </thead>
                <tbody>
                  {parsed.rows.slice(0, 8).map((r, i) => (
                    <tr key={i} className="border-t border-white/5 text-white/90">
                      {parsed.headers.map((h) => (
                        <td key={h} className="px-2 py-2 whitespace-nowrap">{r[h]}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>

          <div className="flex flex-wrap justify-end gap-2">
            <button onClick={reset} className="rounded-xl bg-white/10 px-4 py-2 text-sm text-white">Cancel</button>
            <button
              onClick={analyze}
              disabled={analyzeLoading}
              className="inline-flex items-center gap-1.5 rounded-xl rb-gradient-primary px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              {analyzeLoading ? <span className="h-4 w-4 animate-spin rounded-full border border-white border-t-transparent" /> : <Brain className="h-4 w-4" />}
              {analyzeLoading ? "Analyzing..." : "Analyze with AI"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function Reports() {
  const reports = useReports();
  const r = reports[0];
  const [trades, setTrades] = useState<BacktestTrade[]>(() => (r ? getReportTrades(r.id) : []));
  const [tradeError, setTradeError] = useState("");

  useEffect(() => {
    if (!r) return;
    setTrades(getReportTrades(r.id));
    setTradeError("");

    if (!/^\d+$/.test(r.id)) return;
    let cancelled = false;

    fetchBacktestReportTrades(r.id)
      .then((rows) => {
        if (cancelled) return;
        setReportTrades(r.id, rows);
        setTrades(rows);
      })
      .catch((error) => {
        if (cancelled) return;
        setTradeError(error?.message ?? "Could not load report trades");
      });

    return () => {
      cancelled = true;
    };
  }, [r?.id]);

  if (!r) return <Panel title="No reports yet"><p className="text-sm text-muted-foreground">Run a backtest or import trades to see results here.</p></Panel>;
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Net P&L" value={`$${r.netPnl.toLocaleString()}`} hint="after fees + cashback" trend="up" accent="success" />
        <StatCard label="Win Rate" value={`${r.winRate}%`} accent="primary" />
        <StatCard label="Profit Factor" value={r.profitFactor.toFixed(2)} accent="primary" />
        <StatCard label="Avg RR" value={r.avgRR.toFixed(2)} accent="primary" />
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Trades" value={String(r.trades)} accent="primary" />
        <StatCard label="Max Drawdown" value={`$${r.maxDD}`} trend="down" accent="destructive" />
        <StatCard label="Best / Worst Day" value={`${r.bestDay} / ${r.worstDay}`} accent="primary" />
        <StatCard label="Risk of Ruin" value={r.riskOfRuin} accent="warning" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Equity curve">
          <ReportChart report={r} kind="equity" />
        </Panel>
        <Panel title="Drawdown curve">
          <ReportChart report={r} kind="drawdown" />
        </Panel>
      </div>

      <Panel title="Trade-by-trade">
        {tradeError && (
          <div className="mb-3 rounded-lg bg-rose-500/10 px-3 py-2 text-xs text-rose-100 ring-1 ring-rose-400/20">
            {tradeError}
          </div>
        )}
        <div className="-mx-5 overflow-x-auto px-5">
          <table className="w-full text-left text-xs">
            <thead className="text-[10px] uppercase tracking-wider text-muted-foreground">
              <tr>
                {["Date", "Symbol", "Side", "Entry", "SL", "TP", "Exit", "Result", "RR", "P&L", "Fees", "Cashback"].map((h) => (
                  <th key={h} className="px-2 py-2">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {trades.map((t) => (
                <tr key={t.id} className="border-t border-white/5 text-white/90">
                  <td className="px-2 py-2">{t.date}</td>
                  <td className="px-2 py-2">{t.symbol}</td>
                  <td className="px-2 py-2">{t.side}</td>
                  <td className="px-2 py-2">{t.entry.toFixed(4)}</td>
                  <td className="px-2 py-2">{t.sl.toFixed(4)}</td>
                  <td className="px-2 py-2">{t.tp.toFixed(4)}</td>
                  <td className="px-2 py-2">{t.exit.toFixed(4)}</td>
                  <td className="px-2 py-2">
                    <Pill tone={t.result === "Win" ? "success" : t.result === "Loss" ? "destructive" : "default"}>{t.result}</Pill>
                  </td>
                  <td className="px-2 py-2">{t.rr}</td>
                  <td className={`px-2 py-2 font-semibold ${t.pnl >= 0 ? "text-emerald-300" : "text-rose-300"}`}>${t.pnl}</td>
                  <td className="px-2 py-2 text-muted-foreground">${t.fees}</td>
                  <td className="px-2 py-2 text-emerald-300">+${t.cashback}</td>
                </tr>
              ))}
              {!trades.length && (
                <tr className="border-t border-white/5 text-muted-foreground">
                  <td className="px-2 py-4" colSpan={12}>No trade rows saved for this report.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Panel>

      <Insights />
    </div>
  );
}

function CalendarView() {
  const reports = useReports();
  const [reportId, setReportId] = useState<string>(reports[0]?.id ?? "");
  const r = reports.find((x) => x.id === reportId) ?? reports[0];

  if (!r) return <Panel title="Trade Calendar"><p className="text-sm text-muted-foreground">No reports yet — run a backtest or import trades.</p></Panel>;

  const cells = r.calendar?.length
    ? r.calendar
    : buildCalendar({ reportId: r.id, netPnl: r.netPnl, trades: r.trades, bestDay: r.bestDay });
  const tone = (t: typeof cells[number]["tone"]) =>
    t === "up" ? "bg-emerald-500/30 ring-emerald-400/40"
    : t === "down" ? "bg-rose-500/30 ring-rose-400/40"
    : t === "warn" ? "bg-violet-500/25 ring-violet-400/35"
    : "bg-white/5 ring-white/10";

  return (
    <Panel
      title="Trade Calendar"
      action={
        <select value={r.id} onChange={(e) => setReportId(e.target.value)} className="rounded-lg border border-white/10 bg-background px-2 py-1 text-xs text-white">
          {reports.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
        </select>
      }
    >
      <div className="mb-3 flex flex-wrap gap-3 text-[11px] text-muted-foreground">
        <Legend color="bg-emerald-500/40" label="Profitable" />
        <Legend color="bg-rose-500/40" label="Losing" />
        <Legend color="bg-violet-500/35" label="Big loss" />
        <Legend color="bg-white/10" label="No trades" />
      </div>
      <div className="grid grid-cols-7 gap-2">
        {cells.map((c) => (
          <div key={c.day} className={`aspect-square rounded-lg ring-1 ${tone(c.tone)} p-2 text-[10px] text-white/80`}>
            <div>{c.day}</div>
            {c.pnl !== 0 && (
              <div className={`mt-1 font-semibold ${c.pnl > 0 ? "text-emerald-300" : "text-rose-300"}`}>
                {c.pnl > 0 ? "+" : ""}${Math.round(c.pnl)}
              </div>
            )}
            {c.trades > 0 && <div className="text-[9px] text-muted-foreground">{c.trades}t</div>}
          </div>
        ))}
      </div>
    </Panel>
  );
}

function Templates({ onUse }: { onUse: () => void }) {
  const tmpl = useTemplates();
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {tmpl.length === 0 && <p className="text-sm text-muted-foreground">No saved templates yet.</p>}
      {tmpl.map((t) => (
        <div key={t.id} className="glass rounded-2xl p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-white">{t.name}</div>
              <div className="text-[11px] text-muted-foreground">{t.market} • {t.symbol} • {t.timeframe} • saved {t.createdAt}</div>
              {t.description && <div className="mt-2 line-clamp-2 text-[11px] text-white/70">{t.description}</div>}
            </div>
            <button
              onClick={() => { setPreset(t); onUse(); }}
              className="shrink-0 rounded-lg rb-gradient-primary px-3 py-1.5 text-[11px] font-semibold text-white"
            >
              Use Template
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function Insights() {
  const reports = useReports();
  const report = reports[0];
  const [items, setItems] = useState<{ title: string; text: string; tone: "success" | "warn" | "info" | "danger" }[]>(
    report?.insights?.length ? report.insights : [],
  );
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string>("");

  useEffect(() => {
    if (report?.insights?.length) {
      setItems(report.insights);
    } else {
      setItems([]);
    }
  }, [report?.id]);

  const map = {
    success: { ring: "ring-emerald-400/40", icon: CheckCircle2, color: "text-emerald-300" },
    warn: { ring: "ring-violet-400/35", icon: AlertTriangle, color: "text-violet-200" },
    info: { ring: "ring-cyan-400/40", icon: Info, color: "text-cyan-300" },
    danger: { ring: "ring-rose-400/40", icon: ShieldAlert, color: "text-rose-300" },
  } as const;

  const run = async () => {
    if (!report) { setErr("Run a backtest or import trades first."); return; }
    setLoading(true); setErr("");
    try {
      const res = await generateBacktestInsights(report.id);
      setItems(res.insights);
      upsertReport({ ...report, insights: res.insights });
    } catch (e: any) {
      setErr(e?.message ?? "Failed to generate insights");
    } finally { setLoading(false); }
  };

  return (
    <Panel
      title="AI Trade Intelligence"
      action={
        <button
          onClick={run}
          disabled={loading || !report}
          className="inline-flex items-center gap-1.5 rounded-lg rb-gradient-primary px-3 py-1.5 text-[11px] font-semibold text-white disabled:opacity-50"
        >
          {loading ? <span className="h-3 w-3 animate-spin rounded-full border border-white border-t-transparent" /> : <Brain className="h-3 w-3" />}
          {loading ? "Analyzing…" : "Generate AI Insights"}
        </button>
      }
    >
      {err && (
        <div className="mb-3 flex items-center gap-2 rounded-lg bg-rose-500/10 px-3 py-2 text-xs text-rose-300 ring-1 ring-rose-400/30">
          <AlertTriangle className="h-3.5 w-3.5" /> {err}
        </div>
      )}
      {items.length > 0 ? (
        <div className="grid gap-3 md:grid-cols-2">
          {items.map((i) => {
          const cfg = map[i.tone];
          const Icon = cfg.icon;
          return (
            <div key={i.title} className={`rounded-xl bg-white/5 p-4 ring-1 ${cfg.ring}`}>
              <div className={`flex items-center gap-2 text-sm font-semibold ${cfg.color}`}>
                <Icon className="h-4 w-4" /> {i.title}
              </div>
              <p className="mt-2 text-xs text-white/85">{i.text}</p>
            </div>
          );
          })}
        </div>
      ) : (
        <EmptyState
          icon={Brain}
          title="No AI insights yet"
          description="Generate insights after you run a backtest or import real trades. No canned analysis is shown."
        />
      )}
    </Panel>
  );
}

function Compare() {
  const reports = useReports();
  const backtests = reports.filter((r) => r.source === "ai-strategy");
  const liveTrades = reports.filter((r) => r.source === "real-trades");

  const [aId, setAId] = useState<string>(backtests[0]?.id ?? "");
  const [bId, setBId] = useState<string>(liveTrades[0]?.id ?? "");

  const a = backtests.find((r) => r.id === aId) ?? backtests[0];
  const b = liveTrades.find((r) => r.id === bId) ?? liveTrades[0];

  if (!a || !b) {
    return (
      <Panel title="Backtest vs Real Execution">
        <div className="flex flex-col items-start gap-2 py-6 text-sm text-muted-foreground">
          <p>You need at least <strong className="text-white">one backtest</strong> and <strong className="text-white">one imported trade history</strong> to compare.</p>
          <div className="flex gap-2 text-[11px]">
            <Pill tone={a ? "success" : "warning"}>{a ? "✓" : "—"} Backtest</Pill>
            <Pill tone={b ? "success" : "warning"}>{b ? "✓" : "—"} Real trades</Pill>
          </div>
        </div>
      </Panel>
    );
  }

  const fmtPnl = (n: number) => `${n >= 0 ? "+" : ""}$${n.toLocaleString()}`;
  const rows = [
    { l: "Win Rate", a: `${a.winRate}%`, b: `${b.winRate}%`, gap: a.winRate - b.winRate, unit: "%" },
    { l: "Profit Factor", a: a.profitFactor.toFixed(2), b: b.profitFactor.toFixed(2), gap: a.profitFactor - b.profitFactor, unit: "" },
    { l: "Avg RR", a: a.avgRR.toFixed(2), b: b.avgRR.toFixed(2), gap: a.avgRR - b.avgRR, unit: "" },
    { l: "Max Drawdown", a: `$${a.maxDD.toLocaleString()}`, b: `$${b.maxDD.toLocaleString()}`, gap: b.maxDD - a.maxDD, unit: "" },
    { l: "Net P&L", a: fmtPnl(a.netPnl), b: fmtPnl(b.netPnl), gap: a.netPnl - b.netPnl, unit: "" },
    { l: "Trades", a: String(a.trades), b: String(b.trades), gap: a.trades - b.trades, unit: "" },
  ];

  const norm = (x: number, ref: number) => (ref ? Math.max(0, Math.min(1, x / ref)) : 0);
  const discipline = Math.round(
    ((norm(b.winRate, a.winRate) + norm(b.profitFactor, a.profitFactor) + norm(b.avgRR, a.avgRR)) / 3) * 100,
  );
  const executionGap = 100 - discipline;

  return (
    <div className="space-y-4">
      <Panel title="Select reports to compare">
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="text-[10px] uppercase tracking-wider text-emerald-300">Backtest (A)</label>
            <select value={a.id} onChange={(e) => setAId(e.target.value)} className="mt-1 w-full rounded-lg border border-white/10 bg-background px-3 py-2 text-sm text-white">
              {backtests.map((r) => <option key={r.id} value={r.id}>{r.name} • {r.symbol}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-wider text-violet-300">Real Trading (B)</label>
            <select value={b.id} onChange={(e) => setBId(e.target.value)} className="mt-1 w-full rounded-lg border border-white/10 bg-background px-3 py-2 text-sm text-white">
              {liveTrades.map((r) => <option key={r.id} value={r.id}>{r.name} • {r.symbol}</option>)}
            </select>
          </div>
        </div>
      </Panel>

      <Panel title="Backtest vs Real Execution">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="py-2">Metric</th>
                <th className="py-2 text-emerald-300">Backtest</th>
                <th className="py-2 text-violet-300">Real Trading</th>
                <th className="py-2">Gap</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const better = r.gap > 0;
                return (
                  <tr key={r.l} className="border-t border-white/5 text-white/90">
                    <td className="py-2">{r.l}</td>
                    <td className="py-2">{r.a}</td>
                    <td className="py-2">{r.b}</td>
                    <td className={`py-2 ${better ? "text-rose-300" : "text-emerald-300"}`}>
                      {better ? "−" : "+"}{Math.abs(r.gap).toFixed(r.unit === "%" ? 0 : 2)}{r.unit}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel title="Execution analysis">
        <div className="grid gap-3 md:grid-cols-3">
          <StatCard label="Discipline Score" value={`${discipline}/100`} accent={discipline >= 75 ? "success" : discipline >= 50 ? "warning" : "destructive"} />
          <StatCard label="Execution Gap" value={`${executionGap}%`} trend={executionGap > 25 ? "down" : "up"} accent={executionGap > 25 ? "destructive" : "success"} />
          <StatCard label="Net Δ (A − B)" value={fmtPnl(a.netPnl - b.netPnl)} accent={a.netPnl - b.netPnl > 0 ? "warning" : "success"} />
        </div>
        <p className="mt-3 text-sm text-white/85">
          {discipline >= 75
            ? "Strong execution — your real trading closely mirrors the backtest edge."
            : discipline >= 50
            ? "Moderate execution drift. Review entries, exits, and risk management for inconsistencies vs your plan."
            : "Significant execution gap. Your real trading deviates heavily from the tested strategy. Run AI Insights for specifics."}
        </p>
      </Panel>
    </div>
  );
}

function Saved() {
  const reports = useReports();
  const [deleteError, setDeleteError] = useState("");

  const remove = async (reportId: string) => {
    setDeleteError("");
    try {
      if (/^\d+$/.test(reportId)) {
        await deleteBacktestReport(reportId);
      }
      deleteReport(reportId);
    } catch (error: any) {
      setDeleteError(error?.message ?? "Report delete failed");
    }
  };

  return (
    <Panel title="Saved reports" action={
      <span className="text-[11px] text-muted-foreground">{reports.length} total</span>
    }>
      {deleteError && (
        <div className="mb-3 rounded-lg bg-rose-500/10 px-3 py-2 text-xs text-rose-200 ring-1 ring-rose-400/20">
          {deleteError}
        </div>
      )}
      {reports.length === 0
        ? <p className="text-sm text-muted-foreground">No reports saved yet.</p>
        : <ReportsTable rows={reports} onDelete={remove} />}
    </Panel>
  );
}

function ReportsTable({ rows, compact, onDelete }: { rows: BacktestReport[]; compact?: boolean; onDelete?: (id: string) => void }) {
  return (
    <div className="-mx-5 overflow-x-auto px-5">
      <table className="w-full text-left text-xs">
        <thead className="text-[10px] uppercase tracking-wider text-muted-foreground">
          <tr>
            <th className="px-2 py-2">Name</th>
            <th className="px-2 py-2">Source</th>
            <th className="px-2 py-2">Symbol</th>
            <th className="px-2 py-2">TF</th>
            <th className="px-2 py-2">Net P&L</th>
            <th className="px-2 py-2">Win %</th>
            <th className="px-2 py-2">PF</th>
            {!compact && <th className="px-2 py-2">Trades</th>}
            <th className="px-2 py-2">Created</th>
            {onDelete && <th className="px-2 py-2"></th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-t border-white/5 text-white/90">
              <td className="px-2 py-2 font-medium">{r.name}</td>
              <td className="px-2 py-2">
                <Pill tone={r.source === "ai-strategy" ? "primary" : "warning"}>{r.source}</Pill>
              </td>
              <td className="px-2 py-2">{r.symbol}</td>
              <td className="px-2 py-2">{r.timeframe}</td>
              <td className={`px-2 py-2 font-semibold ${r.netPnl >= 0 ? "text-emerald-300" : "text-rose-300"}`}>
                ${r.netPnl.toLocaleString()}
              </td>
              <td className="px-2 py-2">{r.winRate}%</td>
              <td className="px-2 py-2">{r.profitFactor}</td>
              {!compact && <td className="px-2 py-2">{r.trades}</td>}
              <td className="px-2 py-2 text-muted-foreground">{r.createdAt}</td>
              {onDelete && (
                <td className="px-2 py-2">
                  <button onClick={() => onDelete(r.id)} className="rounded-md bg-rose-500/20 px-2 py-1 text-[10px] text-rose-300">Delete</button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ReportChart({ report, kind }: { report: BacktestReport; kind: "equity" | "drawdown" }) {
  const curve = report.equityCurve?.length
    ? report.equityCurve
    : buildEquityCurve({
        reportId: report.id, trades: report.trades,
        netPnl: report.netPnl, winRate: report.winRate, avgRR: report.avgRR,
      });
  const series = kind === "equity" ? curve.map((p) => p.equity) : curve.map((p) => p.drawdown);
  const positive = kind === "equity" ? report.netPnl >= 0 : false;
  const { line, area } = pathFromCurve(series, 300, 100, 4);
  const color = positive ? "stroke-emerald-400" : "stroke-rose-400";
  const fill = positive ? "fill-emerald-400/10" : "fill-rose-400/10";
  return (
    <svg viewBox="0 0 300 100" className="h-44 w-full" preserveAspectRatio="none">
      <path d={area} className={fill} />
      <path d={line} fill="none" strokeWidth="1.6" className={color} />
    </svg>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`h-3 w-3 rounded ${color}`} /> {label}
    </span>
  );
}

function Disclaimer() {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-[11px] leading-relaxed text-muted-foreground">
      <strong className="text-white/85">Disclaimer:</strong> Backtesting results are based on historical data and do not guarantee
      future performance. AI insights are educational and should not be treated as financial advice. For wallet/exchange
      connections: never share private keys, seed phrases, passwords, or withdrawal access. RebateBoard only supports read-only data analysis.
    </div>
  );
}
