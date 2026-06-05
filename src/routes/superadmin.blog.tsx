import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader, Panel, DataTable, StatusPill } from "@/components/superadmin/AdminUI";
import { Modal, ConfirmDialog, Field, fieldCls, selectCls, ThumbnailUploader, toast } from "@/components/superadmin/AdminActions";
import { useAdminCollection, newId } from "@/lib/admin-store";
import { blogPosts as seed, type BlogPost } from "@/lib/admin-data";
import { Plus, Edit3, Trash2 } from "lucide-react";

export const Route = createFileRoute("/superadmin/blog")({
  component: BlogAdmin,
});

const TAGS = ["Guide", "Comparison", "Brand spotlight", "Trader 101", "Industry", "Partner news"];
const empty = (): BlogPost => ({
  id: newId("bp"), title: "", author: "RB Editorial", views: "0", status: "draft",
  time: "just now", cover: "", body: "", tag: "Guide", excerpt: "", readTime: "5 min read",
});

function BlogAdmin() {
  const { items, add, update, remove } = useAdminCollection<BlogPost>("blog", seed as BlogPost[]);
  const [editing, setEditing] = useState<BlogPost | null>(null);
  const [deleting, setDeleting] = useState<BlogPost | null>(null);

  return (
    <div>
      <PageHeader title="Blog & Reports" subtitle="Editorial content and industry reports."
        actions={
          <button onClick={() => setEditing(empty())} className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-600 px-3 py-1.5 text-xs font-semibold text-white">
            <Plus className="h-3.5 w-3.5" /> New post
          </button>
        }
      />
      <Panel title={`Posts — ${items.length}`}>
        <DataTable head={<><th>Title</th><th>Author</th><th>Views</th><th>Status</th><th>Updated</th><th></th></>}>
          {items.map((b) => (
            <tr key={b.id}>
              <td className="font-semibold">{b.title || <span className="text-muted-foreground italic">untitled</span>}</td>
              <td className="text-muted-foreground">{b.author}</td>
              <td className="font-mono">{b.views}</td>
              <td>
                <button onClick={() => { update(b.id, { status: b.status === "published" ? "draft" : "published" }); toast.success(`Marked as ${b.status === "published" ? "draft" : "published"}`); }}>
                  <StatusPill status={b.status} />
                </button>
              </td>
              <td className="text-xs text-muted-foreground">{b.time}</td>
              <td className="text-right">
                <div className="flex justify-end gap-1">
                  <button onClick={() => setEditing(b)} className="rounded-md bg-white/10 px-2 py-1"><Edit3 className="h-3 w-3 text-white" /></button>
                  <button onClick={() => setDeleting(b)} className="rounded-md bg-rose-500/15 px-2 py-1"><Trash2 className="h-3 w-3 text-rose-300" /></button>
                </div>
              </td>
            </tr>
          ))}
          {items.length === 0 && <tr><td colSpan={6} className="py-8 text-center text-sm text-muted-foreground">No posts yet.</td></tr>}
        </DataTable>
      </Panel>

      {editing && (
        <Modal
          open
          onClose={() => setEditing(null)}
          title={editing.title ? "Edit post" : "New post"}
          size="lg"
          footer={
            <>
              <button onClick={() => setEditing(null)} className="rounded-xl bg-white/10 px-4 py-2 text-xs font-bold text-white">Cancel</button>
              <button
                onClick={() => {
                  const exists = items.some((x) => x.id === editing.id);
                  if (exists) update(editing.id, editing); else add(editing);
                  toast.success(exists ? "Post updated" : "Post created");
                  setEditing(null);
                }}
                className="rounded-xl bg-gradient-to-r from-fuchsia-500 to-violet-600 px-4 py-2 text-xs font-bold text-white"
              >Save</button>
            </>
          }
        >
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Title" span={2}><input className={fieldCls} value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} /></Field>
            <Field label="Author"><input className={fieldCls} value={editing.author} onChange={(e) => setEditing({ ...editing, author: e.target.value })} /></Field>
            <Field label="Status">
              <select className={selectCls} value={editing.status} onChange={(e) => setEditing({ ...editing, status: e.target.value as BlogPost["status"] })}>
                <option value="draft">draft</option><option value="published">published</option>
              </select>
            </Field>
            <Field label="Tag / Category">
              <select className={selectCls} value={editing.tag ?? "Guide"} onChange={(e) => setEditing({ ...editing, tag: e.target.value })}>
                {TAGS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="Read time"><input className={fieldCls} value={editing.readTime ?? ""} onChange={(e) => setEditing({ ...editing, readTime: e.target.value })} placeholder="e.g. 6 min read" /></Field>
            <Field label="Excerpt (card summary)" span={2}>
              <textarea rows={2} className={fieldCls} value={editing.excerpt ?? ""} onChange={(e) => setEditing({ ...editing, excerpt: e.target.value })} placeholder="Short summary shown on the article card…" />
            </Field>
            <div className="md:col-span-2">
              <ThumbnailUploader label="Cover image / thumbnail" value={editing.cover} onChange={(url) => setEditing({ ...editing, cover: url })} />
            </div>
            <Field label="Body (markdown)" span={2}><textarea rows={10} className={fieldCls} value={editing.body ?? ""} onChange={(e) => setEditing({ ...editing, body: e.target.value })} placeholder="# Heading…" /></Field>
          </div>
        </Modal>
      )}

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => { if (deleting) { remove(deleting.id); toast.success("Post deleted"); } }}
        title="Delete post?"
        message={`"${deleting?.title}" will be removed.`}
        confirmText="Delete"
      />
    </div>
  );
}
