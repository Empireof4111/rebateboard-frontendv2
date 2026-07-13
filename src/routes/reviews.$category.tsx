import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, MessageSquare, Search, ShieldCheck, Star } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { fetchPublicAdminBrands, type AdminBrandRecord } from "@/lib/admin-brands-api";
import { fetchPublicReviews } from "@/lib/reviews-api";
import type { ReviewProviderType, ReviewRecord } from "@/lib/reviews-store";

const CATEGORY_MAP: Record<string, { key: ReviewProviderType; label: string; description: string }> = {
  "prop-firm": { key: "Prop Firm", label: "Prop Firms", description: "Funded trader programs and payout experiences" },
  broker: { key: "Broker", label: "Brokers", description: "Broker fees, execution, support, and withdrawal experiences" },
  exchange: { key: "Exchange", label: "Exchanges", description: "Security, liquidity, fees, and withdrawal experiences" },
  tool: { key: "Tool", label: "Tools & Services", description: "Trading tools, platforms, education, and software experiences" },
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
        { title: `${label} Reviews | RebateBoard` },
        { name: "description", content: `Verified trader reviews for ${label.toLowerCase()} on RebateBoard.` },
      ],
    };
  },
  component: CategoryReviews,
});

function CategoryReviews() {
  const { category } = Route.useParams();
  const meta = CATEGORY_MAP[category]!;
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"reviews" | "score">("reviews");
  const [brands, setBrands] = useState<AdminBrandRecord[]>([]);
  const [reviews, setReviews] = useState<ReviewRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.all([fetchPublicAdminBrands(), fetchPublicReviews()])
      .then(([brandData, reviewData]) => {
        if (!active) return;
        setBrands(brandData);
        setReviews(reviewData);
      })
      .catch(() => active && setError(true))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  const categoryBrands = useMemo(() => {
    const query = search.trim().toLowerCase();
    return brands
      .filter((brand) => reviewCategoryForBrand(brand.category) === meta.key)
      .filter((brand) => !query || brand.name.toLowerCase().includes(query))
      .sort((a, b) => {
        if (sort === "score") return normalizeTbi(b) - normalizeTbi(a);
        return reviewCountFor(b.slug, reviews) - reviewCountFor(a.slug, reviews);
      });
  }, [brands, meta.key, reviews, search, sort]);

  const categoryReviews = reviews.filter((review) => review.providerType === meta.key);

  return (
    <div className="relative min-h-screen pt-20">
      <SiteHeader />
      <main className="container-app py-8 sm:py-10">
        <Link to="/reviews" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-white">
          <ChevronLeft className="h-3.5 w-3.5" /> All reviews
        </Link>

        <section className="glass mt-3 rounded-2xl p-6 ring-1 ring-white/10 sm:p-8">
          <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
            <div>
              <div className="text-xs uppercase tracking-[0.16em] text-violet-300">Verified Reviews</div>
              <h1 className="text-gradient mt-2 text-3xl font-bold sm:text-4xl">{meta.label}</h1>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{meta.description}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Stat value={String(categoryBrands.length)} label="Listed brands" />
                <Stat value={String(categoryReviews.length)} label="Published reviews" />
                <Stat value={String(categoryReviews.filter((item) => item.verifiedTrader || item.proofs.length > 0).length)} label="Verified reviews" />
              </div>
            </div>
            <Link to="/review" search={{ providerType: meta.key }} className="inline-flex items-center justify-center gap-2 rounded-full rb-gradient-primary px-5 py-2.5 text-xs font-bold text-white">
              <MessageSquare className="h-4 w-4" /> Write a Review
            </Link>
          </div>
        </section>

        <section className="glass mt-6 rounded-2xl p-4 ring-1 ring-white/10">
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex min-w-[240px] flex-1 items-center gap-2 rounded-full bg-white/5 px-4 py-2 ring-1 ring-white/10">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={`Search ${meta.label.toLowerCase()}...`}
                className="w-full bg-transparent text-sm text-white outline-none"
              />
            </label>
            {(["reviews", "score"] as const).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setSort(item)}
                className={`rounded-full px-3 py-2 text-xs font-semibold transition ${sort === item ? "bg-violet-500/15 text-white ring-1 ring-violet-300/35" : "bg-white/5 text-muted-foreground ring-1 ring-white/10 hover:text-white"}`}
              >
                {item === "score" ? "TBI score" : "Most reviewed"}
              </button>
            ))}
          </div>
        </section>

        <section className="mt-6">
          {loading ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }).map((_, index) => <BrandSkeleton key={index} />)}</div>
          ) : error ? (
            <State title="Reviews could not be loaded" body="Please try again shortly." />
          ) : categoryBrands.length === 0 ? (
            <State title={`No ${meta.label.toLowerCase()} found`} body="New verified providers will appear here as soon as they are published." />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {categoryBrands.map((brand) => <BrandReviewCard key={brand.id} brand={brand} reviews={reviews} />)}
            </div>
          )}
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

function BrandReviewCard({ brand, reviews }: { brand: AdminBrandRecord; reviews: ReviewRecord[] }) {
  const brandReviews = reviews.filter((review) => review.brandSlug === brand.slug);
  const verifiedCount = brandReviews.filter((review) => review.verifiedTrader || review.proofs.length > 0).length;
  const avgRating = brandReviews.length
    ? brandReviews.reduce((sum, review) => sum + review.ratings.overall, 0) / brandReviews.length
    : 0;

  return (
    <Link to="/firm/$firmId" params={{ firmId: brand.slug }} hash="reviews" className="glass group rounded-2xl p-4 ring-1 ring-white/10 transition hover:-translate-y-0.5 hover:ring-violet-300/40">
      <div className="flex items-center gap-3">
        <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-xl bg-white/[0.04] ring-1 ring-white/10">
          {brand.thumbnail ? <img src={brand.thumbnail} alt="" className="h-full w-full object-cover" loading="lazy" /> : <span className="font-bold text-white">{brand.name[0]}</span>}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-bold text-white">{brand.name}</div>
          <div className="truncate text-[10px] text-muted-foreground">{brand.category}</div>
        </div>
        <div className="text-right">
          <div className="text-base font-bold text-white">{normalizeTbi(brand).toFixed(1)}</div>
          <div className="text-[9px] text-muted-foreground">TBI</div>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        <MiniStat label="Reviews" value={String(brandReviews.length)} />
        <MiniStat label="Verified" value={String(verifiedCount)} />
        <MiniStat label="Rating" value={avgRating ? avgRating.toFixed(1) : "Pending"} />
      </div>
      <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-1"><Star className="h-3 w-3 text-violet-300" /> User Trust data</span>
        <span className="inline-flex items-center gap-1 text-emerald-300"><ShieldCheck className="h-3 w-3" /> Read reviews</span>
      </div>
    </Link>
  );
}

function reviewCategoryForBrand(category?: string): ReviewProviderType {
  const value = (category || "").toLowerCase();
  if (value.includes("broker")) return "Broker";
  if (value.includes("exchange")) return "Exchange";
  if (value.includes("software") || value.includes("tool") || value.includes("journal") || value.includes("calculator") || value.includes("education") || value.includes("platform")) return "Tool";
  return "Prop Firm";
}

function normalizeTbi(brand: AdminBrandRecord) {
  const raw = Number(brand.trust?.tbiScore ?? brand.trust?.tbi ?? brand.tbi ?? 0);
  if (!Number.isFinite(raw)) return 0;
  return raw > 10 ? raw / 10 : raw;
}

function reviewCountFor(slug: string, reviews: ReviewRecord[]) {
  return reviews.filter((review) => review.brandSlug === slug).length;
}

function Stat({ value, label }: { value: string; label: string }) {
  return <div className="rounded-xl bg-white/[0.04] px-3 py-2 ring-1 ring-white/10"><div className="font-bold text-white">{value}</div><div className="text-[9px] uppercase tracking-wide text-muted-foreground">{label}</div></div>;
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl bg-white/[0.04] p-2 ring-1 ring-white/10"><div className="text-[9px] uppercase text-muted-foreground">{label}</div><div className="mt-1 truncate text-xs font-bold text-white">{value}</div></div>;
}

function BrandSkeleton() {
  return <div className="glass animate-pulse rounded-2xl p-4 ring-1 ring-white/10"><div className="flex gap-3"><div className="h-12 w-12 rounded-xl bg-white/10" /><div className="flex-1 space-y-2"><div className="h-3 w-2/5 rounded bg-white/10" /><div className="h-2 w-3/5 rounded bg-white/5" /></div></div><div className="mt-4 grid grid-cols-3 gap-2"><div className="h-12 rounded-xl bg-white/5" /><div className="h-12 rounded-xl bg-white/5" /><div className="h-12 rounded-xl bg-white/5" /></div></div>;
}

function State({ title, body }: { title: string; body: string }) {
  return <div className="glass rounded-2xl p-10 text-center ring-1 ring-white/10"><ShieldCheck className="mx-auto h-7 w-7 text-violet-300" /><h2 className="mt-3 font-semibold text-white">{title}</h2><p className="mt-1 text-sm text-muted-foreground">{body}</p></div>;
}
