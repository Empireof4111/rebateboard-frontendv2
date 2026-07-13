import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel } from "@/components/superadmin/AdminUI";
import { leaderboardSettings } from "@/lib/admin-data";

export const Route = createFileRoute("/superadmin/leaderboards")({
  component: LeaderboardsAdmin,
});

function LeaderboardsAdmin() {
  return (
    <div>
      <PageHeader title="Leaderboards" subtitle="Tune trader ranking weights and seasons." />
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Ranking weights">
          <ul className="space-y-4">
            {leaderboardSettings.map((s) => (
              <li key={s.metric}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="text-white">{s.metric}</span>
                  <span className="font-mono text-muted-foreground">{s.weight}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/5">
                  <div className="h-full rb-gradient-primary" style={{ width: `${s.weight * 2.5}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title="Current season">
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between"><span className="text-muted-foreground">Name</span><span className="text-white">Spring 2026</span></div>
            <div className="flex items-center justify-between"><span className="text-muted-foreground">Started</span><span className="text-white">Apr 1, 2026</span></div>
            <div className="flex items-center justify-between"><span className="text-muted-foreground">Ends</span><span className="text-white">Jun 30, 2026</span></div>
            <div className="flex items-center justify-between"><span className="text-muted-foreground">Prize pool</span><span className="font-mono font-bold text-emerald-300">$50,000</span></div>
            <div className="flex items-center justify-between"><span className="text-muted-foreground">Participants</span><span className="font-mono text-white">12,418</span></div>
            <button className="mt-3 w-full rounded-xl rb-gradient-primary py-2 text-xs font-bold text-white">End season early</button>
          </div>
        </Panel>
      </div>
    </div>
  );
}
