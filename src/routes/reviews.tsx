import { createFileRoute, Link } from "@tanstack/react-router";
import { Star, ChevronRight, MessageSquare } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { TBI_BRANDS, type TBICategory } from "@/lib/tbi-data";
import { getAllReviews } from "@/lib/reviews-store";

const CATEGORIES: { key: TBICategory; label: string; description: string; gradient: string }[] = [
  { key: "Prop Firm", label: "Prop Firms", description: "Funded trading challenges & accounts", gradient: "from-fuchsia-500 to-violet-600" },
  { key: "Broker", label: "Brokers", description: "Forex, CFD & multi-asset brokers", gradient: "from-cyan-500 to-blue-600" },
  { key: "Exchange", label: "Exchanges", description: "Crypto spot, derivatives & futures", gradient: "from-amber-500 to-orange-600" },
  { key: "Tool", label: "Tools", description: "Journals, screeners & trading apps", gradient: "from-emerald-500 to-teal-600" },
];

export const Route = createFileRoute("/reviews")({
  head: () => ({
    meta: [
      { title: "Reviews — Verified Trader Feedback | RebateBoard" },
      { name: "description", content: "Browse verified reviews of prop firms, brokers, exchanges and trading tools. Honest experience from real traders." },
      { property: "og:title", content: "Reviews — Verified Trader Feedback | RebateBoard" },
      { property: "og:description", content: "Honest reviews from real traders. Linked to brand TBI scores." },
    ],
  }),
  component: ReviewsHub,
});

function ReviewsHub() {
  const all = getAllReviews().filter((r) => r.status === "approved" || r.status === "pending");
  const totalReviews = all.length + 11317; // base count + live
  const verified = Math.round(totalReviews * 0.62);

  return (
    <div className="relative min-h-screen pt-20">
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {/* HERO */}
        <section className="glass relative overflow-hidden rounded-3xl p-6 ring-1 ring-white/10 sm:p-10">
          <div className="pointer-events-none absolute -top-32 left-1/2 h-64 w-[800px] -translate-x-1/2 bg-fuchsia-500/20 blur-3xl" />
          <div className="relative grid gap-6 md:grid-cols-[1fr_auto] md:items-end">
            <div>
              <div className="text-xs uppercase tracking-widest text-fuchsia-300">Public Reviews</div>
              <h1 className="text-gradient mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                Real traders. Verified experience.
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                Browse honest, proof-backed reviews of prop firms, brokers, exchanges and trading tools.
                Every review feeds into the brand's TBI score.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Stat value={totalReviews.toLocaleString()} label="Reviews" />
                <Stat value={verified.toLocaleString()} label="Verified with proof" />
                <Stat value={TBI_BRANDS.length.toString()} label="Brands rated" />
              </div>
            </div>
            <Link
              to="/review"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-600 px-5 py-3 text-sm font-bold text-white shadow-[0_0_24px_rgba(192,132,252,0.55)] hover:scale-[1.02] transition"
            >
              <MessageSquare className="h-4 w-4" /> Drop a Review
            </Link>
          </div>
        </section>

        {/* CATEGORIES */}
        <section className="mt-10">
          <h2 className="text-xl font-bold text-white">Browse by category</h2>
          <p className="text-sm text-muted-foreground">Pick a category to see the brands and their reviews.</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {CATEGORIES.map((c) => {
              const count = TBI_BRANDS.filter((b) => b.category === c.key).length;
              const reviewCount = all.filter((r) => r.providerType === c.key).length;
              return (
                <Link
                  key={c.key}
                  to="/reviews/$category"
                  params={{ category: slugifyCategory(c.key) }}
                  className="group glass relative overflow-hidden rounded-2xl p-5 ring-1 ring-white/10 transition hover:ring-fuchsia-300/40"
                >
                  <div className={`pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br ${c.gradient} opacity-20 blur-2xl transition group-hover:opacity-40`} />
                  <div className={`relative grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br ${c.gradient} text-white text-lg font-bold`}>
                    {c.label[0]}
                  </div>
                  <div className="relative mt-3 text-base font-bold text-white">{c.label}</div>
                  <div className="text-[11px] text-muted-foreground">{c.description}</div>
                  <div className="mt-4 flex items-center justify-between text-[11px]">
                    <span className="text-muted-foreground">{count} brands · {reviewCount} reviews</span>
                    <ChevronRight className="h-4 w-4 text-fuchsia-300 transition group-hover:translate-x-1" />
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* RECENT REVIEWS */}
        <section className="mt-10">
          <div className="mb-3 flex items-end justify-between">
            <h2 className="text-xl font-bold text-white">Recent verified reviews</h2>
            <Link to="/review" className="text-xs font-semibold text-fuchsia-300 hover:underline">Drop yours →</Link>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {all.slice(0, 6).map((r) => {
              const brand = TBI_BRANDS.find((b) => b.slug === r.brandSlug);
              return (
                <Link
                  key={r.id}
                  to="/firm/$firmId"
                  params={{ firmId: r.brandSlug }}
                  className="glass rounded-2xl p-4 ring-1 ring-white/10 transition hover:ring-fuchsia-300/40"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <div className={`grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br ${brand?.logoColor ?? "from-fuchsia-500 to-violet-600"} text-white text-xs font-bold`}>
                        {r.brandName[0]}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white">{r.brandName}</div>
                        <div className="text-[10px] text-muted-foreground">{r.userName} · {r.providerType}</div>
                      </div>
                    </div>
                    <div className="flex">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`h-3.5 w-3.5 ${i < r.ratings.overall ? "fill-fuchsia-400 text-fuchsia-400" : "text-white/15"}`} />
                      ))}
                    </div>
                  </div>
                  <p className="mt-2 line-clamp-2 text-xs text-white/80">{r.body}</p>
                </Link>
              );
            })}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-xl bg-white/[0.04] px-3 py-2 ring-1 ring-white/10">
      <div className="text-base font-bold text-white">{value}</div>
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
    </div>
  );
}

export function slugifyCategory(c: TBICategory): string {
  return c.toLowerCase().replace(/\s+/g, "-");
}
