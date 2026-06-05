import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader, Panel, DataTable, Toolbar, Pill } from "@/components/superadmin/AdminUI";
import { Modal, ConfirmDialog, Field, fieldCls, selectCls, toast } from "@/components/superadmin/AdminActions";
import { useAdminCollection, newId } from "@/lib/admin-store";
import { adminUsers as seed } from "@/lib/admin-data";
import { Search, UserPlus, Filter, Download, Eye, Ban, Check, Trash2 } from "lucide-react";

export const Route = createFileRoute("/superadmin/users")({
  component: UsersPage,
});

type AdminUser = { id: string; name: string; email: string; country: string; joined: string; verified: boolean; banned?: boolean };
const empty = (): AdminUser => ({ id: newId("u"), name: "", email: "", country: "🌍 —", joined: "just now", verified: false });

function UsersPage() {
  const { items, add, update, remove } = useAdminCollection<AdminUser>("users", seed as AdminUser[]);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "verified" | "pending" | "banned">("all");
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [viewing, setViewing] = useState<AdminUser | null>(null);
  const [deleting, setDeleting] = useState<AdminUser | null>(null);

  const filtered = useMemo(() => items
    .filter((u) => filter === "all" ||
      (filter === "verified" && u.verified && !u.banned) ||
      (filter === "pending" && !u.verified && !u.banned) ||
      (filter === "banned" && u.banned))
    .filter((u) => !q.trim() || `${u.name} ${u.email} ${u.id}`.toLowerCase().includes(q.toLowerCase())), [items, q, filter]);

  const exportCsv = () => {
    const rows = [["id", "name", "email", "country", "joined", "verified", "banned"], ...items.map((u) => [u.id, u.name, u.email, u.country, u.joined, String(u.verified), String(!!u.banned)])];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `users-${Date.now()}.csv`;
    a.click();
    toast.success(`Exported ${items.length} users`);
  };

  return (
    <div>
      <PageHeader
        title="Users"
        subtitle={`${items.length} total · ${items.filter((u) => u.verified).length} verified · ${items.filter((u) => u.banned).length} banned`}
        actions={
          <>
            <button onClick={exportCsv} className="glass-pill inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-white"><Download className="h-3.5 w-3.5" /> Export</button>
            <button onClick={() => setEditing(empty())} className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-600 px-3 py-1.5 text-xs font-semibold text-white"><UserPlus className="h-3.5 w-3.5" /> Invite user</button>
          </>
        }
      />

      <Panel title={`All users — ${filtered.length}`}>
        <Toolbar>
          <div className="glass flex flex-1 items-center gap-2 rounded-full px-3 py-1.5 text-xs">
            <Search className="h-3.5 w-3.5 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name, email, ID…" className="w-full bg-transparent text-white outline-none placeholder:text-muted-foreground" />
          </div>
          <select value={filter} onChange={(e) => setFilter(e.target.value as typeof filter)} className="rounded-full bg-white/5 px-3 py-1.5 text-xs text-white ring-1 ring-white/10">
            <option value="all">All</option><option value="verified">Verified</option><option value="pending">Pending KYC</option><option value="banned">Banned</option>
          </select>
          <button className="glass-pill inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-white"><Filter className="h-3.5 w-3.5" /> Filters</button>
        </Toolbar>
        <DataTable head={<><th>User</th><th>Email</th><th>Country</th><th>KYC</th><th>Joined</th><th></th></>}>
          {filtered.map((u) => (
            <tr key={u.id}>
              <td>
                <div className="flex items-center gap-2">
                  <div className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-fuchsia-500 to-violet-600 text-[10px] font-bold text-white">
                    {(u.name || "?").split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-semibold">{u.name || <span className="text-muted-foreground italic">unnamed</span>}</div>
                    <div className="font-mono text-[10px] text-muted-foreground">{u.id}</div>
                  </div>
                </div>
              </td>
              <td className="text-muted-foreground">{u.email}</td>
              <td>{u.country}</td>
              <td>
                {u.banned ? <Pill tone="bad">Banned</Pill>
                  : u.verified ? <Pill tone="good">Verified</Pill>
                  : <Pill tone="warn">Pending</Pill>}
              </td>
              <td className="text-muted-foreground">{u.joined}</td>
              <td className="text-right">
                <div className="flex justify-end gap-1">
                  <button onClick={() => setViewing(u)} title="View" className="grid h-7 w-7 place-items-center rounded-md bg-white/10 text-white"><Eye className="h-3 w-3" /></button>
                  <button
                    onClick={() => { update(u.id, { verified: !u.verified }); toast.success(u.verified ? "Set to pending KYC" : "Marked as verified"); }}
                    title={u.verified ? "Mark unverified" : "Mark verified"}
                    className="grid h-7 w-7 place-items-center rounded-md bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/30"><Check className="h-3 w-3" /></button>
                  <button
                    onClick={() => { update(u.id, { banned: !u.banned }); toast.success(u.banned ? "User unbanned" : "User banned"); }}
                    title={u.banned ? "Unban" : "Ban"}
                    className="grid h-7 w-7 place-items-center rounded-md bg-amber-500/15 text-amber-300 ring-1 ring-amber-400/30"><Ban className="h-3 w-3" /></button>
                  <button onClick={() => setDeleting(u)} title="Delete" className="grid h-7 w-7 place-items-center rounded-md bg-rose-500/15 text-rose-300 ring-1 ring-rose-400/30"><Trash2 className="h-3 w-3" /></button>
                </div>
              </td>
            </tr>
          ))}
          {filtered.length === 0 && <tr><td colSpan={6} className="py-8 text-center text-sm text-muted-foreground">No users match.</td></tr>}
        </DataTable>
      </Panel>

      {editing && (
        <Modal open onClose={() => setEditing(null)} title={items.some((x) => x.id === editing.id) ? "Edit user" : "Invite user"} size="md"
          footer={<>
            <button onClick={() => setEditing(null)} className="rounded-xl bg-white/10 px-4 py-2 text-xs font-bold text-white">Cancel</button>
            <button onClick={() => {
              if (!editing.email.trim()) { toast.error("Email is required"); return; }
              const exists = items.some((x) => x.id === editing.id);
              if (exists) update(editing.id, editing); else add(editing);
              toast.success(exists ? "User updated" : "Invitation sent"); setEditing(null);
            }} className="rounded-xl bg-gradient-to-r from-fuchsia-500 to-violet-600 px-4 py-2 text-xs font-bold text-white">Save</button>
          </>}
        >
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Full name" span={2}><input className={fieldCls} value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></Field>
            <Field label="Email" span={2}><input className={fieldCls} value={editing.email} onChange={(e) => setEditing({ ...editing, email: e.target.value })} /></Field>
            <Field label="Country"><input className={fieldCls} value={editing.country} onChange={(e) => setEditing({ ...editing, country: e.target.value })} /></Field>
            <Field label="KYC verified">
              <select className={selectCls} value={String(editing.verified)} onChange={(e) => setEditing({ ...editing, verified: e.target.value === "true" })}>
                <option value="false">Pending</option><option value="true">Verified</option>
              </select>
            </Field>
          </div>
        </Modal>
      )}

      {viewing && (
        <Modal open onClose={() => setViewing(null)} title={viewing.name || viewing.email} subtitle={viewing.id} size="md">
          <dl className="grid gap-2 text-sm">
            <div className="flex justify-between"><dt className="text-muted-foreground">Email</dt><dd className="text-white">{viewing.email}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Country</dt><dd className="text-white">{viewing.country}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Joined</dt><dd className="text-white">{viewing.joined}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">KYC</dt><dd>{viewing.verified ? <Pill tone="good">Verified</Pill> : <Pill tone="warn">Pending</Pill>}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Status</dt><dd>{viewing.banned ? <Pill tone="bad">Banned</Pill> : <Pill tone="good">Active</Pill>}</dd></div>
          </dl>
          <div className="mt-4 flex justify-end gap-2">
            <button onClick={() => { setEditing(viewing); setViewing(null); }} className="rounded-xl bg-white/10 px-3 py-1.5 text-xs font-bold text-white">Edit</button>
          </div>
        </Modal>
      )}

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => { if (deleting) { remove(deleting.id); toast.success("User deleted"); } }}
        title="Delete user?"
        message={`${deleting?.name || deleting?.email} will be removed. This cannot be undone.`}
        confirmText="Delete user"
      />
    </div>
  );
}
