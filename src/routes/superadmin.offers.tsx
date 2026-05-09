import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader, Panel, DataTable, StatusPill, Pill } from "@/components/superadmin/AdminUI";
import { Modal, ConfirmDialog, Field, fieldCls, ThumbnailUploader, toast } from "@/components/superadmin/AdminActions";
import { useAdminCollection, newId } from "@/lib/admin-store";
import { offers as seed, adminBrands, type AdminOffer, type OfferCategory, type OfferTag } from "@/lib/admin-data";
import { OfferCard, OfferDetailModal } from "@/components/offers/OfferCard";
import { Plus, Edit3, Trash2, Search, Image as ImageIcon, FileText, Sparkles, Pin } from "lucide-react";

export const Route = createFileRoute("/superadmin/offers")({
  component: OffersAdmin,
});

const CATEGORIES: OfferCategory[] = ["Prop Firms", "Brokers", "Exchanges", "Tools", "Education"];
const TAGS: OfferTag[] = ["exclusive", "new", "limited", "trending", "free-account"];

const ACCENT_PRESETS: { name: string; from: string; to: string }[] = [
  { name: "Fuchsia → Pink", from: "#a855f7", to: "#ec4899" },
  { name: "Cyan → Blue", from: "#22d3ee", to: "#3b82f6" },
  { name: "Amber → Red", from: "#f59e0b", to: "#ef4444" },
  { name: "Emerald → Cyan", from: "#10b981", to: "#06b6d4" },
  { name: "Yellow → Orange", from: "#fbbf24", to: "#f97316" },
  { name: "Sky → Indigo", from: "#0ea5e9", to: "#6366f1" },
  { name: "Blue → Violet", from: "#3b82f6", to: "#8b5cf6" },
];

const empty = (): AdminOffer => ({
  id: newId("of"),
  brand: "",
  category: "Prop Firms",
  title: "",
  description: "",
  discount: "",
  code: "",
  ctaUrl: "",
  startDate: new Date().toISOString().slice(0, 10),
  expires: "",
  status: "active",
  uses: 0,
  mode: "form",
  accentFrom: "#a855f7",
  accentTo: "#ec4899",
  tags: [],
});

function BrandPicker({ value, onPick, category }: { value: string; onPick: (name: string, id?: string) => void; category?: OfferCategory }) {
  const [q, setQ] = useState(value);
  const [open, setOpen] = useState(false);

  const matches = useMemo(() => {
    const term = q.toLowerCase();
    return adminBrands
      .filter((b) => {
        if (!term) return true;
        return b.name.toLowerCase().includes(term);
      })
      .slice(0, 8);
  }, [q]);

  return (
    <div className="relative">
      <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3">
        <Search className="h-3.5 w-3.5 text-white/50" />
        <input
          value={q}
          onChange={(e) => { setQ(e.target.value); setOpen(true); onPick(e.target.value); }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder="Search listed brands or type a custom name…"
          className="w-full bg-transparent py-2 text-sm text-white outline-none placeholder:text-white/40"
        />
      </div>
      {open && matches.length > 0 && (
        <div className="absolute z-10 mt-1 max-h-56 w-full overflow-auto rounded-xl border border-white/10 bg-[#150826] p-1 shadow-2xl">
          {matches.map((b) => (
            <button
              key={b.id}
              type="button"
              onMouseDown={() => { setQ(b.name); onPick(b.name, b.id); setOpen(false); }}
              className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-xs text-white hover:bg-white/10"
            >
              <span className="font-semibold">{b.name}</span>
              <span className="text-white/40">{b.category}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function OffersAdmin() {
  const { items, add, update, remove } = useAdminCollection<AdminOffer>("offers", seed);
  const [editing, setEditing] = useState<AdminOffer | null>(null);
  const [deleting, setDeleting] = useState<AdminOffer | null>(null);
  const [previewing, setPreviewing] = useState<AdminOffer | null>(null);
  const [filter, setFilter] = useState<"all" | OfferCategory>("all");

  const filtered = filter === "all" ? items : items.filter((o) => o.category === filter);

  const toggleTag = (tag: OfferTag) => {
    if (!editing) return;
    const tags = editing.tags ?? [];
    setEditing({ ...editing, tags: tags.includes(tag) ? tags.filter((t) => t !== tag) : [...tags, tag] });
  };

  return (
    <div>
      <PageHeader
        title="Offers & Promos"
        subtitle="Sync brand discounts, exclusive deals and limited-time promos across the public site and dashboard."
        actions={
          <button onClick={() => setEditing(empty())} className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-600 px-3 py-1.5 text-xs font-semibold text-white"><Plus className="h-3.5 w-3.5" /> New offer</button>
        }
      />

      {/* Category filter */}
      <div className="mb-4 flex flex-wrap items-center gap-1.5">
        <button onClick={() => setFilter("all")} className={`rounded-full px-3 py-1 text-xs font-semibold ${filter === "all" ? "bg-white/15 text-white" : "bg-white/5 text-white/60"}`}>All ({items.length})</button>
        {CATEGORIES.map((c) => (
          <button key={c} onClick={() => setFilter(c)} className={`rounded-full px-3 py-1 text-xs font-semibold ${filter === c ? "bg-white/15 text-white" : "bg-white/5 text-white/60"}`}>
            {c} ({items.filter((o) => o.category === c).length})
          </button>
        ))}
      </div>

      <Panel title={`Offers — ${filtered.length}`}>
        <DataTable head={<><th>Brand</th><th>Title</th><th>Category</th><th>Mode</th><th>Code</th><th>Uses</th><th>Status</th><th>Expires</th><th></th></>}>
          {filtered.map((o) => (
            <tr key={o.id}>
              <td className="font-semibold">
                <span className="inline-flex items-center gap-1">
                  {o.pinned && <Pin className="h-3 w-3 text-amber-300" />}
                  {o.brand}
                </span>
              </td>
              <td>{o.title}</td>
              <td><Pill tone="neutral">{o.category}</Pill></td>
              <td>
                {o.mode === "flyer" ? (
                  <span className="inline-flex items-center gap-1 text-xs text-cyan-300"><ImageIcon className="h-3 w-3" /> Flyer</span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs text-fuchsia-300"><FileText className="h-3 w-3" /> Card</span>
                )}
              </td>
              <td className="font-mono text-xs text-fuchsia-300">{o.code || "—"}</td>
              <td className="font-mono">{o.uses}</td>
              <td>
                <button onClick={() => { update(o.id, { status: o.status === "active" ? "paused" : "active" }); toast.success(`Set to ${o.status === "active" ? "paused" : "active"}`); }}>
                  <StatusPill status={o.status} />
                </button>
              </td>
              <td className="text-xs text-muted-foreground">{o.expires || "—"}</td>
              <td className="text-right">
                <div className="flex justify-end gap-1">
                  <button onClick={() => setPreviewing(o)} className="rounded-md bg-cyan-500/15 px-2 py-1 text-xs font-bold text-cyan-200">Preview</button>
                  <button onClick={() => setEditing(o)} className="rounded-md bg-white/10 px-2 py-1"><Edit3 className="h-3 w-3 text-white" /></button>
                  <button onClick={() => setDeleting(o)} className="rounded-md bg-rose-500/15 px-2 py-1"><Trash2 className="h-3 w-3 text-rose-300" /></button>
                </div>
              </td>
            </tr>
          ))}
          {filtered.length === 0 && <tr><td colSpan={9} className="py-8 text-center text-sm text-muted-foreground">No offers in this category yet.</td></tr>}
        </DataTable>
      </Panel>

      {/* Editor */}
      {editing && (
        <Modal open onClose={() => setEditing(null)} title={items.some((x) => x.id === editing.id) ? "Edit offer" : "New offer"} size="lg"
          footer={<>
            <button onClick={() => setEditing(null)} className="rounded-xl bg-white/10 px-4 py-2 text-xs font-bold text-white">Cancel</button>
            <button onClick={() => setPreviewing(editing)} className="rounded-xl bg-cyan-500/20 px-4 py-2 text-xs font-bold text-cyan-200">Preview</button>
            <button onClick={() => {
              if (!editing.brand.trim() || !editing.title.trim()) { toast.error("Brand and title are required"); return; }
              if (editing.mode === "flyer" && !editing.flyerUrl) { toast.error("Upload a flyer image"); return; }
              const exists = items.some((x) => x.id === editing.id);
              if (exists) update(editing.id, editing); else add({ ...editing, createdAt: new Date().toISOString().slice(0, 10) });
              toast.success(exists ? "Offer updated" : "Offer created — synced to dashboard & public page"); setEditing(null);
            }} className="rounded-xl bg-gradient-to-r from-fuchsia-500 to-violet-600 px-4 py-2 text-xs font-bold text-white">Save & sync</button>
          </>}
        >
          <div className="space-y-4">
            {/* Mode toggle */}
            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <label className="mb-2 block text-[10px] uppercase tracking-wider text-white/50">Posting mode</label>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setEditing({ ...editing, mode: "form" })}
                  className={`flex items-center gap-2 rounded-xl border p-3 text-left text-xs ${editing.mode === "form" ? "border-fuchsia-400/60 bg-fuchsia-500/10 text-white" : "border-white/10 bg-white/0 text-white/60"}`}>
                  <FileText className="h-4 w-4" />
                  <div>
                    <div className="font-bold">Structured card</div>
                    <div className="text-[10px] text-white/50">Auto-styled, branded card</div>
                  </div>
                </button>
                <button type="button" onClick={() => setEditing({ ...editing, mode: "flyer" })}
                  className={`flex items-center gap-2 rounded-xl border p-3 text-left text-xs ${editing.mode === "flyer" ? "border-cyan-400/60 bg-cyan-500/10 text-white" : "border-white/10 bg-white/0 text-white/60"}`}>
                  <ImageIcon className="h-4 w-4" />
                  <div>
                    <div className="font-bold">Flyer image</div>
                    <div className="text-[10px] text-white/50">Upload a designed promo poster</div>
                  </div>
                </button>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <Field label="Brand (search listed or type custom)">
                <BrandPicker
                  value={editing.brand}
                  onPick={(name, id) => setEditing({ ...editing, brand: name, brandId: id })}
                />
              </Field>
              <Field label="Category">
                <select className={fieldCls} value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value as OfferCategory })}>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>
              <Field label="Offer title" span={2}>
                <input className={fieldCls} value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} placeholder="20% OFF all accounts" />
              </Field>
              <Field label="Description" span={2}>
                <textarea rows={3} className={fieldCls} value={editing.description ?? ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} placeholder="Short description users will see…" />
              </Field>

              {editing.mode === "flyer" ? (
                <Field label="Flyer image" span={2}>
                  <ThumbnailUploader value={editing.flyerUrl} onChange={(url) => setEditing({ ...editing, flyerUrl: url })} label="Upload promo flyer" height="h-48" />
                </Field>
              ) : (
                <>
                  <Field label="Discount label">
                    <input className={fieldCls} value={editing.discount ?? ""} onChange={(e) => setEditing({ ...editing, discount: e.target.value })} placeholder="20% OFF" />
                  </Field>
                  <Field label="Promo code">
                    <input className={fieldCls} value={editing.code ?? ""} onChange={(e) => setEditing({ ...editing, code: e.target.value })} placeholder="MATCH" />
                  </Field>
                  <Field label="Card accent" span={2}>
                    <div className="flex flex-wrap gap-1.5">
                      {ACCENT_PRESETS.map((p) => (
                        <button key={p.name} type="button" onClick={() => setEditing({ ...editing, accentFrom: p.from, accentTo: p.to })}
                          className={`h-8 w-8 rounded-lg ring-2 ${editing.accentFrom === p.from ? "ring-white" : "ring-transparent"}`}
                          style={{ background: `linear-gradient(135deg, ${p.from}, ${p.to})` }}
                          title={p.name}
                        />
                      ))}
                    </div>
                  </Field>
                </>
              )}

              <Field label="Apply / CTA URL" span={2}>
                <input className={fieldCls} value={editing.ctaUrl ?? ""} onChange={(e) => setEditing({ ...editing, ctaUrl: e.target.value })} placeholder="https://brand.com/?ref=rebateboard" />
              </Field>

              <Field label="Start date">
                <input type="date" className={fieldCls} value={editing.startDate ?? ""} onChange={(e) => setEditing({ ...editing, startDate: e.target.value })} />
              </Field>
              <Field label="Expires (label)">
                <input className={fieldCls} value={editing.expires} onChange={(e) => setEditing({ ...editing, expires: e.target.value })} placeholder="May 30" />
              </Field>

              <Field label="Status">
                <select className={fieldCls} value={editing.status} onChange={(e) => setEditing({ ...editing, status: e.target.value as AdminOffer["status"] })}>
                  <option value="active">active</option>
                  <option value="paused">paused</option>
                  <option value="expired">expired</option>
                </select>
              </Field>
              <Field label="Pin to top">
                <label className="flex h-9 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 text-xs text-white">
                  <input type="checkbox" checked={!!editing.pinned} onChange={(e) => setEditing({ ...editing, pinned: e.target.checked })} />
                  Featured / pinned
                </label>
              </Field>

              <Field label="Tags" span={2}>
                <div className="flex flex-wrap gap-1.5">
                  {TAGS.map((t) => {
                    const active = editing.tags?.includes(t);
                    return (
                      <button key={t} type="button" onClick={() => toggleTag(t)}
                        className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${active ? "bg-fuchsia-500/30 text-fuchsia-100 ring-1 ring-fuchsia-400/50" : "bg-white/5 text-white/60"}`}>
                        {t}
                      </button>
                    );
                  })}
                </div>
              </Field>

              <Field label="Terms & conditions" span={2}>
                <textarea rows={2} className={fieldCls} value={editing.terms ?? ""} onChange={(e) => setEditing({ ...editing, terms: e.target.value })} placeholder="First order only, new accounts, etc." />
              </Field>
            </div>

            <div className="rounded-xl border border-white/10 bg-black/30 p-4">
              <div className="mb-2 flex items-center gap-2 text-[11px] uppercase tracking-wider text-white/50">
                <Sparkles className="h-3 w-3 text-fuchsia-400" /> Live preview
              </div>
              <OfferCard offer={editing} />
            </div>
          </div>
        </Modal>
      )}

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => { if (deleting) { remove(deleting.id); toast.success("Offer deleted"); } }}
        title="Delete offer?"
        message={`"${deleting?.title}" will be removed everywhere.`}
        confirmText="Delete"
      />

      <OfferDetailModal offer={previewing} onClose={() => setPreviewing(null)} />
    </div>
  );
}
