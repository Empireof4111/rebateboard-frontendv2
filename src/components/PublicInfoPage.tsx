import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  BookOpen,
  BriefcaseBusiness,
  CalendarClock,
  CircleDollarSign,
  ClipboardCheck,
  Compass,
  Gift,
  GraduationCap,
  Handshake,
  HelpCircle,
  LineChart,
  Mail,
  Megaphone,
  Newspaper,
  Radio,
  Rocket,
  Search,
  ShieldCheck,
  Bot,
  Target,
  Trophy,
  WalletCards,
} from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { useAuth } from "@/lib/auth";

type PageKind = "marketplace" | "product" | "insight" | "company" | "support";

export type PublicInfoPageConfig = {
  key: string;
  eyebrow: string;
  title: string;
  description: string;
  kind: PageKind;
  primaryCta?: { label: string; to: string };
  secondaryCta?: { label: string; to: string };
  features: Array<{ title: string; body: string }>;
  sections?: Array<{ title: string; body: string; bullets?: string[] }>;
  faqs?: Array<{ q: string; a: string }>;
  related?: Array<{ title: string; body: string; to: string; label: string }>;
};

const kindMeta: Record<PageKind, { label: string; icon: typeof Bot }> = {
  marketplace: { label: "Marketplace", icon: Compass },
  product: { label: "Product", icon: Bot },
  insight: { label: "Insights", icon: BarChart3 },
  company: { label: "Company", icon: ShieldCheck },
  support: { label: "Support", icon: HelpCircle },
};

export const publicPages: Record<string, PublicInfoPageConfig> = {
  about: {
    key: "about",
    eyebrow: "About RebateBoard",
    title: "A transparency-first trading ecosystem.",
    description:
      "RebateBoard helps traders discover trusted brands, earn cashback, understand risk, and make better trading decisions through verified data, reviews, rewards, and intelligent tools.",
    kind: "company",
    primaryCta: { label: "Explore Trusted Brands", to: "/programs" },
    secondaryCta: { label: "Create Free Account", to: "/signup" },
    features: [
      { title: "Mission", body: "Help traders earn more, lose less, and make smarter decisions with transparency at the center." },
      { title: "Vision", body: "Build the trust layer for brokers, prop firms, exchanges, tools, education, and trader rewards." },
      { title: "Core Philosophy", body: "Reviews, TBI, complaints, and payouts should be understandable, verifiable, and never for sale." },
      { title: "Platform Overview", body: "Cashback, Rebeta AI, Trader TBI, RR, journals, calculators, payouts, and market intelligence in one place." },
    ],
    sections: [
      {
        title: "Why RebateBoard Exists",
        body:
          "Trading discovery is often fragmented, promotional, and hard to verify. RebateBoard brings the marketplace, trust data, trader tools, cashback, and community signals into one ecosystem.",
        bullets: ["Independent trust signals", "Real trader reviews", "Cashback and reward tracking", "Tools built around trader performance"],
      },
      {
        title: "Built for Both Sides",
        body:
          "Traders get clarity and rewards. Good brands get a transparent way to earn attention, build credibility, and serve better-fit audiences.",
      },
    ],
  },
  contact: {
    key: "contact",
    eyebrow: "Contact",
    title: "Reach the right RebateBoard team.",
    description:
      "Whether you need trader support, brand partnership help, press information, or cashback claim guidance, we route every message to the right team.",
    kind: "company",
    primaryCta: { label: "Open Support", to: "/help-center" },
    secondaryCta: { label: "List Your Brand", to: "/business/join" },
    features: [
      { title: "Trader Support", body: "Cashback claims, reviews, account questions, payout guidance, and platform help." },
      { title: "Business Inquiries", body: "Brand listings, promotions, verified profiles, affiliate programs, and partner analytics." },
      { title: "Press", body: "Media requests, company facts, brand assets, and interview requests." },
      { title: "Response Expectations", body: "Critical claim or account issues are prioritized. General inquiries are handled in the order received." },
    ],
    sections: [
      {
        title: "Send Us a Message",
        body:
          "Use your RebateBoard account email where possible so our team can connect your request with relevant reviews, claims, wallet activity, or brand submissions.",
        bullets: ["Support: support@rebateboard.com", "Partnerships: partners@rebateboard.com", "Press: press@rebateboard.com"],
      },
    ],
  },
  "help-center": {
    key: "help-center",
    eyebrow: "Help Center",
    title: "Find answers faster.",
    description:
      "Start with popular guides for cashback, reviews, TBI, payouts, rewards, journals, and account setup. If you still need help, contact support from the right category.",
    kind: "support",
    primaryCta: { label: "Browse FAQs", to: "/faqs" },
    secondaryCta: { label: "Contact Support", to: "/contact" },
    features: [
      { title: "Cashback & Wallet", body: "Understand claims, approvals, pending balances, withdrawals, and proof requirements." },
      { title: "Reviews & TBI", body: "Learn how verified reviews contribute to User Trust and brand transparency." },
      { title: "Programs & Offers", body: "Compare brands, claim offers, understand promo codes, and track purchase sessions." },
      { title: "Account & Security", body: "Manage profile details, verification, notifications, and dashboard settings." },
    ],
    sections: [
      {
        title: "Popular Questions",
        body: "The quickest way to resolve most issues is to start with the right topic and follow the guided next action.",
        bullets: ["How cashback works", "How reviews are verified", "How TBI is calculated", "How withdrawals are processed"],
      },
    ],
  },
  docs: {
    key: "docs",
    eyebrow: "Docs",
    title: "Guides for using RebateBoard.",
    description:
      "Documentation for traders, brands, partners, and future developers. Start with platform guides today; API documentation will expand as partner tools mature.",
    kind: "support",
    primaryCta: { label: "Start With FAQs", to: "/faqs" },
    secondaryCta: { label: "Explore Cashback", to: "/cashback" },
    features: [
      { title: "Cashback Guide", body: "Claim flow, tracking, proof, wallet states, and withdrawal readiness." },
      { title: "TBI Guide", body: "Trust pillars, review weighting, complaints, transparency, and score states." },
      { title: "Journal & Tools", body: "How to log trades, track ROI, use calculators, and build trading plans." },
      { title: "Developer Docs", body: "Future API and partner integration documentation will live here as public tooling expands." },
    ],
  },
  status: {
    key: "status",
    eyebrow: "System Status",
    title: "Platform health and availability.",
    description:
      "A public view of RebateBoard service health, scheduled maintenance, recent incidents, and future API availability.",
    kind: "support",
    primaryCta: { label: "Visit Dashboard", to: "/dashboard" },
    secondaryCta: { label: "Contact Support", to: "/contact" },
    features: [
      { title: "Web Platform", body: "Operational status for public pages, dashboards, and account access." },
      { title: "Cashback & Wallet", body: "Claim submission, wallet activity, withdrawal requests, and verification queue health." },
      { title: "Data Services", body: "Brands, offers, TBI, reviews, payouts, and marketplace data availability." },
      { title: "Scheduled Maintenance", body: "Planned updates will be announced here before launch-impacting work begins." },
    ],
  },
  community: {
    key: "community",
    eyebrow: "Community",
    title: "A trader community built around proof.",
    description:
      "RebateBoard community features are designed for verified reviews, payout insights, learning, and transparent discussion instead of noisy signals.",
    kind: "support",
    primaryCta: { label: "Join Dashboard Community", to: "/dashboard/community" },
    secondaryCta: { label: "Write a Review", to: "/review" },
    features: [
      { title: "Verified Conversations", body: "Discussions tied to real trading journeys, reviews, payouts, and account experience." },
      { title: "Shared Learning", body: "Community insights across brokers, prop firms, exchanges, and trading tools." },
      { title: "Trust Signals", body: "Reviews, helpful votes, and proof-backed experiences help the ecosystem stay useful." },
      { title: "Guided Participation", body: "Clear prompts help traders contribute without turning the platform into a noisy forum." },
    ],
  },
  careers: {
    key: "careers",
    eyebrow: "Careers",
    title: "Build the trust layer for trading.",
    description:
      "RebateBoard is building a remote-first fintech ecosystem for transparency, cashback, rewards, AI, and trader intelligence.",
    kind: "company",
    primaryCta: { label: "Join Talent Community", to: "/contact" },
    secondaryCta: { label: "Learn About Us", to: "/about" },
    features: [
      { title: "Mission-Driven", body: "We work on problems that directly affect trader trust, transparency, and financial outcomes." },
      { title: "Remote-First", body: "Built for focused contributors who can move with ownership and clear communication." },
      { title: "No Open Roles Yet", body: "Public hiring will open as the platform scales after launch." },
      { title: "Future Teams", body: "Product, engineering, data, trust operations, partnerships, support, and education." },
    ],
  },
  press: {
    key: "press",
    eyebrow: "Press",
    title: "RebateBoard press and media kit.",
    description:
      "Company facts, brand assets, launch notes, screenshots, and media contact details for journalists, creators, and partners.",
    kind: "company",
    primaryCta: { label: "Contact Press", to: "/contact" },
    secondaryCta: { label: "How We Make Money", to: "/how-we-make-money" },
    features: [
      { title: "Company Facts", body: "Transparency-first trading ecosystem for cashback, TBI, reviews, tools, and Rebeta AI." },
      { title: "Brand Assets", body: "Logo usage, screenshots, color guidance, and approved public descriptions." },
      { title: "Announcements", body: "Launch updates, product milestones, awards, reports, and marketplace data releases." },
      { title: "Media Contact", body: "Press requests can be routed through RebateBoard contact with the press category selected." },
    ],
  },
  "affiliate-program": {
    key: "affiliate-program",
    eyebrow: "Affiliate Program",
    title: "Partner with RebateBoard transparently.",
    description:
      "Creators, educators, communities, and businesses can refer traders into a platform built around verified value, cashback, reviews, and trust.",
    kind: "company",
    primaryCta: { label: "Apply to Partner", to: "/business/join" },
    secondaryCta: { label: "How We Make Money", to: "/how-we-make-money" },
    features: [
      { title: "Transparent Tracking", body: "Referral journeys are measured through clear links, attribution, and future partner reporting." },
      { title: "Aligned Incentives", body: "Partner value grows when traders find trustworthy brands and meaningful cashback opportunities." },
      { title: "Marketing Materials", body: "Approved product messaging, visual assets, and offer links will expand after launch." },
      { title: "Payment Readiness", body: "Commission workflows are built to connect with RebateBoard finance and partner operations." },
    ],
  },
  "merit-awards": {
    key: "merit-awards",
    eyebrow: "Merit Awards",
    title: "Recognizing brands that earn trust.",
    description:
      "RebateBoard Merit Awards highlight transparent, trader-first brands based on evidence, reviews, payouts, complaints, and consistent performance.",
    kind: "company",
    primaryCta: { label: "Explore TBI", to: "/tbi" },
    secondaryCta: { label: "Review a Brand", to: "/review" },
    features: [
      { title: "Purpose", body: "Celebrate brands that deliver strong trader outcomes, not just loud marketing." },
      { title: "Categories", body: "Cashback, payouts, transparency, support, education, tools, and trader experience." },
      { title: "Selection Philosophy", body: "Awards should reflect data, verified reviews, and transparent criteria." },
      { title: "Timeline", body: "Public nominations and award cycles will expand as the community dataset matures." },
    ],
  },
  reports: {
    key: "reports",
    eyebrow: "Reports",
    title: "Public reports for a more transparent market.",
    description:
      "Industry reports, transparency updates, cashback trends, review insights, and market observations built from RebateBoard ecosystem data.",
    kind: "insight",
    primaryCta: { label: "Read Blog", to: "/blog" },
    secondaryCta: { label: "Explore Analytics", to: "/analytics" },
    features: [
      { title: "Transparency Reports", body: "Updates on reviews, complaints, payouts, TBI coverage, and marketplace trust signals." },
      { title: "Market Insights", body: "Data-led observations across prop firms, brokers, exchanges, tools, and education." },
      { title: "Cashback Trends", body: "How trader rewards, offers, partner activity, and wallet outcomes evolve over time." },
      { title: "Annual Reports", body: "A larger platform report will publish when enough post-launch data is available." },
    ],
  },
  analytics: {
    key: "analytics",
    eyebrow: "Analytics",
    title: "Public marketplace intelligence.",
    description:
      "A public analytics view for industry trends, cashback statistics, TBI insights, and marketplace activity without exposing private user data.",
    kind: "insight",
    primaryCta: { label: "Explore TBI", to: "/tbi" },
    secondaryCta: { label: "View Reports", to: "/reports" },
    features: [
      { title: "TBI Trends", body: "Trust state changes, review momentum, visibility, and marketplace confidence over time." },
      { title: "Cashback Statistics", body: "Public aggregate payout, claim, and reward metrics as the dataset matures." },
      { title: "Marketplace Activity", body: "Brand listings, offers, reviews, payouts, and category growth." },
      { title: "Privacy First", body: "Public analytics only use aggregate data and never expose private trader records." },
    ],
  },
  "market-news": {
    key: "market-news",
    eyebrow: "Market News",
    title: "News that matters to traders.",
    description:
      "A dedicated hub for broker, prop firm, exchange, payout, regulation, cashback, and platform updates curated for real trading decisions.",
    kind: "insight",
    primaryCta: { label: "Read Latest Stories", to: "/blog" },
    secondaryCta: { label: "Explore Academy", to: "/academy" },
    features: [
      { title: "Featured Stories", body: "Important industry updates with direct relevance to traders and brand selection." },
      { title: "Categories", body: "Prop firms, brokers, crypto exchanges, payouts, regulation, tools, and rewards." },
      { title: "Searchable Archive", body: "News and analysis are connected to blog and article infrastructure." },
      { title: "Editorial Context", body: "Stories prioritize clarity and actionability over hype." },
    ],
  },
  "trading-journals": {
    key: "trading-journals",
    eyebrow: "Trading Journal",
    title: "Turn every trade into a lesson.",
    description:
      "Record decisions, outcomes, screenshots, emotions, strategy context, and risk details so your trading history becomes useful evidence instead of scattered notes.",
    kind: "product",
    primaryCta: { label: "Start Your Trading Journal", to: "/dashboard/trades" },
    secondaryCta: { label: "Build a Trading Plan", to: "/trading-plan" },
    features: [
      { title: "Market-aware logging", body: "Journal fields adapt around forex, crypto, indices, commodities, stocks, and futures so traders capture the details that matter." },
      { title: "Before and after evidence", body: "Attach trade screenshots and notes to create a visual diary of what you planned, what happened, and what changed." },
      { title: "Backend calculations", body: "Saved trades feed calculated performance values such as profit/loss, RR, win/loss status, and risk context." },
      { title: "Rebeta-ready memory", body: "Journal entries give Rebeta better context for future coaching around mistakes, setups, risk, and psychology." },
    ],
    sections: [
      {
        title: "The real journal workflow",
        body: "A journal entry follows the natural trade review process from setup to outcome.",
        bullets: ["Select market and instrument", "Record entry, exit, stop loss, and target", "Add strategy and trading-plan context", "Upload before-and-after screenshots", "Write emotions and notes", "Review analytics and Rebeta insights"],
      },
      {
        title: "From entry to intelligence",
        body: "Each saved trade can support analytics, plan comparison, and future Rebeta coaching. The goal is not to collect data for its own sake; it is to help traders notice patterns early.",
        bullets: ["Best-performing setups", "Recurring execution mistakes", "Best and worst sessions", "Risk consistency", "Plan adherence", "Emotional patterns"],
      },
      {
        title: "Product preview",
        body: "The dashboard journal is built around trade cards, calculation summaries, screenshots, notes, and a complete trade detail view that feels like opening a personal trading diary.",
      },
    ],
    related: [
      { title: "Trading Plan", body: "Compare each journaled trade against your own rules.", to: "/trading-plan", label: "Build rules" },
      { title: "Rebeta AI", body: "Use your journal context for better trade review conversations.", to: "/rebeta-ai", label: "Meet Rebeta" },
      { title: "Trader TBI", body: "Consistent verified activity can strengthen your trader profile.", to: "/trader-tbi", label: "View Trader TBI" },
    ],
    faqs: [
      { q: "Can I upload trade screenshots?", a: "Yes. The journal supports before-and-after screenshots so trades can be reviewed visually, not only through numbers." },
      { q: "Does the form change by market?", a: "The journal experience is designed to capture market-specific fields so forex, crypto, indices, commodities, stocks, and futures do not feel like the same generic form." },
      { q: "Can Rebeta use my journal?", a: "Journal data can give Rebeta better context for future analysis and coaching inside RebateBoard." },
    ],
  },
  "trading-plan": {
    key: "trading-plan",
    eyebrow: "Trading Plan",
    title: "Trade with rules, not impulse.",
    description:
      "Create the operating framework for your trading: goals, strategy, risk limits, trading windows, entry rules, exit rules, daily checklist, and psychology guardrails.",
    kind: "product",
    primaryCta: { label: "Build Your Trading Plan", to: "/dashboard/trading-plan" },
    secondaryCta: { label: "Open Trading Journal", to: "/trading-journals" },
    features: [
      { title: "Risk model", body: "Define how much you can risk, when to stop, and what conditions invalidate a trade." },
      { title: "Strategy blueprint", body: "Document setups, markets, sessions, entry triggers, exits, and review routines." },
      { title: "Daily guardrails", body: "Turn discipline into a checklist that helps prevent revenge trading, overtrading, and strategy hopping." },
      { title: "Plan-aware coaching", body: "Rebeta can use your plan as context when reviewing trades and performance behavior." },
    ],
    sections: [
      {
        title: "The cost of trading without a plan",
        body: "Most trading mistakes are not caused by a missing indicator. They come from undefined rules, unclear risk, emotional exits, and inconsistent review habits.",
        bullets: ["Inconsistent position sizing", "Revenge trading", "Undefined daily limits", "Strategy hopping", "No review standard"],
      },
      {
        title: "Build your blueprint",
        body: "The plan walks through the core structure a trader needs before decisions become emotional.",
        bullets: ["Trader profile", "Goals", "Strategy", "Risk model", "Entry checklist", "Exit rules", "Psychology rules", "Daily limits"],
      },
      {
        title: "Connected to your journal",
        body: "When trades are logged, RebateBoard can compare what happened with the rules you said you wanted to follow. That makes review sharper than a normal notes app.",
      },
    ],
    related: [
      { title: "Trading Journal", body: "Log trades and compare them against your plan.", to: "/trading-journals", label: "Log trades" },
      { title: "Rebeta AI", body: "Ask for coaching that understands your rules.", to: "/rebeta-ai", label: "Ask Rebeta" },
      { title: "AI Backtesting Lab", body: "Test strategy ideas before adding them to your plan.", to: "/ai-backtesting-lab", label: "Test ideas" },
    ],
    faqs: [
      { q: "Is the plan only for advanced traders?", a: "No. It is useful for beginners who need structure and experienced traders who want consistency." },
      { q: "Can I update my plan later?", a: "Yes. A trading plan should evolve as your data and behavior become clearer." },
      { q: "How does it help Rebeta?", a: "Your plan gives Rebeta context about your intended rules, risk limits, and review standards." },
    ],
  },
  "ai-backtesting-lab": {
    key: "ai-backtesting-lab",
    eyebrow: "AI Backtesting Lab",
    title: "Test the strategy before you trade it.",
    description:
      "Structure trading ideas into testable rules, review historical-style scenarios, and understand whether a strategy deserves more attention before risking capital.",
    kind: "product",
    primaryCta: { label: "Open Backtesting Lab", to: "/dashboard/backtest" },
    secondaryCta: { label: "Build a Trading Plan", to: "/trading-plan" },
    features: [
      { title: "Strategy inputs", body: "Define market, timeframe, entry conditions, exit logic, stop loss, take profit, risk, session, and date context where supported." },
      { title: "Performance outputs", body: "Review outcomes such as win rate, drawdown, expectancy, profit factor, losing streaks, and best or worst conditions when available." },
      { title: "Overfitting awareness", body: "The page explains that historical testing is not a guarantee and that data quality, execution, and market regime matter." },
      { title: "Plan connection", body: "Promising strategy rules can inform your Trading Plan instead of staying as loose notes." },
    ],
    sections: [
      {
        title: "Define the strategy clearly",
        body: "Backtesting starts by turning a vague idea into conditions that can be reviewed. The stronger the rule definition, the more useful the review becomes.",
        bullets: ["Market and timeframe", "Entry and exit conditions", "Risk per trade", "Stop loss and take profit", "Session and date context"],
      },
      {
        title: "Understand the output",
        body: "The lab is intended to help traders read a strategy more honestly: not only whether it wins, but how it behaves when it loses.",
        bullets: ["Win rate", "Net result", "Drawdown", "Expectancy", "Profit factor", "Losing streak", "Best and worst conditions"],
      },
      {
        title: "Use results responsibly",
        body: "Backtesting can help traders prepare, but historical results never guarantee live execution. Spreads, slippage, rule discipline, and market conditions still matter.",
      },
    ],
    related: [
      { title: "Trading Plan", body: "Turn tested rules into an operating framework.", to: "/trading-plan", label: "Update plan" },
      { title: "Trading Journal", body: "Compare backtested ideas with real logged trades.", to: "/trading-journals", label: "Review trades" },
      { title: "Rebeta AI", body: "Discuss results and next steps with Rebeta.", to: "/rebeta-ai", label: "Ask Rebeta" },
    ],
    faqs: [
      { q: "Does backtesting guarantee results?", a: "No. It is a preparation and research tool, not a prediction engine." },
      { q: "What should I test first?", a: "Start with one clear setup, one market, one timeframe, and strict entry and exit rules." },
      { q: "Can tested strategies connect to my plan?", a: "The workflow is designed so useful strategy rules can inform your Trading Plan." },
    ],
  },
  "trader-tbi": {
    key: "trader-tbi",
    eyebrow: "Trader TBI",
    title: "Build a trading reputation you can prove.",
    description:
      "Trader TBI is your personal trust and consistency profile inside RebateBoard. It is separate from Brand TBI and focuses on your verified activity, contribution quality, and trading discipline.",
    kind: "product",
    primaryCta: { label: "View Your Trader TBI", to: "/dashboard/tbi" },
    secondaryCta: { label: "Learn Brand TBI", to: "/tbi" },
    features: [
      { title: "Personal trust profile", body: "Reflects meaningful account activity such as profile completion, verified actions, reviews, journal consistency, and platform contribution." },
      { title: "Improvement actions", body: "Shows practical steps that can strengthen your profile, such as completing your profile, logging trades, and contributing verified reviews." },
      { title: "Privacy-aware identity", body: "Your public identity should be controlled. Private trading details should not be exposed without permission." },
      { title: "Trader Levels", body: "Progression connects with Explorer, Bronze Trader, Silver Trader, Gold Trader, and future platform benefits." },
    ],
    sections: [
      {
        title: "What Trader TBI measures",
        body: "Trader TBI is not a brand ranking. It is a signal for your own consistency and verified participation in the RebateBoard ecosystem.",
        bullets: ["Profile completeness", "Verified activity", "Journal consistency", "Plan adherence", "Reviews and contributions", "Linked trading activity where available", "Community behavior"],
      },
      {
        title: "How the score grows",
        body: "The score should grow through useful activity, not passive logins. RebateBoard emphasizes actions that make the platform more trustworthy and your own trading more measurable.",
        bullets: ["Provide verified data", "Maintain meaningful activity", "Follow risk rules", "Complete relevant platform actions"],
      },
      {
        title: "Shareable identity",
        body: "Trader TBI can support future verified profiles and performance cards so traders can show achievements without exposing private account details.",
      },
    ],
    related: [
      { title: "Trading Journal", body: "Consistency starts with reliable trade records.", to: "/trading-journals", label: "Start journaling" },
      { title: "Rebate Rewards", body: "Useful activity can also support RR progression.", to: "/rebate-rewards", label: "Explore RR" },
      { title: "Trader Return Tracker", body: "Connect identity with real financial return tracking.", to: "/trt", label: "Track returns" },
    ],
    faqs: [
      { q: "Is Trader TBI the same as Brand TBI?", a: "No. Brand TBI evaluates listed trading brands. Trader TBI reflects a user's own verified activity and consistency." },
      { q: "Is my private data public?", a: "Private financial and trading details should remain protected unless you intentionally share approved fields." },
      { q: "Can it improve over time?", a: "Yes. Meaningful verified activity and consistency are designed to improve your profile." },
    ],
  },
  trt: {
    key: "trt",
    eyebrow: "Trader Return Tracker",
    title: "Know what trading is really returning to you.",
    description:
      "Track the complete financial return journey: purchases, reset fees, trading costs, payouts, cashback, income, expenses, net result, and ROI.",
    kind: "product",
    primaryCta: { label: "Track My ROI", to: "/dashboard/accounts" },
    secondaryCta: { label: "See Payout Tracker", to: "/payouts" },
    features: [
      { title: "Complete cost picture", body: "Track challenge purchases, reset fees, subscriptions, broker costs, and other trading expenses in one place." },
      { title: "Return tracking", body: "Record payouts, cashback, refunds, and income so the final number reflects actual recovery and return." },
      { title: "Leakage detection", body: "Repeated resets, inactive purchases, and missed cashback can become visible before they quietly drain capital." },
      { title: "Verified share cards", body: "Trader Return Tracker connects with RebateBoard Performance Cards so milestones can be shared with public verification." },
    ],
    sections: [
      {
        title: "What Trader Return Tracker records",
        body: "The goal is to answer one hard question: after all costs and returns, are you actually ahead?",
        bullets: ["Challenge purchases", "Reset fees", "Broker or trading costs", "Payouts", "Cashback", "Other income and expenses"],
      },
      {
        title: "Core metrics",
        body: "Trader Return Tracker focuses on capital allocation: what you spent, what came back, which brands or programs performed, and where costs are repeating.",
        bullets: ["Total spend", "Total returned", "Net result", "ROI", "Cost recovery", "Best-performing brand or program"],
      },
      {
        title: "Rebeta financial intelligence",
        body: "Trader Return Tracker data prepares Rebeta to identify trends such as repeated costs, recovery through cashback, and month-over-month return changes as the connected intelligence layer matures.",
      },
    ],
    related: [
      { title: "Cashback Calculator", body: "Estimate potential cost recovery before choosing a partner.", to: "/cashback-calculator", label: "Calculate" },
      { title: "Payout Tracker", body: "Compare public payout behavior across brands.", to: "/payouts", label: "Explore payouts" },
      { title: "Rebeta AI", body: "Ask Rebeta to help interpret your return picture.", to: "/rebeta-ai", label: "Ask Rebeta" },
    ],
    faqs: [
      { q: "Is Trader Return Tracker only for prop firms?", a: "No. It is designed around the wider financial journey: prop firms, brokers, exchanges, costs, payouts, cashback, and income." },
      { q: "Does Trader Return Tracker replace accounting software?", a: "No. It is a trading-performance and return tracker, not tax or accounting advice." },
      { q: "Can I share achievements?", a: "Trader Return Tracker connects with RebateBoard Performance Cards for verified shareable milestones." },
    ],
  },
  "rebeta-ai": {
    key: "rebeta-ai",
    eyebrow: "Rebeta AI",
    title: "Your trading intelligence, connected.",
    description:
      "Rebeta is RebateBoard's trading copilot for platform guidance, risk education, journal review, trading-plan support, brand questions, and multilingual assistance.",
    kind: "product",
    primaryCta: { label: "Ask Rebeta", to: "/dashboard/ai-coach" },
    secondaryCta: { label: "Start a Journal", to: "/trading-journals" },
    features: [
      { title: "Platform guidance", body: "Ask how RebateBoard features work, where to go next, and how cashback, rewards, TBI, reviews, and tools connect." },
      { title: "Trading context", body: "Rebeta is designed to use your journal, plan, Trader Return Tracker, rewards, TBI, and cashback context where integration is available." },
      { title: "Multilingual support", body: "The assistant supports multilingual conversations so users can ask questions in the language they are most comfortable using." },
      { title: "Image analysis", body: "Uploaded screenshots can be read for supported analysis workflows, helping users discuss charts, trade notes, or platform evidence." },
    ],
    sections: [
      {
        title: "What Rebeta can help with today",
        body: "Rebeta should feel like a product-level copilot, not a generic chat box.",
        bullets: ["RebateBoard feature support", "Broker and prop-firm questions", "Risk education", "Trading Journal guidance", "Trading Plan guidance", "Cashback and TBI explanations"],
      },
      {
        title: "One assistant across RebateBoard",
        body: "The long-term design is a connected assistant that understands the user's RebateBoard journey. Current integrations are expanded carefully so Rebeta only claims context it can actually use.",
        bullets: ["Journal context", "Trading Plan context", "Trader Return Tracker and financial data", "Rewards progress", "TBI and brand information", "Cashback and payout workflows"],
      },
      {
        title: "Safety and boundaries",
        body: "Rebeta provides education, analysis, and platform guidance. It does not guarantee trading outcomes and should not be treated as regulated financial advice.",
      },
    ],
    related: [
      { title: "Trading Plan", body: "Give Rebeta your rules before asking for coaching.", to: "/trading-plan", label: "Create plan" },
      { title: "Trading Journal", body: "Give Rebeta better memory through structured trade logs.", to: "/trading-journals", label: "Log trades" },
      { title: "Trader Return Tracker", body: "Prepare return data for financial intelligence.", to: "/trt", label: "Track returns" },
    ],
    faqs: [
      { q: "Is Rebeta a trading signal service?", a: "No. Rebeta is for education, analysis, workflow guidance, and platform support, not guaranteed-profit signals." },
      { q: "Can Rebeta read screenshots?", a: "The assistant supports image-upload analysis workflows where the uploaded file can be processed safely." },
      { q: "Does Rebeta know my private data?", a: "Rebeta should only use authorized RebateBoard context and privacy-safe information relevant to the request." },
    ],
  },
  "rebate-rewards": {
    key: "rebate-rewards",
    eyebrow: "Rebate Rewards",
    title: "Your activity should reward you.",
    description:
      "Rebate Rewards turns meaningful platform activity into RR progression, trader levels, streaks, badges, and future unlocks. RR is a progression system, not a cash currency.",
    kind: "product",
    primaryCta: { label: "Explore Rebate Rewards", to: "/dashboard/rewards" },
    secondaryCta: { label: "Browse Cashback", to: "/cashback" },
    features: [
      { title: "Earn through useful actions", body: "RR can come from verified reviews, referrals, profile completion, journal milestones, linked accounts, approved campaigns, and learning activity." },
      { title: "Trader Levels", body: "Progress through Explorer, Bronze Trader, Silver Trader, Gold Trader, and future levels as your RebateBoard activity grows." },
      { title: "Trading Streaks", body: "Streaks reward eligible activity such as journaling, reviews, plan tasks, lessons, cashback claims, and Rebeta usage." },
      { title: "Next unlocks", body: "Rewards point users toward funded challenges, academy access, AI features, cashback boosts, badges, and giveaways as they become available." },
    ],
    sections: [
      {
        title: "How traders earn RR",
        body: "Rebate Rewards is built around meaningful activity, not passive logins.",
        bullets: ["Submit verified reviews", "Refer traders", "Complete profile milestones", "Log journal activity", "Link eligible accounts", "Complete approved missions"],
      },
      {
        title: "How RR can be used",
        body: "Utilities depend on what is enabled by RebateBoard and participating partners. Unavailable rewards should be clearly marked as upcoming in the dashboard.",
        bullets: ["Discounts", "Academy access", "Badges", "Platform perks", "Sponsored opportunities", "Future reward utilities"],
      },
      {
        title: "Streaks and milestones",
        body: "Trading Streaks should be maintained by meaningful actions. If a user misses the required activity before the next milestone, streak progress resets while previously earned RR remains untouched.",
      },
    ],
    related: [
      { title: "Cashback", body: "Reduce trading costs while earning platform progress.", to: "/cashback", label: "Explore cashback" },
      { title: "Trading Journal", body: "Eligible journal activity can support consistency.", to: "/trading-journals", label: "Start journaling" },
      { title: "Trader TBI", body: "Rewards and verified activity support your trader identity.", to: "/trader-tbi", label: "Build profile" },
    ],
    faqs: [
      { q: "Is RR money?", a: "No. RR is a progression and rewards system, not a cash currency." },
      { q: "Does logging in keep a streak?", a: "No. Streaks should be maintained by eligible actions, not passive login activity." },
      { q: "Are all rewards available now?", a: "Only enabled rewards should appear as active. Future rewards should be clearly marked as upcoming." },
    ],
  },
  "cashback-calculator": {
    key: "cashback-calculator",
    eyebrow: "Cashback Calculator",
    title: "See what your trading activity could return.",
    description:
      "Estimate potential cashback before choosing a partner. Adjust trading activity, volume, lot size, commission or rebate assumptions, and time period to understand possible cost recovery.",
    kind: "product",
    primaryCta: { label: "Open Calculator", to: "/cashback-calculator" },
    secondaryCta: { label: "Browse Cashback Partners", to: "/cashback" },
    features: [
      { title: "Interactive estimate", body: "Use trading variables such as volume, lot size, number of trades, rate assumptions, and time period where supported." },
      { title: "Monthly and annual view", body: "Translate trade activity into estimated cashback ranges over a practical time horizon." },
      { title: "Assumption clarity", body: "Results should explain what was assumed so users do not mistake an estimate for a guaranteed payout." },
      { title: "Partner discovery", body: "Move from the estimate into eligible cashback programs and brand profiles." },
    ],
    sections: [
      {
        title: "What the calculator asks for",
        body: "The calculator focuses on variables that materially affect estimated cashback.",
        bullets: ["Provider or market", "Trading volume", "Lot size", "Number of trades", "Commission or rebate rate", "Time period"],
      },
      {
        title: "What the result shows",
        body: "A useful result should explain possible cashback, effective cost reduction, and assumptions without pretending to verify future activity.",
        bullets: ["Estimated cashback", "Monthly estimate", "Annual estimate", "Effective cost reduction", "Calculation assumptions"],
      },
      {
        title: "Estimate, then verify",
        body: "Actual cashback depends on provider conditions, tracking, eligibility, and verified activity. RebateBoard uses claims and wallet workflows to handle the real payout process.",
      },
    ],
    related: [
      { title: "Cashback", body: "Learn how cashback works before joining a partner.", to: "/cashback", label: "Learn cashback" },
      { title: "Trader Return Tracker", body: "Track whether cashback reduces your real trading costs.", to: "/trt", label: "Track returns" },
      { title: "Payout Tracker", body: "Review payout behavior before choosing a brand.", to: "/payouts", label: "View payouts" },
    ],
    faqs: [
      { q: "Are calculator results guaranteed?", a: "No. Results are estimates and depend on final provider terms, eligibility, and verified activity." },
      { q: "Can I compare brands?", a: "The calculator is designed to help users understand possible cashback and then browse eligible partners." },
      { q: "Where do I claim cashback?", a: "Cashback claims are handled through RebateBoard's claim and wallet workflow after eligible activity is verified." },
    ],
  },
  "top-prop-firm-sellers": {
    key: "top-prop-firm-sellers",
    eyebrow: "Top Sellers",
    title: "Top prop firm sellers, explained.",
    description:
      "A public ranking experience for monthly prop firm demand, offer performance, trader interest, and trust context.",
    kind: "marketplace",
    primaryCta: { label: "Browse Prop Firms", to: "/programs" },
    secondaryCta: { label: "Compare Firms", to: "/compare" },
    features: [
      { title: "Current Rankings", body: "Seller rankings are designed to connect marketplace demand with transparent trust data." },
      { title: "Methodology", body: "Performance, reviews, offers, TBI, and payout context help prevent rankings from becoming pure advertising." },
      { title: "Monthly Updates", body: "The page is structured for recurring updates as transaction and marketplace data expands." },
      { title: "Historical Winners", body: "Future months can show previous leaders and category-level winners." },
    ],
  },
  bonuses: marketplaceOfferPage("bonuses", "Bonuses", "Trading bonuses without the confusion.", "Browse bonus-style promotions with clear eligibility, terms, brand context, and trust signals."),
  promotions: marketplaceOfferPage("promotions", "Promotions", "Featured trading promotions.", "See active promotional campaigns from listed brands, including discounts, cashback, and limited partner offers."),
  coupons: marketplaceOfferPage("coupons", "Coupons", "Promo codes and coupon offers.", "Find codes, terms, expiry windows, and claim guidance without digging through scattered posts."),
  deals: marketplaceOfferPage("deals", "Deals", "Current trader deals.", "A focused view of active deals across prop firms, brokers, exchanges, tools, and education providers."),
};

function marketplaceOfferPage(key: string, title: string, headline: string, description: string): PublicInfoPageConfig {
  return {
    key,
    eyebrow: "Marketplace",
    title: headline,
    description,
    kind: "marketplace",
    primaryCta: { label: "View Active Offers", to: "/offers" },
    secondaryCta: { label: "Browse Programs", to: "/programs" },
    features: [
      { title: "Real Brand Context", body: "Offer pages connect promotions with listed brands, logos, categories, and trust context." },
      { title: "Clear Terms", body: "Eligibility, expiry, code, and claim details are surfaced when available." },
      { title: "Trader-Friendly Filters", body: "Users can move from offer discovery to brand comparison or cashback education." },
      { title: "No Empty Hype", body: `${title} are only useful when connected to real offers and transparent partner terms.` },
    ],
  };
}

export function PublicInfoPage({ page }: { page: PublicInfoPageConfig }) {
  const { user } = useAuth();
  const meta = kindMeta[page.kind];
  const MetaIcon = meta.icon;
  const resolveCtaTo = (to: string) => (!user && to.startsWith("/dashboard") ? "/login" : to);
  const resolveCtaSearch = (to: string) => (!user && to.startsWith("/dashboard") ? { redirect: to } : undefined);

  return (
    <div className="min-h-screen bg-[var(--rb-bg-canvas)] text-white">
      <SiteHeader />
      <main className="container-app py-8 sm:py-12 lg:py-16">
        <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_20%_0%,rgba(126,77,255,0.18),transparent_36%),linear-gradient(135deg,rgba(255,255,255,0.075),rgba(255,255,255,0.025))] p-6 shadow-[0_24px_110px_rgba(88,28,135,0.24)] sm:p-8 lg:p-10">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-violet-300/25 bg-violet-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-violet-100">
              <MetaIcon className="h-3.5 w-3.5" />
              {page.eyebrow}
            </span>
            <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs text-white/65">
              {meta.label}
            </span>
          </div>
          <div className="mt-8 grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
            <div>
              <h1 className="max-w-4xl text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
                {page.title}
              </h1>
              <p className="mt-5 max-w-3xl text-base leading-8 text-white/68 sm:text-lg">
                {page.description}
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                {page.primaryCta && (
                  <Link
                    to={resolveCtaTo(page.primaryCta.to) as any}
                    search={resolveCtaSearch(page.primaryCta.to) as any}
                    className="inline-flex items-center justify-center gap-2 rounded-full rb-gradient-primary px-5 py-3 text-sm font-semibold shadow-[0_0_30px_rgba(192,132,252,0.32)] transition hover:scale-[1.01]"
                  >
                    {page.primaryCta.label}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                )}
                {page.secondaryCta && (
                  <Link
                    to={resolveCtaTo(page.secondaryCta.to) as any}
                    search={resolveCtaSearch(page.secondaryCta.to) as any}
                    className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/[0.045] px-5 py-3 text-sm font-semibold text-white/85 transition hover:border-violet-300/35 hover:bg-white/[0.08]"
                  >
                    {page.secondaryCta.label}
                  </Link>
                )}
              </div>
            </div>
            <div className="rounded-[1.6rem] border border-white/10 bg-black/20 p-4">
              <div className="grid grid-cols-2 gap-3">
                {page.features.slice(0, 4).map((feature, index) => {
                  const icons = [ShieldCheck, Target, BadgeCheck, Rocket];
                  const Icon = icons[index % icons.length];
                  return (
                  <div key={feature.title} className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
                    <Icon className="h-5 w-5 text-violet-200" />
                    <div className="mt-5 text-sm font-bold leading-5">{feature.title}</div>
                    <div className="mt-2 line-clamp-2 text-xs leading-5 text-white/50">{feature.body}</div>
                  </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {page.features.map((feature) => (
            <article
              key={feature.title}
              className="rounded-[1.5rem] border border-white/10 bg-white/[0.045] p-5 shadow-[0_18px_70px_rgba(42,12,84,0.18)] transition hover:-translate-y-0.5 hover:border-violet-300/25 hover:bg-white/[0.065]"
            >
              <div className="mb-4 grid h-10 w-10 place-items-center rounded-2xl border border-violet-300/20 bg-violet-300/10">
                <Bot className="h-4 w-4 text-violet-100" />
              </div>
              <h2 className="text-base font-bold text-white">{feature.title}</h2>
              <p className="mt-2 text-sm leading-6 text-white/62">{feature.body}</p>
            </article>
          ))}
        </section>

        {page.sections?.length ? (
          <section className="mt-6 grid gap-4 lg:grid-cols-2">
            {page.sections.map((section) => (
              <article key={section.title} className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-6">
                <h2 className="text-xl font-bold">{section.title}</h2>
                <p className="mt-3 text-sm leading-7 text-white/65">{section.body}</p>
                {section.bullets?.length ? (
                  <div className="mt-5 grid gap-2">
                    {section.bullets.map((bullet) => (
                      <div key={bullet} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-black/15 px-4 py-3 text-sm text-white/72">
                        <ClipboardCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
                        <span>{bullet}</span>
                      </div>
                    ))}
                  </div>
                ) : null}
              </article>
            ))}
          </section>
        ) : null}

        {page.related?.length ? (
          <section className="mt-6 rounded-[1.5rem] border border-white/10 bg-white/[0.035] p-5 sm:p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white/[0.06]">
                <Compass className="h-4 w-4 text-violet-100" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Continue your workflow</h2>
                <p className="text-sm text-white/55">Move into the next RebateBoard tool that strengthens this journey.</p>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {page.related.map((item) => (
                <Link
                  key={item.title}
                  to={resolveCtaTo(item.to) as any}
                  search={resolveCtaSearch(item.to) as any}
                  className="group rounded-2xl border border-white/10 bg-black/15 p-4 transition hover:-translate-y-0.5 hover:border-violet-300/25 hover:bg-white/[0.06]"
                >
                  <div className="font-semibold">{item.title}</div>
                  <p className="mt-2 min-h-[3rem] text-sm leading-6 text-white/58">{item.body}</p>
                  <span className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-violet-200">
                    {item.label}
                    <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                  </span>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        {page.faqs?.length ? (
          <section className="mt-6 rounded-[1.5rem] border border-white/10 bg-white/[0.035] p-5 sm:p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white/[0.06]">
                <HelpCircle className="h-4 w-4 text-violet-100" />
              </div>
              <div>
                <h2 className="text-xl font-bold">FAQ</h2>
                <p className="text-sm text-white/55">Clear answers before users enter the dashboard.</p>
              </div>
            </div>
            <div className="grid gap-3 lg:grid-cols-3">
              {page.faqs.map((faq) => (
                <article key={faq.q} className="rounded-2xl border border-white/10 bg-black/15 p-4">
                  <h3 className="text-sm font-bold text-white">{faq.q}</h3>
                  <p className="mt-2 text-sm leading-6 text-white/62">{faq.a}</p>
                </article>
              ))}
            </div>
          </section>
        ) : null}
      </main>
      <SiteFooter />
    </div>
  );
}

export const publicPageIcons = {
  Mail,
  Search,
  BookOpen,
  Newspaper,
  GraduationCap,
  CalendarClock,
  BriefcaseBusiness,
  Handshake,
  Trophy,
  Gift,
  CircleDollarSign,
  WalletCards,
  LineChart,
  Radio,
  Megaphone,
};
