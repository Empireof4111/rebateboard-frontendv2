import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import { AlertTriangle, Bug, Coins, ExternalLink, FileText, ImagePlus, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { uploadMediaFiles } from "@/lib/media-api";
import { fetchMyBugBountyReports, submitBugBountyReport, type BugBountyReportRecord, type BugBountySeverity } from "@/lib/bug-bounty-api";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { filterFilesByUploadLimit, formatUploadLimit } from "@/lib/upload-limits";

export const Route = createFileRoute("/bug-bounty")({
  component: BugBountyPage,
});

const initialForm = {
  title: "",
  description: "",
  stepsToReproduce: "",
  expectedBehavior: "",
  actualBehavior: "",
  severity: "medium" as BugBountySeverity,
  bugType: "",
  affectedArea: "",
  url: "",
  environment: "",
};

function BugBountyPage() {
  const { user, token, loading } = useAuth();
  const [form, setForm] = useState(initialForm);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [myReports, setMyReports] = useState<BugBountyReportRecord[]>([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);

  const loginHref = useMemo(() => `/login?redirect=${encodeURIComponent("/bug-bounty")}`, []);

  async function loadHistory() {
    if (!token || historyLoaded) return;
    try {
      const next = await fetchMyBugBountyReports();
      setMyReports(next);
      setHistoryLoaded(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to load your bug reports");
    }
  }

  function onAttachmentChange(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    const { accepted, rejected } = filterFilesByUploadLimit(files);
    rejected.forEach((message) => toast.error(message));
    setAttachments(accepted);
    event.target.value = "";
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!token || !user) {
      toast.error("Please log in first to report a bug and receive RR.");
      return;
    }
    if (!form.title.trim() || !form.description.trim()) {
      toast.error("Title and description are required.");
      return;
    }

    setSubmitting(true);
    try {
      const uploaded = attachments.length
        ? await uploadMediaFiles(attachments, {
            folder: "bug-bounty",
            prefix: user.username || user.name || "researcher",
          })
        : [];
      const created = await submitBugBountyReport({
        ...form,
        attachments: uploaded.map((item) => item.url),
        reporterName: user.fullName || user.name,
        reporterEmail: user.email,
      });
      setMyReports((current) => [created, ...current]);
      setHistoryLoaded(true);
      setForm(initialForm);
      setAttachments([]);
      toast.success(`Bug reported successfully. Suggested reward: ${created.rrReward} RR`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to submit bug report");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen">
        <SiteHeader />
        <main className="container-app py-10 text-sm text-muted-foreground">Loading bug bounty page...</main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      <SiteHeader />
      <div className="glow-orb left-[-8%] top-[6%] h-[420px] w-[420px]" />
      <div className="glow-orb right-[-12%] bottom-[0%] h-[460px] w-[460px]" />

      <main className="container-app relative z-10 space-y-6 py-8 sm:py-10">
        <div className="glass-strong rounded-3xl p-6 md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="max-w-3xl">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-white ring-1 ring-white/10">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-300" /> RebateBoard Bug Bounty
              </div>
              <h1 className="text-3xl font-bold text-white md:text-4xl">Report real bugs. Help secure the platform. Earn RR.</h1>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                Submit product bugs, broken flows, security issues, payout anomalies, or trust-impacting problems with clear proof.
                Accepted reports can earn RR directly into your account.
              </p>
            </div>

            <div className="grid gap-2 sm:grid-cols-3">
              <MiniBadge icon={Bug} label="Live intake" value="Open" />
              <MiniBadge icon={Coins} label="Reward model" value="RR payout" />
              <MiniBadge icon={FileText} label="Best reports" value="Clear repro steps" />
            </div>
          </div>
        </div>

        {!token || !user ? (
          <div className="glass rounded-3xl p-6 ring-1 ring-white/10">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="max-w-2xl">
                <h2 className="text-xl font-semibold text-white">Sign in to submit and receive RR rewards</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  We need your account so we can track your report, communicate with you, and credit your RR if the issue is accepted.
                </p>
              </div>
              <Link
                to={loginHref}
                className="inline-flex items-center justify-center rounded-xl rb-gradient-primary px-4 py-2.5 text-sm font-semibold text-white shadow-[0_0_20px_rgba(192,132,252,0.35)]"
              >
                Log in to report
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
            <form onSubmit={onSubmit} className="glass rounded-3xl p-6 ring-1 ring-white/10">
              <div className="mb-5 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold text-white">Submit a bug report</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    The more reproducible the report, the faster we can validate and reward it.
                  </p>
                </div>
                <div className="rounded-2xl bg-emerald-500/10 px-3 py-2 text-right ring-1 ring-emerald-400/20">
                  <div className="text-[10px] uppercase tracking-[0.14em] text-emerald-200">Signed in as</div>
                  <div className="text-sm font-semibold text-white">{user.fullName || user.name}</div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Title" required>
                  <input
                    value={form.title}
                    onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                    className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white outline-none focus:border-primary/60"
                    placeholder="Short summary of the issue"
                  />
                </Field>
                <Field label="Severity">
                  <select
                    value={form.severity}
                    onChange={(event) => setForm((current) => ({ ...current, severity: event.target.value as BugBountySeverity }))}
                    className="w-full rounded-xl border border-white/10 bg-[var(--rb-bg-input)] px-3 py-2.5 text-sm text-white outline-none focus:border-primary/60"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </Field>
                <Field label="Bug type">
                  <input
                    value={form.bugType}
                    onChange={(event) => setForm((current) => ({ ...current, bugType: event.target.value }))}
                    className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white outline-none focus:border-primary/60"
                    placeholder="Security, onboarding, wallet, TBI..."
                  />
                </Field>
                <Field label="Affected area">
                  <input
                    value={form.affectedArea}
                    onChange={(event) => setForm((current) => ({ ...current, affectedArea: event.target.value }))}
                    className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white outline-none focus:border-primary/60"
                    placeholder="Page, module, route, feature..."
                  />
                </Field>
                <Field label="Source URL">
                  <input
                    value={form.url}
                    onChange={(event) => setForm((current) => ({ ...current, url: event.target.value }))}
                    className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white outline-none focus:border-primary/60"
                    placeholder="https://..."
                  />
                </Field>
                <Field label="Environment">
                  <input
                    value={form.environment}
                    onChange={(event) => setForm((current) => ({ ...current, environment: event.target.value }))}
                    className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white outline-none focus:border-primary/60"
                    placeholder="Browser, OS, device, account state..."
                  />
                </Field>
              </div>

              <div className="mt-4 space-y-4">
                <Field label="Description" required>
                  <textarea
                    rows={5}
                    value={form.description}
                    onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                    className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white outline-none focus:border-primary/60"
                    placeholder="What is broken, why it matters, and what impact you observed."
                  />
                </Field>
                <Field label="Steps to reproduce">
                  <textarea
                    rows={4}
                    value={form.stepsToReproduce}
                    onChange={(event) => setForm((current) => ({ ...current, stepsToReproduce: event.target.value }))}
                    className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white outline-none focus:border-primary/60"
                    placeholder="1. Go to... 2. Click... 3. Observe..."
                  />
                </Field>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Expected behavior">
                    <textarea
                      rows={4}
                      value={form.expectedBehavior}
                      onChange={(event) => setForm((current) => ({ ...current, expectedBehavior: event.target.value }))}
                      className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white outline-none focus:border-primary/60"
                      placeholder="What should happen instead?"
                    />
                  </Field>
                  <Field label="Actual behavior">
                    <textarea
                      rows={4}
                      value={form.actualBehavior}
                      onChange={(event) => setForm((current) => ({ ...current, actualBehavior: event.target.value }))}
                      className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white outline-none focus:border-primary/60"
                      placeholder="What happened in reality?"
                    />
                  </Field>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-sm font-semibold text-white">
                      <ImagePlus className="h-4 w-4 text-violet-300" /> Attach screenshots or proof
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Upload screenshots, recordings, or supporting proof up to {formatUploadLimit()} each. Clear visual evidence speeds up validation.
                    </p>
                  </div>
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-xs font-semibold text-white hover:bg-white/15">
                    Choose files
                    <input type="file" multiple accept="image/*,.pdf,.txt,.csv,.svg" className="hidden" onChange={onAttachmentChange} />
                  </label>
                </div>
                {attachments.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {attachments.map((file) => (
                      <span key={`${file.name}-${file.size}`} className="rounded-full bg-white/10 px-3 py-1 text-xs text-white ring-1 ring-white/10">
                        {file.name}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-start gap-2 rounded-xl bg-amber-500/10 px-3 py-2 text-xs text-amber-100 ring-1 ring-amber-400/20">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
                  Duplicate, spammy, or unverifiable reports may be rejected or receive no reward.
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 rounded-xl rb-gradient-primary px-4 py-2.5 text-sm font-semibold text-white shadow-[0_0_20px_rgba(192,132,252,0.35)] disabled:opacity-60"
                >
                  <Bug className="h-4 w-4" /> {submitting ? "Submitting..." : "Submit bug report"}
                </button>
              </div>
            </form>

            <div className="space-y-4">
              <div className="glass rounded-3xl p-5 ring-1 ring-white/10">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-white">Your reports</h3>
                    <p className="mt-1 text-sm text-muted-foreground">Track statuses, suggested RR, and follow-up history.</p>
                  </div>
                  <button
                    onClick={() => void loadHistory()}
                    className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/15"
                  >
                    Load history
                  </button>
                </div>

                {!historyLoaded ? (
                  <div className="mt-4 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-4 text-sm text-muted-foreground">
                    Load your report history to see what is already under review.
                  </div>
                ) : myReports.length === 0 ? (
                  <div className="mt-4 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-4 text-sm text-muted-foreground">
                    You have not submitted any bug reports yet.
                  </div>
                ) : (
                  <div className="mt-4 space-y-3">
                    {myReports.map((report) => (
                      <div key={report.id} className="rounded-2xl bg-white/[0.03] p-4 ring-1 ring-white/10">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="truncate text-sm font-semibold text-white">{report.title}</div>
                            <div className="mt-1 text-[11px] text-muted-foreground">{report.affectedArea || "General"} · {report.ageLabel}</div>
                          </div>
                          <SeverityChip severity={report.severity} />
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <StatusChip status={report.status} />
                          <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] text-white ring-1 ring-white/10">
                            {report.rrReward} RR
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="glass rounded-3xl p-5 ring-1 ring-white/10">
                <h3 className="text-lg font-semibold text-white">What gets rewarded most</h3>
                <ul className="mt-3 space-y-2 text-sm text-white/85">
                  <li className="rounded-2xl bg-white/[0.03] p-3 ring-1 ring-white/10">Account takeover, privilege escalation, or wallet abuse.</li>
                  <li className="rounded-2xl bg-white/[0.03] p-3 ring-1 ring-white/10">Broken payout or RR reward logic with reproducible proof.</li>
                  <li className="rounded-2xl bg-white/[0.03] p-3 ring-1 ring-white/10">Stored XSS, sensitive data exposure, or trust-impacting workflow bugs.</li>
                </ul>
                <a
                  href="mailto:security@rebateboardapp.com"
                  className="mt-4 inline-flex items-center gap-1.5 text-sm text-violet-300 hover:underline"
                >
                  <ExternalLink className="h-4 w-4" /> Contact security directly
                </a>
              </div>
            </div>
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}

function Field({ label, children, required = false }: { label: string; children: ReactNode; required?: boolean }) {
  return (
    <label className="block">
      <div className="mb-1.5 text-xs text-muted-foreground">
        {label} {required ? <span className="text-rose-300">*</span> : null}
      </div>
      {children}
    </label>
  );
}

function MiniBadge({ icon: Icon, label, value }: { icon: typeof Bug; label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/[0.04] px-4 py-3 ring-1 ring-white/10">
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
        <Icon className="h-3.5 w-3.5 text-violet-300" /> {label}
      </div>
      <div className="mt-1 text-sm font-semibold text-white">{value}</div>
    </div>
  );
}

function SeverityChip({ severity }: { severity: BugBountySeverity }) {
  const cls =
    severity === "critical" || severity === "high"
      ? "bg-rose-500/15 text-rose-300 ring-rose-400/30"
      : severity === "medium"
        ? "bg-amber-500/15 text-amber-300 ring-amber-400/30"
        : "bg-emerald-500/15 text-emerald-300 ring-emerald-400/30";
  return <span className={`rounded-full px-3 py-1 text-[11px] font-semibold capitalize ring-1 ${cls}`}>{severity}</span>;
}

function StatusChip({ status }: { status: string }) {
  const cls =
    status === "rewarded" || status === "fixed" || status === "accepted"
      ? "bg-emerald-500/15 text-emerald-300 ring-emerald-400/30"
      : status === "duplicate" || status === "rejected"
        ? "bg-rose-500/15 text-rose-300 ring-rose-400/30"
        : "bg-amber-500/15 text-amber-300 ring-amber-400/30";
  return <span className={`rounded-full px-3 py-1 text-[11px] font-semibold ring-1 ${cls}`}>{status.replace(/_/g, " ")}</span>;
}
