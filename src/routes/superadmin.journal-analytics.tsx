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
const CHART_COLORS = ["#d946ef", "#a855f7", "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b"];

const emptyData: JournalAnalyticsResponse = {
  dataState: "limited-live",
  note: "",
  filters: {
    range: 30,
    market: "All",
    experience: "All",
    withPlanOnly: false,
    availableMarkets: ["All"],
    availableExperiences: ["All"],
  },
  summary: {
    trackedEntries: 0,
    rebateEarned: 0,
    commissionTracked: 0,
    volumeLots: 0,
    activeTraders: 0,
    academyPlanners: 0,
    academyCompleted: 0,
    averageRrBalance: 0,
    pendingClaims: 0,
  },
  dailyActivity: [],
  marketMix: [],
  experienceMix: [],
  topTraders: [],
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
  rows.push("day,rebateEarned,commissionTracked,entries,activeTraders,academyEnrollments");
  data.dailyActivity.forEach((row) => {
    rows.push(
      [
        row.day,
        row.rebateEarned,
        row.commissionTracked,
        row.entries,
        row.activeTraders,
        row.academyEnrollments,
      ]
        .map((value) => toCsvValue(value))
        .join(","),
    );
  });
  rows.push("");
  rows.push("Top Traders");
  rows.push("trader,email,country,entries,rebateEarned,commissionTracked,volumeLots,rrBalance,academyCourses");
  data.topTraders.forEach((row) => {
    rows.push(
      [
        row.trader,
        row.email,
        row.country,
        row.entries,
        row.rebateEarned,
        row.commissionTracked,
        row.volumeLots,
        row.rrBalance,
        row.academyCourses,
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
  const [withPlanOnly, setWithPlanOnly] = useState(false);
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
        withPlanOnly,
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
  }, [range, market, experience, withPlanOnly]);

  const marketChart = useMemo(
    () => (data.marketMix.length ? data.marketMix : [{ name: "No live data yet", value: 0 }]),
    [data.marketMix],
  );

  const experienceChart = useMemo(
    () => (data.experienceMix.length ? data.experienceMix : [{ name: "No live data yet", value: 0 }]),
    [data.experienceMix],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Journal Analytics"
        subtitle="Live trader-activity view powered by cashback entries, onboarding preferences, RR balances, and academy progress."
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

      <Panel title="Filters" action={<Filter className="h-3.5 w-3.5 text-fuchsia-300" />} compact>
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
          <button
            type="button"
            onClick={() => setWithPlanOnly((value) => !value)}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${withPlanOnly ? "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/30" : "bg-white/10 text-white ring-1 ring-white/10"}`}
          >
            <ShieldCheck className="h-4 w-4" />
            {withPlanOnly ? "Academy planners only" : "All profiles"}
          </button>
        </div>
      </Panel>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Tracked Entries"
          value={loading ? "..." : data.summary.trackedEntries.toLocaleString()}
          delta={`${data.summary.activeTraders.toLocaleString()} active traders`}
          tone="up"
        />
        <StatCard
          label="Rebate Earned"
          value={loading ? "..." : `$${data.summary.rebateEarned.toLocaleString()}`}
          delta={`$${data.summary.commissionTracked.toLocaleString()} tracked commission`}
          tone="up"
        />
        <StatCard
          label="Volume Lots"
          value={loading ? "..." : data.summary.volumeLots.toLocaleString()}
          delta="live cashback ledger"
          tone="flat"
        />
        <StatCard
          label="Average RR Balance"
          value={loading ? "..." : data.summary.averageRrBalance.toLocaleString()}
          delta="per filtered profile"
          tone="flat"
        />
        <StatCard
          label="Academy Planners"
          value={loading ? "..." : data.summary.academyPlanners.toLocaleString()}
          delta={`${data.summary.academyCompleted.toLocaleString()} completed final exam`}
          tone="up"
        />
        <StatCard
          label="Pending Claims"
          value={loading ? "..." : data.summary.pendingClaims.toLocaleString()}
          delta="filtered trader cohort"
          tone={data.summary.pendingClaims > 0 ? "down" : "flat"}
        />
        <StatCard
          label="Market Signals"
          value={loading ? "..." : data.marketMix.length.toLocaleString()}
          delta={data.marketMix[0]?.name ? `${data.marketMix[0].name} leads` : "No preference signals yet"}
          tone="flat"
        />
        <StatCard
          label="Experience Segments"
          value={loading ? "..." : data.experienceMix.length.toLocaleString()}
          delta={data.experienceMix[0]?.name ? `${data.experienceMix[0].name} is largest` : "No experience data yet"}
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
                    <linearGradient id="journalRebate" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#d946ef" stopOpacity={0.5} />
                      <stop offset="95%" stopColor="#d946ef" stopOpacity={0} />
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
                  <Area yAxisId="left" type="monotone" dataKey="rebateEarned" stroke="#d946ef" strokeWidth={2} fill="url(#journalRebate)" name="Rebate earned" />
                  <Area yAxisId="right" type="monotone" dataKey="entries" stroke="#06b6d4" strokeWidth={2} fill="url(#journalEntries)" name="Tracked entries" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState
              title="No trader activity in this window"
              description="Once cashback entries or academy enrollments land in the selected range, this chart will populate."
            />
          )}
        </Panel>

        <Panel title="Market preference mix" action={<Pill tone="neutral">{data.marketMix.length} live signals</Pill>}>
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
              title="No market preference data yet"
              description="This panel uses saved onboarding and trading-preference signals from user profiles."
            />
          )}
        </Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Panel title="Experience mix" action={<Pill tone="neutral">{data.experienceMix.length} segments</Pill>}>
          {data.experienceMix.length ? (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={experienceChart} layout="vertical" margin={{ top: 8, right: 20, left: 10, bottom: 0 }}>
                  <CartesianGrid stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" stroke="rgba(255,255,255,0.45)" fontSize={11} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" stroke="rgba(255,255,255,0.6)" fontSize={11} width={130} />
                  <Tooltip contentStyle={{ background: "#1a0d36", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 12 }} />
                  <Bar dataKey="value" radius={[0, 10, 10, 0]}>
                    {experienceChart.map((entry, index) => (
                      <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState
              title="No experience mix yet"
              description="Trader experience distribution appears here once users complete onboarding profile fields."
            />
          )}
        </Panel>

        <Panel title="Top active traders" action={<TrendingUp className="h-3.5 w-3.5 text-fuchsia-300" />}>
          {data.topTraders.length ? (
            <DataTable
              head={
                <>
                  <th>Trader</th>
                  <th>Entries</th>
                  <th>Rebate</th>
                  <th>RR</th>
                </>
              }
            >
              {data.topTraders.map((trader) => (
                <tr key={trader.userId}>
                  <td>
                    <div className="font-semibold text-white">{trader.trader}</div>
                    <div className="text-xs text-muted-foreground">{trader.country} · {trader.academyCourses} academy courses</div>
                  </td>
                  <td>
                    <Pill tone="neutral">{trader.entries}</Pill>
                  </td>
                  <td className="font-semibold text-emerald-300">${trader.rebateEarned.toLocaleString()}</td>
                  <td>
                    <Pill tone={trader.rrBalance > 0 ? "good" : "neutral"}>{trader.rrBalance.toLocaleString()}</Pill>
                  </td>
                </tr>
              ))}
            </DataTable>
          ) : (
            <EmptyState
              title="No ranked traders yet"
              description="Top traders will appear here once filtered users accumulate cashback entries."
            />
          )}
        </Panel>
      </div>
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
        className="w-full rounded-full border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white outline-none transition focus:border-fuchsia-400/40"
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
