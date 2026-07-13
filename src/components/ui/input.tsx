import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-[var(--rb-radius-md)] border border-white/[0.08] bg-[var(--rb-bg-input)] px-3 py-2 text-base text-white shadow-sm transition-[border-color,box-shadow,background] duration-[var(--rb-motion-fast)] file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground/70 hover:border-white/16 focus-visible:border-[rgba(126,77,255,0.7)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(90,34,241,0.18)] disabled:cursor-not-allowed disabled:opacity-50 sm:h-9 md:text-sm",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
