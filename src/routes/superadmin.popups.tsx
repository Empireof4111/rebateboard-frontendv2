import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader, Panel, DataTable, StatusPill, Pill, StatCard } from "@/components/superadmin/AdminUI";
import { Modal, ConfirmDialog, Field, fieldCls, selectCls, ThumbnailUploader, toast } from "@/components/superadmin/AdminActions";
import { useAdminCollection, newId } from "@/lib/admin-store";
import { popups as seed, type Popup } from "@/lib/admin-data";
import { Plus, Edit3, Trash2 } from "lucide-react";

export const Route = createFileRoute("/superadmin/popups")({
  component: PopupsPage,
});

type PopupX = Popup & { thumbnail?: string };
const empty = (): PopupX => ({
  id: newId("pu"), title: "", message: "", cta: "Learn more", link: "/",
  trigger: "On load", audience: "All", start: "—", end: "—",
  status: "draft", views: 0, clicks: 0, thumbnail: "",
});

function PopupsPage() {
  const { items, add, update, remove } = useAdminCollection<PopupX>("popups", seed as PopupX[]);
  const [editing, setEditing] = useState<PopupX | null>(null);
  const [deleting, setDeleting] = useState<PopupX | null>(null);
  const totalViews = items.reduce((s, p) => s + p.views, 0);
  const totalClicks = items.reduce((s, p) => s + p.clicks, 0);

  return (
    <div>
      <PageHeader
        title="Pop-ups"
        subtitle="Modal pop-ups triggered on the public site & dashboard."
        actions={
          <button onClick={() => setEditing(empty())} className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-600 px-3 py-1.5 text-xs font-semibold text-white">
            <Plus className="h-3.5 w-3.5" /> New pop-up
          </button>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Active pop-ups" value={String(items.filter((p) => p.status === "active").length)} delta="live now" tone="up" />
        <StatCard label="Total views" value={totalViews.toLocaleString()} delta="this month" tone="flat" />
        <StatCard label="Total clicks" value={totalClicks.toLocaleString()} delta="all popups" tone="up" />
        <StatCard label="Avg CTR" value={`${((totalClicks / Math.max(totalViews, 1)) * 100).toFixed(1)}%`} delta="across active" tone="up" />
      </div>

      <Panel title={`All pop-ups — ${items.length}`}>
        <DataTable head={<><th>Title</th><th>Trigger</th><th>Audience</th><th>Window</th><th>Views</th><th>Clicks</th><th>Status</th><th></th></>}>
          {items.map((p) => (
            <tr key={p.id}>
              <td>
                <div className="flex items-center gap-2">
                  {p.thumbnail && <img src={p.thumbnail} alt="" className="h-8 w-8 rounded-md object-cover ring-1 ring-white/10" />}
                  <div>
                    <div className="font-semibold">{p.title || <span className="text-muted-foreground italic">untitled</span>}</div>
                    <div className="line-clamp-1 text-[11px] text-muted-foreground">{p.message}</div>
                  </div>
                </div>
              </td>
              <td><Pill>{p.trigger}</Pill></td>
              <td><Pill>{p.audience}</Pill></td>
              <td className="text-muted-foreground text-xs">{p.start} – {p.end}</td>
              <td className="font-mono">{p.views.toLocaleString()}</td>
              <td className="font-mono text-emerald-300">{p.clicks.toLocaleString()}</td>
              <td>
                <button onClick={() => {
                  const next: Popup["status"] = p.status === "active" ? "paused" : "active";
                  update(p.id, { status: next }); toast.success(`Set to ${next}`);
                }}>
                  <StatusPill status={p.status} />
                </button>
              </td>
              <td className="text-right">
                <div className="flex justify-end gap-1">
                  <button onClick={() => setEditing(p)} className="rounded-md bg-white/10 px-2 py-1"><Edit3 className="h-3 w-3 text-white" /></button>
                  <button onClick={() => setDeleting(p)} className="rounded-md bg-rose-500/15 px-2 py-1"><Trash2 className="h-3 w-3 text-rose-300" /></button>
                </div>
              </td>
            </tr>
          ))}
          {items.length === 0 && <tr><td colSpan={8} className="py-8 text-center text-sm text-muted-foreground">No pop-ups yet.</td></tr>}
        </DataTable>
      </Panel>

      {editing && (
        <Modal
          open
          onClose={() => setEditing(null)}
          title={editing.title ? "Edit pop-up" : "New pop-up"}
          size="lg"
          footer={
            <>
              <button onClick={() => setEditing(null)} className="rounded-xl bg-white/10 px-4 py-2 text-xs font-bold text-white">Cancel</button>
              <button
                onClick={() => {
                  const exists = items.some((x) => x.id === editing.id);
                  if (exists) update(editing.id, editing); else add(editing);
                  toast.success(exists ? "Pop-up updated" : "Pop-up created");
                  setEditing(null);
                }}
                className="rounded-xl bg-gradient-to-r from-fuchsia-500 to-violet-600 px-4 py-2 text-xs font-bold text-white"
              >Save</button>
            </>
          }
        >
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Title" span={2}><input className={fieldCls} value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} /></Field>
            <Field label="Message" span={2}><textarea rows={3} className={fieldCls} value={editing.message} onChange={(e) => setEditing({ ...editing, message: e.target.value })} /></Field>
            <Field label="CTA label"><input className={fieldCls} value={editing.cta} onChange={(e) => setEditing({ ...editing, cta: e.target.value })} /></Field>
            <Field label="CTA link"><input className={fieldCls} value={editing.link} onChange={(e) => setEditing({ ...editing, link: e.target.value })} /></Field>
            <Field label="Trigger">
              <select className={selectCls} value={editing.trigger} onChange={(e) => setEditing({ ...editing, trigger: e.target.value as Popup["trigger"] })}>
                <option>On load</option><option>After 10s</option><option>Exit intent</option><option>Specific page</option>
              </select>
            </Field>
            <Field label="Audience">
              <select className={selectCls} value={editing.audience} onChange={(e) => setEditing({ ...editing, audience: e.target.value as Popup["audience"] })}>
                <option>All</option><option>Logged in</option><option>Guests</option>
              </select>
            </Field>
            <Field label="Start"><input className={fieldCls} value={editing.start} onChange={(e) => setEditing({ ...editing, start: e.target.value })} /></Field>
            <Field label="End"><input className={fieldCls} value={editing.end} onChange={(e) => setEditing({ ...editing, end: e.target.value })} /></Field>
            <Field label="Status">
              <select className={selectCls} value={editing.status} onChange={(e) => setEditing({ ...editing, status: e.target.value as Popup["status"] })}>
                <option value="draft">draft</option><option value="active">active</option><option value="paused">paused</option>
              </select>
            </Field>
            <div className="md:col-span-2">
              <ThumbnailUploader label="Pop-up image" value={editing.thumbnail} onChange={(url) => setEditing({ ...editing, thumbnail: url })} />
            </div>
          </div>
        </Modal>
      )}

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => { if (deleting) { remove(deleting.id); toast.success("Pop-up deleted"); } }}
        title="Delete pop-up?"
        message="The pop-up will stop appearing immediately."
        confirmText="Delete"
      />
    </div>
  );
}
