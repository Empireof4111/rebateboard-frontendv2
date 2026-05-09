import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader, Panel, DataTable, StatCard, StatusPill, Toolbar } from "@/components/superadmin/AdminUI";
import { ConfirmDialog, Modal, Field, fieldCls, toast } from "@/components/superadmin/AdminActions";
import { useAdminCollection, debitWallet, addAudit } from "@/lib/admin-store";
import { withdrawals as seed, type Withdrawal, userWallets } from "@/lib/admin-data";
import { Check, X, Eye, Search } from "lucide-react";

export const Route = createFileRoute("/superadmin/withdrawals")({
  component: WithdrawalsPage,
});

function WithdrawalsPage() {
  const { items, update } = useAdminCollection<Withdrawal>("withdrawals", seed);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "paid" | "rejected">("all");
  const [q, setQ] = useState("");
  const [confirm, setConfirm] = useState<{ w: Withdrawal; action: "approve" | "reject" | "pay" } | null>(null);
  const [viewing, setViewing] = useState<Withdrawal | null>(null);

  const filtered = useMemo(() => items
    .filter((w) => filter === "all" || w.status === filter)
    .filter((w) => !q.trim() || `${w.user} ${w.id} ${w.destination}`.toLowerCase().includes(q.toLowerCase())), [items, filter, q]);

  const pending = items.filter((w) => w.status === "pending");
  const totalPending = pending.reduce((s, w) => s + w.amount, 0);
  const paid30 = items.filter((w) => w.status === "paid").reduce((s, w) => s + w.amount, 0);

  const apply = (w: Withdrawal, action: "approve" | "reject" | "pay") => {
    const status: Withdrawal["status"] = action === "approve" ? "approved" : action === "reject" ? "rejected" : "paid";
    update(w.id, { status });
    if (action === "approve") {
      addAudit({ actor: "@admin", action: `Withdrawal approved $${w.amount}`, target: w.user });
    } else if (action === "reject") {
      addAudit({ actor: "@admin", action: `Withdrawal rejected ${w.id}`, target: w.user });
    } else if (action === "pay") {
      // Debit wallet → log Tx → audit
      debitWallet({
        walletsSeed: userWallets,
        userKey: w.user,
        amount: w.amount,
        narration: `Withdrawal ${w.id} via ${w.method} → ${w.destination}`,
        type: "Withdrawal",
        countWithdrawn: true,
      });
    }
    toast.success(`Withdrawal ${w.id} ${action === "pay" ? "paid · wallet debited" : action + "d"}`);
  };

  return (
    <div>
      <PageHeader title="Withdrawals" subtitle="Approve, reject and track every payout request from user wallets." />

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Pending requests" value={String(pending.length)} delta={`$${totalPending.toLocaleString()} queued`} tone="flat" />
        <StatCard label="Paid (in queue)" value={`$${paid30.toLocaleString()}`} delta={`${items.filter((w) => w.status === "paid").length} txs`} tone="up" />
        <StatCard label="Avg processing" value="6.2h" delta="estimate" tone="up" />
        <StatCard label="Rejected" value={String(items.filter((w) => w.status === "rejected").length)} delta="KYC / fraud" tone="down" />
      </div>

      <Panel title={`Withdrawal queue — ${filtered.length}`}>
        <Toolbar>
          <div className="glass flex flex-1 items-center gap-2 rounded-full px-3 py-1.5 text-xs">
            <Search className="h-3.5 w-3.5 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search user, ID, destination…" className="w-full bg-transparent text-white outline-none placeholder:text-muted-foreground" />
          </div>
          {(["all", "pending", "approved", "paid", "rejected"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize ring-1 transition ${filter === f ? "bg-gradient-to-r from-fuchsia-500 to-violet-600 text-white ring-fuchsia-400/40" : "bg-white/5 text-muted-foreground ring-white/10 hover:text-white"}`}>{f}</button>
          ))}
        </Toolbar>
        <DataTable head={<><th>ID</th><th>User</th><th>Method</th><th>Destination</th><th>Amount</th><th>Status</th><th>Time</th><th></th></>}>
          {filtered.map((w) => (
            <tr key={w.id}>
              <td className="font-mono text-xs text-muted-foreground">{w.id}</td>
              <td className="font-semibold">{w.user}</td>
              <td>{w.method}</td>
              <td className="font-mono text-xs">{w.destination}</td>
              <td className="font-mono text-emerald-300">${w.amount.toLocaleString()}</td>
              <td><StatusPill status={w.status} /></td>
              <td className="text-xs text-muted-foreground">{w.time}</td>
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
          {filtered.length === 0 && <tr><td colSpan={8} className="py-8 text-center text-sm text-muted-foreground">No withdrawals match.</td></tr>}
        </DataTable>
      </Panel>

      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={() => { if (confirm) apply(confirm.w, confirm.action); }}
        title={
          confirm?.action === "approve" ? `Approve $${confirm.w.amount} to ${confirm.w.user}?`
          : confirm?.action === "reject" ? `Reject withdrawal ${confirm.w.id}?`
          : `Mark ${confirm?.w.id} as paid?`
        }
        message={
          confirm?.action === "approve" ? "This will move the request to approved. You will then mark it as paid once the on-chain / wire transfer is confirmed."
          : confirm?.action === "reject" ? "Funds remain in the user's wallet. Notify the user manually if needed."
          : "Confirms the wire / on-chain transfer is complete. The user wallet is debited."
        }
        confirmText={confirm?.action === "reject" ? "Reject" : confirm?.action === "pay" ? "Mark paid" : "Approve"}
        tone={confirm?.action === "reject" ? "danger" : "primary"}
      />

      {viewing && (
        <Modal open onClose={() => setViewing(null)} title={`Withdrawal ${viewing.id}`} size="md">
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="User"><input className={fieldCls} value={viewing.user} readOnly /></Field>
            <Field label="Status"><input className={fieldCls} value={viewing.status} readOnly /></Field>
            <Field label="Method"><input className={fieldCls} value={viewing.method} readOnly /></Field>
            <Field label="Amount"><input className={fieldCls} value={`$${viewing.amount.toLocaleString()}`} readOnly /></Field>
            <Field label="Destination" span={2}><input className={fieldCls} value={viewing.destination} readOnly /></Field>
            <Field label="Submitted" span={2}><input className={fieldCls} value={viewing.time} readOnly /></Field>
          </div>
        </Modal>
      )}
    </div>
  );
}
