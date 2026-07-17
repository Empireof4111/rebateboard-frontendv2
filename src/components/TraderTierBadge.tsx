import { BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils";

type TraderTierBadgeProps = {
  levelId?: string;
  label?: string;
  size?: "xs" | "sm" | "md";
  className?: string;
};

const sizeClass = {
  xs: "h-4 w-4",
  sm: "h-5 w-5",
  md: "h-6 w-6",
};

const iconSizeClass = {
  xs: "h-2.5 w-2.5",
  sm: "h-3 w-3",
  md: "h-3.5 w-3.5",
};

export function TraderTierBadge({ levelId = "explorer", label = "Trader tier", size = "sm", className }: TraderTierBadgeProps) {
  return (
    <span
      role="img"
      aria-label={label}
      title={label}
      className={cn(
        "relative inline-grid shrink-0 place-items-center overflow-hidden rounded-full border ring-1 ring-black/30",
        "shadow-[inset_0_1px_0_rgba(255,255,255,0.36),0_0_16px_rgba(126,77,255,0.2)]",
        sizeClass[size],
        traderTierBadgeClass(levelId),
        className,
      )}
    >
      <span className="pointer-events-none absolute inset-[2px] rounded-full bg-white/[0.12] opacity-70" aria-hidden />
      <BadgeCheck className={cn("relative z-10 drop-shadow", iconSizeClass[size])} aria-hidden />
    </span>
  );
}

export function traderTierBadgeClass(levelId?: string) {
  if (levelId === "elite") {
    return "border-emerald-200/55 bg-emerald-400/22 text-emerald-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.38),0_0_18px_rgba(52,211,153,0.28)]";
  }
  if (levelId === "platinum") {
    return "border-cyan-100/50 bg-cyan-300/18 text-cyan-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_0_18px_rgba(103,232,249,0.24)]";
  }
  if (levelId === "gold") {
    return "border-[#FFD866]/60 bg-[#FFC928]/22 text-[#FFE9A3] shadow-[inset_0_1px_0_rgba(255,255,255,0.46),0_0_20px_rgba(255,201,40,0.3)]";
  }
  if (levelId === "silver") {
    return "border-slate-100/45 bg-slate-200/18 text-slate-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.42),0_0_16px_rgba(203,213,225,0.18)]";
  }
  if (levelId === "bronze") {
    return "border-amber-300/45 bg-amber-700/22 text-amber-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.34),0_0_16px_rgba(180,83,9,0.22)]";
  }
  return "border-violet-200/35 bg-violet-400/16 text-violet-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.34),0_0_16px_rgba(126,77,255,0.22)]";
}
