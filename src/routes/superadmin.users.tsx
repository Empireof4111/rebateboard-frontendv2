import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { PageHeader, Panel, DataTable, Toolbar, Pill, StatCard } from "@/components/superadmin/AdminUI";
import { Modal, ConfirmDialog, Field, fieldCls, toast } from "@/components/superadmin/AdminActions";
import { userAdminApi, type AdminUser } from "@/lib/admin-api";
import { useAuth } from "@/lib/auth";
import { ApiError } from "@/lib/api";
import { Search, Filter, Download, Eye, Ban, Trash2, RefreshCw } from "lucide-react";

export const Route = createFileRoute("/superadmin/users")({
  component: UsersPage,
});

function UsersPage() {
  const { token } = useAuth();
  const [items, setItems] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "verified" | "pending" | "banned">("all");
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    verifiedUsers: 0,
    pendingUsers: 0,
    suspendedUsers: 0,
    adminUsers: 0,
  });
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [saving, setSaving] = useState(false);
  const [viewing, setViewing] = useState<AdminUser | null>(null);
  const [deleting, setDeleting] = useState<AdminUser | null>(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const apiFilter = useMemo(() => {
    if (filter === "verified") return { verified: 1 };
    if (filter === "pending") return { verified: 0 };
    if (filter === "banned") return { status: "SUSPENDED" };
    return undefined;
  }, [filter]);

  const load = useCallback(async (nextPage = 0) => {
    if (!token) return;
    setLoading(true);
    try {
      const response = q.trim()
        ? await userAdminApi.search(token, q, nextPage, 50, apiFilter)
        : await userAdminApi.list(token, nextPage, 50, apiFilter);

      if (response.payload) {
        setItems(nextPage === 0 ? response.payload.page : (prev) => [...prev, ...response.payload!.page]);
        setTotalPages(response.payload.totalPages);
        setPage(nextPage);
        if (response.payload.stats) setStats(response.payload.stats);
      }
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [token, q, apiFilter]);

  useEffect(() => {
    void load(0);
  }, [token, filter]); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = useMemo(() => items.filter((user) =>
    filter === "all" ||
    (filter === "verified" && user.verified && !user.banned) ||
    (filter === "pending" && !user.verified && !user.banned) ||
    (filter === "banned" && user.banned)
  ), [items, filter]);

  const updateUser = async (user: AdminUser, patch: Partial<AdminUser>) => {
    if (!token) return;
    try {
      if (patch.banned !== undefined) {
        const status = patch.banned ? "SUSPENDED" : "ACTIVE";
        const response = await userAdminApi.updateStatus(token, user.id, status);
        if (response.payload) {
          setItems((prev) => prev.map((item) => item.id === user.id ? response.payload! : item));
          void load(0);
        }
        toast.success(patch.banned ? "User suspended" : "User unsuspended");
      } else if (patch.name || patch.email || patch.country) {
        const response = await userAdminApi.update(token, user.id, { ...user, ...patch });
        if (response.payload) setItems((prev) => prev.map((item) => item.id === user.id ? response.payload! : item));
        toast.success("User updated");
      }
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Update failed");
    }
  };

  const saveEdit = async () => {
    if (!token || !editing) return;
    setSaving(true);
    try {
      const response = await userAdminApi.update(token, editing.id, editing);
      if (response.payload) setItems((prev) => prev.map((user) => user.id === editing.id ? response.payload! : user));
      toast.success("User updated");
      setEditing(null);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Update failed");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!token || !deleting) return;
    try {
      await userAdminApi.remove(token, deleting.id);
      setItems((prev) => prev.filter((user) => user.id !== deleting.id));
      void load(0);
      toast.success("User deleted");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Delete failed");
    } finally {
      setDeleting(null);
    }
  };

  const exportCsv = () => {
    const rows = [["id", "name", "email", "country", "joined", "verified", "banned"],
      ...items.map((user) => [user.id, user.name, user.email, user.country, user.joined, String(user.verified), String(user.banned)])];
    const csv = rows.map((row) => row.map((column) => `"${String(column).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const anchor = document.createElement("a");
    anchor.href = URL.createObjectURL(blob);
    anchor.download = `users-${Date.now()}.csv`;
    anchor.click();
    toast.success(`Exported ${items.length} users`);
  };

  return (
    <div>
      <PageHeader
        title="Users"
        subtitle={`${stats.totalUsers.toLocaleString()} users | ${stats.verifiedUsers.toLocaleString()} verified | ${stats.suspendedUsers.toLocaleString()} suspended`}
        actions={
          <>
            <button onClick={() => void load(0)} className="grid h-7 w-7 place-items-center rounded-md bg-white/5 text-white ring-1 ring-white/10">
              <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
            </button>
            <button onClick={exportCsv} className="glass-pill inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-white">
              <Download className="h-3.5 w-3.5" /> Export
            </button>
          </>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-6">
        <StatCard label="Total Users" value={stats.totalUsers.toLocaleString()} />
        <StatCard label="Active Users" value={stats.activeUsers.toLocaleString()} tone="up" />
        <StatCard label="Verified" value={stats.verifiedUsers.toLocaleString()} tone="up" />
        <StatCard label="Pending" value={stats.pendingUsers.toLocaleString()} />
        <StatCard label="Suspended" value={stats.suspendedUsers.toLocaleString()} tone="down" />
        <StatCard label="Admins" value={stats.adminUsers.toLocaleString()} />
      </div>

      <Panel title={`All users - ${q.trim() ? filtered.length : (stats.totalUsers || filtered.length)}`}>
        <Toolbar>
          <div className="glass flex flex-1 items-center gap-2 rounded-full px-3 py-1.5 text-xs">
            <Search className="h-3.5 w-3.5 text-muted-foreground" />
            <input
              value={q}
              onChange={(event) => setQ(event.target.value)}
              onKeyDown={(event) => event.key === "Enter" && void load(0)}
              placeholder="Search by name, email, ID... (Enter to search)"
              className="w-full bg-transparent text-white outline-none placeholder:text-muted-foreground"
            />
          </div>
          <select value={filter} onChange={(event) => setFilter(event.target.value as typeof filter)} className="rounded-full bg-white/5 px-3 py-1.5 text-xs text-white ring-1 ring-white/10">
            <option value="all">All</option>
            <option value="verified">Verified</option>
            <option value="pending">Pending KYC</option>
            <option value="banned">Suspended</option>
          </select>
          <button className="glass-pill inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-white">
            <Filter className="h-3.5 w-3.5" /> Filters
          </button>
        </Toolbar>

        <DataTable head={<><th>User</th><th>Email</th><th>Country</th><th>KYC</th><th>Joined</th><th></th></>}>
          {loading && items.length === 0 && <tr><td colSpan={6} className="py-8 text-center text-sm text-muted-foreground">Loading...</td></tr>}
          {filtered.map((user) => (
            <tr key={user.id}>
              <td>
                <div className="flex items-center gap-2">
                  <div className="grid h-8 w-8 place-items-center rounded-full rb-gradient-primary text-[10px] font-bold text-white">
                    {(user.name || "?").split(" ").map((name) => name[0]).join("").slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-semibold">{user.name || <span className="italic text-muted-foreground">unnamed</span>}</div>
                    <div className="font-mono text-[10px] text-muted-foreground">#{user.id}</div>
                  </div>
                </div>
              </td>
              <td className="text-muted-foreground">{user.email}</td>
              <td>{user.country}</td>
              <td>
                {user.banned ? <Pill tone="bad">Suspended</Pill>
                  : user.verified ? <Pill tone="good">Verified</Pill>
                  : <Pill tone="warn">Pending</Pill>}
              </td>
              <td className="text-muted-foreground">{user.joined ? new Date(user.joined).toLocaleDateString() : "-"}</td>
              <td className="text-right">
                <div className="flex justify-end gap-1">
                  <button onClick={() => setViewing(user)} title="View" className="grid h-7 w-7 place-items-center rounded-md bg-white/10 text-white"><Eye className="h-3 w-3" /></button>
                  <button
                    onClick={() => { void updateUser(user, { banned: !user.banned }); }}
                    title={user.banned ? "Unsuspend" : "Suspend"}
                    className={user.banned
                      ? "grid h-7 w-7 place-items-center rounded-md bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/30"
                      : "grid h-7 w-7 place-items-center rounded-md bg-violet-500/15 text-violet-200 ring-1 ring-violet-400/30"}
                  >
                    <Ban className="h-3 w-3" />
                  </button>
                  <button onClick={() => setDeleting(user)} title="Delete" className="grid h-7 w-7 place-items-center rounded-md bg-rose-500/15 text-rose-300 ring-1 ring-rose-400/30"><Trash2 className="h-3 w-3" /></button>
                </div>
              </td>
            </tr>
          ))}
          {!loading && filtered.length === 0 && <tr><td colSpan={6} className="py-8 text-center text-sm text-muted-foreground">No users match.</td></tr>}
        </DataTable>

        {totalPages > 1 && page < totalPages - 1 && (
          <div className="mt-4 flex justify-center">
            <button onClick={() => void load(page + 1)} disabled={loading} className="rounded-full bg-white/10 px-4 py-1.5 text-xs text-white disabled:opacity-40">
              {loading ? "Loading..." : "Load more"}
            </button>
          </div>
        )}
      </Panel>

      {editing && (
        <Modal
          open
          onClose={() => setEditing(null)}
          title="Edit user"
          size="md"
          footer={<>
            <button onClick={() => setEditing(null)} className="rounded-xl bg-white/10 px-4 py-2 text-xs font-bold text-white">Cancel</button>
            <button onClick={() => void saveEdit()} disabled={saving} className="rounded-xl rb-gradient-primary px-4 py-2 text-xs font-bold text-white disabled:opacity-40">{saving ? "Saving..." : "Save"}</button>
          </>}
        >
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Full name" span={2}><input className={fieldCls} value={editing.name} onChange={(event) => setEditing({ ...editing, name: event.target.value })} /></Field>
            <Field label="Email" span={2}><input className={fieldCls} value={editing.email} onChange={(event) => setEditing({ ...editing, email: event.target.value })} /></Field>
            <Field label="Country"><input className={fieldCls} value={editing.country} onChange={(event) => setEditing({ ...editing, country: event.target.value })} /></Field>
          </div>
        </Modal>
      )}

      {viewing && (
        <Modal open onClose={() => setViewing(null)} title={viewing.name || viewing.email} subtitle={`#${viewing.id}`} size="md">
          <dl className="grid gap-2 text-sm">
            <div className="flex justify-between"><dt className="text-muted-foreground">Email</dt><dd className="text-white">{viewing.email}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Country</dt><dd className="text-white">{viewing.country}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Joined</dt><dd className="text-white">{viewing.joined ? new Date(viewing.joined).toLocaleDateString() : "-"}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">KYC</dt><dd>{viewing.verified ? <Pill tone="good">Verified</Pill> : <Pill tone="warn">Pending</Pill>}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Status</dt><dd>{viewing.banned ? <Pill tone="bad">Suspended</Pill> : <Pill tone="good">Active</Pill>}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Role</dt><dd className="text-white">{viewing.role}</dd></div>
          </dl>
          <div className="mt-4 flex justify-end gap-2">
            <button onClick={() => { setEditing(viewing); setViewing(null); }} className="rounded-xl bg-white/10 px-3 py-1.5 text-xs font-bold text-white">Edit</button>
          </div>
        </Modal>
      )}

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => void confirmDelete()}
        title="Delete user?"
        message={`${deleting?.name || deleting?.email} will be permanently removed. This cannot be undone.`}
        confirmText="Delete user"
      />
    </div>
  );
}
