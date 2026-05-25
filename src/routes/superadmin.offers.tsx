import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { PageHeader, Panel, DataTable, StatusPill, Pill } from "@/components/superadmin/AdminUI";
import { Modal, ConfirmDialog, Field, fieldCls, ThumbnailUploader, toast } from "@/components/superadmin/AdminActions";
import { fetchAdminBrands, type AdminBrandRecord } from "@/lib/admin-brands-api";
import {
  createAdminOffer,
  deleteAdminOffer,
  fetchAdminOffers,
  updateAdminOffer,
} from "@/lib/offers-api";
import { uploadMediaFile } from "@/lib/media-api";
import { type AdminOffer, type OfferCategory, type OfferTag } from "@/lib/admin-data";
import { OfferCard, OfferDetailModal } from "@/components/offers/OfferCard";
import { Plus, Edit3, Trash2, Search, Image as ImageIcon, FileText, Sparkles, Pin } from "lucide-react";

export const Route = createFileRoute("/superadmin/offers")({
  component: OffersAdmin,
});

const CATEGORIES: OfferCategory[] = ["Prop Firms", "Brokers", "Exchanges", "Tools", "Education"];
const TAGS: OfferTag[] = ["exclusive", "new", "limited", "trending", "free-account"];

const ACCENT_PRESETS: { name: string; from: string; to: string }[] = [
  { name: "Fuchsia -> Pink", from: "#a855f7", to: "#ec4899" },
  { name: "Cyan -> Blue", from: "#22d3ee", to: "#3b82f6" },
  { name: "Amber -> Red", from: "#f59e0b", to: "#ef4444" },
  { name: "Emerald -> Cyan", from: "#10b981", to: "#06b6d4" },
  { name: "Yellow -> Orange", from: "#fbbf24", to: "#f97316" },
  { name: "Sky -> Indigo", from: "#0ea5e9", to: "#6366f1" },
  { name: "Blue -> Violet", from: "#3b82f6", to: "#8b5cf6" },
];

function makeDraftId() {
  return `of_${Math.random().toString(36).slice(2, 10)}`;
}

const empty = (): AdminOffer => ({
  id: makeDraftId(),
  brand: "",
  category: "Prop Firms",
  title: "",
  description: "",
  discount: "",
  code: "",
  ctaUrl: "",
  startDate: new Date().toISOString().slice(0, 10),
  expires: "",
  limitedTime: false,
  status: "active",
  uses: 0,
  mode: "form",
  accentFrom: "#a855f7",
  accentTo: "#ec4899",
  tags: [],
});

function mapBrandCategoryToOfferCategory(category?: string): OfferCategory {
  switch (category) {
    case "Forex Broker":
      return "Brokers";
    case "Crypto Exchange":
      return "Exchanges";
    case "Trading Software":
    case "Trading Tool":
      return "Tools";
    case "Education Provider":
      return "Education";
    default:
      return "Prop Firms";
  }
}

function normalizeOffer(offer: AdminOffer): AdminOffer {
  return {
    ...offer,
    limitedTime:
      typeof offer.limitedTime === "boolean" ? offer.limitedTime : Boolean(offer.expires?.trim()),
  };
}

type LiveBrand = Pick<AdminBrandRecord, "id" | "name" | "category">;

function BrandPicker({
  brands,
  value,
  onPick,
  category,
}: {
  brands: LiveBrand[];
  value: string;
  onPick: (brand: { name: string; id?: string; category?: string }) => void;
  category?: OfferCategory;
}) {
  const [q, setQ] = useState(value);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setQ(value);
  }, [value]);

  const matches = useMemo(() => {
    const term = q.toLowerCase();
    return brands
      .filter((brand) => {
        const offerCategory = mapBrandCategoryToOfferCategory(brand.category);
        if (category && offerCategory !== category) return false;
        if (!term) return true;
        return brand.name.toLowerCase().includes(term);
      })
      .slice(0, 8);
  }, [brands, category, q]);

  return (
    <div className="relative">
      <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3">
        <Search className="h-3.5 w-3.5 text-white/50" />
        <input
          value={q}
          onChange={(e) => {
            const next = e.target.value;
            setQ(next);
            setOpen(true);
            onPick({ name: next });
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder="Search listed brands or type a custom name..."
          className="w-full bg-transparent py-2 text-sm text-white outline-none placeholder:text-white/40"
        />
      </div>
      {open && matches.length > 0 && (
        <div className="absolute z-10 mt-1 max-h-56 w-full overflow-auto rounded-xl border border-white/10 bg-[#150826] p-1 shadow-2xl">
          {matches.map((brand) => (
            <button
              key={brand.id}
              type="button"
              onMouseDown={() => {
                setQ(brand.name);
                onPick({ name: brand.name, id: brand.id, category: brand.category });
                setOpen(false);
              }}
              className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-xs text-white hover:bg-white/10"
            >
              <span className="font-semibold">{brand.name}</span>
              <span className="text-white/40">{brand.category}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function OffersAdmin() {
  const [items, setItems] = useState<AdminOffer[]>([]);
  const [brands, setBrands] = useState<LiveBrand[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<AdminOffer | null>(null);
  const [deleting, setDeleting] = useState<AdminOffer | null>(null);
  const [previewing, setPreviewing] = useState<AdminOffer | null>(null);
  const [filter, setFilter] = useState<"all" | OfferCategory>("all");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [offers, liveBrands] = await Promise.all([
          fetchAdminOffers(),
          fetchAdminBrands(),
        ]);
        if (cancelled) return;
        setItems(offers.map(normalizeOffer));
        setBrands(liveBrands.map((brand) => ({
          id: brand.id,
          name: brand.name,
          category: brand.category,
        })));
      } catch (ex) {
        if (!cancelled) {
          toast.error(ex instanceof Error ? ex.message : "Unable to load offers");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = filter === "all" ? items : items.filter((offer) => offer.category === filter);
  const isLimitedOffer = Boolean(editing?.limitedTime || editing?.tags?.includes("limited"));

  const toggleTag = (tag: OfferTag) => {
    if (!editing) return;
    const tags = editing.tags ?? [];
    const nextTags = tags.includes(tag) ? tags.filter((item) => item !== tag) : [...tags, tag];
    setEditing({
      ...editing,
      tags: nextTags,
      limitedTime: tag === "limited" ? nextTags.includes("limited") || editing.limitedTime : editing.limitedTime,
      expires:
        tag === "limited" && !nextTags.includes("limited") && !editing.limitedTime
          ? ""
          : editing.expires,
    });
  };

  async function uploadFlyer(file: File) {
    const uploaded = await uploadMediaFile(file, {
      folder: "offers/flyers",
      prefix: editing?.brandId || editing?.brand || "offer",
    });
    return uploaded.url;
  }

  async function saveOffer() {
    if (!editing) return;
    if (!editing.brand.trim() || !editing.title.trim()) {
      toast.error("Brand and title are required");
      return;
    }
    if (editing.mode === "flyer" && !editing.flyerUrl) {
      toast.error("Upload a flyer image");
      return;
    }

    setSaving(true);
    try {
      const payload: Partial<AdminOffer> = {
        ...editing,
        limitedTime: isLimitedOffer,
        expires: isLimitedOffer ? editing.expires : "",
        createdAt: editing.createdAt || new Date().toISOString().slice(0, 10),
      };
      const exists = items.some((item) => item.id === editing.id);
      const saved = exists
        ? await updateAdminOffer(editing.id, payload)
        : await createAdminOffer(payload);

      const normalized = normalizeOffer(saved);
      setItems((current) => {
        if (exists) return current.map((item) => (item.id === normalized.id ? normalized : item));
        return [normalized, ...current];
      });
      toast.success(exists ? "Offer updated" : "Offer created and synced live");
      setEditing(null);
    } catch (ex) {
      toast.error(ex instanceof Error ? ex.message : "Unable to save offer");
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(offer: AdminOffer) {
    try {
      const saved = await updateAdminOffer(offer.id, {
        status: offer.status === "active" ? "paused" : "active",
      });
      setItems((current) => current.map((item) => (item.id === saved.id ? saved : item)));
      toast.success(`Set to ${saved.status}`);
    } catch (ex) {
      toast.error(ex instanceof Error ? ex.message : "Unable to update status");
    }
  }

  return (
    <div>
      <PageHeader
        title="Offers & Promos"
        subtitle="Sync brand discounts, exclusive deals and limited-time promos across the public site and dashboard."
        actions={
          <button
            onClick={() => setEditing(empty())}
            className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-600 px-3 py-1.5 text-xs font-semibold text-white"
          >
            <Plus className="h-3.5 w-3.5" /> New offer
          </button>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-1.5">
        <button onClick={() => setFilter("all")} className={`rounded-full px-3 py-1 text-xs font-semibold ${filter === "all" ? "bg-white/15 text-white" : "bg-white/5 text-white/60"}`}>All ({items.length})</button>
        {CATEGORIES.map((category) => (
          <button key={category} onClick={() => setFilter(category)} className={`rounded-full px-3 py-1 text-xs font-semibold ${filter === category ? "bg-white/15 text-white" : "bg-white/5 text-white/60"}`}>
            {category} ({items.filter((offer) => offer.category === category).length})
          </button>
        ))}
      </div>

      <Panel title={`Offers - ${filtered.length}`}>
        <DataTable head={<><th>Brand</th><th>Title</th><th>Category</th><th>Mode</th><th>Code</th><th>Uses</th><th>Status</th><th>Expires</th><th></th></>}>
          {filtered.map((offer) => (
            <tr key={offer.id}>
              <td className="font-semibold">
                <span className="inline-flex items-center gap-1">
                  {offer.pinned && <Pin className="h-3 w-3 text-amber-300" />}
                  {offer.brand}
                </span>
              </td>
              <td>{offer.title}</td>
              <td><Pill tone="neutral">{offer.category}</Pill></td>
              <td>
                {offer.mode === "flyer" ? (
                  <span className="inline-flex items-center gap-1 text-xs text-cyan-300"><ImageIcon className="h-3 w-3" /> Flyer</span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs text-fuchsia-300"><FileText className="h-3 w-3" /> Card</span>
                )}
              </td>
              <td className="font-mono text-xs text-fuchsia-300">{offer.code || "-"}</td>
              <td className="font-mono">{offer.uses}</td>
              <td>
                <button onClick={() => void toggleStatus(offer)}>
                  <StatusPill status={offer.status} />
                </button>
              </td>
              <td className="text-xs text-muted-foreground">{offer.expires || "-"}</td>
              <td className="text-right">
                <div className="flex justify-end gap-1">
                  <button onClick={() => setPreviewing(normalizeOffer(offer))} className="rounded-md bg-cyan-500/15 px-2 py-1 text-xs font-bold text-cyan-200">Preview</button>
                  <button onClick={() => setEditing(normalizeOffer(offer))} className="rounded-md bg-white/10 px-2 py-1"><Edit3 className="h-3 w-3 text-white" /></button>
                  <button onClick={() => setDeleting(offer)} className="rounded-md bg-rose-500/15 px-2 py-1"><Trash2 className="h-3 w-3 text-rose-300" /></button>
                </div>
              </td>
            </tr>
          ))}
          {loading && <tr><td colSpan={9} className="py-8 text-center text-sm text-muted-foreground">Loading offers...</td></tr>}
          {!loading && filtered.length === 0 && <tr><td colSpan={9} className="py-8 text-center text-sm text-muted-foreground">No offers in this category yet.</td></tr>}
        </DataTable>
      </Panel>

      {editing && (
        <Modal
          open
          onClose={() => setEditing(null)}
          title={items.some((item) => item.id === editing.id) ? "Edit offer" : "New offer"}
          size="lg"
          footer={
            <>
              <button onClick={() => setEditing(null)} className="rounded-xl bg-white/10 px-4 py-2 text-xs font-bold text-white">Cancel</button>
              <button onClick={() => setPreviewing(editing)} className="rounded-xl bg-cyan-500/20 px-4 py-2 text-xs font-bold text-cyan-200">Preview</button>
              <button onClick={() => void saveOffer()} disabled={saving} className="rounded-xl bg-gradient-to-r from-fuchsia-500 to-violet-600 px-4 py-2 text-xs font-bold text-white disabled:opacity-60">
                {saving ? "Saving..." : "Save & sync"}
              </button>
            </>
          }
        >
          <div className="space-y-4">
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
                  brands={brands}
                  value={editing.brand}
                  category={editing.category}
                  onPick={({ name, id, category }) =>
                    setEditing({
                      ...editing,
                      brand: name,
                      brandId: id,
                      category: category ? mapBrandCategoryToOfferCategory(category) : editing.category,
                    })}
                />
              </Field>
              <Field label="Category">
                <select className={fieldCls} value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value as OfferCategory })}>
                  {CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}
                </select>
              </Field>
              <Field label="Offer title" span={2}>
                <input className={fieldCls} value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} placeholder="20% OFF all accounts" />
              </Field>
              <Field label="Description" span={2}>
                <textarea rows={3} className={fieldCls} value={editing.description ?? ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} placeholder="Short description users will see..." />
              </Field>

              {editing.mode === "flyer" ? (
                <Field label="Flyer image" span={2}>
                  <ThumbnailUploader
                    value={editing.flyerUrl}
                    onChange={(url) => setEditing({ ...editing, flyerUrl: url })}
                    onSelectFile={uploadFlyer}
                    label="Upload promo flyer"
                    height="h-48"
                  />
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
                      {ACCENT_PRESETS.map((preset) => (
                        <button key={preset.name} type="button" onClick={() => setEditing({ ...editing, accentFrom: preset.from, accentTo: preset.to })}
                          className={`h-8 w-8 rounded-lg ring-2 ${editing.accentFrom === preset.from ? "ring-white" : "ring-transparent"}`}
                          style={{ background: `linear-gradient(135deg, ${preset.from}, ${preset.to})` }}
                          title={preset.name}
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
              <Field label="Offer duration">
                <label className="flex h-9 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 text-xs text-white">
                  <input
                    type="checkbox"
                    checked={isLimitedOffer}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        limitedTime: e.target.checked,
                        expires: e.target.checked || editing.tags?.includes("limited") ? editing.expires : "",
                      })
                    }
                  />
                  Limited-time offer
                </label>
              </Field>
              {isLimitedOffer && (
                <Field label="Expires (label)" span={2}>
                  <input
                    type="date"
                    className={fieldCls}
                    value={editing.expires}
                    onChange={(e) => setEditing({ ...editing, expires: e.target.value })}
                  />
                </Field>
              )}

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
                  {TAGS.map((tag) => {
                    const active = editing.tags?.includes(tag);
                    return (
                      <button key={tag} type="button" onClick={() => toggleTag(tag)}
                        className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${active ? "bg-fuchsia-500/30 text-fuchsia-100 ring-1 ring-fuchsia-400/50" : "bg-white/5 text-white/60"}`}>
                        {tag}
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
        onConfirm={async () => {
          if (!deleting) return;
          try {
            await deleteAdminOffer(deleting.id);
            setItems((current) => current.filter((item) => item.id !== deleting.id));
            toast.success("Offer deleted");
          } catch (ex) {
            toast.error(ex instanceof Error ? ex.message : "Unable to delete offer");
          }
        }}
        title="Delete offer?"
        message={`"${deleting?.title}" will be removed everywhere.`}
        confirmText="Delete"
      />

      <OfferDetailModal offer={previewing} onClose={() => setPreviewing(null)} />
    </div>
  );
}
