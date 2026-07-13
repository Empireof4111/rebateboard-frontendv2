import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  AppWindow,
  BarChart3,
  Bitcoin,
  BookOpen,
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
  Menu,
  MessageSquare,
  MonitorUp,
  Network,
  NotebookTabs,
  RadioTower,
  Scale,
  Search,
  ShieldCheck,
  Tags,
  TrendingUp,
  User as UserIcon,
  WalletCards,
  Wrench,
  X,
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
import { getTraderLevelProgress } from "@/lib/trader-levels";

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
  const display = user.fullName || user.name;
  const initials = initialsOf(user.fullName || user.name);
  const level = getTraderLevelProgress(user.rrBalance).current;
  const dashboardHref = `/login?reauth=1&email=${encodeURIComponent(user.email)}&redirect=/dashboard`;
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger className="group flex max-w-[18rem] items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] py-1 pl-1 pr-2.5 text-left outline-none transition hover:border-white/20 hover:bg-white/[0.08]">
        <Avatar className="h-8 w-8 shrink-0 shadow-[0_0_18px_rgba(192,132,252,0.38)]">
          <AvatarImage
            src={user.dp || undefined}
            alt={`${user.fullName || user.name} profile`}
            className="object-cover"
          />
          <AvatarFallback className="bg-gradient-to-br from-violet-500 via-violet-500 to-indigo-600 text-[10px] font-bold text-white">
            {initials}
          </AvatarFallback>
        </Avatar>
        <span className="hidden min-w-0 flex-col leading-tight md:flex">
          <span className="max-w-[11rem] truncate text-xs font-semibold text-white" title={display}>
            {display}
          </span>
          <span className={`mt-1 inline-flex w-fit max-w-[11rem] items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.12em] ${traderLevelBadgeClass(level.id)}`}>
            <ShieldCheck className="h-2.5 w-2.5" />
            <span className="truncate">{level.name}</span>
          </span>
        </span>
        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground transition group-hover:text-white" />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={10}
        className="navigation-glass-panel w-56 p-2 text-foreground"
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

function traderLevelBadgeClass(levelId: string) {
  if (levelId === "elite") return "border-emerald-300/35 bg-emerald-400/15 text-emerald-100 shadow-[0_0_16px_rgba(52,211,153,0.18)]";
  if (levelId === "platinum") return "border-cyan-200/30 bg-cyan-300/12 text-cyan-100 shadow-[0_0_16px_rgba(103,232,249,0.14)]";
  if (levelId === "gold") return "border-violet-200/35 bg-violet-300/14 text-violet-50 shadow-[0_0_16px_rgba(167,139,250,0.16)]";
  if (levelId === "silver") return "border-indigo-200/25 bg-indigo-300/12 text-indigo-100";
  if (levelId === "bronze") return "border-violet-200/25 bg-violet-300/12 text-violet-100";
  return "border-white/12 bg-white/[0.055] text-white/72";
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
        className="hidden rounded-full rb-gradient-primary px-4 py-1.5 text-xs font-semibold text-white shadow-[0_0_20px_rgba(192,132,252,0.5)] sm:inline-flex"
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
    labelKey?: TranslationKey;
    label?: string;
    to?: string;
    description: string;
    icon: LucideIcon;
  }[];
};

const navItems: HeaderNavItem[] = [
  { labelKey: "nav.home", to: "/" },
  { labelKey: "nav.earlyAccess", to: "/pricing" },
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
        labelKey: "nav.productTradingJournal",
        to: "/trading-journals",
        description: "Log trades, screenshots, strategy notes, and lessons",
        icon: NotebookTabs,
      },
      {
        labelKey: "nav.tradingPlan",
        to: "/trading-plan",
        description: "Build rules, guardrails, goals, and daily discipline",
        icon: ClipboardList,
      },
      {
        labelKey: "nav.aiBacktestingLab",
        to: "/ai-backtesting-lab",
        description: "Test strategy ideas before risking real capital",
        icon: FlaskConical,
      },
      {
        labelKey: "nav.traderTbi",
        to: "/trader-tbi",
        description: "Build a personal trust and consistency profile",
        icon: ShieldCheck,
      },
      {
        labelKey: "nav.traderReturnTracker",
        to: "/trt",
        description: "Track real return across spend, cashback, and payouts",
        icon: LineChart,
      },
      {
        labelKey: "nav.rebetaAi",
        to: "/rebeta-ai",
        description: "Ask Rebeta for trading and platform intelligence",
        icon: MessageSquare,
      },
      {
        labelKey: "nav.rebateRewards",
        to: "/rebate-rewards",
        description: "Progress through RR, levels, streaks, and unlocks",
        icon: Tags,
      },
      {
        labelKey: "nav.cashbackCalculator",
        to: "/cashback-calculator",
        description: "Estimate possible cashback and cost recovery",
        icon: Calculator,
      },
      {
        labelKey: "nav.payoutTracker",
        to: "/payouts",
        description: "Review verified payout transparency across brands",
        icon: WalletCards,
      },
    ],
  },
  { labelKey: "nav.tbi", to: "/tbi" },
  { labelKey: "nav.reviews", to: "/reviews" },
  { labelKey: "nav.topSellers", to: "/offers" },
  { labelKey: "nav.rebates", to: "/cashback" },
  { labelKey: "nav.comparisons", to: "/compare" },
  {
    labelKey: "nav.tools",
    to: "/dashboard/tools",
    items: [
      {
        label: "All Dashboard Tools",
        to: "/dashboard/tools",
        description: "Open the complete protected calculator workspace",
        icon: Wrench,
      },
      {
        label: "Profit Consistency Calculator",
        to: "/dashboard/tools?tool=consistency",
        description: "Measure how much profit came from your best trading day",
        icon: BarChart3,
      },
      {
        label: "Rebate Calculator",
        to: "/dashboard/tools?tool=rebate",
        description: "Estimate possible cashback and rebate value",
        icon: Tags,
      },
      {
        label: "Margin Calculator",
        to: "/dashboard/tools?tool=margin",
        description: "Estimate required margin for a position",
        icon: Calculator,
      },
      {
        label: "Currency Converter",
        to: "/dashboard/tools?tool=currency",
        description: "Convert supported currencies in the tools workspace",
        icon: Globe2,
      },
      {
        label: "Profit Calculator",
        to: "/dashboard/tools?tool=profit",
        description: "Model price scenarios, pips, and possible P&L",
        icon: TrendingUp,
      },
      {
        label: "Fees Calculator",
        to: "/dashboard/tools?tool=fees",
        description: "Estimate spread and commission costs",
        icon: WalletCards,
      },
    ],
  },
  { labelKey: "nav.aboutUs", to: "/about" },
  { labelKey: "nav.blogs", to: "/blog" },
];

function HeaderNavPill({ item }: { item: HeaderNavItem }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const baseClass =
    "flex h-8 shrink-0 items-center gap-1 rounded-full border border-transparent px-3.5 text-[12px] font-medium text-muted-foreground outline-none transition duration-200 hover:border-white/10 hover:bg-white/[0.075] hover:text-foreground focus-visible:bg-white/[0.08] focus-visible:ring-2 focus-visible:ring-ring";

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
          <DropdownMenuTrigger
            className={`${baseClass} ${
              open ? "border-violet-300/25 bg-[rgba(90,34,241,0.13)] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]" : ""
            }`}
          >
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
            className={`navigation-glass-panel ${menuWidth} p-3 text-foreground`}
          >
            <div className="grid gap-1 sm:grid-cols-2">
              {item.items.map((sub) => {
                const Icon = sub.icon;
                const label = sub.labelKey ? t(sub.labelKey) : sub.label;
                return (
                  <DropdownMenuItem
                    key={sub.labelKey ?? sub.label}
                    asChild={!!sub.to}
                    className="cursor-pointer rounded-xl p-0 focus:bg-transparent"
                  >
                    {sub.to ? (
                      <Link
                        to={sub.to}
                        className="group/menu flex min-w-0 items-start gap-3 rounded-xl p-3 transition hover:bg-white/[0.075]"
                      >
                        <span className="rb-icon-tile h-10 w-10 rounded-xl transition group-hover/menu:brightness-125">
                          <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
                        </span>
                        <span className="min-w-0 pt-0.5">
                          <span className="block text-xs font-semibold text-white">
                            {label}
                          </span>
                          <span className="mt-1 block text-[10px] leading-4 text-white/48">
                            {sub.description}
                          </span>
                        </span>
                      </Link>
                    ) : (
                      <span>{label}</span>
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
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger
        aria-label={t("common.language")}
        className="flex h-9 items-center gap-1 rounded-full border border-white/10 bg-white/[0.045] px-2 text-xs font-semibold text-white outline-none shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition hover:border-violet-300/25 hover:bg-white/[0.08] sm:px-3"
      >
        <Globe2 className="h-3.5 w-3.5 text-primary" />
        <span className="hidden sm:inline">{languageMeta.code.toUpperCase()}</span>
        <ChevronDown className="h-3 w-3 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={10}
        className="navigation-glass-panel w-56 p-2 text-foreground"
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
            {language === item.code && <Check className="h-3.5 w-3.5 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

const utilityLinks: {
  label: string;
  description: string;
  to: string;
  icon: LucideIcon;
}[] = [
  {
    label: "Dashboard",
    description: "Wallet, RR, claims, journal, and trader tools",
    to: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Programs",
    description: "Compare brokers, prop firms, exchanges, and tools",
    to: "/programs",
    icon: TrendingUp,
  },
  {
    label: "Cashback",
    description: "Learn how rebates, claims, and withdrawals work",
    to: "/cashback",
    icon: WalletCards,
  },
  {
    label: "Offers",
    description: "Promotions, rebates, and partner rewards",
    to: "/offers",
    icon: Tags,
  },
  {
    label: "Reviews",
    description: "Read verified trader experiences and trust signals",
    to: "/reviews",
    icon: MessageSquare,
  },
  {
    label: "Compare",
    description: "Review brands side by side before you choose",
    to: "/compare",
    icon: Scale,
  },
  {
    label: "Blogs",
    description: "Guides, platform updates, and trader education",
    to: "/blog",
    icon: BookOpen,
  },
  {
    label: "FAQ",
    description: "Quick answers about cashback, reviews, and TBI",
    to: "/faqs",
    icon: CircleHelp,
  },
];

function UtilityMenu() {
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger
        aria-label="Open RebateBoard menu"
        className="hidden h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/[0.045] text-white outline-none shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition hover:border-violet-300/25 hover:bg-white/[0.08] focus-visible:ring-2 focus-visible:ring-ring sm:grid"
      >
        <LayoutGrid className="h-4 w-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={10}
        className="navigation-glass-panel w-[min(34rem,calc(100vw-2rem))] p-3 text-foreground"
      >
        <DropdownMenuLabel className="px-2 pb-2 pt-1">
          <span className="block text-[10px] uppercase tracking-[0.22em] text-violet-100/55">
            Explore RebateBoard
          </span>
          <span className="mt-1 block text-xs font-semibold text-white">
            Fast paths for traders and partners
          </span>
        </DropdownMenuLabel>
        <div className="grid gap-1 sm:grid-cols-2">
          {utilityLinks.map((item) => {
            const Icon = item.icon;
            return (
              <DropdownMenuItem
                key={item.label}
                asChild
                className="cursor-pointer rounded-xl p-0 focus:bg-transparent"
              >
                <Link
                  to={item.to}
                  className="group/menu flex min-w-0 items-start gap-3 rounded-xl p-3 transition hover:bg-white/[0.075]"
                >
                  <span className="rb-icon-tile h-10 w-10 rounded-xl transition group-hover/menu:brightness-125">
                    <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
                  </span>
                  <span className="min-w-0 pt-0.5">
                    <span className="block text-xs font-semibold text-white">{item.label}</span>
                    <span className="mt-1 block text-[10px] leading-4 text-white/48">
                      {item.description}
                    </span>
                  </span>
                </Link>
              </DropdownMenuItem>
            );
          })}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function MobileNavigationDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const [openGroup, setOpenGroup] = useState<string | null>("nav.propFirms");
  const [shouldRender, setShouldRender] = useState(open);

  useEffect(() => {
    if (open) {
      setShouldRender(true);
      return;
    }

    const timeout = window.setTimeout(() => setShouldRender(false), 280);
    return () => window.clearTimeout(timeout);
  }, [open]);

  useEffect(() => {
    if (!open || typeof document === "undefined") return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  if (!shouldRender) return null;

  return (
    <div
      className={`fixed inset-0 z-[70] overflow-hidden lg:hidden ${
        open ? "pointer-events-auto" : "pointer-events-none"
      }`}
      role="dialog"
      aria-modal="true"
      aria-label="Mobile navigation"
      aria-hidden={!open}
    >
      <button
        type="button"
        aria-label="Close navigation"
        onClick={onClose}
        className={`absolute inset-0 bg-black/55 backdrop-blur-sm transition-opacity duration-200 ${
          open ? "opacity-100" : "opacity-0"
        }`}
      />
      <aside
        className={`navigation-glass-panel mobile-navigation-drawer fixed inset-y-0 left-auto right-0 flex h-dvh w-full max-w-full flex-col rounded-none border-y-0 border-r-0 p-4 text-white transition-transform duration-300 sm:w-[min(24rem,92vw)] ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between gap-3">
          <Logo heightClass="h-8" />
          <button
            type="button"
            onClick={onClose}
            className="grid h-10 w-10 place-items-center rounded-full bg-white/[0.06] text-white ring-1 ring-white/10 transition hover:bg-white/[0.1]"
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <LanguageSelector />
          <Link
            to="/signup"
            onClick={onClose}
            className="inline-flex h-9 flex-1 items-center justify-center rounded-full rb-gradient-primary px-4 text-xs font-bold text-white shadow-[0_0_20px_rgba(192,132,252,0.35)]"
          >
            {t("common.signUp")}
          </Link>
        </div>

        <div className="mt-5 min-h-0 flex-1 overflow-y-auto pr-1">
          <div className="space-y-2">
            {navItems.map((item) => {
              const hasChildren = Boolean(item.items?.length);
              const expanded = openGroup === item.labelKey;

              if (!hasChildren) {
                return (
                  <Link
                    key={item.labelKey}
                    to={item.to ?? "/"}
                    onClick={onClose}
                    className="flex items-center justify-between rounded-2xl bg-white/[0.04] px-4 py-3 text-sm font-semibold text-white/88 ring-1 ring-white/8 transition hover:bg-white/[0.08]"
                  >
                    {t(item.labelKey)}
                    <ArrowRightIcon />
                  </Link>
                );
              }

              return (
                <div
                  key={item.labelKey}
                  className="overflow-hidden rounded-2xl bg-white/[0.035] ring-1 ring-white/8"
                >
                  <button
                    type="button"
                    onClick={() => setOpenGroup(expanded ? null : String(item.labelKey))}
                    className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold text-white"
                  >
                    {t(item.labelKey)}
                    <ChevronDown
                      className={`h-4 w-4 text-white/58 transition-transform ${
                        expanded ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  <div
                    className={`grid transition-[grid-template-rows] duration-300 ${
                      expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                    }`}
                  >
                    <div className="min-h-0 overflow-hidden">
                      <div className="grid gap-1 px-2 pb-2">
                        {item.items?.map((sub) => {
                          const Icon = sub.icon;
                          const label = sub.labelKey ? t(sub.labelKey) : sub.label;
                          return (
                            <Link
                              key={sub.labelKey ?? sub.label}
                              to={sub.to ?? "/"}
                              onClick={onClose}
                              className="group/menu flex min-w-0 items-start gap-3 rounded-xl p-3 transition hover:bg-white/[0.075]"
                            >
                              <span className="rb-icon-tile h-10 w-10 rounded-xl transition group-hover/menu:brightness-125">
                                <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
                              </span>
                              <span className="min-w-0 pt-0.5">
                                <span className="block text-xs font-semibold text-white">
                                  {label}
                                </span>
                                <span className="mt-1 block text-[10px] leading-4 text-white/50">
                                  {sub.description}
                                </span>
                              </span>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-5 border-t border-white/10 pt-4">
            <div className="mb-2 px-1 text-[10px] font-bold uppercase tracking-[0.22em] text-violet-100/45">
              Quick access
            </div>
            <div className="grid gap-2">
              {utilityLinks.slice(0, 6).map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.label}
                    to={item.to}
                    onClick={onClose}
                    className="flex items-center gap-3 rounded-xl bg-white/[0.035] p-3 ring-1 ring-white/8 transition hover:bg-white/[0.075]"
                  >
                    <span className="rb-icon-tile h-9 w-9 rounded-xl">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-xs font-semibold text-white">{item.label}</span>
                      <span className="block truncate text-[10px] text-white/45">
                        {item.description}
                      </span>
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}

function ArrowRightIcon() {
  return <span className="text-white/35">→</span>;
}

export function SiteHeader() {
  const { user } = useAuth();
  const { t } = useI18n();
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

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

  useEffect(() => {
    const updateScrolled = () => setScrolled(window.scrollY > 12);
    updateScrolled();
    window.addEventListener("scroll", updateScrolled, { passive: true });
    return () => window.removeEventListener("scroll", updateScrolled);
  }, []);

  return (
    <>
      <header
        data-site-header={scrolled ? "scrolled" : "top"}
        className="fixed inset-x-0 top-0 z-50 pt-[calc(env(safe-area-inset-top)+0.5rem)] sm:pt-[calc(env(safe-area-inset-top)+0.75rem)]"
      >
        <span className="hidden" aria-hidden>
          {user ? "auth" : "guest"}
        </span>
        <div className="mx-auto w-full max-w-[96rem] px-3 sm:px-5 lg:px-7">
          <div className="site-header-glass w-full max-w-full overflow-hidden rounded-[1.15rem] px-2.5 py-2.5 sm:rounded-[1.35rem] sm:px-4">
            <nav className="flex min-w-0 items-center justify-between gap-3">
              <Link
                to="/"
                className="flex min-w-0 shrink-0 items-center gap-2 sm:gap-3"
                aria-label="RebateBoard home"
              >
                <Logo heightClass="h-9 sm:h-10" className="shrink-0" />
                <span className="sr-only">RebateBoard</span>
              </Link>

              <div className="mx-3 hidden max-w-lg flex-1 lg:block xl:mx-6">
                <button
                  type="button"
                  onClick={() => setSearchOpen(true)}
                  className="flex h-9 w-full items-center gap-3 rounded-full border border-white/10 bg-black/15 px-4 text-left shadow-[inset_0_1px_8px_rgba(0,0,0,0.16),inset_0_1px_0_rgba(255,255,255,0.035)] transition hover:border-violet-300/25 hover:bg-white/[0.065] focus-visible:border-violet-300/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/20"
                >
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <span className="flex-1 text-sm text-muted-foreground">{t("common.search")}</span>
                </button>
              </div>

              <div className="ml-auto flex min-w-0 shrink-0 items-center gap-1.5 sm:gap-2">
                <div className="hidden sm:block">
                  <LanguageSelector />
                </div>
                <button
                  type="button"
                  onClick={() => setSearchOpen(true)}
                  aria-label="Open search"
                  className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/[0.055] text-white transition hover:border-violet-300/25 hover:bg-white/[0.08] lg:hidden"
                >
                  <Search className="h-4 w-4" />
                </button>
                {user ? <UserPill /> : <GuestActions />}
                <UtilityMenu />
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(true)}
                  aria-label="Open navigation menu"
                  className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/[0.055] text-white transition hover:border-violet-300/25 hover:bg-white/[0.08] lg:hidden"
                >
                  <Menu className="h-4 w-4" />
                </button>
              </div>
            </nav>

            <div className="mt-2 hidden lg:block">
              <div className="max-w-full">
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
      <MobileNavigationDrawer open={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
      <div className="h-[calc(5.35rem+env(safe-area-inset-top))] sm:h-[calc(5.6rem+env(safe-area-inset-top))] lg:h-[calc(9.6rem+env(safe-area-inset-top))]" aria-hidden />
    </>
  );
}
