import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { PageHeader, Panel, DataTable, StatCard, Pill, Toolbar } from "@/components/superadmin/AdminUI";
import { Modal, Field, fieldCls, ConfirmDialog, toast } from "@/components/superadmin/AdminActions";
import {
  adjustAdminWallet,
  fetchAdminWalletLogs,
  fetchAdminWallets,
  updateAdminWalletStatus,
  type AdminWalletLogRecord,
  type AdminWalletRecord,
} from "@/lib/admin-wallet-api";
import { Plus, Minus, History, Snowflake, Search } from "lucide-react";

export const Route = createFileRoute("/superadmin/wallets")({
  component: WalletsPage,
});

type Action = "credit" | "debit" | null;

function WalletsPage() {
  const [items, setItems] = useState<AdminWalletRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [acting, setActing] = useState<{ w: AdminWalletRecord | null; type: Action }>({ w: null, type: null });
  const [history, setHistory] = useState<AdminWalletRecord | null>(null);
  const [historyItems, setHistoryItems] = useState<AdminWalletLogRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [freezing, setFreezing] = useState<AdminWalletRecord | null>(null);

  const loadWallets = async (query = "") => {
    setLoading(true);
    try {
      const payload = await fetchAdminWallets(query);
      setItems(payload);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to load wallets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadWallets();
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      void loadWallets(q);
    }, 250);
    return () => clearTimeout(timeout);
  }, [q]);

  const totalAvail = items.reduce((s, w) => s + w.balance, 0);
  const activeCount = items.filter((w) => w.status === "ACTIVE").length;

  const openHistory = async (wallet: AdminWalletRecord) => {
    setHistory(wallet);
    setHistoryLoading(true);
    try {
      const payload = await fetchAdminWalletLogs(wallet.userId);
      setHistoryItems(payload);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to load wallet history");
      setHistoryItems([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const filtered = useMemo(() => items, [items]);

  return (
    <div>
      <PageHeader
        title="User Wallets"
        subtitle="Live wallet balances, admin adjustments, freeze controls, and user ledger history."
      />

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Total available" value={`$${totalAvail.toLocaleString(undefined, { maximumFractionDigits: 2 })}`} delta="live wallet balances" tone="up" />
        <StatCard label="Wallets" value={String(items.length)} delta="loaded from backend" tone="flat" />
        <StatCard label="Active" value={String(activeCount)} delta="operational wallets" tone="up" />
        <StatCard label="Frozen" value={String(items.length - activeCount)} delta="status controlled" tone="down" />
      </div>

      <Panel title={`All user wallets — ${filtered.length}`}>
        <Toolbar>
          <div className="glass flex flex-1 items-center gap-2 rounded-full px-3 py-1.5 text-xs">
            <Search className="h-3.5 w-3.5 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by user, email, wallet account number..." className="w-full bg-transparent text-white outline-none" />
          </div>
        </Toolbar>
        <DataTable head={<>
          <th>Wallet</th><th>User</th><th>Email</th><th>Balance</th><th>Previous</th><th>Status</th><th></th>
        </>}>
          {loading ? (
            <tr><td colSpan={7} className="py-8 text-center text-sm text-muted-foreground">Loading wallets...</td></tr>
          ) : filtered.length === 0 ? (
            <tr><td colSpan={7} className="py-8 text-center text-sm text-muted-foreground">No wallets found.</td></tr>
          ) : filtered.map((w) => (
            <tr key={w.id}>
              <td>
                <div className="font-mono text-xs text-muted-foreground">{w.accountNumber}</div>
                <div className="text-[10px] text-muted-foreground">{w.address}</div>
              </td>
              <td className="font-semibold">{w.userName}</td>
              <td className="text-xs text-muted-foreground">{w.userEmail || "—"}</td>
              <td className="font-mono text-emerald-300">${w.balance.toFixed(2)}</td>
              <td className="font-mono text-muted-foreground">${w.prevBalance.toFixed(2)}</td>
              <td>{w.status === "ACTIVE" ? <Pill tone="good">active</Pill> : <Pill tone="bad">{w.status.toLowerCase()}</Pill>}</td>
              <td className="text-right">
                <div className="flex justify-end gap-1">
                  <button onClick={() => setActing({ w, type: "credit" })} title="Credit" className="grid h-7 w-7 place-items-center rounded-md bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/30"><Plus className="h-3 w-3" /></button>
                  <button onClick={() => setActing({ w, type: "debit" })} title="Debit" className="grid h-7 w-7 place-items-center rounded-md bg-rose-500/15 text-rose-300 ring-1 ring-rose-400/30"><Minus className="h-3 w-3" /></button>
                  <button onClick={() => setFreezing(w)} title={w.status === "ACTIVE" ? "Freeze" : "Unfreeze"} className="grid h-7 w-7 place-items-center rounded-md bg-sky-500/15 text-sky-300 ring-1 ring-sky-400/30"><Snowflake className="h-3 w-3" /></button>
                  <button onClick={() => void openHistory(w)} title="History" className="grid h-7 w-7 place-items-center rounded-md bg-white/10 text-white"><History className="h-3 w-3" /></button>
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
          onClose={() => setActing({ w: null, type: null })}
          onSubmit={async ({ amount, narration, type }) => {
            try {
              await adjustAdminWallet({
                userId: acting.w!.userId,
                amount,
                narration,
                type: type === "Manual Debit" ? "DEBIT" : "CREDIT",
              });
              toast.success(`${acting.type === "credit" ? "Credited" : "Debited"} $${amount} ${acting.type === "credit" ? "to" : "from"} ${acting.w!.userName}`);
              setActing({ w: null, type: null });
              await loadWallets(q);
            } catch (error) {
              toast.error(error instanceof Error ? error.message : "Unable to update wallet");
            }
          }}
        />
      )}

      <ConfirmDialog
        open={!!freezing}
        onClose={() => setFreezing(null)}
        onConfirm={() => {
          if (!freezing) return;
          void (async () => {
            try {
              await updateAdminWalletStatus(freezing.id, freezing.status === "ACTIVE" ? "BLOCKED" : "ACTIVE");
              toast.success(`Wallet ${freezing.status === "ACTIVE" ? "frozen" : "reactivated"}`);
              setFreezing(null);
              await loadWallets(q);
            } catch (error) {
              toast.error(error instanceof Error ? error.message : "Unable to update wallet status");
            }
          })();
        }}
        title={`${freezing?.status === "ACTIVE" ? "Freeze" : "Unfreeze"} ${freezing?.userName}'s wallet?`}
        message={freezing?.status === "ACTIVE" ? "Freezing blocks wallet operations until it is reactivated." : "Wallet will return to active status."}
        confirmText={freezing?.status === "ACTIVE" ? "Freeze" : "Unfreeze"}
        tone={freezing?.status === "ACTIVE" ? "danger" : "primary"}
      />

      {history && (
        <Modal open onClose={() => setHistory(null)} title={`${history.userName} — wallet history`} size="lg">
          <p className="mb-3 text-xs text-muted-foreground">Live wallet ledger for {history.accountNumber}.</p>
          {historyLoading ? (
            <div className="py-6 text-center text-sm text-muted-foreground">Loading wallet history...</div>
          ) : historyItems.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">No wallet logs found.</div>
          ) : (
            <div className="space-y-2">
              {historyItems.map((log) => (
                <div key={log.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-white">{log.activity}</div>
                      <div className="text-[11px] text-muted-foreground">{log.channel} · {new Date(log.createdAt).toLocaleString()}</div>
                    </div>
                    <div className={`font-mono text-sm ${log.activity === "DEBIT" ? "text-rose-300" : "text-emerald-300"}`}>
                      {log.activity === "DEBIT" ? "-" : "+"}${Math.abs(log.amount).toFixed(2)}
                    </div>
                  </div>
                  <div className="mt-2 text-[11px] text-muted-foreground">Ref: {log.ref}</div>
                  {log.narration && <div className="mt-1 text-xs text-white/75">{log.narration}</div>}
                </div>
              ))}
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}

function CreditDebitModal({ wallet, mode, onClose, onSubmit }: {
  wallet: AdminWalletRecord; mode: "credit" | "debit"; onClose: () => void;
  onSubmit: (v: { amount: number; narration: string; type: string }) => void | Promise<void>;
}) {
  const [amount, setAmount] = useState(0);
  const [type, setType] = useState(mode === "credit" ? "Manual Credit" : "Manual Debit");
  const [narration, setNarration] = useState("");
  return (
    <Modal open onClose={onClose}
      title={`${mode === "credit" ? "Credit" : "Debit"} ${wallet.userName}`}
      subtitle={`Wallet ${wallet.accountNumber} · current balance $${wallet.balance.toFixed(2)}`}
      size="md"
      footer={<>
        <button onClick={onClose} className="rounded-xl bg-white/10 px-4 py-2 text-xs font-bold text-white">Cancel</button>
        <button onClick={() => { if (amount <= 0) { toast.error("Amount required"); return; } void onSubmit({ amount, narration: narration || `${type} by admin`, type }); }} className={`rounded-xl px-4 py-2 text-xs font-bold text-white ${mode === "credit" ? "bg-gradient-to-r from-emerald-500 to-emerald-600" : "bg-gradient-to-r from-rose-500 to-rose-600"}`}>
          {mode === "credit" ? "Credit wallet" : "Debit wallet"}
        </button>
      </>}
    >
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Amount"><input type="number" className={fieldCls} value={amount || ""} onChange={(e) => setAmount(Number(e.target.value))} placeholder="0.00" /></Field>
        <Field label="Type" span={2}>
          <select className={fieldCls} value={type} onChange={(e) => setType(e.target.value)}>
            {mode === "credit" ? (
              <><option>Manual Credit</option><option>Cashback Credit</option><option>Goodwill</option><option>Affiliate Payout</option></>
            ) : (
              <><option>Manual Debit</option><option>Fraud Reversal</option><option>Adjustment</option></>
            )}
          </select>
        </Field>
        <Field label="Narration / reason" span={2}><textarea rows={3} className={fieldCls} value={narration} onChange={(e) => setNarration(e.target.value)} placeholder="Visible in wallet logs..." /></Field>
      </div>
    </Modal>
  );
}
