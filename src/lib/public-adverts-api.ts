import { apiRequest } from "@/lib/api";
import type { AdPlacement, DashboardAd } from "@/lib/dashboard-ads";

type PublicAdvertPage = {
  page?: unknown[];
};

const placements: AdPlacement[] = [
  "dashboard",
  "landing-hero",
  "landing-sponsors",
  "landing-advertise",
];

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function text(value: unknown) {
  return String(value ?? "").trim();
}

function placementFrom(value: unknown): AdPlacement {
  const raw = text(value) as AdPlacement;
  return placements.includes(raw) ? raw : "dashboard";
}

function mapPublicAdvert(raw: unknown): DashboardAd {
  const row = asRecord(raw);
  const meta = asRecord(row.metadata);
  const placement = placementFrom(meta.placement || row.page);
  const id = text(row.id) || `${placement}-${text(row.title) || Date.now()}`;
  const headline = text(row.title || meta.headline || meta.name);
  const cta = text(row.action || meta.cta);
  const href = text(meta.href || row.href) || "/business/join";

  return {
    id,
    name: headline || text(meta.name) || "Advert",
    format: (text(meta.format) as DashboardAd["format"]) || "single",
    placement,
    active: row.active !== false,
    priority: Number(row.priority ?? 0),
    headline,
    sub: text(row.subTitle || meta.sub) || undefined,
    cta: cta || undefined,
    href,
    accent: text(meta.accent) || "from-fuchsia-500 to-violet-600",
    image: text(row.thumbnail || meta.image) || undefined,
    slides: Array.isArray(meta.slides) ? (meta.slides as DashboardAd["slides"]) : undefined,
    sponsors: Array.isArray(meta.sponsors)
      ? (meta.sponsors as DashboardAd["sponsors"])
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
    return (response.payload?.page ?? []).map(mapPublicAdvert);
  } catch {
    return [];
  }
}
