import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader, Panel, Pill, StatCard } from "@/components/dashboard/Primitives";
import { Plus, Upload, Filter, Flag, Camera, AlertTriangle, ShieldCheck, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { AddTradeModal } from "@/components/dashboard/AddTradeModal";
import { deleteTrade, useTrades, useTradingPlan } from "@/lib/trading-plan";

export const Route = createFileRoute("/dashboard/trades")({
  component: TradesPage,
});

function TradesPage() {
  const [filter, setFilter] = useState<"all" | "wins" | "losses" | "flagged">("all");
  const [open, setOpen] = useState(false);
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

  const totals = useMemo(() => {
    const pnl = trades.reduce((s, t) => s + t.pnl, 0);
    const adherence = trades.length ? Math.round(trades.reduce((s, t) => s + t.adherence, 0) / trades.length) : 0;
    const wins = trades.filter((t) => t.pnl > 0).length;
    const wr = trades.length ? Math.round((wins / trades.length) * 100) : 0;
    const violations = trades.reduce((s, t) => s + t.violations.length, 0);
    return { pnl, adherence, wr, violations };
  }, [trades]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Trades"
        subtitle="Plan-aware journal — log, tag, flag, and learn."
        actions={
          <>
            <Link to={"/dashboard/trading-plan" as string} className="glass-pill inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-white">
              <ShieldCheck className="h-3.5 w-3.5 text-accent" /> Trading Plan
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
        <StatCard label="Net PnL" value={`${totals.pnl >= 0 ? "+" : ""}$${totals.pnl.toFixed(2)}`} accent={totals.pnl >= 0 ? "success" : "destructive"} trend={totals.pnl >= 0 ? "up" : "down"} />
        <StatCard label="Win rate" value={`${totals.wr}%`} accent="primary" />
        <StatCard label="Plan adherence" value={`${totals.adherence}%`} accent={totals.adherence >= 80 ? "success" : totals.adherence >= 50 ? "warning" : "destructive"} />
        <StatCard label="Violations" value={`${totals.violations}`} accent={totals.violations === 0 ? "success" : "warning"} />
      </div>

      {plan.strategies.length === 0 && (
        <div className="glass flex items-start gap-3 rounded-2xl p-4 ring-1 ring-accent/30">
          <AlertTriangle className="mt-0.5 h-4 w-4 text-accent" />
          <div className="flex-1 text-xs text-white">
            You haven't defined a strategy yet. Adherence and AI insights work best when you do.{" "}
            <Link to={"/dashboard/trading-plan" as string} className="text-accent underline">Open Trading Plan →</Link>
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
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="text-left text-muted-foreground">
                <tr className="border-b border-white/5">
                  <th className="py-2 font-medium">When</th>
                  <th className="font-medium">Asset</th>
                  <th className="font-medium">Side</th>
                  <th className="font-medium">RR</th>
                  <th className="font-medium">PnL</th>
                  <th className="font-medium">Session</th>
                  <th className="font-medium">Adherence</th>
                  <th className="font-medium">Flags</th>
                  <th className="font-medium">Media</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => (
                  <tr key={t.id} className="border-b border-white/5 text-white/90">
                    <td className="py-3">{new Date(t.createdAt).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</td>
                    <td className="font-semibold">{t.asset}</td>
                    <td className="capitalize">{t.direction}</td>
                    <td className={t.rr >= 1.5 ? "text-success" : "text-accent"}>{t.rr.toFixed(2)}R</td>
                    <td className={t.pnl >= 0 ? "text-success" : "text-destructive"}>{t.pnl >= 0 ? "+" : "−"}${Math.abs(t.pnl).toFixed(2)}</td>
                    <td><Pill>{t.session}</Pill></td>
                    <td>
                      <span className={`font-semibold ${t.adherence >= 80 ? "text-success" : t.adherence >= 50 ? "text-accent" : "text-destructive"}`}>{t.adherence}%</span>
                    </td>
                    <td>
                      {t.violations.length > 0
                        ? <Pill tone="destructive"><Flag className="h-3 w-3" />{t.violations.length}</Pill>
                        : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td>{t.beforeImg || t.afterImg ? <Camera className="h-4 w-4 text-accent" /> : <span className="text-muted-foreground">—</span>}</td>
                    <td>
                      <button onClick={() => deleteTrade(t.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <AddTradeModal open={open} onClose={() => setOpen(false)} />
    </div>
  );
}
