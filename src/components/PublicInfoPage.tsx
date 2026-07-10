import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  BookOpen,
  BriefcaseBusiness,
  CalendarClock,
  ChartNoAxesCombined,
  CircleDollarSign,
  ClipboardCheck,
  Compass,
  FileText,
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
  Sparkles,
  Target,
  Trophy,
  WalletCards,
} from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

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
};

const kindMeta: Record<PageKind, { label: string; icon: typeof Sparkles }> = {
  marketplace: { label: "Marketplace", icon: Compass },
  product: { label: "Product", icon: Sparkles },
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
  "trading-plan": productPage("trading-plan", "Trading Plan", "Build rules before emotion takes over.", "Create risk rules, daily checklists, strategy notes, review routines, and AI-guided planning workflows that keep your trading consistent.", [
    "Goal setting", "Risk rules", "Daily checklist", "Performance review"
  ]),
  "ai-backtesting-lab": productPage("ai-backtesting-lab", "AI Backtesting Lab", "Test trading ideas before you risk capital.", "Turn strategy notes, market assumptions, and real trade examples into structured backtest plans, reports, and AI-guided improvement loops.", [
    "Strategy inputs", "Scenario reports", "Performance charts", "AI insights"
  ]),
  "trader-tbi": productPage("trader-tbi", "Trader TBI", "Your personal trust and consistency score.", "Trader TBI is designed to help users understand their own reliability, contribution quality, verification status, and platform activity over time.", [
    "Personal trust score", "Improvement tips", "Performance history", "Future leaderboard"
  ]),
  trt: productPage("trt", "Trader Return Tracker", "Understand your real trading ROI.", "Track deposits, subscriptions, payouts, fees, cashback, and trading outcomes to see the true economics of your trading journey.", [
    "ROI tracking", "Income and costs", "Account analytics", "Financial insights"
  ]),
  "rebeta-ai": productPage("rebeta-ai", "Rebeta AI", "Your AI trading operations assistant.", "Rebeta helps traders turn journal data, plans, reviews, risk rules, and platform activity into clearer next steps and smarter routines.", [
    "AI coaching", "Trade analysis", "Psychology support", "Workflow guidance"
  ]),
  "rebate-rewards": productPage("rebate-rewards", "Rebate Rewards", "Progress through meaningful trader activity.", "Earn RR from verified contributions, learning, referrals, claims, reviews, and consistent platform use. RR is a progression system, not a cash balance.", [
    "Trader levels", "Streaks", "Next unlocks", "Reward milestones"
  ]),
  "cashback-calculator": productPage("cashback-calculator", "Cashback Calculator", "Estimate cashback before you trade.", "Compare potential rebates by brand, asset, lot size, account type, and trading frequency using rates prepared for live marketplace updates.", [
    "Live estimates", "Broker rates", "Asset support", "Clear assumptions"
  ], "/cashback"),
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

function productPage(
  key: string,
  title: string,
  headline: string,
  description: string,
  labels: string[],
  primaryTo = "/dashboard",
): PublicInfoPageConfig {
  return {
    key,
    eyebrow: title,
    title: headline,
    description,
    kind: "product",
    primaryCta: { label: "Open Dashboard", to: primaryTo },
    secondaryCta: { label: "Create Free Account", to: "/signup" },
    features: labels.map((label) => ({
      title: label,
      body: `${title} is built to connect with RebateBoard's wider trader operating system while keeping workflows clear, actionable, and launch-ready.`,
    })),
    sections: [
      {
        title: `How ${title} Fits RebateBoard`,
        body:
          "This product page introduces the public value of the feature while the full workflow lives inside the user dashboard for logged-in traders.",
      },
    ],
  };
}

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
  const meta = kindMeta[page.kind];
  const MetaIcon = meta.icon;

  return (
    <div className="min-h-screen bg-[#0d0420] text-white">
      <SiteHeader />
      <main className="container-app py-8 sm:py-12 lg:py-16">
        <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_20%_0%,rgba(217,70,239,0.18),transparent_36%),linear-gradient(135deg,rgba(255,255,255,0.075),rgba(255,255,255,0.025))] p-6 shadow-[0_24px_110px_rgba(88,28,135,0.24)] sm:p-8 lg:p-10">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-fuchsia-300/25 bg-fuchsia-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-fuchsia-100">
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
                    to={page.primaryCta.to as any}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-600 px-5 py-3 text-sm font-semibold shadow-[0_0_30px_rgba(192,132,252,0.32)] transition hover:scale-[1.01]"
                  >
                    {page.primaryCta.label}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                )}
                {page.secondaryCta && (
                  <Link
                    to={page.secondaryCta.to as any}
                    className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/[0.045] px-5 py-3 text-sm font-semibold text-white/85 transition hover:border-fuchsia-300/35 hover:bg-white/[0.08]"
                  >
                    {page.secondaryCta.label}
                  </Link>
                )}
              </div>
            </div>
            <div className="rounded-[1.6rem] border border-white/10 bg-black/20 p-4">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Transparency", value: "First", icon: ShieldCheck },
                  { label: "Trader Value", value: "Built In", icon: Target },
                  { label: "Trust Signals", value: "Connected", icon: BadgeCheck },
                  { label: "Launch Ready", value: "Scalable", icon: Rocket },
                ].map(({ label, value, icon: Icon }) => (
                  <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
                    <Icon className="h-5 w-5 text-fuchsia-200" />
                    <div className="mt-5 text-lg font-bold">{value}</div>
                    <div className="text-xs uppercase tracking-[0.18em] text-white/45">{label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {page.features.map((feature) => (
            <article
              key={feature.title}
              className="rounded-[1.5rem] border border-white/10 bg-white/[0.045] p-5 shadow-[0_18px_70px_rgba(42,12,84,0.18)] transition hover:-translate-y-0.5 hover:border-fuchsia-300/25 hover:bg-white/[0.065]"
            >
              <div className="mb-4 grid h-10 w-10 place-items-center rounded-2xl border border-fuchsia-300/20 bg-fuchsia-300/10">
                <Sparkles className="h-4 w-4 text-fuchsia-100" />
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

        <section className="mt-6 rounded-[1.5rem] border border-white/10 bg-white/[0.035] p-5 sm:p-6">
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { title: "Related", body: "Move naturally into the next RebateBoard workflow.", icon: Compass },
              { title: "Useful Today", body: "Built as a real launch page, not a placeholder.", icon: FileText },
              { title: "Expandable", body: "Structured so the page can grow with live marketplace data later.", icon: ChartNoAxesCombined },
            ].map(({ title, body, icon: Icon }) => (
              <div key={title} className="flex gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-white/[0.06]">
                  <Icon className="h-4 w-4 text-violet-100" />
                </div>
                <div>
                  <div className="font-semibold">{title}</div>
                  <p className="mt-1 text-sm leading-6 text-white/58">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
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
