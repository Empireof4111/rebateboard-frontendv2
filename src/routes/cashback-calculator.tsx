import { createFileRoute } from "@tanstack/react-router";
import { PublicInfoPage, publicPages } from "@/components/PublicInfoPage";

const page = publicPages["cashback-calculator"];

export const Route = createFileRoute("/cashback-calculator")({
  head: () => ({
    meta: [
      { title: "Cashback Calculator | RebateBoard" },
      { name: "description", content: page.description },
    ],
  }),
  component: () => <PublicInfoPage page={page} />,
});
