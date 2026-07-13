import { ArrowRight, Clock3, Sparkles } from "lucide-react";
import { SiteHeader } from "./SiteHeader";
import { SiteFooter } from "./SiteFooter";

export type ComingSoonPageProps = {
  title: string;
  description: string;
  eyebrow?: string;
};

export function ComingSoonPage({
  title,
  description,
  eyebrow = "Coming Soon",
}: ComingSoonPageProps) {
  return (
    <div className="min-h-screen bg-[var(--rb-bg-canvas)] text-white">
      <SiteHeader />

      <main className="container-app py-10 sm:py-14 lg:py-16">
        <section className="mx-auto max-w-4xl overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-[0_20px_80px_rgba(91,33,182,0.22)] sm:p-8 lg:p-10">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-violet-300/25 bg-violet-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-violet-100">
              <Clock3 className="h-3.5 w-3.5" />
              {eyebrow}
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs text-white/70">
              <Sparkles className="h-3.5 w-3.5 text-violet-200" />
              RebateBoard 2.0
            </span>
          </div>

          <div className="mt-8 max-w-2xl">
            <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
              {title}
            </h1>
            <p className="mt-4 text-sm leading-7 text-white/68 sm:text-base">
              {description}
            </p>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              href="/"
              className="inline-flex items-center justify-center gap-2 rounded-full rb-gradient-primary px-5 py-2.5 text-sm font-semibold text-white shadow-[0_0_28px_rgba(192,132,252,0.34)] transition hover:opacity-95"
            >
              Back to homepage
              <ArrowRight className="h-4 w-4" />
            </a>
            <a
              href="/dashboard"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-5 py-2.5 text-sm font-semibold text-white/85 transition hover:border-violet-300/35 hover:bg-white/[0.08]"
            >
              Go to dashboard
            </a>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
