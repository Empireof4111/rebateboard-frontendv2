import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader, Panel, DataTable, StatusPill } from "@/components/superadmin/AdminUI";
import { Modal, ConfirmDialog, Field, fieldCls, selectCls, toast } from "@/components/superadmin/AdminActions";
import { useAdminCollection, newId } from "@/lib/admin-store";
import { companyNews as seed, type NewsItem } from "@/lib/admin-data";
import { Plus, Edit3, Trash2 } from "lucide-react";

export const Route = createFileRoute("/superadmin/news")({
  component: NewsPage,
});

const empty = (): NewsItem => ({ id: newId("nw"), title: "", excerpt: "", status: "draft", published: "—", author: "RB Team" });

function NewsPage() {
  const { items, add, update, remove } = useAdminCollection<NewsItem>("news", seed);
  const [editing, setEditing] = useState<NewsItem | null>(null);
  const [deleting, setDeleting] = useState<NewsItem | null>(null);

  return (
    <div>
      <PageHeader
        title="Company News"
        subtitle="Internal milestones, partnerships and product launches."
        actions={
          <button onClick={() => setEditing(empty())} className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-600 px-3 py-1.5 text-xs font-semibold text-white">
            <Plus className="h-3.5 w-3.5" /> New post
          </button>
        }
      />
      <Panel title={`All news — ${items.length}`}>
        <DataTable head={<><th>Title</th><th>Excerpt</th><th>Author</th><th>Status</th><th>Published</th><th></th></>}>
          {items.map((n) => (
            <tr key={n.id}>
              <td className="font-semibold">{n.title || <span className="text-muted-foreground italic">untitled</span>}</td>
              <td className="text-muted-foreground line-clamp-1 max-w-md">{n.excerpt}</td>
              <td>{n.author}</td>
              <td>
                <button onClick={() => { update(n.id, { status: n.status === "published" ? "draft" : "published" }); toast.success(`Marked as ${n.status === "published" ? "draft" : "published"}`); }}>
                  <StatusPill status={n.status} />
                </button>
              </td>
              <td className="text-muted-foreground text-xs">{n.published}</td>
              <td className="text-right">
                <div className="flex justify-end gap-1">
                  <button onClick={() => setEditing(n)} className="rounded-md bg-white/10 px-2 py-1"><Edit3 className="h-3 w-3 text-white" /></button>
                  <button onClick={() => setDeleting(n)} className="rounded-md bg-rose-500/15 px-2 py-1"><Trash2 className="h-3 w-3 text-rose-300" /></button>
                </div>
              </td>
            </tr>
          ))}
          {items.length === 0 && <tr><td colSpan={6} className="py-8 text-center text-sm text-muted-foreground">No news posts yet.</td></tr>}
        </DataTable>
      </Panel>

      {editing && (
        <Modal
          open
          onClose={() => setEditing(null)}
          title={editing.title ? "Edit news post" : "New news post"}
          size="lg"
          footer={
            <>
              <button onClick={() => setEditing(null)} className="rounded-xl bg-white/10 px-4 py-2 text-xs font-bold text-white">Cancel</button>
              <button
                onClick={() => {
                  const e = editing;
                  const exists = items.some((x) => x.id === e.id);
                  const final = { ...e, published: e.status === "published" && e.published === "—" ? new Date().toLocaleDateString() : e.published };
                  if (exists) update(e.id, final); else add(final);
                  toast.success(exists ? "News post updated" : "News post created");
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
              <select className={selectCls} value={editing.status} onChange={(e) => setEditing({ ...editing, status: e.target.value as NewsItem["status"] })}>
                <option value="draft">draft</option><option value="published">published</option>
              </select>
            </Field>
            <Field label="Excerpt" span={2}><textarea rows={3} className={fieldCls} value={editing.excerpt} onChange={(e) => setEditing({ ...editing, excerpt: e.target.value })} /></Field>
          </div>
        </Modal>
      )}

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => { if (deleting) { remove(deleting.id); toast.success("News post deleted"); } }}
        title="Delete news post?"
        message={`"${deleting?.title}" will be removed.`}
        confirmText="Delete"
      />
    </div>
  );
}
