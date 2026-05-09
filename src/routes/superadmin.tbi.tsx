import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader, Panel, StatCard, DataTable, Pill } from "@/components/superadmin/AdminUI";
import { Modal, ConfirmDialog, Field, fieldCls, toast } from "@/components/superadmin/AdminActions";
import { useAdminCollection, calculateTbi, recomputeAllTbi, addAudit } from "@/lib/admin-store";
import { tbiQueue as seedQueue, tbiHistory as seedHistory, adminBrands, pendingReviews, openComplaints, type AdminBrand } from "@/lib/admin-data";
import { ArrowDown, ArrowUp, Flag, Calculator, RefreshCw, Edit3 } from "lucide-react";

export const Route = createFileRoute("/superadmin/tbi")({
  component: TBIPage,
});

type Weight = { id: string; label: string; value: number };
type QueueItem = typeof seedQueue[number] & { id: string };
type HistoryRow = typeof seedHistory[number] & { id: string };

const seedWeights: Weight[] = [
  { id: "w1", label: "Payout reliability", value: 30 },
  { id: "w2", label: "Complaint rate", value: 25 },
  { id: "w3", label: "Verified reviews", value: 20 },
  { id: "w4", label: "Transparency / KYB", value: 15 },
  { id: "w5", label: "Community signal", value: 10 },
];

function Sparkline({ data }: { data: number[] }) {
  const min = Math.min(...data) - 2;
  const max = Math.max(...data) + 2;
  const w = 80, h = 24;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / (max - min)) * h;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
  return (
    <svg width={w} height={h}>
      <polyline points={pts} fill="none" stroke="url(#g)" strokeWidth="1.5" />
      <defs>
        <linearGradient id="g" x1="0" x2="1">
          <stop offset="0" stopColor="rgb(232 121 249)" />
          <stop offset="1" stopColor="rgb(139 92 246)" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function TBIPage() {
  const weights = useAdminCollection<Weight>("tbiWeights", seedWeights);
  const queue = useAdminCollection<QueueItem>("tbiQueue", seedQueue.map((q, i) => ({ ...q, id: `q_${i}` })));
  const history = useAdminCollection<HistoryRow>("tbiHistory", seedHistory.map((h, i) => ({ ...h, id: `h_${i}` })));
  const brands = useAdminCollection<AdminBrand>("brands", adminBrands);

  const [calcOpen, setCalcOpen] = useState(false);
  const [override, setOverride] = useState<HistoryRow | null>(null);
  const [confirm, setConfirm] = useState<{ q: QueueItem; action: "approve" | "defer" | "override" } | null>(null);

  const totalWeight = weights.items.reduce((s, w) => s + w.value, 0);
  const industryAvg = useMemo(() => {
    const arr = brands.items;
    return arr.length ? (arr.reduce((s, b) => s + b.tbi, 0) / arr.length).toFixed(1) : "0";
  }, [brands.items]);
  const above90 = brands.items.filter((b) => b.tbi >= 90).length;
  const below70 = brands.items.filter((b) => b.tbi < 70).length;

  const handleSaveWeights = () => {
    if (totalWeight !== 100) {
      toast.error(`Weights must total 100% (currently ${totalWeight}%)`);
      return;
    }
    recomputeAllTbi(adminBrands, pendingReviews as never, openComplaints as never);
    addAudit({ actor: "@admin", action: "TBI weights saved & recalculated", target: "system" });
    toast.success("Weights saved · all brand scores recalculated");
  };

  const handleQueueAction = (q: QueueItem, action: "approve" | "defer" | "override") => {
    if (action === "approve") {
      const b = brands.items.find((x) => x.name === q.brand);
      if (b) brands.update(b.id, { tbi: q.proposed });
      addAudit({ actor: "@admin", action: `TBI ${q.action}d ${q.current}→${q.proposed}`, target: q.brand });
      queue.remove(q.id);
      toast.success(`${q.brand} updated to ${q.proposed}`);
    } else if (action === "defer") {
      queue.remove(q.id);
      toast.success(`Deferred ${q.brand}`);
    } else {
      const v = prompt(`Manual TBI override for ${q.brand} (0-100):`, String(q.current));
      if (v == null) return;
      const score = Math.max(0, Math.min(100, Number(v)));
      const b = brands.items.find((x) => x.name === q.brand);
      if (b) brands.update(b.id, { tbi: score });
      addAudit({ actor: "@admin", action: `TBI manual override → ${score}`, target: q.brand });
      queue.remove(q.id);
      toast.success(`${q.brand} overridden to ${score}`);
    }
  };

  return (
    <div>
      <PageHeader
        title="TBI Engine"
        subtitle="Tune Trust & Brand Index weights, calculator, queue and audit history."
        actions={
          <>
            <button onClick={() => setCalcOpen(true)} className="glass-pill inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-white">
              <Calculator className="h-3.5 w-3.5" /> Calculator
            </button>
            <button
              onClick={() => { recomputeAllTbi(adminBrands, pendingReviews as never, openComplaints as never); toast.success("All brand TBI recomputed"); }}
              className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-600 px-3 py-1.5 text-xs font-semibold text-white"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Recompute all
            </button>
          </>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Industry avg" value={industryAvg} delta="live" tone="up" />
        <StatCard label="Brands ≥90" value={String(above90)} delta="" tone="up" />
        <StatCard label="Brands <70" value={String(below70)} delta="needs action" tone="down" />
        <StatCard label="Pending changes" value={String(queue.items.length)} delta="in queue" tone="flat" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title={`Score weights · total ${totalWeight}%`}>
          <ul className="space-y-4">
            {weights.items.map((w) => (
              <li key={w.id}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="text-white">{w.label}</span>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={w.value}
                    onChange={(e) => weights.update(w.id, { value: Number(e.target.value) })}
                    className="w-16 rounded bg-white/5 px-2 py-1 text-right font-mono text-xs text-white ring-1 ring-white/10"
                  />
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/5">
                  <div className="h-full bg-gradient-to-r from-fuchsia-500 to-violet-600" style={{ width: `${w.value}%` }} />
                </div>
              </li>
            ))}
          </ul>
          {totalWeight !== 100 && (
            <p className="mt-3 text-[10px] text-rose-300">Weights must total 100% before saving.</p>
          )}
          <button
            onClick={handleSaveWeights}
            disabled={totalWeight !== 100}
            className="mt-5 w-full rounded-xl bg-gradient-to-r from-fuchsia-500 to-violet-600 py-2 text-xs font-bold text-white disabled:opacity-40"
          >
            Save & recalculate
          </button>
        </Panel>

        <Panel title={`Pending score changes — ${queue.items.length}`}>
          <ul className="space-y-3">
            {queue.items.map((q) => (
              <li key={q.id} className="rounded-xl bg-white/5 p-3 ring-1 ring-white/10">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">{q.brand}</span>
                  <span className={`inline-flex items-center gap-1 text-sm font-bold ${q.action === "upgrade" ? "text-emerald-300" : "text-rose-300"}`}>
                    {q.action === "upgrade" ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />}
                    {q.current} → {q.proposed}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{q.reason}</p>
                <div className="mt-2 flex gap-2">
                  <button onClick={() => setConfirm({ q, action: "approve" })} className="rounded-md bg-emerald-500/15 px-3 py-1 text-[10px] font-bold text-emerald-300 ring-1 ring-emerald-400/30">Approve</button>
                  <button onClick={() => handleQueueAction(q, "defer")} className="rounded-md bg-white/10 px-3 py-1 text-[10px] font-bold text-white">Defer</button>
                  <button onClick={() => handleQueueAction(q, "override")} className="rounded-md bg-rose-500/15 px-3 py-1 text-[10px] font-bold text-rose-300 ring-1 ring-rose-400/30">Override</button>
                </div>
              </li>
            ))}
            {queue.items.length === 0 && <li className="py-6 text-center text-xs text-muted-foreground">Queue empty.</li>}
          </ul>
        </Panel>
      </div>

      <div className="mt-6">
        <Panel title="TBI history & overrides">
          <DataTable head={<><th>Brand</th><th>Trend (6mo)</th><th>Current</th><th>Last change</th><th>Status</th><th></th></>}>
            {history.items.map((h) => {
              const current = h.history[h.history.length - 1];
              return (
                <tr key={h.id}>
                  <td className="font-semibold">{h.brand}</td>
                  <td><Sparkline data={h.history} /></td>
                  <td>
                    <span className={`font-mono font-bold ${current >= 90 ? "text-emerald-300" : current >= 80 ? "text-amber-300" : "text-rose-300"}`}>{current}</span>
                  </td>
                  <td className="text-xs text-muted-foreground">{h.lastChange}</td>
                  <td>{h.flagged ? <Pill tone="bad"><span className="inline-flex items-center gap-1"><Flag className="h-3 w-3" /> flagged</span></Pill> : <Pill tone="good">healthy</Pill>}</td>
                  <td className="text-right">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => setOverride(h)} className="inline-flex items-center gap-1 rounded-md bg-white/10 px-2 py-1 text-[10px] font-bold text-white"><Edit3 className="h-3 w-3" /> Override</button>
                      <button
                        onClick={() => { history.update(h.id, { flagged: !h.flagged }); toast.success(`${h.brand} ${h.flagged ? "un-flagged" : "flagged"}`); addAudit({ actor: "@admin", action: h.flagged ? "TBI un-flagged" : "TBI flagged", target: h.brand }); }}
                        className="rounded-md bg-rose-500/15 px-2 py-1 text-[10px] font-bold text-rose-300 ring-1 ring-rose-400/30"
                      >
                        {h.flagged ? "Un-flag" : "Flag"}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </DataTable>
        </Panel>
      </div>

      {/* Calculator modal */}
      {calcOpen && <CalculatorModal onClose={() => setCalcOpen(false)} />}

      {/* Override modal */}
      {override && (
        <OverrideModal
          row={override}
          onClose={() => setOverride(null)}
          onSave={(score, note) => {
            const newHist = [...override.history.slice(1), score];
            history.update(override.id, { history: newHist, lastChange: `${score >= override.history.at(-1)! ? "+" : ""}${score - override.history.at(-1)!} (admin override)` });
            const b = brands.items.find((x) => x.name === override.brand);
            if (b) brands.update(b.id, { tbi: score });
            addAudit({ actor: "@admin", action: `TBI override → ${score}${note ? ` (${note})` : ""}`, target: override.brand });
            toast.success(`${override.brand} TBI set to ${score}`);
            setOverride(null);
          }}
        />
      )}

      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={() => { if (confirm) handleQueueAction(confirm.q, confirm.action); }}
        title={confirm ? `Apply ${confirm.q.current} → ${confirm.q.proposed} for ${confirm.q.brand}?` : ""}
        message="Brand TBI score will be updated immediately and the change logged in the audit trail."
        confirmText="Apply change"
        tone="primary"
      />
    </div>
  );
}

function CalculatorModal({ onClose }: { onClose: () => void }) {
  const [v, setV] = useState({ payoutReliability: 90, complaintScore: 85, reviewAvg: 88, transparency: 80, community: 75 });
  const score = calculateTbi(v);
  const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement>) => setV({ ...v, [k]: Number(e.target.value) });
  return (
    <Modal open onClose={onClose} title="TBI Calculator" subtitle="Pure formula — adjust inputs to preview the resulting score." size="md">
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Payout reliability (30%)"><input type="number" min={0} max={100} className={fieldCls} value={v.payoutReliability} onChange={set("payoutReliability")} /></Field>
        <Field label="Complaint score (25%)"><input type="number" min={0} max={100} className={fieldCls} value={v.complaintScore} onChange={set("complaintScore")} /></Field>
        <Field label="Verified reviews (20%)"><input type="number" min={0} max={100} className={fieldCls} value={v.reviewAvg} onChange={set("reviewAvg")} /></Field>
        <Field label="Transparency (15%)"><input type="number" min={0} max={100} className={fieldCls} value={v.transparency} onChange={set("transparency")} /></Field>
        <Field label="Community (10%)"><input type="number" min={0} max={100} className={fieldCls} value={v.community} onChange={set("community")} /></Field>
      </div>
      <div className="mt-5 rounded-2xl bg-gradient-to-r from-fuchsia-500/20 to-violet-600/20 p-5 text-center ring-1 ring-fuchsia-400/30">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Calculated TBI</div>
        <div className={`mt-1 text-5xl font-black ${score >= 90 ? "text-emerald-300" : score >= 80 ? "text-amber-300" : "text-rose-300"}`}>{score}</div>
      </div>
    </Modal>
  );
}

function OverrideModal({ row, onClose, onSave }: { row: HistoryRow; onClose: () => void; onSave: (score: number, note: string) => void }) {
  const current = row.history[row.history.length - 1];
  const [score, setScore] = useState<number>(current);
  const [note, setNote] = useState("");
  return (
    <Modal
      open
      onClose={onClose}
      title={`Override TBI · ${row.brand}`}
      subtitle={`Current score ${current}. Manual overrides bypass auto-recompute.`}
      size="md"
      footer={
        <>
          <button onClick={onClose} className="rounded-xl bg-white/10 px-4 py-2 text-xs font-bold text-white">Cancel</button>
          <button onClick={() => onSave(score, note)} className="rounded-xl bg-gradient-to-r from-fuchsia-500 to-violet-600 px-4 py-2 text-xs font-bold text-white">Apply override</button>
        </>
      }
    >
      <div className="grid gap-3">
        <Field label="New score (0-100)"><input type="number" min={0} max={100} className={fieldCls} value={score} onChange={(e) => setScore(Number(e.target.value))} /></Field>
        <Field label="Reason (audit log)"><textarea rows={3} className={fieldCls} placeholder="e.g. verified payout audit Q2 — increased trust" value={note} onChange={(e) => setNote(e.target.value)} /></Field>
      </div>
    </Modal>
  );
}
