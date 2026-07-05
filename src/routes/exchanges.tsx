import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  ChevronDown, Star, Eye, Rocket, Check, ShieldCheck, Coins,
  TrendingUp, Sparkles,
} from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export const Route = createFileRoute("/exchanges")({
  head: () => ({
    meta: [
      { title: "All Crypto Exchanges — Compare Fees & Regulation | RebateBoard" },
      { name: "description", content: "Browse every crypto exchange. Compare min deposit, regulation, maker/taker fees, KYC and supported assets." },
      { property: "og:title", content: "All Crypto Exchanges — RebateBoard" },
      { property: "og:description", content: "Crypto exchanges with verified fees, regulation and security scores." },
    ],
  }),
  component: ExchangesPage,
});

type Exchange = {
  name: string;
  minDeposit: string;
  regulation: string;
  makerTaker: string;
  coins: string;
  kyc: "Tier 1" | "Tier 2" | "Tier 3";
  rating: number;
  security: number;
  fiat?: boolean;
  verified?: boolean;
};

const EXCHANGES: Exchange[] = [
  { name: "Binance", minDeposit: "$10", regulation: "Multi-jurisdiction", makerTaker: "0.10% / 0.10%", coins: "350+", kyc: "Tier 2", rating: 4.6, security: 92, fiat: true, verified: true },
  { name: "Coinbase", minDeposit: "$2", regulation: "FinCEN · NYDFS", makerTaker: "0.40% / 0.60%", coins: "240+", kyc: "Tier 3", rating: 4.5, security: 96, fiat: true, verified: true },
  { name: "Bybit", minDeposit: "$1", regulation: "VARA (UAE)", makerTaker: "0.10% / 0.10%", coins: "600+", kyc: "Tier 2", rating: 4.7, security: 90, fiat: true, verified: true },
  { name: "OKX", minDeposit: "$10", regulation: "VARA · MAS", makerTaker: "0.08% / 0.10%", coins: "350+", kyc: "Tier 2", rating: 4.6, security: 91, fiat: true },
  { name: "Bitget", minDeposit: "$5", regulation: "SCB (Bahamas)", makerTaker: "0.10% / 0.10%", coins: "550+", kyc: "Tier 1", rating: 4.4, security: 88 },
  { name: "Kraken", minDeposit: "$10", regulation: "FinCEN · FCA", makerTaker: "0.16% / 0.26%", coins: "200+", kyc: "Tier 3", rating: 4.5, security: 95, fiat: true, verified: true },
];

const filterGroups = [
  { name: "Regulation", options: ["NYDFS", "FCA", "MAS", "VARA", "Unregulated"] },
  { name: "Min Deposit", options: ["$0 – $10", "$11 – $100", "$101 – $500", "$500+"] },
  { name: "Trading Fee", options: ["0 – 0.10%", "0.11 – 0.25%", "0.26 – 0.50%", "0.50%+"] },
  { name: "KYC Level", options: ["Tier 1 (Basic)", "Tier 2 (Verified)", "Tier 3 (Full)"] },
  { name: "Features", options: ["Fiat On-ramp", "Spot", "Futures", "Staking", "Copy Trading"] },
];

function ExchangesPage() {
  const [search] = useState("");
  const [compare, setCompare] = useState<string[]>([]);

  const filtered = useMemo(
    () => EXCHANGES.filter((e) => e.name.toLowerCase().includes(search.toLowerCase())),
    [search],
  );

  const toggleCompare = (name: string) => {
    setCompare((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : prev.length >= 4 ? prev : [...prev, name],
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a0b2e] via-[#1f0d3d] to-[#150829] text-white">
      <SiteHeader />

      <div className="container-app relative py-6">
        <div className="glow-orb h-[500px] w-[500px] left-1/3 top-20 opacity-50" />

        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">All Crypto Exchanges</h1>
            <p className="text-xs text-muted-foreground">Compare exchanges by fees, regulation, KYC and security at a glance.</p>
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
              {filtered.map((e) => {
                const isCompared = compare.includes(e.name);
                return (
                  <div key={e.name} className="glass rounded-2xl p-4 ring-1 ring-violet-400/20">
                    <div className="flex items-start gap-3">
                      <div className="relative">
                        <div className="grid h-12 w-12 place-items-center rounded-lg bg-gradient-to-br from-amber-300 to-yellow-500 text-[10px] font-bold text-amber-900">
                          {e.name.slice(0, 3).toUpperCase()}
                        </div>
                        {e.verified && (
                          <span className="absolute -right-1 -bottom-1 grid h-4 w-4 place-items-center rounded-full bg-emerald-500 ring-2 ring-[#1f0d3d]">
                            <Check className="h-2.5 w-2.5" />
                          </span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold">{e.name}</div>
                        <div className="mt-0.5 inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-300 ring-1 ring-emerald-500/30">
                          <ShieldCheck className="h-2.5 w-2.5" /> {e.regulation}
                        </div>
                        <div className="mt-1 flex items-center gap-1 text-[10px]">
                          {[0, 1, 2, 3, 4].map((s) => (
                            <Star key={s} className={`h-3 w-3 ${s < Math.round(e.rating) ? "fill-yellow-400 text-yellow-400" : "text-yellow-400/30"}`} />
                          ))}
                          <span className="ml-1 font-semibold">{e.rating.toFixed(1)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <div className="rounded-lg bg-white/5 p-2 ring-1 ring-white/10">
                        <div className="text-[9px] uppercase tracking-wide text-muted-foreground">Min Deposit</div>
                        <div className="mt-0.5 text-sm font-bold text-emerald-300">{e.minDeposit}</div>
                      </div>
                      <div className="rounded-lg bg-white/5 p-2 ring-1 ring-white/10">
                        <div className="text-[9px] uppercase tracking-wide text-muted-foreground">Maker / Taker</div>
                        <div className="mt-0.5 text-sm font-bold">{e.makerTaker}</div>
                      </div>
                      <div className="rounded-lg bg-white/5 p-2 ring-1 ring-white/10">
                        <div className="flex items-center gap-1 text-[9px] uppercase tracking-wide text-muted-foreground">
                          <Coins className="h-2.5 w-2.5" /> Coins
                        </div>
                        <div className="mt-0.5 text-sm font-bold">{e.coins}</div>
                      </div>
                      <div className="rounded-lg bg-white/5 p-2 ring-1 ring-white/10">
                        <div className="text-[9px] uppercase tracking-wide text-muted-foreground">KYC · Security</div>
                        <div className="mt-0.5 text-sm font-bold">{e.kyc} · {e.security}</div>
                      </div>
                    </div>

                    <div className="mt-2 flex flex-wrap gap-1">
                      {e.fiat && <span className="rounded-full bg-blue-500/20 px-2 py-0.5 text-[9px] font-semibold text-blue-200 ring-1 ring-blue-400/30">Fiat on-ramp</span>}
                      <span className="rounded-full bg-violet-500/20 px-2 py-0.5 text-[9px] font-semibold text-violet-200 ring-1 ring-violet-400/30">Spot · Futures</span>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-1.5">
                      <button className="inline-flex items-center justify-center gap-1 rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-600 px-2 py-1.5 text-[10px] font-semibold shadow-[0_0_20px_rgba(192,132,252,0.4)]">
                        <Rocket className="h-3 w-3" /> Sign Up
                      </button>
                      <Link
                        to="/firm/$firmId"
                        params={{ firmId: encodeURIComponent(e.name.replace(/\s+/g, "-")) }}
                        className="inline-flex items-center justify-center gap-1 rounded-full bg-white/10 px-2 py-1.5 text-[10px] font-semibold ring-1 ring-white/20 hover:bg-white/15"
                      >
                        <Eye className="h-3 w-3" /> View Details
                      </Link>
                    </div>
                    <label className="mt-2 flex items-center gap-1.5 text-[10px] text-muted-foreground">
                      <input
                        type="checkbox"
                        checked={isCompared}
                        onChange={() => toggleCompare(e.name)}
                        className="accent-fuchsia-400"
                      /> Add to compare {compare.length >= 4 && !isCompared && <span className="text-orange-300">(max 4)</span>}
                    </label>
                  </div>
                );
              })}
            </div>

            <div className="rounded-2xl bg-white p-5 text-violet-900 shadow-2xl">
              <div className="mb-3 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-fuchsia-600" />
                <h3 className="text-sm font-bold">Top rated exchanges</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {EXCHANGES.slice(0, 4).map((e) => (
                  <Link
                    key={e.name}
                    to="/firm/$firmId"
                    params={{ firmId: encodeURIComponent(e.name.replace(/\s+/g, "-")) }}
                    className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1.5 text-[11px] font-semibold text-amber-800 ring-1 ring-amber-200 hover:bg-amber-200"
                  >
                    <Sparkles className="h-3 w-3" /> {e.name}
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
