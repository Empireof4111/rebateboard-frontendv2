import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel, DataTable, StatCard, StatusPill, Pill, Toolbar } from "@/components/superadmin/AdminUI";
import { transactions } from "@/lib/admin-data";
import { Search, Filter, Download } from "lucide-react";

export const Route = createFileRoute("/superadmin/transactions")({
  component: TransactionsPage,
});

function TransactionsPage() {
  const success = transactions.filter((t) => t.status === "successful");
  const totalIn = success.filter((t) => ["Cashback Credit", "Manual Credit", "RR Conversion"].includes(t.type)).reduce((s, t) => s + t.amount, 0);
  const totalOut = success.filter((t) => ["Withdrawal", "Manual Debit"].includes(t.type)).reduce((s, t) => s + t.amount, 0);

  return (
    <div>
      <PageHeader
        title="Transactions"
        subtitle="Every financial event across wallets, withdrawals, cashback, RR and adjustments."
        actions={
          <button className="glass-pill inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-white">
            <Download className="h-3.5 w-3.5" /> Export
          </button>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Total volume" value={`$${(totalIn + totalOut).toLocaleString()}`} delta="last 7 days" tone="up" />
        <StatCard label="Credits" value={`$${totalIn.toLocaleString()}`} delta="cashback + manual" tone="up" />
        <StatCard label="Debits" value={`$${totalOut.toLocaleString()}`} delta="withdrawals + adjustments" tone="flat" />
        <StatCard label="Pending" value={String(transactions.filter((t) => t.status === "pending").length)} delta="awaiting clearance" tone="flat" />
      </div>

      <Panel title="All transactions">
        <Toolbar>
          <div className="glass flex flex-1 items-center gap-2 rounded-full px-3 py-1.5 text-xs">
            <Search className="h-3.5 w-3.5 text-muted-foreground" />
            <input placeholder="Search reference, user, narration…" className="w-full bg-transparent text-white outline-none placeholder:text-muted-foreground" />
          </div>
          <select className="rounded-full bg-white/5 px-3 py-1.5 text-xs text-white ring-1 ring-white/10">
            <option>All types</option>
            <option>Cashback Credit</option>
            <option>Withdrawal</option>
            <option>Manual Credit</option>
            <option>Manual Debit</option>
            <option>RR Conversion</option>
          </select>
          <select className="rounded-full bg-white/5 px-3 py-1.5 text-xs text-white ring-1 ring-white/10">
            <option>All statuses</option>
            <option>successful</option>
            <option>pending</option>
            <option>failed</option>
            <option>reversed</option>
          </select>
          <button className="glass-pill inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-white"><Filter className="h-3.5 w-3.5" /> More</button>
        </Toolbar>
        <DataTable head={<><th>Date</th><th>Reference</th><th>User</th><th>Type</th><th>Amount</th><th>Channel</th><th>Narration</th><th>Status</th><th>By</th></>}>
          {transactions.map((t) => (
            <tr key={t.id}>
              <td className="text-muted-foreground text-xs">{t.date}</td>
              <td className="font-mono text-xs">{t.reference}</td>
              <td className="font-semibold">{t.user}</td>
              <td><Pill>{t.type}</Pill></td>
              <td className={`font-mono ${["Withdrawal", "Manual Debit"].includes(t.type) ? "text-rose-300" : "text-emerald-300"}`}>
                {["Withdrawal", "Manual Debit"].includes(t.type) ? "-" : "+"}${t.amount.toFixed(2)} {t.currency}
              </td>
              <td className="text-xs">{t.channel}</td>
              <td className="text-muted-foreground text-xs max-w-xs line-clamp-1">{t.narration}</td>
              <td>
                <StatusPill status={t.status === "successful" ? "resolved" : t.status === "pending" ? "pending" : t.status === "failed" ? "flagged" : "responded"} />
              </td>
              <td className="font-mono text-[10px] text-muted-foreground">{t.createdBy}</td>
            </tr>
          ))}
        </DataTable>
      </Panel>
    </div>
  );
}
