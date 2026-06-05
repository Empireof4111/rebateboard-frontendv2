import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { PageHeader, Panel, DataTable, StatusPill, StatCard, Toolbar } from "@/components/superadmin/AdminUI";
import { toast } from "@/components/superadmin/AdminActions";
import { RefreshCw, Search } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { financeApi, type WithdrawalRequest, type AdminFinanceStats } from "@/lib/finance-api";
import { ApiError } from "@/lib/api";

export const Route = createFileRoute("/superadmin/payouts")({
  component: PayoutsPage,
});

type FilterStatus = "all" | "PENDING" | "APPROVED" | "PAID" | "DECLINED";

function statusToDisplay(s: string) {
  const map: Record<string, string> = { PENDING: "pending", APPROVED: "approved", PAID: "paid", DECLINED: "rejected" };
  return map[s?.toUpperCase()] ?? s.toLowerCase();
}

function PayoutsPage() {
  const { token } = useAuth();
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [stats, setStats] = useState<AdminFinanceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [q, setQ] = useState("");

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [wRes, sRes] = await Promise.all([
        financeApi.getAllWithdrawals(token, { size: 200 }),
        financeApi.getAdminFinanceStats(token),
      ]);
      if (wRes.payload) setWithdrawals(wRes.payload.page);
      if (sRes.payload) setStats(sRes.payload);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Failed to load payouts");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => withdrawals.filter((w) => {
    const matchStatus = filter === "all" || w.status?.toUpperCase() === filter;
    const matchQ = !q.trim() || `${w.User?.name} ${w.channel} ${w.walletAddress ?? ""} ${w.accountNumber ?? ""}`.toLowerCase().includes(q.toLowerCase());
    return matchStatus && matchQ;
  }), [withdrawals, filter, q]);

  const updateStatus = async (id: number, status: string) => {
    if (!token) return;
    try {
      await financeApi.updateWithdrawalStatus(token, id, status);
      toast.success(`Withdrawal #${id} → ${status}`);
      load();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Update failed");
    }
  };

  const fmt = (d?: string) => d ? new Date(d).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

  const pending = withdrawals.filter((w) => w.status?.toUpperCase() === "PENDING").length;
  const paid = withdrawals.filter((w) => w.status?.toUpperCase() === "PAID").length;

  return (
    <div>
      <PageHeader title="Payouts / Withdrawals" subtitle="User withdrawal requests from the RebateBoard wallet." />

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Pending withdrawals" value={stats ? `$${Number(stats.pendingWithdrawals).toLocaleString()}` : "—"} delta={`${pending} requests`} tone="flat" />
        <StatCard label="Approved" value={stats ? `$${Number(stats.approvedWithdrawals).toLocaleString()}` : "—"} delta="awaiting payment" tone="flat" />
        <StatCard label="Total paid" value={stats ? `$${Number(stats.paidWithdrawals).toLocaleString()}` : "—"} delta={`${paid} processed`} tone="up" />
        <StatCard label="Total wallets" value={stats ? String(stats.totalWallets) : "—"} delta="platform total" tone="up" />
      </div>

      <Toolbar>
        {(["all", "PENDING", "APPROVED", "PAID", "DECLINED"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize ring-1 transition ${filter === f ? "bg-gradient-to-r from-fuchsia-500 to-violet-600 text-white ring-fuchsia-400/40" : "bg-white/5 text-muted-foreground ring-white/10 hover:text-white"}`}>
            {f.toLowerCase()}
          </button>
        ))}
        <div className="glass ml-auto flex items-center gap-2 rounded-full px-3 py-1.5 text-xs">
          <Search className="h-3.5 w-3.5 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search user, address…" className="w-40 bg-transparent text-white outline-none" />
        </div>
        <button onClick={load} className="grid h-7 w-7 place-items-center rounded-md bg-white/5 text-white ring-1 ring-white/10">
          <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
        </button>
      </Toolbar>

      <Panel title={`Withdrawal queue — ${filtered.length}`}>
        <DataTable head={<><th>ID</th><th>User</th><th>Amount</th><th>Channel</th><th>Destination</th><th>Status</th><th>Requested</th><th></th></>}>
          {loading && <tr><td colSpan={8} className="py-8 text-center text-sm text-muted-foreground">Loading…</td></tr>}
          {!loading && filtered.map((w) => {
            const ds = statusToDisplay(w.status);
            const dest = w.walletAddress || (w.accountNumber ? `****${String(w.accountNumber).slice(-4)}` : "—");
            return (
              <tr key={w.id}>
                <td className="font-mono text-xs text-muted-foreground">#{w.id}</td>
                <td className="font-semibold">{w.User?.name ?? `Wallet #${w.walletId}`}</td>
                <td className="font-mono text-emerald-300">${Number(w.amount).toLocaleString()}</td>
                <td>{w.channel}</td>
                <td className="max-w-[140px] truncate font-mono text-xs text-muted-foreground">{dest}</td>
                <td><StatusPill status={ds} /></td>
                <td className="text-xs text-muted-foreground">{fmt(w.createdAt)}</td>
                <td className="text-right">
                  <div className="flex justify-end gap-1">
                    {w.status?.toUpperCase() === "PENDING" && (
                      <>
                        <button onClick={() => updateStatus(w.id, "ACTIVE")}
                          className="rounded-md bg-emerald-500/15 px-2 py-1 text-[10px] font-bold text-emerald-300 ring-1 ring-emerald-400/30">
                          Approve
                        </button>
                        <button onClick={() => updateStatus(w.id, "DECLINED")}
                          className="rounded-md bg-rose-500/15 px-2 py-1 text-[10px] font-bold text-rose-300 ring-1 ring-rose-400/30">
                          Decline
                        </button>
                      </>
                    )}
                    {w.status?.toUpperCase() === "APPROVED" && (
                      <button onClick={() => updateStatus(w.id, "PAID")}
                        className="rounded-md bg-amber-500/15 px-2 py-1 text-[10px] font-bold text-amber-300 ring-1 ring-amber-400/30">
                        Mark paid
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
          {!loading && filtered.length === 0 && <tr><td colSpan={8} className="py-8 text-center text-sm text-muted-foreground">No withdrawals match.</td></tr>}
        </DataTable>
      </Panel>
    </div>
  );
}
