import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Award, Edit2, Plus, RefreshCw, Trash2 } from "lucide-react";
import { PageHeader, Panel, DataTable, StatCard, StatusPill, Toolbar } from "@/components/superadmin/AdminUI";
import { Field, Modal, fieldCls, selectCls, toast } from "@/components/superadmin/AdminActions";
import { useAuth } from "@/lib/auth";
import {
  deleteAdminMeritAwardCategory,
  deleteAdminMeritAwardNominee,
  fetchAdminMeritAwards,
  saveAdminMeritAwardCategory,
  saveAdminMeritAwardNominee,
  saveAdminMeritAwardsSettings,
  updateAdminMeritAwardNomination,
  type MeritAwardCategory,
  type MeritAwardNomination,
  type MeritAwardNominee,
  type MeritAwardsBoard,
  type MeritAwardSeason,
  type MeritAwardStatus,
} from "@/lib/merit-awards-api";

export const Route = createFileRoute("/superadmin/merit-awards")({
  component: MeritAwardsAdminPage,
});

const statuses: { value: MeritAwardStatus; label: string }[] = [
  { value: "disabled", label: "Disabled" },
  { value: "announcement-soon", label: "Announcement Soon" },
  { value: "nominations-open", label: "Nominations Open" },
  { value: "voting-open", label: "Voting Open" },
  { value: "finalists-published", label: "Finalists Published" },
  { value: "winners-published", label: "Winners Published" },
  { value: "archived", label: "Archived" },
];

function MeritAwardsAdminPage() {
  const { token } = useAuth();
  const [board, setBoard] = useState<MeritAwardsBoard | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [category, setCategory] = useState<Partial<MeritAwardCategory> | null>(null);
  const [nominee, setNominee] = useState<Partial<MeritAwardNominee> | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const payload = await fetchAdminMeritAwards(token);
      if (payload) setBoard(payload);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to load Merit Awards");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const categoriesById = useMemo(() => {
    const map = new Map<number, MeritAwardCategory>();
    for (const item of board?.categories ?? []) map.set(item.id, item);
    return map;
  }, [board?.categories]);

  const updateSettings = async (patch: Partial<MeritAwardSeason>) => {
    if (!token || !board) return;
    setSaving(true);
    try {
      const season = await saveAdminMeritAwardsSettings(token, patch);
      if (season) setBoard((prev) => prev ? { ...prev, season } : prev);
      toast.success("Awards settings updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update awards");
    } finally {
      setSaving(false);
    }
  };

  const saveCategory = async (form: Partial<MeritAwardCategory>) => {
    if (!token) return;
    try {
      const saved = await saveAdminMeritAwardCategory(token, {
        ...form,
        name: String(form.name ?? "").trim(),
      });
      if (saved) {
        setBoard((prev) => prev ? {
          ...prev,
          categories: prev.categories.some((item) => item.id === saved.id)
            ? prev.categories.map((item) => item.id === saved.id ? saved : item)
            : [...prev.categories, saved],
        } : prev);
      }
      setCategory(null);
      toast.success("Category saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save category");
    }
  };

  const removeCategory = async (id: number) => {
    if (!token) return;
    try {
      await deleteAdminMeritAwardCategory(token, id);
      setBoard((prev) => prev ? { ...prev, categories: prev.categories.filter((item) => item.id !== id) } : prev);
      toast.success("Category removed");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to remove category");
    }
  };

  const saveNominee = async (form: Partial<MeritAwardNominee>) => {
    if (!token) return;
    try {
      const saved = await saveAdminMeritAwardNominee(token, {
        ...form,
        categoryId: Number(form.categoryId),
        name: String(form.name ?? "").trim(),
      });
      if (saved) {
        setBoard((prev) => prev ? {
          ...prev,
          nominees: prev.nominees.some((item) => item.id === saved.id)
            ? prev.nominees.map((item) => item.id === saved.id ? saved : item)
            : [...prev.nominees, saved],
        } : prev);
      }
      setNominee(null);
      toast.success("Nominee saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save nominee");
    }
  };

  const removeNominee = async (id: number) => {
    if (!token) return;
    try {
      await deleteAdminMeritAwardNominee(token, id);
      setBoard((prev) => prev ? { ...prev, nominees: prev.nominees.filter((item) => item.id !== id) } : prev);
      toast.success("Nominee removed");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to remove nominee");
    }
  };

  const updateNomination = async (item: MeritAwardNomination, status: string) => {
    if (!token) return;
    try {
      const saved = await updateAdminMeritAwardNomination(token, item.id, { status, internalNotes: item.internalNotes });
      if (saved) {
        setBoard((prev) => prev ? {
          ...prev,
          nominations: (prev.nominations ?? []).map((row) => row.id === saved.id ? saved : row),
        } : prev);
      }
      toast.success("Nomination updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update nomination");
    }
  };

  return (
    <div>
      <PageHeader
        title="Merit Awards"
        subtitle="Control public awards status, categories, nominees, nominations, and winner visibility."
        actions={
          <button onClick={load} className="inline-flex items-center gap-2 rounded-full bg-white/8 px-3 py-1.5 text-xs font-bold text-white ring-1 ring-white/10">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        }
      />

      <div className="mb-6 grid gap-3 md:grid-cols-4">
        <StatCard label="Categories" value={String(board?.stats?.categories ?? 0)} delta={`${board?.stats?.enabledCategories ?? 0} enabled`} tone="flat" />
        <StatCard label="Nominees" value={String(board?.stats?.nominees ?? 0)} delta={`${board?.stats?.approvedNominees ?? 0} approved`} tone="up" />
        <StatCard label="Nominations" value={String(board?.stats?.nominations ?? 0)} delta={`${board?.stats?.pendingNominations ?? 0} pending`} tone="flat" />
        <StatCard label="Votes" value={String(board?.stats?.votes ?? 0)} delta={`${board?.stats?.winners ?? 0} winners`} tone="up" />
      </div>

      {board && (
        <Panel title="Public season controls">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <Field label="Award year">
              <input
                className={fieldCls}
                value={board.season.awardYear}
                onChange={(event) => setBoard({ ...board, season: { ...board.season, awardYear: event.target.value } })}
                onBlur={() => updateSettings({ awardYear: board.season.awardYear })}
              />
            </Field>
            <Field label="Public status">
              <select
                className={selectCls}
                value={board.season.publicStatus}
                onChange={(event) => updateSettings({ publicStatus: event.target.value as MeritAwardStatus })}
                disabled={saving}
              >
                {statuses.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
              </select>
            </Field>
            <Field label="Visibility">
              <select
                className={selectCls}
                value={board.season.publicVisible ? "visible" : "hidden"}
                onChange={(event) => updateSettings({ publicVisible: event.target.value === "visible" })}
              >
                <option value="visible">Visible publicly</option>
                <option value="hidden">Hidden publicly</option>
              </select>
            </Field>
            <Field label="Hero title">
              <input
                className={fieldCls}
                value={board.season.heroTitle}
                onChange={(event) => setBoard({ ...board, season: { ...board.season, heroTitle: event.target.value } })}
                onBlur={() => updateSettings({ heroTitle: board.season.heroTitle })}
              />
            </Field>
            <Field label="Announcement message" span={2}>
              <textarea
                rows={3}
                className={fieldCls}
                value={board.season.announcementMessage ?? ""}
                onChange={(event) => setBoard({ ...board, season: { ...board.season, announcementMessage: event.target.value } })}
                onBlur={() => updateSettings({ announcementMessage: board.season.announcementMessage })}
              />
            </Field>
            <Field label="Hero copy" span={2}>
              <textarea
                rows={3}
                className={fieldCls}
                value={board.season.heroCopy ?? ""}
                onChange={(event) => setBoard({ ...board, season: { ...board.season, heroCopy: event.target.value } })}
                onBlur={() => updateSettings({ heroCopy: board.season.heroCopy })}
              />
            </Field>
          </div>
        </Panel>
      )}

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Panel
          title={`Award categories — ${board?.categories.length ?? 0}`}
          action={<button onClick={() => setCategory({ groupName: "Brands", enabled: true, displayOrder: (board?.categories.length ?? 0) + 1 })} className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-600 px-3 py-1.5 text-xs font-bold text-white"><Plus className="h-3 w-3" />Category</button>}
        >
          <DataTable head={<><th>Group</th><th>Name</th><th>Status</th><th></th></>}>
            {board?.categories.map((item) => (
              <tr key={item.id}>
                <td className="text-xs text-muted-foreground">{item.groupName}</td>
                <td className="font-semibold">{item.name}</td>
                <td><StatusPill status={item.enabled ? "active" : "paused"} /></td>
                <td className="text-right">
                  <button onClick={() => setCategory(item)} className="mr-1 rounded-lg bg-white/10 p-2"><Edit2 className="h-3 w-3" /></button>
                  <button onClick={() => removeCategory(item.id)} className="rounded-lg bg-rose-500/15 p-2 text-rose-300"><Trash2 className="h-3 w-3" /></button>
                </td>
              </tr>
            ))}
            {!board?.categories.length && <tr><td colSpan={4} className="py-8 text-center text-sm text-muted-foreground">No categories yet.</td></tr>}
          </DataTable>
        </Panel>

        <Panel
          title={`Nominees — ${board?.nominees.length ?? 0}`}
          action={<button onClick={() => setNominee({ categoryId: board?.categories[0]?.id, status: "pending" })} className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-600 px-3 py-1.5 text-xs font-bold text-white"><Plus className="h-3 w-3" />Nominee</button>}
        >
          <DataTable head={<><th>Nominee</th><th>Category</th><th>Status</th><th></th></>}>
            {board?.nominees.map((item) => (
              <tr key={item.id}>
                <td>
                  <div className="font-semibold">{item.name}</div>
                  <div className="text-xs text-muted-foreground">{item.nomineeType || "Nominee"}</div>
                </td>
                <td className="text-xs text-muted-foreground">{categoriesById.get(item.categoryId)?.name ?? "—"}</td>
                <td><StatusPill status={item.winner ? "verified" : item.status} /></td>
                <td className="text-right">
                  <button onClick={() => setNominee(item)} className="mr-1 rounded-lg bg-white/10 p-2"><Edit2 className="h-3 w-3" /></button>
                  <button onClick={() => removeNominee(item.id)} className="rounded-lg bg-rose-500/15 p-2 text-rose-300"><Trash2 className="h-3 w-3" /></button>
                </td>
              </tr>
            ))}
            {!board?.nominees.length && <tr><td colSpan={4} className="py-8 text-center text-sm text-muted-foreground">No nominees yet.</td></tr>}
          </DataTable>
        </Panel>
      </div>

      <div className="mt-6">
        <Panel title={`Nominations — ${board?.nominations?.length ?? 0}`}>
          <Toolbar>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/8 px-3 py-1.5 text-xs text-muted-foreground">
              <Award className="h-3.5 w-3.5 text-violet-200" />
              Public nominations appear here when the season is open.
            </div>
          </Toolbar>
          <DataTable head={<><th>Reference</th><th>Nominee</th><th>Category</th><th>Status</th><th></th></>}>
            {(board?.nominations ?? []).map((item) => (
              <tr key={item.id}>
                <td className="font-mono text-xs">{item.reference}</td>
                <td>
                  <div className="font-semibold">{item.nomineeName}</div>
                  <div className="max-w-md truncate text-xs text-muted-foreground">{item.reason}</div>
                </td>
                <td className="text-xs text-muted-foreground">{categoriesById.get(item.categoryId)?.name ?? "—"}</td>
                <td><StatusPill status={item.status} /></td>
                <td className="text-right">
                  <button onClick={() => updateNomination(item, "approved")} className="mr-1 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-200">Approve</button>
                  <button onClick={() => updateNomination(item, "rejected")} className="rounded-full bg-rose-500/15 px-3 py-1 text-xs font-bold text-rose-200">Reject</button>
                </td>
              </tr>
            ))}
            {!board?.nominations?.length && <tr><td colSpan={5} className="py-8 text-center text-sm text-muted-foreground">No nominations yet.</td></tr>}
          </DataTable>
        </Panel>
      </div>

      {category && <CategoryModal value={category} onClose={() => setCategory(null)} onSave={saveCategory} />}
      {nominee && board && <NomineeModal value={nominee} categories={board.categories} onClose={() => setNominee(null)} onSave={saveNominee} />}
    </div>
  );
}

function CategoryModal({ value, onClose, onSave }: { value: Partial<MeritAwardCategory>; onClose: () => void; onSave: (value: Partial<MeritAwardCategory>) => void }) {
  const [form, setForm] = useState(value);
  return (
    <Modal
      open
      onClose={onClose}
      title={form.id ? "Edit award category" : "New award category"}
      footer={<button onClick={() => onSave(form)} className="rounded-xl bg-gradient-to-r from-fuchsia-500 to-violet-600 px-4 py-2 text-xs font-bold text-white">Save category</button>}
    >
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Group"><input className={fieldCls} value={form.groupName ?? ""} onChange={(e) => setForm({ ...form, groupName: e.target.value })} /></Field>
        <Field label="Name"><input className={fieldCls} value={form.name ?? ""} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
        <Field label="Display order"><input type="number" className={fieldCls} value={form.displayOrder ?? 0} onChange={(e) => setForm({ ...form, displayOrder: Number(e.target.value) })} /></Field>
        <Field label="Status">
          <select className={selectCls} value={form.enabled === false ? "off" : "on"} onChange={(e) => setForm({ ...form, enabled: e.target.value === "on" })}>
            <option value="on">Enabled</option>
            <option value="off">Hidden</option>
          </select>
        </Field>
        <Field label="Description" span={2}><textarea rows={3} className={fieldCls} value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
      </div>
    </Modal>
  );
}

function NomineeModal({
  value,
  categories,
  onClose,
  onSave,
}: {
  value: Partial<MeritAwardNominee>;
  categories: MeritAwardCategory[];
  onClose: () => void;
  onSave: (value: Partial<MeritAwardNominee>) => void;
}) {
  const [form, setForm] = useState(value);
  return (
    <Modal
      open
      onClose={onClose}
      title={form.id ? "Edit nominee" : "New nominee"}
      size="lg"
      footer={<button onClick={() => onSave(form)} className="rounded-xl bg-gradient-to-r from-fuchsia-500 to-violet-600 px-4 py-2 text-xs font-bold text-white">Save nominee</button>}
    >
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Category">
          <select className={selectCls} value={form.categoryId ?? ""} onChange={(e) => setForm({ ...form, categoryId: Number(e.target.value) })}>
            <option value="">Select category</option>
            {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
          </select>
        </Field>
        <Field label="Nominee name"><input className={fieldCls} value={form.name ?? ""} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
        <Field label="Type"><input className={fieldCls} value={form.nomineeType ?? ""} onChange={(e) => setForm({ ...form, nomineeType: e.target.value })} placeholder="Brand, tool, educator..." /></Field>
        <Field label="Status">
          <select className={selectCls} value={form.status ?? "pending"} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </Field>
        <Field label="Website"><input className={fieldCls} value={form.website ?? ""} onChange={(e) => setForm({ ...form, website: e.target.value })} /></Field>
        <Field label="Logo URL"><input className={fieldCls} value={form.logoUrl ?? ""} onChange={(e) => setForm({ ...form, logoUrl: e.target.value })} /></Field>
        <Field label="Visibility flags" span={2}>
          <div className="flex flex-wrap gap-2 text-xs">
            <label className="rounded-full bg-white/8 px-3 py-2"><input type="checkbox" checked={Boolean(form.finalist)} onChange={(e) => setForm({ ...form, finalist: e.target.checked })} /> Finalist</label>
            <label className="rounded-full bg-white/8 px-3 py-2"><input type="checkbox" checked={Boolean(form.winner)} onChange={(e) => setForm({ ...form, winner: e.target.checked })} /> Winner</label>
          </div>
        </Field>
        <Field label="Summary" span={2}><textarea rows={3} className={fieldCls} value={form.summary ?? ""} onChange={(e) => setForm({ ...form, summary: e.target.value })} /></Field>
        <Field label="Winner reason" span={2}><textarea rows={3} className={fieldCls} value={form.winnerReason ?? ""} onChange={(e) => setForm({ ...form, winnerReason: e.target.value })} /></Field>
      </div>
    </Modal>
  );
}
