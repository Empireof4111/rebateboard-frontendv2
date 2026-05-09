import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { Search, Star, ChevronLeft, MessageSquare, ShieldCheck } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { TBI_BRANDS, type TBICategory } from "@/lib/tbi-data";
import { getAllReviews } from "@/lib/reviews-store";

const CATEGORY_MAP: Record<string, { key: TBICategory; label: string; gradient: string }> = {
  "prop-firm": { key: "Prop Firm", label: "Prop Firms", gradient: "from-fuchsia-500 to-violet-600" },
  "broker": { key: "Broker", label: "Brokers", gradient: "from-cyan-500 to-blue-600" },
  "exchange": { key: "Exchange", label: "Exchanges", gradient: "from-amber-500 to-orange-600" },
  "tool": { key: "Tool", label: "Tools", gradient: "from-emerald-500 to-teal-600" },
};

export const Route = createFileRoute("/reviews/$category")({
  beforeLoad: ({ params }) => {
    if (!CATEGORY_MAP[params.category]) throw notFound();
  },
  head: ({ params }) => {
    const meta = CATEGORY_MAP[params.category];
    const label = meta?.label ?? "Reviews";
    return {
      meta: [
        { title: `${label} Reviews — RebateBoard` },
        { name: "description", content: `Verified reviews of ${label.toLowerCase()} from real traders.` },
        { property: "og:title", content: `${label} Reviews — RebateBoard` },
      ],
    };
  },
  component: CategoryReviews,
  notFoundComponent: () => (
    <div className="min-h-screen pt-24 text-center">
      <p className="text-sm text-muted-foreground">Category not found.</p>
      <Link to="/reviews" className="mt-2 inline-block text-fuchsia-300 underline">Back to reviews</Link>
    </div>
  ),
});

function CategoryReviews() {
  const { category } = Route.useParams();
  const meta = CATEGORY_MAP[category]!;
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"score" | "reviews">("score");

  const brands = TBI_BRANDS
    .filter((b) => b.category === meta.key && b.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => sort === "score" ? b.score - a.score : b.reviewCount - a.reviewCount);

  const allReviews = getAllReviews();

  return (
    <div className="relative min-h-screen pt-20">
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <Link to="/reviews" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-white">
          <ChevronLeft className="h-3.5 w-3.5" /> All categories
        </Link>

        <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className={`text-gradient text-3xl font-bold sm:text-4xl`}>{meta.label}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{brands.length} brands · click any brand to read full reviews.</p>
          </div>
          <Link
            to="/review"
            search={{ providerType: meta.key }}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-600 px-4 py-2 text-xs font-bold text-white shadow-[0_0_18px_rgba(192,132,252,0.5)]"
          >
            <MessageSquare className="h-4 w-4" /> Drop a Review
          </Link>
        </div>

        {/* controls */}
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <div className="flex flex-1 min-w-[220px] items-center gap-2 rounded-full bg-white/5 px-4 py-2 ring-1 ring-white/10">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Search ${meta.label.toLowerCase()}…`}
              className="w-full bg-transparent text-sm text-white outline-none placeholder:text-muted-foreground"
            />
          </div>
          <div className="flex gap-1 rounded-full bg-white/5 p-1 ring-1 ring-white/10">
            {(["score", "reviews"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSort(s)}
                className={"rounded-full px-3 py-1.5 text-xs font-semibold capitalize " + (sort === s ? "bg-gradient-to-r from-fuchsia-500 to-violet-600 text-white" : "text-muted-foreground hover:text-white")}
              >
                {s === "score" ? "TBI score" : "Most reviewed"}
              </button>
            ))}
          </div>
        </div>

        {/* brand grid */}
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {brands.map((b) => {
            const liveCount = allReviews.filter((r) => r.brandSlug === b.slug && r.status === "approved").length;
            return (
              <Link
                key={b.slug}
                to="/firm/$firmId"
                params={{ firmId: b.slug }}
                hash="reviews"
                className="group glass rounded-2xl p-4 ring-1 ring-white/10 transition hover:ring-fuchsia-300/40"
              >
                <div className="flex items-center gap-3">
                  <div className={`grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br ${b.logoColor} text-white text-base font-bold`}>
                    {b.name[0]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-bold text-white">{b.name}</div>
                    <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{b.country}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-base font-bold text-white">{b.score.toFixed(1)}</div>
                    <div className="text-[9px] text-muted-foreground">/{b.maxScore} TBI</div>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between text-[11px]">
                  <div className="inline-flex items-center gap-1 text-muted-foreground">
                    <Star className="h-3 w-3 fill-fuchsia-400 text-fuchsia-400" />
                    {b.reviewCount + liveCount} reviews
                  </div>
                  <div className="inline-flex items-center gap-1 text-emerald-300">
                    <ShieldCheck className="h-3 w-3" />
                    {b.verifiedReviews} verified
                  </div>
                </div>
              </Link>
            );
          })}
          {brands.length === 0 && (
            <div className="col-span-full rounded-2xl bg-white/[0.03] p-10 text-center text-sm text-muted-foreground ring-1 ring-white/10">
              No {meta.label.toLowerCase()} match "{search}".
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
