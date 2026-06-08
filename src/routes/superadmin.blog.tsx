import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { PageHeader, Panel, DataTable, StatusPill } from "@/components/superadmin/AdminUI";
import { Modal, ConfirmDialog, Field, fieldCls, selectCls, ThumbnailUploader, toast } from "@/components/superadmin/AdminActions";
import { blogApi, type BlogPost } from "@/lib/admin-api";
import { useAuth } from "@/lib/auth";
import { ApiError } from "@/lib/api";
import { Plus, Edit3, Trash2, RefreshCw } from "lucide-react";

export const Route = createFileRoute("/superadmin/blog")({
  component: BlogAdmin,
});

const TAGS = ["Guide", "Comparison", "Brand spotlight", "Trader 101", "Industry", "Partner news"];

const emptyPost = (): BlogPost => ({
  id: "",
  title: "",
  author: "",
  views: "0",
  status: "draft",
  time: "",
  cover: "",
  body: "",
  tag: "Guide",
  excerpt: "",
  readTime: "5 min read",
});

function BlogAdmin() {
  const { token } = useAuth();
  const [items, setItems] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<BlogPost | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<BlogPost | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await blogApi.list(token);
      if (res.payload) setItems(res.payload.page);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Failed to load posts");
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
        const res = await blogApi.create(token, editing);
        if (res.payload) setItems((prev) => [res.payload!, ...prev]);
        toast.success("Post created");
      } else {
        const res = await blogApi.update(token, editing.id, editing);
        if (res.payload) setItems((prev) => prev.map((p) => p.id === editing.id ? res.payload! : p));
        toast.success("Post updated");
      }
      setEditing(null);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (post: BlogPost) => {
    if (!token) return;
    try {
      const next = post.status === "published" ? "draft" : "published";
      const res = await blogApi.update(token, post.id, { ...post, status: next });
      if (res.payload) setItems((prev) => prev.map((p) => p.id === post.id ? res.payload! : p));
      toast.success(`Marked as ${next}`);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Update failed");
    }
  };

  const confirmDelete = async () => {
    if (!token || !deleting) return;
    try {
      await blogApi.remove(token, deleting.id);
      setItems((prev) => prev.filter((p) => p.id !== deleting.id));
      toast.success("Post deleted");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Delete failed");
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div>
      <PageHeader
        title="Blog & Reports"
        subtitle="Editorial content and industry reports."
        actions={
          <div className="flex gap-2">
            <button onClick={load} className="grid h-7 w-7 place-items-center rounded-md bg-white/5 text-white ring-1 ring-white/10">
              <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
            </button>
            <button
              onClick={() => setEditing(emptyPost())}
              className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-600 px-3 py-1.5 text-xs font-semibold text-white"
            >
              <Plus className="h-3.5 w-3.5" /> New post
            </button>
          </div>
        }
      />

      <Panel title={`Posts — ${items.length}`}>
        <DataTable head={<><th>Title</th><th>Author</th><th>Views</th><th>Status</th><th>Updated</th><th></th></>}>
          {loading && <tr><td colSpan={6} className="py-8 text-center text-sm text-muted-foreground">Loading…</td></tr>}
          {!loading && items.map((b) => (
            <tr key={b.id}>
              <td className="font-semibold">{b.title || <span className="italic text-muted-foreground">untitled</span>}</td>
              <td className="text-muted-foreground">{b.author}</td>
              <td className="font-mono">{b.views}</td>
              <td>
                <button onClick={() => toggleStatus(b)}>
                  <StatusPill status={b.status} />
                </button>
              </td>
              <td className="text-xs text-muted-foreground">
                {b.time ? new Date(b.time).toLocaleDateString() : "—"}
              </td>
              <td className="text-right">
                <div className="flex justify-end gap-1">
                  <button onClick={() => setEditing(b)} className="rounded-md bg-white/10 px-2 py-1">
                    <Edit3 className="h-3 w-3 text-white" />
                  </button>
                  <button onClick={() => setDeleting(b)} className="rounded-md bg-rose-500/15 px-2 py-1">
                    <Trash2 className="h-3 w-3 text-rose-300" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {!loading && items.length === 0 && (
            <tr><td colSpan={6} className="py-8 text-center text-sm text-muted-foreground">No posts yet.</td></tr>
          )}
        </DataTable>
      </Panel>

      {editing && (
        <Modal
          open
          onClose={() => setEditing(null)}
          title={editing.id ? "Edit post" : "New post"}
          size="lg"
          footer={
            <>
              <button onClick={() => setEditing(null)} className="rounded-xl bg-white/10 px-4 py-2 text-xs font-bold text-white">
                Cancel
              </button>
              <button
                onClick={save}
                disabled={saving || !editing.title.trim()}
                className="rounded-xl bg-gradient-to-r from-fuchsia-500 to-violet-600 px-4 py-2 text-xs font-bold text-white disabled:opacity-40"
              >
                {saving ? "Saving…" : "Save"}
              </button>
            </>
          }
        >
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Title" span={2}>
              <input className={fieldCls} value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
            </Field>
            <Field label="Status">
              <select className={selectCls} value={editing.status} onChange={(e) => setEditing({ ...editing, status: e.target.value as BlogPost["status"] })}>
                <option value="draft">draft</option>
                <option value="published">published</option>
              </select>
            </Field>
            <Field label="Tag / Category">
              <select className={selectCls} value={editing.tag ?? "Guide"} onChange={(e) => setEditing({ ...editing, tag: e.target.value })}>
                {TAGS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="Read time">
              <input className={fieldCls} value={editing.readTime ?? ""} onChange={(e) => setEditing({ ...editing, readTime: e.target.value })} placeholder="e.g. 6 min read" />
            </Field>
            <Field label="Excerpt (card summary)" span={2}>
              <textarea rows={2} className={fieldCls} value={editing.excerpt ?? ""} onChange={(e) => setEditing({ ...editing, excerpt: e.target.value })} placeholder="Short summary shown on the article card…" />
            </Field>
            <div className="md:col-span-2">
              <ThumbnailUploader label="Cover image / thumbnail" value={editing.cover} onChange={(url) => setEditing({ ...editing, cover: url })} />
            </div>
            <Field label="Body (markdown)" span={2}>
              <textarea rows={10} className={fieldCls} value={editing.body ?? ""} onChange={(e) => setEditing({ ...editing, body: e.target.value })} placeholder="# Heading…" />
            </Field>
          </div>
        </Modal>
      )}

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        title="Delete post?"
        message={`"${deleting?.title}" will be removed permanently.`}
        confirmText="Delete"
      />
    </div>
  );
}
