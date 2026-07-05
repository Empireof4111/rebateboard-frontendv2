import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  LayoutDashboard, Users, Building2, Star, FileWarning, Wallet, Trophy,
  GraduationCap, Newspaper, Megaphone, Shield, Flag, Settings, KeyRound,
  Bell, Activity, Coins, Handshake, Scale, Search, Menu, X, ChevronDown, Sparkles,
  CircleDollarSign, ClipboardCheck, ArrowDownToLine, HelpCircle, BadgePlus,
  ShieldCheck, Inbox, Mail, Radio, MousePointerClick, FlaskConical, BarChart3,
  Bug,
  ListTodo,
  Monitor,
  BookOpen,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { ToastViewport, toast } from "./AdminActions";
import { GlobalSearch } from "./GlobalSearch";
import { useAdminPermissions } from "@/lib/admin-permissions";
import { fetchAdminBugBountyStats } from "@/lib/bug-bounty-api";

type Item = { to: string; label: string; icon: typeof Users; badge?: string; exact?: boolean };
type Group = { id: string; label: string; items: Item[] };

const groups: Group[] = [
  {
    id: "core",
    label: "Core",
    items: [
      { to: "/superadmin", label: "Mission Control", icon: LayoutDashboard, exact: true },
      { to: "/superadmin/analytics", label: "Analytics", icon: BarChart3, badge: "LIVE" },
      { to: "/superadmin/journal-analytics", label: "Journal Analytics", icon: BookOpen, badge: "NEW" },
      { to: "/superadmin/daily-tasks", label: "Daily Tasks", icon: ListTodo, badge: "NEW" },
      { to: "/superadmin/search-analytics", label: "Search Analytics", icon: Search, badge: "NEW" },
      { to: "/superadmin/users", label: "Users", icon: Users, badge: "48K" },
      { to: "/superadmin/roles", label: "Roles & Permissions", icon: ShieldCheck },
      { to: "/superadmin/inbox", label: "Inbox", icon: Inbox, badge: "5" },
    ],
  },
  {
    id: "brands",
    label: "Brands & Trust",
    items: [
      { to: "/superadmin/brands", label: "Brands", icon: Building2 },
      { to: "/superadmin/brands/new", label: "Add Brand", icon: BadgePlus },
      { to: "/superadmin/offers", label: "Offers & Discounts", icon: Megaphone },
      { to: "/superadmin/reviews", label: "Reviews", icon: Star, badge: "214" },
      { to: "/superadmin/complaints", label: "Complaints", icon: FileWarning, badge: "38" },
      { to: "/superadmin/tbi", label: "TBI Engine", icon: Shield },
      { to: "/superadmin/brand-requests", label: "Brand Requests", icon: Mail, badge: "NEW" },
      { to: "/superadmin/backtest", label: "AI Backtest Lab", icon: FlaskConical, badge: "NEW" },
    ],
  },
  {
    id: "finance",
    label: "Finance & Ops",
    items: [
      { to: "/superadmin/wallets", label: "User Wallets", icon: Wallet },
      { to: "/superadmin/withdrawals", label: "Withdrawals", icon: ArrowDownToLine },
      { to: "/superadmin/transactions", label: "Transactions", icon: Activity },
      { to: "/superadmin/trt", label: "ROI Tracker", icon: BarChart3, badge: "TRT" },
      { to: "/superadmin/claims", label: "Cashback Claims", icon: ClipboardCheck, badge: "47" },
      { to: "/superadmin/partner-requests", label: "Partner Requests", icon: Mail },
      { to: "/superadmin/cashback", label: "Cashback Engine", icon: CircleDollarSign },
      { to: "/superadmin/payouts", label: "Payouts", icon: Wallet },
      { to: "/superadmin/wallet", label: "RR Ledger", icon: Coins },
      { to: "/superadmin/affiliates", label: "Affiliates / IB", icon: Handshake },
      { to: "/superadmin/disputes", label: "Disputes", icon: Scale },
    ],
  },
  {
    id: "content",
    label: "Growth & Content",
    items: [
      { to: "/superadmin/rr", label: "RR Control Center", icon: Coins, badge: "HUB" },
      { to: "/superadmin/rr-purchases", label: "RR Purchases", icon: CircleDollarSign, badge: "NEW" },
      { to: "/superadmin/leaderboards", label: "Leaderboards", icon: Trophy },
      { to: "/superadmin/academy", label: "Academy", icon: GraduationCap },
      { to: "/superadmin/blog", label: "Blog & News", icon: Newspaper },
      { to: "/superadmin/news", label: "Company News", icon: Radio },
      { to: "/superadmin/faqs", label: "FAQs", icon: HelpCircle },
      { to: "/superadmin/announcements", label: "Announcements", icon: Megaphone },
      { to: "/superadmin/ads", label: "Dashboard Ads", icon: Megaphone, badge: "NEW" },
      { to: "/superadmin/demo-accounts", label: "Demo Accounts", icon: Monitor, badge: "NEW" },
      { to: "/superadmin/challenge-purchases", label: "Challenge Purchases", icon: ClipboardCheck, badge: "NEW" },
      { to: "/superadmin/top-sellers", label: "Top Sellers", icon: Trophy, badge: "NEW" },
      { to: "/superadmin/popups", label: "Pop-ups", icon: MousePointerClick },
      { to: "/superadmin/subscribers", label: "Subscribers", icon: Mail },
    ],
  },
  {
    id: "system",
    label: "System",
    items: [
      { to: "/superadmin/audit", label: "Audit Log", icon: Activity },
      { to: "/superadmin/flags", label: "Feature Flags", icon: Flag },
      { to: "/superadmin/notifications", label: "Notifications", icon: Bell },
      { to: "/superadmin/api-keys", label: "API Keys", icon: KeyRound },
      { to: "/superadmin/Bug-bounty", label: "Bug Bounty", icon: Bug },
      { to: "/superadmin/settings", label: "Settings", icon: Settings },
    ],
  },
];

export function SuperadminLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { canRoute, roles, activeRoleId, setActiveRoleId, activeRole } = useAdminPermissions();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [bugBountyOpenCount, setBugBountyOpenCount] = useState<string>("");
  const [open, setOpen] = useState<Record<string, boolean>>({
    core: true, brands: true, finance: true, content: true, system: true,
  });
  const toggle = (id: string) => setOpen((s) => ({ ...s, [id]: !s[id] }));

  // Filter every group's items by current role permissions. Hides empty groups.
  const visibleGroups = groups
    .map((g) => ({ ...g, items: g.items.filter((it) => canRoute(it.to)) }))
    .filter((g) => g.items.length > 0);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadBugBountyCount() {
      try {
        const stats = await fetchAdminBugBountyStats();
        if (!cancelled) {
          setBugBountyOpenCount(stats.open > 0 ? String(stats.open) : "");
        }
      } catch {
        if (!cancelled) {
          setBugBountyOpenCount("");
        }
      }
    }

    void loadBugBountyCount();
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  return (
    <div className="relative min-h-screen">
      <div className="glow-orb left-[-10%] top-[-10%] h-[500px] w-[500px]" />
      <div className="glow-orb right-[-10%] bottom-[-10%] h-[600px] w-[600px]" />

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 transform border-r border-white/5 bg-[#150829]/90 backdrop-blur-xl transition-all duration-200 ease-out lg:translate-x-0 ${
          sidebarCollapsed ? "lg:w-20" : "lg:w-64"
        } ${
          mobileOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        }`}
        aria-label="Superadmin navigation"
      >
        <div className={`flex h-16 items-center justify-between border-b border-white/5 px-4 ${sidebarCollapsed ? "lg:px-3" : ""}`}>
          <Link to="/" className={`flex min-w-0 items-center gap-2 ${sidebarCollapsed ? "lg:justify-center" : ""}`}>
            <Logo heightClass="h-9" iconOnly={sidebarCollapsed} />
            <span className={`rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-600 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white ${sidebarCollapsed ? "lg:hidden" : ""}`}>
              ADMIN
            </span>
          </Link>
          <button
            onClick={() => setSidebarCollapsed((value) => !value)}
            className="hidden h-9 w-9 place-items-center rounded-xl text-fuchsia-100 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 lg:grid"
            aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {sidebarCollapsed ? <PanelLeftOpen className="h-[18px] w-[18px]" /> : <PanelLeftClose className="h-[18px] w-[18px]" />}
          </button>
          <button
            onClick={() => setMobileOpen(false)}
            className="grid h-9 w-9 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-white/5 hover:text-white lg:hidden"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className={`flex flex-col gap-1 overflow-y-auto px-2 py-3 ${sidebarCollapsed ? "lg:px-2" : ""}`} style={{ maxHeight: "calc(100vh - 4rem)" }}>
          {visibleGroups.map((g) => {
            const isOpen = open[g.id];
            const showItems = sidebarCollapsed || isOpen;
            return (
              <div key={g.id} className="mb-1">
                {sidebarCollapsed ? (
                  <div className="mx-3 my-2 hidden h-px bg-white/10 lg:block" title={g.label} />
                ) : (
                  <button
                    onClick={() => toggle(g.id)}
                    className="flex w-full items-center justify-between rounded-lg px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
                    aria-expanded={isOpen}
                  >
                    <span>{g.label}</span>
                    <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
                  </button>
                )}
                {showItems && (
                  <div className="mt-0.5 flex flex-col gap-0.5">
                    {g.items.map((item) => {
                      const active = item.exact
                        ? pathname === item.to
                        : pathname === item.to || pathname.startsWith(item.to + "/");
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.to}
                          to={item.to as string}
                          onClick={() => setMobileOpen(false)}
                          aria-current={active ? "page" : undefined}
                          title={sidebarCollapsed ? item.label : undefined}
                          className={`group relative flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-medium outline-none transition-all focus-visible:ring-2 focus-visible:ring-ring/60 ${
                            active
                              ? "bg-white/10 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]"
                              : "text-muted-foreground hover:bg-white/5 hover:text-white"
                          } ${sidebarCollapsed ? "lg:justify-center lg:gap-0 lg:px-0" : ""}`}
                        >
                          {active && <span className="absolute inset-y-1.5 left-0 w-0.5 rounded-full bg-gradient-to-b from-fuchsia-400 to-violet-500" aria-hidden />}
                          <Icon className={`h-4 w-4 shrink-0 transition-colors ${active ? "text-fuchsia-400" : "group-hover:text-white/90"}`} />
                          <span className={`flex-1 truncate ${sidebarCollapsed ? "lg:hidden" : ""}`}>{item.label}</span>
                          {(item.to === "/superadmin/Bug-bounty" ? bugBountyOpenCount : item.badge) && (
                            <span className={`rounded-full bg-white/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white/90 ring-1 ring-white/10 ${sidebarCollapsed ? "lg:hidden" : ""}`}>
                              {item.to === "/superadmin/Bug-bounty" ? bugBountyOpenCount : item.badge}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      <div className={sidebarCollapsed ? "lg:pl-20" : "lg:pl-64"}>
        <header className="sticky top-0 z-30 border-b border-white/5 bg-[#150829]/75 backdrop-blur-xl">
          <div className="flex h-14 items-center gap-2 px-3 sm:h-16 sm:gap-3 sm:px-4 md:px-6">
            <button
              onClick={() => setMobileOpen(true)}
              className="grid h-9 w-9 place-items-center rounded-lg text-white transition-colors hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 lg:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <button
              onClick={() => setSearchOpen(true)}
              className="glass hidden flex-1 items-center gap-2 rounded-full px-4 py-2 text-left transition-colors hover:bg-white/5 md:flex md:max-w-md"
            >
              <Search className="h-4 w-4 text-muted-foreground" />
              <span className="flex-1 truncate text-sm text-muted-foreground">Search users, brands, complaints, payouts…</span>
              <kbd className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">⌘K</kbd>
            </button>
            <button
              onClick={() => setSearchOpen(true)}
              className="grid h-9 w-9 place-items-center rounded-full text-white transition-colors hover:bg-white/5 md:hidden"
              aria-label="Search"
            >
              <Search className="h-4 w-4" />
            </button>
            <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
              <span className="hidden items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1.5 text-[11px] font-semibold text-emerald-300 ring-1 ring-emerald-400/30 lg:inline-flex">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" /> All systems operational
              </span>
              <span className="grid h-9 w-9 place-items-center rounded-full bg-emerald-500/15 ring-1 ring-emerald-400/30 lg:hidden" aria-label="System status: operational" title="All systems operational">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
              </span>
              <Link to="/" className="glass-pill hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-white sm:inline-flex">
                <Sparkles className="h-3.5 w-3.5 text-fuchsia-400" /> Exit admin
              </Link>
              <label className="hidden items-center gap-1.5 md:inline-flex" title="Preview the dashboard as this role">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Acting as</span>
                <select
                  value={activeRoleId}
                  onChange={(e) => { setActiveRoleId(e.target.value); toast.success(`Now acting as ${roles.find((r) => r.id === e.target.value)?.name}`); }}
                  className="rounded-full border border-white/10 bg-white/10 px-2 py-1 text-[11px] font-semibold text-white focus:outline-none focus:ring-2 focus:ring-fuchsia-400/40"
                >
                  {roles.filter((r) => r.status === "active").map((r) => (
                    <option key={r.id} value={r.id} className="bg-[#150829]">{r.name}</option>
                  ))}
                </select>
              </label>
              <button
                onClick={() => toast.info("3 new notifications")}
                className="glass-pill grid h-9 w-9 place-items-center rounded-full text-white transition-colors hover:bg-white/10"
                aria-label="Notifications"
              >
                <Bell className="h-4 w-4" />
              </button>
              <div
                className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-fuchsia-500 to-violet-600 text-xs font-bold text-white shadow-[0_0_14px_rgba(192,132,252,0.35)]"
                title={activeRole?.name}
              >
                {activeRole?.name?.split(" ").map((w) => w[0]).slice(0, 2).join("") ?? "SA"}
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1500px] p-3 sm:p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>

      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
      <ToastViewport />
    </div>
  );
}
