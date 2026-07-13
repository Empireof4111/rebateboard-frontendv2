import { createFileRoute } from "@tanstack/react-router";
import { EmptyState, PageHeader, Panel, Pill, StatCard } from "@/components/dashboard/Primitives";
import { ShieldCheck, AlertTriangle, ShieldAlert } from "lucide-react";
import { useMemo } from "react";
import { resolveTradeNetPnl, useTrades, useTradingPlan } from "@/lib/trading-plan";

export const Route = createFileRoute("/dashboard/risk")({
  component: RiskPage,
});

function RiskPage() {
  const trades = useTrades();
  const plan = useTradingPlan();
  const metrics = useMemo(() => {
    const now = new Date();
    const today = trades.filter((trade) => new Date(trade.createdAt).toDateString() === now.toDateString());
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - ((now.getDay() + 6) % 7));
    startOfWeek.setHours(0, 0, 0, 0);
    const week = trades.filter((trade) => new Date(trade.createdAt) >= startOfWeek);
    const dailyRisk = today.reduce((sum, trade) => sum + Math.max(0, Number(trade.riskPct || 0)), 0);
    const weeklyPnl = week.reduce((sum, trade) => sum + (resolveTradeNetPnl(trade) ?? 0), 0);
    const violations = today.flatMap((trade) => trade.violations ?? []);
    return { today, dailyRisk, weeklyPnl, violations };
  }, [trades]);

  const safe =
    metrics.violations.length === 0 &&
    metrics.today.length <= plan.rules.maxTradesPerDay &&
    metrics.dailyRisk <= plan.rules.maxDailyLossPct;
  const activeRules = [
    `Max ${plan.rules.maxTradesPerDay} trades per day`,
    `Max ${plan.rules.maxRiskPerTradePct}% risk per trade`,
    `Stop after ${plan.psychology.stopAfterLosses} consecutive losses`,
    ...plan.rules.noTradeConditions,
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Risk Guardrails" subtitle="Live rules and journal-based risk signals." />

      <Panel title="Live Risk State" action={<Pill tone={safe ? "success" : "warning"}>{safe ? "Within plan" : "Review needed"}</Pill>}>
        <div className="flex items-center gap-4">
          <div className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl ${safe ? "bg-success/15 text-success" : "bg-warning/15 text-warning"}`}>
            {safe ? <ShieldCheck className="h-7 w-7" /> : <ShieldAlert className="h-7 w-7" />}
          </div>
          <div className="min-w-0">
            <div className="text-lg font-bold text-white">{safe ? "Trading within your plan" : "A guardrail needs attention"}</div>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              {metrics.today.length} of {plan.rules.maxTradesPerDay} daily trades · {metrics.dailyRisk.toFixed(2)}% risk logged · {metrics.violations.length} violation{metrics.violations.length === 1 ? "" : "s"}
            </p>
          </div>
        </div>
      </Panel>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Daily Trades" value={`${metrics.today.length} / ${plan.rules.maxTradesPerDay}`} accent={metrics.today.length <= plan.rules.maxTradesPerDay ? "success" : "warning"} />
        <StatCard label="Daily Risk" value={`${metrics.dailyRisk.toFixed(2)}%`} hint={`${plan.rules.maxDailyLossPct}% plan limit`} accent={metrics.dailyRisk <= plan.rules.maxDailyLossPct ? "success" : "warning"} />
        <StatCard label="Weekly P&L" value={`${metrics.weeklyPnl >= 0 ? "+" : "−"}$${Math.abs(metrics.weeklyPnl).toFixed(2)}`} accent={metrics.weeklyPnl >= 0 ? "success" : "destructive"} />
        <StatCard label="Violations" value={String(metrics.violations.length)} accent={metrics.violations.length === 0 ? "success" : "warning"} />
      </div>

      <Panel title="Active Rules">
        <ul className="space-y-2 text-xs">
          {activeRules.map((rule) => (
            <li key={rule} className="flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-white/[0.035] px-3 py-2.5">
              <span className="text-white/90">{rule}</span>
              <Pill tone="primary">Active</Pill>
            </li>
          ))}
        </ul>
      </Panel>

      <Panel title="Recent Warnings" action={<AlertTriangle className="h-4 w-4 text-warning" />}>
        {metrics.violations.length > 0 ? (
          <ul className="space-y-2 text-xs">
            {metrics.violations.slice(0, 6).map((warning, index) => (
              <li key={`${warning}-${index}`} className="flex items-start gap-2 rounded-lg bg-warning/10 p-2.5 text-white">
                <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-warning" /> {warning}
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            icon={ShieldCheck}
            title="No risk warnings today"
            description={trades.length ? "Your logged trades are currently within the active plan guardrails." : "Log trades to compare execution against your trading plan."}
          />
        )}
      </Panel>
    </div>
  );
}
