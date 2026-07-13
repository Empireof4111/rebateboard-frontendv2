import { createFileRoute } from "@tanstack/react-router";
import { EconomicCalendarExperience } from "@/routes/economic-calendar";

export const Route = createFileRoute("/dashboard/economic-calendar")({
  head: () => ({
    meta: [
      { title: "Economic Calendar — RebateBoard Dashboard" },
      { name: "description", content: "Macro events, AI insights and session intelligence inside your trading dashboard." },
    ],
  }),
  component: () => <EconomicCalendarExperience embedded />,
});
