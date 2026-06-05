import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { PageHeader, Panel, DataTable, Pill, StatCard, Toolbar } from "@/components/superadmin/AdminUI";
import { ConfirmDialog, toast } from "@/components/superadmin/AdminActions";
import { DollarSign, RefreshCw, Search } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { financeApi, type AffiliateRecord, type AffiliateStats } from "@/lib/finance-api";
import { ApiError } from "@/lib/api";

export const Route = createFileRoute("/superadmin/affiliates")({
  component: AffiliatesAdmin,
});

function AffiliatesAdmin() {
  const { token } = useAuth();
  const [affiliates, setAffiliates] = useState<AffiliateRecord[]>([]);
  const [stats, setStats] = useState<AffiliateStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [paying, setPaying] = useState<AffiliateRecord | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [payNarration, setPayNarration] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [listRes, statsRes] = await Promise.all([
        financeApi.getAllAffiliates(token, { size: 200 }),
        financeApi.getAffiliateStats(token),
      ]);
      if (listRes.payload) setAffiliates(listRes.payload.page);
      if (statsRes.payload) setStats(statsRes.payload);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Failed to load affiliates");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => affiliates.filter((a) =>
    !q.trim() ||
    (a.user?.name ?? "").toLowerCase().includes(q.toLowerCase()) ||
    a.partner.toLowerCase().includes(q.toLowerCase())
  ), [affiliates, q]);

  const openPayDialog = (a: AffiliateRecord) => {
    setPaying(a);
    setPayAmount(String(a.pendingAmount ?? ""));
    setPayNarration(`Affiliate commission · ${a.partner} (${a.referrals} refs)`);
  };

  const doPay = async () => {
    if (!paying || !token) return;
    setSubmitting(true);
    try {
      await financeApi.payAffiliate(token, paying.id, { amount: Number(payAmount), narration: payNarration });
      toast.success(`Paid $${Number(payAmount).toLocaleString()} to ${paying.user?.name ?? `affiliate #${paying.id}`}`);
      setPaying(null);
      load();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Payment failed");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleActive = async (a: AffiliateRecord) => {
    if (!token) return;
    try {
      await financeApi.updateAffiliate(token, a.id, { active: !a.active });
      toast.success(`${a.user?.name ?? `Affiliate #${a.id}`} ${a.active ? "deactivated" : "activated"}`);
      load();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Update failed");
    }
  };

  return (
    <div>
      <PageHeader title="Affiliates / IB" subtitle="Partner commission structures, sub-IB tree, and per-affiliate revenue." />

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Active affiliates" value={stats ? String(stats.active) : "—"} delta={`of ${stats?.total ?? "—"} total`} tone="up" />
        <StatCard label="Total earned" value={stats ? `$${Number(stats.totalEarned).toLocaleString()}` : "—"} delta="lifetime" tone="up" />
        <StatCard label="Pending payouts" value={stats ? `$${Number(stats.totalPending).toLocaleString()}` : "—"} delta="to be paid" tone="flat" />
        <StatCard label="Total sub-IBs" value={stats ? String(stats.totalSubIBs) : "—"} delta="across network" tone="up" />
      </div>

      <Toolbar>
        <div className="glass flex items-center gap-2 rounded-full px-3 py-1.5 text-xs">
          <Search className="h-3.5 w-3.5 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, partner…" className="w-44 bg-transparent text-white outline-none" />
        </div>
        <button onClick={load} className="ml-auto grid h-7 w-7 place-items-center rounded-md bg-white/5 text-white ring-1 ring-white/10">
          <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
        </button>
      </Toolbar>

      <Panel title={`Affiliates — ${filtered.length}`}>
        <DataTable head={<><th>Name</th><th>Partner</th><th>Structure</th><th>Sub-IBs</th><th>Refs</th><th>Earned</th><th>Pending</th><th>Tier</th><th>Status</th><th></th></>}>
          {loading && <tr><td colSpan={10} className="py-8 text-center text-sm text-muted-foreground">Loading…</td></tr>}
          {!loading && filtered.map((a) => (
            <tr key={a.id}>
              <td className="font-semibold">{a.user?.name ?? `Affiliate #${a.id}`}</td>
              <td>{a.partner}</td>
              <td className="text-xs text-muted-foreground">{a.structure ?? "—"}</td>
              <td className="font-mono">{a.subIBs}</td>
              <td className="font-mono">{a.referrals}</td>
              <td className="font-mono text-emerald-300">${Number(a.earnedTotal).toLocaleString()}</td>
              <td className="font-mono text-amber-300">${Number(a.pendingAmount).toLocaleString()}</td>
              <td><Pill tone={a.tier === "Gold" ? "warn" : "neutral"}>{a.tier}</Pill></td>
              <td>{a.active ? <Pill tone="good">active</Pill> : <Pill tone="neutral">paused</Pill>}</td>
              <td className="text-right">
                <div className="flex justify-end gap-1">
                  <button onClick={() => openPayDialog(a)} disabled={Number(a.pendingAmount) === 0}
                    className="inline-flex items-center gap-1 rounded-md bg-emerald-500/15 px-2 py-1 text-[10px] font-bold text-emerald-300 ring-1 ring-emerald-400/30 disabled:opacity-30">
                    <DollarSign className="h-3 w-3" /> Pay
                  </button>
                  <button onClick={() => toggleActive(a)}
                    className={`rounded-md px-2 py-1 text-[10px] font-bold ring-1 ${a.active ? "bg-rose-500/15 text-rose-300 ring-rose-400/30" : "bg-sky-500/15 text-sky-300 ring-sky-400/30"}`}>
                    {a.active ? "Pause" : "Activate"}
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {!loading && filtered.length === 0 && <tr><td colSpan={10} className="py-8 text-center text-sm text-muted-foreground">No affiliates found.</td></tr>}
        </DataTable>
      </Panel>

      {paying && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-surface p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white">Pay affiliate</h3>
            <p className="mt-1 text-sm text-muted-foreground">{paying.user?.name ?? `Affiliate #${paying.id}`} · {paying.partner}</p>
            <div className="mt-4 space-y-3">
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">Amount ($)</label>
                <input value={payAmount} onChange={(e) => setPayAmount(e.target.value)} type="number" min="0"
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-accent" />
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">Narration</label>
                <input value={payNarration} onChange={(e) => setPayNarration(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-accent" />
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setPaying(null)} className="rounded-lg bg-white/5 px-4 py-2 text-sm text-white ring-1 ring-white/10 hover:bg-white/10">Cancel</button>
              <button onClick={doPay} disabled={submitting || !payAmount}
                className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
                {submitting ? "Paying…" : `Pay $${Number(payAmount || 0).toLocaleString()}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
