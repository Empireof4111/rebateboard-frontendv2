import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { BadgeCheck, ChevronRight, ExternalLink, FileText, MessageSquare, Search, ShieldCheck, Star } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { fetchPublicAdminBrands, type AdminBrandRecord } from "@/lib/admin-brands-api";
import { fetchPublicReviews } from "@/lib/reviews-api";
import type { ReviewProviderType, ReviewRecord } from "@/lib/reviews-store";

const CATEGORIES: { key: ReviewProviderType; label: string; description: string }[] = [
  { key: "Prop Firm", label: "Prop Firms", description: "Funded trading challenges and accounts" },
  { key: "Broker", label: "Brokers", description: "Forex, CFD and multi-asset brokers" },
  { key: "Exchange", label: "Exchanges", description: "Crypto spot, derivatives and futures" },
  { key: "Tool", label: "Tools & Services", description: "Journals, software and trader services" },
];

export const Route = createFileRoute("/reviews")({
  head: () => ({
    meta: [
      { title: "Verified Trader Reviews | RebateBoard" },
      { name: "description", content: "Browse verified trader experiences that contribute to RebateBoard trust data." },
    ],
  }),
  component: ReviewsHub,
});

function ReviewsHub() {
  const [reviews, setReviews] = useState<ReviewRecord[]>([]);
  const [brands, setBrands] = useState<AdminBrandRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState("");
  const [brand, setBrand] = useState("all");
  const [category, setCategory] = useState<"all" | ReviewProviderType>("all");
  const [rating, setRating] = useState("all");
  const [reviewType, setReviewType] = useState("all");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [sort, setSort] = useState<"newest" | "highest" | "helpful">("newest");

  useEffect(() => {
    let active = true;
    Promise.all([fetchPublicReviews(), fetchPublicAdminBrands()])
      .then(([reviewData, brandData]) => {
        if (!active) return;
        setReviews(reviewData);
        setBrands(brandData);
      })
      .catch(() => active && setError(true))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return reviews
      .filter((item) => brand === "all" || item.brandSlug === brand)
      .filter((item) => category === "all" || item.providerType === category)
      .filter((item) => rating === "all" || Math.round(item.ratings.overall) === Number(rating))
      .filter((item) => reviewType === "all" || item.reviewType === reviewType)
      .filter((item) => !verifiedOnly || item.verifiedTrader || item.proofs.length > 0)
      .filter((item) => !query || [item.brandName, item.userName, item.body, item.reviewType].some((value) => String(value || "").toLowerCase().includes(query)))
      .sort((a, b) => {
        if (sort === "highest") return b.ratings.overall - a.ratings.overall;
        if (sort === "helpful") return Number(b.helpfulCount || 0) - Number(a.helpfulCount || 0);
        return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
      });
  }, [brand, category, rating, reviewType, reviews, search, sort, verifiedOnly]);

  const verifiedCount = reviews.filter((item) => item.verifiedTrader || item.proofs.length > 0).length;
  const reviewTypes = [...new Set(reviews.map((item) => item.reviewType).filter(Boolean))] as string[];

  return (
    <div className="relative min-h-screen">
      <SiteHeader />
      <main className="container-app pb-8 pt-4 sm:pb-10 sm:pt-5">
        <section className="glass rounded-2xl p-6 ring-1 ring-white/10 sm:p-8">
          <div className="grid gap-5 md:grid-cols-[1fr_auto] md:items-end">
            <div>
              <div className="text-xs uppercase tracking-[0.16em] text-violet-300">Trust Engine</div>
              <h1 className="text-gradient mt-2 text-3xl font-bold sm:text-4xl">Verified trader experiences</h1>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                Approved reviews strengthen User Trust, payout reliability, transparency, and customer experience signals across RebateBoard.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Stat value={String(reviews.length)} label="Published reviews" />
                <Stat value={String(verifiedCount)} label="Verified reviews" />
                <Stat value={String(brands.length)} label="Listed brands" />
              </div>
            </div>
            <Link to="/review" className="inline-flex items-center justify-center gap-2 rounded-full rb-gradient-primary px-5 py-2.5 text-sm font-bold text-white">
              <MessageSquare className="h-4 w-4" /> Write a Review
            </Link>
          </div>
        </section>

        <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {CATEGORIES.map((item) => {
            const count = reviews.filter((review) => review.providerType === item.key).length;
            return (
              <button key={item.key} type="button" onClick={() => setCategory(item.key)} className="glass flex items-center justify-between rounded-xl p-4 text-left ring-1 ring-white/10 transition hover:-translate-y-0.5 hover:ring-violet-300/35">
                <div>
                  <div className="text-sm font-semibold text-white">{item.label}</div>
                  <div className="mt-0.5 text-[10px] text-muted-foreground">{item.description}</div>
                  <div className="mt-2 text-[10px] font-semibold text-violet-200">{count} reviews</div>
                </div>
                <ChevronRight className="h-4 w-4 text-violet-300" />
              </button>
            );
          })}
        </section>

        <section className="glass mt-6 rounded-2xl p-4 ring-1 ring-white/10">
          <div className="flex flex-wrap gap-2">
            <label className="flex min-w-[220px] flex-1 items-center gap-2 rounded-xl bg-white/5 px-3 py-2 ring-1 ring-white/10">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search reviews or brands..." className="w-full bg-transparent text-sm text-white outline-none" />
            </label>
            <Filter value={brand} onChange={setBrand}>
              <option value="all">All brands</option>
              {brands.map((item) => <option key={item.slug} value={item.slug}>{item.name}</option>)}
            </Filter>
            <Filter value={category} onChange={(value) => setCategory(value as typeof category)}>
              <option value="all">All categories</option>
              {CATEGORIES.map((item) => <option key={item.key} value={item.key}>{item.label}</option>)}
            </Filter>
            <Filter value={rating} onChange={setRating}>
              <option value="all">All ratings</option>
              {[5, 4, 3, 2, 1].map((value) => <option key={value} value={value}>{value} stars</option>)}
            </Filter>
            <Filter value={reviewType} onChange={setReviewType}>
              <option value="all">All experiences</option>
              {reviewTypes.map((value) => <option key={value} value={value}>{value}</option>)}
            </Filter>
            <Filter value={sort} onChange={(value) => setSort(value as typeof sort)}>
              <option value="newest">Newest</option>
              <option value="highest">Highest rated</option>
              <option value="helpful">Most helpful</option>
            </Filter>
            <button type="button" onClick={() => setVerifiedOnly((value) => !value)} className={`rounded-xl px-3 py-2 text-xs font-semibold ring-1 transition ${verifiedOnly ? "bg-violet-500/15 text-white ring-violet-300/40" : "bg-white/5 text-muted-foreground ring-white/10"}`}>
              Verified only
            </button>
          </div>
        </section>

        <section className="mt-6">
          {loading ? (
            <div className="grid gap-3 md:grid-cols-2">{Array.from({ length: 6 }).map((_, index) => <ReviewSkeleton key={index} />)}</div>
          ) : error ? (
            <State title="We couldn’t load reviews right now" body="Please try again shortly." />
          ) : filtered.length === 0 ? (
            <State title="No reviews match these filters" body="Adjust your filters or share the first verified experience for this brand." />
          ) : (
            <div className="grid gap-3 md:grid-cols-2">{filtered.map((item) => <ReviewCard key={item.id} review={item} />)}</div>
          )}
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

function ReviewCard({ review }: { review: ReviewRecord }) {
  return (
    <article className="glass rounded-2xl p-4 ring-1 ring-white/10 transition hover:-translate-y-0.5 hover:ring-violet-300/30">
      <div className="flex items-start gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full bg-white/5 ring-1 ring-white/10">
          {review.userAvatarUrl ? (
            <img src={review.userAvatarUrl} alt={`${review.userName} profile`} className="h-full w-full object-cover" loading="lazy" />
          ) : (
            <span className="font-bold text-white">{initials(review.userName)}</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <Link to="/firm/$firmId" params={{ firmId: review.brandSlug }} className="text-sm font-bold text-white hover:text-violet-200">{review.brandName}</Link>
              <div className="text-[10px] text-muted-foreground">{review.brandCategory || review.providerType} · {review.reviewType || "Trading Experience"}</div>
            </div>
            <Stars value={review.ratings.overall} />
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[10px] text-muted-foreground">
            <span className="font-semibold text-white/80">{review.userName}</span>
            {review.country ? <span>· {review.country}</span> : null}
            {review.verifiedTrader ? <Badge label="Verified Trader" /> : null}
            {review.proofs.length > 0 ? <Badge label={`${review.proofs.length} public proof${review.proofs.length === 1 ? "" : "s"}`} /> : null}
          </div>
        </div>
      </div>
      <p className="mt-3 line-clamp-4 text-xs leading-relaxed text-white/75">{review.body}</p>
      {review.proofs.length > 0 && <ProofStrip proofs={review.proofs} />}
      <div className="mt-3 flex items-center justify-between text-[10px] text-muted-foreground">
        <span>{new Date(review.submittedAt).toLocaleDateString()}</span>
        <span>{Number(review.helpfulCount || 0)} helpful · TBI contribution</span>
      </div>
    </article>
  );
}

function ProofStrip({ proofs }: { proofs: ReviewRecord["proofs"] }) {
  return (
    <div className="mt-3 rounded-2xl border border-white/10 bg-black/15 p-2">
      <div className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-200">
        <ShieldCheck className="h-3 w-3" />
        Public proof
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {proofs.slice(0, 4).map((proof) => (
          <a
            key={proof.id}
            href={proof.dataUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group/proof relative grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-xl border border-white/10 bg-white/[0.04]"
            aria-label={`Open proof ${proof.name}`}
          >
            {proof.type?.startsWith("image/") ? (
              <img src={proof.dataUrl} alt={proof.name} className="h-full w-full object-cover transition group-hover/proof:scale-105" loading="lazy" />
            ) : (
              <FileText className="h-5 w-5 text-violet-200" />
            )}
            <span className="absolute bottom-1 right-1 rounded-full bg-black/70 p-0.5 text-white">
              <ExternalLink className="h-2.5 w-2.5" />
            </span>
          </a>
        ))}
        {proofs.length > 4 && (
          <span className="grid h-16 w-16 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-xs font-bold text-white/75">
            +{proofs.length - 4}
          </span>
        )}
      </div>
    </div>
  );
}

function Stars({ value }: { value: number }) {
  return <div className="flex">{Array.from({ length: 5 }).map((_, index) => <Star key={index} className={`h-3.5 w-3.5 ${index < Math.round(value) ? "fill-violet-400 text-violet-400" : "text-white/15"}`} />)}</div>;
}

function Badge({ label }: { label: string }) {
  return <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-emerald-200 ring-1 ring-emerald-300/20"><BadgeCheck className="h-2.5 w-2.5" />{label}</span>;
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "RB";
}

function Filter({ value, onChange, children }: { value: string; onChange: (value: string) => void; children: ReactNode }) {
  return <select value={value} onChange={(event) => onChange(event.target.value)} className="rounded-xl bg-[var(--rb-bg-input)] px-3 py-2 text-xs text-white ring-1 ring-white/10 outline-none focus:ring-violet-300/40">{children}</select>;
}

function Stat({ value, label }: { value: string; label: string }) {
  return <div className="rounded-xl bg-white/[0.04] px-3 py-2 ring-1 ring-white/10"><div className="font-bold text-white">{value}</div><div className="text-[9px] uppercase tracking-wide text-muted-foreground">{label}</div></div>;
}

function ReviewSkeleton() {
  return <div className="glass animate-pulse rounded-2xl p-4 ring-1 ring-white/10"><div className="flex gap-3"><div className="h-11 w-11 rounded-xl bg-white/10" /><div className="flex-1 space-y-2"><div className="h-3 w-2/5 rounded bg-white/10" /><div className="h-2 w-3/5 rounded bg-white/5" /></div></div><div className="mt-4 h-2 rounded bg-white/5" /><div className="mt-2 h-2 w-4/5 rounded bg-white/5" /></div>;
}

function State({ title, body }: { title: string; body: string }) {
  return <div className="glass rounded-2xl p-10 text-center ring-1 ring-white/10"><ShieldCheck className="mx-auto h-7 w-7 text-violet-300" /><h2 className="mt-3 font-semibold text-white">{title}</h2><p className="mt-1 text-sm text-muted-foreground">{body}</p></div>;
}
