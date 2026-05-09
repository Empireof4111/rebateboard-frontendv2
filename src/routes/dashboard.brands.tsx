import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader, Pill } from "@/components/dashboard/Primitives";
import {
  LineChart, Building2, Bitcoin, Activity, Search, Filter, Star, ArrowRight, Layers,
} from "lucide-react";

export const Route = createFileRoute("/dashboard/brands")({
  head: () => ({
    meta: [
      { title: "Programs — RebateBoard" },
      { name: "description", content: "Browse forex brokers, prop firms, crypto exchanges, and futures programs with cashback rates and TBI scores." },
    ],
  }),
  component: ProgramsPage,
});

type Category = "all" | "forex" | "prop" | "crypto" | "futures";
type Program = {
  slug: string;
  name: string;
  category: Exclude<Category, "all">;
  tbi: number;
  rebate: string;
  payoutSpeed: string;
  highlight?: string;
};

const programs: Program[] = [
  { slug: "exness", name: "Exness", category: "forex", tbi: 8.9, rebate: "Up to 60%", payoutSpeed: "Instant", highlight: "Top earner" },
  { slug: "ic-markets", name: "IC Markets", category: "forex", tbi: 9.0, rebate: "Up to 55%", payoutSpeed: "1d" },
  { slug: "pepperstone", name: "Pepperstone", category: "forex", tbi: 8.7, rebate: "50%", payoutSpeed: "1d" },
  { slug: "fundingpips", name: "FundingPips", category: "prop", tbi: 9.1, rebate: "60% cashback", payoutSpeed: "<24h", highlight: "Hot" },
  { slug: "ftmo", name: "FTMO", category: "prop", tbi: 9.2, rebate: "45%", payoutSpeed: "2d" },
  { slug: "the5ers", name: "The5ers", category: "prop", tbi: 8.6, rebate: "40%", payoutSpeed: "3d" },
  { slug: "myforexfunds", name: "MyForexFunds", category: "prop", tbi: 7.8, rebate: "35%", payoutSpeed: "5d" },
  { slug: "bybit", name: "Bybit", category: "crypto", tbi: 8.4, rebate: "40% fees", payoutSpeed: "Daily" },
  { slug: "binance", name: "Binance", category: "crypto", tbi: 8.1, rebate: "35% fees", payoutSpeed: "Daily" },
  { slug: "okx", name: "OKX", category: "crypto", tbi: 8.0, rebate: "30% fees", payoutSpeed: "Daily" },
  { slug: "tradeify", name: "Tradeify", category: "futures", tbi: 8.3, rebate: "50%", payoutSpeed: "<24h" },
  { slug: "topstep", name: "Topstep", category: "futures", tbi: 8.5, rebate: "40%", payoutSpeed: "1d" },
  { slug: "apex", name: "Apex Trader Funding", category: "futures", tbi: 8.2, rebate: "45%", payoutSpeed: "2d" },
];

const tabs: { id: Category; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "all", label: "All", icon: Layers },
  { id: "forex", label: "Forex Brokers", icon: LineChart },
  { id: "prop", label: "Prop Firms", icon: Building2 },
  { id: "crypto", label: "Crypto Exchanges", icon: Bitcoin },
  { id: "futures", label: "Futures", icon: Activity },
];

const sortOptions = [
  { id: "tbi", label: "Top TBI" },
  { id: "rebate", label: "Best Rebate" },
  { id: "payout", label: "Fastest Payout" },
] as const;
type SortId = typeof sortOptions[number]["id"];

function ProgramsPage() {
  const [cat, setCat] = useState<Category>("all");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<SortId>("tbi");

  const list = useMemo(() => {
    let l = programs.filter((p) => (cat === "all" ? true : p.category === cat));
    if (q) l = l.filter((p) => p.name.toLowerCase().includes(q.toLowerCase()));
    if (sort === "tbi") l = [...l].sort((a, b) => b.tbi - a.tbi);
    return l;
  }, [cat, q, sort]);

  const counts = useMemo(() => {
    const c: Record<Category, number> = { all: programs.length, forex: 0, prop: 0, crypto: 0, futures: 0 };
    programs.forEach((p) => { c[p.category]++; });
    return c;
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Programs"
        subtitle="Pick your trading vehicle — every broker, prop firm, exchange, and futures program in one place."
      />

      {/* Smart filter bar */}
      <div className="glass rounded-2xl p-4">
        <div className="flex flex-wrap items-center gap-2">
          {tabs.map((t) => {
            const Icon = t.icon;
            const active = cat === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setCat(t.id)}
                className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition ${
                  active
                    ? "bg-gradient-to-r from-fuchsia-500 to-violet-600 text-white shadow-[0_0_18px_rgba(192,132,252,0.4)]"
                    : "bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {t.label}
                <span className={`rounded-full px-1.5 text-[10px] ${active ? "bg-black/20 text-white" : "bg-white/10 text-white/70"}`}>
                  {counts[t.id]}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <div className="glass-pill flex flex-1 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-white md:max-w-sm">
            <Search className="h-3 w-3 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search programs…"
              className="w-full bg-transparent outline-none placeholder:text-muted-foreground"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5 text-muted-foreground" />
            {sortOptions.map((s) => (
              <button
                key={s.id}
                onClick={() => setSort(s.id)}
                className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
                  sort === s.id ? "bg-white/15 text-white" : "bg-white/5 text-muted-foreground hover:text-white"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Listings */}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {list.map((p) => (
          <div key={p.slug} className="glass rounded-2xl p-4 ring-1 ring-white/5 transition hover:ring-primary/30">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <div className="text-base font-semibold text-white">{p.name}</div>
                  {p.highlight && (
                    <span className="rounded-full bg-gradient-to-r from-amber-400 to-fuchsia-500 px-1.5 py-0.5 text-[8px] font-bold uppercase text-white">
                      {p.highlight}
                    </span>
                  )}
                </div>
                <Pill>{labelFor(p.category)}</Pill>
              </div>
              <div className="text-right">
                <div className="text-[10px] uppercase text-muted-foreground">TBI</div>
                <div className="flex items-center gap-1 text-lg font-bold text-accent">
                  <Star className="h-3.5 w-3.5 fill-current" /> {p.tbi}
                </div>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
              <div className="rounded-lg bg-white/[0.04] px-2 py-1.5">
                <div className="text-muted-foreground">Rebate</div>
                <div className="font-semibold text-emerald-400">{p.rebate}</div>
              </div>
              <div className="rounded-lg bg-white/[0.04] px-2 py-1.5">
                <div className="text-muted-foreground">Payout</div>
                <div className="font-semibold text-white">{p.payoutSpeed}</div>
              </div>
            </div>

            <div className="mt-3 flex gap-2">
              <Link
                to={"/payouts/$brandSlug" as string}
                params={{ brandSlug: p.slug }}
                className="flex-1 rounded-lg bg-white/5 py-2 text-center text-xs text-white hover:bg-white/10"
              >
                View payouts
              </Link>
              <button className="inline-flex items-center gap-1 rounded-lg bg-gradient-to-r from-fuchsia-500 to-violet-600 px-3 py-2 text-xs font-semibold text-white">
                Activate <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          </div>
        ))}
        {list.length === 0 && (
          <div className="glass col-span-full rounded-2xl p-8 text-center text-sm text-muted-foreground">
            No programs match your filters.
          </div>
        )}
      </div>
    </div>
  );
}

function labelFor(c: Exclude<Category, "all">) {
  return c === "forex" ? "Forex Broker" : c === "prop" ? "Prop Firm" : c === "crypto" ? "Crypto Exchange" : "Futures";
}
