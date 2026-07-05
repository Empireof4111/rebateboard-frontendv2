import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Clock,
  Calendar,
  Bookmark,
  Twitter,
  Linkedin,
  Link as LinkIcon,
  ChevronRight,
} from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import {
  articleRouteId,
  fetchPublicBlogPost,
  fetchPublicBlogPosts,
  type BlogPost,
} from "@/lib/admin-api";

export const Route = createFileRoute("/articles/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `Article — RebateBoard` },
      { name: "description", content: `RebateBoard editorial article ${params.id}.` },
    ],
  }),
  component: ArticlePage,
  notFoundComponent: ArticleNotFound,
});

type Block =
  | { kind: "h2"; text: string; id: string }
  | { kind: "h3"; text: string; id: string }
  | { kind: "p"; text: string }
  | { kind: "ul"; items: string[] }
  | { kind: "ol"; items: string[] }
  | { kind: "quote"; text: string }
  | { kind: "code"; lang: string; code: string }
  | { kind: "table"; head: string[]; rows: string[][] }
  | { kind: "hr" };

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function authorInitials(name: string) {
  return (
    name
      .split(" ")
      .map((part) => part[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "RB"
  );
}

function formatArticleDate(value: string) {
  if (!value) return "Not dated";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function AuthorAvatar({
  post,
  size = "h-7 w-7",
  textSize = "text-[10px]",
}: {
  post: BlogPost;
  size?: string;
  textSize?: string;
}) {
  if (post.authorAvatar) {
    return (
      <img
        src={post.authorAvatar}
        alt=""
        className={`${size} rounded-full object-cover ring-1 ring-white/15`}
      />
    );
  }

  return (
    <span
      className={`grid ${size} place-items-center rounded-full bg-gradient-to-br from-fuchsia-500 to-violet-600 ${textSize} font-bold text-white`}
    >
      {authorInitials(post.author)}
    </span>
  );
}

function parseInline(text: string) {
  // **bold**, *italic*, `code`, [text](url)
  const out: React.ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;
  let last = 0;
  let m;
  let key = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out.push(<span key={key++}>{text.slice(last, m.index)}</span>);
    const tok = m[0];
    if (tok.startsWith("**"))
      out.push(
        <strong key={key++} className="text-white">
          {tok.slice(2, -2)}
        </strong>,
      );
    else if (tok.startsWith("`"))
      out.push(
        <code
          key={key++}
          className="rounded bg-white/10 px-1.5 py-0.5 text-[0.85em] font-mono text-fuchsia-200"
        >
          {tok.slice(1, -1)}
        </code>,
      );
    else if (tok.startsWith("[")) {
      const mm = tok.match(/\[([^\]]+)\]\(([^)]+)\)/);
      if (mm)
        out.push(
          <a
            key={key++}
            href={mm[2]}
            target="_blank"
            rel="noreferrer"
            className="text-fuchsia-300 underline decoration-fuchsia-400/40 underline-offset-2 hover:text-fuchsia-200"
          >
            {mm[1]}
          </a>,
        );
    } else if (tok.startsWith("*")) out.push(<em key={key++}>{tok.slice(1, -1)}</em>);
    last = m.index + tok.length;
  }
  if (last < text.length) out.push(<span key={key++}>{text.slice(last)}</span>);
  return out;
}

function parseMarkdown(src: string): Block[] {
  const lines = src.replace(/\r\n/g, "\n").split("\n");
  const blocks: Block[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) {
      i++;
      continue;
    }

    if (line.startsWith("### ")) {
      const t = line.slice(4);
      blocks.push({ kind: "h3", text: t, id: slugify(t) });
      i++;
      continue;
    }
    if (line.startsWith("## ")) {
      const t = line.slice(3);
      blocks.push({ kind: "h2", text: t, id: slugify(t) });
      i++;
      continue;
    }
    if (line.startsWith("# ")) {
      const t = line.slice(2);
      blocks.push({ kind: "h2", text: t, id: slugify(t) });
      i++;
      continue;
    }
    if (line.startsWith("---")) {
      blocks.push({ kind: "hr" });
      i++;
      continue;
    }

    if (line.startsWith("```")) {
      const lang = line.slice(3).trim();
      const buf: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) {
        buf.push(lines[i]);
        i++;
      }
      i++;
      blocks.push({ kind: "code", lang, code: buf.join("\n") });
      continue;
    }

    if (line.startsWith("> ")) {
      const buf: string[] = [];
      while (i < lines.length && lines[i].startsWith("> ")) {
        buf.push(lines[i].slice(2));
        i++;
      }
      blocks.push({ kind: "quote", text: buf.join(" ") });
      continue;
    }

    if (/^[-*] /.test(line)) {
      const buf: string[] = [];
      while (i < lines.length && /^[-*] /.test(lines[i])) {
        buf.push(lines[i].replace(/^[-*]\s+/, ""));
        i++;
      }
      blocks.push({ kind: "ul", items: buf });
      continue;
    }
    if (/^\d+\. /.test(line)) {
      const buf: string[] = [];
      while (i < lines.length && /^\d+\. /.test(lines[i])) {
        buf.push(lines[i].replace(/^\d+\.\s+/, ""));
        i++;
      }
      blocks.push({ kind: "ol", items: buf });
      continue;
    }

    // Table: | a | b |\n|---|---|\n| 1 | 2 |
    if (
      line.trim().startsWith("|") &&
      i + 1 < lines.length &&
      /^\|\s*:?-+/.test(lines[i + 1].trim())
    ) {
      const head = line
        .split("|")
        .slice(1, -1)
        .map((s) => s.trim());
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        rows.push(
          lines[i]
            .split("|")
            .slice(1, -1)
            .map((s) => s.trim()),
        );
        i++;
      }
      blocks.push({ kind: "table", head, rows });
      continue;
    }

    // Paragraph (collect consecutive non-blank, non-special lines)
    const buf: string[] = [line];
    i++;
    while (i < lines.length && lines[i].trim() && !/^(#|>|-|\*|\d+\.|```|\|)/.test(lines[i])) {
      buf.push(lines[i]);
      i++;
    }
    blocks.push({ kind: "p", text: buf.join(" ") });
  }
  return blocks;
}

function ArticlePage() {
  const { id } = Route.useParams();
  const [items, setItems] = useState<BlogPost[]>([]);
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadArticle() {
      setLoading(true);
      try {
        const [selected, posts] = await Promise.all([
          fetchPublicBlogPost(id),
          fetchPublicBlogPosts(),
        ]);
        if (cancelled) return;

        setItems(posts);
        setPost(
          selected ??
            posts.find((candidate) => candidate.id === id || candidate.urlSlug === id) ??
            null,
        );
      } catch {
        if (!cancelled) {
          setItems([]);
          setPost(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadArticle();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const blocks = useMemo(() => parseMarkdown(post?.body ?? ""), [post?.body]);
  const toc = useMemo(
    () =>
      blocks.filter((b) => b.kind === "h2" || b.kind === "h3") as Extract<
        Block,
        { kind: "h2" | "h3" }
      >[],
    [blocks],
  );
  const related = useMemo(
    () => items.filter((p) => p.status === "published" && p.id !== post?.id).slice(0, 3),
    [items, post?.id],
  );

  // Reading progress
  const [progress, setProgress] = useState(0);
  const articleRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const onScroll = () => {
      const el = articleRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const total = el.offsetHeight - window.innerHeight;
      const scrolled = Math.min(Math.max(-rect.top, 0), total);
      setProgress(total > 0 ? (scrolled / total) * 100 : 0);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Active TOC heading
  const [activeId, setActiveId] = useState<string>("");
  useEffect(() => {
    if (toc.length === 0) return;
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveId((visible[0].target as HTMLElement).id);
      },
      { rootMargin: "-30% 0px -60% 0px" },
    );
    toc.forEach((h) => {
      const el = document.getElementById(h.id);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, [toc]);

  const copyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard?.writeText(window.location.href);
    }
  };

  if (loading) return <ArticleLoading />;
  if (!post) return <ArticleNotFound />;

  return (
    <div className="min-h-screen bg-[#0d0420] text-white">
      <SiteHeader />

      {/* Reading progress */}
      <div className="sticky top-0 z-30 h-0.5 w-full bg-white/5">
        <div
          className="h-full bg-gradient-to-r from-fuchsia-500 to-violet-500 transition-[width] duration-150"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Hero / cover */}
      <header className="relative border-b border-white/5">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,rgba(217,70,239,0.15),transparent_60%)]" />
        <div className="mx-auto max-w-4xl px-4 pb-10 pt-8 sm:pt-12">
          <nav className="flex items-center gap-1 text-[11px] text-white/50">
            <Link to="/" className="hover:text-white">
              Home
            </Link>
            <ChevronRight className="h-3 w-3" />
            <Link to="/blog" className="hover:text-white">
              Blog
            </Link>
            <ChevronRight className="h-3 w-3" />
            <span className="truncate text-white/70">{post.title}</span>
          </nav>

          {post.tag && (
            <span className="mt-6 inline-block rounded-full bg-fuchsia-500/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-fuchsia-300 ring-1 ring-fuchsia-400/30">
              {post.tag}
            </span>
          )}
          <h1 className="mt-4 text-3xl font-bold leading-tight sm:text-5xl">{post.title}</h1>
          {post.excerpt && (
            <p className="mt-4 max-w-2xl text-base text-white/70 sm:text-lg">{post.excerpt}</p>
          )}

          <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-[12px] text-white/60">
            <span className="inline-flex items-center gap-1.5">
              <AuthorAvatar post={post} />
              <span className="text-white">{post.author}</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              {formatArticleDate(post.time)}
            </span>
            {post.readTime && (
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                {post.readTime}
              </span>
            )}
            <span>{post.views} views</span>
          </div>
        </div>

        {post.cover && (
          <div className="mx-auto max-w-5xl px-4 pb-10">
            <img
              src={post.cover}
              alt={post.title}
              className="aspect-[16/8] w-full rounded-3xl object-cover ring-1 ring-white/10"
            />
          </div>
        )}
      </header>

      {/* Article + sidebar */}
      <div className="container-app max-w-6xl py-8 sm:py-10">
        <div className="grid gap-10 lg:grid-cols-[1fr_240px]">
          <article ref={articleRef} className="min-w-0">
            {blocks.length === 0 ? (
              <p className="text-sm text-white/60">This article doesn't have a body yet.</p>
            ) : (
              blocks.map((b, i) => <Renderer key={i} block={b} />)
            )}

            {/* Author card */}
            <div className="mt-14 rounded-2xl bg-white/[0.04] p-6 ring-1 ring-white/10">
              <div className="flex items-start gap-4">
                <AuthorAvatar post={post} size="h-12 w-12" textSize="text-sm" />
                <div>
                  <div className="text-xs text-white/50">Written by</div>
                  <div className="text-base font-bold">{post.author}</div>
                  <div className="text-xs font-semibold text-fuchsia-200/80">
                    {post.authorTitle || "Editorial Team"}
                  </div>
                  <p className="mt-1 text-xs text-white/60">
                    RebateBoard editorial covers prop firms, brokers and the trader economy with
                    verified data and field reporting.
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom share */}
            <div className="mt-8 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 px-5 py-4">
              <div className="text-xs text-white/60">Found this useful? Share it.</div>
              <ShareRow title={post.title} onCopy={copyLink} />
            </div>
          </article>

          {/* Sidebar TOC */}
          <aside className="hidden lg:block">
            <div className="sticky top-6 space-y-6">
              {toc.length > 0 && (
                <div className="rounded-2xl bg-white/[0.04] p-5 ring-1 ring-white/10">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-fuchsia-300">
                    On this page
                  </div>
                  <ul className="mt-3 space-y-2 text-xs">
                    {toc.map((h) => (
                      <li key={h.id} className={h.kind === "h3" ? "pl-3" : ""}>
                        <a
                          href={`#${h.id}`}
                          className={`block border-l-2 py-1 pl-3 transition ${activeId === h.id ? "border-fuchsia-400 text-white" : "border-white/10 text-white/55 hover:text-white"}`}
                        >
                          {h.text}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="rounded-2xl bg-white/[0.04] p-5 ring-1 ring-white/10">
                <div className="text-[10px] font-bold uppercase tracking-widest text-fuchsia-300">
                  Share
                </div>
                <div className="mt-3">
                  <ShareRow title={post.title} onCopy={copyLink} stack />
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Related */}
      {related.length > 0 && (
        <section className="border-t border-white/5">
          <div className="container-app max-w-6xl py-10 sm:py-12">
            <h2 className="text-xl font-bold">Keep reading</h2>
            <div className="mt-6 grid gap-5 sm:grid-cols-3">
              {related.map((r) => (
                <Link
                  key={r.id}
                  to="/articles/$id"
                  params={{ id: articleRouteId(r) }}
                  className="group overflow-hidden rounded-2xl bg-white/[0.04] ring-1 ring-white/10 transition hover:-translate-y-0.5 hover:ring-fuchsia-400/30"
                >
                  {r.cover ? (
                    <img src={r.cover} alt="" className="aspect-video w-full object-cover" />
                  ) : (
                    <div className="aspect-video w-full bg-gradient-to-br from-fuchsia-600/30 to-violet-700/30" />
                  )}
                  <div className="p-4">
                    {r.tag && (
                      <span className="text-[10px] font-bold uppercase tracking-widest text-fuchsia-300">
                        {r.tag}
                      </span>
                    )}
                    <h3 className="mt-1 text-sm font-semibold leading-snug group-hover:text-fuchsia-200">
                      {r.title}
                    </h3>
                    <p className="mt-2 text-[11px] text-white/50">
                      {r.author} · {r.readTime ?? r.time}
                    </p>
                  </div>
                </Link>
              ))}
            </div>

            <div className="mt-10 text-center">
              <Link
                to="/blog"
                className="inline-flex items-center gap-2 rounded-full bg-white/10 px-5 py-2.5 text-xs font-semibold hover:bg-white/20"
              >
                Browse all articles <ArrowLeft className="h-3.5 w-3.5 rotate-180" />
              </Link>
            </div>
          </div>
        </section>
      )}
      <SiteFooter />
    </div>
  );
}

function ArticleLoading() {
  return (
    <div className="min-h-screen bg-[#0d0420] text-white">
      <SiteHeader />
      <div className="container-app max-w-3xl py-16 text-center sm:py-20">
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-10 text-sm text-white/60">
          Loading article...
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}

function ArticleNotFound() {
  return (
    <div className="min-h-screen bg-[#0d0420] text-white">
      <SiteHeader />
      <div className="container-app max-w-3xl py-16 text-center sm:py-20">
        <h1 className="text-3xl font-bold">Article not found</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          It may have been unpublished or removed.
        </p>
        <Link
          to="/blog"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Blog
        </Link>
      </div>
      <SiteFooter />
    </div>
  );
}

function Renderer({ block }: { block: Block }) {
  switch (block.kind) {
    case "h2":
      return (
        <h2 id={block.id} className="mt-12 scroll-mt-20 text-2xl font-bold sm:text-3xl">
          {block.text}
        </h2>
      );
    case "h3":
      return (
        <h3 id={block.id} className="mt-8 scroll-mt-20 text-xl font-bold">
          {block.text}
        </h3>
      );
    case "p":
      return (
        <p className="mt-5 text-[16px] leading-[1.8] text-white/80">{parseInline(block.text)}</p>
      );
    case "ul":
      return (
        <ul className="my-5 space-y-2 text-[15px] leading-relaxed text-white/80">
          {block.items.map((it, i) => (
            <li key={i} className="flex gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-fuchsia-400" />
              {parseInline(it)}
            </li>
          ))}
        </ul>
      );
    case "ol":
      return (
        <ol className="my-5 space-y-2 text-[15px] leading-relaxed text-white/80">
          {block.items.map((it, i) => (
            <li key={i} className="flex gap-3">
              <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-fuchsia-500/20 text-[10px] font-bold text-fuchsia-200">
                {i + 1}
              </span>
              {parseInline(it)}
            </li>
          ))}
        </ol>
      );
    case "quote":
      return (
        <blockquote className="my-6 rounded-r-xl border-l-4 border-fuchsia-400 bg-white/[0.04] p-5 text-[15px] italic text-white/85">
          {parseInline(block.text)}
        </blockquote>
      );
    case "code":
      return (
        <div className="my-6 overflow-hidden rounded-xl bg-black/50 ring-1 ring-white/10">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-2 text-[10px] font-mono uppercase tracking-widest text-white/50">
            <span>{block.lang || "code"}</span>
          </div>
          <pre className="overflow-x-auto p-4 font-mono text-[13px] leading-relaxed text-fuchsia-100">
            <code>{block.code}</code>
          </pre>
        </div>
      );
    case "table":
      return (
        <div className="my-6 overflow-x-auto rounded-xl ring-1 ring-white/10">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/[0.06] text-[11px] uppercase tracking-widest text-white/60">
              <tr>
                {block.head.map((h, i) => (
                  <th key={i} className="px-4 py-3 font-semibold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((r, i) => (
                <tr key={i} className="border-t border-white/5 text-white/80">
                  {r.map((c, j) => (
                    <td key={j} className="px-4 py-3">
                      {parseInline(c)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case "hr":
      return <hr className="my-10 border-white/10" />;
  }
}

function ShareRow({
  title,
  onCopy,
  stack = false,
}: {
  title: string;
  onCopy: () => void;
  stack?: boolean;
}) {
  const url = typeof window !== "undefined" ? window.location.href : "";
  const enc = encodeURIComponent;
  const tw = `https://twitter.com/intent/tweet?text=${enc(title)}&url=${enc(url)}`;
  const li = `https://www.linkedin.com/sharing/share-offsite/?url=${enc(url)}`;
  const cls =
    "inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-white/20";
  return (
    <div className={stack ? "flex flex-col gap-2" : "flex flex-wrap items-center gap-2"}>
      <a href={tw} target="_blank" rel="noreferrer" className={cls}>
        <Twitter className="h-3.5 w-3.5" />
        Twitter
      </a>
      <a href={li} target="_blank" rel="noreferrer" className={cls}>
        <Linkedin className="h-3.5 w-3.5" />
        LinkedIn
      </a>
      <button onClick={onCopy} className={cls}>
        <LinkIcon className="h-3.5 w-3.5" />
        Copy link
      </button>
      <button className={cls}>
        <Bookmark className="h-3.5 w-3.5" />
        Save
      </button>
    </div>
  );
}
