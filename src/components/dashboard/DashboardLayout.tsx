import { Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, Brain, LineChart, Calendar, BarChart3, Bot, ShieldAlert,
  Wallet, Trophy, Star, Gift, Users, GraduationCap, User as UserIcon,
  Settings, Search, Bell, Plus, LogOut, Menu, X, Sparkles, Calculator,
  ChevronDown, Newspaper, Megaphone, FileWarning, Layers, ClipboardCheck, FlaskConical, Globe2, Share2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth";
import { Logo } from "@/components/Logo";
import { AddTradeModal } from "@/components/dashboard/AddTradeModal";
import { DashboardAdBanner } from "@/components/dashboard/DashboardAdBanner";
import { openAddTrade, onAddTradeOpen } from "@/lib/ui-bus";

type NavItem = { to: string; label: string; icon: typeof LayoutDashboard; exact?: boolean; badge?: string };
type NavGroup = { id: string; label: string; items: NavItem[] };

const groups: NavGroup[] = [
  {
    id: "primary",
    label: "Primary",
    items: [
      { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, exact: true },
      { to: "/dashboard/wallet", label: "Wallet", icon: Wallet, badge: "NEW" },
      { to: "/dashboard/claims", label: "My Claims", icon: ClipboardCheck },
      { to: "/dashboard/rewards", label: "Rewards", icon: Gift },
      { to: "/dashboard/intelligence", label: "Intelligence", icon: Brain },
    ],
  },
  {
    id: "trading",
    label: "Trading",
    items: [
      { to: "/dashboard/trading-plan", label: "Trading Plan", icon: ClipboardCheck, badge: "NEW" },
      { to: "/dashboard/backtest", label: "AI Backtest Lab", icon: FlaskConical, badge: "NEW" },
      { to: "/dashboard/trades", label: "Journal", icon: LineChart },
      { to: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
      { to: "/dashboard/calendar", label: "PnL Calendar", icon: Calendar },
      { to: "/dashboard/economic-calendar", label: "Economic Calendar", icon: Globe2, badge: "NEW" },
      { to: "/dashboard/accounts", label: "ROI Tracker", icon: Wallet, badge: "TRT" },
      { to: "/dashboard/risk", label: "Risk Guardrails", icon: ShieldAlert },
      { to: "/dashboard/ai-coach", label: "Rebeta", icon: Bot },
      { to: "/dashboard/tools", label: "Tools", icon: Calculator },
      { to: "/dashboard/brands", label: "Programs", icon: Layers },
    ],
  },
  {
    id: "social",
    label: "Social",
    items: [
      { to: "/dashboard/reviews", label: "Reviews", icon: Star },
      { to: "/dashboard/referrals", label: "Referrals", icon: Share2, badge: "NEW" },
      { to: "/dashboard/community", label: "Community", icon: Users },
      { to: "/dashboard/leaderboards", label: "Leaderboards", icon: Trophy },
      { to: "/dashboard/tbi", label: "TBI Rankings", icon: Trophy },
    ],
  },
  {
    id: "content",
    label: "Content",
    items: [
      { to: "/dashboard/academy", label: "Academy", icon: GraduationCap },
      { to: "/dashboard/community", label: "Blog & News", icon: Newspaper },
      { to: "/dashboard/offers", label: "Offers", icon: Megaphone },
    ],
  },
  {
    id: "system",
    label: "System",
    items: [
      { to: "/dashboard/risk", label: "Reports", icon: FileWarning },
      { to: "/dashboard/profile", label: "Profile", icon: UserIcon },
      { to: "/dashboard/settings", label: "Settings", icon: Settings },
    ],
  },
];

export function DashboardLayout() {
  const { user, logout, loading } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [mobileOpen, setMobileOpen] = useState(false);

  const initialOpen = useMemo(() => {
    const open: Record<string, boolean> = {};
    for (const g of groups) {
      open[g.id] = g.items.some((i) => (i.exact ? pathname === i.to : pathname.startsWith(i.to)));
    }
    // primary always open by default
    open.primary = true;
    return open;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(initialOpen);
  const [tradeOpen, setTradeOpen] = useState(false);
  const toggle = (id: string) => setOpenGroups((s) => ({ ...s, [id]: !s[id] }));

  useEffect(() => { const off = onAddTradeOpen(() => setTradeOpen(true)); return () => { off(); }; }, []);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [user, loading, navigate]);

  if (loading || !user) {
    return (
      <div className="grid min-h-screen place-items-center text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      <div className="glow-orb left-[-10%] top-[-10%] h-[500px] w-[500px]" />

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 transform border-r border-white/5 bg-[#150829]/90 backdrop-blur-xl transition-transform duration-200 ease-out lg:translate-x-0 ${mobileOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"}`}
        aria-label="Dashboard navigation"
      >
        <div className="flex h-16 items-center justify-between border-b border-white/5 px-4">
          <Link to="/" className="flex items-center gap-2" aria-label="RebateBoard home">
            <Logo heightClass="h-9" />
            <span className="hidden text-[10px] text-muted-foreground sm:inline">trader OS</span>
          </Link>
          <button
            onClick={() => setMobileOpen(false)}
            className="grid h-9 w-9 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-white/5 hover:text-white lg:hidden"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex flex-col gap-1 overflow-y-auto px-2 py-3" style={{ maxHeight: "calc(100vh - 4rem)" }}>
          {groups.map((g) => {
            const isOpen = openGroups[g.id] ?? false;
            return (
              <div key={g.id} className="mb-1">
                <button
                  onClick={() => toggle(g.id)}
                  className="flex w-full items-center justify-between rounded-lg px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
                  aria-expanded={isOpen}
                >
                  <span>{g.label}</span>
                  <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
                </button>
                {isOpen && (
                  <div className="mt-0.5 flex flex-col gap-0.5">
                    {g.items.map((item) => {
                      const active = item.exact ? pathname === item.to : pathname === item.to || pathname.startsWith(item.to + "/");
                      const Icon = item.icon;
                      return (
                        <Link
                          key={`${g.id}-${item.to}-${item.label}`}
                          to={item.to as string}
                          onClick={() => setMobileOpen(false)}
                          aria-current={active ? "page" : undefined}
                          className={`group relative flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-medium outline-none transition-all focus-visible:ring-2 focus-visible:ring-ring/60 ${
                            active
                              ? "bg-white/10 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]"
                              : "text-muted-foreground hover:bg-white/5 hover:text-white"
                          }`}
                        >
                          {active && <span className="absolute inset-y-1.5 left-0 w-0.5 rounded-full bg-gradient-to-b from-fuchsia-400 to-violet-500" aria-hidden />}
                          <Icon className={`h-4 w-4 shrink-0 transition-colors ${active ? "text-accent" : "group-hover:text-white/90"}`} />
                          <span className="flex-1 truncate">{item.label}</span>
                          {item.badge && (
                            <span className="rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-600 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-white">
                              {item.badge}
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

          <button
            onClick={() => { logout(); navigate({ to: "/" }); }}
            className="mt-2 flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-medium text-muted-foreground transition hover:bg-destructive/15 hover:text-destructive"
          >
            <LogOut className="h-4 w-4" />
            <span>Log out</span>
          </button>
        </nav>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 border-b border-white/5 bg-[#150829]/75 backdrop-blur-xl">
          <div className="flex h-14 items-center gap-2 px-3 sm:h-16 sm:gap-3 sm:px-4 md:px-6">
            <button
              onClick={() => setMobileOpen(true)}
              className="grid h-9 w-9 place-items-center rounded-lg text-white transition-colors hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 lg:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="glass hidden flex-1 items-center gap-2 rounded-full px-4 py-2 md:flex md:max-w-md">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                placeholder="Search trades, brands, insights…"
                className="w-full bg-transparent text-sm text-white outline-none placeholder:text-muted-foreground"
                aria-label="Search"
              />
            </div>
            <button className="grid h-9 w-9 place-items-center rounded-full text-white transition-colors hover:bg-white/5 md:hidden" aria-label="Search">
              <Search className="h-4 w-4" />
            </button>
            <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
              <Link to={"/dashboard/wallet" as string} className="hidden items-center gap-1.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 px-3 py-1.5 text-xs font-semibold text-white shadow-[0_0_20px_rgba(16,185,129,0.45)] transition-transform hover:scale-[1.02] active:scale-[0.98] sm:inline-flex">
                <Wallet className="h-3.5 w-3.5" /> Wallet
              </Link>
              <button onClick={openAddTrade} className="hidden items-center gap-1.5 rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-600 px-3 py-1.5 text-xs font-semibold text-white shadow-[0_0_20px_rgba(192,132,252,0.45)] transition-transform hover:scale-[1.02] active:scale-[0.98] sm:inline-flex">
                <Plus className="h-3.5 w-3.5" /> Add Trade
              </button>
              <button onClick={openAddTrade} className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-600 text-white shadow-[0_0_18px_rgba(192,132,252,0.45)] sm:hidden" aria-label="Add trade">
                <Plus className="h-4 w-4" />
              </button>
              <Link to={"/dashboard/ai-coach" as string} className="glass-pill hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-white sm:inline-flex">
                <Sparkles className="h-3.5 w-3.5 text-accent" /> Ask Rebeta
              </Link>
              <button className="glass-pill grid h-9 w-9 place-items-center rounded-full text-white transition-colors hover:bg-white/10" aria-label="Notifications">
                <Bell className="h-4 w-4" />
              </button>
              <Link to={"/dashboard/rewards" as string} className="glass-pill inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-[11px] font-semibold text-white sm:gap-1.5 sm:px-3 sm:text-xs">
                <Gift className="h-3.5 w-3.5 text-accent" />
                <span className="tabular-nums">{user.rrBalance.toFixed(0)}</span>
                <span className="hidden sm:inline">RR</span>
              </Link>
              <Link to={"/dashboard/profile" as string} className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-violet-400 to-fuchsia-600 text-xs font-bold text-white shadow-[0_0_14px_rgba(192,132,252,0.35)] transition-transform hover:scale-[1.04]" aria-label="Profile">
                {user.name.slice(0, 2).toUpperCase()}
              </Link>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1400px] p-3 sm:p-4 md:p-6 lg:p-8">
          <DashboardAdBanner pathname={pathname} />
          <Outlet />
        </main>
      </div>

      <AddTradeModal open={tradeOpen} onClose={() => setTradeOpen(false)} />
    </div>
  );
}
