import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Plus, Trash2, Save, Eye, MousePointerClick, Power, X, Megaphone, Sparkles, Flame, RefreshCw,
} from "lucide-react";
import { PageHeader, Panel, StatCard } from "@/components/superadmin/AdminUI";
import { ThumbnailUploader, toast } from "@/components/superadmin/AdminActions";
import { advertApi, blogApi, type DashboardAd, type BlogPost } from "@/lib/admin-api";
import { fetchAdminBrands, type AdminBrandRecord } from "@/lib/admin-brands-api";
import type { AdFormat, AdPlacement, AdSlide, SponsorLogo } from "@/lib/dashboard-ads";
import { useAuth } from "@/lib/auth";
import { ApiError } from "@/lib/api";
import { uploadMediaFile } from "@/lib/media-api";

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

function emptyAd(): DashboardAd {
  return {
    id: "",
    name: "Draft banner",
    format: "single",
    placement: "dashboard",
    active: false,
    priority: 0,
    headline: "",
    sub: "",
    cta: "",
    href: "",
    thumbnail: "",
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
  const [brands, setBrands] = useState<AdminBrandRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [adsRes, blogRes, brandRows] = await Promise.allSettled([
        advertApi.list(token),
        blogApi.list(token),
        fetchAdminBrands(),
      ]);

      if (adsRes.status === "fulfilled") {
        setAds(adsRes.value.payload?.page ?? []);
      } else {
        toast.error(adsRes.reason instanceof ApiError ? adsRes.reason.message : "Failed to load ads");
      }

      if (blogRes.status === "fulfilled") {
        setBlogPosts(blogRes.value.payload?.page ?? []);
      } else {
        setBlogPosts([]);
        toast.error(blogRes.reason instanceof ApiError ? blogRes.reason.message : "Blog posts could not be loaded");
      }

      if (brandRows.status === "fulfilled") {
        setBrands(brandRows.value);
      } else {
        setBrands([]);
        toast.error("Brand records could not be loaded");
      }
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

  const create = async () => {
    if (!token) return;
    setSaving(true);
    try {
      const ad = emptyAd();
      const res = await advertApi.create(token, ad);
      if (res.payload) {
        setAds((prev) => [...prev, res.payload!]);
        setEditingId(res.payload.id);
      }
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Failed to create ad");
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
        const placement = PLACEMENTS.find((item) => item.value === ad.placement)?.label ?? "selected placement";
        toast.success(ad.active ? `Ad saved — live on ${placement}` : "Draft saved");
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
        subtitle="Manage dashboard, landing hero, sponsor strip, and advertise-box campaigns from one place."
        actions={
          <div className="flex gap-2">
            <button onClick={load} className="grid h-7 w-7 place-items-center rounded-md bg-white/5 text-white ring-1 ring-white/10">
              <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
            </button>
            <button onClick={create} disabled={saving} className="inline-flex items-center gap-1.5 rounded-full rb-gradient-primary px-4 py-2 text-xs font-semibold text-white shadow-[0_0_24px_rgba(192,132,252,0.45)] disabled:opacity-40">
              <Plus className="h-3.5 w-3.5" /> New banner
            </button>
          </div>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total banners" value={ads.length.toString()} delta="created" />
        <StatCard label="Active now" value={activeCount.toString()} delta="visible on selected placements" />
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
                <button key={ad.id} onClick={() => setEditingId(ad.id)}
                  className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition ${editingId === ad.id ? "border-violet-400/40 bg-white/[0.07]" : "border-white/5 bg-white/[0.02] hover:bg-white/[0.05]"}`}
                >
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg rb-gradient-primary">
                    <FormatIcon format={ad.format} />
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

        <Panel title={editing ? `Edit · ${editing.name}` : "Editor"}>
          {editing ? (
            <Editor
              key={editing.id}
              ad={editing}
              blogPosts={blogPosts}
              brands={brands}
              saving={saving}
              onSave={save}
              onClose={() => setEditingId(null)}
            />
          ) : (
            <div className="rounded-xl border border-dashed border-white/10 p-8 text-center text-xs text-muted-foreground">
              Select a banner on the left or create a new one to start editing.
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}

function FormatIcon({ format }: { format: AdFormat }) {
  const f = FORMATS.find((x) => x.value === format);
  const Icon = f?.icon ?? Megaphone;
  return <Icon className="h-4 w-4 text-white" />;
}

function slugFromBrand(brand: AdminBrandRecord) {
  return brand.slug || brand.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function brandHref(brand: AdminBrandRecord) {
  return `/firm/${slugFromBrand(brand)}`;
}

function brandInitial(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length > 1) return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function brandTbiLabel(brand: AdminBrandRecord) {
  return Number.isFinite(brand.tbi) ? `TBI ${Number(brand.tbi).toFixed(1)}/100` : "TBI not provided";
}

function slideFromBrand(brand: AdminBrandRecord): Partial<AdSlide> {
  return {
    brandSlug: slugFromBrand(brand),
    label: brand.name,
    sub: `${brand.category || "Brand"} · ${brandTbiLabel(brand)}`,
    href: brandHref(brand),
    image: brand.thumbnail || brand.cover,
  };
}

function sponsorFromBrand(brand: AdminBrandRecord, tag: SponsorLogo["tag"] = "sponsor"): SponsorLogo {
  return {
    id: `brand-${slugFromBrand(brand)}`,
    name: brand.name,
    initial: brandInitial(brand.name),
    logo: brand.thumbnail || brand.cover,
    href: brandHref(brand),
    tag,
  };
}

function sanitizeAdVisuals(ad: DashboardAd): DashboardAd {
  return {
    ...ad,
    accent: undefined,
    slides: ad.slides?.map((slide) => ({ ...slide, accent: undefined })),
    sponsors: ad.sponsors?.map((sponsor) => ({ ...sponsor, color: undefined })),
  };
}

function Editor({ ad, blogPosts, brands, saving, onSave, onClose }: {
  ad: DashboardAd;
  blogPosts: BlogPost[];
  brands: AdminBrandRecord[];
  saving: boolean;
  onSave: (ad: DashboardAd) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<DashboardAd>(ad);
  useEffect(() => setDraft(ad), [ad]);
  const selectableBrands = useMemo(() => {
    const published = brands.filter((brand) => brand.visibility === "published");
    return published.length ? published : brands;
  }, [brands]);

  const set = <K extends keyof DashboardAd>(k: K, v: DashboardAd[K]) => setDraft((d) => ({ ...d, [k]: v }));
  const uploadBanner = async (file: File) => {
    const uploaded = await uploadMediaFile(file, {
      folder: "adverts/banners",
      prefix: draft.id || draft.name || "banner",
    });
    return uploaded.url;
  };

  const addSlide = () => {
    const brand = selectableBrands[0];
    const next: AdSlide = brand
      ? {
          source: "template",
          label: brand.name,
          sub: `${brand.category || "Brand"} · ${brandTbiLabel(brand)}`,
          href: brandHref(brand),
          image: brand.thumbnail || brand.cover,
          brandSlug: slugFromBrand(brand),
        }
      : {
          source: "template",
          label: "Manual slide",
          sub: "",
          href: "/blog",
        };
    set("slides", [...(draft.slides ?? []), next]);
  };
  const updateSlide = (i: number, patch: Partial<AdSlide>) => set("slides", (draft.slides ?? []).map((s, idx) => idx === i ? { ...s, ...patch } : s));
  const removeSlide = (i: number) => set("slides", (draft.slides ?? []).filter((_, idx) => idx !== i));

  const applySingleBrand = (brand: AdminBrandRecord) => {
    const image = brand.thumbnail || brand.cover || draft.thumbnail;
    setDraft((current) => ({
      ...current,
      name:
        current.name && !["Untitled banner", "Draft banner"].includes(current.name)
          ? current.name
          : `${brand.name} banner`,
      headline: brand.name,
      sub: `${brand.category || "Brand"} · ${brandTbiLabel(brand)}`,
      href: brandHref(brand),
      thumbnail: image,
      image,
    }));
  };

  const addSponsor = () => {
    const brand = selectableBrands[(draft.sponsors ?? []).length % Math.max(selectableBrands.length, 1)];
    const sponsor = brand
      ? sponsorFromBrand(brand)
      : {
          id: `sp-${Math.random().toString(36).slice(2, 8)}`,
          name: "Brand",
          initial: "B",
          href: "/",
          tag: "sponsor" as const,
        };
    set("sponsors", [...(draft.sponsors ?? []), sponsor]);
  };
  const updateSponsor = (i: number, patch: Partial<SponsorLogo>) => set("sponsors", (draft.sponsors ?? []).map((s, idx) => idx === i ? { ...s, ...patch } : s));
  const removeSponsor = (i: number) => set("sponsors", (draft.sponsors ?? []).filter((_, idx) => idx !== i));

  const showSlides = draft.format === "carousel" && draft.placement !== "landing-sponsors";
  const showSponsors = draft.placement === "landing-sponsors";

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Internal name"><input className={inputCls} value={draft.name} onChange={(e) => set("name", e.target.value)} /></Field>
        <Field label="Priority (higher wins)"><input type="number" className={inputCls} value={draft.priority} onChange={(e) => set("priority", Number(e.target.value) || 0)} /></Field>
      </div>

      <Field label="Placement">
        <div className="grid grid-cols-2 gap-2">
          {PLACEMENTS.map((p) => {
            const active = (draft.placement ?? "dashboard") === p.value;
            return (
              <button key={p.value} onClick={() => { set("placement", p.value); if (p.value === "landing-sponsors") set("format", "carousel"); if (p.value === "landing-advertise") set("format", "single"); if (p.value === "landing-hero" && draft.format !== "carousel") set("format", "carousel"); }}
                className={`rounded-xl border p-2.5 text-left transition ${active ? "border-violet-400/40 bg-violet-500/10" : "border-white/5 bg-white/[0.02] hover:bg-white/[0.05]"}`}
              >
                <div className="text-xs font-semibold text-white">{p.label}</div>
                <div className="mt-0.5 text-[10px] text-muted-foreground">{p.hint}</div>
              </button>
            );
          })}
        </div>
      </Field>

      <Field label="Format">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {FORMATS.map((f) => {
            const Icon = f.icon;
            const active = draft.format === f.value;
            return (
              <button key={f.value} onClick={() => set("format", f.value)}
                className={`rounded-xl border p-2.5 text-left transition ${active ? "border-violet-400/40 bg-violet-500/10" : "border-white/5 bg-white/[0.02] hover:bg-white/[0.05]"}`}
              >
                <div className="flex items-center gap-1.5 text-xs font-semibold text-white"><Icon className="h-3.5 w-3.5" /> {f.label}</div>
                <div className="mt-0.5 text-[10px] text-muted-foreground">{f.hint}</div>
              </button>
            );
          })}
        </div>
      </Field>

      {draft.format === "single" && (
        <>
          <Field label="Use real brand data">
            <select
              className={inputCls}
              value=""
              onChange={(e) => {
                const brand = selectableBrands.find((b) => b.id === e.target.value);
                if (brand) applySingleBrand(brand);
              }}
            >
              <option value="">Pick a listed brand to prefill this banner</option>
              {selectableBrands.map((brand) => (
                <option key={brand.id} value={brand.id}>
                  {brand.name} · {brand.category} · {brandTbiLabel(brand)}
                </option>
              ))}
            </select>
            {selectableBrands.length === 0 && (
              <p className="mt-1 text-[11px] text-muted-foreground">
                Add or publish brands first, then use them here to avoid manual duplicate ad data.
              </p>
            )}
          </Field>
          <Field label="Banner image">
            <ThumbnailUploader
              value={draft.thumbnail || draft.image}
              onChange={(url) => {
                set("thumbnail", url);
                set("image", url);
              }}
              onSelectFile={uploadBanner}
              label="Upload banner image"
              height="h-44"
            />
          </Field>
          <Field label="Public headline (optional)">
            <input
              className={inputCls}
              placeholder="Leave empty when the uploaded banner already contains the copy"
              value={draft.headline ?? ""}
              onChange={(e) => set("headline", e.target.value)}
            />
          </Field>
          <Field label="Public subtitle (optional)">
            <input
              className={inputCls}
              placeholder="Short supporting line"
              value={draft.sub ?? ""}
              onChange={(e) => set("sub", e.target.value)}
            />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="CTA label (optional)">
              <input
                className={inputCls}
                placeholder="Learn more"
                value={draft.cta ?? ""}
                onChange={(e) => set("cta", e.target.value)}
              />
            </Field>
            <Field label="Link target">
              <input
                className={inputCls}
                placeholder="/offers or https://..."
                value={draft.href ?? ""}
                onChange={(e) => set("href", e.target.value)}
              />
            </Field>
          </div>
        </>
      )}

      {draft.format === "marquee" && (
        <>
          <Field label="Headline"><input className={inputCls} value={draft.headline ?? ""} onChange={(e) => set("headline", e.target.value)} /></Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Link target"><input className={inputCls} value={draft.href ?? ""} onChange={(e) => set("href", e.target.value)} /></Field>
          </div>
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
                    <button key={src} onClick={() => updateSlide(i, { source: src })} className={`rounded-full px-2 py-0.5 ${(s.source ?? "template") === src ? "bg-violet-500/30 text-white ring-1 ring-violet-300/40" : "bg-white/5 text-muted-foreground"}`}>{src}</button>
                  ))}
                </div>
                {(s.source ?? "template") === "blog" ? (
                  <select className={inputCls} value={s.blogId ?? ""} onChange={(e) => { const post = blogPosts.find((b) => b.id === e.target.value); updateSlide(i, post ? { blogId: e.target.value, label: post.title, sub: post.excerpt || post.tag, href: `/articles/${post.urlSlug || post.id}`, image: post.cover } : { blogId: undefined }); }}>
                    <option value="">— Pick a blog post —</option>
                    {blogPosts.map((b) => <option key={b.id} value={b.id}>{b.title}{b.status === "draft" ? " (draft)" : ""}</option>)}
                  </select>
                ) : (
                  <div className="grid gap-2 sm:grid-cols-2">
                    <input className={inputCls} placeholder="Label" value={s.label} onChange={(e) => updateSlide(i, { label: e.target.value })} />
                    <input className={inputCls} placeholder="Sub" value={s.sub ?? ""} onChange={(e) => updateSlide(i, { sub: e.target.value })} />
                    <input className={inputCls} placeholder="Link" value={s.href} onChange={(e) => updateSlide(i, { href: e.target.value })} />
                    <select className={inputCls} value={s.brandSlug ?? ""} onChange={(e) => { const brand = selectableBrands.find((b) => slugFromBrand(b) === e.target.value); updateSlide(i, brand ? slideFromBrand(brand) : { brandSlug: undefined }); }}>
                      <option value="">— Pick platform brand (optional) —</option>
                      {selectableBrands.map((b) => <option key={b.id} value={slugFromBrand(b)}>{b.name} · {b.category}</option>)}
                    </select>
                  </div>
                )}
                <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_1.1fr]">
                  <input
                    className={inputCls}
                    placeholder="Image URL"
                    value={s.image ?? ""}
                    onChange={(e) => updateSlide(i, { image: e.target.value })}
                  />
                  <ThumbnailUploader
                    value={s.image}
                    onChange={(url) => updateSlide(i, { image: url })}
                    onSelectFile={uploadBanner}
                    label="Upload slide image"
                    height="h-24"
                  />
                </div>
                <button onClick={() => removeSlide(i)} className="mt-2 inline-flex items-center gap-1 text-[11px] text-rose-300 hover:text-rose-200"><X className="h-3 w-3" /> Remove</button>
              </div>
            ))}
            <button onClick={addSlide} className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/15"><Plus className="h-3 w-3" /> Add slide</button>
          </div>
        </Field>
      )}

      {showSponsors && (
        <Field label="Sponsor logos">
          <div className="space-y-2">
            {(draft.sponsors ?? []).map((s, i) => (
              <div key={s.id} className="rounded-xl border border-white/5 bg-white/[0.02] p-2.5">
                <div className="grid gap-2 sm:grid-cols-2">
                  <select className={inputCls} value={s.href?.startsWith("/firm/") ? s.href.replace("/firm/", "") : ""} onChange={(e) => { const brand = selectableBrands.find((b) => slugFromBrand(b) === e.target.value); if (brand) updateSponsor(i, sponsorFromBrand(brand, s.tag)); }}>
                    <option value="">— Pick platform brand —</option>
                    {selectableBrands.map((b) => <option key={b.id} value={slugFromBrand(b)}>{b.name} · {b.category}</option>)}
                  </select>
                  <select className={inputCls} value={s.tag ?? "sponsor"} onChange={(e) => updateSponsor(i, { tag: e.target.value as SponsorLogo["tag"] })}>
                    <option value="sponsor">Sponsor</option><option value="featured">Featured</option><option value="ad">Ad</option>
                  </select>
                  <input className={inputCls} placeholder="Brand name" value={s.name} onChange={(e) => updateSponsor(i, { name: e.target.value })} />
                  <input className={inputCls} placeholder="Initial" value={s.initial ?? ""} onChange={(e) => updateSponsor(i, { initial: e.target.value })} />
                  <input className={inputCls} placeholder="Link" value={s.href ?? ""} onChange={(e) => updateSponsor(i, { href: e.target.value })} />
                  <input className={inputCls} placeholder="Logo URL" value={s.logo ?? ""} onChange={(e) => updateSponsor(i, { logo: e.target.value })} />
                  <ThumbnailUploader
                    value={s.logo}
                    onChange={(url) => updateSponsor(i, { logo: url })}
                    onSelectFile={uploadBanner}
                    label="Upload logo"
                    height="h-20"
                  />
                </div>
                <button onClick={() => removeSponsor(i)} className="mt-2 inline-flex items-center gap-1 text-[11px] text-rose-300 hover:text-rose-200"><X className="h-3 w-3" /> Remove</button>
              </div>
            ))}
            <button onClick={addSponsor} className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/15"><Plus className="h-3 w-3" /> Add sponsor</button>
          </div>
        </Field>
      )}

      {draft.format === "trending" && (
        <Field label="Trending brands to show">
          <input type="number" min={2} max={8} className={inputCls} value={draft.trendingLimit ?? 5} onChange={(e) => set("trendingLimit", Math.max(2, Math.min(8, Number(e.target.value) || 5)))} />
        </Field>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Start date (optional)"><input type="date" className={inputCls} value={draft.startAt ? draft.startAt.slice(0, 10) : ""} onChange={(e) => set("startAt", e.target.value || undefined)} /></Field>
        <Field label="End date (optional)"><input type="date" className={inputCls} value={draft.endAt ? draft.endAt.slice(0, 10) : ""} onChange={(e) => set("endAt", e.target.value || undefined)} /></Field>
      </div>

      <label className="flex items-center gap-2 text-xs text-white">
        <input type="checkbox" checked={draft.active} onChange={(e) => set("active", e.target.checked)} className="h-4 w-4 rounded border-white/20 bg-white/10" />
        Active (visible to all users)
      </label>

      <div className="flex items-center gap-2 pt-2">
        <button onClick={() => onSave(sanitizeAdVisuals(draft))} disabled={saving} className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-2 text-xs font-semibold text-white shadow-[0_0_24px_rgba(16,185,129,0.45)] disabled:opacity-40">
          <Save className="h-3.5 w-3.5" /> {saving ? "Saving…" : "Save changes"}
        </button>
        <button onClick={onClose} className="rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-white hover:bg-white/15">Close</button>
      </div>
    </div>
  );
}

const inputCls = "w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white placeholder:text-muted-foreground focus:border-violet-400/40 focus:outline-none";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
