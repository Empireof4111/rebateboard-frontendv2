import { createFileRoute } from "@tanstack/react-router";
import { PublicInfoPage, publicPages } from "@/components/PublicInfoPage";

const page = publicPages.contact;

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact RebateBoard" },
      { name: "description", content: page.description },
    ],
  }),
  component: () => <PublicInfoPage page={page} />,
});
