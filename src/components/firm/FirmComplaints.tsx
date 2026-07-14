import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  AlertTriangle, ArrowUp, BadgeCheck, Camera, ChevronDown, Clock, Filter,
  Flag, ImageIcon, MessageSquare, Paperclip, Plus, Search, Send, Shield,
  ShieldAlert, Trash2, TrendingUp, Upload, X, CheckCircle2, FileText,
  ExternalLink,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import {
  fetchPublicComplaints,
  submitComplaint,
  type ComplaintRecord,
  type ComplaintSeverity,
  type ComplaintStatus,
} from "@/lib/complaints-api";
import { uploadMediaFiles } from "@/lib/media-api";
import { toast } from "sonner";
import { filterFilesByUploadLimit, formatUploadLimit } from "@/lib/upload-limits";

type StatusFilter = "All" | ComplaintStatus;
type SeverityFilter = "All" | ComplaintSeverity;

const ISSUE_TYPES = [
  "Payout Issue", "Account Ban / Breach", "Slippage / Execution",
  "Spread Manipulation", "KYC / Verification Delay", "Platform Issue",
  "Unfair Rules", "Other",
];

const STATUS_STYLES: Record<ComplaintStatus, string> = {
  pending: "bg-slate-400/15 text-slate-200 ring-slate-300/30",
  posted: "bg-sky-400/15 text-sky-200 ring-sky-300/30",
  reviewing: "bg-amber-400/15 text-amber-200 ring-amber-300/30",
  responded: "bg-violet-400/15 text-violet-200 ring-violet-300/30",
  resolved: "bg-emerald-400/15 text-emerald-200 ring-emerald-300/30",
  rejected: "bg-rose-500/15 text-rose-200 ring-rose-300/30",
};

const SEVERITY_STYLES: Record<ComplaintSeverity, string> = {
  low: "bg-emerald-400/10 text-emerald-200 ring-emerald-300/30",
  medium: "bg-amber-400/10 text-amber-200 ring-amber-300/30",
  high: "bg-rose-500/15 text-rose-200 ring-rose-300/30",
};

function formatStatus(status: ComplaintStatus) {
  return status === "reviewing"
    ? "Under Review"
    : status.charAt(0).toUpperCase() + status.slice(1);
}

function formatSeverity(severity: ComplaintSeverity) {
  return severity.charAt(0).toUpperCase() + severity.slice(1);
}

export function FirmComplaints({ firmName, firmSlug }: { firmName: string; firmSlug?: string }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [items, setItems] = useState<ComplaintRecord[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [filterIssue, setFilterIssue] = useState<string>("All");
  const [filterStatus, setFilterStatus] = useState<StatusFilter>("All");
  const [filterSeverity, setFilterSeverity] = useState<SeverityFilter>("All");
  const [withEvidenceOnly, setWithEvidenceOnly] = useState(false);
  const [sortBy, setSortBy] = useState<"latest" | "upvoted" | "severe">("latest");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const next = await fetchPublicComplaints(firmSlug);
        if (!cancelled) {
          setItems(next);
        }
      } catch (error) {
        if (!cancelled) {
          toast.error(error instanceof Error ? error.message : "Unable to load complaints");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [firmSlug]);

  const stats = useMemo(() => {
    const total = items.length;
    const resolved = items.filter((i) => i.status === "resolved").length;
    const sevScore = items.reduce((a, i) => a + (i.severity === "high" ? 3 : i.severity === "medium" ? 2 : 1), 0) / Math.max(total, 1);
    const sevLabel = sevScore >= 2.4 ? "High" : sevScore >= 1.7 ? "Medium" : "Low";
    const tbiImpact = total ? "Synced in TBI" : "No active impact";
    return { total, resolvedPct: total ? Math.round((resolved / total) * 100) : 0, sevLabel, tbiImpact };
  }, [items]);

  const visible = useMemo(() => {
    let arr = items.slice();
    if (filterIssue !== "All") arr = arr.filter((i) => i.category === filterIssue);
    if (filterStatus !== "All") arr = arr.filter((i) => i.status === filterStatus);
    if (filterSeverity !== "All") arr = arr.filter((i) => i.severity === filterSeverity);
    if (withEvidenceOnly) arr = arr.filter((i) => i.evidenceFiles.length > 0);
    if (search.trim()) {
      const q = search.toLowerCase();
      arr = arr.filter((i) => i.title.toLowerCase().includes(q) || i.description.toLowerCase().includes(q));
    }
    if (sortBy === "upvoted") arr.sort((a, b) => b.upvotes - a.upvotes);
    if (sortBy === "severe") {
      const w: Record<ComplaintSeverity, number> = { high: 3, medium: 2, low: 1 };
      arr.sort((a, b) => w[b.severity] - w[a.severity]);
    }
    return arr;
  }, [items, filterIssue, filterStatus, filterSeverity, withEvidenceOnly, sortBy, search]);

  const opened = items.find((i) => i.id === openId) ?? null;

  function handleUpvote(id: string) {
    setItems((arr) => arr.map((i) => (i.id === id ? { ...i, upvotes: i.upvotes + 1 } : i)));
  }

  function handleOpenForm() {
    if (!user) {
      navigate({ to: "/login", search: { redirect: `/firm/${firmSlug ?? ""}` } as never });
      return;
    }
    setShowForm(true);
  }

  function handleAdd(c: ComplaintRecord) {
    setItems((arr) => [c, ...arr]);
    setShowForm(false);
  }

  return (
    <div className="space-y-5">
      <div className="glass rounded-2xl p-4 ring-1 ring-white/10 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-rose-300" />
              <h3 className="text-base font-semibold text-white">Complaints · {firmName}</h3>
              <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-muted-foreground ring-1 ring-white/10">
                Verified evidence-driven system
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Structured, proof-backed reports - affects this firm's TBI score.
            </p>
          </div>
          <button
            onClick={handleOpenForm}
            className="inline-flex items-center gap-2 rounded-full rb-gradient-primary px-4 py-2 text-xs font-semibold text-white shadow-[0_8px_24px_-8px_rgba(126,77,255,0.6)] transition hover:opacity-95"
          >
            <Plus className="h-3.5 w-3.5" /> Drop Complaint
          </button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Kpi icon={<Flag className="h-3.5 w-3.5" />} label="Total complaints" value={String(stats.total)} />
          <Kpi icon={<CheckCircle2 className="h-3.5 w-3.5" />} label="% Resolved" value={`${stats.resolvedPct}%`} accent="emerald" />
          <Kpi icon={<AlertTriangle className="h-3.5 w-3.5" />} label="Avg severity" value={stats.sevLabel} accent={stats.sevLabel === "High" ? "rose" : stats.sevLabel === "Medium" ? "amber" : "emerald"} />
          <Kpi icon={<TrendingUp className="h-3.5 w-3.5" />} label="TBI impact" value={stats.tbiImpact} accent={stats.total ? "amber" : "emerald"} />
        </div>
      </div>

      <div className="glass rounded-2xl p-3 ring-1 ring-white/10">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search complaints..."
              className="w-full rounded-full bg-white/5 py-2 pl-8 pr-3 text-xs text-white placeholder:text-muted-foreground ring-1 ring-white/10 focus:outline-none focus:ring-violet-300/40"
            />
          </div>
          <Select label="Issue" value={filterIssue} onChange={setFilterIssue} options={["All", ...ISSUE_TYPES]} />
          <Select label="Status" value={filterStatus} onChange={(v) => setFilterStatus(v as StatusFilter)} options={["All", "pending", "posted", "reviewing", "responded", "resolved"]} />
          <Select label="Severity" value={filterSeverity} onChange={(v) => setFilterSeverity(v as SeverityFilter)} options={["All", "low", "medium", "high"]} />
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-white/5 px-3 py-2 text-[11px] text-white ring-1 ring-white/10">
            <input type="checkbox" checked={withEvidenceOnly} onChange={(e) => setWithEvidenceOnly(e.target.checked)} className="accent-violet-400" />
            With evidence
          </label>
          <Select label="Sort" value={sortBy} onChange={(v) => setSortBy(v as "latest" | "upvoted" | "severe")} options={[
            { value: "latest", label: "Latest" }, { value: "upvoted", label: "Most upvoted" }, { value: "severe", label: "Most severe" },
          ]} />
        </div>
      </div>

      <div className="grid gap-3">
        {loading ? (
          <div className="glass rounded-2xl p-10 text-center text-sm text-muted-foreground ring-1 ring-white/10">Loading complaints...</div>
        ) : visible.map((c) => (
          <ComplaintCard key={c.id} c={c} onOpen={() => setOpenId(c.id)} onUpvote={() => handleUpvote(c.id)} />
        ))}
        {!loading && visible.length === 0 && (
          <div className="glass rounded-2xl p-10 text-center text-sm text-muted-foreground ring-1 ring-white/10">
            No complaints match your filters.
          </div>
        )}
      </div>

      {opened && (
        <ComplaintDetail
          c={opened}
          onClose={() => setOpenId(null)}
          onUpvote={() => handleUpvote(opened.id)}
          firmName={firmName}
        />
      )}

      {showForm && (
        <ComplaintForm
          firmName={firmName}
          firmSlug={firmSlug}
          onClose={() => setShowForm(false)}
          onSubmit={handleAdd}
        />
      )}
    </div>
  );
}

function Kpi({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string; accent?: "emerald" | "rose" | "amber" }) {
  const tone =
    accent === "emerald" ? "text-emerald-300" :
    accent === "rose" ? "text-rose-300" :
    accent === "amber" ? "text-amber-300" : "text-white";
  return (
    <div className="rounded-xl bg-white/[0.03] p-3 ring-1 ring-white/10">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-muted-foreground">
        {icon}{label}
      </div>
      <div className={`mt-1 text-lg font-semibold ${tone}`}>{value}</div>
    </div>
  );
}

function Select({
  label, value, onChange, options,
}: {
  label: string; value: string; onChange: (v: string) => void;
  options: (string | { value: string; label: string })[];
}) {
  return (
    <label className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1.5 text-[11px] text-white ring-1 ring-white/10">
      <Filter className="h-3 w-3 text-muted-foreground" />
      <span className="text-muted-foreground">{label}:</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-transparent pr-1 text-[11px] text-white outline-none"
      >
        {options.map((o) => {
          const v = typeof o === "string" ? o : o.value;
          const l = typeof o === "string" ? o : o.label;
          return <option key={v} value={v} className="bg-[var(--rb-bg-input)]">{typeof o === "string" && (label === "Status" || label === "Severity") ? l.charAt(0).toUpperCase() + l.slice(1) : l}</option>;
        })}
      </select>
      <ChevronDown className="h-3 w-3 text-muted-foreground" />
    </label>
  );
}

function ComplaintCard({ c, onOpen, onUpvote }: { c: ComplaintRecord; onOpen: () => void; onUpvote: () => void }) {
  return (
    <article className="group glass rounded-2xl p-4 ring-1 ring-white/10 transition hover:ring-violet-300/30">
      <div className="flex items-start gap-3">
        <button
          onClick={onUpvote}
          className="flex h-14 w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-white/[0.04] text-white ring-1 ring-white/10 transition hover:bg-violet-300/10 hover:ring-violet-300/40"
          title="Same issue"
        >
          <ArrowUp className="h-3.5 w-3.5" />
          <span className="mt-0.5 text-xs font-semibold">{c.upvotes}</span>
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="rounded-full bg-violet-300/15 px-2 py-0.5 text-[10px] font-medium text-violet-200 ring-1 ring-violet-300/30">
              {c.category}
            </span>
            <span className={`rounded-full px-2 py-0.5 text-[10px] ring-1 ${STATUS_STYLES[c.status]}`}>{formatStatus(c.status)}</span>
            <span className={`rounded-full px-2 py-0.5 text-[10px] ring-1 ${SEVERITY_STYLES[c.severity]}`}>{formatSeverity(c.severity)} severity</span>
            {c.evidenceFiles.length > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/10 px-2 py-0.5 text-[10px] text-emerald-200 ring-1 ring-emerald-300/30">
                <Paperclip className="h-3 w-3" /> {c.evidenceFiles.length} evidence
              </span>
            )}
            <span className="ml-auto inline-flex items-center gap-1 text-[10px] text-muted-foreground">
              <Clock className="h-3 w-3" /> {c.time}
            </span>
          </div>

          <h4 className="mt-2 line-clamp-1 text-sm font-semibold text-white">{c.title}</h4>
          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{c.description}</p>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground">
              <span className="inline-flex items-center gap-1 rounded-md bg-white/5 px-1.5 py-0.5 ring-1 ring-white/10">
                <Shield className="h-3 w-3" /> {c.anonymous ? "Anonymous" : c.user}
              </span>
              <span className="rounded-md bg-white/5 px-1.5 py-0.5 ring-1 ring-white/10">{c.accountType} · {c.accountSize}</span>
              <span className="rounded-md bg-white/5 px-1.5 py-0.5 ring-1 ring-white/10">{c.platform}</span>
              <span className="inline-flex items-center gap-1 rounded-md bg-white/5 px-1.5 py-0.5 ring-1 ring-white/10">
                <Shield className="h-3 w-3 text-violet-300" /> Credibility {c.credibility}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                <MessageSquare className="h-3 w-3" /> {c.comments}
              </span>
              <button
                onClick={onOpen}
                className="rounded-full bg-white/[0.06] px-3 py-1.5 text-[11px] font-semibold text-white ring-1 ring-white/10 transition hover:bg-violet-300/15 hover:ring-violet-300/40"
              >
                Read complaint →
              </button>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

function ComplaintDetail({ c, onClose, onUpvote, firmName }: { c: ComplaintRecord; onClose: () => void; onUpvote: () => void; firmName: string }) {
  const steps: ComplaintStatus[] = ["posted", "reviewing", "responded", "resolved"];
  const currentIdx = Math.max(steps.indexOf(c.status), c.status === "pending" ? 0 : -1);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center">
      <div className="relative max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-t-3xl bg-[var(--rb-bg-card)] p-5 ring-1 ring-white/10 sm:rounded-3xl sm:p-6">
        <button onClick={onClose} className="absolute right-4 top-4 rounded-full bg-white/5 p-1.5 text-white ring-1 ring-white/10 hover:bg-white/10">
          <X className="h-4 w-4" />
        </button>

        <div className="flex flex-wrap items-center gap-2 pr-10">
          <span className="rounded-full bg-violet-300/15 px-2 py-0.5 text-[10px] font-medium text-violet-200 ring-1 ring-violet-300/30">{c.category}</span>
          <span className={`rounded-full px-2 py-0.5 text-[10px] ring-1 ${STATUS_STYLES[c.status]}`}>{formatStatus(c.status)}</span>
          <span className={`rounded-full px-2 py-0.5 text-[10px] ring-1 ${SEVERITY_STYLES[c.severity]}`}>{formatSeverity(c.severity)}</span>
          <span className="ml-auto text-[10px] text-muted-foreground">{c.time} · ID {c.id}</span>
        </div>
        <h3 className="mt-2 text-lg font-semibold text-white">{c.title}</h3>
        <p className="mt-1 text-xs text-muted-foreground">{firmName} · reported by {c.anonymous ? "Anonymous trader" : c.user}</p>

        <div className="mt-4 grid grid-cols-4 gap-1">
          {steps.map((s, i) => {
            const done = i <= currentIdx;
            return (
              <div key={s} className="flex flex-col items-center gap-1">
                <div className={`h-1.5 w-full rounded-full ${done ? "bg-gradient-to-r from-violet-400 to-violet-400" : "bg-white/10"}`} />
                <span className={`text-[10px] ${done ? "text-white" : "text-muted-foreground"}`}>{formatStatus(s)}</span>
              </div>
            );
          })}
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_260px]">
          <div className="space-y-4">
            <section className="glass rounded-2xl p-4 ring-1 ring-white/10">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">The story</h4>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-white/90">{c.description}</p>
            </section>

            <section className="glass rounded-2xl p-4 ring-1 ring-white/10">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Evidence ({c.evidenceFiles.length})</h4>
                <span className="text-[10px] text-muted-foreground">Open each file directly</span>
              </div>
              {c.evidenceFiles.length ? (
                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {c.evidenceFiles.map((file) => (
                    <a key={`${file.name}-${file.url}`} href={file.url} target="_blank" rel="noreferrer" className="rounded-xl bg-white/[0.04] p-3 ring-1 ring-white/10 hover:bg-white/[0.07]">
                      <div className="flex items-center gap-2">
                        {file.type === "image" ? <ImageIcon className="h-4 w-4 text-violet-300" /> : <FileText className="h-4 w-4 text-violet-300" />}
                        <span className="truncate text-[11px] font-semibold text-white">{file.name}</span>
                      </div>
                      <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground">
                        <span>{file.type}</span>
                        <ExternalLink className="h-3 w-3" />
                      </div>
                    </a>
                  ))}
                </div>
              ) : (
                <div className="mt-3 text-xs text-muted-foreground">No evidence attached.</div>
              )}
            </section>

            {c.firmReply && (
              <section className="rounded-2xl bg-gradient-to-br from-violet-500/10 to-violet-500/10 p-4 ring-1 ring-violet-300/30">
                <div className="flex items-center gap-2">
                  <BadgeCheck className="h-4 w-4 text-violet-200" />
                  <h4 className="text-sm font-semibold text-white">Official response from {firmName}</h4>
                  <span className="ml-auto text-[10px] text-muted-foreground">{c.firmReply.date}</span>
                </div>
                <p className="mt-2 text-sm text-white/90">{c.firmReply.text}</p>
              </section>
            )}

            <section className="glass rounded-2xl p-4 ring-1 ring-white/10">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Timeline</h4>
              <div className="mt-3 space-y-3">
                {c.timeline.map((t, i) => (
                  <div key={`${t.stage}-${i}`} className="rounded-xl bg-white/[0.03] p-3 ring-1 ring-white/10">
                    <div className="flex items-center justify-between gap-2 text-[10px]">
                      <span className="font-semibold text-white">{t.stage}</span>
                      <span className="text-muted-foreground">{t.time}</span>
                    </div>
                    <p className="mt-1 text-[11px] text-muted-foreground"><span className="text-violet-300">{t.actor}</span> · {t.note}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <aside className="space-y-3">
            <div className="glass rounded-2xl p-4 ring-1 ring-white/10">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Context</h4>
              <dl className="mt-2 space-y-1.5 text-xs">
                <Row k="Account" v={`${c.accountType} · ${c.accountSize}`} />
                <Row k="Platform" v={c.platform} />
                <Row k="Style" v={c.tradingStyle} />
                <Row k="Country" v={c.country} />
                <Row k="Expectation" v={c.expectation} />
              </dl>
            </div>

            <div className="rounded-2xl bg-gradient-to-br from-violet-500/15 to-violet-500/15 p-4 ring-1 ring-violet-300/30">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-violet-200" />
                <h4 className="text-sm font-semibold text-white">Credibility score</h4>
              </div>
              <div className="mt-2 flex items-end gap-1">
                <div className="text-3xl font-bold text-white">{c.credibility}</div>
                <div className="pb-1 text-xs text-muted-foreground">/ 100</div>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                <div className="h-full bg-gradient-to-r from-violet-400 to-violet-400" style={{ width: `${c.credibility}%` }} />
              </div>
              <p className="mt-2 text-[10px] text-muted-foreground">Based on evidence, detail, and community signal.</p>
            </div>

            <button onClick={onUpvote} className="w-full rounded-full bg-white/[0.06] px-3 py-2 text-xs font-semibold text-white ring-1 ring-white/10 hover:bg-violet-300/15 hover:ring-violet-300/40">
              Same issue ({c.upvotes})
            </button>
          </aside>
        </div>
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <dt className="text-muted-foreground">{k}</dt>
      <dd className="text-right text-white">{v}</dd>
    </div>
  );
}

function ComplaintForm({
  firmName,
  firmSlug,
  onClose,
  onSubmit,
}: {
  firmName: string;
  firmSlug?: string;
  onClose: () => void;
  onSubmit: (c: ComplaintRecord) => void;
}) {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [issueType, setIssueType] = useState(ISSUE_TYPES[0]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [accountType, setAccountType] = useState("Funded");
  const [accountSize, setAccountSize] = useState("$50,000");
  const [platform, setPlatform] = useState("MT5");
  const [tradingStyle, setTradingStyle] = useState("Manual");
  const [country, setCountry] = useState(user?.country ?? "Nigeria");
  const [severity, setSeverity] = useState<ComplaintSeverity>("medium");
  const [expectation, setExpectation] = useState("Account review");
  const [files, setFiles] = useState<File[]>([]);
  const [anonymous, setAnonymous] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const credibility = Math.min(
    100,
    Math.round(
      40 +
        Math.min(description.length / 8, 25) +
        Math.min(files.length * 6, 25) +
        (severity === "high" ? 5 : severity === "medium" ? 3 : 1),
    ),
  );

  const canNext =
    (step === 1 && issueType) ||
    (step === 2 && title.trim().length > 5 && description.trim().length > 30) ||
    (step === 3 && accountType && platform) ||
    step === 4 || step === 5 || step === 6;

  function addFiles(list: FileList | null) {
    if (!list) return;
    const { accepted, rejected } = filterFilesByUploadLimit(Array.from(list));
    rejected.forEach((message) => toast.error(message));
    const arr = accepted.slice(0, 10 - files.length);
    setFiles((prev) => [...prev, ...arr].slice(0, 10));
  }

  async function submit() {
    if (!user) {
      toast.error("Please sign in before submitting a complaint");
      return;
    }

    setSaving(true);
    try {
      const uploaded = files.length
        ? await uploadMediaFiles(files, { folder: "complaints", prefix: firmSlug || firmName.toLowerCase().replace(/\s+/g, "-") })
        : [];

      const evidenceFiles = uploaded.map((file, index) => ({
        name: files[index]?.name || `Evidence ${index + 1}`,
        size: files[index]?.size || 0,
        type: files[index]?.type || "application/octet-stream",
        url: file.url,
        dataUrl: file.url,
      }));

      const complaint = await submitComplaint({
        title,
        description,
        attachments: uploaded.map((file) => file.url),
        complaintCategory: issueType,
        severity,
        anonymous,
        accountType,
        platform,
        tradingStyle,
        country,
        expectation,
        evidenceFiles,
        providerType: "Prop Firm",
        brandSlug: firmSlug,
        brandName: firmName,
        name: anonymous ? "Anonymous trader" : (user.fullName || user.name || user.email),
        emailAddress: user.email,
        accountId: accountSize,
      });

      onSubmit(complaint);
      toast.success("Complaint submitted", {
        description: "It has been sent for moderation and will show publicly once reviewed.",
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to submit complaint");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center">
      <div className="relative max-h-[94vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl bg-[var(--rb-bg-card)] p-5 ring-1 ring-white/10 sm:rounded-3xl sm:p-6">
        <button onClick={onClose} className="absolute right-4 top-4 rounded-full bg-white/5 p-1.5 text-white ring-1 ring-white/10 hover:bg-white/10">
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 text-rose-300" />
          <h3 className="text-base font-semibold text-white">Drop a complaint · {firmName}</h3>
        </div>
        <p className="mt-1 text-[11px] text-muted-foreground">Structured & evidence-driven. Step {step} of 6.</p>

        <div className="mt-3 grid grid-cols-6 gap-1">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={`h-1.5 rounded-full ${i < step ? "bg-gradient-to-r from-violet-400 to-violet-400" : "bg-white/10"}`} />
          ))}
        </div>

        <div className="mt-5 space-y-4">
          {step === 1 && (
            <Section title="What kind of issue?" hint="Pick the closest category.">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {ISSUE_TYPES.map((t) => (
                  <button
                    key={t}
                    onClick={() => setIssueType(t)}
                    className={
                      "rounded-xl px-3 py-2 text-xs ring-1 transition " +
                      (issueType === t
                        ? "bg-violet-300/20 text-white ring-violet-300/50"
                        : "bg-white/[0.03] text-white/80 ring-white/10 hover:bg-white/[0.06]")
                    }
                  >
                    {t}
                  </button>
                ))}
              </div>
            </Section>
          )}

          {step === 2 && (
            <Section title="Tell the story" hint="Be specific. Dates, actions, replies.">
              <Field label="Title">
                <input
                  value={title} onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Account banned for reverse trading without proof"
                  className="w-full rounded-lg bg-white/5 px-3 py-2 text-sm text-white ring-1 ring-white/10 outline-none focus:ring-violet-300/40"
                />
              </Field>
              <Field label="Description">
                <textarea
                  value={description} onChange={(e) => setDescription(e.target.value)}
                  rows={6}
                  placeholder={"What happened?\nWhen did it happen?\nWhat did the firm say?\nWhat evidence do you have?"}
                  className="w-full rounded-lg bg-white/5 px-3 py-2 text-sm text-white ring-1 ring-white/10 outline-none focus:ring-violet-300/40"
                />
                <p className="mt-1 text-[10px] text-muted-foreground">{description.length} chars · aim for 200+ for higher credibility.</p>
              </Field>
            </Section>
          )}

          {step === 3 && (
            <Section title="Account & trading context" hint="This makes your case verifiable.">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Account type">
                  <BasicSelect value={accountType} onChange={setAccountType} options={["Challenge", "Funded", "Live"]} />
                </Field>
                <Field label="Account size">
                  <BasicSelect value={accountSize} onChange={setAccountSize} options={["$5,000", "$10,000", "$25,000", "$50,000", "$100,000", "$200,000"]} />
                </Field>
                <Field label="Platform">
                  <BasicSelect value={platform} onChange={setPlatform} options={["MT4", "MT5", "cTrader", "DXtrade"]} />
                </Field>
                <Field label="Trading style">
                  <BasicSelect value={tradingStyle} onChange={setTradingStyle} options={["Manual", "EA", "Copy Trading", "VPS"]} />
                </Field>
                <Field label="Country">
                  <input value={country} onChange={(e) => setCountry(e.target.value)} className="w-full rounded-lg bg-white/5 px-3 py-2 text-sm text-white ring-1 ring-white/10 outline-none focus:ring-violet-300/40" />
                </Field>
              </div>
            </Section>
          )}

          {step === 4 && (
            <Section title="Evidence" hint="Trust driver. Up to 10 files.">
              <button
                onClick={() => fileRef.current?.click()}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/15 bg-white/[0.02] px-3 py-6 text-xs text-muted-foreground hover:border-violet-300/40 hover:text-white"
              >
                <Upload className="h-4 w-4" /> Drag & drop or click to upload (PNG, PDF, CSV, EML · max {formatUploadLimit()} each)
              </button>
              <input ref={fileRef} type="file" multiple hidden onChange={(e) => addFiles(e.target.files)} />
              {files.length > 0 && (
                <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {files.map((f, i) => (
                    <li key={`${f.name}-${i}`} className="flex items-center justify-between gap-2 rounded-lg bg-white/[0.04] px-2 py-1.5 ring-1 ring-white/10">
                      <span className="flex items-center gap-1.5 truncate text-[11px] text-white"><Camera className="h-3 w-3" />{f.name}</span>
                      <button onClick={() => setFiles((arr) => arr.filter((_, j) => j !== i))} className="text-muted-foreground hover:text-rose-300"><Trash2 className="h-3 w-3" /></button>
                    </li>
                  ))}
                </ul>
              )}
              <p className="text-[10px] text-muted-foreground">Evidence increases credibility and visibility of your complaint.</p>
            </Section>
          )}

          {step === 5 && (
            <Section title="Severity & expectation" hint="What outcome do you want?">
              <Field label="Severity">
                <div className="grid grid-cols-3 gap-2">
                  {(["low", "medium", "high"] as ComplaintSeverity[]).map((s) => (
                    <button
                      key={s} onClick={() => setSeverity(s)}
                      className={
                        "rounded-xl px-3 py-2 text-xs ring-1 transition " +
                        (severity === s ? `${SEVERITY_STYLES[s]}` : "bg-white/[0.03] text-white/80 ring-white/10 hover:bg-white/[0.06]")
                      }
                    >
                      {formatSeverity(s)}
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="What do you want?">
                <BasicSelect value={expectation} onChange={setExpectation} options={["Account review", "Payout", "Explanation", "Public awareness"]} />
              </Field>
            </Section>
          )}

          {step === 6 && (
            <Section title="Privacy & submit" hint="Choose how you appear publicly.">
              <label className="flex items-start gap-2 rounded-xl bg-white/[0.03] p-3 ring-1 ring-white/10">
                <input type="checkbox" checked={!anonymous} onChange={(e) => setAnonymous(!e.target.checked)} className="mt-0.5 accent-violet-400" />
                <div>
                  <div className="text-xs font-semibold text-white">Show my name publicly</div>
                  <div className="text-[10px] text-muted-foreground">Your profile name will appear on the complaint.</div>
                </div>
              </label>
              <label className="flex items-start gap-2 rounded-xl bg-white/[0.03] p-3 ring-1 ring-white/10">
                <input type="checkbox" checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)} className="mt-0.5 accent-violet-400" />
                <div>
                  <div className="text-xs font-semibold text-white">Post anonymously</div>
                  <div className="text-[10px] text-muted-foreground">Your identity stays hidden from the public.</div>
                </div>
              </label>

              <div className="rounded-2xl bg-gradient-to-br from-violet-500/15 to-violet-500/15 p-4 ring-1 ring-violet-300/30">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-violet-200" />
                  <span className="text-sm font-semibold text-white">Estimated credibility score</span>
                  <span className="ml-auto text-lg font-bold text-white">{credibility}</span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full bg-gradient-to-r from-violet-400 to-violet-400" style={{ width: `${credibility}%` }} />
                </div>
                <p className="mt-2 text-[10px] text-muted-foreground">You will earn RR points when your complaint is verified.</p>
              </div>
            </Section>
          )}
        </div>

        <div className="mt-5 flex items-center justify-between gap-2 border-t border-white/10 pt-4">
          <button
            onClick={() => setStep((s) => Math.max(1, s - 1))}
            disabled={step === 1 || saving}
            className="rounded-full bg-white/[0.05] px-4 py-2 text-xs text-white ring-1 ring-white/10 disabled:opacity-40"
          >
            Back
          </button>
          {step < 6 ? (
            <button
              onClick={() => canNext && setStep((s) => s + 1)}
              disabled={!canNext || saving}
              className="rounded-full rb-gradient-primary px-5 py-2 text-xs font-semibold text-white shadow-[0_8px_24px_-8px_rgba(126,77,255,0.6)] disabled:opacity-50"
            >
              Continue
            </button>
          ) : (
            <button
              onClick={() => void submit()}
              disabled={saving}
              className="rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-2 text-xs font-semibold text-white shadow-[0_8px_24px_-8px_rgba(16,185,129,0.6)] disabled:opacity-50"
            >
              {saving ? "Submitting..." : "Submit complaint"}
            </button>
          )}
        </div>
        <p className="mt-2 text-center text-[10px] text-muted-foreground">
          Your complaint will be reviewed and published publicly to help other traders.
        </p>
      </div>
    </div>
  );
}

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <header>
        <h4 className="text-sm font-semibold text-white">{title}</h4>
        {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
      </header>
      {children}
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function BasicSelect({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <select
      value={value} onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-lg bg-white/5 px-3 py-2 text-sm text-white ring-1 ring-white/10 outline-none focus:ring-violet-300/40"
    >
      {options.map((o) => <option key={o} value={o} className="bg-[var(--rb-bg-input)]">{o}</option>)}
    </select>
  );
}
