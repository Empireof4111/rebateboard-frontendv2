import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader, Panel, DataTable, StatCard, Pill } from "@/components/superadmin/AdminUI";
import { Modal, ConfirmDialog, Field, fieldCls, selectCls, toast } from "@/components/superadmin/AdminActions";
import { useAdminCollection, newId } from "@/lib/admin-store";
import { roles as seed, allPermissions, permissionGroups, type Role } from "@/lib/admin-data";
import { Plus, Edit3, Trash2, Users as UsersIcon } from "lucide-react";

export const Route = createFileRoute("/superadmin/roles")({
  component: RolesPage,
});

const empty = (): Role => ({ id: newId("ro"), name: "", description: "", status: "active", users: 0, created: new Date().toLocaleDateString(), permissions: [] });

function RolesPage() {
  const { items, add, update, remove } = useAdminCollection<Role>("roles", seed);
  const [editing, setEditing] = useState<Role | null>(null);
  const [deleting, setDeleting] = useState<Role | null>(null);
  const [viewingUsers, setViewingUsers] = useState<Role | null>(null);
  const assignedCount = (role: Role) => (role.assignedEmails?.filter(Boolean).length ?? role.users ?? 0);
  const totalAdmins = items.reduce((s, r) => s + assignedCount(r), 0);

  const togglePerm = (p: string) => {
    if (!editing) return;
    const has = editing.permissions.includes(p);
    setEditing({ ...editing, permissions: has ? editing.permissions.filter((x) => x !== p) : [...editing.permissions, p] });
  };

  return (
    <div>
      <PageHeader
        title="Roles & Permissions"
        subtitle="Define sub-admin roles and what each one can do across the platform."
        actions={
          <button onClick={() => setEditing(empty())} className="inline-flex items-center gap-1.5 rounded-full rb-gradient-primary px-3 py-1.5 text-xs font-semibold text-white">
            <Plus className="h-3.5 w-3.5" /> New role
          </button>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Total roles" value={String(items.length)} delta={`${items.filter((r) => r.status === "active").length} active`} tone="up" />
        <StatCard label="Admin accounts" value={String(totalAdmins)} delta="across all roles" tone="flat" />
        <StatCard label="Permissions catalog" value={String(allPermissions.length)} delta="granular controls" tone="flat" />
        <StatCard label="2FA coverage" value="100%" delta="enforced" tone="up" />
      </div>

      <Panel title={`All roles — ${items.length}`}>
        <DataTable head={<><th>Role</th><th>Description</th><th>Users</th><th>Permissions</th><th>Status</th><th>Created</th><th></th></>}>
          {items.map((r) => (
            <tr key={r.id}>
              <td className="font-semibold">{r.name || <span className="text-muted-foreground italic">unnamed</span>}</td>
              <td className="text-muted-foreground">{r.description}</td>
              <td>
                <button
                  type="button"
                  onClick={() => setViewingUsers(r)}
                  className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-1 font-mono text-xs text-white hover:bg-white/15"
                >
                  <UsersIcon className="h-3 w-3" /> {assignedCount(r)}
                </button>
              </td>
              <td className="text-xs"><Pill>{r.permissions.length} perms</Pill></td>
              <td>
                <button onClick={() => { update(r.id, { status: r.status === "active" ? "inactive" : "active" }); toast.success(`Role set to ${r.status === "active" ? "inactive" : "active"}`); }}>
                  {r.status === "active" ? <Pill tone="good">active</Pill> : <Pill tone="bad">inactive</Pill>}
                </button>
              </td>
              <td className="text-muted-foreground text-xs">{r.created}</td>
              <td className="text-right">
                <div className="flex justify-end gap-1">
                  <button onClick={() => setEditing(r)} className="rounded-md bg-white/10 px-2 py-1"><Edit3 className="h-3 w-3 text-white" /></button>
                  <button onClick={() => setDeleting(r)} className="rounded-md bg-rose-500/15 px-2 py-1 ring-1 ring-rose-400/30"><Trash2 className="h-3 w-3 text-rose-300" /></button>
                </div>
              </td>
            </tr>
          ))}
        </DataTable>
      </Panel>

      <div className="mt-6">
        <Panel title="Permission matrix preview">
          <div className="space-y-2 text-xs">
            {items.map((r) => (
              <div key={r.id} className="rounded-lg bg-white/5 p-3">
                <div className="mb-1 font-semibold text-white">{r.name}</div>
                <div className="flex flex-wrap gap-1">
                  {r.permissions.length === 0 && <span className="text-muted-foreground italic">No permissions</span>}
                  {r.permissions.map((p) => (
                    <span key={p} className="rounded-full bg-violet-500/15 px-2 py-0.5 text-[9px] font-bold text-violet-300 ring-1 ring-violet-400/30">{p}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      {editing && (
        <Modal open onClose={() => setEditing(null)} title={items.some((x) => x.id === editing.id) ? "Edit role" : "New role"} size="lg"
          footer={<>
            <button onClick={() => setEditing(null)} className="rounded-xl bg-white/10 px-4 py-2 text-xs font-bold text-white">Cancel</button>
            <button onClick={() => {
              if (!editing.name.trim()) { toast.error("Role name is required"); return; }
              const exists = items.some((x) => x.id === editing.id);
              if (exists) update(editing.id, editing); else add(editing);
              toast.success(exists ? "Role updated" : "Role created"); setEditing(null);
            }} className="rounded-xl rb-gradient-primary px-4 py-2 text-xs font-bold text-white">Save role</button>
          </>}
        >
          <div className="grid gap-3">
            <Field label="Role name"><input className={fieldCls} value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} placeholder="e.g. Finance Admin" /></Field>
            <Field label="Description"><textarea rows={2} className={fieldCls} value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} /></Field>
            <Field label="Status">
              <select className={selectCls} value={editing.status} onChange={(e) => setEditing({ ...editing, status: e.target.value as Role["status"] })}>
                <option value="active">active</option><option value="inactive">inactive</option>
              </select>
            </Field>
            <Field label="Assigned admin emails" hint="One email per line or comma separated. When that user signs in, these permissions are applied automatically.">
              <textarea
                rows={4}
                className={fieldCls}
                value={(editing.assignedEmails ?? []).join("\n")}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    assignedEmails: e.target.value
                      .split(/[\n,]+/)
                      .map((value) => value.trim().toLowerCase())
                      .filter(Boolean),
                  })
                }
                placeholder={"finance@rebateboard.com\nsupport@rebateboard.com"}
              />
            </Field>
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="block text-[10px] uppercase tracking-wider text-muted-foreground">Permissions ({editing.permissions.length}/{allPermissions.length})</label>
                <div className="flex gap-1">
                  <button type="button" onClick={() => setEditing({ ...editing, permissions: allPermissions })} className="rounded bg-white/5 px-2 py-0.5 text-[10px] text-white/80 hover:bg-white/10">All</button>
                  <button type="button" onClick={() => setEditing({ ...editing, permissions: [] })} className="rounded bg-white/5 px-2 py-0.5 text-[10px] text-white/80 hover:bg-white/10">None</button>
                </div>
              </div>
              <div className="space-y-3">
                {permissionGroups.map((g) => {
                  const groupIds = g.permissions.map((p) => p.id);
                  const checkedCount = groupIds.filter((id) => editing.permissions.includes(id)).length;
                  const allOn = checkedCount === groupIds.length;
                  return (
                    <div key={g.id} className="rounded-lg border border-white/5 bg-white/[0.02] p-2">
                      <div className="mb-1.5 flex items-center justify-between px-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-violet-300">{g.label} <span className="text-muted-foreground">· {checkedCount}/{groupIds.length}</span></span>
                        <button
                          type="button"
                          onClick={() => {
                            const next = allOn
                              ? editing.permissions.filter((p) => !groupIds.includes(p))
                              : Array.from(new Set([...editing.permissions, ...groupIds]));
                            setEditing({ ...editing, permissions: next });
                          }}
                          className="rounded bg-white/5 px-2 py-0.5 text-[9px] font-semibold text-white/80 hover:bg-white/10"
                        >
                          {allOn ? "Clear" : "Select all"}
                        </button>
                      </div>
                      <div className="grid grid-cols-1 gap-1 md:grid-cols-2">
                        {g.permissions.map((p) => (
                          <label key={p.id} className="flex items-center gap-2 rounded-md bg-white/5 px-2 py-1.5 text-xs text-white cursor-pointer hover:bg-white/10">
                            <input type="checkbox" checked={editing.permissions.includes(p.id)} onChange={() => togglePerm(p.id)} />
                            <span className="flex-1">{p.label}</span>
                            {p.route && <span className="text-[9px] text-muted-foreground font-mono">{p.route.replace("/superadmin", "")}</span>}
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </Modal>
      )}

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => { if (deleting) { remove(deleting.id); toast.success("Role deleted"); } }}
        title={`Delete role "${deleting?.name}"?`}
        message={`This will remove the role definition. ${deleting ? assignedCount(deleting) : 0} admin account(s) currently assigned will need to be reassigned.`}
        confirmText="Delete role"
      />

      {viewingUsers && (
        <Modal open onClose={() => setViewingUsers(null)} title={`${viewingUsers.name} assignments`} size="md">
          <div className="space-y-3">
            {(viewingUsers.assignedEmails ?? []).length ? (
              viewingUsers.assignedEmails!.map((email) => (
                <div key={email} className="flex items-center justify-between rounded-2xl bg-white/[0.04] px-4 py-3 ring-1 ring-white/10">
                  <div>
                    <div className="text-sm font-semibold text-white">{email}</div>
                    <div className="text-xs text-muted-foreground">Access follows this role after login or password recovery.</div>
                  </div>
                  <Pill tone={viewingUsers.status === "active" ? "good" : "bad"}>{viewingUsers.status}</Pill>
                </div>
              ))
            ) : (
              <div className="rounded-2xl bg-white/[0.04] p-4 text-sm text-muted-foreground ring-1 ring-white/10">
                No emails are assigned to this role yet. Add staff emails from Edit role.
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
