import type { AdminBrandCategory } from "@/lib/admin-brands-api";

export type ListingCategoryId =
  | "prop-firms"
  | "brokers"
  | "exchanges"
  | "futures-prop-firms"
  | "crypto-prop-firms"
  | "trading-tools"
  | "trading-software"
  | "trading-journals"
  | "trading-calculators"
  | "trading-platforms"
  | "education-providers"
  | "signal-providers"
  | "copy-trading-platforms";

export type ListingCategoryConfig = {
  id: ListingCategoryId;
  route: string;
  title: string;
  eyebrow: string;
  description: string;
  searchPlaceholder: string;
  categoryFilters: AdminBrandCategory[];
  matchKeywords?: string[];
  exactCategoryOnly?: boolean;
  featuredLabel: string;
  allLabel: string;
  metricProfile: "prop" | "broker" | "exchange" | "tool" | "education";
};

export const LISTING_CATEGORY_CONFIGS: ListingCategoryConfig[] = [
  {
    id: "prop-firms",
    route: "/programs",
    title: "All Prop Firms",
    eyebrow: "Funded trader programs",
    description:
      "Compare funded trader brands with real TBI data, challenge details, payout terms, rebates, and public trader feedback.",
    searchPlaceholder: "Search prop firms...",
    categoryFilters: ["Prop Firm"],
    exactCategoryOnly: true,
    featuredLabel: "Featured Prop Firms",
    allLabel: "All Prop Firms",
    metricProfile: "prop",
  },
  {
    id: "brokers",
    route: "/brokers",
    title: "All Brokers",
    eyebrow: "Broker directory",
    description:
      "Compare brokers by regulation, platforms, assets, execution, rebate eligibility, and verified trust intelligence.",
    searchPlaceholder: "Search brokers...",
    categoryFilters: ["Forex Broker"],
    exactCategoryOnly: true,
    featuredLabel: "Featured Brokers",
    allLabel: "All Brokers",
    metricProfile: "broker",
  },
  {
    id: "exchanges",
    route: "/exchanges",
    title: "All Crypto Exchanges",
    eyebrow: "Exchange directory",
    description:
      "Compare crypto exchanges by supported assets, fees, KYC, security, payout options, and TBI trust context.",
    searchPlaceholder: "Search exchanges...",
    categoryFilters: ["Crypto Exchange"],
    exactCategoryOnly: true,
    featuredLabel: "Featured Exchanges",
    allLabel: "All Crypto Exchanges",
    metricProfile: "exchange",
  },
  {
    id: "futures-prop-firms",
    route: "/futures-prop-firms",
    title: "Futures Prop Firms",
    eyebrow: "Futures funding",
    description:
      "Find futures-focused funded programs with account sizes, drawdown terms, platforms, payout rules, and current rebates.",
    searchPlaceholder: "Search futures prop firms...",
    categoryFilters: ["Futures Prop Firm"],
    exactCategoryOnly: true,
    featuredLabel: "Featured Futures Firms",
    allLabel: "All Futures Prop Firms",
    metricProfile: "prop",
  },
  {
    id: "crypto-prop-firms",
    route: "/crypto-prop-firms",
    title: "Crypto Prop Firms",
    eyebrow: "Crypto funding",
    description:
      "Explore crypto prop firms and funded accounts with real brand data, profit split terms, restrictions, and trust signals.",
    searchPlaceholder: "Search crypto prop firms...",
    categoryFilters: ["Crypto Prop Firm", "DEX Prop Firm"],
    exactCategoryOnly: true,
    featuredLabel: "Featured Crypto Firms",
    allLabel: "All Crypto Prop Firms",
    metricProfile: "prop",
  },
  {
    id: "trading-tools",
    route: "/trading-tools",
    title: "Trading Tools",
    eyebrow: "Trader utilities",
    description:
      "Browse calculators, journals, platforms, signal tools, analytics products, and education resources listed on RebateBoard.",
    searchPlaceholder: "Search trading tools...",
    categoryFilters: [
      "Trading Tool",
      "Trading Software",
      "Trading Journal",
      "Trading Calculator",
      "Trading Platform",
      "Signal Provider",
      "Copy Trading Platform",
      "Education Provider",
      "Other",
    ],
    matchKeywords: ["tool", "software", "journal", "calculator", "platform", "signal", "copy", "academy"],
    featuredLabel: "Featured Trading Tools",
    allLabel: "All Trading Tools",
    metricProfile: "tool",
  },
  {
    id: "trading-software",
    route: "/trading-software",
    title: "Trading Software",
    eyebrow: "Software stack",
    description:
      "Compare execution, analytics, automation, journaling, and trader workflow software with verified listing data.",
    searchPlaceholder: "Search trading software...",
    categoryFilters: ["Trading Software", "Trading Tool"],
    matchKeywords: ["software", "analytics", "automation", "ai", "dashboard"],
    featuredLabel: "Featured Software",
    allLabel: "All Trading Software",
    metricProfile: "tool",
  },
  {
    id: "trading-journals",
    route: "/trading-journals",
    title: "Trading Journals",
    eyebrow: "Journal tools",
    description:
      "Find trading journals and analytics workspaces built for tracking trades, performance, psychology, and strategy progress.",
    searchPlaceholder: "Search trading journals...",
    categoryFilters: ["Trading Journal", "Trading Tool", "Trading Software"],
    matchKeywords: ["journal", "journaling", "trades", "analytics", "calendar"],
    featuredLabel: "Featured Journals",
    allLabel: "All Trading Journals",
    metricProfile: "tool",
  },
  {
    id: "trading-calculators",
    route: "/trading-calculators",
    title: "Trading Calculators",
    eyebrow: "Calculation tools",
    description:
      "Browse position sizing, margin, fee, rebate, profit, risk, and compounding calculators for active traders.",
    searchPlaceholder: "Search trading calculators...",
    categoryFilters: ["Trading Calculator", "Trading Tool", "Trading Software"],
    matchKeywords: ["calculator", "calculate", "margin", "profit", "fee", "risk", "rebate"],
    featuredLabel: "Featured Calculators",
    allLabel: "All Trading Calculators",
    metricProfile: "tool",
  },
  {
    id: "trading-platforms",
    route: "/trading-platforms",
    title: "Trading Platforms",
    eyebrow: "Execution platforms",
    description:
      "Compare trading platforms, terminals, integrations, broker gateways, execution tools, and supported asset coverage.",
    searchPlaceholder: "Search trading platforms...",
    categoryFilters: ["Trading Platform", "Trading Tool", "Trading Software"],
    matchKeywords: ["platform", "terminal", "mt4", "mt5", "ctrader", "match trader", "gateway"],
    featuredLabel: "Featured Platforms",
    allLabel: "All Trading Platforms",
    metricProfile: "tool",
  },
  {
    id: "education-providers",
    route: "/education-providers",
    title: "Education Providers",
    eyebrow: "Trading education",
    description:
      "Discover trading academies, mentoring programs, research providers, and learning resources for every experience level.",
    searchPlaceholder: "Search education providers...",
    categoryFilters: ["Education Provider"],
    exactCategoryOnly: true,
    featuredLabel: "Featured Education",
    allLabel: "All Education Providers",
    metricProfile: "education",
  },
  {
    id: "signal-providers",
    route: "/signal-providers",
    title: "Signal Providers",
    eyebrow: "Signal services",
    description:
      "Review signal providers with transparent trust data, supported markets, delivery channels, pricing, and user feedback.",
    searchPlaceholder: "Search signal providers...",
    categoryFilters: ["Signal Provider", "Trading Tool", "Trading Software"],
    matchKeywords: ["signal", "alerts", "copy signal", "telegram", "discord"],
    featuredLabel: "Featured Signal Providers",
    allLabel: "All Signal Providers",
    metricProfile: "tool",
  },
  {
    id: "copy-trading-platforms",
    route: "/copy-trading-platforms",
    title: "Copy Trading Platforms",
    eyebrow: "Copy trading",
    description:
      "Compare copy trading products, social trading networks, leaderboards, risk controls, supported brokers, and fees.",
    searchPlaceholder: "Search copy trading platforms...",
    categoryFilters: ["Copy Trading Platform", "Trading Tool", "Trading Software"],
    matchKeywords: ["copy", "social trading", "signal", "followers", "leaderboard"],
    featuredLabel: "Featured Copy Trading",
    allLabel: "All Copy Trading Platforms",
    metricProfile: "tool",
  },
];

export function getListingCategoryConfig(id: ListingCategoryId) {
  const config = LISTING_CATEGORY_CONFIGS.find((item) => item.id === id);
  if (!config) throw new Error(`Unknown listing category: ${id}`);
  return config;
}
