import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { OfferCard, OfferDetailModal } from "@/components/offers/OfferCard";
import { type AdminOffer, type OfferCategory } from "@/lib/admin-data";
import { fetchPublicOffers } from "@/lib/offers-api";
import { fetchPublicAdminBrands } from "@/lib/admin-brands-api";
import { enrichOffersWithBrandAssets } from "@/lib/offer-brand-assets";
import { Flame, Sparkles, Clock, LayoutGrid, Search } from "lucide-react";

export const Route = createFileRoute("/offers")({
  head: () => ({
    meta: [
      { title: "Exclusive Offers, Promos & Discounts · RebateBoard" },
      {
        name: "description",
        content:
          "Browse exclusive prop firm, broker, exchange and trading-tool promos. Verified discount codes, free accounts and limited-time deals.",
      },
      { property: "og:title", content: "RebateBoard — Exclusive Offers" },
      {
        property: "og:description",
        content:
          "Hand-picked promos and discount codes across prop firms, brokers, exchanges and tools.",
      },
    ],
  }),
  component: PublicOffers,
});

const CATEGORIES: ("All" | OfferCategory)[] = [
  "All",
  "Prop Firms",
  "Brokers",
  "Exchanges",
  "Tools",
  "Education",
];

function SectionHeader({
  icon: Icon,
  title,
  subtitle,
  accent,
}: {
  icon: typeof Flame;
  title: string;
  subtitle: string;
  accent: string;
}) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${accent}`}>
        <Icon className="h-5 w-5 text-white" />
      </div>
      <div>
        <h2 className="text-lg font-bold text-white sm:text-xl">{title}</h2>
        <p className="text-xs text-white/60">{subtitle}</p>
      </div>
    </div>
  );
}

function PublicOffers() {
  const [items, setItems] = useState<AdminOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<AdminOffer | null>(null);
  const [filter, setFilter] = useState<(typeof CATEGORIES)[number]>("All");
  const [q, setQ] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [offers, brands] = await Promise.all([
          fetchPublicOffers(),
          fetchPublicAdminBrands().catch(() => []),
        ]);
        if (!cancelled) setItems(enrichOffersWithBrandAssets(offers, brands));
      } catch {
        if (!cancelled) setItems([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const live = useMemo(() => items.filter((o) => o.status === "active"), [items]);

  const exclusive = useMemo(
    () => live.filter((o) => o.tags?.includes("exclusive") || o.pinned).slice(0, 6),
    [live],
  );
  const latest = useMemo(
    () =>
      [...live].sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? "")).slice(0, 6),
    [live],
  );
  const endingSoon = useMemo(
    () => live.filter((o) => o.tags?.includes("limited") || /May|Jun/.test(o.expires)).slice(0, 6),
    [live],
  );

  const filtered = useMemo(() => {
    return live.filter((o) => {
      if (filter !== "All" && o.category !== filter) return false;
      if (
        q &&
        !`${o.brand} ${o.title} ${o.description ?? ""}`.toLowerCase().includes(q.toLowerCase())
      )
        return false;
      return true;
    });
  }, [live, filter, q]);

  return (
    <div className="min-h-screen bg-[#0a0418] text-white">
      <SiteHeader />
      <main className="container-app space-y-10 py-8 sm:py-9">
        {/* Hero */}
        <header className="overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-fuchsia-500/20 via-violet-600/15 to-cyan-500/15 p-8 sm:p-12">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-white">
            <Sparkles className="h-3 w-3 text-fuchsia-300" /> Updated daily · Verified codes
          </div>
          <h1 className="mt-4 text-3xl font-extrabold sm:text-5xl">Exclusive offers & promos</h1>
          <p className="mt-2 max-w-2xl text-sm text-white/70 sm:text-base">
            Hand-picked discounts on prop firm challenges, broker bonuses, exchange fee rebates, and
            trading tools — all in one place.
          </p>

          <div className="mt-6 flex max-w-xl items-center gap-2 rounded-full border border-white/15 bg-black/30 px-4 py-2.5">
            <Search className="h-4 w-4 text-white/50" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search FTMO, Bybit, free account…"
              className="w-full bg-transparent text-sm outline-none placeholder:text-white/40"
            />
          </div>
        </header>

        {loading && (
          <section aria-label="Loading offers">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="glass min-h-[360px] animate-pulse rounded-3xl p-4">
                  <div className="h-40 rounded-2xl bg-white/[0.06]" />
                  <div className="mt-5 h-4 w-2/3 rounded bg-white/[0.08]" />
                  <div className="mt-3 h-3 w-full rounded bg-white/[0.05]" />
                  <div className="mt-2 h-3 w-4/5 rounded bg-white/[0.05]" />
                </div>
              ))}
            </div>
          </section>
        )}

        {!loading && live.length === 0 && (
          <section className="glass rounded-3xl p-10 text-center">
            <h2 className="text-xl font-bold">No active offers right now.</h2>
            <p className="mx-auto mt-2 max-w-xl text-sm text-white/60">
              New broker, prop firm, and trading rewards offers will appear here when available.
            </p>
            <Link
              to="/programs"
              className="mt-5 inline-flex rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-white"
            >
              Browse Programs
            </Link>
          </section>
        )}

        {/* Exclusive */}
        {!loading && exclusive.length > 0 && (
          <section>
            <SectionHeader
              icon={Flame}
              title="Exclusive offers"
              subtitle="Negotiated by RebateBoard — only available here."
              accent="bg-gradient-to-br from-fuchsia-500 to-pink-600"
            />
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {exclusive.map((o) => (
                <OfferCard key={o.id} offer={o} onOpen={setActive} />
              ))}
            </div>
          </section>
        )}

        {/* Latest */}
        {!loading && latest.length > 0 && <section>
          <SectionHeader
            icon={Sparkles}
            title="Latest offers"
            subtitle="Freshly added this week."
            accent="bg-gradient-to-br from-emerald-500 to-cyan-600"
          />
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {latest.map((o) => (
              <OfferCard key={o.id} offer={o} onOpen={setActive} />
            ))}
          </div>
        </section>}

        {/* Ending soon */}
        {!loading && endingSoon.length > 0 && (
          <section>
            <SectionHeader
              icon={Clock}
              title="Ending soon"
              subtitle="Last chance — these promos expire in days."
              accent="bg-gradient-to-br from-amber-500 to-rose-600"
            />
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {endingSoon.map((o) => (
                <OfferCard key={o.id} offer={o} onOpen={setActive} />
              ))}
            </div>
          </section>
        )}

        {/* By Category */}
        {!loading && live.length > 0 && <section>
          <SectionHeader
            icon={LayoutGrid}
            title="Browse by category"
            subtitle="Filter the full catalogue across every brand we list."
            accent="bg-gradient-to-br from-sky-500 to-indigo-600"
          />

          <div className="mb-4 flex flex-wrap gap-1.5">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setFilter(c)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${filter === c ? "bg-gradient-to-r from-fuchsia-500 to-violet-600 text-white shadow-lg shadow-fuchsia-500/30" : "bg-white/5 text-white/60 hover:bg-white/10"}`}
              >
                {c}{" "}
                <span className="ml-1 text-[10px] text-white/40">
                  {c === "All" ? live.length : live.filter((o) => o.category === c).length}
                </span>
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 p-12 text-center text-sm text-white/50">
              No offers match your filters.
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {filtered.map((o) => (
                <OfferCard key={o.id} offer={o} onOpen={setActive} />
              ))}
            </div>
          )}
        </section>}
      </main>

      <SiteFooter />
      <OfferDetailModal offer={active} onClose={() => setActive(null)} />
    </div>
  );
}
