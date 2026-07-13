import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Coins, Download, ExternalLink, Funnel, Search, Sparkles, Trophy } from "lucide-react";
import { DataTable, PageHeader, Panel, Pill, StatCard } from "@/components/superadmin/AdminUI";
import { toast } from "@/components/superadmin/AdminActions";
import {
  fetchChallengePurchaseAdminBoard,
  type ChallengePurchaseAdminBoard,
  type ChallengePurchaseStep,
} from "@/lib/challenge-purchases-api";

export const Route = createFileRoute("/superadmin/challenge-purchases")({
  component: ChallengePurchasesPage,
});

const FUNNEL_LABELS: Record<ChallengePurchaseStep, string> = {
  buy_click: "Buy click",
  checkout: "Checkout",
  finalized: "Finalized",
  reward_chosen: "Reward chosen",
  claim_guide_viewed: "Claim guide viewed",
  intent_created: "Started",
  redirected_to_partner: "Sent to partner",
  pending_purchase: "Waiting for purchase",
  user_marked_completed: "Purchase marked complete",
  proof_submitted: "Proof submitted",
  under_review: "Under review",
  approved: "Approved",
  rejected: "Rejected",
  reward_credited: "Reward credited",
};

const STEP_OPTIONS: Array<{ value: ChallengePurchaseStep | "all"; label: string }> = [
  { value: "all", label: "All steps" },
  { value: "buy_click", label: "Buy click" },
  { value: "checkout", label: "Checkout" },
  { value: "finalized", label: "Finalized" },
  { value: "reward_chosen", label: "Reward chosen" },
  { value: "claim_guide_viewed", label: "Claim guide viewed" },
  { value: "intent_created", label: "Started" },
  { value: "redirected_to_partner", label: "Sent to partner" },
  { value: "pending_purchase", label: "Waiting for purchase" },
  { value: "user_marked_completed", label: "Purchase marked complete" },
  { value: "proof_submitted", label: "Proof submitted" },
  { value: "under_review", label: "Under review" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "reward_credited", label: "Reward credited" },
];

function ChallengePurchasesPage() {
  const [board, setBoard] = useState<ChallengePurchaseAdminBoard | null>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [firmFilter, setFirmFilter] = useState<string>("all");
  const [stepFilter, setStepFilter] = useState<ChallengePurchaseStep | "all">("all");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const payload = await fetchChallengePurchaseAdminBoard();
        if (!cancelled) setBoard(payload);
      } catch (error) {
        if (!cancelled) toast.error(error instanceof Error ? error.message : "Failed to load challenge purchases");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const rows = board?.rows ?? [];

  const filteredRows = useMemo(() => {
    const term = query.trim().toLowerCase();

    return rows.filter((row) => {
      const matchesTerm =
        !term ||
        (row.buyerEmail ?? "").toLowerCase().includes(term) ||
        row.firm.toLowerCase().includes(term) ||
        row.program.toLowerCase().includes(term);

      const matchesFirm = firmFilter === "all" || row.firm === firmFilter;
      const matchesStep = stepFilter === "all" || row.step === stepFilter;

      return matchesTerm && matchesFirm && matchesStep;
    });
  }, [firmFilter, query, rows, stepFilter]);

  const metrics = board?.summary ?? {
    totalBuyClicks: 0,
    finalizedPurchases: 0,
    gmvTracked: 0,
    rrPointsEmitted: 0,
    conversionRate: 0,
  };

  const topFirms = board?.topFirms ?? [];
  const rewardMix = board?.rewardMix ?? { cashback: 0, rr: 0, mixed: 0 };
  const funnelStats = board?.funnel ?? [];
  const firmOptions = useMemo(
    () => ["all", ...Array.from(new Set(rows.map((row) => row.firm)))],
    [rows],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Challenge Purchases"
        subtitle="Tracked funding-account checkout sessions, confirmations, proof and reward decisions."
        actions={<Pill tone="good">Tracking live</Pill>}
      />

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Buy Clicks" value={String(metrics.totalBuyClicks)} delta="Entry-point clicks" tone="flat" />
        <StatCard label="Finalized Purchases" value={String(metrics.finalizedPurchases)} delta={`${metrics.conversionRate}% conversion`} tone="flat" />
        <StatCard label="GMV Tracked" value={`$${metrics.gmvTracked.toFixed(2)}`} delta="Confirmed challenge value" tone="flat" />
        <StatCard label="RR Points Emitted" value={String(metrics.rrPointsEmitted)} delta="Purchase-linked rewards" tone="flat" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr_0.9fr]">
        <Panel title="Top Firms by GMV" action={<Trophy className="h-3.5 w-3.5 text-fuchsia-300" />}>
          {topFirms.length === 0 ? (
            <EmptyPanelText />
          ) : (
            <div className="space-y-3">
              {topFirms.map(({ firm, gmv }, index) => (
                <div key={firm} className="flex items-center justify-between rounded-xl bg-white/[0.03] px-3 py-3 ring-1 ring-white/10">
                  <div className="flex items-center gap-3">
                    <div className="grid h-8 w-8 place-items-center rounded-lg bg-white/10 text-xs font-bold text-white">
                      {index + 1}
                    </div>
                    <div className="text-sm font-semibold text-white">{firm}</div>
                  </div>
                  <div className="text-sm font-bold text-fuchsia-300">${gmv.toFixed(2)}</div>
                </div>
              ))}
            </div>
          )}
        </Panel>

        <Panel title="Reward Preference Mix" action={<Sparkles className="h-3.5 w-3.5 text-fuchsia-300" />}>
          {rows.length === 0 ? (
            <EmptyPanelText />
          ) : (
            <div className="space-y-3">
              <MixRow label="Cashback" value={rewardMix.cashback} />
              <MixRow label="RR" value={rewardMix.rr} />
              <MixRow label="Mixed" value={rewardMix.mixed} />
            </div>
          )}
        </Panel>

        <Panel title="Funnel" action={<Funnel className="h-3.5 w-3.5 text-fuchsia-300" />}>
          <div className="space-y-3">
            {funnelStats.map((item) => (
              <div key={item.step}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="font-semibold text-white">{FUNNEL_LABELS[item.step]}</span>
                  <span className="text-muted-foreground">
                    {item.count} · {item.pct}%
                  </span>
                </div>
                <div className="h-2 rounded-full bg-white/10">
                  <div
                    className="h-2 rounded-full rb-gradient-primary"
                    style={{ width: `${Math.max(item.pct, item.step === "buy_click" ? 100 : 0)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <Panel title="Purchase log" action={<Pill tone="neutral">{filteredRows.length} rows</Pill>}>
        <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search email, firm, program..."
              className="w-full rounded-full border border-white/10 bg-white/[0.04] py-2.5 pl-10 pr-4 text-sm text-white outline-none transition placeholder:text-muted-foreground focus:border-fuchsia-400/40 focus:bg-white/[0.07]"
            />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <select
              value={firmFilter}
              onChange={(event) => setFirmFilter(event.target.value)}
              className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white outline-none transition focus:border-fuchsia-400/40"
            >
              {firmOptions.map((firm) => (
                <option key={firm} value={firm} className="bg-[var(--rb-bg-elevated)] text-white">
                  {firm === "all" ? "All firms" : firm}
                </option>
              ))}
            </select>

            <select
              value={stepFilter}
              onChange={(event) => setStepFilter(event.target.value as ChallengePurchaseStep | "all")}
              className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white outline-none transition focus:border-fuchsia-400/40"
            >
              {STEP_OPTIONS.map((option) => (
                <option key={option.value} value={option.value} className="bg-[var(--rb-bg-elevated)] text-white">
                  {option.label}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => toast.success("Challenge purchases export started")}
              className="inline-flex items-center justify-center gap-2 rounded-full rb-gradient-primary px-4 py-2.5 text-sm font-semibold text-white shadow-[0_0_24px_rgba(192,132,252,0.28)]"
            >
              <Download className="h-4 w-4" />
              Export
            </button>
          </div>
        </div>

        <DataTable
          head={
            <>
              <th>Buyer</th>
              <th>Firm</th>
              <th>Account</th>
              <th>Status</th>
              <th>Price</th>
              <th>Reward</th>
              <th>Proof / Claim</th>
              <th>Reference</th>
              <th>When</th>
            </>
          }
        >
          {filteredRows.length === 0 ? (
            <tr>
              <td colSpan={9} className="text-center text-sm text-muted-foreground">
                {loading ? "Loading challenge purchase records..." : "No challenge purchase records yet."}
              </td>
            </tr>
          ) : (
            filteredRows.map((row) => (
              <tr key={row.id}>
                <td>
                  <div className="text-xs font-semibold text-white">{row.buyerName || "Guest checkout"}</div>
                  <div className="font-mono text-[10px] text-muted-foreground">{row.buyerEmail ?? "-"}</div>
                  {row.guestSessionId ? (
                    <div className="max-w-[140px] truncate font-mono text-[9px] text-muted-foreground" title={row.guestSessionId}>
                      Guest {row.guestSessionId}
                    </div>
                  ) : null}
                </td>
                <td className="font-semibold text-white">{row.firm}</td>
                <td>
                  <div className="text-white/80">{row.program}</div>
                  <div className="text-[10px] text-muted-foreground">
                    {[row.accountSize, row.accountId].filter(Boolean).join(" · ") || "Account not specified"}
                  </div>
                </td>
                <td><Pill tone="neutral">{FUNNEL_LABELS[row.step]}</Pill></td>
                <td className="font-semibold text-violet-200">${row.amountUsd.toFixed(2)}</td>
                <td>
                  <div className="capitalize text-white/80">{row.rewardPreference}</div>
                  <div className="text-[10px] text-muted-foreground">
                    {row.rrPoints > 0 ? `${row.rrPoints} RR` : row.cashbackLabel || "Eligibility pending"}
                  </div>
                </td>
                <td>
                  <div className="text-xs text-white/80">{row.proofUrls?.length ?? 0} file(s)</div>
                  <div className="text-[10px] text-muted-foreground">
                    {row.linkedClaimId ? `Claim #${row.linkedClaimId} · ${row.linkedClaimStatus}` : "No linked claim"}
                  </div>
                </td>
                <td>
                  <div className="max-w-[150px] truncate font-mono text-[10px] text-fuchsia-200" title={row.reference}>
                    {row.reference || "-"}
                  </div>
                  <div
                    className="text-[10px] text-muted-foreground"
                    title={row.statusHistory?.map((item) => `${item.status}: ${item.note || "No note"}`).join("\n")}
                  >
                    {row.statusHistory?.length ?? 0} updates
                  </div>
                  {row.partnerTrackingUrl ? (
                    <a
                      href={row.partnerTrackingUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 inline-flex items-center gap-1 text-[10px] text-violet-200 hover:text-white"
                    >
                      Tracking link <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  ) : null}
                </td>
                <td className="text-xs text-muted-foreground">{new Date(row.when).toLocaleString()}</td>
              </tr>
            ))
          )}
        </DataTable>
      </Panel>
    </div>
  );
}

function EmptyPanelText() {
  return (
    <div className="grid min-h-[220px] place-items-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02] text-sm text-muted-foreground">
      No data yet
    </div>
  );
}

function MixRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-white/[0.03] px-3 py-3 ring-1 ring-white/10">
      <div className="text-sm font-semibold text-white">{label}</div>
      <div className="inline-flex items-center gap-2 text-sm font-bold text-fuchsia-300">
        <Coins className="h-4 w-4" />
        {value}
      </div>
    </div>
  );
}
