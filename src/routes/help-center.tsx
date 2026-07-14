import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Bot,
  ChevronRight,
  CircleDollarSign,
  Compass,
  FileQuestion,
  HelpCircle,
  MessageCircle,
  Search,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { fetchPublicFaqs, type Faq } from "@/lib/admin-api";
import { resolvePublicFaqContent } from "@/lib/public-faq-content";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/help-center")({
  head: () => ({
    meta: [
      { title: "Help Center | RebateBoard" },
      { name: "description", content: "Find answers about cashback, claims, reviews, TBI, Rebate Rewards, wallet, Rebeta, and RebateBoard account support." },
    ],
  }),
  component: HelpCenterPage,
});

const categories = [
  { name: "Getting Started", icon: Compass, keywords: ["account", "start", "free", "signup"] },
  { name: "Cashback and Claims", icon: CircleDollarSign, keywords: ["cashback", "claim", "rebate"] },
  { name: "Wallet and Withdrawals", icon: Wallet, keywords: ["wallet", "withdrawal", "payment"] },
  { name: "Reviews", icon: MessageCircle, keywords: ["review", "verified"] },
  { name: "TBI", icon: ShieldCheck, keywords: ["tbi", "trust", "trusted"] },
  { name: "Rebeta AI", icon: Bot, keywords: ["rebeta", "ai", "coach"] },
  { name: "Technical Issues", icon: HelpCircle, keywords: ["support", "issue", "login"] },
];

function HelpCenterPage() {
  const { user } = useAuth();
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetchPublicFaqs()
      .then((rows) => {
        if (active) setFaqs(resolvePublicFaqContent(rows));
      })
      .catch(() => {
        if (active) setFaqs(resolvePublicFaqContent([]));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return faqs.filter((faq) => {
      const matchesCategory = category === "All" || faq.category.toLowerCase() === category.toLowerCase();
      const haystack = `${faq.question} ${faq.answer} ${faq.category}`.toLowerCase();
      return matchesCategory && (!q || haystack.includes(q));
    });
  }, [faqs, query, category]);

  const popular = faqs.slice(0, 6);

  return (
    <div className="min-h-screen bg-[var(--rb-bg-canvas)] text-white">
      <SiteHeader />
      <main className="container-app space-y-7 py-8 sm:py-12">
        <section className="rounded-[2rem] border border-white/10 bg-white/[0.045] p-6 text-center shadow-[0_30px_100px_rgba(0,0,0,0.35)] md:p-10">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full bg-primary/15 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-violet-100 ring-1 ring-primary/20">
            <FileQuestion className="h-3.5 w-3.5" />
            Help Center
          </div>
          <h1 className="mt-5 text-4xl font-black leading-tight md:text-6xl">How Can We Help?</h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-8 text-white/66">
            Search cashback, reviews, accounts, rewards, TBI, Rebeta, and platform support articles.
          </p>
          <div className="mx-auto mt-7 flex max-w-3xl items-center gap-3 rounded-full border border-white/10 bg-black/20 px-5 py-3">
            <Search className="h-5 w-5 text-violet-200" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search cashback, reviews, accounts, rewards, TBI, and more..."
              className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/35"
            />
          </div>
        </section>

        {user && (
          <section className="grid gap-3 md:grid-cols-5">
            {[
              { label: "My Claims", to: "/dashboard/claims" },
              { label: "My Reviews", to: "/dashboard/reviews" },
              { label: "Wallet", to: "/dashboard/wallet" },
              { label: "Profile", to: "/dashboard/profile" },
              { label: "Ask Rebeta", to: "/dashboard/ai-coach" },
            ].map((item) => (
              <Link key={item.to} to={item.to} className="rounded-3xl border border-white/10 bg-white/[0.045] p-4 text-center text-sm font-black text-white/78 transition hover:-translate-y-0.5 hover:border-primary/35">
                {item.label}
              </Link>
            ))}
          </section>
        )}

        <section className="grid gap-4 lg:grid-cols-[320px_1fr]">
          <aside className="space-y-3">
            <button
              onClick={() => setCategory("All")}
              className={`w-full rounded-3xl border p-4 text-left text-sm font-black transition ${category === "All" ? "border-primary/35 bg-primary/15" : "border-white/10 bg-white/[0.04]"}`}
            >
              All Help Topics
            </button>
            {categories.map((item) => (
              <button
                key={item.name}
                onClick={() => setCategory(item.name)}
                className={`flex w-full items-center gap-3 rounded-3xl border p-4 text-left transition ${
                  category === item.name ? "border-primary/35 bg-primary/15" : "border-white/10 bg-white/[0.04] hover:bg-white/[0.07]"
                }`}
              >
                <span className="grid h-10 w-10 place-items-center rounded-2xl bg-white/8 text-violet-200 ring-1 ring-white/10">
                  <item.icon className="h-4 w-4" />
                </span>
                <span>
                  <span className="block text-sm font-black">{item.name}</span>
                  <span className="mt-1 block text-xs text-white/45">{articleCount(faqs, item)} articles</span>
                </span>
              </button>
            ))}
          </aside>

          <section className="rounded-[2rem] border border-white/10 bg-white/[0.045] p-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="text-2xl font-black">{query ? "Search Results" : "Popular Articles"}</h2>
                <p className="mt-1 text-sm text-white/55">
                  {loading ? "Loading support articles..." : `${filtered.length} article${filtered.length === 1 ? "" : "s"} available`}
                </p>
              </div>
              {query && (
                <button onClick={() => setQuery("")} className="rounded-full bg-white/8 px-4 py-2 text-xs font-bold text-white/70">Clear search</button>
              )}
            </div>
            <div className="mt-5 space-y-3">
              {loading && [1, 2, 3].map((item) => <div key={item} className="h-24 animate-pulse rounded-3xl bg-white/8" />)}
              {!loading && (query || category !== "All" ? filtered : popular).map((faq) => (
                <details key={faq.id} className="group rounded-3xl border border-white/10 bg-black/15 p-4">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
                    <span>
                      <span className="block text-sm font-black">{faq.question}</span>
                      <span className="mt-1 block text-xs text-violet-100/65">{faq.category} {faq.updated ? `- Updated ${new Date(faq.updated).toLocaleDateString()}` : ""}</span>
                    </span>
                    <ChevronRight className="h-4 w-4 shrink-0 text-white/45 transition group-open:rotate-90" />
                  </summary>
                  <p className="mt-4 text-sm leading-7 text-white/62">{faq.answer}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button className="rounded-full border border-white/10 px-3 py-1.5 text-xs font-bold text-white/58 hover:text-white">Helpful</button>
                    <button className="rounded-full border border-white/10 px-3 py-1.5 text-xs font-bold text-white/58 hover:text-white">Not Helpful</button>
                    <Link to="/contact" className="rounded-full border border-white/10 px-3 py-1.5 text-xs font-bold text-violet-100 hover:text-white">
                      Contact Support
                    </Link>
                  </div>
                </details>
              ))}
              {!loading && filtered.length === 0 && (
                <div className="rounded-3xl border border-white/10 bg-black/15 p-8 text-center">
                  <HelpCircle className="mx-auto h-8 w-8 text-violet-200" />
                  <h3 className="mt-4 text-xl font-black">No help articles matched your search.</h3>
                  <p className="mx-auto mt-2 max-w-md text-sm leading-7 text-white/58">Try another keyword or contact support so the team can help directly.</p>
                  <Link to="/contact" className="mt-5 inline-flex rounded-full rb-gradient-primary px-5 py-3 text-sm font-black text-white">
                    Contact Support
                  </Link>
                </div>
              )}
            </div>
          </section>
        </section>

        <section className="rounded-[2rem] border border-white/10 bg-gradient-to-r from-primary/14 to-white/[0.035] p-6 text-center md:p-8">
          <h2 className="text-3xl font-black">Still Need Help?</h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-white/62">
            Our support team is ready to assist with account, cashback, review, brand, or technical issues.
          </p>
          <Link to="/contact" className="mt-5 inline-flex rounded-full rb-gradient-primary px-5 py-3 text-sm font-black text-white">
            Contact Support
          </Link>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

function articleCount(faqs: Faq[], category: (typeof categories)[number]) {
  const direct = faqs.filter((faq) => faq.category.toLowerCase() === category.name.toLowerCase()).length;
  if (direct > 0) return direct;
  return faqs.filter((faq) => category.keywords.some((keyword) => `${faq.question} ${faq.answer} ${faq.category}`.toLowerCase().includes(keyword))).length;
}
