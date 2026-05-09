import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { PageHeader, Panel, StatCard, Pill } from "@/components/dashboard/Primitives";
import { Share2 } from "lucide-react";

export const Route = createFileRoute("/dashboard/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const { user } = useAuth();
  if (!user) return null;
  return (
    <div className="space-y-6">
      <PageHeader title="Profile" subtitle="Your trading identity, stats, and history." actions={
        <button className="glass-pill inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-white"><Share2 className="h-3.5 w-3.5" />Share Card</button>
      } />

      <Panel title="Identity">
        <div className="flex items-center gap-4">
          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-violet-400 to-fuchsia-600 text-lg font-bold text-white">
            {user.name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="text-xl font-bold text-white">{user.name}</div>
            <div className="text-xs text-muted-foreground">{user.email}</div>
            <div className="mt-1 flex gap-2"><Pill tone="primary">Silver Tier</Pill><Pill tone="success">Verified</Pill></div>
          </div>
        </div>
      </Panel>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Trader Score" value="7.4" accent="primary" />
        <StatCard label="True ROI" value="+194%" accent="success" />
        <StatCard label="Trades" value="412" />
        <StatCard label="Reviews" value="18" />
      </div>

      <Panel title="Achievements">
        <div className="flex flex-wrap gap-2">
          {["30-day streak", "First payout", "Verified reviewer", "Top 20% ROI", "Risk disciplined"].map((a) => (
            <Pill key={a} tone="warning">{a}</Pill>
          ))}
        </div>
      </Panel>
    </div>
  );
}
