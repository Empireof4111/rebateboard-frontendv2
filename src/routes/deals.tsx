import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/deals")({
  head: () => ({
    meta: [
      { title: "Deals | RebateBoard" },
      {
        name: "description",
        content: "Browse RebateBoard deals inside the unified Offers marketplace.",
      },
    ],
  }),
  component: () => <Navigate to="/offers" replace />,
});
