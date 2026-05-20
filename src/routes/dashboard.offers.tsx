import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { OfferCard, OfferDetailModal } from "@/components/offers/OfferCard";
import { type AdminOffer, type OfferCategory } from "@/lib/admin-data";
import { fetchPublicOffers } from "@/lib/offers-api";
import { Flame, Sparkles, Clock, LayoutGrid, Search, ExternalLink } from "lucide-react";

export const Route = createFileRoute("/dashboard/offers")({
  component: DashboardOffers,
});

const CATEGORIES: ("All" | OfferCategory)[] = ["All", "Prop Firms", "Brokers", "Exchanges", "Tools", "Education"];

function DashboardOffers() {
  const [items, setItems] = useState<AdminOffer[]>([]);
  const [active, setActive] = useState<AdminOffer | null>(null);
  const [filter, setFilter] = useState<typeof CATEGORIES[number]>("All");
  const [q, setQ] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const offers = await fetchPublicOffers();
        if (!cancelled) setItems(offers);
      } catch {
        if (!cancelled) setItems([]);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const live = useMemo(() => items.filter((o) => o.status === "active"), [items]);
  const exclusive = useMemo(() => live.filter((o) => o.tags?.includes("exclusive") || o.pinned).slice(0, 4), [live]);
  const latest = useMemo(() => [...live].sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? "")).slice(0, 4), [live]);
  const endingSoon = useMemo(() => live.filter((o) => o.tags?.includes("limited")).slice(0, 4), [live]);

  const filtered = useMemo(() => live.filter((o) => {
    if (filter !== "All" && o.category !== filter) return false;
    if (q && !`${o.brand} ${o.title} ${o.description ?? ""}`.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  }), [live, filter, q]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Marketplace</div>
          <h1 className="mt-1 text-2xl font-bold sm:text-3xl">Exclusive offers &amp; promos</h1>
          <p className="mt-1 text-sm text-muted-foreground">Verified discounts across every brand we list.</p>
        </div>
        <Link to="/offers" className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-white hover:bg-white/15">
          Public page <ExternalLink className="h-3 w-3" />
        </Link>
      </div>

      <div className="flex max-w-xl items-center gap-2 rounded-full border border-white/10 bg-black/30 px-4 py-2.5">
        <Search className="h-4 w-4 text-white/50" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search offers…" className="w-full bg-transparent text-sm outline-none placeholder:text-white/40" />
      </div>

      {exclusive.length > 0 && (
        <section>
          <div className="mb-3 flex items-center gap-2">
            <Flame className="h-4 w-4 text-fuchsia-400" />
            <h2 className="text-base font-bold">Exclusive</h2>
          </div>
          <div className="grid gap-3 lg:grid-cols-2">
            {exclusive.map((o) => <OfferCard key={o.id} offer={o} onOpen={setActive} />)}
          </div>
        </section>
      )}

      <section>
        <div className="mb-3 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-emerald-400" />
          <h2 className="text-base font-bold">Latest</h2>
        </div>
        <div className="grid gap-3 lg:grid-cols-2">
          {latest.map((o) => <OfferCard key={o.id} offer={o} onOpen={setActive} />)}
        </div>
      </section>

      {endingSoon.length > 0 && (
        <section>
          <div className="mb-3 flex items-center gap-2">
            <Clock className="h-4 w-4 text-amber-400" />
            <h2 className="text-base font-bold">Ending soon</h2>
          </div>
          <div className="grid gap-3 lg:grid-cols-2">
            {endingSoon.map((o) => <OfferCard key={o.id} offer={o} onOpen={setActive} />)}
          </div>
        </section>
      )}

      <section>
        <div className="mb-3 flex items-center gap-2">
          <LayoutGrid className="h-4 w-4 text-sky-400" />
          <h2 className="text-base font-bold">Browse all</h2>
        </div>
        <div className="mb-4 flex flex-wrap gap-1.5">
          {CATEGORIES.map((c) => (
            <button key={c} onClick={() => setFilter(c)} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${filter === c ? "bg-gradient-to-r from-fuchsia-500 to-violet-600 text-white" : "bg-white/5 text-white/60 hover:bg-white/10"}`}>
              {c}
            </button>
          ))}
        </div>
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 p-12 text-center text-sm text-white/50">No offers match your filters.</div>
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            {filtered.map((o) => <OfferCard key={o.id} offer={o} onOpen={setActive} />)}
          </div>
        )}
      </section>

      <OfferDetailModal offer={active} onClose={() => setActive(null)} />
    </div>
  );
}
