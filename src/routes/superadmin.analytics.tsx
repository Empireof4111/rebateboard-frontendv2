import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  RadialBarChart,
  RadialBar,
  Legend,
} from "recharts";
import {
  Download,
  RefreshCw,
  Users,
  CheckCircle2,
  Target,
  Sparkles,
} from "lucide-react";
import {
  EmptyState,
  PageHeader,
  Panel,
  StatCard,
} from "@/components/superadmin/AdminUI";
import {
  fetchSuperadminOnboardingAnalytics,
  type OnboardingAnalyticsResponse,
} from "@/lib/superadmin-onboarding-analytics-api";

export const Route = createFileRoute("/superadmin/analytics")({
  component: AnalyticsPage,
});

const COLORS = [
  "#d946ef",
  "#a855f7",
  "#8b5cf6",
  "#6366f1",
  "#3b82f6",
  "#06b6d4",
  "#10b981",
  "#f59e0b",
];

const emptyData: OnboardingAnalyticsResponse = {
  range: 30,
  summary: {
    total: 0,
    completed: 0,
    completionRate: 0,
    topMarket: null,
    topGoal: null,
  },
  trend: [],
  preferredMarkets: [],
  experience: [],
  monthlyVolume: [],
  acquisitionSource: [],
  primaryGoal: [],
  currentPlatform: [],
  countries: [],
  recentSubmissions: [],
};

function toCsvValue(value: string | number | boolean | null | undefined) {
  if (value == null) return "";
  const normalized = String(value).replace(/"/g, '""');
  return /[",\n]/.test(normalized) ? `"${normalized}"` : normalized;
}

function AnalyticsPage() {
  const [range, setRange] = useState<7 | 30 | 90>(30);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<OnboardingAnalyticsResponse>(emptyData);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const next = await fetchSuperadminOnboardingAnalytics(range);
      setData(next);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load onboarding analytics",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [range]);

  const exportCsv = () => {
    const head = [
      "id",
      "email",
      "name",
      "country",
      "submittedAt",
      "completed",
      "goal",
    ];
    const rows = data.recentSubmissions.map((item) => [
      item.id,
      item.email,
      item.name,
      item.country,
      item.submittedAt,
      String(item.completed),
      item.primaryGoal,
    ]);
    const csv = [head, ...rows]
      .map((row) => row.map((cell) => toCsvValue(cell)).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const anchor = document.createElement("a");
    anchor.href = URL.createObjectURL(blob);
    anchor.download = `onboarding-analytics-${Date.now()}.csv`;
    anchor.click();
  };

  return (
    <div>
      <PageHeader
        title="Onboarding Analytics"
        subtitle={`Live insights from backend onboarding records - ${data.summary.total.toLocaleString()} submissions in the last ${range} days`}
        actions={
          <>
            <div className="glass inline-flex rounded-full p-1 text-xs">
              {([7, 30, 90] as const).map((days) => (
                <button
                  key={days}
                  onClick={() => setRange(days)}
                  className={`rounded-full px-3 py-1 font-semibold transition ${range === days ? "bg-white/15 text-white" : "text-muted-foreground hover:text-white"}`}
                >
                  {days}d
                </button>
              ))}
            </div>
            <button
              onClick={() => void load()}
              className="glass-pill inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-white"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}
              /> {" "}
              {loading ? "Refreshing" : "Refresh"}
            </button>
            <button
              onClick={exportCsv}
              className="glass-pill inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-white"
            >
              <Download className="h-3.5 w-3.5" /> Export CSV
            </button>
          </>
        }
      />

      {error ? (
        <div className="mb-4 rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      ) : null}

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard
          label="Total signups"
          value={loading ? "..." : data.summary.total.toLocaleString()}
          delta={`Last ${range} days`}
          tone="up"
        />
        <StatCard
          label="Completed questionnaire"
          value={loading ? "..." : data.summary.completed.toLocaleString()}
          delta={`${data.summary.completionRate}% rate`}
          tone={data.summary.completionRate >= 75 ? "up" : "flat"}
        />
        <StatCard
          label="Top market"
          value={loading ? "..." : data.summary.topMarket?.name ?? "-"}
          delta={`${data.summary.topMarket?.value ?? 0} picks`}
          tone="flat"
        />
        <StatCard
          label="Top goal"
          value={loading ? "..." : data.summary.topGoal?.name ?? "-"}
          delta={`${data.summary.topGoal?.value ?? 0} users`}
          tone="flat"
        />
      </div>

      <Panel title="Daily signups & completions">
        {data.trend.length ? (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={data.trend}
                margin={{ top: 10, right: 16, left: -16, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="gSignups" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#d946ef" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="#d946ef" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gCompleted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.55} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  stroke="rgba(255,255,255,0.06)"
                  strokeDasharray="3 3"
                />
                <XAxis
                  dataKey="date"
                  stroke="rgba(255,255,255,0.4)"
                  fontSize={11}
                  interval="preserveStartEnd"
                />
                <YAxis
                  stroke="rgba(255,255,255,0.4)"
                  fontSize={11}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    background: "#1a0d36",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                />
                <Legend
                  wrapperStyle={{
                    fontSize: 11,
                    color: "rgba(255,255,255,0.7)",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="signups"
                  stroke="#d946ef"
                  strokeWidth={2}
                  fill="url(#gSignups)"
                  name="Signups"
                />
                <Area
                  type="monotone"
                  dataKey="completed"
                  stroke="#06b6d4"
                  strokeWidth={2}
                  fill="url(#gCompleted)"
                  name="Completed"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <EmptyState
            title="No onboarding trend yet"
            description="As users complete signup and onboarding, the trend will appear here."
          />
        )}
      </Panel>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Panel
          title="Preferred markets"
          action={<Pill icon={Target}>multi-select</Pill>}
        >
          {data.preferredMarkets.length ? (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data.preferredMarkets}
                  layout="vertical"
                  margin={{ top: 6, right: 16, left: 4, bottom: 0 }}
                >
                  <CartesianGrid
                    stroke="rgba(255,255,255,0.06)"
                    strokeDasharray="3 3"
                    horizontal={false}
                  />
                  <XAxis
                    type="number"
                    stroke="rgba(255,255,255,0.4)"
                    fontSize={11}
                    allowDecimals={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    stroke="rgba(255,255,255,0.6)"
                    fontSize={11}
                    width={90}
                  />
                  <Tooltip
                    cursor={{ fill: "rgba(255,255,255,0.04)" }}
                    contentStyle={{
                      background: "#1a0d36",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 12,
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="value" radius={[0, 8, 8, 0]} name="Users">
                    {data.preferredMarkets.map((_, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState
              title="No preferred market data yet"
              description="Preferred market selections from onboarding will appear here."
            />
          )}
        </Panel>

        <Panel
          title="Trading experience"
          action={<Pill icon={Users}>distribution</Pill>}
        >
          {data.experience.length ? (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.experience}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={55}
                    outerRadius={95}
                    paddingAngle={3}
                  >
                    {data.experience.map((_, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "#1a0d36",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 12,
                      fontSize: 12,
                    }}
                  />
                  <Legend
                    wrapperStyle={{
                      fontSize: 11,
                      color: "rgba(255,255,255,0.7)",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState
              title="No experience distribution yet"
              description="Trading experience answers will populate this chart."
            />
          )}
        </Panel>

        <Panel title="Monthly trading volume">
          {data.monthlyVolume.length ? (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data.monthlyVolume}
                  margin={{ top: 6, right: 16, left: -16, bottom: 0 }}
                >
                  <CartesianGrid
                    stroke="rgba(255,255,255,0.06)"
                    strokeDasharray="3 3"
                  />
                  <XAxis
                    dataKey="name"
                    stroke="rgba(255,255,255,0.5)"
                    fontSize={11}
                  />
                  <YAxis
                    stroke="rgba(255,255,255,0.4)"
                    fontSize={11}
                    allowDecimals={false}
                  />
                  <Tooltip
                    cursor={{ fill: "rgba(255,255,255,0.04)" }}
                    contentStyle={{
                      background: "#1a0d36",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 12,
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]} name="Users">
                    {data.monthlyVolume.map((_, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState
              title="No volume data yet"
              description="Monthly volume responses will show here once users complete onboarding."
            />
          )}
        </Panel>

        <Panel
          title="How users found us"
          action={<Pill icon={Sparkles}>attribution</Pill>}
        >
          {data.acquisitionSource.length ? (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart
                  innerRadius="20%"
                  outerRadius="95%"
                  data={data.acquisitionSource.map((item, index) => ({
                    ...item,
                    fill: COLORS[index % COLORS.length],
                  }))}
                  startAngle={90}
                  endAngle={-270}
                >
                  <RadialBar background dataKey="value" cornerRadius={6} />
                  <Legend
                    iconSize={8}
                    layout="vertical"
                    verticalAlign="middle"
                    align="right"
                    wrapperStyle={{
                      fontSize: 11,
                      color: "rgba(255,255,255,0.7)",
                    }}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "#1a0d36",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 12,
                      fontSize: 12,
                    }}
                  />
                </RadialBarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState
              title="No acquisition data yet"
              description="Saved acquisition sources will appear here once onboarding submissions are stored."
            />
          )}
        </Panel>

        <Panel title="Primary goal" action={<Pill icon={CheckCircle2}>intent</Pill>}>
          {data.primaryGoal.length ? (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data.primaryGoal}
                  layout="vertical"
                  margin={{ top: 6, right: 16, left: 4, bottom: 0 }}
                >
                  <CartesianGrid
                    stroke="rgba(255,255,255,0.06)"
                    strokeDasharray="3 3"
                    horizontal={false}
                  />
                  <XAxis
                    type="number"
                    stroke="rgba(255,255,255,0.4)"
                    fontSize={11}
                    allowDecimals={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    stroke="rgba(255,255,255,0.6)"
                    fontSize={11}
                    width={130}
                  />
                  <Tooltip
                    cursor={{ fill: "rgba(255,255,255,0.04)" }}
                    contentStyle={{
                      background: "#1a0d36",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 12,
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="value" radius={[0, 8, 8, 0]} name="Users">
                    {data.primaryGoal.map((_, index) => (
                      <Cell
                        key={index}
                        fill={COLORS[(index + 2) % COLORS.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState
              title="No primary-goal data yet"
              description="User intent from onboarding will appear here."
            />
          )}
        </Panel>

        <Panel title="Current platforms in use">
          {data.currentPlatform.length ? (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data.currentPlatform}
                  margin={{ top: 6, right: 16, left: -16, bottom: 0 }}
                >
                  <CartesianGrid
                    stroke="rgba(255,255,255,0.06)"
                    strokeDasharray="3 3"
                  />
                  <XAxis
                    dataKey="name"
                    stroke="rgba(255,255,255,0.5)"
                    fontSize={11}
                  />
                  <YAxis
                    stroke="rgba(255,255,255,0.4)"
                    fontSize={11}
                    allowDecimals={false}
                  />
                  <Tooltip
                    cursor={{ fill: "rgba(255,255,255,0.04)" }}
                    contentStyle={{
                      background: "#1a0d36",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 12,
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]} name="Users">
                    {data.currentPlatform.map((_, index) => (
                      <Cell
                        key={index}
                        fill={COLORS[(index + 4) % COLORS.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState
              title="No platform data yet"
              description="Current platform answers from onboarding will appear here."
            />
          )}
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Panel title="Top countries by signup">
          {data.countries.length ? (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data.countries}
                  margin={{ top: 6, right: 16, left: -16, bottom: 0 }}
                >
                  <CartesianGrid
                    stroke="rgba(255,255,255,0.06)"
                    strokeDasharray="3 3"
                  />
                  <XAxis
                    dataKey="name"
                    stroke="rgba(255,255,255,0.5)"
                    fontSize={11}
                  />
                  <YAxis
                    stroke="rgba(255,255,255,0.4)"
                    fontSize={11}
                    allowDecimals={false}
                  />
                  <Tooltip
                    cursor={{ fill: "rgba(255,255,255,0.04)" }}
                    contentStyle={{
                      background: "#1a0d36",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 12,
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]} name="Users">
                    {data.countries.map((_, index) => (
                      <Cell
                        key={index}
                        fill={COLORS[(index + 1) % COLORS.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState
              title="No country mix yet"
              description="Signups by country will appear here as user records accumulate."
            />
          )}
        </Panel>

        <Panel title="Latest submissions">
          {data.recentSubmissions.length ? (
            <div className="max-h-64 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-[#150829] text-[10px] uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="py-2">User</th>
                    <th>Goal</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentSubmissions.map((item) => (
                    <tr key={item.id} className="border-t border-white/5">
                      <td className="py-2">
                        <div className="font-semibold text-white">
                          {item.name || item.email.split("@")[0]}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          {item.country || "-"}
                        </div>
                      </td>
                      <td className="text-muted-foreground">
                        {item.primaryGoal || "-"}
                      </td>
                      <td>
                        {item.completed ? (
                          <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-300 ring-1 ring-emerald-400/30">
                            complete
                          </span>
                        ) : (
                          <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-300 ring-1 ring-amber-400/30">
                            skipped
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              title="No recent onboarding submissions"
              description="Latest signup questionnaire submissions will show here."
            />
          )}
        </Panel>
      </div>
    </div>
  );
}

function Pill({
  icon: Icon,
  children,
}: {
  icon: typeof Users;
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-semibold text-muted-foreground ring-1 ring-white/10">
      <Icon className="h-3 w-3" /> {children}
    </span>
  );
}
