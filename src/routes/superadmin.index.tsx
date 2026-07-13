import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Download, RefreshCw } from "lucide-react";
import {
  DataTable,
  EmptyState,
  PageHeader,
  Panel,
  SeverityPill,
  StatCard,
  StatusPill,
} from "@/components/superadmin/AdminUI";
import {
  fetchSuperadminDashboardOverview,
  type AdminDashboardKpi,
  type AdminDashboardOverview,
} from "@/lib/superadmin-dashboard-api";

export const Route = createFileRoute("/superadmin/")({
  component: OverviewPage,
});

const emptyOverview: AdminDashboardOverview = {
  overviewKpis: [],
  cashbackKpis: [],
  platformKpis: [],
  usersByCountry: [],
  tradingExperience: [],
  monthlySignups: [],
  monthlySignupDeltaLabel: "",
  claims: [],
  openComplaints: [],
  recentSignups: [],
  recentPayouts: [],
  pendingReviews: [],
};

function toCsvValue(value: string | number | boolean | null | undefined) {
  if (value == null) return "";
  const normalized = String(value).replace(/"/g, '""');
  return /[",\n]/.test(normalized) ? `"${normalized}"` : normalized;
}

function exportOverviewCsv(data: AdminDashboardOverview) {
  if (typeof window === "undefined") return;

  const sections: string[] = [];
  const addSection = (
    title: string,
    rows: Array<Record<string, string | number | boolean | null | undefined>>,
  ) => {
    sections.push(title);
    if (!rows.length) {
      sections.push("No data");
      sections.push("");
      return;
    }

    const headers = Object.keys(rows[0]);
    sections.push(headers.join(","));
    rows.forEach((row) => {
      sections.push(headers.map((header) => toCsvValue(row[header])).join(","));
    });
    sections.push("");
  };

  const mapKpis = (items: AdminDashboardKpi[]) =>
    items.map((item) => ({
      label: item.label,
      value: item.value,
      delta: item.delta ?? "",
      tone: item.tone ?? "flat",
    }));

  addSection("Overview KPIs", mapKpis(data.overviewKpis));
  addSection("Cashback KPIs", mapKpis(data.cashbackKpis));
  addSection("Platform KPIs", mapKpis(data.platformKpis));
  addSection("Users By Country", data.usersByCountry);
  addSection("Trading Experience", data.tradingExperience);
  addSection("Monthly Signups", data.monthlySignups);
  addSection("Claims", data.claims);
  addSection("Open Complaints", data.openComplaints);
  addSection("Recent Signups", data.recentSignups);
  addSection("Recent Payouts", data.recentPayouts);
  addSection("Pending Reviews", data.pendingReviews);

  const blob = new Blob([sections.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  const date = new Date().toISOString().slice(0, 10);
  anchor.href = url;
  anchor.download = `mission-control-${date}.csv`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  window.URL.revokeObjectURL(url);
}

function SkeletonCard() {
  return (
    <div className="glass rounded-2xl p-3.5 ring-1 ring-white/10 sm:p-4">
      <div className="h-3 w-24 animate-pulse rounded-full bg-white/10" />
      <div className="mt-3 h-7 w-20 animate-pulse rounded-full bg-white/10" />
      <div className="mt-3 h-5 w-28 animate-pulse rounded-full bg-white/10" />
    </div>
  );
}

function SkeletonList() {
  return (
    <ul className="space-y-3">
      {Array.from({ length: 5 }).map((_, index) => (
        <li key={index}>
          <div className="mb-2 flex items-center justify-between gap-3">
            <div className="h-4 w-28 animate-pulse rounded-full bg-white/10" />
            <div className="h-3 w-16 animate-pulse rounded-full bg-white/10" />
          </div>
          <div className="h-1.5 animate-pulse rounded-full bg-white/10" />
        </li>
      ))}
    </ul>
  );
}

function SkeletonBars() {
  return (
    <>
      <div className="flex h-40 items-end justify-between gap-2">
        {[55, 70, 42, 88, 61, 76].map((height, index) => (
          <div key={index} className="flex flex-1 flex-col items-center gap-2">
            <div
              className="w-full animate-pulse rounded-t-md bg-white/10"
              style={{ height: `${height}%` }}
            />
            <div className="h-3 w-8 animate-pulse rounded-full bg-white/10" />
          </div>
        ))}
      </div>
      <div className="mt-3 flex justify-center">
        <div className="h-3 w-28 animate-pulse rounded-full bg-white/10" />
      </div>
    </>
  );
}

function SkeletonTable({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-3 animate-pulse rounded-full bg-white/10" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="grid grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, cellIndex) => (
            <div
              key={cellIndex}
              className="h-10 animate-pulse rounded-xl bg-white/[0.05]"
            />
          ))}
        </div>
      ))}
    </div>
  );
}

function SkeletonFeed({ rows = 4 }: { rows?: number }) {
  return (
    <ul className="space-y-3">
      {Array.from({ length: rows }).map((_, index) => (
        <li
          key={index}
          className="flex items-center gap-3 rounded-xl bg-white/[0.04] p-3 ring-1 ring-white/10"
        >
          <div className="h-9 w-9 animate-pulse rounded-full bg-white/10" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-4 w-32 animate-pulse rounded-full bg-white/10" />
            <div className="h-3 w-40 animate-pulse rounded-full bg-white/10" />
          </div>
          <div className="h-3 w-12 animate-pulse rounded-full bg-white/10" />
        </li>
      ))}
    </ul>
  );
}

function OverviewPage() {
  const [data, setData] = useState<AdminDashboardOverview>(emptyOverview);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadOverview = async () => {
    setLoading(true);
    setError(null);
    try {
      const next = await fetchSuperadminDashboardOverview();
      setData(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadOverview();
  }, []);

  const monthlyMax = useMemo(
    () => Math.max(...data.monthlySignups.map((item) => item.count), 1),
    [data.monthlySignups],
  );

  return (
    <div>
      <PageHeader
        title="Mission Control"
        subtitle="Live pulse of onboarding, brands, claims, complaints, payouts, and moderation queues."
        actions={
          <>
            <button
              className="glass-pill inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-white"
              onClick={() => void loadOverview()}
              type="button"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              {loading ? "Refreshing" : "Refresh"}
            </button>
            <button
              className="inline-flex items-center gap-1.5 rounded-full rb-gradient-primary px-3 py-1.5 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
              disabled={loading}
              onClick={() => exportOverviewCsv(data)}
              type="button"
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

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }).map((_, index) => <SkeletonCard key={index} />)
          : data.overviewKpis.map((kpi) => (
              <StatCard
                key={kpi.label}
                label={kpi.label}
                value={kpi.value}
                delta={kpi.delta}
                tone={kpi.tone}
              />
            ))}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }).map((_, index) => <SkeletonCard key={index} />)
          : data.cashbackKpis.map((kpi) => (
              <StatCard
                key={kpi.label}
                label={kpi.label}
                value={kpi.value}
                delta={kpi.delta}
                tone={kpi.tone}
              />
            ))}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }).map((_, index) => <SkeletonCard key={index} />)
          : data.platformKpis.map((kpi) => (
              <StatCard
                key={kpi.label}
                label={kpi.label}
                value={kpi.value}
                delta={kpi.delta}
                tone={kpi.tone}
              />
            ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Panel title="Users by country">
          {loading ? (
            <SkeletonList />
          ) : data.usersByCountry.length ? (
            <ul className="space-y-2">
              {data.usersByCountry.map((item) => (
                <li key={item.country} className="text-sm">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-white">{item.country}</span>
                    <span className="text-muted-foreground text-xs">
                      {item.users.toLocaleString()} - {item.pct}%
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/5">
                    <div
                      className="h-full rounded-full rb-gradient-primary"
                      style={{ width: `${item.pct}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              title="No country data yet"
              description="User country analytics will appear here once registrations are stored."
            />
          )}
        </Panel>

        <Panel title="Trading experience">
          {loading ? (
            <SkeletonList />
          ) : data.tradingExperience.length ? (
            <ul className="space-y-2">
              {data.tradingExperience.map((item) => (
                <li key={item.level} className="text-sm">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-white">{item.level}</span>
                    <span className="text-muted-foreground text-xs">
                      {item.users.toLocaleString()} - {item.pct}%
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/5">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-sky-500"
                      style={{ width: `${item.pct}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              title="No experience data yet"
              description="Onboarding responses will fill this distribution."
            />
          )}
        </Panel>

        <Panel title="Monthly signups">
          {loading ? (
            <SkeletonBars />
          ) : data.monthlySignups.length ? (
            <>
              <div className="flex h-40 items-end justify-between gap-2">
                {data.monthlySignups.map((item) => {
                  const height = (item.count / monthlyMax) * 100;
                  return (
                    <div
                      key={item.month}
                      className="flex flex-1 flex-col items-center gap-1"
                    >
                      <div
                        className="w-full rounded-t-md bg-gradient-to-t from-fuchsia-600 to-violet-400"
                        style={{ height: `${height}%` }}
                      />
                      <span className="text-[10px] text-muted-foreground">
                        {item.month}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="mt-3 text-center text-xs text-muted-foreground">
                {data.monthlySignupDeltaLabel || "Last 6 months"}
              </div>
            </>
          ) : (
            <EmptyState
              title="No signup trend yet"
              description="Monthly signup bars will appear once user records exist."
            />
          )}
        </Panel>
      </div>

      <div className="mt-6">
        <Panel
          title="Active claims awaiting review"
          action={
            <Link
              to="/superadmin/claims"
              className="text-[11px] text-fuchsia-300 hover:underline"
            >
              Review claims
            </Link>
          }
        >
          {loading ? (
            <SkeletonTable rows={5} />
          ) : data.claims.length ? (
            <DataTable
              head={
                <>
                  <th>ID</th>
                  <th>User</th>
                  <th>Partner</th>
                  <th>Account</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Evidence</th>
                  <th>Status</th>
                  <th>Submitted</th>
                </>
              }
            >
              {data.claims.map((claim) => (
                <tr key={claim.id}>
                  <td className="font-mono text-xs text-muted-foreground">
                    {claim.id}
                  </td>
                  <td className="font-semibold">{claim.user}</td>
                  <td>{claim.partner}</td>
                  <td className="font-mono text-xs">{claim.accountId}</td>
                  <td>{claim.type}</td>
                  <td className="font-mono text-emerald-300">
                    ${claim.amount.toLocaleString()}
                  </td>
                  <td className="font-mono">{claim.evidence}</td>
                  <td>
                    <StatusPill status={claim.status} />
                  </td>
                  <td className="text-xs text-muted-foreground">
                    {claim.submitted}
                  </td>
                </tr>
              ))}
            </DataTable>
          ) : (
            <EmptyState
              title="No pending claims"
              description="Cashback claims that need admin review will show up here."
            />
          )}
        </Panel>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_360px]">
        <Panel
          title="Open complaints"
          action={
            <Link
              to="/superadmin/complaints"
              className="text-[11px] text-fuchsia-300 hover:underline"
            >
              Inspect queue
            </Link>
          }
        >
          {loading ? (
            <SkeletonTable rows={4} />
          ) : data.openComplaints.length ? (
            <DataTable
              head={
                <>
                  <th>ID</th>
                  <th>Brand</th>
                  <th>Category</th>
                  <th>Severity</th>
                  <th>Status</th>
                  <th>Time</th>
                </>
              }
            >
              {data.openComplaints.map((complaint) => (
                <tr key={complaint.id}>
                  <td className="font-mono text-xs text-muted-foreground">
                    {complaint.id}
                  </td>
                  <td className="font-semibold">{complaint.brand}</td>
                  <td>{complaint.category}</td>
                  <td>
                    <SeverityPill severity={complaint.severity} />
                  </td>
                  <td>
                    <StatusPill status={complaint.status} />
                  </td>
                  <td className="text-xs text-muted-foreground">
                    {complaint.time}
                  </td>
                </tr>
              ))}
            </DataTable>
          ) : (
            <EmptyState
              title="No open complaints"
              description="Open public complaints will appear here when users submit them."
            />
          )}
        </Panel>

        <Panel title="New signups">
          {loading ? (
            <SkeletonFeed rows={6} />
          ) : data.recentSignups.length ? (
            <ul className="space-y-3">
              {data.recentSignups.slice(0, 6).map((user) => (
                <li key={user.id} className="flex items-center gap-3">
                  <div className="grid h-9 w-9 place-items-center rounded-full rb-gradient-primary text-xs font-bold text-white">
                    {user.name
                      .split(" ")
                      .map((part) => part[0])
                      .join("")
                      .slice(0, 2)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-white">
                      {user.name}
                    </div>
                    <div className="truncate text-[11px] text-muted-foreground">
                      {user.email}
                    </div>
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    {user.country}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              title="No recent signups"
              description="Fresh registrations will appear here once onboarding traffic comes in."
            />
          )}
        </Panel>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Panel
          title="Latest wallet payouts"
          action={
            <Link
              to="/superadmin/payouts"
              className="text-[11px] text-fuchsia-300 hover:underline"
            >
              View payouts
            </Link>
          }
        >
          {loading ? (
            <SkeletonTable rows={4} />
          ) : data.recentPayouts.length ? (
            <DataTable
              head={
                <>
                  <th>ID</th>
                  <th>User</th>
                  <th>Amount</th>
                  <th>Channel</th>
                  <th>Speed</th>
                  <th>Status</th>
                </>
              }
            >
              {data.recentPayouts.map((payout) => (
                <tr key={payout.id}>
                  <td className="font-mono text-xs text-muted-foreground">
                    {payout.id}
                  </td>
                  <td className="font-semibold">{payout.user}</td>
                  <td className="font-mono">
                    ${payout.amount.toLocaleString()}
                  </td>
                  <td>{payout.channel}</td>
                  <td>{payout.speed}</td>
                  <td>
                    <StatusPill status={payout.status} />
                  </td>
                </tr>
              ))}
            </DataTable>
          ) : (
            <EmptyState
              title="No payout records yet"
              description="Approved and paid withdrawal activity will show up here."
            />
          )}
        </Panel>

        <Panel
          title="Reviews awaiting moderation"
          action={
            <Link
              to="/superadmin/reviews"
              className="text-[11px] text-fuchsia-300 hover:underline"
            >
              Moderate reviews
            </Link>
          }
        >
          {loading ? (
            <SkeletonFeed rows={4} />
          ) : data.pendingReviews.length ? (
            <ul className="space-y-3">
              {data.pendingReviews.map((review) => (
                <li
                  key={review.id}
                  className="rounded-xl bg-white/5 p-3 ring-1 ring-white/10"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-white">
                      {review.brand}
                    </span>
                    <span className="text-xs text-amber-300">
                      {review.rating}/5
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                    {review.snippet}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground">
                      by {review.user} - {review.time}
                    </span>
                    {review.flagged ? (
                      <span className="rounded-full bg-rose-500/15 px-2 py-0.5 text-[9px] font-bold text-rose-300 ring-1 ring-rose-400/30">
                        FLAGGED
                      </span>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              title="No reviews waiting"
              description="Pending reviews will show here when traders submit them."
            />
          )}
        </Panel>
      </div>
    </div>
  );
}
