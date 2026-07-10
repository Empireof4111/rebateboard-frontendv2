import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { TrustScoreCard } from "@/components/tbi/OnboardingPrimitives";
import { CATEGORY_META, useBrandApplicationSettings, type BrandCategory } from "@/lib/tbi-onboarding";
import { Shield, ArrowRight, CheckCircle2, Sparkles, TrendingUp, Lock, Bell, Mail } from "lucide-react";

export const Route = createFileRoute("/business/join")({
  head: () => ({
    meta: [
      { title: "List Your Brand — Build Your Trust Profile | RebateBoard" },
      { name: "description", content: "Apply to be listed on RebateBoard. Build a verified Trust Profile across prop firms, brokers, exchanges and tools." },
      { property: "og:title", content: "Build Your Trust Profile — RebateBoard for Business" },
      { property: "og:description", content: "Get listed, get verified, win the trust of millions of traders." },
    ],
  }),
  component: BusinessJoinPage,
});

const BENEFITS = [
  { icon: Shield, title: "Verified Trust Profile", text: "Independent TBI score backed by real trader data — not paid ranking." },
  { icon: TrendingUp, title: "Direct trader access", text: "Be discovered by 48,000+ active traders evaluating brands every day." },
  { icon: Sparkles, title: "Live unlock journey", text: "Watch your score grow from preliminary to fully verified as reviews roll in." },
  { icon: CheckCircle2, title: "Free baseline listing", text: "No fees to apply. Premium placement only when you actively engage." },
];

function BusinessJoinPage() {
  const applicationSettings = useBrandApplicationSettings();

  if (!applicationSettings.enabled) {
    return (
      <div className="min-h-screen bg-[#0b0418] text-foreground">
        <SiteHeader />
        <main className="container-app py-8 sm:py-10">
          <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-violet-900/30 via-fuchsia-900/10 to-[#0b0418] p-8 text-center md:p-14">
            <div className="absolute inset-x-16 top-0 h-40 rounded-full bg-fuchsia-500/20 blur-3xl" />
            <div className="relative mx-auto max-w-2xl">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-white/10 bg-white/10 text-fuchsia-200 shadow-[0_0_34px_rgba(192,132,252,0.22)]">
                <Shield className="h-6 w-6" />
              </div>
              <div className="mt-5 text-[11px] font-semibold uppercase tracking-[0.24em] text-fuchsia-200/80">Brand Applications</div>
              <h1 className="mt-3 text-3xl font-bold leading-tight md:text-5xl">Brand Applications Are Temporarily Closed</h1>
              <p className="mt-4 text-sm leading-7 text-muted-foreground md:text-base">
                We're currently reviewing submitted applications. Applications will reopen soon.
                Thank you for your interest in joining RebateBoard.
              </p>
              <div className="mt-7 flex flex-wrap justify-center gap-3">
                <Link to="/contact" className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:border-fuchsia-300/40">
                  <Bell className="h-4 w-4 text-fuchsia-200" /> Notify Me
                </Link>
                <Link to="/contact" className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-600 px-5 py-3 text-sm font-bold text-white shadow-[0_0_28px_rgba(192,132,252,0.35)] transition hover:brightness-110">
                  <Mail className="h-4 w-4" /> Contact Us
                </Link>
              </div>
            </div>
          </section>
        </main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0418] text-foreground">
      <SiteHeader />
      <main className="container-app py-8 sm:py-10">
        {/* HERO */}
        <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-violet-900/30 via-fuchsia-900/10 to-[#0b0418] p-8 md:p-12">
          <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-fuchsia-500/20 blur-3xl" />
          <div className="absolute -left-10 bottom-0 h-60 w-60 rounded-full bg-violet-500/20 blur-3xl" />
          <div className="relative grid gap-10 md:grid-cols-[1.4fr_1fr] md:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-fuchsia-200">
                <Shield className="h-3.5 w-3.5" /> RebateBoard for Business
              </div>
              <h1 className="mt-4 text-4xl font-bold leading-tight md:text-6xl">
                Build your <span className="bg-gradient-to-r from-fuchsia-400 to-violet-300 bg-clip-text text-transparent">Trust Profile</span>
              </h1>
              <p className="mt-4 max-w-xl text-base text-muted-foreground md:text-lg">
                You're not submitting a listing — you're opening a verified trust journey. Get an instant Preliminary Score, then unlock full TBI as real traders verify their experience.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <a href="#categories" className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-600 px-6 py-3 text-sm font-bold text-white shadow-[0_0_30px_rgba(192,132,252,0.4)] transition hover:brightness-110">
                  Start your application <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                </a>
                <Link to="/tbi" className="rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold backdrop-blur hover:border-white/30">
                  How TBI Works
                </Link>
              </div>
              <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-[11px] text-muted-foreground">
                <div className="flex items-center gap-1"><Lock className="h-3 w-3 text-emerald-300" /> No upfront fees</div>
                <div className="flex items-center gap-1"><Lock className="h-3 w-3 text-emerald-300" /> Reviewed within 48h</div>
                <div className="flex items-center gap-1"><Lock className="h-3 w-3 text-emerald-300" /> You own your data</div>
              </div>
            </div>

            {/* Live preview card */}
            <div className="space-y-3">
              <TrustScoreCard score={null} status="none" helperText="Your future preview — start the application to begin scoring." />
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-xs">
                <div className="font-bold text-white/90">Your unlock journey</div>
                <ol className="mt-2 space-y-1.5 text-muted-foreground">
                  <li>1️⃣ Submit data → <span className="text-fuchsia-300">Preliminary score (≤ 6.5)</span></li>
                  <li>2️⃣ 5+ reviews → <span className="text-amber-300">Partially unlocked</span></li>
                  <li>3️⃣ 10+ reviews → <span className="text-emerald-300">Fully verified TBI</span></li>
                </ol>
              </div>
            </div>
          </div>
        </section>

        {/* BENEFITS */}
        <section className="mt-10 grid gap-4 md:grid-cols-4">
          {BENEFITS.map((b) => (
            <div key={b.title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-sm transition hover:border-fuchsia-400/30">
              <b.icon className="h-5 w-5 text-fuchsia-300" />
              <div className="mt-2 text-sm font-bold">{b.title}</div>
              <p className="mt-1 text-xs text-muted-foreground">{b.text}</p>
            </div>
          ))}
        </section>

        {/* CATEGORIES */}
        <section id="categories" className="mt-12 scroll-mt-24">
          <div className="mb-5">
            <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-fuchsia-300/80">Choose your category</div>
            <h2 className="mt-1 text-2xl font-bold md:text-3xl">What kind of brand are you?</h2>
            <p className="mt-1 text-sm text-muted-foreground">Each category has a tailored onboarding flow.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {(Object.keys(CATEGORY_META) as BrandCategory[]).map((cat) => {
              const meta = CATEGORY_META[cat];
              return (
                <Link
                  key={cat}
                  to="/business/onboarding/$category"
                  params={{ category: cat }}
                  className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-white/[0.02] p-5 transition hover:border-fuchsia-400/40 hover:shadow-[0_0_28px_rgba(192,132,252,0.18)]"
                >
                  <div className="text-3xl">{meta.emoji}</div>
                  <div className="mt-3 text-lg font-bold">{meta.label}</div>
                  <p className="mt-1 text-xs text-muted-foreground">{meta.tagline}</p>
                  <div className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-fuchsia-300">
                    Start application <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" />
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="mt-12 rounded-3xl border border-white/10 bg-white/[0.02] p-8 md:p-10">
          <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-fuchsia-300/80">The process</div>
          <h2 className="mt-1 text-2xl font-bold md:text-3xl">From submission to fully verified — in 4 steps</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-4">
            {[
              { n: 1, t: "Apply", d: "Walk through 7 guided steps with live score feedback." },
              { n: 2, t: "Review", d: "Our team verifies submitted documents within 48h." },
              { n: 3, t: "Publish", d: "Your public profile goes live with a Preliminary Score." },
              { n: 4, t: "Unlock", d: "As traders verify their experience, your TBI grows." },
            ].map((s) => (
              <div key={s.n} className="relative">
                <div className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-fuchsia-500 to-violet-600 text-sm font-bold text-white shadow-[0_0_20px_rgba(192,132,252,0.4)]">{s.n}</div>
                <div className="mt-3 text-sm font-bold">{s.t}</div>
                <p className="mt-1 text-xs text-muted-foreground">{s.d}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
