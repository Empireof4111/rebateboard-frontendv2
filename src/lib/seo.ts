const configuredSiteOrigin =
  (import.meta.env.VITE_SITE_ORIGIN as string | undefined) ||
  (import.meta.env.VITE_PUBLIC_SITE_URL as string | undefined) ||
  (import.meta.env.VITE_APP_URL as string | undefined);

function cleanOrigin(value?: string) {
  const trimmed = value?.trim().replace(/\/+$/, "");
  if (trimmed && /^https?:\/\//i.test(trimmed)) return trimmed;
  return "https://rebateboard.com";
}

export const SITE_ORIGIN = cleanOrigin(configuredSiteOrigin);
export const DEFAULT_SOCIAL_IMAGE_PATH = "/rebateboard-social-preview.png";
export const DEFAULT_SOCIAL_IMAGE_URL = `${SITE_ORIGIN}${DEFAULT_SOCIAL_IMAGE_PATH}`;

export function absoluteSiteUrl(pathOrUrl = "/") {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  const normalized = pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`;
  return `${SITE_ORIGIN}${normalized}`;
}

export function absoluteSocialImageUrl(image?: string | null) {
  const value = image?.trim();
  if (!value || /^(data:|blob:)/i.test(value)) return DEFAULT_SOCIAL_IMAGE_URL;
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith("//")) return `https:${value}`;
  return absoluteSiteUrl(value);
}

export function socialImageMeta(image?: string | null, alt = "RebateBoard preview") {
  const url = absoluteSocialImageUrl(image);
  return [
    { property: "og:image", content: url },
    { property: "og:image:secure_url", content: url },
    { property: "og:image:width", content: "1080" },
    { property: "og:image:height", content: "720" },
    { property: "og:image:alt", content: alt },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:image", content: url },
    { name: "twitter:image:alt", content: alt },
  ];
}
