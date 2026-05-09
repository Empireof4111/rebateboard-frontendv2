import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel, DataTable, StatCard, StatusPill, Toolbar, Pill } from "@/components/superadmin/AdminUI";
import { inboxMessages } from "@/lib/admin-data";
import { Search, Filter, Mail, Reply, Archive, UserPlus2 } from "lucide-react";

export const Route = createFileRoute("/superadmin/inbox")({
  component: InboxPage,
});

function InboxPage() {
  const counts = {
    total: inboxMessages.length,
    new: inboxMessages.filter((m) => m.status === "new").length,
    open: inboxMessages.filter((m) => m.status === "open").length,
    closed: inboxMessages.filter((m) => m.status === "closed").length,
  };
  return (
    <div>
      <PageHeader title="Inbox" subtitle="Every message users send from the dashboard contact form." />

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Total messages" value={String(counts.total)} delta="this week" tone="flat" />
        <StatCard label="New" value={String(counts.new)} delta="awaiting triage" tone="up" />
        <StatCard label="Open" value={String(counts.open)} delta="being handled" tone="flat" />
        <StatCard label="Closed" value={String(counts.closed)} delta="resolved" tone="up" />
      </div>

      <Panel title="All messages">
        <Toolbar>
          <div className="glass flex flex-1 items-center gap-2 rounded-full px-3 py-1.5 text-xs">
            <Search className="h-3.5 w-3.5 text-muted-foreground" />
            <input placeholder="Search subject, user, email…" className="w-full bg-transparent text-white outline-none placeholder:text-muted-foreground" />
          </div>
          <button className="glass-pill inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-white"><Filter className="h-3.5 w-3.5" /> Filters</button>
        </Toolbar>
        <DataTable head={<><th>From</th><th>Subject</th><th>Type</th><th>Status</th><th>Assigned</th><th>Received</th><th></th></>}>
          {inboxMessages.map((m) => (
            <tr key={m.id}>
              <td>
                <div className="font-semibold">{m.user}</div>
                <div className="text-[10px] text-muted-foreground">{m.email}</div>
              </td>
              <td>
                <div className="font-medium">{m.subject}</div>
                <div className="line-clamp-1 text-[11px] text-muted-foreground">{m.preview}</div>
              </td>
              <td><Pill>{m.type}</Pill></td>
              <td><StatusPill status={m.status === "new" ? "open" : m.status === "open" ? "reviewing" : m.status === "replied" ? "responded" : "resolved"} /></td>
              <td className="text-muted-foreground text-xs">{m.assigned ?? "—"}</td>
              <td className="text-muted-foreground text-xs">{m.received}</td>
              <td className="text-right">
                <div className="flex justify-end gap-1">
                  <button title="Open"><Mail className="h-3.5 w-3.5 text-fuchsia-300" /></button>
                  <button title="Reply"><Reply className="h-3.5 w-3.5 text-emerald-300" /></button>
                  <button title="Assign"><UserPlus2 className="h-3.5 w-3.5 text-sky-300" /></button>
                  <button title="Close"><Archive className="h-3.5 w-3.5 text-muted-foreground" /></button>
                </div>
              </td>
            </tr>
          ))}
        </DataTable>
      </Panel>
    </div>
  );
}
