import { BadgeCheck } from "lucide-react";
import type { TbiState } from "@/lib/tbi-api";

type VerificationBadgeProps = {
  className?: string;
  size?: "profile" | "inline";
  state?: TbiState;
};

const sizeClass = {
  profile: "h-5 w-5 sm:h-6 sm:w-6",
  inline: "h-4 w-4",
} as const;

const stateClass: Record<TbiState, string> = {
  preliminary: "fill-slate-200 text-[#111827] drop-shadow-[0_0_10px_rgba(226,232,240,0.42)]",
  partial: "fill-orange-300 text-[#2b1306] drop-shadow-[0_0_10px_rgba(251,146,60,0.42)]",
  full: "fill-amber-300 text-[#2d1800] drop-shadow-[0_0_10px_rgba(253,230,138,0.44)]",
};

export function VerificationBadge({
  className = "",
  size = "profile",
  state = "preliminary",
}: VerificationBadgeProps) {
  return <BadgeCheck className={`${sizeClass[size]} ${stateClass[state]} ${className}`} />;
}
