import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { PageHeader, Panel, DataTable, StatusPill, StatCard, Toolbar } from "@/components/superadmin/AdminUI";
import { toast } from "@/components/superadmin/AdminActions";
import { RefreshCw, Search, ShieldAlert } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { financeApi, type DisputeRecord, type DisputeStats } from "@/lib/finance-api";
import { ApiError } from "@/lib/api";

export const Route = createFileRoute("/superadmin/disputes")({
  component: DisputesPage,
});

type FilterStatus = "all" | "pending" | "reviewing" | "resolved" | "rejected";

function statusToDisplay(s: string): string {
  const map: Record<string, string> = { pending: "pending", reviewing: "reviewing", resolved: "approved", rejected: "rejected" };
  return map[s?.toLowerCase()] ?? s.toLowerCase();
}

function DisputesPage() {
  const { token } = useAuth();
  const [disputes, setDisputes] = useState<DisputeRecord[]>([]);
  const [stats, setStats] = useState<DisputeStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [q, setQ] = useState("");
  const [noteTarget, setNoteTarget] = useState<DisputeRecord | null>(null);
  const [noteText, setNoteText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [listRes, statsRes] = await Promise.all([
        financeApi.getAdminDisputes(token),
        financeApi.getDisputeStats(token),
      ]);
      if (listRes.payload) setDisputes(listRes.payload);
      if (statsRes.payload) setStats(statsRes.payload);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Failed to load disputes");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => disputes.filter((d) => {
    const matchStatus = filter === "all" || d.status?.toLowerCase() === filter;
    const matchQ = !q.trim() || `${d.title} ${d.brandName ?? ""} ${d.name ?? ""} ${d.emailAddress ?? ""}`.toLowerCase().includes(q.toLowerCase());
    return matchStatus && matchQ;
  }), [disputes, filter, q]);

  const moderate = async (id: number, status: string, adminNote?: string) => {
    if (!token) return;
    try {
      await financeApi.updateDisputeStatus(token, id, { status, adminNote });
      toast.success(`Dispute #${id} → ${status}`);
      load();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Update failed");
    }
  };

  const submitNote = async () => {
    if (!noteTarget || !token) return;
    setSubmitting(true);
    try {
      await financeApi.updateDisputeStatus(token, noteTarget.id, { status: noteTarget.status, adminNote: noteText });
      toast.success("Note saved");
      setNoteTarget(null);
      setNoteText("");
      load();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Failed to save note");
    } finally {
      setSubmitting(false);
    }
  };

  const severityColor = (s?: string) =>
    s === "high" ? "text-rose-400" : s === "medium" ? "text-amber-400" : "text-slate-400";

  const fmt = (d?: string) => d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";

  return (
    <div>
      <PageHeader title="Disputes" subtitle="User-reported complaints about brokers and exchanges." />

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Total" value={stats ? String(stats.total) : "—"} delta="all time" tone="flat" />
        <StatCard label="Open" value={stats ? String(stats.open) : "—"} delta="pending + reviewing" tone="flat" />
        <StatCard label="Resolved 30d" value={stats ? String(stats.resolved30d) : "—"} delta="last 30 days" tone="up" />
        <StatCard label="Rejected" value={stats ? String(stats.rejected) : "—"} delta="all time" tone="down" />
      </div>

      <Toolbar>
        {(["all", "pending", "reviewing", "resolved", "rejected"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize ring-1 transition ${filter === f ? "rb-gradient-primary text-white ring-violet-400/40" : "bg-white/5 text-muted-foreground ring-white/10 hover:text-white"}`}>
            {f}
          </button>
        ))}
        <div className="glass ml-auto flex items-center gap-2 rounded-full px-3 py-1.5 text-xs">
          <Search className="h-3.5 w-3.5 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search title, brand, user…" className="w-44 bg-transparent text-white outline-none" />
        </div>
        <button onClick={load} className="grid h-7 w-7 place-items-center rounded-md bg-white/5 text-white ring-1 ring-white/10">
          <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
        </button>
      </Toolbar>

      <Panel title={`Disputes — ${filtered.length}`}>
        <DataTable head={<><th>ID</th><th>Title</th><th>Brand</th><th>Reporter</th><th>Severity</th><th>Category</th><th>Status</th><th>Date</th><th></th></>}>
          {loading && <tr><td colSpan={9} className="py-8 text-center text-sm text-muted-foreground">Loading…</td></tr>}
          {!loading && filtered.map((d) => (
            <tr key={d.id}>
              <td className="font-mono text-xs text-muted-foreground">#{d.id}</td>
              <td className="max-w-[180px]">
                <div className="flex items-center gap-1 font-semibold">
                  <ShieldAlert className={`h-3 w-3 shrink-0 ${severityColor(d.severity)}`} />
                  <span className="truncate">{d.title}</span>
                </div>
              </td>
              <td className="text-sm">{d.brandName ?? d.brandSlug ?? "—"}</td>
              <td className="text-sm">
                {d.anonymous ? <span className="italic text-muted-foreground">Anonymous</span>
                  : d.reportedBy?.name ?? d.name ?? "—"}
              </td>
              <td className={`text-xs font-semibold capitalize ${severityColor(d.severity)}`}>{d.severity ?? "—"}</td>
              <td className="text-xs capitalize text-muted-foreground">{d.complaintCategory ?? "—"}</td>
              <td><StatusPill status={statusToDisplay(d.status)} /></td>
              <td className="text-xs text-muted-foreground">{fmt(d.createdAt)}</td>
              <td className="text-right">
                <div className="flex justify-end gap-1">
                  {d.status !== "reviewing" && d.status !== "resolved" && d.status !== "rejected" && (
                    <button onClick={() => moderate(d.id, "reviewing")}
                      className="rounded-md bg-sky-500/15 px-2 py-1 text-[10px] font-bold text-sky-300 ring-1 ring-sky-400/30">
                      Review
                    </button>
                  )}
                  {d.status !== "resolved" && (
                    <button onClick={() => moderate(d.id, "resolved")}
                      className="rounded-md bg-emerald-500/15 px-2 py-1 text-[10px] font-bold text-emerald-300 ring-1 ring-emerald-400/30">
                      Resolve
                    </button>
                  )}
                  {d.status !== "rejected" && (
                    <button onClick={() => moderate(d.id, "rejected")}
                      className="rounded-md bg-rose-500/15 px-2 py-1 text-[10px] font-bold text-rose-300 ring-1 ring-rose-400/30">
                      Reject
                    </button>
                  )}
                  <button onClick={() => { setNoteTarget(d); setNoteText(d.adminNote ?? ""); }}
                    className="rounded-md bg-white/5 px-2 py-1 text-[10px] font-bold text-white/60 ring-1 ring-white/10 hover:text-white">
                    Note
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {!loading && filtered.length === 0 && <tr><td colSpan={9} className="py-8 text-center text-sm text-muted-foreground">No disputes match.</td></tr>}
        </DataTable>
      </Panel>

      {noteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-surface p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white">Admin note — #{noteTarget.id}</h3>
            <p className="mt-1 truncate text-sm text-muted-foreground">{noteTarget.title}</p>
            <textarea value={noteText} onChange={(e) => setNoteText(e.target.value)} rows={4}
              placeholder="Internal notes only…"
              className="mt-4 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-accent" />
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setNoteTarget(null)} className="rounded-lg bg-white/5 px-4 py-2 text-sm text-white ring-1 ring-white/10 hover:bg-white/10">Cancel</button>
              <button onClick={submitNote} disabled={submitting}
                className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-black disabled:opacity-50">
                {submitting ? "Saving…" : "Save note"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
