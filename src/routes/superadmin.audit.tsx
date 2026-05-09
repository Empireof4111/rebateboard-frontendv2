import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel, DataTable } from "@/components/superadmin/AdminUI";
import { auditLog } from "@/lib/admin-data";

export const Route = createFileRoute("/superadmin/audit")({
  component: AuditPage,
});

function AuditPage() {
  return (
    <div>
      <PageHeader title="Audit Log" subtitle="Every privileged action, immutable and time-stamped." />
      <Panel title="Recent events">
        <DataTable head={<><th>ID</th><th>Actor</th><th>Action</th><th>Target</th><th>Time</th></>}>
          {auditLog.concat(auditLog).map((a, i) => (
            <tr key={`${a.id}-${i}`}>
              <td className="font-mono text-xs text-muted-foreground">{a.id}</td>
              <td className="font-mono text-xs">{a.actor}</td>
              <td>{a.action}</td>
              <td className="text-muted-foreground">{a.target}</td>
              <td className="text-xs text-muted-foreground">{a.time}</td>
            </tr>
          ))}
        </DataTable>
      </Panel>
    </div>
  );
}
