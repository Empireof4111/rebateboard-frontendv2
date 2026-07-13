import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Search, Plus, Minus, BookOpen, ArrowUpRight, MessageCircle, Sparkles } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import {
  articleRouteId,
  fetchPublicBlogPosts,
  fetchPublicFaqs,
  type BlogPost,
  type Faq,
} from "@/lib/admin-api";
import { resolvePublicFaqContent } from "@/lib/public-faq-content";

export const Route = createFileRoute("/faqs")({
  head: () => ({
    meta: [
      { title: "FAQs & Help Center — RebateBoard" },
      {
        name: "description",
        content:
          "Answers about RebateBoard cashback, prop firms, brokers, exchanges, payouts and partner brands — plus editorial articles.",
      },
      { property: "og:title", content: "FAQs & Help Center — RebateBoard" },
      {
        property: "og:description",
        content:
          "Get clear answers about cashback, payouts, prop firms, brokers, exchanges and partner brands.",
      },
    ],
  }),
  component: FaqsPage,
});

const CATEGORY_BLURBS: Record<string, string> = {
  General: "Platform basics and how to get started.",
  Account: "Account, identity verification and security.",
  Wallet: "Withdrawals, balances and supported methods.",
  Cashback: "How rebates are calculated, tracked and paid.",
  Claims: "Submitting and resolving cashback claims.",
  Rewards: "Rebate Rewards, trader progress and platform missions.",
  Reviews: "Review verification, moderation and trust signals.",
  TBI: "How the Trust & Brand Index scoring works.",
};

function FaqsPage() {
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [blog, setBlog] = useState<BlogPost[]>([]);
  const [loadingFaqs, setLoadingFaqs] = useState(true);

  const [query, setQuery] = useState("");
  const [activeCat, setActiveCat] = useState<string>("all");
  const [openKey, setOpenKey] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadContent() {
      setLoadingFaqs(true);
      try {
        const [faqRows, articleRows] = await Promise.all([
          fetchPublicFaqs(),
          fetchPublicBlogPosts(),
        ]);
        if (!cancelled) {
          setFaqs(resolvePublicFaqContent(faqRows));
          setBlog(articleRows);
        }
      } catch {
        if (!cancelled) {
          setFaqs(resolvePublicFaqContent([]));
          setBlog([]);
        }
      } finally {
        if (!cancelled) setLoadingFaqs(false);
      }
    }

    void loadContent();
    return () => {
      cancelled = true;
    };
  }, []);

  const publishedFaqs = useMemo(() => faqs.filter((f) => f.status === "published"), [faqs]);
  const articles = useMemo(() => blog.filter((b) => b.status === "published"), [blog]);

  const categories = useMemo(() => {
    const map = new Map<string, Faq[]>();
    for (const f of publishedFaqs) {
      if (!map.has(f.category)) map.set(f.category, []);
      map.get(f.category)!.push(f);
    }
    return Array.from(map.entries()).map(([key, list]) => ({
      key,
      label: key,
      blurb: CATEGORY_BLURBS[key] ?? "",
      faqs: list,
    }));
  }, [publishedFaqs]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return categories
      .map((c) => ({
        ...c,
        faqs: c.faqs.filter(
          (f) =>
            (activeCat === "all" || activeCat === c.key) &&
            (!q || f.question.toLowerCase().includes(q) || f.answer.toLowerCase().includes(q)),
        ),
      }))
      .filter((c) => c.faqs.length > 0);
  }, [query, activeCat, categories]);

  return (
    <div className="min-h-screen bg-[var(--rb-bg-canvas)] text-white">
      <SiteHeader />

      <main className="container-app py-8 sm:py-10">
        {/* Hero */}
        <section className="text-center">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1 text-[11px] uppercase tracking-widest text-muted-foreground ring-1 ring-white/10">
            <Sparkles className="h-3 w-3 text-fuchsia-300" /> Help Center
          </div>
          <h1 className="mt-4 text-3xl font-bold sm:text-5xl">Everything you need to know</h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground sm:text-base">
            Browse {loadingFaqs ? "trusted" : publishedFaqs.length} answers about RebateBoard, our
            partner brands, prop firms, brokers, exchanges, payouts and the trading industry at
            large.
          </p>

          <div className="mx-auto mt-6 flex max-w-xl items-center gap-2 rounded-full bg-white/[0.05] px-4 py-2 ring-1 ring-white/10">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search questions, brands, topics…"
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            <button
              onClick={() => setActiveCat("all")}
              className={`rounded-full px-3 py-1 text-[11px] font-semibold ring-1 transition ${
                activeCat === "all"
                  ? "rb-gradient-primary text-white ring-fuchsia-300/40"
                  : "bg-white/[0.04] text-white/80 ring-white/10 hover:bg-white/[0.08]"
              }`}
            >
              All
            </button>
            {categories.map((c) => (
              <button
                key={c.key}
                onClick={() => setActiveCat(c.key)}
                className={`rounded-full px-3 py-1 text-[11px] font-semibold ring-1 transition ${
                  activeCat === c.key
                    ? "rb-gradient-primary text-white ring-fuchsia-300/40"
                    : "bg-white/[0.04] text-white/80 ring-white/10 hover:bg-white/[0.08]"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </section>

        {/* Category sections */}
        <section className="mt-8 space-y-8">
          {loadingFaqs && (
            <FaqPageSkeleton />
          )}
          {!loadingFaqs && publishedFaqs.length === 0 && (
            <div className="rounded-2xl bg-white/[0.04] p-10 text-center text-sm text-muted-foreground ring-1 ring-white/10">
              Helpful answers will appear here soon.
            </div>
          )}
          {!loadingFaqs && publishedFaqs.length > 0 && filtered.length === 0 && (
            <div className="rounded-2xl bg-white/[0.04] p-10 text-center text-sm text-muted-foreground ring-1 ring-white/10">
              No answers match “{query}”. Try a different keyword or{" "}
              <button
                onClick={() => {
                  setQuery("");
                  setActiveCat("all");
                }}
                className="text-fuchsia-300 hover:underline"
              >
                clear filters
              </button>
              .
            </div>
          )}
          {filtered.map((cat) => (
            <div key={cat.key}>
              <div className="mb-4 flex items-end justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold sm:text-2xl">{cat.label}</h2>
                  {cat.blurb && <p className="text-xs text-muted-foreground">{cat.blurb}</p>}
                </div>
                <span className="text-[11px] text-muted-foreground">{cat.faqs.length} answers</span>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                {cat.faqs.map((f) => {
                  const key = f.id;
                  const open = openKey === key;
                  return (
                    <button
                      key={key}
                      onClick={() => setOpenKey(open ? null : key)}
                      className="rounded-2xl bg-white/[0.04] p-4 text-left ring-1 ring-white/10 transition hover:bg-white/[0.06]"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <span className="text-sm font-semibold">{f.question}</span>
                        {open ? (
                          <Minus className="mt-0.5 h-4 w-4 shrink-0" />
                        ) : (
                          <Plus className="mt-0.5 h-4 w-4 shrink-0" />
                        )}
                      </div>
                      {open && (
                        <p className="mt-3 whitespace-pre-line text-[12px] leading-relaxed text-muted-foreground animate-fade-in">
                          {f.answer}
                        </p>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </section>

        {/* Articles */}
        {articles.length > 0 && (
          <section className="mt-16">
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1 text-[10px] uppercase tracking-widest text-muted-foreground ring-1 ring-white/10">
                  <BookOpen className="h-3 w-3 text-fuchsia-300" /> Articles & Insights
                </div>
                <h2 className="mt-3 text-xl font-bold sm:text-2xl">Beyond the FAQs</h2>
                <p className="text-xs text-muted-foreground">
                  Deep-dives into prop firms, brokers and the brands we — and our community —
                  recommend.
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {articles.map((a) => (
                <Link
                  key={a.id}
                  to="/articles/$id"
                  params={{ id: articleRouteId(a) }}
                  className="group overflow-hidden rounded-2xl bg-white/[0.04] ring-1 ring-white/10 transition hover:bg-white/[0.07]"
                >
                  {a.cover ? (
                    <img src={a.cover} alt={a.title} className="aspect-video w-full object-cover" />
                  ) : (
                    <div className="aspect-video w-full bg-gradient-to-br from-fuchsia-500/20 via-violet-600/15 to-transparent" />
                  )}
                  <div className="p-5">
                    <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-muted-foreground">
                      <span className="rounded-full bg-fuchsia-500/15 px-2 py-0.5 font-bold text-fuchsia-300 ring-1 ring-fuchsia-400/30">
                        {a.tag ?? "Article"}
                      </span>
                      <span>{a.readTime ?? "5 min read"}</span>
                    </div>
                    <h3 className="mt-3 text-sm font-semibold leading-snug">{a.title}</h3>
                    {a.excerpt && (
                      <p className="mt-2 text-[12px] leading-relaxed text-muted-foreground line-clamp-3">
                        {a.excerpt}
                      </p>
                    )}
                    <div className="mt-4 inline-flex items-center gap-1 text-[11px] font-semibold text-fuchsia-300">
                      Read article{" "}
                      <ArrowUpRight className="h-3 w-3 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Still need help */}
        <section className="mt-16">
          <div className="rounded-3xl bg-gradient-to-br from-fuchsia-500/15 via-violet-600/10 to-transparent p-8 ring-1 ring-white/10 sm:p-12">
            <div className="grid items-center gap-6 md:grid-cols-[1fr_auto]">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1 text-[10px] uppercase tracking-widest text-muted-foreground ring-1 ring-white/10">
                  <MessageCircle className="h-3 w-3 text-fuchsia-300" /> Still have a question?
                </div>
                <h2 className="mt-3 text-2xl font-bold sm:text-3xl">Talk to a real human</h2>
                <p className="mt-2 max-w-xl text-sm text-muted-foreground">
                  Our support team replies within a few hours. Or join the community to learn from
                  thousands of traders sharing setups, payouts and broker reviews every day.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  to="/dashboard"
                  className="rounded-full rb-gradient-primary px-5 py-2.5 text-sm font-semibold text-white"
                >
                  Open Support
                </Link>
                <Link
                  to="/dashboard/community"
                  className="rounded-full bg-white/10 px-5 py-2.5 text-sm font-semibold text-white ring-1 ring-white/15"
                >
                  Join Community
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

function FaqPageSkeleton() {
  return (
    <div className="space-y-8">
      {Array.from({ length: 2 }).map((_, sectionIndex) => (
        <div key={sectionIndex}>
          <div className="mb-4">
            <div className="skeleton h-6 w-40" />
            <div className="skeleton mt-2 h-3 w-64" />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {Array.from({ length: 4 }).map((__, cardIndex) => (
              <div
                key={cardIndex}
                className="rounded-2xl bg-white/[0.04] p-4 ring-1 ring-white/10"
              >
                <div className="skeleton h-4 w-4/5" />
                <div className="mt-4 space-y-2">
                  <div className="skeleton h-3 w-full" />
                  <div className="skeleton h-3 w-2/3" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
