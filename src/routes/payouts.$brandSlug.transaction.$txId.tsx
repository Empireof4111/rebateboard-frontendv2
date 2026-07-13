import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { BRANDS, TRANSACTIONS, fmtUsd, fmtMins } from "@/lib/payouts-data";
import { CheckCircle2, AlertTriangle, Hourglass, Copy, ExternalLink, ChevronRight, Flag } from "lucide-react";

export const Route = createFileRoute("/payouts/$brandSlug/transaction/$txId")({
  loader: ({ params }) => {
    const tx = TRANSACTIONS.find((t) => t.id === params.txId && t.brandSlug === params.brandSlug);
    if (!tx) throw notFound();
    const brand = BRANDS.find((b) => b.slug === tx.brandSlug)!;
    return { tx, brand };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `Payout ${loaderData?.tx.id} — ${loaderData?.brand.name} — RebateBoard` },
      { name: "description", content: "On-chain verified prop firm payout transaction details." },
    ],
  }),
  notFoundComponent: () => (
    <div className="min-h-screen bg-[var(--rb-bg-canvas)] text-white"><SiteHeader />
      <div className="container-app max-w-2xl py-16 text-center sm:py-20">
        <h1 className="text-3xl font-bold">Transaction not found</h1>
        <Link to="/payouts" className="mt-4 inline-block text-violet-300">← Back to Payouts</Link>
      </div>
      <SiteFooter />
    </div>
  ),
  errorComponent: ({ error }) => <div className="min-h-screen bg-[var(--rb-bg-canvas)] text-white p-8">{error.message}</div>,
  component: TxPage,
});

function VerifBadge({ status }: { status: string }) {
  const map: Record<string, { cls: string; icon: any; label: string }> = {
    verified: { cls: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30", icon: CheckCircle2, label: "Verified" },
    pending: { cls: "bg-yellow-500/15 text-yellow-300 border-yellow-500/30", icon: Hourglass, label: "Pending" },
    flagged: { cls: "bg-red-500/15 text-red-300 border-red-500/30", icon: AlertTriangle, label: "Flagged" },
  };
  const v = map[status] ?? map.verified; const Icon = v.icon;
  return <span className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs ${v.cls}`}><Icon className="h-3.5 w-3.5" /> {v.label}</span>;
}

function Row({ label, value, mono }: { label: string; value: any; mono?: boolean }) {
  return (
    <div className="flex justify-between items-center gap-4 border-b border-white/5 py-3">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={`text-sm text-right ${mono ? "font-mono" : ""}`}>{value}</span>
    </div>
  );
}

function TxPage() {
  const { tx, brand } = Route.useLoaderData();
  return (
    <div className="min-h-screen bg-[var(--rb-bg-canvas)] text-white">
      <SiteHeader />
      <main className="container-app max-w-3xl space-y-6 py-6 sm:py-8">
        <div className="text-xs text-muted-foreground">
          <Link to="/payouts" className="hover:text-white">Payouts</Link> <ChevronRight className="inline h-3 w-3" />{" "}
          <Link to="/payouts/$brandSlug" params={{ brandSlug: brand.slug }} className="hover:text-white">{brand.name}</Link>{" "}
          <ChevronRight className="inline h-3 w-3" /> Transaction
        </div>

        <section className="glass rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${brand.logoColor}`} />
              <div>
                <div className="text-xs text-muted-foreground">Payout from</div>
                <div className="text-lg font-semibold">{brand.name}</div>
              </div>
            </div>
            <VerifBadge status={tx.verificationStatus} />
          </div>

          <div className="text-center py-6 border-y border-white/5">
            <div className="text-xs text-muted-foreground">Amount Paid</div>
            <div className="text-5xl font-bold text-emerald-300 mt-2">{fmtUsd(tx.amountUsd)}</div>
            <div className="text-sm text-muted-foreground mt-1">{tx.originalAmount} {tx.currency} · {tx.chain}</div>
          </div>

          <div className="mt-4">
            <Row label="Currency" value={tx.currency} />
            <Row label="Chain" value={tx.chain} />
            <Row label="Account Size" value={fmtUsd(tx.accountSizeUsd)} />
            <Row label="Return %" value={`${tx.returnPercent}%`} />
            <Row label="Region" value={tx.region} />
            <Row label="Payout Requested" value={new Date(tx.payoutRequestedAt).toLocaleString()} />
            <Row label="Payout Received" value={new Date(tx.payoutReceivedAt).toLocaleString()} />
            <Row label="Waiting Time" value={<span className="text-emerald-300">{fmtMins(tx.payoutTimeMinutes)}</span>} />
            <Row label="Block Confirmation" value={<span className="text-emerald-300">Confirmed</span>} />
            <Row label="From Wallet" value={tx.fromWalletMasked} mono />
            <Row label="To Wallet" value={tx.toWalletMasked} mono />
            <Row label="TX Hash" value={<span className="font-mono">{tx.txHash.slice(0, 10)}...{tx.txHash.slice(-6)}</span>} />
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <button onClick={() => navigator.clipboard?.writeText(tx.txHash)} className="glass rounded-full px-4 py-2 text-xs inline-flex items-center gap-2"><Copy className="h-3.5 w-3.5" /> Copy TX Hash</button>
            <a href={`${tx.explorerUrl}${tx.txHash}`} target="_blank" rel="noopener" className="rounded-full rb-gradient-primary px-4 py-2 text-xs font-semibold inline-flex items-center gap-2"><ExternalLink className="h-3.5 w-3.5" /> Open in Explorer</a>
            <button className="glass rounded-full px-4 py-2 text-xs inline-flex items-center gap-2"><Flag className="h-3.5 w-3.5" /> Report Incorrect Data</button>
          </div>
        </section>

        <Link to="/payouts/$brandSlug" params={{ brandSlug: brand.slug }} className="block text-center text-sm text-violet-300">
          ← Back to {brand.name} payout profile
        </Link>
      </main>
    <SiteFooter />
    </div>
  );
}
