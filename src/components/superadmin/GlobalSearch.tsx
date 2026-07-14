import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Search, X, ArrowRight } from "lucide-react";
import { userAdminApi } from "@/lib/admin-api";
import { fetchAdminBrands } from "@/lib/admin-brands-api";
import { useAuth } from "@/lib/auth";
import { useAdminPermissions } from "@/lib/admin-permissions";

type Hit = { id: string; label: string; sub: string; group: string; to: string };

function buildModuleIndex(): Hit[] {
  const hits: Hit[] = [];
  const modules = [
    ["Mission Control", "/superadmin"],
    ["Roles & Permissions", "/superadmin/roles"],
    ["Journal Analytics", "/superadmin/journal-analytics"],
    ["Daily Tasks", "/superadmin/daily-tasks"],
    ["RR Purchases", "/superadmin/rr-purchases"],
    ["TBI Engine", "/superadmin/tbi"],
    ["Cashback Engine", "/superadmin/cashback"],
    ["User Wallets", "/superadmin/wallets"],
    ["Transactions", "/superadmin/transactions"],
    ["Reviews", "/superadmin/reviews"],
    ["Landing Testimonials", "/superadmin/reviews?view=testimonials"],
    ["Add Brand", "/superadmin/brands/new"],
    ["Announcements", "/superadmin/announcements"],
    ["Pop-ups", "/superadmin/popups"],
    ["Offers", "/superadmin/offers"],
    ["Demo Accounts", "/superadmin/demo-accounts"],
    ["Merit Awards", "/superadmin/merit-awards"],
    ["Challenge Purchases", "/superadmin/challenge-purchases"],
    ["Top Sellers", "/superadmin/top-sellers"],
    ["Subscribers", "/superadmin/subscribers"],
    ["Audit Log", "/superadmin/audit"],
    ["Feature Flags", "/superadmin/flags"],
    ["API Keys", "/superadmin/api-keys"],
    ["Bug Bounty", "/superadmin/Bug-bounty"],
    ["Settings", "/superadmin/settings"],
  ] as const;
  modules.forEach(([label, to]) => hits.push({ id: `m-${to}`, label, sub: "Open module", group: "Navigate", to }));
  return hits;
}

export function GlobalSearch({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { token } = useAuth();
  const { canRoute } = useAdminPermissions();
  const [q, setQ] = useState("");
  const [liveHits, setLiveHits] = useState<Hit[]>([]);
  const [loading, setLoading] = useState(false);
  const modules = useMemo(() => buildModuleIndex().filter((hit) => canRoute(hit.to)), [canRoute]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  useEffect(() => {
    if (open) {
      setQ("");
      setLiveHits([]);
    }
  }, [open]);

  useEffect(() => {
    if (!open || !token) return;
    const term = q.trim();
    let cancelled = false;

    async function loadLiveResults() {
      setLoading(Boolean(term));
      try {
        const [usersResponse, brands] = await Promise.all([
          term ? userAdminApi.search(token!, term, 0, 8).catch(() => null) : Promise.resolve(null),
          fetchAdminBrands().catch(() => []),
        ]);
        if (cancelled) return;

        const lowered = term.toLowerCase();
        const userHits: Hit[] = (usersResponse?.payload?.page ?? []).map((user) => ({
          id: `u-${user.id}`,
          label: user.name || user.email || `User #${user.id}`,
          sub: `${user.email || "No email"} · ${user.country || "No country"}`,
          group: "Users",
          to: "/superadmin/users",
        }));
        const brandHits: Hit[] = brands
          .filter((brand) => {
            if (!term) return true;
            return [brand.name, brand.category, brand.slug, brand.website]
              .filter(Boolean)
              .some((value) => String(value).toLowerCase().includes(lowered));
          })
          .slice(0, term ? 12 : 8)
          .map((brand) => ({
            id: `b-${brand.id}`,
            label: brand.name,
            sub: `${brand.category} · ${brand.visibility} · TBI ${Number(brand.tbi || 0).toFixed(1)}`,
            group: "Brands",
            to: "/superadmin/brands",
          }));

        setLiveHits([...userHits, ...brandHits]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    const handle = window.setTimeout(loadLiveResults, term ? 180 : 0);
    return () => {
      cancelled = true;
      window.clearTimeout(handle);
    };
  }, [open, q, token]);

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    const moduleResults = term
      ? modules
      .filter((h) => h.label.toLowerCase().includes(term) || h.sub.toLowerCase().includes(term) || h.group.toLowerCase().includes(term))
      : modules.slice(0, 12);
    return [...liveHits, ...moduleResults].slice(0, 40);
  }, [q, modules, liveHits]);

  const grouped = useMemo(() => {
    const g: Record<string, Hit[]> = {};
    results.forEach((r) => { (g[r.group] ||= []).push(r); });
    return g;
  }, [results]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[150] flex items-start justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="mt-16 w-full max-w-2xl overflow-hidden rounded-2xl border border-white/10 bg-[rgba(18,18,25,0.95)] shadow-2xl ring-1 ring-violet-400/10">
        <div className="flex items-center gap-3 border-b border-white/5 px-4 py-3">
          <Search className="h-4 w-4 text-violet-300" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search users, brands, complaints, payouts, claims, content…"
            className="w-full bg-transparent text-sm text-white outline-none placeholder:text-muted-foreground"
          />
          <button onClick={onClose} className="grid h-7 w-7 place-items-center rounded-full bg-white/5 text-white hover:bg-white/10">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="max-h-[60vh] overflow-y-auto p-2">
          {loading && (
            <div className="space-y-2 p-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-12 animate-pulse rounded-lg bg-white/[0.06]" />
              ))}
            </div>
          )}
          {!loading && Object.entries(grouped).length === 0 && (
            <div className="px-4 py-12 text-center text-sm text-muted-foreground">No matches for "{q}"</div>
          )}
          {!loading && Object.entries(grouped).map(([group, hits]) => (
            <div key={group} className="mb-2">
              <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{group}</div>
              {hits.map((h) => (
                <Link
                  key={h.id}
                  to={h.to}
                  onClick={onClose}
                  className="flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm text-white hover:bg-white/5"
                >
                  <div className="min-w-0">
                    <div className="truncate font-medium">{h.label}</div>
                    <div className="truncate text-[11px] text-muted-foreground">{h.sub}</div>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
                </Link>
              ))}
            </div>
          ))}
        </div>
        <div className="border-t border-white/5 px-4 py-2 text-[10px] text-muted-foreground">
          <kbd className="rounded bg-white/10 px-1.5 py-0.5 font-mono">⌘K</kbd> to open · <kbd className="rounded bg-white/10 px-1.5 py-0.5 font-mono">Esc</kbd> to close
        </div>
      </div>
    </div>
  );
}
