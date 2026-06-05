import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader, Panel, DataTable, StatusPill, StatCard, Toolbar } from "@/components/superadmin/AdminUI";
import { Modal, ConfirmDialog, Field, fieldCls, selectCls, toast } from "@/components/superadmin/AdminActions";
import { useAdminCollection, newId } from "@/lib/admin-store";
import { faqs as seedFaqs, type Faq } from "@/lib/admin-data";
import { Plus, Edit2, Trash2, Search } from "lucide-react";

export const Route = createFileRoute("/superadmin/faqs")({
  component: FaqsPage,
});

const CATS: Faq["category"][] = ["General", "Account", "Wallet", "Cashback", "Claims", "TBI"];

function emptyFaq(): Faq {
  return { id: newId("faq"), category: "General", question: "", answer: "", status: "draft", updated: "just now", views: 0 };
}

function FaqsPage() {
  const { items, add, update, remove } = useAdminCollection<Faq>("faqs", seedFaqs);
  const [editing, setEditing] = useState<Faq | null>(null);
  const [deleting, setDeleting] = useState<Faq | null>(null);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("all");

  const filtered = useMemo(() => items
    .filter((f) => cat === "all" || f.category === cat)
    .filter((f) => !q.trim() || f.question.toLowerCase().includes(q.trim().toLowerCase())), [items, q, cat]);

  return (
    <div>
      <PageHeader
        title="FAQs CMS"
        subtitle="Full control over the public FAQ knowledge base."
        actions={
          <button onClick={() => setEditing(emptyFaq())} className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-600 px-3 py-1.5 text-xs font-semibold text-white">
            <Plus className="h-3.5 w-3.5" /> New FAQ
          </button>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Total FAQs" value={String(items.length)} delta={`${items.filter((f) => f.status === "published").length} published`} tone="up" />
        <StatCard label="Drafts" value={String(items.filter((f) => f.status === "draft").length)} delta="awaiting publish" tone="flat" />
        <StatCard label="Total views" value={items.reduce((s, f) => s + f.views, 0).toLocaleString()} delta="all time" tone="up" />
        <StatCard label="Categories" value={String(CATS.length)} delta="navigation groups" tone="flat" />
      </div>

      <Panel title={`All FAQs — ${filtered.length}`}>
        <Toolbar>
          <div className="glass flex flex-1 items-center gap-2 rounded-full px-3 py-1.5 text-xs">
            <Search className="h-3.5 w-3.5 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search question…" className="w-full bg-transparent text-white outline-none placeholder:text-muted-foreground" />
          </div>
          <select value={cat} onChange={(e) => setCat(e.target.value)} className="rounded-full bg-white/5 px-3 py-1.5 text-xs text-white ring-1 ring-white/10">
            <option value="all">All categories</option>
            {CATS.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </Toolbar>

        <DataTable head={<><th>Category</th><th>Question</th><th>Status</th><th>Views</th><th>Updated</th><th></th></>}>
          {filtered.map((f) => (
            <tr key={f.id}>
              <td><span className="rounded-full bg-fuchsia-500/15 px-2 py-0.5 text-[10px] font-bold text-fuchsia-300 ring-1 ring-fuchsia-400/30">{f.category}</span></td>
              <td className="max-w-[420px] truncate font-semibold">{f.question || <span className="text-muted-foreground italic">untitled</span>}</td>
              <td>
                <button
                  onClick={() => { update(f.id, { status: f.status === "published" ? "draft" : "published" }); toast.success(`Marked as ${f.status === "published" ? "draft" : "published"}`); }}
                  title="Toggle status"
                >
                  <StatusPill status={f.status} />
                </button>
              </td>
              <td className="font-mono">{f.views.toLocaleString()}</td>
              <td className="text-xs text-muted-foreground">{f.updated}</td>
              <td className="text-right">
                <div className="flex justify-end gap-1">
                  <button onClick={() => setEditing(f)} className="grid h-7 w-7 place-items-center rounded-md bg-white/10 text-white hover:bg-white/15" title="Edit"><Edit2 className="h-3 w-3" /></button>
                  <button onClick={() => setDeleting(f)} className="grid h-7 w-7 place-items-center rounded-md bg-rose-500/15 text-rose-300 ring-1 ring-rose-400/30" title="Delete"><Trash2 className="h-3 w-3" /></button>
                </div>
              </td>
            </tr>
          ))}
          {filtered.length === 0 && <tr><td colSpan={6} className="py-8 text-center text-sm text-muted-foreground">No FAQs match.</td></tr>}
        </DataTable>
      </Panel>

      {editing && (
        <FaqEditor
          faq={editing}
          onClose={() => setEditing(null)}
          onSave={(form) => {
            const exists = items.some((x) => x.id === form.id);
            if (exists) { update(form.id, form); toast.success("FAQ updated"); }
            else { add(form); toast.success("FAQ created"); }
            setEditing(null);
          }}
        />
      )}
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => { if (deleting) { remove(deleting.id); toast.success("FAQ deleted"); } }}
        title="Delete FAQ?"
        message={`"${deleting?.question}" will be removed from the public knowledge base.`}
        confirmText="Delete"
      />
    </div>
  );
}

function FaqEditor({ faq, onClose, onSave }: { faq: Faq; onClose: () => void; onSave: (f: Faq) => void }) {
  const [form, setForm] = useState<Faq>(faq);
  return (
    <Modal
      open
      onClose={onClose}
      title={faq.question ? `Edit FAQ` : "New FAQ"}
      subtitle="Markdown supported in the answer field."
      size="lg"
      footer={
        <>
          <button onClick={onClose} className="rounded-xl bg-white/10 px-4 py-2 text-xs font-bold text-white">Cancel</button>
          <button onClick={() => onSave({ ...form, updated: "just now" })} className="rounded-xl bg-gradient-to-r from-fuchsia-500 to-violet-600 px-4 py-2 text-xs font-bold text-white">Save FAQ</button>
        </>
      }
    >
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Category">
          <select className={selectCls} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as Faq["category"] })}>
            {CATS.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="Status">
          <select className={selectCls} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as Faq["status"] })}>
            <option value="draft">draft</option>
            <option value="published">published</option>
          </select>
        </Field>
        <Field label="Question" span={2}>
          <input className={fieldCls} value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} placeholder="How do I…?" />
        </Field>
        <Field label="Answer (markdown supported)" span={2}>
          <textarea rows={8} className={fieldCls} value={form.answer} onChange={(e) => setForm({ ...form, answer: e.target.value })} placeholder="Write the full answer…" />
        </Field>
      </div>
    </Modal>
  );
}
