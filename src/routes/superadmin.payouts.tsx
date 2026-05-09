import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel, DataTable, StatusPill, StatCard } from "@/components/superadmin/AdminUI";
import { recentPayouts } from "@/lib/admin-data";

export const Route = createFileRoute("/superadmin/payouts")({
  component: PayoutsPage,
});

function PayoutsPage() {
  return (
    <div>
      <PageHeader title="Payouts" subtitle="On-chain verified payouts across all firms." />

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Volume 30d" value="$8.2M" delta="+14%" tone="up" />
        <StatCard label="Verified count" value="2,184" delta="+318" tone="up" />
        <StatCard label="Avg speed" value="3.4h" delta="-0.6h" tone="up" />
        <StatCard label="Flagged" value="12" delta="needs review" tone="down" />
      </div>

      <Panel title="Recent payouts">
        <DataTable head={<><th>TX</th><th>Brand</th><th>User</th><th>Amount</th><th>Chain</th><th>Speed</th><th>Status</th><th>Time</th></>}>
          {recentPayouts.concat(recentPayouts, recentPayouts).map((p, i) => (
            <tr key={`${p.id}-${i}`}>
              <td className="font-mono text-xs text-muted-foreground">{p.id}</td>
              <td className="font-semibold">{p.brand}</td>
              <td className="font-mono text-xs">{p.user}</td>
              <td className="font-mono">${p.amount.toLocaleString()}</td>
              <td>{p.chain}</td>
              <td>{p.speed}</td>
              <td><StatusPill status={p.status} /></td>
              <td className="text-xs text-muted-foreground">{p.time}</td>
            </tr>
          ))}
        </DataTable>
      </Panel>
    </div>
  );
}
