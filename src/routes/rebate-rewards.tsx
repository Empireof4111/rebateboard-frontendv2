import { createFileRoute } from "@tanstack/react-router";
import { PublicInfoPage, publicPages } from "@/components/PublicInfoPage";

const page = publicPages["rebate-rewards"];

export const Route = createFileRoute("/rebate-rewards")({
  head: () => ({
    meta: [
      { title: "Rebate Rewards | RebateBoard" },
      { name: "description", content: page.description },
    ],
  }),
  component: () => <PublicInfoPage page={page} />,
});
