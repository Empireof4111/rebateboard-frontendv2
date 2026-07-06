import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Search, ChevronDown, Star, Plus, X, Check, XCircle, Info, Eye, ShoppingCart, Clock,
} from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";

export const Route = createFileRoute("/compare")({
  head: () => ({
    meta: [
      { title: "Broker vs Broker — Compare up to 4 Brokers | RebateBoard" },
      { name: "description", content: "Compare up to 4 brokers side-by-side: spreads, fees, payouts, scaling and rules. Save your recent comparisons." },
      { property: "og:title", content: "Broker vs Broker — Compare up to 4 Brokers" },
      { property: "og:description", content: "Side-by-side broker comparison with recent history." },
    ],
  }),
  component: ComparePage,
});

const ALL_FIRMS = [
  "ACY Securities", "IC Markets", "Pepperstone", "XM Group", "Exness",
  "FTMO", "MyForexFunds", "The Funded Trader", "FundedNext", "E8 Funding",
  "Bybit", "Binance", "OKX", "Bitget", "Coinbase",
];

const MAX_BRANDS = 4;
const STORAGE_KEY = "rb_recent_comparisons_v1";

type RecentItem = { brands: string[]; ts: number };

function loadRecent(): RecentItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as RecentItem[]) : [];
  } catch {
    return [];
  }
}

function saveRecent(brands: string[]) {
  if (typeof window === "undefined") return;
  if (brands.length < 2) return;
  try {
    const existing = loadRecent().filter(
      (r) => r.brands.join("|").toLowerCase() !== brands.join("|").toLowerCase(),
    );
    const next = [{ brands, ts: Date.now() }, ...existing].slice(0, 8);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

function ComparePage() {
  const [view, setView] = useState<"compare" | "addFirm">("compare");
  const [brands, setBrands] = useState<string[]>(["ACY Securities", "IC Markets"]);
  const [recent, setRecent] = useState<RecentItem[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    setRecent(loadRecent());
  }, []);

  useEffect(() => {
    if (brands.length >= 2) {
      saveRecent(brands);
      setRecent(loadRecent());
    }
  }, [brands]);

  const removeBrand = (name: string) =>
    setBrands((b) => b.filter((x) => x !== name));

  const addBrand = (name: string) => {
    setBrands((b) => {
      if (b.includes(name) || b.length >= MAX_BRANDS) return b;
      return [...b, name];
    });
  };

  const clearAll = () => setBrands([]);

  const filteredFirms = useMemo(
    () => ALL_FIRMS.filter((f) => f.toLowerCase().includes(search.toLowerCase())),
    [search],
  );

  const overviewRows: { label: string; value: string; type?: "yes" | "no" }[] = [
    { label: "Challenge Type", value: "2 - Step" },
    { label: "Profit Target", value: "10% / 5%" },
    { label: "Max. Daily Loss", value: "5%" },
    { label: "Max Overall Loss", value: "10%" },
    { label: "Profit Split", value: "80%" },
    { label: "Refundable Fee", value: "Yes", type: "yes" },
    { label: "First Payout", value: "14 Days" },
    { label: "Payout Frequency", value: "Bi - Weekly" },
    { label: "Scaling Plan", value: "Yes", type: "yes" },
    { label: "News Trading", value: "Allowed" },
    { label: "Platforms", value: "MT4, MT5, cTrader" },
  ];

  const cols = Math.max(brands.length, 1);
  const gridTemplate = `1.2fr ${"1fr ".repeat(cols).trim()}`;
  const brokerFilterOptions: Record<string, string[]> = {
    Regulators: ["FCA", "ASIC", "CySEC", "NFA"],
    "Commission($)": ["$1", "$1 - $5", "$6 - $10", "$10+"],
    "Spread Type": ["Floating Spread", "Fixed Spread"],
    "Minimum Deposit": ["$0 - $100", "$101 - $200", "$500 - $1,000", "$10,000+"],
    Accounts: ["Standard Account", "Mini/Micro Account", "VIP/Premium Account", "ECN Account"],
    Products: ["Forex", "CFDs", "Commodities", "Indices", "Crypto"],
  };

  const FilterSidebar = (
    <div className="glass self-start rounded-2xl p-4 ring-1 ring-violet-400/20">
      {Object.entries(brokerFilterOptions).map(([group, options], i) => (
        <div key={group} className={i > 0 ? "mt-3 border-t border-white/10 pt-3" : ""}>
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold">{group}</div>
            <ChevronDown className="h-3 w-3" />
          </div>
          <div className="mt-2 space-y-1.5 text-[11px] text-muted-foreground">
            {options.map((option) => (
              <label key={option} className="flex items-center gap-2">
                <input type="checkbox" className="accent-fuchsia-400" /> {option}
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a0b2e] via-[#1f0d3d] to-[#150829] text-white">
      <SiteHeader />
      <div className="container-app py-6 sm:py-8">
        {/* Top bar */}
        <div className="mb-4 flex items-center justify-between text-xs">
          <Link to="/" className="text-muted-foreground hover:text-white">← Back to home</Link>
        </div>

        {/* Header */}
        <div className="glass-strong mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-violet-900/30 p-4 ring-1 ring-violet-400/20">
          <div>
            <h1 className="text-xl font-bold">Compare Prop Firm — Broker vs Broker</h1>
            <p className="text-[11px] text-muted-foreground">Compare up to {MAX_BRANDS} brands side by side. Your recent comparisons are saved automatically.</p>
          </div>
          <div className="glass-pill hidden items-center gap-2 rounded-full px-3 py-1.5 md:flex">
            <Search className="h-3.5 w-3.5 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="search firm"
              className="w-44 bg-transparent text-xs outline-none placeholder:text-muted-foreground"
            />
          </div>
          <div className="flex items-center gap-2">
            <button className="rounded-full bg-fuchsia-300/30 px-4 py-1.5 text-xs font-semibold ring-1 ring-fuchsia-300/40">How it works</button>
            <button
              onClick={() => setView(view === "addFirm" ? "compare" : "addFirm")}
              className="inline-flex items-center gap-1 rounded-full bg-fuchsia-300/30 px-4 py-1.5 text-xs font-semibold ring-1 ring-fuchsia-300/40"
            >
              <Plus className="h-3 w-3" /> {view === "addFirm" ? "Back to Compare" : "Add Firm"}
            </button>
          </div>
        </div>

        {/* Recent comparisons */}
        {recent.length > 0 && (
          <div className="glass mb-4 rounded-2xl p-3 ring-1 ring-violet-400/20">
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold">
              <Clock className="h-3.5 w-3.5" /> Recent comparisons
            </div>
            <div className="flex flex-wrap gap-2">
              {recent.map((r, i) => (
                <button
                  key={i}
                  onClick={() => { setBrands(r.brands); setView("compare"); }}
                  className="glass-pill rounded-full px-3 py-1.5 text-[11px] hover:bg-white/10"
                >
                  {r.brands.join(" vs ")}
                </button>
              ))}
            </div>
          </div>
        )}

        {view === "compare" ? (
          <div className="grid gap-4 lg:grid-cols-[1fr_240px]">
            <div className="space-y-4">
              {/* Selected count + brand cards */}
              <div className="grid gap-4 lg:grid-cols-[200px_1fr]">
                <div className="glass rounded-2xl p-4 ring-1 ring-violet-400/20">
                  <div className="text-sm font-semibold">Selected</div>
                  <div className="mt-2 text-xs text-muted-foreground">{brands.length} / {MAX_BRANDS}</div>
                  <div className="mt-2 text-[11px] text-muted-foreground">Select up to {MAX_BRANDS} firms to compare</div>
                  <button
                    onClick={clearAll}
                    className="mt-4 text-[11px] text-muted-foreground hover:text-white"
                  >
                    🗑 Clear all
                  </button>
                </div>

                <div className="glass rounded-2xl p-4 ring-1 ring-violet-400/20">
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {brands.map((name) => (
                      <div key={name} className="relative rounded-xl bg-white/[0.04] p-3 ring-1 ring-white/10">
                        <button
                          onClick={() => removeBrand(name)}
                          className="absolute right-2 top-2 grid h-5 w-5 place-items-center rounded-full bg-white/10 text-[10px] hover:bg-white/20"
                        >
                          <X className="h-3 w-3" />
                        </button>
                        <div className="flex items-center gap-3">
                          <div className="grid h-12 w-12 place-items-center rounded-lg bg-white text-[10px] font-bold text-violet-700">{name.slice(0, 3).toUpperCase()}</div>
                          <div>
                            <div className="text-xs font-semibold">{name}</div>
                            <div className="mt-0.5 inline-flex items-center gap-1 text-[10px]">
                              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" /> 4.7 <span className="text-muted-foreground">(2,001)</span>
                            </div>
                          </div>
                        </div>
                        <button className="mt-3 w-full rounded-full bg-fuchsia-300/30 py-1.5 text-[11px] font-semibold ring-1 ring-fuchsia-300/40">Visit Website</button>
                      </div>
                    ))}
                    {brands.length < MAX_BRANDS && (
                      <button
                        onClick={() => setView("addFirm")}
                        className="grid place-items-center rounded-xl border-2 border-dashed border-white/15 p-3 text-[11px] text-muted-foreground hover:border-fuchsia-300/50 hover:text-white"
                      >
                        <Plus className="mb-1 h-5 w-5" /> Add firm
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Overview */}
              <div className="glass rounded-2xl p-5 ring-1 ring-violet-400/20">
                <div className="mb-4 flex items-center gap-2">
                  <h3 className="text-lg font-bold">Overview</h3>
                  <Info className="h-4 w-4 text-muted-foreground" />
                </div>
                {brands.length === 0 ? (
                  <div className="py-8 text-center text-xs text-muted-foreground">
                    Add at least 2 brands to compare.
                  </div>
                ) : (
                  <div className="space-y-1 overflow-x-auto">
                    {overviewRows.map((row) => (
                      <div
                        key={row.label}
                        className="grid items-center gap-3 rounded-lg px-2 py-2 text-xs odd:bg-white/[0.02]"
                        style={{ gridTemplateColumns: gridTemplate }}
                      >
                        <div className="text-muted-foreground">▤ {row.label}</div>
                        {brands.map((_, i) => (
                          <div key={i} className="text-center">
                            {row.type === "yes" ? (
                              <span className="inline-flex items-center gap-1 text-emerald-400"><Check className="h-3 w-3" /> Yes</span>
                            ) : row.type === "no" ? (
                              <span className="inline-flex items-center gap-1 text-rose-400"><XCircle className="h-3 w-3" /> No</span>
                            ) : (
                              <span>{row.value}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    ))}

                    {/* Pricing */}
                    <div className="mt-6 border-t border-white/10 pt-4">
                      <div className="mb-3 flex items-center gap-2">
                        <h3 className="text-base font-bold">Pricing (Popular Size)</h3>
                        <Info className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div
                        className="grid items-center gap-3 text-xs"
                        style={{ gridTemplateColumns: gridTemplate }}
                      >
                        <div className="inline-flex items-center gap-2 text-muted-foreground">
                          <span className="grid h-7 w-7 place-items-center rounded-full bg-fuchsia-500/30">$</span>
                          $100,000 Account
                        </div>
                        {brands.map((_, i) => (
                          <div key={i} className="text-center">
                            <div className="text-base font-bold">$520</div>
                            <button className="mt-2 w-full rounded-full bg-fuchsia-300/30 py-1.5 text-[11px] font-semibold ring-1 ring-fuchsia-300/40">See all pricing</button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {FilterSidebar}
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
            {FilterSidebar}

            {/* Firm grid */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filteredFirms.map((name) => {
                const selected = brands.includes(name);
                const full = brands.length >= MAX_BRANDS && !selected;
                return (
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
                      <label className={`flex items-center gap-1.5 text-[10px] ${full ? "opacity-50" : "text-muted-foreground"}`}>
                        <input
                          type="checkbox"
                          className="accent-fuchsia-400"
                          checked={selected}
                          disabled={full}
                          onChange={(e) => {
                            if (e.target.checked) addBrand(name);
                            else removeBrand(name);
                          }}
                        /> {selected ? "Added to compare" : full ? `Max ${MAX_BRANDS} reached` : "Add to compare"}
                      </label>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
