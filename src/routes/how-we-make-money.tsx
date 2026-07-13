import { createFileRoute, Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import {
  ArrowRight,
  BadgeDollarSign,
  Building2,
  CheckCircle2,
  Gift,
  Handshake,
  LockKeyhole,
  Megaphone,
  ShieldCheck,
  Bot,
  WalletCards,
  XCircle,
} from "lucide-react";

export const Route = createFileRoute("/how-we-make-money")({
  head: () => ({
    meta: [
      { title: "How RebateBoard Makes Money | Transparency" },
      {
        name: "description",
        content:
          "Learn how RebateBoard earns revenue through transparent partnerships while keeping trust scores, reviews, complaints, and editorial integrity independent.",
      },
    ],
  }),
  component: HowWeMakeMoneyPage,
});

const revenueSources = [
  {
    icon: Handshake,
    title: "Affiliate Partnerships",
    text: "We may receive commissions from selected partners when traders join through tracked RebateBoard links. This does not influence reviews or TBI scores.",
  },
  {
    icon: WalletCards,
    title: "Cashback Sharing",
    text: "Partners share part of their commission with RebateBoard. We return most of that value back to traders through cashback.",
  },
  {
    icon: Megaphone,
    title: "Featured Promotions",
    text: "Brands may sponsor educational campaigns or promotional placements. Sponsored content is always clearly labeled.",
  },
  {
    icon: Bot,
    title: "Future Rebeta Pro",
    text: "Advanced AI features will eventually be available through an optional premium subscription. Core transparency tools will remain free.",
  },
  {
    icon: Building2,
    title: "Enterprise Solutions",
    text: "Future APIs, analytics, and business tools may help partners understand performance without changing independent trust signals.",
  },
];

const neverForSale = [
  "TBI Scores",
  "Reviews",
  "Complaints",
  "Transparency",
  "Verification",
  "Editorial Reviews",
  "Trust Ratings",
];

const partnerReasons = [
  "Qualified trader audience",
  "Verified reviews",
  "Independent trust signals",
  "Performance analytics",
  "Long-term relationships",
  "Transparent growth",
];

const faqs = [
  {
    q: "Why do brands pay RebateBoard?",
    a: "Brands partner with RebateBoard to reach serious traders, promote verified offers, and participate in a more transparent marketplace.",
  },
  {
    q: "How is cashback possible?",
    a: "Some partners share commission with RebateBoard. We return much of that value to traders as cashback once activity is verified.",
  },
  {
    q: "Does paying RebateBoard improve TBI?",
    a: "No. TBI is based on trust data, transparency, reviews, complaints, and verification signals. It is never sold.",
  },
  {
    q: "Can brands buy better reviews?",
    a: "No. Reviews are moderated for quality and integrity. Sponsored placement and review outcomes are separate systems.",
  },
  {
    q: "Will RebateBoard always be free?",
    a: "Core transparency features will remain available. Future premium AI features may be optional through Rebeta Pro.",
  },
  {
    q: "What is Rebeta Pro?",
    a: "Rebeta Pro is our future premium AI layer for deeper trading intelligence, automation, and advanced research workflows.",
  },
];

function HowWeMakeMoneyPage() {
  return (
    <div className="min-h-screen bg-[var(--rb-bg-canvas)] text-foreground">
      <SiteHeader />
      <main className="container-app py-8 sm:py-10">
        <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-violet-900/30 via-violet-900/10 to-[#0b0418] p-8 md:p-14">
          <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-violet-500/20 blur-3xl" />
          <div className="absolute -left-12 bottom-0 h-64 w-64 rounded-full bg-violet-500/20 blur-3xl" />
          <div className="relative max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-violet-200">
              <ShieldCheck className="h-3.5 w-3.5" /> Transparency
            </div>
            <h1 className="mt-5 text-4xl font-bold leading-tight md:text-6xl">How RebateBoard Makes Money</h1>
            <p className="mt-4 max-w-2xl text-base leading-8 text-muted-foreground md:text-lg">
              We believe every trader deserves to understand exactly how the platform they use earns revenue.
              Our business only succeeds when our community succeeds.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link to="/programs" className="inline-flex items-center gap-2 rounded-full rb-gradient-primary px-6 py-3 text-sm font-bold text-white shadow-[0_0_30px_rgba(192,132,252,0.35)] transition hover:brightness-110">
                Browse Trusted Brands <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/signup" className="rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:border-violet-300/40">
                Create Free Account
              </Link>
            </div>
          </div>
        </section>

        <section className="mt-10 grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <GlassPanel eyebrow="Our philosophy" title="Trust Before Revenue">
            <p className="text-sm leading-7 text-muted-foreground">
              RebateBoard was built to solve transparency problems in trading, not to maximize short-term profit.
              Most platforms ask traders to trust them before proving their value. RebateBoard does the opposite:
              we make the model visible, label sponsored placements clearly, and keep trust data independent.
            </p>
          </GlassPanel>
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 md:p-6">
            <div className="grid gap-3 md:grid-cols-4">
              {["Transparency", "Verification", "Cashback", "Community"].map((item, index) => (
                <div key={item} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="grid h-9 w-9 place-items-center rounded-xl bg-violet-500/15 text-violet-200 ring-1 ring-violet-300/20">{index + 1}</div>
                  <div className="mt-3 text-sm font-bold">{item}</div>
                  <div className="mt-2 h-1 rounded-full bg-white/10">
                    <div className="h-full rounded-full bg-gradient-to-r from-violet-400 to-violet-400" style={{ width: `${55 + index * 12}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-10">
          <SectionHeader eyebrow="Revenue sources" title="Clear ways we sustain the platform" />
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {revenueSources.map((source) => (
              <div key={source.title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:-translate-y-0.5 hover:border-violet-300/30">
                <source.icon className="h-5 w-5 text-violet-200" />
                <h3 className="mt-3 text-sm font-bold">{source.title}</h3>
                <p className="mt-2 text-xs leading-6 text-muted-foreground">{source.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-10 grid gap-5 lg:grid-cols-2">
          <GlassPanel eyebrow="Independence" title="What Never Influences Rankings">
            <div className="mt-1 grid gap-2 sm:grid-cols-2">
              {neverForSale.map((item) => (
                <div key={item} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm font-semibold">
                  <XCircle className="h-4 w-4 text-rose-300" /> {item}
                </div>
              ))}
            </div>
            <p className="mt-5 text-sm leading-7 text-muted-foreground">No business can pay to improve these. Trust is our business model, so trust cannot be for sale.</p>
          </GlassPanel>

          <GlassPanel eyebrow="Cashback flow" title="Why Cashback Exists">
            <div className="grid gap-3 sm:grid-cols-4">
              {[
                { label: "Brand", icon: Building2 },
                { label: "Partner Commission", icon: BadgeDollarSign },
                { label: "RebateBoard", icon: ShieldCheck },
                { label: "Trader Cashback", icon: Gift },
              ].map((step, index) => (
                <div key={step.label} className="relative rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-center">
                  <step.icon className="mx-auto h-5 w-5 text-violet-200" />
                  <div className="mt-2 text-xs font-bold">{step.label}</div>
                  {index < 3 && <ArrowRight className="absolute -right-4 top-1/2 hidden h-4 w-4 -translate-y-1/2 text-violet-200/70 sm:block" />}
                </div>
              ))}
            </div>
            <p className="mt-5 text-sm leading-7 text-muted-foreground">
              When a partner shares commission, RebateBoard returns the majority to the trader. That is how the platform can help traders lower costs while staying aligned with verified brands.
            </p>
          </GlassPanel>
        </section>

        <section className="mt-10">
          <SectionHeader eyebrow="Partner value" title="Why trusted brands work with us" />
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {partnerReasons.map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm font-semibold">
                <CheckCircle2 className="h-4 w-4 text-emerald-300" /> {item}
              </div>
            ))}
          </div>
        </section>

        <section className="mt-10 rounded-3xl border border-violet-300/15 bg-gradient-to-br from-violet-500/10 via-white/[0.03] to-violet-600/10 p-8 md:p-10">
          <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-violet-200/80">Our commitment</div>
              <h2 className="mt-2 text-3xl font-bold md:text-4xl">Our Transparency Promise</h2>
            </div>
            <div className="space-y-3 text-sm leading-7 text-muted-foreground">
              <p>We will always disclose sponsored content. We will never sell trust.</p>
              <p>Core transparency tools will remain available because RebateBoard exists to help traders make better decisions, not manipulate them.</p>
            </div>
          </div>
        </section>

        <section className="mt-10">
          <SectionHeader eyebrow="FAQ" title="Common questions" />
          <div className="mt-5 grid gap-3">
            {faqs.map((faq) => (
              <details key={faq.q} className="group rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <summary className="cursor-pointer list-none text-sm font-bold text-white">
                  <span>{faq.q}</span>
                  <span className="float-right text-violet-200 transition group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">{faq.a}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="mt-10 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-violet-600/20 via-violet-500/10 to-white/[0.03] p-8 text-center md:p-12">
          <LockKeyhole className="mx-auto h-7 w-7 text-violet-200" />
          <h2 className="mt-4 text-3xl font-bold md:text-4xl">Ready to Experience Trading Built on Trust?</h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
            Explore transparent brands, verified reviews, cashback, and trust data designed around trader confidence.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link to="/signup" className="rounded-full rb-gradient-primary px-6 py-3 text-sm font-bold text-white shadow-[0_0_28px_rgba(192,132,252,0.35)]">
              Create Free Account
            </Link>
            <Link to="/programs" className="rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white">
              Browse Trusted Brands
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

function SectionHeader({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div>
      <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-violet-200/80">{eyebrow}</div>
      <h2 className="mt-2 text-2xl font-bold md:text-3xl">{title}</h2>
    </div>
  );
}

function GlassPanel({ eyebrow, title, children }: { eyebrow: string; title: string; children: ReactNode }) {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl md:p-8">
      <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-violet-200/80">{eyebrow}</div>
      <h2 className="mt-2 text-2xl font-bold md:text-3xl">{title}</h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}
