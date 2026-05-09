import { Link } from "@tanstack/react-router";
import { MessageCircle, Twitter, Send, Linkedin, Youtube } from "lucide-react";
import { Logo } from "@/components/Logo";

export function SiteFooter() {
  return (
    <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      {/* NEWSLETTER */}
      <section className="mt-16">
        <div className="glass-strong rounded-3xl p-8 text-center sm:p-12">
          <div className="mb-2 text-xs uppercase tracking-widest text-muted-foreground">Stay Connected</div>
          <h2 className="text-2xl font-bold sm:text-3xl">Stay updated with everything that actually impacts your trading</h2>
          <p className="mt-2 text-sm text-muted-foreground">No noise. Just what helps you trade smarter and earn more.</p>
          <form className="mx-auto mt-6 flex max-w-md gap-2" onSubmit={(e) => e.preventDefault()}>
            <div className="glass-pill flex flex-1 items-center rounded-full px-4">
              <input type="email" placeholder="Enter your email" className="w-full bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground" />
            </div>
            <button className="rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-600 px-6 py-2 text-sm font-semibold">Subscribe</button>
          </form>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="mt-12 glass rounded-3xl p-8">
        <div className="grid gap-8 md:grid-cols-[1.4fr_repeat(4,1fr)]">
          <div>
            <div className="flex items-center gap-2">
              <Logo heightClass="h-9" />
            </div>
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
              RebateBoard partners with brokers and platforms to share a portion of their commission with you. When you trade or shop through our links, you automatically earn cashback on eligible transactions.
            </p>
          </div>
          {[
            { col: "Marketplace", items: [{ label: "Offers" }, { label: "Reviews", to: "/reviews" }, { label: "Bonuses" }, { label: "Promotions" }, { label: "Coupons" }, { label: "Deals" }] },
            { col: "Insights", items: [{ label: "Economic Calendar", to: "/economic-calendar" }, { label: "Trading Academy", to: "/academy" }, { label: "Market News" }, { label: "Analytics" }, { label: "Reports" }] },
            { col: "Company", items: [{ label: "About" }, { label: "Careers" }, { label: "Press" }, { label: "Contact" }, { label: "Blog", to: "/blog" }, { label: "List your brand", to: "/business/join" }] },
            { col: "Support", items: [{ label: "Help Center" }, { label: "Docs" }, { label: "Status" }, { label: "Community" }, { label: "FAQ", to: "/faqs" }] },
            { col: "Legal", items: [{ label: "Terms", to: "/legal/$slug", params: { slug: "terms" } }, { label: "Privacy", to: "/legal/$slug", params: { slug: "privacy" } }, { label: "Cookies", to: "/legal/$slug", params: { slug: "cookies" } }, { label: "Disclaimer", to: "/legal/$slug", params: { slug: "disclaimer" } }, { label: "Compliance", to: "/legal/$slug", params: { slug: "compliance" } }] },
          ].map(({ col, items }) => (
            <div key={col}>
              <div className="mb-3 text-sm font-semibold">{col}</div>
              <ul className="space-y-2 text-xs text-muted-foreground">
                {items.map((item: any) => (
                  <li key={item.label} className="hover:text-foreground">
                    {item.to ? <Link to={item.to} params={item.params}>{item.label}</Link> : <span className="cursor-pointer">{item.label}</span>}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
          <div className="text-[11px] text-muted-foreground">All right reserved · RebateBoard @2026</div>
          <div className="flex gap-2">
            {[MessageCircle, Twitter, Send, Linkedin, Youtube].map((Icon, i) => (
              <button key={i} className="glass-pill grid h-8 w-8 place-items-center rounded-full" aria-label="Social link">
                <Icon className="h-3.5 w-3.5" />
              </button>
            ))}
          </div>
        </div>
      </footer>

      {/* DISCLAIMER */}
      <section className="mt-6 mb-12 glass rounded-3xl p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-2xl font-bold">Disclaimer</h3>
          <div className="flex gap-4 text-xs text-muted-foreground">
            <Link to="/legal/$slug" params={{ slug: "privacy" }} className="hover:text-foreground">Privacy Policy</Link>
            <Link to="/legal/$slug" params={{ slug: "terms" }} className="hover:text-foreground">Terms & Condition</Link>
          </div>
        </div>
        <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">
          Trading forex and CFDs involves significant risk and may not be suitable for all investors. The value of your investments can go down as well as up, and you may lose more than your initial deposit. Please ensure you fully understand the risks involved and seek independent advice if necessary.
          RebateBoard is not a financial advisor and does not provide investment advice. The information provided on this website is for educational purposes only and should not be considered as financial advice.
          RebateBoard is not responsible for any losses incurred as a result of trading or investment decisions made based on the information provided on this website.
          Trading involves risk. Please ensure you fully understand the risks involved before trading. Seek independent advice if necessary.
        </p>
      </section>
    </div>
  );
}
