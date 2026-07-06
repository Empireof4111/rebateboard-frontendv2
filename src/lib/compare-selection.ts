export const COMPARE_SELECTION_KEY = "rb_compare_brand_ids_v1";
export const COMPARE_SELECTION_EVENT = "rb:compare-selection";
export const MAX_COMPARE_BRANDS = 4;

export function readCompareSelection(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(
      window.localStorage.getItem(COMPARE_SELECTION_KEY) || "[]",
    );
    if (!Array.isArray(parsed)) return [];
    return [...new Set(parsed.map(String).filter(Boolean))].slice(
      0,
      MAX_COMPARE_BRANDS,
    );
  } catch {
    return [];
  }
}

export function writeCompareSelection(ids: string[]): string[] {
  const next = [...new Set(ids.map(String).filter(Boolean))].slice(
    0,
    MAX_COMPARE_BRANDS,
  );
  if (typeof window !== "undefined") {
    window.localStorage.setItem(COMPARE_SELECTION_KEY, JSON.stringify(next));
    window.dispatchEvent(
      new CustomEvent<string[]>(COMPARE_SELECTION_EVENT, { detail: next }),
    );
  }
  return next;
}

export function toggleCompareSelection(
  ids: string[],
  id: string,
): string[] {
  const next = ids.includes(id)
    ? ids.filter((currentId) => currentId !== id)
    : ids.length >= MAX_COMPARE_BRANDS
      ? ids
      : [...ids, id];
  return writeCompareSelection(next);
}
