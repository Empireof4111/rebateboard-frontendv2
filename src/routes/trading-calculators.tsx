import { createFileRoute } from "@tanstack/react-router";
import { PublicCategoryListing } from "@/components/listings/PublicCategoryListing";
import { getListingCategoryConfig } from "@/lib/listing-categories";

const config = getListingCategoryConfig("trading-calculators");

export const Route = createFileRoute("/trading-calculators")({
  head: () => ({
    meta: [
      { title: `${config.title} | RebateBoard` },
      { name: "description", content: config.description },
      { property: "og:title", content: `${config.title} | RebateBoard` },
      { property: "og:description", content: config.description },
    ],
  }),
  component: () => <PublicCategoryListing config={config} />,
});
