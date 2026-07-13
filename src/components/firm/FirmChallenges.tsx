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
  RotateCcw,
  Search,
  Shield,
  Bot,
  Star,
  Tag,
  TrendingUp,
  X,
  Zap,
} from "lucide-react";
import {
  createChallengePurchaseSession,
  trackChallengePurchaseEvent,
  updateChallengePurchaseSession,
  type PurchaseRewardPreference,
} from "@/lib/challenge-purchases-api";
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
  badge?: string;
  discountCode?: string;
  accountType?: string;
  platform?: string;
  minTradingDays?: string;
  timeLimit?: string;
  refundPercentage?: string;
  cashbackLabel?: string;
};

type ValueMode = "percent" | "money";
type ViewMode = "cards" | "pricing" | "percent";
type SortMode = "recommended" | "lowest-price" | "highest-size" | "best-value" | "highest-rr";

const ALL = "All";

export function FirmChallenges({
  firmName,
  brandId,
  brandLogo,
  category = "Prop Firm",
  checkoutLink,
  challenges,
  stickyTop,
}: {
  firmName: string;
  brandId?: string;
  brandLogo?: string;
  category?: string;
  checkoutLink?: string;
  challenges?: unknown[];
  stickyTop?: number;
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
  const [sortMode, setSortMode] = useState<SortMode>("recommended");

  useEffect(() => {
    if (!assetOptions.includes(asset)) setAsset(ALL);
    if (!sizeOptions.includes(size)) setSize(ALL);
    if (!programOptions.includes(program)) setProgram(ALL);
    if (!stepOptions.includes(step)) setStep(ALL);
  }, [asset, assetOptions, program, programOptions, size, sizeOptions, step, stepOptions]);

  const list = useMemo(() => {
    const needle = query.trim().toLowerCase();

    const filtered = allChallenges.filter((challenge) => {
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

    return sortChallenges(filtered, sortMode);
  }, [allChallenges, asset, program, query, size, sortMode, step]);

  const activeFilters = useMemo(
    () =>
      [
        asset !== ALL ? { label: "Asset", value: asset, clear: () => setAsset(ALL) } : null,
        size !== ALL ? { label: "Size", value: size, clear: () => setSize(ALL) } : null,
        program !== ALL ? { label: "Program", value: program, clear: () => setProgram(ALL) } : null,
        step !== ALL ? { label: "Step", value: step, clear: () => setStep(ALL) } : null,
        query.trim()
          ? { label: "Search", value: query.trim(), clear: () => setQuery("") }
          : null,
      ].filter(Boolean) as Array<{ label: string; value: string; clear: () => void }>,
    [asset, program, query, size, step],
  );

  const clearFilters = () => {
    setAsset(ALL);
    setSize(ALL);
    setProgram(ALL);
    setStep(ALL);
    setQuery("");
  };

  useEffect(() => {
    if (!list.length) {
      setFocusedId(null);
      return;
    }

    if (!focusedId || !list.some((challenge) => challenge.id === focusedId)) {
      setFocusedId(list[0].id);
    }
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
        source: `firm-challenges-${viewMode}`,
        note: JSON.stringify({
          brandId: firmName,
          programId: `${challenge.accountStep}:${challenge.program}`,
          accountId: challenge.id,
          accountSize: challenge.size,
          price: challenge.price,
          viewType: viewMode,
          rrReward: challenge.rrPoints,
          cashbackEligibility: Boolean(challenge.cashbackLabel),
        }),
        email: user?.email,
      });
    } catch {
      // Analytics should never block checkout.
    }
  }

  return (
    <div className="space-y-4">
      <div
        className="glass sticky z-[58] overflow-visible rounded-2xl bg-[rgba(18,18,25,0.96)] p-3 shadow-[0_18px_50px_rgba(0,0,0,0.28)] ring-1 ring-violet-400/20 backdrop-blur-2xl sm:p-4"
        style={{
          top: stickyTop ? `${stickyTop}px` : undefined,
        }}
      >
        <div className="no-scrollbar flex max-w-full flex-wrap items-center gap-2 overflow-x-auto overscroll-x-contain">
          <button type="button" className="glass-pill inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold">
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
          <PillSelect
            label="Sort"
            value={sortMode}
            options={[
              "recommended",
              "lowest-price",
              "highest-size",
              "best-value",
              "highest-rr",
            ]}
            optionLabels={{
              recommended: "Recommended",
              "lowest-price": "Lowest price",
              "highest-size": "Highest size",
              "best-value": "Best value",
              "highest-rr": "Highest RR",
            }}
            onChange={(value) => setSortMode(value as SortMode)}
          />
          <div className="mx-1 hidden h-5 w-px bg-white/15 sm:block" />
          <button
            type="button"
            onClick={() => setDiscount((current) => !current)}
            className="inline-flex items-center gap-2 rounded-full bg-white/[0.04] px-3 py-1.5 text-[11px] font-semibold ring-1 ring-white/10"
          >
            <span
              className={`relative inline-block h-4 w-7 rounded-full transition ${
                discount ? "rb-gradient-primary" : "bg-white/15"
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
            <span className="font-semibold text-white">{list.length}</span>{" "}
            {list.length === 1 ? "program" : "programs"}
          </span>
          <div className="ml-auto flex min-w-0 flex-wrap items-center gap-2 max-sm:ml-0 max-sm:w-full">
            <div className="glass-pill flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px]">
              <Search className="h-3 w-3 text-muted-foreground" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search..."
                className="w-28 bg-transparent outline-none placeholder:text-muted-foreground max-sm:w-full"
              />
            </div>
            <div className="inline-flex items-center gap-1 rounded-full bg-white/[0.04] p-1 ring-1 ring-white/10">
              <ModeButton
                active={viewMode === "cards"}
                onClick={() => setViewMode("cards")}
                label="Cards"
                icon={<LayoutGrid className="h-3 w-3" />}
              />
              <ModeButton
                active={viewMode === "pricing"}
                onClick={() => setViewMode("pricing")}
                label="Pricing"
                icon={<DollarSign className="h-3 w-3" />}
              />
              <ModeButton
                active={viewMode === "percent"}
                onClick={() => setViewMode("percent")}
                label="%"
                icon={<Percent className="h-3 w-3" />}
              />
            </div>
          </div>
        </div>
        {activeFilters.length ? (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {activeFilters.map((filter) => (
              <button
                key={`${filter.label}-${filter.value}`}
                type="button"
                onClick={filter.clear}
                className="inline-flex items-center gap-1.5 rounded-full bg-violet-500/12 px-2.5 py-1 text-[10px] font-semibold text-violet-50 ring-1 ring-violet-300/20 transition hover:bg-violet-500/20"
              >
                <span className="text-violet-200/80">{filter.label}:</span> {filter.value}
                <X className="h-3 w-3" />
              </button>
            ))}
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.04] px-2.5 py-1 text-[10px] font-semibold text-muted-foreground ring-1 ring-white/10 transition hover:text-white"
            >
              <RotateCcw className="h-3 w-3" /> Clear filters
            </button>
          </div>
        ) : null}
        <div className="mt-3 flex items-center gap-2 text-[10px] text-muted-foreground">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
          </span>
          Live program data - prices and rules shown from the brand record
        </div>
      </div>

      {list.length ? (
        <div className="relative z-0 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {list.map((challenge) => (
            <ChallengeCard
              key={challenge.id}
              challenge={challenge}
              discount={discount}
              viewMode={viewMode}
              bookmarked={bookmarks.has(challenge.id)}
              focused={challenge.id === focused?.id}
              onBookmark={() => toggleBookmark(challenge.id)}
              onFocus={() => setFocusedId(challenge.id)}
              onBuy={() => void openCheckout(challenge)}
            />
          ))}
        </div>
      ) : (
        <div className="glass rounded-2xl p-8 text-center ring-1 ring-violet-400/20">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-violet-500/12 text-violet-100 ring-1 ring-violet-300/20">
            <Filter className="h-5 w-5" />
          </div>
          <h3 className="mt-4 text-lg font-bold text-white">No funding programs match these filters.</h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Try adjusting your account size, price, challenge type, or search term.
          </p>
          <button
            type="button"
            onClick={clearFilters}
            className="mt-4 inline-flex items-center gap-2 rounded-full rb-gradient-primary px-4 py-2 text-sm font-bold text-white shadow-[0_12px_30px_rgba(168,85,247,0.28)]"
          >
            <RotateCcw className="h-4 w-4" /> Clear Filters
          </button>
        </div>
      )}

      {active ? (
        <CheckoutModal
          firmName={firmName}
          brandId={brandId}
          brandLogo={brandLogo}
          category={category}
          challenge={active}
          checkoutLink={checkoutLink}
          userEmail={user?.email}
          userId={user?.id}
          onClose={() => setActive(null)}
        />
      ) : null}
    </div>
  );
}

function ChallengeCard({
  challenge,
  discount,
  viewMode,
  bookmarked,
  focused,
  onBookmark,
  onFocus,
  onBuy,
}: {
  challenge: Challenge;
  discount: boolean;
  viewMode: ViewMode;
  bookmarked: boolean;
  focused: boolean;
  onBookmark: () => void;
  onFocus: () => void;
  onBuy: () => void;
}) {
  const off = discountPercent(challenge);
  const highlighted = focused || challenge.badge === "Top" || challenge.badge === "Best Value";
  const detailMode = viewMode === "pricing" ? "money" : viewMode === "percent" ? "percent" : null;

  return (
    <article
      onMouseEnter={onFocus}
      onFocus={onFocus}
      className={`group relative overflow-hidden rounded-2xl bg-[rgba(18,18,25,0.92)] p-3 ring-1 transition ${
        highlighted
          ? "shadow-[0_22px_70px_rgba(147,51,234,0.28)] ring-violet-300/35"
          : "ring-violet-400/18 hover:ring-violet-300/30"
      }`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_8%,rgba(126,77,255,0.17),transparent_34%),linear-gradient(135deg,rgba(255,255,255,0.065),transparent_40%)] opacity-80" />
      <div className="relative">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[9px] font-bold text-white ring-1 ring-white/10">
                {challenge.accountStep}
              </span>
              <span className="rounded-full bg-violet-500/15 px-2 py-0.5 text-[9px] font-bold text-violet-100 ring-1 ring-violet-300/20">
                {challenge.program}
              </span>
              <span className="rounded-full bg-white/[0.05] px-2 py-0.5 text-[9px] font-semibold text-muted-foreground ring-1 ring-white/10">
                {challenge.asset}
              </span>
              {challenge.badge ? (
                <span className="rounded-full rb-gradient-primary px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.1em] text-white shadow-[0_0_18px_rgba(126,77,255,0.3)]">
                  {challenge.badge}
                </span>
              ) : null}
            </div>
          </div>
          <button
            type="button"
            onClick={onBookmark}
            className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white/[0.05] text-muted-foreground ring-1 ring-white/10 hover:text-violet-200"
            aria-label="Save challenge"
          >
            <Bookmark
              className={`h-3.5 w-3.5 ${bookmarked ? "fill-violet-400 text-violet-400" : ""}`}
            />
          </button>
        </div>

        {detailMode ? (
          <ProgramDetailView challenge={challenge} valueMode={detailMode} />
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
              {challenge.rrPoints > 0 ? (
                <span className="inline-flex min-w-0 items-center gap-1 rounded-full bg-violet-500/12 px-2 py-1 text-[10px] font-semibold text-violet-100 ring-1 ring-violet-300/25">
                  <Coins className="h-3 w-3 shrink-0" />
                  <span className="truncate">Earn {challenge.rrPoints} RR</span>
                </span>
              ) : challenge.cashbackLabel ? (
                <span className="inline-flex min-w-0 items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-1 text-[10px] font-semibold text-emerald-100 ring-1 ring-emerald-300/20">
                  <Gift className="h-3 w-3 shrink-0" />
                  <span className="truncate">{challenge.cashbackLabel}</span>
                </span>
              ) : (
                <span className="inline-flex min-w-0 items-center gap-1 rounded-full bg-white/[0.04] px-2 py-1 text-[10px] font-semibold text-muted-foreground ring-1 ring-white/10">
                  <Coins className="h-3 w-3 shrink-0" />
                  <span className="truncate">Rewards shown when available</span>
                </span>
              )}
              <button
                type="button"
                onClick={onBuy}
                className="inline-flex items-center gap-1.5 rounded-full rb-gradient-primary px-3 py-1.5 text-[11px] font-bold text-white transition hover:shadow-[0_0_20px_rgba(192,132,252,0.46)]"
              >
                Start <ArrowRight className="h-3 w-3" />
              </button>
            </div>

            <div className="my-3 h-px bg-white/10" />

            <div className="grid grid-cols-2 gap-1.5">
              <Metric label="Main Target" value={challenge.profitTarget || "Not provided"} />
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
            <span className="rounded-full bg-violet-500/15 px-2 py-1 text-[10px] font-bold text-violet-100 ring-1 ring-violet-300/20">
              {off}% off
            </span>
          ) : challenge.cashbackLabel ? (
            <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-[10px] font-semibold text-emerald-100 ring-1 ring-emerald-300/20">
              {challenge.cashbackLabel}
            </span>
          ) : (
            <span className="rounded-full bg-white/[0.04] px-2 py-1 text-[10px] font-semibold text-muted-foreground ring-1 ring-white/10">
              Live program
            </span>
          )}
          {detailMode ? (
            <button
              type="button"
              onClick={onBuy}
              className="inline-flex items-center gap-1.5 rounded-full rb-gradient-primary px-3 py-1.5 text-[11px] font-bold text-white transition hover:shadow-[0_0_20px_rgba(192,132,252,0.46)]"
            >
              Start Challenge <ArrowRight className="h-3 w-3" />
            </button>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.05] px-2.5 py-1.5 text-[10px] font-semibold text-muted-foreground ring-1 ring-white/10">
              <Eye className="h-3 w-3" /> Switch view for phases
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

function ProgramDetailView({
  challenge,
  valueMode,
}: {
  challenge: Challenge;
  valueMode: ValueMode;
}) {
  const rows = fundingMetricRows(challenge, valueMode);
  const modeLabel = valueMode === "money" ? "Pricing View" : "Percentage View";

  return (
    <div className="mt-3 animate-in rounded-2xl bg-white/[0.035] p-3 ring-1 ring-violet-300/20 duration-200 fade-in zoom-in-95">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[8px] font-black uppercase tracking-[0.16em] text-violet-200/80">
            {modeLabel}
          </div>
          <div className="mt-1 text-xl font-black leading-none text-white">
            {displaySize(challenge.size)} Account
          </div>
        </div>
        <div className="text-right">
          <div className="text-[8px] font-black uppercase tracking-[0.14em] text-muted-foreground">
            Price
          </div>
          <div className="mt-1 text-lg font-black leading-none text-white">
            {formatMoney(challenge.price)}
          </div>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-1.5">
        {rows.map((row) => (
          <Metric key={row.label} label={row.label} value={row.value} accent={row.accent} />
        ))}
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {challenge.platform ? <SoftBadge icon={Zap} label={challenge.platform} /> : null}
        {challenge.accountType ? <SoftBadge icon={Award} label={challenge.accountType} /> : null}
        {challenge.minTradingDays ? (
          <SoftBadge icon={Clock} label={`${challenge.minTradingDays} min days`} />
        ) : null}
        {challenge.timeLimit ? <SoftBadge icon={Clock} label={challenge.timeLimit} /> : null}
        {challenge.rrPoints > 0 ? <SoftBadge icon={Coins} label={`Earn ${challenge.rrPoints} RR`} /> : null}
      </div>
    </div>
  );
}

function SoftBadge({
  icon: Icon,
  label,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-white/[0.045] px-2 py-1 text-[9px] font-semibold text-white/85 ring-1 ring-white/10">
      <Icon className="h-3 w-3 text-violet-200" />
      {label}
    </span>
  );
}

function CheckoutModal({
  firmName,
  brandId,
  brandLogo,
  category,
  challenge,
  checkoutLink,
  userEmail,
  userId,
  onClose,
}: {
  firmName: string;
  brandId?: string;
  brandLogo?: string;
  category: string;
  challenge: Challenge;
  checkoutLink?: string;
  userEmail?: string;
  userId?: string;
  onClose: () => void;
}) {
  const [email, setEmail] = useState(userEmail ?? "");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [rewardPreference, setRewardPreference] = useState<PurchaseRewardPreference>(
    challenge.cashbackLabel ? "cashback" : challenge.rrPoints > 0 ? "rr" : "cashback",
  );
  const [preparing, setPreparing] = useState(false);
  const [error, setError] = useState("");
  const [sessionReference, setSessionReference] = useState("");
  const [redirected, setRedirected] = useState(false);
  const [completed, setCompleted] = useState(false);
  const off = discountPercent(challenge);
  const supportsCashback = Boolean(challenge.cashbackLabel);
  const supportsRr = challenge.rrPoints > 0;
  const rewardOptions: PurchaseRewardPreference[] = [
    ...(supportsCashback ? (["cashback"] as const) : []),
    ...(supportsRr ? (["rr"] as const) : []),
    ...(supportsCashback && supportsRr ? (["mixed"] as const) : []),
  ];
  const safeCheckoutLink = validCheckoutLink(checkoutLink);

  function selectRewardPreference(next: PurchaseRewardPreference) {
    setRewardPreference(next);
  }

  async function handleProceedCheckout() {
    if (!safeCheckoutLink || preparing) return;
    setPreparing(true);
    setError("");

    try {
      const search = new URLSearchParams(window.location.search);
      const attribution = Object.fromEntries(
        [...search.entries()].filter(([key]) => key.startsWith("utm_") || key === "ref"),
      );
      const session = await createChallengePurchaseSession({
        firm: firmName,
        category,
        brandId,
        program: `${challenge.accountStep} ${challenge.program}`,
        programId: `${challenge.accountStep}:${challenge.program}`,
        accountId: challenge.id,
        accountSize: challenge.size,
        market: challenge.asset,
        amountUsd: challenge.price,
        originalAmountUsd: challenge.originalPrice,
        rrPoints: challenge.rrPoints,
        cashbackLabel: challenge.cashbackLabel,
        promoCode: challenge.discountCode,
        rewardPreference,
        partnerTrackingUrl: safeCheckoutLink,
        source: "challenge-checkout-modal",
        guestSessionId: userId ? undefined : getGuestCheckoutId(),
        email: email.trim() || undefined,
        attribution,
        deviceMetadata: {
          language: navigator.language,
          platform: navigator.platform,
          viewport: `${window.innerWidth}x${window.innerHeight}`,
        },
      });
      setSessionReference(session.reference);

      const url = new URL(session.partnerTrackingUrl);
      url.searchParams.set("rb_ref", session.reference);
      url.searchParams.set("rb_firm", firmName);
      url.searchParams.set("rb_program", `${challenge.accountStep} ${challenge.program}`);
      url.searchParams.set("rb_size", challenge.size);
      url.searchParams.set("rb_reward", rewardPreference);
      if (email.trim()) url.searchParams.set("rb_email", email.trim());

      await updateChallengePurchaseSession({
        reference: session.reference,
        status: "redirected_to_partner",
        email: email.trim() || undefined,
      });
      window.open(url.toString(), "_blank", "noopener,noreferrer");
      setRedirected(true);
    } catch {
      setError("We couldn’t prepare this checkout right now. Please try again.");
    } finally {
      setPreparing(false);
    }
  }

  async function updatePurchaseStatus(status: "user_marked_completed" | "pending_purchase") {
    if (!sessionReference) return;
    setPreparing(true);
    setError("");
    try {
      await updateChallengePurchaseSession({
        reference: sessionReference,
        status,
        email: email.trim() || undefined,
      });
      if (status === "user_marked_completed") setCompleted(true);
      else onClose();
    } catch {
      setError("We couldn’t update your purchase yet. Please try again.");
    } finally {
      setPreparing(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid animate-in place-items-center px-4 py-6 duration-200 fade-in">
      <div className="absolute inset-0 bg-[rgba(8,8,12,0.80)] backdrop-blur-sm" onClick={onClose} />
      <div className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-3xl border border-violet-400/30 bg-gradient-to-br from-[#26113f] via-[#1f0d3d] to-[#150829] p-5 shadow-[0_30px_80px_rgba(120,30,180,0.5)] animate-in slide-in-from-bottom-4 zoom-in-95 duration-300">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-violet-200">
              {completed ? "Next steps" : redirected ? "Purchase confirmation" : "Tracked checkout"}
            </div>
            <h3 className="mt-0.5 text-base font-bold text-white">
              {completed ? "Purchase marked complete" : redirected ? "Did you complete your purchase?" : "Review your account"}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="grid h-7 w-7 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {completed ? (
          <PurchaseNextSteps
            reference={sessionReference}
            firmName={firmName}
            amount={challenge.price}
            email={email}
            onClose={onClose}
          />
        ) : redirected ? (
          <div className="mt-5 space-y-4">
            <p className="text-sm leading-relaxed text-white/75">
              Confirming your purchase connects this tracked checkout to any proof or reward claim
              you submit next.
            </p>
            <button
              type="button"
              disabled={preparing}
              onClick={() => void updatePurchaseStatus("user_marked_completed")}
              className="w-full rounded-full rb-gradient-primary py-3 text-sm font-bold text-white disabled:opacity-50"
            >
              Yes, I completed the purchase
            </button>
            <button
              type="button"
              disabled={preparing}
              onClick={() => void updatePurchaseStatus("pending_purchase")}
              className="w-full rounded-full bg-white/5 py-3 text-sm font-semibold text-white ring-1 ring-white/10 hover:bg-white/10 disabled:opacity-50"
            >
              Not yet, I’ll come back later
            </button>
            {error ? <FriendlyCheckoutError message={error} /> : null}
          </div>
        ) : (
        <>
        <div className="mt-4 rounded-2xl bg-white/[0.04] p-4 ring-1 ring-white/10">
          <div className="flex items-start gap-3">
            {brandLogo ? (
              <img src={brandLogo} alt="" className="h-12 w-12 shrink-0 rounded-xl object-contain" />
            ) : (
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-white/10 text-xs font-bold text-white">
                {firmName.slice(0, 2).toUpperCase()}
              </div>
            )}
            <div className="flex-1">
              <div className="text-sm font-semibold text-white">{firmName}</div>
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

          {(off > 0 || challenge.discountCode || supportsCashback || supportsRr) ? (
          <div className="mt-3 grid grid-cols-[1fr_auto] gap-2 rounded-xl bg-gradient-to-br from-violet-500/15 to-violet-500/10 p-3 ring-1 ring-violet-300/30">
            <div className="flex items-center gap-2">
              <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-violet-400 to-violet-500">
                <Tag className="h-4 w-4 text-white" />
              </div>
              <div>
                {off > 0 ? <div className="text-base font-bold leading-none">
                  <span className="text-violet-300">{off}%</span>{" "}
                  <span className="text-white">OFF</span>
                </div> : null}
                {supportsRr ? <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-violet-400/10 px-1.5 py-0.5 text-[9px] font-semibold text-violet-100 ring-1 ring-violet-300/30">
                  <Gift className="h-2.5 w-2.5" /> Earn {challenge.rrPoints} RR
                </div> : null}
              </div>
            </div>
            {challenge.discountCode ? <div className="flex items-center justify-end">
              <div className="rounded-lg bg-white/10 px-2 py-1.5 text-center ring-1 ring-white/15">
                <div className="text-[8px] uppercase text-muted-foreground">Code</div>
                <div className="font-mono text-[11px] font-bold text-white">
                  {challenge.discountCode}
                </div>
              </div>
            </div> : null}
            <p className="col-span-2 text-[10px] leading-relaxed text-muted-foreground">
              Choose how you want an eligible verified reward applied.
            </p>
            <div className={`col-span-2 mt-1 grid gap-2 ${rewardOptions.length === 1 ? "grid-cols-1" : rewardOptions.length === 2 ? "grid-cols-2" : "grid-cols-3"}`}>
              {rewardOptions.map((option) => (
                <ChoiceChip
                  key={option}
                  active={rewardPreference === option}
                  onClick={() => selectRewardPreference(option)}
                  icon={option === "cashback" ? <Gift className="h-3 w-3" /> : option === "rr" ? <Coins className="h-3 w-3" /> : <Bot className="h-3 w-3" />}
                  label={option === "rr" ? "RR" : option[0].toUpperCase() + option.slice(1)}
                />
              ))}
            </div>
          </div>
          ) : null}

          <div className="mt-3">
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
                {supportsRr ? (
                  <DetailRow icon={Coins} label="RR Points" value={`${challenge.rrPoints}`} />
                ) : null}
              </div>
          </div>
        </div>

        <div className="mt-4">
          <label className="text-[11px] font-semibold text-white">
            {userId ? "Your RebateBoard email" : "Email for reward tracking"}
          </label>
          <div className="mt-1 flex items-center gap-2 rounded-xl bg-white/[0.04] px-3 py-2.5 ring-1 ring-white/10 focus-within:ring-violet-400/40">
            <Mail className="h-3.5 w-3.5 text-muted-foreground" />
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Enter your email"
              type="email"
              className="w-full bg-transparent text-[12px] text-white outline-none placeholder:text-muted-foreground"
            />
          </div>
          <p className="mt-1.5 text-[10px] leading-relaxed text-muted-foreground">
            Use this email at partner checkout so RebateBoard can help match your purchase.
            {!userId ? " Sign in or create an account to keep the purchase in your dashboard." : ` Tracking ID: RB-${userId}`}
          </p>
        </div>

        <div className="mt-3 space-y-2 text-[10px] text-muted-foreground">
          <label className="flex cursor-pointer items-start gap-2">
            <Checkbox checked={agreeTerms} onChange={setAgreeTerms} />
            <span>
              I understand that I must complete the purchase through this tracked RebateBoard link
              and may need to submit proof for verification.
            </span>
          </label>
        </div>

        {error ? <FriendlyCheckoutError message={error} /> : null}
        <button
          onClick={() => void handleProceedCheckout()}
          disabled={!agreeTerms || !safeCheckoutLink || preparing}
          className="mt-4 w-full rounded-full rb-gradient-primary py-3 text-sm font-bold text-white shadow-[0_10px_30px_rgba(192,132,252,0.4)] transition hover:shadow-[0_14px_40px_rgba(192,132,252,0.6)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {preparing ? "Preparing your tracked checkout..." : `Proceed to ${firmName} · ${formatMoney(challenge.price)}`}
        </button>
        {!safeCheckoutLink ? (
          <div className="mt-2 text-center text-[11px] text-violet-200">
            Purchase link temporarily unavailable. Please check back later or contact support.
          </div>
        ) : null}
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
        </>
        )}
      </div>
    </div>
  );
}

function PurchaseNextSteps({
  reference,
  firmName,
  amount,
  email,
  onClose,
}: {
  reference: string;
  firmName: string;
  amount: number;
  email: string;
  onClose: () => void;
}) {
  const claimParams = new URLSearchParams({
    claim: "1",
    purchaseSession: reference,
    partner: firmName,
    amount: String(amount),
  });
  if (email.trim()) claimParams.set("email", email.trim());
  const claimUrl = `/dashboard/wallet?${claimParams.toString()}`;

  return (
    <div className="mt-5">
      <div className="rounded-2xl bg-white/[0.04] p-4 ring-1 ring-white/10">
        <div className="inline-flex items-center gap-2 rounded-full bg-emerald-400/10 px-3 py-1 text-[10px] font-semibold text-emerald-200 ring-1 ring-emerald-300/20">
          <Check className="h-3 w-3" />
          Tracking reference {reference}
        </div>
        <h4 className="mt-4 text-sm font-bold text-white">What happens next?</h4>
        <ol className="mt-3 space-y-2 text-[11px] leading-relaxed text-white/70">
          {[
            "Complete the purchase through the tracked partner link.",
            "Use the same email shown in RebateBoard whenever possible.",
            "Submit your receipt or account proof if requested.",
            "Track verification and your eligible reward from your dashboard.",
          ].map((item, index) => (
            <li key={item} className="flex gap-2">
              <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-violet-400/15 text-[9px] font-bold text-violet-100">
                {index + 1}
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ol>
      </div>
      <a
        href={claimUrl}
        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full rb-gradient-primary py-3 text-sm font-bold text-white"
      >
        Submit Proof <ArrowRight className="h-4 w-4" />
      </a>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <a
          href="/dashboard/claims"
          className="rounded-full bg-white/5 py-2.5 text-center text-[11px] font-semibold text-white ring-1 ring-white/10 hover:bg-white/10"
        >
          View My Claims
        </a>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full bg-white/5 py-2.5 text-[11px] font-semibold text-white ring-1 ring-white/10 hover:bg-white/10"
        >
          Browse More Programs
        </button>
      </div>
    </div>
  );
}

function FriendlyCheckoutError({ message }: { message: string }) {
  return (
    <div className="mt-3 rounded-xl bg-rose-400/10 px-3 py-2.5 text-[11px] text-rose-100 ring-1 ring-rose-300/20">
      {message}
    </div>
  );
}

function validCheckoutLink(value?: string) {
  if (!value) return "";
  try {
    const parsed = new URL(value.trim());
    return parsed.protocol === "https:" || parsed.protocol === "http:" ? parsed.toString() : "";
  } catch {
    return "";
  }
}

function getGuestCheckoutId() {
  const key = "rb_guest_checkout_id";
  const existing = localStorage.getItem(key);
  if (existing) return existing;
  const created =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `guest-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  localStorage.setItem(key, created);
  return created;
}

function normalizeChallenges(value: unknown[] | undefined): Challenge[] {
  if (!Array.isArray(value) || !value.length) return [];

  const normalized = value
    .map((item, index) => normalizeChallenge(item, index))
    .filter((item): item is Challenge => Boolean(item));

  return normalized;
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
  const rrPoints = Math.max(0, Math.round(numberValue(row.rrPoints)));

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
    badge: normalizeBadge(firstText(row.badge, row.tag, row.highlight, row.label)),
    discountCode: firstText(row.discountCode, row.couponCode, row.promoCode),
    accountType: firstText(row.accountType, row.type),
    platform: firstText(row.platform, row.tradingPlatform),
    minTradingDays: firstText(row.minTradingDays, row.minimumTradingDays),
    timeLimit: firstText(row.timeLimit, row.timeLimitDays, row.duration),
    refundPercentage: firstText(row.refundPercentage, row.refund, row.refundableFee),
    cashbackLabel: firstText(row.cashbackLabel, row.cashback, row.rebate, row.cashbackStatus),
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

function normalizeBadge(value: unknown): string | undefined {
  const clean = text(value);
  if (!clean) return undefined;
  return clean
    .split(/[_-]/g)
    .join(" ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
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

function sortChallenges(challenges: Challenge[], mode: SortMode) {
  const scoreBadge = (challenge: Challenge) => {
    const badge = (challenge.badge ?? "").toLowerCase();
    if (/best value|value/.test(badge)) return 0;
    if (/top|popular|recommended/.test(badge)) return 1;
    if (/new/.test(badge)) return 2;
    return 3;
  };

  return [...challenges].sort((a, b) => {
    if (mode === "lowest-price") return pricedValue(a.price) - pricedValue(b.price);
    if (mode === "highest-size") return accountSizeValue(b.size) - accountSizeValue(a.size);
    if (mode === "best-value") {
      return (
        scoreBadge(a) - scoreBadge(b) ||
        pricedValue(a.price) - pricedValue(b.price) ||
        accountSizeValue(b.size) - accountSizeValue(a.size)
      );
    }
    if (mode === "highest-rr") return b.rrPoints - a.rrPoints || pricedValue(a.price) - pricedValue(b.price);
    return (
      scoreBadge(a) - scoreBadge(b) ||
      accountSizeValue(a.size) - accountSizeValue(b.size) ||
      pricedValue(a.price) - pricedValue(b.price)
    );
  });
}

function pricedValue(value: number) {
  return value > 0 ? value : Number.MAX_SAFE_INTEGER;
}

function fundingMetricRows(challenge: Challenge, valueMode: ValueMode) {
  const evaluationCount = Math.max(1, phaseColumns(challenge).length - 1);
  const profitTargets = distributeMetric(challenge.profitTarget, evaluationCount);
  const rows: Array<{ label: string; value: string; accent?: boolean }> = [];

  profitTargets.forEach((target, index) => {
    if (!text(target)) return;
    rows.push({
      label: `Phase ${index + 1} Target`,
      value: formatMetricValue(target, challenge.size, valueMode),
      accent: index === 0,
    });
  });

  pushMetric(rows, "Daily Drawdown", challenge.dailyLoss, challenge.size, valueMode);
  pushMetric(rows, "Max Drawdown", challenge.maxLoss, challenge.size, valueMode);
  if (challenge.profitSplit) {
    rows.push({ label: "Profit Split", value: formatPercent(challenge.profitSplit), accent: true });
  }
  if (challenge.payoutFreq) rows.push({ label: "Payout", value: challenge.payoutFreq });
  if (challenge.ptdd) rows.push({ label: "PT:DD", value: challenge.ptdd });
  if (challenge.refundPercentage) rows.push({ label: "Refund", value: challenge.refundPercentage });

  return rows.slice(0, 8);
}

function pushMetric(
  rows: Array<{ label: string; value: string; accent?: boolean }>,
  label: string,
  value: string,
  size: string,
  valueMode: ValueMode,
) {
  if (!text(value)) return;
  rows.push({ label, value: formatMetricValue(value, size, valueMode) });
}

function phaseColumns(challenge: Challenge) {
  if (/instant/i.test(challenge.accountStep)) return ["Instant", "Funded"];
  const count = Math.max(1, Number(challenge.accountStep.match(/\d+/)?.[0] ?? 1));
  return [...Array.from({ length: count }, (_, index) => `Phase ${index + 1}`), "Funded"];
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
          accent ? "text-violet-100" : "text-white"
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
          ? "rb-gradient-primary ring-violet-300/40"
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
          ? "rb-gradient-primary text-white ring-violet-400/40"
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
  optionLabels,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  optionLabels?: Record<string, string>;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className={`relative ${open ? "z-[90]" : "z-0"}`}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="glass-pill inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold"
      >
        <span className="text-muted-foreground">{label}:</span>
        <span className="text-white">{optionLabels?.[value] ?? value}</span>
        <ChevronDown className={`h-3 w-3 transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open ? (
        <>
          <div className="fixed inset-0 z-[85]" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full z-[95] mt-1 max-h-64 min-w-[160px] overflow-auto rounded-xl border border-white/15 bg-[rgba(18,18,25,0.98)] p-1 shadow-[0_18px_50px_rgba(0,0,0,0.45)] backdrop-blur-xl">
            {options.map((option) => (
              <button
                type="button"
                key={option}
                onClick={() => {
                  onChange(option);
                  setOpen(false);
                }}
                className={`block w-full rounded-lg px-3 py-1.5 text-left text-[11px] transition ${
                  option === value
                    ? "bg-violet-500/30 text-white"
                    : "text-muted-foreground hover:bg-white/10 hover:text-white"
                }`}
              >
                {optionLabels?.[option] ?? option}
              </button>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
