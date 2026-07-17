import { Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Facebook, Instagram, Linkedin, MessageCircle, Send, Twitter, Youtube } from "lucide-react";
import { Logo } from "@/components/Logo";
import { CookiePreferencesTrigger } from "@/components/cookies/CookieConsentUI";
import { useI18n } from "@/lib/i18n";
import { subscribeToNewsletter } from "@/lib/newsletter";

const socialLinks = [
  { label: "Telegram", href: "https://t.me/rebateboard", icon: Send },
  { label: "X", href: "https://x.com/rebateboard?s=21", icon: Twitter },
  { label: "Discord", href: "https://discord.gg/6kW2vnC6t6", icon: MessageCircle },
  {
    label: "Instagram",
    href: "https://www.instagram.com/rebateboard?igsh=MTQ0Z2NhbWZuOTJxNQ==",
    icon: Instagram,
  },
  { label: "YouTube", href: "https://youtube.com/@rebateboard?si=7ZuMZ5t-5BlW1z21", icon: Youtube },
  { label: "LinkedIn", href: "https://www.linkedin.com/company/rebateboard/", icon: Linkedin },
  {
    label: "Facebook",
    href: "https://www.facebook.com/profile.php?id=61577216030797&mibextid=wwXIfr&mibextid=wwXIfr",
    icon: Facebook,
  },
] as const;

const trustValues = [
  { label: "Transparency First", to: "/trader-tbi" },
  { label: "Built for Traders", to: "/products" },
  { label: "Independent Reviews", to: "/reviews" },
  { label: "Global Community", to: "/community" },
] as const;

type FooterLinkItem = {
  label: string;
  to: string;
  params?: Record<string, string>;
};

type FooterColumn = {
  col: string;
  items: FooterLinkItem[];
};

export function SiteFooter() {
  const { t } = useI18n();
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterStatus, setNewsletterStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [newsletterMessage, setNewsletterMessage] = useState("");

  async function handleNewsletterSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNewsletterStatus("loading");
    setNewsletterMessage("");

    try {
      const result = await subscribeToNewsletter(newsletterEmail, "Footer");
      setNewsletterStatus("success");
      setNewsletterMessage(
        result.alreadySubscribed
          ? "You are already on the RebateBoard newsletter."
          : "You are subscribed. Watch your inbox for the next RebateBoard update.",
      );
      setNewsletterEmail("");
    } catch (error) {
      setNewsletterStatus("error");
      setNewsletterMessage(error instanceof Error ? error.message : "Could not subscribe right now.");
    }
  }

  const footerColumns: FooterColumn[] = [
    {
      col: t("footer.marketplace"),
      items: [
        { label: "Offers", to: "/offers" },
        { label: "Top Prop Firm Sellers", to: "/top-prop-firm-sellers" },
        { label: "Reviews", to: "/reviews" },
      ],
    },
    {
      col: "Products",
      items: [
        { label: "Trading Journal", to: "/trading-journals" },
        { label: "Trading Plan", to: "/trading-plan" },
        { label: "AI Backtesting Lab", to: "/ai-backtesting-lab" },
        { label: "Trader TBI", to: "/trader-tbi" },
        { label: "Trader Return Tracker", to: "/trt" },
        { label: "Rebeta AI", to: "/rebeta-ai" },
        { label: "Rebate Rewards", to: "/rebate-rewards" },
        { label: "Cashback Calculator", to: "/cashback-calculator" },
        { label: "Payout Tracker", to: "/payouts" },
      ],
    },
    {
      col: "Resources",
      items: [
        { label: "Economic Calendar", to: "/economic-calendar" },
        { label: "Trading Academy", to: "/academy" },
        { label: "Demo Accounts", to: "/demo-accounts" },
        { label: "Blog", to: "/blog" },
      ],
    },
    {
      col: t("footer.company"),
      items: [
        { label: "About", to: "/about" },
        { label: "How We Make Money", to: "/how-we-make-money" },
        { label: "Pricing", to: "/pricing" },
        { label: "Contact", to: "/contact" },
        { label: "List Your Brand", to: "/business/join" },
        { label: "Affiliate Program", to: "/affiliate-program" },
        { label: "Merit Awards", to: "/merit-awards" },
      ],
    },
    {
      col: t("footer.support"),
      items: [
        { label: "Help Center", to: "/help-center" },
        { label: "Community", to: "/community" },
        { label: "FAQ", to: "/faqs" },
        { label: "Bug Bounty", to: "/bug-bounty" },
      ],
    },
    {
      col: t("footer.legal"),
      items: [
        { label: "Terms", to: "/legal/$slug", params: { slug: "terms" } },
        { label: "Privacy", to: "/legal/$slug", params: { slug: "privacy" } },
        { label: "Cookies", to: "/legal/$slug", params: { slug: "cookies" } },
        { label: "Disclaimer", to: "/legal/$slug", params: { slug: "disclaimer" } },
        { label: "Compliance", to: "/legal/$slug", params: { slug: "compliance" } },
      ],
    },
  ];
  const mobileFooterColumnGroups = [
    [footerColumns[0], footerColumns[2], footerColumns[4]],
    [footerColumns[1], footerColumns[3], footerColumns[5]],
  ];

  return (
    <div className="container-app relative">
      {/* NEWSLETTER */}
      <section id="newsletter" className="mt-10 sm:mt-12">
        <div className="glass-strong rounded-3xl p-5 text-center sm:p-7 lg:p-8">
          <div className="mb-2 text-xs uppercase tracking-widest text-muted-foreground">
            Newsletter
          </div>
          <h2 className="text-xl font-bold sm:text-2xl">
            Stay Ahead of the Market
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Receive weekly trader insights, cashback opportunities, platform updates, and Rebeta
            intelligence. No spam. Just useful trading information.
          </p>
          <form
            className="mx-auto mt-5 flex max-w-md flex-col gap-2 sm:flex-row"
            onSubmit={handleNewsletterSubmit}
          >
            <div className="glass-pill flex flex-1 items-center rounded-full px-4">
              <input
                type="email"
                value={newsletterEmail}
                onChange={(event) => setNewsletterEmail(event.target.value)}
                placeholder="Email address"
                className="w-full bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground"
                disabled={newsletterStatus === "loading"}
                required
              />
            </div>
            <button
              className="rounded-full rb-gradient-primary px-6 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-70"
              disabled={newsletterStatus === "loading"}
            >
              {newsletterStatus === "loading" ? "Subscribing..." : "Subscribe"}
            </button>
          </form>
          {newsletterMessage && (
            <p
              className={`mx-auto mt-3 max-w-md text-xs ${
                newsletterStatus === "error" ? "text-red-300" : "text-emerald-300"
              }`}
              role="status"
            >
              {newsletterMessage}
            </p>
          )}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="mt-8 glass rounded-3xl p-5 sm:p-6 lg:p-7">
        <div className="md:hidden">
          <div>
            <div className="flex items-center gap-2">
              <Logo heightClass="h-9" />
            </div>
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
              Helping traders earn more, lose less, and make smarter decisions through
              transparency, trusted reviews, cashback, AI, and financial intelligence.
            </p>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-x-8">
            {mobileFooterColumnGroups.map((group, index) => (
              <div key={index} className="space-y-8">
                {group.map(({ col, items }) => (
                  <div key={col}>
                    <div className="mb-3 text-sm font-semibold">{col}</div>
                    <ul className="space-y-2 text-xs text-muted-foreground">
                      {items.map((item) => (
                        <li key={`${col}-${item.label}`}>
                          <Link
                            to={item.to as any}
                            params={item.params as any}
                            className="inline-flex py-1 transition hover:text-foreground"
                          >
                            {item.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
        <div className="hidden grid-cols-2 gap-x-7 gap-y-8 md:grid md:grid-cols-3 xl:grid-cols-[1.35fr_repeat(6,minmax(0,1fr))]">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2">
              <Logo heightClass="h-9" />
            </div>
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
              Helping traders earn more, lose less, and make smarter decisions through
              transparency, trusted reviews, cashback, AI, and financial intelligence.
            </p>
          </div>
          {footerColumns.map(({ col, items }) => (
            <div key={col}>
              <div className="mb-3 text-sm font-semibold">{col}</div>
              <ul className="space-y-2 text-xs text-muted-foreground">
                {items.map((item) => (
                  <li key={`${col}-${item.label}`}>
                    <Link
                      to={item.to as any}
                      params={item.params as any}
                      className="inline-flex py-1 transition hover:text-foreground"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-8 grid gap-2 border-t border-white/10 pt-4 sm:grid-cols-2 xl:grid-cols-4">
          {trustValues.map((value) => (
            <Link
              key={value.label}
              to={value.to as any}
              className="rounded-full border border-white/10 bg-white/[0.035] px-3 py-2 text-center text-[11px] font-semibold uppercase tracking-[0.16em] text-white/65"
            >
              {value.label}
            </Link>
          ))}
        </div>
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
          <div className="text-[11px] text-muted-foreground">
            {t("footer.rights")}
          </div>
          <div className="flex flex-wrap gap-2">
            {socialLinks.map(({ label, href, icon: Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noreferrer"
                className="glass-pill grid h-8 w-8 place-items-center rounded-full transition hover:border-violet-300/35 hover:bg-white/[0.08]"
                aria-label={`RebateBoard on ${label}`}
                title={label}
              >
                <Icon className="h-3.5 w-3.5" />
              </a>
            ))}
          </div>
        </div>
      </footer>

      {/* DISCLAIMER */}
      <section className="mt-5 mb-8 glass rounded-3xl p-5 sm:mb-10 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-xl font-bold">{t("footer.disclaimer")}</h3>
          <div className="flex gap-4 text-xs text-muted-foreground">
            <Link to="/legal/$slug" params={{ slug: "privacy" }} className="hover:text-foreground">
              {t("footer.privacyPolicy")}
            </Link>
            <CookiePreferencesTrigger className="text-muted-foreground hover:text-foreground">
              Cookie Preferences
            </CookiePreferencesTrigger>
            <Link to="/legal/$slug" params={{ slug: "terms" }} className="hover:text-foreground">
              {t("footer.termsCondition")}
            </Link>
          </div>
        </div>
        <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">
          Trading forex and CFDs involves significant risk and may not be suitable for all
          investors. The value of your investments can go down as well as up, and you may lose more
          than your initial deposit. Please ensure you fully understand the risks involved and seek
          independent advice if necessary. RebateBoard is not a financial advisor and does not
          provide investment advice. The information provided on this website is for educational
          purposes only and should not be considered as financial advice. RebateBoard is not
          responsible for any losses incurred as a result of trading or investment decisions made
          based on the information provided on this website. Trading involves risk. Please ensure
          you fully understand the risks involved before trading. Seek independent advice if
          necessary.
        </p>
      </section>
    </div>
  );
}
