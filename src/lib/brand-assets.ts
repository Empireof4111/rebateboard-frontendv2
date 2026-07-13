import { API_BASE_URL } from "@/lib/api";
import type { AdminBrandRecord } from "@/lib/admin-brands-api";

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

export function firstBrandText(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
  }
  return "";
}

export function resolveMediaUrl(value?: unknown) {
  const raw = firstBrandText(value);
  if (!raw || /^(null|undefined)$/i.test(raw)) return "";
  if (/^(https?:|data:|blob:)/i.test(raw)) return raw;
  if (raw.startsWith("//")) return `https:${raw}`;

  const apiOrigin = API_BASE_URL.replace(/\/api\/v\d+\/?$/i, "");
  if (raw.startsWith("/api/v")) return `${apiOrigin}${raw}`;
  if (raw.startsWith("/file/")) return `${API_BASE_URL}${raw}`;
  if (raw.startsWith("/")) return `${apiOrigin}${raw}`;

  return `${API_BASE_URL}/file/view?key=${encodeURIComponent(raw)}`;
}

export function faviconUrl(value?: unknown) {
  const website = firstBrandText(value);
  if (!website) return "";
  const host = website
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .split("/")[0];
  return host ? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=128` : "";
}

export function brandLogoUrl(brand?: Partial<AdminBrandRecord> | null) {
  if (!brand) return "";
  const identity = asRecord(brand.identity);
  const profile = asRecord(brand.profile);
  const seo = asRecord(brand.seo);
  const direct = firstBrandText(
    brand.thumbnail,
    identity.logo,
    identity.logoUrl,
    identity.image,
    identity.imageUrl,
    profile.logo,
    profile.logoUrl,
    profile.image,
    profile.imageUrl,
    seo.logo,
    seo.logoUrl,
  );
  return resolveMediaUrl(direct) || faviconUrl(brand.website || identity.website || profile.website);
}

export function brandInitials(name?: string) {
  return firstBrandText(name)
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}
