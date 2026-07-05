import { BadgeCheck } from "lucide-react";

type VerificationBadgeProps = {
  className?: string;
  size?: "profile" | "inline";
};

const sizeClass = {
  profile: "h-5 w-5 sm:h-6 sm:w-6",
  inline: "h-4 w-4",
} as const;

export function VerificationBadge({ className = "", size = "profile" }: VerificationBadgeProps) {
  return <BadgeCheck className={`${sizeClass[size]} fill-violet-500 text-white ${className}`} />;
}
