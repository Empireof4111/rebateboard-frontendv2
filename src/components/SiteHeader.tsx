import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Search, ChevronDown, LayoutDashboard, LogOut, User as UserIcon, Sparkles } from "lucide-react";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/lib/auth";
import { GlobalSearchModal } from "@/components/GlobalSearchModal";

function truncateName(name: string, maxWords = 2): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length <= maxWords) return name;
  return parts.slice(0, maxWords).join(" ") + "…";
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function UserPill() {
  const { user, logout } = useAuth();
  if (!user) return null;
  const display = truncateName(user.fullName || user.name);
  const initials = initialsOf(user.fullName || user.name);
  const dashboardHref = `/login?reauth=1&email=${encodeURIComponent(user.email)}&redirect=/dashboard`;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="group flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] py-1 pl-1 pr-3 text-left transition hover:border-white/20 hover:bg-white/[0.08] outline-none">
        <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-fuchsia-500 via-violet-500 to-indigo-600 text-[10px] font-bold text-white shadow-[0_0_18px_rgba(192,132,252,0.45)]">
          {initials}
        </span>
        <span className="hidden flex-col leading-tight sm:flex">
          <span className="text-[9px] uppercase tracking-wider text-muted-foreground">Hi, welcome back</span>
          <span className="text-xs font-semibold text-white">{display}</span>
        </span>
        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground transition group-hover:text-white" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="glass-strong w-56 border-2 border-white/40 backdrop-blur-3xl text-foreground shadow-2xl">
        <DropdownMenuLabel className="flex flex-col gap-0.5 py-2">
          <span className="text-[10px] font-normal uppercase tracking-wider text-muted-foreground">Signed in as</span>
          <span className="truncate text-xs font-semibold text-white">{user.email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-white/10" />
        <DropdownMenuItem asChild className="cursor-pointer text-xs text-foreground/95 focus:bg-white/15 focus:text-white">
          <Link to={dashboardHref}>
            <LayoutDashboard className="mr-2 h-3.5 w-3.5 text-accent" /> Go to Dashboard
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="cursor-pointer text-xs text-foreground/95 focus:bg-white/15 focus:text-white">
          <Link to="/dashboard/profile">
            <UserIcon className="mr-2 h-3.5 w-3.5" /> Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-white/10" />
        <DropdownMenuItem
          onClick={() => logout()}
          className="cursor-pointer text-xs text-rose-300 focus:bg-rose-500/15 focus:text-rose-200"
        >
          <LogOut className="mr-2 h-3.5 w-3.5" /> Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function GuestActions() {
  return (
    <>
      <Link to="/login" className="glass-pill flex items-center gap-1 rounded-full px-3 py-1.5 text-xs text-white">
        <span className="h-2 w-2 rounded-full bg-success" /> Login
      </Link>
      <Link to="/signup" className="rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-600 px-4 py-1.5 text-xs font-semibold text-white shadow-[0_0_20px_rgba(192,132,252,0.5)]">
        Sign Up
      </Link>
    </>
  );
}

const navItems: { label: string; items: { label: string; to?: string }[] }[] = [
  { label: "Prop Firms", items: [{ label: "All Prop Firms", to: "/programs" }, { label: "Top Rated", to: "/programs" }, { label: "New Listings", to: "/programs" }, { label: "Featured Promos", to: "/programs" }] },
  { label: "Brokers", items: [{ label: "All Brokers", to: "/brokers" }, { label: "Top Rated", to: "/brokers" }, { label: "New Listings", to: "/brokers" }, { label: "Regulated Only", to: "/brokers" }] },
  { label: "Crypto Exchanges", items: [{ label: "All Exchanges", to: "/exchanges" }, { label: "Top Rated", to: "/exchanges" }, { label: "Lowest Fees", to: "/exchanges" }, { label: "Regulated Only", to: "/exchanges" }] },
  { label: "Payouts", items: [{ label: "Payout Tracker", to: "/payouts" }, { label: "Live Feed", to: "/payouts" }, { label: "Top Payers", to: "/payouts" }, { label: "Submit Payout", to: "/payouts" }] },
  { label: "TBI", items: [{ label: "Top 10 Trusted", to: "/tbi" }, { label: "Explore All Brands", to: "/tbi/explore" }, { label: "How TBI Works", to: "/tbi" }, { label: "Submit Review", to: "/tbi/explore" }] },
  { label: "Rebates", items: [{ label: "Forex Rebates" }, { label: "Crypto Rebates" }, { label: "Stocks Rebates" }, { label: "Calculator" }] },
  { label: "Comparisons", items: [{ label: "Broker vs Broker", to: "/compare" }, { label: "Fees Compare" }, { label: "Spreads Compare" }, { label: "Leverage" }] },
  { label: "Tools", items: [{ label: "Economic Calendar", to: "/economic-calendar" }, { label: "Pip Calculator" }, { label: "Margin Calculator" }, { label: "Profit Calculator" }, { label: "Converter" }] },
  { label: "About Us", items: [{ label: "Our Story" }, { label: "Team" }, { label: "Careers" }, { label: "Press" }] },
  { label: "Blogs", items: [{ label: "Latest Posts", to: "/blog" }, { label: "Trading Tips", to: "/blog" }, { label: "Guides", to: "/blog" }, { label: "Tutorials", to: "/blog" }] },
];

export function SiteHeader() {
  const { user } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
      } else if (e.key === "/" && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="sticky top-0 z-40 backdrop-blur-xl bg-[#150829]/80 border-b border-white/5">
      <span className="hidden" aria-hidden>{user ? "auth" : "guest"}</span>
      <div className="mx-auto max-w-7xl px-3 sm:px-4 py-3">
        <nav className="glass flex items-center justify-between rounded-2xl px-3 sm:px-4 py-2.5 sm:py-3 gap-2">
          <Link to="/" className="flex items-center gap-2 shrink-0" aria-label="RebateBoard home">
            <Logo heightClass="h-8 sm:h-9" />
            <span className="sr-only">RebateBoard — every trade pays</span>
            <span className="hidden text-[10px] text-muted-foreground sm:inline">every trade pays</span>
          </Link>

          <div className="hidden flex-1 max-w-md mx-6 lg:block">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="glass flex w-full items-center gap-2 rounded-full px-4 py-2 text-left transition hover:border-fuchsia-400/30"
            >
              <Search className="h-4 w-4 text-muted-foreground" />
              <span className="flex-1 text-sm text-muted-foreground">Find a broker, coin, or program</span>
              <kbd className="hidden rounded bg-white/10 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground sm:inline">⌘K</kbd>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              aria-label="Open search"
              className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-white transition hover:border-fuchsia-400/30 hover:bg-white/[0.08] lg:hidden"
            >
              <Search className="h-4 w-4" />
            </button>
            {user ? <UserPill /> : <GuestActions />}
          </div>
        </nav>

        {/* Secondary nav: horizontal scroll on mobile, wrap on desktop */}
        <div className="mt-3 -mx-3 sm:-mx-4 lg:mx-0 overflow-x-auto no-scrollbar lg:overflow-visible">
          <div className="flex items-center gap-2 px-3 sm:px-4 lg:px-0 lg:flex-wrap">
            {navItems.map((item) => (
              <DropdownMenu key={item.label}>
                <DropdownMenuTrigger className="glass-pill shrink-0 flex items-center gap-1 rounded-full px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  {item.label} <ChevronDown className="h-3 w-3" />
                </DropdownMenuTrigger>
                <DropdownMenuContent className="glass-strong border-2 border-white/40 text-xs backdrop-blur-3xl text-foreground shadow-2xl">
                  {item.items.map((sub) => (
                    <DropdownMenuItem
                      key={sub.label}
                      asChild={!!sub.to}
                      className="text-xs cursor-pointer text-foreground/95 focus:bg-white/15 focus:text-white"
                    >
                      {sub.to ? <Link to={sub.to}>{sub.label}</Link> : <span>{sub.label}</span>}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            ))}
          </div>
        </div>
      </div>
      <GlobalSearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}
