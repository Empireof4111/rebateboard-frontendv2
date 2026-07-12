import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader, Panel, Pill, StatCard } from "@/components/dashboard/Primitives";
import { Plus, Upload, Filter, Flag, Camera, AlertTriangle, ShieldCheck, Trash2, Eye, X } from "lucide-react";
import { useMemo, useState } from "react";
import { AddTradeModal } from "@/components/dashboard/AddTradeModal";
import { deleteTrade, summarizeTrades, useTrades, useTradingPlan, type Trade } from "@/lib/trading-plan";

export const Route = createFileRoute("/dashboard/trades")({
  component: TradesPage,
});

function TradesPage() {
  const [filter, setFilter] = useState<"all" | "wins" | "losses" | "flagged">("all");
  const [open, setOpen] = useState(false);
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const trades = useTrades();
  const plan = useTradingPlan();

  const filtered = useMemo(() => {
    return trades.filter((t) => {
      if (filter === "wins") return t.pnl > 0;
      if (filter === "losses") return t.pnl < 0;
      if (filter === "flagged") return t.violations.length > 0 || t.ruleFollowed === false;
      return true;
    });
  }, [trades, filter]);

  const totals = useMemo(() => summarizeTrades(trades), [trades]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Trades"
        subtitle="Plan-aware journal — log, tag, flag, and learn."
        actions={
          <>
            <Link to={"/dashboard/trading-plan" as string} className="glass-pill inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-white">
              <ShieldCheck className="h-3.5 w-3.5 text-fuchsia-300" /> Trading Plan
            </Link>
            <button className="glass-pill inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-white">
              <Upload className="h-3.5 w-3.5" /> Import CSV
            </button>
            <button onClick={() => setOpen(true)} className="rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-600 px-3 py-1.5 text-xs font-semibold text-white shadow-[0_0_20px_rgba(192,132,252,0.45)]">
              <Plus className="mr-1 inline h-3.5 w-3.5" /> Add Trade
            </button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Net PnL" value={`${totals.netPnl >= 0 ? "+" : ""}$${totals.netPnl.toFixed(2)}`} accent={totals.netPnl >= 0 ? "success" : "destructive"} trend={totals.netPnl >= 0 ? "up" : "down"} />
        <StatCard label="Win rate" value={totals.totalTrades ? `${totals.winRate}%` : "Not Enough Activity"} accent="primary" />
        <StatCard label="Average R" value={totals.totalTrades ? `${totals.averageR.toFixed(2)}R` : "Not Enough Activity"} accent="primary" />
        <StatCard label="Plan adherence" value={totals.totalTrades ? `${totals.adherence}%` : "Not Enough Activity"} accent={totals.adherence >= 80 ? "success" : totals.adherence >= 50 ? "warning" : "destructive"} />
      </div>

      {plan.strategies.length === 0 && (
        <div className="glass flex items-start gap-3 rounded-2xl p-4 ring-1 ring-accent/30">
          <AlertTriangle className="mt-0.5 h-4 w-4 text-fuchsia-300" />
          <div className="flex-1 text-xs text-white">
            You haven't defined a strategy yet. Adherence and AI insights work best when you do.{" "}
            <Link to={"/dashboard/trading-plan" as string} className="text-fuchsia-300 underline">Open Trading Plan →</Link>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {(["all", "wins", "losses", "flagged"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-3 py-1.5 text-xs capitalize ${filter === f ? "bg-white/15 text-white" : "glass-pill text-muted-foreground"}`}
          >
            {f}
          </button>
        ))}
        <button className="glass-pill ml-auto inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs text-white">
          <Filter className="h-3.5 w-3.5" /> Filters
        </button>
      </div>

      <Panel title={`Trades (${filtered.length})`}>
        {filtered.length === 0 ? (
          <div className="grid place-items-center py-10 text-center">
            <p className="text-sm text-muted-foreground">No trades yet.</p>
            <button onClick={() => setOpen(true)} className="mt-3 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-600 px-3 py-1.5 text-xs font-semibold text-white">
              <Plus className="h-3.5 w-3.5" /> Log your first trade
            </button>
          </div>
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            {filtered.map((trade) => (
              <TradeCard
                key={trade.id}
                trade={trade}
                onOpen={() => setSelectedTrade(trade)}
                onDelete={() => deleteTrade(trade.id)}
              />
            ))}
          </div>
        )}
      </Panel>

      <AddTradeModal open={open} onClose={() => setOpen(false)} />
      {selectedTrade && (
        <TradeDetailModal trade={selectedTrade} onClose={() => setSelectedTrade(null)} />
      )}
    </div>
  );
}

function TradeCard({ trade, onOpen, onDelete }: { trade: Trade; onOpen: () => void; onDelete: () => void }) {
  const profitable = trade.pnl >= 0;
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4 transition hover:border-violet-300/30 hover:bg-white/[0.055]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-sm font-bold text-white">{trade.asset}</h3>
            <Pill tone={profitable ? "success" : "destructive"}>{trade.winLossStatus ?? (profitable ? "win" : "loss")}</Pill>
            <Pill>{trade.market}</Pill>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {new Date(trade.createdAt).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })} · {trade.session} session
          </p>
        </div>
        <div className={`text-right text-base font-bold tabular-nums ${profitable ? "text-success" : "text-destructive"}`}>
          {profitable ? "+" : "−"}${Math.abs(trade.pnl).toFixed(2)}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
        <MiniMetric label="R multiple" value={`${(trade.rMultiple ?? trade.rr).toFixed(2)}R`} />
        <MiniMetric label="Plan" value={`${trade.adherence}%`} />
        <MiniMetric label="Move" value={trade.market === "forex" ? `${(trade.pips ?? 0).toFixed(1)} pips` : `${(trade.points ?? 0).toFixed(2)} pts`} />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {trade.beforeImg || trade.afterImg ? <Pill tone="primary"><Camera className="h-3 w-3" /> screenshots</Pill> : null}
        {trade.violations.length > 0 ? <Pill tone="destructive"><Flag className="h-3 w-3" /> {trade.violations.length} flags</Pill> : <Pill tone="success">Clean review</Pill>}
        <div className="ml-auto flex gap-1">
          <button onClick={onOpen} className="glass-pill inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs text-white">
            <Eye className="h-3.5 w-3.5" /> Details
          </button>
          <button onClick={onDelete} className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive" aria-label="Delete trade">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

function TradeDetailModal({ trade, onClose }: { trade: Trade; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-black/70 p-3 backdrop-blur-sm">
      <div className="glass max-h-[88vh] w-full max-w-3xl overflow-y-auto rounded-2xl ring-1 ring-white/10">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-[#170826]/90 px-5 py-4 backdrop-blur">
          <div>
            <h2 className="text-lg font-bold text-white">{trade.asset} Trading Diary</h2>
            <p className="text-xs text-muted-foreground">{new Date(trade.createdAt).toLocaleString()} · {trade.direction} · {trade.market}</p>
          </div>
          <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full bg-white/5 text-white/75 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-5 p-5">
          <div className="grid gap-3 sm:grid-cols-4">
            <MiniMetric label="PnL" value={`${trade.pnl >= 0 ? "+" : "−"}$${Math.abs(trade.pnl).toFixed(2)}`} />
            <MiniMetric label="R Multiple" value={`${(trade.rMultiple ?? trade.rr).toFixed(2)}R`} />
            <MiniMetric label="Gain" value={`${(trade.percentageGain ?? 0).toFixed(2)}%`} />
            <MiniMetric label="Adherence" value={`${trade.adherence}%`} />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <DetailBlock title="Trade Setup" items={[
              ["Entry", trade.entry],
              ["Exit", trade.exit],
              ["Stop", trade.stop],
              ["Target", trade.target],
              ["Position", trade.lot],
              ["Risk", `${trade.riskPct}%`],
              ["Strategy", trade.strategyId || "Not linked"],
              ["Setup", trade.setupType || "—"],
            ]} />
            <DetailBlock title="Execution Notes" items={[
              ["Bias", trade.htfBias || "—"],
              ["Reason", trade.entryReason || "—"],
              ["Confirmation", trade.confirmation || "—"],
              ["Emotion before", trade.emotionBefore || "—"],
              ["Emotion after", trade.emotionAfter || "—"],
              ["Quality", trade.quality || "—"],
            ]} />
          </div>
          {trade.narrative && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
              <h3 className="text-sm font-semibold text-white">Personal Notes</h3>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-white/75">{trade.narrative}</p>
            </div>
          )}
          {(trade.beforeImg || trade.afterImg) && (
            <div className="grid gap-3 md:grid-cols-2">
              {trade.beforeImg && <img src={trade.beforeImg} alt="Before trade screenshot" className="aspect-video w-full rounded-2xl border border-white/10 object-cover" />}
              {trade.afterImg && <img src={trade.afterImg} alt="After trade screenshot" className="aspect-video w-full rounded-2xl border border-white/10 object-cover" />}
            </div>
          )}
          <div className="rounded-2xl border border-violet-300/15 bg-violet-300/10 p-4 text-sm text-violet-50">
            <SparklesLabel />
            <p className="mt-2 text-xs leading-relaxed text-violet-100/80">
              Rebeta will use this diary entry with your Trading Plan to improve future psychology, risk, and strategy analysis.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.035] p-3">
      <div className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">{label}</div>
      <div className="mt-1 text-sm font-bold text-white tabular-nums">{value}</div>
    </div>
  );
}

function DetailBlock({ title, items }: { title: string; items: Array<[string, string | number]> }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
      <h3 className="text-sm font-semibold text-white">{title}</h3>
      <div className="mt-3 space-y-2">
        {items.map(([label, value]) => (
          <div key={label} className="flex justify-between gap-3 text-xs">
            <span className="text-muted-foreground">{label}</span>
            <span className="text-right font-medium text-white/85">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SparklesLabel() {
  return <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-violet-100">Rebeta Memory</div>;
}
