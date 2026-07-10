import { createFileRoute } from "@tanstack/react-router";
import { PublicInfoPage, publicPages } from "@/components/PublicInfoPage";

const page = publicPages["top-prop-firm-sellers"];

export const Route = createFileRoute("/top-prop-firm-sellers")({
  head: () => ({
    meta: [
      { title: "Top Prop Firm Sellers | RebateBoard" },
      { name: "description", content: page.description },
    ],
  }),
  component: () => <PublicInfoPage page={page} />,
});
