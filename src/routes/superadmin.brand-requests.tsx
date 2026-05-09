import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader, Panel, DataTable, Toolbar } from "@/components/superadmin/AdminUI";
import {
  useBrandSubmissions, approveSubmission, rejectSubmission, requestChanges,
  CATEGORY_META, bumpReviewCount, type BrandSubmission, type ReviewStatus, buildMagicLink,
} from "@/lib/tbi-onboarding";
import { Modal, toast } from "@/components/superadmin/AdminActions";
import { Search, Check, X, MessageSquareWarning, Eye, ExternalLink, Filter } from "lucide-react";

export const Route = createFileRoute("/superadmin/brand-requests")({
  component: BrandRequestsPage,
});

const STATUS_TABS: { id: "all" | ReviewStatus; label: string }[] = [
  { id: "all", label: "All" },
  { id: "pending", label: "Pending" },
  { id: "changes_requested", label: "Changes Requested" },
  { id: "approved", label: "Approved" },
  { id: "rejected", label: "Rejected" },
];

function BrandRequestsPage() {
  const submissions = useBrandSubmissions();
  const [tab, setTab] = useState<"all" | ReviewStatus>("pending");
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("all");
  const [viewing, setViewing] = useState<BrandSubmission | null>(null);
  const [reviewAction, setReviewAction] = useState<{ submission: BrandSubmission; type: "approve" | "reject" | "changes" } | null>(null);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: submissions.length };
    submissions.forEach((s) => { c[s.status] = (c[s.status] ?? 0) + 1; });
    return c;
  }, [submissions]);

  const filtered = useMemo(() => {
    return submissions
      .filter((s) => tab === "all" || s.status === tab)
      .filter((s) => cat === "all" || s.category === cat)
      .filter((s) => !q.trim() || s.brandName.toLowerCase().includes(q.toLowerCase()) || s.contactEmail.toLowerCase().includes(q.toLowerCase()));
  }, [submissions, tab, cat, q]);

  return (
    <div>
      <PageHeader
        title="Brand Requests"
        subtitle={`${counts.pending ?? 0} pending · ${submissions.length} total submissions across all categories`}
      />

      {/* Status tabs */}
      <div className="mb-4 flex flex-wrap gap-2">
        {STATUS_TABS.map((t) => {
          const active = tab === t.id;
          const count = counts[t.id] ?? 0;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ring-1 transition ${
                active ? "bg-gradient-to-r from-fuchsia-500 to-violet-600 text-white ring-transparent" : "bg-white/5 text-muted-foreground ring-white/10 hover:text-white"
              }`}
            >
              {t.label}
              <span className={`rounded-full px-1.5 py-0.5 text-[9px] ${active ? "bg-white/20" : "bg-white/10"}`}>{count}</span>
            </button>
          );
        })}
      </div>

      <Panel title={`${filtered.length} request${filtered.length === 1 ? "" : "s"}`}>
        <Toolbar>
          <div className="glass flex flex-1 items-center gap-2 rounded-full px-3 py-1.5 text-xs">
            <Search className="h-3.5 w-3.5 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search brand or email…"
              className="w-full bg-transparent text-white outline-none placeholder:text-muted-foreground"
            />
          </div>
          <div className="flex items-center gap-1">
            <Filter className="h-3.5 w-3.5 text-muted-foreground" />
            <select value={cat} onChange={(e) => setCat(e.target.value)} className="rounded-full bg-white/5 px-3 py-1.5 text-xs text-white ring-1 ring-white/10">
              <option value="all">All categories</option>
              {Object.entries(CATEGORY_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
        </Toolbar>

        <DataTable head={<><th>Brand</th><th>Category</th><th>Score</th><th>Reviews</th><th>Submitted</th><th>Status</th><th></th></>}>
          {filtered.map((s) => {
            const meta = CATEGORY_META[s.category];
            return (
              <tr key={s.id}>
                <td>
                  <div className="flex items-center gap-2">
                    <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-fuchsia-500/30 to-violet-600/30 text-base">{meta.emoji}</div>
                    <div>
                      <div className="font-semibold">{s.brandName}</div>
                      <div className="text-[10px] text-muted-foreground">{s.contactEmail}</div>
                    </div>
                  </div>
                </td>
                <td className="text-muted-foreground">{meta.label}</td>
                <td>
                  <span className={`font-mono font-bold ${
                    s.trustScoreMode === "full" ? "text-emerald-300" :
                    s.trustScoreMode === "partial" ? "text-amber-300" :
                    s.trustScoreMode === "preliminary" ? "text-fuchsia-300" : "text-muted-foreground"
                  }`}>
                    {s.trustScore == null ? "—" : s.trustScore.toFixed(1)}
                  </span>
                  <span className="ml-1 text-[10px] text-muted-foreground uppercase">{s.trustScoreMode}</span>
                </td>
                <td className="font-mono">{s.reviewCount}</td>
                <td className="text-[11px] text-muted-foreground">{new Date(s.submittedAt).toLocaleDateString()}</td>
                <td>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ring-1 ${
                    s.status === "approved" ? "bg-emerald-500/15 text-emerald-300 ring-emerald-400/30" :
                    s.status === "rejected" ? "bg-rose-500/15 text-rose-300 ring-rose-400/30" :
                    s.status === "changes_requested" ? "bg-amber-500/15 text-amber-300 ring-amber-400/30" :
                    "bg-violet-500/15 text-violet-300 ring-violet-400/30"
                  }`}>{s.status.replace("_", " ")}</span>
                </td>
                <td className="text-right">
                  <div className="flex justify-end gap-1">
                    <button onClick={() => setViewing(s)} className="grid h-7 w-7 place-items-center rounded-md bg-white/10 hover:bg-white/15" title="Review"><Eye className="h-3 w-3" /></button>
                    {s.status === "pending" && (
                      <>
                        <button onClick={() => setReviewAction({ submission: s, type: "approve" })} className="grid h-7 w-7 place-items-center rounded-md bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/30" title="Approve"><Check className="h-3 w-3" /></button>
                        <button onClick={() => setReviewAction({ submission: s, type: "changes" })} className="grid h-7 w-7 place-items-center rounded-md bg-amber-500/15 text-amber-300 ring-1 ring-amber-400/30" title="Request changes"><MessageSquareWarning className="h-3 w-3" /></button>
                        <button onClick={() => setReviewAction({ submission: s, type: "reject" })} className="grid h-7 w-7 place-items-center rounded-md bg-rose-500/15 text-rose-300 ring-1 ring-rose-400/30" title="Reject"><X className="h-3 w-3" /></button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
          {filtered.length === 0 && (
            <tr><td colSpan={7} className="py-10 text-center text-sm text-muted-foreground">No requests in this view.</td></tr>
          )}
        </DataTable>
      </Panel>

      {/* DETAIL MODAL */}
      {viewing && <SubmissionDetailModal submission={viewing} onClose={() => setViewing(null)} onAction={(type) => { setReviewAction({ submission: viewing, type }); setViewing(null); }} />}

      {/* REVIEW ACTION MODAL */}
      {reviewAction && (
        <ReviewActionModal
          submission={reviewAction.submission}
          type={reviewAction.type}
          onClose={() => setReviewAction(null)}
          onConfirm={(note) => {
            const { submission, type } = reviewAction;
            if (type === "approve") { approveSubmission(submission.id, note); toast.success(`${submission.brandName} approved & published`); }
            if (type === "reject") { rejectSubmission(submission.id, note); toast.success(`${submission.brandName} rejected`); }
            if (type === "changes") { requestChanges(submission.id, note); toast.success(`Changes requested from ${submission.brandName}`); }
            setReviewAction(null);
          }}
        />
      )}
    </div>
  );
}

function SubmissionDetailModal({ submission, onClose, onAction }: { submission: BrandSubmission; onClose: () => void; onAction: (type: "approve" | "reject" | "changes") => void }) {
  const meta = CATEGORY_META[submission.category];
  const sections: { title: string; key: string }[] = [
    { title: "Identity", key: "identity" },
    { title: "Business Model", key: "model" },
    { title: "Proof", key: "proof" },
    { title: "Infrastructure", key: "infra" },
    { title: "Community", key: "community" },
    { title: "Economics", key: "economics" },
    { title: "RebateBoard", key: "rebateboard" },
  ];

  return (
    <Modal
      open
      onClose={onClose}
      title={`${meta.emoji} ${submission.brandName}`}
      subtitle={`${meta.label} · submitted ${new Date(submission.submittedAt).toLocaleString()}`}
      size="lg"
      footer={
        submission.status === "pending" ? (
          <>
            <button onClick={() => onAction("reject")} className="rounded-xl bg-rose-500/15 px-4 py-2 text-xs font-bold text-rose-300 ring-1 ring-rose-400/30">Reject</button>
            <button onClick={() => onAction("changes")} className="rounded-xl bg-amber-500/15 px-4 py-2 text-xs font-bold text-amber-300 ring-1 ring-amber-400/30">Request changes</button>
            <button onClick={() => onAction("approve")} className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2 text-xs font-bold text-white">Approve & publish</button>
          </>
        ) : (
          <button onClick={onClose} className="rounded-xl bg-white/10 px-4 py-2 text-xs font-bold">Close</button>
        )
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Trust Score</div>
            <div className="mt-1 text-2xl font-bold">{submission.trustScore?.toFixed(1) ?? "—"}<span className="text-xs text-muted-foreground"> / {submission.trustScoreMode === "preliminary" ? 6.5 : 10}</span></div>
            <div className="text-[10px] uppercase text-fuchsia-300">{submission.trustScoreMode}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Reviews</div>
            <div className="mt-1 text-2xl font-bold">{submission.reviewCount}</div>
            <div className="flex gap-1 pt-1">
              <button onClick={() => bumpReviewCount(submission.id, 1)} className="rounded bg-white/10 px-2 py-0.5 text-[10px] hover:bg-white/15">+1</button>
              <button onClick={() => bumpReviewCount(submission.id, 5)} className="rounded bg-white/10 px-2 py-0.5 text-[10px] hover:bg-white/15">+5</button>
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Completion</div>
            <div className="mt-1 text-2xl font-bold">{submission.completionPercent}%</div>
            <a href={buildMagicLink(submission)} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-[10px] text-fuchsia-300 hover:text-fuchsia-200">Magic link <ExternalLink className="h-2.5 w-2.5" /></a>
          </div>
        </div>

        {sections.map((sec) => {
          const d = submission.data[sec.key];
          if (!d || Object.keys(d).length === 0) return null;
          return (
            <div key={sec.key} className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
              <div className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-fuchsia-300/80">{sec.title}</div>
              <dl className="grid gap-2 text-xs sm:grid-cols-2">
                {Object.entries(d).map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-3 border-b border-white/5 pb-1 last:border-0">
                    <dt className="capitalize text-muted-foreground">{k.replace(/([A-Z])/g, " $1").trim()}</dt>
                    <dd className="text-right text-white/90">{Array.isArray(v) ? (v.length ? v.map((x: any) => typeof x === "object" ? x.name : x).join(", ") : "—") : (v?.toString() || "—")}</dd>
                  </div>
                ))}
              </dl>
            </div>
          );
        })}
      </div>
    </Modal>
  );
}

function ReviewActionModal({ submission, type, onClose, onConfirm }: { submission: BrandSubmission; type: "approve" | "reject" | "changes"; onClose: () => void; onConfirm: (note: string) => void }) {
  const [note, setNote] = useState("");
  const meta = type === "approve"
    ? { title: `Approve ${submission.brandName}?`, body: "This publishes the brand's profile with a Preliminary Score visible on /tbi.", cta: "Approve & publish", color: "from-emerald-500 to-teal-500" }
    : type === "reject"
    ? { title: `Reject ${submission.brandName}?`, body: "The brand will see your reason on their dashboard. They can resubmit later.", cta: "Reject submission", color: "from-rose-500 to-rose-600" }
    : { title: `Request changes from ${submission.brandName}?`, body: "Tell them exactly what to fix. They can update and resubmit.", cta: "Send change request", color: "from-amber-500 to-amber-600" };

  return (
    <Modal open onClose={onClose} title={meta.title} subtitle={meta.body} size="md"
      footer={
        <>
          <button onClick={onClose} className="rounded-xl bg-white/10 px-4 py-2 text-xs font-bold">Cancel</button>
          <button onClick={() => onConfirm(note)} className={`rounded-xl bg-gradient-to-r ${meta.color} px-4 py-2 text-xs font-bold text-white`}>{meta.cta}</button>
        </>
      }
    >
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={4}
        placeholder={type === "approve" ? "Optional welcome note…" : "Reason / required changes…"}
        className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm outline-none focus:border-fuchsia-400/40"
      />
    </Modal>
  );
}
