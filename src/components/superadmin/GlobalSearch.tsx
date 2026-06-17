import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Search, X, ArrowRight } from "lucide-react";
import { adminUsers, adminBrands, openComplaints, recentPayouts, withdrawals, claims, faqs, blogPosts, companyNews, inboxMessages } from "@/lib/admin-data";

type Hit = { id: string; label: string; sub: string; group: string; to: string };

function buildIndex(): Hit[] {
  const hits: Hit[] = [];
  adminUsers.forEach((u) => hits.push({ id: `u-${u.id}`, label: u.name, sub: `${u.email} · ${u.country}`, group: "Users", to: "/superadmin/users" }));
  adminBrands.forEach((b) => hits.push({ id: `b-${b.id}`, label: b.name, sub: `${b.category} · TBI ${b.tbi}`, group: "Brands", to: "/superadmin/brands" }));
  openComplaints.forEach((c) => hits.push({ id: `c-${c.id}`, label: `${c.brand} — ${c.category}`, sub: `${c.user} · ${c.severity}`, group: "Complaints", to: "/superadmin/complaints" }));
  recentPayouts.forEach((p) => hits.push({ id: `p-${p.id}`, label: `${p.brand} payout`, sub: `$${p.amount.toLocaleString()} · ${p.chain}`, group: "Payouts", to: "/superadmin/payouts" }));
  withdrawals.forEach((w) => hits.push({ id: `w-${w.id}`, label: `${w.user} withdrawal`, sub: `$${w.amount} · ${w.method}`, group: "Withdrawals", to: "/superadmin/withdrawals" }));
  claims.forEach((c) => hits.push({ id: `cl-${c.id}`, label: `${c.user} claim`, sub: `${c.partner} · $${c.amount}`, group: "Claims", to: "/superadmin/claims" }));
  faqs.forEach((f) => hits.push({ id: `f-${f.id}`, label: f.question, sub: `FAQ · ${f.category}`, group: "FAQs", to: "/superadmin/faqs" }));
  blogPosts.forEach((b) => hits.push({ id: `bl-${b.id}`, label: b.title, sub: `Blog · ${b.author}`, group: "Blog", to: "/superadmin/blog" }));
  companyNews.forEach((n) => hits.push({ id: `n-${n.id}`, label: n.title, sub: `News · ${n.author}`, group: "News", to: "/superadmin/news" }));
  inboxMessages.forEach((m) => hits.push({ id: `i-${m.id}`, label: m.subject, sub: `${m.user} · ${m.email}`, group: "Inbox", to: "/superadmin/inbox" }));
  // Module shortcuts
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
    ["Add Brand", "/superadmin/brands/new"],
    ["Announcements", "/superadmin/announcements"],
    ["Pop-ups", "/superadmin/popups"],
    ["Offers", "/superadmin/offers"],
    ["Demo Accounts", "/superadmin/demo-accounts"],
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
  const [q, setQ] = useState("");
  const index = useMemo(buildIndex, []);

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

  useEffect(() => { if (open) setQ(""); }, [open]);

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return index.slice(0, 12);
    return index
      .filter((h) => h.label.toLowerCase().includes(term) || h.sub.toLowerCase().includes(term) || h.group.toLowerCase().includes(term))
      .slice(0, 40);
  }, [q, index]);

  const grouped = useMemo(() => {
    const g: Record<string, Hit[]> = {};
    results.forEach((r) => { (g[r.group] ||= []).push(r); });
    return g;
  }, [results]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[150] flex items-start justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="mt-16 w-full max-w-2xl overflow-hidden rounded-2xl border border-white/10 bg-[#1a0d36]/95 shadow-2xl ring-1 ring-fuchsia-400/10">
        <div className="flex items-center gap-3 border-b border-white/5 px-4 py-3">
          <Search className="h-4 w-4 text-fuchsia-300" />
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
          {Object.entries(grouped).length === 0 && (
            <div className="px-4 py-12 text-center text-sm text-muted-foreground">No matches for "{q}"</div>
          )}
          {Object.entries(grouped).map(([group, hits]) => (
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
