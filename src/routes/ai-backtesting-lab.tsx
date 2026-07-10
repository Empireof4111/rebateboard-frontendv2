import { createFileRoute } from "@tanstack/react-router";
import { PublicInfoPage, publicPages } from "@/components/PublicInfoPage";

const page = publicPages["ai-backtesting-lab"];

export const Route = createFileRoute("/ai-backtesting-lab")({
  head: () => ({
    meta: [
      { title: "AI Backtesting Lab | RebateBoard" },
      { name: "description", content: page.description },
    ],
  }),
  component: () => <PublicInfoPage page={page} />,
});
