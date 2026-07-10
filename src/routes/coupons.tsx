import { createFileRoute } from "@tanstack/react-router";
import { PublicInfoPage, publicPages } from "@/components/PublicInfoPage";

const page = publicPages.coupons;

export const Route = createFileRoute("/coupons")({
  head: () => ({
    meta: [
      { title: "Coupons | RebateBoard" },
      { name: "description", content: page.description },
    ],
  }),
  component: () => <PublicInfoPage page={page} />,
});
