import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Bot,
  Brain,
  Building2,
  Calculator,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock,
  Crown,
  Gem,
  Gift,
  Layers,
  LineChart,
  MessageSquare,
  NotebookTabs,
  Rocket,
  Route as RouteIcon,
  ShieldCheck,
  Sparkles,
  Trophy,
  Users,
  WalletCards,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

export const Route = createFileRoute("/pricing")({
  component: EarlyAccessPage,
});

type Feature = {
  title: string;
  description: string;
  icon: LucideIcon;
};

const currentFeatures: Feature[] = [
  {
    title: "Cashback System",
    description: "Track eligible cashback and partner rewards from one trader wallet.",
    icon: WalletCards,
  },
  {
    title: "Trusted Brand Index (TBI)",
    description: "Research brands with transparent trust signals, reviews, and risk context.",
    icon: ShieldCheck,
  },
  {
    title: "Brand Reviews",
    description: "Share verified experiences that help other traders make better decisions.",
    icon: MessageSquare,
  },
  {
    title: "Trading Journal",
    description: "Log trades, patterns, emotions, and performance habits over time.",
    icon: NotebookTabs,
  },
  {
    title: "Trading Plan",
    description: "Build clear trading rules, risk limits, and execution checklists.",
    icon: ClipboardList,
  },
  {
    title: "Payout Tracker",
    description: "Follow payout activity and keep key brand events visible.",
    icon: Trophy,
  },
  {
    title: "Economic Calendar",
    description: "Stay aware of market-moving events before placing risk.",
    icon: CalendarDays,
  },
  {
    title: "Calculators",
    description: "Estimate rebates, risk, margin, position sizing, and trade outcomes.",
    icon: Calculator,
  },
  {
    title: "Rebate Rewards",
    description: "Earn RR through meaningful platform activity and trader contributions.",
    icon: Gift,
  },
  {
    title: "Brand Discovery",
    description: "Compare brokers, prop firms, exchanges, tools, and education providers.",
    icon: Building2,
  },
  {
    title: "Community Features",
    description: "Learn from trader activity, reviews, discussions, and shared signals.",
    icon: Users,
  },
  {
    title: "Basic Rebeta AI",
    description: "Ask questions, explore trading ideas, and get guided platform support.",
    icon: Bot,
  },
];

const proFeatures: Feature[] = [
  { title: "Unlimited AI Conversations", description: "A deeper Rebeta workspace for active research and planning.", icon: Bot },
  { title: "Advanced Trade Analysis", description: "Break down trade behavior, quality, mistakes, and edge patterns.", icon: BarChart3 },
  { title: "AI Trading Psychology", description: "Spot emotional patterns and improve decision discipline.", icon: Brain },
  { title: "Strategy Backtesting", description: "Test structured ideas against historical market conditions.", icon: LineChart },
  { title: "Weekly Performance Reports", description: "Receive clearer summaries of what changed and why.", icon: ClipboardList },
  { title: "Portfolio Intelligence", description: "See trader performance across accounts, brands, and tools.", icon: Layers },
  { title: "Advanced Journal Insights", description: "Turn journal entries into measurable feedback loops.", icon: NotebookTabs },
  { title: "Smart Automation", description: "Reduce repetitive review, research, and reporting work.", icon: Zap },
  { title: "Priority AI Processing", description: "Faster responses and richer context for serious workflows.", icon: Rocket },
  { title: "Advanced Research", description: "Compare brand, market, and strategy information more efficiently.", icon: ShieldCheck },
  { title: "Custom AI Workspaces", description: "Organize strategies, journals, plans, and research by workflow.", icon: Building2 },
  { title: "Future Integrations", description: "Prepared for data, broker, exchange, and analytics connections.", icon: RouteIcon },
];

const founderBenefits: Feature[] = [
  { title: "Founder Badge", description: "A permanent signal that you joined RebateBoard early.", icon: BadgeCheck },
  { title: "3 Months of Rebeta Pro", description: "Complimentary access for a limited period after launch.", icon: Crown },
  { title: "Priority Access", description: "Try new workflows, tools, and intelligence features first.", icon: Rocket },
  { title: "Exclusive RR Rewards", description: "Earn special progression rewards tied to early participation.", icon: Gift },
  { title: "Early Beta Invitations", description: "Help shape new marketplace, AI, and dashboard capabilities.", icon: Sparkles },
  { title: "Community Recognition", description: "Stand out as part of the first generation of RebateBoard traders.", icon: Users },
  { title: "Future Founder Perks", description: "Additional benefits may unlock as the ecosystem matures.", icon: Gem },
];

const roadmap = [
  ["Today", "Early Access Launch", "Open core tools, cashback, TBI, reviews, and Rebeta AI to the first trader community."],
  ["Next", "Community Feedback", "Use real trader behavior and feedback to sharpen the product before premium launch."],
  ["Then", "Feature Expansion", "Add deeper workflows for journals, AI analysis, rewards, and partner visibility."],
  ["Launch", "Rebeta Pro", "Introduce advanced intelligence for traders who want more automation and depth."],
  ["After", "Advanced Marketplace", "Expand transparent discovery, rewards, and brand performance tools."],
  ["Vision", "Global Trading Intelligence Platform", "Build the long-term trust layer for trading decisions worldwide."],
];

const faqs = [
  [
    "Is RebateBoard free?",
    "Yes. RebateBoard is in Early Access, and the core platform is available so traders can experience the value before premium features launch.",
  ],
  [
    "Will it always be free?",
    "RebateBoard will always keep a free tier. Premium tools will add deeper intelligence and automation without removing the essentials.",
  ],
  [
    "What happens after Early Access?",
    "We will use feedback from early traders to improve the platform, then launch Rebeta Pro for users who want advanced AI workflows.",
  ],
  [
    "What is Rebeta Pro?",
    "Rebeta Pro is the future premium intelligence layer for deeper AI conversations, trade analysis, automation, and reporting.",
  ],
  [
    "How long is Early Access?",
    "Early Access remains open while the first public version matures and the community helps us refine the product.",
  ],
  [
    "Will my Founder benefits remain?",
    "Founder benefits are designed to recognize early supporters. Specific access periods and perks will be communicated clearly before Pro launches.",
  ],
  [
    "Do I lose access later?",
    "No. Core transparency, discovery, reviews, cashback, and essential tools will remain available through RebateBoard's free tier.",
  ],
  [
    "Can I upgrade later?",
    "Yes. When Rebeta Pro launches, eligible users will be able to choose whether the advanced plan makes sense for them.",
  ],
];

function FeatureCard({ item, badge }: { item: Feature; badge?: string }) {
  const Icon = item.icon;
  return (
    <article className="group glass rounded-2xl p-4 transition duration-300 hover:-translate-y-0.5 hover:border-white/35 hover:bg-white/[0.06]">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-primary/12 text-primary ring-1 ring-primary/20 transition group-hover:bg-primary/18">
          <Icon className="h-5 w-5" strokeWidth={2} />
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-bold text-white">{item.title}</h3>
            {badge ? (
              <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.16em] text-violet-100/70 ring-1 ring-white/10">
                {badge}
              </span>
            ) : null}
          </div>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{item.description}</p>
        </div>
      </div>
    </article>
  );
}

function SectionHeading({
  eyebrow,
  title,
  copy,
}: {
  eyebrow?: string;
  title: string;
  copy?: string;
}) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      {eyebrow ? (
        <span className="inline-flex items-center gap-2 rounded-full bg-primary/12 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-primary ring-1 ring-primary/25">
          <Sparkles className="h-3.5 w-3.5" /> {eyebrow}
        </span>
      ) : null}
      <h2 className="mt-4 text-3xl font-bold leading-tight sm:text-4xl">{title}</h2>
      {copy ? <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">{copy}</p> : null}
    </div>
  );
}

function EarlyAccessPage() {
  return (
    <div className="min-h-screen overflow-x-hidden">
      <SiteHeader />
      <main className="container-app pb-16 pt-8 sm:pt-12">
        <section className="relative overflow-hidden rounded-[2rem] border border-white/12 bg-white/[0.035] px-5 py-12 shadow-[0_24px_90px_rgba(8,2,18,0.38)] sm:px-8 sm:py-16 lg:px-12">
          <div className="pointer-events-none absolute -left-28 top-0 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
          <div className="pointer-events-none absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-violet-500/20 blur-3xl" />
          <div className="relative mx-auto max-w-4xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary/12 px-4 py-1.5 text-[11px] font-black uppercase tracking-[0.24em] text-primary ring-1 ring-primary/25">
              <Rocket className="h-3.5 w-3.5" /> Early Access
            </span>
            <h1 className="mt-6 text-4xl font-black leading-[1.03] sm:text-6xl lg:text-7xl">
              Welcome to the Beginning of <span className="text-gradient">RebateBoard</span>
            </h1>
            <p className="mx-auto mt-6 max-w-3xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              RebateBoard is currently in Early Access. Every trader who joins today helps shape
              the future of the world's first transparency-first trading ecosystem.
            </p>
            <p className="mx-auto mt-4 max-w-3xl text-sm leading-relaxed text-white/62 sm:text-base">
              Instead of asking traders to pay before experiencing value, we're opening the
              platform to our community first.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                to="/signup"
                className="inline-flex h-12 items-center justify-center rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-600 px-6 text-sm font-bold text-white shadow-[0_0_30px_rgba(192,132,252,0.38)] transition hover:-translate-y-0.5"
              >
                Create Free Account
              </Link>
              <Link
                to="/dashboard/ai-coach"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-white/[0.055] px-6 text-sm font-bold text-white ring-1 ring-white/15 transition hover:-translate-y-0.5 hover:bg-white/[0.08]"
              >
                Explore Rebeta AI <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        <section className="mt-6 glass-strong rounded-3xl p-5 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-sm font-black text-white">Early Access Commitment</div>
              <p className="mt-1 max-w-4xl text-sm leading-relaxed text-muted-foreground">
                Every trader who joins before the end of Early Access will receive exclusive
                Founding Trader benefits and complimentary access to Rebeta Pro for a limited
                period after launch.
              </p>
            </div>
            <Sparkles className="h-8 w-8 shrink-0 text-primary" />
          </div>
        </section>

        <section className="mt-16 grid items-center gap-6 lg:grid-cols-[0.92fr_1.08fr]">
          <div>
            <span className="text-xs font-black uppercase tracking-[0.24em] text-primary">
              Why we're doing this
            </span>
            <h2 className="mt-3 text-3xl font-bold leading-tight sm:text-4xl">
              Trust Comes Before Revenue
            </h2>
            <div className="mt-5 space-y-4 text-sm leading-relaxed text-muted-foreground">
              <p>We believe trust should be earned, not sold.</p>
              <p>
                Most platforms ask traders to pay before proving their value. RebateBoard does the
                opposite. During Early Access, nearly every feature is available so traders can
                experience the platform first.
              </p>
              <p>Your feedback helps shape the future of Rebeta Pro.</p>
            </div>
          </div>
          <div className="glass-strong rounded-[2rem] p-5 sm:p-6">
            <div className="grid gap-3">
              {[
                ["Experience first", "Use the tools before premium plans exist."],
                ["Feedback second", "Help shape the product around real trader needs."],
                ["Revenue later", "Premium arrives only after the value is proven."],
              ].map(([title, copy], index) => (
                <div
                  key={title}
                  className="flex items-center gap-4 rounded-2xl bg-white/[0.045] p-4 ring-1 ring-white/10"
                >
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary/12 text-sm font-black text-primary ring-1 ring-primary/20">
                    0{index + 1}
                  </span>
                  <div>
                    <div className="text-sm font-bold text-white">{title}</div>
                    <p className="mt-1 text-xs text-muted-foreground">{copy}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-18 sm:mt-20">
          <SectionHeading
            eyebrow="Available today"
            title="Everything You Need. Free."
            copy="Early Access gives traders the core ecosystem first, with fair AI usage limits while the platform grows."
          />
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {currentFeatures.map((item) => (
              <FeatureCard key={item.title} item={item} />
            ))}
          </div>
          <p className="mt-5 text-center text-xs font-semibold uppercase tracking-[0.18em] text-violet-100/55">
            Only fair AI usage limits apply during Early Access.
          </p>
        </section>

        <section className="mt-18 sm:mt-20">
          <SectionHeading
            eyebrow="Coming soon"
            title="Meet Rebeta Pro"
            copy="Designed for traders who want deeper intelligence, automation, and AI-powered workflows."
          />
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {proFeatures.map((item) => (
              <FeatureCard key={item.title} item={item} badge="Coming Soon" />
            ))}
          </div>
        </section>

        <section className="mt-18 sm:mt-20">
          <div className="glass-strong rounded-[2rem] p-6 sm:p-8">
            <div className="grid gap-8 lg:grid-cols-[0.82fr_1.18fr]">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full bg-primary/12 px-3 py-1 text-[11px] font-black uppercase tracking-[0.2em] text-primary ring-1 ring-primary/25">
                  <Crown className="h-3.5 w-3.5" /> Founding Trader Program
                </span>
                <h2 className="mt-5 text-3xl font-bold leading-tight sm:text-4xl">
                  Become a Founding Trader
                </h2>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                  Everyone joining RebateBoard during Early Access becomes part of our first
                  generation of traders, with benefits designed to recognize early belief and
                  useful feedback.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {founderBenefits.map((item) => (
                  <FeatureCard key={item.title} item={item} />
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mt-18 sm:mt-20">
          <SectionHeading
            eyebrow="Roadmap"
            title="Our Roadmap"
            copy="A transparent path from first community access to a global trading intelligence platform."
          />
          <div className="mt-8 grid gap-4 lg:grid-cols-6">
            {roadmap.map(([phase, title, copy], index) => (
              <article
                key={title}
                className="relative glass rounded-3xl p-5 transition hover:-translate-y-0.5 hover:bg-white/[0.055]"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="rounded-full bg-primary/12 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-primary">
                    {phase}
                  </span>
                  <Clock className="h-4 w-4 text-white/42" />
                </div>
                <h3 className="mt-5 text-base font-bold text-white">{title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{copy}</p>
                {index < roadmap.length - 1 ? (
                  <span className="pointer-events-none absolute -right-3 top-1/2 hidden h-px w-6 bg-white/20 lg:block" />
                ) : null}
              </article>
            ))}
          </div>
        </section>

        <section className="mt-18 grid gap-8 sm:mt-20 lg:grid-cols-[0.85fr_1.15fr]">
          <div>
            <span className="text-xs font-black uppercase tracking-[0.24em] text-primary">FAQ</span>
            <h2 className="mt-3 text-3xl font-bold leading-tight sm:text-4xl">
              Early Access Questions
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Clear answers about what is free now, what comes later, and how Founder benefits are
              handled.
            </p>
          </div>
          <div className="grid gap-3">
            {faqs.map(([question, answer]) => (
              <details key={question} className="glass rounded-2xl p-4">
                <summary className="cursor-pointer text-sm font-bold text-white">{question}</summary>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{answer}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="mt-18 sm:mt-20">
          <div className="glass-strong rounded-[2rem] p-6 text-center sm:p-10">
            <ShieldCheck className="mx-auto h-10 w-10 text-primary" />
            <h2 className="mt-5 text-3xl font-bold sm:text-4xl">Our Promise</h2>
            <p className="mx-auto mt-4 max-w-4xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              RebateBoard will always have a free tier. Our mission is to help traders earn more,
              lose less, and make better decisions. Rebeta Pro exists to give serious traders more
              powerful tools, not to take away the essentials. Core transparency features will
              always remain available to everyone.
            </p>
          </div>
        </section>

        <section className="mt-18 overflow-hidden rounded-[2rem] border border-white/12 bg-gradient-to-br from-fuchsia-500/18 via-violet-500/12 to-cyan-400/10 p-6 text-center shadow-[0_24px_90px_rgba(8,2,18,0.36)] sm:mt-20 sm:p-10">
          <h2 className="mx-auto max-w-3xl text-3xl font-black leading-tight sm:text-5xl">
            Ready to Build the Future of Trading With Us?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            Join Early Access today and help shape the next generation of transparent trading
            technology.
          </p>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              to="/signup"
              className="inline-flex h-12 items-center justify-center rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-600 px-6 text-sm font-bold text-white shadow-[0_0_30px_rgba(192,132,252,0.38)] transition hover:-translate-y-0.5"
            >
              Create Free Account
            </Link>
            <Link
              to="/programs"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-white/[0.055] px-6 text-sm font-bold text-white ring-1 ring-white/15 transition hover:-translate-y-0.5 hover:bg-white/[0.08]"
            >
              Browse Trusted Brands <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
