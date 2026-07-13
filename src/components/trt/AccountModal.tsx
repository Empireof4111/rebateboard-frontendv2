// Add/edit account modal.
import { useEffect, useState } from "react";
import { X, Save } from "lucide-react";
import { BrandPicker } from "./BrandPicker";
import {
  addAccount, type TrtAccount, type TrtAccountStatus, type TrtAccountType, type TrtBrand,
} from "@/lib/trt-store";

const TYPES: { value: TrtAccountType; label: string }[] = [
  { value: "prop_challenge", label: "Prop · Challenge" },
  { value: "prop_funded", label: "Prop · Funded" },
  { value: "broker_live", label: "Broker · Live" },
  { value: "broker_demo", label: "Broker · Demo" },
  { value: "exchange", label: "Exchange" },
  { value: "tool_subscription", label: "Tool subscription" },
];

const STATUSES: TrtAccountStatus[] = ["active", "funded", "passed", "breached", "closed", "cancelled"];

export function AccountModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [name, setName] = useState("");
  const [brand, setBrand] = useState<TrtBrand | undefined>();
  const [type, setType] = useState<TrtAccountType>("prop_challenge");
  const [status, setStatus] = useState<TrtAccountStatus>("active");
  const [size, setSize] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (open) {
      setName(""); setBrand(undefined); setType("prop_challenge");
      setStatus("active"); setSize(""); setNotes("");
    }
  }, [open]);

  if (!open) return null;
  const valid = name && brand;

  const save = () => {
    if (!brand) return;
    const a: Omit<TrtAccount, "id"> = {
      name: name.trim(),
      brand, type, status,
      size: size ? Number(size) : undefined,
      openedAt: new Date().toISOString(),
      notes: notes.trim() || undefined,
    };
    addAccount(a);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-black/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-[rgba(18,18,25,0.95)] shadow-2xl backdrop-blur-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-white/5 px-5 py-4">
          <h2 className="text-lg font-bold text-white">Add account</h2>
          <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full text-muted-foreground hover:bg-white/5 hover:text-white" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-4 p-5">
          <div>
            <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Account name</div>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="FTMO 100K Phase 1"
              className="glass w-full rounded-xl bg-transparent px-3 py-2.5 text-sm text-white outline-none ring-1 ring-white/10"
            />
          </div>

          <BrandPicker value={brand} onChange={setBrand} />

          <div>
            <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Type</div>
            <div className="grid grid-cols-2 gap-1.5">
              {TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setType(t.value)}
                  className={`rounded-lg px-2 py-2 text-[11px] font-semibold transition ring-1 ${type === t.value ? "bg-primary/20 text-white ring-primary/40" : "bg-white/[0.03] text-muted-foreground ring-white/5 hover:bg-white/[0.06]"}`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Capital ($)</div>
              <input
                type="number" min={0}
                value={size}
                onChange={(e) => setSize(e.target.value)}
                placeholder="100000"
                className="glass w-full rounded-xl bg-transparent px-3 py-2.5 text-sm text-white outline-none ring-1 ring-white/10"
              />
            </div>
            <div>
              <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Status</div>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TrtAccountStatus)}
                className="glass w-full rounded-xl bg-transparent px-3 py-2.5 text-sm text-white outline-none ring-1 ring-white/10"
              >
                {STATUSES.map((s) => <option key={s} value={s} className="bg-[var(--rb-bg-elevated)] capitalize">{s}</option>)}
              </select>
            </div>
          </div>

          <div>
            <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Notes</div>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="glass w-full rounded-xl bg-transparent px-3 py-2 text-sm text-white outline-none ring-1 ring-white/10"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-white/5 px-5 py-4">
          <button onClick={onClose} className="glass-pill rounded-full px-3 py-1.5 text-xs text-white">Cancel</button>
          <button
            onClick={save}
            disabled={!valid}
            className="inline-flex items-center gap-1.5 rounded-full rb-gradient-primary px-3 py-1.5 text-xs font-bold text-white shadow-[0_0_18px_rgba(192,132,252,0.45)] disabled:opacity-40"
          >
            <Save className="h-3.5 w-3.5" /> Save
          </button>
        </div>
      </div>
    </div>
  );
}
