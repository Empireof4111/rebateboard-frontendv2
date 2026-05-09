// Universal Add Transaction drawer — handles both income & expense via steps.
import { useEffect, useMemo, useState } from "react";
import { X, ArrowDown, ArrowUp, Check, Sparkles, Save, Plus } from "lucide-react";
import { BrandPicker } from "./BrandPicker";
import {
  EXPENSE_CATEGORIES, INCOME_CATEGORIES, QUICK_TEMPLATES,
  addTransaction, labelCategory, getTrt,
  type TrtBrand, type TrtCategory, type TrtDirection, type TrtTransaction,
} from "@/lib/trt-store";

export function TransactionDrawer({
  open, onClose, defaultDirection = "expense",
}: {
  open: boolean;
  onClose: () => void;
  defaultDirection?: TrtDirection;
}) {
  const [direction, setDirection] = useState<TrtDirection>(defaultDirection);
  const [category, setCategory] = useState<TrtCategory>("challenge_fee");
  const [brand, setBrand] = useState<TrtBrand | undefined>();
  const [amount, setAmount] = useState("");
  const [currency] = useState("USD");
  const [date, setDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [accountId, setAccountId] = useState<string | undefined>();
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<TrtTransaction["status"]>("confirmed");
  const [saved, setSaved] = useState(false);

  const accounts = getTrt().accounts;

  useEffect(() => {
    if (open) {
      setDirection(defaultDirection);
      setCategory(defaultDirection === "income" ? "payout" : "challenge_fee");
      setBrand(undefined);
      setAmount("");
      setDate(new Date().toISOString().slice(0, 10));
      setAccountId(undefined);
      setNotes("");
      setStatus("confirmed");
      setSaved(false);
    }
  }, [open, defaultDirection]);

  const cats = direction === "expense" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
  const valid = brand && amount && Number(amount) > 0;
  const linkedAccountOptions = useMemo(() => accounts, [accounts]);

  const apply = (and?: "another") => {
    if (!valid || !brand) return;
    addTransaction({
      direction, category, brand,
      accountId,
      amount: Number(amount),
      currency,
      date: new Date(date).toISOString(),
      status,
      notes: notes.trim() || undefined,
    });
    setSaved(true);
    if (and === "another") {
      setAmount("");
      setNotes("");
      setTimeout(() => setSaved(false), 600);
    } else {
      setTimeout(() => onClose(), 350);
    }
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-stretch justify-end bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="ml-auto flex h-full w-full max-w-md flex-col overflow-y-auto border-l border-white/10 bg-[#150829]/95 shadow-2xl backdrop-blur-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-white/5 bg-[#150829]/95 px-5 py-4 backdrop-blur-xl">
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Trader ROI Tracker</div>
            <h2 className="text-lg font-bold text-white">Add transaction</h2>
          </div>
          <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full text-muted-foreground transition hover:bg-white/5 hover:text-white" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-5 p-5">
          {/* Step 1: Direction */}
          <div>
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Direction</div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => { setDirection("expense"); setCategory("challenge_fee"); }}
                className={`flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-semibold transition ring-1 ${direction === "expense" ? "bg-destructive/15 text-destructive ring-destructive/30" : "bg-white/[0.03] text-muted-foreground ring-white/5 hover:bg-white/[0.06]"}`}
              >
                <ArrowUp className="h-4 w-4" /> Money out
              </button>
              <button
                type="button"
                onClick={() => { setDirection("income"); setCategory("payout"); }}
                className={`flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-semibold transition ring-1 ${direction === "income" ? "bg-success/15 text-success ring-success/30" : "bg-white/[0.03] text-muted-foreground ring-white/5 hover:bg-white/[0.06]"}`}
              >
                <ArrowDown className="h-4 w-4" /> Money in
              </button>
            </div>
          </div>

          {/* Quick templates */}
          <div>
            <div className="mb-2 flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <Sparkles className="h-3 w-3 text-accent" /> Quick templates
            </div>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_TEMPLATES.map((tpl) => (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => { setDirection(tpl.direction); setCategory(tpl.category); }}
                  className="glass-pill rounded-full px-2.5 py-1 text-[11px] text-white/90 transition hover:bg-white/10"
                >
                  {tpl.label}
                </button>
              ))}
            </div>
          </div>

          {/* Step 2: Category */}
          <div>
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Type</div>
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
              {cats.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategory(c)}
                  className={`rounded-lg px-2 py-2 text-[11px] font-medium transition ring-1 ${category === c ? "bg-primary/20 text-white ring-primary/40" : "bg-white/[0.03] text-muted-foreground ring-white/5 hover:bg-white/[0.06]"}`}
                >
                  {labelCategory(c)}
                </button>
              ))}
            </div>
          </div>

          {/* Step 3: Brand */}
          <BrandPicker value={brand} onChange={setBrand} />

          {/* Step 4: Amount + date */}
          <div className="grid grid-cols-[1fr_auto] gap-3">
            <div>
              <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Amount</div>
              <div className="glass flex items-center gap-2 rounded-xl px-3 py-2.5 ring-1 ring-white/10">
                <span className="text-sm text-muted-foreground">$</span>
                <input
                  type="number" inputMode="decimal" min={0}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-transparent text-base font-semibold text-white outline-none tabular-nums"
                />
                <span className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] font-bold text-muted-foreground">{currency}</span>
              </div>
            </div>
            <div>
              <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Date</div>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="glass rounded-xl px-3 py-2.5 text-sm text-white outline-none ring-1 ring-white/10"
              />
            </div>
          </div>

          {/* Optional account link */}
          {linkedAccountOptions.length > 0 && (
            <div>
              <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Link account (optional)</div>
              <select
                value={accountId ?? ""}
                onChange={(e) => setAccountId(e.target.value || undefined)}
                className="glass w-full rounded-xl bg-transparent px-3 py-2.5 text-sm text-white outline-none ring-1 ring-white/10"
              >
                <option value="" className="bg-[#150829]">— None —</option>
                {linkedAccountOptions.map((a) => (
                  <option key={a.id} value={a.id} className="bg-[#150829]">
                    {a.name} ({a.brand.name})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Status */}
          <div>
            <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Status</div>
            <div className="grid grid-cols-3 gap-1.5">
              {(["confirmed", "pending", "cancelled"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatus(s)}
                  className={`rounded-lg px-2 py-1.5 text-[11px] font-semibold capitalize transition ring-1 ${status === s ? "bg-white/10 text-white ring-white/20" : "bg-white/[0.03] text-muted-foreground ring-white/5 hover:bg-white/[0.06]"}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Notes</div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Optional…"
              className="glass w-full rounded-xl bg-transparent px-3 py-2 text-sm text-white outline-none ring-1 ring-white/10 placeholder:text-muted-foreground"
            />
          </div>
        </div>

        <div className="sticky bottom-0 mt-auto flex items-center gap-2 border-t border-white/5 bg-[#150829]/95 p-4 backdrop-blur-xl">
          <button
            type="button"
            onClick={() => apply("another")}
            disabled={!valid}
            className="glass-pill inline-flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold text-white disabled:opacity-40"
          >
            <Plus className="h-3.5 w-3.5" /> Save & add another
          </button>
          <button
            type="button"
            onClick={() => apply()}
            disabled={!valid}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-600 px-3 py-2 text-xs font-bold text-white shadow-[0_0_22px_rgba(192,132,252,0.45)] disabled:opacity-40"
          >
            {saved ? <Check className="h-4 w-4" /> : <Save className="h-3.5 w-3.5" />}
            {saved ? "Saved" : "Save transaction"}
          </button>
        </div>
      </div>
    </div>
  );
}
