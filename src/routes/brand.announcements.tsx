import { createFileRoute } from "@tanstack/react-router";
import { useBrandAuth } from "@/lib/brand-auth";
import { useAdminCollection, newId } from "@/lib/admin-store";
import { announcements as seed, type Announcement } from "@/lib/admin-data";
import { useState } from "react";
import { Plus, Trash2, Megaphone } from "lucide-react";

export const Route = createFileRoute("/brand/announcements")({
  component: BrandAnnouncements,
});

function BrandAnnouncements() {
  const { brand } = useBrandAuth();
  const { items, add, remove, update } = useAdminCollection<Announcement>("announcements", seed);
  const [draft, setDraft] = useState({ message: "", cta: "Learn more", link: "#", start: "", end: "" });

  if (!brand) return null;

  const mine = items.filter((a) => a.brandName?.toLowerCase() === brand.name.toLowerCase());

  function publish() {
    if (!draft.message.trim()) return;
    const today = new Date().toISOString().slice(0, 10);
    const inMonth = new Date(Date.now() + 30 * 24 * 60 * 60_000).toISOString().slice(0, 10);
    const item: Announcement = {
      id: newId("an"),
      message: draft.message,
      cta: draft.cta,
      link: draft.link,
      start: draft.start || today,
      end: draft.end || inMonth,
      category: "Brand",
      placement: "Brand pages",
      source: "Brand",
      submittedBy: brand!.name,
      brandName: brand!.name,
      status: "active",
      approval: "approved",
    };
    add(item);
    setDraft({ message: "", cta: "Learn more", link: "#", start: "", end: "" });
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white">Announcements</h1>
        <p className="mt-1 text-sm text-muted-foreground">Promotions, updates and offers — surfaced on your public profile.</p>
      </div>

      <div className="glass rounded-2xl p-5 ring-1 ring-white/10">
        <div className="flex items-center gap-2 text-fuchsia-300"><Megaphone className="h-4 w-4" /><div className="text-sm font-bold text-white">New announcement</div></div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <textarea value={draft.message} onChange={(e) => setDraft((p) => ({ ...p, message: e.target.value }))} placeholder="Announcement message" className="md:col-span-2 min-h-[80px] rounded-xl bg-white/5 p-3 text-sm text-white outline-none ring-1 ring-white/10 focus:ring-fuchsia-300/40 placeholder:text-muted-foreground" />
          <input value={draft.cta} onChange={(e) => setDraft((p) => ({ ...p, cta: e.target.value }))} placeholder="CTA label" className="rounded-xl bg-white/5 p-3 text-sm text-white outline-none ring-1 ring-white/10 placeholder:text-muted-foreground" />
          <input value={draft.link} onChange={(e) => setDraft((p) => ({ ...p, link: e.target.value }))} placeholder="CTA link" className="rounded-xl bg-white/5 p-3 text-sm text-white outline-none ring-1 ring-white/10 placeholder:text-muted-foreground" />
          <input type="date" value={draft.start} onChange={(e) => setDraft((p) => ({ ...p, start: e.target.value }))} className="rounded-xl bg-white/5 p-3 text-sm text-white outline-none ring-1 ring-white/10" />
          <input type="date" value={draft.end} onChange={(e) => setDraft((p) => ({ ...p, end: e.target.value }))} className="rounded-xl bg-white/5 p-3 text-sm text-white outline-none ring-1 ring-white/10" />
        </div>
        <button onClick={publish} className="mt-4 inline-flex items-center gap-1.5 rounded-full rb-gradient-primary px-4 py-2 text-xs font-bold text-white">
          <Plus className="h-3.5 w-3.5" /> Publish
        </button>
      </div>

      <div className="grid gap-3">
        {mine.map((a) => (
          <div key={a.id} className="glass flex items-start gap-3 rounded-2xl p-4 ring-1 ring-white/10">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[rgba(126,77,255,0.18)] ring-1 ring-fuchsia-300/30"><Megaphone className="h-4 w-4 text-fuchsia-200" /></div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${a.status === "active" ? "bg-emerald-500/15 text-emerald-300" : a.status === "scheduled" ? "bg-sky-500/15 text-sky-300" : "bg-white/5 text-muted-foreground"}`}>{a.status}</span>
                <span className="text-[10px] text-muted-foreground">{a.start} – {a.end}</span>
              </div>
              <p className="mt-1 text-sm text-white">{a.message}</p>
              <div className="mt-2 flex items-center gap-2">
                <select value={a.status} onChange={(e) => update(a.id, { status: e.target.value as any })} className="rounded-md bg-white/5 px-2 py-1 text-[10px] text-white ring-1 ring-white/10">
                  <option value="active" className="bg-[var(--rb-bg-input)]">active</option>
                  <option value="scheduled" className="bg-[var(--rb-bg-input)]">scheduled</option>
                  <option value="expired" className="bg-[var(--rb-bg-input)]">expired</option>
                </select>
              </div>
            </div>
            <button onClick={() => remove(a.id)} className="grid h-8 w-8 place-items-center rounded-lg bg-white/5 text-rose-300 hover:bg-rose-500/15"><Trash2 className="h-3.5 w-3.5" /></button>
          </div>
        ))}
        {mine.length === 0 && <div className="glass rounded-2xl p-10 text-center text-sm text-muted-foreground ring-1 ring-white/10">No announcements yet.</div>}
      </div>
    </div>
  );
}
