import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { EconomicCalendar } from "@/components/economic-calendar/EconomicCalendar";

export const Route = createFileRoute("/economic-calendar")({
  head: () => ({
    meta: [
      { title: "Economic Calendar — RebateBoard" },
      { name: "description", content: "Real-time economic events with AI insight, volatility scoring, session intelligence and post-release reactions." },
      { property: "og:title", content: "Economic Calendar — RebateBoard" },
      { property: "og:description", content: "Not just events — what they mean and what to do. Built for traders." },
    ],
  }),
  component: PublicEconomicCalendar,
});

function PublicEconomicCalendar() {
  return (
    <div className="min-h-screen bg-[#0a0418] text-white">
      <SiteHeader />
      <EconomicCalendar />
    <SiteFooter />
    </div>
  );
}
