import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { PageHeader, Panel, DataTable, StatCard, Pill, Toolbar } from "@/components/superadmin/AdminUI";
import { Modal, ConfirmDialog, Field, fieldCls, selectCls, toast } from "@/components/superadmin/AdminActions";
import { subscriberApi, type Subscriber } from "@/lib/admin-api";
import { useAuth } from "@/lib/auth";
import { ApiError } from "@/lib/api";
import { Download, Mail, Plus, Trash2, Search, RefreshCw } from "lucide-react";

export const Route = createFileRoute("/superadmin/subscribers")({
  component: SubscribersPage,
});

type NewSub = { email: string; name: string; source: string };
const emptyNew = (): NewSub => ({ email: "", name: "", source: "Manual" });

function SubscribersPage() {
  const { token } = useAuth();
  const [items, setItems] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [addForm, setAddForm] = useState<NewSub | null>(null);
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState<Subscriber | null>(null);
  const [composing, setComposing] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await subscriberApi.list(token);
      if (res.payload) setItems(res.payload.page);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Failed to load subscribers");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() =>
    items.filter((s) => !q.trim() || `${s.email} ${s.name ?? ""}`.toLowerCase().includes(q.toLowerCase())),
    [items, q],
  );

  const counts = {
    total: items.length,
    active: items.filter((s) => s.status === "active").length,
    unsub: items.filter((s) => s.status === "unsubscribed").length,
    bounced: items.filter((s) => s.status === "bounced").length,
  };

  const addSubscriber = async () => {
    if (!token || !addForm) return;
    if (!addForm.email.trim()) { toast.error("Email is required"); return; }
    setAdding(true);
    try {
      const res = await subscriberApi.add(token, addForm.email.trim(), addForm.name.trim() || undefined, addForm.source);
      if (res.payload) setItems((prev) => [res.payload!, ...prev]);
      toast.success("Subscriber added");
      setAddForm(null);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Failed to add subscriber");
    } finally {
      setAdding(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setItems((prev) => prev.filter((s) => s.id !== deleting.id));
    toast.success("Subscriber removed");
    setDeleting(null);
  };

  const exportCsv = () => {
    const rows = [["email", "name", "source", "status", "subscribed"],
      ...items.map((s) => [s.email, s.name ?? "", s.source, s.status, s.subscribed])];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `subscribers-${Date.now()}.csv`;
    a.click();
    toast.success(`Exported ${items.length} subscribers`);
  };

  return (
    <div>
      <PageHeader
        title="Newsletter Subscribers"
        subtitle="Email list collected from footer, popups and blog signups."
        actions={
          <>
            <button onClick={load} className="grid h-7 w-7 place-items-center rounded-md bg-white/5 text-white ring-1 ring-white/10">
              <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
            </button>
            <button onClick={exportCsv} className="glass-pill inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-white">
              <Download className="h-3.5 w-3.5" /> Export CSV
            </button>
            <button onClick={() => setAddForm(emptyNew())} className="glass-pill inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-white">
              <Plus className="h-3.5 w-3.5" /> Add
            </button>
            <button onClick={() => setComposing(true)} className="inline-flex items-center gap-1.5 rounded-full rb-gradient-primary px-3 py-1.5 text-xs font-semibold text-white">
              <Mail className="h-3.5 w-3.5" /> Compose
            </button>
          </>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Total" value={String(counts.total)} delta="all time" tone="flat" />
        <StatCard label="Active" value={String(counts.active)} delta="receiving emails" tone="up" />
        <StatCard label="Unsubscribed" value={String(counts.unsub)} delta="opted out" tone="down" />
        <StatCard label="Bounced" value={String(counts.bounced)} delta="invalid" tone="down" />
      </div>

      <Panel title={`All subscribers — ${filtered.length}`}>
        <Toolbar>
          <div className="glass flex flex-1 items-center gap-2 rounded-full px-3 py-1.5 text-xs">
            <Search className="h-3.5 w-3.5 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search email, name…" className="w-full bg-transparent text-white outline-none placeholder:text-muted-foreground" />
          </div>
        </Toolbar>

        <DataTable head={<><th>Email</th><th>Name</th><th>Source</th><th>Status</th><th>Subscribed</th><th></th></>}>
          {loading && <tr><td colSpan={6} className="py-8 text-center text-sm text-muted-foreground">Loading…</td></tr>}
          {!loading && filtered.map((s) => (
            <tr key={s.id}>
              <td className="font-mono text-xs">{s.email}</td>
              <td>{s.name ?? "—"}</td>
              <td><Pill>{s.source}</Pill></td>
              <td>
                {s.status === "active" && <Pill tone="good">active</Pill>}
                {s.status === "unsubscribed" && <Pill tone="warn">unsubscribed</Pill>}
                {s.status === "bounced" && <Pill tone="bad">bounced</Pill>}
              </td>
              <td className="text-xs text-muted-foreground">
                {s.subscribed ? new Date(s.subscribed).toLocaleDateString() : "—"}
              </td>
              <td className="text-right">
                <button onClick={() => setDeleting(s)} className="rounded-md bg-rose-500/15 px-2 py-1">
                  <Trash2 className="h-3 w-3 text-rose-300" />
                </button>
              </td>
            </tr>
          ))}
          {!loading && filtered.length === 0 && <tr><td colSpan={6} className="py-8 text-center text-sm text-muted-foreground">No subscribers match.</td></tr>}
        </DataTable>
      </Panel>

      {addForm && (
        <Modal open onClose={() => setAddForm(null)} title="Add subscriber" size="sm"
          footer={<>
            <button onClick={() => setAddForm(null)} className="rounded-xl bg-white/10 px-4 py-2 text-xs font-bold text-white">Cancel</button>
            <button onClick={addSubscriber} disabled={adding} className="rounded-xl rb-gradient-primary px-4 py-2 text-xs font-bold text-white disabled:opacity-40">
              {adding ? "Adding…" : "Add"}
            </button>
          </>}
        >
          <div className="grid gap-3">
            <Field label="Email"><input className={fieldCls} value={addForm.email} onChange={(e) => setAddForm({ ...addForm, email: e.target.value })} /></Field>
            <Field label="Name (optional)"><input className={fieldCls} value={addForm.name} onChange={(e) => setAddForm({ ...addForm, name: e.target.value })} /></Field>
            <Field label="Source">
              <select className={selectCls} value={addForm.source} onChange={(e) => setAddForm({ ...addForm, source: e.target.value })}>
                <option>Manual</option><option>Footer</option><option>Popup</option><option>Blog</option>
              </select>
            </Field>
          </div>
        </Modal>
      )}

      {composing && (
        <Modal open onClose={() => setComposing(false)} title={`Compose to ${counts.active} active subscribers`} size="lg"
          footer={<>
            <button onClick={() => setComposing(false)} className="rounded-xl bg-white/10 px-4 py-2 text-xs font-bold text-white">Cancel</button>
            <button onClick={() => { toast.success(`Email queued for ${counts.active} subscribers`); setComposing(false); }} className="rounded-xl rb-gradient-primary px-4 py-2 text-xs font-bold text-white">Queue send</button>
          </>}
        >
          <div className="grid gap-3">
            <Field label="Subject"><input className={fieldCls} placeholder="Your weekly RebateBoard digest" /></Field>
            <Field label="Body (HTML / markdown)"><textarea rows={10} className={fieldCls} placeholder="Hi {{name}}, …" /></Field>
          </div>
        </Modal>
      )}

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        title="Remove subscriber?"
        message={`${deleting?.email} will be removed from the list.`}
        confirmText="Remove"
      />
    </div>
  );
}
