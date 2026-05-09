import { useMemo, useRef, useState } from "react";
import {
  AlertTriangle, ArrowUp, BadgeCheck, Camera, ChevronDown, Clock, Filter,
  Flag, ImageIcon, MessageSquare, Paperclip, Plus, Search, Send, Shield,
  ShieldAlert, Sparkles, Trash2, TrendingUp, Upload, X, CheckCircle2, FileText,
} from "lucide-react";

type Status = "Posted" | "Under Review" | "Responded" | "Resolved";
type Severity = "Low" | "Medium" | "High";

type Complaint = {
  id: string;
  user: string;
  anonymous: boolean;
  issueType: string;
  title: string;
  description: string;
  accountType: string;
  accountSize: string;
  platform: string;
  tradingStyle: string;
  country: string;
  severity: Severity;
  expectation: string;
  evidenceCount: number;
  status: Status;
  upvotes: number;
  comments: number;
  createdAt: string;
  credibility: number;
  firmReply?: { text: string; date: string };
};

const ISSUE_TYPES = [
  "Payout Issue", "Account Ban / Breach", "Slippage / Execution",
  "Spread Manipulation", "KYC / Verification Delay", "Platform Issue",
  "Unfair Rules", "Other",
];

const SEED: Complaint[] = [
  {
    id: "C-2041", user: "trader_marc", anonymous: false,
    issueType: "Account Ban / Breach",
    title: "Account banned for ‘reverse trading’ without clear proof",
    description:
      "After passing Phase 2, my funded account got banned citing reverse trading. I never used a second account. Support replied with a generic email and refused to share trade IDs.",
    accountType: "Funded", accountSize: "$100,000", platform: "MT5",
    tradingStyle: "Manual", country: "Germany",
    severity: "High", expectation: "Account review",
    evidenceCount: 4, status: "Under Review", upvotes: 184, comments: 23,
    createdAt: "2 days ago", credibility: 92,
    firmReply: { text: "We are re-investigating the case with our risk team and will update within 72h.", date: "1 day ago" },
  },
  {
    id: "C-2039", user: "anon", anonymous: true,
    issueType: "Payout Issue",
    title: "Payout delayed 18 days — KYC ‘re-verification’ loop",
    description:
      "Requested payout on the 1st. Got asked to re-verify KYC three separate times. Same documents accepted previously.",
    accountType: "Funded", accountSize: "$50,000", platform: "cTrader",
    tradingStyle: "EA", country: "UAE",
    severity: "High", expectation: "Payout",
    evidenceCount: 6, status: "Responded", upvotes: 142, comments: 31,
    createdAt: "5 days ago", credibility: 88,
  },
  {
    id: "C-2032", user: "fx_lara", anonymous: false,
    issueType: "Slippage / Execution",
    title: "Massive slippage on NFP — 18 pips on EURUSD limit",
    description:
      "Placed a sell limit pre-NFP. Got filled 18 pips worse than the trigger. Same setup on my broker account: 0.4 pip slippage.",
    accountType: "Challenge", accountSize: "$25,000", platform: "MT4",
    tradingStyle: "Manual", country: "Brazil",
    severity: "Medium", expectation: "Explanation",
    evidenceCount: 2, status: "Posted", upvotes: 71, comments: 12,
    createdAt: "1 week ago", credibility: 64,
  },
  {
    id: "C-2018", user: "ph_quant", anonymous: false,
    issueType: "Unfair Rules",
    title: "Hidden ‘consistency rule’ enforced after payout request",
    description:
      "Was told my best day exceeded 30% of total profits — rule wasn’t in the contract I signed when I bought the challenge.",
    accountType: "Funded", accountSize: "$200,000", platform: "DXtrade",
    tradingStyle: "EA", country: "Philippines",
    severity: "Medium", expectation: "Public awareness",
    evidenceCount: 3, status: "Resolved", upvotes: 220, comments: 45,
    createdAt: "3 weeks ago", credibility: 95,
    firmReply: { text: "We have updated our rules page for clarity and refunded the trader’s last payout in full.", date: "2 weeks ago" },
  },
];

const STATUS_STYLES: Record<Status, string> = {
  "Posted": "bg-sky-400/15 text-sky-200 ring-sky-300/30",
  "Under Review": "bg-amber-400/15 text-amber-200 ring-amber-300/30",
  "Responded": "bg-violet-400/15 text-violet-200 ring-violet-300/30",
  "Resolved": "bg-emerald-400/15 text-emerald-200 ring-emerald-300/30",
};

const SEVERITY_STYLES: Record<Severity, string> = {
  Low: "bg-emerald-400/10 text-emerald-200 ring-emerald-300/30",
  Medium: "bg-amber-400/10 text-amber-200 ring-amber-300/30",
  High: "bg-rose-500/15 text-rose-200 ring-rose-300/30",
};

export function FirmComplaints({ firmName }: { firmName: string }) {
  const [items, setItems] = useState<Complaint[]>(SEED);
  const [openId, setOpenId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [filterIssue, setFilterIssue] = useState<string>("All");
  const [filterStatus, setFilterStatus] = useState<string>("All");
  const [filterSeverity, setFilterSeverity] = useState<string>("All");
  const [withEvidenceOnly, setWithEvidenceOnly] = useState(false);
  const [sortBy, setSortBy] = useState<"latest" | "upvoted" | "severe">("latest");
  const [search, setSearch] = useState("");

  const stats = useMemo(() => {
    const total = items.length;
    const resolved = items.filter((i) => i.status === "Resolved").length;
    const sevScore = items.reduce((a, i) => a + (i.severity === "High" ? 3 : i.severity === "Medium" ? 2 : 1), 0) / Math.max(total, 1);
    const sevLabel = sevScore >= 2.4 ? "High" : sevScore >= 1.7 ? "Medium" : "Low";
    return { total, resolvedPct: total ? Math.round((resolved / total) * 100) : 0, sevLabel };
  }, [items]);

  const visible = useMemo(() => {
    let arr = items.slice();
    if (filterIssue !== "All") arr = arr.filter((i) => i.issueType === filterIssue);
    if (filterStatus !== "All") arr = arr.filter((i) => i.status === filterStatus);
    if (filterSeverity !== "All") arr = arr.filter((i) => i.severity === filterSeverity);
    if (withEvidenceOnly) arr = arr.filter((i) => i.evidenceCount > 0);
    if (search.trim()) {
      const q = search.toLowerCase();
      arr = arr.filter((i) => i.title.toLowerCase().includes(q) || i.description.toLowerCase().includes(q));
    }
    if (sortBy === "upvoted") arr.sort((a, b) => b.upvotes - a.upvotes);
    if (sortBy === "severe") {
      const w: Record<Severity, number> = { High: 3, Medium: 2, Low: 1 };
      arr.sort((a, b) => w[b.severity] - w[a.severity]);
    }
    return arr;
  }, [items, filterIssue, filterStatus, filterSeverity, withEvidenceOnly, sortBy, search]);

  const opened = items.find((i) => i.id === openId) ?? null;

  function handleUpvote(id: string) {
    setItems((arr) => arr.map((i) => (i.id === id ? { ...i, upvotes: i.upvotes + 1 } : i)));
  }

  function handleAdd(c: Complaint) {
    setItems((arr) => [c, ...arr]);
    setShowForm(false);
  }

  return (
    <div className="space-y-5">
      {/* Header / KPI strip */}
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
              Structured, proof-backed reports — affects this firm’s TBI score.
            </p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-500 px-4 py-2 text-xs font-semibold text-white shadow-[0_8px_24px_-8px_rgba(217,70,239,0.6)] transition hover:opacity-95"
          >
            <Plus className="h-3.5 w-3.5" /> Drop Complaint
          </button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Kpi icon={<Flag className="h-3.5 w-3.5" />} label="Total complaints" value={String(stats.total)} />
          <Kpi icon={<CheckCircle2 className="h-3.5 w-3.5" />} label="% Resolved" value={`${stats.resolvedPct}%`} accent="emerald" />
          <Kpi icon={<AlertTriangle className="h-3.5 w-3.5" />} label="Avg severity" value={stats.sevLabel} accent={stats.sevLabel === "High" ? "rose" : stats.sevLabel === "Medium" ? "amber" : "emerald"} />
          <Kpi icon={<TrendingUp className="h-3.5 w-3.5" />} label="TBI impact" value="-2.4 pts" accent="rose" />
        </div>
      </div>

      {/* Filters */}
      <div className="glass rounded-2xl p-3 ring-1 ring-white/10">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search complaints…"
              className="w-full rounded-full bg-white/5 py-2 pl-8 pr-3 text-xs text-white placeholder:text-muted-foreground ring-1 ring-white/10 focus:outline-none focus:ring-fuchsia-300/40"
            />
          </div>
          <Select label="Issue" value={filterIssue} onChange={setFilterIssue} options={["All", ...ISSUE_TYPES]} />
          <Select label="Status" value={filterStatus} onChange={setFilterStatus} options={["All", "Posted", "Under Review", "Responded", "Resolved"]} />
          <Select label="Severity" value={filterSeverity} onChange={setFilterSeverity} options={["All", "Low", "Medium", "High"]} />
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-white/5 px-3 py-2 text-[11px] text-white ring-1 ring-white/10">
            <input type="checkbox" checked={withEvidenceOnly} onChange={(e) => setWithEvidenceOnly(e.target.checked)} className="accent-fuchsia-400" />
            With evidence
          </label>
          <Select label="Sort" value={sortBy} onChange={(v) => setSortBy(v as any)} options={[
            { value: "latest", label: "Latest" }, { value: "upvoted", label: "Most upvoted" }, { value: "severe", label: "Most severe" },
          ]} />
        </div>
      </div>

      {/* Cards */}
      <div className="grid gap-3">
        {visible.map((c) => (
          <ComplaintCard key={c.id} c={c} onOpen={() => setOpenId(c.id)} onUpvote={() => handleUpvote(c.id)} />
        ))}
        {visible.length === 0 && (
          <div className="glass rounded-2xl p-10 text-center text-sm text-muted-foreground ring-1 ring-white/10">
            No complaints match your filters.
          </div>
        )}
      </div>

      {/* Detail modal */}
      {opened && (
        <ComplaintDetail
          c={opened}
          onClose={() => setOpenId(null)}
          onUpvote={() => handleUpvote(opened.id)}
          firmName={firmName}
        />
      )}

      {/* Form modal */}
      {showForm && (
        <ComplaintForm firmName={firmName} onClose={() => setShowForm(false)} onSubmit={handleAdd} />
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
          return <option key={v} value={v} className="bg-[#160a25]">{l}</option>;
        })}
      </select>
      <ChevronDown className="h-3 w-3 text-muted-foreground" />
    </label>
  );
}

function ComplaintCard({ c, onOpen, onUpvote }: { c: Complaint; onOpen: () => void; onUpvote: () => void }) {
  return (
    <article className="group glass rounded-2xl p-4 ring-1 ring-white/10 transition hover:ring-fuchsia-300/30">
      <div className="flex items-start gap-3">
        <button
          onClick={onUpvote}
          className="flex h-14 w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-white/[0.04] text-white ring-1 ring-white/10 transition hover:bg-fuchsia-300/10 hover:ring-fuchsia-300/40"
          title="Same issue"
        >
          <ArrowUp className="h-3.5 w-3.5" />
          <span className="mt-0.5 text-xs font-semibold">{c.upvotes}</span>
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="rounded-full bg-fuchsia-300/15 px-2 py-0.5 text-[10px] font-medium text-fuchsia-200 ring-1 ring-fuchsia-300/30">
              {c.issueType}
            </span>
            <span className={`rounded-full px-2 py-0.5 text-[10px] ring-1 ${STATUS_STYLES[c.status]}`}>{c.status}</span>
            <span className={`rounded-full px-2 py-0.5 text-[10px] ring-1 ${SEVERITY_STYLES[c.severity]}`}>{c.severity} severity</span>
            {c.evidenceCount > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/10 px-2 py-0.5 text-[10px] text-emerald-200 ring-1 ring-emerald-300/30">
                <Paperclip className="h-3 w-3" /> {c.evidenceCount} evidence
              </span>
            )}
            <span className="ml-auto inline-flex items-center gap-1 text-[10px] text-muted-foreground">
              <Clock className="h-3 w-3" /> {c.createdAt}
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
                <Sparkles className="h-3 w-3 text-fuchsia-300" /> Credibility {c.credibility}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                <MessageSquare className="h-3 w-3" /> {c.comments}
              </span>
              <button
                onClick={onOpen}
                className="rounded-full bg-white/[0.06] px-3 py-1.5 text-[11px] font-semibold text-white ring-1 ring-white/10 transition hover:bg-fuchsia-300/15 hover:ring-fuchsia-300/40"
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

function ComplaintDetail({ c, onClose, onUpvote, firmName }: { c: Complaint; onClose: () => void; onUpvote: () => void; firmName: string }) {
  const steps: Status[] = ["Posted", "Under Review", "Responded", "Resolved"];
  const currentIdx = steps.indexOf(c.status);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center">
      <div className="relative max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-t-3xl bg-[#10071c] p-5 ring-1 ring-white/10 sm:rounded-3xl sm:p-6">
        <button onClick={onClose} className="absolute right-4 top-4 rounded-full bg-white/5 p-1.5 text-white ring-1 ring-white/10 hover:bg-white/10">
          <X className="h-4 w-4" />
        </button>

        {/* Header */}
        <div className="flex flex-wrap items-center gap-2 pr-10">
          <span className="rounded-full bg-fuchsia-300/15 px-2 py-0.5 text-[10px] font-medium text-fuchsia-200 ring-1 ring-fuchsia-300/30">{c.issueType}</span>
          <span className={`rounded-full px-2 py-0.5 text-[10px] ring-1 ${STATUS_STYLES[c.status]}`}>{c.status}</span>
          <span className={`rounded-full px-2 py-0.5 text-[10px] ring-1 ${SEVERITY_STYLES[c.severity]}`}>{c.severity}</span>
          <span className="ml-auto text-[10px] text-muted-foreground">{c.createdAt} · ID {c.id}</span>
        </div>
        <h3 className="mt-2 text-lg font-semibold text-white">{c.title}</h3>
        <p className="mt-1 text-xs text-muted-foreground">{firmName} · reported by {c.anonymous ? "Anonymous trader" : c.user}</p>

        {/* Status tracker */}
        <div className="mt-4 grid grid-cols-4 gap-1">
          {steps.map((s, i) => {
            const done = i <= currentIdx;
            return (
              <div key={s} className="flex flex-col items-center gap-1">
                <div className={`h-1.5 w-full rounded-full ${done ? "bg-gradient-to-r from-fuchsia-400 to-violet-400" : "bg-white/10"}`} />
                <span className={`text-[10px] ${done ? "text-white" : "text-muted-foreground"}`}>{s}</span>
              </div>
            );
          })}
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_260px]">
          {/* Main */}
          <div className="space-y-4">
            <section className="glass rounded-2xl p-4 ring-1 ring-white/10">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">The story</h4>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-white/90">{c.description}</p>
            </section>

            {/* Evidence */}
            <section className="glass rounded-2xl p-4 ring-1 ring-white/10">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Evidence ({c.evidenceCount})</h4>
                <span className="text-[10px] text-muted-foreground">Click to zoom</span>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
                {Array.from({ length: c.evidenceCount }).map((_, i) => (
                  <div key={i} className="aspect-square rounded-xl bg-gradient-to-br from-fuchsia-400/15 to-violet-500/15 ring-1 ring-white/10 flex items-center justify-center">
                    {i === 0 ? <FileText className="h-5 w-5 text-white/70" /> : <ImageIcon className="h-5 w-5 text-white/70" />}
                  </div>
                ))}
              </div>
            </section>

            {/* Firm response */}
            {c.firmReply && (
              <section className="rounded-2xl bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 p-4 ring-1 ring-violet-300/30">
                <div className="flex items-center gap-2">
                  <BadgeCheck className="h-4 w-4 text-violet-200" />
                  <h4 className="text-sm font-semibold text-white">Official response from {firmName}</h4>
                  <span className="ml-auto text-[10px] text-muted-foreground">{c.firmReply.date}</span>
                </div>
                <p className="mt-2 text-sm text-white/90">{c.firmReply.text}</p>
              </section>
            )}

            {/* Comments */}
            <section className="glass rounded-2xl p-4 ring-1 ring-white/10">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Community ({c.comments})</h4>
              <div className="mt-3 space-y-3">
                {[
                  { u: "alpha_dz", t: "Same exact thing happened to me last month — kept all my screenshots." },
                  { u: "vega_nl", t: "There’s a pattern around payouts > $5k. Try escalating via Trustpilot." },
                ].map((m, i) => (
                  <div key={i} className="rounded-xl bg-white/[0.03] p-3 ring-1 ring-white/10">
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                      <span className="font-semibold text-white">@{m.u}</span> · 1d ago
                    </div>
                    <p className="mt-1 text-sm text-white/90">{m.t}</p>
                  </div>
                ))}
                <div className="flex items-center gap-2 rounded-xl bg-white/[0.03] p-2 ring-1 ring-white/10">
                  <input placeholder="Share your experience…" className="flex-1 bg-transparent px-2 py-1.5 text-sm text-white placeholder:text-muted-foreground outline-none" />
                  <button className="inline-flex items-center gap-1 rounded-full bg-fuchsia-300/20 px-3 py-1.5 text-[11px] font-semibold text-white ring-1 ring-fuchsia-300/40">
                    <Send className="h-3 w-3" /> Reply
                  </button>
                </div>
              </div>
            </section>
          </div>

          {/* Side context */}
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

            <div className="rounded-2xl bg-gradient-to-br from-fuchsia-500/15 to-violet-500/15 p-4 ring-1 ring-fuchsia-300/30">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-fuchsia-200" />
                <h4 className="text-sm font-semibold text-white">Credibility score</h4>
              </div>
              <div className="mt-2 flex items-end gap-1">
                <div className="text-3xl font-bold text-white">{c.credibility}</div>
                <div className="pb-1 text-xs text-muted-foreground">/ 100</div>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                <div className="h-full bg-gradient-to-r from-fuchsia-400 to-violet-400" style={{ width: `${c.credibility}%` }} />
              </div>
              <p className="mt-2 text-[10px] text-muted-foreground">Based on evidence, detail, and community signal.</p>
            </div>

            <div className="glass rounded-2xl p-4 ring-1 ring-white/10">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Similar pattern</h4>
              <p className="mt-2 text-sm text-white">12 traders reported similar payout issues this month.</p>
            </div>

            <button onClick={onUpvote} className="w-full rounded-full bg-white/[0.06] px-3 py-2 text-xs font-semibold text-white ring-1 ring-white/10 hover:bg-fuchsia-300/15 hover:ring-fuchsia-300/40">
              👍 Same issue ({c.upvotes})
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

/* ---------------- Form ---------------- */

function ComplaintForm({ firmName, onClose, onSubmit }: { firmName: string; onClose: () => void; onSubmit: (c: Complaint) => void }) {
  const [step, setStep] = useState(1);
  const [issueType, setIssueType] = useState(ISSUE_TYPES[0]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [accountType, setAccountType] = useState("Funded");
  const [accountSize, setAccountSize] = useState("$50,000");
  const [platform, setPlatform] = useState("MT5");
  const [tradingStyle, setTradingStyle] = useState("Manual");
  const [country, setCountry] = useState("Germany");
  const [severity, setSeverity] = useState<Severity>("Medium");
  const [expectation, setExpectation] = useState("Account review");
  const [files, setFiles] = useState<{ name: string; size: number }[]>([]);
  const [anonymous, setAnonymous] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const credibility = Math.min(
    100,
    Math.round(
      40 +
        Math.min(description.length / 8, 25) +
        Math.min(files.length * 6, 25) +
        (severity === "High" ? 5 : severity === "Medium" ? 3 : 1)
    )
  );

  const canNext =
    (step === 1 && issueType) ||
    (step === 2 && title.trim().length > 5 && description.trim().length > 30) ||
    (step === 3 && accountType && platform) ||
    step === 4 || step === 5 || step === 6;

  function addFiles(list: FileList | null) {
    if (!list) return;
    const arr = Array.from(list).slice(0, 10).map((f) => ({ name: f.name, size: f.size }));
    setFiles((prev) => [...prev, ...arr].slice(0, 10));
  }

  function submit() {
    const c: Complaint = {
      id: `C-${Math.floor(2100 + Math.random() * 900)}`,
      user: anonymous ? "anon" : "you",
      anonymous,
      issueType, title, description,
      accountType, accountSize, platform, tradingStyle, country,
      severity, expectation,
      evidenceCount: files.length,
      status: "Posted",
      upvotes: 0, comments: 0,
      createdAt: "just now",
      credibility,
    };
    onSubmit(c);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center">
      <div className="relative max-h-[94vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl bg-[#10071c] p-5 ring-1 ring-white/10 sm:rounded-3xl sm:p-6">
        <button onClick={onClose} className="absolute right-4 top-4 rounded-full bg-white/5 p-1.5 text-white ring-1 ring-white/10 hover:bg-white/10">
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 text-rose-300" />
          <h3 className="text-base font-semibold text-white">Drop a complaint · {firmName}</h3>
        </div>
        <p className="mt-1 text-[11px] text-muted-foreground">Structured & evidence-driven. Step {step} of 6.</p>

        {/* Stepper */}
        <div className="mt-3 grid grid-cols-6 gap-1">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={`h-1.5 rounded-full ${i < step ? "bg-gradient-to-r from-fuchsia-400 to-violet-400" : "bg-white/10"}`} />
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
                        ? "bg-fuchsia-300/20 text-white ring-fuchsia-300/50"
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
                  placeholder="e.g. Account banned for ‘reverse trading’ without proof"
                  className="w-full rounded-lg bg-white/5 px-3 py-2 text-sm text-white ring-1 ring-white/10 outline-none focus:ring-fuchsia-300/40"
                />
              </Field>
              <Field label="Description">
                <textarea
                  value={description} onChange={(e) => setDescription(e.target.value)}
                  rows={6}
                  placeholder={"What happened?\nWhen did it happen?\nWhat did the firm say?\nWhat evidence do you have?"}
                  className="w-full rounded-lg bg-white/5 px-3 py-2 text-sm text-white ring-1 ring-white/10 outline-none focus:ring-fuchsia-300/40"
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
                  <input value={country} onChange={(e) => setCountry(e.target.value)} className="w-full rounded-lg bg-white/5 px-3 py-2 text-sm text-white ring-1 ring-white/10 outline-none focus:ring-fuchsia-300/40" />
                </Field>
              </div>
            </Section>
          )}

          {step === 4 && (
            <Section title="Evidence" hint="Trust driver. Up to 10 files.">
              <button
                onClick={() => fileRef.current?.click()}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/15 bg-white/[0.02] px-3 py-6 text-xs text-muted-foreground hover:border-fuchsia-300/40 hover:text-white"
              >
                <Upload className="h-4 w-4" /> Drag & drop or click to upload (PNG, PDF, CSV, EML)
              </button>
              <input ref={fileRef} type="file" multiple hidden onChange={(e) => addFiles(e.target.files)} />
              {files.length > 0 && (
                <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {files.map((f, i) => (
                    <li key={i} className="flex items-center justify-between gap-2 rounded-lg bg-white/[0.04] px-2 py-1.5 ring-1 ring-white/10">
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
                  {(["Low", "Medium", "High"] as Severity[]).map((s) => (
                    <button
                      key={s} onClick={() => setSeverity(s)}
                      className={
                        "rounded-xl px-3 py-2 text-xs ring-1 transition " +
                        (severity === s ? `${SEVERITY_STYLES[s]}` : "bg-white/[0.03] text-white/80 ring-white/10 hover:bg-white/[0.06]")
                      }
                    >
                      {s === "Low" ? "😐 Low" : s === "Medium" ? "⚠️ Medium" : "🚨 High"}
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
                <input type="checkbox" checked={!anonymous} onChange={(e) => setAnonymous(!e.target.checked)} className="mt-0.5 accent-fuchsia-400" />
                <div>
                  <div className="text-xs font-semibold text-white">Show my name publicly</div>
                  <div className="text-[10px] text-muted-foreground">Your profile name will appear on the complaint.</div>
                </div>
              </label>
              <label className="flex items-start gap-2 rounded-xl bg-white/[0.03] p-3 ring-1 ring-white/10">
                <input type="checkbox" checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)} className="mt-0.5 accent-fuchsia-400" />
                <div>
                  <div className="text-xs font-semibold text-white">Post anonymously</div>
                  <div className="text-[10px] text-muted-foreground">Your identity stays hidden from the public.</div>
                </div>
              </label>

              <div className="rounded-2xl bg-gradient-to-br from-fuchsia-500/15 to-violet-500/15 p-4 ring-1 ring-fuchsia-300/30">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-fuchsia-200" />
                  <span className="text-sm font-semibold text-white">Estimated credibility score</span>
                  <span className="ml-auto text-lg font-bold text-white">{credibility}</span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full bg-gradient-to-r from-fuchsia-400 to-violet-400" style={{ width: `${credibility}%` }} />
                </div>
                <p className="mt-2 text-[10px] text-muted-foreground">You will earn RR points when your complaint is verified.</p>
              </div>
            </Section>
          )}
        </div>

        <div className="mt-5 flex items-center justify-between gap-2 border-t border-white/10 pt-4">
          <button
            onClick={() => setStep((s) => Math.max(1, s - 1))}
            disabled={step === 1}
            className="rounded-full bg-white/[0.05] px-4 py-2 text-xs text-white ring-1 ring-white/10 disabled:opacity-40"
          >
            Back
          </button>
          {step < 6 ? (
            <button
              onClick={() => canNext && setStep((s) => s + 1)}
              disabled={!canNext}
              className="rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-500 px-5 py-2 text-xs font-semibold text-white shadow-[0_8px_24px_-8px_rgba(217,70,239,0.6)] disabled:opacity-50"
            >
              Continue
            </button>
          ) : (
            <button
              onClick={submit}
              className="rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-2 text-xs font-semibold text-white shadow-[0_8px_24px_-8px_rgba(16,185,129,0.6)]"
            >
              Submit complaint
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
      className="w-full rounded-lg bg-white/5 px-3 py-2 text-sm text-white ring-1 ring-white/10 outline-none focus:ring-fuchsia-300/40"
    >
      {options.map((o) => <option key={o} value={o} className="bg-[#160a25]">{o}</option>)}
    </select>
  );
}
