import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/bonuses")({
  head: () => ({
    meta: [
      { title: "Bonuses | RebateBoard" },
      {
        name: "description",
        content: "Browse RebateBoard bonuses inside the unified Offers marketplace.",
      },
    ],
  }),
  component: () => <Navigate to="/offers" replace />,
});
