import { Link } from "@tanstack/react-router";
import { ArrowRight, BadgePercent, CircleDollarSign, Users } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { AdminBrandRecord } from "@/lib/admin-brands-api";
import {
  fetchHomepageCashbackActivityStats,
  type HomepageCashbackActivityStats,
} from "@/lib/cashback-activity-api";

type LiveCashbackActivityCardProps = {
  selectedBrand?: AdminBrandRecord | null;
};

const emptyStats: HomepageCashbackActivityStats = {
  today_cashback_paid: 0,
  monthly_cashback_paid: 0,
  lifetime_cashback_paid: 0,
  active_cashback_traders: 0,
};

function useCountUp(target: number, active: boolean, duration = 720) {
  const [value, setValue] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    if (!active || started.current) return;
    started.current = true;

    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(target * eased);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [active, duration, target]);

  return value;
}

function formatCurrency(value: number) {
  return `$${Math.round(value).toLocaleString()}`;
}

function formatNumber(value: number) {
  return Math.round(value).toLocaleString();
}

function slugOrId(brand: AdminBrandRecord) {
  return brand.slug || brand.id;
}

export function LiveCashbackActivityCard({ selectedBrand }: LiveCashbackActivityCardProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);
  const [stats, setStats] = useState<HomepageCashbackActivityStats>(emptyStats);

  useEffect(() => {
    let active = true;
    fetchHomepageCashbackActivityStats().then((next) => {
      if (active) setStats(next);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const node = ref.current;
    if (!node || visible) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.35 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [visible]);

  const today = useCountUp(stats.today_cashback_paid, visible);
  const month = useCountUp(stats.monthly_cashback_paid, visible);
  const lifetime = useCountUp(stats.lifetime_cashback_paid, visible);
  const traders = useCountUp(stats.active_cashback_traders, visible);

  const metrics = useMemo(
    () => [
      { label: "Today", value: formatCurrency(today), icon: CircleDollarSign },
      { label: "This Month", value: formatCurrency(month), icon: BadgePercent },
      { label: "Lifetime", value: formatCurrency(lifetime), icon: CircleDollarSign },
      { label: "Traders", value: formatNumber(traders), icon: Users },
    ],
    [lifetime, month, today, traders],
  );

  const ctaLabel = selectedBrand
    ? `Start Earning Cashback with ${selectedBrand.name}`
    : "Start Earning Cashback";

  return (
    <div ref={ref} className="glass rounded-3xl p-3.5 sm:p-4">
      <div className="flex min-w-0 items-start gap-2.5">
        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-primary/20 text-primary ring-1 ring-primary/30">
          <CircleDollarSign className="h-3.5 w-3.5" />
        </div>
        <div className="min-w-0">
          <h3 className="text-sm font-semibold sm:text-base">Live Cashback Activity</h3>
          <p className="mt-0.5 truncate text-[10px] leading-4 text-muted-foreground">
            Real-time cashback across RebateBoard.
          </p>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-4">
        {metrics.map(({ label, value, icon: Icon }) => (
          <div
            key={label}
            className="min-w-0 rounded-xl border border-white/10 bg-white/[0.045] p-2 transition duration-300 hover:-translate-y-0.5 hover:bg-white/[0.065]"
          >
            <div className="mb-1 flex min-w-0 items-center gap-1 text-[8px] font-bold uppercase leading-none tracking-[0.1em] text-white/42">
              <Icon className="h-2.5 w-2.5 shrink-0 text-primary" />
              <span className="truncate">{label}</span>
            </div>
            <div className="truncate text-base font-black text-white sm:text-lg">{value}</div>
          </div>
        ))}
      </div>

      {selectedBrand ? (
        <Link
          to="/firm/$firmId"
          params={{ firmId: slugOrId(selectedBrand) }}
          className="mt-3 inline-flex w-full min-w-0 items-center justify-center gap-1.5 rounded-full rb-gradient-primary px-4 py-2 text-xs font-bold text-white shadow-[0_14px_34px_rgba(168,85,247,0.28)] transition duration-300 hover:-translate-y-0.5 hover:brightness-110"
        >
          <span className="min-w-0 truncate">{ctaLabel}</span>
          <ArrowRight className="h-3.5 w-3.5 shrink-0" />
        </Link>
      ) : (
        <Link
          to="/offers"
          className="mt-3 inline-flex w-full min-w-0 items-center justify-center gap-1.5 rounded-full rb-gradient-primary px-4 py-2 text-xs font-bold text-white shadow-[0_14px_34px_rgba(168,85,247,0.28)] transition duration-300 hover:-translate-y-0.5 hover:brightness-110"
        >
          <span className="min-w-0 truncate">{ctaLabel}</span>
          <ArrowRight className="h-3.5 w-3.5 shrink-0" />
        </Link>
      )}
    </div>
  );
}
