import { apiRequest } from "@/lib/api";
import type { AdPlacement, AdSlide, DashboardAd, SponsorLogo } from "@/lib/dashboard-ads";

type PublicAdvertPage = {
  page?: unknown[];
};

const placements: AdPlacement[] = [
  "dashboard",
  "landing-hero",
  "landing-sponsors",
  "landing-advertise",
  "homepage-video",
  "economic-calendar",
];

function asRecord(value: unknown): Record<string, unknown> {
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === "object" && !Array.isArray(parsed)
        ? (parsed as Record<string, unknown>)
        : {};
    } catch {
      return {};
    }
  }
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function text(value: unknown) {
  return String(value ?? "").trim();
}

function firstText(...values: unknown[]) {
  for (const value of values) {
    const next = text(value);
    if (next) return next;
  }
  return "";
}

function placementFrom(value: unknown): AdPlacement {
  const raw = text(value) as AdPlacement;
  return placements.includes(raw) ? raw : "dashboard";
}

function formatFrom(value: unknown): DashboardAd["format"] {
  const raw = text(value).toLowerCase();
  if (raw === "marquee" || raw === "single" || raw === "carousel" || raw === "trending") {
    return raw;
  }
  if (raw === "banner" || raw === "card" || raw === "top" || raw === "sidebar") {
    return "single";
  }
  return "single";
}

function looksLikeHref(value: string) {
  return (
    value.startsWith("/") ||
    value.startsWith("#") ||
    /^https?:\/\//i.test(value) ||
    /^mailto:/i.test(value)
  );
}

function normalizeSlide(raw: unknown): AdSlide | null {
  const slide = asRecord(raw);
  const label = firstText(slide.label, slide.title, slide.name, slide.headline);
  const href = firstText(slide.href, slide.url, slide.link) || "/blog";

  if (!label && !href) return null;

  return {
    brandSlug: firstText(slide.brandSlug, slide.slug) || undefined,
    blogId: firstText(slide.blogId, slide.postId, slide.articleId) || undefined,
    source:
      firstText(slide.source) === "blog"
        ? "blog"
        : firstText(slide.source) === "template"
          ? "template"
          : undefined,
    label: label || "Featured",
    sub: firstText(slide.sub, slide.subtitle, slide.description, slide.excerpt) || undefined,
    href,
    accent: undefined,
    image:
      firstText(slide.image, slide.thumbnail, slide.cover, slide.coverUrl, slide.imageUrl, slide.logo) ||
      undefined,
  };
}

function normalizeSponsor(raw: unknown): SponsorLogo | null {
  const sponsor = asRecord(raw);
  const name = firstText(sponsor.name, sponsor.label, sponsor.title);
  if (!name) return null;

  const tag = firstText(sponsor.tag);

  return {
    id: firstText(sponsor.id, sponsor.brandSlug, sponsor.slug, name) || name,
    name,
    initial: firstText(sponsor.initial, sponsor.initials) || undefined,
    logo:
      firstText(sponsor.logo, sponsor.image, sponsor.thumbnail, sponsor.cover, sponsor.imageUrl) ||
      undefined,
    color: undefined,
    href: firstText(sponsor.href, sponsor.url, sponsor.link) || undefined,
    tag: tag === "featured" || tag === "ad" || tag === "sponsor" ? tag : undefined,
  };
}

function mapPublicAdvert(raw: unknown): DashboardAd {
  const row = asRecord(raw);
  const meta = asRecord(row.metadata);
  const placement = placementFrom(meta.placement || row.page);
  const id = text(row.id) || `${placement}-${text(row.title) || Date.now()}`;
  const headline = text(meta.headline || meta.publicHeadline);
  const action = text(row.action);
  const cta = text(meta.cta || (looksLikeHref(action) ? "" : action));
  const href = text(meta.href || row.href || (looksLikeHref(action) ? action : "")) || "/business/join";
  const image =
    firstText(row.thumbnail, meta.image, meta.thumbnail, meta.cover, meta.imageUrl, row.image) ||
    undefined;

  return {
    id,
    name: text(row.title || meta.name || headline) || "Advert",
    format: formatFrom(meta.format),
    placement,
    active: row.active !== false,
    priority: Number(row.priority ?? 0),
    headline,
    sub: text(row.subTitle || meta.sub) || undefined,
    cta: cta || undefined,
    href,
    accent: undefined,
    image,
    description: text(row.description || meta.description) || undefined,
    videoUrl: text(meta.videoUrl || row.videoUrl || (looksLikeHref(action) ? action : "")) || undefined,
    slides: Array.isArray(meta.slides)
      ? meta.slides.map(normalizeSlide).filter((slide): slide is AdSlide => Boolean(slide))
      : undefined,
    sponsors: Array.isArray(meta.sponsors)
      ? meta.sponsors
          .map(normalizeSponsor)
          .filter((sponsor): sponsor is SponsorLogo => Boolean(sponsor))
      : undefined,
    trendingLimit: Number(meta.trendingLimit || 0) || undefined,
    impressions: Number(row.impressions ?? 0),
    clicks: Number(row.clicks ?? 0),
    createdAt: text(row.createdAt),
    startAt: text(row.startAt) || undefined,
    endAt: text(row.endAt) || undefined,
  };
}

export async function fetchPublicAdverts(placement?: AdPlacement): Promise<DashboardAd[]> {
  const params = new URLSearchParams({ page: "0", size: placement ? "20" : "100" });
  if (placement) params.set("placement", placement);

  try {
    const response = await apiRequest<PublicAdvertPage>(`/advert/public-list?${params}`);
    return (response.payload?.page ?? [])
      .map(mapPublicAdvert)
      .filter((ad) => ad.active && (!placement || ad.placement === placement))
      .sort((a, b) => Number(b.priority ?? 0) - Number(a.priority ?? 0));
  } catch {
    return [];
  }
}

export async function trackPublicAdvertImpression(id: string | number): Promise<void> {
  try {
    await apiRequest(`/advert/${encodeURIComponent(String(id))}/impression`, {
      method: "POST",
    });
  } catch {
    // Tracking should never break the page.
  }
}

export async function trackPublicAdvertClick(id: string | number): Promise<void> {
  try {
    await apiRequest(`/advert/${encodeURIComponent(String(id))}/click`, {
      method: "POST",
    });
  } catch {
    // Tracking should never break navigation.
  }
}
