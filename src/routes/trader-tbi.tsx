import { createFileRoute } from "@tanstack/react-router";
import { PublicInfoPage, publicPages } from "@/components/PublicInfoPage";

const page = publicPages["trader-tbi"];

export const Route = createFileRoute("/trader-tbi")({
  head: () => ({
    meta: [
      { title: "Trader TBI | RebateBoard" },
      { name: "description", content: page.description },
    ],
  }),
  component: () => <PublicInfoPage page={page} />,
});
