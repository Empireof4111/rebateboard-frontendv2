import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageHeader, Panel } from "@/components/superadmin/AdminUI";
import { toast } from "@/components/superadmin/AdminActions";
import { type ReviewRecord } from "@/lib/reviews-store";
import { deleteAdminReview, fetchAdminReviews, moderateAdminReview, setAdminReviewFlag } from "@/lib/reviews-api";
import {
  createAdminTestimonial,
  deleteAdminTestimonial,
  fetchAdminTestimonials,
  reorderAdminTestimonials,
  updateAdminTestimonial,
  type FeaturedTestimonial,
  type TestimonialInput,
  type TestimonialSource,
} from "@/lib/testimonials-api";
import { Check, X, Flag, Trash2, Star, Eye, ShieldCheck, FileText, ImageIcon, TrendingUp, Plus, Pencil, ArrowUp, ArrowDown, ExternalLink } from "lucide-react";

export const Route = createFileRoute("/superadmin/reviews")({
  component: ReviewsPage,
});

function ReviewsPage() {
  const [items, setItems] = useState<ReviewRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected" | "flagged">("pending");
  const [selected, setSelected] = useState<ReviewRecord | null>(null);
  const [view, setView] = useState<"moderation" | "testimonials">(() => {
    if (typeof window === "undefined") return "moderation";
    return new URLSearchParams(window.location.search).get("view") === "testimonials"
      ? "testimonials"
      : "moderation";
  });
  const [testimonials, setTestimonials] = useState<FeaturedTestimonial[]>([]);
  const [testimonialsLoading, setTestimonialsLoading] = useState(true);
  const [editingTestimonial, setEditingTestimonial] = useState<FeaturedTestimonial | null>(null);
  const [testimonialFormOpen, setTestimonialFormOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const next = await fetchAdminReviews();
        if (!cancelled) setItems(next);
      } catch (error) {
        if (!cancelled) {
          toast.error(error instanceof Error ? error.message : "Unable to load reviews");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadTestimonials() {
      setTestimonialsLoading(true);
      try {
        const rows = await fetchAdminTestimonials();
        if (!cancelled) setTestimonials(rows);
      } catch (error) {
        if (!cancelled) toast.error(error instanceof Error ? error.message : "Unable to load testimonials");
      } finally {
        if (!cancelled) setTestimonialsLoading(false);
      }
    }

    void loadTestimonials();
    return () => {
      cancelled = true;
    };
  }, []);

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
        {(["moderation", "testimonials"] as const).map((item) => (
          <button
            key={item}
            onClick={() => setView(item)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize ring-1 transition ${view === item ? "rb-gradient-primary text-white ring-violet-400/40" : "bg-white/5 text-muted-foreground ring-white/10 hover:text-white"}`}
          >
            {item === "moderation" ? "Review Queue" : "Landing Testimonials"}
            {item === "testimonials" && <span className="ml-1 rounded-full bg-white/10 px-1.5 py-0.5 text-[9px]">{testimonials.length}</span>}
          </button>
        ))}
      </div>

      {view === "moderation" && <div className="mb-4 flex flex-wrap gap-2">
        {(["pending", "approved", "rejected", "flagged", "all"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize ring-1 transition ${filter === f ? "rb-gradient-primary text-white ring-violet-400/40" : "bg-white/5 text-muted-foreground ring-white/10 hover:text-white"}`}>
            {f} <span className="ml-1 rounded-full bg-white/10 px-1.5 py-0.5 text-[9px]">{counts[f]}</span>
          </button>
        ))}
      </div>}

      {view === "moderation" ? <Panel title={`Moderation queue — ${filtered.length}`}>
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
                        <div className="grid h-full w-full place-items-center bg-violet-500/15"><FileText className="h-4 w-4 text-violet-300" /></div>
                      )}
                    </div>
                  ))}
                  {r.proofs.length > 4 && <div className="grid h-12 w-12 place-items-center rounded-lg bg-white/10 text-[10px] font-bold text-white">+{r.proofs.length - 4}</div>}
                </div>
              )}

              <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px]">
                {r.flagged && <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/15 px-2 py-0.5 font-bold text-rose-300 ring-1 ring-rose-400/30"><Flag className="h-3 w-3" /> Auto-flagged</span>}
                {r.proofs.length > 0 && <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 font-bold text-emerald-300 ring-1 ring-emerald-400/30"><ShieldCheck className="h-3 w-3" /> {r.proofs.length} proof{r.proofs.length === 1 ? "" : "s"}</span>}
                {r.tbiDelta !== undefined && <span className="inline-flex items-center gap-1 rounded-full bg-violet-500/15 px-2 py-0.5 font-bold text-violet-300 ring-1 ring-violet-400/30"><TrendingUp className="h-3 w-3" /> TBI {r.tbiDelta >= 0 ? "+" : ""}{r.tbiDelta}</span>}
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button
                  onClick={async () => {
                    try {
                      const saved = await moderateAdminReview(r.id, { status: "approved" });
                      setItems((current) => current.map((item) => (item.id === saved.id ? saved : item)));
                      if (selected?.id === saved.id) setSelected(saved);
                      toast.success("Review approved & TBI updated");
                    } catch (error) {
                      toast.error(error instanceof Error ? error.message : "Unable to approve review");
                    }
                  }}
                  className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/15 px-3 py-1.5 text-xs font-bold text-emerald-300 ring-1 ring-emerald-400/30"
                ><Check className="h-3.5 w-3.5" /> Approve</button>
                <button
                  onClick={async () => {
                    try {
                      const saved = await moderateAdminReview(r.id, { status: "rejected" });
                      setItems((current) => current.map((item) => (item.id === saved.id ? saved : item)));
                      if (selected?.id === saved.id) setSelected(saved);
                      toast.success("Review rejected");
                    } catch (error) {
                      toast.error(error instanceof Error ? error.message : "Unable to reject review");
                    }
                  }}
                  className="inline-flex items-center gap-1 rounded-lg bg-rose-500/15 px-3 py-1.5 text-xs font-bold text-rose-300 ring-1 ring-rose-400/30"
                ><X className="h-3.5 w-3.5" /> Reject</button>
                <button
                  onClick={async () => {
                    try {
                      const saved = await setAdminReviewFlag(r.id, !r.flagged);
                      setItems((current) => current.map((item) => (item.id === saved.id ? saved : item)));
                      if (selected?.id === saved.id) setSelected(saved);
                      toast.success(r.flagged ? "Flag cleared" : "Flagged");
                    } catch (error) {
                      toast.error(error instanceof Error ? error.message : "Unable to update flag");
                    }
                  }}
                  className="inline-flex items-center gap-1 rounded-lg bg-amber-500/15 px-3 py-1.5 text-xs font-bold text-amber-300 ring-1 ring-amber-400/30"
                ><Flag className="h-3.5 w-3.5" /> {r.flagged ? "Unflag" : "Flag"}</button>
                <button onClick={() => setSelected(r)} className="inline-flex items-center gap-1 rounded-lg bg-white/10 px-3 py-1.5 text-xs text-white"><Eye className="h-3.5 w-3.5" /> Details</button>
                <button
                  onClick={async () => {
                    try {
                      await deleteAdminReview(r.id);
                      setItems((current) => current.filter((item) => item.id !== r.id));
                      if (selected?.id === r.id) setSelected(null);
                      toast.success("Deleted");
                    } catch (error) {
                      toast.error(error instanceof Error ? error.message : "Unable to delete review");
                    }
                  }}
                  className="ml-auto inline-flex items-center gap-1 rounded-lg bg-white/5 px-3 py-1.5 text-xs text-muted-foreground hover:text-rose-300"
                ><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            </div>
          ))}
          {loading && <div className="col-span-full py-10 text-center text-sm text-muted-foreground">Loading reviews...</div>}
          {!loading && filtered.length === 0 && <div className="col-span-full py-10 text-center text-sm text-muted-foreground">No reviews in this view.</div>}
        </div>
      </Panel> : (
        <TestimonialsPanel
          items={testimonials}
          loading={testimonialsLoading}
          approvedReviews={items.filter((item) => item.status === "approved")}
          onCreate={() => {
            setEditingTestimonial(null);
            setTestimonialFormOpen(true);
          }}
          onEdit={(item) => {
            setEditingTestimonial(item);
            setTestimonialFormOpen(true);
          }}
          onDelete={async (item) => {
            try {
              await deleteAdminTestimonial(item.id);
              setTestimonials((current) => current.filter((row) => row.id !== item.id));
              toast.success("Testimonial removed");
            } catch (error) {
              toast.error(error instanceof Error ? error.message : "Unable to delete testimonial");
            }
          }}
          onMove={async (item, direction) => {
            const index = testimonials.findIndex((row) => row.id === item.id);
            const swapIndex = direction === "up" ? index - 1 : index + 1;
            if (index < 0 || swapIndex < 0 || swapIndex >= testimonials.length) return;
            const next = [...testimonials];
            [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
            setTestimonials(next);
            try {
              const saved = await reorderAdminTestimonials(next.map((row) => row.id));
              setTestimonials(saved);
            } catch (error) {
              toast.error(error instanceof Error ? error.message : "Unable to reorder testimonials");
            }
          }}
        />
      )}

      {/* Drawer */}
      {selected && (
        <ReviewDrawer
          review={selected}
          onClose={() => setSelected(null)}
          onReviewChange={(next) => {
            setItems((current) => current.map((item) => (item.id === next.id ? next : item)));
            setSelected(next);
          }}
        />
      )}
      {testimonialFormOpen && (
        <TestimonialFormDrawer
          testimonial={editingTestimonial}
          approvedReviews={items.filter((item) => item.status === "approved")}
          onClose={() => setTestimonialFormOpen(false)}
          onSave={(saved) => {
            setTestimonials((current) => {
              const exists = current.some((item) => item.id === saved.id);
              const next = exists ? current.map((item) => item.id === saved.id ? saved : item) : [...current, saved];
              return next.sort((a, b) => Number(a.displayOrder || 0) - Number(b.displayOrder || 0));
            });
            setTestimonialFormOpen(false);
          }}
        />
      )}
    </div>
  );
}

const testimonialSources: { value: TestimonialSource; label: string }[] = [
  { value: "facebook", label: "Facebook" },
  { value: "rebateboard", label: "RebateBoard" },
  { value: "discord", label: "Discord" },
  { value: "telegram", label: "Telegram" },
  { value: "other", label: "Other" },
];

function TestimonialsPanel({
  items,
  loading,
  approvedReviews,
  onCreate,
  onEdit,
  onDelete,
  onMove,
}: {
  items: FeaturedTestimonial[];
  loading: boolean;
  approvedReviews: ReviewRecord[];
  onCreate: () => void;
  onEdit: (item: FeaturedTestimonial) => void;
  onDelete: (item: FeaturedTestimonial) => void;
  onMove: (item: FeaturedTestimonial, direction: "up" | "down") => void;
}) {
  return (
    <Panel title={`Landing testimonials — ${items.length}`}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-2xl text-xs leading-relaxed text-muted-foreground">
          Only published testimonials with confirmed consent appear on the public landing page.
          External sources require an original review URL or source profile URL.
        </p>
        <button
          onClick={onCreate}
          className="inline-flex items-center gap-2 rounded-xl rb-gradient-primary px-4 py-2 text-xs font-bold text-white"
        >
          <Plus className="h-4 w-4" /> Add Testimonial
        </button>
      </div>

      {loading ? (
        <div className="grid gap-3 md:grid-cols-2">
          {[0, 1, 2, 3].map((item) => (
            <div key={item} className="skeleton-card rounded-2xl p-4">
              <div className="skeleton h-4 w-28 rounded-full" />
              <div className="mt-3 skeleton h-3 w-full rounded-full" />
              <div className="mt-2 skeleton h-3 w-4/5 rounded-full" />
              <div className="mt-4 flex items-center gap-3">
                <div className="skeleton h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-3 w-32 rounded-full" />
                  <div className="skeleton h-3 w-44 rounded-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] p-10 text-center">
          <div className="text-sm font-bold text-white">No testimonials are currently published.</div>
          <p className="mt-2 text-xs text-muted-foreground">
            Add a Facebook, community, or approved RebateBoard review when you have consent.
          </p>
          <button
            onClick={onCreate}
            className="mt-4 inline-flex items-center gap-2 rounded-xl rb-gradient-primary px-4 py-2 text-xs font-bold text-white"
          >
            <Plus className="h-4 w-4" /> Add Testimonial
          </button>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {items.map((item, index) => (
            <div key={item.id} className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-bold text-white">{item.reviewerName}</div>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground">
                    <span>{item.sourceLabel}</span>
                    <span>·</span>
                    <span>{Number(item.rating || 0).toFixed(1)} stars</span>
                    {item.reviewId && <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-emerald-300">Linked review</span>}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => onMove(item, "up")} disabled={index === 0} className="grid h-8 w-8 place-items-center rounded-lg bg-white/5 text-white disabled:opacity-30"><ArrowUp className="h-3.5 w-3.5" /></button>
                  <button onClick={() => onMove(item, "down")} disabled={index === items.length - 1} className="grid h-8 w-8 place-items-center rounded-lg bg-white/5 text-white disabled:opacity-30"><ArrowDown className="h-3.5 w-3.5" /></button>
                </div>
              </div>
              <p className="mt-3 line-clamp-3 text-xs leading-relaxed text-white/80">{item.shortExcerpt || item.reviewText}</p>
              <div className="mt-3 flex flex-wrap gap-2 text-[10px]">
                <span className={`rounded-full px-2 py-1 font-bold ${item.isPublished ? "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/25" : "bg-white/5 text-muted-foreground ring-1 ring-white/10"}`}>
                  {item.isPublished ? "Published" : "Draft"}
                </span>
                <span className={`rounded-full px-2 py-1 font-bold ${item.consentConfirmed ? "bg-violet-500/15 text-violet-200 ring-1 ring-violet-400/25" : "bg-amber-500/15 text-amber-300 ring-1 ring-amber-400/25"}`}>
                  {item.consentConfirmed ? "Consent confirmed" : "Needs consent"}
                </span>
                {item.originalReviewUrl && (
                  <a href={item.originalReviewUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2 py-1 text-white ring-1 ring-white/10">
                    Source <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <button onClick={() => onEdit(item)} className="inline-flex items-center gap-1 rounded-lg bg-white/10 px-3 py-1.5 text-xs text-white"><Pencil className="h-3.5 w-3.5" /> Edit</button>
                <button onClick={() => onDelete(item)} className="ml-auto inline-flex items-center gap-1 rounded-lg bg-white/5 px-3 py-1.5 text-xs text-muted-foreground hover:text-rose-300"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {approvedReviews.length > 0 && (
        <div className="mt-4 rounded-2xl bg-white/[0.03] p-4 text-xs text-muted-foreground ring-1 ring-white/10">
          {approvedReviews.length} approved RebateBoard review{approvedReviews.length === 1 ? "" : "s"} can be linked from the testimonial form.
        </div>
      )}
    </Panel>
  );
}

function TestimonialFormDrawer({
  testimonial,
  approvedReviews,
  onClose,
  onSave,
}: {
  testimonial: FeaturedTestimonial | null;
  approvedReviews: ReviewRecord[];
  onClose: () => void;
  onSave: (item: FeaturedTestimonial) => void;
}) {
  const [form, setForm] = useState<TestimonialInput>(() => testimonialToForm(testimonial));
  const [saving, setSaving] = useState(false);

  const linkedReview = approvedReviews.find((review) => String(review.id) === String(form.reviewId || ""));

  function patch(patch: Partial<TestimonialInput>) {
    setForm((current) => ({ ...current, ...patch }));
  }

  function useReview(reviewId: string) {
    const review = approvedReviews.find((item) => String(item.id) === reviewId);
    if (!review) {
      patch({ reviewId: undefined });
      return;
    }
    patch({
      reviewId: String(review.id),
      source: "rebateboard",
      sourceLabel: review.verifiedTrader || review.proofs.length > 0 ? "Verified RebateBoard Review" : "RebateBoard Review",
      reviewerName: review.userName || "RebateBoard Trader",
      reviewerCountry: review.country,
      rating: Number(review.ratings?.overall || 5),
      reviewText: review.body,
      shortExcerpt: review.body,
      sourceVerified: Boolean(review.verifiedTrader || review.proofs.length > 0),
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <aside onClick={(e) => e.stopPropagation()} className="h-full w-full max-w-2xl overflow-y-auto bg-[var(--rb-bg-elevated)] p-6 ring-1 ring-white/10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-lg font-bold text-white">{testimonial ? "Edit Testimonial" : "Add Testimonial"}</div>
            <p className="mt-1 text-xs text-muted-foreground">Publishing requires consent. External testimonials also need a source URL.</p>
          </div>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-full bg-white/10 text-white"><X className="h-4 w-4" /></button>
        </div>

        <div className="mt-5 space-y-4">
          <AdminInput label="Reviewer name" value={form.reviewerName} onChange={(value) => patch({ reviewerName: value })} />
          <div className="grid gap-3 sm:grid-cols-2">
            <AdminInput label="Reviewer role" value={form.reviewerRole || ""} onChange={(value) => patch({ reviewerRole: value })} />
            <AdminInput label="Country" value={form.reviewerCountry || ""} onChange={(value) => patch({ reviewerCountry: value })} />
          </div>
          <AdminInput label="Avatar URL" value={form.reviewerAvatarUrl || ""} onChange={(value) => patch({ reviewerAvatarUrl: value })} />

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Source</span>
              <select value={form.source} onChange={(event) => patch({ source: event.target.value as TestimonialSource })} className="mt-1 w-full rounded-xl bg-white/5 px-3 py-2 text-sm text-white ring-1 ring-white/10 outline-none focus:ring-violet-400/60">
                {testimonialSources.map((source) => <option key={source.value} value={source.value}>{source.label}</option>)}
              </select>
            </label>
            <AdminInput label="Source label" value={form.sourceLabel} onChange={(value) => patch({ sourceLabel: value })} />
          </div>

          {approvedReviews.length > 0 && (
            <label className="block">
              <span className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Link approved RebateBoard review</span>
              <select value={form.reviewId || ""} onChange={(event) => useReview(event.target.value)} className="mt-1 w-full rounded-xl bg-white/5 px-3 py-2 text-sm text-white ring-1 ring-white/10 outline-none focus:ring-violet-400/60">
                <option value="">No linked review</option>
                {approvedReviews.map((review) => <option key={review.id} value={review.id}>{review.brandName} · {review.userName} · {review.ratings.overall} stars</option>)}
              </select>
              {linkedReview && <span className="mt-1 block text-[10px] text-emerald-300">This testimonial will reference an approved internal review.</span>}
            </label>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <AdminInput label="Rating" type="number" value={String(form.rating)} onChange={(value) => patch({ rating: Number(value) })} />
            <AdminInput label="Review date" type="date" value={form.reviewedAt ? String(form.reviewedAt).slice(0, 10) : ""} onChange={(value) => patch({ reviewedAt: value || undefined })} />
          </div>

          <AdminTextarea label="Review text" value={form.reviewText} onChange={(value) => patch({ reviewText: value })} />
          <AdminTextarea label="Short excerpt" value={form.shortExcerpt || ""} onChange={(value) => patch({ shortExcerpt: value })} />

          <div className="grid gap-3 sm:grid-cols-2">
            <AdminInput label="Original review URL" value={form.originalReviewUrl || ""} onChange={(value) => patch({ originalReviewUrl: value })} />
            <AdminInput label="Source profile URL" value={form.sourceProfileUrl || ""} onChange={(value) => patch({ sourceProfileUrl: value })} />
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <AdminCheckbox label="Consent confirmed" checked={Boolean(form.consentConfirmed)} onChange={(value) => patch({ consentConfirmed: value })} />
            <AdminCheckbox label="Source verified" checked={Boolean(form.sourceVerified)} onChange={(value) => patch({ sourceVerified: value })} />
            <AdminCheckbox label="Featured on landing" checked={form.isFeatured !== false} onChange={(value) => patch({ isFeatured: value })} />
            <AdminCheckbox label="Published" checked={Boolean(form.isPublished)} onChange={(value) => patch({ isPublished: value })} />
          </div>

          <AdminTextarea label="Private admin notes" value={form.internalNotes || ""} onChange={(value) => patch({ internalNotes: value })} />
        </div>

        <div className="mt-6 flex gap-2">
          <button onClick={onClose} className="flex-1 rounded-xl bg-white/5 py-2.5 text-sm font-bold text-white ring-1 ring-white/10">Cancel</button>
          <button
            disabled={saving}
            onClick={async () => {
              setSaving(true);
              try {
                const payload = { ...form, displayOrder: Number(form.displayOrder || 0) };
                const saved = testimonial
                  ? await updateAdminTestimonial(testimonial.id, payload)
                  : await createAdminTestimonial(payload);
                toast.success(testimonial ? "Testimonial updated" : "Testimonial created");
                onSave(saved);
              } catch (error) {
                toast.error(error instanceof Error ? error.message : "Unable to save testimonial");
              } finally {
                setSaving(false);
              }
            }}
            className="flex-1 rounded-xl rb-gradient-primary py-2.5 text-sm font-bold text-white disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </aside>
    </div>
  );
}

function testimonialToForm(testimonial: FeaturedTestimonial | null): TestimonialInput {
  return {
    reviewId: testimonial?.reviewId,
    reviewerName: testimonial?.reviewerName || "",
    reviewerAvatarUrl: testimonial?.reviewerAvatarUrl || "",
    reviewerRole: testimonial?.reviewerRole || "",
    reviewerCountry: testimonial?.reviewerCountry || "",
    rating: testimonial?.rating || 5,
    reviewText: testimonial?.reviewText || "",
    shortExcerpt: testimonial?.shortExcerpt || "",
    source: testimonial?.source || "facebook",
    sourceLabel: testimonial?.sourceLabel || "Facebook Review",
    originalReviewUrl: testimonial?.originalReviewUrl || "",
    sourceProfileUrl: testimonial?.sourceProfileUrl || "",
    reviewedAt: testimonial?.reviewedAt ? String(testimonial.reviewedAt).slice(0, 10) : "",
    consentConfirmed: Boolean(testimonial?.consentConfirmed),
    sourceVerified: Boolean(testimonial?.sourceVerified),
    isFeatured: testimonial?.isFeatured !== false,
    isPublished: Boolean(testimonial?.isPublished),
    displayOrder: testimonial?.displayOrder || 0,
    internalNotes: testimonial?.internalNotes || "",
  };
}

function AdminInput({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return (
    <label className="block">
      <span className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">{label}</span>
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 w-full rounded-xl bg-white/5 px-3 py-2 text-sm text-white ring-1 ring-white/10 outline-none focus:ring-violet-400/60" />
    </label>
  );
}

function AdminTextarea({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">{label}</span>
      <textarea value={value} onChange={(event) => onChange(event.target.value)} rows={4} className="mt-1 w-full rounded-xl bg-white/5 px-3 py-2 text-sm text-white ring-1 ring-white/10 outline-none focus:ring-violet-400/60" />
    </label>
  );
}

function AdminCheckbox({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 rounded-xl bg-white/5 p-3 text-xs font-semibold text-white ring-1 ring-white/10">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="h-4 w-4 accent-violet-500" />
      {label}
    </label>
  );
}

function ReviewDrawer({
  review,
  onClose,
  onReviewChange,
}: {
  review: ReviewRecord;
  onClose: () => void;
  onReviewChange: (next: ReviewRecord) => void;
}) {
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
      <aside onClick={(e) => e.stopPropagation()} className="h-full w-full max-w-xl overflow-y-auto bg-[var(--rb-bg-elevated)] p-6 ring-1 ring-white/10">
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
                <span className="inline-flex">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className={`h-3 w-3 ${i < review.ratings[key] ? "fill-violet-400 text-violet-400" : "text-white/15"}`} />)}</span>
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
                <a key={p.id} href={p.dataUrl} target="_blank" rel="noopener" className="block overflow-hidden rounded-xl ring-1 ring-white/10 hover:ring-violet-300/40">
                  {p.type.startsWith("image/") ? (
                    <img src={p.dataUrl} alt={p.name} className="h-40 w-full object-cover" />
                  ) : (
                    <div className="grid h-40 place-items-center bg-violet-500/10"><FileText className="h-8 w-8 text-violet-300" /></div>
                  )}
                  <div className="bg-white/5 p-2 text-[11px] text-white">{p.name}</div>
                </a>
              ))}
            </div>
          )}
        </div>

        <div className="mt-5 flex gap-2">
          <button
            onClick={async () => {
              try {
                const saved = await moderateAdminReview(review.id, { status: "approved" });
                onReviewChange(saved);
                toast.success("Approved & TBI updated");
                onClose();
              } catch (error) {
                toast.error(error instanceof Error ? error.message : "Unable to approve review");
              }
            }}
            className="flex-1 rounded-lg bg-emerald-500/20 py-2 text-xs font-bold text-emerald-300 ring-1 ring-emerald-400/40"
          >Approve</button>
          <button
            onClick={async () => {
              try {
                const saved = await moderateAdminReview(review.id, { status: "rejected" });
                onReviewChange(saved);
                toast.success("Rejected");
                onClose();
              } catch (error) {
                toast.error(error instanceof Error ? error.message : "Unable to reject review");
              }
            }}
            className="flex-1 rounded-lg bg-rose-500/20 py-2 text-xs font-bold text-rose-300 ring-1 ring-rose-400/40"
          >Reject</button>
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
