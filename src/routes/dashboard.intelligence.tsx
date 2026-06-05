import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { PageHeader, StatCard, Panel, Pill } from "@/components/dashboard/Primitives";
import { AlertTriangle, Target, Sparkles } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { financeApi, type WalletSummary, type ClaimStats } from "@/lib/finance-api";

export const Route = createFileRoute("/dashboard/intelligence")({
  component: IntelligencePage,
});

function IntelligencePage() {
  const { token } = useAuth();
  const [summary, setSummary] = useState<WalletSummary | null>(null);
  const [claimStats, setClaimStats] = useState<ClaimStats | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    const [sumRes, claimRes] = await Promise.allSettled([
      financeApi.getWalletSummary(token),
      financeApi.getClaimStats(token),
    ]);
    if (sumRes.status === "fulfilled" && sumRes.value.payload) setSummary(sumRes.value.payload);
    if (claimRes.status === "fulfilled" && claimRes.value.payload) setClaimStats(claimRes.value.payload);
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const fmtUSD = (n: number) => `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

  return (
    <div className="space-y-6">
      <PageHeader title="Intelligence" subtitle="Your performance, behavior, and what to fix next." />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Wallet balance" value={summary ? fmtUSD(Number(summary.balance)) : "—"} trend="up" accent="success" />
        <StatCard label="Total cashback" value={summary ? fmtUSD(Number(summary.totalEarned)) : "—"} trend="up" accent="primary" />
        <StatCard label="Claims paid" value={claimStats ? String(claimStats.paid) : "—"} accent="primary" />
        <StatCard label="Total withdrawn" value={summary ? fmtUSD(Number(summary.totalWithdrawn)) : "—"} hint="Lifetime" accent="warning" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Your Weakest Area" action={<Pill tone="warning">Focus</Pill>}>
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-warning/15">
              <AlertTriangle className="h-5 w-5 text-accent" />
            </div>
            <div>
              <div className="text-base font-semibold text-white">Discipline · 6.2</div>
              <p className="text-xs text-muted-foreground">You break risk rules ~3× per week. Tightening this lifts ROI by an est. +6.8%.</p>
            </div>
          </div>
        </Panel>

        <Panel title="Focus Today" action={<Pill tone="primary">AI</Pill>}>
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary/15">
              <Target className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="text-base font-semibold text-white">Avoid overtrading after losses</div>
              <p className="text-xs text-muted-foreground">Your last 12 revenge trades cost a combined −$840.</p>
            </div>
          </div>
        </Panel>
      </div>

      <Panel title="Cashback claim breakdown">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 text-xs">
          {[
            { k: "Pending", v: claimStats?.pending ?? 0, max: claimStats?.total || 1 },
            { k: "Approved", v: claimStats?.approved ?? 0, max: claimStats?.total || 1 },
            { k: "Paid", v: claimStats?.paid ?? 0, max: claimStats?.total || 1 },
            { k: "Rejected", v: claimStats?.rejected ?? 0, max: claimStats?.total || 1 },
          ].map((b) => (
            <div key={b.k}>
              <div className="mb-1 flex justify-between"><span className="text-muted-foreground">{b.k}</span><span className="font-semibold text-white">{b.v}</span></div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                <div className="h-full bg-gradient-to-r from-primary to-accent" style={{ width: `${(b.v / b.max) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Cashback summary" action={<Sparkles className="h-4 w-4 text-accent" />}>
        <p className="text-xs text-muted-foreground">Lifetime cashback earnings overview.</p>
        <div className="mt-3 grid grid-cols-3 gap-3">
          <StatCard label="Total claims" value={claimStats ? String(claimStats.total) : "—"} accent="primary" />
          <StatCard label="Amount paid out" value={claimStats ? fmtUSD(Number(claimStats.totalAmountPaid)) : "—"} trend="up" accent="success" />
          <StatCard label="Pending review" value={claimStats ? String(claimStats.pending) : "—"} accent="warning" />
        </div>
      </Panel>
    </div>
  );
}
