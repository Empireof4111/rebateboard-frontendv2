import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/coupons")({
  head: () => ({
    meta: [
      { title: "Coupons | RebateBoard" },
      {
        name: "description",
        content: "Browse RebateBoard coupon codes inside the unified Offers marketplace.",
      },
    ],
  }),
  component: () => <Navigate to="/offers" replace />,
});
