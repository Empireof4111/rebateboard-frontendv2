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
          description="Community posts will appear here after the discussion backend is enabled and users start posting."
        />
      </Panel>
    </div>
  );
}
