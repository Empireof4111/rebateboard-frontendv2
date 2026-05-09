import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel, DataTable, StatusPill } from "@/components/superadmin/AdminUI";
import { notifications } from "@/lib/admin-data";
import { Send } from "lucide-react";

export const Route = createFileRoute("/superadmin/notifications")({
  component: NotificationsAdmin,
});

function NotificationsAdmin() {
  return (
    <div>
      <PageHeader title="Notifications" subtitle="Broadcast to all users or targeted segments."
        actions={<button className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-600 px-3 py-1.5 text-xs font-semibold text-white"><Send className="h-3.5 w-3.5" /> New broadcast</button>}
      />
      <Panel title="Recent">
        <DataTable head={<><th>Title</th><th>Channel</th><th>Status</th><th>Reach</th><th></th></>}>
          {notifications.map((n) => (
            <tr key={n.id}>
              <td className="font-semibold">{n.title}</td>
              <td className="text-muted-foreground">{n.channel}</td>
              <td><StatusPill status={n.status} /></td>
              <td className="font-mono">{n.reach}</td>
              <td className="text-right"><button className="rounded-md bg-white/10 px-2 py-1 text-[10px] font-bold text-white">View</button></td>
            </tr>
          ))}
        </DataTable>
      </Panel>
    </div>
  );
}
