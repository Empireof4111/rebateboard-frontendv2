/**
 * Bridges approved brand onboarding submissions into the public TBI list shape.
 * The public TBI uses TBIBrand; submissions live in tbi-onboarding store.
 */
import { useMemo } from "react";
import { TBI_BRANDS, type TBIBrand, type TBICategory, type TBIStatus } from "./tbi-data";
import { useBrandSubmissions, type BrandCategory, type BrandSubmission } from "./tbi-onboarding";

const CATEGORY_LABEL: Record<BrandCategory, TBICategory> = {
  prop_firm: "Prop Firm",
  broker: "Broker",
  exchange: "Exchange",
  tool: "Tool",
};

const COLORS = [
  "from-fuchsia-500 to-violet-600",
  "from-cyan-500 to-blue-600",
  "from-emerald-500 to-teal-600",
  "from-amber-500 to-orange-600",
  "from-rose-500 to-pink-600",
];

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function submissionToTbiBrand(sub: BrandSubmission, idx = 0): TBIBrand {
  const status: TBIStatus =
    sub.trustScoreMode === "full" ? "full" :
    sub.trustScoreMode === "partial" ? "partial" : "preliminary";
  const score = sub.trustScore ?? sub.preliminaryScore ?? 0;
  const slug = sub.publicSlug || slugify(sub.brandName) || sub.id;
  return {
    slug,
    name: sub.brandName,
    category: CATEGORY_LABEL[sub.category],
    score,
    maxScore: status === "preliminary" ? 6.5 : 10,
    status,
    confidence: status === "full" ? "High" : status === "partial" ? "Medium" : "Low",
    reviewCount: sub.reviewCount,
    verifiedReviews: sub.reviewCount,
    country: sub.data?.identity?.country ?? "—",
    regulation: sub.data?.identity?.regulation ?? "—",
    website: sub.data?.identity?.website ?? "#",
    tag:
      status === "full" ? "Newly Onboarded · Fully Verified" :
      status === "partial" ? "Emerging · Partial Unlock" :
      "New · Preliminary Profile",
    logoColor: COLORS[idx % COLORS.length],
    breakdown: {
      transparency: sub.breakdown.transparency,
      proof: sub.breakdown.proof,
      community: sub.breakdown.community ?? 0,
      conditions: sub.breakdown.conditions,
      experience: sub.breakdown.experience,
    },
    reviews: [],
  };
}

/**
 * React hook returning TBI_BRANDS merged with approved/published onboarded brands.
 * Sorted by score desc.
 */
export function useMergedTbiBrands(): TBIBrand[] {
  const submissions = useBrandSubmissions();
  return useMemo(() => {
    const approved = submissions.filter(
      (s) => s.status === "approved" || s.onboardingStatus === "published",
    );
    const onboarded = approved.map((s, i) => submissionToTbiBrand(s, i));
    // dedupe by slug — onboarded wins
    const seen = new Set(onboarded.map((b) => b.slug));
    const merged = [...onboarded, ...TBI_BRANDS.filter((b) => !seen.has(b.slug))];
    return merged.sort((a, b) => b.score - a.score);
  }, [submissions]);
}
