import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader, StatCard, Panel, DataTable, StatusPill, SeverityPill } from "@/components/superadmin/AdminUI";
import { overviewKpis, cashbackKpis, platformKpis, recentSignups, openComplaints, recentPayouts, pendingReviews, claims, usersByCountry, tradingExperience, monthlySignups } from "@/lib/admin-data";
import { Download, RefreshCw } from "lucide-react";

export const Route = createFileRoute("/superadmin/")({
  component: OverviewPage,
});

function OverviewPage() {
  return (
    <div>
      <PageHeader
        title="Mission Control"
        subtitle="Real-time pulse of users, brands, payouts and trust signals."
        actions={
          <>
            <button className="glass-pill inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-white">
              <RefreshCw className="h-3.5 w-3.5" /> Refresh
            </button>
            <button className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-600 px-3 py-1.5 text-xs font-semibold text-white">
              <Download className="h-3.5 w-3.5" /> Export
            </button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {overviewKpis.map((k) => (
          <StatCard key={k.label} label={k.label} value={k.value} delta={k.delta} tone={k.tone} />
        ))}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
        {cashbackKpis.map((k) => (
          <StatCard key={k.label} label={k.label} value={k.value} delta={k.delta} tone={k.tone} />
        ))}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
        {platformKpis.map((k) => (
          <StatCard key={k.label} label={k.label} value={k.value} delta={k.delta} tone={k.tone} />
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Panel title="Users by country">
          <ul className="space-y-2">
            {usersByCountry.map((c) => (
              <li key={c.country} className="text-sm">
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-white">{c.country}</span>
                  <span className="text-muted-foreground text-xs">{c.users.toLocaleString()} · {c.pct}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/5">
                  <div className="h-full rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-600" style={{ width: `${c.pct * 4}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Trading experience">
          <ul className="space-y-2">
            {tradingExperience.map((e) => (
              <li key={e.level} className="text-sm">
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-white">{e.level}</span>
                  <span className="text-muted-foreground text-xs">{e.users.toLocaleString()} · {e.pct}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/5">
                  <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-sky-500" style={{ width: `${e.pct * 2.5}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Monthly signups">
          <div className="flex h-40 items-end justify-between gap-2">
            {monthlySignups.map((m) => {
              const max = Math.max(...monthlySignups.map((x) => x.count));
              const h = (m.count / max) * 100;
              return (
                <div key={m.month} className="flex flex-1 flex-col items-center gap-1">
                  <div className="w-full rounded-t-md bg-gradient-to-t from-fuchsia-600 to-violet-400" style={{ height: `${h}%` }} />
                  <span className="text-[10px] text-muted-foreground">{m.month}</span>
                </div>
              );
            })}
          </div>
          <div className="mt-3 text-center text-xs text-muted-foreground">+18.6% growth · last 6 months</div>
        </Panel>
      </div>

      <div className="mt-6">
        <Panel
          title="Active claims awaiting review"
          action={<Link to="/superadmin/claims" className="text-[11px] text-fuchsia-300 hover:underline">View all →</Link>}
        >
          <DataTable head={<><th>ID</th><th>User</th><th>Partner</th><th>Account</th><th>Type</th><th>Amount</th><th>Evidence</th><th>Status</th><th>Submitted</th></>}>
            {claims.filter((c) => c.status === "pending").map((c) => (
              <tr key={c.id}>
                <td className="font-mono text-xs text-muted-foreground">{c.id}</td>
                <td className="font-semibold">{c.user}</td>
                <td>{c.partner}</td>
                <td className="font-mono text-xs">{c.accountId}</td>
                <td>{c.type}</td>
                <td className="font-mono text-emerald-300">${c.amount.toLocaleString()}</td>
                <td className="font-mono">{c.evidence}</td>
                <td><StatusPill status={c.status} /></td>
                <td className="text-xs text-muted-foreground">{c.submitted}</td>
              </tr>
            ))}
          </DataTable>
        </Panel>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_360px]">
        <Panel
          title="Open Complaints"
          action={<Link to="/superadmin/complaints" className="text-[11px] text-fuchsia-300 hover:underline">View all →</Link>}
        >
          <DataTable head={<><th>ID</th><th>Brand</th><th>Category</th><th>Severity</th><th>Status</th><th>Time</th></>}>
            {openComplaints.map((c) => (
              <tr key={c.id}>
                <td className="font-mono text-xs text-muted-foreground">{c.id}</td>
                <td className="font-semibold">{c.brand}</td>
                <td>{c.category}</td>
                <td><SeverityPill severity={c.severity} /></td>
                <td><StatusPill status={c.status} /></td>
                <td className="text-xs text-muted-foreground">{c.time}</td>
              </tr>
            ))}
          </DataTable>
        </Panel>

        <Panel title="New signups (last hour)">
          <ul className="space-y-3">
            {recentSignups.slice(0, 6).map((u) => (
              <li key={u.id} className="flex items-center gap-3">
                <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-fuchsia-500 to-violet-600 text-xs font-bold text-white">
                  {u.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-white">{u.name}</div>
                  <div className="truncate text-[11px] text-muted-foreground">{u.email}</div>
                </div>
                <div className="text-[10px] text-muted-foreground">{u.country}</div>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Panel
          title="Latest verified payouts"
          action={<Link to="/superadmin/payouts" className="text-[11px] text-fuchsia-300 hover:underline">View all →</Link>}
        >
          <DataTable head={<><th>ID</th><th>Brand</th><th>Amount</th><th>Chain</th><th>Speed</th><th>Status</th></>}>
            {recentPayouts.map((p) => (
              <tr key={p.id}>
                <td className="font-mono text-xs text-muted-foreground">{p.id}</td>
                <td className="font-semibold">{p.brand}</td>
                <td className="font-mono">${p.amount.toLocaleString()}</td>
                <td>{p.chain}</td>
                <td>{p.speed}</td>
                <td><StatusPill status={p.status} /></td>
              </tr>
            ))}
          </DataTable>
        </Panel>

        <Panel
          title="Reviews awaiting moderation"
          action={<Link to="/superadmin/reviews" className="text-[11px] text-fuchsia-300 hover:underline">View all →</Link>}
        >
          <ul className="space-y-3">
            {pendingReviews.map((r) => (
              <li key={r.id} className="rounded-xl bg-white/5 p-3 ring-1 ring-white/10">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-white">{r.brand}</span>
                  <span className="text-xs text-amber-300">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</span>
                </div>
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{r.snippet}</p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground">by {r.user} · {r.time}</span>
                  {r.flagged && <span className="rounded-full bg-rose-500/15 px-2 py-0.5 text-[9px] font-bold text-rose-300 ring-1 ring-rose-400/30">FLAGGED</span>}
                  <div className="ml-auto flex gap-1">
                    <button className="rounded-md bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-300 ring-1 ring-emerald-400/30">Approve</button>
                    <button className="rounded-md bg-rose-500/15 px-2 py-0.5 text-[10px] font-bold text-rose-300 ring-1 ring-rose-400/30">Reject</button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
}
