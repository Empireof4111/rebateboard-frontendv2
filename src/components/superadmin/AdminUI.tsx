import type { ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold leading-tight tracking-tight text-white md:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{subtitle}</p>}
      </div>
      {actions && <div className="-mx-1 flex flex-wrap items-center gap-2 px-1">{actions}</div>}
    </div>
  );
}

export function StatCard({
  label, value, delta, tone = "flat",
}: { label: string; value: string; delta?: string; tone?: "up" | "down" | "flat" }) {
  const Icon = tone === "up" ? ArrowUpRight : tone === "down" ? ArrowDownRight : Minus;
  const toneCls =
    tone === "up" ? "text-emerald-300 bg-emerald-500/10 ring-emerald-400/30"
    : tone === "down" ? "text-rose-300 bg-rose-500/10 ring-rose-400/30"
    : "text-muted-foreground bg-white/5 ring-white/10";
  return (
    <div className="glass card-hover rounded-2xl p-3.5 ring-1 ring-white/10 sm:p-4">
      <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground sm:text-[11px]">{label}</div>
      <div className="mt-1.5 text-xl font-bold tracking-tight text-white tabular-nums sm:text-2xl">{value}</div>
      {delta && (
        <div className={`mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${toneCls}`}>
          <Icon className="h-3 w-3" /> {delta}
        </div>
      )}
    </div>
  );
}

export function Panel({ title, action, children, compact = false }: { title: string; action?: ReactNode; children: ReactNode; compact?: boolean }) {
  return (
    <div className={`glass card-hover rounded-2xl ring-1 ring-white/10 ${compact ? "p-4" : "p-4 sm:p-5"}`}>
      <div className="mb-4 flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold tracking-tight text-white">{title}</h3>
        {action}
      </div>
      {children}
    </div>
  );
}

export function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    verified: "bg-emerald-500/15 text-emerald-300 ring-emerald-400/30",
    active: "bg-emerald-500/15 text-emerald-300 ring-emerald-400/30",
    published: "bg-emerald-500/15 text-emerald-300 ring-emerald-400/30",
    sent: "bg-emerald-500/15 text-emerald-300 ring-emerald-400/30",
    resolved: "bg-emerald-500/15 text-emerald-300 ring-emerald-400/30",
    pending: "bg-amber-500/15 text-amber-300 ring-amber-400/30",
    review: "bg-amber-500/15 text-amber-300 ring-amber-400/30",
    reviewing: "bg-amber-500/15 text-amber-300 ring-amber-400/30",
    investigating: "bg-amber-500/15 text-amber-300 ring-amber-400/30",
    scheduled: "bg-amber-500/15 text-amber-300 ring-amber-400/30",
    draft: "bg-white/10 text-muted-foreground ring-white/10",
    paused: "bg-white/10 text-muted-foreground ring-white/10",
    posted: "bg-violet-500/15 text-violet-300 ring-violet-400/30",
    responded: "bg-sky-500/15 text-sky-300 ring-sky-400/30",
    open: "bg-sky-500/15 text-sky-300 ring-sky-400/30",
    flagged: "bg-rose-500/15 text-rose-300 ring-rose-400/30",
    rejected: "bg-rose-500/15 text-rose-300 ring-rose-400/30",
    approved: "bg-sky-500/15 text-sky-300 ring-sky-400/30",
    paid: "bg-emerald-500/15 text-emerald-300 ring-emerald-400/30",
  };
  const cls = map[status] ?? "bg-white/10 text-muted-foreground ring-white/10";
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ring-1 ${cls}`}>
      {status}
    </span>
  );
}

export function SeverityPill({ severity }: { severity: string }) {
  const cls =
    severity === "high" ? "bg-rose-500/15 text-rose-300 ring-rose-400/30"
    : severity === "medium" ? "bg-amber-500/15 text-amber-300 ring-amber-400/30"
    : "bg-emerald-500/15 text-emerald-300 ring-emerald-400/30";
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ring-1 ${cls}`}>
      {severity}
    </span>
  );
}

export function DataTable({ head, children }: { head: ReactNode; children: ReactNode }) {
  return (
    <div className="-mx-4 overflow-x-auto sm:mx-0">
      <div className="min-w-full px-4 sm:px-0">
        <table className="w-full text-left text-sm">
          <thead className="sticky top-0 z-10 bg-[rgba(18,18,25,0.60)] text-[10px] uppercase tracking-[0.14em] text-muted-foreground backdrop-blur-md">
            <tr className="[&>th]:whitespace-nowrap [&>th]:py-2.5 [&>th]:pr-3 [&>th]:font-semibold">{head}</tr>
          </thead>
          <tbody className="text-white [&>tr]:border-t [&>tr]:border-white/5 [&>tr:hover]:bg-white/[0.02] [&>tr]:transition-colors [&>tr>td]:py-3 [&>tr>td]:pr-3 [&>tr>td]:align-middle">
            {children}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function Toolbar({ children }: { children: ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">{children}</div>
  );
}

export function Pill({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "good" | "warn" | "bad" }) {
  const cls =
    tone === "good" ? "bg-emerald-500/15 text-emerald-300 ring-emerald-400/30"
    : tone === "warn" ? "bg-amber-500/15 text-amber-300 ring-amber-400/30"
    : tone === "bad" ? "bg-rose-500/15 text-rose-300 ring-rose-400/30"
    : "bg-white/10 text-muted-foreground ring-white/10";
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 ${cls}`}>
      {children}
    </span>
  );
}

export function EmptyState({ icon: Icon, title, description, action }: { icon?: React.ElementType; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-10 text-center">
      {Icon && (
        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white/5 text-violet-300 ring-1 ring-white/10">
          <Icon className="h-5 w-5" />
        </div>
      )}
      <div>
        <div className="text-sm font-semibold text-white">{title}</div>
        {description && <p className="mx-auto mt-1 max-w-xs text-xs text-muted-foreground">{description}</p>}
      </div>
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}
