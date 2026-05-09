import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { type TBICategory, type TBIStatus } from "@/lib/tbi-data";
import { useMergedTbiBrands } from "@/lib/tbi-merge";
import { Search, Filter, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/tbi/explore")({
  head: () => ({
    meta: [
      { title: "Explore Brand Trust Profiles — TBI" },
      { name: "description", content: "Browse all trust profiles across prop firms, brokers and exchanges." },
    ],
  }),
  component: ExplorePage,
});

const CATS: (TBICategory | "All")[] = ["All", "Prop Firm", "Broker", "Exchange", "Tool"];
const STATUSES: { v: TBIStatus | "all"; label: string; color: string }[] = [
  { v: "all", label: "All", color: "text-muted-foreground" },
  { v: "full", label: "Fully Verified", color: "text-emerald-300" },
  { v: "partial", label: "Emerging", color: "text-amber-300" },
  { v: "preliminary", label: "New", color: "text-fuchsia-300" },
];

function statusBadge(s: TBIStatus) {
  if (s === "full") return <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">✓ Verified</span>;
  if (s === "partial") return <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-300">⚠ Emerging</span>;
  return <span className="rounded-full bg-fuchsia-500/15 px-2 py-0.5 text-[10px] font-semibold text-fuchsia-300">● New</span>;
}

function ExplorePage() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<TBICategory | "All">("All");
  const [status, setStatus] = useState<TBIStatus | "all">("all");
  const [minScore, setMinScore] = useState(0);
  const merged = useMergedTbiBrands();

  const list = useMemo(() => {
    return merged.filter((b) => {
      if (cat !== "All" && b.category !== cat) return false;
      if (status !== "all" && b.status !== status) return false;
      if (b.score < minScore) return false;
      if (q && !b.name.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [merged, q, cat, status, minScore]);

  return (
    <div className="min-h-screen bg-[#0b0418] text-foreground">
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6">
          <div className="text-xs text-muted-foreground">
            <Link to="/tbi" className="hover:text-foreground">TBI</Link> · Explore
          </div>
          <h1 className="mt-2 text-3xl font-bold">Explore Brand Trust Profiles</h1>
          <p className="mt-1 text-sm text-muted-foreground">Trust exploration only. No buy buttons, no rankings — just data.</p>
        </div>

        {/* FILTERS */}
        <div className="glass rounded-2xl p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="flex flex-1 items-center gap-2 rounded-full bg-white/5 px-4 py-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search brands…" className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {CATS.map((c) => (
                <button key={c} onClick={() => setCat(c)} className={`rounded-full px-3 py-1.5 text-xs transition ${cat === c ? "bg-fuchsia-500/20 text-fuchsia-200 ring-1 ring-fuchsia-400/40" : "bg-white/5 text-muted-foreground hover:text-foreground"}`}>{c}</button>
              ))}
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-white/5 pt-3">
            <div className="flex items-center gap-1 text-xs text-muted-foreground"><Filter className="h-3 w-3" /> Status:</div>
            {STATUSES.map((s) => (
              <button key={s.v} onClick={() => setStatus(s.v)} className={`rounded-full px-3 py-1 text-xs transition ${status === s.v ? "bg-white/10 ring-1 ring-white/20 " + s.color : "text-muted-foreground hover:text-foreground"}`}>{s.label}</button>
            ))}
            <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
              Min Score: <span className="font-semibold text-foreground">{minScore.toFixed(1)}</span>
              <input type="range" min={0} max={10} step={0.5} value={minScore} onChange={(e) => setMinScore(Number(e.target.value))} className="w-32 accent-fuchsia-500" />
            </div>
          </div>
        </div>

        {/* GRID */}
        <div className="mt-6 text-xs text-muted-foreground">{list.length} brand{list.length !== 1 && "s"}</div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((b) => (
            <Link key={b.slug} to="/tbi/brand/$slug" params={{ slug: b.slug }} className="glass group rounded-2xl p-4 transition hover:border-fuchsia-400/40">
              <div className="flex items-start gap-3">
                <div className={`grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br ${b.logoColor} text-xs font-bold text-white`}>{b.name.slice(0, 2).toUpperCase()}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <div className="font-semibold">{b.name}</div>
                    {statusBadge(b.status)}
                  </div>
                  <div className="text-[11px] text-muted-foreground">{b.category} · {b.country}</div>
                </div>
              </div>
              <div className="mt-3 flex items-end justify-between">
                <div>
                  <div className="text-2xl font-bold">{b.score.toFixed(1)}<span className="text-xs text-muted-foreground">/{b.maxScore}</span></div>
                  {b.status === "preliminary" && <div className="text-[10px] text-fuchsia-300">Preliminary · No reviews</div>}
                  {b.status === "partial" && <div className="text-[10px] text-amber-300">Limited reviews</div>}
                  {b.status === "full" && <div className="text-[10px] text-emerald-300">Verified trader feedback</div>}
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-fuchsia-300" />
              </div>
            </Link>
          ))}
        </div>
      </main>
    <SiteFooter />
    </div>
  );
}
