import { X, FileImage, Mail, Hash, Wallet as WalletIcon, Clock, CheckCircle2, XCircle, ShieldCheck } from "lucide-react";
import type { Claim } from "@/lib/admin-data";

const targetLabel: Record<string, string> = {
  "rr-wallet": "RR Wallet (points)",
  "broker-wallet": "Broker / Partner wallet",
  "rebate-wallet": "RebateBoard Wallet (USD)",
  "revete-wallet": "RebateBoard Wallet (USD)",
};

export function ClaimDetailDrawer({ claim, onClose }: { claim: Claim; onClose: () => void }) {
  const isPaid = claim.status === "paid";
  const isApproved = claim.status === "approved" || isPaid;
  const isRejected = claim.status === "rejected";
  const steps = [
    { key: "submitted", label: "Submitted", icon: Clock, done: true, sub: claim.submitted },
    { key: "review", label: "Under review", icon: ShieldCheck, done: claim.status !== "pending", sub: claim.status === "pending" ? "In queue" : "Reviewed by admin" },
    {
      key: "decision",
      label: isRejected ? "Rejected" : isApproved ? "Approved" : "Awaiting decision",
      icon: isRejected ? XCircle : isApproved ? CheckCircle2 : Clock,
      done: claim.status !== "pending",
      sub: isRejected ? (claim.note ?? "Rejected by admin") : isApproved ? (claim.approvedAt ? `By ${claim.approvedBy ?? "@admin"} · ${claim.approvedAt}` : "Approved by admin") : "—",
    },
    {
      key: "paid",
      label: isPaid ? "Paid" : "Awaiting payout",
      icon: isPaid ? CheckCircle2 : Clock,
      done: isPaid,
      sub: isPaid
        ? `Credited to ${targetLabel[claim.payoutTarget ?? "rebate-wallet"]} via ${claim.payoutMethod ?? "manual"}${claim.payoutTxRef && claim.payoutTxRef !== "auto" ? ` · ${claim.payoutTxRef}` : ""}`
        : isApproved ? "Admin is processing your payout" : "—",
    },
  ];

  return (
    <div className="fixed inset-0 z-[80] flex justify-end bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="h-full w-full max-w-lg overflow-y-auto border-l border-white/10 bg-[#0b1426] p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-5 flex items-start justify-between">
          <div>
            <div className="text-xs uppercase tracking-wide text-white/50">Claim {claim.id}</div>
            <h2 className="mt-1 text-xl font-bold text-white">{claim.partner} · ${claim.amount.toFixed(2)}</h2>
            <div className="mt-1 text-xs text-white/60">{claim.type} · Account {claim.accountId}</div>
          </div>
          <button onClick={onClose} className="rounded-full p-2 text-white/60 hover:bg-white/10 hover:text-white"><X className="h-4 w-4" /></button>
        </div>

        <div className={`mb-5 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
          claim.status === "paid" ? "bg-emerald-500/15 text-emerald-300"
          : claim.status === "approved" ? "bg-sky-500/15 text-sky-300"
          : claim.status === "rejected" ? "bg-rose-500/15 text-rose-300"
          : "bg-amber-500/15 text-amber-300"
        }`}>
          {claim.status.toUpperCase()}
        </div>

        <section className="mb-6 rounded-xl border border-white/10 bg-white/5 p-4">
          <h3 className="mb-3 text-sm font-semibold text-white">Status timeline</h3>
          <ol className="space-y-3">
            {steps.map((s) => (
              <li key={s.key} className="flex gap-3">
                <div className={`mt-0.5 grid h-7 w-7 place-items-center rounded-full ${s.done ? "bg-emerald-500/20 text-emerald-300" : "bg-white/10 text-white/40"}`}>
                  <s.icon className="h-3.5 w-3.5" />
                </div>
                <div className="flex-1">
                  <div className={`text-sm font-medium ${s.done ? "text-white" : "text-white/50"}`}>{s.label}</div>
                  <div className="text-xs text-white/50">{s.sub}</div>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="mb-6 grid gap-3 sm:grid-cols-2">
          <Field icon={WalletIcon} label="Payout target" value={targetLabel[claim.payoutTarget ?? "rebate-wallet"]} />
          <Field icon={Hash} label="Account ID" value={claim.accountId} />
          {claim.registeredEmail && <Field icon={Mail} label="Registered email" value={claim.registeredEmail} />}
          {claim.orderId && <Field icon={Hash} label="Order / Receipt" value={claim.orderId} />}
        </section>

        {(claim.evidenceUrls?.length ?? 0) > 0 && (
          <section className="mb-6">
            <h3 className="mb-2 text-sm font-semibold text-white">Evidence ({claim.evidenceUrls!.length})</h3>
            <div className="grid grid-cols-3 gap-2">
              {claim.evidenceUrls!.map((u, i) => (
                <a key={i} href={u} target="_blank" rel="noreferrer" className="group block aspect-square overflow-hidden rounded-lg border border-white/10 bg-black/30">
                  {u.startsWith("data:image") || /\.(png|jpe?g|webp|gif)$/i.test(u)
                    ? <img src={u} alt="" className="h-full w-full object-cover transition group-hover:scale-105" />
                    : <div className="flex h-full w-full items-center justify-center"><FileImage className="h-6 w-6 text-white/40" /></div>}
                </a>
              ))}
            </div>
          </section>
        )}

        {claim.note && (
          <section className="rounded-xl border border-white/10 bg-white/5 p-4">
            <h3 className="mb-1 text-sm font-semibold text-white">Admin note</h3>
            <p className="text-sm text-white/70">{claim.note}</p>
          </section>
        )}
      </div>
    </div>
  );
}

function Field({ icon: Icon, label, value }: { icon: typeof Mail; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-3">
      <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-white/50"><Icon className="h-3 w-3" /> {label}</div>
      <div className="mt-1 truncate text-sm text-white">{value}</div>
    </div>
  );
}
