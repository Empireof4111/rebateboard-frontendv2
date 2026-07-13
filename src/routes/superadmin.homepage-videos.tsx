import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { GripVertical, Plus, RefreshCw, Save, Trash2 } from "lucide-react";
import { PageHeader, Panel, StatCard } from "@/components/superadmin/AdminUI";
import { ThumbnailUploader, toast } from "@/components/superadmin/AdminActions";
import { advertApi, type DashboardAd } from "@/lib/admin-api";
import { useAuth } from "@/lib/auth";
import { ApiError } from "@/lib/api";
import { uploadMediaFile } from "@/lib/media-api";

export const Route = createFileRoute("/superadmin/homepage-videos")({
  head: () => ({
    meta: [
      { title: "Homepage Videos — Superadmin" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: HomepageVideosPage,
});

const inputCls =
  "w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white placeholder:text-muted-foreground focus:border-violet-400/40 focus:outline-none";

function emptyVideo(priority = 0): DashboardAd {
  return {
    id: "",
    name: "Homepage video",
    format: "single",
    placement: "homepage-video",
    active: false,
    priority,
    headline: "",
    sub: "",
    description: "",
    cta: "Watch on YouTube",
    href: "",
    videoUrl: "",
    thumbnail: "",
    image: "",
    impressions: 0,
    clicks: 0,
    createdAt: new Date().toISOString(),
  };
}

function HomepageVideosPage() {
  const { token } = useAuth();
  const [videos, setVideos] = useState<DashboardAd[]>([]);
  const [draft, setDraft] = useState<DashboardAd | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await advertApi.list(token);
      const rows = (res.payload?.page ?? [])
        .filter((ad) => ad.placement === "homepage-video")
        .sort((a, b) => b.priority - a.priority);
      setVideos(rows);
      setDraft((current) => {
        if (!current?.id) return current;
        return rows.find((row) => row.id === current.id) ?? null;
      });
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Homepage videos could not be loaded");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  const activeCount = videos.filter((video) => video.active).length;
  const selectedId = draft?.id ?? "";

  const set = <K extends keyof DashboardAd>(key: K, value: DashboardAd[K]) => {
    setDraft((current) => (current ? { ...current, [key]: value } : current));
  };

  const uploadThumb = async (file: File) => {
    const uploaded = await uploadMediaFile(file, {
      folder: "homepage/videos",
      prefix: draft?.id || draft?.headline || "homepage-video",
    });
    return uploaded.url;
  };

  const save = async () => {
    if (!token || !draft) return;
    if (!draft.videoUrl?.trim()) {
      toast.error("Add a YouTube video URL before saving.");
      return;
    }

    setSaving(true);
    try {
      const payload: DashboardAd = {
        ...draft,
        name: draft.name || draft.headline || "Homepage video",
        headline: draft.headline || draft.name || "Featured video",
        href: draft.videoUrl || draft.href,
        cta: draft.cta || "Watch on YouTube",
        image: draft.thumbnail || draft.image,
      };
      const res = draft.id
        ? await advertApi.update(token, draft.id, payload)
        : await advertApi.create(token, payload);
      if (res.payload) {
        toast.success(draft.active ? "Homepage video saved and enabled" : "Homepage video saved as disabled");
        await load();
        setDraft(res.payload);
      }
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Video save failed");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!token) return;
    try {
      await advertApi.remove(token, id);
      setVideos((current) => current.filter((video) => video.id !== id));
      if (draft?.id === id) setDraft(null);
      toast.success("Homepage video deleted");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Delete failed");
    }
  };

  const reorder = (targetId: string) => {
    if (!draggingId || draggingId === targetId) return;
    setVideos((current) => {
      const from = current.findIndex((video) => video.id === draggingId);
      const to = current.findIndex((video) => video.id === targetId);
      if (from < 0 || to < 0) return current;
      const next = current.slice();
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
  };

  const saveOrder = async () => {
    if (!token) return;
    setSaving(true);
    try {
      await Promise.all(
        videos.map((video, index) =>
          advertApi.update(token, video.id, { ...video, priority: (videos.length - index) * 10 }),
        ),
      );
      toast.success("Video order saved");
      await load();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Order save failed");
    } finally {
      setSaving(false);
    }
  };

  const editorTitle = useMemo(() => {
    if (!draft) return "Editor";
    return draft.id ? `Edit · ${draft.headline || draft.name}` : "New homepage video";
  }, [draft]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Homepage Videos"
        subtitle="Manage the compact YouTube slider beside the homepage rebate calculator."
        actions={
          <div className="flex gap-2">
            <button
              type="button"
              onClick={load}
              className="grid h-8 w-8 place-items-center rounded-full bg-white/5 text-white ring-1 ring-white/10"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            </button>
            <button
              type="button"
              onClick={() => setDraft(emptyVideo((videos.length + 1) * 10))}
              className="inline-flex items-center gap-1.5 rounded-full rb-gradient-primary px-4 py-2 text-xs font-semibold text-white shadow-[0_0_24px_rgba(192,132,252,0.45)]"
            >
              <Plus className="h-3.5 w-3.5" />
              Add video
            </button>
          </div>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Videos" value={String(videos.length)} delta="2–5 recommended" />
        <StatCard label="Enabled" value={String(activeCount)} delta="visible on homepage" />
        <StatCard label="Order" value="Drag" delta="save after sorting" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <Panel
          title="Video playlist"
          action={
            videos.length > 1 ? (
              <button
                type="button"
                onClick={saveOrder}
                disabled={saving}
                className="rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-white/15 disabled:opacity-40"
              >
                Save order
              </button>
            ) : null
          }
        >
          {loading && <div className="py-8 text-center text-sm text-muted-foreground">Loading…</div>}
          {!loading && videos.length === 0 && (
            <div className="rounded-xl border border-dashed border-white/10 p-6 text-center text-xs text-muted-foreground">
              No homepage videos yet. Add a YouTube URL, optional thumbnail, and enable it when ready.
            </div>
          )}
          <div className="space-y-2">
            {videos.map((video) => (
              <div
                key={video.id}
                draggable
                onDragStart={() => setDraggingId(video.id)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => reorder(video.id)}
                onDragEnd={() => setDraggingId(null)}
                className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 transition ${
                  selectedId === video.id
                    ? "border-violet-400/40 bg-white/[0.07]"
                    : "border-white/5 bg-white/[0.02] hover:bg-white/[0.05]"
                }`}
              >
                <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground" />
                <button type="button" onClick={() => setDraft(video)} className="min-w-0 flex-1 text-left">
                  <div className="truncate text-sm font-semibold text-white">{video.headline || video.name}</div>
                  <div className="mt-0.5 text-[10px] text-muted-foreground">
                    {video.active ? "Enabled" : "Disabled"} · Priority {video.priority}
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => remove(video.id)}
                  className="grid h-7 w-7 place-items-center rounded-full bg-white/10 text-muted-foreground hover:bg-rose-500/20 hover:text-rose-300"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title={editorTitle}>
          {draft ? (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Video title">
                  <input className={inputCls} value={draft.headline ?? ""} onChange={(event) => set("headline", event.target.value)} />
                </Field>
                <Field label="Internal name">
                  <input className={inputCls} value={draft.name ?? ""} onChange={(event) => set("name", event.target.value)} />
                </Field>
              </div>
              <Field label="YouTube URL">
                <input
                  className={inputCls}
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={draft.videoUrl ?? ""}
                  onChange={(event) => {
                    set("videoUrl", event.target.value);
                    set("href", event.target.value);
                  }}
                />
              </Field>
              <Field label="Short description">
                <textarea
                  className={`${inputCls} min-h-20 resize-none`}
                  value={draft.description ?? ""}
                  onChange={(event) => set("description", event.target.value)}
                />
              </Field>
              <Field label="Custom thumbnail (optional)">
                <ThumbnailUploader
                  value={draft.thumbnail || draft.image}
                  onChange={(url) => {
                    set("thumbnail", url);
                    set("image", url);
                  }}
                  onSelectFile={uploadThumb}
                  label="Upload custom thumbnail"
                  height="h-40"
                />
              </Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Priority">
                  <input
                    type="number"
                    className={inputCls}
                    value={draft.priority}
                    onChange={(event) => set("priority", Number(event.target.value) || 0)}
                  />
                </Field>
                <Field label="CTA label">
                  <input className={inputCls} value={draft.cta ?? ""} onChange={(event) => set("cta", event.target.value)} />
                </Field>
              </div>
              <label className="flex items-center gap-2 text-xs text-white">
                <input
                  type="checkbox"
                  checked={draft.active}
                  onChange={(event) => set("active", event.target.checked)}
                  className="h-4 w-4 rounded border-white/20 bg-white/10"
                />
                Enabled on homepage
              </label>
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={save}
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-2 text-xs font-semibold text-white shadow-[0_0_24px_rgba(16,185,129,0.45)] disabled:opacity-40"
                >
                  <Save className="h-3.5 w-3.5" />
                  {saving ? "Saving…" : "Save video"}
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-white/10 p-8 text-center text-xs text-muted-foreground">
              Select a video or add a new one to edit the homepage slider.
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
