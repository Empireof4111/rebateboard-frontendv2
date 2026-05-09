import { createFileRoute } from "@tanstack/react-router";
import { useBrandAuth } from "@/lib/brand-auth";
import { useReviews, replyToReview, type ReviewStatus } from "@/lib/reviews-store";
import { useState } from "react";
import { Star, Send, Flag, Filter } from "lucide-react";

export const Route = createFileRoute("/brand/reviews")({
  component: BrandReviewsInbox,
});

function StarRow({ value }: { value: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={`h-3 w-3 ${i < value ? "fill-fuchsia-400 text-fuchsia-400" : "text-white/15"}`} />
      ))}
    </div>
  );
}

function BrandReviewsInbox() {
  const { brand } = useBrandAuth();
  const [statusFilter, setStatusFilter] = useState<ReviewStatus | "all">("all");
  const reviews = useReviews(brand ? { brandSlug: brand.slug } : undefined);
  const filtered = statusFilter === "all" ? reviews : reviews.filter((r) => r.status === statusFilter);
  const [replies, setReplies] = useState<Record<string, string>>({});

  if (!brand) return null;

  const pending = reviews.filter((r) => r.status === "pending").length;
  const replied = reviews.filter((r) => r.brandReply).length;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white">Reviews inbox</h1>
        <p className="mt-1 text-sm text-muted-foreground">Reply to verified traders and flag abusive content.</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="glass rounded-2xl p-4 ring-1 ring-white/10"><div className="text-[10px] uppercase text-muted-foreground">Total</div><div className="mt-1 text-2xl font-bold text-white">{reviews.length}</div></div>
        <div className="glass rounded-2xl p-4 ring-1 ring-white/10"><div className="text-[10px] uppercase text-muted-foreground">Pending</div><div className="mt-1 text-2xl font-bold text-amber-300">{pending}</div></div>
        <div className="glass rounded-2xl p-4 ring-1 ring-white/10"><div className="text-[10px] uppercase text-muted-foreground">Replied</div><div className="mt-1 text-2xl font-bold text-emerald-300">{replied}</div></div>
      </div>

      <div className="glass flex flex-wrap items-center gap-2 rounded-2xl p-3 ring-1 ring-white/10">
        <Filter className="h-3.5 w-3.5 text-muted-foreground" />
        {(["all", "pending", "approved", "rejected"] as const).map((s) => (
          <button key={s} onClick={() => setStatusFilter(s as any)} className={`rounded-full px-3 py-1 text-[11px] capitalize transition ${statusFilter === s ? "bg-fuchsia-500/30 text-white ring-1 ring-fuchsia-300/40" : "bg-white/5 text-muted-foreground hover:text-white"}`}>{s}</button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map((r) => (
          <article key={r.id} className="glass rounded-2xl p-4 ring-1 ring-white/10">
            <div className="flex items-start gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-fuchsia-400 to-violet-600 text-xs font-bold text-white">{r.userName.slice(0, 2).toUpperCase()}</div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-white">{r.userName}</span>
                  <span className="text-[10px] text-muted-foreground">{r.country} · {r.accountSize} · {r.experience}</span>
                  <StarRow value={r.ratings.overall} />
                  <span className={`ml-auto rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${r.status === "approved" ? "bg-emerald-500/15 text-emerald-300" : r.status === "pending" ? "bg-amber-500/15 text-amber-300" : "bg-rose-500/15 text-rose-300"}`}>{r.status}</span>
                </div>
                <p className="mt-2 text-sm text-white/90">{r.body}</p>
                {r.proofs.length > 0 && <div className="mt-2 text-[10px] text-emerald-300">📎 {r.proofs.length} proof attached</div>}

                {r.brandReply ? (
                  <div className="mt-3 rounded-xl bg-fuchsia-500/10 p-3 ring-1 ring-fuchsia-300/20">
                    <div className="text-[10px] font-bold uppercase text-fuchsia-200">Your reply · {new Date(r.brandReply.repliedAt).toLocaleString()}</div>
                    <p className="mt-1 text-xs text-white/90">{r.brandReply.body}</p>
                  </div>
                ) : (
                  <div className="mt-3 flex items-center gap-2">
                    <input
                      value={replies[r.id] ?? ""}
                      onChange={(e) => setReplies((p) => ({ ...p, [r.id]: e.target.value }))}
                      placeholder="Write a public reply…"
                      className="flex-1 rounded-full bg-white/[0.06] px-4 py-2 text-xs text-white outline-none ring-1 ring-white/10 focus:ring-fuchsia-300/40 placeholder:text-muted-foreground"
                    />
                    <button
                      onClick={() => { if ((replies[r.id] ?? "").trim()) { replyToReview(r.id, replies[r.id], brand.name); setReplies((p) => ({ ...p, [r.id]: "" })); } }}
                      className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-600 px-3 py-2 text-[11px] font-bold text-white"
                    >
                      <Send className="h-3 w-3" /> Reply
                    </button>
                    <button title="Flag" className="grid h-9 w-9 place-items-center rounded-full bg-white/5 text-rose-300 ring-1 ring-white/10 hover:bg-rose-500/15">
                      <Flag className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </article>
        ))}
        {filtered.length === 0 && <div className="glass rounded-2xl p-10 text-center text-sm text-muted-foreground ring-1 ring-white/10">No reviews match this filter.</div>}
      </div>
    </div>
  );
}
