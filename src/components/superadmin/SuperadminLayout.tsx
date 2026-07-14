import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import {
  LayoutDashboard, Users, Building2, Star, FileWarning, Wallet, Trophy, Award,
  GraduationCap, Newspaper, Megaphone, Shield, Flag, Settings, KeyRound,
  Bell, Activity, Coins, Handshake, Scale, Search, Menu, X, ChevronDown, LogOut,
  CircleDollarSign, ClipboardCheck, ArrowDownToLine, HelpCircle,
  ShieldCheck, Inbox, Mail, Radio, MousePointerClick, FlaskConical, BarChart3,
  Bug,
  ListTodo,
  Monitor,
  BookOpen,
  PanelLeftClose,
  PanelLeftOpen,
  Youtube,
  Calculator,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { ToastViewport, toast } from "./AdminActions";
import { GlobalSearch } from "./GlobalSearch";
import { useAdminPermissions } from "@/lib/admin-permissions";
import { fetchAdminBugBountyStats } from "@/lib/bug-bounty-api";

type Item = { to: string; label: string; icon: typeof Users; badge?: string; exact?: boolean };
type Group = { id: string; label: string; items: Item[] };

const SIDEBAR_PREF_KEY = "rb.superadmin.sidebar.collapsed";
const SIDEBAR_GROUPS_PREF_KEY = "rb.superadmin.sidebar.open-groups";

const groups: Group[] = [
  {
    id: "command-center",
    label: "Command Center",
    items: [
      { to: "/superadmin", label: "Mission Control", icon: LayoutDashboard, exact: true },
      { to: "/superadmin/analytics", label: "Platform Analytics", icon: BarChart3 },
      { to: "/superadmin/search-analytics", label: "Search Analytics", icon: Search },
      { to: "/superadmin/daily-tasks", label: "Daily Tasks", icon: ListTodo },
    ],
  },
  {
    id: "users-support",
    label: "Users & Support",
    items: [
      { to: "/superadmin/users", label: "User Management", icon: Users },
      { to: "/superadmin/inbox", label: "Inbox", icon: Inbox },
      { to: "/superadmin/complaints", label: "Complaints", icon: FileWarning },
      { to: "/superadmin/reviews", label: "Reviews", icon: Star },
      { to: "/superadmin/disputes", label: "Disputes", icon: Scale },
    ],
  },
  {
    id: "brands-trust",
    label: "Brands & Trust",
    items: [
      { to: "/superadmin/brands", label: "Brand Management", icon: Building2 },
      { to: "/superadmin/brand-requests", label: "Brand Applications", icon: Mail },
      { to: "/superadmin/tbi", label: "TBI Management", icon: Shield },
      { to: "/superadmin/payouts", label: "Payout Verification", icon: Wallet },
      { to: "/superadmin/demo-accounts", label: "Demo Accounts", icon: Monitor },
      { to: "/superadmin/merit-awards", label: "Merit Awards", icon: Award },
      { to: "/superadmin/top-sellers", label: "Top Sellers", icon: Trophy },
    ],
  },
  {
    id: "financial-operations",
    label: "Financial Operations",
    items: [
      { to: "/superadmin/wallets", label: "User Wallets", icon: Wallet },
      { to: "/superadmin/withdrawals", label: "Withdrawals", icon: ArrowDownToLine },
      { to: "/superadmin/transactions", label: "Transactions", icon: Activity },
      { to: "/superadmin/claims", label: "Cashback Claims", icon: ClipboardCheck },
      { to: "/superadmin/cashback", label: "Cashback Engine", icon: CircleDollarSign },
      { to: "/superadmin/wallet", label: "RR Ledger", icon: Coins },
      { to: "/superadmin/rr", label: "Rebate Rewards", icon: Coins },
      { to: "/superadmin/rr-purchases", label: "RR Purchases", icon: CircleDollarSign },
    ],
  },
  {
    id: "trading-intelligence",
    label: "Trading Intelligence",
    items: [
      { to: "/superadmin/journal-analytics", label: "Journal Analytics", icon: BookOpen },
      { to: "/superadmin/trt", label: "ROI Tracker", icon: BarChart3 },
      { to: "/superadmin/backtest", label: "AI Backtest Lab", icon: FlaskConical },
      { to: "/superadmin/challenge-purchases", label: "Challenge Purchases", icon: ClipboardCheck },
      { to: "/superadmin/cashback-calculator", label: "Cashback Calculator", icon: Calculator },
    ],
  },
  {
    id: "content-marketing",
    label: "Content & Marketing",
    items: [
      { to: "/superadmin/blog", label: "Blog & News", icon: Newspaper },
      { to: "/superadmin/news", label: "Company News", icon: Radio },
      { to: "/superadmin/homepage-videos", label: "Homepage Videos", icon: Youtube },
      { to: "/superadmin/faqs", label: "FAQs", icon: HelpCircle },
      { to: "/superadmin/reviews?view=testimonials", label: "Landing Testimonials", icon: Star },
      { to: "/superadmin/offers", label: "Offers & Discounts", icon: Megaphone },
      { to: "/superadmin/popups", label: "Pop-ups", icon: MousePointerClick },
      { to: "/superadmin/announcements", label: "Announcements", icon: Megaphone },
      { to: "/superadmin/ads", label: "Dashboard Ads", icon: Megaphone },
      { to: "/superadmin/leaderboards", label: "Leaderboards", icon: Trophy },
      { to: "/superadmin/academy", label: "Academy", icon: GraduationCap },
      { to: "/superadmin/subscribers", label: "Subscribers", icon: Mail },
    ],
  },
  {
    id: "partners-growth",
    label: "Partners & Growth",
    items: [
      { to: "/superadmin/affiliates", label: "Affiliates / IB", icon: Handshake },
      { to: "/superadmin/partner-requests", label: "Partner Requests", icon: Mail },
    ],
  },
  {
    id: "communications",
    label: "Communications",
    items: [
      { to: "/superadmin/notifications", label: "Notifications", icon: Bell },
    ],
  },
  {
    id: "platform-system",
    label: "Platform & System",
    items: [
      { to: "/superadmin/roles", label: "Roles & Permissions", icon: ShieldCheck },
      { to: "/superadmin/audit", label: "Audit Log", icon: Activity },
      { to: "/superadmin/flags", label: "Feature Flags", icon: Flag },
      { to: "/superadmin/api-keys", label: "API Keys", icon: KeyRound },
      { to: "/superadmin/Bug-bounty", label: "Bug Bounty", icon: Bug },
      { to: "/superadmin/settings", label: "Settings", icon: Settings },
    ],
  },
];

const DEFAULT_OPEN_GROUPS: Record<string, boolean> = {
  "command-center": true,
};

function isActiveRoute(pathname: string, item: Item) {
  const itemPath = item.to.split("?")[0];
  return item.exact
    ? pathname === itemPath
    : pathname === itemPath || pathname.startsWith(itemPath + "/");
}

function loadOpenGroups() {
  if (typeof window === "undefined") return DEFAULT_OPEN_GROUPS;
  try {
    const raw = window.localStorage.getItem(SIDEBAR_GROUPS_PREF_KEY);
    return raw ? { ...DEFAULT_OPEN_GROUPS, ...JSON.parse(raw) } : DEFAULT_OPEN_GROUPS;
  } catch {
    return DEFAULT_OPEN_GROUPS;
  }
}

export function SuperadminLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { canRoute, roles, activeRoleId, setActiveRoleId, activeRole } = useAdminPermissions();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(SIDEBAR_PREF_KEY) === "true";
  });
  const [searchOpen, setSearchOpen] = useState(false);
  const [bugBountyOpenCount, setBugBountyOpenCount] = useState<string>("");
  const sidebarWidth = sidebarCollapsed ? "5rem" : "16rem";
  const [open, setOpen] = useState<Record<string, boolean>>(loadOpenGroups);
  const toggle = (id: string) => setOpen((s) => ({ ...s, [id]: !s[id] }));

  // Filter every group's items by current role permissions. Hides empty groups.
  const permittedGroups = useMemo(
    () => groups
      .map((g) => ({ ...g, items: g.items.filter((it) => canRoute(it.to)) }))
      .filter((g) => g.items.length > 0),
    [canRoute],
  );

  const activeGroupIds = useMemo(
    () => permittedGroups
      .filter((group) => group.items.some((item) => isActiveRoute(pathname, item)))
      .map((group) => group.id),
    [pathname, permittedGroups],
  );

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
    try {
      window.localStorage.setItem(SIDEBAR_PREF_KEY, String(sidebarCollapsed));
    } catch {
      /* ignore */
    }
  }, [sidebarCollapsed]);

  useEffect(() => {
    try {
      window.localStorage.setItem(SIDEBAR_GROUPS_PREF_KEY, JSON.stringify(open));
    } catch {
      /* ignore */
    }
  }, [open]);

  useEffect(() => {
    if (!activeGroupIds.length) return;
    setOpen((state) => {
      let changed = false;
      const next = { ...state };
      activeGroupIds.forEach((id) => {
        if (!next[id]) {
          next[id] = true;
          changed = true;
        }
      });
      return changed ? next : state;
    });
  }, [activeGroupIds]);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      document
        .querySelector("[data-admin-nav-active='true']")
        ?.scrollIntoView({ block: "nearest" });
    }, 80);
    return () => window.clearTimeout(handle);
  }, [pathname, permittedGroups.length]);

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
    <div
      className="relative min-h-screen"
      style={{ "--dashboard-sidebar-width": sidebarWidth } as CSSProperties}
    >
      <div className="glow-orb left-[-10%] top-[-10%] h-[500px] w-[500px]" />
      <div className="glow-orb right-[-10%] bottom-[-10%] h-[600px] w-[600px]" />

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[min(18rem,calc(100vw-2rem))] transform flex-col border-r border-white/5 bg-[rgba(18,18,25,0.90)] backdrop-blur-xl transition-[width,transform] duration-200 ease-out lg:w-[var(--dashboard-sidebar-width)] lg:translate-x-0 ${
          mobileOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        }`}
        aria-label="Superadmin navigation"
      >
        <div className={`flex h-16 items-center justify-between border-b border-white/5 px-4 ${sidebarCollapsed ? "lg:px-3" : ""}`}>
          <Link to="/" className={`flex min-w-0 items-center gap-2 ${sidebarCollapsed ? "lg:justify-center" : ""}`}>
            <Logo heightClass="h-9" iconOnly={sidebarCollapsed} />
          </Link>
          <button
            onClick={() => setSidebarCollapsed((value) => !value)}
            className="hidden h-9 w-9 place-items-center rounded-xl text-violet-100 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 lg:grid"
            aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-expanded={!sidebarCollapsed}
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

        <nav className={`admin-sidebar-scroll min-h-0 flex-1 overflow-y-auto px-2 py-3 ${sidebarCollapsed ? "lg:px-2" : ""}`}>
          {permittedGroups.map((g) => {
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
                      const active = isActiveRoute(pathname, item);
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.to}
                          to={item.to as string}
                          onClick={() => setMobileOpen(false)}
                          aria-current={active ? "page" : undefined}
                          data-admin-nav-active={active ? "true" : undefined}
                          title={sidebarCollapsed ? item.label : undefined}
                          className={`group relative flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-medium outline-none transition-all focus-visible:ring-2 focus-visible:ring-ring/60 ${
                            active
                              ? "bg-white/10 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]"
                              : "text-muted-foreground hover:bg-white/5 hover:text-white"
                          } ${sidebarCollapsed ? "lg:justify-center lg:gap-0 lg:px-0" : ""}`}
                        >
                          {active && <span className="absolute inset-y-1.5 left-0 w-0.5 rounded-full bg-gradient-to-b from-violet-400 to-violet-500" aria-hidden />}
                          <Icon className={`h-4 w-4 shrink-0 transition-colors ${active ? "text-violet-400" : "group-hover:text-white/90"}`} />
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

      <div className="transition-[padding] duration-200 ease-out lg:pl-[var(--dashboard-sidebar-width)]">
        <header className="sticky top-0 z-30 border-b border-white/5 bg-[rgba(18,18,25,0.75)] backdrop-blur-xl">
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
              <span className="flex-1 truncate text-sm text-muted-foreground">Search admin pages, users, brands, payouts…</span>
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
                <LogOut className="h-3.5 w-3.5 text-violet-400" /> Exit admin
              </Link>
              <label className="hidden items-center gap-1.5 md:inline-flex" title="Preview the dashboard as this role">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Acting as</span>
                <select
                  value={activeRoleId}
                  onChange={(e) => { setActiveRoleId(e.target.value); toast.success(`Now acting as ${roles.find((r) => r.id === e.target.value)?.name}`); }}
                  className="rounded-full border border-white/10 bg-white/10 px-2 py-1 text-[11px] font-semibold text-white focus:outline-none focus:ring-2 focus:ring-violet-400/40"
                >
                  {roles.filter((r) => r.status === "active").map((r) => (
                    <option key={r.id} value={r.id} className="bg-[var(--rb-bg-elevated)]">{r.name}</option>
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
                className="grid h-9 w-9 place-items-center rounded-full rb-gradient-primary text-xs font-bold text-white shadow-[0_0_14px_rgba(192,132,252,0.35)]"
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
