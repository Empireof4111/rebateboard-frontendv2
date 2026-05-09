import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Search, Bell, ChevronDown, ArrowUpRight, Star, Play,
  ChevronRight, Plus, Minus, Youtube, Twitter, Linkedin, Send, MessageCircle,
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { X, Check, XCircle, Info, Eye, ShoppingCart } from "lucide-react";
import heroChart from "@/assets/hero-chart.jpg";
import youtubeThumb from "@/assets/youtube-thumb.jpg";
import { Logo } from "@/components/Logo";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { RebateCalculatorModal } from "@/components/RebateCalculatorModal";
import { OfferCard, OfferDetailModal } from "@/components/offers/OfferCard";
import { useAdminCollection } from "@/lib/admin-store";
import { offers as offersSeed, type AdminOffer } from "@/lib/admin-data";
import { LandingHeroAdCard, LandingSponsorsStrip, LandingAdvertiseBox } from "@/components/landing/LandingAdSlots";
import type { SponsorLogo } from "@/lib/dashboard-ads";
import { Flame } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Index,
});

const navItems: { label: string; items: string[] }[] = [
  { label: "Prop Firms", items: ["All Prop Firms", "Top Rated", "New Listings", "Featured Promos"] },
  { label: "Brokers", items: ["All Brokers", "Top Rated", "New Listings", "Regulated Only"] },
  { label: "Crypto Exchanges", items: ["All Exchanges", "Top Rated", "Lowest Fees", "Regulated Only"] },
  { label: "Marketplace", items: ["Offers", "Bonuses", "Promotions", "Coupons"] },
  { label: "Rebates", items: ["Forex Rebates", "Crypto Rebates", "Stocks Rebates", "Calculator"] },
  { label: "Comparisons", items: ["Broker vs Broker", "Fees Compare", "Spreads Compare", "Leverage"] },
  { label: "Insights", items: ["Market News", "Analytics", "Reports", "Trends"] },
  { label: "Tools", items: ["Pip Calculator", "Margin Calculator", "Profit Calculator", "Converter"] },
  { label: "About Us", items: ["Our Story", "Team", "Careers", "Press"] },
  { label: "Blogs", items: ["Latest Posts", "Trading Tips", "Guides", "Tutorials"] },
];

const brokers: SponsorLogo[] = [
  { id: "fb1", name: "Bitget", initial: "B", color: "from-cyan-400 to-blue-500", href: "/payouts/bitget", tag: "sponsor" },
  { id: "fb2", name: "Bybit", initial: "BY", color: "from-yellow-400 to-orange-500", href: "/payouts/bybit", tag: "featured" },
  { id: "fb3", name: "Exness", initial: "ex", color: "from-yellow-300 to-yellow-500", href: "/payouts/exness", tag: "ad" },
  { id: "fb4", name: "FTMO", initial: "F", color: "from-blue-500 to-indigo-600", href: "/payouts/ftmo", tag: "featured" },
  { id: "fb5", name: "FundedNext", initial: "FN", color: "from-pink-500 to-rose-500", href: "/payouts/fundednext", tag: "sponsor" },
  { id: "fb6", name: "OKX", initial: "X", color: "from-zinc-700 to-zinc-900", href: "/payouts/okx", tag: "ad" },
];

const exchanges = [
  ["Coin A", "Coin B", "Coin C", "Coin D"],
  ["Coin E", "Coin F", "Coin G", "Coin H"],
  ["Coin I", "Coin J", "Coin K", "Coin L"],
];

const reviewBars = [
  { stars: 5, value: 84, count: "2.1k" },
  { stars: 4, value: 50, count: "1.0k" },
  { stars: 3, value: 28, count: "620" },
  { stars: 2, value: 12, count: "240" },
  { stars: 1, value: 4, count: "60" },
];

const steps: { n: number; title: string; bullets?: string[]; desc?: string; cta?: { label: string; action: string } }[] = [
  {
    n: 1,
    title: "How It Works",
    desc: "Welcome to the Cashback Support Page for prop firm purchases on RebateBoard. Here, we'll guide you through everything you need to know about how to qualify for cashback, submit a request, and receive your rewards.",
  },
  {
    n: 2,
    title: "How to Qualify for Rebate",
    bullets: [
      "To receive cashback when purchasing a prop firm account:",
      "Use Our Affiliate Link & Discount Code",
      "You must use RebateBoard's affiliate link and promo/discount code during your purchase.",
      "Without this, we won't receive any commission from the firm, and cashback will not be possible.",
    ],
  },
  {
    n: 3,
    title: "How to Claim Your Rebate",
    cta: { label: "Join Our Discord Server", action: "Join" },
    bullets: [
      "Open a Cashback Ticket",
      "Go to the #Creat-Ticket channel.",
      "Select the \"Cashback Details\" category.",
      "Submit Your Cashback Request",
    ],
  },
  {
    n: 4,
    title: "Provide the Following",
    bullets: [
      "Invoice ID from the prop firm",
      "Screenshot showing the account purchase (must include email or account ID)",
      "Email Address used during the purchase",
      "Alternatively, you can also contact our support:",
      "Email: support@rebateboard.com",
      "Telegram: @RebateBoard",
    ],
  },
  {
    n: 5,
    title: "Verification Process",
    bullets: [
      "Our team will confirm your purchase and verify if we've received a commission from the prop firm.",
      "After successful verification, 50% of our commission will be credited to your RebateBoard Wallet.",
      "You can track your earnings via your dashboard.",
    ],
  },
  {
    n: 6,
    title: "Important Notes",
    bullets: [
      "Commission Type Varies: Some prop firms pay us only after you complete your first project (i.e., pass the challenge).",
      "If this applies, we'll indicate it clearly on the cashback listing.",
      "Others pay on every purchase, and you'll get cashback as soon as we're paid.",
      "Cashback only applies to purchases made via our official affiliate links and codes.",
    ],
  },
  {
    n: 7,
    title: "Transparency & Proof",
    bullets: [
      "We believe in full transparency:",
      "We'll share screenshots or commission reports showing what we earned.",
      "Your cashback = 50% of our total commission for your account purchase.",
    ],
  },
  {
    n: 8,
    title: "Need Help?",
    bullets: [
      "If you're confused or stuck:",
      "Message us on Discord",
      "Email our team directly",
      "Reach out via Telegram chat",
    ],
  },
];

const testimonials = Array.from({ length: 3 }).map((_, i) => ({
  name: ["Basiru Y. Danzomo", "Amelia Carter", "Jonas Vega"][i],
  date: "12 Jan, 2025 · 2:00pm",
  text: "RebateBoard completely changed the way I trade. The cashback adds up faster than I expected and the platform comparisons saved me hours.",
}));

const offersData = {
  reviews: [
    { broker: "IC Markets", title: "Trusted by 200k+ traders", meta: "4.8 ★ · 2,140 reviews", tag: "Top Rated" },
    { broker: "Pepperstone", title: "Award-winning execution speed", meta: "4.7 ★ · 1,820 reviews", tag: "Editor's Pick" },
    { broker: "Exness", title: "Tight spreads on majors", meta: "4.6 ★ · 1,510 reviews", tag: "Popular" },
    { broker: "XM Group", title: "Great for beginners", meta: "4.5 ★ · 1,230 reviews", tag: "Recommended" },
  ],
  offers: [
    { broker: "Bybit", title: "Up to $30,000 deposit bonus", meta: "Crypto · New users", tag: "Limited" },
    { broker: "Bitget", title: "$6,200 welcome rewards", meta: "Crypto · KYC required", tag: "Hot" },
    { broker: "OctaFX", title: "50% deposit bonus", meta: "Forex · All accounts", tag: "Bonus" },
    { broker: "FBS", title: "$140 no-deposit bonus", meta: "Forex · Verified", tag: "Free" },
  ],
  rebates: [
    { broker: "IC Markets", title: "$7 per lot cashback", meta: "Forex · Standard account", tag: "Daily Payout" },
    { broker: "Pepperstone", title: "Up to 80% commission back", meta: "Forex · Razor account", tag: "High" },
    { broker: "Binance", title: "20% trading fee rebate", meta: "Crypto · Spot & Futures", tag: "Lifetime" },
    { broker: "OKX", title: "30% maker rebate", meta: "Crypto · Pro tier", tag: "Pro" },
  ],
  compare: [
    { broker: "IC Markets vs Pepperstone", title: "Spreads, fees, leverage side-by-side", meta: "Forex brokers", tag: "Compare" },
    { broker: "Bybit vs Binance", title: "Funding rates & liquidity match-up", meta: "Crypto exchanges", tag: "Compare" },
    { broker: "XM vs Exness", title: "Execution & withdrawals", meta: "Forex brokers", tag: "Compare" },
    { broker: "OKX vs Bitget", title: "Fees, products & rebates", meta: "Crypto exchanges", tag: "Compare" },
  ],
} as const;

type OfferTab = keyof typeof offersData;
const offerTabs: { key: OfferTab; label: string }[] = [
  { key: "reviews", label: "Reviews" },
  { key: "offers", label: "Offers" },
  { key: "rebates", label: "Rebates" },
  { key: "compare", label: "Compare" },
];

const faqs = [
  "How does RebateBoard's cashback program work?",
  "When do I receive my cashback payouts?",
  "Are there any hidden fees I should know about?",
  "Which brokers and platforms are supported?",
  "Is my personal trading data kept private?",
  "Can I track my rebates in real time?",
  "How accurate are the platform comparisons?",
  "Do I need to switch brokers to earn cashback?",
];

function StepCard({ step }: { step: { n: number; title: string; bullets?: string[]; desc?: string; cta?: { label: string; action: string } } }) {
  return (
    <div className="rounded-2xl bg-white/[0.04] p-4 ring-1 ring-white/10 backdrop-blur-sm">
      <div className="mb-3 flex items-center gap-2">
        <span className="grid h-7 w-7 place-items-center rounded-full bg-white text-[11px] font-bold text-violet-900">
          {step.n}
        </span>
        <span className="text-sm font-semibold">{step.title}</span>
      </div>
      {step.cta && (
        <div className="mb-2 flex items-center justify-between rounded-full bg-white/10 px-3 py-1 ring-1 ring-white/15">
          <span className="text-[11px]">{step.cta.label}</span>
          <button className="rounded-full bg-fuchsia-400/40 px-3 py-0.5 text-[10px] font-semibold ring-1 ring-fuchsia-300/40">
            {step.cta.action}
          </button>
        </div>
      )}
      {step.desc && (
        <p className="text-[11px] leading-relaxed text-white/75">{step.desc}</p>
      )}
      {step.bullets && (
        <ul className="space-y-1.5 text-[11px] leading-relaxed text-white/75">
          {step.bullets.map((b, i) => (
            <li key={i} className="flex gap-1.5">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-white/60" />
              <span>{b}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Index() {
  const [openFaq, setOpenFaq] = useState(0);
  const [offerTab, setOfferTab] = useState<OfferTab>("reviews");
  const [brokerTab, setBrokerTab] = useState<"brokers" | "exchanges">("brokers");
  const [profitTab, setProfitTab] = useState<"forex" | "crypto" | "stocks">("forex");
  const [lastTouched, setLastTouched] = useState<"broker" | "profit">("broker");
  const [compareOpen, setCompareOpen] = useState<null | { a: string; b: string }>(null);
  const [calcOpen, setCalcOpen] = useState(false);
  const [activeOffer, setActiveOffer] = useState<AdminOffer | null>(null);
  const { items: liveOffers } = useAdminCollection<AdminOffer>("offers", offersSeed);
  const topOffers = liveOffers.filter((o) => o.status === "active").sort((a, b) => Number(!!b.pinned) - Number(!!a.pinned)).slice(0, 6);

  const brokerTabData = {
    brokers: {
      items: ["IC Markets", "Pepperstone", "XM Group", "Exness"],
      iconBg: "bg-gradient-to-br from-cyan-400 to-blue-500",
      iconText: "text-white",
      iconLabel: "br",
      changeColor: "text-cyan-300",
      cardBg: "bg-gradient-to-br from-cyan-500/15 via-blue-600/10 to-transparent ring-1 ring-cyan-300/20",
      sectionBg: "from-cyan-500/10 via-blue-600/5 to-transparent",
    },
    exchanges: {
      items: ["Binance", "Bybit", "OKX", "Coinbase"],
      iconBg: "bg-gradient-to-br from-fuchsia-500 to-violet-600",
      iconText: "text-white",
      iconLabel: "ex",
      changeColor: "text-fuchsia-300",
      cardBg: "bg-gradient-to-br from-fuchsia-500/15 via-violet-600/10 to-transparent ring-1 ring-fuchsia-300/20",
      sectionBg: "from-fuchsia-500/10 via-violet-600/5 to-transparent",
    },
  } as const;
  const activeBrokerTab = brokerTabData[brokerTab];

  const profitTabData = {
    forex: {
      items: ["EUR/USD", "GBP/JPY", "USD/JPY", "AUD/USD"],
      iconBg: "bg-gradient-to-br from-emerald-400 to-teal-500",
      iconLabel: "fx",
      changeColor: "text-emerald-300",
      cardBg: "bg-gradient-to-br from-emerald-500/15 via-teal-600/10 to-transparent ring-1 ring-emerald-300/20",
      sectionBg: "from-emerald-500/10 via-teal-600/5 to-transparent",
    },
    crypto: {
      items: ["BTC/USDT", "ETH/USDT", "SOL/USDT", "XRP/USDT"],
      iconBg: "bg-gradient-to-br from-amber-400 to-orange-500",
      iconLabel: "₿",
      changeColor: "text-amber-300",
      cardBg: "bg-gradient-to-br from-amber-500/15 via-orange-600/10 to-transparent ring-1 ring-amber-300/20",
      sectionBg: "from-amber-500/10 via-orange-600/5 to-transparent",
    },
    stocks: {
      items: ["AAPL", "TSLA", "NVDA", "MSFT"],
      iconBg: "bg-gradient-to-br from-rose-400 to-pink-600",
      iconLabel: "$",
      changeColor: "text-rose-300",
      cardBg: "bg-gradient-to-br from-rose-500/15 via-pink-600/10 to-transparent ring-1 ring-rose-300/20",
      sectionBg: "from-rose-500/10 via-pink-600/5 to-transparent",
    },
  } as const;
  const activeProfitTab = profitTabData[profitTab];
  const sectionTint = lastTouched === "broker" ? activeBrokerTab.sectionBg : activeProfitTab.sectionBg;

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Ambient glow orbs */}
      <div className="glow-orb h-[600px] w-[600px] -left-40 top-20" />
      <div className="glow-orb h-[700px] w-[700px] right-0 top-[40%] opacity-60" />
      <div className="glow-orb h-[500px] w-[500px] left-1/3 bottom-20 opacity-50" />

      <SiteHeader />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        {/* HERO */}
        <section className="mt-6 sm:mt-10 grid gap-8 lg:gap-6 lg:grid-cols-[1.1fr_1fr]">
          <div className="flex flex-col justify-center">
            <h1 className="text-4xl font-bold leading-[1.05] sm:text-5xl md:text-6xl lg:text-7xl">
              Trade Smart.<br />
              Earn More. <span className="text-gradient">Always.</span>
            </h1>
            <p className="mt-5 max-w-md text-base leading-relaxed text-muted-foreground">
              Compare platforms, track your ROI, and earn cashback on every trade and purchase.
            </p>

            {/* Sponsored company logos — managed in Superadmin → Dashboard Ads */}
            <LandingSponsorsStrip fallback={brokers} />

            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-success" /> Verified Trading Platforms</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-accent" /> Up to 70% Cashback</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-fuchsia-400" /> Data-Driven Trust Scores</span>
            </div>
          </div>

          {/* Hero rotating ad card — managed in Superadmin → Dashboard Ads */}
          <LandingHeroAdCard fallbackImage={heroChart} />
        </section>

        {/* Three feature cards */}
        <section className={`mt-6 grid gap-4 rounded-3xl bg-gradient-to-br p-4 transition-colors duration-500 lg:grid-cols-3 ${sectionTint}`}>
          {/* Exclusive Offers */}
          <div className="glass rounded-3xl p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold">Exclusive Offers</h3>
              <Plus className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="glass-pill rounded-2xl p-3">
                  <div className="relative grid h-9 w-9 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-600 text-[9px] font-semibold text-white/90 ring-1 ring-white/20">
                    <span className="opacity-80">Logo</span>
                    
                  </div>
                  <div className="mt-2 text-xs font-medium">Offer #{i + 1}</div>
                  <div className="text-[10px] text-muted-foreground">Sponsored</div>
                </div>
              ))}
            </div>
            <button className="mt-4 w-full text-xs text-muted-foreground hover:text-foreground">View all →</button>
          </div>

          {/* Top Brokers / Top Exchanges */}
          <div className={`glass rounded-3xl p-5 transition-colors ${activeBrokerTab.cardBg}`}>
            <div className="mb-4 flex gap-2">
              <button
                onClick={() => { setBrokerTab("brokers"); setLastTouched("broker"); }}
                className={`rounded-full px-3 py-1 text-xs transition ${
                  brokerTab === "brokers"
                    ? "bg-gradient-to-r from-cyan-400/30 to-blue-500/30 text-white ring-1 ring-cyan-300/40"
                    : "bg-white/10 text-muted-foreground hover:text-foreground"
                }`}
              >
                Top Brokers
              </button>
              <button
                onClick={() => { setBrokerTab("exchanges"); setLastTouched("broker"); }}
                className={`rounded-full px-3 py-1 text-xs transition ${
                  brokerTab === "exchanges"
                    ? "bg-gradient-to-r from-fuchsia-500/30 to-violet-600/30 text-white ring-1 ring-fuchsia-300/40"
                    : "bg-white/10 text-muted-foreground hover:text-foreground"
                }`}
              >
                Top Exchanges
              </button>
            </div>
            <div className="space-y-2">
              {activeBrokerTab.items.map((c, i) => (
                <div key={c} className="glass-pill flex items-center gap-3 rounded-xl p-2">
                  <div className={`grid h-8 w-8 place-items-center rounded-full text-[10px] font-bold ${activeBrokerTab.iconBg} ${activeBrokerTab.iconText}`}>
                    {activeBrokerTab.iconLabel}
                  </div>
                  <div className="flex-1 text-xs">{c}</div>
                  <div className={`text-[10px] ${activeBrokerTab.changeColor}`}>+{(8 + i * 2.3).toFixed(1)}%</div>
                </div>
              ))}
            </div>
            <button className="mt-4 w-full text-xs text-muted-foreground hover:text-foreground">View all →</button>
          </div>

          {/* Top Profits */}
          <div className={`glass rounded-3xl p-5 transition-colors ${activeProfitTab.cardBg}`}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold">Top Profits</h3>
              <div className="flex gap-1 text-[10px]">
                {(["forex", "crypto", "stocks"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => { setProfitTab(t); setLastTouched("profit"); }}
                    className={`rounded-full px-2 py-0.5 capitalize transition ${
                      profitTab === t
                        ? "bg-white/25 text-white ring-1 ring-white/30"
                        : "glass-pill text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              {activeProfitTab.items.map((c, i) => (
                <div key={c} className="glass-pill flex items-center gap-3 rounded-xl p-2">
                  <div className={`grid h-8 w-8 place-items-center rounded-full text-[10px] font-bold text-white ${activeProfitTab.iconBg}`}>
                    {activeProfitTab.iconLabel}
                  </div>
                  <div className="flex-1 text-xs">{c}</div>
                  <div className={`text-[10px] ${activeProfitTab.changeColor}`}>+{(20 + i * 3).toFixed(1)}%</div>
                </div>
              ))}
            </div>
            <button className="mt-4 w-full text-xs text-muted-foreground hover:text-foreground">View all →</button>
          </div>
        </section>

        {/* REVIEWS */}
        <section className="mt-12">
          <div className="mb-6 flex justify-center">
            <div className="glass-pill flex gap-1 rounded-full p-1 text-xs">
              {["Reviews", "Offers", "Rebates", "Compare"].map((t, i) => (
                <button key={t} className={`rounded-full px-4 py-1.5 ${i === 0 ? "bg-white/15" : ""}`}>{t}</button>
              ))}
            </div>
          </div>

          <div className="glass-strong rounded-3xl p-6 sm:p-8">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-3xl font-bold sm:text-4xl">Reviews</h2>
              <div className="glass-pill rounded-full px-4 py-1.5 text-xs">March 2021 — February 2026</div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              <div>
                <div className="text-xs text-muted-foreground">Total Review</div>
                <div className="mt-1 flex items-end gap-2">
                  <div className="text-4xl font-bold">10.0k</div>
                  <div className="mb-1 rounded-full bg-success/20 px-2 py-0.5 text-[10px] text-success">21% ↑</div>
                </div>
                <div className="mt-1 text-xs text-muted-foreground">Growth in review on this year</div>
              </div>

              <div>
                <div className="text-xs text-muted-foreground">Average Rating</div>
                <div className="mt-1 flex items-center gap-2">
                  <div className="text-4xl font-bold">4.0</div>
                  <div className="flex">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`h-4 w-4 ${i < 4 ? "fill-accent text-accent" : "text-muted-foreground"}`} />
                    ))}
                  </div>
                </div>
                <div className="mt-1 text-xs text-muted-foreground">Average rating on this year</div>
              </div>

              <div className="space-y-1.5">
                {reviewBars.map((r) => (
                  <div key={r.stars} className="flex items-center gap-2 text-[10px]">
                    <span className="w-3">{r.stars}</span>
                    <Star className="h-3 w-3 fill-accent text-accent" />
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
                      <div className="h-full rounded-full bg-gradient-to-r from-fuchsia-500 to-orange-400" style={{ width: `${r.value}%` }} />
                    </div>
                    <span className="w-8 text-right text-muted-foreground">{r.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Latest review */}
            <div className="mt-8 grid gap-6 md:grid-cols-[260px_1fr]">
              <div className="space-y-3">
                <div className="glass-pill flex items-center gap-3 rounded-2xl p-3">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-white text-xs font-bold text-black">ACY</div>
                  <div>
                    <div className="text-xs font-semibold">ACY Securities</div>
                    <div className="text-[10px] text-muted-foreground">Total review: 14</div>
                  </div>
                </div>
                <div className="glass-pill flex items-center gap-3 rounded-2xl p-3">
                  <div className="text-2xl font-bold">4.0</div>
                  <div className="flex-1">
                    <div className="text-xs font-semibold">Basiru YY</div>
                    <div className="text-[10px] text-muted-foreground">12am — 23 March 2025</div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="mb-2 text-sm font-semibold">Latest review</h4>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button className="glass-pill rounded-full px-4 py-1.5 text-xs">Helpful (24)</button>
                  <button className="glass-pill rounded-full px-4 py-1.5 text-xs">Send Message</button>
                  <button className="glass-pill grid h-8 w-8 place-items-center rounded-full">♥</button>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 flex justify-center gap-3">
            <button className="glass-pill rounded-full px-5 py-2 text-xs">Write Review</button>
            <button className="rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-600 px-5 py-2 text-xs font-semibold">See Reviews</button>
          </div>
        </section>

        {/* HOW IT WORKS — Rebate Timeline */}
        <section className="mt-16">
          <h2 className="mb-6 text-center text-2xl font-bold sm:text-3xl">How Our Rebate Works</h2>
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-900/50 via-purple-900/40 to-fuchsia-900/30 p-6 ring-1 ring-violet-400/20 backdrop-blur sm:p-10">
            {/* Top row */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {steps.slice(0, 4).map((s) => (
                <StepCard key={s.n} step={s} />
              ))}
            </div>

            {/* Connector timeline */}
            <div className="relative my-6 hidden lg:block">
              <div className="absolute left-0 right-0 top-1/2 h-px bg-white/30" />
              <div className="relative grid grid-cols-4">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="flex flex-col items-center">
                    <div className="h-6 w-px bg-white/30" />
                    <div className="h-2 w-2 rounded-full bg-white/70" />
                    <div className="h-6 w-px bg-white/30" />
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom row */}
            <div className="mt-4 grid gap-4 md:grid-cols-2 lg:mt-0 lg:grid-cols-4">
              {steps.slice(4, 8).map((s) => (
                <StepCard key={s.n} step={s} />
              ))}
            </div>
          </div>
        </section>

        {/* YOUTUBE / ADVERTISE / CASHBACK */}
        <section className="mt-16">
          <h2 className="mb-6 text-center text-2xl font-bold sm:text-3xl">Latest YouTube Videos</h2>
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="glass-strong relative overflow-hidden rounded-3xl">
              <img src={youtubeThumb} alt="Video" className="h-72 w-full object-cover" loading="lazy" width={768} height={768} />
              <button className="absolute inset-0 grid place-items-center">
                <div className="glass-strong grid h-16 w-16 place-items-center rounded-full">
                  <Play className="h-6 w-6 fill-white" />
                </div>
              </button>
              <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                <p className="glass max-w-[60%] rounded-xl p-2 text-[10px]">Lorem ipsum is simply dummy text of the printing and typesetting…</p>
                <button className="glass-pill flex items-center gap-1 rounded-full px-3 py-1 text-[10px]">
                  <Youtube className="h-3 w-3" /> Youtube
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {/* Advertise Here — managed in Superadmin → Dashboard Ads */}
              <LandingAdvertiseBox />

              <div className="glass rounded-3xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">Estimate Cashback</h3>
                    <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                      Monthly trade <span className="glass-pill rounded-full px-2 py-0.5">●</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-success">$3,99.0</div>
                    <div className="text-[10px] text-muted-foreground">per year</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setCalcOpen(true)}
                  className="mt-4 rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-600 px-4 py-1.5 text-xs font-semibold transition hover:opacity-95"
                >
                  Calculate
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* TESTIMONIALS */}
        <section className="mt-16">
          <h2 className="mb-6 text-center text-2xl font-bold sm:text-3xl">What people are saying about us</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {testimonials.map((t, i) => (
              <div key={i} className="glass rounded-2xl p-5">
                <div className="flex">
                  {Array.from({ length: 5 }).map((_, j) => <Star key={j} className="h-3 w-3 fill-accent text-accent" />)}
                </div>
                <div className="mt-3 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-fuchsia-400 to-violet-600" />
                  <div>
                    <div className="text-xs font-semibold">{t.name}</div>
                    <div className="text-[10px] text-muted-foreground">{t.date}</div>
                  </div>
                </div>
                <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{t.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* OFFERS */}
        <section className="mt-16">
          <div className="mb-6 text-center">
            <div className="text-xs uppercase tracking-widest text-muted-foreground">Marketplace</div>
            <h2 className="mt-1 text-2xl font-bold sm:text-3xl">Exclusive offers, rebates & broker insights</h2>
            <p className="mt-2 text-sm text-muted-foreground">Switch tabs to explore reviews, deposit bonuses, cashback rebates and head-to-head comparisons.</p>
          </div>

          {/* Pill tab switcher */}
          <div className="mx-auto mb-6 flex w-fit items-center gap-1 rounded-full bg-gradient-to-r from-violet-900/60 to-fuchsia-900/40 p-1.5 ring-1 ring-violet-400/20 backdrop-blur">
            {offerTabs.map((t) => {
              const active = offerTab === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => setOfferTab(t.key)}
                  className={
                    "rounded-full px-5 py-2 text-xs font-semibold transition " +
                    (active
                      ? "bg-gradient-to-r from-fuchsia-500 to-violet-600 text-white shadow-[0_0_20px_rgba(192,132,252,0.45)]"
                      : "text-violet-100/80 hover:text-white")
                  }
                >
                  {t.label}
                </button>
              );
            })}
          </div>

          {/* Big content card */}
          <div className="glass-strong relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-900/40 via-fuchsia-900/20 to-transparent p-6 ring-1 ring-violet-400/20 sm:p-8">
            {offerTab === "reviews" && (
              <div>
                <div className="flex items-start justify-between gap-4">
                  <h3 className="text-3xl font-bold sm:text-4xl">Reviews</h3>
                  <div className="rounded-full bg-white/5 px-4 py-1.5 text-xs ring-1 ring-white/10">March 2021 — February 2026</div>
                </div>
                <div className="mt-6 grid gap-6 lg:grid-cols-3">
                  <div>
                    <div className="text-xs text-muted-foreground">Total Review</div>
                    <div className="mt-1 flex items-center gap-2">
                      <div className="text-4xl font-bold">10.0k</div>
                      <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-300 ring-1 ring-emerald-400/30">21% ↑</span>
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">Growth in review on this year</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Average Rating</div>
                    <div className="mt-1 flex items-center gap-2">
                      <div className="text-4xl font-bold">4.0</div>
                      <div className="flex">
                        {[1,2,3,4,5].map((n) => (
                          <Star key={n} className={"h-4 w-4 " + (n <= 4 ? "fill-yellow-400 text-yellow-400" : "text-yellow-400/40")} />
                        ))}
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">Average rating on this year</div>
                  </div>
                  <div className="space-y-1.5">
                    {reviewBars.map((b) => (
                      <div key={b.stars} className="flex items-center gap-2 text-[11px]">
                        <span className="w-3 text-muted-foreground">{b.stars}</span>
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/5">
                          <div className="h-full rounded-full bg-gradient-to-r from-fuchsia-500 to-orange-400" style={{ width: `${b.value}%` }} />
                        </div>
                        <span className="w-10 text-right text-muted-foreground">{b.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-8 grid gap-6 lg:grid-cols-[260px_1fr]">
                  <div className="space-y-3">
                    <div className="glass-pill flex items-center gap-3 rounded-2xl p-3">
                      <div className="grid h-10 w-10 place-items-center rounded-full bg-white text-[10px] font-bold text-violet-700">ACY</div>
                      <div>
                        <div className="text-xs font-semibold">ACY Securities</div>
                        <div className="text-[10px] text-muted-foreground">Total review: 14</div>
                      </div>
                    </div>
                    <div className="glass-pill flex items-center gap-3 rounded-2xl p-3">
                      <div className="text-xl font-bold">4.0</div>
                      <div>
                        <div className="text-xs font-semibold">Basiru YY</div>
                        <div className="text-[10px] text-muted-foreground">12am — 23 March 2025</div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold">Latest review</h4>
                    <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                      Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged.
                    </p>
                    <div className="mt-5 flex items-center gap-2">
                      <button className="rounded-full bg-white/5 px-4 py-2 text-xs font-semibold ring-1 ring-white/10 hover:bg-white/10">Helpful (24)</button>
                      <button className="rounded-full bg-white/5 px-4 py-2 text-xs font-semibold ring-1 ring-white/10 hover:bg-white/10">Send Message</button>
                      <button className="grid h-9 w-9 place-items-center rounded-full bg-white/5 ring-1 ring-white/10 hover:bg-white/10">♥</button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {offerTab === "rebates" && (
              <div>
                <div className="flex items-start justify-between gap-4">
                  <h3 className="text-3xl font-bold capitalize sm:text-4xl">How Our Rebate Works</h3>
                  <div className="rounded-full bg-white/5 px-4 py-1.5 text-xs ring-1 ring-white/10">8 simple steps</div>
                </div>
                <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  {steps.slice(0, 4).map((s) => (
                    <StepCard key={s.n} step={s} />
                  ))}
                </div>
                <div className="relative my-6 hidden lg:block">
                  <div className="absolute left-0 right-0 top-1/2 h-px bg-white/30" />
                  <div className="relative grid grid-cols-4">
                    {[0, 1, 2, 3].map((i) => (
                      <div key={i} className="flex flex-col items-center">
                        <div className="h-6 w-px bg-white/30" />
                        <div className="h-2 w-2 rounded-full bg-white/70" />
                        <div className="h-6 w-px bg-white/30" />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-2 lg:mt-0 lg:grid-cols-4">
                  {steps.slice(4, 8).map((s) => (
                    <StepCard key={s.n} step={s} />
                  ))}
                </div>
              </div>
            )}

            {offerTab !== "reviews" && offerTab !== "rebates" && (
              <div>
                <div className="flex items-start justify-between gap-4">
                  <h3 className="text-3xl font-bold capitalize sm:text-4xl">{offerTab}</h3>
                  <div className="rounded-full bg-white/5 px-4 py-1.5 text-xs ring-1 ring-white/10">Updated weekly</div>
                </div>
                <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {offersData[offerTab].map((o, i) => (
                    <div key={`${offerTab}-${i}`} className="glass group relative overflow-hidden rounded-2xl p-4 transition hover:bg-white/[0.06]">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-fuchsia-500 to-violet-600 text-[10px] font-bold">
                            {o.broker.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="text-xs font-semibold">{o.broker}</div>
                        </div>
                        <span className="rounded-full bg-violet-500/20 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-violet-200 ring-1 ring-violet-400/30">
                          {o.tag}
                        </span>
                      </div>
                      <h4 className="mt-3 text-sm font-semibold leading-snug">{o.title}</h4>
                      <div className="mt-1 text-[10px] text-muted-foreground">{o.meta}</div>
                      {offerTab === "compare" ? (
                        <button
                          onClick={() => {
                            const [a, b] = o.broker.split(/\s+vs\s+/i);
                            setCompareOpen({ a: a?.trim() || "Brand A", b: b?.trim() || "Brand B" });
                          }}
                          className="mt-4 inline-flex items-center gap-1 text-[11px] font-semibold text-fuchsia-300 transition group-hover:text-fuchsia-200"
                        >
                          View details <ArrowUpRight className="h-3 w-3" />
                        </button>
                      ) : (
                        <Link
                          to="/firm/$firmId"
                          params={{ firmId: encodeURIComponent(o.broker.replace(/\s+/g, "-")) }}
                          className="mt-4 inline-flex items-center gap-1 text-[11px] font-semibold text-fuchsia-300 transition group-hover:text-fuchsia-200"
                        >
                          View details <ArrowUpRight className="h-3 w-3" />
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* TOP OFFERS PREVIEW */}
        <section className="mt-16">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-fuchsia-500/15 px-3 py-1 text-[11px] font-semibold text-fuchsia-300 ring-1 ring-fuchsia-400/30">
                <Flame className="h-3 w-3" /> Hot promos
              </div>
              <h2 className="mt-2 text-2xl font-bold sm:text-3xl">Top offers right now</h2>
              <p className="mt-1 text-sm text-muted-foreground">Hand-picked promos across prop firms, brokers, exchanges &amp; tools.</p>
            </div>
            <Link to="/offers" className="rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-600 px-5 py-2 text-xs font-semibold shadow-[0_0_20px_rgba(192,132,252,0.4)]">
              View all offers →
            </Link>
          </div>
          <div className="grid gap-3 lg:grid-cols-2">
            {topOffers.map((o) => (
              <OfferCard key={o.id} offer={o} onOpen={setActiveOffer} />
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="mt-16">
          <h2 className="mb-6 text-center text-2xl font-bold sm:text-3xl">Frequently Asked Questions (FAQs)</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {faqs.map((q, i) => (
              <button
                key={i}
                onClick={() => setOpenFaq(openFaq === i ? -1 : i)}
                className="glass rounded-2xl p-4 text-left transition hover:bg-white/[0.06]"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-medium">{q}</span>
                  {openFaq === i ? <Minus className="h-4 w-4 shrink-0" /> : <Plus className="h-4 w-4 shrink-0" />}
                </div>
                {openFaq === i && (
                  <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground animate-fade-in">
                    RebateBoard partners with brokers and platforms to share a portion of their commission with you. When you trade or shop through our links, you automatically earn cashback on eligible transactions.
                  </p>
                )}
              </button>
            ))}
          </div>
          <div className="mt-6 flex justify-center">
            <Link
              to="/faqs"
              className="rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-600 px-6 py-2 text-xs font-semibold shadow-[0_0_20px_rgba(192,132,252,0.4)]"
            >
              View All FAQs
            </Link>
          </div>
        </section>

        {/* AI BACKTEST LAB */}
        <section className="mt-12 relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1a0b2e] via-[#150829] to-[#0a0418] p-8 ring-1 ring-fuchsia-500/20 md:p-12">
          <div className="glow-orb left-[-10%] top-[-20%] h-[400px] w-[400px]" />
          <div className="relative">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-fuchsia-500/15 px-3 py-1 text-[11px] font-semibold text-fuchsia-300 ring-1 ring-fuchsia-400/30">
              ✨ NEW • AI Backtest Lab
            </span>
            <h2 className="mt-4 max-w-3xl text-3xl font-bold leading-tight text-white md:text-4xl lg:text-5xl">
              Backtest Smarter. Trade Better. <span className="bg-gradient-to-r from-fuchsia-400 to-violet-400 bg-clip-text text-transparent">Earn More Back.</span>
            </h2>
            <p className="mt-3 max-w-2xl text-sm text-muted-foreground md:text-base">
              Describe your strategy or upload your real trades. RebateBoard AI analyzes your performance, fees, risk, and cashback impact in minutes.
            </p>
            <p className="mt-2 max-w-2xl text-xs italic text-fuchsia-300/80">
              "Most traders do not need another signal. They need to understand their own data."
            </p>

            <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              {[
                { t: "AI Strategy Backtesting", d: "Turn your trading idea into a structured backtest without coding." },
                { t: "Real Trade Analysis", d: "Upload broker, exchange, or prop firm history and see what is really working." },
                { t: "Backtest vs Real", d: "Compare your strategy performance with your actual trading behavior." },
                { t: "Cashback Impact", d: "See how fees affect results — and how cashback improves net performance." },
                { t: "AI Trade Insights", d: "Discover your best days, worst habits, strongest assets, and hidden weaknesses." },
              ].map((c) => (
                <div key={c.t} className="glass rounded-2xl p-4">
                  <div className="text-sm font-semibold text-white">{c.t}</div>
                  <div className="mt-2 text-xs text-muted-foreground">{c.d}</div>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/dashboard/backtest" className="rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-[0_0_30px_rgba(192,132,252,0.45)]">
                Join RebateBoard 2.0
              </Link>
              <Link to="/dashboard/backtest" className="glass-pill rounded-full px-6 py-3 text-sm font-semibold text-white">
                Analyze Your Trading Performance
              </Link>
            </div>
          </div>
        </section>

      </div>

      <SiteFooter />

      <CompareDialog open={compareOpen} onClose={() => setCompareOpen(null)} />
      <RebateCalculatorModal open={calcOpen} onClose={() => setCalcOpen(false)} />
      <OfferDetailModal offer={activeOffer} onClose={() => setActiveOffer(null)} />
    </div>
  );
}

function CompareDialog({ open, onClose }: { open: null | { a: string; b: string }; onClose: () => void }) {
  const [view, setView] = useState<"compare" | "addFirm">("compare");
  const brands = open ? [open.a, open.b] : [];
  const firmGrid = Array.from({ length: 12 }).map(() => "ACY Securities");

  const FilterSidebar = (
    <div className="glass self-start rounded-2xl p-4 ring-1 ring-violet-400/20">
      {["Regulators", "Commission($)", "Spread Type", "Minimum Deposit", "Accounts", "Products"].map((g, i) => (
        <div key={g} className={i > 0 ? "mt-3 border-t border-white/10 pt-3" : ""}>
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold">{g}</div>
            <ChevronDown className="h-3 w-3" />
          </div>
          <div className="mt-2 space-y-1.5 text-[11px] text-muted-foreground">
            <label className="flex items-center gap-2"><input type="checkbox" className="accent-fuchsia-400" defaultChecked /> Supporting line text</label>
            <label className="flex items-center gap-2"><input type="checkbox" className="accent-fuchsia-400" /> Supporting line text</label>
          </div>
        </div>
      ))}
    </div>
  );
  const overviewRows: { label: string; values: [string, string]; icon?: "yes" | "no" | "allowed" }[] = [
    { label: "Challenge Type", values: ["2 - Step", "2 - Step"] },
    { label: "Profit Target", values: ["10% / 5%", "10% / 5%"] },
    { label: "Max. Daily Loss", values: ["5%", "5%"] },
    { label: "Max Overall Loss", values: ["10%", "10%"] },
    { label: "Profit Split", values: ["80%", "80%"] },
    { label: "Refundable Fee", values: ["Yes", "Yes"], icon: "yes" },
    { label: "First Payout", values: ["14 Days", "14 Days"] },
    { label: "Payout Frequency", values: ["Bi - Weekly", "Bi - Weekly"] },
    { label: "Scaling Plan", values: ["Yes", "Yes"], icon: "yes" },
    { label: "New Trading", values: ["No", "Allowed"] },
    { label: "Platforms", values: ["MT$, MT5, cTrader", "MT$, MT5, cTrader"] },
  ];

  return (
    <Dialog open={!!open} onOpenChange={(v) => { if (!v) { setView("compare"); onClose(); } }}>
      <DialogContent className="max-w-[1100px] border-violet-400/20 bg-gradient-to-br from-[#1a0b2e] via-[#1f0d3d] to-[#150829] p-0 text-white">
        <div className="max-h-[90vh] overflow-y-auto p-6">
          {/* Header */}
          <div className="glass-strong mb-4 flex items-center justify-between rounded-2xl bg-violet-900/30 p-4 ring-1 ring-violet-400/20">
            <div>
              <h2 className="text-xl font-bold">Compare Prop Firm</h2>
              <p className="text-[11px] text-muted-foreground">Compare rules, payout, pricing and features side by side</p>
            </div>
            <div className="glass-pill hidden items-center gap-2 rounded-full px-3 py-1.5 md:flex">
              <Search className="h-3.5 w-3.5 text-muted-foreground" />
              <input placeholder="search firm" className="w-44 bg-transparent text-xs outline-none placeholder:text-muted-foreground" />
            </div>
            <div className="flex items-center gap-2">
              <button className="rounded-full bg-fuchsia-300/30 px-4 py-1.5 text-xs font-semibold ring-1 ring-fuchsia-300/40">How it works</button>
              <button
                onClick={() => setView(view === "addFirm" ? "compare" : "addFirm")}
                className="inline-flex items-center gap-1 rounded-full bg-fuchsia-300/30 px-4 py-1.5 text-xs font-semibold ring-1 ring-fuchsia-300/40"
              >
                <Plus className="h-3 w-3" /> {view === "addFirm" ? "Back to Compare" : "Add Firm"}
              </button>
            </div>
          </div>

          {view === "compare" ? (
            <div className="grid gap-4 lg:grid-cols-[1fr_220px]">
              {/* Left column: top row (count + brand cards) + Overview */}
              <div className="space-y-4">
                <div className="grid gap-4 lg:grid-cols-[180px_1fr]">
                  {/* Selected count */}
                  <div className="glass rounded-2xl p-4 ring-1 ring-violet-400/20">
                    <div className="text-sm font-semibold">Regulators</div>
                    <div className="mt-2 text-xs text-muted-foreground">2 / 2</div>
                    <div className="mt-2 text-[11px] text-muted-foreground">Select up to 2 firms to compare</div>
                    <button className="mt-4 text-[11px] text-muted-foreground hover:text-white">🗑 Clear all</button>
                  </div>

                  {/* Brand cards */}
                  <div className="glass rounded-2xl p-4 ring-1 ring-violet-400/20">
                    <div className="grid grid-cols-2 gap-3">
                      {brands.map((name, i) => (
                        <div key={i} className="relative rounded-xl bg-white/[0.04] p-3 ring-1 ring-white/10">
                          <button className="absolute right-2 top-2 grid h-5 w-5 place-items-center rounded-full bg-white/10 text-[10px]">
                            <X className="h-3 w-3" />
                          </button>
                          <div className="flex items-center gap-3">
                            <div className="grid h-12 w-12 place-items-center rounded-lg bg-white text-[10px] font-bold text-violet-700">{name.slice(0, 3).toUpperCase()}</div>
                            <div>
                              <div className="text-xs font-semibold">{name}</div>
                              <div className="mt-0.5 inline-flex items-center gap-1 text-[10px]">
                                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" /> 4.7 <span className="text-muted-foreground">(2,001)</span>
                              </div>
                            </div>
                          </div>
                          <button className="mt-3 w-full rounded-full bg-fuchsia-300/30 py-1.5 text-[11px] font-semibold ring-1 ring-fuchsia-300/40">Visit Website</button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Overview */}
                <div className="glass rounded-2xl p-5 ring-1 ring-violet-400/20">
                  <div className="mb-4 flex items-center gap-2">
                    <h3 className="text-lg font-bold">Overview</h3>
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="space-y-1">
                    {overviewRows.map((row) => (
                      <div key={row.label} className="grid grid-cols-[1.2fr_1fr_1fr] items-center gap-3 rounded-lg px-2 py-2 text-xs odd:bg-white/[0.02]">
                        <div className="text-muted-foreground">▤ {row.label}</div>
                        {row.values.map((v, i) => (
                          <div key={i} className="text-center">
                            {v === "Yes" ? (
                              <span className="inline-flex items-center gap-1 text-emerald-400"><Check className="h-3 w-3" /> Yes</span>
                            ) : v === "No" ? (
                              <span className="inline-flex items-center gap-1 text-rose-400"><XCircle className="h-3 w-3" /> No</span>
                            ) : (
                              <span>{v}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>

                  {/* Pricing */}
                  <div className="mt-6 border-t border-white/10 pt-4">
                    <div className="mb-3 flex items-center gap-2">
                      <h3 className="text-base font-bold">Pricing (Popular Size)</h3>
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="grid grid-cols-[1.2fr_1fr_1fr] items-center gap-3 text-xs">
                      <div className="inline-flex items-center gap-2 text-muted-foreground">
                        <span className="grid h-7 w-7 place-items-center rounded-full bg-fuchsia-500/30">$</span>
                        $100,000 Account
                      </div>
                      {brands.map((_, i) => (
                        <div key={i} className="text-center">
                          <div className="text-base font-bold">$520</div>
                          <button className="mt-2 w-full rounded-full bg-fuchsia-300/30 py-1.5 text-[11px] font-semibold ring-1 ring-fuchsia-300/40">See all pricing</button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {FilterSidebar}
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
              {FilterSidebar}

              {/* Firm grid */}
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {firmGrid.map((name, i) => (
                  <div key={i} className="glass rounded-2xl p-3 ring-1 ring-violet-400/20">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="grid h-12 w-12 place-items-center rounded-lg bg-white text-[10px] font-bold text-violet-700">ACY</div>
                        <span className="absolute -right-1 -top-1 grid h-4 w-4 place-items-center rounded-full bg-fuchsia-500 text-[8px]">
                          <Check className="h-2.5 w-2.5" />
                        </span>
                      </div>
                      <div>
                        <div className="text-sm font-semibold">{name}</div>
                        <div className="mt-0.5 flex items-center gap-1 text-[10px]">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          <Star className="h-3 w-3 text-yellow-400/40" />
                          <span className="ml-1 font-semibold">4.0</span>
                        </div>
                        <div className="text-[10px] text-muted-foreground">Total Review : 4</div>
                      </div>
                    </div>
                    <div className="mt-3 space-y-2">
                      <div className="flex items-center gap-1.5">
                        <button className="inline-flex flex-1 min-w-0 items-center justify-center gap-1 rounded-full bg-fuchsia-300/30 px-2 py-1.5 text-[10px] font-semibold ring-1 ring-fuchsia-300/40">
                          <ShoppingCart className="h-3 w-3 shrink-0" /> <span className="truncate">Sign up</span>
                        </button>
                        <Link
                          to="/firm/$firmId"
                          params={{ firmId: encodeURIComponent(name.replace(/\s+/g, "-")) }}
                          onClick={() => onClose()}
                          className="inline-flex flex-1 min-w-0 items-center justify-center gap-1 rounded-full bg-fuchsia-300/30 px-2 py-1.5 text-[10px] font-semibold ring-1 ring-fuchsia-300/40"
                        >
                          <Eye className="h-3 w-3 shrink-0" /> <span className="truncate">View Details</span>
                        </Link>
                      </div>
                      <label className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                        <input type="checkbox" className="accent-fuchsia-400" /> Add to compare
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
