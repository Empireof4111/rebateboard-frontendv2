import { createFileRoute, Link } from "@tanstack/react-router";
import { Brain, ChartNoAxesCombined, CircleDollarSign, Compass, DatabaseZap, Handshake, ShieldCheck, Sparkles, Users } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About RebateBoard" },
      { name: "description", content: "RebateBoard is building the transparency layer for trading with trust data, cashback, rewards, and intelligent tools." },
    ],
  }),
  component: AboutPage,
});

const principles = [
  { title: "Transparency First", body: "Trust must be supported by visible evidence, not marketing claims.", icon: ShieldCheck },
  { title: "Trader First", body: "Every product decision should create genuine trader value.", icon: Users },
  { title: "Independence Matters", body: "Sponsored relationships must not buy trust scores, reviews, or editorial outcomes.", icon: Handshake },
  { title: "Build With Data", body: "Important decisions should be supported by verifiable information.", icon: DatabaseZap },
  { title: "Earn Trust Continuously", body: "Trust is not permanent. It must be maintained through behavior.", icon: ChartNoAxesCombined },
  { title: "Community Shapes the Product", body: "Real feedback should guide future product decisions.", icon: Compass },
];

const pillars = [
  { title: "Trust", body: "TBI, verified reviews, complaints, payouts, and transparency signals.", icon: ShieldCheck },
  { title: "Financial", body: "Cashback, wallet activity, ROI tracking, payouts, and cost reduction.", icon: CircleDollarSign },
  { title: "Rewards", body: "RR, trader levels, milestones, unlocks, and meaningful participation.", icon: Sparkles },
  { title: "Intelligence", body: "Rebeta AI, plans, journals, analytics, and personal trading context.", icon: Brain },
];

function AboutPage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#3d1364_0%,#140821_55%,#0a0613_100%)] text-white">
      <SiteHeader />
      <main className="container-app space-y-8 py-8 sm:py-12">
        <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.045] p-6 shadow-[0_30px_100px_rgba(0,0,0,0.35)] md:p-10">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/15 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-violet-100 ring-1 ring-primary/20">
              <ShieldCheck className="h-3.5 w-3.5" />
              About RebateBoard
            </div>
            <h1 className="mt-5 max-w-4xl text-4xl font-black leading-tight md:text-6xl">
              Building the Transparency Layer for Trading
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-8 text-white/68">
              RebateBoard helps traders discover, evaluate, and interact with trading brands through transparency, trusted data, cashback, rewards, and intelligent tools.
            </p>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.045] p-6">
            <h2 className="text-2xl font-black">Our Story</h2>
            <div className="mt-4 space-y-4 text-sm leading-7 text-white/65">
              <p>
                RebateBoard started from a simple trader problem: it was too hard to know which brands could be trusted, where cashback was actually trackable, and how trader activity could create long-term value.
              </p>
              <p>
                The platform began with cashback and rebate discovery, then evolved into RebateBoard 2.0: a wider trust, financial, rewards, and intelligence ecosystem for brokers, prop firms, exchanges, tools, and trader communities.
              </p>
              <p>
                Our work is focused on one mission: help traders earn more, lose less, and make better decisions.
              </p>
            </div>
          </div>
          <div className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-primary/16 to-white/[0.035] p-6">
            <h2 className="text-2xl font-black">Vision</h2>
            <p className="mt-4 text-sm leading-7 text-white/65">
              A global trading ecosystem where trust can be measured, brand transparency is visible, trader activity produces real value, cashback reduces trading costs, and AI helps traders understand their behavior.
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {["Trust can be measured", "Rewards are earned", "Data supports better decisions", "AI understands context"].map((item) => (
                <div key={item} className="rounded-2xl border border-white/10 bg-white/[0.045] p-3 text-sm font-bold text-white/85">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section>
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl font-black">Living Principles</h2>
              <p className="mt-2 text-sm text-white/58">The product should earn trust in the same way we ask brands to earn it.</p>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {principles.map((item) => (
              <div key={item.title} className="rounded-3xl border border-white/10 bg-white/[0.045] p-5 transition hover:-translate-y-1 hover:bg-white/[0.065]">
                <item.icon className="h-5 w-5 text-violet-200" />
                <h3 className="mt-4 text-lg font-black">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-white/58">{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[2rem] border border-white/10 bg-white/[0.045] p-6 md:p-8">
          <h2 className="text-3xl font-black">Platform Pillars</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {pillars.map((item) => (
              <div key={item.title} className="rounded-3xl border border-white/10 bg-black/15 p-5">
                <item.icon className="h-5 w-5 text-violet-200" />
                <h3 className="mt-4 text-lg font-black">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-white/58">{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[2rem] border border-white/10 bg-gradient-to-r from-fuchsia-500/15 to-violet-600/15 p-6 text-center md:p-10">
          <h2 className="text-3xl font-black md:text-4xl">See What We’re Building</h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-white/65">
            Explore the marketplace, meet Rebeta, compare trusted brands, or create your free trader account.
          </p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Link to="/" className="rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-600 px-5 py-3 text-sm font-black text-white">Explore RebateBoard</Link>
            <Link to="/signup" className="rounded-full border border-white/12 px-5 py-3 text-sm font-bold text-white/82">Create Free Account</Link>
            <Link to="/dashboard/ai-coach" className="rounded-full border border-white/12 px-5 py-3 text-sm font-bold text-white/82">Meet Rebeta</Link>
            <Link to="/programs" className="rounded-full border border-white/12 px-5 py-3 text-sm font-bold text-white/82">Browse Trusted Brands</Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
