import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { FlaskConical, Database, Sparkles, Coins, Shield, Users, FileText } from "lucide-react";
import { PageHeader, StatCard, Panel, Pill } from "@/components/dashboard/Primitives";
import { adminMetrics, mockReports, importSources } from "@/lib/backtest-data";

export const Route = createFileRoute("/superadmin/backtest")({
  head: () => ({
    meta: [{ title: "AI Backtest Lab — Admin" }],
  }),
  component: AdminBacktest,
});

type Tab = "overview" | "reports" | "sources" | "ai" | "cashback" | "compliance";

const tabs: { id: Tab; label: string; icon: typeof FlaskConical }[] = [
  { id: "overview", label: "Overview", icon: FlaskConical },
  { id: "reports", label: "User Reports", icon: FileText },
  { id: "sources", label: "Data Sources", icon: Database },
  { id: "ai", label: "AI Prompts", icon: Sparkles },
  { id: "cashback", label: "Cashback Settings", icon: Coins },
  { id: "compliance", label: "Compliance", icon: Shield },
];

function AdminBacktest() {
  const [tab, setTab] = useState<Tab>("overview");

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Backtest Lab — Admin"
        subtitle="Manage backtests, user reports, data sources, AI prompts, cashback impact and compliance."
      />

      <div className="glass flex flex-wrap gap-1 rounded-2xl p-1.5">
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition ${
                active
                  ? "rb-gradient-primary text-white"
                  : "text-muted-foreground hover:bg-white/5 hover:text-white"
              }`}
            >
              <Icon className="h-3.5 w-3.5" /> {t.label}
            </button>
          );
        })}
      </div>

      {tab === "overview" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatCard label="Users using Lab" value={String(adminMetrics.totalUsers)} accent="primary" />
            <StatCard label="Total Backtests" value={String(adminMetrics.totalBacktests)} trend="up" accent="success" />
            <StatCard label="Reports Uploaded" value={String(adminMetrics.reportsUploaded)} accent="primary" />
            <StatCard label="Active Users" value={String(adminMetrics.activeUsers)} trend="up" accent="success" />
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatCard label="Top Market" value={adminMetrics.topMarket} accent="primary" />
            <StatCard label="Top Symbol" value={adminMetrics.topSymbol} accent="primary" />
            <StatCard label="Avg User Win Rate" value={adminMetrics.avgWinRate} accent="primary" />
            <StatCard label="AI Cost" value={adminMetrics.aiCost} accent="warning" />
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            <StatCard label="Fees Analyzed" value={adminMetrics.feesAnalyzed} accent="primary" />
            <StatCard label="Cashback Impact" value={adminMetrics.cashbackImpact} trend="up" accent="success" />
            <StatCard label="Failed Imports" value={String(adminMetrics.failedImports)} trend="down" accent="destructive" />
          </div>
        </div>
      )}

      {tab === "reports" && (
        <Panel title="User reports">
          <div className="-mx-5 overflow-x-auto px-5">
            <table className="w-full text-left text-xs">
              <thead className="text-[10px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-2 py-2">User</th>
                  <th className="px-2 py-2">Report</th>
                  <th className="px-2 py-2">Type</th>
                  <th className="px-2 py-2">Market</th>
                  <th className="px-2 py-2">Trades</th>
                  <th className="px-2 py-2">Created</th>
                  <th className="px-2 py-2">Status</th>
                  <th className="px-2 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {mockReports.map((r, i) => (
                  <tr key={r.id} className="border-t border-white/5 text-white/90">
                    <td className="px-2 py-2 flex items-center gap-2">
                      <span className="grid h-6 w-6 place-items-center rounded-full rb-gradient-primary text-[9px] font-bold text-white">U{i + 1}</span>
                      user{i + 1}@rb.io
                    </td>
                    <td className="px-2 py-2">{r.name}</td>
                    <td className="px-2 py-2"><Pill tone={r.source === "ai-strategy" ? "primary" : "warning"}>{r.source}</Pill></td>
                    <td className="px-2 py-2">{r.market}</td>
                    <td className="px-2 py-2">{r.trades}</td>
                    <td className="px-2 py-2 text-muted-foreground">{r.createdAt}</td>
                    <td className="px-2 py-2"><Pill tone="success">{r.status}</Pill></td>
                    <td className="px-2 py-2">
                      <div className="flex gap-1">
                        <button className="rounded-md bg-white/10 px-2 py-1 text-[10px] text-white">View</button>
                        <button className="rounded-md bg-amber-500/20 px-2 py-1 text-[10px] text-amber-300">Flag</button>
                        <button className="rounded-md bg-rose-500/20 px-2 py-1 text-[10px] text-rose-300">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      )}

      {tab === "sources" && (
        <Panel title="Supported data sources">
          <div className="grid gap-3 md:grid-cols-2">
            {importSources.map((s) => (
              <div key={s} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3">
                <div>
                  <div className="text-sm font-semibold text-white">{s}</div>
                  <div className="text-[11px] text-muted-foreground">CSV / API • required: date, symbol, side, entry, exit, pnl</div>
                </div>
                <Pill tone="success">active</Pill>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {tab === "ai" && (
        <div className="grid gap-3 md:grid-cols-2">
          {[
            { t: "Strategy interpretation prompt", v: "Convert user description into structured rules: entry, exit, risk, filters." },
            { t: "AI insight templates", v: "Best edge / Risk warning / Cashback impact / Worst behavior" },
            { t: "Risk warning messages", v: "Detect overtrading, revenge trading, lot escalation." },
            { t: "Cashback explanation template", v: "Show net result improvement with RebateBoard cashback." },
            { t: "Compliance disclaimer", v: "Educational only. Not financial advice." },
            { t: "User-facing AI tone", v: "Direct, supportive, data-driven." },
          ].map((c) => (
            <div key={c.t} className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="text-[11px] uppercase tracking-wider text-violet-300">{c.t}</div>
              <textarea defaultValue={c.v} className="mt-2 w-full rounded-lg border border-white/10 bg-white/5 p-2 text-xs text-white" />
            </div>
          ))}
        </div>
      )}

      {tab === "cashback" && (
        <Panel title="Cashback impact settings">
          <div className="grid gap-3 md:grid-cols-2">
            {[
              { l: "Default cashback %", v: "0.4%" },
              { l: "Spread assumption (Forex)", v: "0.8 pip" },
              { l: "Commission per lot", v: "$7" },
              { l: "Crypto fee assumption", v: "0.075%" },
              { l: "Prop firm cashback rule", v: "Apply to payouts only" },
              { l: "Broker-specific overrides", v: "12 brokers configured" },
            ].map((f) => (
              <div key={f.l}>
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground">{f.l}</label>
                <input defaultValue={f.v} className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white" />
              </div>
            ))}
          </div>
        </Panel>
      )}

      {tab === "compliance" && (
        <div className="grid gap-3 md:grid-cols-2">
          {[
            "Backtest disclaimer",
            "Risk disclaimer",
            "AI limitation disclaimer",
            "No financial advice disclaimer",
          ].map((d) => (
            <div key={d} className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="text-[11px] uppercase tracking-wider text-violet-300">{d}</div>
              <textarea
                defaultValue="Backtesting results are based on historical data and do not guarantee future performance. AI insights are educational and should not be treated as financial advice."
                className="mt-2 w-full rounded-lg border border-white/10 bg-white/5 p-2 text-xs text-white min-h-[80px]"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
