import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { z } from "zod";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ReviewWizard } from "@/components/reviews/ReviewWizard";
import { useAuth } from "@/lib/auth";
import type { ReviewProviderType } from "@/lib/reviews-store";

const searchSchema = z.object({
  providerType: z.enum(["Prop Firm", "Broker", "Exchange", "Tool"]).optional(),
  itemSlug: z.string().optional(),
});

export const Route = createFileRoute("/review")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Drop a Review — RebateBoard" },
      { name: "description", content: "Share your verified trading experience and shape brand TBI scores." },
    ],
  }),
  component: ReviewPage,
});

function ReviewPage() {
  const { providerType, itemSlug } = Route.useSearch();
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate({ to: "/login", search: { redirect: `/review?${itemSlug ? `itemSlug=${itemSlug}` : ""}${providerType ? `&providerType=${providerType}` : ""}` } as any });
    }
  }, [user, loading, navigate, itemSlug, providerType]);

  if (loading || !user) {
    return (
      <div className="relative min-h-screen pt-24 text-center text-sm text-muted-foreground">Loading…</div>
    );
  }

  return (
    <div className="relative min-h-screen pt-20">
      <SiteHeader />
      <main className="container-app max-w-6xl py-8 sm:py-10">
        <div className="mb-6 text-center">
          <h1 className="text-gradient text-3xl font-bold sm:text-4xl">Drop a Review</h1>
          <p className="mt-2 text-sm text-muted-foreground">Your verified review feeds directly into the brand's TBI score.</p>
        </div>
        <ReviewWizard
          initialProviderType={providerType as ReviewProviderType | undefined}
          initialBrandSlug={itemSlug}
        />
      </main>
      <SiteFooter />
    </div>
  );
}
