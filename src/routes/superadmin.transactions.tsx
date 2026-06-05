import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { PageHeader, Panel, DataTable, StatCard, StatusPill, Pill, Toolbar } from "@/components/superadmin/AdminUI";
import { toast, selectCls } from "@/components/superadmin/AdminActions";
import { Search, Filter, Download, RefreshCw } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { financeApi, type WalletTransaction, type PaginatedResult } from "@/lib/finance-api";
import { ApiError } from "@/lib/api";

export const Route = createFileRoute("/superadmin/transactions")({
  component: TransactionsPage,
});

type Filters = { activity: string; channel: string; status: string; userId: string };

function TransactionsPage() {
  const { token } = useAuth();
  const [result, setResult] = useState<PaginatedResult<WalletTransaction> | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [filters, setFilters] = useState<Filters>({ activity: "", channel: "", status: "", userId: "" });
  const [q, setQ] = useState("");

  const loadTransactions = useCallback(async (pageNum = 0, f: Filters = filters) => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await financeApi.getTransactions(token, {
        page: pageNum,
        size: 50,
        activity: f.activity || undefined,
        channel: f.channel || undefined,
        status: f.status || undefined,
        userId: f.userId ? Number(f.userId) : undefined,
      });
      if (res.payload) {
        setResult((prev) => pageNum === 0
          ? res.payload!
          : { ...res.payload!, page: [...(prev?.page ?? []), ...res.payload!.page] }
        );
        setPage(pageNum);
      }
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Failed to load transactions");
    } finally {
      setLoading(false);
    }
  }, [token, filters]);

  useEffect(() => { loadTransactions(0); }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  const applyFilters = (next: Partial<Filters>) => {
    const merged = { ...filters, ...next };
    setFilters(merged);
    loadTransactions(0, merged);
  };

  const transactions = result?.page ?? [];
  const credits = transactions.filter((t) => t.activity === "CREDIT");
  const debits = transactions.filter((t) => t.activity === "DEBIT");
  const totalIn = credits.reduce((s, t) => s + Number(t.amount), 0);
  const totalOut = debits.reduce((s, t) => s + Number(t.amount), 0);

  const filtered = q.trim()
    ? transactions.filter((t) => `${t.ref} ${t.narration} ${t.channel} ${t.user?.name}`.toLowerCase().includes(q.toLowerCase()))
    : transactions;

  const activityTone = (a: string) => a === "CREDIT" ? "text-emerald-300" : a === "DEBIT" ? "text-rose-300" : "text-white";

  return (
    <div>
      <PageHeader
        title="Transactions"
        subtitle="Every financial event across wallets — cashback, transfers, withdrawals, and adjustments."
        actions={
          <>
            <button onClick={() => loadTransactions(0)} className="glass-pill inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-white">
              <RefreshCw className="h-3.5 w-3.5" /> Refresh
            </button>
            <button className="glass-pill inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-white">
              <Download className="h-3.5 w-3.5" /> Export
            </button>
          </>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Total volume" value={`$${(totalIn + totalOut).toLocaleString()}`} delta={`${transactions.length} records`} tone="up" />
        <StatCard label="Credits" value={`$${totalIn.toLocaleString(undefined, { maximumFractionDigits: 2 })}`} delta="cashback + manual" tone="up" />
        <StatCard label="Debits" value={`$${totalOut.toLocaleString(undefined, { maximumFractionDigits: 2 })}`} delta="withdrawals + adjustments" tone="flat" />
        <StatCard label="Pending" value={String(transactions.filter((t) => t.status === "PENDING").length)} delta="awaiting clearance" tone="flat" />
      </div>

      <Panel title="All transactions">
        <Toolbar>
          <div className="glass flex flex-1 items-center gap-2 rounded-full px-3 py-1.5 text-xs">
            <Search className="h-3.5 w-3.5 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search reference, user, narration…" className="w-full bg-transparent text-white outline-none placeholder:text-muted-foreground" />
          </div>
          <select
            className={`${selectCls} rounded-full py-1.5 text-xs`}
            value={filters.activity}
            onChange={(e) => applyFilters({ activity: e.target.value })}
          >
            <option value="">All types</option>
            <option value="CREDIT">Credit</option>
            <option value="DEBIT">Debit</option>
            <option value="UPDATE">Update</option>
          </select>
          <select
            className={`${selectCls} rounded-full py-1.5 text-xs`}
            value={filters.status}
            onChange={(e) => applyFilters({ status: e.target.value })}
          >
            <option value="">All statuses</option>
            <option value="SUCCESSFUL">Successful</option>
            <option value="PENDING">Pending</option>
            <option value="FAILED">Failed</option>
          </select>
          <select
            className={`${selectCls} rounded-full py-1.5 text-xs`}
            value={filters.channel}
            onChange={(e) => applyFilters({ channel: e.target.value })}
          >
            <option value="">All channels</option>
            <option value="Rebateboard">Rebateboard</option>
            <option value="Cashback">Cashback</option>
            <option value="Wallet Transfer">Wallet Transfer</option>
            <option value="Adjustment">Adjustment</option>
            <option value="Funding">Funding</option>
            <option value="Transfer">Transfer</option>
          </select>
        </Toolbar>

        {loading && transactions.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">Loading transactions…</p>
        ) : filtered.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">No transactions found.</p>
        ) : (
          <DataTable head={<><th>Date</th><th>Reference</th><th>User</th><th>Activity</th><th>Channel</th><th>Amount</th><th>Narration</th><th>Status</th></>}>
            {filtered.map((t) => (
              <tr key={t.id}>
                <td className="text-muted-foreground text-xs whitespace-nowrap">
                  {new Date(t.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                </td>
                <td className="font-mono text-xs">{t.ref}</td>
                <td className="font-semibold">{t.user?.name ?? `User #${t.userId}`}</td>
                <td><Pill>{t.activity}</Pill></td>
                <td className="text-xs">{t.channel}</td>
                <td className={`font-mono font-semibold ${activityTone(t.activity)}`}>
                  {t.activity === "DEBIT" ? "−" : "+"}${Number(t.amount).toFixed(2)}
                </td>
                <td className="text-muted-foreground text-xs max-w-xs line-clamp-1">{t.narration ?? "—"}</td>
                <td>
                  <StatusPill status={
                    t.status === "SUCCESSFUL" ? "resolved"
                    : t.status === "PENDING" ? "pending"
                    : t.status === "FAILED" ? "flagged"
                    : "responded"
                  } />
                </td>
              </tr>
            ))}
          </DataTable>
        )}

        {result && page < result.totalPages - 1 && (
          <div className="mt-4 flex justify-center">
            <button onClick={() => loadTransactions(page + 1)} disabled={loading} className="rounded-full bg-white/10 px-4 py-1.5 text-xs text-white disabled:opacity-40">
              {loading ? "Loading…" : `Load more (page ${page + 2} of ${result.totalPages})`}
            </button>
          </div>
        )}
      </Panel>
    </div>
  );
}
