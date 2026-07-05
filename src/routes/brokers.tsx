import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ChevronDown, Star, Eye, ShoppingCart, Check, TrendingUp, Sparkles } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export const Route = createFileRoute("/brokers")({
  head: () => ({
    meta: [
      { title: "All Brokers — Browse & Filter | RebateBoard" },
      { name: "description", content: "Browse all brokers, filter by regulator, commission, spread, deposit and account type. Compare and view details." },
      { property: "og:title", content: "All Brokers — RebateBoard" },
      { property: "og:description", content: "Browse and filter every broker we list." },
    ],
  }),
  component: BrokersPage,
});

const ALL_BROKERS = [
  "ACY Securities", "IC Markets", "Pepperstone", "XM Group", "Exness",
  "FTMO", "MyForexFunds", "The Funded Trader", "FundedNext", "E8 Funding",
  "Bybit", "Binance", "OKX", "Bitget", "Coinbase",
];

const SUGGESTED_TOP = ["ACY Securities", "IC Markets", "Pepperstone", "FTMO", "Bybit"];
const SUGGESTED_NEW = ["FundedNext", "E8 Funding", "OKX", "Coinbase", "XM Group"];

const filterGroups = [
  { name: "Regulators", options: ["Supporting line text", "Supporting line text", "Supporting line text"], viewAll: true },
  { name: "Commission($)", options: ["1", "1 - 5", "6 - 10", "10 - above"] },
  { name: "Spread Type", options: ["Floating Spread", "Fixed Spread"] },
  { name: "Minimum Deposit", options: ["0 - 100", "101 - 200", "500 - 1000", "10,000 +"] },
  { name: "Accounts", options: ["Standard Account", "Mini/Micro Account", "VIP/Premium Account", "ECN account"] },
  { name: "Products", options: ["Forex", "CFDs", "Commodity", "Index", "Crypto"], viewAll: true },
];

function BrokersPage() {
  const [search] = useState("");

  const filtered = useMemo(
    () => ALL_BROKERS.filter((f) => f.toLowerCase().includes(search.toLowerCase())),
    [search],
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a0b2e] via-[#1f0d3d] to-[#150829] text-white">
      <SiteHeader />

      <div className="container-app relative py-6">
        <div className="glow-orb h-[500px] w-[500px] left-1/3 top-20 opacity-50" />

        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">All Brokers</h1>
            <p className="text-xs text-muted-foreground">Filter, compare and pick the right broker for you.</p>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
          {/* Sidebar filters */}
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
                      <input type="checkbox" className="accent-fuchsia-400" defaultChecked={i === 0 && idx === 0} /> {opt}
                    </label>
                  ))}
                  {g.viewAll && (
                    <button className="mt-1 flex w-full items-center justify-between text-[11px] text-white/80 hover:text-white">
                      <span>View all</span>
                      <span>⇥</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </aside>

          {/* Right content */}
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((name) => (
                <div key={name} className="glass rounded-2xl p-3 ring-1 ring-violet-400/20">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="grid h-12 w-12 place-items-center rounded-lg bg-white text-[10px] font-bold text-violet-700">{name.slice(0, 3).toUpperCase()}</div>
                      <span className="absolute -right-1 -top-1 grid h-4 w-4 place-items-center rounded-full bg-fuchsia-500 text-[8px]">
                        <Check className="h-2.5 w-2.5" />
                      </span>
                    </div>
                    <div>
                      <div className="text-sm font-semibold">{name}</div>
                      <div className="mt-0.5 flex items-center gap-1 text-[10px]">
                        {[0, 1, 2, 3].map((s) => (
                          <Star key={s} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        ))}
                        <Star className="h-3 w-3 text-yellow-400/40" />
                        <span className="ml-1 font-semibold">4.0</span>
                      </div>
                      <div className="text-[10px] text-muted-foreground">Total Review : 4</div>
                    </div>
                  </div>
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center gap-1.5">
                      <button className="inline-flex flex-1 min-w-0 items-center justify-center gap-1 rounded-full bg-fuchsia-300/30 px-2 py-1.5 text-[10px] font-semibold ring-1 ring-fuchsia-300/40">
                        <ShoppingCart className="h-3 w-3 shrink-0" /> <span className="truncate">Sign up</span>
                      </button>
                      <Link
                        to="/firm/$firmId"
                        params={{ firmId: encodeURIComponent(name.replace(/\s+/g, "-")) }}
                        className="inline-flex flex-1 min-w-0 items-center justify-center gap-1 rounded-full bg-fuchsia-300/30 px-2 py-1.5 text-[10px] font-semibold ring-1 ring-fuchsia-300/40"
                      >
                        <Eye className="h-3 w-3 shrink-0" /> <span className="truncate">View Details</span>
                      </Link>
                    </div>
                    <label className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                      <input type="checkbox" className="accent-fuchsia-400" /> Add to compare
                    </label>
                  </div>
                </div>
              ))}
            </div>

            {/* Suggested strip — replaces the white area in the mock with curated rows */}
            <div className="rounded-2xl bg-white p-5 text-violet-900 shadow-2xl">
              <div className="mb-3 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-fuchsia-600" />
                <h3 className="text-sm font-bold">Top rated brokers</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {SUGGESTED_TOP.map((name) => (
                  <Link
                    key={name}
                    to="/firm/$firmId"
                    params={{ firmId: encodeURIComponent(name.replace(/\s+/g, "-")) }}
                    className="inline-flex items-center gap-2 rounded-full bg-violet-100 px-3 py-1.5 text-[11px] font-semibold text-violet-800 ring-1 ring-violet-200 hover:bg-violet-200"
                  >
                    <span className="grid h-5 w-5 place-items-center rounded bg-white text-[8px] font-bold text-violet-700">{name.slice(0, 2).toUpperCase()}</span>
                    {name}
                  </Link>
                ))}
              </div>

              <div className="mt-4 mb-3 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-fuchsia-600" />
                <h3 className="text-sm font-bold">New listings</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {SUGGESTED_NEW.map((name) => (
                  <Link
                    key={name}
                    to="/firm/$firmId"
                    params={{ firmId: encodeURIComponent(name.replace(/\s+/g, "-")) }}
                    className="inline-flex items-center gap-2 rounded-full bg-fuchsia-100 px-3 py-1.5 text-[11px] font-semibold text-fuchsia-800 ring-1 ring-fuchsia-200 hover:bg-fuchsia-200"
                  >
                    <span className="grid h-5 w-5 place-items-center rounded bg-white text-[8px] font-bold text-fuchsia-700">{name.slice(0, 2).toUpperCase()}</span>
                    {name}
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
