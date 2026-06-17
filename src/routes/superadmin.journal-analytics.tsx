import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  CartesianGrid,
  Cell,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Download, Filter, ShieldCheck, Target, TrendingUp } from "lucide-react";
import { DataTable, PageHeader, Panel, Pill, StatCard } from "@/components/superadmin/AdminUI";
import { toast } from "@/components/superadmin/AdminActions";

export const Route = createFileRoute("/superadmin/journal-analytics")({
  component: JournalAnalyticsPage,
});

type Market = "Forex" | "Crypto" | "Indices" | "Futures";
type Session = "London" | "New York" | "Asia";
type Experience = "Beginner" | "Intermediate" | "Advanced" | "Pro";
type JournalRow = {
  day: string;
  pnl: number;
  adherence: number;
  planTrades: number;
  offPlanTrades: number;
  market: Market;
  session: Session;
  experience: Experience;
  trader: string;
  strategy: string;
  violations: number;
  hasPlan: boolean;
  rr: number;
  premiumPlanner: boolean;
};

const JOURNAL_ROWS: JournalRow[] = [
  { day: "Jun 01", pnl: 18240, adherence: 76, planTrades: 42, offPlanTrades: 9, market: "Forex", session: "London", experience: "Advanced", trader: "Aiden Park", strategy: "Breakout", violations: 11, hasPlan: true, rr: 2.6, premiumPlanner: true },
  { day: "Jun 04", pnl: 22100, adherence: 81, planTrades: 48, offPlanTrades: 8, market: "Forex", session: "New York", experience: "Pro", trader: "Marta Silva", strategy: "Trend Continuation", violations: 7, hasPlan: true, rr: 2.8, premiumPlanner: true },
  { day: "Jun 08", pnl: 16440, adherence: 68, planTrades: 36, offPlanTrades: 13, market: "Crypto", session: "Asia", experience: "Intermediate", trader: "Liam O'Connor", strategy: "Mean Reversion", violations: 19, hasPlan: true, rr: 2.1, premiumPlanner: false },
  { day: "Jun 11", pnl: 27850, adherence: 84, planTrades: 53, offPlanTrades: 7, market: "Futures", session: "New York", experience: "Pro", trader: "Yuki Tanaka", strategy: "Opening Range", violations: 6, hasPlan: true, rr: 3.1, premiumPlanner: true },
  { day: "Jun 15", pnl: 12990, adherence: 61, planTrades: 31, offPlanTrades: 17, market: "Indices", session: "London", experience: "Beginner", trader: "Hassan Ali", strategy: "Pullback", violations: 27, hasPlan: false, rr: 1.7, premiumPlanner: false },
  { day: "Jun 18", pnl: 30480, adherence: 88, planTrades: 58, offPlanTrades: 5, market: "Forex", session: "London", experience: "Advanced", trader: "Elena Rossi", strategy: "Breakout", violations: 5, hasPlan: true, rr: 3.2, premiumPlanner: true },
  { day: "Jun 22", pnl: 24820, adherence: 73, planTrades: 44, offPlanTrades: 11, market: "Crypto", session: "New York", experience: "Intermediate", trader: "Noah Becker", strategy: "Trend Continuation", violations: 14, hasPlan: true, rr: 2.4, premiumPlanner: false },
  { day: "Jun 26", pnl: 35160, adherence: 91, planTrades: 64, offPlanTrades: 4, market: "Futures", session: "New York", experience: "Pro", trader: "Sofia Lopez", strategy: "Opening Range", violations: 4, hasPlan: true, rr: 3.4, premiumPlanner: true },
  { day: "Jun 30", pnl: 28490, adherence: 79, planTrades: 47, offPlanTrades: 9, market: "Forex", session: "London", experience: "Advanced", trader: "James Carter", strategy: "Pullback", violations: 8, hasPlan: true, rr: 2.5, premiumPlanner: false },
  { day: "Jul 03", pnl: 19410, adherence: 66, planTrades: 34, offPlanTrades: 15, market: "Indices", session: "Asia", experience: "Intermediate", trader: "Priya Nair", strategy: "Scalp Reversal", violations: 18, hasPlan: false, rr: 1.9, premiumPlanner: false },
  { day: "Jul 07", pnl: 32620, adherence: 87, planTrades: 60, offPlanTrades: 6, market: "Futures", session: "New York", experience: "Pro", trader: "Aiden Park", strategy: "Opening Range", violations: 5, hasPlan: true, rr: 3.0, premiumPlanner: true },
  { day: "Jul 11", pnl: 29210, adherence: 82, planTrades: 49, offPlanTrades: 8, market: "Crypto", session: "Asia", experience: "Advanced", trader: "Marta Silva", strategy: "Trend Continuation", violations: 9, hasPlan: true, rr: 2.7, premiumPlanner: true },
];

const RANGE_OPTIONS = [7, 30, 90] as const;
const MARKET_OPTIONS = ["All", "Forex", "Crypto", "Indices", "Futures"] as const;
const SESSION_OPTIONS = ["All", "London", "New York", "Asia"] as const;
const EXPERIENCE_OPTIONS = ["All", "Beginner", "Intermediate", "Advanced", "Pro"] as const;
const CHART_COLORS = ["#d946ef", "#a855f7", "#8b5cf6", "#06b6d4", "#10b981"];

function JournalAnalyticsPage() {
  const [range, setRange] = useState<(typeof RANGE_OPTIONS)[number]>(30);
  const [market, setMarket] = useState<(typeof MARKET_OPTIONS)[number]>("All");
  const [session, setSession] = useState<(typeof SESSION_OPTIONS)[number]>("All");
  const [experience, setExperience] = useState<(typeof EXPERIENCE_OPTIONS)[number]>("All");
  const [withPlanOnly, setWithPlanOnly] = useState(true);

  const rows = useMemo(() => {
    const slice = JOURNAL_ROWS.slice(-Math.min(JOURNAL_ROWS.length, Math.max(3, Math.ceil(range / 7))));

    return slice.filter((row) => {
      const marketMatch = market === "All" || row.market === market;
      const sessionMatch = session === "All" || row.session === session;
      const experienceMatch = experience === "All" || row.experience === experience;
      const planMatch = !withPlanOnly || row.hasPlan;
      return marketMatch && sessionMatch && experienceMatch && planMatch;
    });
  }, [experience, market, range, session, withPlanOnly]);

  const metrics = useMemo(() => {
    const journaledTrades = rows.reduce((sum, row) => sum + row.planTrades + row.offPlanTrades, 0);
    const netPnl = rows.reduce((sum, row) => sum + row.pnl, 0);
    const planAdherence = rows.length > 0 ? Math.round(rows.reduce((sum, row) => sum + row.adherence, 0) / rows.length) : 0;
    const avgRr = rows.length > 0 ? rows.reduce((sum, row) => sum + row.rr, 0) / rows.length : 0;
    const traders = new Set(rows.map((row) => row.trader));
    const planners = rows.filter((row) => row.hasPlan).length;
    const strategies = new Set(rows.map((row) => row.strategy));
    const violations = rows.reduce((sum, row) => sum + row.violations, 0);
    const premiumPlanners = rows.filter((row) => row.premiumPlanner).length;

    return {
      journaledTrades,
      netPnl,
      planAdherence,
      avgRr,
      traders: traders.size,
      planners,
      strategies: strategies.size,
      violations,
      premiumPlanners,
      coverage: traders.size > 0 ? Math.round((planners / rows.length) * 100) : 0,
    };
  }, [rows]);

  const planBreakdown = useMemo(() => {
    const totalPlan = rows.reduce((sum, row) => sum + row.planTrades, 0);
    const totalOffPlan = rows.reduce((sum, row) => sum + row.offPlanTrades, 0);
    return [
      { name: "Plan-aligned", value: totalPlan },
      { name: "Off-plan", value: totalOffPlan },
    ];
  }, [rows]);

  const strategyUsage = useMemo(() => {
    const totals = new Map<string, number>();
    rows.forEach((row) => {
      totals.set(row.strategy, (totals.get(row.strategy) ?? 0) + row.planTrades + row.offPlanTrades);
    });

    return [...totals.entries()]
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [rows]);

  const topTraders = useMemo(() => {
    const totals = new Map<string, { pnl: number; adherence: number; violations: number; trades: number }>();

    rows.forEach((row) => {
      const current = totals.get(row.trader) ?? { pnl: 0, adherence: 0, violations: 0, trades: 0 };
      current.pnl += row.pnl;
      current.adherence += row.adherence;
      current.violations += row.violations;
      current.trades += row.planTrades + row.offPlanTrades;
      totals.set(row.trader, current);
    });

    return [...totals.entries()]
      .map(([name, value]) => ({
        trader: name,
        pnl: value.pnl,
        adherence: Math.round(value.adherence / rows.filter((row) => row.trader === name).length),
        violations: value.violations,
        trades: value.trades,
      }))
      .sort((a, b) => b.pnl - a.pnl)
      .slice(0, 6);
  }, [rows]);

  const exportCsv = () => {
    toast.success(`Export started for ${rows.length} journal summaries`);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Journal Analytics"
        subtitle="Plan to strategy to trade - the full loop, aggregated across every trader."
        actions={
          <>
            <div className="glass inline-flex rounded-full p-1 text-xs">
              {RANGE_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setRange(option)}
                  className={`rounded-full px-3 py-1 font-semibold transition ${range === option ? "bg-white/15 text-white" : "text-muted-foreground hover:text-white"}`}
                >
                  {option}d
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={exportCsv}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-[0_0_24px_rgba(192,132,252,0.28)]"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </button>
          </>
        }
      />

      <Panel title="Filters" action={<Filter className="h-3.5 w-3.5 text-fuchsia-300" />} compact>
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
          <FilterSelect label="Market" value={market} options={MARKET_OPTIONS} onChange={setMarket} />
          <FilterSelect label="Session" value={session} options={SESSION_OPTIONS} onChange={setSession} />
          <FilterSelect label="Experience" value={experience} options={EXPERIENCE_OPTIONS} onChange={setExperience} />
          <button
            type="button"
            onClick={() => setWithPlanOnly((value) => !value)}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${withPlanOnly ? "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/30" : "bg-white/10 text-white ring-1 ring-white/10"}`}
          >
            <ShieldCheck className="h-4 w-4" />
            {withPlanOnly ? "With plan only" : "All traders"}
          </button>
        </div>
      </Panel>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Journaled Trades" value={metrics.journaledTrades.toLocaleString()} delta={`${metrics.traders} traders`} tone="up" />
        <StatCard label="Net PnL" value={`$${metrics.netPnl.toLocaleString()}.00`} delta={`${Math.round(metrics.avgRr * 28)}% win-rate equivalent`} tone="up" />
        <StatCard label="Plan Adherence" value={`${metrics.planAdherence}%`} delta={`avg RR ${metrics.avgRr.toFixed(2)}`} tone={metrics.planAdherence >= 75 ? "up" : "flat"} />
        <StatCard label="Strategy Usage" value={`${metrics.strategies}`} delta={`${strategyUsage[0]?.name ?? "No strategy"} leads`} tone="flat" />
        <StatCard label="Traders With A Plan" value={`${metrics.planners}/${rows.length}`} delta={`${metrics.coverage}% coverage`} tone="up" />
        <StatCard label="Avg Strategies / Planner" value={rows.length > 0 ? (metrics.strategies / Math.max(metrics.planners, 1)).toFixed(1) : "0.0"} delta="portfolio depth" tone="flat" />
        <StatCard label="Violations (Period)" value={String(metrics.violations)} delta="rule breaks logged" tone={metrics.violations > 60 ? "down" : "flat"} />
        <StatCard label="Premium Planners" value={String(metrics.premiumPlanners)} delta="paid trading-plan users" tone="flat" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.6fr_0.9fr]">
        <Panel title="Daily PnL & adherence" action={<Pill tone="neutral">last {range} days</Pill>}>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={rows} margin={{ top: 10, right: 18, left: -18, bottom: 0 }}>
                <defs>
                  <linearGradient id="journalPnl" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#d946ef" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#d946ef" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="journalAdherence" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                <XAxis dataKey="day" stroke="rgba(255,255,255,0.45)" fontSize={11} />
                <YAxis yAxisId="left" stroke="rgba(255,255,255,0.45)" fontSize={11} />
                <YAxis yAxisId="right" orientation="right" stroke="rgba(255,255,255,0.45)" fontSize={11} domain={[0, 100]} />
                <Tooltip contentStyle={{ background: "#1a0d36", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 12 }} />
                <Area yAxisId="left" type="monotone" dataKey="pnl" stroke="#d946ef" strokeWidth={2} fill="url(#journalPnl)" name="Net PnL" />
                <Area yAxisId="right" type="monotone" dataKey="adherence" stroke="#06b6d4" strokeWidth={2} fill="url(#journalAdherence)" name="Adherence %" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Plan vs off-plan" action={<Target className="h-3.5 w-3.5 text-fuchsia-300" />}>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={planBreakdown} margin={{ top: 10, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                <XAxis dataKey="name" stroke="rgba(255,255,255,0.45)" fontSize={11} />
                <YAxis stroke="rgba(255,255,255,0.45)" fontSize={11} allowDecimals={false} />
                <Tooltip contentStyle={{ background: "#1a0d36", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 12 }} />
                <Bar dataKey="value" radius={[10, 10, 0, 0]}>
                  {planBreakdown.map((entry, index) => (
                    <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Panel title="Strategy usage" action={<Pill tone="neutral">{strategyUsage.length} active strategies</Pill>}>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={strategyUsage} layout="vertical" margin={{ top: 8, right: 20, left: 10, bottom: 0 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" stroke="rgba(255,255,255,0.45)" fontSize={11} allowDecimals={false} />
                <YAxis type="category" dataKey="name" stroke="rgba(255,255,255,0.6)" fontSize={11} width={130} />
                <Tooltip contentStyle={{ background: "#1a0d36", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 12 }} />
                <Bar dataKey="value" radius={[0, 10, 10, 0]}>
                  {strategyUsage.map((entry, index) => (
                    <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Top traders this period" action={<TrendingUp className="h-3.5 w-3.5 text-fuchsia-300" />}>
          <DataTable
            head={
              <>
                <th>Trader</th>
                <th>PnL</th>
                <th>Adherence</th>
                <th>Violations</th>
              </>
            }
          >
            {topTraders.map((trader) => (
              <tr key={trader.trader}>
                <td>
                  <div className="font-semibold text-white">{trader.trader}</div>
                  <div className="text-xs text-muted-foreground">{trader.trades} trades</div>
                </td>
                <td className="font-semibold text-emerald-300">${trader.pnl.toLocaleString()}</td>
                <td>
                  <Pill tone={trader.adherence >= 75 ? "good" : "warn"}>{trader.adherence}%</Pill>
                </td>
                <td>
                  <Pill tone={trader.violations > 12 ? "bad" : "neutral"}>{trader.violations}</Pill>
                </td>
              </tr>
            ))}
          </DataTable>
        </Panel>
      </div>
    </div>
  );
}

function FilterSelect<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: readonly T[];
  onChange: (value: T) => void;
}) {
  return (
    <label className="min-w-[160px]">
      <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
        className="w-full rounded-full border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white outline-none transition focus:border-fuchsia-400/40"
      >
        {options.map((option) => (
          <option key={option} value={option} className="bg-[#150829] text-white">
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}
