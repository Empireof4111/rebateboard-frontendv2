/**
 * Dashboard ad banners – appear above every page rendered inside DashboardLayout.
 *
 * Format types:
 *  - "marquee"   : single sliding text line (good for short promos)
 *  - "single"    : one rich banner (headline + sub + CTA + optional brand)
 *  - "carousel"  : 2–5 brand strip rotating (multi-brand cut)
 *  - "trending"  : auto-recommended trending brands from TBI top scores
 *
 * Persistence: sessionStorage via the admin store. The same listener bus is
 * used so superadmin edits push live to user dashboards in the same tab.
 */
import { readCollection, writeCollection } from "./admin-store";
import { TBI_BRANDS } from "./tbi-data";
import { blogPosts as blogSeed, type BlogPost } from "./admin-data";

export type AdFormat = "marquee" | "single" | "carousel" | "trending";

/**
 * Where an ad renders.
 *  - "dashboard"          : top of every authenticated dashboard page
 *  - "landing-hero"       : the 4-slide rotating card on the landing hero (right side)
 *  - "landing-sponsors"   : the "Sponsored partners" logo strip on the landing hero
 *  - "landing-advertise"  : the "Advertise Here" promo box near the cashback calculator
 *  - "homepage-video"     : featured YouTube videos near the homepage calculator
 */
export type AdPlacement =
  | "dashboard"
  | "landing-hero"
  | "landing-sponsors"
  | "landing-advertise"
  | "homepage-video";

export type AdSlide = {
  brandSlug?: string;
  blogId?: string;     // when present, slide is sourced from a blog post
  source?: "template" | "blog";
  label: string;       // brand label or short pitch
  sub?: string;        // tagline
  href: string;        // link target
  accent?: string;     // tailwind from-x to-y gradient or hex
  image?: string;      // optional cover image (used by hero card)
};

export type SponsorLogo = {
  id: string;
  name: string;
  initial?: string;
  logo?: string;
  color?: string;       // tailwind from-x to-y gradient
  href?: string;
  tag?: "featured" | "ad" | "sponsor";
};

export type DashboardAd = {
  id: string;
  name: string;             // internal name
  format: AdFormat;
  placement: AdPlacement;   // where this ad renders (defaults to "dashboard" for legacy ads)
  active: boolean;
  startAt?: string;         // ISO date – inclusive
  endAt?: string;           // ISO date – inclusive
  priority: number;         // higher wins when several are active
  // marquee/single
  headline?: string;
  sub?: string;
  cta?: string;
  href?: string;
  accent?: string;          // gradient from-to e.g. "from-fuchsia-500 to-violet-600"
  image?: string;           // optional cover image (used by hero / single banner)
  description?: string;
  videoUrl?: string;
  // carousel
  slides?: AdSlide[];
  // sponsors strip
  sponsors?: SponsorLogo[];
  // trending
  trendingLimit?: number;
  // analytics
  impressions: number;
  clicks: number;
  createdAt: string;
};

const KEY = "dashboard-ads";

const seed: DashboardAd[] = [
  {
    id: "ad-welcome",
    name: "Welcome marquee",
    format: "marquee",
    placement: "dashboard",
    active: true,
    priority: 10,
    headline:
      "🎁 Earn up to 30% rebate on every funded challenge — link your account to start tracking instantly.",
    href: "/dashboard/wallet",
    accent: "from-fuchsia-500 to-violet-600",
    impressions: 0,
    clicks: 0,
    createdAt: new Date().toISOString(),
  },
  {
    id: "ad-ftmo",
    name: "FTMO single banner",
    format: "single",
    placement: "dashboard",
    active: true,
    priority: 5,
    headline: "FTMO Spring Bonus — 20% off challenge fee",
    sub: "Verified payouts, EU regulated. Limited until end of month.",
    cta: "Claim deal",
    href: "/payouts/ftmo",
    accent: "from-emerald-400 to-teal-600",
    impressions: 0,
    clicks: 0,
    createdAt: new Date().toISOString(),
  },
  {
    id: "ad-multi",
    name: "Top brands carousel",
    format: "carousel",
    placement: "dashboard",
    active: true,
    priority: 3,
    slides: [
      { source: "template", label: "FTMO", sub: "9.2 TBI", href: "/payouts/ftmo", brandSlug: "ftmo", accent: "from-emerald-400 to-teal-600" },
      { source: "template", label: "FundedNext", sub: "Fast payouts", href: "/payouts/fundednext", brandSlug: "fundednext", accent: "from-sky-400 to-indigo-600" },
      { source: "template", label: "MyForexFunds", sub: "Up to 90% split", href: "/payouts/myforexfunds", brandSlug: "myforexfunds", accent: "from-amber-400 to-orange-600" },
    ],
    impressions: 0,
    clicks: 0,
    createdAt: new Date().toISOString(),
  },
  // ── Landing page placements ──────────────────────────────────────────────
  {
    id: "ad-landing-hero",
    name: "Landing hero rotator",
    format: "carousel",
    placement: "landing-hero",
    active: true,
    priority: 10,
    slides: [
      { source: "blog", blogId: "bp_1", label: "Why TBI matters in 2026", sub: "Industry · 6 min read", href: "/articles/bp_1", accent: "from-fuchsia-500 to-violet-600" },
      { source: "blog", blogId: "bp_2", label: "Top 10 Prop Firms — April Report", sub: "Comparison · 9 min read", href: "/articles/bp_2", accent: "from-emerald-400 to-teal-600" },
      { source: "template", label: "FTMO Spring Bonus", sub: "20% off challenge fee", href: "/payouts/ftmo", accent: "from-amber-400 to-orange-500" },
      { source: "template", label: "Verified Payout Tracker", sub: "Live across 50+ brands", href: "/payouts", accent: "from-sky-400 to-indigo-600" },
    ],
    impressions: 0,
    clicks: 0,
    createdAt: new Date().toISOString(),
  },
  {
    id: "ad-landing-sponsors",
    name: "Sponsored partners strip",
    format: "carousel",
    placement: "landing-sponsors",
    active: true,
    priority: 10,
    sponsors: [
      { id: "sp1", name: "Bitget", initial: "B", color: "from-cyan-400 to-blue-500", href: "/payouts/bitget", tag: "sponsor" },
      { id: "sp2", name: "Bybit", initial: "BY", color: "from-yellow-400 to-orange-500", href: "/payouts/bybit", tag: "featured" },
      { id: "sp3", name: "Exness", initial: "ex", color: "from-yellow-300 to-yellow-500", href: "/payouts/exness", tag: "ad" },
      { id: "sp4", name: "FTMO", initial: "F", color: "from-blue-500 to-indigo-600", href: "/payouts/ftmo", tag: "featured" },
      { id: "sp5", name: "FundedNext", initial: "FN", color: "from-pink-500 to-rose-500", href: "/payouts/fundednext", tag: "sponsor" },
      { id: "sp6", name: "OKX", initial: "X", color: "from-zinc-700 to-zinc-900", href: "/payouts/okx", tag: "ad" },
    ],
    impressions: 0,
    clicks: 0,
    createdAt: new Date().toISOString(),
  },
  {
    id: "ad-landing-advertise",
    name: "Advertise Here promo",
    format: "single",
    placement: "landing-advertise",
    active: true,
    priority: 10,
    headline: "Advertise Here",
    sub: "Reach thousands of active traders and investors. Premium placements convert.",
    cta: "Get Started",
    href: "/business/join",
    accent: "from-fuchsia-500 to-violet-600",
    impressions: 0,
    clicks: 0,
    createdAt: new Date().toISOString(),
  },
];

function ensureSeed(): DashboardAd[] {
  const current = readCollection<DashboardAd>(KEY, []);
  if (current.length === 0) {
    writeCollection(KEY, seed);
    return seed;
  }
  // Backfill placement on ads created before this field existed, and ensure
  // the landing-page seed ads are present (they were added later).
  let mutated = false;
  const patched = current.map((a) => {
    if (!a.placement) { mutated = true; return { ...a, placement: "dashboard" as AdPlacement }; }
    return a;
  });
  const seedById = new Map(seed.map((s) => [s.id, s]));
  for (const id of ["ad-landing-hero", "ad-landing-sponsors", "ad-landing-advertise"]) {
    if (!patched.some((a) => a.id === id) && seedById.has(id)) {
      patched.push(seedById.get(id)!);
      mutated = true;
    }
  }
  if (mutated) writeCollection(KEY, patched);
  return patched;
}

export function readAds(): DashboardAd[] {
  return ensureSeed();
}

export function writeAds(ads: DashboardAd[]) {
  writeCollection(KEY, ads);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("rb:dashboard-ads"));
  }
}

export function upsertAd(ad: DashboardAd) {
  const all = readAds();
  const idx = all.findIndex((a) => a.id === ad.id);
  if (idx >= 0) {
    const next = [...all];
    next[idx] = ad;
    writeAds(next);
  } else {
    writeAds([ad, ...all]);
  }
}

export function deleteAd(id: string) {
  writeAds(readAds().filter((a) => a.id !== id));
}

export function trackImpression(id: string) {
  const all = readAds();
  const idx = all.findIndex((a) => a.id === id);
  if (idx < 0) return;
  const next = [...all];
  next[idx] = { ...next[idx], impressions: next[idx].impressions + 1 };
  // bypass live event to avoid re-render loop
  writeCollection(KEY, next);
}

export function trackClick(id: string) {
  const all = readAds();
  const idx = all.findIndex((a) => a.id === id);
  if (idx < 0) return;
  const next = [...all];
  next[idx] = { ...next[idx], clicks: next[idx].clicks + 1 };
  writeCollection(KEY, next);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("rb:dashboard-ads"));
  }
}

function withinSchedule(ad: DashboardAd, now: Date): boolean {
  if (ad.startAt && now < new Date(ad.startAt)) return false;
  if (ad.endAt && now > new Date(ad.endAt)) return false;
  return true;
}

/** Picks a single ad to show at top of dashboard pages. */
export function pickActiveAd(now: Date = new Date()): DashboardAd | null {
  return pickActiveAdFor("dashboard", now);
}

/** Picks the highest-priority active ad for a specific placement. */
export function pickActiveAdFor(placement: AdPlacement, now: Date = new Date()): DashboardAd | null {
  const candidates = readAds().filter(
    (a) => a.active && (a.placement ?? "dashboard") === placement && withinSchedule(a, now),
  );
  if (candidates.length === 0) return null;
  candidates.sort((a, b) => b.priority - a.priority);
  return candidates[0];
}

/** Returns all active ads for a placement (used by sponsor strips). */
export function listActiveAdsFor(placement: AdPlacement, now: Date = new Date()): DashboardAd[] {
  return readAds()
    .filter((a) => a.active && (a.placement ?? "dashboard") === placement && withinSchedule(a, now))
    .sort((a, b) => b.priority - a.priority);
}

/** Resolve a blog-sourced slide to its current blog post (live). */
export function resolveBlogSlide(blogId: string): BlogPost | null {
  const list = readCollection<BlogPost>("blog", blogSeed as BlogPost[]);
  return list.find((b) => b.id === blogId) ?? null;
}

/** Hydrate a slide with blog content (label/sub/href/image) when sourced from blog. */
export function hydrateSlide(s: AdSlide): AdSlide {
  if (s.source !== "blog" || !s.blogId) return s;
  const post = resolveBlogSlide(s.blogId);
  if (!post) return s;
  return {
    ...s,
    label: post.title || s.label,
    sub: post.excerpt || post.tag || s.sub,
    href: `/articles/${post.id}`,
    image: post.cover || (post as BlogPost & { thumbnail?: string }).thumbnail || s.image,
  };
}

/** Trending recommendation slides built from TBI top scores. */
export function trendingSlides(limit = 5): AdSlide[] {
  return [...TBI_BRANDS]
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((b) => ({
      brandSlug: b.slug,
      label: b.name,
      sub: `TBI ${b.score.toFixed(1)} • ${b.tag}`,
      href: `/payouts/${b.slug}`,
      accent: `bg-gradient-to-r ${b.logoColor}`,
    }));
}
