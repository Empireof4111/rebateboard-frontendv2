import { createFileRoute } from "@tanstack/react-router";
import { PublicInfoPage, publicPages } from "@/components/PublicInfoPage";

const page = publicPages["trading-plan"];

export const Route = createFileRoute("/trading-plan")({
  head: () => ({
    meta: [
      { title: "Trading Plan | RebateBoard" },
      { name: "description", content: page.description },
    ],
  }),
  component: () => <PublicInfoPage page={page} />,
});
