import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Bell, Bug, Coins, Mail, Send, ShieldCheck, Sparkles } from "lucide-react";
import { PageHeader, Panel, DataTable, StatusPill, StatCard, Pill, EmptyState } from "@/components/superadmin/AdminUI";
import { notifications } from "@/lib/admin-data";
import { fetchAdminBugBountyReports, type BugBountyReportRecord } from "@/lib/bug-bounty-api";
import { toast } from "sonner";

export const Route = createFileRoute("/superadmin/notifications")({
  component: NotificationsAdmin,
});

function NotificationsAdmin() {
  const [bugReports, setBugReports] = useState<BugBountyReportRecord[]>([]);
  const [loadingBugReports, setLoadingBugReports] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadBugBountyAudit() {
      try {
        const reports = await fetchAdminBugBountyReports();
        if (cancelled) return;
        setBugReports(reports);
      } catch (error) {
        if (!cancelled) {
          toast.error(error instanceof Error ? error.message : "Unable to load bug bounty notifications");
        }
      } finally {
        if (!cancelled) {
          setLoadingBugReports(false);
        }
      }
    }

    void loadBugBountyAudit();
    return () => {
      cancelled = true;
    };
  }, []);

  const acceptedReports = useMemo(
    () => bugReports.filter((report) => report.status === "accepted"),
    [bugReports],
  );
  const rewardedReports = useMemo(
    () => bugReports.filter((report) => report.status === "rewarded" || report.rewardStatus === "paid"),
    [bugReports],
  );
  const recentAudit = useMemo(
    () =>
      bugReports
        .filter((report) => ["accepted", "rewarded"].includes(report.status) || report.rewardStatus === "paid")
        .sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt))
        .slice(0, 6),
    [bugReports],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        subtitle="Broadcast updates to users, and audit bug bounty acceptance and RR payout events in one place."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to="/superadmin/Bug-bounty"
              className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/15"
            >
              <Bug className="h-3.5 w-3.5" /> Open Bug Bounty
            </Link>
            <button className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-600 px-3 py-1.5 text-xs font-semibold text-white">
              <Send className="h-3.5 w-3.5" /> New broadcast
            </button>
          </div>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Broadcast templates" value={String(notifications.length)} delta="Static control room feed" tone="flat" />
        <StatCard label="Accepted bug reports" value={String(acceptedReports.length)} delta="Needs follow-through" tone={acceptedReports.length ? "up" : "flat"} />
        <StatCard label="Rewarded bug reports" value={String(rewardedReports.length)} delta="RR already issued" tone={rewardedReports.length ? "up" : "flat"} />
        <StatCard
          label="Bug bounty payout RR"
          value={String(rewardedReports.reduce((sum, report) => sum + Number(report.rrReward || 0), 0))}
          delta="Audited from live reports"
          tone={rewardedReports.length ? "up" : "flat"}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Panel
          title="Bug bounty notification audit"
          action={<Pill tone="warn">Accepted + Rewarded only</Pill>}
        >
          {loadingBugReports ? (
            <div className="text-sm text-muted-foreground">Loading bug bounty notification audit...</div>
          ) : recentAudit.length === 0 ? (
            <EmptyState
              icon={Bug}
              title="No bug bounty notification events yet"
              description="Accepted and rewarded reports will appear here so superadmin can audit what was communicated."
            />
          ) : (
            <div className="space-y-3">
              {recentAudit.map((report) => (
                <div key={report.id} className="rounded-2xl bg-white/[0.03] p-4 ring-1 ring-white/10">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="truncate text-sm font-semibold text-white">{report.title}</div>
                        <StatusPill status={report.status} />
                        <Pill tone={report.rewardStatus === "paid" ? "good" : "warn"}>{report.rewardStatus}</Pill>
                      </div>
                      <div className="mt-1 text-[11px] text-muted-foreground">
                        {report.reporterName} · {report.reporterEmail} · updated {new Date(report.updatedAt).toLocaleString()}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <MiniAuditPill icon={Mail} label="Email" />
                      <MiniAuditPill icon={Bell} label="In-app" />
                      {report.rewardStatus === "paid" ? <MiniAuditPill icon={Coins} label={`${report.rrReward} RR`} tone="good" /> : null}
                    </div>
                  </div>

                  <div className="mt-3 grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
                    <div className="rounded-xl bg-white/[0.03] p-3 ring-1 ring-white/10">
                      <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Latest notification event</div>
                      <div className="mt-1 text-sm text-white">
                        {report.rewardStatus === "paid"
                          ? `Reporter was notified that ${report.rrReward} RR was credited for report #${report.reportId}.`
                          : `Reporter was notified that report #${report.reportId} was accepted for remediation.`}
                      </div>
                    </div>
                    <Link
                      to="/superadmin/Bug-bounty"
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-white/10 px-3 py-2 text-xs font-semibold text-white hover:bg-white/15"
                    >
                      <ShieldCheck className="h-3.5 w-3.5" /> Review report
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>

        <Panel title="Bug bounty notification rules" action={<Sparkles className="h-3.5 w-3.5 text-fuchsia-300" />}>
          <div className="space-y-3 text-sm text-white/85">
            <div className="rounded-2xl bg-white/[0.03] p-4 ring-1 ring-white/10">
              <div className="text-xs font-semibold uppercase tracking-[0.14em] text-white">Acceptance notice</div>
              <p className="mt-2 text-xs text-muted-foreground">
                Sent when a report enters the `accepted` state. Uses email plus in-app delivery and includes the current suggested RR reward.
              </p>
            </div>
            <div className="rounded-2xl bg-white/[0.03] p-4 ring-1 ring-white/10">
              <div className="text-xs font-semibold uppercase tracking-[0.14em] text-white">Reward payout notice</div>
              <p className="mt-2 text-xs text-muted-foreground">
                Sent when RR is actually paid. Includes reward amount and acts as the user-facing confirmation to match wallet history.
              </p>
            </div>
            <div className="rounded-2xl bg-white/[0.03] p-4 ring-1 ring-white/10">
              <div className="text-xs font-semibold uppercase tracking-[0.14em] text-white">Audit value</div>
              <p className="mt-2 text-xs text-muted-foreground">
                This card gives superadmin a fast way to verify which bug bounty lifecycle events were user-facing without digging through the full report queue.
              </p>
            </div>
          </div>
        </Panel>
      </div>

      <Panel title="Recent broadcasts">
        <DataTable head={<><th>Title</th><th>Channel</th><th>Status</th><th>Reach</th><th></th></>}>
          {notifications.map((n) => (
            <tr key={n.id}>
              <td className="font-semibold">{n.title}</td>
              <td className="text-muted-foreground">{n.channel}</td>
              <td><StatusPill status={n.status} /></td>
              <td className="font-mono">{n.reach}</td>
              <td className="text-right"><button className="rounded-md bg-white/10 px-2 py-1 text-[10px] font-bold text-white">View</button></td>
            </tr>
          ))}
        </DataTable>
      </Panel>
    </div>
  );
}

function MiniAuditPill({
  icon: Icon,
  label,
  tone = "neutral",
}: {
  icon: typeof Mail;
  label: string;
  tone?: "neutral" | "good";
}) {
  const cls =
    tone === "good"
      ? "bg-emerald-500/15 text-emerald-300 ring-emerald-400/30"
      : "bg-white/10 text-white ring-white/10";
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold ring-1 ${cls}`}>
      <Icon className="h-3.5 w-3.5" /> {label}
    </span>
  );
}
