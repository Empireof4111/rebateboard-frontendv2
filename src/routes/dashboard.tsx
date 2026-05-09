import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — RebateBoard" },
      { name: "description", content: "Your trader operating system: trades, ROI, AI insights, and rewards." },
    ],
  }),
  component: DashboardLayout,
});
