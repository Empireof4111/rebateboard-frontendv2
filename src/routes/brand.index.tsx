import { createFileRoute, Link } from "@tanstack/react-router";
import { useBrandAuth } from "@/lib/brand-auth";
import { useReviews } from "@/lib/reviews-store";
import { TrendingUp, Star, ShieldAlert, MessageSquare, ExternalLink, ShieldCheck, AlertTriangle, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/brand/")({
  component: BrandOverview,
});

function StatCard({ label, value, delta, tone = "neutral", icon: Icon }: { label: string; value: string; delta?: string; tone?: "up" | "down" | "neutral"; icon: any }) {
  const toneCls = tone === "up" ? "text-emerald-300" : tone === "down" ? "text-rose-300" : "text-muted-foreground";
  return (
    <div className="glass rounded-2xl p-4 ring-1 ring-white/10">
      <div className="flex items-center gap-2 text-violet-300"><Icon className="h-4 w-4" /></div>
      <div className="mt-2 text-2xl font-extrabold tracking-tight text-white">{value}</div>
      <div className="mt-0.5 text-[11px] text-muted-foreground">{label}</div>
      {delta && <div className={`mt-2 text-[10px] font-semibold ${toneCls}`}>{delta}</div>}
    </div>
  );
}

function BrandOverview() {
  const { brand } = useBrandAuth();
  if (!brand) return null;
  const allReviews = useReviews({ brandSlug: brand.slug });
  const pending = allReviews.filter((r) => r.status === "pending").length;
  const approved = allReviews.filter((r) => r.status === "approved").length;
  const avg = approved > 0
    ? (allReviews.filter((r) => r.status === "approved").reduce((s, r) => s + r.ratings.overall, 0) / approved).toFixed(1)
    : "—";

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-violet-500/10 via-violet-600/5 to-transparent p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-widest text-violet-300/80">Brand portal</div>
            <h1 className="mt-1 text-2xl font-bold text-white md:text-3xl">Welcome back, {brand.name}</h1>
            <p className="mt-1 text-sm text-muted-foreground">Your dashboard for trader feedback, payouts, and growth.</p>
          </div>
          <Link to="/tbi/brand/$slug" params={{ slug: brand.slug }} className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-white ring-1 ring-white/10 hover:bg-white/15">
            <ExternalLink className="h-3 w-3" /> View public profile
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard icon={TrendingUp} label="TBI Score" value={brand.score.toFixed(1)} delta={`Confidence: ${brand.confidence}`} tone="up" />
        <StatCard icon={Star} label="Avg user rating" value={String(avg)} delta={`${approved} approved`} tone="up" />
        <StatCard icon={MessageSquare} label="Pending reviews" value={String(pending)} delta={pending > 0 ? "Action needed" : "Inbox clear"} tone={pending > 0 ? "down" : "up"} />
        <StatCard icon={ShieldAlert} label="Open complaints" value="3" delta="-1 vs last week" tone="up" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        <div className="glass rounded-2xl p-5 ring-1 ring-white/10">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold text-white">Recent reviews</h2>
            <Link to="/brand/reviews" className="text-[11px] text-violet-300 hover:underline inline-flex items-center gap-1">Inbox <ArrowRight className="h-3 w-3" /></Link>
          </div>
          <div className="space-y-2">
            {allReviews.slice(0, 5).map((r) => (
              <div key={r.id} className="flex items-start gap-3 rounded-xl bg-white/[0.04] p-3 ring-1 ring-white/5">
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-violet-400 to-violet-600 text-[10px] font-bold text-white">{r.userName.slice(0, 2).toUpperCase()}</div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-white">{r.userName}</span>
                    <span className="text-[10px] text-muted-foreground">{r.country}</span>
                    <span className={`ml-auto rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${r.status === "approved" ? "bg-emerald-500/15 text-emerald-300" : r.status === "pending" ? "bg-violet-500/15 text-violet-300" : "bg-rose-500/15 text-rose-300"}`}>{r.status}</span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-[11px] text-muted-foreground">{r.body}</p>
                </div>
              </div>
            ))}
            {allReviews.length === 0 && <div className="rounded-xl bg-white/[0.03] p-6 text-center text-xs text-muted-foreground">No reviews yet. Share your profile link to start collecting feedback.</div>}
          </div>
        </div>

        <div className="space-y-4">
          <div className="glass rounded-2xl p-5 ring-1 ring-white/10">
            <div className="flex items-center gap-2 text-violet-300"><ShieldCheck className="h-4 w-4" /></div>
            <h3 className="mt-1 text-sm font-bold text-white">Improve your TBI</h3>
            <ul className="mt-3 space-y-2 text-[11px] text-muted-foreground">
              <li>• Reply to all pending reviews within 48h</li>
              <li>• Publish quarterly payout proof</li>
              <li>• Verify treasury wallet on-chain</li>
              <li>• Reach 50 verified reviews to unlock full TBI</li>
            </ul>
          </div>
          <div className="glass rounded-2xl p-5 ring-1 ring-white/10">
            <div className="flex items-center gap-2 text-rose-300"><AlertTriangle className="h-4 w-4" /></div>
            <h3 className="mt-1 text-sm font-bold text-white">Risk signals</h3>
            <p className="mt-2 text-[11px] text-muted-foreground">No critical risks detected. {pending > 0 ? `${pending} pending reviews could affect your score if left unanswered.` : "Inbox is clear."}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
