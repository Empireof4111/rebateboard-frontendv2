import type { AdminOffer } from "@/lib/admin-data";

export type OfferBrandAsset = {
  id?: string;
  name: string;
  slug?: string;
  category?: string;
  status?: string;
  thumbnail?: string;
  cover?: string;
  primaryColor?: string;
};

export type OfferBrandFields = {
  brandLogo?: string;
  brandSlug?: string;
  brandStatus?: string;
  brandCategory?: string;
  brandPrimaryColor?: string;
};

function slugifyBrandName(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalize(value: string | undefined | null) {
  return (value ?? "").trim().toLowerCase();
}

export function resolveOfferBrandAsset(offer: AdminOffer, brands: OfferBrandAsset[] = []) {
  const brandId = normalize(offer.brandId);
  const brandName = normalize(offer.brand);

  return (
    brands.find((brand) => brandId && normalize(brand.id) === brandId) ??
    brands.find((brand) => brandName && normalize(brand.name) === brandName) ??
    null
  );
}

export function enrichOfferWithBrandAsset<T extends AdminOffer>(
  offer: T,
  brands: OfferBrandAsset[] = [],
): T & OfferBrandFields {
  const brand = resolveOfferBrandAsset(offer, brands);
  const logo = brand?.thumbnail ?? brand?.cover;

  return {
    ...offer,
    brandId: offer.brandId ?? brand?.id,
    brand: offer.brand || brand?.name || "",
    brandLogo: logo,
    brandSlug: brand?.slug ?? (offer.brand ? slugifyBrandName(offer.brand) : undefined),
    brandStatus: brand?.status,
    brandCategory: brand?.category,
    brandPrimaryColor: brand?.primaryColor,
  };
}

export function enrichOffersWithBrandAssets<T extends AdminOffer>(
  offers: T[],
  brands: OfferBrandAsset[] = [],
) {
  return offers.map((offer) => enrichOfferWithBrandAsset(offer, brands));
}

export function stripOfferBrandAssetFields<T extends AdminOffer & OfferBrandFields>(
  offer: T,
): AdminOffer {
  const clean: AdminOffer & Partial<OfferBrandFields> = { ...offer };
  delete clean.brandLogo;
  delete clean.brandSlug;
  delete clean.brandStatus;
  delete clean.brandCategory;
  delete clean.brandPrimaryColor;
  return clean;
}
