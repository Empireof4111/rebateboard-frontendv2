import { createFileRoute } from "@tanstack/react-router";
import { useBrandAuth } from "@/lib/brand-auth";
import { useReviews } from "@/lib/reviews-store";
import { TrendingUp, Eye, MousePointerClick, Users } from "lucide-react";

export const Route = createFileRoute("/brand/analytics")({
  component: BrandAnalytics,
});

function BrandAnalytics() {
  const { brand } = useBrandAuth();
  const reviews = useReviews(brand ? { brandSlug: brand.slug } : undefined);
  if (!brand) return null;

  const series = [42, 68, 51, 83, 95, 110, 124, 140, 132, 158, 172, 190];
  const max = Math.max(...series);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white">Analytics</h1>
        <p className="mt-1 text-sm text-muted-foreground">Profile traffic, conversion and trader sentiment.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { label: "Profile views", value: "12,481", delta: "+18%", icon: Eye },
          { label: "Outbound clicks", value: "1,840", delta: "+12%", icon: MousePointerClick },
          { label: "New followers", value: "324", delta: "+8%", icon: Users },
          { label: "Avg sentiment", value: "4.4/5", delta: "+0.2", icon: TrendingUp },
        ].map((s) => (
          <div key={s.label} className="glass rounded-2xl p-4 ring-1 ring-white/10">
            <div className="flex items-center gap-2 text-fuchsia-300"><s.icon className="h-4 w-4" /></div>
            <div className="mt-2 text-2xl font-extrabold text-white">{s.value}</div>
            <div className="text-[11px] text-muted-foreground">{s.label}</div>
            <div className="mt-2 text-[10px] font-semibold text-emerald-300">{s.delta}</div>
          </div>
        ))}
      </div>

      <div className="glass rounded-2xl p-5 ring-1 ring-white/10">
        <h2 className="text-sm font-bold text-white">Profile views — last 12 months</h2>
        <div className="mt-4 flex h-40 items-end gap-2">
          {series.map((v, i) => (
            <div key={i} className="flex-1">
              <div className="w-full rounded-t-md bg-gradient-to-t from-violet-600 to-fuchsia-400" style={{ height: `${(v / max) * 100}%` }} />
              <div className="mt-1 text-center text-[9px] text-muted-foreground">{["J","F","M","A","M","J","J","A","S","O","N","D"][i]}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="glass rounded-2xl p-5 ring-1 ring-white/10">
        <h2 className="text-sm font-bold text-white">Recent reviews ({reviews.length})</h2>
        <p className="mt-1 text-xs text-muted-foreground">Replies improve trader perception and TBI weighting.</p>
      </div>
    </div>
  );
}
