import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader, Panel, DataTable, StatusPill, StatCard, Toolbar } from "@/components/superadmin/AdminUI";
import { ConfirmDialog, Modal, Field, fieldCls, toast } from "@/components/superadmin/AdminActions";
import { useAdminCollection, creditWallet, addRrEntry, addAudit } from "@/lib/admin-store";
import { claims as seed, userWallets, type Claim } from "@/lib/admin-data";
import { Check, X, Eye, Coins, Banknote, Building2, BadgeDollarSign, FileImage, Mail, Hash, ExternalLink } from "lucide-react";

export const Route = createFileRoute("/superadmin/claims")({
  component: ClaimsPage,
});

type Action = "approve" | "reject" | "mark-paid";

function ClaimsPage() {
  const { items, update } = useAdminCollection<Claim>("claims", seed);
  const [filter, setFilter] = useState<"all" | Claim["status"]>("all");
  const [confirm, setConfirm] = useState<{ c: Claim; action: Action } | null>(null);
  const [viewing, setViewing] = useState<Claim | null>(null);
  const [payoutMethod, setPayoutMethod] = useState("USDT TRC20");
  const [payoutRef, setPayoutRef] = useState("");

  const filtered = useMemo(() => items.filter((c) => filter === "all" || c.status === filter), [items, filter]);

  const isAutoTarget = (t?: Claim["payoutTarget"]) => t === "rr-wallet" || t === "rebate-wallet" || t === "revete-wallet";

  const apply = (c: Claim, action: Action) => {
    const target = c.payoutTarget ?? "rebate-wallet";
    const now = "just now";

    if (action === "reject") {
      update(c.id, { status: "rejected" });
      addAudit({ actor: "@admin", action: `Rejected claim ${c.id}`, target: c.user });
      toast.success(`Claim ${c.id} rejected`);
      return;
    }

    if (action === "approve") {
      // Auto-credit & auto-mark-paid for in-system wallets (RR + RebateBoard cash)
      if (isAutoTarget(target)) {
        if (target === "rr-wallet") {
          addRrEntry({ user: c.user, type: `Cashback (${c.partner})`, amount: Math.round(c.amount * 10) });
        } else {
          creditWallet({
            walletsSeed: userWallets, userKey: c.user, amount: c.amount,
            narration: `Cashback claim ${c.id} (${c.partner}) — auto credit`,
            type: "Cashback Credit", by: "@admin",
          });
        }
        update(c.id, {
          status: "paid", approvedAt: now, approvedBy: "@admin",
          paidAt: now, paidBy: "@admin",
          payoutMethod: target === "rr-wallet" ? "RR ledger" : "Auto credit (RebateBoard wallet)",
          payoutTxRef: "auto",
        });
        addAudit({ actor: "@admin", action: `Approved & auto-paid claim ${c.id}`, target: c.user });
        toast.success(`Approved — credited ${target === "rr-wallet" ? `${Math.round(c.amount * 10)} RR` : `$${c.amount}`} to ${c.user}`);
      } else {
        // broker-wallet → admin must manually pay outside system, then mark paid
        update(c.id, { status: "approved", approvedAt: now, approvedBy: "@admin" });
        addAudit({ actor: "@admin", action: `Approved claim ${c.id} — awaiting manual payout`, target: c.user });
        toast.success(`Approved — pay $${c.amount} via broker, then "Mark as paid"`);
      }
      return;
    }

    if (action === "mark-paid") {
      update(c.id, {
        status: "paid", paidAt: now, paidBy: "@admin",
        payoutMethod: payoutMethod || "Manual",
        payoutTxRef: payoutRef || undefined,
      });
      addAudit({ actor: "@admin", action: `Marked claim ${c.id} as paid (${payoutMethod})`, target: c.user });
      toast.success(`Claim ${c.id} marked as paid`);
      setPayoutRef("");
    }
  };

  const targetLabel = (t?: Claim["payoutTarget"]) => {
    if (t === "rr-wallet") return { label: "RR Wallet", icon: <Coins className="h-3 w-3" />, cls: "bg-amber-500/15 text-amber-300 ring-amber-400/30", note: "Auto-credit on approve" };
    if (t === "broker-wallet") return { label: "Broker / Cash", icon: <Building2 className="h-3 w-3" />, cls: "bg-fuchsia-500/15 text-fuchsia-300 ring-fuchsia-400/30", note: "Manual payout — mark paid after" };
    return { label: "RebateBoard $", icon: <Banknote className="h-3 w-3" />, cls: "bg-emerald-500/15 text-emerald-300 ring-emerald-400/30", note: "Auto-credit on approve" };
  };

  return (
    <div>
      <PageHeader title="Claim System" subtitle="Review evidence, approve, and track payouts. RR and RebateBoard credits are automatic — broker / cash payouts must be marked paid after sending." />

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-5">
        <StatCard label="Pending" value={String(items.filter((c) => c.status === "pending").length)} delta="needs review" tone="flat" />
        <StatCard label="Approved" value={String(items.filter((c) => c.status === "approved").length)} delta="awaiting payout" tone="flat" />
        <StatCard label="Paid" value={String(items.filter((c) => c.status === "paid").length)} delta="credited to user" tone="up" />
        <StatCard label="Rejected" value={String(items.filter((c) => c.status === "rejected").length)} delta="invalid" tone="down" />
        <StatCard label="Total $" value={`$${items.reduce((s, c) => s + c.amount, 0).toLocaleString()}`} delta="across all" tone="flat" />
      </div>

      <Toolbar>
        {(["all", "pending", "approved", "paid", "rejected"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize ring-1 transition ${filter === f ? "bg-gradient-to-r from-fuchsia-500 to-violet-600 text-white ring-fuchsia-400/40" : "bg-white/5 text-muted-foreground ring-white/10 hover:text-white"}`}>{f}</button>
        ))}
      </Toolbar>

      <Panel title={`Claims queue — ${filtered.length}`}>
        <DataTable head={<><th>ID</th><th>User</th><th>Partner</th><th>Account</th><th>Type</th><th>Amount</th><th>Payout</th><th>Evidence</th><th>Status</th><th>Submitted</th><th></th></>}>
          {filtered.map((c) => {
            const t = targetLabel(c.payoutTarget);
            const auto = isAutoTarget(c.payoutTarget);
            return (
              <tr key={c.id}>
                <td className="font-mono text-xs text-muted-foreground">{c.id}</td>
                <td className="font-semibold">{c.user}</td>
                <td>{c.partner}</td>
                <td className="font-mono text-xs">{c.accountId || "—"}</td>
                <td>{c.type}</td>
                <td className="font-mono text-emerald-300">${c.amount.toLocaleString()}</td>
                <td>
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${t.cls}`} title={t.note}>
                    {t.icon}{t.label}
                  </span>
                </td>
                <td className="font-mono">{(c.evidenceUrls?.length ?? c.evidence) || 0}</td>
                <td><StatusPill status={c.status} /></td>
                <td className="text-xs text-muted-foreground">{c.submitted}</td>
                <td className="text-right">
                  <div className="flex justify-end gap-1">
                    <button onClick={() => setViewing(c)} className="grid h-7 w-7 place-items-center rounded-md bg-white/10 text-white" title="Review evidence"><Eye className="h-3 w-3" /></button>
                    {c.status === "pending" && (
                      <>
                        <button onClick={() => setConfirm({ c, action: "approve" })} className="grid h-7 w-7 place-items-center rounded-md bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/30" title={auto ? "Approve & auto-credit" : "Approve (manual payout)"}><Check className="h-3 w-3" /></button>
                        <button onClick={() => setConfirm({ c, action: "reject" })} className="grid h-7 w-7 place-items-center rounded-md bg-rose-500/15 text-rose-300 ring-1 ring-rose-400/30" title="Reject"><X className="h-3 w-3" /></button>
                      </>
                    )}
                    {c.status === "approved" && !auto && (
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
          {filtered.length === 0 && <tr><td colSpan={11} className="py-8 text-center text-sm text-muted-foreground">No claims match.</td></tr>}
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
                ? `Approve & auto-credit ${confirm.c.payoutTarget === "rr-wallet" ? `${Math.round(confirm.c.amount * 10)} RR` : `$${confirm.c.amount}`}?`
                : `Approve $${confirm.c.amount}? (manual payout)`)
            : `Reject claim ${confirm?.c.id}?`
        }
        message={
          confirm?.action === "approve"
            ? (isAutoTarget(confirm.c.payoutTarget)
                ? `${confirm.c.user}'s ${confirm.c.payoutTarget === "rr-wallet" ? "RR" : "RebateBoard"} wallet will be credited immediately and the claim marked as paid.`
                : `Marks the claim as approved. Send the cash through the broker / partner, then come back and click "Mark paid" with the tx reference.`)
            : "Mark this claim as rejected. The user can submit additional evidence."
        }
        confirmText={confirm?.action === "approve" ? "Approve" : "Reject"}
        tone={confirm?.action === "reject" ? "danger" : "primary"}
      />

      {/* Mark as paid modal */}
      {confirm?.action === "mark-paid" && (
        <Modal open onClose={() => setConfirm(null)} title={`Mark ${confirm.c.id} as paid`} size="sm">
          <p className="mb-3 text-xs text-muted-foreground">
            Confirms ${confirm.c.amount} was sent to {confirm.c.user} for {confirm.c.partner}. The user's claim will flip to "paid".
          </p>
          <div className="grid gap-3">
            <Field label="Payout method">
              <select className={fieldCls} value={payoutMethod} onChange={(e) => setPayoutMethod(e.target.value)}>
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
            <button onClick={() => { apply(confirm.c, "mark-paid"); setConfirm(null); }}
              className="rounded-md bg-gradient-to-r from-emerald-500 to-teal-600 px-3 py-1.5 text-xs font-semibold text-white">
              Confirm paid
            </button>
          </div>
        </Modal>
      )}

      {/* Full evidence review */}
      {viewing && (() => {
        const t = targetLabel(viewing.payoutTarget);
        return (
        <Modal open onClose={() => setViewing(null)} title={`Claim ${viewing.id} — what the user submitted`} size="md">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold ring-1 ${t.cls}`}>{t.icon}{t.label}</span>
            <span className="text-[11px] text-muted-foreground">{t.note}</span>
            <StatusPill status={viewing.status} />
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <Field label="User"><input className={fieldCls} value={viewing.user} readOnly /></Field>
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

          {(viewing.status === "approved" || viewing.status === "paid") && (
            <div className="mt-4 grid gap-2 rounded-lg border border-white/10 bg-white/5 p-3 text-xs">
              <div className="flex items-center gap-2 text-white"><BadgeDollarSign className="h-3.5 w-3.5 text-emerald-300" /> Payout trail</div>
              {viewing.approvedAt && <div className="text-muted-foreground">Approved by {viewing.approvedBy ?? "@admin"} · {viewing.approvedAt}</div>}
              {viewing.paidAt
                ? <div className="text-emerald-300">Paid {viewing.paidAt} via {viewing.payoutMethod}{viewing.payoutTxRef ? ` · ${viewing.payoutTxRef}` : ""}</div>
                : <div className="text-amber-300">Awaiting manual payout — use "Mark paid" once the cash is sent.</div>}
            </div>
          )}

          <div className="mt-4 flex flex-wrap justify-end gap-2">
            {viewing.registeredEmail && (
              <a href={`mailto:${viewing.registeredEmail}`} className="inline-flex items-center gap-1 rounded-md bg-white/5 px-3 py-1.5 text-xs text-white ring-1 ring-white/10">
                <Mail className="h-3 w-3" /> Email user
              </a>
            )}
            {viewing.status === "pending" && (
              <>
                <button onClick={() => { setViewing(null); setConfirm({ c: viewing, action: "reject" }); }} className="rounded-md bg-rose-500/15 px-3 py-1.5 text-xs font-semibold text-rose-300 ring-1 ring-rose-400/30">Reject</button>
                <button onClick={() => { setViewing(null); setConfirm({ c: viewing, action: "approve" }); }} className="rounded-md bg-gradient-to-r from-emerald-500 to-teal-600 px-3 py-1.5 text-xs font-semibold text-white">
                  {isAutoTarget(viewing.payoutTarget) ? "Approve & auto-credit" : "Approve"}
                </button>
              </>
            )}
            {viewing.status === "approved" && !isAutoTarget(viewing.payoutTarget) && (
              <button onClick={() => { setViewing(null); setPayoutMethod("USDT TRC20"); setPayoutRef(""); setConfirm({ c: viewing, action: "mark-paid" }); }}
                className="inline-flex items-center gap-1 rounded-md bg-amber-500/15 px-3 py-1.5 text-xs font-semibold text-amber-300 ring-1 ring-amber-400/30">
                <Hash className="h-3 w-3" /> Mark as paid
              </button>
            )}
          </div>
        </Modal>
      ); })()}
    </div>
  );
}
