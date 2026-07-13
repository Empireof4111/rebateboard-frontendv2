import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel, DataTable, StatusPill, SeverityPill, StatCard, Toolbar } from "@/components/superadmin/AdminUI";
import { useEffect, useMemo, useState } from "react";
import {
  Paperclip, MessageSquare, Send, FileText, FileImage, FileSpreadsheet, Mail,
  Bot, ShieldAlert, ArrowUp, BadgeCheck, Eye, Download, ExternalLink,
} from "lucide-react";
import { deleteComplaint, fetchAdminComplaints, moderateComplaint, type ComplaintRecord, type ComplaintStatus } from "@/lib/complaints-api";
import { toast } from "sonner";

export const Route = createFileRoute("/superadmin/complaints")({
  component: ComplaintsPage,
});

function ComplaintsPage() {
  const [items, setItems] = useState<ComplaintRecord[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const [preview, setPreview] = useState<{ name: string; url: string; type: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [adminNoteDraft, setAdminNoteDraft] = useState("");
  const [brandResponseDraft, setBrandResponseDraft] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadComplaints() {
      try {
        const next = await fetchAdminComplaints();
        if (cancelled) return;
        setItems(next);
        setActiveId((current) => (current && next.some((item) => item.id === current) ? current : next[0]?.id ?? ""));
      } catch (error) {
        if (!cancelled) {
          toast.error(error instanceof Error ? error.message : "Unable to load complaints");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadComplaints();
    return () => {
      cancelled = true;
    };
  }, []);

  const active = items.find((c) => c.id === activeId) ?? items[0] ?? null;

  useEffect(() => {
    setAdminNoteDraft(active?.adminNote ?? "");
    setBrandResponseDraft(active?.firmReply?.text ?? "");
  }, [active?.id, active?.adminNote, active?.firmReply?.text]);

  const stats = useMemo(() => {
    const open = items.filter((c) => c.status !== "resolved" && c.status !== "rejected").length;
    const high = items.filter((c) => c.severity === "high").length;
    const resolved = items.filter((c) => c.status === "resolved").length;
    const avgCredibility = items.length
      ? (items.reduce((sum, item) => sum + item.credibility, 0) / items.length).toFixed(0)
      : "0";

    return { open, high, resolved, avgCredibility };
  }, [items]);

  const sevWord = useMemo(
    () => (active ? active.severity[0].toUpperCase() + active.severity.slice(1) : "Medium"),
    [active],
  );

  async function applyModeration(input: {
    status?: ComplaintStatus;
    severity?: "low" | "medium" | "high";
    adminNote?: string;
    brandResponse?: string;
  }) {
    if (!active) return;

    try {
      const updated = await moderateComplaint(active.reportId, input);
      setItems((current) => current.map((item) => (item.id === active.id ? updated : item)));
      toast.success("Complaint updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update complaint");
    }
  }

  async function saveAdminNote() {
    await applyModeration({ adminNote: adminNoteDraft });
  }

  async function postBrandResponse() {
    await applyModeration({ status: "responded", brandResponse: brandResponseDraft });
  }

  async function requestBrandResponse() {
    await applyModeration({
      status: "reviewing",
      adminNote: adminNoteDraft || "Brand response requested by moderation team.",
    });
  }

  async function removeActiveComplaint() {
    if (!active) return;
    try {
      await deleteComplaint(active.reportId);
      setItems((current) => {
        const next = current.filter((item) => item.id !== active.id);
        setActiveId(next[0]?.id ?? "");
        return next;
      });
      toast.success("Complaint deleted");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to delete complaint");
    }
  }

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading complaints...</div>;
  }

  if (!active) {
    return (
      <div>
        <PageHeader title="Complaints" subtitle="Live complaint moderation for user-reported issues." />
        <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-8 text-sm text-muted-foreground">
          No complaints found yet.
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Complaints" subtitle="Same complaint, same proof, same story the user sees - with admin tools." />

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Open" value={String(stats.open)} delta="Live queue" tone="down" />
        <StatCard label="High severity" value={String(stats.high)} delta="Needs attention" tone="down" />
        <StatCard label="Resolved" value={String(stats.resolved)} delta="All time" tone="up" />
        <StatCard label="Avg credibility" value={stats.avgCredibility} delta="Across cases" tone="flat" />
      </div>

      <Toolbar>
        {(["pending", "reviewing", "responded", "resolved", "rejected"] as const).map((s) => (
          <button
            key={s}
            onClick={() => void applyModeration({ status: s })}
            className="rounded-full bg-white/5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground ring-1 ring-white/10 hover:bg-white/10"
          >
            {s}
          </button>
        ))}
      </Toolbar>

      <div className="grid gap-4 lg:grid-cols-[1fr_460px]">
        <Panel title="All complaints">
          <DataTable head={<><th>ID</th><th>Brand</th><th>User</th><th>Category</th><th>Severity</th><th>Status</th><th>Evidence</th><th>Time</th></>}>
            {items.map((c) => (
              <tr key={c.id} onClick={() => setActiveId(c.id)} className={`cursor-pointer ${activeId === c.id ? "bg-violet-500/5" : "hover:bg-white/5"}`}>
                <td className="font-mono text-xs text-muted-foreground">{c.id}</td>
                <td className="font-semibold">{c.brand}</td>
                <td className="text-muted-foreground">{c.anonymous ? "Anonymous" : c.user}</td>
                <td>{c.category}</td>
                <td><SeverityPill severity={c.severity} /></td>
                <td><StatusPill status={c.status} /></td>
                <td className="font-mono">{c.evidence}</td>
                <td className="text-xs text-muted-foreground">{c.time}</td>
              </tr>
            ))}
          </DataTable>
        </Panel>

        <div className="space-y-4">
          <Panel title={`Complaint ${active.id}`} action={<button onClick={() => void removeActiveComplaint()} className="rounded-lg bg-rose-500/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-rose-300 ring-1 ring-rose-400/30">Delete</button>}>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-white">{active.brand}</span>
                  <SeverityPill severity={active.severity} />
                </div>
                <h3 className="text-sm font-semibold text-white leading-snug">{active.title}</h3>
                <p className="text-[11px] text-muted-foreground">
                  By <span className="font-semibold text-white">{active.anonymous ? "Anonymous trader" : active.user}</span> ·{" "}
                  {active.category} · {active.time}
                </p>
              </div>

              <div className="grid grid-cols-4 gap-1">
                {(["posted", "reviewing", "responded", "resolved"] as const).map((s, i) => {
                  const order = ["pending", "posted", "reviewing", "responded", "resolved"];
                  const currentIdx = Math.max(order.indexOf(active.status), 0);
                  const targetIdx = s === "posted" ? 1 : order.indexOf(s);
                  const done = targetIdx <= currentIdx;
                  return (
                    <div key={s} className="flex flex-col items-center gap-1">
                      <div className={`h-1.5 w-full rounded-full ${done ? "bg-gradient-to-r from-violet-400 to-violet-400" : "bg-white/10"}`} />
                      <span className={`text-[10px] capitalize ${done ? "text-white" : "text-muted-foreground"}`}>{s}</span>
                    </div>
                  );
                })}
              </div>

              <section className="rounded-xl bg-white/[0.03] p-3 ring-1 ring-white/10">
                <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">The story</h4>
                <p className="mt-1.5 whitespace-pre-line text-xs leading-relaxed text-white/90">{active.description}</p>
              </section>

              <section className="grid grid-cols-2 gap-2 text-[11px]">
                <ContextRow k="Account" v={`${active.accountType} · ${active.accountSize}`} />
                <ContextRow k="Platform" v={active.platform} />
                <ContextRow k="Style" v={active.tradingStyle} />
                <ContextRow k="Country" v={active.country} />
                <ContextRow k="Expectation" v={active.expectation} />
                <ContextRow k="Severity" v={sevWord} />
              </section>

              <section>
                <div className="mb-2 flex items-center justify-between">
                  <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Evidence ({active.evidenceFiles.length})
                  </h4>
                  {active.evidenceFiles.length > 0 && (
                    <span className="text-[10px] text-muted-foreground">Click to view proof</span>
                  )}
                </div>

                {active.evidenceFiles.length === 0 ? (
                  <div className="rounded-lg bg-white/[0.02] p-3 text-[11px] text-muted-foreground ring-1 ring-dashed ring-white/10">
                    No evidence attached by user.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {active.evidenceFiles.map((f, i) => {
                      const Icon = f.type === "image" ? FileImage : f.type === "pdf" ? FileText : f.type === "csv" ? FileSpreadsheet : Mail;
                      return (
                        <button
                          key={i}
                          onClick={() => setPreview({ name: f.name, url: f.url, type: f.type })}
                          className="group flex items-center gap-2 rounded-lg bg-white/5 p-2 text-left ring-1 ring-white/10 transition hover:bg-violet-300/10 hover:ring-violet-300/40"
                        >
                          {f.type === "image" && f.url !== "#" ? (
                            <img src={f.url} alt="" className="h-10 w-10 rounded object-cover" />
                          ) : (
                            <div className="grid h-10 w-10 place-items-center rounded bg-white/5 ring-1 ring-white/10">
                              <Icon className="h-4 w-4 text-violet-300" />
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-[11px] font-medium text-white">{f.name}</div>
                            <div className="text-[10px] uppercase text-muted-foreground">{f.type}</div>
                          </div>
                          <Eye className="h-3 w-3 text-muted-foreground transition group-hover:text-white" />
                        </button>
                      );
                    })}
                  </div>
                )}
              </section>

              {active.firmReply && (
                <section className="rounded-xl bg-gradient-to-br from-violet-500/10 to-violet-500/10 p-3 ring-1 ring-violet-300/30">
                  <div className="flex items-center gap-2">
                    <BadgeCheck className="h-3.5 w-3.5 text-violet-200" />
                    <h4 className="text-xs font-semibold text-white">Official response from {active.brand}</h4>
                    <span className="ml-auto text-[10px] text-muted-foreground">{active.firmReply.date}</span>
                  </div>
                  <p className="mt-1.5 text-xs text-white/90">{active.firmReply.text}</p>
                </section>
              )}

              <section className="grid grid-cols-2 gap-2">
                <div className="rounded-xl bg-gradient-to-br from-violet-500/15 to-violet-500/15 p-3 ring-1 ring-violet-300/30">
                  <div className="flex items-center gap-1.5">
                    <Bot className="h-3 w-3 text-violet-200" />
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-white/80">Credibility</span>
                  </div>
                  <div className="mt-1 text-xl font-bold text-white">{active.credibility}<span className="text-[10px] text-muted-foreground"> / 100</span></div>
                  <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full bg-gradient-to-r from-violet-400 to-violet-400" style={{ width: `${active.credibility}%` }} />
                  </div>
                </div>
                <div className="rounded-xl bg-white/[0.03] p-3 ring-1 ring-white/10">
                  <div className="flex items-center gap-1.5">
                    <ShieldAlert className="h-3 w-3 text-rose-300" />
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-white/80">Community</span>
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-xs text-white">
                    <span className="inline-flex items-center gap-1"><ArrowUp className="h-3 w-3 text-violet-300" />{active.upvotes}</span>
                    <span className="inline-flex items-center gap-1"><MessageSquare className="h-3 w-3 text-violet-300" />{active.comments}</span>
                  </div>
                  <div className="mt-1 text-[10px] text-muted-foreground">Same-issue upvotes & replies</div>
                </div>
              </section>

              <section>
                <h4 className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Timeline</h4>
                <ol className="relative space-y-3 border-l border-white/10 pl-4">
                  {active.timeline.map((t, i) => (
                    <li key={i} className="relative">
                      <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-gradient-to-br from-violet-400 to-violet-500 ring-2 ring-[var(--rb-bg-elevated)]" />
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-white">{t.stage}</span>
                        <span className="text-muted-foreground">{t.time}</span>
                      </div>
                      <p className="mt-0.5 text-[11px] text-muted-foreground"><span className="text-violet-300">{t.actor}</span> · {t.note}</p>
                    </li>
                  ))}
                </ol>
              </section>
            </div>
          </Panel>

          <Panel title="Admin notes">
            <textarea
              rows={3}
              value={adminNoteDraft}
              onChange={(e) => setAdminNoteDraft(e.target.value)}
              className="w-full rounded-lg bg-white/5 px-3 py-2 text-sm text-white ring-1 ring-white/10"
              placeholder="Internal note (not visible to user)..."
            />
            <div className="mt-2 flex justify-end">
              <button onClick={() => void saveAdminNote()} className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 px-3 py-1.5 text-xs font-bold text-white">
                <MessageSquare className="h-3 w-3" /> Save note
              </button>
            </div>
          </Panel>

          <Panel title="Brand response">
            <textarea
              rows={3}
              value={brandResponseDraft}
              onChange={(e) => setBrandResponseDraft(e.target.value)}
              className="w-full rounded-lg bg-white/5 px-3 py-2 text-sm text-white ring-1 ring-white/10"
              placeholder="Public response from the brand..."
            />
            <div className="mt-2 flex justify-end gap-2">
              <button onClick={() => void requestBrandResponse()} className="rounded-xl bg-white/10 px-3 py-1.5 text-xs font-bold text-white">Request response</button>
              <button onClick={() => void postBrandResponse()} className="inline-flex items-center gap-1.5 rounded-xl rb-gradient-primary px-3 py-1.5 text-xs font-bold text-white">
                <Send className="h-3 w-3" /> Post response
              </button>
            </div>
          </Panel>
        </div>
      </div>

      {preview && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setPreview(null)}>
          <div className="relative max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-2xl bg-[var(--rb-bg-card)] ring-1 ring-white/10" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between gap-2 border-b border-white/10 p-3">
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-white">{preview.name}</div>
                <div className="text-[10px] uppercase text-muted-foreground">{preview.type}</div>
              </div>
              <div className="flex items-center gap-1">
                {preview.url !== "#" && (
                  <a href={preview.url} target="_blank" rel="noreferrer" className="rounded-lg bg-white/5 p-2 text-white ring-1 ring-white/10 hover:bg-white/10" title="Open in new tab">
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
                {preview.url !== "#" && (
                  <a href={preview.url} download className="rounded-lg bg-white/5 p-2 text-white ring-1 ring-white/10 hover:bg-white/10" title="Download">
                    <Download className="h-3.5 w-3.5" />
                  </a>
                )}
                <button onClick={() => setPreview(null)} className="rounded-lg bg-white/5 px-3 py-2 text-xs font-bold text-white ring-1 ring-white/10 hover:bg-white/10">
                  Close
                </button>
              </div>
            </div>
            <div className="max-h-[75vh] overflow-auto p-4">
              {preview.type === "image" && preview.url !== "#" ? (
                <img src={preview.url} alt={preview.name} className="mx-auto max-h-[70vh] rounded-lg" />
              ) : (
                <div className="grid place-items-center rounded-xl bg-white/[0.03] p-10 text-center ring-1 ring-white/10">
                  <Paperclip className="mb-2 h-8 w-8 text-violet-300" />
                  <div className="text-sm font-semibold text-white">{preview.name}</div>
                  <div className="mt-1 text-[11px] text-muted-foreground">
                    Preview not available for this file type. Use Download or Open to view.
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ContextRow({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-lg bg-white/[0.03] px-2.5 py-1.5 ring-1 ring-white/10">
      <span className="text-muted-foreground">{k}</span>
      <span className="truncate text-right font-medium text-white">{v}</span>
    </div>
  );
}
