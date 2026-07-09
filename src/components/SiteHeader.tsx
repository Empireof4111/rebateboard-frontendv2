import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  AppWindow,
  BarChart3,
  Bitcoin,
  Building2,
  Calculator,
  CalendarDays,
  Check,
  ChevronDown,
  CircleHelp,
  ClipboardList,
  Copy,
  FlaskConical,
  Globe2,
  GraduationCap,
  Landmark,
  LayoutDashboard,
  LayoutGrid,
  LineChart,
  LogOut,
  MonitorUp,
  Network,
  NotebookTabs,
  RadioTower,
  Scale,
  Search,
  ShieldCheck,
  TrendingUp,
  User as UserIcon,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Logo } from "@/components/Logo";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/lib/auth";
import { GlobalSearchModal } from "@/components/GlobalSearchModal";
import { useI18n, type LanguageCode, type TranslationKey } from "@/lib/i18n";

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
  const { t } = useI18n();
  if (!user) return null;
  const display = truncateName(user.fullName || user.name);
  const initials = initialsOf(user.fullName || user.name);
  const dashboardHref = `/login?reauth=1&email=${encodeURIComponent(user.email)}&redirect=/dashboard`;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="group flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] py-1 pl-1 pr-3 text-left transition hover:border-white/20 hover:bg-white/[0.08] outline-none">
        <Avatar className="h-8 w-8 shrink-0 shadow-[0_0_18px_rgba(192,132,252,0.38)]">
          <AvatarImage
            src={user.dp || undefined}
            alt={`${user.fullName || user.name} profile`}
            className="object-cover"
          />
          <AvatarFallback className="bg-gradient-to-br from-fuchsia-500 via-violet-500 to-indigo-600 text-[10px] font-bold text-white">
            {initials}
          </AvatarFallback>
        </Avatar>
        <span className="hidden flex-col leading-tight sm:flex">
          <span className="text-[9px] uppercase tracking-wider text-muted-foreground">
            {t("header.welcome")}
          </span>
          <span className="text-xs font-semibold text-white">{display}</span>
        </span>
        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground transition group-hover:text-white" />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="glass-strong w-56 border-2 border-white/40 backdrop-blur-3xl text-foreground shadow-2xl"
      >
        <DropdownMenuLabel className="flex flex-col gap-0.5 py-2">
          <span className="text-[10px] font-normal uppercase tracking-wider text-muted-foreground">
            {t("common.signedInAs")}
          </span>
          <span className="truncate text-xs font-semibold text-white">{user.email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-white/10" />
        <DropdownMenuItem
          asChild
          className="cursor-pointer text-xs text-foreground/95 focus:bg-white/15 focus:text-white"
        >
          <Link to={dashboardHref}>
            <LayoutDashboard className="mr-2 h-3.5 w-3.5 text-accent" /> {t("common.dashboard")}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem
          asChild
          className="cursor-pointer text-xs text-foreground/95 focus:bg-white/15 focus:text-white"
        >
          <Link to="/dashboard/profile">
            <UserIcon className="mr-2 h-3.5 w-3.5" /> {t("common.profile")}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-white/10" />
        <DropdownMenuItem
          onClick={() => logout()}
          className="cursor-pointer text-xs text-rose-300 focus:bg-rose-500/15 focus:text-rose-200"
        >
          <LogOut className="mr-2 h-3.5 w-3.5" /> {t("common.logout")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function GuestActions() {
  const { t } = useI18n();

  return (
    <>
      <Link
        to="/login"
        className="glass-pill hidden items-center gap-1 rounded-full px-3 py-1.5 text-xs text-white sm:flex"
      >
        <span className="h-2 w-2 rounded-full bg-success" /> {t("common.login")}
      </Link>
      <Link
        to="/signup"
        className="hidden rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-600 px-4 py-1.5 text-xs font-semibold text-white shadow-[0_0_20px_rgba(192,132,252,0.5)] sm:inline-flex"
      >
        {t("common.signUp")}
      </Link>
    </>
  );
}

type HeaderNavItem = {
  labelKey: TranslationKey;
  to?: string;
  items?: {
    labelKey: TranslationKey;
    to?: string;
    description: string;
    icon: LucideIcon;
  }[];
};

const navItems: HeaderNavItem[] = [
  {
    labelKey: "nav.propFirms",
    to: "/programs",
    items: [
      {
        labelKey: "nav.forexPropFirms",
        to: "/programs",
        description: "Compare funded forex programs and account rules",
        icon: TrendingUp,
      },
      {
        labelKey: "nav.futuresPropFirms",
        to: "/futures-prop-firms",
        description: "Explore futures evaluations and funded accounts",
        icon: LineChart,
      },
      {
        labelKey: "nav.cryptoPropFirms",
        to: "/crypto-prop-firms",
        description: "Find funding programs built for crypto traders",
        icon: Bitcoin,
      },
      {
        labelKey: "nav.dexPropFirms",
        to: "/dex-prop-firms",
        description: "Discover decentralized trading opportunities",
        icon: Network,
      },
      {
        labelKey: "nav.stockPropFirms",
        to: "/stock-prop-firms",
        description: "Compare funded stock and equities programs",
        icon: BarChart3,
      },
    ],
  },
  { labelKey: "nav.brokers", to: "/brokers" },
  { labelKey: "nav.cryptoExchanges", to: "/exchanges" },
  {
    labelKey: "nav.products",
    items: [
      {
        labelKey: "nav.propFirms",
        to: "/programs",
        description: "Compare funded trading programs and rules",
        icon: TrendingUp,
      },
      {
        labelKey: "nav.brokers",
        to: "/brokers",
        description: "Research brokers, conditions, and regulation",
        icon: Building2,
      },
      {
        labelKey: "nav.cryptoExchanges",
        to: "/exchanges",
        description: "Compare exchange fees, features, and trust",
        icon: Bitcoin,
      },
      {
        labelKey: "nav.tradingTools",
        to: "/trading-tools",
        description: "Discover software, journals, and trader tools",
        icon: Wrench,
      },
    ],
  },
  { labelKey: "nav.payouts", to: "/payouts" },
  { labelKey: "nav.tbi", to: "/tbi" },
  { labelKey: "nav.topSellers", to: "/offers" },
  { labelKey: "nav.rebates", to: "/offers" },
  { labelKey: "nav.comparisons", to: "/compare" },
  {
    labelKey: "nav.tools",
    to: "/trading-tools",
    items: [
      {
        labelKey: "nav.tradingTools",
        to: "/trading-tools",
        description: "Practical tools for everyday trading decisions",
        icon: Wrench,
      },
      {
        labelKey: "nav.tradingSoftware",
        to: "/trading-software",
        description: "Research trading and analytics software",
        icon: AppWindow,
      },
      {
        labelKey: "nav.tradingJournals",
        to: "/trading-journals",
        description: "Track execution, habits, and performance",
        icon: NotebookTabs,
      },
      {
        labelKey: "nav.tradingCalculators",
        to: "/trading-calculators",
        description: "Calculate risk, margin, profit, and rebates",
        icon: Calculator,
      },
      {
        labelKey: "nav.tradingPlatforms",
        to: "/trading-platforms",
        description: "Compare platforms, features, and integrations",
        icon: MonitorUp,
      },
      {
        labelKey: "nav.educationProviders",
        to: "/education-providers",
        description: "Find structured learning for every skill level",
        icon: GraduationCap,
      },
      {
        labelKey: "nav.signalProviders",
        to: "/signal-providers",
        description: "Review signal quality and provider transparency",
        icon: RadioTower,
      },
      {
        labelKey: "nav.copyTradingPlatforms",
        to: "/copy-trading-platforms",
        description: "Compare social and copy trading services",
        icon: Copy,
      },
      {
        labelKey: "nav.economicCalendar",
        to: "/economic-calendar",
        description: "Follow market-moving events and releases",
        icon: CalendarDays,
      },
      {
        labelKey: "nav.tradingAcademy",
        to: "/academy",
        description: "Build skills with guided trading lessons",
        icon: Landmark,
      },
      {
        labelKey: "nav.aiBacktest",
        to: "/dashboard/backtest",
        description: "Test strategies against historical market data",
        icon: FlaskConical,
      },
      {
        labelKey: "nav.tradingPlan",
        to: "/dashboard/trading-plan",
        description: "Create and maintain a disciplined trading plan",
        icon: ClipboardList,
      },
    ],
  },
  {
    labelKey: "nav.aboutUs",
    items: [
      {
        labelKey: "nav.company",
        to: "/business/join",
        description: "Learn about RebateBoard and partner with us",
        icon: Building2,
      },
      {
        labelKey: "nav.trustDashboard",
        to: "/business/trust-dashboard",
        description: "See how transparency and trust are measured",
        icon: ShieldCheck,
      },
      {
        labelKey: "nav.faq",
        to: "/faqs",
        description: "Find answers to common platform questions",
        icon: CircleHelp,
      },
      {
        labelKey: "nav.legal",
        to: "/legal",
        description: "Review platform policies and legal information",
        icon: Scale,
      },
    ],
  },
  { labelKey: "nav.blogs", to: "/blog" },
];

function HeaderNavPill({ item }: { item: HeaderNavItem }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const baseClass =
    "flex h-8 shrink-0 items-center gap-1 rounded-full px-3.5 text-[12px] font-medium text-muted-foreground outline-none transition hover:bg-white/[0.075] hover:text-foreground focus-visible:bg-white/[0.08] focus-visible:ring-2 focus-visible:ring-ring";

  const cancelClose = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };

  const openMenu = () => {
    cancelClose();
    setOpen(true);
  };

  const scheduleClose = () => {
    cancelClose();
    closeTimer.current = setTimeout(() => setOpen(false), 180);
  };

  useEffect(
    () => () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
    },
    [],
  );

  if (item.items?.length) {
    const menuWidth =
      item.items.length > 8
        ? "w-[min(44rem,calc(100vw-2rem))]"
        : "w-[min(38rem,calc(100vw-2rem))]";

    return (
      <DropdownMenu open={open} onOpenChange={setOpen} modal={false}>
        <div onPointerEnter={openMenu} onPointerLeave={scheduleClose}>
          <DropdownMenuTrigger className={baseClass}>
            {t(item.labelKey)}
            <ChevronDown
              className={`h-3 w-3 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
            />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            sideOffset={10}
            onPointerEnter={openMenu}
            onPointerLeave={scheduleClose}
            className={`glass-strong ${menuWidth} border border-white/18 bg-[#16072b]/95 p-3 text-foreground shadow-[0_24px_80px_rgba(5,1,12,0.5)] backdrop-blur-3xl`}
          >
            <div className="grid gap-1 sm:grid-cols-2">
              {item.items.map((sub) => {
                const Icon = sub.icon;
                return (
                  <DropdownMenuItem
                    key={sub.labelKey}
                    asChild={!!sub.to}
                    className="cursor-pointer rounded-xl p-0 focus:bg-transparent"
                  >
                    {sub.to ? (
                      <Link
                        to={sub.to}
                        className="group/menu flex min-w-0 items-start gap-3 rounded-xl p-3 transition hover:bg-white/[0.075]"
                      >
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-violet-400/12 text-violet-200 ring-1 ring-violet-300/18 transition group-hover/menu:bg-violet-400/20 group-hover/menu:text-white">
                          <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
                        </span>
                        <span className="min-w-0 pt-0.5">
                          <span className="block text-xs font-semibold text-white">
                            {t(sub.labelKey)}
                          </span>
                          <span className="mt-1 block text-[10px] leading-4 text-white/48">
                            {sub.description}
                          </span>
                        </span>
                      </Link>
                    ) : (
                      <span>{t(sub.labelKey)}</span>
                    )}
                  </DropdownMenuItem>
                );
              })}
            </div>
          </DropdownMenuContent>
        </div>
      </DropdownMenu>
    );
  }

  return (
    <Link to={item.to ?? "/"} className={baseClass}>
      {t(item.labelKey)}
    </Link>
  );
}

function LanguageSelector() {
  const { language, languageMeta, languages, setLanguage, t } = useI18n();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={t("common.language")}
        className="flex h-9 items-center gap-1 rounded-full bg-white/[0.045] px-2 text-xs font-semibold text-white outline-none ring-1 ring-white/10 transition hover:bg-white/[0.08] sm:px-3"
      >
        <Globe2 className="h-3.5 w-3.5 text-fuchsia-200" />
        <span className="hidden sm:inline">{languageMeta.code.toUpperCase()}</span>
        <ChevronDown className="h-3 w-3 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="glass-strong w-48 border-2 border-white/40 backdrop-blur-3xl text-foreground shadow-2xl"
      >
        <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground">
          {t("common.language")}
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-white/10" />
        {languages.map((item) => (
          <DropdownMenuItem
            key={item.code}
            onClick={() => setLanguage(item.code as LanguageCode)}
            className="flex cursor-pointer items-center justify-between gap-3 text-xs text-foreground/95 focus:bg-white/15 focus:text-white"
          >
            <span>
              <span className="font-semibold">{item.nativeLabel}</span>
              <span className="ml-1 text-muted-foreground">({item.code.toUpperCase()})</span>
            </span>
            {language === item.code && <Check className="h-3.5 w-3.5 text-fuchsia-200" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function SiteHeader() {
  const { user } = useAuth();
  const { t } = useI18n();
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
      } else if (
        e.key === "/" &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA"
      ) {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 bg-[#10051f]/16 pt-2 backdrop-blur-xl supports-[backdrop-filter]:bg-[#10051f]/10">
        <span className="hidden" aria-hidden>
          {user ? "auth" : "guest"}
        </span>
        <div className="container-app">
          <div className="liquid-glass w-full max-w-full overflow-hidden rounded-[1.35rem] px-3 py-2.5 shadow-[0_18px_55px_rgba(9,4,18,0.32)] sm:px-4">
            <nav className="flex min-w-0 items-center justify-between gap-3">
              <Link
                to="/"
                className="flex min-w-0 shrink-0 items-center gap-3"
                aria-label="RebateBoard home"
              >
                <Logo heightClass="h-8 sm:h-9" className="shrink-0" />
                <span className="sr-only">RebateBoard</span>
              </Link>

              <div className="mx-3 hidden max-w-lg flex-1 lg:block xl:mx-6">
                <button
                  type="button"
                  onClick={() => setSearchOpen(true)}
                  className="flex h-9 w-full items-center gap-3 rounded-full bg-white/[0.04] px-4 text-left transition hover:bg-white/[0.08]"
                >
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <span className="flex-1 text-sm text-muted-foreground">{t("common.search")}</span>
                </button>
              </div>

              <div className="ml-auto flex min-w-0 shrink-0 items-center gap-2">
                <div className="hidden sm:block">
                  <LanguageSelector />
                </div>
                <button
                  type="button"
                  onClick={() => setSearchOpen(true)}
                  aria-label="Open search"
                  className="grid h-9 w-9 place-items-center rounded-full bg-white/[0.055] text-white transition hover:bg-white/[0.08] lg:hidden"
                >
                  <Search className="h-4 w-4" />
                </button>
                {user ? <UserPill /> : <GuestActions />}
                <Link
                  to="/dashboard"
                  aria-label="Open dashboard"
                  className="hidden h-10 w-10 place-items-center rounded-full bg-white/[0.045] text-white transition hover:bg-white/[0.08] sm:grid"
                >
                  <LayoutGrid className="h-4 w-4" />
                </Link>
              </div>
            </nav>

            <div className="mt-2">
              <div className="max-w-full overflow-x-auto no-scrollbar">
                <div className="flex w-max min-w-full items-center justify-center gap-1.5 lg:w-full">
                  {navItems.map((item) => (
                    <HeaderNavPill key={item.labelKey} item={item} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
        <GlobalSearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
      </header>
      <div className="h-[8.7rem] sm:h-[8.85rem]" aria-hidden />
    </>
  );
}
