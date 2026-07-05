import type { AdminBrandRecord } from "@/lib/admin-brands-api";
import type { TbiProfile, TbiState } from "@/lib/tbi-api";

export function isPublishedBrand(brand: Pick<AdminBrandRecord, "visibility">) {
  return brand.visibility === "published";
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function normalizeTbiState(value: unknown): TbiState | null {
  if (typeof value !== "string") return null;
  const key = value.trim().toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ");

  if (["full", "full verified", "fully unlocked", "unlocked full", "full tbi"].includes(key)) {
    return "full";
  }

  if (
    ["partial", "partial unlock", "partially unlocked", "limited", "limited data"].includes(key)
  ) {
    return "partial";
  }

  if (["preliminary", "prelim", "preliminary review"].includes(key)) return "preliminary";

  return null;
}

export function resolveBrandTbiState(
  brand: Pick<AdminBrandRecord, "profile" | "trust">,
  profile?: Pick<TbiProfile, "state"> | null,
): TbiState {
  const brandProfile = asRecord(brand.profile);
  const trust = asRecord(brand.trust);

  return (
    normalizeTbiState(profile?.state) ??
    normalizeTbiState(trust.stateOverride) ??
    normalizeTbiState(trust.state) ??
    normalizeTbiState(trust.trustScoreMode) ??
    normalizeTbiState(trust.tbiState) ??
    normalizeTbiState(brandProfile.state) ??
    normalizeTbiState(brandProfile.trustScoreMode) ??
    normalizeTbiState(brandProfile.tbiState) ??
    "preliminary"
  );
}

export function publicTbiStageTheme(stage: TbiState) {
  if (stage === "full") {
    return {
      label: "Fully Unlocked",
      chip: "bg-amber-200/20 text-amber-50 ring-amber-100/30",
      dot: "bg-amber-300",
    };
  }

  if (stage === "partial") {
    return {
      label: "Partial Unlock",
      chip: "bg-orange-200/20 text-orange-50 ring-orange-100/30",
      dot: "bg-orange-300",
    };
  }

  return {
    label: "Preliminary",
    chip: "bg-slate-100/15 text-slate-50 ring-slate-100/25",
    dot: "bg-slate-200",
  };
}
