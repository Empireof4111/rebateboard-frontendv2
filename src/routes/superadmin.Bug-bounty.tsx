import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Bug,
  Clock3,
  Coins,
  ExternalLink,
  FileWarning,
  LifeBuoy,
  Mail,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { EmptyState, PageHeader, Panel, Pill, StatCard } from "@/components/superadmin/AdminUI";
import {
  fetchAdminBugBountyReports,
  fetchAdminBugBountyStats,
  moderateBugBountyReport,
  rewardBugBountyReport,
  type BugBountyAdminStats,
  type BugBountyReportRecord,
  type BugBountySeverity,
  type BugBountyStatus,
} from "@/lib/bug-bounty-api";
import { toast } from "sonner";

export const Route = createFileRoute("/superadmin/Bug-bounty")({
  component: BugBountyPage,
});

function BugBountyPage() {
  const [stats, setStats] = useState<BugBountyAdminStats | null>(null);
  const [reports, setReports] = useState<BugBountyReportRecord[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [adminNoteDraft, setAdminNoteDraft] = useState("");
  const [rewardDraft, setRewardDraft] = useState("0");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [nextStats, nextReports] = await Promise.all([
          fetchAdminBugBountyStats(),
          fetchAdminBugBountyReports(),
        ]);
        if (cancelled) return;
        setStats(nextStats);
        setReports(nextReports);
        setActiveId((current) => (current && nextReports.some((item) => item.id === current) ? current : nextReports[0]?.id ?? ""));
      } catch (error) {
        if (!cancelled) {
          toast.error(error instanceof Error ? error.message : "Unable to load bug bounty reports");
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

  const active = reports.find((item) => item.id === activeId) ?? reports[0] ?? null;

  useEffect(() => {
    setAdminNoteDraft(active?.adminNote ?? "");
    setRewardDraft(String(active?.rrReward ?? 0));
  }, [active?.id, active?.adminNote, active?.rrReward]);

  const filteredReports = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return reports;
    return reports.filter((item) =>
      [
        item.title,
        item.description,
        item.reporterName,
        item.reporterEmail,
        item.affectedArea,
        item.bugType,
        item.status,
        item.severity,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [reports, search]);

  async function refreshCurrent(searchQuery = "") {
    const [nextStats, nextReports] = await Promise.all([
      fetchAdminBugBountyStats(),
      fetchAdminBugBountyReports(searchQuery),
    ]);
    setStats(nextStats);
    setReports(nextReports);
    setActiveId((current) => (current && nextReports.some((item) => item.id === current) ? current : nextReports[0]?.id ?? ""));
  }

  async function applyModeration(input: {
    status?: BugBountyStatus;
    severity?: BugBountySeverity;
    adminNote?: string;
    duplicateOfId?: number;
  }) {
    if (!active) return;
    try {
      const updated = await moderateBugBountyReport(active.reportId, input);
      setReports((current) => current.map((item) => (item.id === active.id ? updated : item)));
      setActiveId(updated.id);
      const nextStats = await fetchAdminBugBountyStats();
      setStats(nextStats);
      toast.success("Bug report updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update bug report");
    }
  }

  async function payReward() {
    if (!active) return;
    const amount = Number(rewardDraft);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Enter a valid RR reward amount");
      return;
    }

    try {
      const updated = await rewardBugBountyReport(active.reportId, {
        rrReward: amount,
        adminNote: adminNoteDraft,
      });
      setReports((current) => current.map((item) => (item.id === active.id ? updated : item)));
      setActiveId(updated.id);
      const nextStats = await fetchAdminBugBountyStats();
      setStats(nextStats);
      toast.success("RR reward paid successfully");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to pay RR reward");
    }
  }

  async function runSearch() {
    try {
      setLoading(true);
      await refreshCurrent(search);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to search bug reports");
    } finally {
      setLoading(false);
    }
  }

  const statValues = {
    open: stats?.open ?? 0,
    resolved: stats?.resolved ?? 0,
    avgTriage: stats?.avgTriageHours == null ? "—" : `${stats.avgTriageHours}h`,
    bountyPaid: `${stats?.bountyPaidRr ?? 0} RR`,
  };

  if (loading && !stats && reports.length === 0) {
    return <div className="text-sm text-muted-foreground">Loading bug bounty queue...</div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bug Bounty"
        subtitle="Moderate researcher submissions, validate real issues, and award RR from one live trust-and-security queue."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Pill tone="warn">{stats?.highSeverity ?? 0} high-risk reports</Pill>
            <Link
              to="/bug-bounty"
              className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/15"
            >
              <Bug className="h-3.5 w-3.5" /> Public page
            </Link>
            <a
              href="mailto:security@rebateboardapp.com"
              className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-600 px-3 py-1.5 text-xs font-semibold text-white"
            >
              <LifeBuoy className="h-3.5 w-3.5" /> Contact security
            </a>
          </div>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Open reports" value={String(statValues.open)} delta="Needs triage" tone={statValues.open ? "down" : "flat"} />
        <StatCard label="Resolved reports" value={String(statValues.resolved)} delta="Fixed or rewarded" tone={statValues.resolved ? "up" : "flat"} />
        <StatCard label="Avg triage time" value={statValues.avgTriage} delta="Will improve as data grows" tone="flat" />
        <StatCard label="Bounty paid" value={statValues.bountyPaid} delta="Total RR distributed" tone={stats?.bountyPaidRr ? "up" : "flat"} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <Panel title="Program overview" action={<Pill tone="good">Security first</Pill>}>
          <div className="space-y-3 text-sm text-white/85">
            <p>
              This queue is now wired to the live bug bounty backend. Researchers can submit findings, superadmin can
              triage them, and accepted reports can be rewarded directly in RR.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-white/[0.03] p-4 ring-1 ring-white/10">
                <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-white">
                  <ShieldCheck className="h-4 w-4 text-emerald-300" />
                  Recommended scope
                </div>
                <ul className="space-y-1 text-xs text-muted-foreground">
                  <li>Authentication and session weaknesses</li>
                  <li>Privilege escalation in superadmin flows</li>
                  <li>Wallet, cashback, payout, or RR tampering</li>
                  <li>Stored XSS, IDOR, and sensitive data exposure</li>
                </ul>
              </div>
              <div className="rounded-xl bg-white/[0.03] p-4 ring-1 ring-white/10">
                <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-white">
                  <ShieldAlert className="h-4 w-4 text-amber-300" />
                  Out of scope
                </div>
                <ul className="space-y-1 text-xs text-muted-foreground">
                  <li>Rate limits on public brochure pages only</li>
                  <li>Social engineering and physical attacks</li>
                  <li>Spam, SEO issues, or generic best-practice notes</li>
                  <li>Known third-party issues without platform impact</li>
                </ul>
              </div>
            </div>
          </div>
        </Panel>

        <Panel title="Next integrations" action={<Sparkles className="h-3.5 w-3.5 text-fuchsia-300" />}>
          <ul className="space-y-2 text-xs text-white/85">
            <li className="rounded-xl bg-white/[0.03] p-3 ring-1 ring-white/10">
              Connect in-app notifications so critical reports page superadmin immediately.
            </li>
            <li className="rounded-xl bg-white/[0.03] p-3 ring-1 ring-white/10">
              Add duplicate clustering and risk pattern alerts across similar attack surfaces.
            </li>
            <li className="rounded-xl bg-white/[0.03] p-3 ring-1 ring-white/10">
              Tie accepted findings into TRT and trust risk events for public transparency.
            </li>
            <li className="rounded-xl bg-white/[0.03] p-3 ring-1 ring-white/10">
              Record fix verification timestamps to improve triage and remediation reporting.
            </li>
          </ul>
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Severity model" action={<Pill tone="neutral">Reward-weighted</Pill>}>
          <div className="space-y-2 text-xs">
            <div className="rounded-xl bg-rose-500/10 p-3 ring-1 ring-rose-400/20">
              <div className="font-semibold text-rose-300">Critical</div>
              <div className="mt-1 text-white/75">Remote account takeover, admin takeover, wallet abuse, payout manipulation.</div>
            </div>
            <div className="rounded-xl bg-amber-500/10 p-3 ring-1 ring-amber-400/20">
              <div className="font-semibold text-amber-300">High</div>
              <div className="mt-1 text-white/75">Stored XSS, privilege escalation, sensitive data leakage with real user impact.</div>
            </div>
            <div className="rounded-xl bg-sky-500/10 p-3 ring-1 ring-sky-400/20">
              <div className="font-semibold text-sky-300">Medium / Low</div>
              <div className="mt-1 text-white/75">Broken flows, reflected issues, low-exploitability access problems, information disclosure.</div>
            </div>
          </div>
        </Panel>

        <Panel title="Researcher workflow" action={<Bug className="h-3.5 w-3.5 text-fuchsia-300" />}>
          <ol className="space-y-2 text-xs text-white/85">
            <li className="rounded-xl bg-white/[0.03] p-3 ring-1 ring-white/10">1. Researcher submits a report with reproducible steps.</li>
            <li className="rounded-xl bg-white/[0.03] p-3 ring-1 ring-white/10">2. Superadmin triages, changes status, adjusts severity, and requests more info when needed.</li>
            <li className="rounded-xl bg-white/[0.03] p-3 ring-1 ring-white/10">3. Accepted issues move to fixed after remediation is confirmed.</li>
            <li className="rounded-xl bg-white/[0.03] p-3 ring-1 ring-white/10">4. RR reward is paid directly into the reporter account and logged in wallet history.</li>
          </ol>
        </Panel>

        <Panel title="Resources" action={<ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />}>
          <div className="space-y-2 text-xs">
            <a href="mailto:security@rebateboardapp.com" className="block rounded-xl bg-white/[0.03] p-3 text-white ring-1 ring-white/10 hover:bg-white/[0.05]">
              security@rebateboardapp.com
            </a>
            <Link to="/superadmin/audit" className="block rounded-xl bg-white/[0.03] p-3 text-white ring-1 ring-white/10 hover:bg-white/[0.05]">
              View audit log for incident correlation
            </Link>
            <Link to="/superadmin/trt" className="block rounded-xl bg-white/[0.03] p-3 text-white ring-1 ring-white/10 hover:bg-white/[0.05]">
              Feed accepted issues into TRT monitoring
            </Link>
          </div>
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-[360px_minmax(0,1fr)]">
        <Panel
          title="Reports queue"
          action={
            <button
              onClick={() => void runSearch()}
              className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/15"
            >
              <Search className="h-3.5 w-3.5" /> Refresh
            </button>
          }
        >
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") void runSearch();
                }}
                placeholder="Search title, reporter, area..."
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-2.5 pl-10 pr-4 text-sm text-white outline-none focus:border-primary/60"
              />
            </div>

            {filteredReports.length === 0 ? (
              <EmptyState
                icon={Bug}
                title="No reports found"
                description="Once users submit security or product bugs, they will appear here for triage."
              />
            ) : (
              <div className="space-y-2">
                {filteredReports.map((report) => (
                  <button
                    key={report.id}
                    onClick={() => setActiveId(report.id)}
                    className={`w-full rounded-2xl p-3 text-left ring-1 transition ${
                      report.id === active?.id
                        ? "bg-fuchsia-500/10 ring-fuchsia-400/40"
                        : "bg-white/[0.03] ring-white/10 hover:bg-white/[0.05]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-white">{report.title}</div>
                        <div className="mt-1 text-[11px] text-muted-foreground">
                          {report.reporterName} · {report.affectedArea || "General"} · {report.ageLabel}
                        </div>
                      </div>
                      <SeverityTag severity={report.severity} />
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <StatusTag status={report.status} />
                      <Pill tone={report.rewardStatus === "paid" ? "good" : report.rewardStatus === "cancelled" ? "bad" : "neutral"}>
                        reward {report.rewardStatus}
                      </Pill>
                      <Pill tone="warn">{report.rrReward} RR</Pill>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </Panel>

        <Panel
          title={active ? `Report #${active.reportId}` : "Report details"}
          action={active ? <div className="flex flex-wrap gap-2"><SeverityTag severity={active.severity} /><StatusTag status={active.status} /></div> : undefined}
        >
          {!active ? (
            <EmptyState
              icon={FileWarning}
              title="Select a report"
              description="Pick a submission from the queue to review its evidence, timeline, and reward flow."
            />
          ) : (
            <div className="space-y-5">
              <section className="grid gap-3 rounded-2xl bg-white/[0.03] p-4 ring-1 ring-white/10 md:grid-cols-2">
                <InfoItem label="Reporter" value={active.reporterName} />
                <InfoItem label="Email" value={active.reporterEmail} />
                <InfoItem label="Affected area" value={active.affectedArea || "Not specified"} />
                <InfoItem label="Bug type" value={active.bugType || "General"} />
                <InfoItem label="Environment" value={active.environment || "Not specified"} />
                <InfoItem label="Source URL" value={active.url || "Not provided"} link={active.url || undefined} />
              </section>

              <section className="space-y-3">
                <Block title="Issue summary" body={active.description} />
                <Block title="Steps to reproduce" body={active.stepsToReproduce || "No steps shared yet."} />
                <div className="grid gap-3 md:grid-cols-2">
                  <Block title="Expected behavior" body={active.expectedBehavior || "Not provided."} />
                  <Block title="Actual behavior" body={active.actualBehavior || "Not provided."} />
                </div>
              </section>

              <section className="grid gap-3 md:grid-cols-3">
                <MetricCard icon={Clock3} label="Age" value={active.ageLabel} />
                <MetricCard icon={Coins} label="Suggested reward" value={`${active.rrReward} RR`} />
                <MetricCard icon={AlertCircle} label="Attachments" value={String(active.attachments.length)} />
              </section>

              <section>
                <div className="mb-2 flex items-center justify-between">
                  <h4 className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Attachments</h4>
                  <span className="text-[11px] text-muted-foreground">{active.attachments.length} file(s)</span>
                </div>
                {active.attachments.length === 0 ? (
                  <div className="rounded-xl bg-white/[0.02] p-3 text-xs text-muted-foreground ring-1 ring-dashed ring-white/10">
                    No screenshots or proof were uploaded.
                  </div>
                ) : (
                  <div className="grid gap-2 md:grid-cols-2">
                    {active.attachments.map((url, index) => (
                      <a
                        key={`${url}-${index}`}
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-3 rounded-xl bg-white/[0.03] p-3 ring-1 ring-white/10 hover:bg-white/[0.05]"
                      >
                        <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/5 ring-1 ring-white/10">
                          <ExternalLink className="h-4 w-4 text-fuchsia-300" />
                        </div>
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium text-white">Attachment {index + 1}</div>
                          <div className="truncate text-[11px] text-muted-foreground">{url}</div>
                        </div>
                      </a>
                    ))}
                  </div>
                )}
              </section>

              <section className="grid gap-4 xl:grid-cols-[1fr_320px]">
                <div className="space-y-4">
                  <Panel title="Moderation actions" compact>
                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-2">
                        {["triaging", "need_more_info", "accepted", "fixed", "duplicate", "rejected"].map((status) => (
                          <button
                            key={status}
                            onClick={() => void applyModeration({ status: status as BugBountyStatus, adminNote: adminNoteDraft })}
                            className="rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-white/15"
                          >
                            {labelize(status)}
                          </button>
                        ))}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {(["low", "medium", "high", "critical"] as BugBountySeverity[]).map((severity) => (
                          <button
                            key={severity}
                            onClick={() => void applyModeration({ severity, adminNote: adminNoteDraft })}
                            className="rounded-full bg-white/5 px-3 py-1.5 text-[11px] font-semibold text-white ring-1 ring-white/10 hover:bg-white/10"
                          >
                            Severity: {labelize(severity)}
                          </button>
                        ))}
                      </div>
                    </div>
                  </Panel>

                  <Panel title="Admin note" compact>
                    <textarea
                      rows={5}
                      value={adminNoteDraft}
                      onChange={(event) => setAdminNoteDraft(event.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white outline-none focus:border-primary/60"
                      placeholder="Internal moderation note, next steps, or researcher follow-up..."
                    />
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        onClick={() => void applyModeration({ adminNote: adminNoteDraft })}
                        className="rounded-xl bg-white/10 px-3 py-2 text-xs font-semibold text-white hover:bg-white/15"
                      >
                        Save note
                      </button>
                      {active.reporterEmail ? (
                        <a
                          href={`mailto:${active.reporterEmail}?subject=${encodeURIComponent(`RebateBoard Bug Report #${active.reportId}`)}`}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-white/5 px-3 py-2 text-xs font-semibold text-white ring-1 ring-white/10 hover:bg-white/10"
                        >
                          <Mail className="h-3.5 w-3.5" /> Email reporter
                        </a>
                      ) : null}
                    </div>
                  </Panel>
                </div>

                <Panel title="Reward flow" compact>
                  <div className="space-y-3">
                    <div className="rounded-xl bg-white/[0.03] p-3 ring-1 ring-white/10">
                      <div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Reward status</div>
                      <div className="mt-1 flex items-center gap-2">
                        <Pill tone={active.rewardStatus === "paid" ? "good" : active.rewardStatus === "cancelled" ? "bad" : "warn"}>
                          {active.rewardStatus}
                        </Pill>
                        {active.rewardedAt ? (
                          <span className="text-[11px] text-muted-foreground">paid {new Date(active.rewardedAt).toLocaleString()}</span>
                        ) : null}
                      </div>
                    </div>
                    <label className="block text-xs text-muted-foreground">
                      RR reward
                      <input
                        type="number"
                        min="0"
                        value={rewardDraft}
                        onChange={(event) => setRewardDraft(event.target.value)}
                        className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white outline-none focus:border-primary/60"
                      />
                    </label>
                    <button
                      onClick={() => void payReward()}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-fuchsia-500 to-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_0_20px_rgba(192,132,252,0.35)]"
                    >
                      <Coins className="h-4 w-4" /> Pay RR reward
                    </button>
                  </div>
                </Panel>
              </section>

              <section>
                <h4 className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Timeline</h4>
                {active.timeline.length === 0 ? (
                  <div className="rounded-xl bg-white/[0.02] p-3 text-xs text-muted-foreground ring-1 ring-dashed ring-white/10">
                    No timeline entries yet.
                  </div>
                ) : (
                  <ol className="space-y-3 border-l border-white/10 pl-4">
                    {active.timeline.map((entry, index) => (
                      <li key={`${entry.stage}-${index}`} className="relative">
                        <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-gradient-to-br from-fuchsia-400 to-violet-500 ring-2 ring-[#150829]" />
                        <div className="flex items-center justify-between gap-3">
                          <div className="text-sm font-semibold text-white">{entry.stage}</div>
                          <div className="text-[11px] text-muted-foreground">{entry.time}</div>
                        </div>
                        <div className="mt-1 text-[11px] text-muted-foreground">
                          <span className="text-fuchsia-300">{entry.actor}</span> · {entry.note}
                        </div>
                      </li>
                    ))}
                  </ol>
                )}
              </section>
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}

function labelize(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function SeverityTag({ severity }: { severity: BugBountySeverity }) {
  const tone = severity === "critical" || severity === "high" ? "bad" : severity === "medium" ? "warn" : "good";
  return <Pill tone={tone}>{labelize(severity)}</Pill>;
}

function StatusTag({ status }: { status: BugBountyStatus }) {
  const tone =
    status === "rewarded" || status === "fixed" || status === "accepted"
      ? "good"
      : status === "duplicate" || status === "rejected"
        ? "bad"
        : "warn";
  return <Pill tone={tone}>{labelize(status)}</Pill>;
}

function MetricCard({ icon: Icon, label, value }: { icon: typeof Clock3; label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/[0.03] p-4 ring-1 ring-white/10">
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
        <Icon className="h-3.5 w-3.5 text-fuchsia-300" /> {label}
      </div>
      <div className="mt-2 text-lg font-semibold text-white">{value}</div>
    </div>
  );
}

function InfoItem({ label, value, link }: { label: string; value: string; link?: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">{label}</div>
      {link ? (
        <a href={link} target="_blank" rel="noreferrer" className="mt-1 block break-all text-sm text-fuchsia-300 hover:underline">
          {value}
        </a>
      ) : (
        <div className="mt-1 break-words text-sm text-white">{value}</div>
      )}
    </div>
  );
}

function Block({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl bg-white/[0.03] p-4 ring-1 ring-white/10">
      <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">{title}</div>
      <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-white/90">{body}</p>
    </div>
  );
}
