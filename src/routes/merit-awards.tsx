import { createFileRoute } from "@tanstack/react-router";
import { PublicInfoPage, publicPages } from "@/components/PublicInfoPage";

const page = publicPages["merit-awards"];

export const Route = createFileRoute("/merit-awards")({
  head: () => ({
    meta: [
      { title: "Merit Awards | RebateBoard" },
      { name: "description", content: page.description },
    ],
  }),
  component: () => <PublicInfoPage page={page} />,
});
