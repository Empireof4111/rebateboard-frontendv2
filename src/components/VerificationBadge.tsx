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
  preliminary: "fill-slate-200 text-[#111827] drop-shadow-[0_0_10px_rgba(226,232,240,0.40)]",
  partial: "fill-[#c7894a] text-[#1f1207] drop-shadow-[0_0_10px_rgba(199,137,74,0.34)]",
  full: "fill-[var(--rb-full-unlock-gold)] text-[#241600] drop-shadow-[0_0_12px_rgba(255,201,40,0.42)]",
};

export function VerificationBadge({
  className = "",
  size = "profile",
  state = "preliminary",
}: VerificationBadgeProps) {
  return <BadgeCheck className={`${sizeClass[size]} ${stateClass[state]} ${className}`} />;
}
