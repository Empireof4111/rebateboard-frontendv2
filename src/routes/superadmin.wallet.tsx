import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel, DataTable, StatCard } from "@/components/superadmin/AdminUI";
import { walletLedger } from "@/lib/admin-data";

export const Route = createFileRoute("/superadmin/wallet")({
  component: WalletAdmin,
});

function WalletAdmin() {
  return (
    <div>
      <PageHeader title="Wallet Ledger" subtitle="Every RR movement, fully auditable." />
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Total minted" value="14.8M RR" delta="+12K today" tone="up" />
        <StatCard label="Total burned" value="2.4M RR" delta="+8K today" tone="up" />
        <StatCard label="Net float" value="12.4M RR" delta="+4K" tone="up" />
        <StatCard label="USD value" value="$248K" delta="@ $0.02/RR" tone="flat" />
      </div>
      <Panel title="Latest entries">
        <DataTable head={<><th>TX</th><th>User</th><th>Type</th><th>Amount</th><th>Balance</th><th>Time</th></>}>
          {walletLedger.concat(walletLedger).map((t, i) => (
            <tr key={`${t.id}-${i}`}>
              <td className="font-mono text-xs text-muted-foreground">{t.id}</td>
              <td className="font-mono">{t.user}</td>
              <td>{t.type}</td>
              <td className={`font-mono font-bold ${t.amount.startsWith("+") ? "text-emerald-300" : "text-rose-300"}`}>{t.amount}</td>
              <td className="font-mono">{t.balance}</td>
              <td className="text-xs text-muted-foreground">{t.time}</td>
            </tr>
          ))}
        </DataTable>
      </Panel>
    </div>
  );
}
