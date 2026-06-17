import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Activity, AlertTriangle, BarChart3, Building2, Clock3, Search, TrendingUp, Users, Wallet, X } from "lucide-react";
import { EmptyState, PageHeader, Panel, Pill, SkeletonCard, StatCard } from "@/components/dashboard/Primitives";
import { financeApi, type TrtAnalytics } from "@/lib/finance-api";
import { userAdminApi, type AdminUser } from "@/lib/admin-api";

export const Route = createFileRoute("/superadmin/trt")({
  head: () => ({
    meta: [{ title: "Trader ROI Tracker - Admin" }],
  }),
  component: SuperadminTrtPage,
});

const AUTH_STORAGE_KEY = "rb_auth_session";

function readToken() {
  if (typeof window === "undefined") return null;

  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { token?: string | null };
    return parsed.token ?? null;
  } catch {
    return null;
  }
}

function money(value: number) {
  return `$${Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

function toneForStatus(status?: string) {
  const normalized = String(status || "").toUpperCase();
  if (normalized === "PAID" || normalized === "APPROVED" || normalized === "SUCCESSFUL") return "success" as const;
  if (normalized === "DECLINED" || normalized === "REJECTED" || normalized === "FAILED") return "destructive" as const;
  if (normalized === "PENDING") return "warning" as const;
  return "default" as const;
}

function labelStatus(status?: string) {
  const normalized = String(status || "").toLowerCase();
  if (!normalized) return "unknown";
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function userLabel(user: Pick<AdminUser, "name" | "email">) {
  return user.name?.trim() || user.email || "Unnamed user";
}

function SuperadminTrtPage() {
  const [data, setData] = useState<TrtAnalytics | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [userQuery, setUserQuery] = useState("");
  const [userSearchOpen, setUserSearchOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const token = readToken();
      if (!token) {
        if (!cancelled) {
          setError("Admin session not found.");
          setLoading(false);
        }
        return;
      }

      try {
        const response = await financeApi.getTrtAnalytics(token, selectedUserId === "all" ? null : selectedUserId);
        if (cancelled) return;
        setData(response.payload ?? null);
        setError(null);
      } catch (ex) {
        if (cancelled) return;
        setError(ex instanceof Error ? ex.message : "Unable to load TRT analytics");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [selectedUserId]);

  useEffect(() => {
    let cancelled = false;
    const token = readToken();
    if (!token) return;

    const timer = window.setTimeout(async () => {
      try {
        const response = userQuery.trim()
          ? await userAdminApi.search(token, userQuery.trim(), 0, 20)
          : await userAdminApi.list(token, 0, 20);
        if (cancelled) return;
        setUsers(response.payload?.page ?? []);
      } catch {
        if (!cancelled) setUsers([]);
      }
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [userQuery]);

  const topCategoryAmount = useMemo(
    () => Math.max(1, ...(data?.categoryMix.map((item) => item.amount) ?? [1])),
    [data],
  );
  const selectedUserLabel =
    selectedUserId === "all"
      ? "All traders"
      : data?.selectedUser?.name || users.find((user) => user.id === selectedUserId)?.name || "Selected trader";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Trader ROI Tracker - Analytics"
        subtitle="Live admin view of tracked cashback volume, rebate recovery, brand concentration, and recent trader reward activity."
        actions={
          <>
            <div className="relative">
              <div className="flex min-w-[260px] items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                <Search className="h-3.5 w-3.5 text-white/45" />
                <input
                  value={userQuery}
                  onChange={(e) => {
                    setUserQuery(e.target.value);
                    setUserSearchOpen(true);
                  }}
                  onFocus={() => setUserSearchOpen(true)}
                  placeholder={selectedUserId === "all" ? "Search trader by name or email..." : selectedUserLabel}
                  className="w-full bg-transparent text-xs font-semibold text-white outline-none placeholder:text-white/35"
                />
                {selectedUserId !== "all" && (
                  <button
                    type="button"
                    onClick={() => {
                      setLoading(true);
                      setSelectedUserId("all");
                      setUserQuery("");
                      setUserSearchOpen(false);
                    }}
                    className="rounded-full bg-white/10 p-1 text-white/70 hover:bg-white/15 hover:text-white"
                    title="Clear selected trader"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
              {userSearchOpen && (
                <div className="absolute right-0 z-20 mt-2 w-full overflow-hidden rounded-2xl border border-white/10 bg-[#140726] shadow-2xl">
                  <button
                    type="button"
                    onMouseDown={() => {
                      setLoading(true);
                      setSelectedUserId("all");
                      setUserQuery("");
                      setUserSearchOpen(false);
                    }}
                    className={`flex w-full items-center justify-between px-3 py-2 text-left text-xs ${
                      selectedUserId === "all" ? "bg-white/10 text-white" : "text-white/80 hover:bg-white/5"
                    }`}
                  >
                    <span className="font-semibold">All traders</span>
                    <span className="text-white/45">Global view</span>
                  </button>
                  {users.length > 0 ? (
                    <div className="max-h-72 overflow-y-auto">
                      {users.map((user) => (
                        <button
                          key={user.id}
                          type="button"
                          onMouseDown={() => {
                            setLoading(true);
                            setSelectedUserId(user.id);
                            setUserQuery("");
                            setUserSearchOpen(false);
                          }}
                          className={`flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-xs ${
                            selectedUserId === user.id ? "bg-white/10 text-white" : "text-white/80 hover:bg-white/5"
                          }`}
                        >
                          <div className="min-w-0">
                            <div className="truncate font-semibold">{userLabel(user)}</div>
                            <div className="truncate text-[10px] text-white/45">{user.email}</div>
                          </div>
                          <span className="shrink-0 text-[10px] text-white/35">{user.id}</span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="px-3 py-3 text-xs text-white/45">No traders found.</div>
                  )}
                </div>
              )}
            </div>
            <Pill tone="primary"><Activity className="h-3 w-3" /> {selectedUserLabel}</Pill>
          </>
        }
      />

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : error ? (
        <EmptyState
          icon={AlertTriangle}
          title="Unable to load TRT analytics"
          description={error}
        />
      ) : !data ? (
        <EmptyState
          icon={BarChart3}
          title="No TRT analytics yet"
          description="Once cashback entries and claims start flowing, this page will populate automatically."
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
            <StatCard label="Tracked spend" value={money(data.totalSpend)} accent="warning" />
            <StatCard label="Rebate earned" value={money(data.totalIncome)} accent="success" />
            <StatCard
              label="Net recovery"
              value={money(data.net)}
              accent={data.net >= 0 ? "success" : "destructive"}
              trend={data.net >= 0 ? "up" : "down"}
            />
            <StatCard label="True ROI" value={`${data.trueRoi.toFixed(2)}%`} accent="primary" />
            <StatCard label="Ledger entries" value={data.transactions.toString()} />
            <StatCard label="Avg tracked spend" value={money(data.avgTxSize)} />
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatCard
              label={selectedUserId === "all" ? "Tracked traders" : "Trader scope"}
              value={selectedUserId === "all" ? data.trackedUsers.toString() : "1"}
              accent="primary"
              hint={selectedUserId === "all" ? undefined : data.selectedUser?.emailAddress || undefined}
            />
            <StatCard label="Earning traders" value={data.funded.toString()} accent="success" hint="Users with rebate earned" />
            <StatCard label="Pending claims" value={data.pendingClaims.toString()} accent={data.pendingClaims > 0 ? "warning" : "success"} />
            <StatCard label="Paid claims value" value={money(data.paidClaimsAmount)} accent="success" />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Panel title="Top brands by tracked spend" action={<Building2 className="h-3.5 w-3.5 text-muted-foreground" />}>
              {data.spendByBrand.length === 0 ? (
                <p className="text-xs text-muted-foreground">No brand activity has been tracked yet.</p>
              ) : (
                <table className="w-full text-xs">
                  <thead className="text-left text-muted-foreground">
                    <tr className="border-b border-white/5">
                      <th className="py-2 font-medium">Brand</th>
                      <th className="text-right font-medium">Spend</th>
                      <th className="text-right font-medium">Income</th>
                      <th className="text-right font-medium">Net</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.spendByBrand.map((brand) => (
                      <tr key={brand.brand} className="border-b border-white/5 text-white/90">
                        <td className="py-2.5">{brand.brand || "Unassigned"}</td>
                        <td className="text-right tabular-nums text-destructive">{money(brand.spend)}</td>
                        <td className="text-right tabular-nums text-success">{money(brand.income)}</td>
                        <td className={`text-right font-semibold tabular-nums ${brand.net >= 0 ? "text-success" : "text-destructive"}`}>
                          {money(brand.net)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Panel>

            <Panel title="Category mix" action={<Pill>{data.categoryMix.length} categories</Pill>}>
              {data.categoryMix.length === 0 ? (
                <p className="text-xs text-muted-foreground">No category distribution yet.</p>
              ) : (
                <ul className="space-y-2">
                  {data.categoryMix.map((item) => {
                    const pct = (item.amount / topCategoryAmount) * 100;
                    return (
                      <li key={item.category}>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-white/90">{item.category || "Unassigned"}</span>
                          <span className="tabular-nums text-muted-foreground">{money(item.amount)}</span>
                        </div>
                        <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                          <div className="h-full bg-gradient-to-r from-fuchsia-500 to-violet-600" style={{ width: `${pct}%` }} />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Panel>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Panel title="Last 30 days" action={<TrendingUp className="h-3.5 w-3.5 text-success" />}>
              <ul className="space-y-2 text-xs">
                <li className="flex justify-between"><span className="text-muted-foreground">Tracked spend</span><span className="font-semibold text-destructive tabular-nums">{money(data.last30.spend)}</span></li>
                <li className="flex justify-between"><span className="text-muted-foreground">Rebate earned</span><span className="font-semibold text-success tabular-nums">{money(data.last30.income)}</span></li>
                <li className="flex justify-between"><span className="text-muted-foreground">Net recovery</span><span className={`font-semibold tabular-nums ${data.last30.net >= 0 ? "text-success" : "text-destructive"}`}>{money(data.last30.net)}</span></li>
                <li className="flex justify-between"><span className="text-muted-foreground">Ledger entries</span><span className="tabular-nums">{data.last30.transactions}</span></li>
              </ul>
            </Panel>

            <Panel title="Claim pressure" action={<Clock3 className="h-3.5 w-3.5 text-warning" />}>
              <ul className="space-y-2 text-xs">
                <li className="flex justify-between"><span className="text-muted-foreground">Pending</span><span className="tabular-nums text-warning">{data.pendingClaims}</span></li>
                <li className="flex justify-between"><span className="text-muted-foreground">Approved</span><span className="tabular-nums text-primary">{data.approvedClaims}</span></li>
                <li className="flex justify-between"><span className="text-muted-foreground">Paid</span><span className="tabular-nums text-success">{data.paidClaims}</span></li>
                <li className="flex justify-between"><span className="text-muted-foreground">Declined</span><span className="tabular-nums text-destructive">{data.rejectedClaims}</span></li>
                <li className="flex justify-between"><span className="text-muted-foreground">Approval rate</span><span className="tabular-nums">{data.claimApprovalRate.toFixed(2)}%</span></li>
              </ul>
            </Panel>

            <Panel title="Recovery signals" action={<Wallet className="h-3.5 w-3.5 text-muted-foreground" />}>
              <ul className="space-y-2 text-xs text-white/90">
                <li className="rounded-lg bg-white/[0.03] p-2.5">
                  <div className="font-semibold">Recovery rate</div>
                  <div className="text-[11px] text-muted-foreground">
                    {data.recoveryRate.toFixed(2)}% of tracked commission volume has been returned as rebate.
                  </div>
                </li>
                <li className="rounded-lg bg-white/[0.03] p-2.5">
                  <div className="font-semibold">Tracked accounts</div>
                  <div className="text-[11px] text-muted-foreground">
                    {selectedUserId === "all"
                      ? `${data.activeAccounts} traders currently have TRT ledger activity recorded.`
                      : `${selectedUserLabel} has ${data.transactions} tracked TRT ledger entries recorded.`}
                  </div>
                </li>
                <li className="rounded-lg bg-white/[0.03] p-2.5">
                  <div className="font-semibold">Rewarded traders</div>
                  <div className="text-[11px] text-muted-foreground">
                    {selectedUserId === "all"
                      ? `${data.funded} traders have already generated rebate income in the current dataset.`
                      : `${selectedUserLabel} ${data.funded > 0 ? "has" : "has not yet"} generated rebate income in the current dataset.`}
                  </div>
                </li>
              </ul>
            </Panel>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Panel title="Risk signals" action={<AlertTriangle className="h-3.5 w-3.5 text-accent" />}>
              {data.riskSignals.length === 0 ? (
                <p className="text-xs text-muted-foreground">No major TRT risk signals detected right now.</p>
              ) : (
                <ul className="space-y-2 text-xs">
                  {data.riskSignals.map((signal) => (
                    <li key={`${signal.title}-${signal.detail}`} className="rounded-lg bg-white/[0.03] p-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-white">{signal.title}</span>
                        <Pill tone={signal.tone}>{signal.tone}</Pill>
                      </div>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">{signal.detail}</p>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>

            <Panel title="What this page measures" action={<Users className="h-3.5 w-3.5 text-muted-foreground" />}>
              <ul className="space-y-2 text-xs text-white/90">
                <li className="rounded-lg bg-white/[0.03] p-2.5">
                  <div className="font-semibold">Tracked spend</div>
                  <div className="text-[11px] text-muted-foreground">Total `commissionGenerated` recorded in cashback entries.</div>
                </li>
                <li className="rounded-lg bg-white/[0.03] p-2.5">
                  <div className="font-semibold">Rebate earned</div>
                  <div className="text-[11px] text-muted-foreground">Total `rebateEarned` accumulated from those entries.</div>
                </li>
                <li className="rounded-lg bg-white/[0.03] p-2.5">
                  <div className="font-semibold">Claim pressure</div>
                  <div className="text-[11px] text-muted-foreground">Pending, approved, paid, and declined cashback claims in the moderation pipeline.</div>
                </li>
              </ul>
            </Panel>
          </div>

          <Panel title="Recent TRT ledger activity" action={<Users className="h-3.5 w-3.5 text-muted-foreground" />}>
            {data.recentEntries.length === 0 ? (
              <p className="text-xs text-muted-foreground">No recent TRT ledger activity yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="text-left text-muted-foreground">
                    <tr className="border-b border-white/5">
                      <th className="py-2 font-medium">Date</th>
                      <th className="font-medium">Trader</th>
                      <th className="font-medium">Brand</th>
                      <th className="font-medium">Category</th>
                      <th className="text-right font-medium">Spend</th>
                      <th className="text-right font-medium">Income</th>
                      <th className="font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recentEntries.map((entry) => (
                      <tr key={entry.id} className="border-b border-white/5 text-white/90">
                        <td className="py-2.5 whitespace-nowrap">{new Date(entry.createdAt).toLocaleDateString()}</td>
                        <td>{entry.userName}</td>
                        <td>{entry.brand || "Unassigned"}</td>
                        <td>{entry.category || "-"}</td>
                        <td className="text-right tabular-nums text-destructive">{money(entry.spend)}</td>
                        <td className="text-right tabular-nums text-success">{money(entry.income)}</td>
                        <td><Pill tone={toneForStatus(entry.status)}>{labelStatus(entry.status)}</Pill></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>
        </>
      )}
    </div>
  );
}
