import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { z } from "zod";
import { useMemo, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import {
  TrustScoreCard, TrustBreakdownCard, UnlockProgressCard, ImprovementSuggestions, InfoNoteCard,
} from "@/components/tbi/OnboardingPrimitives";
import {
  useBrandSubmissionByToken, improvementSuggestions, CATEGORY_META, bumpReviewCount,
} from "@/lib/tbi-onboarding";
import { Mail, Copy, Share2, ExternalLink, ShieldCheck, Clock, AlertTriangle, FileText } from "lucide-react";

const searchSchema = z.object({ token: z.string().optional() });

export const Route = createFileRoute("/business/trust-dashboard")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Trust Dashboard — RebateBoard for Business" },
      { name: "description", content: "Manage your brand's verified Trust Profile." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: TrustDashboardPage,
});

function TrustDashboardPage() {
  const { token } = useSearch({ from: "/business/trust-dashboard" });
  const submission = useBrandSubmissionByToken(token ?? "");
  const [copied, setCopied] = useState(false);

  const profileUrl = useMemo(() => {
    if (!submission || typeof window === "undefined") return "";
    return `${window.location.origin}/tbi/brand/${submission.publicSlug}`;
  }, [submission]);

  if (!token || !submission) {
    return (
      <div className="min-h-screen bg-[#0b0418] text-foreground">
        <SiteHeader />
        <main className="mx-auto max-w-2xl px-4 py-20 text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-white/5">
            <Mail className="h-7 w-7 text-fuchsia-300" />
          </div>
          <h1 className="mt-6 text-3xl font-bold">Open your dashboard from your magic link</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            We sent a secure link to your email when you submitted your application. The link includes a token that signs you in instantly.
          </p>
          <Link to="/business/join" className="mt-6 inline-block rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-600 px-6 py-2.5 text-sm font-bold">
            Start a new application →
          </Link>
        </main>
      </div>
    );
  }

  const meta = CATEGORY_META[submission.category];
  const statusColor =
    submission.status === "approved" ? "text-emerald-300 bg-emerald-500/15 ring-emerald-400/30" :
    submission.status === "rejected" ? "text-rose-300 bg-rose-500/15 ring-rose-400/30" :
    submission.status === "changes_requested" ? "text-amber-300 bg-amber-500/15 ring-amber-400/30" :
    "text-violet-300 bg-violet-500/15 ring-violet-400/30";

  return (
    <div className="min-h-screen bg-[#0b0418] text-foreground">
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 py-8">
        {/* Header */}
        <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-violet-900/30 via-fuchsia-900/10 to-[#0b0418] p-6 md:p-8">
          <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
            <div className="flex items-center gap-4">
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-fuchsia-500 to-violet-600 text-2xl shadow-[0_0_24px_rgba(192,132,252,0.4)]">
                {meta.emoji}
              </div>
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-widest text-fuchsia-300/80">{meta.label}</div>
                <h1 className="mt-1 text-2xl font-bold md:text-3xl">{submission.brandName}</h1>
                <div className={`mt-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ring-1 ${statusColor}`}>
                  {submission.status === "pending" && <Clock className="h-3 w-3" />}
                  {submission.status === "approved" && <ShieldCheck className="h-3 w-3" />}
                  {submission.status === "rejected" && <AlertTriangle className="h-3 w-3" />}
                  {submission.status.replace("_", " ")}
                </div>
              </div>
            </div>
            {submission.status === "approved" && (
              <Link to="/tbi/brand/$slug" params={{ slug: submission.publicSlug! }} className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold backdrop-blur hover:border-white/30">
                View public profile <ExternalLink className="h-3 w-3" />
              </Link>
            )}
          </div>
          {submission.reviewNote && (
            <div className="mt-4 rounded-xl bg-white/5 px-4 py-3 text-xs">
              <div className="font-semibold text-white/90">Reviewer note</div>
              <div className="mt-1 text-muted-foreground">{submission.reviewNote}</div>
            </div>
          )}
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          {/* LEFT */}
          <div className="space-y-6">
            <TrustScoreCard
              score={submission.trustScore}
              maxScore={submission.trustScoreMode === "preliminary" ? 6.5 : 10}
              status={submission.trustScoreMode}
              helperText={
                submission.trustScoreMode === "preliminary" ? "Based on submitted data only — capped until trader reviews verify your brand." :
                submission.trustScoreMode === "partial" ? "Based on limited verified reviews." :
                submission.trustScoreMode === "full" ? "Based on verified trader feedback." : "—"
              }
            />
            <TrustBreakdownCard breakdown={submission.breakdown} />

            <UnlockProgressCard currentReviews={submission.reviewCount} />

            <ImprovementSuggestions items={improvementSuggestions(submission)} />

            {/* Demo helpers */}
            <div className="rounded-2xl border border-dashed border-fuchsia-400/30 bg-fuchsia-500/5 p-4">
              <div className="text-[11px] font-semibold uppercase tracking-widest text-fuchsia-200">Demo controls</div>
              <p className="mt-1 text-xs text-fuchsia-100/80">Simulate trader reviews coming in to see your unlock journey.</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button onClick={() => bumpReviewCount(submission.id, 1)} className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold hover:bg-white/15">+ 1 review</button>
                <button onClick={() => bumpReviewCount(submission.id, 5)} className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold hover:bg-white/15">+ 5 reviews</button>
                <button onClick={() => bumpReviewCount(submission.id, -submission.reviewCount)} className="rounded-full bg-rose-500/15 px-3 py-1.5 text-xs font-semibold text-rose-200 hover:bg-rose-500/25">Reset</button>
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <div className="space-y-4">
            {/* Review invite */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <div className="flex items-center gap-2">
                <Share2 className="h-4 w-4 text-fuchsia-300" />
                <div className="text-sm font-bold">Invite traders to review</div>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Share your public profile link to start unlocking your TBI.</p>
              <div className="mt-3 flex items-center gap-2">
                <input readOnly value={profileUrl} className="flex-1 truncate rounded-lg bg-black/40 px-3 py-2 font-mono text-[11px] text-white/80 ring-1 ring-white/10" />
                <button onClick={() => { navigator.clipboard.writeText(profileUrl); setCopied(true); setTimeout(() => setCopied(false), 1500); }} className="inline-flex items-center gap-1 rounded-lg bg-white/10 px-3 py-2 text-xs font-semibold hover:bg-white/15">
                  <Copy className="h-3 w-3" /> {copied ? "Copied" : "Copy"}
                </button>
              </div>
            </div>

            <InfoNoteCard
              title="Stay verified"
              body="Respond to trader complaints within 7 days to keep your trust score from decaying."
              variant="info"
            />

            {/* Submitted data summary */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-fuchsia-300" />
                <div className="text-sm font-bold">Submitted data</div>
              </div>
              <ul className="mt-3 space-y-1 text-[11px] text-muted-foreground">
                <li>Website: <span className="text-white">{submission.data.identity?.website || "—"}</span></li>
                <li>Country: <span className="text-white">{submission.data.identity?.country || "—"}</span></li>
                <li>Regulation: <span className="text-white">{submission.data.identity?.regulation || "—"}</span></li>
                <li>Documents: <span className="text-white">{((submission.data.proof?.registrationDocs?.length ?? 0) + (submission.data.proof?.payoutProof?.length ?? 0) + (submission.data.proof?.reserveProof?.length ?? 0))} files</span></li>
                <li>Completion: <span className="text-white">{submission.completionPercent}%</span></li>
              </ul>
            </div>

            {/* Activity timeline */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <div className="text-sm font-bold">Activity</div>
              <ol className="mt-3 space-y-3 text-xs">
                <li className="flex gap-3">
                  <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-emerald-400" />
                  <div>
                    <div className="font-semibold">Onboarding submitted</div>
                    <div className="text-muted-foreground">{new Date(submission.submittedAt).toLocaleString()}</div>
                  </div>
                </li>
                {submission.reviewedAt && (
                  <li className="flex gap-3">
                    <div className={`mt-1 h-2 w-2 shrink-0 rounded-full ${submission.status === "approved" ? "bg-emerald-400" : "bg-amber-400"}`} />
                    <div>
                      <div className="font-semibold">Reviewed by team — {submission.status}</div>
                      <div className="text-muted-foreground">{new Date(submission.reviewedAt).toLocaleString()}</div>
                    </div>
                  </li>
                )}
                {submission.reviewCount >= 5 && (
                  <li className="flex gap-3">
                    <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-amber-300" />
                    <div className="font-semibold">Partial unlock reached</div>
                  </li>
                )}
                {submission.reviewCount >= 10 && (
                  <li className="flex gap-3">
                    <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-emerald-400" />
                    <div className="font-semibold">Full TBI unlocked</div>
                  </li>
                )}
              </ol>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
