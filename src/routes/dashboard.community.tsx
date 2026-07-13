import { createFileRoute } from "@tanstack/react-router";
import { EmptyState, PageHeader, Panel } from "@/components/dashboard/Primitives";
import { MessageCircle } from "lucide-react";

export const Route = createFileRoute("/dashboard/community")({
  component: CommunityPage,
});

function CommunityPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Community" subtitle="Discuss strategies, share setups, and get answers from other traders." />
      <Panel title="Latest Discussions">
        <EmptyState
          icon={MessageCircle}
          title="No community discussions yet"
          description="Start a discussion when you want feedback on a setup, journal habit, or trading plan."
          action={<button className="rounded-full rb-gradient-primary px-4 py-2 text-xs font-semibold text-white">Start a Discussion</button>}
        />
      </Panel>
    </div>
  );
}
