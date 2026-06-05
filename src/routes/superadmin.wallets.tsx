import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState, useCallback } from "react";
import {
  PageHeader,
  Panel,
  DataTable,
  StatCard,
  Pill,
  Toolbar,
} from "@/components/superadmin/AdminUI";
import {
  Modal,
  Field,
  fieldCls,
  selectCls,
  ConfirmDialog,
  toast,
} from "@/components/superadmin/AdminActions";
import { Plus, Minus, History, Snowflake, Search, Send, RefreshCw } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { financeApi, type Wallet, type AdminFinanceStats } from "@/lib/finance-api";
import { ApiError } from "@/lib/api";

export const Route = createFileRoute("/superadmin/wallets")({
  component: WalletsPage,
});

type Action = "credit" | "debit" | null;

function WalletsPage() {
  const { token } = useAuth();
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [stats, setStats] = useState<AdminFinanceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [q, setQ] = useState("");
  const [searchMode, setSearchMode] = useState(false);
  const [acting, setActing] = useState<{ w: Wallet | null; type: Action }>({ w: null, type: null });
  const [history, setHistory] = useState<Wallet | null>(null);
  const [freezing, setFreezing] = useState<Wallet | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkType, setBulkType] = useState<Action>("credit");

  const loadStats = useCallback(async () => {
    if (!token) return;
    try {
      const res = await financeApi.getAdminFinanceStats(token);
      if (res.payload) setStats(res.payload);
    } catch {
      /* stats are non-blocking */
    }
  }, [token]);

  const loadWallets = useCallback(
    async (pageNum = 0) => {
      if (!token) return;
      setLoading(true);
      try {
        const res = await financeApi.getAllWallets(token, pageNum, 30);
        if (res.payload) {
          setWallets(pageNum === 0 ? res.payload.page : (prev) => [...prev, ...res.payload!.page]);
          setHasMore(pageNum < res.payload.totalPages - 1);
          setPage(pageNum);
        }
      } catch (e) {
        toast.error(e instanceof ApiError ? e.message : "Failed to load wallets");
      } finally {
        setLoading(false);
      }
    },
    [token],
  );

  const searchWallets = useCallback(async () => {
    if (!token || !q.trim()) return loadWallets(0);
    setLoading(true);
    try {
      const res = await financeApi.searchWallets(token, q.trim(), 0, 50);
      if (res.payload) {
        setWallets(res.payload.page);
        setHasMore(false);
      }
    } catch {
      toast.error("Search failed");
    } finally {
      setLoading(false);
    }
  }, [token, q, loadWallets]);

  useEffect(() => {
    loadWallets(0);
    loadStats();
  }, [loadWallets, loadStats]);

  useEffect(() => {
    const tid = setTimeout(() => {
      if (q.trim()) {
        setSearchMode(true);
        searchWallets();
      } else {
        setSearchMode(false);
        loadWallets(0);
      }
    }, 350);
    return () => clearTimeout(tid);
  }, [q]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = (id: number) =>
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  const handleAdjust = async (
    w: Wallet,
    mode: "credit" | "debit",
    amount: number,
    type: string,
    narration: string,
  ) => {
    if (!token) return;
    try {
      await financeApi.adjustWallet(token, {
        userId: w.userId,
        amount,
        type: mode === "credit" ? "CREDIT" : "DEBIT",
        narration: narration || `${type} by admin`,
      });
      toast.success(
        `${mode === "credit" ? "Credited" : "Debited"} $${amount} ${mode === "credit" ? "to" : "from"} ${w.user?.name ?? "user"}`,
      );
      loadWallets(0);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Action failed");
    }
  };

  const handleFreeze = async (w: Wallet) => {
    if (!token) return;
    const newStatus = w.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    try {
      await financeApi.updateWalletStatus(token, w.id, newStatus);
      toast.success(`Wallet ${newStatus === "ACTIVE" ? "unfrozen" : "frozen"}`);
      loadWallets(0);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Failed to update wallet status");
    }
    setFreezing(null);
  };

  const handleBulkAdjust = async (amount: number, narration: string, type: Action) => {
    if (!token) return;
    const targets = wallets.filter((w) => selected.has(w.id));
    if (!targets.length) {
      toast.error("Select at least one wallet to adjust");
      return;
    }
    const rows = targets.map((w) => ({
      userId: w.userId,
      amount,
      type: type === "credit" ? "CREDIT" : "DEBIT",
      narration,
    }));
    try {
      const res = await financeApi.bulkAdjustWallets(token, { rows });
      const succeeded = res.payload?.results?.filter((item) => item.success).length ?? 0;
      const failed = targets.length - succeeded;
      toast.success(
        `Bulk ${type} completed: ${succeeded} succeeded${failed ? `, ${failed} failed` : ""}`,
      );
      setSelected(new Set());
      setBulkOpen(false);
      loadWallets(0);
      loadStats();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Bulk adjustment failed");
    }
  };

  return (
    <div>
      <PageHeader
        title="User Wallets"
        subtitle="USD cashback ledger. Credit, debit, freeze, bulk pay, or audit any wallet."
        actions={
          <>
            <button
              onClick={() => {
                loadWallets(0);
                loadStats();
              }}
              className="glass-pill inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-white"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Refresh
            </button>
            <button
              disabled={selected.size === 0}
              onClick={() => setBulkOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-30"
            >
              <Send className="h-3.5 w-3.5" /> Bulk adjust{" "}
              {selected.size > 0 && `(${selected.size})`}
            </button>
          </>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard
          label="Total available"
          value={
            stats
              ? `$${(stats.totalBalance ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`
              : "—"
          }
          delta="across all users"
          tone="up"
        />
        <StatCard
          label="Pending withdrawals"
          value={
            stats
              ? `$${(stats.pendingWithdrawals ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`
              : "—"
          }
          delta={`${stats?.pendingWithdrawalCount ?? 0} requests`}
          tone="flat"
        />
        <StatCard
          label="Lifetime credits"
          value={
            stats
              ? `$${(stats.totalCredits ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`
              : "—"
          }
          delta="all time"
          tone="up"
        />
        <StatCard
          label="Total wallets"
          value={stats ? String(stats.totalWallets) : "—"}
          delta="registered users"
          tone="flat"
        />
      </div>

      <Panel title={`All user wallets — ${wallets.length}`}>
        <Toolbar>
          <div className="glass flex flex-1 items-center gap-2 rounded-full px-3 py-1.5 text-xs">
            <Search className="h-3.5 w-3.5 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by name, account number, address…"
              className="w-full bg-transparent text-white outline-none"
            />
          </div>
        </Toolbar>
        {loading && wallets.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">Loading wallets…</p>
        ) : (
          <DataTable
            head={
              <>
                <th>
                  <input
                    type="checkbox"
                    onChange={(e) =>
                      setSelected(e.target.checked ? new Set(wallets.map((w) => w.id)) : new Set())
                    }
                  />
                </th>
                <th>Account</th>
                <th>User</th>
                <th>Available</th>
                <th>Pending</th>
                <th>RR</th>
                <th>Earned</th>
                <th>Withdrawn</th>
                <th>Status</th>
                <th>Currency</th>
                <th></th>
              </>
            }
          >
            {wallets.map((w) => (
              <tr key={w.id}>
                <td>
                  <input
                    type="checkbox"
                    checked={selected.has(w.id)}
                    onChange={() => toggle(w.id)}
                  />
                </td>
                <td className="font-mono text-xs text-muted-foreground">{w.accountNumber}</td>
                <td className="font-semibold">{w.user?.name ?? `User #${w.userId}`}</td>
                <td className="font-mono text-emerald-300">
                  ${Number(w.available ?? w.balance ?? 0).toFixed(2)}
                </td>
                <td className="font-mono text-amber-300">${Number(w.pending ?? 0).toFixed(2)}</td>
                <td className="font-mono text-sky-300">
                  ${Number(w.rr ?? w.earned ?? 0).toFixed(2)}
                </td>
                <td className="font-mono text-cyan-300">${Number(w.earned ?? 0).toFixed(2)}</td>
                <td className="font-mono text-rose-300">${Number(w.withdrawn ?? 0).toFixed(2)}</td>
                <td>
                  {w.status === "ACTIVE" ? (
                    <Pill tone="good">active</Pill>
                  ) : (
                    <Pill tone="bad">{w.status?.toLowerCase()}</Pill>
                  )}
                </td>
                <td className="text-xs text-muted-foreground">{w.currency}</td>
                <td className="text-right">
                  <div className="flex justify-end gap-1">
                    <button
                      onClick={() => setActing({ w, type: "credit" })}
                      title="Credit"
                      className="grid h-7 w-7 place-items-center rounded-md bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/30"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => setActing({ w, type: "debit" })}
                      title="Debit"
                      className="grid h-7 w-7 place-items-center rounded-md bg-rose-500/15 text-rose-300 ring-1 ring-rose-400/30"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => setFreezing(w)}
                      title={w.status === "ACTIVE" ? "Freeze" : "Unfreeze"}
                      className="grid h-7 w-7 place-items-center rounded-md bg-sky-500/15 text-sky-300 ring-1 ring-sky-400/30"
                    >
                      <Snowflake className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => setHistory(w)}
                      title="Info"
                      className="grid h-7 w-7 place-items-center rounded-md bg-white/10 text-white"
                    >
                      <History className="h-3 w-3" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </DataTable>
        )}
        {!searchMode && hasMore && (
          <div className="mt-4 flex justify-center">
            <button
              onClick={() => loadWallets(page + 1)}
              disabled={loading}
              className="rounded-full bg-white/10 px-4 py-1.5 text-xs text-white disabled:opacity-40"
            >
              {loading ? "Loading…" : "Load more"}
            </button>
          </div>
        )}
      </Panel>

      {/* Credit / Debit modal */}
      {acting.type && acting.w && (
        <CreditDebitModal
          wallet={acting.w}
          mode={acting.type}
          onClose={() => setActing((prev) => ({ ...prev, type: null }))}
          onSubmit={({ amount, narration, type }) => {
            if (!acting.w || !acting.type) return;
            handleAdjust(acting.w, acting.type, amount, type, narration);
            setActing((prev) => ({ ...prev, type: null }));
          }}
        />
      )}

      <ConfirmDialog
        open={!!freezing}
        onClose={() => setFreezing(null)}
        onConfirm={() => freezing && handleFreeze(freezing)}
        title={`${freezing?.status === "ACTIVE" ? "Freeze" : "Unfreeze"} wallet?`}
        message={
          freezing?.status === "ACTIVE"
            ? "Freezing blocks all withdrawals until unfrozen."
            : "Wallet will return to normal operation."
        }
        confirmText={freezing?.status === "ACTIVE" ? "Freeze" : "Unfreeze"}
        tone={freezing?.status === "ACTIVE" ? "danger" : "primary"}
      />

      {history && (
        <Modal
          open
          onClose={() => setHistory(null)}
          title={`${history.user?.name ?? `User #${history.userId}`} — wallet info`}
          size="lg"
        >
          <dl className="grid gap-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Account #</dt>
              <dd className="font-mono">{history.accountNumber}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Address</dt>
              <dd className="font-mono text-xs">{history.address}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Balance</dt>
              <dd className="font-mono text-emerald-300">
                ${Number(history.balance ?? 0).toFixed(2)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Prev Balance</dt>
              <dd className="font-mono text-muted-foreground">
                ${Number(history.prevBalance ?? 0).toFixed(2)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Currency</dt>
              <dd>{history.currency}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Status</dt>
              <dd>{history.status}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Created</dt>
              <dd className="text-xs">{new Date(history.createdAt).toLocaleString()}</dd>
            </div>
          </dl>
        </Modal>
      )}

      {bulkOpen && (
        <BulkAdjustmentModal
          count={selected.size}
          type={bulkType}
          onTypeChange={setBulkType}
          onClose={() => setBulkOpen(false)}
          onConfirm={(amount, narration, type) => handleBulkAdjust(amount, narration, type)}
        />
      )}
    </div>
  );
}

function CreditDebitModal({
  wallet,
  mode,
  onClose,
  onSubmit,
}: {
  wallet: Wallet;
  mode: "credit" | "debit";
  onClose: () => void;
  onSubmit: (v: { amount: number; narration: string; type: string }) => void;
}) {
  const [amount, setAmount] = useState(0);
  const [type, setType] = useState(mode === "credit" ? "Manual Credit" : "Manual Debit");
  const [narration, setNarration] = useState("");
  return (
    <Modal
      open
      onClose={onClose}
      title={`${mode === "credit" ? "Credit" : "Debit"} ${wallet.user?.name ?? `User #${wallet.userId}`}`}
      subtitle={`Account ${wallet.accountNumber} · balance $${Number(wallet.balance ?? 0).toFixed(2)}`}
      size="md"
      footer={
        <>
          <button
            onClick={onClose}
            className="rounded-xl bg-white/10 px-4 py-2 text-xs font-bold text-white"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              if (amount <= 0) {
                toast.error("Amount required");
                return;
              }
              onSubmit({ amount, narration: narration || `${type} by admin`, type });
            }}
            className={`rounded-xl px-4 py-2 text-xs font-bold text-white ${mode === "credit" ? "bg-gradient-to-r from-emerald-500 to-emerald-600" : "bg-gradient-to-r from-rose-500 to-rose-600"}`}
          >
            {mode === "credit" ? "Credit wallet" : "Debit wallet"}
          </button>
        </>
      }
    >
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Amount (USD)">
          <input
            type="number"
            className={fieldCls}
            value={amount || ""}
            onChange={(e) => setAmount(Number(e.target.value))}
            placeholder="0.00"
          />
        </Field>
        <Field label="Type">
          <select className={selectCls} value={type} onChange={(e) => setType(e.target.value)}>
            {mode === "credit" ? (
              <>
                <option>Manual Credit</option>
                <option>Cashback Credit</option>
                <option>Goodwill</option>
                <option>Affiliate Payout</option>
              </>
            ) : (
              <>
                <option>Manual Debit</option>
                <option>Fraud Reversal</option>
                <option>Adjustment</option>
                <option>Withdrawal Reversal</option>
              </>
            )}
          </select>
        </Field>
        <Field label="Narration / reason" span={2}>
          <textarea
            rows={3}
            className={fieldCls}
            value={narration}
            onChange={(e) => setNarration(e.target.value)}
            placeholder="Visible in transaction log…"
          />
        </Field>
      </div>
    </Modal>
  );
}

function BulkAdjustmentModal({
  count,
  type,
  onTypeChange,
  onClose,
  onConfirm,
}: {
  count: number;
  type: Action;
  onTypeChange: (type: Action) => void;
  onClose: () => void;
  onConfirm: (amount: number, narration: string, type: Action) => void;
}) {
  const [amount, setAmount] = useState(0);
  const [narration, setNarration] = useState("Manual adjustment");
  return (
    <Modal
      open
      onClose={onClose}
      title={`Bulk ${type === "credit" ? "credit" : "debit"} ${count} wallets`}
      size="md"
      footer={
        <>
          <button
            onClick={onClose}
            className="rounded-xl bg-white/10 px-4 py-2 text-xs font-bold text-white"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              if (amount <= 0) {
                toast.error("Amount required");
                return;
              }
              onConfirm(amount, narration, type);
            }}
            className="rounded-xl bg-gradient-to-r from-fuchsia-500 to-violet-600 px-4 py-2 text-xs font-bold text-white"
          >
            {type === "credit" ? `Credit $${amount} × ${count}` : `Debit $${amount} × ${count}`}
          </button>
        </>
      }
    >
      <Field label="Action">
        <select
          className={selectCls}
          value={type}
          onChange={(e) => onTypeChange(e.target.value as Action)}
        >
          <option value="credit">Credit</option>
          <option value="debit">Debit</option>
        </select>
      </Field>
      <Field label="Amount per wallet (USD)">
        <input
          type="number"
          className={fieldCls}
          value={amount || ""}
          onChange={(e) => setAmount(Number(e.target.value))}
        />
      </Field>
      <Field label="Narration">
        <input
          className={fieldCls}
          value={narration}
          onChange={(e) => setNarration(e.target.value)}
        />
      </Field>
      <p className="mt-2 text-[11px] text-muted-foreground">
        Total cost:{" "}
        <span className="font-bold text-emerald-300">${(amount * count).toLocaleString()}</span>
      </p>
    </Modal>
  );
}
