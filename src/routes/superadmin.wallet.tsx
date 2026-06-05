import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { PageHeader, Panel, DataTable, StatCard, Toolbar } from "@/components/superadmin/AdminUI";
import { toast } from "@/components/superadmin/AdminActions";
import { RefreshCw } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { financeApi, type WalletTransaction, type AdminFinanceStats } from "@/lib/finance-api";
import { ApiError } from "@/lib/api";

export const Route = createFileRoute("/superadmin/wallet")({
  component: WalletAdmin,
});

function WalletAdmin() {
  const { token } = useAuth();
  const [logs, setLogs] = useState<WalletTransaction[]>([]);
  const [stats, setStats] = useState<AdminFinanceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const load = useCallback(async (pageNum = 0) => {
    if (!token) return;
    setLoading(true);
    try {
      const [logsRes, statsRes] = await Promise.all([
        financeApi.getTransactions(token, { page: pageNum, size: 50 }),
        pageNum === 0 ? financeApi.getAdminFinanceStats(token) : Promise.resolve({ success: true, message: "", payload: stats }),
      ]);
      if (logsRes.payload) {
        setLogs(pageNum === 0 ? logsRes.payload.page : (prev) => [...prev, ...logsRes.payload!.page]);
        setHasMore(pageNum < logsRes.payload.totalPages - 1);
        setPage(pageNum);
      }
      if (statsRes.payload && pageNum === 0) setStats(statsRes.payload as AdminFinanceStats);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Failed to load ledger");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(0); }, [load]);

  const fmt = (d?: string) => d ? new Date(d).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

  const activityColor = (activity: string) =>
    activity === "CREDIT" ? "text-emerald-300" : activity === "DEBIT" ? "text-rose-300" : "text-white";

  const activitySign = (activity: string) => activity === "CREDIT" ? "+" : activity === "DEBIT" ? "−" : "";

  return (
    <div>
      <PageHeader title="Wallet Ledger" subtitle="Every wallet transaction across the platform, fully auditable." />

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Total balance" value={stats ? `$${Number(stats.totalBalance).toLocaleString()}` : "—"} delta="all wallets" tone="up" />
        <StatCard label="Total credits" value={stats ? `$${Number(stats.totalCredits).toLocaleString()}` : "—"} delta="lifetime" tone="up" />
        <StatCard label="Total debits" value={stats ? `$${Number(stats.totalDebits).toLocaleString()}` : "—"} delta="lifetime" tone="down" />
        <StatCard label="Active wallets" value={stats ? String(stats.totalWallets) : "—"} delta="platform" tone="flat" />
      </div>

      <Toolbar>
        <button onClick={() => load(0)} className="grid h-7 w-7 place-items-center rounded-md bg-white/5 text-white ring-1 ring-white/10" title="Refresh">
          <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
        </button>
      </Toolbar>

      <Panel title={`Latest entries — ${logs.length}`}>
        <DataTable head={<><th>ID</th><th>User</th><th>Type</th><th>Channel</th><th>Amount</th><th>Narration</th><th>Status</th><th>Time</th></>}>
          {loading && logs.length === 0 && <tr><td colSpan={8} className="py-8 text-center text-sm text-muted-foreground">Loading…</td></tr>}
          {logs.map((t) => (
            <tr key={t.id}>
              <td className="font-mono text-xs text-muted-foreground">#{t.id}</td>
              <td className="font-semibold">{t.user?.name ?? `User #${t.userId}`}</td>
              <td>{t.activity}</td>
              <td className="text-xs text-muted-foreground">{t.channel}</td>
              <td className={`font-mono font-bold ${activityColor(t.activity)}`}>
                {activitySign(t.activity)}${Number(t.amount).toLocaleString()}
              </td>
              <td className="max-w-[200px] truncate text-xs text-muted-foreground">{t.narration ?? "—"}</td>
              <td className="text-xs capitalize text-muted-foreground">{t.status?.toLowerCase()}</td>
              <td className="text-xs text-muted-foreground">{fmt(t.createdAt)}</td>
            </tr>
          ))}
          {!loading && logs.length === 0 && <tr><td colSpan={8} className="py-8 text-center text-sm text-muted-foreground">No transactions found.</td></tr>}
        </DataTable>
        {hasMore && (
          <div className="mt-3 flex justify-center">
            <button onClick={() => load(page + 1)} disabled={loading}
              className="rounded-full bg-white/5 px-4 py-1.5 text-xs text-white ring-1 ring-white/10 hover:bg-white/10 disabled:opacity-50">
              {loading ? "Loading…" : "Load more"}
            </button>
          </div>
        )}
      </Panel>
    </div>
  );
}
