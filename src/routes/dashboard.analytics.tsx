import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { EmptyState, PageHeader, Panel, Pill, StatCard } from "@/components/dashboard/Primitives";
import { openAddTrade } from "@/lib/ui-bus";
import { resolveTradeNetPnl, useTrades, useTradingPlan, type Trade } from "@/lib/trading-plan";
import { BarChart3, Plus, Bot } from "lucide-react";

export const Route = createFileRoute("/dashboard/analytics")({
  component: AnalyticsPage,
});

type GroupMetric = { label: string; netPnl: number; trades: number };

function money(value: number) {
  const sign = value < 0 ? "-" : "";
  return `${sign}$${Math.abs(value).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

function groupBy(trades: Trade[], key: (trade: Trade) => string): GroupMetric[] {
  const map = new Map<string, GroupMetric>();
  trades.forEach((trade) => {
    const pnl = resolveTradeNetPnl(trade);
    if (pnl == null) return;
    const label = key(trade) || "Unclassified";
    const current = map.get(label) ?? { label, netPnl: 0, trades: 0 };
    current.netPnl += pnl;
    current.trades += 1;
    map.set(label, current);
  });
  return [...map.values()].sort((a, b) => b.netPnl - a.netPnl);
}

function maxDrawdown(trades: Trade[]) {
  const chronological = [...trades].sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt));
  let equity = 0;
  let peak = 0;
  let drawdown = 0;
  chronological.forEach((trade) => {
    const pnl = resolveTradeNetPnl(trade);
    if (pnl == null) return;
    equity += pnl;
    peak = Math.max(peak, equity);
    drawdown = Math.min(drawdown, equity - peak);
  });
  return drawdown;
}

function Bar({ label, value, max, trades }: { label: string; value: number; max: number; trades: number }) {
  const width = max > 0 ? Math.max(6, (Math.abs(value) / max) * 100) : 0;
  return (
    <div className="text-xs">
      <div className="mb-1 flex justify-between gap-3">
        <span className="truncate text-muted-foreground">{label}</span>
        <span className="shrink-0 font-semibold text-white">
          {value > 0 ? "+" : ""}${value.toFixed(2)} · {trades}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-white/5">
        <div
          className={`h-full ${value >= 0 ? "bg-success" : "bg-destructive"}`}
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}

function MetricPanel({ title, rows }: { title: string; rows: GroupMetric[] }) {
  const max = Math.max(...rows.map((row) => Math.abs(row.netPnl)), 0);
  return (
    <Panel title={title}>
      {rows.length > 0 ? (
        <div className="space-y-3">
          {rows.slice(0, 5).map((row) => (
            <Bar key={row.label} label={row.label} value={row.netPnl} max={max} trades={row.trades} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No logged trades in this category yet.</p>
      )}
    </Panel>
  );
}

function AnalyticsPage() {
  const trades = useTrades();
  const plan = useTradingPlan();

  const metrics = useMemo(() => {
    const completed = trades
      .map((trade) => ({ trade, pnl: resolveTradeNetPnl(trade) }))
      .filter((row): row is { trade: Trade; pnl: number } => row.pnl !== null);
    const total = completed.length;
    const wins = completed.filter((row) => row.pnl > 0).length;
    const grossWin = completed.filter((row) => row.pnl > 0).reduce((sum, row) => sum + row.pnl, 0);
    const grossLoss = Math.abs(completed.filter((row) => row.pnl < 0).reduce((sum, row) => sum + row.pnl, 0));
    const avgR = total ? trades.reduce((sum, trade) => sum + Number(trade.rr ?? 0), 0) / total : 0;
    const profitFactor = grossLoss > 0 ? grossWin / grossLoss : grossWin > 0 ? Infinity : 0;
    const strategyName = new Map(plan.strategies.map((strategy) => [strategy.id, strategy.name]));

    return {
      total,
      winRate: total ? Math.round((wins / total) * 100) : 0,
      avgR,
      profitFactor,
      drawdown: maxDrawdown(trades),
      strategyRows: groupBy(completed.map((row) => row.trade), (trade) => strategyName.get(trade.strategyId ?? "") ?? "No strategy selected"),
      sessionRows: groupBy(completed.map((row) => row.trade), (trade) => trade.session.toUpperCase()),
      emotionRows: groupBy(completed.map((row) => row.trade), (trade) => trade.emotionBefore ? trade.emotionBefore.replace(/_/g, " ") : "Not tagged"),
      assetRows: groupBy(completed.map((row) => row.trade), (trade) => trade.asset.toUpperCase()),
    };
  }, [plan.strategies, trades]);

  const bestConditions = [
    metrics.sessionRows[0]?.netPnl > 0 ? metrics.sessionRows[0].label : null,
    metrics.assetRows[0]?.netPnl > 0 ? metrics.assetRows[0].label : null,
    metrics.strategyRows[0]?.netPnl > 0 ? metrics.strategyRows[0].label : null,
    metrics.emotionRows[0]?.netPnl > 0 ? metrics.emotionRows[0].label : null,
  ].filter(Boolean) as string[];

  return (
    <div className="space-y-6">
      <PageHeader title="Analytics" subtitle="Deep performance breakdowns from your logged trade journal." />

      {metrics.total === 0 ? (
        <EmptyState
          icon={BarChart3}
          title="No analytics yet"
          description="Log your first trade to unlock win rate, R-multiple, drawdown, session, and strategy analytics."
          action={
            <button
              type="button"
              onClick={openAddTrade}
              className="inline-flex items-center gap-2 rounded-full rb-gradient-primary px-4 py-2 text-xs font-semibold text-white"
            >
              <Plus className="h-3.5 w-3.5" />
              Add trade
            </button>
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatCard label="Win Rate" value={`${metrics.winRate}%`} accent={metrics.winRate >= 50 ? "success" : "warning"} />
            <StatCard label="Avg R" value={`${metrics.avgR >= 0 ? "+" : ""}${metrics.avgR.toFixed(2)}`} accent={metrics.avgR >= 0 ? "success" : "destructive"} />
            <StatCard label="Profit Factor" value={Number.isFinite(metrics.profitFactor) ? metrics.profitFactor.toFixed(2) : "∞"} accent={metrics.profitFactor >= 1 ? "success" : "warning"} />
            <StatCard label="Max Drawdown" value={money(metrics.drawdown)} accent={metrics.drawdown < 0 ? "destructive" : "success"} />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <MetricPanel title="Strategy Performance" rows={metrics.strategyRows} />
            <MetricPanel title="Session Performance" rows={metrics.sessionRows} />
            <MetricPanel title="Emotion Performance" rows={metrics.emotionRows} />
            <MetricPanel title="Asset Performance" rows={metrics.assetRows} />
          </div>

          <Panel title="Best Conditions Engine" action={<Pill tone="primary"><Bot className="h-3 w-3" />Journal</Pill>}>
            {bestConditions.length > 0 ? (
              <>
                <p className="text-sm text-white">Your strongest logged conditions so far:</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {bestConditions.map((condition) => (
                    <Pill key={condition} tone="success">{condition}</Pill>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Keep logging trades to identify your best repeatable conditions.</p>
            )}
          </Panel>
        </>
      )}
    </div>
  );
}
