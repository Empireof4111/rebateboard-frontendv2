import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[var(--rb-radius-md)] text-sm font-semibold transition-[transform,box-shadow,background,border-color,filter,color] duration-[var(--rb-motion-fast)] ease-[var(--rb-ease-out)] select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none active:translate-y-0 active:scale-[0.985] motion-reduce:transition-none motion-reduce:active:scale-100 motion-reduce:hover:translate-y-0 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "rb-gradient-primary text-primary-foreground shadow-[var(--rb-shadow-primary)] hover:-translate-y-0.5 hover:brightness-110",
        destructive:
          "bg-[var(--rb-error)] text-destructive-foreground shadow-sm hover:-translate-y-0.5 hover:brightness-110",
        outline:
          "border border-[rgba(126,77,255,0.28)] bg-[var(--rb-bg-elevated)] text-white shadow-sm hover:-translate-y-0.5 hover:border-[rgba(182,154,255,0.42)] hover:bg-[var(--rb-bg-card-hover)]",
        secondary:
          "border border-white/10 bg-[var(--rb-bg-elevated)] text-secondary-foreground shadow-sm hover:-translate-y-0.5 hover:bg-[var(--rb-bg-card-hover)]",
        ghost: "text-muted-foreground hover:bg-white/[0.06] hover:text-foreground",
        link: "text-[var(--rb-link)] underline-offset-4 hover:text-[var(--rb-link-hover)] hover:underline",
        premium:
          "rb-gradient-primary text-white shadow-[var(--rb-shadow-primary)] hover:-translate-y-0.5 hover:brightness-110",
        glass:
          "glass-pill text-foreground hover:-translate-y-0.5 hover:border-white/20 hover:text-white",
        success:
          "rb-gradient-success text-white shadow-[0_12px_32px_rgba(16,185,129,0.22)] hover:-translate-y-0.5 hover:brightness-110",
        warning:
          "bg-[var(--rb-warning)] text-[#1f1300] shadow-sm hover:-translate-y-0.5 hover:brightness-105",
      },
      size: {
        default: "h-10 px-4 py-2 sm:h-9",
        sm: "h-9 rounded-md px-3 text-xs sm:h-8",
        lg: "h-11 rounded-md px-8 sm:h-10",
        icon: "h-10 w-10 sm:h-9 sm:w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
