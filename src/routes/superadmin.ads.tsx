import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Plus, Trash2, Save, Eye, MousePointerClick, Power, X, Megaphone, Sparkles, Flame, RefreshCw, Image,
} from "lucide-react";
import { PageHeader, Panel, StatCard } from "@/components/superadmin/AdminUI";
import { toast } from "@/components/superadmin/AdminActions";
import { advertApi, adminBrandApi, blogApi, type DashboardAd, type BlogPost, type AdminBrand } from "@/lib/admin-api";
import type { AdFormat, AdPlacement, AdSlide, SponsorLogo } from "@/lib/dashboard-ads";
import { useAuth } from "@/lib/auth";
import { ApiError } from "@/lib/api";

export const Route = createFileRoute("/superadmin/ads")({
  head: () => ({ meta: [{ title: "Dashboard Ads — Superadmin" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: AdsPage,
});

const FORMATS: { value: AdFormat; label: string; icon: typeof Megaphone; hint: string }[] = [
  { value: "marquee", label: "Sliding text", icon: Megaphone, hint: "One-line scrolling promo" },
  { value: "single", label: "Single banner", icon: Sparkles, hint: "Headline + CTA" },
  { value: "carousel", label: "Multi-brand", icon: Flame, hint: "2–5 brand strip" },
  { value: "trending", label: "Auto trending", icon: Flame, hint: "Top TBI brands" },
];

const PLACEMENTS: { value: AdPlacement; label: string; hint: string }[] = [
  { value: "dashboard", label: "User dashboard", hint: "Top of every dashboard page" },
  { value: "landing-hero", label: "Landing · Hero card", hint: "4-slide rotating card on landing hero" },
  { value: "landing-sponsors", label: "Landing · Sponsors strip", hint: "Logo row under the hero headline" },
  { value: "landing-advertise", label: "Landing · Advertise box", hint: "Promo box near the cashback calculator" },
];

type CreateDraft = {
  name: string;
  thumbnail: string;
  placement: AdPlacement;
  format: AdFormat;
};

function emptyAd(draft: CreateDraft): DashboardAd {
  return {
    id: "",
    name: draft.name,
    format: draft.format,
    placement: draft.placement,
    active: true,
    priority: 1,
    headline: draft.name,
    sub: "",
    cta: "Learn more",
    href: "/dashboard/wallet",
    accent: "from-fuchsia-500 to-violet-600",
    thumbnail: draft.thumbnail,
    slides: [],
    sponsors: [],
    trendingLimit: 5,
    impressions: 0,
    clicks: 0,
    createdAt: new Date().toISOString(),
  };
}

function AdsPage() {
  const { token } = useAuth();
  const [ads, setAds] = useState<DashboardAd[]>([]);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [brands, setBrands] = useState<AdminBrand[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createDraft, setCreateDraft] = useState<CreateDraft>({ name: "", thumbnail: "", placement: "dashboard", format: "single" });

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [adsRes, blogRes, brandsRes] = await Promise.all([
        advertApi.list(token),
        blogApi.list(token),
        adminBrandApi.list(token),
      ]);
      if (adsRes.payload) setAds(adsRes.payload.page);
      if (blogRes.payload) setBlogPosts(blogRes.payload.page);
      if (brandsRes.payload) setBrands(brandsRes.payload);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Failed to load ads");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const editing = useMemo(() => ads.find((a) => a.id === editingId) ?? null, [ads, editingId]);

  const totalImpressions = ads.reduce((s, a) => s + a.impressions, 0);
  const totalClicks = ads.reduce((s, a) => s + a.clicks, 0);
  const ctr = totalImpressions ? ((totalClicks / totalImpressions) * 100).toFixed(2) : "0.00";
  const activeCount = ads.filter((a) => a.active).length;

  const openCreateForm = () => {
    setCreateDraft({ name: "", thumbnail: "", placement: "dashboard", format: "single" });
    setShowCreateForm(true);
    setEditingId(null);
  };

  const create = async () => {
    if (!token) return;
    if (!createDraft.name.trim()) { toast.error("Banner name is required"); return; }
    if (!createDraft.thumbnail.trim()) { toast.error("Thumbnail is required"); return; }
    setSaving(true);
    try {
      const ad = emptyAd(createDraft);
      const res = await advertApi.create(token, ad);
      if (res.payload) {
        setAds((prev) => [...prev, res.payload!]);
        setEditingId(res.payload.id);
        setShowCreateForm(false);
        toast.success("Banner created — now configure it in the editor");
      }
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Failed to create banner");
    } finally {
      setSaving(false);
    }
  };

  const save = async (ad: DashboardAd) => {
    if (!token) return;
    setSaving(true);
    try {
      const res = await advertApi.update(token, ad.id, ad);
      if (res.payload) {
        setAds((prev) => prev.map((a) => a.id === ad.id ? res.payload! : a));
        toast.success("Ad saved — live on user dashboards");
      }
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!token) return;
    try {
      await advertApi.remove(token, id);
      setAds((prev) => prev.filter((a) => a.id !== id));
      if (editingId === id) setEditingId(null);
      toast.success("Ad deleted");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Delete failed");
    }
  };

  const toggle = async (ad: DashboardAd) => {
    if (!token) return;
    try {
      const res = await advertApi.update(token, ad.id, { ...ad, active: !ad.active });
      if (res.payload) setAds((prev) => prev.map((a) => a.id === ad.id ? res.payload! : a));
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Toggle failed");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard Ads"
        subtitle="Banners shown on top of every user dashboard page. Schedule, prioritize, and track performance."
        actions={
          <div className="flex gap-2">
            <button onClick={load} className="grid h-7 w-7 place-items-center rounded-md bg-white/5 text-white ring-1 ring-white/10">
              <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
            </button>
            <button onClick={openCreateForm} className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-600 px-4 py-2 text-xs font-semibold text-white shadow-[0_0_24px_rgba(192,132,252,0.45)]">
              <Plus className="h-3.5 w-3.5" /> New banner
            </button>
          </div>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total banners" value={ads.length.toString()} delta="created" />
        <StatCard label="Active now" value={activeCount.toString()} delta="visible to users" />
        <StatCard label="Impressions" value={totalImpressions.toLocaleString()} delta="all-time" />
        <StatCard label="CTR" value={`${ctr}%`} delta={`${totalClicks.toLocaleString()} clicks`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.1fr]">
        <Panel title="All banners">
          {loading && <div className="py-8 text-center text-sm text-muted-foreground">Loading…</div>}
          <div className="space-y-2">
            {!loading && ads.length === 0 && (
              <div className="rounded-xl border border-dashed border-white/10 p-6 text-center text-xs text-muted-foreground">
                No banners yet. Click "New banner" to create one.
              </div>
            )}
            {ads.slice().sort((a, b) => b.priority - a.priority).map((ad) => {
              const ctrAd = ad.impressions ? ((ad.clicks / ad.impressions) * 100).toFixed(1) : "0.0";
              return (
                <button key={ad.id} onClick={() => { setEditingId(ad.id); setShowCreateForm(false); }}
                  className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition ${editingId === ad.id ? "border-fuchsia-400/40 bg-white/[0.07]" : "border-white/5 bg-white/[0.02] hover:bg-white/[0.05]"}`}
                >
                  <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-gradient-to-br ${ad.accent ?? "from-fuchsia-500 to-violet-600"} overflow-hidden`}>
                    {ad.thumbnail ? (
                      <img src={ad.thumbnail} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <FormatIcon format={ad.format} />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <div className="truncate text-sm font-semibold text-white">{ad.name}</div>
                      <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase ${ad.active ? "bg-emerald-500/20 text-emerald-300" : "bg-white/10 text-muted-foreground"}`}>
                        {ad.active ? "Live" : "Off"}
                      </span>
                    </div>
                    <div className="mt-0.5 flex items-center gap-3 text-[10px] text-muted-foreground">
                      <span>{ad.format}</span>
                      <span>P{ad.priority}</span>
                      <span className="inline-flex items-center gap-1"><Eye className="h-2.5 w-2.5" /> {ad.impressions}</span>
                      <span className="inline-flex items-center gap-1"><MousePointerClick className="h-2.5 w-2.5" /> {ad.clicks}</span>
                      <span>CTR {ctrAd}%</span>
                    </div>
                  </div>
                  <div role="button" tabIndex={0} onClick={(e) => { e.stopPropagation(); toggle(ad); }} onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); toggle(ad); } }}
                    className={`grid h-7 w-7 place-items-center rounded-full ${ad.active ? "bg-emerald-500/20 text-emerald-300" : "bg-white/10 text-muted-foreground"} hover:opacity-80`}
                    aria-label="Toggle active"
                  >
                    <Power className="h-3 w-3" />
                  </div>
                  <div role="button" tabIndex={0} onClick={(e) => { e.stopPropagation(); remove(ad.id); }} onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); remove(ad.id); } }}
                    className="grid h-7 w-7 place-items-center rounded-full bg-white/10 text-muted-foreground hover:bg-rose-500/20 hover:text-rose-300"
                    aria-label="Delete"
                  >
                    <Trash2 className="h-3 w-3" />
                  </div>
                </button>
              );
            })}
          </div>
        </Panel>

        <Panel title={showCreateForm ? "New banner" : editing ? `Edit · ${editing.name}` : "Editor"}>
          {showCreateForm ? (
            <CreateForm
              draft={createDraft}
              saving={saving}
              onChange={setCreateDraft}
              onCreate={create}
              onCancel={() => setShowCreateForm(false)}
            />
          ) : editing ? (
            <Editor key={editing.id} ad={editing} blogPosts={blogPosts} brands={brands} saving={saving} onSave={save} onClose={() => setEditingId(null)} />
          ) : (
            <div className="rounded-xl border border-dashed border-white/10 p-8 text-center text-xs text-muted-foreground">
              Select a banner on the left or click "New banner" to create one.
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}

function CreateForm({ draft, saving, onChange, onCreate, onCancel }: {
  draft: CreateDraft;
  saving: boolean;
  onChange: (d: CreateDraft) => void;
  onCreate: () => void;
  onCancel: () => void;
}) {
  const set = <K extends keyof CreateDraft>(k: K, v: CreateDraft[K]) => onChange({ ...draft, [k]: v });

  return (
    <div className="space-y-4">
      <Field label="Banner name *">
        <input
          autoFocus
          className={inputCls}
          placeholder="e.g. FTMO Spring Promo"
          value={draft.name}
          onChange={(e) => set("name", e.target.value)}
        />
      </Field>

      <Field label="Thumbnail *">
        <div className="flex gap-2">
          <input
            className={inputCls}
            placeholder="Paste image URL"
            value={draft.thumbnail}
            onChange={(e) => set("thumbnail", e.target.value)}
          />
          {draft.thumbnail && (
            <img src={draft.thumbnail} alt="" className="h-10 w-10 shrink-0 rounded-lg object-cover ring-1 ring-white/10" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
          )}
        </div>
        {!draft.thumbnail && (
          <div className="mt-1.5 flex h-10 w-10 items-center justify-center rounded-lg bg-white/5 ring-1 ring-dashed ring-white/10">
            <Image className="h-4 w-4 text-muted-foreground" />
          </div>
        )}
      </Field>

      <Field label="Placement">
        <select className={inputCls} value={draft.placement} onChange={(e) => set("placement", e.target.value as AdPlacement)}>
          {PLACEMENTS.map((p) => <option key={p.value} value={p.value}>{p.label} — {p.hint}</option>)}
        </select>
      </Field>

      <Field label="Format">
        <select className={inputCls} value={draft.format} onChange={(e) => set("format", e.target.value as AdFormat)}>
          {FORMATS.map((f) => <option key={f.value} value={f.value}>{f.label} — {f.hint}</option>)}
        </select>
      </Field>

      <div className="flex items-center gap-2 pt-2">
        <button onClick={onCreate} disabled={saving || !draft.name.trim() || !draft.thumbnail.trim()}
          className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-600 px-4 py-2 text-xs font-semibold text-white shadow-[0_0_24px_rgba(192,132,252,0.45)] disabled:opacity-40">
          <Plus className="h-3.5 w-3.5" /> {saving ? "Creating…" : "Create banner"}
        </button>
        <button onClick={onCancel} className="rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-white hover:bg-white/15">Cancel</button>
      </div>
    </div>
  );
}

function FormatIcon({ format }: { format: AdFormat }) {
  const f = FORMATS.find((x) => x.value === format);
  const Icon = f?.icon ?? Megaphone;
  return <Icon className="h-4 w-4 text-white" />;
}

function Editor({ ad, blogPosts, brands, saving, onSave, onClose }: {
  ad: DashboardAd;
  blogPosts: BlogPost[];
  brands: AdminBrand[];
  saving: boolean;
  onSave: (ad: DashboardAd) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<DashboardAd>(ad);
  useEffect(() => setDraft(ad), [ad]);

  const set = <K extends keyof DashboardAd>(k: K, v: DashboardAd[K]) => setDraft((d) => ({ ...d, [k]: v }));

  const addSlide = () => set("slides", [...(draft.slides ?? []), { source: "template", label: "New slide", sub: "", href: "/payouts/ftmo", accent: "from-fuchsia-500 to-violet-600" }]);
  const updateSlide = (i: number, patch: Partial<AdSlide>) => set("slides", (draft.slides ?? []).map((s, idx) => idx === i ? { ...s, ...patch } : s));
  const removeSlide = (i: number) => set("slides", (draft.slides ?? []).filter((_, idx) => idx !== i));

  const addSponsor = () => set("sponsors", [...(draft.sponsors ?? []), { id: `sp-${Math.random().toString(36).slice(2, 8)}`, name: "Brand", initial: "B", color: "from-fuchsia-500 to-violet-600", href: "/", tag: "sponsor" }]);
  const updateSponsor = (i: number, patch: Partial<SponsorLogo>) => set("sponsors", (draft.sponsors ?? []).map((s, idx) => idx === i ? { ...s, ...patch } : s));
  const removeSponsor = (i: number) => set("sponsors", (draft.sponsors ?? []).filter((_, idx) => idx !== i));

  const showSlides = draft.format === "carousel" && draft.placement !== "landing-sponsors";
  const showSponsors = draft.placement === "landing-sponsors";

  return (
    <div className="space-y-4">
      {/* Core info */}
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Internal name">
          <input className={inputCls} value={draft.name} onChange={(e) => set("name", e.target.value)} />
        </Field>
        <Field label="Priority (higher wins)">
          <input type="number" className={inputCls} value={draft.priority} onChange={(e) => set("priority", Number(e.target.value) || 0)} />
        </Field>
      </div>

      <Field label="Thumbnail">
        <div className="flex gap-2">
          <input className={inputCls} placeholder="Image URL" value={draft.thumbnail ?? ""} onChange={(e) => set("thumbnail", e.target.value)} />
          {draft.thumbnail && (
            <img src={draft.thumbnail} alt="" className="h-10 w-10 shrink-0 rounded-lg object-cover ring-1 ring-white/10" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
          )}
        </div>
      </Field>

      <Field label="Placement">
        <select className={inputCls} value={draft.placement ?? "dashboard"}
          onChange={(e) => {
            const p = e.target.value as AdPlacement;
            set("placement", p);
            if (p === "landing-sponsors") set("format", "carousel");
            if (p === "landing-advertise") set("format", "single");
            if (p === "landing-hero" && draft.format !== "carousel") set("format", "carousel");
          }}
        >
          {PLACEMENTS.map((p) => <option key={p.value} value={p.value}>{p.label} — {p.hint}</option>)}
        </select>
      </Field>

      <Field label="Format">
        <select className={inputCls} value={draft.format} onChange={(e) => set("format", e.target.value as AdFormat)}>
          {FORMATS.map((f) => <option key={f.value} value={f.value}>{f.label} — {f.hint}</option>)}
        </select>
      </Field>

      {/* Content fields — shown based on format */}
      {(draft.format === "marquee" || draft.format === "single") && (
        <>
          <Field label="Headline">
            <input className={inputCls} value={draft.headline ?? ""} onChange={(e) => set("headline", e.target.value)} />
          </Field>
          {draft.format === "single" && (
            <Field label="Subtitle (optional)">
              <input className={inputCls} value={draft.sub ?? ""} onChange={(e) => set("sub", e.target.value)} />
            </Field>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            {draft.format === "single" && (
              <Field label="CTA label (optional)">
                <input className={inputCls} value={draft.cta ?? ""} onChange={(e) => set("cta", e.target.value)} />
              </Field>
            )}
            <Field label="Link target (optional)">
              <input className={inputCls} value={draft.href ?? ""} onChange={(e) => set("href", e.target.value)} />
            </Field>
          </div>
          <Field label="Accent gradient (optional)">
            <input className={inputCls} placeholder="from-fuchsia-500 to-violet-600" value={draft.accent ?? ""} onChange={(e) => set("accent", e.target.value)} />
          </Field>
        </>
      )}

      {showSlides && (
        <Field label="Slides">
          <div className="space-y-2">
            {(draft.slides ?? []).map((s, i) => (
              <div key={i} className="rounded-xl border border-white/5 bg-white/[0.02] p-2.5">
                <div className="mb-2 flex items-center gap-2 text-[10px]">
                  <span className="text-muted-foreground">Source:</span>
                  {(["template", "blog"] as const).map((src) => (
                    <button key={src} onClick={() => updateSlide(i, { source: src })}
                      className={`rounded-full px-2 py-0.5 ${(s.source ?? "template") === src ? "bg-fuchsia-500/30 text-white ring-1 ring-fuchsia-300/40" : "bg-white/5 text-muted-foreground"}`}
                    >{src}</button>
                  ))}
                </div>
                {(s.source ?? "template") === "blog" ? (
                  <select className={inputCls} value={s.blogId ?? ""} onChange={(e) => {
                    const post = blogPosts.find((b) => b.id === e.target.value);
                    updateSlide(i, post ? { blogId: e.target.value, label: post.title, sub: post.excerpt || post.tag, href: `/articles/${post.id}`, image: post.cover } : { blogId: undefined });
                  }}>
                    <option value="">— Pick a blog post —</option>
                    {blogPosts.map((b) => <option key={b.id} value={b.id}>{b.title}{b.status === "draft" ? " (draft)" : ""}</option>)}
                  </select>
                ) : (
                  <div className="grid gap-2 sm:grid-cols-2">
                    <input className={inputCls} placeholder="Label" value={s.label} onChange={(e) => updateSlide(i, { label: e.target.value })} />
                    <input className={inputCls} placeholder="Sub (optional)" value={s.sub ?? ""} onChange={(e) => updateSlide(i, { sub: e.target.value })} />
                    <input className={inputCls} placeholder="Link (optional)" value={s.href} onChange={(e) => updateSlide(i, { href: e.target.value })} />
                    {/* Brand picker — real brands from DB */}
                    <select className={inputCls} value={s.brandSlug ?? ""} onChange={(e) => {
                      const brand = brands.find((b) => b.slug === e.target.value);
                      if (brand) {
                        updateSlide(i, { brandSlug: brand.slug, label: brand.name, href: `/payouts/${brand.slug}` });
                      } else {
                        updateSlide(i, { brandSlug: undefined });
                      }
                    }}>
                      <option value="">— Pick brand (optional) —</option>
                      {brands.length > 0 ? (
                        brands.map((b) => <option key={b.slug} value={b.slug}>{b.name} ({b.category})</option>)
                      ) : (
                        <option disabled>No brands loaded</option>
                      )}
                    </select>
                    <input className={inputCls} placeholder="Accent gradient (optional)" value={s.accent ?? ""} onChange={(e) => updateSlide(i, { accent: e.target.value })} />
                    <input className={inputCls} placeholder="Image URL (optional)" value={s.image ?? ""} onChange={(e) => updateSlide(i, { image: e.target.value })} />
                  </div>
                )}
                <button onClick={() => removeSlide(i)} className="mt-2 inline-flex items-center gap-1 text-[11px] text-rose-300 hover:text-rose-200">
                  <X className="h-3 w-3" /> Remove
                </button>
              </div>
            ))}
            <button onClick={addSlide} className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/15">
              <Plus className="h-3 w-3" /> Add slide
            </button>
          </div>
        </Field>
      )}

      {showSponsors && (
        <Field label="Sponsor logos">
          <div className="space-y-2">
            {(draft.sponsors ?? []).map((s, i) => (
              <div key={s.id} className="rounded-xl border border-white/5 bg-white/[0.02] p-2.5">
                <div className="grid gap-2 sm:grid-cols-2">
                  {/* Brand picker for sponsors */}
                  <select className={`${inputCls} sm:col-span-2`} value={s.name ?? ""} onChange={(e) => {
                    const brand = brands.find((b) => b.name === e.target.value);
                    if (brand) updateSponsor(i, { name: brand.name, initial: brand.name.slice(0, 2).toUpperCase(), href: `/payouts/${brand.slug}` });
                  }}>
                    <option value="">— Pick brand or fill manually —</option>
                    {brands.map((b) => <option key={b.slug} value={b.name}>{b.name} ({b.category})</option>)}
                  </select>
                  <input className={inputCls} placeholder="Brand name" value={s.name} onChange={(e) => updateSponsor(i, { name: e.target.value })} />
                  <input className={inputCls} placeholder="Initial (optional)" value={s.initial ?? ""} onChange={(e) => updateSponsor(i, { initial: e.target.value })} />
                  <input className={inputCls} placeholder="Color gradient (optional)" value={s.color ?? ""} onChange={(e) => updateSponsor(i, { color: e.target.value })} />
                  <input className={inputCls} placeholder="Link (optional)" value={s.href ?? ""} onChange={(e) => updateSponsor(i, { href: e.target.value })} />
                  <select className={inputCls} value={s.tag ?? "sponsor"} onChange={(e) => updateSponsor(i, { tag: e.target.value as SponsorLogo["tag"] })}>
                    <option value="sponsor">Sponsor</option>
                    <option value="featured">Featured</option>
                    <option value="ad">Ad</option>
                  </select>
                </div>
                <button onClick={() => removeSponsor(i)} className="mt-2 inline-flex items-center gap-1 text-[11px] text-rose-300 hover:text-rose-200">
                  <X className="h-3 w-3" /> Remove
                </button>
              </div>
            ))}
            <button onClick={addSponsor} className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/15">
              <Plus className="h-3 w-3" /> Add sponsor
            </button>
          </div>
        </Field>
      )}

      {draft.format === "trending" && (
        <Field label="Trending brands to show">
          <input type="number" min={2} max={8} className={inputCls} value={draft.trendingLimit ?? 5} onChange={(e) => set("trendingLimit", Math.max(2, Math.min(8, Number(e.target.value) || 5)))} />
        </Field>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Start date (optional)">
          <input type="date" className={inputCls} value={draft.startAt ? draft.startAt.slice(0, 10) : ""} onChange={(e) => set("startAt", e.target.value || undefined)} />
        </Field>
        <Field label="End date (optional)">
          <input type="date" className={inputCls} value={draft.endAt ? draft.endAt.slice(0, 10) : ""} onChange={(e) => set("endAt", e.target.value || undefined)} />
        </Field>
      </div>

      <label className="flex items-center gap-2 text-xs text-white">
        <input type="checkbox" checked={draft.active} onChange={(e) => set("active", e.target.checked)} className="h-4 w-4 rounded border-white/20 bg-white/10" />
        Active (visible to all users)
      </label>

      <div className="flex items-center gap-2 pt-2">
        <button onClick={() => onSave(draft)} disabled={saving}
          className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-2 text-xs font-semibold text-white shadow-[0_0_24px_rgba(16,185,129,0.45)] disabled:opacity-40">
          <Save className="h-3.5 w-3.5" /> {saving ? "Saving…" : "Save changes"}
        </button>
        <button onClick={onClose} className="rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-white hover:bg-white/15">Close</button>
      </div>
    </div>
  );
}

const inputCls = "w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white placeholder:text-muted-foreground focus:border-fuchsia-400/40 focus:outline-none";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
