import * as React from "react";

import { cn } from "@/lib/utils";

type LiquidGlassVariant =
  | "header"
  | "dropdown"
  | "popover"
  | "modal"
  | "caption"
  | "mobile-nav"
  | "subtle"
  | "strong";

const variantClass: Record<LiquidGlassVariant, string> = {
  header: "site-header-glass",
  dropdown: "navigation-glass-panel",
  popover: "navigation-glass-panel",
  modal: "liquid-glass liquid-glass-strong",
  caption: "liquid-glass liquid-glass-caption",
  "mobile-nav": "navigation-glass-panel mobile-navigation-drawer",
  subtle: "liquid-glass liquid-glass-subtle",
  strong: "liquid-glass liquid-glass-strong",
};

export type LiquidGlassSurfaceProps<T extends React.ElementType = "div"> = {
  as?: T;
  variant?: LiquidGlassVariant;
  className?: string;
  children?: React.ReactNode;
} & Omit<React.ComponentPropsWithoutRef<T>, "as" | "className" | "children">;

export function LiquidGlassSurface<T extends React.ElementType = "div">({
  as,
  variant = "subtle",
  className,
  children,
  ...props
}: LiquidGlassSurfaceProps<T>) {
  const Component = as ?? "div";

  return (
    <Component className={cn(variantClass[variant], className)} {...props}>
      {children}
    </Component>
  );
}
