import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { PageHeader, Panel, StatCard, Pill } from "@/components/dashboard/Primitives";
import {
  Gift, Sparkles, Zap, TrendingUp, GraduationCap, Percent, Building2, X,
  CheckCircle2, ArrowRight, Trophy, Flame,
  Instagram, Youtube, Send, MessageCircle, Mail, Music2, ExternalLink, Check, Clock,
} from "lucide-react";
import {
  useSocialRules, useClaims, submitSocialClaim, type RrSocialId,
  useStreakConfig, useStreakState,
  useUserTier, useTiers, getNextTierProgress, useUsageFor, useCaps,
} from "@/lib/rr-rewards";

export const Route = createFileRoute("/dashboard/rewards")({
  head: () => ({
    meta: [
      { title: "Rewards — RebateBoard" },
      { name: "description", content: "Earn RR for trading and convert it into cash, prop firm discounts, and trading fee reductions." },
    ],
  }),
  component: RewardsPage,
});

type RedeemKind = "cash" | "propfirm" | "fees" | "academy";

type RedeemOption = {
  id: RedeemKind;
  title: string;
  tagline: string;
  rate: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: "success" | "primary" | "warning" | "destructive";
  cta: string;
};

const redeemOptions: RedeemOption[] = [
  { id: "cash", title: "Convert to Cash", tagline: "Sent straight to your wallet", rate: "1,000 RR → $10", icon: TrendingUp, accent: "success", cta: "Convert now" },
  { id: "propfirm", title: "Prop Firm Discount", tagline: "Apply RR at checkout for any prop account", rate: "500 RR → 25% off", icon: Building2, accent: "primary", cta: "Pick a firm" },
  { id: "fees", title: "Trading Fee Discount", tagline: "Reduce spreads & commissions on partner brokers", rate: "750 RR → −30% fees · 30 days", icon: Percent, accent: "warning", cta: "Activate" },
  { id: "academy", title: "Academy & Tools", tagline: "Unlock premium courses, calculators and indicators", rate: "300 RR / unlock", icon: GraduationCap, accent: "primary", cta: "Browse" },
];

const earnList = [
  { t: "Log a trade", rr: 5, d: "Per trade with notes & screenshot." },
  { t: "Write a review", rr: 50, d: "Verified review of any brand." },
  { t: "Daily journal entry", rr: 24, d: "End-of-day reflection." },
  { t: "Refer a trader", rr: 200, d: "When they sign up & log 5 trades." },
  { t: "Complete a quest", rr: 75, d: "Weekly trading challenges." },
  { t: "Cashback milestone", rr: 100, d: "Every $500 cashback earned." },
];

const propFirms = [
  { name: "FundingPips", sizes: ["$10K", "$25K", "$50K", "$100K"], baseFee: 588 },
  { name: "FTMO", sizes: ["$10K", "$25K", "$50K", "$100K", "$200K"], baseFee: 1080 },
  { name: "The5ers", sizes: ["$5K", "$20K", "$60K", "$100K"], baseFee: 460 },
  { name: "MyForexFunds", sizes: ["$10K", "$50K", "$100K"], baseFee: 540 },
];

function RewardsPage() {
  const { user } = useAuth();
  const userId = user?.email ?? "@me";
  const rrBalance = Math.round(user?.rrBalance ?? 0);
  const cashValue = (rrBalance / 100).toFixed(2);

  // Contributor tier (action-based: reviews + streak + verified)
  const contribTier = useUserTier(userId);
  const allTiers = useTiers();
  const tierProgress = getNextTierProgress(userId);
  const tier = contribTier.name;
  const progress = tierProgress ? tierProgress.pct : 100;

  const streakCfg = useStreakConfig();
  const streak = useStreakState();
  const nextMilestone = streakCfg.milestones
    .filter((m) => m.enabled && m.days > streak.current)
    .sort((a, b) => a.days - b.days)[0];

  // Caps usage (today / week)
  const caps = useCaps();
  const usage = useUsageFor(userId);
  const dailyCap = Math.max(caps.dailyCap, contribTier.dailyCap || 0);

  const [redeemOpen, setRedeemOpen] = useState<RedeemKind | null>(null);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rebate Rewards"
        subtitle="Earn RR for every action — convert it into real trader value, not just badges."
      />

      {/* RR hero */}
      <div className="glass relative overflow-hidden rounded-3xl p-6 ring-1 ring-amber-400/20">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-gradient-to-br from-amber-400/30 to-fuchsia-500/20 blur-3xl" />
        <div className="relative grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-muted-foreground">
              <Gift className="h-3.5 w-3.5 text-amber-400" /> RR Balance
            </div>
            <div className="mt-2 flex items-end gap-3">
              <div className="text-5xl font-bold text-white">{rrBalance.toLocaleString()}</div>
              <div className="pb-2 text-sm text-muted-foreground">≈ <b className="text-emerald-400">${cashValue}</b></div>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Pill tone="warning"><Trophy className="h-3 w-3" />{tier} tier</Pill>
              <Pill tone="success"><Flame className="h-3 w-3" />{streak.current}-day streak</Pill>
              <span className="text-[11px] text-muted-foreground">{tierProgress ? `Next: ${tierProgress.next.name}` : "Top tier reached"}</span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/5">
              <div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-fuchsia-500" style={{ width: `${progress}%` }} />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button onClick={() => setRedeemOpen("cash")} className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 px-3 py-1.5 text-xs font-semibold text-white">
                <TrendingUp className="h-3.5 w-3.5" /> Convert to cash
              </button>
              <button onClick={() => setRedeemOpen("propfirm")} className="glass-pill inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-white">
                <Building2 className="h-3.5 w-3.5" /> Buy prop firm
              </button>
              <button onClick={() => setRedeemOpen("fees")} className="glass-pill inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-white">
                <Percent className="h-3.5 w-3.5" /> Cut fees
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-1">
            <StatCard label="Earned (30d)" value="412 RR" trend="up" accent="success" />
            <StatCard label="Lifetime" value="6,840 RR" accent="primary" />
          </div>
        </div>
      </div>

      {/* Contributor Tier — action-based progression */}
      <Panel
        title="Contributor tier"
        action={<Pill tone="primary"><Trophy className="h-3 w-3" />{contribTier.name} · ×{contribTier.multiplier.toFixed(2)}</Pill>}
      >
        <div className="grid gap-4 md:grid-cols-[1.2fr_1fr]">
          <div>
            <p className="text-[12px] text-muted-foreground">
              Tiers are earned by <b>real contribution</b> — approved reviews, daily streaks and verifying your account — not by spending RR. The higher your tier, the more RR you earn per action and the more rewards you can unlock.
            </p>

            {/* Tier ladder */}
            <div className="mt-3 grid grid-cols-5 gap-1.5">
              {allTiers.map((t) => {
                const reached = t.rank <= contribTier.rank;
                const current = t.rank === contribTier.rank;
                return (
                  <div key={t.id} className={`rounded-xl border p-2 text-center text-[10px] ${current ? "border-fuchsia-400/50 bg-fuchsia-500/10" : reached ? "border-emerald-400/30 bg-emerald-500/5" : "border-white/10 bg-white/[0.03]"}`}>
                    <div className={`text-[9px] font-bold uppercase tracking-wider ${current ? "text-fuchsia-300" : reached ? "text-emerald-300" : "text-muted-foreground"}`}>{t.name}</div>
                    <div className="mt-1 font-mono text-[11px] text-white">×{t.multiplier.toFixed(2)}</div>
                    <div className="text-[9px] text-muted-foreground">{t.dailyCap || "∞"}/d</div>
                  </div>
                );
              })}
            </div>

            {tierProgress ? (
              <div className="mt-4">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-muted-foreground">Progress to <b className="text-white">{tierProgress.next.name}</b></span>
                  <span className="font-mono text-fuchsia-300">{tierProgress.pct}%</span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-white/5">
                  <div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-fuchsia-500" style={{ width: `${tierProgress.pct}%` }} />
                </div>
                {tierProgress.missing.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {tierProgress.missing.map((m) => (
                      <span key={m} className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-amber-200 ring-1 ring-amber-400/30">Need: {m}</span>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-4 rounded-xl bg-emerald-500/10 px-3 py-2 text-[11px] text-emerald-300 ring-1 ring-emerald-400/30">
                You've reached the top tier. Maximum earn rate active.
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Your current perks</div>
            <ul className="mt-2 space-y-1.5">
              {contribTier.perks.map((p) => (
                <li key={p} className="flex items-start gap-2 text-[12px] text-white/90">
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
                  <span>{p}</span>
                </li>
              ))}
            </ul>

            {/* Daily cap usage */}
            <div className="mt-4 border-t border-white/10 pt-3">
              <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-muted-foreground">
                <span>Today's earn cap</span>
                <span className="font-mono text-white/85">{usage.dayTotal} / {dailyCap || "∞"} RR</span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/5">
                <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-500" style={{ width: dailyCap > 0 ? `${Math.min(100, (usage.dayTotal / dailyCap) * 100)}%` : "0%" }} />
              </div>
              {caps.weeklyCap > 0 && (
                <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground">
                  <span>This week</span>
                  <span className="font-mono">{usage.weekTotal} / {caps.weeklyCap} RR</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </Panel>

      {/* Streak Center — admin-controlled milestones */}
      {streakCfg.enabled && (
        <Panel
          title="Streak Center"
          action={<Pill tone="warning"><Flame className="h-3 w-3" />{streak.current}-day streak · longest {streak.longest}d</Pill>}
        >
          <div className="grid gap-4 md:grid-cols-[1fr_auto]">
            <div>
              <p className="text-[12px] text-muted-foreground">
                Show up every day ({streakCfg.qualifier === "trade_log" ? "log a trade" : streakCfg.qualifier === "login" ? "log in" : "log in or log a trade"}) to grow your streak. Hit a milestone, RR auto-credits to your wallet.
                {nextMilestone && (
                  <> Next reward: <b className="text-amber-300">{nextMilestone.reward} RR</b> at <b className="text-white">{nextMilestone.days} days</b> ({nextMilestone.days - streak.current} to go).</>
                )}
              </p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {streakCfg.milestones.filter((m) => m.enabled).map((m) => {
                  const claimed = streak.claimedMilestones.includes(m.id);
                  const pct = Math.min(100, (streak.current / m.days) * 100);
                  return (
                    <div key={m.id} className={`rounded-xl border p-3 ${claimed ? "border-emerald-400/30 bg-emerald-500/5" : "border-white/10 bg-white/[0.04]"}`}>
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-semibold text-white">{m.label}</div>
                        {claimed
                          ? <Pill tone="success"><CheckCircle2 className="h-3 w-3" />Claimed</Pill>
                          : <Pill tone="warning">{m.days}d</Pill>}
                      </div>
                      <div className="mt-1 text-[11px] text-muted-foreground">+{m.reward} RR on day {m.days}</div>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/5">
                        <div className={`h-full rounded-full ${claimed ? "bg-emerald-400" : "bg-gradient-to-r from-amber-400 to-fuchsia-500"}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </Panel>
      )}

      {/* Redeem grid */}
      <Panel title="Redeem your RR" action={<Pill tone="primary"><Sparkles className="h-3 w-3" />Use at checkout</Pill>}>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {redeemOptions.map((opt) => {
            const Icon = opt.icon;
            const ring = opt.accent === "success" ? "ring-emerald-400/30" : opt.accent === "warning" ? "ring-amber-400/30" : "ring-primary/30";
            return (
              <button
                key={opt.id}
                onClick={() => setRedeemOpen(opt.id)}
                className={`group rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-left transition hover:bg-white/[0.07] ${ring} hover:ring-1`}
              >
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/5">
                  <Icon className="h-5 w-5 text-accent" />
                </div>
                <div className="mt-3 text-sm font-semibold text-white">{opt.title}</div>
                <p className="mt-1 text-[11px] text-muted-foreground">{opt.tagline}</p>
                <div className="mt-3 inline-flex items-center gap-1 rounded-full bg-white/5 px-2 py-1 text-[10px] font-medium text-white">
                  {opt.rate}
                </div>
                <div className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-accent transition group-hover:gap-2">
                  {opt.cta} <ArrowRight className="h-3 w-3" />
                </div>
              </button>
            );
          })}
        </div>
      </Panel>

      {/* Earn opportunities */}
      <Panel title="Earn RR" action={<Sparkles className="h-4 w-4 text-accent" />}>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {earnList.map((e) => (
            <div key={e.t} className="flex items-start justify-between rounded-xl border border-white/10 bg-white/[0.04] p-3">
              <div>
                <div className="text-sm font-semibold text-white">{e.t}</div>
                <p className="text-[11px] text-muted-foreground">{e.d}</p>
              </div>
              <Pill tone="warning"><Gift className="h-3 w-3" />+{e.rr}</Pill>
            </div>
          ))}
        </div>
      </Panel>

      <FollowAndEarnPanel />

      <Panel title="Smart suggestion" action={<Pill tone="primary"><Zap className="h-3 w-3" />AI</Pill>}>
        <p className="text-sm text-white/85">
          You're <b>216 RR</b> away from <b>25% off</b> a FundingPips $25K account.
          Log <b>3 more trades</b> + <b>1 review</b> this week to unlock it.
        </p>
        <button onClick={() => setRedeemOpen("propfirm")} className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-600 px-3 py-1.5 text-xs font-semibold text-white">
          See discount <ArrowRight className="h-3 w-3" />
        </button>
      </Panel>

      {redeemOpen && (
        <RedeemModal kind={redeemOpen} rrBalance={rrBalance} onClose={() => setRedeemOpen(null)} />
      )}
    </div>
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

function RedeemModal({ kind, rrBalance, onClose }: { kind: RedeemKind; rrBalance: number; onClose: () => void }) {
  const [done, setDone] = useState(false);

  if (kind === "cash") {
    const [rr, setRr] = useState("1000");
    const cash = (Number(rr) / 100).toFixed(2);
    return (
      <ModalShell title="Convert RR to Cash" onClose={onClose}>
        {done ? <Success text={`$${cash} credited to wallet.`} onClose={onClose} /> : (
          <div className="space-y-3">
            <Field label="RR amount">
              <input value={rr} onChange={(e) => setRr(e.target.value)} className="input" />
            </Field>
            <div className="rounded-xl bg-emerald-500/10 p-4 ring-1 ring-emerald-400/30">
              <div className="text-[11px] uppercase text-emerald-300">You'll receive</div>
              <div className="mt-1 text-2xl font-bold text-white">${cash}</div>
              <div className="mt-1 text-[11px] text-emerald-300">Sent to wallet · instant</div>
            </div>
            <button onClick={() => setDone(true)} className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 py-2.5 text-sm font-semibold text-white">
              Convert {rr} RR
            </button>
            <p className="text-center text-[10px] text-muted-foreground">Balance after: {(rrBalance - Number(rr)).toLocaleString()} RR</p>
          </div>
        )}
      </ModalShell>
    );
  }

  if (kind === "propfirm") {
    const [firm, setFirm] = useState(propFirms[0].name);
    const [size, setSize] = useState(propFirms[0].sizes[2]);
    const selected = propFirms.find((f) => f.name === firm)!;
    const discount = 0.25;
    const rrCost = 500;
    const finalPrice = (selected.baseFee * (1 - discount)).toFixed(2);
    return (
      <ModalShell title="Buy Prop Firm with RR Discount" onClose={onClose}>
        {done ? <Success text={`Discount applied. Continue to ${firm} checkout.`} onClose={onClose} /> : (
          <div className="space-y-3">
            <Field label="Prop firm">
              <select value={firm} onChange={(e) => { setFirm(e.target.value); setSize(propFirms.find((f) => f.name === e.target.value)!.sizes[0]); }} className="input">
                {propFirms.map((f) => <option key={f.name}>{f.name}</option>)}
              </select>
            </Field>
            <Field label="Account size">
              <select value={size} onChange={(e) => setSize(e.target.value)} className="input">
                {selected.sizes.map((s) => <option key={s}>{s}</option>)}
              </select>
            </Field>
            <div className="space-y-1 rounded-xl border border-white/5 bg-white/[0.02] p-3 text-xs">
              <Row label="Base price" value={`$${selected.baseFee}`} />
              <Row label="RR discount" value={`−25% (${rrCost} RR)`} />
              <Row label="You pay" value={`$${finalPrice}`} bold />
            </div>
            <button onClick={() => setDone(true)} className="w-full rounded-xl bg-gradient-to-r from-fuchsia-500 to-violet-600 py-2.5 text-sm font-semibold text-white">
              Apply RR & continue
            </button>
          </div>
        )}
      </ModalShell>
    );
  }

  if (kind === "fees") {
    return (
      <ModalShell title="Activate Fee Discount" onClose={onClose}>
        {done ? <Success text="30% fee discount active for 30 days on partner brokers." onClose={onClose} /> : (
          <div className="space-y-3 text-sm text-white/85">
            <div className="rounded-xl bg-white/[0.04] p-4">
              <div className="text-[11px] uppercase text-muted-foreground">Cost</div>
              <div className="mt-1 text-2xl font-bold text-white">750 RR</div>
              <div className="mt-1 text-[11px] text-amber-300">Reduces spreads & commissions by 30% for 30 days</div>
            </div>
            <ul className="space-y-1.5 text-[11px] text-muted-foreground">
              <li>• Works on Exness, IC Markets, Pepperstone</li>
              <li>• Stacks with existing cashback</li>
              <li>• Auto-applies on linked accounts</li>
            </ul>
            <button onClick={() => setDone(true)} className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 py-2.5 text-sm font-semibold text-white">
              Activate for 750 RR
            </button>
          </div>
        )}
      </ModalShell>
    );
  }

  return (
    <ModalShell title="Unlock Academy & Tools" onClose={onClose}>
      {done ? <Success text="Unlocked. Find it under Academy." onClose={onClose} /> : (
        <div className="space-y-2">
          {[
            { t: "Smart Money Concepts — Pro Course", c: 300 },
            { t: "Risk Sizing Calculator (advanced)", c: 200 },
            { t: "Liquidity Heatmap Indicator", c: 450 },
            { t: "Prop Firm Pass Playbook", c: 350 },
          ].map((x) => (
            <button key={x.t} onClick={() => setDone(true)} className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/[0.04] p-3 text-left transition hover:border-primary/40">
              <span className="text-sm text-white">{x.t}</span>
              <Pill tone="warning"><Gift className="h-3 w-3" />{x.c} RR</Pill>
            </button>
          ))}
        </div>
      )}
    </ModalShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[11px] uppercase text-muted-foreground">{label}</label>
      <div className="mt-1">{children}</div>
      <style>{`.input{width:100%;border-radius:12px;border:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.04);padding:10px 12px;font-size:14px;color:white;outline:none}`}</style>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-muted-foreground">{label}</span>
      <span className={bold ? "font-bold text-white" : "text-white"}>{value}</span>
    </div>
  );
}

function Success({ text, onClose }: { text: string; onClose: () => void }) {
  return (
    <div className="space-y-3 text-center">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-500/15 text-emerald-400">
        <CheckCircle2 className="h-7 w-7" />
      </div>
      <p className="text-sm text-white">{text}</p>
      <button onClick={onClose} className="rounded-full bg-white/10 px-4 py-1.5 text-xs text-white">Done</button>
    </div>
  );
}

/* ============================================================
 * Follow & Earn — admin-controlled, once per user
 * ============================================================ */

const SOCIAL_ICONS: Record<RrSocialId, React.ComponentType<{ className?: string }>> = {
  follow_instagram: Instagram,
  follow_twitter: Sparkles,
  subscribe_youtube: Youtube,
  follow_tiktok: Music2,
  join_telegram: Send,
  join_discord: MessageCircle,
  subscribe_newsletter: Mail,
};

function FollowAndEarnPanel() {
  const social = useSocialRules().filter((r) => r.enabled);
  const claims = useClaims();
  const { user } = useAuth();
  const userId = user?.email ?? "@me";
  const [openId, setOpenId] = useState<RrSocialId | null>(null);

  if (social.length === 0) return null;

  return (
    <>
      <Panel
        title="Follow & earn — one-time RR rewards"
        action={<Pill tone="primary"><Sparkles className="h-3 w-3" />Once per account</Pill>}
      >
        <p className="mb-3 text-[12px] text-muted-foreground">
          Follow our official channels to unlock RR. Each reward is paid <b>once per account</b> after we verify your follow / subscribe.
        </p>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {social.map((r) => {
            const Icon = SOCIAL_ICONS[r.id] ?? Sparkles;
            const claim = claims.find((c) => c.socialId === r.id && c.userId === userId);
            const claimed = claim?.status === "approved";
            const pending = claim?.status === "pending";
            return (
              <div key={r.id} className="flex flex-col rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <div className="flex items-start justify-between">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-fuchsia-500/30 to-violet-600/30 ring-1 ring-white/10">
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <Pill tone="warning"><Gift className="h-3 w-3" />+{r.reward} RR</Pill>
                </div>
                <div className="mt-3 text-sm font-semibold text-white">{r.label}</div>
                <p className="mt-1 flex-1 text-[11px] text-muted-foreground">{r.description}</p>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <a href={r.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[11px] font-semibold text-fuchsia-300 hover:underline">
                    {r.handle} <ExternalLink className="h-3 w-3" />
                  </a>
                  {claimed ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-3 py-1 text-[11px] font-bold text-emerald-300 ring-1 ring-emerald-400/30">
                      <Check className="h-3 w-3" /> Claimed
                    </span>
                  ) : pending ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-3 py-1 text-[11px] font-bold text-amber-300 ring-1 ring-amber-400/30">
                      <Clock className="h-3 w-3" /> Verifying
                    </span>
                  ) : (
                    <button
                      onClick={() => setOpenId(r.id)}
                      className="rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-600 px-3 py-1 text-[11px] font-bold text-white"
                    >
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
          userId={userId}
          onClose={() => setOpenId(null)}
        />
      )}
    </>
  );
}

function ClaimSocialModal({ socialId, userId, onClose }: { socialId: RrSocialId; userId: string; onClose: () => void }) {
  const social = useSocialRules();
  const rule = social.find((r) => r.id === socialId);
  const [proof, setProof] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  if (!rule) return null;

  const submit = () => {
    const res = submitSocialClaim({ userId, socialId, proof });
    if (!res.ok) { setError(res.reason ?? "Could not submit"); return; }
    setDone(true);
  };

  return (
    <ModalShell title={done ? "Submitted!" : `Claim ${rule.reward} RR`} onClose={onClose}>
      {done ? (
        <Success
          text="We'll verify your follow within 24 hours and credit your wallet automatically."
          onClose={onClose}
        />
      ) : (
        <div className="space-y-3 text-sm">
          <div className="rounded-xl bg-white/[0.04] p-3 ring-1 ring-white/10">
            <div className="text-[11px] uppercase text-muted-foreground">Step 1 — Follow our channel</div>
            <a
              href={rule.url} target="_blank" rel="noreferrer"
              className="mt-1 inline-flex items-center gap-1.5 text-sm font-bold text-fuchsia-300 hover:underline"
            >
              {rule.handle} <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
          <div>
            <label className="text-[11px] uppercase text-muted-foreground">
              Step 2 — Your {rule.verification === "email" ? "email" : "handle / username"}
            </label>
            <input
              value={proof}
              onChange={(e) => { setProof(e.target.value); setError(null); }}
              placeholder={rule.verification === "email" ? "you@example.com" : "@yourhandle"}
              className="input mt-1"
            />
            <p className="mt-1 text-[10px] text-muted-foreground">
              We check your account followed/subscribed to <b>{rule.handle}</b> before crediting RR. Cheating disqualifies your wallet.
            </p>
          </div>
          {error && <div className="rounded-lg bg-rose-500/10 px-3 py-2 text-[11px] text-rose-300 ring-1 ring-rose-400/30">{error}</div>}
          <button
            onClick={submit}
            disabled={!proof.trim()}
            className="w-full rounded-xl bg-gradient-to-r from-fuchsia-500 to-violet-600 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            Submit for verification
          </button>
          <style>{`.input{width:100%;border-radius:12px;border:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.04);padding:10px 12px;font-size:14px;color:white;outline:none}`}</style>
        </div>
      )}
    </ModalShell>
  );
}
