import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Check,
  Search,
  ChevronDown,
  Globe2,
  LayoutDashboard,
  LayoutGrid,
  LogOut,
  User as UserIcon,
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
        <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-fuchsia-500 via-violet-500 to-indigo-600 text-[10px] font-bold text-white shadow-[0_0_18px_rgba(192,132,252,0.45)]">
          {initials}
        </span>
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
        className="glass-pill flex items-center gap-1 rounded-full px-3 py-1.5 text-xs text-white"
      >
        <span className="h-2 w-2 rounded-full bg-success" /> {t("common.login")}
      </Link>
      <Link
        to="/signup"
        className="rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-600 px-4 py-1.5 text-xs font-semibold text-white shadow-[0_0_20px_rgba(192,132,252,0.5)]"
      >
        {t("common.signUp")}
      </Link>
    </>
  );
}

type HeaderNavItem = {
  labelKey: TranslationKey;
  to?: string;
  items?: { labelKey: TranslationKey; to?: string }[];
};

const navItems: HeaderNavItem[] = [
  {
    labelKey: "nav.propFirms",
    to: "/programs",
    items: [
      { labelKey: "nav.allPropFirms", to: "/programs" },
      { labelKey: "nav.forexPropFirms", to: "/programs" },
      { labelKey: "nav.futuresPropFirms", to: "/futures-prop-firms" },
      { labelKey: "nav.cryptoPropFirms", to: "/crypto-prop-firms" },
    ],
  },
  { labelKey: "nav.brokers", to: "/brokers" },
  { labelKey: "nav.cryptoExchanges", to: "/exchanges" },
  { labelKey: "nav.payouts", to: "/payouts" },
  { labelKey: "nav.tbi", to: "/tbi" },
  { labelKey: "nav.topSellers", to: "/offers" },
  { labelKey: "nav.rebates", to: "/offers" },
  { labelKey: "nav.comparisons", to: "/compare" },
  {
    labelKey: "nav.tools",
    to: "/trading-tools",
    items: [
      { labelKey: "nav.tradingTools", to: "/trading-tools" },
      { labelKey: "nav.tradingSoftware", to: "/trading-software" },
      { labelKey: "nav.tradingJournals", to: "/trading-journals" },
      { labelKey: "nav.tradingCalculators", to: "/trading-calculators" },
      { labelKey: "nav.tradingPlatforms", to: "/trading-platforms" },
      { labelKey: "nav.educationProviders", to: "/education-providers" },
      { labelKey: "nav.signalProviders", to: "/signal-providers" },
      { labelKey: "nav.copyTradingPlatforms", to: "/copy-trading-platforms" },
      { labelKey: "nav.economicCalendar", to: "/economic-calendar" },
      { labelKey: "nav.tradingAcademy", to: "/academy" },
      { labelKey: "nav.aiBacktest", to: "/dashboard/backtest" },
      { labelKey: "nav.tradingPlan", to: "/dashboard/trading-plan" },
    ],
  },
  {
    labelKey: "nav.aboutUs",
    items: [
      { labelKey: "nav.company", to: "/business/join" },
      { labelKey: "nav.trustDashboard", to: "/business/trust-dashboard" },
      { labelKey: "nav.faq", to: "/faqs" },
      { labelKey: "nav.legal", to: "/legal" },
    ],
  },
  { labelKey: "nav.blogs", to: "/blog" },
];

function HeaderNavPill({ item }: { item: HeaderNavItem }) {
  const { t } = useI18n();
  const baseClass =
    "flex h-8 shrink-0 items-center gap-1 rounded-full px-3.5 text-[12px] font-medium text-muted-foreground outline-none transition hover:bg-white/[0.075] hover:text-foreground focus-visible:bg-white/[0.08] focus-visible:ring-2 focus-visible:ring-ring";

  if (item.items?.length) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger className={baseClass}>
          {t(item.labelKey)} <ChevronDown className="h-3 w-3" />
        </DropdownMenuTrigger>
        <DropdownMenuContent className="glass-strong border-2 border-white/40 text-xs backdrop-blur-3xl text-foreground shadow-2xl">
          {item.items.map((sub) => (
            <DropdownMenuItem
              key={sub.labelKey}
              asChild={!!sub.to}
              className="cursor-pointer text-xs text-foreground/95 focus:bg-white/15 focus:text-white"
            >
              {sub.to ? <Link to={sub.to}>{t(sub.labelKey)}</Link> : <span>{t(sub.labelKey)}</span>}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
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
          <div className="liquid-glass rounded-[1.35rem] px-3 py-2.5 shadow-[0_18px_55px_rgba(9,4,18,0.32)] sm:px-4">
            <nav className="flex items-center justify-between gap-3">
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

              <div className="flex shrink-0 items-center gap-2">
                <LanguageSelector />
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
                  className="grid h-10 w-10 place-items-center rounded-full bg-white/[0.045] text-white transition hover:bg-white/[0.08]"
                >
                  <LayoutGrid className="h-4 w-4" />
                </Link>
              </div>
            </nav>

            <div className="mt-2">
              <div className="overflow-x-auto no-scrollbar lg:overflow-visible">
                <div className="flex items-center justify-center gap-1.5 lg:min-w-max xl:min-w-0">
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
