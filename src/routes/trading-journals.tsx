import { createFileRoute } from "@tanstack/react-router";
import { PublicInfoPage, publicPages } from "@/components/PublicInfoPage";

const page = publicPages["trading-journals"];

export const Route = createFileRoute("/trading-journals")({
  head: () => ({
    meta: [
      { title: "Trading Journal | RebateBoard" },
      { name: "description", content: page.description },
      { property: "og:title", content: "Trading Journal | RebateBoard" },
      { property: "og:description", content: page.description },
    ],
  }),
  component: () => <PublicInfoPage page={page} />,
});
