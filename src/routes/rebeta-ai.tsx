import { createFileRoute } from "@tanstack/react-router";
import { PublicInfoPage, publicPages } from "@/components/PublicInfoPage";

const page = publicPages["rebeta-ai"];

export const Route = createFileRoute("/rebeta-ai")({
  head: () => ({
    meta: [
      { title: "Rebeta AI | RebateBoard" },
      { name: "description", content: page.description },
    ],
  }),
  component: () => <PublicInfoPage page={page} />,
});
