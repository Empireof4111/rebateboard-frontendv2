import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Clock,
  User,
  ArrowRight,
  TrendingUp,
  Filter,
  BookOpen,
  Calendar,
} from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { articleRouteId, fetchPublicBlogPosts, type BlogPost } from "@/lib/admin-api";

export const Route = createFileRoute("/blog")({
  head: () => ({
    meta: [
      { title: "Blog & Insights — RebateBoard" },
      {
        name: "description",
        content:
          "Guides, comparisons and industry reports on prop firms, brokers, payouts and trader strategy.",
      },
      { property: "og:title", content: "Blog & Insights — RebateBoard" },
      {
        property: "og:description",
        content: "Guides, comparisons and industry reports for serious traders.",
      },
    ],
  }),
  component: BlogIndex,
});

function BlogIndex() {
  const [items, setItems] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [tag, setTag] = useState("All");
  const [sort, setSort] = useState<"latest" | "popular">("latest");

  useEffect(() => {
    let cancelled = false;

    async function loadArticles() {
      setLoading(true);
      try {
        const posts = await fetchPublicBlogPosts();
        if (!cancelled) setItems(posts);
      } catch {
        if (!cancelled) setItems([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadArticles();
    return () => {
      cancelled = true;
    };
  }, []);

  const published = useMemo(() => items.filter((p) => p.status === "published"), [items]);
  const visibleTags = useMemo(() => {
    const tags = published.map((p) => p.tag).filter(Boolean);
    return ["All", ...Array.from(new Set(tags))];
  }, [published]);

  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    let list = published.filter((p) => {
      const matchTag = tag === "All" || p.tag === tag;
      const matchQ =
        !ql ||
        p.title.toLowerCase().includes(ql) ||
        (p.excerpt ?? "").toLowerCase().includes(ql) ||
        (p.author ?? "").toLowerCase().includes(ql);
      return matchTag && matchQ;
    });
    if (sort === "popular") {
      list = [...list].sort((a, b) => parseViews(b.views) - parseViews(a.views));
    }
    return list;
  }, [published, q, tag, sort]);

  const featured = filtered[0];
  const rest = filtered.slice(1);
  const trending = useMemo(
    () => [...published].sort((a, b) => parseViews(b.views) - parseViews(a.views)).slice(0, 5),
    [published],
  );
  const tagCounts = useMemo(() => {
    const m = new Map<string, number>();
    published.forEach((p) => p.tag && m.set(p.tag, (m.get(p.tag) ?? 0) + 1));
    return m;
  }, [published]);

  return (
    <div className="min-h-screen bg-[var(--rb-bg-canvas)] text-white">
      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-white/5">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,rgba(217,70,239,0.15),transparent_60%)]" />
        <div className="container-app py-10 sm:py-12">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-fuchsia-300">
            <BookOpen className="h-3.5 w-3.5" /> RebateBoard Editorial
          </div>
          <h1 className="mt-3 max-w-3xl text-4xl font-bold leading-tight sm:text-5xl">
            Insights for traders who care about the{" "}
            <span className="bg-gradient-to-r from-fuchsia-400 to-violet-400 bg-clip-text text-transparent">
              truth behind the brand
            </span>
            .
          </h1>
          <p className="mt-4 max-w-2xl text-base text-white/70">
            Honest reporting on prop firms, brokers, payouts and trader strategy — no affiliate
            spin, no recycled press releases.
          </p>

          {/* Search + filters */}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <div className="flex flex-1 items-center gap-2 rounded-2xl bg-white/[0.06] px-4 py-3 ring-1 ring-white/10 focus-within:ring-fuchsia-400/40">
              <Search className="h-4 w-4 text-white/50" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search articles, topics, authors…"
                className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/40"
              />
            </div>
            <div className="flex items-center gap-2 rounded-2xl bg-white/[0.06] px-2 py-1 ring-1 ring-white/10">
              <Filter className="ml-2 h-4 w-4 text-white/50" />
              <button
                onClick={() => setSort("latest")}
                className={`rounded-xl px-3 py-2 text-xs font-semibold ${sort === "latest" ? "bg-white/15 text-white" : "text-white/60"}`}
              >
                Latest
              </button>
              <button
                onClick={() => setSort("popular")}
                className={`rounded-xl px-3 py-2 text-xs font-semibold ${sort === "popular" ? "bg-white/15 text-white" : "text-white/60"}`}
              >
                Popular
              </button>
            </div>
          </div>

          {/* Tag chips */}
          <div className="mt-5 flex flex-wrap gap-2">
            {visibleTags.map((t) => {
              const active = tag === t;
              const count = t === "All" ? published.length : (tagCounts.get(t) ?? 0);
              return (
                <button
                  key={t}
                  onClick={() => setTag(t)}
                  className={`group inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ring-1 transition ${
                    active
                      ? "rb-gradient-primary text-white ring-fuchsia-400/40"
                      : "bg-white/[0.04] text-white/70 ring-white/10 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {t}
                  <span
                    className={`rounded-full px-1.5 text-[10px] ${active ? "bg-white/25" : "bg-white/10"}`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Body */}
      <section className="container-app py-10">
        {loading ? (
          <LoadingState />
        ) : filtered.length === 0 ? (
          <EmptyState
            hasContent={published.length > 0}
            onReset={() => {
              setQ("");
              setTag("All");
            }}
          />
        ) : (
          <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
            <div>
              {/* Featured */}
              {featured && <FeaturedCard post={featured} />}

              {/* Grid */}
              {rest.length > 0 && (
                <div className="mt-10">
                  <div className="mb-4 flex items-baseline justify-between">
                    <h2 className="text-lg font-bold">Latest articles</h2>
                    <span className="text-xs text-white/50">{rest.length} more</span>
                  </div>
                  <div className="grid gap-6 sm:grid-cols-2">
                    {rest.map((p) => (
                      <PostCard key={p.id} post={p} />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <aside className="space-y-6">
              <div className="rounded-2xl bg-white/[0.04] p-5 ring-1 ring-white/10">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-fuchsia-300">
                  <TrendingUp className="h-3.5 w-3.5" /> Trending
                </div>
                <ol className="mt-4 space-y-4">
                  {trending.map((p, i) => (
                    <li key={p.id} className="flex gap-3">
                      <span className="text-xl font-black text-white/15">0{i + 1}</span>
                      <Link
                        to="/articles/$id"
                        params={{ id: articleRouteId(p) }}
                        className="group flex-1"
                      >
                        <h3 className="text-sm font-semibold leading-snug text-white group-hover:text-fuchsia-300">
                          {p.title}
                        </h3>
                        <p className="mt-1 text-[11px] text-white/50">
                          {p.author} · {p.views} views
                        </p>
                      </Link>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-fuchsia-600/30 to-violet-700/30 p-5 ring-1 ring-fuchsia-400/30">
                <div className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-fuchsia-500/30 blur-2xl" />
                <h3 className="text-base font-bold">The Edge — weekly</h3>
                <p className="mt-2 text-xs text-white/70">
                  The single email serious traders read. Payout shifts, firm changes, and one strong
                  setup. No fluff.
                </p>
                <form className="mt-4 flex gap-2" onSubmit={(e) => e.preventDefault()}>
                  <input
                    placeholder="you@trader.com"
                    className="flex-1 rounded-xl bg-black/30 px-3 py-2 text-xs outline-none ring-1 ring-white/10 placeholder:text-white/40"
                  />
                  <button className="rounded-xl bg-white px-3 py-2 text-xs font-bold text-[#0d0420]">
                    Join
                  </button>
                </form>
              </div>

              <div className="rounded-2xl bg-white/[0.04] p-5 ring-1 ring-white/10">
                <h3 className="text-sm font-bold">Categories</h3>
                <ul className="mt-3 space-y-2 text-xs">
                  {visibleTags
                    .filter((t) => t !== "All")
                    .map((t) => (
                      <li key={t}>
                        <button
                          onClick={() => setTag(t)}
                          className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-white/70 hover:bg-white/5 hover:text-white"
                        >
                          <span>{t}</span>
                          <span className="text-[10px] text-white/40">{tagCounts.get(t) ?? 0}</span>
                        </button>
                      </li>
                    ))}
                </ul>
              </div>
            </aside>
          </div>
        )}
      </section>
      <SiteFooter />
    </div>
  );
}

function FeaturedCard({ post }: { post: BlogPost }) {
  return (
    <Link
      to="/articles/$id"
      params={{ id: articleRouteId(post) }}
      className="group block overflow-hidden rounded-3xl bg-white/[0.04] ring-1 ring-white/10 transition hover:ring-fuchsia-400/40"
    >
      <div className="grid md:grid-cols-2">
        <div className="relative aspect-[16/10] overflow-hidden md:aspect-auto md:min-h-[320px]">
          {post.cover ? (
            <img
              src={post.cover}
              alt={post.title}
              className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-fuchsia-600/40 via-violet-700/30 to-indigo-900/40" />
          )}
          <span className="absolute left-4 top-4 inline-flex items-center gap-1 rounded-full bg-black/60 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white backdrop-blur">
            ★ Featured
          </span>
        </div>
        <div className="flex flex-col justify-center p-6 sm:p-8">
          {post.tag && (
            <span className="inline-block w-fit rounded-full bg-fuchsia-500/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-fuchsia-300 ring-1 ring-fuchsia-400/30">
              {post.tag}
            </span>
          )}
          <h2 className="mt-3 text-2xl font-bold leading-tight group-hover:text-fuchsia-200 sm:text-3xl">
            {post.title}
          </h2>
          {post.excerpt && <p className="mt-3 text-sm text-white/70">{post.excerpt}</p>}
          <Meta post={post} className="mt-5" />
          <span className="mt-6 inline-flex w-fit items-center gap-1.5 rounded-full bg-white/10 px-4 py-2 text-xs font-bold transition group-hover:bg-white group-hover:text-[#0d0420]">
            Read article <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}

function PostCard({ post }: { post: BlogPost }) {
  return (
    <Link
      to="/articles/$id"
      params={{ id: articleRouteId(post) }}
      className="group flex flex-col overflow-hidden rounded-2xl bg-white/[0.04] ring-1 ring-white/10 transition hover:-translate-y-0.5 hover:bg-white/[0.07] hover:ring-fuchsia-400/30"
    >
      <div className="relative aspect-[16/9] overflow-hidden">
        {post.cover ? (
          <img
            src={post.cover}
            alt={post.title}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-violet-600/30 via-fuchsia-600/20 to-indigo-900/30" />
        )}
        {post.tag && (
          <span className="absolute left-3 top-3 rounded-full bg-black/60 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-white backdrop-blur">
            {post.tag}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-base font-bold leading-snug group-hover:text-fuchsia-200">
          {post.title}
        </h3>
        {post.excerpt && <p className="mt-2 line-clamp-2 text-xs text-white/60">{post.excerpt}</p>}
        <div className="mt-auto pt-4">
          <Meta post={post} />
        </div>
      </div>
    </Link>
  );
}

function Meta({ post, className = "" }: { post: BlogPost; className?: string }) {
  return (
    <div
      className={`flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-white/50 ${className}`}
    >
      <span className="inline-flex items-center gap-1">
        <User className="h-3 w-3" />
        {post.author}
      </span>
      <span className="inline-flex items-center gap-1">
        <Calendar className="h-3 w-3" />
        {post.time}
      </span>
      {post.readTime && (
        <span className="inline-flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {post.readTime}
        </span>
      )}
      <span>{post.views} views</span>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-16 text-center text-sm text-white/60">
      Loading articles...
    </div>
  );
}

function EmptyState({ onReset, hasContent }: { onReset: () => void; hasContent: boolean }) {
  return (
    <div className="rounded-3xl border border-dashed border-white/15 p-16 text-center">
      <h3 className="text-lg font-bold">
        {hasContent ? "No articles match your filters" : "No articles published yet"}
      </h3>
      <p className="mt-2 text-sm text-white/60">
        {hasContent
          ? "Try a different search or category."
          : "Published admin articles will appear here automatically."}
      </p>
      {hasContent && (
        <button
          onClick={onReset}
          className="mt-5 rounded-full bg-white/10 px-4 py-2 text-xs font-semibold hover:bg-white/20"
        >
          Reset filters
        </button>
      )}
    </div>
  );
}

function parseViews(v: string) {
  const m = v.match(/([\d.]+)\s*([KkMm]?)/);
  if (!m) return 0;
  const n = parseFloat(m[1]);
  const mult = m[2].toLowerCase() === "k" ? 1_000 : m[2].toLowerCase() === "m" ? 1_000_000 : 1;
  return n * mult;
}
