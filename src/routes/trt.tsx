import { createFileRoute } from "@tanstack/react-router";
import { PublicInfoPage, publicPages } from "@/components/PublicInfoPage";

const page = publicPages.trt;

export const Route = createFileRoute("/trt")({
  head: () => ({
    meta: [
      { title: "Trader Return Tracker | RebateBoard" },
      { name: "description", content: page.description },
    ],
  }),
  component: () => <PublicInfoPage page={page} />,
});
