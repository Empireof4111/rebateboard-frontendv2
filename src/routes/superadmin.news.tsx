import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { PageHeader, Panel, DataTable, StatusPill } from "@/components/superadmin/AdminUI";
import { Modal, ConfirmDialog, Field, fieldCls, selectCls, ThumbnailUploader, toast } from "@/components/superadmin/AdminActions";
import { newsApi, type NewsItem } from "@/lib/admin-api";
import { useAuth } from "@/lib/auth";
import { ApiError } from "@/lib/api";
import { Plus, Edit3, Trash2, RefreshCw } from "lucide-react";

export const Route = createFileRoute("/superadmin/news")({
  component: NewsPage,
});

const emptyItem = (): NewsItem => ({
  id: "",
  title: "",
  excerpt: "",
  status: "draft",
  published: "",
  author: "RebateBoard Editorial",
  authorAvatar: "",
  authorTitle: "Editorial Team",
  thumbnail: "",
});

function NewsPage() {
  const { token } = useAuth();
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<NewsItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<NewsItem | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await newsApi.list(token);
      if (res.payload) setItems(res.payload.page);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Failed to load news");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!token || !editing) return;
    setSaving(true);
    try {
      const isNew = !editing.id;
      if (isNew) {
        const res = await newsApi.create(token, editing);
        if (res.payload) setItems((prev) => [res.payload!, ...prev]);
        toast.success("News post created");
      } else {
        const res = await newsApi.update(token, editing.id, editing);
        if (res.payload) setItems((prev) => prev.map((n) => n.id === editing.id ? res.payload! : n));
        toast.success("News post updated");
      }
      setEditing(null);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (item: NewsItem) => {
    if (!token) return;
    try {
      const next = item.status === "published" ? "draft" : "published";
      const res = await newsApi.update(token, item.id, { ...item, status: next });
      if (res.payload) setItems((prev) => prev.map((n) => n.id === item.id ? res.payload! : n));
      toast.success(`Marked as ${next}`);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Update failed");
    }
  };

  const confirmDelete = async () => {
    if (!token || !deleting) return;
    try {
      await newsApi.remove(token, deleting.id);
      setItems((prev) => prev.filter((n) => n.id !== deleting.id));
      toast.success("News post deleted");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Delete failed");
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div>
      <PageHeader
        title="Company News"
        subtitle="Internal milestones, partnerships and product launches."
        actions={
          <div className="flex gap-2">
            <button onClick={load} className="grid h-7 w-7 place-items-center rounded-md bg-white/5 text-white ring-1 ring-white/10">
              <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
            </button>
            <button onClick={() => setEditing(emptyItem())} className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-600 px-3 py-1.5 text-xs font-semibold text-white">
              <Plus className="h-3.5 w-3.5" /> New post
            </button>
          </div>
        }
      />

      <Panel title={`All news — ${items.length}`}>
        <DataTable head={<><th>Title</th><th>Excerpt</th><th>Author</th><th>Status</th><th>Published</th><th></th></>}>
          {loading && <tr><td colSpan={6} className="py-8 text-center text-sm text-muted-foreground">Loading…</td></tr>}
          {!loading && items.map((n) => (
            <tr key={n.id}>
              <td className="font-semibold">{n.title || <span className="italic text-muted-foreground">untitled</span>}</td>
              <td className="max-w-md text-muted-foreground line-clamp-1">{n.excerpt}</td>
              <td>
                <div className="flex items-center gap-2">
                  {n.authorAvatar ? (
                    <img src={n.authorAvatar} alt="" className="h-7 w-7 rounded-full object-cover ring-1 ring-white/10" />
                  ) : (
                    <span className="grid h-7 w-7 place-items-center rounded-full bg-fuchsia-500/20 text-[10px] font-bold text-fuchsia-200">
                      {n.author.slice(0, 2).toUpperCase()}
                    </span>
                  )}
                  <span>{n.author}</span>
                </div>
              </td>
              <td>
                <button onClick={() => toggleStatus(n)}>
                  <StatusPill status={n.status} />
                </button>
              </td>
              <td className="text-xs text-muted-foreground">
                {n.published ? new Date(n.published).toLocaleDateString() : "—"}
              </td>
              <td className="text-right">
                <div className="flex justify-end gap-1">
                  <button onClick={() => setEditing(n)} className="rounded-md bg-white/10 px-2 py-1"><Edit3 className="h-3 w-3 text-white" /></button>
                  <button onClick={() => setDeleting(n)} className="rounded-md bg-rose-500/15 px-2 py-1"><Trash2 className="h-3 w-3 text-rose-300" /></button>
                </div>
              </td>
            </tr>
          ))}
          {!loading && items.length === 0 && <tr><td colSpan={6} className="py-8 text-center text-sm text-muted-foreground">No news posts yet.</td></tr>}
        </DataTable>
      </Panel>

      {editing && (
        <Modal
          open
          onClose={() => setEditing(null)}
          title={editing.id ? "Edit news post" : "New news post"}
          size="lg"
          footer={
            <>
              <button onClick={() => setEditing(null)} className="rounded-xl bg-white/10 px-4 py-2 text-xs font-bold text-white">Cancel</button>
              <button onClick={save} disabled={saving || !editing.title.trim()} className="rounded-xl bg-gradient-to-r from-fuchsia-500 to-violet-600 px-4 py-2 text-xs font-bold text-white disabled:opacity-40">
                {saving ? "Saving…" : "Save"}
              </button>
            </>
          }
        >
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Title" span={2}><input className={fieldCls} value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} /></Field>
            <Field label="Status">
              <select className={selectCls} value={editing.status} onChange={(e) => setEditing({ ...editing, status: e.target.value as NewsItem["status"] })}>
                <option value="draft">draft</option>
                <option value="published">published</option>
              </select>
            </Field>
            <Field label="Editor / publisher name">
              <input
                className={fieldCls}
                value={editing.author ?? ""}
                onChange={(e) => setEditing({ ...editing, author: e.target.value })}
                placeholder="RebateBoard Editorial"
              />
            </Field>
            <Field label="Editor role">
              <input
                className={fieldCls}
                value={editing.authorTitle ?? ""}
                onChange={(e) => setEditing({ ...editing, authorTitle: e.target.value })}
                placeholder="Editorial Team"
              />
            </Field>
            <div className="md:col-span-2">
              <ThumbnailUploader
                label="Editor avatar / profile picture"
                value={editing.authorAvatar}
                height="h-24"
                onChange={(url) => setEditing({ ...editing, authorAvatar: url })}
              />
            </div>
            <Field label="Excerpt" span={2}>
              <textarea rows={3} className={fieldCls} value={editing.excerpt} onChange={(e) => setEditing({ ...editing, excerpt: e.target.value })} />
            </Field>
          </div>
        </Modal>
      )}

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        title="Delete news post?"
        message={`"${deleting?.title}" will be removed.`}
        confirmText="Delete"
      />
    </div>
  );
}
