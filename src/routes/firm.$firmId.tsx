import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft, Star, Play, Check, X, ChevronLeft, ChevronRight,
  Headphones, Building2, FileText, Eye, MessageSquare,
} from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { FirmReviews } from "@/components/firm/FirmReviews";
import { FirmChallenges } from "@/components/firm/FirmChallenges";
import { FirmComplaints } from "@/components/firm/FirmComplaints";
import { FirmPayouts } from "@/components/firm/FirmPayouts";
import { FirmAnnouncements } from "@/components/firm/FirmAnnouncements";

export const Route = createFileRoute("/firm/$firmId")({
  head: ({ params }) => {
    const name = decodeURIComponent(params.firmId).replace(/-/g, " ");
    return {
      meta: [
        { title: `${name} — Firm Details · RebateBoard` },
        { name: "description", content: `Full breakdown of ${name}: funding program, account options, trading rules, scaling plan, payouts, fees, and more.` },
        { property: "og:title", content: `${name} — Firm Details` },
        { property: "og:description", content: `Full breakdown of ${name}: funding, rules, payouts, fees, and more.` },
      ],
    };
  },
  component: FirmDetailsPage,
});

const sideTabs = [
  "Overview", "Funding Program", "Account Option", "Trading Rules", "Scaling Plan",
  "Profit Split & Payout", "Fees and Pricing", "Supported Instrument & Leverage",
  "Platform & Technology", "Community & Education", "Regulation and Trust",
  "Customer Support", "Restricted Countries", "Pros & Cons",
];

/* ================================================================
 * Saved-brand lookup (mirrors the admin "rb-admin:brands" payload)
 * ================================================================ */
type SavedBrand = {
  name: string;
  slug?: string;
  category?: string;
  thumbnail?: string;
  cover?: string;
  primaryColor?: string;
  identity?: { founded?: string; hq?: string; tagline?: string; description?: string; supportEmail?: string; editorial?: string };
  founder?: { ceo?: string; founderLi?: string; founderX?: string; yt?: string; tags?: string };
  broker?: Record<string, string>;
  prop?: Record<string, string>;
  exchange?: Record<string, string>;
  tool?: Record<string, string>;
  editorial?: { keyFeatures?: string; tradingConditions?: string; pros?: string; cons?: string; bestFor?: string; verdict?: string };
  profile?: {
    leverageOverall?: string; leverageByAsset?: string; timeLimit?: string; overnightHolding?: string;
    community?: string; supportChannels?: string; supportResponse?: string; supportCommunity?: string;
    restrictedCountries?: string; legalEntity?: string; transparencyNote?: string; publicFeedback?: string;
  };
  cashback?: { defaultPct?: number; maxPct?: number; type?: string; terms?: string; affiliateLink?: string };
  challenges?: Array<{ price?: number; originalPrice?: number; program?: string; size?: string }>;
  trust?: { tbi?: number; licenseNo?: string; legalEntity?: string; transparencyNote?: string; publicFeedback?: string };
  tbi?: number;
};

function useSavedBrand(slugOrName: string): SavedBrand | null {
  const [brand, setBrand] = useState<SavedBrand | null>(null);
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = sessionStorage.getItem("rb-admin:brands");
      if (!raw) return;
      const list: SavedBrand[] = JSON.parse(raw);
      const target = slugOrName.trim().toLowerCase();
      const found = list.find((b) =>
        (b.slug && b.slug.toLowerCase() === target) ||
        (b.name && b.name.trim().toLowerCase() === target.replace(/-/g, " ")) ||
        (b.name && b.name.trim().toLowerCase().replace(/\s+/g, "-") === target),
      );
      setBrand(found ?? null);
    } catch { setBrand(null); }
  }, [slugOrName]);
  return brand;
}

/* ================================================================
 * Helpers — split free text into list items
 * ================================================================ */
const splitLines = (s?: string): string[] =>
  (s ?? "").split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
const splitCsv = (s?: string): string[] =>
  (s ?? "").split(",").map((l) => l.trim()).filter(Boolean);

/* ================================================================
 * Default fallback content (used when no saved brand exists)
 * ================================================================ */
const defaultFundingSteps = [
  { n: 1, lines: ["Profit Target: 10%", "Time Limit: None", "Min Days: 5", "Max Loss: 5%"] },
  { n: 2, lines: ["Profit Target: 5%", "Time Limit: None", "Min Days: 5", "Max Loss: 5%"] },
  { n: 3, lines: ["Profit Split: 80%", "Scaling: Yes", "First Payout: 14d", "Refundable: Yes"] },
  { n: 4, lines: ["Instant Funded", "Bi-Weekly Payout", "Up to $4M scale", "VIP perks"] },
];

const defaultPros = ["Generous profit splits", "No time limits, no scaling caps", "Reliable payouts each week"];
const defaultCons = ["Premium pricing on challenges", "No swing-only accounts", "Restricted in some countries"];

const defaultCommunity = [
  { n: 1, title: "VIP Trading", body: "Community-driven trading challenges" },
  { n: 2, title: "Academy", body: "Weekly webinars & courses" },
  { n: 3, title: "Discord", body: "Active Discord with mentors" },
  { n: 4, title: "Trader Dashboard", body: "Free tools for funded traders" },
];

const platformItemsDefault = [
  { n: 1, title: "Platforms", body: "MT4, MT5, cTrader" },
  { n: 2, title: "Execution", body: "Low-latency execution" },
  { n: 3, title: "Tools", body: "Risk dashboard, analytics" },
  { n: 4, title: "Mobile", body: "iOS & Android apps" },
];

/* ================================================================ */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="glass rounded-2xl p-5 ring-1 ring-violet-400/20">
      <h3 className="mb-3 text-base font-bold">{title}</h3>
      {children}
    </section>
  );
}

function FragmentRow({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <>
      <dt className="text-muted-foreground">{label}:</dt>
      <dd>{value}</dd>
    </>
  );
}

function NumCard({ n, title, body }: { n: number; title: string; body: string }) {
  return (
    <div className="rounded-xl bg-white/[0.04] p-3 ring-1 ring-white/10">
      <div className="flex items-center gap-2">
        <span className="grid h-6 w-6 place-items-center rounded-full bg-white text-[10px] font-bold text-violet-700">{n}</span>
        <span className="text-[11px] font-semibold">{title}</span>
      </div>
      <div className="mt-1 text-[10px] text-muted-foreground">{body}</div>
      <Star className="mt-1 h-3 w-3 text-yellow-400" />
    </div>
  );
}

function renderSection(idx: number, name: string, brand: SavedBrand | null): React.ReactNode {
  const prop = brand?.prop ?? {};
  const broker = brand?.broker ?? {};
  const exch = brand?.exchange ?? {};
  const profile = brand?.profile ?? {};
  const ed = brand?.editorial ?? {};
  const trust = brand?.trust ?? {};
  const identity = brand?.identity ?? {};

  switch (idx) {
    case 0: {
      const desc = identity.description || identity.editorial ||
        `Overview of ${name}: a quick summary of the firm, who it serves, the asset classes covered, and what sets the program apart.`;
      const yt = brand?.founder?.yt;
      return (
        <section className="glass rounded-2xl p-5 ring-1 ring-violet-400/20">
          <h2 className="text-lg font-bold">{brand?.name ?? name}</h2>
          {identity.tagline && <p className="mt-1 text-xs text-fuchsia-300">{identity.tagline}</p>}
          <div className="mt-3 grid gap-4 md:grid-cols-[1fr_220px]">
            <p className="text-xs leading-relaxed text-muted-foreground">{desc}</p>
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-fuchsia-500/30 to-violet-600/30 p-3 ring-1 ring-fuchsia-300/30">
              <div className="grid h-24 place-items-center">
                {yt ? (
                  <a href={yt} target="_blank" rel="noreferrer" className="grid h-10 w-10 place-items-center rounded-full bg-white/20 ring-1 ring-white/30 backdrop-blur">
                    <Play className="h-4 w-4 fill-white text-white" />
                  </a>
                ) : (
                  <button className="grid h-10 w-10 place-items-center rounded-full bg-white/20 ring-1 ring-white/30 backdrop-blur">
                    <Play className="h-4 w-4 fill-white text-white" />
                  </button>
                )}
              </div>
              <div className="text-center text-[10px] font-semibold">{yt ? "Watch review" : "Video coming soon"}</div>
            </div>
          </div>
          {(identity.founded || identity.hq || identity.supportEmail) && (
            <dl className="mt-4 grid grid-cols-[140px_1fr] gap-y-2 text-[11px]">
              <FragmentRow label="Founded" value={identity.founded ?? ""} />
              <FragmentRow label="HQ" value={identity.hq ?? ""} />
              <FragmentRow label="Support" value={identity.supportEmail ?? ""} />
            </dl>
          )}
        </section>
      );
    }

    case 1: {
      // Funding Program — derive from prop.* or fall back
      const steps = brand?.prop ? [
        { n: 1, lines: [
          prop.profitTarget ? `Profit Target: ${prop.profitTarget}` : "",
          prop.minDays ? `Min Days: ${prop.minDays}` : "",
          prop.dailyDD ? `Daily DD: ${prop.dailyDD}` : "",
          prop.maxDD ? `Max Loss: ${prop.maxDD}` : "",
        ].filter(Boolean) },
        { n: 2, lines: [
          prop.evalType ? `Evaluation: ${prop.evalType}` : "",
          prop.profitSplit ? `Profit Split: ${prop.profitSplit}` : "",
          prop.scaling ? `Scaling: ${prop.scaling}` : "",
          prop.maxAlloc ? `Max Allocation: ${prop.maxAlloc}` : "",
        ].filter(Boolean) },
      ].filter((s) => s.lines.length) : defaultFundingSteps;

      const list = steps.length ? steps : defaultFundingSteps;

      return (
        <Section title="Funding Program">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {list.map((s) => (
              <div key={s.n} className="rounded-2xl bg-white/[0.04] p-3 ring-1 ring-white/10">
                <div className="text-xs font-bold">Step {s.n}</div>
                <ul className="mt-2 space-y-1 text-[10px] text-muted-foreground">
                  {s.lines.map((l) => <li key={l}>{l}</li>)}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center justify-center gap-2">
            <button className="grid h-7 w-7 place-items-center rounded-full bg-white/10 ring-1 ring-white/15"><ChevronLeft className="h-3 w-3" /></button>
            <button className="grid h-7 w-7 place-items-center rounded-full bg-white/10 ring-1 ring-white/15"><ChevronRight className="h-3 w-3" /></button>
          </div>
        </Section>
      );
    }

    case 2: {
      // Account Option
      const sizes = prop.sizes || broker.accountTypes || exch.supportedAssets || "$2,500, $5,000, $10,000, $25,000, $50,000, $100,000";
      const platform = prop.platform || broker.platforms || "MetaTrader 5 (MT5)";
      const instruments = prop.instruments || broker.assets || "Forex, Indices, Commodities, Stocks, CFDs";
      const leverage = profile.leverageOverall || broker.maxLeverage || "1:30";
      return (
        <Section title="Account Option">
          <div className="rounded-xl bg-white/[0.04] p-4 ring-1 ring-white/10">
            <dl className="grid grid-cols-[140px_1fr] gap-y-2 text-[11px]">
              <FragmentRow label="Sizes Available" value={sizes} />
              <FragmentRow label="Leverage" value={leverage} />
              <FragmentRow label="Platform" value={platform} />
              <FragmentRow label="Instruments" value={instruments} />
            </dl>
          </div>
        </Section>
      );
    }

    case 3: {
      // Trading Rules
      const rules = [
        { label: "Time Limit", value: profile.timeLimit || "None" },
        { label: "Minimum Trading Days", value: prop.minDays || "3 per phase" },
        { label: "News Trading", value: prop.news || broker.scalping || "Allowed" },
        { label: "Weekend Holding", value: prop.weekend || "Allowed" },
        { label: "Overnight Holding", value: profile.overnightHolding || "Allowed" },
        { label: "Expert Advisors (EAs)", value: prop.ea || "Allowed" },
        { label: "Copy Trading", value: prop.copyTrading || broker.copyTrading || exch.copyTrading || "" },
        { label: "Hedging", value: broker.hedging || "" },
      ];
      return (
        <Section title="Trading Rules">
          <div className="rounded-xl bg-white/[0.04] p-4 ring-1 ring-white/10">
            <dl className="grid grid-cols-[180px_1fr] gap-y-3 text-[11px]">
              {rules.map((r) => (<FragmentRow key={r.label} label={r.label} value={r.value} />))}
            </dl>
            {(prop.consistency || prop.prohibited) && (
              <ul className="mt-4 list-disc space-y-1 pl-5 text-[10px] text-muted-foreground">
                {prop.consistency && <li>Consistency Rule: {prop.consistency}</li>}
                {prop.prohibited && <li>Prohibited: {prop.prohibited}</li>}
              </ul>
            )}
          </div>
        </Section>
      );
    }

    case 4: {
      // Scaling Plan
      const items = (prop.scaling || prop.maxAlloc) ? [
        prop.scaling && { title: "Scaling Plan", body: prop.scaling },
        prop.maxAlloc && { title: "Max Allocation", body: prop.maxAlloc },
        prop.profitSplit && { title: "Profit Split", body: prop.profitSplit },
      ].filter(Boolean) as { title: string; body: string }[] : [
        { title: "Scaling Potential", body: "Up to $4 million" },
        { title: "Tier Conditions", body: "Higher splits as you grow" },
        { title: "VIP Tiers", body: "Tier-based perks at scale" },
      ];
      return (
        <Section title="Scaling Plan">
          <div className="grid gap-3 sm:grid-cols-3">
            {items.map((s, i) => (
              <div key={i} className="rounded-xl bg-white/[0.04] p-3 ring-1 ring-white/10">
                <div className="text-[11px] font-semibold">{s.title}</div>
                <div className="mt-1 text-[10px] text-muted-foreground">{s.body}</div>
              </div>
            ))}
          </div>
        </Section>
      );
    }

    case 5: {
      // Profit Split & Payout
      const cards = [
        prop.profitSplit && `Base Split: ${prop.profitSplit}`,
        brand?.cashback?.maxPct && `Max Cashback: ${brand.cashback.maxPct}%`,
        prop.payoutSchedule && `Payout Frequency: ${prop.payoutSchedule}`,
        prop.payoutMethods && `Withdrawal Methods: ${prop.payoutMethods}`,
        broker.withdrawals && `Withdrawal Methods: ${broker.withdrawals}`,
        broker.withdrawalSpeed && `Withdrawal Speed: ${broker.withdrawalSpeed}`,
        exch.withdrawals && `Withdrawals: ${exch.withdrawals}`,
      ].filter(Boolean) as string[];
      const list = cards.length ? cards : [
        "Base Split: 80%", "Max Split: 100% for VIP", "First Payout: After 7 days",
        "Payout Frequency: Weekly", "Withdrawal Methods: Crypto, Bank Transfer, Wise",
      ];
      return (
        <Section title="Profit Split & Payout">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((p, i) => (
              <div key={i} className="rounded-xl bg-white/[0.04] p-3 text-[10px] ring-1 ring-white/10">{p}</div>
            ))}
          </div>
        </Section>
      );
    }

    case 6: {
      // Fees & Pricing
      const items: { title: string; body: string }[] = [];
      if (prop.pricing) items.push({ title: "Challenge Pricing", body: prop.pricing });
      if (prop.discountCode) items.push({ title: "Discount Code", body: prop.discountCode });
      if (broker.commission) items.push({ title: "Commission", body: broker.commission });
      if (broker.spreads) items.push({ title: "Spreads", body: broker.spreads });
      if (exch.fees) items.push({ title: "Trading Fees", body: exch.fees });
      if (brand?.challenges?.length) {
        const min = Math.min(...brand.challenges.map((c) => c.price ?? Infinity));
        if (Number.isFinite(min)) items.push({ title: "Starting From", body: `$${min}` });
      }
      const list = items.length ? items : [
        { title: "1-Step / 2-Step Challenge", body: "Starting from $39" },
        { title: "Instant Funding", body: "Starting from $59" },
        { title: "Reset Fee", body: "Auto-drop on restart" },
        { title: "Reset Discounts", body: "10% on resets, weekly" },
      ];
      return (
        <Section title="Fees and Pricing">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {list.map((f, i) => (
              <div key={i} className="rounded-xl bg-white/[0.04] p-3 ring-1 ring-white/10">
                <div className="text-[11px] font-semibold">{f.title}</div>
                <div className="mt-1 text-[10px] text-muted-foreground">{f.body}</div>
              </div>
            ))}
          </div>
        </Section>
      );
    }

    case 7: {
      // Supported Instrument & Leverage
      const byAsset = profile.leverageByAsset;
      const entries: { label: string; value: string }[] = [];
      if (byAsset) {
        byAsset.split(",").map((p) => p.trim()).filter(Boolean).forEach((p) => {
          const [label, ...rest] = p.split(/[:\s]/);
          entries.push({ label, value: rest.join(" ").trim() || p });
        });
      } else {
        if (prop.instruments || broker.assets) entries.push({ label: "Instruments", value: prop.instruments || broker.assets || "" });
        if (broker.maxLeverage || profile.leverageOverall) entries.push({ label: "Leverage", value: profile.leverageOverall || broker.maxLeverage || "" });
      }
      const list = entries.length ? entries : [
        { label: "Forex", value: "Majors, Minors, Exotics" },
        { label: "Indices", value: "US30, NAS100, S&P500" },
        { label: "Commodities", value: "Gold, Oil" },
        { label: "Stocks & CFDs", value: "Select assets" },
        { label: "Leverage", value: "1:30 (across all instruments)" },
      ];
      return (
        <Section title="Supported Instrument & Leverage">
          <div className="rounded-xl bg-white/[0.04] p-4 ring-1 ring-white/10">
            <dl className="grid grid-cols-[140px_1fr] gap-y-2 text-[11px]">
              {list.map((r) => (<FragmentRow key={r.label} label={r.label} value={r.value} />))}
            </dl>
          </div>
        </Section>
      );
    }

    case 8: {
      // Platform & Technology
      const platforms = prop.platform || broker.platforms;
      const items = platforms ? [
        { n: 1, title: "Platforms", body: platforms },
        broker.execution && { n: 2, title: "Execution", body: broker.execution },
        exch.security && { n: 3, title: "Security", body: exch.security },
        (brand?.tool?.integrations) && { n: 4, title: "Integrations", body: brand!.tool!.integrations },
      ].filter(Boolean) as typeof platformItemsDefault : platformItemsDefault;
      return (
        <Section title="Platform & Technology">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {items.map((p) => (<NumCard key={p.n} {...p} />))}
          </div>
        </Section>
      );
    }

    case 9: {
      // Community & Education
      const lines = splitLines(profile.community);
      const items = lines.length
        ? lines.slice(0, 4).map((l, i) => {
            const [title, ...rest] = l.split("|");
            return { n: i + 1, title: (title ?? "").trim(), body: rest.join("|").trim() };
          })
        : defaultCommunity;
      return (
        <Section title="Community & Education">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {items.map((p) => (<NumCard key={p.n} {...p} />))}
          </div>
        </Section>
      );
    }

    case 10: {
      // Regulation and Trust
      const legal = trust.legalEntity || profile.legalEntity;
      const license = trust.licenseNo || broker.regulations || exch.licenses;
      const transparency = trust.transparencyNote || profile.transparencyNote || "Terms and FAQs well-documented";
      const feedback = trust.publicFeedback || profile.publicFeedback || "Positive Trustpilot and Discord scores";
      const items = [
        { icon: Building2, title: "Legal Entity", body: legal || "—" },
        { icon: FileText, title: "License", body: license || "International Brokerage License" },
        { icon: Eye, title: "Transparency", body: transparency },
        { icon: MessageSquare, title: "Public Feedback", body: feedback },
      ];
      return (
        <Section title="Regulation and Trust">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {items.map((t) => (
              <div key={t.title} className="rounded-xl bg-white/[0.04] p-3 ring-1 ring-white/10">
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-white/10 ring-1 ring-white/15">
                  <t.icon className="h-4 w-4" />
                </div>
                <div className="mt-2 text-[11px] font-semibold">{t.title}</div>
                <div className="mt-1 text-[10px] text-muted-foreground">{t.body}</div>
              </div>
            ))}
          </div>
        </Section>
      );
    }

    case 11: {
      // Customer Support
      const channels = profile.supportChannels || "Email, Helpdesk, Discord";
      const response = profile.supportResponse || "Fast (typically <24h)";
      const community = profile.supportCommunity || "Active Discord group with staff engagement";
      return (
        <Section title="Customer Support">
          <div className="flex items-start gap-4 rounded-xl bg-white/[0.04] p-4 ring-1 ring-white/10">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-fuchsia-500/30 ring-1 ring-fuchsia-300/30">
              <Headphones className="h-5 w-5" />
            </div>
            <div className="flex-1 space-y-2 text-[11px]">
              <div className="rounded-md bg-white/[0.04] px-3 py-1.5 ring-1 ring-white/10">Channels: {channels}</div>
              <div className="rounded-md bg-white/[0.04] px-3 py-1.5 ring-1 ring-white/10">Response Time: {response}</div>
              <div className="rounded-md bg-white/[0.04] px-3 py-1.5 ring-1 ring-white/10">Community Support: {community}</div>
              {identity.supportEmail && (
                <div className="rounded-md bg-white/[0.04] px-3 py-1.5 ring-1 ring-white/10">Email: {identity.supportEmail}</div>
              )}
            </div>
          </div>
        </Section>
      );
    }

    case 12: {
      // Restricted Countries
      const list = splitCsv(profile.restrictedCountries || broker.restrictedCountries);
      return (
        <Section title="Restricted Countries">
          {list.length ? (
            <div className="flex flex-wrap gap-2">
              {list.map((c) => (
                <span key={c} className="rounded-full bg-rose-500/15 px-3 py-1 text-[11px] font-semibold ring-1 ring-rose-400/30">{c}</span>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border-2 border-dashed border-white/10 bg-white/5 p-6 text-center text-[11px] text-muted-foreground">
              No country restrictions on file.
            </div>
          )}
        </Section>
      );
    }

    case 13: {
      // Pros & Cons
      const pros = splitLines(ed.pros);
      const cons = splitLines(ed.cons);
      const proList = pros.length ? pros : defaultPros;
      const conList = cons.length ? cons : defaultCons;
      return (
        <Section title="Pros & Cons">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl bg-white/[0.04] p-4 ring-1 ring-white/10">
              <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-emerald-500/20 px-3 py-1 text-[11px] font-semibold ring-1 ring-emerald-400/30">
                <Check className="h-3 w-3" /> Pros
              </div>
              <ul className="space-y-2">
                {proList.map((p) => (
                  <li key={p} className="rounded-full bg-fuchsia-500/15 px-3 py-1.5 text-[11px] ring-1 ring-fuchsia-300/20">{p}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl bg-white/[0.04] p-4 ring-1 ring-white/10">
              <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-rose-500/20 px-3 py-1 text-[11px] font-semibold ring-1 ring-rose-400/30">
                <X className="h-3 w-3" /> Cons
              </div>
              <ul className="space-y-2">
                {conList.map((p) => (
                  <li key={p} className="rounded-full bg-fuchsia-500/15 px-3 py-1.5 text-[11px] ring-1 ring-fuchsia-300/20">{p}</li>
                ))}
              </ul>
            </div>
          </div>
        </Section>
      );
    }

    default:
      return null;
  }
}

function FirmDetailsPage() {
  const { firmId } = Route.useParams();
  const navigate = useNavigate();
  const brand = useSavedBrand(firmId);
  const name = brand?.name ?? decodeURIComponent(firmId).replace(/-/g, " ");
  const [activeIdx, setActiveIdx] = useState(0);
  const topTabs = ["Overview", "Reviews", "Challenges", "Complaints", "Payouts", "Announcement", "TBI index"] as const;
  const [topTab, setTopTab] = useState<typeof topTabs[number]>("Overview");

  const tags = useMemo(
    () => (brand?.founder?.tags ? brand.founder.tags.split(",").map((t) => t.trim()).filter(Boolean) : []),
    [brand],
  );
  const logoInitials = (brand?.name ?? name).split(/\s+/).map((w) => w[0]).join("").slice(0, 3).toUpperCase();

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#1a0b2e] via-[#1f0d3d] to-[#150829] text-white">
      <SiteHeader />
      <div className="glow-orb h-[600px] w-[600px] -left-40 top-20" />
      <div className="glow-orb h-[700px] w-[700px] right-0 top-[40%] opacity-60" />

      <div className="relative mx-auto max-w-[1100px] px-4 py-6">
        <button
          onClick={() => navigate({ to: "/" })}
          className="glass-pill mb-4 inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </button>

        <div className="glass-strong rounded-3xl bg-gradient-to-br from-violet-900/40 via-fuchsia-900/20 to-transparent p-5 ring-1 ring-violet-400/20">
          <div className="grid gap-5 md:grid-cols-[1fr_180px_180px]">
            <div className="flex items-start gap-4">
              {brand?.thumbnail ? (
                <img src={brand.thumbnail} alt={name} className="h-16 w-16 rounded-2xl object-contain bg-white p-1" />
              ) : (
                <div className="grid h-16 w-16 place-items-center rounded-2xl bg-white text-xs font-bold text-violet-700">{logoInitials || "ACY"}</div>
              )}
              <div className="flex-1">
                <div className="text-lg font-bold">{name}</div>
                <div className="text-[11px] text-muted-foreground">By: {brand?.founder?.ceo ?? "—"}</div>
                <div className="mt-3 grid grid-cols-2 gap-3 text-[11px]">
                  <div>
                    <div className="text-muted-foreground">Country</div>
                    <div className="font-semibold">{brand?.identity?.hq ?? "—"}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Year</div>
                    <div className="font-semibold">{brand?.identity?.founded ?? "—"}</div>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {tags.length ? tags.slice(0, 4).map((t) => (
                    <span key={t} className="rounded-full bg-fuchsia-500/30 px-3 py-1 text-[10px] font-semibold ring-1 ring-fuchsia-300/40">{t.toUpperCase()}</span>
                  )) : (
                    <>
                      <span className="rounded-full bg-fuchsia-500/30 px-3 py-1 text-[10px] font-semibold ring-1 ring-fuchsia-300/40">30% OFF</span>
                      <span className="rounded-full bg-fuchsia-500/30 px-3 py-1 text-[10px] font-semibold ring-1 ring-fuchsia-300/40">REBATE20</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-white/[0.04] p-3 ring-1 ring-white/10">
              <div className="text-[10px] text-muted-foreground">Rating</div>
              <div className="mt-1 text-2xl font-bold">
                {(((brand?.tbi ?? brand?.trust?.tbi ?? 73) / 10) || 7.3).toFixed(1)}
                <span className="text-sm text-muted-foreground">/10</span>
              </div>
              <div className="mt-1 text-[10px] text-muted-foreground">TBI Score</div>
              <div className="mt-2 text-[10px] text-muted-foreground">Avg App Rating</div>
              <div className="text-sm font-bold">4.2</div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {["Credibility & Transparency", "Payout Predictability"].map((t) => (
                <div key={t} className="rounded-2xl bg-white/[0.04] p-2 ring-1 ring-white/10">
                  <div className="grid h-16 place-items-center">
                    <div className="h-12 w-12 rotate-45 bg-gradient-to-br from-fuchsia-400/60 to-violet-600/60 ring-1 ring-fuchsia-300/30" />
                  </div>
                  <div className="mt-1 text-center text-[9px] text-muted-foreground leading-tight">{t}</div>
                  <div className="text-center text-xs font-bold">6.5</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {topTabs.map((t) => (
            <button
              key={t}
              onClick={() => setTopTab(t)}
              className={
                "rounded-full px-4 py-1.5 text-[11px] font-semibold ring-1 transition " +
                (topTab === t
                  ? "bg-white text-[#1a0b2e] ring-white/40"
                  : "bg-fuchsia-300/20 text-white ring-fuchsia-300/20 hover:bg-fuchsia-300/30")
              }
            >
              {t}
            </button>
          ))}
        </div>

        {topTab === "Reviews" ? (
          <div className="mt-4"><FirmReviews firmName={name} firmSlug={firmId} /></div>
        ) : topTab === "Challenges" ? (
          <div className="mt-4"><FirmChallenges firmName={name} /></div>
        ) : topTab === "Complaints" ? (
          <div className="mt-4"><FirmComplaints firmName={name} /></div>
        ) : topTab === "Payouts" ? (
          <div className="mt-4"><FirmPayouts firmName={name} /></div>
        ) : topTab === "Announcement" ? (
          <div className="mt-4"><FirmAnnouncements firmName={name} /></div>
        ) : topTab !== "Overview" ? (
          <div className="mt-4 glass rounded-2xl p-10 text-center text-sm text-muted-foreground ring-1 ring-white/10">
            <div className="text-base font-semibold text-white">{topTab}</div>
            <p className="mt-2">This section is coming soon.</p>
          </div>
        ) : (
          <div className="mt-4 grid gap-4 lg:grid-cols-[200px_1fr]">
            <aside className="glass self-start rounded-2xl p-2 ring-1 ring-violet-400/20 lg:sticky lg:top-[180px]">
              <ul className="space-y-1">
                {sideTabs.map((t, i) => (
                  <li key={t}>
                    <button
                      onClick={() => setActiveIdx(i)}
                      className={
                        "w-full rounded-full px-3 py-1.5 text-left text-[11px] font-medium transition " +
                        (i === activeIdx
                          ? "bg-fuchsia-300/30 text-white ring-1 ring-fuchsia-300/40"
                          : "text-muted-foreground hover:bg-white/[0.04] hover:text-white")
                      }
                    >
                      {t}
                    </button>
                  </li>
                ))}
              </ul>
            </aside>

            <div key={activeIdx} className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
              {renderSection(activeIdx, name, brand)}
            </div>
          </div>
        )}
      </div>
    <SiteFooter />
    </div>
  );
}
