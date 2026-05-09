import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader, Panel, DataTable, StatCard, Pill, Toolbar } from "@/components/superadmin/AdminUI";
import { Modal, Field, fieldCls, ConfirmDialog, toast } from "@/components/superadmin/AdminActions";
import { useAdminCollection, creditWallet, debitWallet, setWalletStatus, addTransaction } from "@/lib/admin-store";
import { userWallets, type UserWallet } from "@/lib/admin-data";
import { Plus, Minus, History, Snowflake, Search, Send } from "lucide-react";

export const Route = createFileRoute("/superadmin/wallets")({
  component: WalletsPage,
});

type Action = "credit" | "debit" | null;

function WalletsPage() {
  const { items } = useAdminCollection<UserWallet & { id: string }>("userWallets", userWallets.map((w) => ({ ...w, id: w.walletId })));
  const [q, setQ] = useState("");
  const [acting, setActing] = useState<{ w: UserWallet; type: Action }>({ w: items[0], type: null });
  const [history, setHistory] = useState<UserWallet | null>(null);
  const [freezing, setFreezing] = useState<UserWallet | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkOpen, setBulkOpen] = useState(false);

  const filtered = useMemo(() => items.filter((w) => !q.trim() || `${w.name} ${w.walletId} ${w.userId}`.toLowerCase().includes(q.toLowerCase())), [items, q]);

  const totalAvail = items.reduce((s, w) => s + w.available, 0);
  const totalPending = items.reduce((s, w) => s + w.pending, 0);
  const totalEarned = items.reduce((s, w) => s + w.totalEarned, 0);
  const totalArr = items.reduce((s, w) => s + (w.arr ?? 0), 0);

  const toggle = (id: string) => setSelected((s) => {
    const n = new Set(s);
    if (n.has(id)) n.delete(id); else n.add(id);
    return n;
  });

  return (
    <div>
      <PageHeader
        title="User Wallets"
        subtitle="USD cashback + ARR reward token. Credit, debit, freeze, bulk pay or audit any wallet."
        actions={
          <>
            <button
              disabled={selected.size === 0}
              onClick={() => setBulkOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-30"
            >
              <Send className="h-3.5 w-3.5" /> Bulk pay {selected.size > 0 && `(${selected.size})`}
            </button>
          </>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Total available" value={`$${totalAvail.toLocaleString(undefined, { maximumFractionDigits: 2 })}`} delta="across all users" tone="up" />
        <StatCard label="Pending" value={`$${totalPending.toLocaleString(undefined, { maximumFractionDigits: 2 })}`} delta="awaiting clearance" tone="flat" />
        <StatCard label="Lifetime earned" value={`$${totalEarned.toLocaleString(undefined, { maximumFractionDigits: 2 })}`} delta="+18% MoM" tone="up" />
        <StatCard label="Total ARR" value={`${totalArr.toLocaleString()} ARR`} delta="reward token float" tone="flat" />
      </div>

      <Panel title={`All user wallets — ${filtered.length}`}>
        <Toolbar>
          <div className="glass flex flex-1 items-center gap-2 rounded-full px-3 py-1.5 text-xs">
            <Search className="h-3.5 w-3.5 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name, wallet ID…" className="w-full bg-transparent text-white outline-none" />
          </div>
        </Toolbar>
        <DataTable head={<>
          <th><input type="checkbox" onChange={(e) => setSelected(e.target.checked ? new Set(filtered.map((w) => w.walletId)) : new Set())} /></th>
          <th>Wallet</th><th>User</th><th>Available</th><th>Pending</th><th>ARR</th><th>Earned</th><th>Withdrawn</th><th>Status</th><th></th>
        </>}>
          {filtered.map((w) => (
            <tr key={w.walletId}>
              <td><input type="checkbox" checked={selected.has(w.walletId)} onChange={() => toggle(w.walletId)} /></td>
              <td className="font-mono text-xs text-muted-foreground">{w.walletId}</td>
              <td className="font-semibold">{w.name}</td>
              <td className="font-mono text-emerald-300">${w.available.toFixed(2)}</td>
              <td className="font-mono text-amber-300">${w.pending.toFixed(2)}</td>
              <td className="font-mono text-fuchsia-300">{(w.arr ?? 0).toLocaleString()}</td>
              <td className="font-mono">${w.totalEarned.toFixed(2)}</td>
              <td className="font-mono text-muted-foreground">${w.totalWithdrawn.toFixed(2)}</td>
              <td>{w.status === "active" ? <Pill tone="good">active</Pill> : <Pill tone="bad">frozen</Pill>}</td>
              <td className="text-right">
                <div className="flex justify-end gap-1">
                  <button onClick={() => setActing({ w, type: "credit" })} title="Credit" className="grid h-7 w-7 place-items-center rounded-md bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/30"><Plus className="h-3 w-3" /></button>
                  <button onClick={() => setActing({ w, type: "debit" })} title="Debit" className="grid h-7 w-7 place-items-center rounded-md bg-rose-500/15 text-rose-300 ring-1 ring-rose-400/30"><Minus className="h-3 w-3" /></button>
                  <button onClick={() => setFreezing(w)} title={w.status === "active" ? "Freeze" : "Unfreeze"} className="grid h-7 w-7 place-items-center rounded-md bg-sky-500/15 text-sky-300 ring-1 ring-sky-400/30"><Snowflake className="h-3 w-3" /></button>
                  <button onClick={() => setHistory(w)} title="History" className="grid h-7 w-7 place-items-center rounded-md bg-white/10 text-white"><History className="h-3 w-3" /></button>
                </div>
              </td>
            </tr>
          ))}
        </DataTable>
      </Panel>

      {acting.type && acting.w && (
        <CreditDebitModal
          wallet={acting.w}
          mode={acting.type}
          onClose={() => setActing({ w: acting.w, type: null })}
          onSubmit={({ amount, currency, narration, type }) => {
            const ok = acting.type === "credit"
              ? creditWallet({ walletsSeed: userWallets, userKey: acting.w.userId, amount, currency, narration, type })
              : debitWallet({ walletsSeed: userWallets, userKey: acting.w.userId, amount, currency, narration, type });
            if (ok) toast.success(`${acting.type === "credit" ? "Credited" : "Debited"} ${currency === "ARR" ? `${amount} ARR` : `$${amount}`} ${acting.type === "credit" ? "to" : "from"} ${acting.w.name}`);
            else toast.error("Wallet not found");
            setActing({ w: acting.w, type: null });
          }}
        />
      )}

      <ConfirmDialog
        open={!!freezing}
        onClose={() => setFreezing(null)}
        onConfirm={() => freezing && setWalletStatus({ walletsSeed: userWallets, walletId: freezing.walletId, status: freezing.status === "active" ? "frozen" : "active" })}
        title={`${freezing?.status === "active" ? "Freeze" : "Unfreeze"} ${freezing?.name}'s wallet?`}
        message={freezing?.status === "active" ? "Freezing blocks all withdrawals and credits until unfrozen." : "Wallet will return to normal operation."}
        confirmText={freezing?.status === "active" ? "Freeze" : "Unfreeze"}
        tone={freezing?.status === "active" ? "danger" : "primary"}
      />

      {history && (
        <Modal open onClose={() => setHistory(null)} title={`${history.name} — wallet history`} size="lg">
          <p className="mb-3 text-xs text-muted-foreground">Open the Transactions page filtered by this user for the full ledger.</p>
          <dl className="grid gap-2 text-sm">
            <div className="flex justify-between"><dt className="text-muted-foreground">Wallet ID</dt><dd className="font-mono">{history.walletId}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Available USD</dt><dd className="font-mono text-emerald-300">${history.available.toFixed(2)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Pending USD</dt><dd className="font-mono text-amber-300">${history.pending.toFixed(2)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">ARR</dt><dd className="font-mono text-fuchsia-300">{(history.arr ?? 0).toLocaleString()}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Lifetime earned</dt><dd className="font-mono">${history.totalEarned.toFixed(2)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Lifetime withdrawn</dt><dd className="font-mono">${history.totalWithdrawn.toFixed(2)}</dd></div>
          </dl>
        </Modal>
      )}

      {bulkOpen && (
        <BulkPayModal
          wallets={items.filter((w) => selected.has(w.walletId))}
          onClose={() => setBulkOpen(false)}
          onConfirm={(amount, narration) => {
            items.filter((w) => selected.has(w.walletId)).forEach((w) => {
              creditWallet({ walletsSeed: userWallets, userKey: w.userId, amount, narration, type: "Bulk Payout" });
            });
            toast.success(`Paid $${amount} × ${selected.size} wallets`);
            setSelected(new Set());
            setBulkOpen(false);
          }}
        />
      )}
    </div>
  );
}

function CreditDebitModal({ wallet, mode, onClose, onSubmit }: {
  wallet: UserWallet; mode: "credit" | "debit"; onClose: () => void;
  onSubmit: (v: { amount: number; currency: "USD" | "ARR"; narration: string; type: string }) => void;
}) {
  const [amount, setAmount] = useState(0);
  const [currency, setCurrency] = useState<"USD" | "ARR">("USD");
  const [type, setType] = useState(mode === "credit" ? "Manual Credit" : "Manual Debit");
  const [narration, setNarration] = useState("");
  return (
    <Modal open onClose={onClose}
      title={`${mode === "credit" ? "Credit" : "Debit"} ${wallet.name}`}
      subtitle={`Wallet ${wallet.walletId} · current available $${wallet.available.toFixed(2)} · ${wallet.arr ?? 0} ARR`}
      size="md"
      footer={<>
        <button onClick={onClose} className="rounded-xl bg-white/10 px-4 py-2 text-xs font-bold text-white">Cancel</button>
        <button onClick={() => { if (amount <= 0) { toast.error("Amount required"); return; } onSubmit({ amount, currency, narration: narration || `${type} by admin`, type }); }} className={`rounded-xl px-4 py-2 text-xs font-bold text-white ${mode === "credit" ? "bg-gradient-to-r from-emerald-500 to-emerald-600" : "bg-gradient-to-r from-rose-500 to-rose-600"}`}>
          {mode === "credit" ? "Credit wallet" : "Debit wallet"}
        </button>
      </>}
    >
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Amount"><input type="number" className={fieldCls} value={amount || ""} onChange={(e) => setAmount(Number(e.target.value))} placeholder="0.00" /></Field>
        <Field label="Currency">
          <select className={fieldCls} value={currency} onChange={(e) => setCurrency(e.target.value as "USD" | "ARR")}>
            <option value="USD">USD</option>
            <option value="ARR">ARR (RebateBoard reward)</option>
          </select>
        </Field>
        <Field label="Type" span={2}>
          <select className={fieldCls} value={type} onChange={(e) => setType(e.target.value)}>
            {mode === "credit" ? (
              <><option>Manual Credit</option><option>Cashback Credit</option><option>Goodwill</option><option>Affiliate Payout</option><option>RR Conversion</option></>
            ) : (
              <><option>Manual Debit</option><option>Fraud Reversal</option><option>Adjustment</option><option>Withdrawal Reversal</option></>
            )}
          </select>
        </Field>
        <Field label="Narration / reason" span={2}><textarea rows={3} className={fieldCls} value={narration} onChange={(e) => setNarration(e.target.value)} placeholder="Visible in transactions and audit log…" /></Field>
      </div>
    </Modal>
  );
}

function BulkPayModal({ wallets, onClose, onConfirm }: { wallets: UserWallet[]; onClose: () => void; onConfirm: (amount: number, narration: string) => void }) {
  const [amount, setAmount] = useState(0);
  const [narration, setNarration] = useState("Monthly bonus");
  return (
    <Modal open onClose={onClose} title={`Bulk pay ${wallets.length} wallets`} size="md"
      footer={<>
        <button onClick={onClose} className="rounded-xl bg-white/10 px-4 py-2 text-xs font-bold text-white">Cancel</button>
        <button onClick={() => { if (amount <= 0) { toast.error("Amount required"); return; } onConfirm(amount, narration); }} className="rounded-xl bg-gradient-to-r from-fuchsia-500 to-violet-600 px-4 py-2 text-xs font-bold text-white">
          Send ${amount} × {wallets.length}
        </button>
      </>}
    >
      <Field label="Amount per wallet (USD)"><input type="number" className={fieldCls} value={amount || ""} onChange={(e) => setAmount(Number(e.target.value))} /></Field>
      <Field label="Narration"><input className={fieldCls} value={narration} onChange={(e) => setNarration(e.target.value)} /></Field>
      <div className="mt-3 max-h-40 overflow-y-auto rounded-lg bg-white/5 p-2 text-xs">
        {wallets.map((w) => <div key={w.walletId} className="flex justify-between py-0.5"><span>{w.name}</span><span className="font-mono text-muted-foreground">{w.walletId}</span></div>)}
      </div>
      <p className="mt-2 text-[11px] text-muted-foreground">Total cost: <span className="font-bold text-emerald-300">${(amount * wallets.length).toLocaleString()}</span></p>
    </Modal>
  );
}
