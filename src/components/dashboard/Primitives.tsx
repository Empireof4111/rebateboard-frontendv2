import type { ReactNode } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-gradient text-2xl font-bold leading-tight tracking-tight md:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{subtitle}</p>}
      </div>
      {actions && <div className="-mx-1 flex flex-wrap items-center gap-2 px-1">{actions}</div>}
    </div>
  );
}

export function SectionHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3">
      <div className="min-w-0">
        <h2 className="text-base font-semibold tracking-tight text-white">{title}</h2>
        {subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function StatCard({
  label, value, hint, trend, accent,
}: { label: string; value: string; hint?: string; trend?: "up" | "down" | "neutral"; accent?: "primary" | "success" | "warning" | "destructive" }) {
  const normalizedValue = String(value ?? "").trim();
  const placeholderValues = new Set(["", "—", "--", "$0", "$0.00", "0.0"]);
  const displayValue = placeholderValues.has(normalizedValue) ? "No Data Yet" : value;
  const isPlaceholder = displayValue === "No Data Yet" || displayValue === "Coming Soon" || displayValue === "Awaiting Verification" || displayValue === "Not Enough Activity";
  const trendColor = trend === "up" ? "text-success" : trend === "down" ? "text-destructive" : "text-muted-foreground";
  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  const accentRing = {
    primary: "ring-primary/25",
    success: "ring-success/25",
    warning: "ring-violet-400/25",
    destructive: "ring-destructive/25",
  }[accent ?? "primary"];
  const accentBar = {
    primary: "from-violet-500 to-violet-400",
    success: "from-emerald-500 to-cyan-400",
    warning: "from-violet-500 to-violet-300",
    destructive: "from-rose-600 to-rose-400",
  }[accent ?? "primary"];
  return (
    <div className={`glass card-hover min-h-[104px] overflow-hidden rounded-2xl p-3.5 ring-1 sm:p-4 ${accentRing}`}>
      <div className={`mb-3 h-0.5 w-8 rounded-full bg-gradient-to-r ${accentBar}`} aria-hidden />
      <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground sm:text-[11px]">{label}</div>
      <div className={`mt-1.5 break-words font-bold tracking-tight text-white tabular-nums ${isPlaceholder ? "text-sm sm:text-base" : "text-xl sm:text-2xl"}`}>
        {displayValue}
      </div>
      {hint && (
        <div className={`mt-1 inline-flex items-center gap-1 text-[10px] font-medium sm:text-[11px] ${trendColor}`}>
          {trend && <TrendIcon className="h-3 w-3" aria-hidden />}
          <span>{hint}</span>
        </div>
      )}
    </div>
  );
}

export function Panel({ title, children, action, compact = false }: { title: string; children: ReactNode; action?: ReactNode; compact?: boolean }) {
  return (
    <div className={`glass card-hover rounded-2xl ${compact ? "p-4" : "p-4 sm:p-5"}`}>
      <div className="mb-4 flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold tracking-tight text-white">{title}</h3>
        {action}
      </div>
      {children}
    </div>
  );
}

export function Pill({ children, tone = "default" }: { children: ReactNode; tone?: "default" | "success" | "warning" | "destructive" | "primary" }) {
  const map = {
    default: "bg-white/10 text-white/85 ring-white/10",
    success: "bg-success/15 text-success ring-success/20",
    warning: "bg-violet-500/15 text-violet-200 ring-violet-400/25",
    destructive: "bg-destructive/15 text-destructive ring-destructive/25",
    primary: "bg-primary/15 text-primary ring-primary/25",
  } as const;
  return <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${map[tone]}`}>{children}</span>;
}

export function EmptyState({ icon: Icon, title, description, action }: { icon?: React.ElementType; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-10 text-center">
      {Icon && (
        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/15 text-violet-200 ring-1 ring-primary/25">
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

export function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <div className="glass rounded-2xl p-4">
      <div className="skeleton h-3 w-24" />
      <div className="mt-3 space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <div key={i} className="skeleton h-3" style={{ width: `${100 - i * 12}%` }} />
        ))}
      </div>
    </div>
  );
}
