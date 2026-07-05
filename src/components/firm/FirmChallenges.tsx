import { useEffect, useMemo, useState, type ComponentType, type ReactNode } from "react";
import {
  ArrowRight,
  Award,
  Bookmark,
  Check,
  ChevronDown,
  Clock,
  Coins,
  DollarSign,
  Eye,
  Filter,
  Gift,
  Info,
  LayoutGrid,
  Mail,
  Percent,
  Search,
  Shield,
  Sparkles,
  Star,
  Tag,
  TrendingUp,
  X,
  Zap,
} from "lucide-react";
import { trackChallengePurchaseEvent } from "@/lib/challenge-purchases-api";
import { useAuth } from "@/lib/auth";

type Challenge = {
  id: string;
  accountStep: string;
  program: string;
  size: string;
  asset: string;
  profitTarget: string;
  dailyLoss: string;
  maxLoss: string;
  ptdd: string;
  profitSplit: number | null;
  payoutFreq: string;
  rrPoints: number;
  price: number;
  originalPrice: number;
  badge?: "Top" | "New" | "Best Value";
  discountCode?: string;
};

type ValueMode = "percent" | "money";
type ViewMode = "cards" | "phases";

const ALL = "All";

const FALLBACK_CHALLENGES: Challenge[] = [
  {
    id: "c1",
    accountStep: "2-Step",
    program: "Standard",
    size: "100K",
    asset: "FX",
    profitTarget: "8% / 5%",
    dailyLoss: "5%",
    maxLoss: "10%",
    ptdd: "1:0.77",
    profitSplit: 80,
    payoutFreq: "On Demand",
    rrPoints: 216,
    price: 431.2,
    originalPrice: 539,
    badge: "Top",
  },
  {
    id: "c2",
    accountStep: "2-Step",
    program: "Pro",
    size: "100K",
    asset: "FX",
    profitTarget: "10% / 5%",
    dailyLoss: "5%",
    maxLoss: "10%",
    ptdd: "1:0.67",
    profitSplit: 90,
    payoutFreq: "14 Days",
    rrPoints: 472,
    price: 214.5,
    originalPrice: 429,
    badge: "Best Value",
  },
  {
    id: "c3",
    accountStep: "1-Step",
    program: "Rapid",
    size: "50K",
    asset: "FX",
    profitTarget: "8%",
    dailyLoss: "4%",
    maxLoss: "8%",
    ptdd: "1:1.00",
    profitSplit: 85,
    payoutFreq: "Bi-Weekly",
    rrPoints: 328,
    price: 298.2,
    originalPrice: 497,
    badge: "New",
  },
  {
    id: "c4",
    accountStep: "Instant",
    program: "Funded",
    size: "25K",
    asset: "FX",
    profitTarget: "-",
    dailyLoss: "3%",
    maxLoss: "6%",
    ptdd: "-",
    profitSplit: 70,
    payoutFreq: "On Demand",
    rrPoints: 531,
    price: 482.3,
    originalPrice: 689,
  },
  {
    id: "c5",
    accountStep: "2-Step",
    program: "Pro",
    size: "200K",
    asset: "FX",
    profitTarget: "10% / 5%",
    dailyLoss: "5%",
    maxLoss: "10%",
    ptdd: "1:0.67",
    profitSplit: 80,
    payoutFreq: "30 Days",
    rrPoints: 845,
    price: 384.3,
    originalPrice: 549,
  },
];

export function FirmChallenges({
  firmName,
  checkoutLink,
  challenges,
}: {
  firmName: string;
  checkoutLink?: string;
  challenges?: unknown[];
}) {
  const { user } = useAuth();
  const allChallenges = useMemo(() => normalizeChallenges(challenges), [challenges]);
  const assetOptions = useMemo(
    () => optionList(allChallenges.map((challenge) => challenge.asset)),
    [allChallenges],
  );
  const sizeOptions = useMemo(
    () =>
      optionList(
        allChallenges.map((challenge) => challenge.size),
        sortAccountSize,
      ),
    [allChallenges],
  );
  const programOptions = useMemo(
    () => optionList(allChallenges.map((challenge) => challenge.program)),
    [allChallenges],
  );
  const stepOptions = useMemo(
    () =>
      optionList(
        allChallenges.map((challenge) => challenge.accountStep),
        sortStep,
      ),
    [allChallenges],
  );

  const [size, setSize] = useState(ALL);
  const [program, setProgram] = useState(ALL);
  const [step, setStep] = useState(ALL);
  const [asset, setAsset] = useState(ALL);
  const [discount, setDiscount] = useState(true);
  const [query, setQuery] = useState("");
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());
  const [active, setActive] = useState<Challenge | null>(null);
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("cards");
  const [valueMode, setValueMode] = useState<ValueMode>("percent");
  const [phaseCardIds, setPhaseCardIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!assetOptions.includes(asset)) setAsset(ALL);
    if (!sizeOptions.includes(size)) setSize(ALL);
    if (!programOptions.includes(program)) setProgram(ALL);
    if (!stepOptions.includes(step)) setStep(ALL);
  }, [asset, assetOptions, program, programOptions, size, sizeOptions, step, stepOptions]);

  const list = useMemo(() => {
    const needle = query.trim().toLowerCase();

    return allChallenges.filter((challenge) => {
      if (size !== ALL && challenge.size !== size) return false;
      if (program !== ALL && challenge.program !== program) return false;
      if (step !== ALL && challenge.accountStep !== step) return false;
      if (asset !== ALL && challenge.asset !== asset) return false;
      if (
        needle &&
        !`${challenge.accountStep} ${challenge.program} ${challenge.size} ${challenge.asset} ${
          challenge.badge ?? ""
        }`
          .toLowerCase()
          .includes(needle)
      ) {
        return false;
      }
      return true;
    });
  }, [allChallenges, asset, program, query, size, step]);

  useEffect(() => {
    if (!list.length) {
      setFocusedId(null);
      setPhaseCardIds(new Set());
      return;
    }

    if (!focusedId || !list.some((challenge) => challenge.id === focusedId)) {
      setFocusedId(list[0].id);
    }
    setPhaseCardIds((prev) => {
      const visibleIds = new Set(list.map((challenge) => challenge.id));
      const next = new Set([...prev].filter((id) => visibleIds.has(id)));
      return next.size === prev.size ? prev : next;
    });
  }, [focusedId, list]);

  const focused = list.find((challenge) => challenge.id === focusedId) ?? list[0] ?? null;

  const toggleBookmark = (id: string) => {
    setBookmarks((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleCardPhase = (id: string) => {
    setPhaseCardIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  async function openCheckout(challenge: Challenge) {
    setActive(challenge);
    try {
      await trackChallengePurchaseEvent({
        firm: firmName,
        category: "Prop Firm",
        program: `${challenge.accountStep} ${challenge.program}`,
        accountSize: challenge.size,
        amountUsd: challenge.price,
        rrPoints: challenge.rrPoints,
        rewardPreference: "cashback",
        step: "buy_click",
        source: "firm-challenges",
        email: user?.email,
      });
    } catch {
      // Analytics should never block checkout.
    }
  }

  return (
    <div className="space-y-4">
      <div className="glass relative z-50 overflow-visible rounded-2xl p-4 ring-1 ring-violet-400/20">
        <div className="flex flex-wrap items-center gap-2">
          <button className="glass-pill inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold">
            <Filter className="h-3 w-3" /> Filter
          </button>
          <PillSelect label="Assets" value={asset} options={assetOptions} onChange={setAsset} />
          <PillSelect label="Size" value={size} options={sizeOptions} onChange={setSize} />
          <PillSelect
            label="Program"
            value={program}
            options={programOptions}
            onChange={setProgram}
          />
          <PillSelect label="Step" value={step} options={stepOptions} onChange={setStep} />
          <div className="mx-1 hidden h-5 w-px bg-white/15 sm:block" />
          <button
            onClick={() => setDiscount((current) => !current)}
            className="inline-flex items-center gap-2 rounded-full bg-white/[0.04] px-3 py-1.5 text-[11px] font-semibold ring-1 ring-white/10"
          >
            <span
              className={`relative inline-block h-4 w-7 rounded-full transition ${
                discount ? "bg-gradient-to-r from-fuchsia-500 to-violet-500" : "bg-white/15"
              }`}
            >
              <span
                className={`absolute top-0.5 h-3 w-3 rounded-full bg-white transition ${
                  discount ? "left-3.5" : "left-0.5"
                }`}
              />
            </span>
            Apply Discount
          </button>
          <span className="rounded-full bg-white/[0.06] px-2.5 py-1 text-[10px] text-muted-foreground ring-1 ring-white/10">
            <span className="font-semibold text-white">{list.length}</span> Challenges
          </span>
          <div className="ml-auto flex min-w-0 flex-wrap items-center gap-2">
            <div className="glass-pill flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px]">
              <Search className="h-3 w-3 text-muted-foreground" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search..."
                className="w-28 bg-transparent outline-none placeholder:text-muted-foreground"
              />
            </div>
            <div className="inline-flex items-center gap-1 rounded-full bg-white/[0.04] p-1 ring-1 ring-white/10">
              <button
                type="button"
                onClick={() => {
                  setViewMode((current) => {
                    const next = current === "cards" ? "phases" : "cards";
                    if (next === "cards") setPhaseCardIds(new Set());
                    return next;
                  });
                }}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold transition ${
                  viewMode === "phases"
                    ? "bg-white text-[#1a0b2e]"
                    : "bg-gradient-to-r from-fuchsia-500 to-violet-600 text-white shadow-[0_0_18px_rgba(192,132,252,0.4)]"
                }`}
              >
                {viewMode === "cards" ? (
                  <Eye className="h-3 w-3" />
                ) : (
                  <LayoutGrid className="h-3 w-3" />
                )}
                {viewMode === "cards" ? "Phases" : "Cards"}
              </button>
              {viewMode === "phases" ? (
                <>
                  <ModeButton
                    active={valueMode === "percent"}
                    onClick={() => setValueMode("percent")}
                    label="%"
                    icon={<Percent className="h-3 w-3" />}
                  />
                  <ModeButton
                    active={valueMode === "money"}
                    onClick={() => setValueMode("money")}
                    label="$"
                    icon={<DollarSign className="h-3 w-3" />}
                  />
                </>
              ) : null}
            </div>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2 text-[10px] text-muted-foreground">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
          </span>
          Live data - synced from admin dashboard - prices verified by RebateBoard
        </div>
      </div>

      {list.length ? (
        <div className="relative z-0 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {list.map((challenge) => (
            <ChallengeCard
              key={challenge.id}
              challenge={challenge}
              discount={discount}
              phaseActive={viewMode === "phases" || phaseCardIds.has(challenge.id)}
              globalPhaseActive={viewMode === "phases"}
              valueMode={valueMode}
              bookmarked={bookmarks.has(challenge.id)}
              focused={challenge.id === focused?.id}
              onValueModeChange={setValueMode}
              onBookmark={() => toggleBookmark(challenge.id)}
              onFocus={() => setFocusedId(challenge.id)}
              onTogglePhases={() => {
                setFocusedId(challenge.id);
                toggleCardPhase(challenge.id);
              }}
              onBuy={() => void openCheckout(challenge)}
            />
          ))}
        </div>
      ) : (
        <div className="glass rounded-2xl p-8 text-center text-sm text-muted-foreground ring-1 ring-violet-400/20">
          No challenges match these filters.
        </div>
      )}

      {active ? (
        <CheckoutModal
          firmName={firmName}
          challenge={active}
          checkoutLink={checkoutLink}
          userEmail={user?.email}
          onClose={() => setActive(null)}
        />
      ) : null}
    </div>
  );
}

function ChallengeCard({
  challenge,
  discount,
  phaseActive,
  globalPhaseActive,
  valueMode,
  bookmarked,
  focused,
  onValueModeChange,
  onBookmark,
  onFocus,
  onTogglePhases,
  onBuy,
}: {
  challenge: Challenge;
  discount: boolean;
  phaseActive: boolean;
  globalPhaseActive: boolean;
  valueMode: ValueMode;
  bookmarked: boolean;
  focused: boolean;
  onValueModeChange: (mode: ValueMode) => void;
  onBookmark: () => void;
  onFocus: () => void;
  onTogglePhases: () => void;
  onBuy: () => void;
}) {
  const off = discountPercent(challenge);
  const highlighted = focused || challenge.badge === "Top" || challenge.badge === "Best Value";

  return (
    <article
      onMouseEnter={onFocus}
      onFocus={onFocus}
      className={`group relative overflow-hidden rounded-2xl bg-[#170929]/92 p-3 ring-1 transition ${
        highlighted
          ? "shadow-[0_22px_70px_rgba(147,51,234,0.28)] ring-fuchsia-300/35"
          : "ring-violet-400/18 hover:ring-fuchsia-300/30"
      }`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_8%,rgba(217,70,239,0.17),transparent_34%),linear-gradient(135deg,rgba(255,255,255,0.065),transparent_40%)] opacity-80" />
      <div className="relative">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[9px] font-bold text-white ring-1 ring-white/10">
                {challenge.accountStep}
              </span>
              <span className="rounded-full bg-fuchsia-500/15 px-2 py-0.5 text-[9px] font-bold text-fuchsia-100 ring-1 ring-fuchsia-300/20">
                {challenge.program}
              </span>
              <span className="rounded-full bg-white/[0.05] px-2 py-0.5 text-[9px] font-semibold text-muted-foreground ring-1 ring-white/10">
                {challenge.asset}
              </span>
              {challenge.badge ? (
                <span className="rounded-full bg-gradient-to-r from-amber-400 to-fuchsia-500 px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.1em] text-white shadow-[0_0_18px_rgba(217,70,239,0.3)]">
                  {challenge.badge}
                </span>
              ) : null}
            </div>
          </div>
          <button
            type="button"
            onClick={onBookmark}
            className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white/[0.05] text-muted-foreground ring-1 ring-white/10 hover:text-fuchsia-200"
            aria-label="Save challenge"
          >
            <Bookmark
              className={`h-3.5 w-3.5 ${bookmarked ? "fill-fuchsia-400 text-fuchsia-400" : ""}`}
            />
          </button>
        </div>

        {phaseActive ? (
          <CompactPhaseView challenge={challenge} valueMode={valueMode} />
        ) : (
          <>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="rounded-2xl bg-white/[0.045] px-3 py-2.5 ring-1 ring-white/10">
                <div className="text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                  Account
                </div>
                <div className="mt-1 text-2xl font-black leading-none text-white">
                  {displaySize(challenge.size)}
                </div>
              </div>
              <div className="rounded-2xl bg-white/[0.045] px-3 py-2.5 ring-1 ring-white/10">
                <div className="text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                  Price
                </div>
                <div className="mt-1 min-w-0">
                  <div className="truncate text-xl font-black leading-none text-white">
                    {formatMoney(challenge.price)}
                  </div>
                  {discount && off > 0 ? (
                    <div className="mt-0.5 truncate text-[10px] text-muted-foreground line-through">
                      {formatMoney(challenge.originalPrice)}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-[1fr_auto] items-center gap-2">
              <span className="inline-flex min-w-0 items-center gap-1 rounded-full bg-amber-400/10 px-2 py-1 text-[10px] font-semibold text-amber-200 ring-1 ring-amber-400/30">
                <Coins className="h-3 w-3 shrink-0" />
                <span className="truncate">{challenge.rrPoints || 0} RR Points</span>
              </span>
              <button
                type="button"
                onClick={onBuy}
                className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-600 px-3 py-1.5 text-[11px] font-bold text-white transition hover:shadow-[0_0_20px_rgba(192,132,252,0.46)]"
              >
                Buy <ArrowRight className="h-3 w-3" />
              </button>
            </div>

            <div className="my-3 h-px bg-white/10" />

            <div className="grid grid-cols-2 gap-1.5">
              <Metric label="Profit Target" value={challenge.profitTarget || "Not provided"} />
              <Metric label="Profit Split" value={formatPercent(challenge.profitSplit)} accent />
              <Metric label="Daily Loss" value={challenge.dailyLoss || "Not provided"} />
              <Metric label="Max Loss" value={challenge.maxLoss || "Not provided"} />
              <Metric label="PT:DD" value={challenge.ptdd || "Not provided"} />
              <Metric label="Payout" value={challenge.payoutFreq || "Not provided"} />
            </div>
          </>
        )}

        <div className="mt-3 flex items-center justify-between gap-2">
          {discount && off > 0 ? (
            <span className="rounded-full bg-fuchsia-500/15 px-2 py-1 text-[10px] font-bold text-fuchsia-100 ring-1 ring-fuchsia-300/20">
              {off}% off
            </span>
          ) : (
            <span className="rounded-full bg-white/[0.04] px-2 py-1 text-[10px] font-semibold text-muted-foreground ring-1 ring-white/10">
              Live
            </span>
          )}
          {phaseActive ? (
            <div className="inline-flex items-center gap-1 rounded-full bg-white/[0.05] p-1 ring-1 ring-white/10">
              <ModeButton
                active={valueMode === "percent"}
                onClick={() => onValueModeChange("percent")}
                label="%"
                icon={<Percent className="h-3 w-3" />}
              />
              <ModeButton
                active={valueMode === "money"}
                onClick={() => onValueModeChange("money")}
                label="$"
                icon={<DollarSign className="h-3 w-3" />}
              />
              {!globalPhaseActive ? (
                <button
                  type="button"
                  onClick={onTogglePhases}
                  className="grid h-6 w-6 place-items-center rounded-full text-white/70 transition hover:bg-white/10 hover:text-white"
                  aria-label="Back to challenge card"
                >
                  <LayoutGrid className="h-3 w-3" />
                </button>
              ) : null}
            </div>
          ) : (
            <button
              type="button"
              onClick={onTogglePhases}
              className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.05] px-2.5 py-1.5 text-[10px] font-semibold text-white ring-1 ring-white/10 hover:bg-white/[0.08]"
            >
              <Eye className="h-3 w-3" /> Phases
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

function CompactPhaseView({
  challenge,
  valueMode,
}: {
  challenge: Challenge;
  valueMode: ValueMode;
}) {
  const columns = phaseColumns(challenge);
  const rows = phaseRows(challenge, columns, valueMode).slice(0, 4);

  return (
    <div className="mt-3 animate-in overflow-hidden rounded-2xl bg-white/[0.035] ring-1 ring-fuchsia-300/20 duration-200 fade-in zoom-in-95">
      <div className="flex items-center justify-between gap-2 border-b border-white/10 px-3 py-2.5">
        <div className="min-w-0">
          <div className="text-[8px] font-black uppercase tracking-[0.16em] text-fuchsia-200/80">
            Phase View
          </div>
          <div className="mt-0.5 truncate text-[11px] font-bold text-white">
            {displaySize(challenge.size)} - {valueMode === "money" ? "$ Values" : "% Rules"}
          </div>
        </div>
        <span className="rounded-full bg-white/[0.06] px-2 py-1 text-[9px] font-bold text-white ring-1 ring-white/10">
          {columns.length} stages
        </span>
      </div>

      <div className="overflow-x-auto px-3 py-3">
        <div
          className="grid min-w-[360px] overflow-hidden rounded-xl ring-1 ring-white/10"
          style={{ gridTemplateColumns: `92px repeat(${columns.length}, minmax(72px, 1fr))` }}
        >
          <div className="bg-white/[0.04] px-2 py-2 text-[8px] font-black uppercase tracking-[0.12em] text-muted-foreground">
            Rule
          </div>
          {columns.map((column, index) => (
            <div
              key={column}
              className={`border-l border-white/10 px-2 py-2 text-center text-[9px] font-black ${
                index === columns.length - 1
                  ? "bg-gradient-to-br from-violet-600 to-fuchsia-500 text-white"
                  : "bg-white/[0.03]"
              }`}
            >
              {index === columns.length - 1 ? "Funded" : column.replace("Phase ", "P")}
            </div>
          ))}

          {rows.map((row) => (
            <PhaseMiniRow key={row.label} row={row} />
          ))}
        </div>
      </div>
    </div>
  );
}

function PhaseMiniRow({ row }: { row: { label: string; values: string[] } }) {
  return (
    <>
      <div className="border-t border-white/10 bg-white/[0.025] px-2 py-2 text-[8px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
        {row.label}
      </div>
      {row.values.map((value, index) => (
        <div
          key={`${row.label}-${index}`}
          className={`border-l border-t border-white/10 px-2 py-2 text-center text-[10px] font-black text-white ${
            index === row.values.length - 1 ? "bg-violet-600/30" : "bg-white/[0.015]"
          }`}
        >
          {value}
        </div>
      ))}
    </>
  );
}

function CheckoutModal({
  firmName,
  challenge,
  checkoutLink,
  userEmail,
  onClose,
}: {
  firmName: string;
  challenge: Challenge;
  checkoutLink?: string;
  userEmail?: string;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<"details" | "offers">("details");
  const [email, setEmail] = useState(userEmail ?? "");
  const [agreeMarketing, setAgreeMarketing] = useState(true);
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [rewardPreference, setRewardPreference] = useState<"cashback" | "rr" | "mixed">("cashback");
  const off = discountPercent(challenge);

  async function selectRewardPreference(next: "cashback" | "rr" | "mixed") {
    setRewardPreference(next);
    try {
      await trackChallengePurchaseEvent({
        firm: firmName,
        category: "Prop Firm",
        program: `${challenge.accountStep} ${challenge.program}`,
        accountSize: challenge.size,
        amountUsd: challenge.price,
        rrPoints: challenge.rrPoints,
        rewardPreference: next,
        step: "reward_chosen",
        source: "challenge-checkout-modal",
        email,
      });
    } catch {
      // Keep reward selection responsive if analytics is unavailable.
    }
  }

  async function handleProceedCheckout() {
    let trackedReference = "";
    try {
      const payload = await trackChallengePurchaseEvent({
        firm: firmName,
        category: "Prop Firm",
        program: `${challenge.accountStep} ${challenge.program}`,
        accountSize: challenge.size,
        amountUsd: challenge.price,
        rrPoints: challenge.rrPoints,
        rewardPreference,
        step: "checkout",
        source: "challenge-checkout-modal",
        email,
      });
      trackedReference = String(payload?.reference ?? "");
    } catch {
      // Checkout still works without an analytics reference.
    }

    if (!checkoutLink?.trim()) return;

    try {
      const url = new URL(checkoutLink.trim());
      if (trackedReference) url.searchParams.set("rb_ref", trackedReference);
      url.searchParams.set("rb_firm", firmName);
      url.searchParams.set("rb_program", `${challenge.accountStep} ${challenge.program}`);
      url.searchParams.set("rb_size", challenge.size);
      url.searchParams.set("rb_reward", rewardPreference);
      if (email.trim()) url.searchParams.set("rb_email", email.trim());
      window.open(url.toString(), "_blank", "noopener,noreferrer");
    } catch {
      window.open(checkoutLink.trim(), "_blank", "noopener,noreferrer");
    }
  }

  async function handleClaimGuideView() {
    try {
      await trackChallengePurchaseEvent({
        firm: firmName,
        category: "Prop Firm",
        program: `${challenge.accountStep} ${challenge.program}`,
        accountSize: challenge.size,
        amountUsd: challenge.price,
        rrPoints: challenge.rrPoints,
        rewardPreference,
        step: "claim_guide_viewed",
        source: "challenge-checkout-modal",
        email,
      });
    } catch {
      // Closing the modal is still the expected user action.
    }
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 grid animate-in place-items-center px-4 py-6 duration-200 fade-in">
      <div className="absolute inset-0 bg-[#0b0517]/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-3xl border border-violet-400/30 bg-gradient-to-br from-[#26113f] via-[#1f0d3d] to-[#150829] p-5 shadow-[0_30px_80px_rgba(120,30,180,0.5)] animate-in slide-in-from-bottom-4 zoom-in-95 duration-300">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white">Checkout</h3>
          <button
            onClick={onClose}
            className="grid h-7 w-7 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="mt-4 rounded-2xl bg-white/[0.04] p-4 ring-1 ring-white/10">
          <div className="flex items-start gap-3">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-white text-xs font-bold text-violet-700">
              {firmName.slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-white">{firmName}</div>
              <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-fuchsia-500/20 px-2 py-0.5 text-[10px] font-semibold ring-1 ring-fuchsia-300/30">
                <Star className="h-3 w-3 fill-amber-300 text-amber-300" /> RebateBoard verified
              </div>
              <div className="mt-1 text-[10px] text-muted-foreground">
                {challenge.accountStep} - {challenge.program} - {challenge.size} - {challenge.asset}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold text-white">{formatMoney(challenge.price)}</div>
              {off > 0 ? (
                <div className="text-[11px] text-muted-foreground line-through">
                  {formatMoney(challenge.originalPrice)}
                </div>
              ) : null}
            </div>
          </div>

          <div className="mt-3 grid grid-cols-[1fr_auto] gap-2 rounded-xl bg-gradient-to-br from-fuchsia-500/15 to-violet-500/10 p-3 ring-1 ring-fuchsia-300/30">
            <div className="flex items-center gap-2">
              <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-fuchsia-400 to-violet-500">
                <Tag className="h-4 w-4 text-white" />
              </div>
              <div>
                <div className="text-base font-bold leading-none">
                  <span className="text-fuchsia-300">{off}%</span>{" "}
                  <span className="text-white">OFF</span>
                </div>
                <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-amber-400/10 px-1.5 py-0.5 text-[9px] font-semibold text-amber-200 ring-1 ring-amber-400/30">
                  <Gift className="h-2.5 w-2.5" /> + {challenge.rrPoints} RR Points
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end">
              <div className="rounded-lg bg-white/10 px-2 py-1.5 text-center ring-1 ring-white/15">
                <div className="text-[8px] uppercase text-muted-foreground">Code</div>
                <div className="font-mono text-[11px] font-bold text-white">
                  {challenge.discountCode || `REBATE${off || "BOARD"}`}
                </div>
              </div>
            </div>
            <p className="col-span-2 text-[10px] leading-relaxed text-muted-foreground">
              RR Points unlock cashback, prop-firm discounts, and partner rewards across
              RebateBoard.
            </p>
            <div className="col-span-2 mt-1 grid grid-cols-3 gap-2">
              <ChoiceChip
                active={rewardPreference === "cashback"}
                onClick={() => void selectRewardPreference("cashback")}
                icon={<Gift className="h-3 w-3" />}
                label="Cashback"
              />
              <ChoiceChip
                active={rewardPreference === "rr"}
                onClick={() => void selectRewardPreference("rr")}
                icon={<Coins className="h-3 w-3" />}
                label="RR"
              />
              <ChoiceChip
                active={rewardPreference === "mixed"}
                onClick={() => void selectRewardPreference("mixed")}
                icon={<Sparkles className="h-3 w-3" />}
                label="Mixed"
              />
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              onClick={() => setTab("details")}
              className={`rounded-full px-3 py-1.5 text-[11px] font-semibold ring-1 transition ${
                tab === "details"
                  ? "bg-white text-[#1a0b2e] ring-white/40"
                  : "bg-white/5 text-white ring-white/10 hover:bg-white/10"
              }`}
            >
              Challenge Details
            </button>
            <button
              onClick={() => setTab("offers")}
              className={`inline-flex items-center justify-center gap-1 rounded-full px-3 py-1.5 text-[11px] font-semibold ring-1 transition ${
                tab === "offers"
                  ? "bg-white text-[#1a0b2e] ring-white/40"
                  : "bg-white/5 text-white ring-white/10 hover:bg-white/10"
              }`}
            >
              All Offers <span className="rounded-full bg-fuchsia-500/40 px-1.5 text-[9px]">3</span>
            </button>
          </div>

          <div className="mt-3">
            {tab === "details" ? (
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <DetailRow icon={TrendingUp} label="Profit Target" value={challenge.profitTarget} />
                <DetailRow icon={Shield} label="Max Loss" value={challenge.maxLoss} />
                <DetailRow
                  icon={Award}
                  label="Profit Split"
                  value={formatPercent(challenge.profitSplit)}
                />
                <DetailRow icon={Clock} label="Payout" value={challenge.payoutFreq} />
                <DetailRow icon={Zap} label="PT:DD" value={challenge.ptdd} />
                <DetailRow icon={Coins} label="RR Points" value={`${challenge.rrPoints}`} />
              </div>
            ) : (
              <div className="space-y-2">
                {[
                  {
                    name: "RebateBoard Cashback",
                    off: "+RR",
                    desc: "Tracked to your RebateBoard account",
                  },
                  {
                    name: "First-Time Buyer",
                    off: "Auto",
                    desc: "Use the best eligible discount code",
                  },
                  {
                    name: "Reset Discount",
                    off: "Stacked",
                    desc: "Keep rewards ready for future resets",
                  },
                ].map((offer) => (
                  <div
                    key={offer.name}
                    className="flex items-center justify-between rounded-lg bg-white/[0.04] px-3 py-2 ring-1 ring-white/10"
                  >
                    <div>
                      <div className="text-[11px] font-semibold text-white">{offer.name}</div>
                      <div className="text-[9px] text-muted-foreground">{offer.desc}</div>
                    </div>
                    <span className="rounded-full bg-fuchsia-500/30 px-2 py-0.5 text-[10px] font-bold text-white ring-1 ring-fuchsia-300/30">
                      {offer.off}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mt-4">
          <label className="text-[11px] font-semibold text-white">Email</label>
          <div className="mt-1 flex items-center gap-2 rounded-xl bg-white/[0.04] px-3 py-2.5 ring-1 ring-white/10 focus-within:ring-fuchsia-400/40">
            <Mail className="h-3.5 w-3.5 text-muted-foreground" />
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Enter your email"
              type="email"
              className="w-full bg-transparent text-[12px] text-white outline-none placeholder:text-muted-foreground"
            />
          </div>
        </div>

        <div className="mt-3 space-y-2 text-[10px] text-muted-foreground">
          <label className="flex cursor-pointer items-start gap-2">
            <Checkbox checked={agreeMarketing} onChange={setAgreeMarketing} />
            <span>I would like to receive exclusive offers and RR-points updates.</span>
          </label>
          <label className="flex cursor-pointer items-start gap-2">
            <Checkbox checked={agreeTerms} onChange={setAgreeTerms} />
            <span>
              I agree to RebateBoard's <a className="text-fuchsia-300 underline">Terms of Use</a>{" "}
              and <a className="text-fuchsia-300 underline">Privacy Policy</a>.
            </span>
          </label>
        </div>

        <button
          onClick={() => void handleProceedCheckout()}
          disabled={!agreeTerms || !checkoutLink}
          className="mt-4 w-full rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-600 py-3 text-sm font-bold text-white shadow-[0_10px_30px_rgba(192,132,252,0.4)] transition hover:shadow-[0_14px_40px_rgba(192,132,252,0.6)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Proceed to Checkout - {formatMoney(challenge.price)}
        </button>
        {!checkoutLink ? (
          <div className="mt-2 text-center text-[11px] text-amber-300">
            No partner checkout link is configured for this brand yet.
          </div>
        ) : null}
        <button
          onClick={() => void handleClaimGuideView()}
          className="mt-2 w-full rounded-full bg-white/5 py-2.5 text-[12px] font-semibold text-white ring-1 ring-white/10 hover:bg-white/10"
        >
          View claim guide instead
        </button>
        <div className="mt-4 flex items-center justify-center gap-3 text-[9px] text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Shield className="h-2.5 w-2.5" /> Secure checkout
          </span>
          <span>-</span>
          <span className="inline-flex items-center gap-1">
            <Check className="h-2.5 w-2.5" /> Tracked rewards
          </span>
          <span>-</span>
          <span className="inline-flex items-center gap-1">
            <Info className="h-2.5 w-2.5" /> 24h support
          </span>
        </div>
      </div>
    </div>
  );
}

function normalizeChallenges(value: unknown[] | undefined): Challenge[] {
  if (!Array.isArray(value) || !value.length) return FALLBACK_CHALLENGES;

  const normalized = value
    .map((item, index) => normalizeChallenge(item, index))
    .filter((item): item is Challenge => Boolean(item));

  return normalized.length ? normalized : FALLBACK_CHALLENGES;
}

function normalizeChallenge(value: unknown, index: number): Challenge | null {
  const row = asRecord(value);
  if (row.active === false) return null;

  const accountStep = firstText(row.accountStep, row.step, row.evalType) || "Challenge";
  const rawProgram = firstText(row.program, row.name, row.type, row.track);
  const program = rawProgram && !looksLikeStep(rawProgram) ? rawProgram : "Standard";
  const price = numberValue(row.price);
  const originalPrice = numberValue(row.originalPrice) || price;
  const profitSplit = nullableNumber(row.profitSplit);
  const rrPoints = Math.max(0, Math.round(numberValue(row.rrPoints) || price * 0.6));

  return {
    id: firstText(row.id, row._id) || `challenge_${index}`,
    accountStep,
    program,
    size: firstText(row.size, row.accountSize) || "Not provided",
    asset: firstText(row.asset, row.assetClass) || "FX",
    profitTarget: firstText(row.profitTarget, row.target) || "-",
    dailyLoss: firstText(row.dailyLoss, row.dailyDD, row.dailyDrawdown) || "-",
    maxLoss: firstText(row.maxLoss, row.maxDD, row.maxDrawdown) || "-",
    ptdd: firstText(row.ptdd, row.ptDd, row.ratio) || "-",
    profitSplit,
    payoutFreq:
      firstText(row.payoutFreq, row.payoutSchedule, row.payoutFrequency) || "Not provided",
    rrPoints,
    price,
    originalPrice: originalPrice || price,
    badge: normalizeBadge(row.badge),
    discountCode: firstText(row.discountCode, row.couponCode, row.promoCode),
  };
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function text(value: unknown) {
  const raw = String(value ?? "").trim();
  if (!raw || /^(null|undefined|n\/a|na|none|false|-|\u2014)$/i.test(raw)) return "";
  return raw;
}

function firstText(...values: unknown[]) {
  for (const value of values) {
    const clean = text(value);
    if (clean) return clean;
  }
  return "";
}

function numberValue(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const clean = text(value).replace(/[$,]/g, "");
  if (!clean) return 0;
  const numeric = Number(clean);
  return Number.isFinite(numeric) ? numeric : 0;
}

function nullableNumber(value: unknown) {
  const numeric = numberValue(value);
  return numeric > 0 ? numeric : null;
}

function normalizeBadge(value: unknown): Challenge["badge"] | undefined {
  const clean = text(value).toLowerCase();
  if (clean === "top") return "Top";
  if (clean === "new") return "New";
  if (clean === "best value") return "Best Value";
  return undefined;
}

function looksLikeStep(value: string) {
  return /step|instant|zero/i.test(value);
}

function optionList(values: string[], sorter?: (a: string, b: string) => number) {
  const unique = Array.from(new Set(values.map(text).filter(Boolean)));
  return [ALL, ...(sorter ? unique.sort(sorter) : unique.sort((a, b) => a.localeCompare(b)))];
}

function sortStep(a: string, b: string) {
  return stepRank(a) - stepRank(b) || a.localeCompare(b);
}

function stepRank(value: string) {
  if (/zero/i.test(value)) return 0;
  if (/instant/i.test(value)) return 9;
  const match = value.match(/\d+/);
  return match ? Number(match[0]) : 5;
}

function sortAccountSize(a: string, b: string) {
  return accountSizeValue(a) - accountSizeValue(b) || a.localeCompare(b);
}

function accountSizeValue(value: string) {
  const clean = value.toUpperCase().replace(/[$,\s]/g, "");
  const match = clean.match(/(\d+(?:\.\d+)?)(K|M)?/);
  if (!match) return Number.MAX_SAFE_INTEGER;
  const amount = Number(match[1]);
  const suffix = match[2];
  if (suffix === "M") return amount * 1_000_000;
  if (suffix === "K") return amount * 1_000;
  return amount;
}

function displaySize(value: string) {
  return value.startsWith("$") ? value : `$${value}`;
}

function formatMoney(value: number) {
  if (!value) return "Not priced";
  return `$${value.toLocaleString(undefined, {
    maximumFractionDigits: value % 1 ? 2 : 0,
    minimumFractionDigits: value % 1 ? 2 : 0,
  })}`;
}

function formatPercent(value: number | null) {
  return value ? `${value}%` : "Not provided";
}

function discountPercent(challenge: Challenge) {
  if (!challenge.price || !challenge.originalPrice || challenge.originalPrice <= challenge.price)
    return 0;
  return Math.round(((challenge.originalPrice - challenge.price) / challenge.originalPrice) * 100);
}

function phaseColumns(challenge: Challenge) {
  if (/instant/i.test(challenge.accountStep)) return ["Instant", "Funded"];
  const count = Math.max(1, Number(challenge.accountStep.match(/\d+/)?.[0] ?? 1));
  return [...Array.from({ length: count }, (_, index) => `Phase ${index + 1}`), "Funded"];
}

function phaseRows(challenge: Challenge, columns: string[], valueMode: ValueMode) {
  const evaluationCount = Math.max(1, columns.length - 1);
  const profitTargets = distributeMetric(challenge.profitTarget, evaluationCount);
  const maxLoss = distributeMetric(challenge.maxLoss, evaluationCount);
  const dailyLoss = distributeMetric(challenge.dailyLoss, evaluationCount);
  const fundedIndex = columns.length - 1;

  return [
    {
      label: "Profit Target",
      values: columns.map((_, index) =>
        index === fundedIndex
          ? "-"
          : formatMetricValue(profitTargets[index], challenge.size, valueMode),
      ),
    },
    {
      label: "Max Loss",
      values: columns.map((_, index) =>
        formatMetricValue(maxLoss[Math.min(index, maxLoss.length - 1)], challenge.size, valueMode),
      ),
    },
    {
      label: "Daily Drawdown",
      values: columns.map((_, index) =>
        formatMetricValue(
          dailyLoss[Math.min(index, dailyLoss.length - 1)],
          challenge.size,
          valueMode,
        ),
      ),
    },
    {
      label: "Reward Cycle",
      values: columns.map((_, index) =>
        index === fundedIndex ? challenge.payoutFreq || "-" : "Evaluation",
      ),
    },
    {
      label: "Reward Split",
      values: columns.map((_, index) =>
        index === fundedIndex ? formatPercent(challenge.profitSplit) : "Qualify",
      ),
    },
  ];
}

function distributeMetric(value: string, count: number) {
  const parts = text(value)
    .split(/\s*\/\s*|,\s*|;\s*/)
    .map((part) => part.trim())
    .filter(Boolean);
  if (!parts.length) return Array.from({ length: count }, () => "-");
  return Array.from({ length: count }, (_, index) => parts[index] ?? parts.at(-1) ?? "-");
}

function formatMetricValue(value: string, size: string, mode: ValueMode) {
  if (mode === "percent") return value || "-";
  const match = value.match(/(\d+(?:\.\d+)?)\s*%/);
  if (!match) return value || "-";
  const account = accountSizeValue(size);
  if (!Number.isFinite(account) || account === Number.MAX_SAFE_INTEGER) return value;
  return formatMoney((account * Number(match[1])) / 100);
}

function Metric({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="min-w-0 rounded-lg bg-white/[0.04] px-2.5 py-1.5 ring-1 ring-white/10">
      <div className="truncate text-[8px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </div>
      <div
        className={`mt-0.5 truncate text-[11px] font-bold ${
          accent ? "text-fuchsia-100" : "text-white"
        }`}
      >
        {value}
      </div>
    </div>
  );
}

function ModeButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold ring-1 transition ${
        active
          ? "bg-white text-[#1a0b2e] ring-white/50"
          : "bg-white/[0.04] text-muted-foreground ring-white/10 hover:text-white"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg bg-white/[0.04] px-2.5 py-2 ring-1 ring-white/5">
      <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-wide text-muted-foreground">
        <Icon className="h-2.5 w-2.5" /> {label}
      </div>
      <div className="mt-0.5 text-[11px] font-semibold text-white">{value || "Not provided"}</div>
    </div>
  );
}

function Checkbox({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`mt-0.5 grid h-3.5 w-3.5 shrink-0 place-items-center rounded ring-1 transition ${
        checked
          ? "bg-gradient-to-br from-fuchsia-500 to-violet-600 ring-fuchsia-300/40"
          : "bg-white/5 ring-white/20"
      }`}
    >
      {checked ? <Check className="h-2.5 w-2.5 text-white" /> : null}
    </button>
  );
}

function ChoiceChip({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-[11px] font-semibold ring-1 transition ${
        active
          ? "bg-gradient-to-r from-fuchsia-500 to-violet-600 text-white ring-fuchsia-400/40"
          : "bg-white/5 text-white ring-white/10 hover:ring-white/20"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function PillSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className={`relative ${open ? "z-[100]" : "z-0"}`}>
      <button
        onClick={() => setOpen((current) => !current)}
        className="glass-pill inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold"
      >
        <span className="text-muted-foreground">{label}:</span>
        <span className="text-white">{value}</span>
        <ChevronDown className={`h-3 w-3 transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open ? (
        <>
          <div className="fixed inset-0 z-[80]" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full z-[110] mt-1 max-h-64 min-w-[140px] overflow-auto rounded-xl border border-white/15 bg-[#1f0d3d]/95 p-1 shadow-[0_18px_50px_rgba(0,0,0,0.45)] backdrop-blur">
            {options.map((option) => (
              <button
                key={option}
                onClick={() => {
                  onChange(option);
                  setOpen(false);
                }}
                className={`block w-full rounded-lg px-3 py-1.5 text-left text-[11px] transition ${
                  option === value
                    ? "bg-fuchsia-500/30 text-white"
                    : "text-muted-foreground hover:bg-white/10 hover:text-white"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
