import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
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
import { Download, Filter, RefreshCw, ShieldCheck, TrendingUp } from "lucide-react";
import { DataTable, EmptyState, PageHeader, Panel, Pill, StatCard } from "@/components/superadmin/AdminUI";
import {
  fetchSuperadminJournalAnalytics,
  type JournalAnalyticsResponse,
} from "@/lib/superadmin-journal-analytics-api";

export const Route = createFileRoute("/superadmin/journal-analytics")({
  component: JournalAnalyticsPage,
});

const RANGE_OPTIONS = [7, 30, 90] as const;
const CHART_COLORS = ["#7e4dff", "#7e4dff", "#7e4dff", "#06b6d4", "#10b981", "#f59e0b"];

const emptyData: JournalAnalyticsResponse = {
  dataState: "limited-live",
  note: "",
  filters: {
    range: 30,
    market: "All",
    experience: "All",
    completedOnly: false,
    userId: null,
    availableMarkets: ["All"],
    availableExperiences: ["All"],
    availableTraders: [{ id: 0, label: "All traders" }],
  },
  summary: {
    trackedEntries: 0,
    completedEntries: 0,
    activeTraders: 0,
    netPnl: 0,
    totalFees: 0,
    averageR: 0,
    winRate: 0,
    lossRate: 0,
    profitFactor: 0,
    screenshotsAttached: 0,
    strategiesUsed: 0,
  },
  dailyActivity: [],
  marketMix: [],
  resultMix: [],
  topTraders: [],
  traderBreakdown: null,
};

function toCsvValue(value: string | number | boolean | null | undefined) {
  if (value == null) return "";
  const normalized = String(value).replace(/"/g, '""');
  return /[",\n]/.test(normalized) ? `"${normalized}"` : normalized;
}

function exportCsv(data: JournalAnalyticsResponse) {
  if (typeof window === "undefined") return;

  const rows: string[] = [];
  rows.push("Summary");
  rows.push("metric,value");
  Object.entries(data.summary).forEach(([metric, value]) => {
    rows.push(`${metric},${toCsvValue(value)}`);
  });
  rows.push("");
  rows.push("Daily Activity");
  rows.push("day,netPnl,entries,completed,wins,losses,activeTraders,averageR");
  data.dailyActivity.forEach((row) => {
    rows.push(
      [
        row.day,
        row.netPnl,
        row.entries,
        row.completed,
        row.wins,
        row.losses,
        row.activeTraders,
        row.averageR,
      ]
        .map((value) => toCsvValue(value))
        .join(","),
    );
  });
  rows.push("");
  rows.push("Top Traders");
  rows.push("trader,email,country,entries,completed,netPnl,winRate,averageR,screenshots,lastTradeAt,rrBalance");
  data.topTraders.forEach((row) => {
    rows.push(
      [
        row.trader,
        row.email,
        row.country,
        row.entries,
        row.completed,
        row.netPnl,
        row.winRate,
        row.averageR,
        row.screenshots,
        row.lastTradeAt,
        row.rrBalance,
      ]
        .map((value) => toCsvValue(value))
        .join(","),
    );
  });

  const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `journal-analytics-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  window.URL.revokeObjectURL(url);
}

function JournalAnalyticsPage() {
  const [range, setRange] = useState<(typeof RANGE_OPTIONS)[number]>(30);
  const [market, setMarket] = useState("All");
  const [experience, setExperience] = useState("All");
  const [completedOnly, setCompletedOnly] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<JournalAnalyticsResponse>(emptyData);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const next = await fetchSuperadminJournalAnalytics({
        range,
        market,
        experience,
        completedOnly,
        userId: selectedUserId,
      });
      setData(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load journal analytics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [range, market, experience, completedOnly, selectedUserId]);

  const marketChart = useMemo(
    () => (data.marketMix.length ? data.marketMix : [{ name: "No live data yet", value: 0 }]),
    [data.marketMix],
  );

  const resultChart = useMemo(
    () => (data.resultMix.length ? data.resultMix : [{ name: "No live data yet", value: 0 }]),
    [data.resultMix],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Journal Analytics"
        subtitle="Live admin view of user-posted trading journal entries, performance, discipline signals, and per-trader breakdowns."
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
              onClick={() => void load()}
              className="glass-pill inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-white"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              {loading ? "Refreshing" : "Refresh"}
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => exportCsv(data)}
              className="inline-flex items-center gap-2 rounded-full rb-gradient-primary px-4 py-2 text-sm font-semibold text-white shadow-[0_0_24px_rgba(192,132,252,0.28)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </button>
          </>
        }
      />

      {data.note ? (
        <div className="rounded-2xl border border-cyan-400/25 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-100">
          {data.note}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      ) : null}

      <Panel title="Filters" action={<Filter className="h-3.5 w-3.5 text-violet-300" />} compact>
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
          <FilterSelect
            label="Market"
            value={market}
            options={data.filters.availableMarkets}
            onChange={setMarket}
          />
          <FilterSelect
            label="Experience"
            value={experience}
            options={data.filters.availableExperiences}
            onChange={setExperience}
          />
          <label className="min-w-[220px]">
            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Trader</span>
            <select
              value={selectedUserId}
              onChange={(event) => setSelectedUserId(Number(event.target.value))}
              className="w-full rounded-full border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white outline-none transition focus:border-violet-400/40"
            >
              {data.filters.availableTraders.map((trader) => (
                <option key={trader.id} value={trader.id} className="bg-[var(--rb-bg-elevated)] text-white">
                  {trader.label}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={() => setCompletedOnly((value) => !value)}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${completedOnly ? "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/30" : "bg-white/10 text-white ring-1 ring-white/10"}`}
          >
            <ShieldCheck className="h-4 w-4" />
            {completedOnly ? "Completed trades only" : "All journal entries"}
          </button>
        </div>
      </Panel>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Journal Entries"
          value={loading ? "..." : data.summary.trackedEntries.toLocaleString()}
          delta={`${data.summary.activeTraders.toLocaleString()} traders posted`}
          tone="up"
        />
        <StatCard
          label="Net P&L"
          value={loading ? "..." : `$${data.summary.netPnl.toLocaleString()}`}
          delta={`${data.summary.completedEntries.toLocaleString()} completed entries`}
          tone={data.summary.netPnl > 0 ? "up" : data.summary.netPnl < 0 ? "down" : "flat"}
        />
        <StatCard
          label="Win Rate"
          value={loading ? "..." : `${data.summary.winRate.toLocaleString()}%`}
          delta={`${data.summary.lossRate.toLocaleString()}% loss rate`}
          tone={data.summary.winRate >= 50 ? "up" : "flat"}
        />
        <StatCard
          label="Average R"
          value={loading ? "..." : data.summary.averageR.toLocaleString()}
          delta={`Profit factor ${data.summary.profitFactor.toLocaleString()}`}
          tone={data.summary.averageR > 0 ? "up" : data.summary.averageR < 0 ? "down" : "flat"}
        />
        <StatCard
          label="Strategies Used"
          value={loading ? "..." : data.summary.strategiesUsed.toLocaleString()}
          delta="unique strategy tags"
          tone="flat"
        />
        <StatCard
          label="Screenshots"
          value={loading ? "..." : data.summary.screenshotsAttached.toLocaleString()}
          delta="entries with proof/context"
          tone="flat"
        />
        <StatCard
          label="Journal Markets"
          value={loading ? "..." : data.marketMix.length.toLocaleString()}
          delta={data.marketMix[0]?.name ? `${data.marketMix[0].name} leads` : "No market entries yet"}
          tone="flat"
        />
        <StatCard
          label="Result Segments"
          value={loading ? "..." : data.resultMix.length.toLocaleString()}
          delta={data.resultMix[0]?.name ? `${data.resultMix[0].name} is largest` : "No results yet"}
          tone="flat"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.6fr_0.9fr]">
        <Panel title="Daily trader activity" action={<Pill tone="neutral">last {range} days</Pill>}>
          {data.dailyActivity.length ? (
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.dailyActivity} margin={{ top: 10, right: 18, left: -18, bottom: 0 }}>
                  <defs>
                    <linearGradient id="journalPnl" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7e4dff" stopOpacity={0.5} />
                      <stop offset="95%" stopColor="#7e4dff" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="journalEntries" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.45} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                  <XAxis dataKey="day" stroke="rgba(255,255,255,0.45)" fontSize={11} />
                  <YAxis yAxisId="left" stroke="rgba(255,255,255,0.45)" fontSize={11} />
                  <YAxis yAxisId="right" orientation="right" stroke="rgba(255,255,255,0.45)" fontSize={11} allowDecimals={false} />
                  <Tooltip contentStyle={{ background: "#1a0d36", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 12 }} />
                  <Area yAxisId="left" type="monotone" dataKey="netPnl" stroke="#7e4dff" strokeWidth={2} fill="url(#journalPnl)" name="Net P&L" />
                  <Area yAxisId="right" type="monotone" dataKey="entries" stroke="#06b6d4" strokeWidth={2} fill="url(#journalEntries)" name="Tracked entries" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState
              title="No trader activity in this window"
              description="Once users post trading journal entries in the selected range, this chart will populate."
            />
          )}
        </Panel>

        <Panel title="Journal market mix" action={<Pill tone="neutral">{data.marketMix.length} markets</Pill>}>
          {data.marketMix.length ? (
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={marketChart} margin={{ top: 10, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                  <XAxis dataKey="name" stroke="rgba(255,255,255,0.45)" fontSize={11} />
                  <YAxis stroke="rgba(255,255,255,0.45)" fontSize={11} allowDecimals={false} />
                  <Tooltip contentStyle={{ background: "#1a0d36", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 12 }} />
                  <Bar dataKey="value" radius={[10, 10, 0, 0]}>
                    {marketChart.map((entry, index) => (
                      <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState
              title="No journal market data yet"
              description="This panel uses the market saved on each user-posted journal entry."
            />
          )}
        </Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Panel title="Result mix" action={<Pill tone="neutral">{data.resultMix.length} segments</Pill>}>
          {data.resultMix.length ? (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={resultChart} layout="vertical" margin={{ top: 8, right: 20, left: 10, bottom: 0 }}>
                  <CartesianGrid stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" stroke="rgba(255,255,255,0.45)" fontSize={11} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" stroke="rgba(255,255,255,0.6)" fontSize={11} width={130} />
                  <Tooltip contentStyle={{ background: "#1a0d36", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 12 }} />
                  <Bar dataKey="value" radius={[0, 10, 10, 0]}>
                    {resultChart.map((entry, index) => (
                      <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState
              title="No result mix yet"
              description="Wins, losses, breakeven, and pending outcomes appear here from actual journal entries."
            />
          )}
        </Panel>

        <Panel title="Top active traders" action={<TrendingUp className="h-3.5 w-3.5 text-violet-300" />}>
          {data.topTraders.length ? (
            <DataTable
              head={
                <>
                  <th>Trader</th>
                  <th>Entries</th>
                  <th>Net P&L</th>
                  <th>Win</th>
                </>
              }
            >
              {data.topTraders.map((trader) => (
                <tr key={trader.userId}>
                  <td>
                    <div className="font-semibold text-white">{trader.trader}</div>
                    <div className="text-xs text-muted-foreground">{trader.country} · {trader.screenshots} entries with screenshots</div>
                  </td>
                  <td>
                    <Pill tone="neutral">{trader.entries} / {trader.completed}</Pill>
                  </td>
                  <td className={`font-semibold ${trader.netPnl >= 0 ? "text-emerald-300" : "text-rose-300"}`}>${trader.netPnl.toLocaleString()}</td>
                  <td>
                    <Pill tone={trader.winRate >= 50 ? "good" : "neutral"}>{trader.winRate}%</Pill>
                  </td>
                </tr>
              ))}
            </DataTable>
          ) : (
            <EmptyState
              title="No ranked traders yet"
              description="Top traders will appear here once users post journal entries in the selected range."
            />
          )}
        </Panel>
      </div>

      <Panel title="Selected trader journal breakdown" action={<Pill tone="neutral">{data.traderBreakdown ? data.traderBreakdown.trader : "Choose a trader"}</Pill>}>
        {data.traderBreakdown ? (
          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
              <MiniMetric label="Entries" value={data.traderBreakdown.summary.entries} />
              <MiniMetric label="Completed" value={data.traderBreakdown.summary.completed} />
              <MiniMetric label="Net P&L" value={`$${data.traderBreakdown.summary.netPnl.toLocaleString()}`} />
              <MiniMetric label="Win rate" value={`${data.traderBreakdown.summary.winRate}%`} />
              <MiniMetric label="Average R" value={data.traderBreakdown.summary.averageR} />
              <MiniMetric label="Screenshots" value={data.traderBreakdown.summary.screenshots} />
            </div>
            {data.traderBreakdown.recentTrades.length ? (
              <DataTable
                head={
                  <>
                    <th>Trade</th>
                    <th>Result</th>
                    <th>Net P&L</th>
                    <th>R</th>
                  </>
                }
              >
                {data.traderBreakdown.recentTrades.map((trade) => (
                  <tr key={trade.id}>
                    <td>
                      <div className="font-semibold text-white">{trade.asset}</div>
                      <div className="text-xs text-muted-foreground">{trade.market} · {trade.direction} · {trade.strategy}</div>
                    </td>
                    <td>
                      <Pill tone={trade.netPnl > 0 ? "good" : trade.netPnl < 0 ? "bad" : "neutral"}>{trade.result || trade.outcome}</Pill>
                    </td>
                    <td className={`font-semibold ${trade.netPnl >= 0 ? "text-emerald-300" : "text-rose-300"}`}>${trade.netPnl.toLocaleString()}</td>
                    <td>{trade.rMultiple}</td>
                  </tr>
                ))}
              </DataTable>
            ) : (
              <EmptyState title="No recent trades for this trader" description="This trader has no entries inside the selected range and filters." />
            )}
          </div>
        ) : (
          <EmptyState
            title="Select a trader for individual analytics"
            description="Use the Trader filter above to review one user’s journal totals and most recent entries."
          />
        )}
      </Panel>
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3">
      <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</div>
      <div className="mt-1 text-lg font-semibold text-white">{value}</div>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="min-w-[180px]">
      <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-full border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white outline-none transition focus:border-violet-400/40"
      >
        {options.map((option) => (
          <option key={option} value={option} className="bg-[var(--rb-bg-elevated)] text-white">
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}
