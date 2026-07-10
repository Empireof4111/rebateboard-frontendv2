import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  BadgePercent,
  BarChart3,
  BookOpen,
  Building2,
  Calendar,
  Calculator,
  Clock,
  Coins,
  Flame,
  HelpCircle,
  Newspaper,
  Search,
  Sparkles,
  Trash2,
  Trophy,
  Wallet,
  X,
} from "lucide-react";
import {
  fetchPublicAdminBrands,
  type AdminBrandRecord,
} from "@/lib/admin-brands-api";
import { fetchPublicOffers, type AdminOffer } from "@/lib/offers-api";
import {
  articleRouteId,
  fetchPublicBlogPosts,
  fetchPublicFaqs,
  type BlogPost,
  type Faq,
} from "@/lib/admin-api";
import { fetchTbiExplore, type TbiProfile } from "@/lib/tbi-api";
import { resolveCountryDisplay } from "@/lib/country-format";
import { isPublishedBrand } from "@/lib/public-brand";

type SearchIcon = typeof Search;

type Hit = {
  id: string;
  label: string;
  sub: string;
  group: string;
  to: string;
  icon?: SearchIcon;
  logo?: string;
  tbi?: number;
  country?: string;
  countryFlag?: string;
  brandName?: string;
  terms?: string[];
};

const QUICK_LINKS: Hit[] = [
  { id: "ql-brokers", label: "Brokers", sub: "Browse public broker rankings", group: "Jump to", to: "/brokers", icon: Building2 },
  { id: "ql-prop", label: "Prop Firms", sub: "Funding programs and challenges", group: "Jump to", to: "/programs", icon: Trophy },
  { id: "ql-ex", label: "Crypto Exchanges", sub: "Crypto platforms and fee rebates", group: "Jump to", to: "/exchanges", icon: Coins },
  { id: "ql-offers", label: "Offers", sub: "Active promos and cashback deals", group: "Jump to", to: "/offers", icon: BadgePercent },
  { id: "ql-pay", label: "Payouts", sub: "Verified payout tracker", group: "Jump to", to: "/payouts", icon: Wallet },
  { id: "ql-tbi", label: "TBI Explorer", sub: "Trust Brand Index", group: "Jump to", to: "/tbi/explore", icon: BarChart3 },
  { id: "ql-cal", label: "Economic Calendar", sub: "Macro events and releases", group: "Jump to", to: "/economic-calendar", icon: Calendar },
  { id: "ql-acad", label: "Academy", sub: "Trading lessons and guides", group: "Jump to", to: "/academy", icon: BookOpen },
  { id: "ql-comp", label: "Compare", sub: "Compare brands side by side", group: "Jump to", to: "/compare", icon: Calculator },
];

const EMPTY_BROWSE_LINKS: Hit[] = [
  { id: "empty-programs", label: "Programs", sub: "Explore funded trader programs", group: "Browse", to: "/programs", icon: Trophy },
  { id: "empty-reviews", label: "Reviews", sub: "Read verified trader feedback", group: "Browse", to: "/reviews", icon: Sparkles },
  { id: "empty-cashback", label: "Cashback", sub: "Find active rebate offers", group: "Browse", to: "/offers", icon: BadgePercent },
  { id: "empty-blogs", label: "Blogs", sub: "Learn from trader guides", group: "Browse", to: "/blog", icon: Newspaper },
  { id: "empty-offers", label: "Offers", sub: "Browse bonuses and deals", group: "Browse", to: "/offers", icon: Flame },
  { id: "empty-tools", label: "Tools", sub: "Use calculators and analytics", group: "Browse", to: "/trading-tools", icon: Calculator },
];

const HISTORY_KEY = "rb_global_search_history";
const MAX_HISTORY = 6;

function readHistory(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function writeHistory(items: string[]) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(items.slice(0, MAX_HISTORY)));
  } catch {
    /* localStorage may be unavailable */
  }
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function initials(value: string) {
  return value
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function normalizeScore(value: unknown) {
  const num = Number(value);
  if (!Number.isFinite(num) || num <= 0) return undefined;
  return num > 10 ? num / 10 : num;
}

function formatTbi(value?: number) {
  if (!value) return "";
  return value.toFixed(1).replace(/\.0$/, "");
}

function brandGroup(category: string) {
  if (/broker/i.test(category)) return "Brokers";
  if (/exchange/i.test(category)) return "Exchanges";
  if (/prop/i.test(category)) return "Prop Firms";
  if (/tool|software|education/i.test(category)) return "Tools";
  return "Brands";
}

function brandRoute(brand: Pick<AdminBrandRecord, "slug">) {
  return `/firm/${brand.slug}`;
}

function resolveBrandCountry(brand: AdminBrandRecord) {
  const identity = asRecord(brand.identity);
  const profile = asRecord(brand.profile);
  return resolveCountryDisplay(identity.country, identity.hq, profile.country);
}

function buildBrandHit(brand: AdminBrandRecord, tbi?: TbiProfile): Hit {
  const country = resolveBrandCountry(brand);
  const score = normalizeScore(
    tbi?.finalScore ||
      tbi?.preliminaryScore ||
      tbi?.rawScore ||
      brand.trust?.tbiScore100 ||
      brand.trust?.tbiScore ||
      brand.tbi,
  );

  return {
    id: `brand-${brand.id}`,
    label: brand.name,
    sub: `${brand.category}${score ? ` | TBI ${formatTbi(score)}` : ""}${
      country.label ? ` | ${country.label}` : ""
    }`,
    group: brandGroup(brand.category),
    to: brandRoute(brand),
    logo: brand.thumbnail,
    tbi: score,
    country: country.label,
    countryFlag: country.flag,
    terms: [
      brand.name,
      brand.slug,
      brand.category,
      text(brand.identity?.tagline),
      text(brand.identity?.description),
      text(brand.website),
      text(country.label),
    ],
  };
}

function buildOfferHit(offer: AdminOffer, brand?: Hit): Hit {
  return {
    id: `offer-${offer.id}`,
    label: `${offer.brand} - ${offer.discount || offer.title}`,
    sub: `${offer.category} | ${offer.title}${offer.code ? ` | Code ${offer.code}` : ""}`,
    group: "Offers",
    to: "/offers",
    icon: BadgePercent,
    logo: brand?.logo,
    tbi: brand?.tbi,
    country: brand?.country,
    countryFlag: brand?.countryFlag,
    brandName: offer.brand,
    terms: [offer.brand, offer.title, text(offer.description), text(offer.discount), text(offer.code), offer.category],
  };
}

function buildBlogHit(post: BlogPost): Hit {
  return {
    id: `blog-${post.id}`,
    label: post.title,
    sub: `${post.tag || "Blog"}${post.readTime ? ` | ${post.readTime}` : ""}`,
    group: "Blogs",
    to: `/articles/${articleRouteId(post)}`,
    icon: Newspaper,
    logo: post.cover,
    terms: [post.title, post.excerpt, post.tag, post.tags?.join(" ")],
  };
}

function buildFaqHit(faq: Faq): Hit {
  return {
    id: `faq-${faq.id}`,
    label: faq.question,
    sub: `${faq.category || "FAQ"} | Help center`,
    group: "FAQ",
    to: "/faqs",
    icon: HelpCircle,
    terms: [faq.question, faq.answer, faq.category],
  };
}

function matches(hit: Hit, term: string) {
  const haystack = [hit.label, hit.sub, hit.group, hit.brandName, ...(hit.terms ?? [])]
    .join(" ")
    .toLowerCase();
  return haystack.includes(term);
}

export function GlobalSearchModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [q, setQ] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [brandHits, setBrandHits] = useState<Hit[]>([]);
  const [contentHits, setContentHits] = useState<Hit[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;

    let active = true;
    setLoading(true);

    async function loadSearchData() {
      const [brands, offers, posts, faqs, tbiProfiles] = await Promise.all([
        fetchPublicAdminBrands(),
        fetchPublicOffers(),
        fetchPublicBlogPosts(0, 80),
        fetchPublicFaqs(0, 80),
        fetchTbiExplore(),
      ]);

      if (!active) return;

      const tbiBySlug = new Map(tbiProfiles.map((profile) => [profile.slug, profile]));
      const nextBrands = brands
        .filter(isPublishedBrand)
        .map((brand) => buildBrandHit(brand, tbiBySlug.get(brand.slug)))
        .sort((a, b) => (b.tbi ?? 0) - (a.tbi ?? 0));
      const byBrandName = new Map(nextBrands.map((hit) => [hit.label.toLowerCase(), hit]));

      const nextContent = [
        ...offers
          .filter((offer) => offer.status === "active")
          .map((offer) => buildOfferHit(offer, byBrandName.get(offer.brand.toLowerCase()))),
        ...posts.map(buildBlogHit),
        ...faqs.map(buildFaqHit),
        ...QUICK_LINKS,
      ];

      setBrandHits(nextBrands);
      setContentHits(nextContent);
      setLoading(false);
    }

    void loadSearchData().catch(() => {
      if (!active) return;
      setBrandHits([]);
      setContentHits(QUICK_LINKS);
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setHistory(readHistory());
    setQ("");
    const timer = setTimeout(() => inputRef.current?.focus(), 50);
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      clearTimeout(timer);
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  const allHits = useMemo(() => [...brandHits, ...contentHits], [brandHits, contentHits]);

  const trendingBrands = useMemo(() => brandHits.slice(0, 6), [brandHits]);
  const trendingSearches = useMemo(() => {
    const offerHits = contentHits.filter((hit) => hit.group === "Offers").slice(0, 3);
    return [...brandHits.slice(0, 3), ...offerHits].slice(0, 6);
  }, [brandHits, contentHits]);

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return [];
    return allHits.filter((hit) => matches(hit, term)).slice(0, 36);
  }, [q, allHits]);

  const grouped = useMemo(() => {
    const groups: Record<string, Hit[]> = {};
    results.forEach((result) => {
      (groups[result.group] ||= []).push(result);
    });
    return groups;
  }, [results]);

  function pushHistory(term: string) {
    const nextTerm = term.trim();
    if (!nextTerm) return;
    const next = [
      nextTerm,
      ...history.filter((item) => item.toLowerCase() !== nextTerm.toLowerCase()),
    ].slice(0, MAX_HISTORY);
    setHistory(next);
    writeHistory(next);
  }

  function go(hit: Hit, term?: string) {
    pushHistory(term ?? hit.label);
    onClose();
    navigate({ to: hit.to });
  }

  function submitFreeText() {
    const term = q.trim();
    if (!term) return;
    pushHistory(term);
    if (results[0]) go(results[0], term);
  }

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="mobile-scroll fixed inset-0 z-[2147483000] flex items-start justify-center overflow-y-auto bg-[#090313]/82 p-2 backdrop-blur-md sm:p-4"
      onClick={onClose}
    >
      <div className="pointer-events-none absolute left-1/2 top-10 h-[300px] w-[min(92vw,720px)] -translate-x-1/2 rounded-full bg-fuchsia-500/18 blur-3xl sm:top-20 sm:h-[460px]" />
      <div
        onClick={(event) => event.stopPropagation()}
        className="relative mt-3 max-h-[calc(100dvh-1rem)] w-full max-w-4xl overflow-hidden rounded-[1.4rem] bg-[#12051f]/96 ring-1 ring-fuchsia-300/20 sm:mt-20 sm:rounded-[2rem]"
      >
        <div className="flex items-center gap-3 border-b border-white/8 px-4 py-3 sm:px-5 sm:py-4">
          <Search className="h-4 w-4 text-fuchsia-200" />
          <input
            ref={inputRef}
            value={q}
            onChange={(event) => setQ(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") submitFreeText();
            }}
            placeholder="Search brands, offers, articles, FAQs, payouts, tools..."
            className="w-full bg-transparent text-base text-white outline-none placeholder:text-white/38"
          />
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full bg-white/[0.045] text-white/70 transition hover:bg-white/[0.09] hover:text-white"
            aria-label="Close search"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mobile-scroll max-h-[calc(100dvh-5.75rem)] overflow-y-auto p-3 sm:max-h-[68vh] sm:p-5">
          {q.trim().length === 0 ? (
            <div className="space-y-6">
              <section>
                <SectionHeader icon={Flame} label="Trending searches" />
                {loading ? (
                  <LoadingRows />
                ) : trendingSearches.length ? (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {trendingSearches.map((hit) => (
                      <SuggestionCard key={hit.id} hit={hit} onClick={() => go(hit)} />
                    ))}
                  </div>
                ) : (
                  <EmptyState label="Published brands and offers will appear here." />
                )}
              </section>

              {history.length > 0 && (
                <section>
                  <div className="flex items-center justify-between">
                    <SectionHeader icon={Clock} label="Recent searches" compact />
                    <button
                      onClick={() => {
                        setHistory([]);
                        writeHistory([]);
                      }}
                      className="flex items-center gap-1 text-[10px] text-white/42 transition hover:text-white"
                    >
                      <Trash2 className="h-3 w-3" /> Clear
                    </button>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {history.map((item) => (
                      <button
                        key={item}
                        onClick={() => setQ(item)}
                        className="inline-flex items-center gap-2 rounded-full bg-white/[0.045] px-3 py-1.5 text-xs text-white/78 transition hover:bg-white/[0.08] hover:text-white"
                      >
                        <Clock className="h-3 w-3 text-white/38" />
                        {item}
                      </button>
                    ))}
                  </div>
                </section>
              )}

              <section>
                <SectionHeader icon={Sparkles} label="Trending brands" />
                {loading ? (
                  <LoadingRows />
                ) : trendingBrands.length ? (
                  <div className="grid gap-2 md:grid-cols-2">
                    {trendingBrands.map((brand) => (
                      <BrandSearchCard key={brand.id} hit={brand} onClick={() => go(brand)} />
                    ))}
                  </div>
                ) : (
                  <EmptyState label="No published brands are available yet." />
                )}
              </section>

              <section>
                <SectionHeader icon={ArrowRight} label="Jump to" />
                  <div className="grid grid-cols-1 gap-2 min-[380px]:grid-cols-2 sm:grid-cols-4">
                  {QUICK_LINKS.map((link) => (
                    <QuickLinkButton key={link.id} hit={link} onClick={() => go(link)} />
                  ))}
                </div>
              </section>
            </div>
          ) : (
            <div>
              {loading ? (
                <LoadingRows />
              ) : Object.entries(grouped).length === 0 ? (
                <NoSearchResults query={q} onBrowse={go} />
              ) : (
                Object.entries(grouped).map(([group, hits]) => (
                  <div key={group} className="mb-5 last:mb-0">
                    <SectionHeader icon={groupIcon(group)} label={group} />
                    <div className="space-y-1">
                      {hits.map((hit) => (
                        <ResultRow key={hit.id} hit={hit} onClick={() => go(hit, q.trim())} />
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}

function groupIcon(group: string): SearchIcon {
  if (group === "Brokers") return Building2;
  if (group === "Prop Firms") return Trophy;
  if (group === "Exchanges") return Coins;
  if (group === "Offers") return BadgePercent;
  if (group === "Blogs") return Newspaper;
  if (group === "FAQ") return HelpCircle;
  if (group === "Tools") return Calculator;
  return Search;
}

function SectionHeader({
  icon: Icon,
  label,
  compact,
}: {
  icon: SearchIcon;
  label: string;
  compact?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-1.5 ${
        compact ? "" : "mb-2"
      } text-[10px] font-bold uppercase tracking-[0.18em] text-white/48`}
    >
      <Icon className="h-3.5 w-3.5 text-fuchsia-300" />
      {label}
    </div>
  );
}

function BrandAvatar({ hit, className = "h-10 w-10" }: { hit: Hit; className?: string }) {
  const Icon = hit.icon;
  return (
    <span
      className={`grid shrink-0 place-items-center overflow-hidden rounded-xl bg-white/[0.055] text-xs font-black text-white ring-1 ring-white/8 ${className}`}
    >
      {hit.logo ? (
        <img src={hit.logo} alt="" className="h-full w-full object-cover" loading="lazy" />
      ) : Icon ? (
        <Icon className="h-4 w-4 text-fuchsia-200" />
      ) : (
        initials(hit.label)
      )}
    </span>
  );
}

function TbiBadge({ value }: { value?: number }) {
  if (!value) return null;
  return (
    <span className="rounded-full bg-fuchsia-400/12 px-2 py-0.5 text-[10px] font-bold text-fuchsia-100 ring-1 ring-fuchsia-300/18">
      TBI {formatTbi(value)}
    </span>
  );
}

function SuggestionCard({ hit, onClick }: { hit: Hit; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="group flex min-w-0 items-center gap-3 rounded-2xl bg-white/[0.035] p-3 text-left transition hover:bg-white/[0.07]"
    >
      <BrandAvatar hit={hit} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-white">{hit.label}</span>
        <span className="mt-0.5 block truncate text-[11px] text-white/45">{hit.sub}</span>
      </span>
      <ArrowRight className="h-3.5 w-3.5 shrink-0 text-white/32 transition group-hover:text-white" />
    </button>
  );
}

function BrandSearchCard({ hit, onClick }: { hit: Hit; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="group flex min-w-0 items-center gap-3 rounded-2xl bg-white/[0.035] p-3 text-left transition hover:bg-white/[0.07]"
    >
      <BrandAvatar hit={hit} className="h-12 w-12" />
      <span className="min-w-0 flex-1">
        <span className="flex min-w-0 items-center gap-2">
          <span className="truncate text-sm font-bold text-white">{hit.label}</span>
          <TbiBadge value={hit.tbi} />
        </span>
        <span className="mt-1 flex min-w-0 items-center gap-1.5 text-[11px] text-white/45">
          {hit.countryFlag ? <span className="text-sm leading-none">{hit.countryFlag}</span> : null}
          <span className="truncate">{hit.group}</span>
          {hit.country ? <span className="truncate">| {hit.country}</span> : null}
        </span>
      </span>
      <ArrowRight className="h-3.5 w-3.5 shrink-0 text-white/32 transition group-hover:text-white" />
    </button>
  );
}

function QuickLinkButton({ hit, onClick }: { hit: Hit; onClick: () => void }) {
  const Icon = hit.icon ?? ArrowRight;
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 rounded-2xl bg-white/[0.035] px-3 py-2.5 text-left text-xs text-white/82 transition hover:bg-white/[0.075] hover:text-white"
    >
      <Icon className="h-3.5 w-3.5 shrink-0 text-fuchsia-300" />
      <span className="truncate">{hit.label}</span>
    </button>
  );
}

function ResultRow({ hit, onClick }: { hit: Hit; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="group flex w-full min-w-0 items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition hover:bg-white/[0.06]"
    >
      <BrandAvatar hit={hit} />
      <span className="min-w-0 flex-1">
        <span className="flex min-w-0 items-center gap-2">
          <span className="truncate text-sm font-semibold text-white">{hit.label}</span>
          <TbiBadge value={hit.tbi} />
        </span>
        <span className="mt-0.5 block truncate text-[11px] text-white/45">{hit.sub}</span>
      </span>
      <ArrowRight className="h-3.5 w-3.5 shrink-0 text-white/32 transition group-hover:text-white" />
    </button>
  );
}

function LoadingRows() {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {[0, 1, 2, 3].map((index) => (
        <div key={index} className="flex items-center gap-3 rounded-2xl bg-white/[0.035] p-3">
          <div className="skeleton h-10 w-10 shrink-0 rounded-xl" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="skeleton h-3 w-3/5" />
            <div className="skeleton h-2.5 w-4/5" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="rounded-2xl bg-white/[0.03] p-5 text-center text-xs text-white/42">
      {label}
    </div>
  );
}

function NoSearchResults({
  query,
  onBrowse,
}: {
  query: string;
  onBrowse: (hit: Hit) => void;
}) {
  return (
    <div className="px-1 py-8">
      <div className="mx-auto max-w-xl text-center">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-primary/15 text-primary ring-1 ring-primary/25">
          <Search className="h-5 w-5" />
        </div>
        <h3 className="mt-4 text-base font-bold text-white">Couldn't find what you're looking for?</h3>
        <p className="mt-2 text-sm text-white/50">
          No direct match for <span className="text-white">"{query.trim()}"</span>. Browse one of
          these sections instead.
        </p>
      </div>
      <div className="mx-auto mt-5 grid max-w-2xl gap-2 sm:grid-cols-2">
        {EMPTY_BROWSE_LINKS.map((link) => {
          const Icon = link.icon ?? ArrowRight;
          return (
            <button
              key={link.id}
              onClick={() => onBrowse(link)}
              className="group flex items-center gap-3 rounded-2xl bg-white/[0.035] p-3 text-left transition hover:bg-white/[0.075]"
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/12 text-primary ring-1 ring-primary/20">
                <Icon className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-white">{link.label}</span>
                <span className="mt-0.5 block truncate text-[11px] text-white/45">{link.sub}</span>
              </span>
              <ArrowRight className="h-3.5 w-3.5 shrink-0 text-white/32 transition group-hover:text-white" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
