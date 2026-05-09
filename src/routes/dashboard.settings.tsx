import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel } from "@/components/dashboard/Primitives";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/dashboard/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { user, logout } = useAuth();
  return (
    <div className="space-y-6">
      <PageHeader title="Settings" subtitle="Account, notifications, and privacy." />

      <Panel title="Account">
        <div className="space-y-3 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">Name</span><span className="text-white">{user?.name}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Email</span><span className="text-white">{user?.email}</span></div>
        </div>
      </Panel>

      <Panel title="Notifications">
        <ul className="space-y-3 text-sm text-white">
          {["AI alerts", "Risk warnings", "RR rewards", "Review activity", "System updates"].map((n) => (
            <li key={n} className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2">
              <span>{n}</span>
              <input type="checkbox" defaultChecked className="h-4 w-4 accent-violet-500" />
            </li>
          ))}
        </ul>
      </Panel>

      <Panel title="Privacy">
        <ul className="space-y-3 text-sm text-white">
          <li className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2"><span>Show on leaderboards</span><input type="checkbox" defaultChecked className="h-4 w-4 accent-violet-500" /></li>
          <li className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2"><span>Public profile</span><input type="checkbox" className="h-4 w-4 accent-violet-500" /></li>
        </ul>
      </Panel>

      <button onClick={logout} className="rounded-xl bg-destructive/20 px-4 py-2 text-sm font-semibold text-destructive hover:bg-destructive/30">Log out</button>
    </div>
  );
}
