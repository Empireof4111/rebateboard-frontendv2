import { createFileRoute, Link } from "@tanstack/react-router";
import { Bug, ExternalLink, LifeBuoy, ShieldAlert, ShieldCheck, Sparkles } from "lucide-react";
import { EmptyState, PageHeader, Panel, Pill, StatCard } from "@/components/superadmin/AdminUI";

export const Route = createFileRoute("/superadmin/Bug-bounty")({
  component: BugBountyPage,
});

function BugBountyPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Bug Bounty"
        subtitle="Manage security disclosure policy, intake workflow, and vulnerability response from one superadmin module."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Pill tone="warn">Private program</Pill>
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
        <StatCard label="Open reports" value="0" delta="No active triage yet" tone="flat" />
        <StatCard label="Resolved reports" value="0" delta="No validated cases yet" tone="flat" />
        <StatCard label="Avg triage time" value="—" delta="Track after first report" tone="flat" />
        <StatCard label="Bounty paid" value="$0" delta="No payouts logged yet" tone="flat" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <Panel
          title="Program overview"
          action={<Pill tone="good">Security first</Pill>}
        >
          <div className="space-y-3 text-sm text-white/85">
            <p>
              This page is ready to become the operational home for your RebateBoard bug bounty workflow.
              Right now it is intentionally honest: the UI is in place, but no backend report intake or payout
              pipeline has been connected yet.
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
              Add public bug report intake form with severity, steps, assets, and reporter details.
            </li>
            <li className="rounded-xl bg-white/[0.03] p-3 ring-1 ring-white/10">
              Create backend report table with triage status, CVSS-style severity, duplicates, and payout state.
            </li>
            <li className="rounded-xl bg-white/[0.03] p-3 ring-1 ring-white/10">
              Connect internal notifications so high-risk reports alert superadmin immediately.
            </li>
            <li className="rounded-xl bg-white/[0.03] p-3 ring-1 ring-white/10">
              Add payout workflow for accepted disclosures and audit trail for each decision.
            </li>
          </ul>
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Severity model" action={<Pill tone="neutral">Draft policy</Pill>}>
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
              <div className="mt-1 text-white/75">Reflected XSS, weak access controls with low exploitability, information disclosure.</div>
            </div>
          </div>
        </Panel>

        <Panel title="Researcher workflow" action={<Bug className="h-3.5 w-3.5 text-fuchsia-300" />}>
          <ol className="space-y-2 text-xs text-white/85">
            <li className="rounded-xl bg-white/[0.03] p-3 ring-1 ring-white/10">1. Researcher submits a report with reproducible steps.</li>
            <li className="rounded-xl bg-white/[0.03] p-3 ring-1 ring-white/10">2. Superadmin triages, validates, and marks duplicate or accepted.</li>
            <li className="rounded-xl bg-white/[0.03] p-3 ring-1 ring-white/10">3. Engineering fixes, verifies, and resolves the issue.</li>
            <li className="rounded-xl bg-white/[0.03] p-3 ring-1 ring-white/10">4. Bounty payout and disclosure notes are logged if applicable.</li>
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
            <Link to="/superadmin/notifications" className="block rounded-xl bg-white/[0.03] p-3 text-white ring-1 ring-white/10 hover:bg-white/[0.05]">
              Configure incident notifications
            </Link>
          </div>
        </Panel>
      </div>

      <Panel title="Reports queue">
        <EmptyState
          icon={Bug}
          title="No bug bounty reports connected yet"
          description="The admin shell is ready. The next step is wiring a report submission backend and a moderation queue."
          action={
            <a
              href="mailto:security@rebateboardapp.com?subject=Bug%20Bounty%20Setup"
              className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/15"
            >
              Start intake design
            </a>
          }
        />
      </Panel>
    </div>
  );
}
