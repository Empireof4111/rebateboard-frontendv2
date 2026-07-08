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
        subtitle="Season rankings will appear as traders build enough verified activity."
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
          description="Keep logging trades and completing missions to qualify for future season rankings."
          action={<button className="rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-600 px-4 py-2 text-xs font-semibold text-white">Add Your First Trade</button>}
        />
      </Panel>
    </div>
  );
}
