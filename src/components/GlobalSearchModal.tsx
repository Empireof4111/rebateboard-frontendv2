import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "@tanstack/react-router";
import {
  Search, X, ArrowRight, TrendingUp, Clock, Sparkles, Flame,
  Building2, Coins, BarChart3, Calculator, Calendar, Wallet, BookOpen, Trophy, Trash2,
} from "lucide-react";
import { TBI_BRANDS } from "@/lib/tbi-data";
import { logSearchEvent, resolveTrendingSearches, resolveTrendingBrands } from "@/lib/search-analytics";

type Hit = {
  id: string;
  label: string;
  sub: string;
  group: string;
  to: string;
  icon?: typeof Search;
};

const QUICK_LINKS: Hit[] = [
  { id: "ql-brokers", label: "Brokers", sub: "Browse all brokers", group: "Quick links", to: "/brokers", icon: Building2 },
  { id: "ql-prop", label: "Prop Firms", sub: "Top rated programs", group: "Quick links", to: "/programs", icon: Trophy },
  { id: "ql-ex", label: "Crypto Exchanges", sub: "Lowest fees, regulated", group: "Quick links", to: "/exchanges", icon: Coins },
  { id: "ql-pay", label: "Payouts", sub: "Live payout tracker", group: "Quick links", to: "/payouts", icon: Wallet },
  { id: "ql-tbi", label: "TBI Explorer", sub: "Trust Brand Index", group: "Quick links", to: "/tbi/explore", icon: BarChart3 },
  { id: "ql-cal", label: "Economic Calendar", sub: "Macro events & releases", group: "Quick links", to: "/economic-calendar", icon: Calendar },
  { id: "ql-acad", label: "Academy", sub: "Lessons & certifications", group: "Quick links", to: "/academy", icon: BookOpen },
  { id: "ql-comp", label: "Compare", sub: "Broker vs broker", group: "Quick links", to: "/compare", icon: Calculator },
];



const HISTORY_KEY = "rb_global_search_history";
const MAX_HISTORY = 6;

function readHistory(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}
function writeHistory(items: string[]) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(items.slice(0, MAX_HISTORY)));
  } catch { /* ignore */ }
}

function buildBrandHits(): Hit[] {
  return TBI_BRANDS.map((b) => ({
    id: `brand-${b.slug}`,
    label: b.name,
    sub: `${b.category} · TBI ${b.score}/${b.maxScore} · ${b.country}`,
    group: b.category === "Prop Firm" ? "Prop Firms" : b.category === "Broker" ? "Brokers" : b.category === "Exchange" ? "Exchanges" : "Tools",
    to: `/tbi/brand/${b.slug}`,
  }));
}

export function GlobalSearchModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [q, setQ] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  const brandHits = useMemo(buildBrandHits, []);
  const allHits = useMemo(() => [...brandHits, ...QUICK_LINKS], [brandHits]);

  // Trending searches & brands resolve from admin config (auto = top from analytics, manual = curated)
  const [trendingTerms, setTrendingTerms] = useState<string[]>([]);
  const [trendingBrands, setTrendingBrands] = useState<Hit[]>([]);
  useEffect(() => {
    const refresh = () => {
      setTrendingTerms(resolveTrendingSearches(8));
      const labels = resolveTrendingBrands(6);
      const byLabel = new Map(brandHits.map((b) => [b.label.toLowerCase(), b]));
      const resolved = labels
        .map((l) => byLabel.get(l.toLowerCase()))
        .filter((x): x is Hit => Boolean(x));
      setTrendingBrands(resolved.length > 0 ? resolved : brandHits.slice(0, 6));
    };
    refresh();
    const onCfg = () => refresh();
    window.addEventListener("rb:trending-config", onCfg);
    window.addEventListener("rb:search-events", onCfg);
    return () => {
      window.removeEventListener("rb:trending-config", onCfg);
      window.removeEventListener("rb:search-events", onCfg);
    };
  }, [brandHits, open]);

  useEffect(() => {
    if (!open) return;
    setHistory(readHistory());
    setQ("");
    const t = setTimeout(() => inputRef.current?.focus(), 50);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      clearTimeout(t);
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return [];
    return allHits
      .filter((h) => h.label.toLowerCase().includes(term) || h.sub.toLowerCase().includes(term) || h.group.toLowerCase().includes(term))
      .slice(0, 30);
  }, [q, allHits]);

  const grouped = useMemo(() => {
    const g: Record<string, Hit[]> = {};
    results.forEach((r) => { (g[r.group] ||= []).push(r); });
    return g;
  }, [results]);

  function pushHistory(term: string) {
    const t = term.trim();
    if (!t) return;
    const next = [t, ...history.filter((h) => h.toLowerCase() !== t.toLowerCase())].slice(0, MAX_HISTORY);
    setHistory(next);
    writeHistory(next);
  }

  function go(to: string, term?: string, hit?: Hit) {
    if (term) pushHistory(term);
    if (hit) {
      logSearchEvent({
        type: "click",
        term: term ?? hit.label,
        resultLabel: hit.label,
        resultGroup: hit.group,
        to: hit.to,
        surface: "landing",
      });
    }
    onClose();
    navigate({ to });
  }

  function submitFreeText() {
    const term = q.trim();
    if (!term) return;
    pushHistory(term);
    if (results[0]) {
      logSearchEvent({ type: "search", term, surface: "landing" });
      go(results[0].to, term, results[0]);
    } else {
      logSearchEvent({ type: "no_results", term, surface: "landing" });
      onClose();
      navigate({ to: "/tbi/explore" });
    }
  }

  if (!open) return null;
  if (typeof document === "undefined") return null;
  return createPortal(
    <div
      className="fixed inset-0 z-[2147483000] flex items-start justify-center overflow-y-auto bg-[#0a0418]/85 p-4 backdrop-blur-md"
      onClick={onClose}
    >
      {/* Decorative glow behind the card so it pops on the landing hero */}
      <div className="pointer-events-none absolute left-1/2 top-32 h-[420px] w-[680px] -translate-x-1/2 rounded-full bg-fuchsia-500/25 blur-3xl" />
      <div className="pointer-events-none absolute left-1/2 top-48 h-[320px] w-[520px] -translate-x-1/2 rounded-full bg-violet-500/20 blur-3xl" />

      <div
        onClick={(e) => e.stopPropagation()}
        className="relative mt-24 w-full max-w-2xl overflow-hidden rounded-3xl border-2 border-fuchsia-400/30 bg-gradient-to-b from-[#1f0e44] to-[#160933] shadow-[0_30px_80px_-20px_rgba(192,132,252,0.55)] ring-1 ring-white/10"
      >
        {/* Input */}
        <div className="flex items-center gap-3 border-b border-white/5 px-4 py-3">
          <Search className="h-4 w-4 text-fuchsia-300" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") submitFreeText(); }}
            placeholder="Search brokers, prop firms, exchanges, payouts, tools…"
            className="w-full bg-transparent text-sm text-white outline-none placeholder:text-muted-foreground"
          />
          <button
            onClick={onClose}
            className="grid h-7 w-7 place-items-center rounded-full bg-white/5 text-white hover:bg-white/10"
            aria-label="Close search"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="max-h-[65vh] overflow-y-auto p-3">
          {/* Empty state: trending + history + quick links */}
          {q.trim().length === 0 && (
            <div className="space-y-5">
              {/* Trending terms */}
              <section>
                <SectionHeader icon={Flame} label="Trending searches" />
                <div className="flex flex-wrap gap-2 px-1">
                  {trendingTerms.map((t: string) => (
                    <button
                      key={t}
                      onClick={() => setQ(t)}
                      className="glass-pill rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white hover:border-fuchsia-400/40 hover:bg-fuchsia-500/10"
                    >
                      <TrendingUp className="mr-1 inline h-3 w-3 text-fuchsia-300" />
                      {t}
                    </button>
                  ))}
                </div>
              </section>

              {/* History */}
              {history.length > 0 && (
                <section>
                  <div className="flex items-center justify-between px-1">
                    <SectionHeader icon={Clock} label="Recent searches" inline />
                    <button
                      onClick={() => { setHistory([]); writeHistory([]); }}
                      className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-white"
                    >
                      <Trash2 className="h-3 w-3" /> Clear
                    </button>
                  </div>
                  <div className="mt-2 space-y-1">
                    {history.map((h) => (
                      <button
                        key={h}
                        onClick={() => setQ(h)}
                        className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm text-white hover:bg-white/5"
                      >
                        <span className="flex items-center gap-2 truncate">
                          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                          {h}
                        </span>
                        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                      </button>
                    ))}
                  </div>
                </section>
              )}

              {/* Trending brands */}
              <section>
                <SectionHeader icon={Sparkles} label="Trending brands" />
                <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                  {trendingBrands.map((b) => (
                    <button
                      key={b.id}
                      onClick={() => go(b.to, b.label, b)}
                      className="flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm text-white hover:bg-white/5"
                    >
                      <div className="min-w-0">
                        <div className="truncate font-medium">{b.label}</div>
                        <div className="truncate text-[11px] text-muted-foreground">{b.sub}</div>
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
                    </button>
                  ))}
                </div>
              </section>

              {/* Quick links */}
              <section>
                <SectionHeader icon={ArrowRight} label="Jump to" />
                <div className="grid grid-cols-2 gap-1 sm:grid-cols-3">
                  {QUICK_LINKS.map((l) => {
                    const Icon = l.icon ?? ArrowRight;
                    return (
                      <button
                        key={l.id}
                        onClick={() => go(l.to, l.label, l)}
                        className="flex items-center gap-2 rounded-lg border border-white/5 bg-white/[0.03] px-3 py-2 text-left text-xs text-white hover:border-fuchsia-400/30 hover:bg-fuchsia-500/10"
                      >
                        <Icon className="h-3.5 w-3.5 text-fuchsia-300" />
                        <span className="truncate">{l.label}</span>
                      </button>
                    );
                  })}
                </div>
              </section>
            </div>
          )}

          {/* Active search results */}
          {q.trim().length > 0 && (
            <div>
              {Object.entries(grouped).length === 0 ? (
                <div className="px-4 py-12 text-center text-sm text-muted-foreground">
                  No matches for "<span className="text-white">{q}</span>". Press <kbd className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[10px]">Enter</kbd> to explore.
                </div>
              ) : (
                Object.entries(grouped).map(([group, hits]) => (
                  <div key={group} className="mb-2">
                    <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{group}</div>
                    {hits.map((h) => (
                      <button
                        key={h.id}
                        onClick={() => { logSearchEvent({ type: "search", term: q.trim(), surface: "landing" }); go(h.to, h.label, h); }}
                        className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm text-white hover:bg-white/5"
                      >
                        <div className="min-w-0">
                          <div className="truncate font-medium">{h.label}</div>
                          <div className="truncate text-[11px] text-muted-foreground">{h.sub}</div>
                        </div>
                        <ArrowRight className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
                      </button>
                    ))}
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <div className="border-t border-white/5 px-4 py-2 text-[10px] text-muted-foreground">
          <kbd className="rounded bg-white/10 px-1.5 py-0.5 font-mono">⌘K</kbd> to open ·
          <kbd className="ml-1 rounded bg-white/10 px-1.5 py-0.5 font-mono">Enter</kbd> to go ·
          <kbd className="ml-1 rounded bg-white/10 px-1.5 py-0.5 font-mono">Esc</kbd> to close
        </div>
      </div>
    </div>,
    document.body,
  );
}

function SectionHeader({ icon: Icon, label, inline }: { icon: typeof Search; label: string; inline?: boolean }) {
  return (
    <div className={`flex items-center gap-1.5 px-1 ${inline ? "" : "pb-2"} text-[10px] font-semibold uppercase tracking-wider text-muted-foreground`}>
      <Icon className="h-3 w-3 text-fuchsia-300" />
      {label}
    </div>
  );
}
