import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { EmptyState, PageHeader, Pill, SkeletonCard } from "@/components/dashboard/Primitives";
import { fetchPublicAdminBrands, type AdminBrandRecord } from "@/lib/admin-brands-api";
import {
  Activity, ArrowRight, Bitcoin, Building2, Filter, Layers, LineChart, Search, Star,
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
type SortId = "tbi" | "rebate" | "payout";

const tabs: { id: Category; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "all", label: "All", icon: Layers },
  { id: "forex", label: "Forex Brokers", icon: LineChart },
  { id: "prop", label: "Prop Firms", icon: Building2 },
  { id: "crypto", label: "Crypto Exchanges", icon: Bitcoin },
  { id: "futures", label: "Futures", icon: Activity },
];

const sortOptions: { id: SortId; label: string }[] = [
  { id: "tbi", label: "Top TBI" },
  { id: "rebate", label: "Best Rebate" },
  { id: "payout", label: "Payout Data" },
];

function dashboardCategory(category: string): Exclude<Category, "all"> {
  const value = category.toLowerCase();
  if (value.includes("forex broker")) return "forex";
  if (value.includes("futures")) return "futures";
  if (value.includes("crypto exchange") || value.includes("crypto prop") || value.includes("dex")) return "crypto";
  return "prop";
}

function labelFor(category: string) {
  return category || "Brand";
}

function numericCashback(brand: AdminBrandRecord) {
  const cashback = brand.cashback ?? {};
  const candidates = [
    cashback.maxPct,
    cashback.maximumPct,
    cashback.maxPercent,
    cashback.defaultPct,
    cashback.percent,
    cashback.rate,
  ];
  const value = candidates.map(Number).find((item) => Number.isFinite(item) && item > 0);
  return value ?? 0;
}

function formatCashback(brand: AdminBrandRecord) {
  const cashback = brand.cashback ?? {};
  const value = numericCashback(brand);
  if (value > 0) return `Up to ${value}%`;
  const label = cashback.label ?? cashback.summary ?? cashback.terms;
  return typeof label === "string" && label.trim() ? label.trim() : "Not provided";
}

function ProgramsPage() {
  const [cat, setCat] = useState<Category>("all");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<SortId>("tbi");
  const [brands, setBrands] = useState<AdminBrandRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchPublicAdminBrands()
      .then((items) => {
        if (!cancelled) setBrands(items);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const list = useMemo(() => {
    let next = brands.filter((brand) => (cat === "all" ? true : dashboardCategory(brand.category) === cat));
    const query = q.trim().toLowerCase();
    if (query) {
      next = next.filter((brand) => [brand.name, brand.category, brand.payouts].filter(Boolean).join(" ").toLowerCase().includes(query));
    }
    if (sort === "tbi") next = [...next].sort((a, b) => Number(b.tbi ?? 0) - Number(a.tbi ?? 0));
    if (sort === "rebate") next = [...next].sort((a, b) => numericCashback(b) - numericCashback(a));
    if (sort === "payout") next = [...next].sort((a, b) => String(a.payouts || "").localeCompare(String(b.payouts || "")));
    return next;
  }, [brands, cat, q, sort]);

  const counts = useMemo(() => {
    const next: Record<Category, number> = { all: brands.length, forex: 0, prop: 0, crypto: 0, futures: 0 };
    brands.forEach((brand) => { next[dashboardCategory(brand.category)] += 1; });
    return next;
  }, [brands]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Programs"
        subtitle="Pick your trading vehicle — every broker, prop firm, exchange, and futures program in one place."
      />

      <div className="glass rounded-2xl p-4">
        <div className="flex flex-wrap items-center gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = cat === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setCat(tab.id)}
                className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition ${
                  active
                    ? "rb-gradient-primary text-white shadow-[0_0_18px_rgba(192,132,252,0.4)]"
                    : "bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {tab.label}
                <span className={`rounded-full px-1.5 text-[10px] ${active ? "bg-black/20 text-white" : "bg-white/10 text-white/70"}`}>
                  {counts[tab.id]}
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
              onChange={(event) => setQ(event.target.value)}
              placeholder="Search programs..."
              className="w-full bg-transparent outline-none placeholder:text-muted-foreground"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5 text-muted-foreground" />
            {sortOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => setSort(option.id)}
                className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
                  sort === option.id ? "bg-white/15 text-white" : "bg-white/5 text-muted-foreground hover:text-white"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((item) => <SkeletonCard key={item} />)}
        </div>
      ) : list.length > 0 ? (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {list.map((brand) => (
            <div key={brand.id} className="glass rounded-2xl p-4 ring-1 ring-white/5 transition hover:ring-primary/30">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  {brand.thumbnail ? (
                    <img src={brand.thumbnail} alt="" className="h-11 w-11 shrink-0 rounded-xl object-contain ring-1 ring-white/10" />
                  ) : (
                    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white/10 text-sm font-bold text-white">
                      {brand.name.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="truncate text-base font-semibold text-white">{brand.name}</div>
                    <Pill>{labelFor(brand.category)}</Pill>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="text-[10px] uppercase text-muted-foreground">TBI</div>
                  <div className="flex items-center gap-1 text-lg font-bold text-violet-300">
                    <Star className="h-3.5 w-3.5 fill-current" /> {Number(brand.tbi ?? 0).toFixed(1)}
                  </div>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
                <div className="rounded-lg bg-white/[0.04] px-2 py-1.5">
                  <div className="text-muted-foreground">Cashback</div>
                  <div className="truncate font-semibold text-emerald-400">{formatCashback(brand)}</div>
                </div>
                <div className="rounded-lg bg-white/[0.04] px-2 py-1.5">
                  <div className="text-muted-foreground">Payout</div>
                  <div className="truncate font-semibold text-white">{brand.payouts || "Not provided"}</div>
                </div>
              </div>

              <div className="mt-3 flex gap-2">
                <Link
                  to={"/payouts/$brandSlug" as string}
                  params={{ brandSlug: brand.slug }}
                  className="flex-1 rounded-lg bg-white/5 py-2 text-center text-xs text-white hover:bg-white/10"
                >
                  View payouts
                </Link>
                <Link
                  to={"/firm/$firmId" as string}
                  params={{ firmId: brand.slug }}
                  className="inline-flex items-center gap-1 rounded-lg rb-gradient-primary px-3 py-2 text-xs font-semibold text-white"
                >
                  View brand <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Layers}
          title="No published programs yet"
          description="Browse Programs to find supported brokers, prop firms, exchanges, and tools as they become available."
          action={<Link to="/programs" className="rounded-full rb-gradient-primary px-4 py-2 text-xs font-semibold text-white">Browse Programs</Link>}
        />
      )}
    </div>
  );
}
