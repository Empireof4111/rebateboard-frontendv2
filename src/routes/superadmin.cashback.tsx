import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader, Panel, DataTable, StatCard, StatusPill, Toolbar } from "@/components/superadmin/AdminUI";
import { Modal, Field, fieldCls, ConfirmDialog, toast } from "@/components/superadmin/AdminActions";
import { useAdminCollection, creditWallet, clearPending, newId } from "@/lib/admin-store";
import { cashbackRows, userWallets, type CashbackRow } from "@/lib/admin-data";
import { Check, Settings2, Plus, RefreshCw, Search } from "lucide-react";

export const Route = createFileRoute("/superadmin/cashback")({
  component: CashbackPage,
});

type Engine = "auto" | "manual";

function CashbackPage() {
  const { items, update, add } = useAdminCollection<CashbackRow>("cashback", cashbackRows as CashbackRow[]);
  const [engine, setEngine] = useState<Engine>("auto");
  const [q, setQ] = useState("");
  const [showRates, setShowRates] = useState(false);
  const [creating, setCreating] = useState(false);
  const [approving, setApproving] = useState<CashbackRow | null>(null);

  const autoRows = items.filter((r) => r.category !== "Prop Firm");
  const manualRows = items.filter((r) => r.category === "Prop Firm");
  const rows = engine === "auto" ? autoRows : manualRows;

  const filtered = useMemo(() => rows.filter((r) =>
    !q.trim() || `${r.user} ${r.partner} ${r.id}`.toLowerCase().includes(q.toLowerCase())
  ), [rows, q]);

  const totalCommission = items.reduce((s, r) => s + r.commissionGenerated, 0);
  const totalEarned = items.reduce((s, r) => s + r.rebateEarned, 0);
  const totalPaid = items.reduce((s, r) => s + r.rebatePaid, 0);
  const totalPending = items.reduce((s, r) => s + r.pending, 0);

  const approve = (r: CashbackRow) => {
    if (r.pending <= 0) { toast.error("Nothing pending to credit"); return; }
    const ok = engine === "auto"
      ? clearPending({ walletsSeed: userWallets, userKey: r.user, amount: r.pending, narration: `${r.partner} rebate cleared` })
      : creditWallet({ walletsSeed: userWallets, userKey: r.user, amount: r.pending, narration: `${r.partner} prop cashback approved`, type: "Cashback Credit" });
    if (!ok) { toast.error("Wallet not found for user"); return; }
    update(r.id, { rebatePaid: r.rebatePaid + r.pending, pending: 0, status: "paid" });
    toast.success(`Credited $${r.pending.toFixed(2)} to ${r.user}`);
  };

  return (
    <div>
      <PageHeader
        title="Cashback Engine"
        subtitle="Two engines — automatic broker/exchange rebates and manual prop-firm cashback claims."
        actions={
          <>
            <button onClick={() => setShowRates(true)} className="glass-pill inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-white">
              <Settings2 className="h-3.5 w-3.5" /> Rates
            </button>
            <button onClick={() => setCreating(true)} className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-600 px-3 py-1.5 text-xs font-semibold text-white">
              <Plus className="h-3.5 w-3.5" /> New entry
            </button>
          </>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Commission generated" value={`$${totalCommission.toFixed(0)}`} delta="last 30d" tone="up" />
        <StatCard label="Rebate earned" value={`$${totalEarned.toFixed(0)}`} delta="@ avg 51%" tone="up" />
        <StatCard label="Rebate paid" value={`$${totalPaid.toFixed(0)}`} delta="auto-credited" tone="up" />
        <StatCard label="Pending rebate" value={`$${totalPending.toFixed(0)}`} delta="awaiting approval" tone="flat" />
      </div>

      {/* Engine switch */}
      <div className="mb-4 flex flex-wrap gap-2">
        <button onClick={() => setEngine("auto")} className={`rounded-xl px-4 py-2 text-xs font-bold ring-1 transition ${engine === "auto" ? "bg-gradient-to-r from-fuchsia-500 to-violet-600 text-white ring-transparent" : "bg-white/5 text-muted-foreground ring-white/10"}`}>
          ⚙️ Auto · Broker / Exchange ({autoRows.length})
        </button>
        <button onClick={() => setEngine("manual")} className={`rounded-xl px-4 py-2 text-xs font-bold ring-1 transition ${engine === "manual" ? "bg-gradient-to-r from-fuchsia-500 to-violet-600 text-white ring-transparent" : "bg-white/5 text-muted-foreground ring-white/10"}`}>
          📝 Manual · Prop Firm ({manualRows.length})
        </button>
      </div>

      <Panel title={engine === "auto" ? "Auto cashback ledger — trade volume → rebate → wallet" : "Manual cashback ledger — claim → review → wallet"}>
        <Toolbar>
          <div className="glass flex flex-1 items-center gap-2 rounded-full px-3 py-1.5 text-xs">
            <Search className="h-3.5 w-3.5 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search user, partner, ID…" className="w-full bg-transparent text-white outline-none placeholder:text-muted-foreground" />
          </div>
          <button
            onClick={() => {
              // Recalculate rebate earned for auto rows (volume × commission × %)
              const next = items.map((r) => {
                if (r.category === "Prop Firm") return r;
                const earned = +(r.commissionGenerated * (r.rebatePercent / 100)).toFixed(2);
                const pending = Math.max(0, +(earned - r.rebatePaid).toFixed(2));
                return { ...r, rebateEarned: earned, pending };
              });
              next.forEach((r) => update(r.id, r));
              toast.success("Auto-cashback recalculated");
            }}
            className="glass-pill inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-white"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Recalculate
          </button>
        </Toolbar>
        <DataTable head={<><th>ID</th><th>User</th><th>Partner</th><th>Volume</th><th>Commission</th><th>Rebate %</th><th>Earned</th><th>Paid</th><th>Pending</th><th>Status</th><th></th></>}>
          {filtered.map((r) => (
            <tr key={r.id}>
              <td className="font-mono text-xs text-muted-foreground">{r.id}</td>
              <td className="font-semibold">{r.user}</td>
              <td>{r.partner}</td>
              <td className="font-mono">{r.volumeLots > 0 ? `${r.volumeLots} lots` : "—"}</td>
              <td className="font-mono">${r.commissionGenerated.toFixed(2)}</td>
              <td className="font-mono text-fuchsia-300">{r.rebatePercent}%</td>
              <td className="font-mono">${r.rebateEarned.toFixed(2)}</td>
              <td className="font-mono text-emerald-300">${r.rebatePaid.toFixed(2)}</td>
              <td className="font-mono text-amber-300">${r.pending.toFixed(2)}</td>
              <td><StatusPill status={r.status} /></td>
              <td className="text-right">
                <button
                  onClick={() => setApproving(r)}
                  disabled={r.pending <= 0}
                  className="inline-flex items-center gap-1 rounded-md bg-emerald-500/15 px-2 py-1 text-[10px] font-bold text-emerald-300 ring-1 ring-emerald-400/30 disabled:opacity-30"
                >
                  <Check className="h-3 w-3" /> Approve & credit
                </button>
              </td>
            </tr>
          ))}
          {filtered.length === 0 && <tr><td colSpan={11} className="py-8 text-center text-sm text-muted-foreground">No rows match.</td></tr>}
        </DataTable>
      </Panel>

      <ConfirmDialog
        open={!!approving}
        onClose={() => setApproving(null)}
        onConfirm={() => approving && approve(approving)}
        title={`Credit $${approving?.pending.toFixed(2)} to ${approving?.user}?`}
        message={`Adds the full pending amount to ${approving?.user}'s wallet (available bucket) and posts a transaction. This is reflected immediately on the Wallets and Transactions pages.`}
        confirmText="Approve & credit"
        tone="primary"
      />

      {showRates && (
        <Modal open onClose={() => setShowRates(false)} title="Configure rebate rates" subtitle="Defaults applied to new cashback rows" size="md">
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Default broker %"><input type="number" defaultValue={50} className={fieldCls} /></Field>
            <Field label="Default exchange %"><input type="number" defaultValue={40} className={fieldCls} /></Field>
            <Field label="Default prop %"><input type="number" defaultValue={50} className={fieldCls} /></Field>
            <Field label="Min payout threshold ($)"><input type="number" defaultValue={20} className={fieldCls} /></Field>
          </div>
          <div className="mt-4 flex justify-end">
            <button onClick={() => { toast.success("Rates updated"); setShowRates(false); }} className="rounded-xl bg-gradient-to-r from-fuchsia-500 to-violet-600 px-4 py-2 text-xs font-bold text-white">Save</button>
          </div>
        </Modal>
      )}

      {creating && (
        <NewCashbackModal
          onClose={() => setCreating(false)}
          onCreate={(row) => { add(row); toast.success(`Cashback row ${row.id} created`); setCreating(false); }}
        />
      )}
    </div>
  );
}

function NewCashbackModal({ onClose, onCreate }: { onClose: () => void; onCreate: (r: CashbackRow) => void }) {
  const [form, setForm] = useState<CashbackRow>({
    id: newId("cb"),
    user: "",
    partner: "",
    category: "Forex Broker",
    volumeLots: 0,
    commissionGenerated: 0,
    rebatePercent: 50,
    rebateEarned: 0,
    rebatePaid: 0,
    pending: 0,
    status: "pending",
    updated: "just now",
  });
  return (
    <Modal open onClose={onClose} title="New cashback entry" size="md"
      footer={<>
        <button onClick={onClose} className="rounded-xl bg-white/10 px-4 py-2 text-xs font-bold text-white">Cancel</button>
        <button onClick={() => {
          if (!form.user || !form.partner) { toast.error("User and partner required"); return; }
          const earned = +(form.commissionGenerated * form.rebatePercent / 100).toFixed(2);
          onCreate({ ...form, rebateEarned: earned, pending: earned });
        }} className="rounded-xl bg-gradient-to-r from-fuchsia-500 to-violet-600 px-4 py-2 text-xs font-bold text-white">Create</button>
      </>}
    >
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="User name"><input className={fieldCls} value={form.user} onChange={(e) => setForm({ ...form, user: e.target.value })} /></Field>
        <Field label="Partner / brand"><input className={fieldCls} value={form.partner} onChange={(e) => setForm({ ...form, partner: e.target.value })} /></Field>
        <Field label="Category">
          <select className={fieldCls} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as CashbackRow["category"] })}>
            <option value="Forex Broker">Forex Broker</option>
            <option value="Crypto Exchange">Crypto Exchange</option>
            <option value="Prop Firm">Prop Firm</option>
          </select>
        </Field>
        <Field label="Volume (lots)"><input type="number" className={fieldCls} value={form.volumeLots} onChange={(e) => setForm({ ...form, volumeLots: Number(e.target.value) })} /></Field>
        <Field label="Commission generated ($)"><input type="number" className={fieldCls} value={form.commissionGenerated} onChange={(e) => setForm({ ...form, commissionGenerated: Number(e.target.value) })} /></Field>
        <Field label="Rebate %"><input type="number" className={fieldCls} value={form.rebatePercent} onChange={(e) => setForm({ ...form, rebatePercent: Number(e.target.value) })} /></Field>
      </div>
    </Modal>
  );
}
