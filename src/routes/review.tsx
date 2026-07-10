import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { z } from "zod";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ReviewWizard } from "@/components/reviews/ReviewWizard";
import { useAuth } from "@/lib/auth";
import type { ReviewProviderType } from "@/lib/reviews-store";

const reviewProviderTypes = ["Prop Firm", "Broker", "Exchange", "Tool"] as const;

const searchSchema = z.object({
  providerType: z.string().optional(),
  itemSlug: z.string().optional(),
  brandSlug: z.string().optional(),
  brandId: z.string().optional(),
  reviewType: z.string().optional(),
});

export const Route = createFileRoute("/review")({
  validateSearch: (search) => {
    const parsed = searchSchema.safeParse(search);
    return parsed.success ? parsed.data : {};
  },
  head: () => ({
    meta: [
      { title: "Drop a Review — RebateBoard" },
      { name: "description", content: "Share your verified trading experience and shape brand TBI scores." },
    ],
  }),
  component: ReviewPage,
});

function ReviewPage() {
  const search = Route.useSearch();
  const providerType = normalizeProviderType(search.providerType);
  const itemSlug = search.itemSlug || search.brandSlug || search.brandId;
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate({
        to: "/login",
        search: { redirect: buildReviewRedirect(search) } as any,
      });
    }
  }, [user, loading, navigate, search]);

  if (loading || !user) {
    return (
      <div className="relative min-h-screen pt-24 text-center text-sm text-muted-foreground">
        Preparing your review workspace...
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      <SiteHeader />
      <main className="container-app max-w-6xl pb-8 pt-4 sm:pb-10 sm:pt-5">
        <div className="mb-6 text-center">
          <h1 className="text-gradient text-3xl font-bold sm:text-4xl">Drop a Review</h1>
          <p className="mt-2 text-sm text-muted-foreground">Your verified review feeds directly into the brand's TBI score.</p>
        </div>
        <ReviewWizard
          initialProviderType={providerType}
          initialBrandSlug={itemSlug}
        />
      </main>
      <SiteFooter />
    </div>
  );
}

function normalizeProviderType(value?: string): ReviewProviderType | undefined {
  const decoded = decodeURIComponent(String(value || "")).trim().toLowerCase();
  const match = reviewProviderTypes.find((type) => type.toLowerCase() === decoded);
  return match;
}

function buildReviewRedirect(search: z.infer<typeof searchSchema>) {
  const params = new URLSearchParams();
  const slug = search.itemSlug || search.brandSlug || search.brandId;
  const providerType = normalizeProviderType(search.providerType);
  if (slug) params.set("itemSlug", slug);
  if (providerType) params.set("providerType", providerType);
  if (search.reviewType) params.set("reviewType", search.reviewType);
  const query = params.toString();
  return query ? `/review?${query}` : "/review";
}
