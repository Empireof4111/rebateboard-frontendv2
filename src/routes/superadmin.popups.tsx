import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { PageHeader, Panel, DataTable, StatusPill, Pill, StatCard } from "@/components/superadmin/AdminUI";
import { Modal, ConfirmDialog, Field, fieldCls, selectCls, ThumbnailUploader, toast } from "@/components/superadmin/AdminActions";
import { popupApi, type PopupItem } from "@/lib/admin-api";
import { useAuth } from "@/lib/auth";
import { ApiError } from "@/lib/api";
import { Plus, Edit3, Trash2, RefreshCw } from "lucide-react";

export const Route = createFileRoute("/superadmin/popups")({
  component: PopupsPage,
});

const empty = (): PopupItem => ({
  id: "",
  title: "",
  message: "",
  cta: "Learn more",
  link: "/",
  trigger: "On load",
  audience: "All",
  start: "—",
  end: "—",
  status: "draft",
  views: 0,
  clicks: 0,
  thumbnail: "",
});

function PopupsPage() {
  const { token } = useAuth();
  const [items, setItems] = useState<PopupItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<PopupItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<PopupItem | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await popupApi.list(token);
      if (res.payload) setItems(res.payload.page);
      else setItems([]);
    } catch (e) {
      if (!(e instanceof ApiError && e.message.includes("No popup"))) {
        toast.error(e instanceof ApiError ? e.message : "Failed to load pop-ups");
      }
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const totalViews = useMemo(() => items.reduce((s, p) => s + p.views, 0), [items]);
  const totalClicks = useMemo(() => items.reduce((s, p) => s + p.clicks, 0), [items]);

  const save = async () => {
    if (!token || !editing) return;
    if (!editing.title.trim()) { toast.error("Title is required"); return; }
    if (!editing.message.trim()) { toast.error("Message is required"); return; }
    setSaving(true);
    try {
      const isNew = !editing.id;
      if (isNew) {
        const res = await popupApi.create(token, editing);
        if (res.payload) setItems((prev) => [res.payload!, ...prev]);
        toast.success("Pop-up created");
      } else {
        const res = await popupApi.update(token, editing.id, editing);
        if (res.payload) setItems((prev) => prev.map((p) => p.id === editing.id ? res.payload! : p));
        toast.success("Pop-up updated");
      }
      setEditing(null);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (p: PopupItem) => {
    if (!token) return;
    const next: PopupItem["status"] = p.status === "active" ? "paused" : "active";
    try {
      const res = await popupApi.update(token, p.id, { ...p, status: next });
      if (res.payload) setItems((prev) => prev.map((x) => x.id === p.id ? res.payload! : x));
      toast.success(`Set to ${next}`);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Update failed");
    }
  };

  const confirmDelete = async () => {
    if (!token || !deleting) return;
    try {
      await popupApi.remove(token, deleting.id);
      setItems((prev) => prev.filter((p) => p.id !== deleting.id));
      toast.success("Pop-up deleted");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Delete failed");
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div>
      <PageHeader
        title="Pop-ups"
        subtitle="Modal pop-ups triggered on the public site & dashboard."
        actions={
          <div className="flex gap-2">
            <button onClick={load} className="grid h-7 w-7 place-items-center rounded-md bg-white/5 text-white ring-1 ring-white/10">
              <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
            </button>
            <button onClick={() => setEditing(empty())} className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-600 px-3 py-1.5 text-xs font-semibold text-white">
              <Plus className="h-3.5 w-3.5" /> New pop-up
            </button>
          </div>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Active pop-ups" value={String(items.filter((p) => p.status === "active").length)} delta="live now" tone="up" />
        <StatCard label="Total views" value={totalViews.toLocaleString()} delta="all time" tone="flat" />
        <StatCard label="Total clicks" value={totalClicks.toLocaleString()} delta="all popups" tone="up" />
        <StatCard label="Avg CTR" value={`${((totalClicks / Math.max(totalViews, 1)) * 100).toFixed(1)}%`} delta="across active" tone="up" />
      </div>

      <Panel title={`All pop-ups — ${items.length}`}>
        <DataTable head={<><th>Title</th><th>Trigger</th><th>Audience</th><th>Window</th><th>Views</th><th>Clicks</th><th>Status</th><th></th></>}>
          {loading && (
            <tr><td colSpan={8} className="py-8 text-center text-sm text-muted-foreground">Loading…</td></tr>
          )}
          {!loading && items.map((p) => (
            <tr key={p.id}>
              <td>
                <div className="flex items-center gap-2">
                  {p.thumbnail && <img src={p.thumbnail} alt="" className="h-8 w-8 rounded-md object-cover ring-1 ring-white/10" />}
                  <div>
                    <div className="font-semibold">{p.title || <span className="italic text-muted-foreground">untitled</span>}</div>
                    <div className="line-clamp-1 text-[11px] text-muted-foreground">{p.message}</div>
                  </div>
                </div>
              </td>
              <td><Pill>{p.trigger}</Pill></td>
              <td><Pill>{p.audience}</Pill></td>
              <td className="text-xs text-muted-foreground">{p.start} – {p.end}</td>
              <td className="font-mono">{p.views.toLocaleString()}</td>
              <td className="font-mono text-emerald-300">{p.clicks.toLocaleString()}</td>
              <td>
                <button onClick={() => toggleStatus(p)}>
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
          {!loading && items.length === 0 && (
            <tr><td colSpan={8} className="py-8 text-center text-sm text-muted-foreground">No pop-ups yet. Create your first one.</td></tr>
          )}
        </DataTable>
      </Panel>

      {editing && (
        <Modal
          open
          onClose={() => setEditing(null)}
          title={editing.id ? "Edit pop-up" : "New pop-up"}
          size="lg"
          footer={
            <>
              <button onClick={() => setEditing(null)} className="rounded-xl bg-white/10 px-4 py-2 text-xs font-bold text-white">Cancel</button>
              <button onClick={save} disabled={saving} className="rounded-xl bg-gradient-to-r from-fuchsia-500 to-violet-600 px-4 py-2 text-xs font-bold text-white disabled:opacity-40">
                {saving ? "Saving…" : "Save"}
              </button>
            </>
          }
        >
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Title" span={2}>
              <input className={fieldCls} value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} placeholder="e.g. Get 25% cashback this week" />
            </Field>
            <Field label="Message" span={2}>
              <textarea rows={3} className={fieldCls} value={editing.message} onChange={(e) => setEditing({ ...editing, message: e.target.value })} placeholder="Short compelling message for the popup body" />
            </Field>
            <Field label="CTA label">
              <input className={fieldCls} value={editing.cta} onChange={(e) => setEditing({ ...editing, cta: e.target.value })} />
            </Field>
            <Field label="CTA link">
              <input className={fieldCls} value={editing.link} onChange={(e) => setEditing({ ...editing, link: e.target.value })} />
            </Field>
            <Field label="Trigger">
              <select className={selectCls} value={editing.trigger} onChange={(e) => setEditing({ ...editing, trigger: e.target.value as PopupItem["trigger"] })}>
                <option>On load</option>
                <option>After 10s</option>
                <option>Exit intent</option>
                <option>Specific page</option>
              </select>
            </Field>
            <Field label="Audience">
              <select className={selectCls} value={editing.audience} onChange={(e) => setEditing({ ...editing, audience: e.target.value as PopupItem["audience"] })}>
                <option>All</option>
                <option>Logged in</option>
                <option>Guests</option>
              </select>
            </Field>
            <Field label="Start date">
              <input type="date" className={fieldCls} value={editing.start === "—" ? "" : editing.start} onChange={(e) => setEditing({ ...editing, start: e.target.value || "—" })} />
            </Field>
            <Field label="End date">
              <input type="date" className={fieldCls} value={editing.end === "—" ? "" : editing.end} onChange={(e) => setEditing({ ...editing, end: e.target.value || "—" })} />
            </Field>
            <Field label="Status">
              <select className={selectCls} value={editing.status} onChange={(e) => setEditing({ ...editing, status: e.target.value as PopupItem["status"] })}>
                <option value="draft">draft</option>
                <option value="active">active</option>
                <option value="paused">paused</option>
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
        onConfirm={confirmDelete}
        title="Delete pop-up?"
        message="The pop-up will stop appearing immediately."
        confirmText="Delete"
      />
    </div>
  );
}
