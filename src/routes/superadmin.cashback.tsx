import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { PageHeader, Panel, DataTable, StatCard, StatusPill, Toolbar } from "@/components/superadmin/AdminUI";
import { Modal, Field, fieldCls, selectCls, ConfirmDialog, toast } from "@/components/superadmin/AdminActions";
import { Check, Settings2, Plus, RefreshCw, Search } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { financeApi, type CashbackEntry, type CashbackClaim, type EntryStats } from "@/lib/finance-api";
import { ApiError } from "@/lib/api";

export const Route = createFileRoute("/superadmin/cashback")({
  component: CashbackPage,
});

type Engine = "auto" | "manual" | "claims";

function CashbackPage() {
  const { token } = useAuth();
  const [engine, setEngine] = useState<Engine>("auto");

  // Entries state
  const [entries, setEntries] = useState<CashbackEntry[]>([]);
  const [entryStats, setEntryStats] = useState<EntryStats | null>(null);
  const [entriesLoading, setEntriesLoading] = useState(false);

  // Claims state
  const [claims, setClaims] = useState<CashbackClaim[]>([]);
  const [claimsLoading, setClaimsLoading] = useState(false);

  const [q, setQ] = useState("");
  const [showRates, setShowRates] = useState(false);
  const [creating, setCreating] = useState(false);
  const [approvingEntry, setApprovingEntry] = useState<CashbackEntry | null>(null);
  const [approvingClaim, setApprovingClaim] = useState<CashbackClaim | null>(null);

  const loadEntries = useCallback(async () => {
    if (!token) return;
    setEntriesLoading(true);
    try {
      const [entriesRes, statsRes] = await Promise.all([
        financeApi.getAllEntries(token, { size: 100 }),
        financeApi.getEntryStats(token),
      ]);
      if (entriesRes.payload) setEntries(entriesRes.payload.page);
      if (statsRes.payload) setEntryStats(statsRes.payload);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Failed to load entries");
    } finally {
      setEntriesLoading(false);
    }
  }, [token]);

  const loadClaims = useCallback(async () => {
    if (!token) return;
    setClaimsLoading(true);
    try {
      const res = await financeApi.getAllClaims(token, { size: 100 });
      if (res.payload) setClaims(res.payload.page);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Failed to load claims");
    } finally {
      setClaimsLoading(false);
    }
  }, [token]);

  useEffect(() => { loadEntries(); loadClaims(); }, [loadEntries, loadClaims]);

  const autoEntries = entries.filter((r) => r.category !== "Prop Firm");
  const manualEntries = entries.filter((r) => r.category === "Prop Firm");

  const displayRows = engine === "auto" ? autoEntries : engine === "manual" ? manualEntries : [];
  const filteredEntries = useMemo(() =>
    displayRows.filter((r) => !q.trim() || `${r.user?.name} ${r.partner} ${r.id}`.toLowerCase().includes(q.toLowerCase())),
    [displayRows, q],
  );
  const filteredClaims = useMemo(() =>
    claims.filter((c) => !q.trim() || `${c.user?.name} ${c.partner} ${c.id}`.toLowerCase().includes(q.toLowerCase())),
    [claims, q],
  );

  const handleApproveEntry = async (entry: CashbackEntry) => {
    if (!token) return;
    try {
      await financeApi.approveEntry(token, entry.id);
      toast.success(`Credited $${Number(entry.pending).toFixed(2)} to ${entry.user?.name ?? "user"}`);
      loadEntries();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Failed to approve");
    }
    setApprovingEntry(null);
  };

  const handleApproveClaim = async (claim: CashbackClaim) => {
    if (!token) return;
    try {
      await financeApi.updateClaimStatus(token, claim.id, { status: "PAID", note: "Approved and paid by admin" });
      toast.success(`Credited $${Number(claim.amount).toFixed(2)} to ${claim.user?.name ?? "user"}`);
      loadClaims();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Failed to approve");
    }
    setApprovingClaim(null);
  };

  const handleRejectClaim = async (claim: CashbackClaim) => {
    if (!token) return;
    try {
      await financeApi.updateClaimStatus(token, claim.id, { status: "DECLINED", note: "Rejected by admin" });
      toast.success(`Claim #${claim.id} rejected`);
      loadClaims();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Failed to reject");
    }
  };

  const handleRecalculate = async () => {
    if (!token) return;
    try {
      const res = await financeApi.recalculateEntries(token);
      toast.success(`Recalculated ${res.payload?.recalculated ?? 0} entries`);
      loadEntries();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Recalculate failed");
    }
  };

  const claimStatusPill: Record<string, string> = {
    PENDING: "pending", APPROVED: "reviewing", PAID: "resolved", DECLINED: "flagged",
  };

  return (
    <div>
      <PageHeader
        title="Cashback Engine"
        subtitle="Auto broker/exchange rebates, manual prop-firm entries, and user cashback claims."
        actions={
          <>
            <button onClick={() => setShowRates(true)} className="glass-pill inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-white">
              <Settings2 className="h-3.5 w-3.5" /> Rates
            </button>
            <button onClick={() => setCreating(true)} className="inline-flex items-center gap-1.5 rounded-full rb-gradient-primary px-3 py-1.5 text-xs font-semibold text-white">
              <Plus className="h-3.5 w-3.5" /> New entry
            </button>
          </>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Commission generated" value={entryStats ? `$${Number(entryStats.totalCommission).toFixed(0)}` : "—"} delta="all entries" tone="up" />
        <StatCard label="Rebate earned" value={entryStats ? `$${Number(entryStats.totalEarned).toFixed(0)}` : "—"} delta="calculated" tone="up" />
        <StatCard label="Rebate paid" value={entryStats ? `$${Number(entryStats.totalPaid).toFixed(0)}` : "—"} delta="auto-credited" tone="up" />
        <StatCard label="Pending rebate" value={entryStats ? `$${Number(entryStats.totalPending).toFixed(0)}` : "—"} delta="awaiting approval" tone="flat" />
      </div>

      {/* Engine tabs */}
      <div className="mb-4 flex flex-wrap gap-2">
        {([["auto", "⚙️ Auto · Broker / Exchange"], ["manual", "📝 Manual · Prop Firm"], ["claims", "📋 User Claims"]] as const).map(([key, label]) => (
          <button key={key} onClick={() => setEngine(key)} className={`rounded-xl px-4 py-2 text-xs font-bold ring-1 transition ${engine === key ? "rb-gradient-primary text-white ring-transparent" : "bg-white/5 text-muted-foreground ring-white/10"}`}>
            {label} ({key === "claims" ? claims.length : key === "auto" ? autoEntries.length : manualEntries.length})
          </button>
        ))}
      </div>

      {/* Entries panel */}
      {engine !== "claims" && (
        <Panel title={engine === "auto" ? "Auto cashback ledger — trade volume → rebate → wallet" : "Manual cashback ledger — prop firm entries"}>
          <Toolbar>
            <div className="glass flex flex-1 items-center gap-2 rounded-full px-3 py-1.5 text-xs">
              <Search className="h-3.5 w-3.5 text-muted-foreground" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search user, partner, ID…" className="w-full bg-transparent text-white outline-none" />
            </div>
            {engine === "auto" && (
              <button onClick={handleRecalculate} className="glass-pill inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-white">
                <RefreshCw className="h-3.5 w-3.5" /> Recalculate
              </button>
            )}
          </Toolbar>
          {entriesLoading && entries.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">Loading…</p>
          ) : (
            <DataTable head={<><th>ID</th><th>User</th><th>Partner</th><th>Volume</th><th>Commission</th><th>Rebate %</th><th>Earned</th><th>Paid</th><th>Pending</th><th>Status</th><th></th></>}>
              {filteredEntries.map((r) => (
                <tr key={r.id}>
                  <td className="font-mono text-xs text-muted-foreground">#{r.id}</td>
                  <td className="font-semibold">{r.user?.name ?? `User #${r.userId}`}</td>
                  <td>{r.partner}</td>
                  <td className="font-mono">{Number(r.volumeLots) > 0 ? `${Number(r.volumeLots)} lots` : "—"}</td>
                  <td className="font-mono">${Number(r.commissionGenerated).toFixed(2)}</td>
                  <td className="font-mono text-violet-300">{Number(r.rebatePercent)}%</td>
                  <td className="font-mono">${Number(r.rebateEarned).toFixed(2)}</td>
                  <td className="font-mono text-emerald-300">${Number(r.rebatePaid).toFixed(2)}</td>
                  <td className="font-mono text-amber-300">${Number(r.pending).toFixed(2)}</td>
                  <td><StatusPill status={r.status === "PAID" ? "resolved" : r.status === "PENDING" ? "pending" : "responded"} /></td>
                  <td className="text-right">
                    <button
                      onClick={() => setApprovingEntry(r)}
                      disabled={Number(r.pending) <= 0}
                      className="inline-flex items-center gap-1 rounded-md bg-emerald-500/15 px-2 py-1 text-[10px] font-bold text-emerald-300 ring-1 ring-emerald-400/30 disabled:opacity-30"
                    >
                      <Check className="h-3 w-3" /> Approve & credit
                    </button>
                  </td>
                </tr>
              ))}
              {filteredEntries.length === 0 && <tr><td colSpan={11} className="py-8 text-center text-sm text-muted-foreground">No rows match.</td></tr>}
            </DataTable>
          )}
        </Panel>
      )}

      {/* Claims panel */}
      {engine === "claims" && (
        <Panel title="User cashback claims — pending review">
          <Toolbar>
            <div className="glass flex flex-1 items-center gap-2 rounded-full px-3 py-1.5 text-xs">
              <Search className="h-3.5 w-3.5 text-muted-foreground" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search user, partner, ID…" className="w-full bg-transparent text-white outline-none" />
            </div>
            <button onClick={loadClaims} className="glass-pill inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-white">
              <RefreshCw className="h-3.5 w-3.5" /> Refresh
            </button>
          </Toolbar>
          {claimsLoading && claims.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">Loading…</p>
          ) : (
            <DataTable head={<><th>ID</th><th>User</th><th>Partner</th><th>Type</th><th>Amount</th><th>Payout target</th><th>Evidence</th><th>Status</th><th></th></>}>
              {filteredClaims.map((c) => (
                <tr key={c.id}>
                  <td className="font-mono text-xs text-muted-foreground">#{c.id}</td>
                  <td className="font-semibold">{c.user?.name ?? `User #${c.userId}`}</td>
                  <td>{c.partner}</td>
                  <td className="text-xs">{c.partnerCategory}</td>
                  <td className="font-mono text-emerald-300">${Number(c.amount).toFixed(2)}</td>
                  <td className="text-xs">{c.payoutTarget}</td>
                  <td className="text-xs text-muted-foreground">{c.evidence} file{c.evidence !== 1 ? "s" : ""}</td>
                  <td><StatusPill status={claimStatusPill[c.status] ?? "pending"} /></td>
                  <td className="text-right">
                    <div className="flex justify-end gap-1">
                      {c.status === "PENDING" && (
                        <>
                          <button onClick={() => setApprovingClaim(c)} className="inline-flex items-center gap-1 rounded-md bg-emerald-500/15 px-2 py-1 text-[10px] font-bold text-emerald-300 ring-1 ring-emerald-400/30">
                            <Check className="h-3 w-3" /> Approve
                          </button>
                          <button onClick={() => handleRejectClaim(c)} className="inline-flex items-center gap-1 rounded-md bg-rose-500/15 px-2 py-1 text-[10px] font-bold text-rose-300 ring-1 ring-rose-400/30">
                            Reject
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredClaims.length === 0 && <tr><td colSpan={9} className="py-8 text-center text-sm text-muted-foreground">No claims match.</td></tr>}
            </DataTable>
          )}
        </Panel>
      )}

      {/* Approve entry confirm */}
      <ConfirmDialog
        open={!!approvingEntry}
        onClose={() => setApprovingEntry(null)}
        onConfirm={() => approvingEntry && handleApproveEntry(approvingEntry)}
        title={`Credit $${Number(approvingEntry?.pending ?? 0).toFixed(2)} to ${approvingEntry?.user?.name ?? "user"}?`}
        message="Adds the pending amount to the user's wallet and records a transaction."
        confirmText="Approve & credit"
        tone="primary"
      />

      {/* Approve claim confirm */}
      <ConfirmDialog
        open={!!approvingClaim}
        onClose={() => setApprovingClaim(null)}
        onConfirm={() => approvingClaim && handleApproveClaim(approvingClaim)}
        title={`Credit $${Number(approvingClaim?.amount ?? 0).toFixed(2)} to ${approvingClaim?.user?.name ?? "user"}?`}
        message="Marks the claim as paid and credits the user's wallet immediately."
        confirmText="Approve & credit"
        tone="primary"
      />

      {/* Rate config modal */}
      {showRates && (
        <Modal open onClose={() => setShowRates(false)} title="Configure rebate rates" subtitle="Defaults applied to new cashback entries" size="md">
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Default broker %"><input type="number" defaultValue={50} className={fieldCls} /></Field>
            <Field label="Default exchange %"><input type="number" defaultValue={40} className={fieldCls} /></Field>
            <Field label="Default prop %"><input type="number" defaultValue={50} className={fieldCls} /></Field>
            <Field label="Min payout threshold ($)"><input type="number" defaultValue={20} className={fieldCls} /></Field>
          </div>
          <div className="mt-4 flex justify-end">
            <button onClick={() => { toast.success("Rates updated"); setShowRates(false); }} className="rounded-xl rb-gradient-primary px-4 py-2 text-xs font-bold text-white">Save</button>
          </div>
        </Modal>
      )}

      {/* New entry modal */}
      {creating && token && (
        <NewEntryModal
          token={token}
          onClose={() => setCreating(false)}
          onCreate={() => { loadEntries(); setCreating(false); }}
        />
      )}
    </div>
  );
}

function NewEntryModal({ token, onClose, onCreate }: { token: string; onClose: () => void; onCreate: () => void }) {
  const [form, setForm] = useState({
    userId: "",
    partner: "",
    category: "Forex Broker",
    volumeLots: "",
    commissionGenerated: "",
    rebatePercent: "50",
    note: "",
  });
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!form.userId || !form.partner || !form.commissionGenerated) {
      toast.error("User ID, partner, and commission are required");
      return;
    }
    setSaving(true);
    try {
      await financeApi.createEntry(token, {
        userId: Number(form.userId),
        partner: form.partner,
        category: form.category,
        volumeLots: form.volumeLots ? Number(form.volumeLots) : undefined,
        commissionGenerated: Number(form.commissionGenerated),
        rebatePercent: Number(form.rebatePercent),
        note: form.note || undefined,
      });
      toast.success(`Cashback entry created for ${form.partner}`);
      onCreate();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Failed to create entry");
    } finally {
      setSaving(false);
    }
  };

  const f = (k: keyof typeof form) => ({ className: fieldCls, value: form[k], onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm({ ...form, [k]: e.target.value }) });

  return (
    <Modal open onClose={onClose} title="New cashback entry" size="md"
      footer={<>
        <button onClick={onClose} className="rounded-xl bg-white/10 px-4 py-2 text-xs font-bold text-white">Cancel</button>
        <button onClick={submit} disabled={saving} className="rounded-xl rb-gradient-primary px-4 py-2 text-xs font-bold text-white disabled:opacity-50">
          {saving ? "Creating…" : "Create"}
        </button>
      </>}
    >
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="User ID"><input type="number" {...f("userId")} placeholder="e.g. 42" /></Field>
        <Field label="Partner / brand"><input {...f("partner")} placeholder="e.g. Exness" /></Field>
        <Field label="Category">
          <select className={selectCls} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            <option value="Forex Broker">Forex Broker</option>
            <option value="Crypto Exchange">Crypto Exchange</option>
            <option value="Prop Firm">Prop Firm</option>
          </select>
        </Field>
        <Field label="Volume (lots)"><input type="number" {...f("volumeLots")} placeholder="0" /></Field>
        <Field label="Commission generated ($)"><input type="number" {...f("commissionGenerated")} placeholder="0.00" /></Field>
        <Field label="Rebate %"><input type="number" {...f("rebatePercent")} /></Field>
        <Field label="Note" span={2}><input {...f("note")} placeholder="Optional note" /></Field>
      </div>
    </Modal>
  );
}
