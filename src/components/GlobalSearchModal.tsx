import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "@tanstack/react-router";
import {
  Search,
  X,
  ArrowRight,
  TrendingUp,
  Clock,
  Sparkles,
  Flame,
  Building2,
  Coins,
  BarChart3,
  Calculator,
  Calendar,
  Wallet,
  BookOpen,
  Trophy,
  Trash2,
} from "lucide-react";
import { TBI_BRANDS } from "@/lib/tbi-data";
import { fetchPublicSearchTrending, logSearchEvent } from "@/lib/search-analytics";

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
  } catch {}
}

function buildBrandHits(): Hit[] {
  return TBI_BRANDS.map((brand) => ({
    id: `brand-${brand.slug}`,
    label: brand.name,
    sub: `${brand.category} | TBI ${brand.score}/${brand.maxScore} | ${brand.country}`,
    group:
      brand.category === "Prop Firm"
        ? "Prop Firms"
        : brand.category === "Broker"
          ? "Brokers"
          : brand.category === "Exchange"
            ? "Exchanges"
            : "Tools",
    to: `/tbi/brand/${brand.slug}`,
  }));
}

export function GlobalSearchModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [q, setQ] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [trendingTerms, setTrendingTerms] = useState<string[]>([]);
  const [trendingBrands, setTrendingBrands] = useState<Hit[]>([]);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  const brandHits = useMemo(buildBrandHits, []);
  const allHits = useMemo(() => [...brandHits, ...QUICK_LINKS], [brandHits]);

  useEffect(() => {
    let active = true;
    const byLabel = new Map(brandHits.map((brand) => [brand.label.toLowerCase(), brand]));

    const loadTrending = async () => {
      try {
        const payload = await fetchPublicSearchTrending();
        if (!active) return;
        const resolvedTerms = payload.searches.resolved ?? payload.searches.items ?? [];
        const resolvedBrandLabels = payload.brands.resolved ?? payload.brands.items ?? [];
        setTrendingTerms(resolvedTerms.slice(0, 8));
        const resolvedBrands = resolvedBrandLabels
          .map((label) => byLabel.get(label.toLowerCase()))
          .filter((item): item is Hit => Boolean(item));
        setTrendingBrands(resolvedBrands.length ? resolvedBrands : brandHits.slice(0, 6));
      } catch {
        if (!active) return;
        setTrendingTerms(["FTMO", "Binance", "IC Markets", "Bybit", "Best rebates"]);
        setTrendingBrands(brandHits.slice(0, 6));
      }
    };

    if (open) {
      void loadTrending();
    }

    return () => {
      active = false;
    };
  }, [brandHits, open]);

  useEffect(() => {
    if (!open) return;
    setHistory(readHistory());
    setQ("");
    const timer = setTimeout(() => inputRef.current?.focus(), 50);
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      clearTimeout(timer);
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return [];
    return allHits
      .filter(
        (hit) =>
          hit.label.toLowerCase().includes(term) ||
          hit.sub.toLowerCase().includes(term) ||
          hit.group.toLowerCase().includes(term),
      )
      .slice(0, 30);
  }, [q, allHits]);

  const grouped = useMemo(() => {
    const groups: Record<string, Hit[]> = {};
    results.forEach((result) => {
      (groups[result.group] ||= []).push(result);
    });
    return groups;
  }, [results]);

  function pushHistory(term: string) {
    const nextTerm = term.trim();
    if (!nextTerm) return;
    const next = [nextTerm, ...history.filter((item) => item.toLowerCase() !== nextTerm.toLowerCase())].slice(0, MAX_HISTORY);
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

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[2147483000] flex items-start justify-center overflow-y-auto bg-[#0a0418]/85 p-4 backdrop-blur-md"
      onClick={onClose}
    >
      <div className="pointer-events-none absolute left-1/2 top-32 h-[420px] w-[680px] -translate-x-1/2 rounded-full bg-fuchsia-500/25 blur-3xl" />
      <div className="pointer-events-none absolute left-1/2 top-48 h-[320px] w-[520px] -translate-x-1/2 rounded-full bg-violet-500/20 blur-3xl" />

      <div
        onClick={(event) => event.stopPropagation()}
        className="relative mt-24 w-full max-w-2xl overflow-hidden rounded-3xl border-2 border-fuchsia-400/30 bg-gradient-to-b from-[#1f0e44] to-[#160933] shadow-[0_30px_80px_-20px_rgba(192,132,252,0.55)] ring-1 ring-white/10"
      >
        <div className="flex items-center gap-3 border-b border-white/5 px-4 py-3">
          <Search className="h-4 w-4 text-fuchsia-300" />
          <input
            ref={inputRef}
            value={q}
            onChange={(event) => setQ(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") submitFreeText();
            }}
            placeholder="Search brokers, prop firms, exchanges, payouts, tools..."
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
          {q.trim().length === 0 && (
            <div className="space-y-5">
              <section>
                <SectionHeader icon={Flame} label="Trending searches" />
                <div className="flex flex-wrap gap-2 px-1">
                  {trendingTerms.map((term) => (
                    <button
                      key={term}
                      onClick={() => setQ(term)}
                      className="glass-pill rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white hover:border-fuchsia-400/40 hover:bg-fuchsia-500/10"
                    >
                      <TrendingUp className="mr-1 inline h-3 w-3 text-fuchsia-300" />
                      {term}
                    </button>
                  ))}
                </div>
              </section>

              {history.length > 0 && (
                <section>
                  <div className="flex items-center justify-between px-1">
                    <SectionHeader icon={Clock} label="Recent searches" inline />
                    <button
                      onClick={() => {
                        setHistory([]);
                        writeHistory([]);
                      }}
                      className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-white"
                    >
                      <Trash2 className="h-3 w-3" /> Clear
                    </button>
                  </div>
                  <div className="mt-2 space-y-1">
                    {history.map((item) => (
                      <button
                        key={item}
                        onClick={() => setQ(item)}
                        className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm text-white hover:bg-white/5"
                      >
                        <span className="flex items-center gap-2 truncate">
                          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                          {item}
                        </span>
                        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                      </button>
                    ))}
                  </div>
                </section>
              )}

              <section>
                <SectionHeader icon={Sparkles} label="Trending brands" />
                <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                  {trendingBrands.map((brand) => (
                    <button
                      key={brand.id}
                      onClick={() => go(brand.to, brand.label, brand)}
                      className="flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm text-white hover:bg-white/5"
                    >
                      <div className="min-w-0">
                        <div className="truncate font-medium">{brand.label}</div>
                        <div className="truncate text-[11px] text-muted-foreground">{brand.sub}</div>
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
                    </button>
                  ))}
                </div>
              </section>

              <section>
                <SectionHeader icon={ArrowRight} label="Jump to" />
                <div className="grid grid-cols-2 gap-1 sm:grid-cols-3">
                  {QUICK_LINKS.map((link) => {
                    const Icon = link.icon ?? ArrowRight;
                    return (
                      <button
                        key={link.id}
                        onClick={() => go(link.to, link.label, link)}
                        className="flex items-center gap-2 rounded-lg border border-white/5 bg-white/[0.03] px-3 py-2 text-left text-xs text-white hover:border-fuchsia-400/30 hover:bg-fuchsia-500/10"
                      >
                        <Icon className="h-3.5 w-3.5 text-fuchsia-300" />
                        <span className="truncate">{link.label}</span>
                      </button>
                    );
                  })}
                </div>
              </section>
            </div>
          )}

          {q.trim().length > 0 && (
            <div>
              {Object.entries(grouped).length === 0 ? (
                <div className="px-4 py-12 text-center text-sm text-muted-foreground">
                  No matches for <span className="text-white">"{q}"</span>. Press <kbd className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[10px]">Enter</kbd> to explore.
                </div>
              ) : (
                Object.entries(grouped).map(([group, hits]) => (
                  <div key={group} className="mb-2">
                    <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{group}</div>
                    {hits.map((hit) => (
                      <button
                        key={hit.id}
                        onClick={() => {
                          logSearchEvent({ type: "search", term: q.trim(), surface: "landing" });
                          go(hit.to, hit.label, hit);
                        }}
                        className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm text-white hover:bg-white/5"
                      >
                        <div className="min-w-0">
                          <div className="truncate font-medium">{hit.label}</div>
                          <div className="truncate text-[11px] text-muted-foreground">{hit.sub}</div>
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
          <kbd className="rounded bg-white/10 px-1.5 py-0.5 font-mono">Ctrl K</kbd> to open |
          <kbd className="ml-1 rounded bg-white/10 px-1.5 py-0.5 font-mono">Enter</kbd> to go |
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
