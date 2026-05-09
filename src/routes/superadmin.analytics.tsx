import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, AreaChart, Area, RadialBarChart, RadialBar, Legend,
} from "recharts";
import { Download, Users, CheckCircle2, Target, Sparkles } from "lucide-react";
import { PageHeader, Panel, StatCard } from "@/components/superadmin/AdminUI";
import { toast } from "@/components/superadmin/AdminActions";
import { useAdminCollection } from "@/lib/admin-store";
import {
  type OnboardingSubmission,
  getSubmissions,
  countBy,
  dailyTrend,
  ALL_MARKETS, ALL_EXPERIENCES, ALL_VOLUMES, ALL_SOURCES, ALL_GOALS,
  MARKET_LABEL, EXPERIENCE_LABEL, VOLUME_LABEL, SOURCE_LABEL, GOAL_LABEL,
} from "@/lib/onboarding-analytics";

export const Route = createFileRoute("/superadmin/analytics")({
  component: AnalyticsPage,
});

const COLORS = ["#d946ef", "#a855f7", "#8b5cf6", "#6366f1", "#3b82f6", "#06b6d4", "#10b981", "#f59e0b"];

function AnalyticsPage() {
  const { items } = useAdminCollection<OnboardingSubmission>("onboardingSubmissions", getSubmissions());
  const [range, setRange] = useState<7 | 30 | 90>(30);

  const filtered = useMemo(() => {
    const cutoff = Date.now() - range * 24 * 60 * 60 * 1000;
    return items.filter((r) => new Date(r.submittedAt).getTime() >= cutoff);
  }, [items, range]);

  const total = filtered.length;
  const completed = filtered.filter((r) => r.completed).length;
  const completionRate = total ? Math.round((completed / total) * 100) : 0;

  const trend = useMemo(() => dailyTrend(filtered, range), [filtered, range]);

  // Markets: each user can choose multiple, so flatten before counting.
  const marketsCount = useMemo(() => {
    const out: Record<string, number> = {};
    filtered.forEach((r) => r.answers.preferredMarkets.forEach((m) => { out[m] = (out[m] ?? 0) + 1; }));
    return ALL_MARKETS.map((m) => ({ name: MARKET_LABEL[m], value: out[m] ?? 0 }));
  }, [filtered]);

  const experienceData = useMemo(() => {
    const c = countBy(filtered, (r) => r.answers.tradingExperience ?? null);
    return ALL_EXPERIENCES.map((e) => ({ name: EXPERIENCE_LABEL[e], value: c[e] ?? 0 }));
  }, [filtered]);

  const volumeData = useMemo(() => {
    const c = countBy(filtered, (r) => r.answers.monthlyVolume ?? null);
    return ALL_VOLUMES.map((v) => ({ name: VOLUME_LABEL[v], value: c[v] ?? 0 }));
  }, [filtered]);

  const sourceData = useMemo(() => {
    const c = countBy(filtered, (r) => r.answers.acquisitionSource ?? null);
    return ALL_SOURCES.map((s) => ({ name: SOURCE_LABEL[s], value: c[s] ?? 0 }));
  }, [filtered]);

  const goalData = useMemo(() => {
    const c = countBy(filtered, (r) => r.answers.primaryGoal ?? null);
    return ALL_GOALS
      .map((g) => ({ name: GOAL_LABEL[g], value: c[g] ?? 0 }))
      .sort((a, b) => b.value - a.value);
  }, [filtered]);

  const platformData = useMemo(() => {
    const c: Record<string, number> = {};
    filtered.forEach((r) => {
      const p = (r.answers.currentPlatform || "—").trim() || "—";
      c[p] = (c[p] ?? 0) + 1;
    });
    return Object.entries(c)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [filtered]);

  const countryData = useMemo(() => {
    const c: Record<string, number> = {};
    filtered.forEach((r) => {
      const k = r.country || "—";
      c[k] = (c[k] ?? 0) + 1;
    });
    return Object.entries(c)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [filtered]);

  const topMarket = [...marketsCount].sort((a, b) => b.value - a.value)[0];
  const topGoal = goalData[0];

  const exportCsv = () => {
    const head = ["id", "email", "fullName", "country", "submittedAt", "completed", "markets", "platform", "experience", "monthlyVolume", "source", "goal"];
    const rows = filtered.map((r) => [
      r.id, r.email, r.fullName ?? "", r.country ?? "", r.submittedAt, String(r.completed),
      r.answers.preferredMarkets.join("|"), r.answers.currentPlatform,
      r.answers.tradingExperience ?? "", r.answers.monthlyVolume ?? "",
      r.answers.acquisitionSource ?? "", r.answers.primaryGoal ?? "",
    ]);
    const csv = [head, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `onboarding-${Date.now()}.csv`;
    a.click();
    toast.success(`Exported ${filtered.length} submissions`);
  };

  return (
    <div>
      <PageHeader
        title="Onboarding Analytics"
        subtitle={`Live insights from the signup questionnaire · ${total.toLocaleString()} submissions in the last ${range} days`}
        actions={
          <>
            <div className="glass inline-flex rounded-full p-1 text-xs">
              {([7, 30, 90] as const).map((d) => (
                <button
                  key={d}
                  onClick={() => setRange(d)}
                  className={`rounded-full px-3 py-1 font-semibold transition ${range === d ? "bg-white/15 text-white" : "text-muted-foreground hover:text-white"}`}
                >
                  {d}d
                </button>
              ))}
            </div>
            <button onClick={exportCsv} className="glass-pill inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-white">
              <Download className="h-3.5 w-3.5" /> Export CSV
            </button>
          </>
        }
      />

      {/* KPI strip */}
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Total signups" value={total.toLocaleString()} delta={`Last ${range} days`} tone="up" />
        <StatCard label="Completed questionnaire" value={completed.toLocaleString()} delta={`${completionRate}% rate`} tone={completionRate >= 75 ? "up" : "flat"} />
        <StatCard label="Top market" value={topMarket?.name ?? "—"} delta={`${topMarket?.value ?? 0} picks`} tone="flat" />
        <StatCard label="Top goal" value={topGoal?.name ?? "—"} delta={`${topGoal?.value ?? 0} users`} tone="flat" />
      </div>

      {/* Trend area */}
      <Panel title="Daily signups & completions">
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trend} margin={{ top: 10, right: 16, left: -16, bottom: 0 }}>
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
              <CartesianGrid stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
              <XAxis dataKey="date" stroke="rgba(255,255,255,0.4)" fontSize={11} interval="preserveStartEnd" />
              <YAxis stroke="rgba(255,255,255,0.4)" fontSize={11} allowDecimals={false} />
              <Tooltip contentStyle={{ background: "#1a0d36", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11, color: "rgba(255,255,255,0.7)" }} />
              <Area type="monotone" dataKey="signups" stroke="#d946ef" strokeWidth={2} fill="url(#gSignups)" name="Signups" />
              <Area type="monotone" dataKey="completed" stroke="#06b6d4" strokeWidth={2} fill="url(#gCompleted)" name="Completed" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Panel>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {/* Preferred markets — bar */}
        <Panel title="Preferred markets" action={<Pill icon={Target}>multi-select</Pill>}>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={marketsCount} layout="vertical" margin={{ top: 6, right: 16, left: 4, bottom: 0 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" stroke="rgba(255,255,255,0.4)" fontSize={11} allowDecimals={false} />
                <YAxis type="category" dataKey="name" stroke="rgba(255,255,255,0.6)" fontSize={11} width={90} />
                <Tooltip cursor={{ fill: "rgba(255,255,255,0.04)" }} contentStyle={{ background: "#1a0d36", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 12 }} />
                <Bar dataKey="value" radius={[0, 8, 8, 0]} name="Users">
                  {marketsCount.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        {/* Experience — donut */}
        <Panel title="Trading experience" action={<Pill icon={Users}>distribution</Pill>}>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={experienceData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={95} paddingAngle={3}>
                  {experienceData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "#1a0d36", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11, color: "rgba(255,255,255,0.7)" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        {/* Monthly volume — bar */}
        <Panel title="Monthly trading volume">
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={volumeData} margin={{ top: 6, right: 16, left: -16, bottom: 0 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" fontSize={11} />
                <YAxis stroke="rgba(255,255,255,0.4)" fontSize={11} allowDecimals={false} />
                <Tooltip cursor={{ fill: "rgba(255,255,255,0.04)" }} contentStyle={{ background: "#1a0d36", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 12 }} />
                <Bar dataKey="value" radius={[8, 8, 0, 0]} name="Users">
                  {volumeData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        {/* Acquisition — radial */}
        <Panel title="How users found us" action={<Pill icon={Sparkles}>attribution</Pill>}>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart innerRadius="20%" outerRadius="95%" data={sourceData.map((d, i) => ({ ...d, fill: COLORS[i % COLORS.length] }))} startAngle={90} endAngle={-270}>
                <RadialBar background dataKey="value" cornerRadius={6} />
                <Legend iconSize={8} layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{ fontSize: 11, color: "rgba(255,255,255,0.7)" }} />
                <Tooltip contentStyle={{ background: "#1a0d36", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 12 }} />
              </RadialBarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        {/* Primary goal — horizontal bar */}
        <Panel title="Primary goal" action={<Pill icon={CheckCircle2}>intent</Pill>}>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={goalData} layout="vertical" margin={{ top: 6, right: 16, left: 4, bottom: 0 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" stroke="rgba(255,255,255,0.4)" fontSize={11} allowDecimals={false} />
                <YAxis type="category" dataKey="name" stroke="rgba(255,255,255,0.6)" fontSize={11} width={130} />
                <Tooltip cursor={{ fill: "rgba(255,255,255,0.04)" }} contentStyle={{ background: "#1a0d36", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 12 }} />
                <Bar dataKey="value" radius={[0, 8, 8, 0]} name="Users">
                  {goalData.map((_, i) => <Cell key={i} fill={COLORS[(i + 2) % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        {/* Platforms — bar */}
        <Panel title="Current platforms in use">
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={platformData} margin={{ top: 6, right: 16, left: -16, bottom: 0 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" fontSize={11} />
                <YAxis stroke="rgba(255,255,255,0.4)" fontSize={11} allowDecimals={false} />
                <Tooltip cursor={{ fill: "rgba(255,255,255,0.04)" }} contentStyle={{ background: "#1a0d36", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 12 }} />
                <Bar dataKey="value" radius={[8, 8, 0, 0]} name="Users">
                  {platformData.map((_, i) => <Cell key={i} fill={COLORS[(i + 4) % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        {/* Top countries */}
        <Panel title="Top countries by signup">
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={countryData} margin={{ top: 6, right: 16, left: -16, bottom: 0 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" fontSize={11} />
                <YAxis stroke="rgba(255,255,255,0.4)" fontSize={11} allowDecimals={false} />
                <Tooltip cursor={{ fill: "rgba(255,255,255,0.04)" }} contentStyle={{ background: "#1a0d36", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 12 }} />
                <Bar dataKey="value" radius={[8, 8, 0, 0]} name="Users">
                  {countryData.map((_, i) => <Cell key={i} fill={COLORS[(i + 1) % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        {/* Recent submissions */}
        <Panel title="Latest submissions">
          <div className="max-h-64 overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-[#150829] text-[10px] uppercase tracking-wider text-muted-foreground">
                <tr><th className="py-2">User</th><th>Goal</th><th>Status</th></tr>
              </thead>
              <tbody>
                {[...filtered].sort((a, b) => b.submittedAt.localeCompare(a.submittedAt)).slice(0, 12).map((r) => (
                  <tr key={r.id} className="border-t border-white/5">
                    <td className="py-2">
                      <div className="font-semibold text-white">{r.fullName || r.email.split("@")[0]}</div>
                      <div className="text-[10px] text-muted-foreground">{r.country ?? "—"}</div>
                    </td>
                    <td className="text-muted-foreground">{r.answers.primaryGoal ? GOAL_LABEL[r.answers.primaryGoal] : "—"}</td>
                    <td>
                      {r.completed
                        ? <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-300 ring-1 ring-emerald-400/30">complete</span>
                        : <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-300 ring-1 ring-amber-400/30">skipped</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
    </div>
  );
}

function Pill({ icon: Icon, children }: { icon: typeof Users; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-semibold text-muted-foreground ring-1 ring-white/10">
      <Icon className="h-3 w-3" /> {children}
    </span>
  );
}
