import { createFileRoute } from "@tanstack/react-router";
import { BrandDashboardLayout } from "@/components/brand/BrandDashboardLayout";
import { BrandAuthProvider } from "@/lib/brand-auth";

export const Route = createFileRoute("/brand")({
  head: () => ({
    meta: [
      { title: "Brand Portal — RebateBoard" },
      { name: "description", content: "Manage your brand on RebateBoard." },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: () => (
    <BrandAuthProvider>
      <BrandDashboardLayout />
    </BrandAuthProvider>
  ),
});
