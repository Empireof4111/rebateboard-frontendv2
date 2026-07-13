import { createFileRoute } from "@tanstack/react-router";
import {
  Bell,
  CheckCircle2,
  MessageCircle,
  Play,
  Send,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

export const Route = createFileRoute("/community")({
  head: () => ({
    meta: [
      { title: "Community | RebateBoard" },
      {
        name: "description",
        content:
          "Join the RebateBoard community for trader discussions, payout insights, cashback opportunities, product updates, and safer trading conversations.",
      },
    ],
  }),
  component: CommunityPage,
});

const communityConfig = {
  discord: "https://discord.gg/6kW2vnC6t6",
  telegram: "https://t.me/rebateboard",
  x: "https://x.com/rebateboard",
  youtube: "https://youtube.com/@rebateboard",
  instagram: "https://instagram.com/rebateboard",
  tiktok: "https://www.tiktok.com/@rebateboard",
};

const platforms = [
  {
    name: "Discord",
    description: "Main community hub for discussions, support rooms, announcements, giveaways, and early testing.",
    href: communityConfig.discord,
    icon: MessageCircle,
    primary: true,
    cta: "Join Discord",
  },
  {
    name: "Telegram",
    description: "Fast community alerts, platform updates, and launch announcements.",
    href: communityConfig.telegram,
    icon: Send,
    cta: "Join Telegram",
  },
  {
    name: "X",
    description: "Public updates, product notes, education threads, and community highlights.",
    href: communityConfig.x,
    icon: Bell,
    cta: "Follow",
  },
  {
    name: "YouTube",
    description: "Tutorials, platform walkthroughs, interviews, and education content.",
    href: communityConfig.youtube,
    icon: Play,
    cta: "Watch",
  },
  {
    name: "Instagram",
    description: "Visual updates, short-form education, and community milestones.",
    href: communityConfig.instagram,
    icon: Sparkles,
    cta: "Follow",
  },
  {
    name: "TikTok",
    description: "Short updates, product explainers, and trader education clips.",
    href: communityConfig.tiktok,
    icon: Play,
    cta: "Follow",
  },
] as const;

const benefits = [
  "Trading discussions without guaranteed-profit claims",
  "Platform updates and launch announcements",
  "Cashback opportunities and education",
  "Brand, review, and payout conversations",
  "Giveaways and community campaigns",
  "Early product testing and direct feedback",
];

const guidelines = [
  "Be respectful to traders, brands, and moderators.",
  "No scams, impersonation, or fake support accounts.",
  "No guaranteed-profit claims or misleading signals.",
  "No unauthorized promotions or spam.",
  "Protect private account, wallet, and identity information.",
  "Use official support channels for account-specific issues.",
];

function CommunityPage() {
  return (
    <div className="min-h-screen bg-[var(--rb-bg-canvas)] text-white">
      <SiteHeader />
      <main className="container-app space-y-7 py-8 sm:py-12">
        <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_20%_0%,rgba(217,70,239,0.2),transparent_35%),linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.025))] p-6 shadow-[0_24px_110px_rgba(88,28,135,0.24)] sm:p-8 lg:p-10">
          <div className="grid gap-8 lg:grid-cols-[1fr_0.85fr] lg:items-end">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-fuchsia-300/25 bg-fuchsia-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-fuchsia-100">
                <Users className="h-3.5 w-3.5" />
                Community
              </div>
              <h1 className="mt-8 max-w-4xl text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
                Join the RebateBoard Community
              </h1>
              <p className="mt-5 max-w-3xl text-base leading-8 text-white/68 sm:text-lg">
                Connect with traders, share experiences, learn from the community, discover new opportunities, and help shape the future of RebateBoard.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <a
                  href={communityConfig.discord}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-full rb-gradient-primary px-5 py-3 text-sm font-black shadow-[0_0_30px_rgba(192,132,252,0.32)] transition hover:scale-[1.01]"
                >
                  Join Our Discord
                  <MessageCircle className="h-4 w-4" />
                </a>
                <a
                  href={communityConfig.telegram}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.045] px-5 py-3 text-sm font-bold text-white/85 transition hover:border-fuchsia-300/35 hover:bg-white/[0.08]"
                >
                  Join Telegram
                  <Send className="h-4 w-4" />
                </a>
              </div>
            </div>

            <div className="rounded-[1.6rem] border border-white/10 bg-black/20 p-5">
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#5865F2]/20 ring-1 ring-[#5865F2]/35">
                  <MessageCircle className="h-6 w-6 text-[#dbe1ff]" />
                </div>
                <div>
                  <h2 className="text-xl font-black">Discord is the main hub</h2>
                  <p className="mt-1 text-sm text-white/55">Announcements, product feedback, support rooms, and trader discussions.</p>
                </div>
              </div>
              <div className="mt-5 grid gap-2">
                {["Platform updates", "Support channels", "Trader discussions", "Giveaways", "Early access testing"].map((item) => (
                  <div key={item} className="flex items-center gap-3 rounded-2xl bg-white/[0.045] px-4 py-3 text-sm text-white/72">
                    <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          {benefits.map((benefit) => (
            <article key={benefit} className="rounded-[1.5rem] border border-white/10 bg-white/[0.045] p-5 shadow-[0_18px_70px_rgba(42,12,84,0.18)]">
              <Sparkles className="h-5 w-5 text-violet-200" />
              <p className="mt-4 text-sm leading-6 text-white/68">{benefit}</p>
            </article>
          ))}
        </section>

        <section>
          <h2 className="text-3xl font-black">Official Channels</h2>
          <p className="mt-2 text-sm text-white/58">Use only official RebateBoard links. Discord is the primary community space.</p>
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {platforms.map((platform) => (
              <a
                key={platform.name}
                href={platform.href}
                target="_blank"
                rel="noreferrer"
                className={`rounded-[1.5rem] border p-5 transition hover:-translate-y-1 ${
                  platform.primary
                    ? "border-[#5865F2]/35 bg-[#5865F2]/12"
                    : "border-white/10 bg-white/[0.045] hover:border-primary/30"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="grid h-11 w-11 place-items-center rounded-2xl border border-white/10 bg-white/[0.06]">
                    <platform.icon className="h-5 w-5 text-violet-100" />
                  </div>
                  <span className="rounded-full bg-white/8 px-3 py-1 text-xs font-black text-white/68">{platform.cta}</span>
                </div>
                <h3 className="mt-4 text-lg font-black">{platform.name}</h3>
                <p className="mt-2 text-sm leading-6 text-white/58">{platform.description}</p>
              </a>
            ))}
          </div>
        </section>

        <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5 sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h2 className="text-2xl font-black">Community guidelines</h2>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-white/62">
                RebateBoard is strongest when traders share useful, evidence-led information. These principles keep the community trustworthy as it grows.
              </p>
            </div>
            <a
              href={communityConfig.discord}
              target="_blank"
              rel="noreferrer"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-white/[0.07] px-5 py-3 text-sm font-bold transition hover:bg-white/[0.1]"
            >
              Open Discord
              <MessageCircle className="h-4 w-4" />
            </a>
          </div>
          <div className="mt-5 grid gap-2 md:grid-cols-2">
            {guidelines.map((item) => (
              <div key={item} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-black/15 px-4 py-3 text-sm text-white/72">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[1.5rem] border border-red-300/20 bg-red-500/10 p-5 sm:p-6">
          <div className="flex gap-4">
            <ShieldAlert className="mt-1 h-6 w-6 shrink-0 text-red-200" />
            <div>
              <h2 className="text-xl font-black text-red-100">Community safety</h2>
              <p className="mt-2 text-sm leading-7 text-white/68">
                RebateBoard staff will never request your password, wallet seed phrase, private keys, payment, or sensitive account credentials through private messages.
              </p>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
