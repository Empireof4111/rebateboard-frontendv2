import { Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  Building2,
  Clock,
  FileText,
  Search,
  Wallet,
  X,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ElementType, type KeyboardEvent } from "react";
import { fetchPublicAdminBrands, type AdminBrandRecord } from "@/lib/admin-brands-api";
import { money, useTrt } from "@/lib/trt-store";

export type DashboardSearchRoute = {
  id: string;
  group: string;
  label: string;
  to: string;
  icon: ElementType;
  badge?: string;
};

type DashboardSearchResult = {
  id: string;
  group: string;
  label: string;
  sub: string;
  to: string;
  icon: ElementType | LucideIcon;
  terms?: string[];
};

const HISTORY_KEY = "rb.dashboard.search.history";

function readHistory() {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(HISTORY_KEY) || "[]");
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === "string").slice(0, 6) : [];
  } catch {
    return [];
  }
}

function writeHistory(items: string[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(items.slice(0, 6)));
  } catch {
    /* ignore */
  }
}

function brandDestination(brand: AdminBrandRecord) {
  return `/firm/${brand.slug || brand.id}`;
}

function brandSubtitle(brand: AdminBrandRecord) {
  const parts = [brand.category, brand.website ? new URLSafeHost(brand.website) : null, `TBI ${Number(brand.tbi || 0).toFixed(0)}/100`];
  return parts.filter(Boolean).join(" · ");
}

function URLSafeHost(value: string) {
  try {
    return new URL(value.startsWith("http") ? value : `https://${value}`).hostname.replace(/^www\./, "");
  } catch {
    return value;
  }
}

function collectSearchText(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value).trim();
  }
  if (Array.isArray(value)) {
    return value.map(collectSearchText).filter(Boolean).join(" ");
  }
  if (typeof value === "object") {
    return Object.values(value as Record<string, unknown>).map(collectSearchText).filter(Boolean).join(" ");
  }
  return "";
}

function matches(result: DashboardSearchResult, term: string) {
  return [result.label, result.sub, result.group, ...(result.terms ?? [])]
    .join(" ")
    .toLowerCase()
    .includes(term);
}

export function DashboardSearch({
  open,
  onClose,
  routes,
}: {
  open: boolean;
  onClose: () => void;
  routes: DashboardSearchRoute[];
}) {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const trt = useTrt();
  const [q, setQ] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [brands, setBrands] = useState<AdminBrandRecord[]>([]);
  const [brandLoading, setBrandLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (!open) return;
    setQ("");
    setHistory(readHistory());
    setActiveIndex(0);
    const timer = window.setTimeout(() => inputRef.current?.focus(), 40);
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setBrandLoading(true);
    fetchPublicAdminBrands()
      .then((items) => {
        if (!cancelled) setBrands(items);
      })
      .catch(() => {
        if (!cancelled) setBrands([]);
      })
      .finally(() => {
        if (!cancelled) setBrandLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  const pageResults = useMemo<DashboardSearchResult[]>(
    () =>
      routes.map((route) => ({
        id: `page-${route.to}-${route.label}`,
        group: "Pages",
        label: route.label,
        sub: route.group,
        to: route.to,
        icon: route.icon,
        terms: [route.badge ?? ""],
      })),
    [routes],
  );

  const brandResults = useMemo<DashboardSearchResult[]>(
    () =>
      brands.map((brand) => ({
        id: `brand-${brand.id}`,
        group: "Brands",
        label: brand.name,
        sub: brandSubtitle(brand),
        to: brandDestination(brand),
        icon: Building2,
        terms: [
          brand.slug,
          brand.category,
          brand.website ?? "",
          brand.supportEmail ?? "",
          collectSearchText(brand.identity),
          collectSearchText(brand.profile),
          collectSearchText(brand.broker),
          collectSearchText(brand.prop),
          collectSearchText(brand.exchange),
          collectSearchText(brand.tool),
          collectSearchText(brand.editorial),
          collectSearchText(brand.cashback),
          collectSearchText(brand.challenges),
        ],
      })),
    [brands],
  );

  const financialResults = useMemo<DashboardSearchResult[]>(() => {
    const transactions = trt.transactions.slice(0, 60).map((tx) => ({
      id: `tx-${tx.id}`,
      group: "Financial",
      label: `${tx.brand?.name || "TRT transaction"} · ${tx.category.replace(/_/g, " ")}`,
      sub: `${tx.direction === "income" ? "Income" : "Expense"} · ${money(tx.amount, tx.currency)} · ${tx.status}`,
      to: "/dashboard/accounts",
      icon: Wallet,
      terms: [tx.notes ?? "", tx.brand?.category ?? "", tx.date],
    }));
    const accounts = trt.accounts.slice(0, 40).map((account) => ({
      id: `account-${account.id}`,
      group: "Financial",
      label: account.name,
      sub: `${account.brand?.name || "Account"} · ${account.status.replace(/_/g, " ")}`,
      to: "/dashboard/accounts",
      icon: FileText,
      terms: [account.type, account.notes ?? "", account.brand?.category ?? ""],
    }));
    return [...transactions, ...accounts];
  }, [trt]);

  const allResults = useMemo(
    () => [...pageResults, ...brandResults, ...financialResults],
    [pageResults, brandResults, financialResults],
  );

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return pageResults.slice(0, 10);
    return allResults.filter((result) => matches(result, term)).slice(0, 32);
  }, [allResults, pageResults, q]);

  useEffect(() => {
    setActiveIndex(0);
  }, [q, results.length]);

  const grouped = useMemo(() => {
    const groups: Record<string, DashboardSearchResult[]> = {};
    results.forEach((result) => {
      (groups[result.group] ||= []).push(result);
    });
    return groups;
  }, [results]);

  function remember(term: string) {
    const trimmed = term.trim();
    if (!trimmed) return;
    const next = [trimmed, ...history.filter((item) => item.toLowerCase() !== trimmed.toLowerCase())].slice(0, 6);
    setHistory(next);
    writeHistory(next);
  }

  function openResult(result: DashboardSearchResult) {
    remember(q || result.label);
    onClose();
    navigate({ to: result.to as never });
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((value) => Math.min(value + 1, Math.max(results.length - 1, 0)));
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((value) => Math.max(value - 1, 0));
    }
    if (event.key === "Enter" && results[activeIndex]) {
      event.preventDefault();
      openResult(results[activeIndex]);
    }
  }

  if (!open) return null;

  let resultIndex = -1;

  return (
    <div
      className="fixed inset-0 z-[150] flex items-start justify-center overflow-y-auto bg-black/70 p-3 backdrop-blur-sm sm:p-4"
      onMouseDown={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Dashboard search"
    >
      <div
        className="mt-3 flex max-h-[calc(100dvh-1.5rem)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-[rgba(18,18,25,0.95)] shadow-2xl ring-1 ring-violet-400/10 sm:mt-14"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-white/5 px-4 py-3">
          <Search className="h-4 w-4 shrink-0 text-violet-300" />
          <input
            ref={inputRef}
            value={q}
            onChange={(event) => setQ(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search pages, brands, TRT records, and more..."
            className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-muted-foreground"
            aria-label="Search dashboard"
          />
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full bg-white/5 text-white transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
            aria-label="Close search"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mobile-scroll flex-1 overflow-y-auto p-2">
          {!q.trim() && history.length > 0 && (
            <div className="mb-2">
              <div className="flex items-center justify-between px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                <span>Recent searches</span>
                <button
                  type="button"
                  onClick={() => {
                    setHistory([]);
                    writeHistory([]);
                  }}
                  className="text-violet-200 transition hover:text-white"
                >
                  Clear
                </button>
              </div>
              <div className="flex flex-wrap gap-2 px-3 pb-2">
                {history.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setQ(item)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs text-white/80 transition hover:bg-white/10 hover:text-white"
                  >
                    <Clock className="h-3 w-3 text-violet-200" />
                    {item}
                  </button>
                ))}
              </div>
            </div>
          )}

          {brandLoading && q.trim().length > 1 && (
            <div className="space-y-2 p-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="h-12 animate-pulse rounded-xl bg-white/[0.06]" />
              ))}
            </div>
          )}

          {!brandLoading && results.length === 0 && (
            <div className="px-4 py-12 text-center">
              <p className="text-sm font-semibold text-white">No results found for “{q}”.</p>
              <p className="mt-1 text-xs text-muted-foreground">Try a page name, brand, claim, or TRT record.</p>
            </div>
          )}

          {!brandLoading &&
            Object.entries(grouped).map(([group, hits]) => (
              <div key={group} className="mb-2">
                <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {group}
                </div>
                {hits.map((hit) => {
                  resultIndex += 1;
                  const Icon = hit.icon;
                  const active = resultIndex === activeIndex;
                  return (
                    <Link
                      key={hit.id}
                      to={hit.to as string}
                      onClick={() => {
                        remember(q || hit.label);
                        onClose();
                      }}
                      className={`flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm text-white outline-none transition focus-visible:ring-2 focus-visible:ring-ring/60 ${
                        active ? "bg-white/[0.08]" : "hover:bg-white/[0.05]"
                      }`}
                    >
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/[0.06] text-violet-100 ring-1 ring-white/10">
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium">{hit.label}</span>
                        <span className="block truncate text-[11px] text-muted-foreground">{hit.sub}</span>
                      </span>
                      <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    </Link>
                  );
                })}
              </div>
            ))}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-white/5 px-4 py-2 text-[10px] text-muted-foreground">
          <span>
            <kbd className="rounded bg-white/10 px-1.5 py-0.5 font-mono">⌘K</kbd> /{" "}
            <kbd className="rounded bg-white/10 px-1.5 py-0.5 font-mono">Ctrl K</kbd> to open
          </span>
          <span>
            <kbd className="rounded bg-white/10 px-1.5 py-0.5 font-mono">Esc</kbd> to close
          </span>
        </div>
      </div>
    </div>
  );
}
