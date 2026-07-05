// BrandPicker — search a listed brand or create a custom one.
// Used by the transaction drawer and the account modal.
import { useEffect, useMemo, useState } from "react";
import { Search, Sparkles, Plus, Check } from "lucide-react";
import type { TrtBrand } from "@/lib/trt-store";
import { makeCustomBrand } from "@/lib/trt-store";
import { fetchPublicAdminBrands } from "@/lib/admin-brands-api";

export function BrandPicker({
  value, onChange, label = "Brand",
}: { value?: TrtBrand; onChange: (b: TrtBrand) => void; label?: string }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [all, setAll] = useState<TrtBrand[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    setLoading(true);
    fetchPublicAdminBrands()
      .then((brands) => {
        if (!alive) return;
        setAll(brands.map((brand) => ({ id: brand.id, name: brand.name, category: brand.category })));
        setError("");
      })
      .catch((err) => {
        if (!alive) return;
        setAll([]);
        setError(err instanceof Error ? err.message : "Unable to load listed brands");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const matches = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return all.slice(0, 8);
    return all.filter((b) => b.name.toLowerCase().includes(term)).slice(0, 10);
  }, [all, q]);
  const allowCustom = q.trim().length > 1 && !matches.some((m) => m.name.toLowerCase() === q.trim().toLowerCase());

  return (
    <div className="space-y-1.5">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="glass flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm text-white ring-1 ring-white/10 transition hover:bg-white/[0.04]"
        >
          {value ? (
            <span className="inline-flex items-center gap-2">
              {value.custom && <span className="rounded bg-fuchsia-500/30 px-1.5 py-0.5 text-[9px] font-bold text-fuchsia-200">CUSTOM</span>}
              {value.name}
              {value.category && <span className="text-[11px] text-muted-foreground">· {value.category}</span>}
            </span>
          ) : (
            <span className="text-muted-foreground">Choose a listed brand or create custom…</span>
          )}
          <Search className="h-4 w-4 text-muted-foreground" />
        </button>
        {open && (
          <div className="absolute z-30 mt-2 w-full overflow-hidden rounded-xl border border-white/10 bg-[#1a0d33]/95 shadow-2xl backdrop-blur-xl">
            <div className="border-b border-white/5 p-2">
              <div className="glass flex items-center gap-2 rounded-lg px-2.5 py-2">
                <Search className="h-3.5 w-3.5 text-muted-foreground" />
                <input
                  autoFocus
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search brands…"
                  className="w-full bg-transparent text-sm text-white outline-none placeholder:text-muted-foreground"
                />
              </div>
            </div>
            <ul className="max-h-64 overflow-y-auto p-1.5">
              {loading && (
                <li className="px-3 py-3 text-center text-xs text-muted-foreground">Loading listed brands...</li>
              )}
              {!loading && error && (
                <li className="px-3 py-3 text-center text-xs text-rose-300">{error}</li>
              )}
              {matches.map((b) => {
                const selected = value?.id === b.id;
                return (
                  <li key={b.id}>
                    <button
                      type="button"
                      onClick={() => { onChange(b); setOpen(false); setQ(""); }}
                      className={`flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-sm text-white/90 transition hover:bg-white/5 ${selected ? "bg-white/[0.06]" : ""}`}
                    >
                      <span className="truncate">{b.name}</span>
                      <span className="flex items-center gap-2">
                        {b.category && <span className="text-[10px] text-muted-foreground">{b.category}</span>}
                        {selected && <Check className="h-3.5 w-3.5 text-success" />}
                      </span>
                    </button>
                  </li>
                );
              })}
              {!loading && !error && matches.length === 0 && !allowCustom && (
                <li className="px-3 py-3 text-center text-xs text-muted-foreground">No brands found</li>
              )}
              {allowCustom && (
                <li className="border-t border-white/5 mt-1 pt-1">
                  <button
                    type="button"
                    onClick={() => { onChange(makeCustomBrand(q)); setOpen(false); setQ(""); }}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-white transition hover:bg-fuchsia-500/10"
                  >
                    <span className="grid h-6 w-6 place-items-center rounded-md bg-fuchsia-500/20 text-fuchsia-200">
                      <Plus className="h-3.5 w-3.5" />
                    </span>
                    <span className="flex-1 text-left">
                      Create custom brand <span className="font-semibold">"{q.trim()}"</span>
                    </span>
                    <Sparkles className="h-3.5 w-3.5 text-fuchsia-300" />
                  </button>
                </li>
              )}
            </ul>
          </div>
        )}
      </div>
      {value?.custom && (
        <p className="text-[11px] text-muted-foreground">Custom brand · won't appear in public brand directory.</p>
      )}
    </div>
  );
}
