import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { PageHeader, Panel, DataTable, StatCard, StatusPill, Toolbar } from "@/components/superadmin/AdminUI";
import { ConfirmDialog, Modal, Field, fieldCls, toast } from "@/components/superadmin/AdminActions";
import {
  fetchAdminWithdrawals,
  updateAdminWithdrawalStatus,
  type AdminWithdrawalRecord,
} from "@/lib/admin-wallet-api";
import { Check, X, Eye, Search } from "lucide-react";

export const Route = createFileRoute("/superadmin/withdrawals")({
  component: WithdrawalsPage,
});

function WithdrawalsPage() {
  const [items, setItems] = useState<AdminWithdrawalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "paid" | "rejected">("all");
  const [q, setQ] = useState("");
  const [confirm, setConfirm] = useState<{ w: AdminWithdrawalRecord; action: "approve" | "reject" | "pay" } | null>(null);
  const [viewing, setViewing] = useState<AdminWithdrawalRecord | null>(null);

  const loadWithdrawals = async (status = filter) => {
    setLoading(true);
    try {
      const payload = await fetchAdminWithdrawals(status);
      setItems(payload);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to load withdrawals");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadWithdrawals(filter);
  }, [filter]);

  const filtered = useMemo(() => items
    .filter((w) => !q.trim() || `${w.userName} ${w.id} ${w.destination}`.toLowerCase().includes(q.toLowerCase())), [items, q]);

  const pending = items.filter((w) => w.status === "pending");
  const totalPending = pending.reduce((s, w) => s + w.amount, 0);
  const paidTotal = items.filter((w) => w.status === "paid").reduce((s, w) => s + w.amount, 0);

  const apply = async (w: AdminWithdrawalRecord, action: "approve" | "reject" | "pay") => {
    const status = action === "approve" ? "APPROVED" : action === "reject" ? "DECLINED" : "SUCCESSFUL";
    await updateAdminWithdrawalStatus(w.id, status);
    toast.success(`Withdrawal ${w.id} ${action === "pay" ? "paid" : `${action}d`}`);
    await loadWithdrawals(filter);
  };

  return (
    <div>
      <PageHeader title="Withdrawals" subtitle="Live payout requests from user wallets, with approval and settlement controls." />

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Pending requests" value={String(pending.length)} delta={`$${totalPending.toLocaleString()} queued`} tone="flat" />
        <StatCard label="Paid" value={`$${paidTotal.toLocaleString()}`} delta={`${items.filter((w) => w.status === "paid").length} settled`} tone="up" />
        <StatCard label="Approved" value={String(items.filter((w) => w.status === "approved").length)} delta="awaiting settlement" tone="up" />
        <StatCard label="Rejected" value={String(items.filter((w) => w.status === "rejected").length)} delta="declined requests" tone="down" />
      </div>

      <Panel title={`Withdrawal queue — ${filtered.length}`}>
        <Toolbar>
          <div className="glass flex flex-1 items-center gap-2 rounded-full px-3 py-1.5 text-xs">
            <Search className="h-3.5 w-3.5 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search user, ID, destination..." className="w-full bg-transparent text-white outline-none placeholder:text-muted-foreground" />
          </div>
          {(["all", "pending", "approved", "paid", "rejected"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize ring-1 transition ${filter === f ? "bg-gradient-to-r from-fuchsia-500 to-violet-600 text-white ring-fuchsia-400/40" : "bg-white/5 text-muted-foreground ring-white/10 hover:text-white"}`}>{f}</button>
          ))}
        </Toolbar>
        <DataTable head={<><th>ID</th><th>User</th><th>Method</th><th>Destination</th><th>Amount</th><th>Status</th><th>Submitted</th><th></th></>}>
          {loading ? (
            <tr><td colSpan={8} className="py-8 text-center text-sm text-muted-foreground">Loading withdrawals...</td></tr>
          ) : filtered.length === 0 ? (
            <tr><td colSpan={8} className="py-8 text-center text-sm text-muted-foreground">No withdrawals match.</td></tr>
          ) : filtered.map((w) => (
            <tr key={w.id}>
              <td className="font-mono text-xs text-muted-foreground">{w.id}</td>
              <td className="font-semibold">{w.userName}</td>
              <td>{w.method}</td>
              <td className="font-mono text-xs">{w.destination || "—"}</td>
              <td className="font-mono text-emerald-300">${w.amount.toLocaleString()}</td>
              <td><StatusPill status={w.status} /></td>
              <td className="text-xs text-muted-foreground">{new Date(w.submittedAt).toLocaleString()}</td>
              <td className="text-right">
                <div className="flex justify-end gap-1">
                  <button onClick={() => setViewing(w)} title="View" className="grid h-7 w-7 place-items-center rounded-md bg-white/10 text-white"><Eye className="h-3 w-3" /></button>
                  {w.status === "pending" && (
                    <>
                      <button onClick={() => setConfirm({ w, action: "approve" })} title="Approve" className="grid h-7 w-7 place-items-center rounded-md bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/30"><Check className="h-3 w-3" /></button>
                      <button onClick={() => setConfirm({ w, action: "reject" })} title="Reject" className="grid h-7 w-7 place-items-center rounded-md bg-rose-500/15 text-rose-300 ring-1 ring-rose-400/30"><X className="h-3 w-3" /></button>
                    </>
                  )}
                  {w.status === "approved" && (
                    <button onClick={() => setConfirm({ w, action: "pay" })} title="Mark paid" className="grid h-7 w-7 place-items-center rounded-md bg-fuchsia-500/15 text-fuchsia-300 ring-1 ring-fuchsia-400/30"><Check className="h-3 w-3" /></button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </DataTable>
      </Panel>

      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={() => { if (confirm) { void apply(confirm.w, confirm.action).finally(() => setConfirm(null)); } }}
        title={
          confirm?.action === "approve" ? `Approve $${confirm.w.amount} to ${confirm.w.userName}?`
          : confirm?.action === "reject" ? `Reject withdrawal ${confirm.w.id}?`
          : `Mark ${confirm?.w.id} as paid?`
        }
        message={
          confirm?.action === "approve" ? "This moves the request into approved status until the payout is actually sent."
          : confirm?.action === "reject" ? "The request will be declined and remain visible in the user's history."
          : "This confirms the payout is complete and settles the withdrawal against the wallet."
        }
        confirmText={confirm?.action === "reject" ? "Reject" : confirm?.action === "pay" ? "Mark paid" : "Approve"}
        tone={confirm?.action === "reject" ? "danger" : "primary"}
      />

      {viewing && (
        <Modal open onClose={() => setViewing(null)} title={`Withdrawal ${viewing.id}`} size="md">
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="User"><input className={fieldCls} value={viewing.userName} readOnly /></Field>
            <Field label="Status"><input className={fieldCls} value={viewing.status} readOnly /></Field>
            <Field label="Method"><input className={fieldCls} value={viewing.method} readOnly /></Field>
            <Field label="Amount"><input className={fieldCls} value={`$${viewing.amount.toLocaleString()}`} readOnly /></Field>
            <Field label="Destination" span={2}><input className={fieldCls} value={viewing.destination} readOnly /></Field>
            <Field label="Submitted" span={2}><input className={fieldCls} value={new Date(viewing.submittedAt).toLocaleString()} readOnly /></Field>
            {viewing.narration && <Field label="Narration" span={2}><textarea className={fieldCls} rows={3} value={viewing.narration} readOnly /></Field>}
          </div>
        </Modal>
      )}
    </div>
  );
}
