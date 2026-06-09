import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, AreaChart, Area, RadialBarChart, RadialBar, Legend,
} from "recharts";
import { Users, CheckCircle2, Target, Sparkles, Globe, TrendingUp } from "lucide-react";
import { PageHeader, Panel, StatCard } from "@/components/superadmin/AdminUI";
import { useAuth } from "@/lib/auth";
import { financeApi } from "@/lib/finance-api";

export const Route = createFileRoute("/superadmin/analytics")({
  component: AnalyticsPage,
});

const COLORS = ["#d946ef", "#a855f7", "#8b5cf6", "#6366f1", "#3b82f6", "#06b6d4", "#10b981", "#f59e0b"];

type PlatformStats = {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  suspendedUsers: number;
  brokers: number;
  exchangers: number;
  propfirms: number;
  totalCredit: number;
  totalDebit: number;
};

type UserStats = {
  totalUsers: number;
  byCountry: { name: string; value: number }[];
  byExperience: { name: string; value: number }[];
  bySource: { name: string; value: number }[];
  byAsset: { name: string; value: number }[];
  byStatus: { name: string; value: number }[];
  signupTrend: { month: string; count: number }[];
};

function AnalyticsPage() {
  const { token } = useAuth();
  const [platform, setPlatform] = useState<PlatformStats | null>(null);
  const [users, setUsers] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    Promise.all([
      financeApi.getAnalytics(token),
      financeApi.getUserAnalytics(token),
    ]).then(([p, u]) => {
      if (p.success) setPlatform(p.payload as PlatformStats);
      if (u.success) setUsers(u.payload as UserStats);
    }).finally(() => setLoading(false));
  }, [token]);

  const topCountry = users?.byCountry[0];
  const topSource = users?.bySource[0];

  return (
    <div>
      <PageHeader
        title="Platform Analytics"
        subtitle="Real-time user and platform statistics"
      />

      {loading && (
        <div className="flex items-center justify-center py-24 text-muted-foreground text-sm">Loading analytics…</div>
      )}

      {!loading && (
        <>
          {/* KPI strip */}
          <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatCard label="Total users" value={(platform?.totalUsers ?? 0).toLocaleString()} delta="all time" tone="up" />
            <StatCard label="Active users" value={(platform?.activeUsers ?? 0).toLocaleString()} delta={platform ? `${Math.round((platform.activeUsers / Math.max(platform.totalUsers, 1)) * 100)}% active` : "—"} tone="up" />
            <StatCard label="Top country" value={topCountry?.name ?? "—"} delta={`${topCountry?.value ?? 0} users`} tone="flat" />
            <StatCard label="Top source" value={topSource?.name ?? "—"} delta={`${topSource?.value ?? 0} users`} tone="flat" />
          </div>

          <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatCard label="Brokers listed" value={(platform?.brokers ?? 0).toLocaleString()} delta="partners" tone="flat" />
            <StatCard label="Prop firms" value={(platform?.propfirms ?? 0).toLocaleString()} delta="partners" tone="flat" />
            <StatCard label="Exchangers" value={(platform?.exchangers ?? 0).toLocaleString()} delta="partners" tone="flat" />
            <StatCard label="Suspended" value={(platform?.suspendedUsers ?? 0).toLocaleString()} delta="accounts" tone="down" />
          </div>

          {/* Signup trend */}
          {users?.signupTrend && users.signupTrend.length > 0 && (
            <Panel title="Monthly signups (last 12 months)">
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={users.signupTrend} margin={{ top: 10, right: 16, left: -16, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gSignups" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#d946ef" stopOpacity={0.6} />
                        <stop offset="95%" stopColor="#d946ef" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                    <XAxis dataKey="month" stroke="rgba(255,255,255,0.4)" fontSize={11} interval="preserveStartEnd" />
                    <YAxis stroke="rgba(255,255,255,0.4)" fontSize={11} allowDecimals={false} />
                    <Tooltip contentStyle={{ background: "#1a0d36", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 12 }} />
                    <Area type="monotone" dataKey="count" stroke="#d946ef" strokeWidth={2} fill="url(#gSignups)" name="Signups" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Panel>
          )}

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {/* By country */}
            <Panel title="Top countries by signup" action={<Pill icon={Globe}>geo</Pill>}>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={users?.byCountry ?? []} margin={{ top: 6, right: 16, left: -16, bottom: 0 }}>
                    <CartesianGrid stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                    <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" fontSize={11} />
                    <YAxis stroke="rgba(255,255,255,0.4)" fontSize={11} allowDecimals={false} />
                    <Tooltip cursor={{ fill: "rgba(255,255,255,0.04)" }} contentStyle={{ background: "#1a0d36", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 12 }} />
                    <Bar dataKey="value" radius={[8, 8, 0, 0]} name="Users">
                      {(users?.byCountry ?? []).map((_, i) => <Cell key={i} fill={COLORS[(i + 1) % COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Panel>

            {/* By experience */}
            <Panel title="Trading experience" action={<Pill icon={Users}>distribution</Pill>}>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={users?.byExperience ?? []} dataKey="value" nameKey="name" innerRadius={55} outerRadius={95} paddingAngle={3}>
                      {(users?.byExperience ?? []).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: "#1a0d36", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 11, color: "rgba(255,255,255,0.7)" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Panel>

            {/* By acquisition source */}
            <Panel title="How users found us" action={<Pill icon={Sparkles}>attribution</Pill>}>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart innerRadius="20%" outerRadius="95%" data={(users?.bySource ?? []).map((d, i) => ({ ...d, fill: COLORS[i % COLORS.length] }))} startAngle={90} endAngle={-270}>
                    <RadialBar background dataKey="value" cornerRadius={6} />
                    <Legend iconSize={8} layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{ fontSize: 11, color: "rgba(255,255,255,0.7)" }} />
                    <Tooltip contentStyle={{ background: "#1a0d36", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 12 }} />
                  </RadialBarChart>
                </ResponsiveContainer>
              </div>
            </Panel>

            {/* By preferred asset */}
            <Panel title="Preferred trading asset" action={<Pill icon={Target}>multi-select</Pill>}>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={users?.byAsset ?? []} layout="vertical" margin={{ top: 6, right: 16, left: 4, bottom: 0 }}>
                    <CartesianGrid stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" stroke="rgba(255,255,255,0.4)" fontSize={11} allowDecimals={false} />
                    <YAxis type="category" dataKey="name" stroke="rgba(255,255,255,0.6)" fontSize={11} width={90} />
                    <Tooltip cursor={{ fill: "rgba(255,255,255,0.04)" }} contentStyle={{ background: "#1a0d36", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 12 }} />
                    <Bar dataKey="value" radius={[0, 8, 8, 0]} name="Users">
                      {(users?.byAsset ?? []).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Panel>

            {/* Account status breakdown */}
            <Panel title="Account status breakdown" action={<Pill icon={CheckCircle2}>health</Pill>}>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={users?.byStatus ?? []} margin={{ top: 6, right: 16, left: -16, bottom: 0 }}>
                    <CartesianGrid stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                    <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" fontSize={11} />
                    <YAxis stroke="rgba(255,255,255,0.4)" fontSize={11} allowDecimals={false} />
                    <Tooltip cursor={{ fill: "rgba(255,255,255,0.04)" }} contentStyle={{ background: "#1a0d36", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 12 }} />
                    <Bar dataKey="value" radius={[8, 8, 0, 0]} name="Users">
                      {(users?.byStatus ?? []).map((_, i) => <Cell key={i} fill={COLORS[(i + 2) % COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Panel>

            {/* Platform summary table */}
            <Panel title="Platform summary" action={<Pill icon={TrendingUp}>overview</Pill>}>
              <div className="space-y-3 pt-1">
                {[
                  { label: "Total users", value: platform?.totalUsers ?? 0 },
                  { label: "Active", value: platform?.activeUsers ?? 0 },
                  { label: "Inactive", value: platform?.inactiveUsers ?? 0 },
                  { label: "Suspended", value: platform?.suspendedUsers ?? 0 },
                  { label: "Brokers", value: platform?.brokers ?? 0 },
                  { label: "Prop firms", value: platform?.propfirms ?? 0 },
                  { label: "Exchangers", value: platform?.exchangers ?? 0 },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-semibold text-white">{value.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </Panel>
          </div>
        </>
      )}
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
