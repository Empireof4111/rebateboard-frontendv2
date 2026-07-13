import { useEffect, useMemo, useState } from "react";
import { Link, createFileRoute, notFound, useParams } from "@tanstack/react-router";
import { LEGAL_DOCS, getLegalDoc, type LegalDoc } from "@/lib/legal-content";
import { Calendar, Link2, Printer, MessageCircle, Check, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/legal/$slug")({
  beforeLoad: ({ params }) => {
    if (!getLegalDoc(params.slug)) throw notFound();
  },
  loader: ({ params }) => ({ doc: getLegalDoc(params.slug)! }),
  head: ({ params }) => {
    const doc = getLegalDoc(params.slug);
    if (!doc) return {};
    return {
      meta: [
        { title: doc.metaTitle },
        { name: "description", content: doc.metaDescription },
        { property: "og:title", content: doc.metaTitle },
        { property: "og:description", content: doc.metaDescription },
        { property: "og:type", content: "article" },
      ],
    };
  },
  component: LegalDocPage,
  notFoundComponent: () => (
    <div className="glass rounded-3xl p-10 text-center ring-1 ring-white/10">
      <h1 className="text-xl font-bold text-white">Legal page not found</h1>
      <p className="mt-2 text-sm text-muted-foreground">The legal document you’re looking for does not exist.</p>
      <Link to="/legal/$slug" params={{ slug: "terms" }} className="mt-4 inline-block text-fuchsia-300 hover:underline">
        Go to Terms & Conditions →
      </Link>
    </div>
  ),
  errorComponent: ({ error }) => (
    <div className="glass rounded-3xl p-10 ring-1 ring-rose-300/20">
      <h1 className="text-lg font-bold text-white">Something went wrong</h1>
      <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
    </div>
  ),
});

function LegalDocPage() {
  const { slug } = useParams({ from: "/legal/$slug" });
  const doc = getLegalDoc(slug)!;
  const [activeId, setActiveId] = useState<string>(doc.sections[0]?.id ?? "");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Smooth-scroll for in-page anchors
  useEffect(() => {
    const el = document.documentElement;
    el.style.scrollBehavior = "smooth";
    return () => {
      el.style.scrollBehavior = "";
    };
  }, []);

  // Highlight active section while scrolling
  useEffect(() => {
    const ids = doc.sections.map((s) => s.id);
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveId(visible[0].target.id);
      },
      { rootMargin: "-30% 0px -60% 0px", threshold: 0 }
    );
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [doc]);

  function copySectionLink(id: string) {
    const url = `${window.location.origin}${window.location.pathname}#${id}`;
    navigator.clipboard?.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId((c) => (c === id ? null : c)), 1500);
  }

  function printPage() {
    if (typeof window !== "undefined") window.print();
  }

  // JSON-LD breadcrumb
  const jsonLd = useMemo(
    () => ({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "/" },
        { "@type": "ListItem", position: 2, name: "Legal", item: "/legal" },
        { "@type": "ListItem", position: 3, name: doc.title, item: `/legal/${doc.slug}` },
      ],
    }),
    [doc]
  );

  return (
    <article className="space-y-6">
      {/* Header card */}
      <header className="glass rounded-3xl p-6 ring-1 ring-white/10 sm:p-8">
        <div className="flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-wider text-muted-foreground">
          <Link to="/" className="hover:text-white">Home</Link>
          <ChevronRight className="h-3 w-3" />
          <Link to="/legal/$slug" params={{ slug: "terms" }} className="hover:text-white">Legal</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-white">{doc.navLabel}</span>
        </div>
        <h1 className="mt-3 text-2xl font-bold text-white sm:text-3xl">{doc.title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{doc.tagline}</p>
        <div className="mt-4 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-2.5 py-1 ring-1 ring-white/10">
            <Calendar className="h-3 w-3 text-fuchsia-300" /> Last updated: {doc.lastUpdated}
          </span>
          <button
            onClick={printPage}
            className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-2.5 py-1 ring-1 ring-white/10 hover:bg-white/10"
            title="Print this page"
          >
            <Printer className="h-3 w-3" /> Print
          </button>
        </div>
      </header>

      {/* Mobile TOC + main content */}
      <div className="grid gap-6 xl:grid-cols-[1fr_240px]">
        <section className="glass rounded-3xl p-6 ring-1 ring-white/10 sm:p-8">
          {/* Table of contents (mobile/tablet) */}
          <details className="group mb-6 rounded-2xl bg-white/[0.03] p-4 ring-1 ring-white/10 xl:hidden">
            <summary className="cursor-pointer list-none text-sm font-semibold text-white">
              Table of contents
              <span className="float-right text-xs text-muted-foreground transition group-open:rotate-180">▾</span>
            </summary>
            <ol className="mt-3 space-y-1.5 text-xs">
              {doc.sections.map((s) => (
                <li key={s.id}>
                  <a href={`#${s.id}`} className="text-muted-foreground hover:text-white">
                    {s.heading}
                  </a>
                </li>
              ))}
            </ol>
          </details>

          {/* Sections */}
          <div className="space-y-10">
            {doc.sections.map((s) => (
              <section key={s.id} id={s.id} className="scroll-mt-24">
                <div className="group flex items-start justify-between gap-3">
                  <h2 className="text-lg font-bold text-white sm:text-xl">{s.heading}</h2>
                  <button
                    onClick={() => copySectionLink(s.id)}
                    className="mt-1 inline-flex shrink-0 items-center gap-1 rounded-full bg-white/5 px-2 py-1 text-[10px] text-muted-foreground opacity-0 ring-1 ring-white/10 transition hover:bg-white/10 hover:text-white group-hover:opacity-100"
                    title="Copy link to this section"
                  >
                    {copiedId === s.id ? <Check className="h-3 w-3 text-emerald-300" /> : <Link2 className="h-3 w-3" />}
                    {copiedId === s.id ? "Copied" : "Copy link"}
                  </button>
                </div>
                <div className="mt-3 space-y-3 text-sm leading-relaxed text-white/85">
                  {s.body.map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                </div>
                {s.sub && (
                  <div className="mt-4 space-y-4 border-l border-white/10 pl-4">
                    {s.sub.map((sub) => (
                      <div key={sub.id} id={sub.id} className="scroll-mt-24">
                        <h3 className="text-sm font-semibold text-white">{sub.heading}</h3>
                        <div className="mt-1 space-y-2 text-xs leading-relaxed text-white/75">
                          {sub.body.map((p, i) => (
                            <p key={i}>{p}</p>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            ))}
          </div>

          {/* Footer CTA */}
          <FooterCTA />
        </section>

        {/* Desktop sticky TOC */}
        <aside className="hidden xl:block">
          <div className="sticky top-6">
            <div className="glass rounded-2xl p-4 ring-1 ring-white/10">
              <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                On this page
              </div>
              <ol className="space-y-1.5 text-xs">
                {doc.sections.map((s) => {
                  const active = activeId === s.id;
                  return (
                    <li key={s.id}>
                      <a
                        href={`#${s.id}`}
                        className={
                          "block rounded-md px-2 py-1 transition " +
                          (active ? "bg-fuchsia-300/15 text-white ring-1 ring-fuchsia-300/30" : "text-muted-foreground hover:text-white")
                        }
                      >
                        {s.heading}
                      </a>
                    </li>
                  );
                })}
              </ol>
            </div>

            <RelatedDocs current={doc} />
          </div>
        </aside>
      </div>

      {/* JSON-LD */}
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </article>
  );
}

function FooterCTA() {
  return (
    <div className="mt-10 rounded-2xl bg-gradient-to-br from-fuchsia-500/15 to-violet-500/15 p-6 ring-1 ring-fuchsia-300/30">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-white">Have questions?</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Our team is happy to clarify anything in this document.
          </p>
        </div>
        <a
          href="mailto:support@rebateboard.com"
          className="inline-flex items-center gap-1.5 rounded-full rb-gradient-primary px-4 py-2 text-xs font-semibold text-white shadow-[0_8px_24px_-8px_rgba(217,70,239,0.6)]"
        >
          <MessageCircle className="h-3 w-3" /> Contact support
        </a>
      </div>
    </div>
  );
}

function RelatedDocs({ current }: { current: LegalDoc }) {
  const others = LEGAL_DOCS.filter((d) => d.slug !== current.slug).slice(0, 3);
  return (
    <div className="glass mt-4 rounded-2xl p-4 ring-1 ring-white/10">
      <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        Related documents
      </div>
      <ul className="space-y-2">
        {others.map((d) => (
          <li key={d.slug}>
            <Link
              to="/legal/$slug"
              params={{ slug: d.slug }}
              className="group flex items-center justify-between rounded-lg bg-white/[0.03] px-2 py-1.5 text-xs text-white/80 ring-1 ring-white/10 hover:bg-white/[0.06] hover:text-white"
            >
              {d.navLabel}
              <ChevronRight className="h-3 w-3 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-fuchsia-300" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
