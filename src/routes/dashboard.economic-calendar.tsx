import { createFileRoute } from "@tanstack/react-router";
import { EconomicCalendar } from "@/components/economic-calendar/EconomicCalendar";

export const Route = createFileRoute("/dashboard/economic-calendar")({
  head: () => ({
    meta: [
      { title: "Economic Calendar — RebateBoard Dashboard" },
      { name: "description", content: "Macro events, AI insights and session intelligence inside your trading dashboard." },
    ],
  }),
  component: () => <EconomicCalendar embedded />,
});
