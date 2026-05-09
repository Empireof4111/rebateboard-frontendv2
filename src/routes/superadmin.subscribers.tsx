import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader, Panel, DataTable, StatCard, Pill, Toolbar } from "@/components/superadmin/AdminUI";
import { Modal, ConfirmDialog, Field, fieldCls, toast } from "@/components/superadmin/AdminActions";
import { useAdminCollection, newId } from "@/lib/admin-store";
import { subscribers as seed, type Subscriber } from "@/lib/admin-data";
import { Download, Mail, Plus, Trash2, Search } from "lucide-react";

export const Route = createFileRoute("/superadmin/subscribers")({
  component: SubscribersPage,
});

const empty = (): Subscriber => ({ id: newId("sub"), email: "", name: "", source: "Manual", status: "active", subscribed: "just now" });

function SubscribersPage() {
  const { items, add, update, remove } = useAdminCollection<Subscriber>("subscribers", seed);
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<Subscriber | null>(null);
  const [deleting, setDeleting] = useState<Subscriber | null>(null);
  const [composing, setComposing] = useState(false);

  const filtered = useMemo(() => items.filter((s) => !q.trim() || `${s.email} ${s.name ?? ""}`.toLowerCase().includes(q.toLowerCase())), [items, q]);

  const counts = {
    total: items.length,
    active: items.filter((s) => s.status === "active").length,
    unsub: items.filter((s) => s.status === "unsubscribed").length,
    bounced: items.filter((s) => s.status === "bounced").length,
  };

  const exportCsv = () => {
    const rows = [["email", "name", "source", "status", "subscribed"], ...items.map((s) => [s.email, s.name ?? "", s.source, s.status, s.subscribed])];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `subscribers-${Date.now()}.csv`; a.click();
    toast.success(`Exported ${items.length} subscribers`);
  };

  return (
    <div>
      <PageHeader
        title="Newsletter Subscribers"
        subtitle="Email list collected from footer, popups and blog signups."
        actions={
          <>
            <button onClick={exportCsv} className="glass-pill inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-white"><Download className="h-3.5 w-3.5" /> Export CSV</button>
            <button onClick={() => setEditing(empty())} className="glass-pill inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-white"><Plus className="h-3.5 w-3.5" /> Add</button>
            <button onClick={() => setComposing(true)} className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-600 px-3 py-1.5 text-xs font-semibold text-white"><Mail className="h-3.5 w-3.5" /> Compose</button>
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
          {filtered.map((s) => (
            <tr key={s.id}>
              <td className="font-mono text-xs">{s.email}</td>
              <td>{s.name ?? "—"}</td>
              <td><Pill>{s.source}</Pill></td>
              <td>
                <button onClick={() => {
                  const next: Subscriber["status"] = s.status === "active" ? "unsubscribed" : "active";
                  update(s.id, { status: next }); toast.success(`Set to ${next}`);
                }}>
                  {s.status === "active" && <Pill tone="good">active</Pill>}
                  {s.status === "unsubscribed" && <Pill tone="warn">unsubscribed</Pill>}
                  {s.status === "bounced" && <Pill tone="bad">bounced</Pill>}
                </button>
              </td>
              <td className="text-muted-foreground text-xs">{s.subscribed}</td>
              <td className="text-right">
                <button onClick={() => setDeleting(s)} className="rounded-md bg-rose-500/15 px-2 py-1"><Trash2 className="h-3 w-3 text-rose-300" /></button>
              </td>
            </tr>
          ))}
          {filtered.length === 0 && <tr><td colSpan={6} className="py-8 text-center text-sm text-muted-foreground">No subscribers match.</td></tr>}
        </DataTable>
      </Panel>

      {editing && (
        <Modal open onClose={() => setEditing(null)} title="Add subscriber" size="sm"
          footer={<>
            <button onClick={() => setEditing(null)} className="rounded-xl bg-white/10 px-4 py-2 text-xs font-bold text-white">Cancel</button>
            <button onClick={() => {
              if (!editing.email.trim()) { toast.error("Email is required"); return; }
              add(editing); toast.success("Subscriber added"); setEditing(null);
            }} className="rounded-xl bg-gradient-to-r from-fuchsia-500 to-violet-600 px-4 py-2 text-xs font-bold text-white">Add</button>
          </>}
        >
          <div className="grid gap-3">
            <Field label="Email"><input className={fieldCls} value={editing.email} onChange={(e) => setEditing({ ...editing, email: e.target.value })} /></Field>
            <Field label="Name (optional)"><input className={fieldCls} value={editing.name ?? ""} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></Field>
            <Field label="Source">
              <select className={fieldCls} value={editing.source} onChange={(e) => setEditing({ ...editing, source: e.target.value as Subscriber["source"] })}>
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
            <button onClick={() => { toast.success(`Email queued for ${counts.active} subscribers`); setComposing(false); }} className="rounded-xl bg-gradient-to-r from-fuchsia-500 to-violet-600 px-4 py-2 text-xs font-bold text-white">Queue send</button>
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
        onConfirm={() => { if (deleting) { remove(deleting.id); toast.success("Subscriber removed"); } }}
        title="Remove subscriber?"
        message={`${deleting?.email} will be removed from the list (GDPR compliant).`}
        confirmText="Remove"
      />
    </div>
  );
}
