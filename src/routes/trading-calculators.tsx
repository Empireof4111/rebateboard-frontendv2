import { Link, createFileRoute } from "@tanstack/react-router";
import {
  ArrowRight,
  BadgePercent,
  BarChart3,
  Calculator,
  DollarSign,
  Repeat2,
  TrendingUp,
} from "lucide-react";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

export const Route = createFileRoute("/trading-calculators")({
  head: () => ({
    meta: [
      { title: "Trading Calculators | RebateBoard" },
      {
        name: "description",
        content:
          "Estimate profit consistency, margin, fees, cashback, currency conversion, and trade scenarios with transparent formulas and assumptions.",
      },
      { property: "og:title", content: "Trading Calculators | RebateBoard" },
      {
        property: "og:description",
        content:
          "A transparent calculator directory for trader planning, cost checks, and consistency-rule analysis.",
      },
    ],
  }),
  component: TradingCalculatorsPage,
});

const calculatorGroups = [
  {
    title: "Trading Calculators",
    tools: [
      {
        title: "Profit Consistency Calculator",
        body: "Measure how much of your total profit came from your best trading day and plan around maximum consistency rules.",
        icon: BarChart3,
        formula: "Best profitable day ÷ total net profit × 100",
        status: "Available in dashboard tools",
      },
      {
        title: "Margin Calculator",
        body: "Estimate required margin using simplified contract-size and leverage assumptions.",
        icon: Calculator,
        formula: "Position value ÷ leverage",
        status: "Estimate mode",
      },
      {
        title: "Profit Calculator",
        body: "Test a price scenario without changing your journal’s manually recorded realized P&L.",
        icon: TrendingUp,
        formula: "Price movement × pip/point value × size",
        status: "Scenario mode",
      },
    ],
  },
  {
    title: "Cost and Rewards",
    tools: [
      {
        title: "Cashback Calculator",
        body: "Estimate potential cashback from admin-managed brand and account-rate data where available.",
        icon: BadgePercent,
        formula: "Eligible activity × configured rebate basis",
        status: "Uses published brand data",
      },
      {
        title: "Fees Calculator",
        body: "Estimate spread and commission cost before any cashback or rebate adjustment.",
        icon: DollarSign,
        formula: "Spread cost + commission - eligible rebate",
        status: "Estimate mode",
      },
    ],
  },
  {
    title: "Market Utilities",
    tools: [
      {
        title: "Currency Converter",
        body: "Convert supported currencies. Live rates require a backend provider before being labeled as live.",
        icon: Repeat2,
        formula: "Amount ÷ source rate × target rate",
        status: "Manual/static-rate mode",
      },
    ],
  },
];

function TradingCalculatorsPage() {
  return (
    <div className="min-h-screen bg-[var(--rb-bg-canvas)] text-white">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 pb-16 pt-28 sm:px-6 lg:px-8">
        <section className="grid gap-8 lg:grid-cols-[1.05fr_.95fr] lg:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-primary">
              Trader tools
            </div>
            <h1 className="mt-5 max-w-3xl text-4xl font-black tracking-tight text-white sm:text-6xl">
              Calculators that show the formula, not just the answer.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-muted-foreground">
              Estimate consistency rules, margin, fees, cashback, currency conversion, and trade scenarios with clear assumptions. Calculator outputs are planning tools, not guaranteed provider outcomes.
            </p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-[rgba(22,22,31,0.86)] p-5 shadow-[var(--rb-shadow-card)]">
            <div className="text-xs font-black uppercase tracking-[0.16em] text-primary">Featured</div>
            <h2 className="mt-3 text-2xl font-black text-white">Profit Consistency Calculator</h2>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              Calculate whether one best day is carrying too much of the total result. Supports manual totals, daily entries, and journal-derived data inside the dashboard.
            </p>
            <Link
              to="/dashboard/tools"
              className="mt-5 inline-flex items-center gap-2 rounded-full rb-gradient-primary px-5 py-3 text-sm font-black text-white shadow-[var(--rb-shadow-primary)]"
            >
              Open Dashboard Tools
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        <section className="grid gap-5">
          {calculatorGroups.map((group) => (
            <div key={group.title}>
              <h2 className="text-lg font-black text-white">{group.title}</h2>
              <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {group.tools.map((tool) => {
                  const Icon = tool.icon;
                  return (
                    <article key={tool.title} className="rounded-3xl border border-white/10 bg-[rgba(22,22,31,0.88)] p-5 shadow-[var(--rb-shadow-card)]">
                      <div className="flex items-start justify-between gap-4">
                        <div className="grid h-11 w-11 place-items-center rounded-2xl rb-gradient-primary text-white">
                          <Icon className="h-5 w-5" />
                        </div>
                        <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                          {tool.status}
                        </span>
                      </div>
                      <h3 className="mt-4 text-base font-black text-white">{tool.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">{tool.body}</p>
                      <div className="mt-4 rounded-2xl bg-white/[0.045] p-3">
                        <div className="text-[10px] font-black uppercase tracking-[0.14em] text-primary">Formula</div>
                        <div className="mt-1 text-xs font-semibold text-white/85">{tool.formula}</div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          ))}
        </section>

        <section className="rounded-3xl border border-white/10 bg-[rgba(22,22,31,0.82)] p-6">
          <h2 className="text-xl font-black text-white">Accuracy notes</h2>
          <div className="mt-4 grid gap-4 text-sm leading-7 text-muted-foreground md:grid-cols-3">
            <p>Profit consistency is a mathematical rule estimate. Always confirm the latest rule directly with your trading provider.</p>
            <p>Margin, profit, and fee tools use explicit assumptions unless a provider-specific contract specification is available.</p>
            <p>Currency conversion should only be treated as live when a timestamped backend rate provider is connected and shown.</p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
