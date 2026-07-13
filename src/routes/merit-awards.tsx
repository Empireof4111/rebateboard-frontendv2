import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Award,
  BarChart3,
  CheckCircle2,
  ClipboardCheck,
  Crown,
  FileText,
  Scale,
  ShieldCheck,
  Trophy,
  Users,
  Vote,
} from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import {
  fetchPublicMeritAwards,
  type MeritAwardCategory,
  type MeritAwardsBoard,
  type MeritAwardStatus,
} from "@/lib/merit-awards-api";

export const Route = createFileRoute("/merit-awards")({
  head: () => ({
    meta: [
      { title: "Merit Awards | RebateBoard" },
      {
        name: "description",
        content:
          "RebateBoard Merit Awards recognize measurable trust, transparency, innovation, trader support, and responsible industry standards.",
      },
    ],
  }),
  component: MeritAwardsPage,
});

const fallbackBoard: MeritAwardsBoard = {
  season: {
    id: 0,
    awardYear: "Next Season",
    publicStatus: "announcement-soon",
    publicVisible: true,
    heroTitle: "RebateBoard Merit Awards",
    heroCopy:
      "Recognizing the brands, products, communities, and people helping raise the standard of trader trust, transparency, support, education, innovation, and reliable value.",
    announcementMessage: "The next Merit Awards season will be announced soon.",
  },
  categories: [
    "Most Trusted Prop Firm",
    "Most Trusted Broker",
    "Most Trusted Crypto Exchange",
    "Best Trader Support",
    "Best Payout Experience",
    "Most Transparent Brand",
  ].map((name, index) => ({
    id: index + 1,
    seasonId: 0,
    groupName: "Brands",
    name,
    enabled: true,
    displayOrder: index,
  })),
  nominees: [],
};

const methodology = [
  { title: "Community Voice", body: "Eligible voting can contribute when voting is open and fraud controls are active.", icon: Users },
  { title: "TBI and Trust Data", body: "Brand trust signals, review quality, complaints, payout behavior, and transparency evidence may be considered.", icon: ShieldCheck },
  { title: "Editorial Assessment", body: "RebateBoard evaluates evidence, consistency, trader value, and responsible industry conduct.", icon: ClipboardCheck },
  { title: "No Purchased Winners", body: "Sponsored placements must remain separate from award outcomes.", icon: Scale },
];

function MeritAwardsPage() {
  const [board, setBoard] = useState<MeritAwardsBoard>(fallbackBoard);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetchPublicMeritAwards()
      .then((payload) => {
        if (active && payload) setBoard(payload);
      })
      .catch(() => {
        if (active) setBoard(fallbackBoard);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const state = stateCopy(board.season.publicStatus);
  const categoryGroups = useMemo(() => groupCategories(board.categories), [board.categories]);
  const winners = board.nominees.filter((item) => item.winner);
  const finalists = board.nominees.filter((item) => item.finalist && !item.winner);

  return (
    <div className="min-h-screen bg-[var(--rb-bg-canvas)] text-white">
      <SiteHeader />
      <main className="container-app space-y-7 py-8 sm:py-12">
        <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_18%_0%,rgba(245,158,11,0.16),transparent_34%),linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.025))] p-6 shadow-[0_30px_100px_rgba(0,0,0,0.35)] md:p-10">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-200/20 bg-amber-200/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-amber-100">
              <Award className="h-3.5 w-3.5" />
              RebateBoard Merit Awards
            </div>
              <h1 className="mt-5 text-4xl font-black leading-tight md:text-6xl">
              {board.season.heroTitle || "Recognizing measurable merit in trading."}
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-8 text-white/68">
              {board.season.heroCopy ||
                "The Merit Awards recognize brands, tools, communities, and people helping raise the standard of trader trust, transparency, support, education, innovation, and reliable value."}
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <a href={state.ctaHref} className="rounded-full rb-gradient-primary px-5 py-3 text-center text-sm font-black text-white">
                {state.ctaLabel}
              </a>
              <Link to="/signup" className="rounded-full border border-white/12 px-5 py-3 text-center text-sm font-bold text-white/80">
                Get Updates
              </Link>
              <Link to="/programs" className="rounded-full border border-white/12 px-5 py-3 text-center text-sm font-bold text-white/80">
                Explore Trusted Brands
              </Link>
            </div>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-[0.78fr_1.22fr]">
          <article className="rounded-[2rem] border border-white/10 bg-white/[0.045] p-6">
            <div className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.16em] text-amber-100">
              <Trophy className="h-4 w-4" />
              {board.season.awardYear}
            </div>
            <h2 className="mt-4 text-3xl font-black">{state.title}</h2>
            <p className="mt-3 text-sm leading-7 text-white/62">
              {board.season.announcementMessage || "The next Merit Awards season will be announced soon."}
            </p>
            <div className="mt-5 rounded-3xl border border-white/10 bg-black/15 p-4 text-sm leading-7 text-white/62">
              {loading
                ? "Loading the current awards season..."
                : "Public status, categories, nominees, methodology, finalists, winners, dates, and archive visibility are controlled from the awards admin workspace. This page intentionally avoids fake nominees or unfinished voting UI."}
            </div>
          </article>

          <article className="rounded-[2rem] border border-white/10 bg-white/[0.045] p-6">
            <h2 className="text-2xl font-black">Why the awards exist</h2>
            <p className="mt-3 text-sm leading-7 text-white/62">
              Trading awards should be based on evidence and trader value, not pay-to-win placements. RebateBoard Merit Awards are designed to combine community voice with measurable trust signals and transparent evaluation.
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {["Merit", "Evidence", "Community voice", "Transparent methodology"].map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-3xl border border-white/10 bg-black/15 p-4 text-sm font-black text-white/82">
                  <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                  {item}
                </div>
              ))}
            </div>
          </article>
        </section>

        <section id="categories">
          <div className="mb-4">
            <h2 className="text-3xl font-black">Award Category Framework</h2>
            <p className="mt-2 text-sm text-white/58">Final public categories should come from the admin-managed awards season.</p>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            {categoryGroups.map((group) => (
              <article key={group.title} className="rounded-[2rem] border border-white/10 bg-white/[0.045] p-5">
                <div className="flex items-center gap-2 text-lg font-black">
                  <Crown className="h-5 w-5 text-amber-100" />
                  {group.title}
                </div>
                <div className="mt-4 space-y-2">
                  {group.items.map((item) => (
                    <div key={item} className="rounded-2xl border border-white/10 bg-black/15 px-4 py-3 text-sm text-white/70">
                      {item}
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section id="methodology" className="rounded-[2rem] border border-white/10 bg-white/[0.045] p-6 md:p-8">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-3xl font-black">Winner Methodology</h2>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-white/58">
                A configurable scoring model can combine verified platform signals with award-specific evidence. Voting should inform the process without automatically determining winners unless the rules say so.
              </p>
            </div>
            <FileText className="h-8 w-8 text-violet-200" />
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {methodology.map((item) => (
              <article key={item.title} className="rounded-3xl border border-white/10 bg-black/15 p-5">
                <item.icon className="h-5 w-5 text-violet-200" />
                <h3 className="mt-4 text-base font-black">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-white/58">{item.body}</p>
              </article>
            ))}
          </div>
        </section>

        {(winners.length > 0 || finalists.length > 0) && (
          <section className="rounded-[2rem] border border-white/10 bg-white/[0.045] p-6 md:p-8">
            <h2 className="text-3xl font-black">{winners.length ? "Published Winners" : "Published Finalists"}</h2>
            <p className="mt-2 text-sm text-white/58">
              Only approved nominees are shown publicly.
            </p>
            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {(winners.length ? winners : finalists).map((item) => {
                const category = board.categories.find((cat) => cat.id === item.categoryId);
                return (
                  <article key={item.id} className="rounded-3xl border border-white/10 bg-black/15 p-5">
                    <div className="text-xs font-black uppercase tracking-[0.16em] text-amber-100">
                      {category?.name || "Award Category"}
                    </div>
                    <h3 className="mt-3 text-xl font-black">{item.name}</h3>
                    {item.summary && <p className="mt-2 text-sm leading-6 text-white/58">{item.summary}</p>}
                    {item.winnerReason && <p className="mt-3 text-xs leading-5 text-white/50">{item.winnerReason}</p>}
                  </article>
                );
              })}
            </div>
          </section>
        )}

        <section className="grid gap-4 md:grid-cols-3">
          {[
            { title: "Nominations", body: "When open, users submit category, nominee, reason, evidence, and agreement for moderation.", icon: ClipboardCheck },
            { title: "Voting", body: "Approved nominees can receive eligible account-based votes under anti-abuse rules.", icon: Vote },
            { title: "Archive", body: "Published winners should remain visible by year with supporting reasoning and methodology.", icon: BarChart3 },
          ].map((item) => (
            <article key={item.title} className="rounded-[2rem] border border-white/10 bg-white/[0.045] p-5">
              <item.icon className="h-5 w-5 text-violet-200" />
              <h3 className="mt-4 text-xl font-black">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-white/58">{item.body}</p>
            </article>
          ))}
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

function stateCopy(status: MeritAwardStatus) {
  const map: Record<MeritAwardStatus, { title: string; ctaLabel: string; ctaHref: string }> = {
    disabled: { title: "Awards are currently closed", ctaLabel: "View Award Methodology", ctaHref: "#methodology" },
    "announcement-soon": { title: "Announcement Soon", ctaLabel: "View Award Methodology", ctaHref: "#methodology" },
    "nominations-open": { title: "Nominations Open", ctaLabel: "Nominate", ctaHref: "#categories" },
    "voting-open": { title: "Voting Open", ctaLabel: "Vote Now", ctaHref: "#categories" },
    "finalists-published": { title: "Finalists Published", ctaLabel: "View Finalists", ctaHref: "#categories" },
    "winners-published": { title: "Winners Published", ctaLabel: "View Winners", ctaHref: "#categories" },
    archived: { title: "Archive", ctaLabel: "View Archive", ctaHref: "#categories" },
  };
  return map[status];
}

function groupCategories(categories: MeritAwardCategory[]) {
  const groups = new Map<string, string[]>();
  for (const category of categories) {
    if (!category.enabled) continue;
    const key = category.groupName || "Award Categories";
    groups.set(key, [...(groups.get(key) ?? []), category.name]);
  }
  if (groups.size === 0) return [{ title: "Award Categories", items: ["Categories will appear when the season opens."] }];
  return [...groups.entries()].map(([title, items]) => ({ title, items }));
}
