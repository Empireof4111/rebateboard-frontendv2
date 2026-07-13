import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { PageHeader, Panel, DataTable, StatusPill, StatCard, Toolbar } from "@/components/superadmin/AdminUI";
import { Modal, ConfirmDialog, Field, fieldCls, selectCls, toast } from "@/components/superadmin/AdminActions";
import { faqApi, type Faq } from "@/lib/admin-api";
import { useAuth } from "@/lib/auth";
import { ApiError } from "@/lib/api";
import { Plus, Edit2, Trash2, Search, RefreshCw } from "lucide-react";

export const Route = createFileRoute("/superadmin/faqs")({
  component: FaqsPage,
});

const CATS = ["General", "Account", "Wallet", "Cashback", "Claims", "TBI"];

const emptyFaq = (): Faq => ({ id: "", category: "General", question: "", answer: "", status: "draft", updated: "", views: 0 });

function FaqsPage() {
  const { token } = useAuth();
  const [items, setItems] = useState<Faq[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Faq | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<Faq | null>(null);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("all");

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await faqApi.list(token);
      if (res.payload) setItems(res.payload.page);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Failed to load FAQs");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() =>
    items
      .filter((f) => cat === "all" || f.category === cat)
      .filter((f) => !q.trim() || f.question.toLowerCase().includes(q.trim().toLowerCase())),
    [items, q, cat],
  );

  const save = async (form: Faq) => {
    if (!token) return;
    setSaving(true);
    try {
      const isNew = !form.id;
      if (isNew) {
        const res = await faqApi.create(token, form);
        if (res.payload) setItems((prev) => [res.payload!, ...prev]);
        toast.success("FAQ created");
      } else {
        const res = await faqApi.update(token, form.id, form);
        if (res.payload) setItems((prev) => prev.map((f) => f.id === form.id ? res.payload! : f));
        toast.success("FAQ updated");
      }
      setEditing(null);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (faq: Faq) => {
    if (!token) return;
    try {
      const next = faq.status === "published" ? "draft" : "published";
      const res = await faqApi.update(token, faq.id, { ...faq, status: next });
      if (res.payload) setItems((prev) => prev.map((f) => f.id === faq.id ? res.payload! : f));
      toast.success(`Marked as ${next}`);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Update failed");
    }
  };

  const confirmDelete = async () => {
    if (!token || !deleting) return;
    try {
      await faqApi.remove(token, deleting.id);
      setItems((prev) => prev.filter((f) => f.id !== deleting.id));
      toast.success("FAQ deleted");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Delete failed");
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div>
      <PageHeader
        title="FAQs CMS"
        subtitle="Full control over the public FAQ knowledge base."
        actions={
          <div className="flex gap-2">
            <button onClick={load} className="grid h-7 w-7 place-items-center rounded-md bg-white/5 text-white ring-1 ring-white/10">
              <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
            </button>
            <button onClick={() => setEditing(emptyFaq())} className="inline-flex items-center gap-1.5 rounded-full rb-gradient-primary px-3 py-1.5 text-xs font-semibold text-white">
              <Plus className="h-3.5 w-3.5" /> New FAQ
            </button>
          </div>
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
          {loading && <tr><td colSpan={6} className="py-8 text-center text-sm text-muted-foreground">Loading…</td></tr>}
          {!loading && filtered.map((f) => (
            <tr key={f.id}>
              <td><span className="rounded-full bg-violet-500/15 px-2 py-0.5 text-[10px] font-bold text-violet-300 ring-1 ring-violet-400/30">{f.category}</span></td>
              <td className="max-w-[420px] truncate font-semibold">{f.question || <span className="italic text-muted-foreground">untitled</span>}</td>
              <td><button onClick={() => toggleStatus(f)}><StatusPill status={f.status} /></button></td>
              <td className="font-mono">{f.views.toLocaleString()}</td>
              <td className="text-xs text-muted-foreground">{f.updated ? new Date(f.updated).toLocaleDateString() : "—"}</td>
              <td className="text-right">
                <div className="flex justify-end gap-1">
                  <button onClick={() => setEditing(f)} className="grid h-7 w-7 place-items-center rounded-md bg-white/10 text-white"><Edit2 className="h-3 w-3" /></button>
                  <button onClick={() => setDeleting(f)} className="grid h-7 w-7 place-items-center rounded-md bg-rose-500/15 text-rose-300 ring-1 ring-rose-400/30"><Trash2 className="h-3 w-3" /></button>
                </div>
              </td>
            </tr>
          ))}
          {!loading && filtered.length === 0 && <tr><td colSpan={6} className="py-8 text-center text-sm text-muted-foreground">No FAQs match.</td></tr>}
        </DataTable>
      </Panel>

      {editing && (
        <FaqEditor faq={editing} saving={saving} onClose={() => setEditing(null)} onSave={save} />
      )}

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        title="Delete FAQ?"
        message={`"${deleting?.question}" will be removed from the public knowledge base.`}
        confirmText="Delete"
      />
    </div>
  );
}

function FaqEditor({ faq, saving, onClose, onSave }: { faq: Faq; saving: boolean; onClose: () => void; onSave: (f: Faq) => void }) {
  const [form, setForm] = useState<Faq>(faq);
  return (
    <Modal
      open
      onClose={onClose}
      title={faq.id ? "Edit FAQ" : "New FAQ"}
      subtitle="Markdown supported in the answer field."
      size="lg"
      footer={
        <>
          <button onClick={onClose} className="rounded-xl bg-white/10 px-4 py-2 text-xs font-bold text-white">Cancel</button>
          <button onClick={() => onSave(form)} disabled={saving || !form.question.trim()} className="rounded-xl rb-gradient-primary px-4 py-2 text-xs font-bold text-white disabled:opacity-40">
            {saving ? "Saving…" : "Save FAQ"}
          </button>
        </>
      }
    >
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Category">
          <select className={selectCls} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
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
