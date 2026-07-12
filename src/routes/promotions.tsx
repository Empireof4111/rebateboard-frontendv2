import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/promotions")({
  head: () => ({
    meta: [
      { title: "Promotions | RebateBoard" },
      {
        name: "description",
        content: "Browse RebateBoard promotions inside the unified Offers marketplace.",
      },
    ],
  }),
  component: () => <Navigate to="/offers" replace />,
});
