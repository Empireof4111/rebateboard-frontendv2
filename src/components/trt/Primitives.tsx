// Trader ROI Tracker — shared UI primitives
import type { ReactNode } from "react";
import { TrendingUp, TrendingDown, ArrowDown, ArrowUp, Sparkles, AlertTriangle, Info } from "lucide-react";
import type { TrtAccountStatus, TrtBrand, TrtInsight, TrtTransaction } from "@/lib/trt-store";
import { labelAccountType, labelCategory, labelStatus, money } from "@/lib/trt-store";

export function TrackerKpiCard({
  label, value, hint, trend, accent = "primary",
}: {
  label: string;
  value: string;
  hint?: string;
  trend?: "up" | "down" | "neutral";
  accent?: "primary" | "success" | "warning" | "destructive";
}) {
  const ringMap = {
    primary: "ring-primary/25",
    success: "ring-success/25",
    warning: "ring-warning/25",
    destructive: "ring-destructive/25",
  } as const;
  const trendColor = trend === "up" ? "text-success" : trend === "down" ? "text-destructive" : "text-muted-foreground";
  const TrendIcon = trend === "up" ? TrendingUp : TrendingDown;
  return (
    <div className={`glass card-hover rounded-2xl p-3.5 ring-1 sm:p-4 ${ringMap[accent]}`}>
      <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground sm:text-[11px]">
        {label}
      </div>
      <div className="mt-1.5 text-xl font-bold tracking-tight text-white tabular-nums sm:text-2xl">
        {value}
      </div>
      {hint && (
        <div className={`mt-1 inline-flex items-center gap-1 text-[10px] font-medium sm:text-[11px] ${trendColor}`}>
          {trend && trend !== "neutral" && <TrendIcon className="h-3 w-3" />}
          <span>{hint}</span>
        </div>
      )}
    </div>
  );
}

export function InsightCard({ insight }: { insight: TrtInsight }) {
  const map = {
    positive: { icon: Sparkles, bg: "bg-success/10 ring-success/25", chip: "bg-success/20 text-success", chipText: "Win" },
    watch: { icon: Info, bg: "bg-warning/10 ring-warning/25", chip: "bg-warning/20 text-accent", chipText: "Watch" },
    leak: { icon: AlertTriangle, bg: "bg-destructive/10 ring-destructive/25", chip: "bg-destructive/20 text-destructive", chipText: "Leak" },
  } as const;
  const { icon: Icon, bg, chip, chipText } = map[insight.tone];
  return (
    <div className={`flex flex-col gap-2 rounded-2xl p-4 ring-1 ${bg}`}>
      <div className="flex items-center justify-between gap-2">
        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${chip}`}>
          <Icon className="h-3 w-3" />
          {chipText}
        </span>
        {insight.metric && <span className="text-xs font-bold text-white tabular-nums">{insight.metric}</span>}
      </div>
      <div>
        <div className="text-sm font-semibold text-white">{insight.title}</div>
        <p className="mt-0.5 text-xs text-muted-foreground">{insight.body}</p>
      </div>
    </div>
  );
}

export function DirectionPill({ d }: { d: "income" | "expense" }) {
  return d === "income" ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-semibold text-success ring-1 ring-success/20">
      <ArrowDown className="h-3 w-3" /> In
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-destructive/15 px-2 py-0.5 text-[10px] font-semibold text-destructive ring-1 ring-destructive/25">
      <ArrowUp className="h-3 w-3" /> Out
    </span>
  );
}

export function StatusPill({ status }: { status: TrtTransaction["status"] }) {
  const map = {
    confirmed: "bg-success/15 text-success ring-success/20",
    pending: "bg-warning/15 text-accent ring-warning/20",
    cancelled: "bg-white/10 text-muted-foreground ring-white/10",
  } as const;
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${map[status]}`}>
      {status}
    </span>
  );
}

export function AccountStatusPill({ status }: { status: TrtAccountStatus }) {
  const map: Record<TrtAccountStatus, string> = {
    active: "bg-primary/15 text-primary ring-primary/25",
    funded: "bg-success/15 text-success ring-success/20",
    passed: "bg-success/15 text-success ring-success/20",
    breached: "bg-destructive/15 text-destructive ring-destructive/25",
    closed: "bg-white/10 text-muted-foreground ring-white/10",
    cancelled: "bg-white/10 text-muted-foreground ring-white/10",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${map[status]}`}>
      {labelStatus(status)}
    </span>
  );
}

export function BrandBadge({ brand }: { brand: TrtBrand }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-white/5 px-1.5 py-0.5 text-[11px] font-medium text-white/90 ring-1 ring-white/10">
      {brand.custom && <span className="grid h-3 w-3 place-items-center rounded-sm bg-violet-500/30 text-[7px] text-violet-200">C</span>}
      {brand.name}
    </span>
  );
}

export function EmptyTracker({ icon: Icon, title, description, action }: {
  icon?: React.ElementType;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-10 text-center">
      {Icon && (
        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white/5 text-accent ring-1 ring-white/10">
          <Icon className="h-5 w-5" />
        </div>
      )}
      <div>
        <div className="text-sm font-semibold text-white">{title}</div>
        {description && <p className="mx-auto mt-1 max-w-sm text-xs text-muted-foreground">{description}</p>}
      </div>
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}

export function TxRowMeta({ t }: { t: TrtTransaction }) {
  return (
    <span className="text-[11px] text-muted-foreground">
      {labelCategory(t.category)} · <BrandLabel brand={t.brand} />
    </span>
  );
}

function BrandLabel({ brand }: { brand: TrtBrand }) {
  return <span className="text-white/85">{brand.name}</span>;
}

export { labelAccountType, money };
