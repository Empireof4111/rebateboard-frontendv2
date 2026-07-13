import { Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, MessageSquare, ShieldAlert, Wallet, Trophy, Megaphone,
  BarChart3, Users, Settings, LogOut, Menu, X, ExternalLink, Bell, ChevronDown,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useBrandAuth } from "@/lib/brand-auth";
import { Logo } from "@/components/Logo";
import { TBI_BRANDS } from "@/lib/tbi-data";

type NavItem = { to: string; label: string; icon: typeof LayoutDashboard; badge?: string };
type NavGroup = { id: string; label: string; items: NavItem[] };

const groups: NavGroup[] = [
  {
    id: "primary", label: "Primary", items: [
      { to: "/brand", label: "Overview", icon: LayoutDashboard },
      { to: "/brand/analytics", label: "Analytics", icon: BarChart3 },
    ],
  },
  {
    id: "engagement", label: "Engagement", items: [
      { to: "/brand/reviews", label: "Reviews", icon: MessageSquare, badge: "INBOX" },
      { to: "/brand/complaints", label: "Complaints", icon: ShieldAlert },
      { to: "/brand/announcements", label: "Announcements", icon: Megaphone },
    ],
  },
  {
    id: "products", label: "Products", items: [
      { to: "/brand/payouts", label: "Payouts", icon: Wallet },
      { to: "/brand/challenges", label: "Challenges", icon: Trophy },
    ],
  },
  {
    id: "system", label: "System", items: [
      { to: "/brand/team", label: "Team", icon: Users },
      { to: "/brand/settings", label: "Settings", icon: Settings },
    ],
  },
];

export function BrandDashboardLayout() {
  const { session, brand, signIn, signOut, loading } = useBrandAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [switcherOpen, setSwitcherOpen] = useState(false);

  const initialOpen = useMemo(() => {
    const o: Record<string, boolean> = {};
    for (const g of groups) o[g.id] = true;
    return o;
  }, []);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(initialOpen);
  const toggle = (id: string) => setOpenGroups((s) => ({ ...s, [id]: !s[id] }));

  useEffect(() => {
    if (!loading && !session) {
      // auto sign-in to first brand for demo
      signIn(TBI_BRANDS[0].slug);
    }
  }, [loading, session, signIn]);

  if (loading || !session || !brand) {
    return (
      <div className="grid min-h-screen place-items-center text-sm text-muted-foreground">
        Loading brand dashboard…
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      <div className="glow-orb left-[-10%] top-[-10%] h-[500px] w-[500px]" />

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 transform border-r border-white/5 bg-[rgba(18,18,25,0.90)] backdrop-blur-xl transition-transform duration-200 ease-out lg:translate-x-0 ${mobileOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"}`}
      >
        <div className="flex h-16 items-center justify-between border-b border-white/5 px-4">
          <Link to="/" className="flex items-center gap-2">
            <Logo heightClass="h-8" />
            <span className="hidden text-[10px] text-muted-foreground sm:inline">brand portal</span>
          </Link>
          <button onClick={() => setMobileOpen(false)} className="grid h-9 w-9 place-items-center rounded-lg text-muted-foreground hover:bg-white/5 hover:text-white lg:hidden" aria-label="Close menu">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Brand identity card */}
        <div className="mx-3 mt-3 rounded-2xl bg-gradient-to-br from-violet-500/15 to-violet-600/10 p-3 ring-1 ring-white/10">
          <div className="flex items-center gap-3">
            <div className={`grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br ${brand.logoColor} text-xs font-bold text-white`}>
              {brand.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-bold text-white">{brand.name}</div>
              <div className="text-[10px] uppercase tracking-wider text-violet-300/80">TBI {brand.score.toFixed(1)} · {brand.status}</div>
            </div>
          </div>
        </div>

        <nav className="flex flex-col gap-1 overflow-y-auto px-2 py-3" style={{ maxHeight: "calc(100vh - 8rem)" }}>
          {groups.map((g) => {
            const isOpen = openGroups[g.id] ?? true;
            return (
              <div key={g.id} className="mb-1">
                <button onClick={() => toggle(g.id)} className="flex w-full items-center justify-between rounded-lg px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground hover:text-white">
                  <span>{g.label}</span>
                  <ChevronDown className={`h-3 w-3 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                </button>
                {isOpen && (
                  <div className="mt-0.5 flex flex-col gap-0.5">
                    {g.items.map((item) => {
                      const active = item.to === "/brand" ? pathname === "/brand" : pathname === item.to || pathname.startsWith(item.to + "/");
                      const Icon = item.icon;
                      return (
                        <Link key={item.to} to={item.to} onClick={() => setMobileOpen(false)} className={`group relative flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-medium transition-all ${active ? "bg-white/10 text-white" : "text-muted-foreground hover:bg-white/5 hover:text-white"}`}>
                          {active && <span className="absolute inset-y-1.5 left-0 w-0.5 rounded-full bg-gradient-to-b from-violet-400 to-violet-500" />}
                          <Icon className="h-4 w-4 shrink-0" />
                          <span className="flex-1 truncate">{item.label}</span>
                          {item.badge && <span className="rounded-full rb-gradient-primary px-1.5 py-0.5 text-[8px] font-bold uppercase text-white">{item.badge}</span>}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          <button onClick={() => { signOut(); navigate({ to: "/" }); }} className="mt-2 flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-destructive/15 hover:text-destructive">
            <LogOut className="h-4 w-4" />
            <span>Sign out of brand</span>
          </button>
        </nav>
      </aside>

      {mobileOpen && <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setMobileOpen(false)} />}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 border-b border-white/5 bg-[rgba(18,18,25,0.75)] backdrop-blur-xl">
          <div className="flex h-14 items-center gap-2 px-3 sm:h-16 sm:px-4 md:px-6">
            <button onClick={() => setMobileOpen(true)} className="grid h-9 w-9 place-items-center rounded-lg text-white hover:bg-white/5 lg:hidden" aria-label="Open menu">
              <Menu className="h-5 w-5" />
            </button>

            {/* Brand switcher */}
            <div className="relative">
              <button onClick={() => setSwitcherOpen((s) => !s)} className="glass-pill inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs text-white">
                Acting as <span className="font-bold">{brand.name}</span>
                <ChevronDown className={`h-3 w-3 transition ${switcherOpen ? "rotate-180" : ""}`} />
              </button>
              {switcherOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setSwitcherOpen(false)} />
                  <div className="absolute left-0 top-full z-40 mt-1 max-h-72 w-64 overflow-y-auto rounded-xl border border-white/15 bg-[rgba(18,18,25,0.95)] p-1 backdrop-blur">
                    {TBI_BRANDS.map((b) => (
                      <button key={b.slug} onClick={() => { signIn(b.slug); setSwitcherOpen(false); }} className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs transition ${b.slug === brand.slug ? "bg-violet-500/30 text-white" : "text-muted-foreground hover:bg-white/10 hover:text-white"}`}>
                        <span className={`grid h-6 w-6 place-items-center rounded-md bg-gradient-to-br ${b.logoColor} text-[9px] font-bold text-white`}>{b.name.slice(0, 2).toUpperCase()}</span>
                        <span className="flex-1 truncate">{b.name}</span>
                        <span className="text-[9px] text-muted-foreground">{b.score.toFixed(1)}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
              <Link to={"/tbi/brand/$slug" as string} params={{ slug: brand.slug }} className="glass-pill hidden items-center gap-1 rounded-full px-3 py-1.5 text-[11px] text-white sm:inline-flex">
                <ExternalLink className="h-3 w-3" /> Public profile
              </Link>
              <button className="glass-pill grid h-9 w-9 place-items-center rounded-full text-white" aria-label="Notifications">
                <Bell className="h-4 w-4" />
              </button>
              <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-violet-400 to-violet-600 text-xs font-bold text-white">
                {session.contactEmail.slice(0, 2).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1400px] p-3 sm:p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
