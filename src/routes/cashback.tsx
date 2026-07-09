import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BadgeCheck,
  Banknote,
  Building2,
  CheckCircle2,
  CircleDollarSign,
  Link2,
  ReceiptText,
  ShieldCheck,
  WalletCards,
} from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export const Route = createFileRoute("/cashback")({
  component: CashbackPage,
});

const steps = [
  ["Choose a supported brand", "Browse eligible brokers, prop firms, exchanges, and trading services.", Building2],
  ["Use the tracked RebateBoard link", "Start from RebateBoard so the partner visit can be matched to your activity.", Link2],
  ["Complete the required action", "Open, fund, purchase, or trade on the eligible account as described.", ReceiptText],
  ["Submit proof when requested", "Attach the requested confirmation so the claim can be reviewed accurately.", BadgeCheck],
  ["Receive approved cashback", "Approved cashback appears in your wallet and becomes available under the stated terms.", WalletCards],
] as const;

const explanations = [
  {
    title: "New users",
    copy: "Start through the RebateBoard tracking link and use the same account details throughout registration and checkout.",
  },
  {
    title: "Existing broker users",
    copy: "Eligibility varies by partner. Some brands support account transfers or new sub-accounts, while others are limited to new registrations.",
  },
  {
    title: "Tracking and verification",
    copy: "RebateBoard combines tracked partner activity with submitted proof and partner confirmation before approving a reward.",
  },
  {
    title: "Wallet and withdrawals",
    copy: "Approved cashback is credited to your RebateBoard wallet. Withdrawal availability follows your account and verification status.",
  },
];

const faqs = [
  ["Is RebateBoard cashback free to use?", "Yes. Traders do not pay RebateBoard to browse eligible programs or submit a valid cashback claim."],
  ["When will cashback appear?", "Timing depends on the brand, qualifying activity, and verification cycle. Your claim status remains visible in your dashboard."],
  ["Can I claim without using a tracked link?", "Usually no. The tracked link is the clearest way to connect eligible activity to your RebateBoard account."],
  ["What proof may be required?", "Depending on the offer, this can include an order confirmation, account identifier, transaction reference, or partner receipt."],
];

function CashbackPage() {
  return (
    <div className="min-h-screen overflow-x-hidden">
      <SiteHeader />
      <main className="container-app pb-16 pt-8 sm:pt-12">
        <section className="grid items-center gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-primary/12 px-3 py-1 text-[11px] font-bold text-primary ring-1 ring-primary/25">
              <CircleDollarSign className="h-3.5 w-3.5" /> RebateBoard Cashback
            </span>
            <h1 className="mt-5 max-w-3xl text-4xl font-bold leading-tight sm:text-5xl">
              Reduce trading costs with <span className="text-gradient">trackable cashback.</span>
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
              RebateBoard shares eligible partner rewards with traders after the required signup,
              purchase, funding, or trading activity has been verified.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/programs" className="rounded-full bg-primary px-5 py-3 text-sm font-bold text-white">
                Browse Cashback Programs
              </Link>
              <Link
                to="/"
                hash="cashback-calculator"
                className="rounded-full bg-white/5 px-5 py-3 text-sm font-bold text-white ring-1 ring-white/15"
              >
                Open Cashback Calculator
              </Link>
            </div>
          </div>
          <div className="glass-strong rounded-3xl p-6">
            <ShieldCheck className="h-10 w-10 text-primary" />
            <h2 className="mt-4 text-xl font-bold">What is RebateBoard Cashback?</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Cashback is a verified return of part of an eligible commission, fee, or partner
              reward. Availability and value depend on the selected brand, account, region, and
              qualifying activity.
            </p>
          </div>
        </section>

        <section className="mt-12">
          <h2 className="text-2xl font-bold sm:text-3xl">How cashback works</h2>
          <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            {steps.map(([title, copy, Icon], index) => (
              <article key={title} className="glass rounded-2xl p-4">
                <div className="flex items-center justify-between">
                  <Icon className="h-5 w-5 text-primary" />
                  <span className="text-xs font-black text-white/35">0{index + 1}</span>
                </div>
                <h3 className="mt-4 text-sm font-bold">{title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{copy}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-12 grid gap-4 md:grid-cols-2">
          {explanations.map((item) => (
            <article key={item.title} className="glass rounded-2xl p-5">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              <h3 className="mt-3 text-lg font-bold">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.copy}</p>
            </article>
          ))}
        </section>

        <section className="mt-12 glass-strong rounded-3xl p-6 sm:p-8">
          <div className="grid gap-7 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <Banknote className="h-8 w-8 text-primary" />
              <h2 className="mt-4 text-2xl font-bold">Cashback FAQs</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Clear answers before you choose a program or submit a claim.
              </p>
            </div>
            <div className="grid gap-3">
              {faqs.map(([question, answer]) => (
                <details key={question} className="rounded-2xl bg-white/[0.04] p-4 ring-1 ring-white/10">
                  <summary className="cursor-pointer text-sm font-semibold">{question}</summary>
                  <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{answer}</p>
                </details>
              ))}
            </div>
          </div>
          <div className="mt-7 flex flex-wrap gap-3 border-t border-white/10 pt-6">
            <Link to="/programs" className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-bold text-white">
              Browse Cashback Programs <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/dashboard/claims" className="rounded-full bg-white/5 px-5 py-3 text-sm font-bold ring-1 ring-white/15">
              Learn How Claims Work
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
