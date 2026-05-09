import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel, DataTable, StatusPill, StatCard } from "@/components/superadmin/AdminUI";
import { disputes } from "@/lib/admin-data";

export const Route = createFileRoute("/superadmin/disputes")({
  component: DisputesAdmin,
});

function DisputesAdmin() {
  return (
    <div>
      <PageHeader title="Disputes" subtitle="Refund requests, chargebacks and escalated complaints." />
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Open" value="12" delta="3 escalated" tone="down" />
        <StatCard label="Resolved 30d" value="48" delta="+8" tone="up" />
        <StatCard label="Disputed amount" value="$24,820" delta="-12%" tone="down" />
        <StatCard label="Avg time to resolve" value="2.4d" delta="-0.6d" tone="up" />
      </div>
      <Panel title="All disputes">
        <DataTable head={<><th>ID</th><th>User</th><th>Brand</th><th>Amount</th><th>Reason</th><th>Status</th><th>Time</th><th></th></>}>
          {disputes.map((d) => (
            <tr key={d.id}>
              <td className="font-mono text-xs text-muted-foreground">{d.id}</td>
              <td className="font-mono">{d.user}</td>
              <td className="font-semibold">{d.brand}</td>
              <td className="font-mono">{d.amount}</td>
              <td className="text-muted-foreground">{d.reason}</td>
              <td><StatusPill status={d.status} /></td>
              <td className="text-xs text-muted-foreground">{d.time}</td>
              <td className="text-right"><button className="rounded-md bg-white/10 px-2 py-1 text-[10px] font-bold text-white">Open</button></td>
            </tr>
          ))}
        </DataTable>
      </Panel>
    </div>
  );
}
