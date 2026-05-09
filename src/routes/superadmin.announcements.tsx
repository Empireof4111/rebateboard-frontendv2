import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader, Panel, DataTable, StatusPill, Pill } from "@/components/superadmin/AdminUI";
import { Modal, ConfirmDialog, Field, fieldCls, toast } from "@/components/superadmin/AdminActions";
import { useAdminCollection, newId } from "@/lib/admin-store";
import { announcements as seed, adminBrands, type Announcement } from "@/lib/admin-data";
import { Plus, Edit3, Trash2, Check, X, Globe, Building2, Clock } from "lucide-react";

export const Route = createFileRoute("/superadmin/announcements")({
  component: AnnouncementsPage,
});

type TabKey = "all" | "global" | "brand" | "pending";

const empty = (): Announcement => ({
  id: newId("an"),
  category: "Global",
  message: "",
  cta: "Learn more",
  link: "/",
  placement: "Top bar",
  source: "Admin",
  approval: "approved",
  start: "—",
  end: "—",
  status: "scheduled",
});

function AnnouncementsPage() {
  const { items, add, update, remove } = useAdminCollection<Announcement>("announcements", seed);
  const [editing, setEditing] = useState<Announcement | null>(null);
  const [deleting, setDeleting] = useState<Announcement | null>(null);
  const [tab, setTab] = useState<TabKey>("all");

  const counts = useMemo(() => ({
    all: items.length,
    global: items.filter((a) => a.category === "Global").length,
    brand: items.filter((a) => a.category === "Brand").length,
    pending: items.filter((a) => a.approval === "pending").length,
  }), [items]);

  const filtered = useMemo(() => {
    switch (tab) {
      case "global": return items.filter((a) => a.category === "Global");
      case "brand": return items.filter((a) => a.category === "Brand");
      case "pending": return items.filter((a) => a.approval === "pending");
      default: return items;
    }
  }, [items, tab]);

  const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: "all", label: "All", icon: null },
    { key: "global", label: "Global", icon: <Globe className="h-3 w-3" /> },
    { key: "brand", label: "Brand-specific", icon: <Building2 className="h-3 w-3" /> },
    { key: "pending", label: "Pending approval", icon: <Clock className="h-3 w-3" /> },
  ];

  return (
    <div>
      <PageHeader
        title="Announcements"
        subtitle="Global banners and brand-specific announcements. Brand-submitted posts require approval before they go live."
        actions={
          <button onClick={() => setEditing(empty())} className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-600 px-3 py-1.5 text-xs font-semibold text-white">
            <Plus className="h-3.5 w-3.5" /> New announcement
          </button>
        }
      />

      <div className="mb-3 flex flex-wrap items-center gap-1.5">
        {tabs.map((t) => {
          const active = tab === t.key;
          const count = counts[t.key];
          const isPending = t.key === "pending" && count > 0;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold ring-1 transition " +
                (active
                  ? "bg-white text-[#1a0b2e] ring-white/40"
                  : "bg-white/5 text-white ring-white/10 hover:bg-white/10")
              }
            >
              {t.icon}
              {t.label}
              <span className={
                "rounded-full px-1.5 py-0.5 text-[10px] font-bold " +
                (isPending && !active ? "bg-amber-400/20 text-amber-200 ring-1 ring-amber-300/30"
                  : active ? "bg-[#1a0b2e]/10 text-[#1a0b2e]" : "bg-white/10 text-white/80")
              }>{count}</span>
            </button>
          );
        })}
      </div>

      <Panel title={`${tabs.find((t) => t.key === tab)?.label} — ${filtered.length}`}>
        <DataTable head={<><th>Message</th><th>Scope</th><th>Placement</th><th>Source</th><th>Window</th><th>Status</th><th></th></>}>
          {filtered.map((a) => (
            <tr key={a.id}>
              <td className="font-medium">
                <div className="flex flex-col">
                  <span>{a.message || <span className="text-muted-foreground italic">empty</span>}</span>
                  <span className="text-[10px] text-fuchsia-300">{a.cta} → {a.link}</span>
                </div>
              </td>
              <td>
                {a.category === "Brand"
                  ? <Pill><Building2 className="mr-1 inline h-3 w-3" />{a.brandName ?? "Brand"}</Pill>
                  : <Pill><Globe className="mr-1 inline h-3 w-3" />Global</Pill>}
              </td>
              <td><Pill>{a.placement}</Pill></td>
              <td>
                <div className="flex flex-col text-[10px]">
                  <span className={a.source === "Brand" ? "text-amber-300 font-semibold" : "text-white/80 font-semibold"}>{a.source}</span>
                  {a.submittedBy && <span className="text-muted-foreground">{a.submittedBy}</span>}
                </div>
              </td>
              <td className="text-muted-foreground text-xs whitespace-nowrap">{a.start} – {a.end}</td>
              <td>
                <div className="flex flex-col gap-1">
                  <button onClick={() => {
                    const next = a.status === "active" ? "expired" : "active";
                    update(a.id, { status: next }); toast.success(`Set to ${next}`);
                  }}>
                    <StatusPill status={a.status} />
                  </button>
                  {a.approval === "pending" && (
                    <span className="rounded-full bg-amber-400/15 px-2 py-0.5 text-center text-[9px] font-bold uppercase text-amber-200 ring-1 ring-amber-300/30">Pending</span>
                  )}
                  {a.approval === "rejected" && (
                    <span className="rounded-full bg-rose-400/15 px-2 py-0.5 text-center text-[9px] font-bold uppercase text-rose-200 ring-1 ring-rose-300/30">Rejected</span>
                  )}
                </div>
              </td>
              <td className="text-right">
                <div className="flex justify-end gap-1">
                  {a.approval === "pending" && (
                    <>
                      <button
                        onClick={() => { update(a.id, { approval: "approved", status: "active" }); toast.success("Approved"); }}
                        title="Approve"
                        className="rounded-md bg-emerald-500/15 px-2 py-1 ring-1 ring-emerald-300/30 hover:bg-emerald-500/25"
                      ><Check className="h-3 w-3 text-emerald-200" /></button>
                      <button
                        onClick={() => { update(a.id, { approval: "rejected", status: "expired" }); toast.success("Rejected"); }}
                        title="Reject"
                        className="rounded-md bg-rose-500/15 px-2 py-1 ring-1 ring-rose-300/30 hover:bg-rose-500/25"
                      ><X className="h-3 w-3 text-rose-200" /></button>
                    </>
                  )}
                  <button onClick={() => setEditing(a)} className="rounded-md bg-white/10 px-2 py-1 hover:bg-white/15"><Edit3 className="h-3 w-3 text-white" /></button>
                  <button onClick={() => setDeleting(a)} className="rounded-md bg-rose-500/15 px-2 py-1 hover:bg-rose-500/25"><Trash2 className="h-3 w-3 text-rose-300" /></button>
                </div>
              </td>
            </tr>
          ))}
          {filtered.length === 0 && <tr><td colSpan={7} className="py-10 text-center text-sm text-muted-foreground">No announcements in this view.</td></tr>}
        </DataTable>
      </Panel>

      {editing && (
        <Modal
          open
          onClose={() => setEditing(null)}
          title={items.some((x) => x.id === editing.id) ? "Edit announcement" : "New announcement"}
          size="lg"
          footer={
            <>
              <button onClick={() => setEditing(null)} className="rounded-xl bg-white/10 px-4 py-2 text-xs font-bold text-white">Cancel</button>
              <button
                onClick={() => {
                  if (editing.category === "Brand" && !editing.brandId) {
                    toast.error("Select a brand for brand-specific announcements");
                    return;
                  }
                  // Force placement consistency
                  const placement = editing.category === "Brand" ? "Brand pages" : editing.placement;
                  const final: Announcement = { ...editing, placement };
                  const exists = items.some((x) => x.id === editing.id);
                  if (exists) update(editing.id, final); else add(final);
                  toast.success(exists ? "Announcement updated" : "Announcement created");
                  setEditing(null);
                }}
                className="rounded-xl bg-gradient-to-r from-fuchsia-500 to-violet-600 px-4 py-2 text-xs font-bold text-white"
              >Save</button>
            </>
          }
        >
          {/* Category tabs inside the modal */}
          <div className="mb-4 inline-flex rounded-full bg-white/5 p-1 ring-1 ring-white/10">
            {(["Global", "Brand"] as const).map((c) => {
              const active = editing.category === c;
              return (
                <button
                  key={c}
                  onClick={() => setEditing({
                    ...editing,
                    category: c,
                    placement: c === "Brand" ? "Brand pages" : (editing.placement === "Brand pages" ? "Top bar" : editing.placement),
                    brandId: c === "Brand" ? editing.brandId : undefined,
                    brandName: c === "Brand" ? editing.brandName : undefined,
                  })}
                  className={
                    "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold transition " +
                    (active ? "bg-gradient-to-r from-fuchsia-500 to-violet-600 text-white" : "text-white/70 hover:text-white")
                  }
                >
                  {c === "Global" ? <Globe className="h-3 w-3" /> : <Building2 className="h-3 w-3" />}
                  {c === "Global" ? "Global announcement" : "Brand-specific"}
                </button>
              );
            })}
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Message" span={2}>
              <input className={fieldCls} value={editing.message} onChange={(e) => setEditing({ ...editing, message: e.target.value })} placeholder={editing.category === "Brand" ? "🎁 New funded challenge — 30% off this week" : "🎉 Spring promo: 25% bonus cashback"} />
            </Field>

            {editing.category === "Brand" && (
              <Field label="Brand" span={2}>
                <select
                  className={fieldCls}
                  value={editing.brandId ?? ""}
                  onChange={(e) => {
                    const b = adminBrands.find((x) => x.id === e.target.value);
                    setEditing({ ...editing, brandId: b?.id, brandName: b?.name });
                  }}
                >
                  <option value="">— Select a brand —</option>
                  {adminBrands.map((b) => (
                    <option key={b.id} value={b.id}>{b.name} · {b.category}</option>
                  ))}
                </select>
              </Field>
            )}

            <Field label="CTA label"><input className={fieldCls} value={editing.cta} onChange={(e) => setEditing({ ...editing, cta: e.target.value })} /></Field>
            <Field label="CTA link"><input className={fieldCls} value={editing.link} onChange={(e) => setEditing({ ...editing, link: e.target.value })} /></Field>

            {editing.category === "Global" && (
              <Field label="Placement">
                <select className={fieldCls} value={editing.placement} onChange={(e) => setEditing({ ...editing, placement: e.target.value as Announcement["placement"] })}>
                  <option>Top bar</option><option>Dashboard</option>
                </select>
              </Field>
            )}

            <Field label="Source">
              <select className={fieldCls} value={editing.source} onChange={(e) => setEditing({ ...editing, source: e.target.value as Announcement["source"] })}>
                <option value="Admin">Admin (auto-approved)</option>
                <option value="Brand">Brand submission</option>
              </select>
            </Field>

            <Field label="Approval">
              <select className={fieldCls} value={editing.approval} onChange={(e) => setEditing({ ...editing, approval: e.target.value as Announcement["approval"] })}>
                <option value="approved">approved</option>
                <option value="pending">pending</option>
                <option value="rejected">rejected</option>
              </select>
            </Field>

            <Field label="Status">
              <select className={fieldCls} value={editing.status} onChange={(e) => setEditing({ ...editing, status: e.target.value as Announcement["status"] })}>
                <option value="scheduled">scheduled</option><option value="active">active</option><option value="expired">expired</option>
              </select>
            </Field>

            <Field label="Start"><input className={fieldCls} value={editing.start} onChange={(e) => setEditing({ ...editing, start: e.target.value })} placeholder="Apr 28" /></Field>
            <Field label="End"><input className={fieldCls} value={editing.end} onChange={(e) => setEditing({ ...editing, end: e.target.value })} placeholder="May 5" /></Field>
          </div>

          {editing.category === "Brand" && editing.source === "Brand" && (
            <div className="mt-4 rounded-xl bg-amber-500/10 p-3 text-[11px] text-amber-100 ring-1 ring-amber-300/20">
              💡 Brand-submitted announcements arrive in <strong>Pending approval</strong>. Approve to publish them on the brand's page.
            </div>
          )}
        </Modal>
      )}

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => { if (deleting) { remove(deleting.id); toast.success("Announcement deleted"); } }}
        title="Delete announcement?"
        message="This will stop showing the banner immediately."
        confirmText="Delete"
      />
    </div>
  );
}
