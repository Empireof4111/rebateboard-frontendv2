import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { EmptyState, PageHeader, Panel, Pill, SkeletonCard } from "@/components/dashboard/Primitives";
import { fetchPublicAdminBrands, type AdminBrandRecord } from "@/lib/admin-brands-api";
import { BarChart3, Trophy } from "lucide-react";

export const Route = createFileRoute("/dashboard/tbi")({
  component: TBIPage,
});

function TBIPage() {
  const [brands, setBrands] = useState<AdminBrandRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchPublicAdminBrands()
      .then((items) => {
        if (!cancelled) setBrands(items);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const ranked = useMemo(
    () => [...brands].sort((a, b) => Number(b.tbi ?? 0) - Number(a.tbi ?? 0)).slice(0, 10),
    [brands],
  );

  return (
    <div className="space-y-6">
      <PageHeader title="TBI Rankings" subtitle="Trusted Brand Index across the trading ecosystem." />

      <Panel title="Top Brands">
        {loading ? (
          <div className="grid gap-3 md:grid-cols-2">
            {[0, 1, 2, 3].map((item) => <SkeletonCard key={item} />)}
          </div>
        ) : ranked.length > 0 ? (
          <ul className="space-y-2">
            {ranked.map((brand, index) => (
              <li key={brand.id} className="flex items-center gap-3 rounded-xl bg-white/5 px-3 py-2 text-sm">
                <div className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-violet-400 to-fuchsia-600 text-xs font-bold text-white">{index + 1}</div>
                <div className="min-w-0 flex-1">
                  <Link to={"/firm/$firmId" as string} params={{ firmId: brand.slug }} className="truncate font-semibold text-white hover:text-fuchsia-200">
                    {brand.name}
                  </Link>
                  <div className="text-[11px] text-muted-foreground">{brand.category}</div>
                </div>
                <Pill tone="primary"><Trophy className="h-3 w-3" />{Number(brand.tbi ?? 0).toFixed(1)}</Pill>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            icon={Trophy}
            title="No TBI rankings yet"
            description="Published brand scores from the admin dashboard will appear here."
          />
        )}
      </Panel>

      <Panel title="Your Performance vs TBI">
        <EmptyState
          icon={BarChart3}
          title="Personal TBI insights need more data"
          description="Connect accounts, submit reviews, and log trades before RebateBoard compares your own performance against brand trust scores."
        />
      </Panel>
    </div>
  );
}
