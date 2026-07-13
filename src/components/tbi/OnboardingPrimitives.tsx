/**
 * Reusable presentation components for the TBI onboarding flow.
 * Premium glass aesthetic, mobile-first, design-system tokens only.
 */
import { ReactNode, useRef } from "react";
import { Check, Lock, Upload, X, Info, AlertTriangle, Bot, ChevronDown } from "lucide-react";
import type { TrustScoreMode, UploadedFile, TrustBreakdown } from "@/lib/tbi-onboarding";
import { UNLOCK_THRESHOLDS } from "@/lib/tbi-onboarding";
import { filterFilesByUploadLimit } from "@/lib/upload-limits";

/* ============================================================ */
export function StepProgressBar({ totalSteps, currentStep }: { totalSteps: number; currentStep: number }) {
  const pct = Math.min(100, Math.round((currentStep / totalSteps) * 100));
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-[11px] uppercase tracking-widest text-muted-foreground">
        <span>Step {currentStep} of {totalSteps}</span>
        <span className="text-violet-300">{pct}% complete</span>
      </div>
      <div className="relative h-2 overflow-hidden rounded-full bg-white/5 ring-1 ring-white/10">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-violet-500 via-violet-500 to-indigo-500 transition-[width] duration-500 ease-out"
          style={{ width: `${pct}%`, boxShadow: "0 0 24px oklch(0.7 0.22 310 / 0.6)" }}
        />
      </div>
      <div className="flex gap-1">
        {Array.from({ length: totalSteps }).map((_, i) => {
          const done = i < currentStep - 1;
          const active = i === currentStep - 1;
          return (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition ${
                done ? "bg-violet-400/70" : active ? "bg-violet-300" : "bg-white/10"
              }`}
            />
          );
        })}
      </div>
    </div>
  );
}

/* ============================================================ */
export function StepTitleBlock({ title, subtitle, description }: { title: string; subtitle?: string; description?: string }) {
  return (
    <div>
      {subtitle && <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-violet-300/80">{subtitle}</div>}
      <h2 className="mt-1 text-2xl font-bold leading-tight md:text-3xl">{title}</h2>
      {description && <p className="mt-2 max-w-xl text-sm text-muted-foreground">{description}</p>}
    </div>
  );
}

/* ============================================================ */
export function TrustScoreCard({
  score, maxScore = 10, status, helperText, locked,
}: {
  score: number | null;
  maxScore?: number;
  status: TrustScoreMode;
  helperText?: string;
  locked?: boolean;
}) {
  const label =
    status === "none" ? "Not Started" :
    status === "preliminary" ? "Preliminary Score" :
    status === "partial" ? "Partially Unlocked" :
    "Fully Unlocked";

  const tone =
    status === "full" ? "from-emerald-400 to-teal-500" :
    status === "partial" ? "from-sky-300 to-violet-400" :
    status === "preliminary" ? "from-violet-400 to-violet-400" :
    "from-zinc-500 to-zinc-700";

  const display = score == null ? "—" : score.toFixed(1);
  const cap = status === "preliminary" ? UNLOCK_THRESHOLDS.prelimCap : maxScore;

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.08] to-white/[0.02] p-6 backdrop-blur-xl">
      <div className={`absolute -right-16 -top-16 h-40 w-40 rounded-full bg-gradient-to-br ${tone} opacity-20 blur-3xl`} />
      <div className="relative">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Trust Score</span>
          {locked && <Lock className="h-3.5 w-3.5 text-muted-foreground" />}
        </div>
        <div className="mt-2 flex items-baseline gap-1">
          <span className="text-5xl font-bold tracking-tight">{display}</span>
          <span className="text-base text-muted-foreground">/ {cap}</span>
        </div>
        <div className={`mt-2 inline-flex items-center gap-1.5 rounded-full bg-white/5 px-2.5 py-1 text-[11px] font-semibold`}>
          <span className={`h-1.5 w-1.5 rounded-full bg-gradient-to-br ${tone}`} />
          {label}
        </div>
        {helperText && <p className="mt-3 text-xs text-muted-foreground">{helperText}</p>}
      </div>
    </div>
  );
}

/* ============================================================ */
export function TrustBreakdownCard({ breakdown }: { breakdown: TrustBreakdown }) {
  const items: { label: string; value: number | null; helper?: string }[] = [
    { label: "Transparency", value: breakdown.transparency, helper: "Identity, regulation, disclosures" },
    { label: "Proof Strength", value: breakdown.proof, helper: "Payouts, registration, reserves" },
    { label: "Trading Conditions", value: breakdown.conditions, helper: "Pricing, splits, payouts" },
    { label: "Community Presence", value: breakdown.community, helper: "Verified social proof" },
    { label: "Trader Experience", value: breakdown.experience, helper: "Real RebateBoard outcomes" },
  ];
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-sm">
      <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Breakdown</div>
      <div className="mt-3 space-y-3">
        {items.map((it) => {
          const locked = it.value == null;
          const score100 = locked ? 0 : it.value! > 10 ? it.value! : it.value! * 10;
          const pct = Math.max(0, Math.min(100, score100));
          return (
            <div key={it.label}>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{it.label}</span>
                <span className={`font-semibold ${locked ? "text-muted-foreground" : "text-foreground"}`}>
                  {locked ? "Locked" : `${Math.round(score100)} / 100`}
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
                <div
                  className={`h-full rounded-full transition-all ${locked ? "bg-white/10" : "rb-gradient-primary"}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ============================================================ */
export function UnlockProgressCard({ currentReviews }: { currentReviews: number }) {
  const { partial, full } = UNLOCK_THRESHOLDS;
  const state = currentReviews >= full ? "full" : currentReviews >= partial ? "partial" : "locked";
  const target = state === "full" ? full : state === "partial" ? full : partial;
  const pct = Math.min(100, Math.round((currentReviews / target) * 100));
  const copy =
    state === "locked" ? `${partial - currentReviews} more verified reviews to begin unlocking your Trust Score.` :
    state === "partial" ? `${full - currentReviews} more reviews to fully unlock your Trust Score.` :
    "Your Trust Score is fully unlocked.";

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Review Unlock</div>
          <div className="mt-1 text-lg font-bold">{currentReviews} <span className="text-sm text-muted-foreground">/ {target} reviews</span></div>
        </div>
        <div className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
          state === "full" ? "bg-emerald-500/15 text-emerald-300" :
          state === "partial" ? "bg-sky-500/15 text-sky-300" :
          "bg-white/10 text-muted-foreground"
        }`}>{state}</div>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/5">
        <div className="h-full rounded-full rb-gradient-primary transition-all" style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-3 text-xs text-muted-foreground">{copy}</p>
    </div>
  );
}

/* ============================================================ */
export function ImprovementSuggestions({ items }: { items: { text: string; scoreImpact?: string; priority?: "high" | "medium" | "low" }[] }) {
  if (items.length === 0) return null;
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="flex items-center gap-2">
        <Bot className="h-4 w-4 text-violet-300" />
        <div className="text-sm font-bold">Improve your score</div>
      </div>
      <ul className="mt-3 space-y-2">
        {items.map((it, i) => (
          <li key={i} className="flex items-start justify-between gap-3 rounded-xl bg-white/5 px-3 py-2">
            <div className="flex items-start gap-2 text-xs">
              <span className={`mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full ${
                it.priority === "high" ? "bg-rose-400" :
                it.priority === "medium" ? "bg-orange-300" :
                "bg-emerald-300"
              }`} />
              <span>{it.text}</span>
            </div>
            {it.scoreImpact && (
              <span className="shrink-0 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-300">{it.scoreImpact}</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ============================================================ */
export function InfoNoteCard({ title, body, variant = "info" }: { title: string; body: string; variant?: "info" | "warning" | "success" }) {
  const tones = {
    info: "border-violet-400/30 bg-violet-500/5 text-violet-100",
    warning: "border-orange-400/30 bg-orange-500/5 text-orange-100",
    success: "border-emerald-400/30 bg-emerald-500/5 text-emerald-100",
  } as const;
  const Icon = variant === "warning" ? AlertTriangle : variant === "success" ? Check : Info;
  return (
    <div className={`rounded-2xl border p-4 ${tones[variant]}`}>
      <div className="flex items-center gap-2 text-sm font-bold">
        <Icon className="h-4 w-4" /> {title}
      </div>
      <p className="mt-1 text-xs opacity-90">{body}</p>
    </div>
  );
}

/* ============================================================ */
export function FieldShell({ label, required, helper, error, children }: { label: string; required?: boolean; helper?: string; error?: string; children: ReactNode }) {
  return (
    <label className="block">
      <div className="mb-1.5 flex items-center justify-between text-xs">
        <span className="font-semibold text-white/90">{label} {required && <span className="text-rose-300">*</span>}</span>
        {helper && <span className="text-[10px] text-muted-foreground">{helper}</span>}
      </div>
      {children}
      {error && <div className="mt-1 text-[11px] text-rose-300">{error}</div>}
    </label>
  );
}

const fieldBase = "w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white placeholder:text-muted-foreground/70 outline-none transition focus:border-violet-400/40 focus:ring-2 focus:ring-violet-400/20 hover:border-white/20";

export function TextField({ value, onChange, placeholder, type = "text" }: { value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={fieldBase} />;
}

export function TextAreaField({ value, onChange, placeholder, rows = 3 }: { value: string; onChange: (v: string) => void; placeholder?: string; rows?: number }) {
  return <textarea rows={rows} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={fieldBase + " resize-none"} />;
}

export function SelectField({ value, onChange, options, placeholder = "Select…" }: { value: string; onChange: (v: string) => void; options: { label: string; value: string }[]; placeholder?: string }) {
  return (
    <div className="relative">
      <select value={value} onChange={(e) => onChange(e.target.value)} className={fieldBase + " appearance-none pr-8 [&>option]:bg-[var(--rb-bg-elevated)]"}>
        <option value="">{placeholder}</option>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  );
}

export function NumericStepperField({ value, onChange, min = 0, step = 1 }: { value: number; onChange: (v: number) => void; min?: number; step?: number }) {
  return (
    <div className="flex items-center gap-2">
      <button type="button" onClick={() => onChange(Math.max(min, value - step))} className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-lg hover:border-white/30">−</button>
      <input type="number" value={value} onChange={(e) => onChange(Math.max(min, Number(e.target.value) || 0))} className={fieldBase + " text-center"} />
      <button type="button" onClick={() => onChange(value + step)} className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-lg hover:border-white/30">+</button>
    </div>
  );
}

export function ToggleChoiceGroup({ value, onChange, options }: { value: string | null; onChange: (v: string) => void; options: { label: string; value: string }[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const active = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
              active
                ? "rb-gradient-primary text-white shadow-[0_0_16px_rgba(192,132,252,0.4)]"
                : "border border-white/10 bg-white/[0.04] text-muted-foreground hover:border-white/30 hover:text-white"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function CardChoiceGroup({ value, onChange, options }: { value: string | null; onChange: (v: string) => void; options: { label: string; value: string; description?: string; emoji?: string }[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {options.map((o) => {
        const active = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={`group relative overflow-hidden rounded-2xl border p-4 text-left transition ${
              active
                ? "border-violet-400/60 bg-gradient-to-br from-violet-500/10 to-violet-500/10 shadow-[0_0_24px_rgba(192,132,252,0.25)]"
                : "border-white/10 bg-white/[0.03] hover:border-white/30 hover:bg-white/[0.05]"
            }`}
          >
            <div className="flex items-start gap-2">
              {o.emoji && <span className="text-xl">{o.emoji}</span>}
              <div className="flex-1">
                <div className="text-sm font-bold">{o.label}</div>
                {o.description && <div className="mt-1 text-xs text-muted-foreground">{o.description}</div>}
              </div>
              <div className={`mt-0.5 grid h-5 w-5 place-items-center rounded-full ring-1 transition ${active ? "bg-violet-500 ring-violet-400" : "ring-white/20"}`}>
                {active && <Check className="h-3 w-3 text-white" />}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

export function MultiTagInput({ value, onChange, suggestions = [], placeholder }: { value: string[]; onChange: (v: string[]) => void; suggestions?: string[]; placeholder?: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const add = (raw: string) => {
    const v = raw.trim();
    if (!v || value.includes(v)) return;
    onChange([...value, v]);
  };
  const remove = (v: string) => onChange(value.filter((x) => x !== v));
  return (
    <div>
      <div className={fieldBase + " flex flex-wrap items-center gap-1.5 px-2 py-2"}>
        {value.map((tag) => (
          <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-violet-500/15 px-2 py-1 text-xs text-violet-100 ring-1 ring-violet-400/30">
            {tag}
            <button type="button" onClick={() => remove(tag)} className="text-violet-200 hover:text-white"><X className="h-3 w-3" /></button>
          </span>
        ))}
        <input
          ref={inputRef}
          placeholder={placeholder ?? "Type and press Enter…"}
          className="min-w-[120px] flex-1 bg-transparent px-1 text-sm outline-none placeholder:text-muted-foreground/60"
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              add((e.target as HTMLInputElement).value);
              (e.target as HTMLInputElement).value = "";
            } else if (e.key === "Backspace" && !(e.target as HTMLInputElement).value && value.length) {
              remove(value[value.length - 1]);
            }
          }}
        />
      </div>
      {suggestions.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {suggestions.filter((s) => !value.includes(s)).slice(0, 8).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => add(s)}
              className="rounded-full border border-white/10 bg-white/[0.03] px-2 py-0.5 text-[10px] text-muted-foreground hover:border-violet-400/40 hover:text-violet-200"
            >
              + {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function FileUploadBlock({
  files, onAdd, onRemove, accepted = "image/*,application/pdf", multiple = true, helper,
}: {
  files: UploadedFile[];
  onAdd: (files: File[]) => void;
  onRemove: (id: string) => void;
  accepted?: string;
  multiple?: boolean;
  helper?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="flex w-full flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-white/15 bg-white/[0.02] px-4 py-6 text-center transition hover:border-violet-400/40 hover:bg-violet-500/5"
      >
        <Upload className="h-5 w-5 text-violet-300" />
        <div className="text-sm font-semibold">Click or drag to upload</div>
        <div className="text-[11px] text-muted-foreground">{helper ?? "PDF, JPG, PNG · up to 10MB"}</div>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={accepted}
        multiple={multiple}
        className="hidden"
        onChange={(e) => {
          const list = Array.from(e.target.files ?? []);
          const { accepted, rejected } = filterFilesByUploadLimit(list);
          if (rejected.length) window.alert(rejected.join("\n"));
          if (accepted.length) onAdd(accepted);
          e.target.value = "";
        }}
      />
      {files.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {files.map((f) => (
            <li key={f.id} className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2 text-xs">
              <div className="flex min-w-0 items-center gap-2">
                <Check className="h-3.5 w-3.5 shrink-0 text-emerald-300" />
                <span className="truncate">{f.name}</span>
              </div>
              <button type="button" onClick={() => onRemove(f.id)} className="text-muted-foreground hover:text-rose-300"><X className="h-3.5 w-3.5" /></button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ============================================================ */
export function PublicTrustStateBanner({ state, reviewCount }: { state: TrustScoreMode; reviewCount: number }) {
  if (state === "none") return null;
  const meta =
    state === "preliminary" ? { tone: "from-violet-500/15 to-violet-500/10 border-violet-400/30 text-violet-100", label: "Preliminary Score", body: "Based on submitted brand data only · no trader reviews yet" } :
    state === "partial" ? { tone: "from-sky-500/15 to-violet-500/10 border-sky-400/30 text-sky-100", label: "Partially Unlocked", body: `Based on ${reviewCount} verified review${reviewCount === 1 ? "" : "s"}` } :
    { tone: "from-emerald-500/15 to-teal-500/10 border-emerald-400/30 text-emerald-100", label: "Fully Verified Trust Score", body: `Based on ${reviewCount} verified trader reviews` };

  return (
    <div className={`flex items-center justify-between gap-3 rounded-2xl border bg-gradient-to-r ${meta.tone} px-4 py-3 text-xs backdrop-blur`}>
      <div className="flex items-center gap-2">
        {state === "full" ? <Check className="h-4 w-4" /> : state === "partial" ? <Bot className="h-4 w-4" /> : <Info className="h-4 w-4" />}
        <div>
          <div className="font-bold">{meta.label}</div>
          <div className="opacity-80">{meta.body}</div>
        </div>
      </div>
    </div>
  );
}
