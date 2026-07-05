import { createFileRoute } from "@tanstack/react-router";
import { EmptyState, PageHeader, Panel, Pill } from "@/components/dashboard/Primitives";
import { Trophy } from "lucide-react";

export const Route = createFileRoute("/dashboard/leaderboards")({
  component: LeaderboardsPage,
});

function LeaderboardsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Leaderboards"
        subtitle="Season rankings will appear once the leaderboard backend is enabled."
        actions={<Pill tone="primary"><Trophy className="h-3 w-3" />Season pending</Pill>}
      />
      <div className="flex flex-wrap gap-2">
        {["ROI", "Discipline", "Consistency", "Improvement", "Trader Score"].map((category) => (
          <button key={category} className="glass-pill rounded-full px-3 py-1.5 text-xs text-white">
            {category}
          </button>
        ))}
      </div>
      <Panel title="Rankings">
        <EmptyState
          icon={Trophy}
          title="No leaderboard data yet"
          description="Public rankings require a real leaderboard service. No synthetic trader rankings are shown."
        />
      </Panel>
    </div>
  );
}
