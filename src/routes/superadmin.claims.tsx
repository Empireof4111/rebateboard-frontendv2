import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { PageHeader, Panel, DataTable, StatusPill, StatCard, Toolbar } from "@/components/superadmin/AdminUI";
import { ConfirmDialog, Modal, Field, fieldCls, selectCls, toast } from "@/components/superadmin/AdminActions";
import { useAuth } from "@/lib/auth";
import { financeApi, type CashbackClaim, type ClaimStats } from "@/lib/finance-api";
import { ApiError } from "@/lib/api";
import { Check, X, Eye, Coins, Banknote, Building2, BadgeDollarSign, FileImage, Mail, Hash, ExternalLink, RefreshCw } from "lucide-react";

export const Route = createFileRoute("/superadmin/claims")({
  component: ClaimsPage,
});

type Action = "approve" | "reject" | "mark-paid";
type FilterStatus = "all" | "pending" | "approved" | "paid" | "rejected";

const API_STATUS: Record<FilterStatus, string> = {
  all: "",
  pending: "PENDING",
  approved: "APPROVED",
  paid: "PAID",
  rejected: "DECLINED",
};

function statusToFilter(apiStatus?: string): FilterStatus {
  const map: Record<string, FilterStatus> = {
    PENDING: "pending",
    APPROVED: "approved",
    PAID: "paid",
    DECLINED: "rejected",
  };
  return map[apiStatus?.toUpperCase() ?? ""] ?? "pending";
}

function ClaimsPage() {
  const { token } = useAuth();
  const [claims, setClaims] = useState<CashbackClaim[]>([]);
  const [stats, setStats] = useState<ClaimStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [confirm, setConfirm] = useState<{ c: CashbackClaim; action: Action } | null>(null);
  const [viewing, setViewing] = useState<CashbackClaim | null>(null);
  const [payoutMethod, setPayoutMethod] = useState("USDT TRC20");
  const [payoutRef, setPayoutRef] = useState("");

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [claimsRes, statsRes] = await Promise.all([
        financeApi.getAllClaims(token, { size: 100 }),
        financeApi.getClaimStats(token),
      ]);
      if (claimsRes.payload) setClaims(claimsRes.payload.page);
      if (statsRes.payload) setStats(statsRes.payload);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Failed to load claims");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const isAutoTarget = (t?: string) => t === "rr-wallet" || t === "rebate-wallet" || t === "revete-wallet";

  const filtered = useMemo(() =>
    filter === "all"
      ? claims
      : claims.filter((c) => c.status?.toUpperCase() === API_STATUS[filter]),
    [claims, filter],
  );

  const apply = async (c: CashbackClaim, action: Action) => {
    if (!token) return;
    try {
      if (action === "reject") {
        await financeApi.updateClaimStatus(token, c.id, { status: "DECLINED" });
        toast.success(`Claim #${c.id} rejected`);
      } else if (action === "approve") {
        if (isAutoTarget(c.payoutTarget)) {
          await financeApi.updateClaimStatus(token, c.id, {
            status: "PAID",
            payoutMethod: c.payoutTarget === "rr-wallet" ? "RR ledger" : "Auto credit (RebateBoard wallet)",
            payoutTxRef: "auto",
          });
          toast.success(`Approved & credited $${c.amount} to ${c.user?.name ?? "user"}`);
        } else {
          await financeApi.updateClaimStatus(token, c.id, { status: "APPROVED" });
          toast.success(`Approved — pay $${c.amount} via broker, then "Mark as paid"`);
        }
      } else if (action === "mark-paid") {
        await financeApi.updateClaimStatus(token, c.id, {
          status: "PAID",
          payoutMethod: payoutMethod || "Manual",
          payoutTxRef: payoutRef || undefined,
        });
        toast.success(`Claim #${c.id} marked as paid`);
        setPayoutRef("");
      }
      void load();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Action failed");
    } finally {
      setConfirm(null);
    }
  };

  const targetLabel = (t?: string) => {
    if (t === "rr-wallet") return { label: "RR Wallet", icon: <Coins className="h-3 w-3" />, cls: "bg-amber-500/15 text-amber-300 ring-amber-400/30", note: "Auto-credit on approve" };
    if (t === "broker-wallet") return { label: "Broker / Cash", icon: <Building2 className="h-3 w-3" />, cls: "bg-fuchsia-500/15 text-fuchsia-300 ring-fuchsia-400/30", note: "Manual payout — mark paid after" };
    return { label: "RebateBoard $", icon: <Banknote className="h-3 w-3" />, cls: "bg-emerald-500/15 text-emerald-300 ring-emerald-400/30", note: "Auto-credit on approve" };
  };

  const fmt = (d?: string | Date) => {
    if (!d) return "—";
    return new Date(d).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div>
      <PageHeader title="Claim System" subtitle="Review evidence, approve, and track payouts. RR and RebateBoard credits are automatic — broker / cash payouts must be marked paid after sending." />

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-5">
        <StatCard label="Pending" value={stats ? String(stats.pending) : "—"} delta="needs review" tone="flat" />
        <StatCard label="Approved" value={stats ? String(stats.approved) : "—"} delta="awaiting payout" tone="flat" />
        <StatCard label="Paid" value={stats ? String(stats.paid) : "—"} delta="credited to user" tone="up" />
        <StatCard label="Rejected" value={stats ? String(stats.rejected) : "—"} delta="invalid" tone="down" />
        <StatCard label="Total $" value={stats ? `$${Number(stats.totalAmountPaid).toLocaleString()}` : "—"} delta="across all paid" tone="flat" />
      </div>

      <Toolbar>
        {(["all", "pending", "approved", "paid", "rejected"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize ring-1 transition ${filter === f ? "bg-gradient-to-r from-fuchsia-500 to-violet-600 text-white ring-fuchsia-400/40" : "bg-white/5 text-muted-foreground ring-white/10 hover:text-white"}`}>{f}</button>
        ))}
        <button onClick={load} className="ml-auto grid h-7 w-7 place-items-center rounded-md bg-white/5 text-white ring-1 ring-white/10" title="Refresh">
          <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
        </button>
      </Toolbar>

      <Panel title={`Claims queue — ${filtered.length}`}>
        <DataTable head={<><th>ID</th><th>User</th><th>Partner</th><th>Account</th><th>Type</th><th>Amount</th><th>Payout</th><th>Evidence</th><th>Status</th><th>Submitted</th><th></th></>}>
          {loading && <tr><td colSpan={11} className="py-8 text-center text-sm text-muted-foreground">Loading…</td></tr>}
          {!loading && filtered.map((c) => {
            const t = targetLabel(c.payoutTarget);
            const auto = isAutoTarget(c.payoutTarget);
            const ds = statusToFilter(c.status);
            return (
              <tr key={c.id}>
                <td className="font-mono text-xs text-muted-foreground">#{c.id}</td>
                <td className="font-semibold">{c.user?.name ?? String(c.userId)}</td>
                <td>{c.partner}</td>
                <td className="font-mono text-xs">{c.accountId || "—"}</td>
                <td>{c.type}</td>
                <td className="font-mono text-emerald-300">${Number(c.amount).toLocaleString()}</td>
                <td>
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${t.cls}`} title={t.note}>
                    {t.icon}{t.label}
                  </span>
                </td>
                <td className="font-mono">{c.evidence ?? c.evidenceUrls?.length ?? 0}</td>
                <td><StatusPill status={ds} /></td>
                <td className="text-xs text-muted-foreground">{fmt(c.createdAt)}</td>
                <td className="text-right">
                  <div className="flex justify-end gap-1">
                    <button onClick={() => setViewing(c)} className="grid h-7 w-7 place-items-center rounded-md bg-white/10 text-white" title="Review evidence"><Eye className="h-3 w-3" /></button>
                    {ds === "pending" && (
                      <>
                        <button onClick={() => setConfirm({ c, action: "approve" })} className="grid h-7 w-7 place-items-center rounded-md bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/30" title={auto ? "Approve & auto-credit" : "Approve (manual payout)"}><Check className="h-3 w-3" /></button>
                        <button onClick={() => setConfirm({ c, action: "reject" })} className="grid h-7 w-7 place-items-center rounded-md bg-rose-500/15 text-rose-300 ring-1 ring-rose-400/30" title="Reject"><X className="h-3 w-3" /></button>
                      </>
                    )}
                    {ds === "approved" && !auto && (
                      <button onClick={() => { setPayoutMethod("USDT TRC20"); setPayoutRef(""); setConfirm({ c, action: "mark-paid" }); }}
                        className="inline-flex items-center gap-1 rounded-md bg-amber-500/15 px-2 py-1 text-[11px] font-semibold text-amber-300 ring-1 ring-amber-400/30"
                        title="Mark as paid">
                        <BadgeDollarSign className="h-3 w-3" /> Mark paid
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
          {!loading && filtered.length === 0 && <tr><td colSpan={11} className="py-8 text-center text-sm text-muted-foreground">No claims match.</td></tr>}
        </DataTable>
      </Panel>

      {/* Approve / reject confirm */}
      <ConfirmDialog
        open={!!confirm && confirm.action !== "mark-paid"}
        onClose={() => setConfirm(null)}
        onConfirm={() => { if (confirm) apply(confirm.c, confirm.action); }}
        title={
          confirm?.action === "approve"
            ? (isAutoTarget(confirm.c.payoutTarget)
                ? `Approve & auto-credit $${confirm.c.amount}?`
                : `Approve $${confirm.c.amount}? (manual payout)`)
            : `Reject claim #${confirm?.c.id}?`
        }
        message={
          confirm?.action === "approve"
            ? (isAutoTarget(confirm.c.payoutTarget)
                ? `${confirm.c.user?.name ?? "User"}'s ${confirm.c.payoutTarget === "rr-wallet" ? "RR" : "RebateBoard"} wallet will be credited immediately and the claim marked as paid.`
                : `Marks the claim as approved. Send the cash through the broker / partner, then come back and click "Mark paid" with the tx reference.`)
            : "Mark this claim as rejected. The user can submit additional evidence."
        }
        confirmText={confirm?.action === "approve" ? "Approve" : "Reject"}
        tone={confirm?.action === "reject" ? "danger" : "primary"}
      />

      {/* Mark as paid modal */}
      {confirm?.action === "mark-paid" && (
        <Modal open onClose={() => setConfirm(null)} title={`Mark #${confirm.c.id} as paid`} size="sm">
          <p className="mb-3 text-xs text-muted-foreground">
            Confirms ${confirm.c.amount} was sent to {confirm.c.user?.name ?? "user"} for {confirm.c.partner}. The user's claim will flip to "paid".
          </p>
          <div className="grid gap-3">
            <Field label="Payout method">
              <select className={selectCls} value={payoutMethod} onChange={(e) => setPayoutMethod(e.target.value)}>
                <option>USDT TRC20</option>
                <option>USDT ERC20</option>
                <option>BTC</option>
                <option>Bank wire</option>
                <option>Broker internal credit</option>
                <option>Other</option>
              </select>
            </Field>
            <Field label="Tx hash / wire reference (optional)">
              <input className={fieldCls} value={payoutRef} onChange={(e) => setPayoutRef(e.target.value)} placeholder="e.g. 0x4b…a91f" />
            </Field>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button onClick={() => setConfirm(null)} className="rounded-md bg-white/5 px-3 py-1.5 text-xs text-white ring-1 ring-white/10">Cancel</button>
            <button onClick={() => apply(confirm.c, "mark-paid")}
              className="rounded-md bg-gradient-to-r from-emerald-500 to-teal-600 px-3 py-1.5 text-xs font-semibold text-white">
              Confirm paid
            </button>
          </div>
        </Modal>
      )}

      {/* Full evidence review */}
      {viewing && (() => {
        const t = targetLabel(viewing.payoutTarget);
        const ds = statusToFilter(viewing.status);
        return (
          <Modal open onClose={() => setViewing(null)} title={`Claim #${viewing.id} — what the user submitted`} size="md">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold ring-1 ${t.cls}`}>{t.icon}{t.label}</span>
              <span className="text-[11px] text-muted-foreground">{t.note}</span>
              <StatusPill status={ds} />
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <Field label="User"><input className={fieldCls} value={viewing.user?.name ?? String(viewing.userId)} readOnly /></Field>
              <Field label="Partner"><input className={fieldCls} value={`${viewing.partner}${viewing.partnerCategory ? ` — ${viewing.partnerCategory}` : ""}`} readOnly /></Field>
              <Field label="Account ID at partner"><input className={fieldCls} value={viewing.accountId || "—"} readOnly /></Field>
              <Field label="Registered email"><input className={fieldCls} value={viewing.registeredEmail || "—"} readOnly /></Field>
              <Field label="Order / Receipt ID"><input className={fieldCls} value={viewing.orderId || "—"} readOnly /></Field>
              <Field label="Claim type"><input className={fieldCls} value={viewing.type} readOnly /></Field>
              <Field label="Amount requested"><input className={fieldCls} value={`$${viewing.amount}`} readOnly /></Field>
              <Field label="User chose payout to"><input className={fieldCls} value={t.label} readOnly /></Field>
              {viewing.note && <Field label="User / system note" span={2}><textarea rows={2} className={fieldCls} value={viewing.note} readOnly /></Field>}
            </div>

            <div className="mt-4">
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-white">
                <FileImage className="h-3.5 w-3.5" /> Evidence ({viewing.evidenceUrls?.length ?? 0})
              </div>
              {viewing.evidenceUrls && viewing.evidenceUrls.length > 0 ? (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {viewing.evidenceUrls.map((u, i) => (
                    <a key={i} href={u} target="_blank" rel="noreferrer" className="group relative block aspect-square overflow-hidden rounded-md ring-1 ring-white/10">
                      {u.startsWith("data:image") || /\.(png|jpe?g|webp|gif)$/i.test(u)
                        ? <img src={u} alt={`evidence ${i + 1}`} className="h-full w-full object-cover transition group-hover:scale-105" />
                        : <div className="flex h-full w-full items-center justify-center bg-black/30"><FileImage className="h-6 w-6 text-white/40" /></div>}
                      <span className="absolute bottom-1 right-1 rounded bg-black/60 px-1 py-0.5 text-[9px] text-white opacity-0 group-hover:opacity-100"><ExternalLink className="h-2.5 w-2.5" /></span>
                    </a>
                  ))}
                </div>
              ) : (
                <div className="rounded-md border border-dashed border-white/10 bg-white/5 p-4 text-center text-xs text-muted-foreground">
                  No evidence files attached.
                </div>
              )}
            </div>

            {(ds === "approved" || ds === "paid") && (
              <div className="mt-4 grid gap-2 rounded-lg border border-white/10 bg-white/5 p-3 text-xs">
                <div className="flex items-center gap-2 text-white"><BadgeDollarSign className="h-3.5 w-3.5 text-emerald-300" /> Payout trail</div>
                {viewing.approvedAt && <div className="text-muted-foreground">Approved by {viewing.approvedBy?.name ?? "admin"} · {fmt(viewing.approvedAt)}</div>}
                {ds === "paid"
                  ? <div className="text-emerald-300">Paid via {viewing.payoutMethod ?? "—"}{viewing.payoutTxRef ? ` · ${viewing.payoutTxRef}` : ""}</div>
                  : <div className="text-amber-300">Awaiting manual payout — use "Mark paid" once the cash is sent.</div>}
              </div>
            )}

            <div className="mt-4 flex flex-wrap justify-end gap-2">
              {viewing.user?.emailAddress && (
                <a href={`mailto:${viewing.user.emailAddress}`} className="inline-flex items-center gap-1 rounded-md bg-white/5 px-3 py-1.5 text-xs text-white ring-1 ring-white/10">
                  <Mail className="h-3 w-3" /> Email user
                </a>
              )}
              {ds === "pending" && (
                <>
                  <button onClick={() => { setViewing(null); setConfirm({ c: viewing, action: "reject" }); }} className="rounded-md bg-rose-500/15 px-3 py-1.5 text-xs font-semibold text-rose-300 ring-1 ring-rose-400/30">Reject</button>
                  <button onClick={() => { setViewing(null); setConfirm({ c: viewing, action: "approve" }); }} className="rounded-md bg-gradient-to-r from-emerald-500 to-teal-600 px-3 py-1.5 text-xs font-semibold text-white">
                    {isAutoTarget(viewing.payoutTarget) ? "Approve & auto-credit" : "Approve"}
                  </button>
                </>
              )}
              {ds === "approved" && !isAutoTarget(viewing.payoutTarget) && (
                <button onClick={() => { setViewing(null); setPayoutMethod("USDT TRC20"); setPayoutRef(""); setConfirm({ c: viewing, action: "mark-paid" }); }}
                  className="inline-flex items-center gap-1 rounded-md bg-amber-500/15 px-3 py-1.5 text-xs font-semibold text-amber-300 ring-1 ring-amber-400/30">
                  <Hash className="h-3 w-3" /> Mark as paid
                </button>
              )}
            </div>
          </Modal>
        );
      })()}
    </div>
  );
}
