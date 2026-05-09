import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader, Panel } from "@/components/superadmin/AdminUI";
import { toast } from "@/components/superadmin/AdminActions";
import { useReviews, setReviewStatus, toggleReviewFlag, deleteReview, type ReviewRecord } from "@/lib/reviews-store";
import { Check, X, Flag, Trash2, Star, Eye, ShieldCheck, FileText, ImageIcon, ChevronRight, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/superadmin/reviews")({
  component: ReviewsPage,
});

function ReviewsPage() {
  const items = useReviews();
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected" | "flagged">("pending");
  const [selected, setSelected] = useState<ReviewRecord | null>(null);

  const filtered = items.filter((r) =>
    filter === "all" ? true : filter === "flagged" ? r.flagged : r.status === filter,
  );
  const counts = {
    pending: items.filter((r) => r.status === "pending").length,
    approved: items.filter((r) => r.status === "approved").length,
    rejected: items.filter((r) => r.status === "rejected").length,
    flagged: items.filter((r) => r.flagged).length,
    all: items.length,
  };

  return (
    <div>
      <PageHeader title="Review Moderation" subtitle={`${counts.pending} pending · ${counts.flagged} auto-flagged · synced with TBI engine`} />

      <div className="mb-4 flex flex-wrap gap-2">
        {(["pending", "approved", "rejected", "flagged", "all"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize ring-1 transition ${filter === f ? "bg-gradient-to-r from-fuchsia-500 to-violet-600 text-white ring-fuchsia-400/40" : "bg-white/5 text-muted-foreground ring-white/10 hover:text-white"}`}>
            {f} <span className="ml-1 rounded-full bg-white/10 px-1.5 py-0.5 text-[9px]">{counts[f]}</span>
          </button>
        ))}
      </div>

      <Panel title={`Moderation queue — ${filtered.length}`}>
        <div className="grid gap-3 md:grid-cols-2">
          {filtered.map((r) => (
            <div key={r.id} className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-bold text-white">{r.brandName}</div>
                  <div className="text-[11px] text-muted-foreground">
                    by {r.userName} · {r.providerType} · <span className="capitalize">{r.status}</span>
                  </div>
                </div>
                <div className="text-amber-300 text-xs">{"★".repeat(r.ratings.overall)}{"☆".repeat(5 - r.ratings.overall)}</div>
              </div>
              <p className="mt-2 line-clamp-2 text-sm text-white/90">{r.body}</p>

              {/* proof thumbnails */}
              {r.proofs.length > 0 && (
                <div className="mt-2 flex gap-1.5">
                  {r.proofs.slice(0, 4).map((p) => (
                    <div key={p.id} className="h-12 w-12 overflow-hidden rounded-lg ring-1 ring-white/10">
                      {p.type.startsWith("image/") ? (
                        <img src={p.dataUrl} alt={p.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="grid h-full w-full place-items-center bg-fuchsia-500/15"><FileText className="h-4 w-4 text-fuchsia-300" /></div>
                      )}
                    </div>
                  ))}
                  {r.proofs.length > 4 && <div className="grid h-12 w-12 place-items-center rounded-lg bg-white/10 text-[10px] font-bold text-white">+{r.proofs.length - 4}</div>}
                </div>
              )}

              <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px]">
                {r.flagged && <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/15 px-2 py-0.5 font-bold text-rose-300 ring-1 ring-rose-400/30"><Flag className="h-3 w-3" /> Auto-flagged</span>}
                {r.proofs.length > 0 && <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 font-bold text-emerald-300 ring-1 ring-emerald-400/30"><ShieldCheck className="h-3 w-3" /> {r.proofs.length} proof{r.proofs.length === 1 ? "" : "s"}</span>}
                {r.tbiDelta !== undefined && <span className="inline-flex items-center gap-1 rounded-full bg-fuchsia-500/15 px-2 py-0.5 font-bold text-fuchsia-300 ring-1 ring-fuchsia-400/30"><TrendingUp className="h-3 w-3" /> TBI {r.tbiDelta >= 0 ? "+" : ""}{r.tbiDelta}</span>}
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button onClick={() => { setReviewStatus(r.id, "approved"); toast.success("Review approved & TBI updated"); }} className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/15 px-3 py-1.5 text-xs font-bold text-emerald-300 ring-1 ring-emerald-400/30"><Check className="h-3.5 w-3.5" /> Approve</button>
                <button onClick={() => { setReviewStatus(r.id, "rejected"); toast.success("Review rejected"); }} className="inline-flex items-center gap-1 rounded-lg bg-rose-500/15 px-3 py-1.5 text-xs font-bold text-rose-300 ring-1 ring-rose-400/30"><X className="h-3.5 w-3.5" /> Reject</button>
                <button onClick={() => { toggleReviewFlag(r.id); toast.success(r.flagged ? "Flag cleared" : "Flagged"); }} className="inline-flex items-center gap-1 rounded-lg bg-amber-500/15 px-3 py-1.5 text-xs font-bold text-amber-300 ring-1 ring-amber-400/30"><Flag className="h-3.5 w-3.5" /> {r.flagged ? "Unflag" : "Flag"}</button>
                <button onClick={() => setSelected(r)} className="inline-flex items-center gap-1 rounded-lg bg-white/10 px-3 py-1.5 text-xs text-white"><Eye className="h-3.5 w-3.5" /> Details</button>
                <button onClick={() => { deleteReview(r.id); toast.success("Deleted"); }} className="ml-auto inline-flex items-center gap-1 rounded-lg bg-white/5 px-3 py-1.5 text-xs text-muted-foreground hover:text-rose-300"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && <div className="col-span-full py-10 text-center text-sm text-muted-foreground">No reviews in this view.</div>}
        </div>
      </Panel>

      {/* Drawer */}
      {selected && <ReviewDrawer review={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

function ReviewDrawer({ review, onClose }: { review: ReviewRecord; onClose: () => void }) {
  const dims: { key: keyof ReviewRecord["ratings"]; label: string }[] = [
    { key: "customerCare", label: "Customer Care" },
    { key: "tradingConditions", label: "Trading Conditions" },
    { key: "paymentSpeed", label: "Payment Speed" },
    { key: "userFriendliness", label: "User Friendliness" },
    { key: "payoutSpeed", label: "Payout Speed" },
    { key: "overall", label: "Overall" },
  ];
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <aside onClick={(e) => e.stopPropagation()} className="h-full w-full max-w-xl overflow-y-auto bg-[#1a0b2e] p-6 ring-1 ring-white/10">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-lg font-bold text-white">{review.brandName}</div>
            <div className="text-[11px] text-muted-foreground">{review.providerType} · {review.userName} · {review.userEmail}</div>
          </div>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-full bg-white/10 text-white"><X className="h-4 w-4" /></button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 text-[11px]">
          <Field label="Account size" value={review.accountSize} />
          <Field label="Experience" value={review.experience} />
          {review.evaluationSteps && <Field label="Eval steps" value={review.evaluationSteps} />}
          <Field label="Submitted" value={new Date(review.submittedAt).toLocaleString()} />
        </div>

        <div className="mt-4 rounded-xl bg-white/5 p-3 ring-1 ring-white/10">
          <div className="mb-2 text-xs font-bold text-white">Ratings breakdown</div>
          <div className="space-y-1.5">
            {dims.map(({ key, label }) => (
              <div key={key} className="flex items-center justify-between text-[11px]">
                <span className="text-muted-foreground">{label}</span>
                <span className="inline-flex">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className={`h-3 w-3 ${i < review.ratings[key] ? "fill-fuchsia-400 text-fuchsia-400" : "text-white/15"}`} />)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 rounded-xl bg-white/5 p-3 ring-1 ring-white/10">
          <div className="mb-1 text-xs font-bold text-white">Review body</div>
          <p className="text-xs leading-relaxed text-white/85">{review.body}</p>
        </div>

        {(review.likedMost || review.likedLeast) && (
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {review.likedMost && <div className="rounded-xl bg-emerald-500/5 p-3 ring-1 ring-emerald-400/20"><div className="text-[10px] font-bold uppercase text-emerald-300">Liked Most</div><p className="mt-1 text-xs text-white/85">{review.likedMost}</p></div>}
            {review.likedLeast && <div className="rounded-xl bg-rose-500/5 p-3 ring-1 ring-rose-400/20"><div className="text-[10px] font-bold uppercase text-rose-300">Liked Least</div><p className="mt-1 text-xs text-white/85">{review.likedLeast}</p></div>}
          </div>
        )}

        <div className="mt-4">
          <div className="mb-2 inline-flex items-center gap-1 text-xs font-bold text-white"><ImageIcon className="h-3.5 w-3.5" /> Proofs ({review.proofs.length})</div>
          {review.proofs.length === 0 ? (
            <div className="rounded-xl bg-white/[0.03] p-4 text-center text-[11px] text-muted-foreground ring-1 ring-white/10">No proof attached.</div>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {review.proofs.map((p) => (
                <a key={p.id} href={p.dataUrl} target="_blank" rel="noopener" className="block overflow-hidden rounded-xl ring-1 ring-white/10 hover:ring-fuchsia-300/40">
                  {p.type.startsWith("image/") ? (
                    <img src={p.dataUrl} alt={p.name} className="h-40 w-full object-cover" />
                  ) : (
                    <div className="grid h-40 place-items-center bg-fuchsia-500/10"><FileText className="h-8 w-8 text-fuchsia-300" /></div>
                  )}
                  <div className="bg-white/5 p-2 text-[11px] text-white">{p.name}</div>
                </a>
              ))}
            </div>
          )}
        </div>

        <div className="mt-5 flex gap-2">
          <button onClick={() => { setReviewStatus(review.id, "approved"); toast.success("Approved & TBI updated"); onClose(); }} className="flex-1 rounded-lg bg-emerald-500/20 py-2 text-xs font-bold text-emerald-300 ring-1 ring-emerald-400/40">Approve</button>
          <button onClick={() => { setReviewStatus(review.id, "rejected"); toast.success("Rejected"); onClose(); }} className="flex-1 rounded-lg bg-rose-500/20 py-2 text-xs font-bold text-rose-300 ring-1 ring-rose-400/40">Reject</button>
        </div>
      </aside>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-white/5 p-2 ring-1 ring-white/10">
      <div className="text-[9px] uppercase text-muted-foreground">{label}</div>
      <div className="text-xs font-semibold text-white">{value}</div>
    </div>
  );
}
