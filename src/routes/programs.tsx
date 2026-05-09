import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  ChevronDown, Star, Eye, Rocket, Check, Copy, Sparkles, Flame,
  TrendingUp, ShieldCheck, Timer,
} from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export const Route = createFileRoute("/programs")({
  head: () => ({
    meta: [
      { title: "All Prop Firms — Funded Trader Challenges | RebateBoard" },
      { name: "description", content: "Browse every prop firm. Compare max allocation, profit split, fees and grab exclusive promo codes." },
      { property: "og:title", content: "All Prop Firms — RebateBoard" },
      { property: "og:description", content: "Funded trader prop firms with promo codes, allocation limits, and profit splits." },
    ],
  }),
  component: ProgramsPage,
});

type Program = {
  name: string;
  tagline: string;
  maxAllocation: string;
  profitSplit: string;
  startingFee: string;
  promo: string;
  promoOff: string;
  rating: number;
  payout: string;
  hot?: boolean;
  verified?: boolean;
  endsIn?: string;
};

const PROGRAMS: Program[] = [
  { name: "FTMO Pro", tagline: "2-Step Evaluation · Industry standard", maxAllocation: "$2,000,000", profitSplit: "90%", startingFee: "$89", promo: "RB10", promoOff: "10% OFF", rating: 4.8, payout: "Bi-weekly", hot: true, verified: true, endsIn: "2d 14h" },
  { name: "FundedNext Stellar", tagline: "1-Step / 2-Step / Instant", maxAllocation: "$4,000,000", profitSplit: "95%", startingFee: "$59", promo: "BOARD15", promoOff: "15% OFF", rating: 4.7, payout: "Weekly", verified: true, endsIn: "5d 02h" },
  { name: "The Funded Trader Royal", tagline: "Aggressive scaling", maxAllocation: "$1,500,000", profitSplit: "90%", startingFee: "$99", promo: "TFT20", promoOff: "20% OFF", rating: 4.5, payout: "Weekly", hot: true, endsIn: "11h 32m" },
  { name: "MyForexFunds Evaluation", tagline: "2-Step Classic", maxAllocation: "$600,000", profitSplit: "85%", startingFee: "$49", promo: "MFF12", promoOff: "12% OFF", rating: 4.3, payout: "Bi-weekly" },
  { name: "E8 Funding Standard", tagline: "Flexible drawdown", maxAllocation: "$400,000", profitSplit: "80%", startingFee: "$33", promo: "E8RB", promoOff: "10% OFF", rating: 4.2, payout: "On request", verified: true },
  { name: "Apex Trader Funding", tagline: "Instant funded futures", maxAllocation: "$300,000", profitSplit: "100%", startingFee: "$25", promo: "APEX25", promoOff: "25% OFF", rating: 4.6, payout: "Bi-weekly", hot: true, endsIn: "3d 09h" },
];

const filterGroups = [
  { name: "Program Type", options: ["1-Step Challenge", "2-Step Challenge", "Instant Funding", "Evaluation"] },
  { name: "Max Allocation", options: ["Up to $100k", "$100k – $500k", "$500k – $1M", "$1M+"] },
  { name: "Profit Split", options: ["70 – 79%", "80 – 89%", "90 – 100%"] },
  { name: "Starting Fee", options: ["Under $50", "$50 – $100", "$100 – $250", "$250+"] },
  { name: "Payout Frequency", options: ["On Request", "Weekly", "Bi-weekly", "Monthly"] },
];

function ProgramsPage() {
  const [search] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const [compare, setCompare] = useState<string[]>([]);

  const filtered = useMemo(
    () => PROGRAMS.filter((p) => p.name.toLowerCase().includes(search.toLowerCase())),
    [search],
  );

  const toggleCompare = (name: string) => {
    setCompare((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : prev.length >= 4 ? prev : [...prev, name],
    );
  };

  const copyPromo = (code: string) => {
    navigator.clipboard?.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a0b2e] via-[#1f0d3d] to-[#150829] text-white">
      <SiteHeader />

      <div className="relative mx-auto max-w-7xl px-4 py-6">
        <div className="glow-orb h-[500px] w-[500px] left-1/3 top-20 opacity-50" />

        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">All Prop Firms</h1>
            <p className="text-xs text-muted-foreground">Funded trader challenges with verified promo codes & live payout stats.</p>
          </div>
          {compare.length > 0 && (
            <Link
              to="/compare"
              className="rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-600 px-4 py-2 text-xs font-semibold shadow-[0_0_20px_rgba(192,132,252,0.5)]"
            >
              Compare {compare.length} →
            </Link>
          )}
        </div>

        <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
          <aside className="glass self-start rounded-2xl p-4 ring-1 ring-violet-400/20">
            {filterGroups.map((g, i) => (
              <div key={g.name} className={i > 0 ? "mt-3 border-t border-white/10 pt-3" : ""}>
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold">{g.name}</div>
                  <ChevronDown className="h-3 w-3" />
                </div>
                <div className="mt-2 space-y-1.5 text-[11px] text-muted-foreground">
                  {g.options.map((opt, idx) => (
                    <label key={`${opt}-${idx}`} className="flex items-center gap-2">
                      <input type="checkbox" className="accent-fuchsia-400" /> {opt}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </aside>

          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((p) => {
                const isCompared = compare.includes(p.name);
                return (
                  <div key={p.name} className="glass relative overflow-hidden rounded-2xl p-4 ring-1 ring-violet-400/20">
                    {p.hot && (
                      <div className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide">
                        <Flame className="h-2.5 w-2.5" /> Hot
                      </div>
                    )}

                    <div className="flex items-start gap-3">
                      <div className="relative">
                        <div className="grid h-12 w-12 place-items-center rounded-lg bg-gradient-to-br from-violet-300 to-fuchsia-400 text-[10px] font-bold text-violet-900">
                          {p.name.slice(0, 3).toUpperCase()}
                        </div>
                        {p.verified && (
                          <span className="absolute -right-1 -bottom-1 grid h-4 w-4 place-items-center rounded-full bg-emerald-500 ring-2 ring-[#1f0d3d]">
                            <ShieldCheck className="h-2.5 w-2.5" />
                          </span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold">{p.name}</div>
                        <div className="truncate text-[10px] text-muted-foreground">{p.tagline}</div>
                        <div className="mt-1 flex items-center gap-1 text-[10px]">
                          {[0, 1, 2, 3, 4].map((s) => (
                            <Star key={s} className={`h-3 w-3 ${s < Math.round(p.rating) ? "fill-yellow-400 text-yellow-400" : "text-yellow-400/30"}`} />
                          ))}
                          <span className="ml-1 font-semibold">{p.rating.toFixed(1)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Key stat band */}
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <div className="rounded-lg bg-white/5 p-2 ring-1 ring-white/10">
                        <div className="flex items-center gap-1 text-[9px] uppercase tracking-wide text-muted-foreground">
                          <TrendingUp className="h-2.5 w-2.5" /> Max Allocation
                        </div>
                        <div className="mt-0.5 text-sm font-bold text-emerald-300">{p.maxAllocation}</div>
                      </div>
                      <div className="rounded-lg bg-white/5 p-2 ring-1 ring-white/10">
                        <div className="text-[9px] uppercase tracking-wide text-muted-foreground">Profit Split</div>
                        <div className="mt-0.5 text-sm font-bold text-fuchsia-300">{p.profitSplit}</div>
                      </div>
                      <div className="rounded-lg bg-white/5 p-2 ring-1 ring-white/10">
                        <div className="text-[9px] uppercase tracking-wide text-muted-foreground">From</div>
                        <div className="mt-0.5 text-sm font-bold">{p.startingFee}</div>
                      </div>
                      <div className="rounded-lg bg-white/5 p-2 ring-1 ring-white/10">
                        <div className="text-[9px] uppercase tracking-wide text-muted-foreground">Payout</div>
                        <div className="mt-0.5 text-sm font-bold">{p.payout}</div>
                      </div>
                    </div>

                    {/* Promo code */}
                    <button
                      onClick={() => copyPromo(p.promo)}
                      className="mt-3 flex w-full items-center justify-between rounded-lg border border-dashed border-fuchsia-300/50 bg-fuchsia-300/10 px-3 py-2 text-left transition hover:bg-fuchsia-300/20"
                    >
                      <div>
                        <div className="text-[9px] uppercase tracking-wide text-fuchsia-200">{p.promoOff} · Promo Code</div>
                        <div className="font-mono text-sm font-bold tracking-wider">{p.promo}</div>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-fuchsia-200">
                        {copied === p.promo ? <><Check className="h-3 w-3" /> Copied</> : <><Copy className="h-3 w-3" /> Copy</>}
                      </div>
                    </button>

                    {p.endsIn && (
                      <div className="mt-2 inline-flex items-center gap-1 text-[10px] text-orange-300">
                        <Timer className="h-3 w-3" /> Ends in {p.endsIn}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="mt-3 grid grid-cols-2 gap-1.5">
                      <button className="inline-flex items-center justify-center gap-1 rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-600 px-2 py-1.5 text-[10px] font-semibold shadow-[0_0_20px_rgba(192,132,252,0.4)]">
                        <Rocket className="h-3 w-3" /> Sign Up
                      </button>
                      <Link
                        to="/firm/$firmId"
                        params={{ firmId: encodeURIComponent(p.name.replace(/\s+/g, "-")) }}
                        className="inline-flex items-center justify-center gap-1 rounded-full bg-white/10 px-2 py-1.5 text-[10px] font-semibold ring-1 ring-white/20 hover:bg-white/15"
                      >
                        <Eye className="h-3 w-3" /> View Details
                      </Link>
                    </div>
                    <label className="mt-2 flex items-center gap-1.5 text-[10px] text-muted-foreground">
                      <input
                        type="checkbox"
                        checked={isCompared}
                        onChange={() => toggleCompare(p.name)}
                        className="accent-fuchsia-400"
                      /> Add to compare {compare.length >= 4 && !isCompared && <span className="text-orange-300">(max 4)</span>}
                    </label>
                  </div>
                );
              })}
            </div>

            <div className="rounded-2xl bg-white p-5 text-violet-900 shadow-2xl">
              <div className="mb-3 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-fuchsia-600" />
                <h3 className="text-sm font-bold">Trending program promos this week</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {PROGRAMS.filter((p) => p.hot).map((p) => (
                  <Link
                    key={p.name}
                    to="/firm/$firmId"
                    params={{ firmId: encodeURIComponent(p.name.replace(/\s+/g, "-")) }}
                    className="inline-flex items-center gap-2 rounded-full bg-fuchsia-100 px-3 py-1.5 text-[11px] font-semibold text-fuchsia-800 ring-1 ring-fuchsia-200 hover:bg-fuchsia-200"
                  >
                    <Flame className="h-3 w-3" /> {p.name} — {p.promoOff}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    <SiteFooter />
    </div>
  );
}
