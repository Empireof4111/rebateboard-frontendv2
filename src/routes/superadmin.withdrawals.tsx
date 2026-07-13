import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { PageHeader, Panel, DataTable, StatCard, StatusPill, Toolbar } from "@/components/superadmin/AdminUI";
import { ConfirmDialog, Modal, Field, fieldCls, toast } from "@/components/superadmin/AdminActions";
import { Check, X, Eye, Search, RefreshCw } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { financeApi, type WithdrawalRequest } from "@/lib/finance-api";
import { ApiError } from "@/lib/api";

export const Route = createFileRoute("/superadmin/withdrawals")({
  component: WithdrawalsPage,
});

type StatusFilter = "all" | "PENDING" | "ACTIVE" | "APPROVED" | "DECLINED";

function WithdrawalsPage() {
  const { token } = useAuth();
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [confirm, setConfirm] = useState<{ w: WithdrawalRequest; action: "approve" | "pay" } | null>(null);
  const [rejectTarget, setRejectTarget] = useState<WithdrawalRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [viewing, setViewing] = useState<WithdrawalRequest | null>(null);

  const loadWithdrawals = useCallback(async (pageNum = 0, statusFilter: StatusFilter = filter) => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await financeApi.getAllWithdrawals(token, {
        page: pageNum,
        size: 30,
        status: statusFilter !== "all" ? statusFilter : undefined,
      });
      if (res.payload) {
        setWithdrawals(pageNum === 0 ? res.payload.page : (prev) => [...prev, ...res.payload!.page]);
        setTotalPages(res.payload.totalPages);
        setPage(pageNum);
      }
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Failed to load withdrawals");
    } finally {
      setLoading(false);
    }
  }, [token, filter]);

  useEffect(() => { loadWithdrawals(0); }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  const changeFilter = (f: StatusFilter) => {
    setFilter(f);
    loadWithdrawals(0, f);
  };

  const apply = async (w: WithdrawalRequest, action: "approve" | "pay") => {
    if (!token) return;
    const statusMap = { approve: "ACTIVE", pay: "APPROVED" } as const;
    try {
      await financeApi.updateWithdrawalStatus(token, w.id, { status: statusMap[action] });
      toast.success(`Withdrawal ${w.id} ${action === "pay" ? "marked paid" : "approved"}`);
      loadWithdrawals(0, filter);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Action failed");
    }
    setConfirm(null);
  };

  const applyRejection = async () => {
    if (!token || !rejectTarget) return;
    if (!rejectionReason.trim()) { toast.error("Rejection reason is required"); return; }
    try {
      await financeApi.updateWithdrawalStatus(token, rejectTarget.id, { status: "DECLINED", rejectionReason: rejectionReason.trim() });
      toast.success(`Withdrawal #${rejectTarget.id} rejected`);
      loadWithdrawals(0, filter);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Rejection failed");
    }
    setRejectTarget(null);
    setRejectionReason("");
  };

  const filtered = useMemo(() =>
    withdrawals.filter((w) => !q.trim() || `${w.User?.name ?? ""} ${w.id} ${w.walletAddress ?? ""} ${w.accountNumber ?? ""}`.toLowerCase().includes(q.toLowerCase())),
    [withdrawals, q],
  );

  const pending = withdrawals.filter((w) => w.status === "PENDING");
  const totalPending = pending.reduce((s, w) => s + Number(w.amount), 0);
  const paid = withdrawals.filter((w) => w.status === "APPROVED");
  const totalPaid = paid.reduce((s, w) => s + Number(w.amount), 0);

  const statusPillMap: Record<string, string> = {
    PENDING: "pending",
    ACTIVE: "reviewing",
    APPROVED: "resolved",
    DECLINED: "flagged",
    CANCELED: "responded",
  };

  return (
    <div>
      <PageHeader title="Withdrawals" subtitle="Approve, reject and track every payout request from user wallets."
        actions={
          <button onClick={() => loadWithdrawals(0, filter)} className="glass-pill inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-white">
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </button>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Pending requests" value={String(pending.length)} delta={`$${totalPending.toLocaleString(undefined, { maximumFractionDigits: 2 })} queued`} tone="flat" />
        <StatCard label="Approved (to pay)" value={`$${totalPaid.toLocaleString()}`} delta={`${paid.length} txs`} tone="up" />
        <StatCard label="Rejected" value={String(withdrawals.filter((w) => w.status === "DECLINED").length)} delta="KYC / fraud" tone="down" />
        <StatCard label="Total loaded" value={String(withdrawals.length)} delta="current view" tone="flat" />
      </div>

      <Panel title={`Withdrawal queue — ${filtered.length}`}>
        <Toolbar>
          <div className="glass flex flex-1 items-center gap-2 rounded-full px-3 py-1.5 text-xs">
            <Search className="h-3.5 w-3.5 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search user, ID, destination…" className="w-full bg-transparent text-white outline-none placeholder:text-muted-foreground" />
          </div>
          {(["all", "PENDING", "ACTIVE", "APPROVED", "DECLINED"] as StatusFilter[]).map((f) => (
            <button key={f} onClick={() => changeFilter(f)} className={`rounded-full px-3 py-1.5 text-xs font-semibold ring-1 transition ${filter === f ? "rb-gradient-primary text-white ring-violet-400/40" : "bg-white/5 text-muted-foreground ring-white/10 hover:text-white"}`}>
              {f === "ACTIVE" ? "Approved" : f.charAt(0) + f.slice(1).toLowerCase()}
            </button>
          ))}
        </Toolbar>

        {loading && withdrawals.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">Loading withdrawals…</p>
        ) : (
          <DataTable head={<><th>ID</th><th>User</th><th>Channel</th><th>Destination</th><th>Amount</th><th>Status</th><th>Date</th><th></th></>}>
            {filtered.map((w) => (
              <tr key={w.id}>
                <td className="font-mono text-xs text-muted-foreground">#{w.id}</td>
                <td className="font-semibold">{w.User?.name ?? `User #${w.userId}`}</td>
                <td className="text-xs">{w.channel}</td>
                <td className="font-mono text-xs">{w.walletAddress ?? w.accountNumber ?? "—"}</td>
                <td className="font-mono text-emerald-300">${Number(w.amount).toLocaleString()}</td>
                <td><StatusPill status={statusPillMap[w.status] ?? "pending"} /></td>
                <td className="text-xs text-muted-foreground whitespace-nowrap">
                  {new Date(w.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                </td>
                <td className="text-right">
                  <div className="flex justify-end gap-1">
                    <button onClick={() => setViewing(w)} title="View" className="grid h-7 w-7 place-items-center rounded-md bg-white/10 text-white"><Eye className="h-3 w-3" /></button>
                    {w.status === "PENDING" && (
                      <>
                        <button onClick={() => setConfirm({ w, action: "approve" })} title="Approve" className="grid h-7 w-7 place-items-center rounded-md bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/30"><Check className="h-3 w-3" /></button>
                        <button onClick={() => { setRejectTarget(w); setRejectionReason(""); }} title="Reject" className="grid h-7 w-7 place-items-center rounded-md bg-rose-500/15 text-rose-300 ring-1 ring-rose-400/30"><X className="h-3 w-3" /></button>
                      </>
                    )}
                    {w.status === "ACTIVE" && (
                      <button onClick={() => setConfirm({ w, action: "pay" })} title="Mark paid" className="grid h-7 w-7 place-items-center rounded-md bg-violet-500/15 text-violet-300 ring-1 ring-violet-400/30"><Check className="h-3 w-3" /></button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={8} className="py-8 text-center text-sm text-muted-foreground">No withdrawals match.</td></tr>}
          </DataTable>
        )}

        {totalPages > 1 && page < totalPages - 1 && (
          <div className="mt-4 flex justify-center">
            <button onClick={() => loadWithdrawals(page + 1)} disabled={loading} className="rounded-full bg-white/10 px-4 py-1.5 text-xs text-white disabled:opacity-40">
              {loading ? "Loading…" : "Load more"}
            </button>
          </div>
        )}
      </Panel>

      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={() => confirm && apply(confirm.w, confirm.action)}
        title={
          confirm?.action === "approve" ? `Approve $${Number(confirm.w.amount).toLocaleString()} withdrawal?`
          : `Mark withdrawal #${confirm?.w.id} as paid?`
        }
        message={
          confirm?.action === "approve" ? "Moves the request to approved. Mark as paid once the transfer is confirmed."
          : "Confirms the transfer is complete and marks this withdrawal as fully paid."
        }
        confirmText={confirm?.action === "pay" ? "Mark paid" : "Approve"}
        tone="primary"
      />

      {rejectTarget && (
        <Modal open onClose={() => setRejectTarget(null)} title={`Reject withdrawal #${rejectTarget.id}`} size="sm">
          <p className="mb-3 text-sm text-muted-foreground">
            Provide a reason for rejection. This is shown to the user and recorded in the audit log.
          </p>
          <Field label="Rejection reason (required)">
            <textarea
              className={fieldCls + " min-h-[80px] resize-none"}
              placeholder="e.g. KYC verification required before withdrawal"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
            />
          </Field>
          <div className="mt-4 flex justify-end gap-2">
            <button onClick={() => setRejectTarget(null)} className="rounded-md bg-white/10 px-4 py-1.5 text-xs text-white">Cancel</button>
            <button onClick={applyRejection} disabled={!rejectionReason.trim()} className="rounded-md bg-rose-500 px-4 py-1.5 text-xs font-bold text-white disabled:opacity-40">Reject</button>
          </div>
        </Modal>
      )}

      {viewing && (
        <Modal open onClose={() => setViewing(null)} title={`Withdrawal #${viewing.id}`} size="md">
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="User"><input className={fieldCls} value={viewing.User?.name ?? `User #${viewing.userId}`} readOnly /></Field>
            <Field label="Status"><input className={fieldCls} value={viewing.status} readOnly /></Field>
            <Field label="Channel"><input className={fieldCls} value={viewing.channel} readOnly /></Field>
            <Field label="Amount"><input className={fieldCls} value={`$${Number(viewing.amount).toLocaleString()}`} readOnly /></Field>
            {viewing.walletAddress && <Field label="Wallet address" span={2}><input className={fieldCls} value={viewing.walletAddress} readOnly /></Field>}
            {viewing.bankName && <Field label="Bank name"><input className={fieldCls} value={viewing.bankName} readOnly /></Field>}
            {viewing.accountName && <Field label="Account name"><input className={fieldCls} value={viewing.accountName} readOnly /></Field>}
            {viewing.accountNumber && <Field label="Account number"><input className={fieldCls} value={String(viewing.accountNumber)} readOnly /></Field>}
            {viewing.narration && <Field label="Narration" span={2}><input className={fieldCls} value={viewing.narration} readOnly /></Field>}
            <Field label="Submitted" span={2}><input className={fieldCls} value={new Date(viewing.createdAt).toLocaleString()} readOnly /></Field>
          </div>
        </Modal>
      )}
    </div>
  );
}
