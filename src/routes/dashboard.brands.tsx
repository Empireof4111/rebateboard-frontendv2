import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type ComponentType } from "react";
import { EmptyState, PageHeader, Pill, SkeletonCard } from "@/components/dashboard/Primitives";
import { fetchPublicAdminBrands, type AdminBrandRecord } from "@/lib/admin-brands-api";
import {
  Activity,
  ArrowRight,
  BadgePercent,
  Bitcoin,
  Building2,
  Check,
  Clock3,
  Copy,
  Filter,
  Layers,
  LineChart,
  MapPin,
  MessageSquare,
  Search,
  ShieldCheck,
  Star,
  Users,
} from "lucide-react";

export const Route = createFileRoute("/dashboard/brands")({
  head: () => ({
    meta: [
      { title: "Programs — RebateBoard" },
      { name: "description", content: "Browse forex brokers, prop firms, crypto exchanges, and futures programs with cashback rates and TBI scores." },
    ],
  }),
  component: ProgramsPage,
});

type Category = "all" | "forex" | "prop" | "crypto" | "futures";
type SortId = "tbi" | "rebate" | "payout";

const tabs: { id: Category; label: string; icon: ComponentType<{ className?: string }> }[] = [
  { id: "all", label: "All", icon: Layers },
  { id: "forex", label: "Forex Brokers", icon: LineChart },
  { id: "prop", label: "Prop Firms", icon: Building2 },
  { id: "crypto", label: "Crypto Exchanges", icon: Bitcoin },
  { id: "futures", label: "Futures", icon: Activity },
];

const sortOptions: { id: SortId; label: string }[] = [
  { id: "tbi", label: "Top TBI" },
  { id: "rebate", label: "Best Rebate" },
  { id: "payout", label: "Payout Data" },
];

function dashboardCategory(category: string): Exclude<Category, "all"> {
  const value = category.toLowerCase();
  if (value.includes("forex broker")) return "forex";
  if (value.includes("futures")) return "futures";
  if (value.includes("crypto exchange") || value.includes("crypto prop") || value.includes("dex")) return "crypto";
  return "prop";
}

function labelFor(category: string) {
  return category || "Brand";
}

function recordValue(source: Record<string, unknown> | undefined, keys: string[]) {
  if (!source) return "";
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
  }
  return "";
}

function numericCashback(brand: AdminBrandRecord) {
  const cashback = brand.cashback ?? {};
  const candidates = [
    cashback.maxPct,
    cashback.maximumPct,
    cashback.maxPercent,
    cashback.defaultPct,
    cashback.percent,
    cashback.rate,
  ];
  const value = candidates.map(Number).find((item) => Number.isFinite(item) && item > 0);
  return value ?? 0;
}

function formatCashback(brand: AdminBrandRecord) {
  const cashback = brand.cashback ?? {};
  const value = numericCashback(brand);
  if (value > 0) return `Up to ${value}%`;
  const label = cashback.label ?? cashback.summary ?? cashback.terms;
  return typeof label === "string" && label.trim() ? label.trim() : "Not provided";
}

function brandLogoUrl(brand: AdminBrandRecord) {
  return brand.thumbnail || recordValue(brand.identity, ["logo", "logoUrl", "image", "avatar"]) || "";
}

function brandDescription(brand: AdminBrandRecord) {
  return (
    recordValue(brand.profile, ["summary", "shortDescription", "description", "tagline"]) ||
    recordValue(brand.editorial, ["summary", "shortDescription", "description", "tagline"]) ||
    recordValue(brand.identity, ["summary", "tagline", "description"]) ||
    `${brand.name} is listed in RebateBoard's ${labelFor(brand.category)} marketplace.`
  );
}

function countryLabel(brand: AdminBrandRecord) {
  return (
    recordValue(brand.identity, ["country", "countryCode", "registeredCountry"]) ||
    recordValue(brand.broker, ["country", "countryCode"]) ||
    recordValue(brand.prop, ["country", "countryCode"]) ||
    recordValue(brand.exchange, ["country", "countryCode"]) ||
    "Global"
  );
}

function formatCount(value?: number) {
  const count = Number(value ?? 0);
  if (!Number.isFinite(count) || count <= 0) return "0";
  if (count >= 1000000) return `${(count / 1000000).toFixed(count >= 10000000 ? 0 : 1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(count >= 10000 ? 0 : 1)}K`;
  return String(count);
}

function payoutLabel(brand: AdminBrandRecord) {
  return brand.payouts || recordValue(brand.prop, ["payoutFrequency", "payouts"]) || "Not provided";
}

function platformsLabel(brand: AdminBrandRecord) {
  const source =
    recordValue(brand.broker, ["platforms", "platform"]) ||
    recordValue(brand.prop, ["platforms", "platform"]) ||
    recordValue(brand.exchange, ["platforms", "platform"]) ||
    recordValue(brand.tool, ["platforms", "platform"]);
  return source || labelFor(brand.category);
}

function promoCode(brand: AdminBrandRecord) {
  return recordValue(brand.cashback, ["code", "promoCode", "couponCode", "voucherCode"]);
}

function tbiStage(brand: AdminBrandRecord) {
  const score = Number(brand.tbi ?? 0);
  if (score >= 80) {
    return {
      label: "Full Unlock",
      chip: "border-amber-300/35 bg-amber-400/12 text-amber-200",
      dot: "bg-amber-300",
    };
  }
  if (score >= 50) {
    return {
      label: "Partial Unlock",
      chip: "border-orange-300/30 bg-orange-400/10 text-orange-200",
      dot: "bg-orange-300",
    };
  }
  return {
    label: "Preliminary",
    chip: "border-slate-200/20 bg-white/10 text-slate-200",
    dot: "bg-slate-200",
  };
}

function BrandLogo({ brand }: { brand: AdminBrandRecord }) {
  const logo = brandLogoUrl(brand);
  const stage = tbiStage(brand);

  return (
    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-white/[0.06] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
      {logo ? (
        <img src={logo} alt="" className="h-full w-full object-cover" loading="lazy" />
      ) : (
        <div className="grid h-full w-full place-items-center text-sm font-black text-white">
          {brand.name.slice(0, 2).toUpperCase()}
        </div>
      )}
      <span className={`absolute bottom-1 right-1 grid h-5 w-5 place-items-center rounded-full border border-black/45 ${stage.dot}`}>
        <Check className="h-3 w-3 text-black" />
      </span>
    </div>
  );
}

function ProgramsPage() {
  const [cat, setCat] = useState<Category>("all");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<SortId>("tbi");
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

  const list = useMemo(() => {
    let next = brands.filter((brand) => (cat === "all" ? true : dashboardCategory(brand.category) === cat));
    const query = q.trim().toLowerCase();
    if (query) {
      next = next.filter((brand) => [brand.name, brand.category, brand.payouts].filter(Boolean).join(" ").toLowerCase().includes(query));
    }
    if (sort === "tbi") next = [...next].sort((a, b) => Number(b.tbi ?? 0) - Number(a.tbi ?? 0));
    if (sort === "rebate") next = [...next].sort((a, b) => numericCashback(b) - numericCashback(a));
    if (sort === "payout") next = [...next].sort((a, b) => String(a.payouts || "").localeCompare(String(b.payouts || "")));
    return next;
  }, [brands, cat, q, sort]);

  const counts = useMemo(() => {
    const next: Record<Category, number> = { all: brands.length, forex: 0, prop: 0, crypto: 0, futures: 0 };
    brands.forEach((brand) => { next[dashboardCategory(brand.category)] += 1; });
    return next;
  }, [brands]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Programs"
        subtitle="Pick your trading vehicle — every broker, prop firm, exchange, and futures program in one place."
      />

      <div className="glass rounded-2xl p-4">
        <div className="flex flex-wrap items-center gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = cat === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setCat(tab.id)}
                className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition ${
                  active
                    ? "rb-gradient-primary text-white shadow-[0_0_18px_rgba(192,132,252,0.4)]"
                    : "bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {tab.label}
                <span className={`rounded-full px-1.5 text-[10px] ${active ? "bg-black/20 text-white" : "bg-white/10 text-white/70"}`}>
                  {counts[tab.id]}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <div className="glass-pill flex flex-1 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-white md:max-w-sm">
            <Search className="h-3 w-3 text-muted-foreground" />
            <input
              value={q}
              onChange={(event) => setQ(event.target.value)}
              placeholder="Search programs..."
              className="w-full bg-transparent outline-none placeholder:text-muted-foreground"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5 text-muted-foreground" />
            {sortOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => setSort(option.id)}
                className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
                  sort === option.id ? "bg-white/15 text-white" : "bg-white/5 text-muted-foreground hover:text-white"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((item) => <SkeletonCard key={item} />)}
        </div>
      ) : list.length > 0 ? (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {list.map((brand) => (
            <ProgramBrandCard key={brand.id} brand={brand} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Layers}
          title="No published programs yet"
          description="Browse Programs to find supported brokers, prop firms, exchanges, and tools as they become available."
          action={<Link to="/programs" className="rounded-full rb-gradient-primary px-4 py-2 text-xs font-semibold text-white">Browse Programs</Link>}
        />
      )}
    </div>
  );
}

function ProgramBrandCard({ brand }: { brand: AdminBrandRecord }) {
  const stage = tbiStage(brand);
  const code = promoCode(brand);
  const metrics = [
    { label: "Cashback", value: formatCashback(brand), icon: BadgePercent, tone: "text-emerald-300" },
    { label: "Payout", value: payoutLabel(brand), icon: Clock3, tone: "text-white" },
    { label: "Platform", value: platformsLabel(brand), icon: Layers, tone: "text-white" },
    { label: "Country", value: countryLabel(brand), icon: MapPin, tone: "text-white" },
  ];

  return (
    <article className="glass group flex h-full flex-col overflow-hidden rounded-2xl p-4 ring-1 ring-violet-400/20 transition duration-200 hover:-translate-y-0.5 hover:bg-white/[0.07] hover:ring-primary/35">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <BrandLogo brand={brand} />
          <div className="min-w-0">
            <Link
              to={"/firm/$firmId" as string}
              params={{ firmId: brand.slug }}
              className="block truncate text-base font-semibold text-white transition hover:text-violet-200"
            >
              {brand.name}
            </Link>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <Pill>{labelFor(brand.category)}</Pill>
              <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${stage.chip}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${stage.dot}`} />
                {stage.label}
              </span>
            </div>
          </div>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">TBI</div>
          <div className="flex items-center gap-1 text-lg font-black text-violet-200">
            <Star className="h-3.5 w-3.5 fill-current" /> {Number(brand.tbi ?? 0).toFixed(1)}
          </div>
        </div>
      </div>

      <p className="mt-3 line-clamp-2 min-h-[2.5rem] text-sm leading-5 text-muted-foreground">
        {brandDescription(brand)}
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <Users className="h-3.5 w-3.5 text-violet-300" />
          {formatCount(brand.followersCount)} followers
        </span>
        <span className="inline-flex items-center gap-1">
          <MessageSquare className="h-3.5 w-3.5 text-violet-300" />
          {formatCount(brand.reviewsCount)} reviews
        </span>
        <span className="inline-flex items-center gap-1">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-300" />
          {brand.status === "verified" ? "Verified" : "Listed"}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <div key={metric.label} className="rounded-xl border border-white/[0.07] bg-white/[0.04] px-3 py-2">
              <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                <Icon className="h-3 w-3 text-violet-300" />
                {metric.label}
              </div>
              <div className={`mt-1 truncate text-sm font-semibold ${metric.tone}`}>{metric.value}</div>
            </div>
          );
        })}
      </div>

      {code ? (
        <div className="mt-3 flex items-center justify-between rounded-xl border border-dashed border-violet-300/35 bg-violet-400/10 px-3 py-2 text-xs">
          <span className="min-w-0 truncate font-semibold text-violet-100">{code}</span>
          <span className="inline-flex shrink-0 items-center gap-1 text-[11px] font-semibold text-violet-200">
            <Copy className="h-3 w-3" />
            Code
          </span>
        </div>
      ) : null}

      <div className="mt-auto flex gap-2 pt-4">
        <Link
          to={"/payouts/$brandSlug" as string}
          params={{ brandSlug: brand.slug }}
          className="flex-1 rounded-xl border border-white/10 bg-white/5 py-2.5 text-center text-xs font-semibold text-white transition hover:bg-white/10"
        >
          View payouts
        </Link>
        <Link
          to={"/firm/$firmId" as string}
          params={{ firmId: brand.slug }}
          className="inline-flex flex-1 items-center justify-center gap-1 rounded-xl rb-gradient-primary px-3 py-2.5 text-xs font-semibold text-white shadow-[0_12px_30px_rgba(90,34,241,0.22)] transition hover:brightness-110"
        >
          View brand <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </article>
  );
}
