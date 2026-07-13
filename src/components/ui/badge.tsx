import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring/70 focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-[rgba(126,77,255,0.22)] bg-[rgba(126,77,255,0.16)] text-[var(--rb-purple-100)]",
        secondary:
          "border-white/10 bg-white/[0.07] text-secondary-foreground",
        destructive:
          "border-[rgba(239,68,68,0.26)] bg-[var(--rb-error-soft)] text-red-100",
        outline: "border-white/10 text-foreground",
        success: "border-[rgba(16,185,129,0.28)] bg-[var(--rb-success-soft)] text-emerald-100",
        info: "border-[rgba(59,130,246,0.28)] bg-[var(--rb-info-soft)] text-blue-100",
        warning: "border-[rgba(245,158,11,0.28)] bg-[var(--rb-warning-soft)] text-amber-100",
        preliminary: "border-[rgba(182,154,255,0.18)] bg-white/[0.06] text-[var(--rb-purple-200)]",
        partial: "border-[rgba(59,130,246,0.26)] bg-[var(--rb-info-soft)] text-blue-100",
        full: "border-[rgba(16,185,129,0.28)] bg-[var(--rb-success-soft)] text-emerald-100",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
