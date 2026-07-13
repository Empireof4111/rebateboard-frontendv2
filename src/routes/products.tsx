import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Bot,
  Calculator,
  CalendarCheck,
  ChartNoAxesCombined,
  ClipboardList,
  LineChart,
  NotebookPen,
  ShieldCheck,
  Trophy,
  WalletCards,
} from "lucide-react";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/products")({
  head: () => ({
    meta: [
      { title: "Products | RebateBoard" },
      {
        name: "description",
        content:
          "Explore RebateBoard tools for trading plans, journals, Rebeta AI, Trader TBI, rewards, cashback calculations, and payout tracking.",
      },
    ],
  }),
  component: ProductsPage,
});

const products = [
  {
    title: "Trading Journal",
    body: "Log trades, screenshots, strategy notes, and backend-calculated performance insights.",
    to: "/trading-journals",
    icon: NotebookPen,
  },
  {
    title: "Trading Plan",
    body: "Turn goals, risk rules, and routines into a structured operating plan.",
    to: "/trading-plan",
    icon: ClipboardList,
  },
  {
    title: "AI Backtesting Lab",
    body: "Explore trading ideas with guided strategy testing and AI-assisted analysis.",
    to: "/ai-backtesting-lab",
    icon: ChartNoAxesCombined,
  },
  {
    title: "Trader TBI",
    body: "Understand your own trust, consistency, verification, and platform contribution score.",
    to: "/trader-tbi",
    icon: ShieldCheck,
  },
  {
    title: "Trader Return Tracker",
    body: "Track real return across costs, payouts, cashback, rewards, and trading outcomes.",
    to: "/trt",
    icon: LineChart,
  },
  {
    title: "Rebeta AI",
    body: "Ask a trading copilot that understands your RebateBoard activity and trading context.",
    to: "/rebeta-ai",
    icon: Bot,
  },
  {
    title: "Rebate Rewards",
    body: "Progress through RR, trader levels, streaks, and future unlocks.",
    to: "/rebate-rewards",
    icon: Trophy,
  },
  {
    title: "Cashback Calculator",
    body: "Estimate potential cashback before choosing a brand or trading setup.",
    to: "/cashback-calculator",
    icon: Calculator,
  },
  {
    title: "Payout Tracker",
    body: "Follow payout transparency, proof, and public payment signals across brands.",
    to: "/payouts",
    icon: WalletCards,
  },
] as const;

function ProductsPage() {
  const { user } = useAuth();
  const dashboardTo = user ? "/dashboard" : "/login";
  return (
    <div className="min-h-screen bg-[var(--rb-bg-canvas)] text-white">
      <SiteHeader />
      <main className="container-app space-y-6 py-8 sm:py-12">
        <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_18%_0%,rgba(217,70,239,0.19),transparent_36%),linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.025))] p-6 shadow-[0_24px_110px_rgba(88,28,135,0.24)] sm:p-8 lg:p-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-fuchsia-300/25 bg-fuchsia-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-fuchsia-100">
            <CalendarCheck className="h-3.5 w-3.5" />
            Products
          </div>
          <h1 className="mt-8 max-w-4xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Tools built for the trader operating system.
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-white/68 sm:text-lg">
            RebateBoard products connect planning, journaling, cashback, rewards, ROI,
            transparent brand data, and Rebeta intelligence into one workflow.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link
              to="/signup"
              className="inline-flex items-center justify-center rounded-full rb-gradient-primary px-5 py-3 text-sm font-semibold shadow-[0_0_30px_rgba(192,132,252,0.32)] transition hover:scale-[1.01]"
            >
              Create Free Account
            </Link>
            <Link
              to={dashboardTo as any}
              search={user ? undefined : ({ redirect: "/dashboard" } as any)}
              className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/[0.045] px-5 py-3 text-sm font-semibold text-white/85 transition hover:border-fuchsia-300/35 hover:bg-white/[0.08]"
            >
              Go to My Dashboard
            </Link>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {products.map(({ title, body, to, icon: Icon }) => (
            <Link
              key={title}
              to={to as any}
              className="group rounded-[1.5rem] border border-white/10 bg-white/[0.045] p-5 shadow-[0_18px_70px_rgba(42,12,84,0.18)] transition hover:-translate-y-0.5 hover:border-fuchsia-300/25 hover:bg-white/[0.065]"
            >
              <div className="mb-5 grid h-11 w-11 place-items-center rounded-2xl border border-fuchsia-300/20 bg-fuchsia-300/10">
                <Icon className="h-5 w-5 text-fuchsia-100" />
              </div>
              <h2 className="text-lg font-bold">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-white/62">{body}</p>
              <div className="mt-5 text-sm font-semibold text-fuchsia-100 opacity-80 transition group-hover:opacity-100">
                Explore {title}
              </div>
            </Link>
          ))}
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
