import { createFileRoute } from "@tanstack/react-router";
import { PublicInfoPage, publicPages } from "@/components/PublicInfoPage";

const page = publicPages["affiliate-program"];

export const Route = createFileRoute("/affiliate-program")({
  head: () => ({
    meta: [
      { title: "Affiliate Program | RebateBoard" },
      { name: "description", content: page.description },
    ],
  }),
  component: () => <PublicInfoPage page={page} />,
});
