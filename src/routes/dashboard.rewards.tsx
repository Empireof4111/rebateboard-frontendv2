import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { financeApi } from "@/lib/finance-api";
import { EmptyState, PageHeader, Panel, StatCard, Pill } from "@/components/dashboard/Primitives";
import {
  Gift, Sparkles, Zap, TrendingUp, GraduationCap, Percent, Building2, X,
  CheckCircle2, ArrowRight, Trophy, Flame,
  Instagram, Youtube, Send, MessageCircle, Mail, Music2, ExternalLink, Check, Clock, Target,
} from "lucide-react";
import {
  rrApi,
  type RrAllConfig, type RrClaim, type RrSpendRule, type RrUserStreak,
} from "@/lib/rr-api";
import { ApiError } from "@/lib/api";
import {
  buyRr,
  fetchRrPurchaseCatalog,
  type RrPurchaseCatalog,
  type RrPurchasePackage,
} from "@/lib/rr-purchase-api";
import {
  getNextUnlock,
  getTraderLevelProgress,
  PROGRESSION_TASKS,
  TRADER_LEVELS,
} from "@/lib/trader-levels";

export const Route = createFileRoute("/dashboard/rewards")({
  head: () => ({
    meta: [
      { title: "Rewards — RebateBoard" },
      { name: "description", content: "Earn RR, grow your Trader Level, keep your Trading Streak alive, and unlock RebateBoard rewards." },
    ],
  }),
  component: RewardsPage,
});

type RedeemKind = "cash" | "propfirm" | "fees" | "academy";

const redeemOptions = [
  { id: "cash" as RedeemKind, title: "Cashback Boosts", tagline: "Increase eligible cashback rewards when boosts are available.", rate: "Coming Soon", icon: TrendingUp, accent: "success" as const, cta: "Notify Me" },
  { id: "propfirm" as RedeemKind, title: "Trading Challenges", tagline: "Use RR toward eligible partner challenge opportunities.", rate: "Eligible partners", icon: Building2, accent: "primary" as const, cta: "View eligible partners" },
  { id: "fees" as RedeemKind, title: "Trading Fee Perks", tagline: "Reduce selected trading costs through future RR perks.", rate: "Coming Soon", icon: Percent, accent: "primary" as const, cta: "Notify Me" },
  { id: "academy" as RedeemKind, title: "Academy & Tools", tagline: "Unlock learning content, templates, and premium tools.", rate: "Coming Soon", icon: GraduationCap, accent: "primary" as const, cta: "Notify Me" },
];

const DEFAULT_CONFIG: RrAllConfig = {
  earn_rules: [],
  tiers: [],
  caps: { dailyCap: 0, weeklyCap: 0, cooldowns: {}, dailyActionLimit: {} },
  social_rules: [],
  streak_config: { enabled: false, qualifier: "any_activity", graceHours: 2, milestones: [] },
  spend_rules: [],
};

function RewardsPage() {
  const { user, token, updateProfile } = useAuth();
  const rrBalance = Math.round(user?.rrBalance ?? 0);

  const [rrStats, setRrStats] = useState<{ balance: number; earned30d: number; lifetimeEarned: number } | null>(null);
  const [config, setConfig] = useState<RrAllConfig>(DEFAULT_CONFIG);
  const [claims, setClaims] = useState<RrClaim[]>([]);
  const [streak, setStreak] = useState<RrUserStreak>({ id: 0, userId: 0, current: 0, longest: 0, lastDay: "", claimedMilestones: [] });
  const [redeemOpen, setRedeemOpen] = useState<RedeemKind | null>(null);
  const [purchaseCatalog, setPurchaseCatalog] = useState<RrPurchaseCatalog | null>(null);
  const [buyingPackageId, setBuyingPackageId] = useState<string | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [purchaseError, setPurchaseError] = useState<string | null>(null);
  const [customBuying, setCustomBuying] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const [statsRes, cfgRes, claimsRes, streakRes] = await Promise.allSettled([
        financeApi.getRrStats(token),
        rrApi.getConfig(token),
        rrApi.getClaims(token, 0, 100),
        rrApi.getStreak(token),
      ]);
      if (statsRes.status === "fulfilled" && statsRes.value.payload) setRrStats(statsRes.value.payload);
      if (cfgRes.status === "fulfilled" && cfgRes.value.payload) setConfig(cfgRes.value.payload);
      if (claimsRes.status === "fulfilled" && claimsRes.value.payload) setClaims(claimsRes.value.payload.page);
      if (streakRes.status === "fulfilled" && streakRes.value.payload) setStreak(streakRes.value.payload);
    } catch {}

    try {
      const catalog = await fetchRrPurchaseCatalog();
      setPurchaseCatalog(catalog);
      setPurchaseError(null);
    } catch (error) {
      setPurchaseError(error instanceof Error ? error.message : "Could not load RR top-up options");
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const streakCfg = config.streak_config;
  const nextMilestone = streakCfg.milestones
    .filter((m) => m.enabled && m.days > streak.current)
    .sort((a, b) => a.days - b.days)[0];
  const levelProgress = getTraderLevelProgress(rrBalance);
  const nextUnlock = getNextUnlock(rrBalance, config.spend_rules);

  const pricing = purchaseCatalog?.pricing;
  const walletSnapshot = purchaseCatalog?.wallet;
  const rrPackages = purchaseCatalog?.packages ?? [];
  const earnRules = config.earn_rules.filter((rule) => rule.enabled);
  const nextSpendRule = config.spend_rules
    .filter((rule) => rule.enabled && rule.cost > rrBalance)
    .sort((a, b) => a.cost - b.cost)[0];

  async function handlePackagePurchase(pkg: RrPurchasePackage) {
    if (!pkg.id) return;
    setBuyingPackageId(pkg.id);
    setPurchaseError(null);
    try {
      const payload = await buyRr({ packageId: Number(pkg.id) });
      setPurchaseCatalog(payload.catalog);
      updateProfile({ rrBalance: payload.user.rrBalance });
    } catch (error) {
      setPurchaseError(error instanceof Error ? error.message : "Unable to complete RR purchase");
    } finally {
      setBuyingPackageId(null);
    }
  }

  async function handleCustomPurchase() {
    if (!pricing) return;
    const amount = Number(customAmount);
    if (!amount) {
      setPurchaseError("Enter the RR amount you want to add.");
      return;
    }

    setCustomBuying(true);
    setPurchaseError(null);
    try {
      const payload = await buyRr({ amountRr: amount });
      setPurchaseCatalog(payload.catalog);
      updateProfile({ rrBalance: payload.user.rrBalance });
      setCustomAmount("");
    } catch (error) {
      setPurchaseError(error instanceof Error ? error.message : "Unable to complete RR top-up");
    } finally {
      setCustomBuying(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rebate Rewards"
        subtitle="Earn RR through real activity, grow your Trader Level, and unlock better RebateBoard benefits."
      />

      {/* RR hero */}
      <div className="glass relative overflow-hidden rounded-3xl p-5 ring-1 ring-primary/25 sm:p-6">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-gradient-to-br from-violet-500/25 to-violet-500/20 blur-3xl" />
        <div className="relative grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-muted-foreground">
              <Gift className="h-3.5 w-3.5 text-violet-300" /> RR Balance
            </div>
            <div className="mt-2 flex items-end gap-3">
              <div className="text-5xl font-bold text-white">{rrBalance.toLocaleString()}</div>
              <div className="pb-2 text-sm font-semibold text-violet-200">RR</div>
            </div>
            <div className="mt-3 rounded-2xl border border-white/10 bg-white/[0.035] p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="text-sm font-semibold text-white">{levelProgress.current.name}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {levelProgress.next
                      ? `${levelProgress.remaining.toLocaleString()} RR until ${levelProgress.next.name}`
                      : "Top Trader Level reached"}
                  </div>
                </div>
                <Pill tone="primary">{levelProgress.rr.toLocaleString()} / {levelProgress.next ? levelProgress.next.minRr.toLocaleString() : levelProgress.rr.toLocaleString()} RR</Pill>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/[0.06]">
                <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-violet-400 transition-[width] duration-500" style={{ width: `${levelProgress.progress}%` }} />
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Pill tone="primary"><Flame className="h-3 w-3" />Trading Streak: day {streak.current}</Pill>
              <Pill tone="success">Longest: {streak.longest}d</Pill>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button onClick={() => setRedeemOpen("propfirm")} className="inline-flex items-center gap-1.5 rounded-full rb-gradient-primary px-3 py-1.5 text-xs font-semibold text-white">
                <Target className="h-3.5 w-3.5" /> View eligible partners
              </button>
              <Link to={"/dashboard/reviews" as string} className="glass-pill inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-white">
                <CheckCircle2 className="h-3.5 w-3.5" /> Write review
              </Link>
              <Link to={"/dashboard/wallet" as string} className="glass-pill inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-white">
                <Building2 className="h-3.5 w-3.5" /> Link account
              </Link>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-1">
            <StatCard label="Earned (30d)" value={rrStats ? `${Number(rrStats.earned30d).toLocaleString(undefined, { maximumFractionDigits: 0 })} RR` : "—"} trend="up" accent="success" />
            <StatCard label="Lifetime RR" value={rrStats ? `${Number(rrStats.lifetimeEarned).toLocaleString(undefined, { maximumFractionDigits: 0 })} RR` : "—"} accent="primary" />
          </div>
        </div>
      </div>

      <Panel title="Next Unlock" action={<Pill tone="primary"><Target className="h-3 w-3" />{nextUnlock.remaining.toLocaleString()} RR remaining</Pill>}>
        <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-2xl border border-primary/20 bg-primary/[0.06] p-4">
            <div className="text-xl font-bold text-white">{nextUnlock.title}</div>
            <p className="mt-1 text-sm text-muted-foreground">
              {nextUnlock.subtitle}
              <span className="mt-1 block text-violet-200">Redeem with any eligible participating partner.</span>
            </p>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/[0.07]">
              <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-violet-400 transition-[width] duration-500" style={{ width: `${nextUnlock.progress}%` }} />
            </div>
            <div className="mt-2 text-[11px] text-muted-foreground">
              {rrBalance.toLocaleString()} / {nextUnlock.targetRr.toLocaleString()} RR
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {PROGRESSION_TASKS.map((task) => (
              <Link key={task.label} to={task.href as string} className="rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2.5 text-xs text-white/85 transition hover:bg-white/[0.07] hover:text-white">
                <div className="font-semibold text-white">{task.label}</div>
                <div className="mt-0.5 text-violet-200">+{task.reward} RR</div>
              </Link>
            ))}
          </div>
        </div>
      </Panel>

      {/* Trader Levels */}
      {TRADER_LEVELS.length > 0 && (
        <Panel title="Trader Levels" action={<Pill tone="primary"><Trophy className="h-3 w-3" />How you level up</Pill>}>
          <p className="mb-3 text-[12px] text-muted-foreground">
            Trader Levels are earned by <b>real contribution</b> — approved reviews, Trading Streak activity, linked accounts, and verified participation.
            Higher levels unlock stronger marketplace benefits.
          </p>
          <div className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {TRADER_LEVELS.map((level) => {
              const active = level.id === levelProgress.current.id;
              return (
                <div key={level.id} className={`rounded-xl border p-3 text-[10px] ${active ? "border-primary/45 bg-primary/[0.08]" : "border-white/10 bg-white/[0.03]"}`}>
                  <div className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">{level.name}</div>
                  <div className="mt-1 font-mono text-[11px] text-white">{level.minRr.toLocaleString()} RR</div>
                  <div className="mt-1 text-[9px] leading-relaxed text-muted-foreground">{level.summary}</div>
                </div>
              );
            })}
          </div>
        </Panel>
      )}

      {/* Trading Streak */}
      {streakCfg.enabled && (
        <Panel title="Trading Streak" action={<Pill tone="primary"><Flame className="h-3 w-3" />Day {streak.current} · longest {streak.longest}d</Pill>}>
          <div>
            <p className="text-[12px] text-muted-foreground">
              Complete at least one eligible activity each day, such as adding a journal entry, submitting a review, linking an account, claiming cashback, using Rebeta AI, or completing a lesson.
              {nextMilestone && (
                <> Next milestone reward: <b className="text-violet-200">{nextMilestone.reward} RR</b> at <b className="text-white">{nextMilestone.days} days</b> ({Math.max(0, nextMilestone.days - streak.current)} day{nextMilestone.days - streak.current === 1 ? "" : "s"} remaining).</>
              )}
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-4">
              <StatCard label="Current Streak" value={streak.current ? `${streak.current} days` : "No Data Yet"} accent="primary" />
              <StatCard label="Longest Streak" value={streak.longest ? `${streak.longest} days` : "No Data Yet"} accent="success" />
              <StatCard label="Today's Reward" value={nextMilestone ? `+${nextMilestone.reward} RR` : "Coming Soon"} accent="primary" />
              <StatCard label="Next Milestone" value={nextMilestone ? `${nextMilestone.days} days` : "Completed"} accent="primary" />
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {streakCfg.milestones.filter((m) => m.enabled).map((m) => {
                const claimed = (streak.claimedMilestones ?? []).includes(m.id);
                const pct = Math.min(100, (streak.current / m.days) * 100);
                return (
                  <div key={m.id} className={`rounded-xl border p-3 ${claimed ? "border-emerald-400/30 bg-emerald-500/5" : "border-white/10 bg-white/[0.04]"}`}>
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold text-white">{m.label}</div>
                      {claimed ? <Pill tone="success"><CheckCircle2 className="h-3 w-3" />Claimed</Pill> : <Pill tone="primary">{m.days}d</Pill>}
                    </div>
                    <div className="mt-1 text-[11px] text-muted-foreground">+{m.reward} RR on day {m.days}</div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/5">
                      <div className={`h-full rounded-full ${claimed ? "bg-emerald-400" : "bg-gradient-to-r from-violet-500 to-violet-400"}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Panel>
      )}

      {/* Redeem grid */}
      <Panel title="Redeem your RR" action={<Pill tone="primary"><Sparkles className="h-3 w-3" />Use at checkout</Pill>}>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {redeemOptions.map((opt) => {
            const Icon = opt.icon;
            const ring = opt.accent === "success" ? "ring-emerald-400/30" : "ring-primary/30";
            return (
              <button key={opt.id} onClick={() => setRedeemOpen(opt.id)}
                className={`group rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-left transition hover:bg-white/[0.07] ${ring} hover:ring-1`}
              >
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/5"><Icon className="h-5 w-5 text-violet-300" /></div>
                <div className="mt-3 text-sm font-semibold text-white">{opt.title}</div>
                <p className="mt-1 text-[11px] text-muted-foreground">{opt.tagline}</p>
                <div className="mt-3 inline-flex items-center gap-1 rounded-full bg-white/5 px-2 py-1 text-[10px] font-medium text-white">{opt.rate}</div>
                <div className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-violet-300 transition group-hover:gap-2">{opt.cta} <ArrowRight className="h-3 w-3" /></div>
              </button>
            );
          })}
        </div>
      </Panel>

      <Panel title="RR Top-ups" action={pricing ? <Pill tone={pricing.salesActive ? "success" : "destructive"}>{pricing.salesActive ? "Top-ups open" : "Paused"}</Pill> : null}>
        <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <StatCard
                label="USD Wallet"
                value={`$${Number(walletSnapshot?.usdBalance ?? 0).toFixed(2)}`}
                hint="Available for marketplace actions"
                accent="success"
              />
              <StatCard
                label="RR Balance"
                value={String(Math.round(walletSnapshot?.rrBalance ?? rrBalance))}
                hint={levelProgress.current.name}
                accent="primary"
              />
            </div>

            {purchaseError ? (
              <div className="rounded-2xl border border-rose-400/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                {purchaseError}
              </div>
            ) : null}

            <div className="grid gap-3 lg:grid-cols-2">
              {rrPackages.map((pkg) => (
                <div key={pkg.id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 ring-1 ring-white/5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-white">{pkg.name}</div>
                      <div className="mt-1 text-[11px] text-muted-foreground">
                        {pkg.amountRr.toLocaleString()} RR
                        {pkg.bonusRr > 0 ? ` + ${pkg.bonusRr.toLocaleString()} bonus` : ""}
                      </div>
                    </div>
                    {pkg.badge ? <Pill tone="primary">{pkg.badge}</Pill> : null}
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-xl border border-white/10 bg-black/10 px-3 py-2">
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Total RR</div>
                      <div className="mt-1 font-semibold text-violet-200">{Number(pkg.totalRr ?? pkg.amountRr).toLocaleString()}</div>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-black/10 px-3 py-2">
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Cost</div>
                      <div className="mt-1 font-semibold text-emerald-300">${Number(pkg.amountUsd ?? 0).toFixed(2)}</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={!pricing?.salesActive || buyingPackageId === pkg.id}
                    onClick={() => void handlePackagePurchase(pkg)}
                    className="mt-4 w-full rounded-xl rb-gradient-primary py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {buyingPackageId === pkg.id ? "Processing..." : "Request top-up"}
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 ring-1 ring-white/5">
              <div className="text-sm font-semibold text-white">Custom RR top-up</div>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Add a custom RR amount within your available top-up limits. Final confirmation is handled through the wallet flow.
              </p>
              <div className="mt-4">
                <Field label={`RR amount${pricing ? ` (${pricing.minPurchaseRr} - ${pricing.maxPurchaseRr})` : ""}`}>
                  <input
                    type="number"
                    min={pricing?.minPurchaseRr ?? 0}
                    max={pricing?.maxPurchaseRr ?? 0}
                    value={customAmount}
                    onChange={(event) => setCustomAmount(event.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white outline-none transition focus:border-violet-400/60 focus:ring-2 focus:ring-violet-400/15"
                    placeholder="Enter RR amount"
                  />
                </Field>
              </div>
              <button
                type="button"
                disabled={!pricing?.salesActive || customBuying}
                onClick={() => void handleCustomPurchase()}
                className="mt-4 w-full rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {customBuying ? "Processing..." : "Request custom top-up"}
              </button>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 ring-1 ring-white/5">
              <div className="flex items-center justify-between gap-2">
                <div className="text-sm font-semibold text-white">Recent top-ups</div>
                <Pill tone="default">{purchaseCatalog?.purchases.length ?? 0}</Pill>
              </div>
              <div className="mt-3 space-y-2">
                {(purchaseCatalog?.purchases ?? []).length === 0 ? (
                  <div className="rounded-xl border border-dashed border-white/10 bg-black/10 px-3 py-5 text-center text-xs text-muted-foreground">
                    Your RR top-ups will appear here.
                  </div>
                ) : (
                  (purchaseCatalog?.purchases ?? []).slice(0, 5).map((purchase) => (
                    <div key={purchase.id} className="rounded-xl border border-white/10 bg-black/10 px-3 py-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-sm font-semibold text-white">{purchase.rrAmount.toLocaleString()} RR</div>
                        <Pill tone={purchase.status === "successful" ? "success" : purchase.status === "pending" ? "warning" : "destructive"}>
                          {purchase.status}
                        </Pill>
                      </div>
                      <div className="mt-1 flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
                        <span>${purchase.amountUsd.toFixed(2)}</span>
                        <span>{new Date(purchase.when).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </Panel>

      {/* Earn opportunities */}
      <Panel title="Earn RR" action={<Sparkles className="h-4 w-4 text-violet-300" />}>
        {earnRules.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {earnRules.map((rule) => (
              <div key={rule.id} className="flex items-start justify-between rounded-xl border border-white/10 bg-white/[0.04] p-3">
                <div>
                  <div className="text-sm font-semibold text-white">{rule.label}</div>
                  <p className="text-[11px] text-muted-foreground">{rule.description || "Complete this mission to earn RR."}</p>
                </div>
                <Pill tone="primary"><Gift className="h-3 w-3" />+{rule.freeAmount}</Pill>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Gift}
            title="No RR missions available yet"
            description="New missions will appear automatically. Complete them to earn RR and maintain your Trading Streak."
          />
        )}
      </Panel>

      <FollowAndEarnPanel
        socialRules={config.social_rules}
        claims={claims}
        onClaimSubmitted={(claim) => setClaims((prev) => {
          const i = prev.findIndex((c) => c.id === claim.id);
          return i >= 0 ? prev.map((c) => c.id === claim.id ? claim : c) : [...prev, claim];
        })}
      />

      <Panel title="Smart suggestion" action={<Pill tone="primary"><Zap className="h-3 w-3" />AI</Pill>}>
        {nextSpendRule ? (
          <>
            <p className="text-sm text-white/85">
              You're <b>{(nextSpendRule.cost - rrBalance).toLocaleString()} RR</b> away from <b>{nextSpendRule.label}</b>.
              Use the enabled earning rules above to reach this reward.
            </p>
            <button onClick={() => setRedeemOpen("propfirm")} className="mt-3 inline-flex items-center gap-1.5 rounded-full rb-gradient-primary px-3 py-1.5 text-xs font-semibold text-white">
              See rewards <ArrowRight className="h-3 w-3" />
            </button>
          </>
        ) : rrBalance > 0 ? (
          <p className="text-sm text-white/85">
            You have <b>{rrBalance.toLocaleString()} RR</b>. New redemption options will appear automatically when they become available.
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            Earn RR through available missions, then use it for eligible marketplace benefits.
          </p>
        )}
      </Panel>

      {redeemOpen && (
        <RedeemModal kind={redeemOpen} rrBalance={rrBalance} spendRules={config.spend_rules.filter((rule) => rule.enabled)} onClose={() => setRedeemOpen(null)} />
      )}
    </div>
  );
}

/* ============================================================ Follow & Earn */

const SOCIAL_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  follow_instagram: Instagram,
  follow_twitter: Sparkles,
  subscribe_youtube: Youtube,
  follow_tiktok: Music2,
  join_telegram: Send,
  join_discord: MessageCircle,
  subscribe_newsletter: Mail,
};

function FollowAndEarnPanel({
  socialRules,
  claims,
  onClaimSubmitted,
}: {
  socialRules: RrAllConfig["social_rules"];
  claims: RrClaim[];
  onClaimSubmitted: (c: RrClaim) => void;
}) {
  const social = socialRules.filter((r) => r.enabled);
  const [openId, setOpenId] = useState<string | null>(null);

  if (social.length === 0) return null;

  return (
    <>
      <Panel title="Follow & earn — one-time RR rewards" action={<Pill tone="primary"><Sparkles className="h-3 w-3" />Once per account</Pill>}>
        <p className="mb-3 text-[12px] text-muted-foreground">
          Follow our official channels to unlock RR. Each reward is paid <b>once per account</b> after we verify your follow/subscribe.
        </p>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {social.map((r) => {
            const Icon = SOCIAL_ICONS[r.id] ?? Sparkles;
            const claim = claims.find((c) => c.socialId === r.id);
            const claimed = claim?.status === "approved";
            const pending = claim?.status === "pending";
            return (
              <div key={r.id} className="flex flex-col rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <div className="flex items-start justify-between">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-[rgba(126,77,255,0.18)] ring-1 ring-white/10">
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <Pill tone="primary"><Gift className="h-3 w-3" />+{r.reward} RR</Pill>
                </div>
                <div className="mt-3 text-sm font-semibold text-white">{r.label}</div>
                <p className="mt-1 flex-1 text-[11px] text-muted-foreground">{r.description}</p>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <a href={r.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[11px] font-semibold text-violet-300 hover:underline">
                    {r.handle} <ExternalLink className="h-3 w-3" />
                  </a>
                  {claimed ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-3 py-1 text-[11px] font-bold text-emerald-300 ring-1 ring-emerald-400/30">
                      <Check className="h-3 w-3" /> Claimed
                    </span>
                  ) : pending ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-violet-500/15 px-3 py-1 text-[11px] font-bold text-violet-200 ring-1 ring-violet-400/25">
                      <Clock className="h-3 w-3" /> Verifying
                    </span>
                  ) : (
                    <button onClick={() => setOpenId(r.id)} className="rounded-full rb-gradient-primary px-3 py-1 text-[11px] font-bold text-white">
                      Claim
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Panel>

      {openId && (
        <ClaimSocialModal
          socialId={openId}
          socialRules={social}
          onClose={() => setOpenId(null)}
          onSubmitted={(claim) => { onClaimSubmitted(claim); setOpenId(null); }}
        />
      )}
    </>
  );
}

function ClaimSocialModal({ socialId, socialRules, onClose, onSubmitted }: {
  socialId: string;
  socialRules: RrAllConfig["social_rules"];
  onClose: () => void;
  onSubmitted: (c: RrClaim) => void;
}) {
  const { token } = useAuth();
  const rule = socialRules.find((r) => r.id === socialId);
  const [proof, setProof] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  if (!rule) return null;

  const submit = async () => {
    if (!token || !proof.trim()) return;
    setSubmitting(true);
    try {
      const res = await rrApi.submitClaim(token, socialId, proof.trim());
      if (res.payload) { onSubmitted(res.payload); setDone(true); }
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not submit claim");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalShell title={done ? "Submitted!" : `Claim ${rule.reward} RR`} onClose={onClose}>
      {done ? (
        <Success text="We'll verify your follow within 24 hours and credit your wallet automatically." onClose={onClose} />
      ) : (
        <div className="space-y-3 text-sm">
          <div className="rounded-xl bg-white/[0.04] p-3 ring-1 ring-white/10">
            <div className="text-[11px] uppercase text-muted-foreground">Step 1 — Follow our channel</div>
            <a href={rule.url} target="_blank" rel="noreferrer"
              className="mt-1 inline-flex items-center gap-1.5 text-sm font-bold text-violet-300 hover:underline">
              {rule.handle} <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
          <div>
            <label className="text-[11px] uppercase text-muted-foreground">
              Step 2 — Your {rule.verification === "email" ? "email" : "handle / username"}
            </label>
            <input value={proof} onChange={(e) => { setProof(e.target.value); setError(null); }}
              placeholder={rule.verification === "email" ? "you@example.com" : "@yourhandle"}
              className="input mt-1" />
            <p className="mt-1 text-[10px] text-muted-foreground">
              We check your account followed/subscribed to <b>{rule.handle}</b> before crediting RR.
            </p>
          </div>
          {error && <div className="rounded-lg bg-rose-500/10 px-3 py-2 text-[11px] text-rose-300 ring-1 ring-rose-400/30">{error}</div>}
          <button onClick={submit} disabled={!proof.trim() || submitting}
            className="w-full rounded-xl rb-gradient-primary py-2.5 text-sm font-semibold text-white disabled:opacity-50">
            {submitting ? "Submitting…" : "Submit for verification"}
          </button>
          <style>{`.input{width:100%;border-radius:12px;border:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.04);padding:10px 12px;font-size:14px;color:white;outline:none}`}</style>
        </div>
      )}
    </ModalShell>
  );
}

/* ============================================================ Shared UI */

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}

function ModalShell({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-black/70 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="glass w-full max-w-lg rounded-2xl p-5 ring-1 ring-white/10" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">{title}</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-white"><X className="h-4 w-4" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function RedeemModal({
  kind,
  rrBalance,
  spendRules,
  onClose,
}: {
  kind: RedeemKind;
  rrBalance: number;
  spendRules: RrSpendRule[];
  onClose: () => void;
}) {
  const categoryMap: Record<RedeemKind, string[]> = {
    cash: ["boost", "cashback", "cash"],
    propfirm: ["partner", "discount", "challenge"],
    fees: ["fees"],
    academy: ["academy", "tool"],
  };
  const titles: Record<RedeemKind, string> = {
    cash: "Cashback Boost Options",
    propfirm: "Eligible Trading Challenges",
    fees: "Trading Fee Perk Options",
    academy: "Academy & Tool Options",
  };
  const options = spendRules.filter((rule) => categoryMap[kind].includes(String(rule.category).toLowerCase()));

  return (
    <ModalShell title={titles[kind]} onClose={onClose}>
      <div className="space-y-3">
        {options.length > 0 ? (
          options.map((rule) => {
            const affordable = rrBalance >= rule.cost;
            const outOfStock = rule.stock != null && rule.redeemed >= rule.stock;
            return (
              <div key={rule.id} className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-white">{rule.label}</div>
                    <p className="mt-1 text-xs text-muted-foreground">{rule.description || "Redeem with any eligible participating partner."}</p>
                  </div>
                  <Pill tone={affordable && !outOfStock ? "primary" : "default"}><Gift className="h-3 w-3" />{rule.cost} RR</Pill>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                  {rule.tierGate && <Pill>Trader Level: {rule.tierGate}</Pill>}
                  {rule.stock != null && <Pill>{Math.max(0, rule.stock - rule.redeemed)} left</Pill>}
                  {!affordable && <span>Need {(rule.cost - rrBalance).toLocaleString()} more RR.</span>}
                  {outOfStock && <span>Out of stock.</span>}
                </div>
              </div>
            );
          })
        ) : (
          <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-5 text-center">
            <p className="text-sm font-semibold text-white">No options available yet</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              New reward options will appear automatically when they become available.
            </p>
          </div>
        )}
        <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3 text-xs leading-relaxed text-muted-foreground">
          Some rewards require RebateBoard confirmation before they appear in your account.
        </div>
      </div>
    </ModalShell>
  );
}
