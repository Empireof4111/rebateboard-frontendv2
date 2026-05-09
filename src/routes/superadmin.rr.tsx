import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Sparkles, RotateCcw, Plus, Trash2, GraduationCap, BookOpen, Star, UserPlus, Flag,
  Instagram, Youtube, Send, MessageCircle, Mail, Coins, ShieldCheck, Check, X,
  TrendingUp, Users, Gift, Activity, ExternalLink, Music2, Flame,
} from "lucide-react";
import { PageHeader, Panel, StatCard, DataTable, Pill } from "@/components/superadmin/AdminUI";
import { walletLedger } from "@/lib/admin-data";
import {
  useRrRules, updateRrRule, resetRrRules, type RrActionId,
  useSocialRules, updateSocialRule, resetSocialRules, type RrSocialId,
  useSpendRules, updateSpendRule, addSpendRule, removeSpendRule, resetSpendRules,
  useClaims, reviewClaim,
  useRrAnalytics,
  useStreakConfig, updateStreakConfig, updateStreakMilestone, addStreakMilestone, removeStreakMilestone, resetStreakConfig,
  useTiers, updateTier, resetTiers,
  useCaps, updateCaps, resetCaps,
} from "@/lib/rr-rewards";

export const Route = createFileRoute("/superadmin/rr")({
  head: () => ({
    meta: [
      { title: "RR Control Center — Superadmin" },
      { name: "description", content: "Single control room for the entire RebateRewards economy: earn, social tasks, spend, ledger and analytics." },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: RrControlCenter,
});

type Tab = "overview" | "earn" | "tiers" | "caps" | "social" | "streaks" | "spend" | "claims" | "ledger";

function RrControlCenter() {
  const [tab, setTab] = useState<Tab>("overview");
  const a = useRrAnalytics();

  return (
    <div>
      <PageHeader
        title="RR Control Center"
        subtitle="One place to manage everything related to RebateRewards — earn, tiers, caps, spend, social tasks, claims, ledger and analytics."
      />

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-5">
        <StatCard label="RR circulating" value={fmt(a.circulating)} delta="user wallet" tone="up" />
        <StatCard label="Earned (lifetime)" value={fmt(a.earnedTotal)} delta="+8% MoM" tone="up" />
        <StatCard label="Redeemed" value={fmt(a.redeemedTotal)} delta="+5% MoM" tone="up" />
        <StatCard label="Social offered/user" value={`${a.socialRewardsOffered} RR`} delta={`${a.socialRulesActive} active`} tone="flat" />
        <StatCard label="Streak rewards/user" value={`${a.streakRewardsOffered} RR`} delta={`${a.streakActiveUsers} active · max ${a.streakLongestActive}d`} tone="up" />
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {(["overview","earn","tiers","caps","social","streaks","spend","claims","ledger"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize ring-1 transition ${
              tab === t
                ? "bg-gradient-to-r from-fuchsia-500 to-violet-600 text-white ring-fuchsia-400/40"
                : "bg-white/5 text-muted-foreground ring-white/10 hover:text-white"
            }`}
          >
            {t === "claims" ? `Claims${a.pendingClaims ? ` (${a.pendingClaims})` : ""}` : t}
          </button>
        ))}
      </div>

      {tab === "overview" && <OverviewPanel />}
      {tab === "earn" && <EarnRulesPanel />}
      {tab === "tiers" && <TiersPanel />}
      {tab === "caps" && <CapsPanel />}
      {tab === "social" && <SocialRulesPanel />}
      {tab === "streaks" && <StreaksPanel />}
      {tab === "spend" && <SpendRulesPanel />}
      {tab === "claims" && <ClaimsPanel />}
      {tab === "ledger" && <LedgerPanel />}
    </div>
  );
}

const fmt = (n: number) => n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n);

/* ============================================================ Overview */

function OverviewPanel() {
  const a = useRrAnalytics();
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Panel title="Economy snapshot">
        <div className="grid grid-cols-2 gap-3">
          <Mini icon={Activity} label="Active earn rules" value={String(a.earnRulesActive)} />
          <Mini icon={Sparkles} label="Active social tasks" value={String(a.socialRulesActive)} />
          <Mini icon={Coins} label="Active spend rules" value={String(a.spendRulesActive)} />
          <Mini icon={Users} label="Unique claimers" value={String(a.uniqueClaimers)} />
          <Mini icon={Gift} label="Approved claims" value={String(a.approvedClaims)} />
          <Mini icon={ShieldCheck} label="Pending review" value={String(a.pendingClaims)} tone={a.pendingClaims ? "warn" : undefined} />
        </div>
      </Panel>

      <Panel title="How it works">
        <ol className="space-y-2 text-sm text-white/85">
          <li><b className="text-fuchsia-300">Earn</b> — recurring actions (trade log, review, course) auto-credit RR using rates you set.</li>
          <li><b className="text-fuchsia-300">Social tasks</b> — one-time follow / subscribe rewards. Users submit handle/email; you approve in Claims.</li>
          <li><b className="text-fuchsia-300">Spend</b> — what RR can be redeemed for and at what cost.</li>
          <li><b className="text-fuchsia-300">Ledger</b> — every credit/debit traced back to a user.</li>
          <li><b className="text-fuchsia-300">Analytics</b> — circulating supply, earned vs redeemed, conversion rates.</li>
        </ol>
      </Panel>
    </div>
  );
}

function Mini({ icon: Icon, label, value, tone }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; tone?: "warn" }) {
  return (
    <div className={`flex items-center gap-3 rounded-2xl bg-white/[0.04] p-3 ring-1 ${tone === "warn" ? "ring-amber-400/30" : "ring-white/10"}`}>
      <div className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-fuchsia-500/30 to-violet-600/30 ring-1 ring-white/10">
        <Icon className="h-4 w-4 text-white" />
      </div>
      <div>
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className="text-lg font-bold text-white">{value}</div>
      </div>
    </div>
  );
}

/* ============================================================ Earn */

const EARN_ICONS: Record<RrActionId, React.ComponentType<{ className?: string }>> = {
  academy_course_complete: GraduationCap,
  trade_log: BookOpen,
  review_submit: Star,
  referral_kyc: UserPlus,
  complaint_evidence: Flag,
};

function EarnRulesPanel() {
  const rules = useRrRules();
  return (
    <Panel
      title="Earn rules — recurring auto-credit"
      action={
        <button
          onClick={() => { if (confirm("Reset all earn rules to defaults?")) resetRrRules(); }}
          className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-[10px] font-bold text-white ring-1 ring-white/10 hover:bg-white/15"
        >
          <RotateCcw className="h-3 w-3" /> Reset defaults
        </button>
      }
    >
      <Note>
        When a user triggers an action below, the matching tier amount is automatically credited to their RR wallet
        and logged in the ledger. Toggle off to disable an action entirely. Premium users earn the higher tier.
      </Note>

      <div className="grid gap-3">
        {rules.map((r) => {
          const Icon = EARN_ICONS[r.id] ?? Sparkles;
          return (
            <div
              key={r.id}
              className={`grid gap-3 rounded-2xl bg-white/[0.03] p-4 ring-1 transition md:grid-cols-[1fr_auto_auto_auto] md:items-center ${
                r.enabled ? "ring-white/10" : "opacity-60 ring-white/5"
              }`}
            >
              <RuleHead Icon={Icon} title={r.label} sub={r.description} id={r.id} />
              <Tier label="Free" tone="emerald" value={r.free} disabled={!r.enabled} onChange={(v) => updateRrRule(r.id, { free: v })} />
              <Tier label="Premium" tone="amber" value={r.premium} disabled={!r.enabled} onChange={(v) => updateRrRule(r.id, { premium: v })} />
              <Toggle label={r.label} active={r.enabled} onChange={(v) => updateRrRule(r.id, { enabled: v })} />
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

/* ============================================================ Social */

const SOCIAL_ICONS: Record<RrSocialId, React.ComponentType<{ className?: string }>> = {
  follow_instagram: Instagram,
  follow_twitter: Sparkles,
  subscribe_youtube: Youtube,
  follow_tiktok: Music2,
  join_telegram: Send,
  join_discord: MessageCircle,
  subscribe_newsletter: Mail,
};

function SocialRulesPanel() {
  const rules = useSocialRules();
  return (
    <Panel
      title="Social tasks — one-time rewards per user"
      action={
        <button
          onClick={() => { if (confirm("Reset all social rules to defaults?")) resetSocialRules(); }}
          className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-[10px] font-bold text-white ring-1 ring-white/10 hover:bg-white/15"
        >
          <RotateCcw className="h-3 w-3" /> Reset defaults
        </button>
      }
    >
      <Note>
        These reward users <b>once per account</b> when they follow / subscribe to our channels. Users submit their
        handle (or email for newsletter) — you approve in the <b>Claims</b> tab. Approved claims auto-credit RR.
      </Note>

      <div className="grid gap-3">
        {rules.map((r) => {
          const Icon = SOCIAL_ICONS[r.id] ?? Sparkles;
          return (
            <div
              key={r.id}
              className={`grid gap-3 rounded-2xl bg-white/[0.03] p-4 ring-1 md:grid-cols-[1fr_auto_auto_auto] md:items-center ${
                r.enabled ? "ring-white/10" : "opacity-60 ring-white/5"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-fuchsia-500/30 to-violet-600/30 ring-1 ring-white/10">
                  <Icon className="h-4 w-4 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-bold text-white">{r.label}</div>
                  <div className="text-[11px] text-muted-foreground">{r.description}</div>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    <LabeledInput label="Official handle" value={r.handle} onChange={(v) => updateSocialRule(r.id, { handle: v })} />
                    <LabeledInput label="URL" value={r.url} onChange={(v) => updateSocialRule(r.id, { url: v })} />
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-center gap-1">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Reward (one-time)</span>
                <div className="flex items-center rounded-lg bg-black/30 ring-1 ring-fuchsia-400/30 text-fuchsia-200">
                  <input
                    type="number" min={0}
                    value={r.reward}
                    disabled={!r.enabled}
                    onChange={(e) => updateSocialRule(r.id, { reward: Math.max(0, Number(e.target.value) || 0) })}
                    className="w-16 bg-transparent px-2 py-1.5 text-center font-mono text-sm font-bold outline-none disabled:cursor-not-allowed"
                  />
                  <span className="pr-2 text-[10px] font-bold opacity-70">RR</span>
                </div>
              </div>

              <div className="flex flex-col items-center gap-1">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Verify by</span>
                <select
                  value={r.verification}
                  disabled={!r.enabled}
                  onChange={(e) => updateSocialRule(r.id, { verification: e.target.value as "handle" | "email" | "manual" })}
                  className="rounded-lg bg-black/30 px-2 py-1.5 text-xs font-semibold text-white ring-1 ring-white/10 outline-none"
                >
                  <option value="handle">Handle</option>
                  <option value="email">Email</option>
                  <option value="manual">Manual</option>
                </select>
              </div>

              <Toggle label={r.label} active={r.enabled} onChange={(v) => updateSocialRule(r.id, { enabled: v })} />
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

/* ============================================================ Spend */

function SpendRulesPanel() {
  const rules = useSpendRules();
  const [showNew, setShowNew] = useState(false);
  return (
    <Panel
      title="Spend rules — what RR can be redeemed for"
      action={
        <div className="flex items-center gap-2">
          <button
            onClick={() => { if (confirm("Reset all spend rules to defaults?")) resetSpendRules(); }}
            className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-[10px] font-bold text-white ring-1 ring-white/10 hover:bg-white/15"
          >
            <RotateCcw className="h-3 w-3" /> Reset
          </button>
          <button
            onClick={() => setShowNew(true)}
            className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-600 px-3 py-1 text-[10px] font-bold text-white"
          >
            <Plus className="h-3 w-3" /> New rule
          </button>
        </div>
      }
    >
      {showNew && <NewSpendForm onDone={() => setShowNew(false)} />}

      <DataTable head={<><th>Reward</th><th>Category</th><th>Cost (RR)</th><th>Tier gate</th><th>Stock</th><th>Status</th><th></th></>}>
        {rules.map((r) => (
          <tr key={r.id}>
            <td>
              <input
                value={r.label}
                onChange={(e) => updateSpendRule(r.id, { label: e.target.value })}
                className="w-full rounded-md bg-transparent px-2 py-1 text-sm font-semibold text-white outline-none ring-1 ring-transparent focus:bg-white/5 focus:ring-white/10"
              />
              <input
                value={r.description}
                onChange={(e) => updateSpendRule(r.id, { description: e.target.value })}
                className="mt-1 w-full rounded-md bg-transparent px-2 py-1 text-[11px] text-muted-foreground outline-none ring-1 ring-transparent focus:bg-white/5 focus:ring-white/10"
              />
            </td>
            <td>
              <select
                value={r.category}
                onChange={(e) => updateSpendRule(r.id, { category: e.target.value as typeof r.category })}
                className="rounded-md bg-black/30 px-2 py-1 text-xs text-white ring-1 ring-white/10 outline-none"
              >
                {(["cash","discount","fees","academy","boost","partner","badge","raffle","other"] as const).map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </td>
            <td>
              <input
                type="number" min={0}
                value={r.cost}
                onChange={(e) => updateSpendRule(r.id, { cost: Math.max(0, Number(e.target.value) || 0) })}
                className="w-24 rounded-md bg-black/30 px-2 py-1 text-right font-mono text-sm font-bold text-rose-300 ring-1 ring-rose-400/30 outline-none"
              />
            </td>
            <td>
              <input
                type="number" min={0} max={4}
                value={r.tierGate ?? 0}
                onChange={(e) => updateSpendRule(r.id, { tierGate: Math.max(0, Math.min(4, Number(e.target.value) || 0)) })}
                className="w-16 rounded-md bg-black/30 px-2 py-1 text-right font-mono text-xs font-bold text-fuchsia-200 ring-1 ring-fuchsia-400/30 outline-none"
              />
            </td>
            <td>
              <input
                type="number" min={0}
                value={r.stock ?? 0}
                onChange={(e) => updateSpendRule(r.id, { stock: Number(e.target.value) > 0 ? Number(e.target.value) : undefined })}
                placeholder="∞"
                className="w-20 rounded-md bg-black/30 px-2 py-1 text-right font-mono text-xs font-bold text-amber-200 ring-1 ring-amber-400/30 outline-none"
              />
              {r.stock !== undefined && (
                <div className="mt-0.5 text-[9px] text-muted-foreground">{r.redeemed ?? 0}/{r.stock}</div>
              )}
            </td>
            <td>
              {r.enabled ? <Pill tone="good">enabled</Pill> : <Pill tone="neutral">disabled</Pill>}
            </td>
            <td className="text-right">
              <div className="inline-flex items-center gap-1">
                <button
                  onClick={() => updateSpendRule(r.id, { enabled: !r.enabled })}
                  className="rounded-md bg-white/10 px-2 py-1 text-[10px] font-bold text-white"
                >
                  {r.enabled ? "Disable" : "Enable"}
                </button>
                <button
                  onClick={() => { if (confirm(`Remove "${r.label}"?`)) removeSpendRule(r.id); }}
                  className="grid h-7 w-7 place-items-center rounded-md bg-white/10 text-rose-300 hover:bg-rose-500/20"
                  aria-label="Remove"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </td>
          </tr>
        ))}
      </DataTable>
    </Panel>
  );
}

function NewSpendForm({ onDone }: { onDone: () => void }) {
  const [label, setLabel] = useState("");
  const [description, setDescription] = useState("");
  const [cost, setCost] = useState(100);
  const [category, setCategory] = useState<"cash" | "discount" | "fees" | "academy" | "boost" | "partner" | "badge" | "raffle" | "other">("other");
  return (
    <div className="mb-3 grid gap-2 rounded-2xl bg-white/[0.04] p-3 ring-1 ring-white/10 md:grid-cols-[2fr_2fr_1fr_1fr_auto]">
      <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Reward title" className="rounded-md bg-black/30 px-2 py-1.5 text-sm text-white ring-1 ring-white/10 outline-none" />
      <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Short description" className="rounded-md bg-black/30 px-2 py-1.5 text-sm text-white ring-1 ring-white/10 outline-none" />
      <select value={category} onChange={(e) => setCategory(e.target.value as typeof category)} className="rounded-md bg-black/30 px-2 py-1.5 text-sm text-white ring-1 ring-white/10 outline-none">
        {(["cash","discount","fees","academy","boost","partner","badge","raffle","other"] as const).map((c) => <option key={c} value={c}>{c}</option>)}
      </select>
      <input type="number" min={0} value={cost} onChange={(e) => setCost(Math.max(0, Number(e.target.value) || 0))} className="rounded-md bg-black/30 px-2 py-1.5 text-right font-mono text-sm text-white ring-1 ring-white/10 outline-none" />
      <div className="flex gap-2">
        <button
          onClick={() => { if (!label.trim()) return; addSpendRule({ label, description, cost, category, enabled: true }); onDone(); }}
          className="rounded-md bg-gradient-to-r from-fuchsia-500 to-violet-600 px-3 py-1.5 text-xs font-bold text-white"
        >Add</button>
        <button onClick={onDone} className="rounded-md bg-white/10 px-3 py-1.5 text-xs font-bold text-white">Cancel</button>
      </div>
    </div>
  );
}

/* ============================================================ Claims */

function ClaimsPanel() {
  const claims = useClaims();
  const social = useSocialRules();
  const [filter, setFilter] = useState<"pending" | "approved" | "rejected" | "all">("pending");
  const list = useMemo(() => filter === "all" ? claims : claims.filter((c) => c.status === filter), [claims, filter]);

  return (
    <Panel
      title="Social claims — verify follows / subscribes"
      action={
        <div className="flex gap-1">
          {(["pending","approved","rejected","all"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`rounded-full px-2.5 py-1 text-[10px] font-bold capitalize ${filter === f ? "bg-white/15 text-white" : "bg-white/5 text-muted-foreground hover:text-white"}`}>{f}</button>
          ))}
        </div>
      }
    >
      {list.length === 0 ? (
        <div className="rounded-2xl bg-white/[0.03] p-6 text-center text-sm text-muted-foreground ring-1 ring-white/10">
          No {filter === "all" ? "" : filter} claims yet. Users submit claims from <b>Dashboard → Rewards → Follow & earn</b>.
        </div>
      ) : (
        <DataTable head={<><th>Action</th><th>User</th><th>Proof</th><th>Amount</th><th>Status</th><th>Submitted</th><th></th></>}>
          {list.map((c) => {
            const rule = social.find((s) => s.id === c.socialId);
            const Icon = SOCIAL_ICONS[c.socialId] ?? Sparkles;
            return (
              <tr key={c.id}>
                <td>
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-fuchsia-300" />
                    <span className="font-semibold text-white">{rule?.label ?? c.socialId}</span>
                  </div>
                </td>
                <td className="font-mono text-xs">{c.userId}</td>
                <td>
                  <span className="font-mono text-xs text-white/85">{c.proof}</span>
                  {rule?.url && <a href={rule.url} target="_blank" rel="noreferrer" className="ml-2 inline-flex items-center text-[10px] text-fuchsia-300"><ExternalLink className="h-3 w-3" /></a>}
                </td>
                <td className="font-mono font-bold text-emerald-300">+{c.amount} RR</td>
                <td>
                  {c.status === "pending" && <Pill tone="warn">pending</Pill>}
                  {c.status === "approved" && <Pill tone="good">approved</Pill>}
                  {c.status === "rejected" && <Pill tone="bad">rejected</Pill>}
                </td>
                <td className="text-xs text-muted-foreground">{new Date(c.submittedAt).toLocaleString()}</td>
                <td className="text-right">
                  {c.status === "pending" && (
                    <div className="inline-flex gap-1">
                      <button onClick={() => reviewClaim(c.id, "approved")} className="inline-flex items-center gap-1 rounded-md bg-emerald-500/20 px-2 py-1 text-[10px] font-bold text-emerald-300 ring-1 ring-emerald-400/30">
                        <Check className="h-3 w-3" /> Approve
                      </button>
                      <button onClick={() => reviewClaim(c.id, "rejected")} className="inline-flex items-center gap-1 rounded-md bg-rose-500/20 px-2 py-1 text-[10px] font-bold text-rose-300 ring-1 ring-rose-400/30">
                        <X className="h-3 w-3" /> Reject
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </DataTable>
      )}
    </Panel>
  );
}

/* ============================================================ Ledger */

function LedgerPanel() {
  return (
    <div className="grid gap-4">
      <Panel title="RR ledger (latest)">
        <DataTable head={<><th>TX</th><th>User</th><th>Type</th><th>Amount</th><th>Balance</th><th>Time</th></>}>
          {walletLedger.map((t) => (
            <tr key={t.id}>
              <td className="font-mono text-xs text-muted-foreground">{t.id}</td>
              <td className="font-mono">{t.user}</td>
              <td>{t.type}</td>
              <td className={`font-mono font-bold ${t.amount.startsWith("+") ? "text-emerald-300" : "text-rose-300"}`}>{t.amount}</td>
              <td className="font-mono">{t.balance}</td>
              <td className="text-xs text-muted-foreground">{t.time}</td>
            </tr>
          ))}
        </DataTable>
      </Panel>

      <Panel title="Top RR balances">
        <DataTable head={<><th>User</th><th>Balance</th><th>Earned (lifetime)</th><th>Spent (lifetime)</th></>}>
          {[
            { u: "Aiden Park", b: "12,420 RR", e: "18,200 RR", s: "5,780 RR" },
            { u: "Liam O'Connor", b: "8,840 RR", e: "14,100 RR", s: "5,260 RR" },
            { u: "Marta Silva", b: "6,210 RR", e: "9,440 RR", s: "3,230 RR" },
            { u: "Yuki Tanaka", b: "4,820 RR", e: "7,120 RR", s: "2,300 RR" },
          ].map((r) => (
            <tr key={r.u}>
              <td className="font-semibold">{r.u}</td>
              <td className="font-mono text-fuchsia-300">{r.b}</td>
              <td className="font-mono text-emerald-300">{r.e}</td>
              <td className="font-mono text-rose-300">{r.s}</td>
            </tr>
          ))}
        </DataTable>
      </Panel>
    </div>
  );
}

/* ============================================================ Shared bits */

function Note({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-start gap-2 rounded-xl bg-fuchsia-500/10 px-3 py-2 text-[11px] text-fuchsia-100 ring-1 ring-fuchsia-400/20">
      <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-fuchsia-300" />
      <span>{children}</span>
    </div>
  );
}

function RuleHead({ Icon, title, sub, id }: { Icon: React.ComponentType<{ className?: string }>; title: string; sub: string; id: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-fuchsia-500/30 to-violet-600/30 ring-1 ring-white/10">
        <Icon className="h-4 w-4 text-white" />
      </div>
      <div>
        <div className="text-sm font-bold text-white">{title}</div>
        <div className="text-[11px] text-muted-foreground">{sub}</div>
        <div className="mt-1 font-mono text-[10px] text-white/40">{id}</div>
      </div>
    </div>
  );
}

function Tier({ label, tone, value, onChange, disabled }: { label: string; tone: "emerald" | "amber"; value: number; onChange: (v: number) => void; disabled?: boolean }) {
  const cls = tone === "emerald" ? "ring-emerald-400/30 text-emerald-300" : "ring-amber-400/30 text-amber-300";
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
      <div className={`flex items-center rounded-lg bg-black/30 ring-1 ${cls}`}>
        <input
          type="number" min={0}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0))}
          className="w-16 bg-transparent px-2 py-1.5 text-center font-mono text-sm font-bold outline-none disabled:cursor-not-allowed"
        />
        <span className="pr-2 text-[10px] font-bold opacity-70">RR</span>
      </div>
    </div>
  );
}

function Toggle({ label, active, onChange }: { label: string; active: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex flex-col items-center gap-1">
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Active</span>
      <button
        onClick={() => onChange(!active)}
        className={`relative h-6 w-11 rounded-full transition ${active ? "bg-emerald-500/80" : "bg-white/15"}`}
        aria-label={`Toggle ${label}`}
      >
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${active ? "translate-x-5" : "translate-x-0.5"}`} />
      </button>
    </label>
  );
}

function LabeledInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-0.5 w-full rounded-md bg-black/30 px-2 py-1 text-xs text-white ring-1 ring-white/10 outline-none focus:ring-fuchsia-400/40"
      />
    </label>
  );
}

/* ============================================================ Streaks */

function StreaksPanel() {
  const cfg = useStreakConfig();
  const a = useRrAnalytics();
  const [draft, setDraft] = useState({ days: 21, reward: 150, label: "" });

  return (
    <div className="space-y-4">
      <Panel
        title="Streak engine — daily activity rewards"
        action={
          <button
            onClick={() => { if (confirm("Reset streak settings to defaults?")) resetStreakConfig(); }}
            className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-[10px] font-bold text-white ring-1 ring-white/10 hover:bg-white/15"
          >
            <RotateCcw className="h-3 w-3" /> Reset defaults
          </button>
        }
      >
        <Note>
          A user's streak grows by 1 each day they perform the qualifying action. Miss a day → streak resets to 0.
          When the streak count exactly hits a milestone, the reward auto-credits to their RR wallet (once per user).
        </Note>

        <div className="mb-4 grid gap-3 md:grid-cols-3">
          <div className={`flex items-center justify-between rounded-2xl bg-white/[0.04] p-3 ring-1 ring-white/10`}>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Engine</div>
              <div className="text-sm font-bold text-white">{cfg.enabled ? "Live — auto-rewarding" : "Paused"}</div>
            </div>
            <Toggle label="Streak engine" active={cfg.enabled} onChange={(v) => updateStreakConfig({ enabled: v })} />
          </div>
          <label className="rounded-2xl bg-white/[0.04] p-3 ring-1 ring-white/10">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Qualifying action</div>
            <select
              value={cfg.qualifier}
              onChange={(e) => updateStreakConfig({ qualifier: e.target.value as typeof cfg.qualifier })}
              className="mt-1 w-full rounded-md bg-black/30 px-2 py-1.5 text-sm text-white ring-1 ring-white/10 outline-none"
            >
              <option value="any_activity">Any activity (login OR trade log)</option>
              <option value="login">Login only</option>
              <option value="trade_log">Log a trade</option>
            </select>
          </label>
          <label className="rounded-2xl bg-white/[0.04] p-3 ring-1 ring-white/10">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Grace window (hours after midnight)</div>
            <input
              type="number" min={0} max={23}
              value={cfg.graceHours}
              onChange={(e) => updateStreakConfig({ graceHours: Math.max(0, Math.min(23, Number(e.target.value) || 0)) })}
              className="mt-1 w-full rounded-md bg-black/30 px-2 py-1.5 text-sm text-white ring-1 ring-white/10 outline-none"
            />
          </label>
        </div>

        <DataTable head={<><th>Milestone</th><th>Days</th><th>Reward (RR)</th><th>Status</th><th></th></>}>
          {cfg.milestones.map((m) => (
            <tr key={m.id}>
              <td>
                <input
                  value={m.label}
                  onChange={(e) => updateStreakMilestone(m.id, { label: e.target.value })}
                  className="w-full rounded-md bg-transparent px-2 py-1 text-sm font-semibold text-white outline-none ring-1 ring-transparent focus:bg-white/5 focus:ring-white/10"
                />
              </td>
              <td>
                <input
                  type="number" min={1}
                  value={m.days}
                  onChange={(e) => updateStreakMilestone(m.id, { days: Math.max(1, Number(e.target.value) || 1) })}
                  className="w-20 rounded-md bg-black/30 px-2 py-1 text-right font-mono text-sm font-bold text-amber-200 ring-1 ring-amber-400/30 outline-none"
                />
              </td>
              <td>
                <input
                  type="number" min={0}
                  value={m.reward}
                  onChange={(e) => updateStreakMilestone(m.id, { reward: Math.max(0, Number(e.target.value) || 0) })}
                  className="w-24 rounded-md bg-black/30 px-2 py-1 text-right font-mono text-sm font-bold text-fuchsia-200 ring-1 ring-fuchsia-400/30 outline-none"
                />
              </td>
              <td>{m.enabled ? <Pill tone="good">enabled</Pill> : <Pill tone="neutral">disabled</Pill>}</td>
              <td className="text-right">
                <div className="inline-flex items-center gap-1">
                  <button
                    onClick={() => updateStreakMilestone(m.id, { enabled: !m.enabled })}
                    className="rounded-md bg-white/10 px-2 py-1 text-[10px] font-bold text-white"
                  >
                    {m.enabled ? "Disable" : "Enable"}
                  </button>
                  <button
                    onClick={() => { if (confirm(`Remove "${m.label}"?`)) removeStreakMilestone(m.id); }}
                    className="grid h-7 w-7 place-items-center rounded-md bg-white/10 text-rose-300 hover:bg-rose-500/20"
                    aria-label="Remove"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </DataTable>

        <div className="mt-3 flex flex-wrap items-end gap-2 rounded-2xl bg-white/[0.03] p-3 ring-1 ring-white/10">
          <label className="flex flex-col">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Days</span>
            <input type="number" min={1} value={draft.days} onChange={(e) => setDraft((d) => ({ ...d, days: Math.max(1, Number(e.target.value) || 1) }))}
              className="w-20 rounded-md bg-black/30 px-2 py-1.5 text-right font-mono text-sm text-white ring-1 ring-white/10 outline-none" />
          </label>
          <label className="flex flex-col">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Reward (RR)</span>
            <input type="number" min={0} value={draft.reward} onChange={(e) => setDraft((d) => ({ ...d, reward: Math.max(0, Number(e.target.value) || 0) }))}
              className="w-24 rounded-md bg-black/30 px-2 py-1.5 text-right font-mono text-sm text-white ring-1 ring-white/10 outline-none" />
          </label>
          <label className="flex flex-1 flex-col">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Label</span>
            <input value={draft.label} onChange={(e) => setDraft((d) => ({ ...d, label: e.target.value }))} placeholder="e.g. 21-day momentum"
              className="rounded-md bg-black/30 px-2 py-1.5 text-sm text-white ring-1 ring-white/10 outline-none" />
          </label>
          <button
            onClick={() => {
              if (!draft.label.trim()) return;
              addStreakMilestone({ days: draft.days, reward: draft.reward, label: draft.label, enabled: true });
              setDraft({ days: 21, reward: 150, label: "" });
            }}
            className="inline-flex items-center gap-1 rounded-md bg-gradient-to-r from-fuchsia-500 to-violet-600 px-3 py-1.5 text-xs font-bold text-white"
          >
            <Plus className="h-3 w-3" /> Add milestone
          </button>
        </div>
      </Panel>

      <Panel title="Live streak analytics">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Mini icon={Flame} label="Active streaks" value={String(a.streakActiveUsers)} />
          <Mini icon={TrendingUp} label="Longest active" value={`${a.streakLongestActive}d`} />
          <Mini icon={Sparkles} label="Milestones live" value={String(a.streakMilestonesActive)} />
          <Mini icon={Gift} label="RR offered/user" value={`${a.streakRewardsOffered} RR`} />
        </div>
      </Panel>
    </div>
  );
}

/* ============================================================ Tiers */

const TIER_ACTIONS: { id: RrActionId; label: string }[] = [
  { id: "trade_log", label: "Log trade" },
  { id: "review_submit", label: "Review" },
  { id: "referral_kyc", label: "Referral" },
  { id: "academy_course_complete", label: "Course" },
  { id: "complaint_evidence", label: "Complaint" },
];

function TiersPanel() {
  const tiers = useTiers();
  return (
    <Panel
      title="Contributor tiers — action-based progression"
      action={
        <button
          onClick={() => { if (confirm("Reset all tiers to defaults?")) resetTiers(); }}
          className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-[10px] font-bold text-white ring-1 ring-white/10 hover:bg-white/15"
        >
          <RotateCcw className="h-3 w-3" /> Reset defaults
        </button>
      }
    >
      <Note>
        Users automatically progress through tiers when they meet ALL requirements: <b>approved reviews</b>, <b>streak days</b>, and (optionally) <b>verified email</b>.
        Each tier applies an <b>earn multiplier</b> on top of base RR and unlocks a higher daily cap. Redemption items can also be tier-gated under <b>Spend</b>.
      </Note>

      <div className="grid gap-3">
        {tiers.map((t) => (
          <div key={t.id} className="rounded-2xl bg-white/[0.03] p-4 ring-1 ring-white/10">
            <div className="grid gap-3 md:grid-cols-[1fr_auto_auto_auto] md:items-center">
              <div className="flex items-start gap-3">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-fuchsia-500/30 to-violet-600/30 ring-1 ring-white/10 text-sm font-bold text-white">
                  {t.rank}
                </div>
                <div className="min-w-0 flex-1">
                  <input
                    value={t.name}
                    onChange={(e) => updateTier(t.id, { name: e.target.value })}
                    className="w-full rounded-md bg-transparent px-1 py-0.5 text-sm font-bold text-white outline-none ring-1 ring-transparent focus:bg-white/5 focus:ring-white/10"
                  />
                  <div className="font-mono text-[10px] text-white/40">{t.id} · rank {t.rank}</div>
                </div>
              </div>

              <NumField label="Multiplier" step={0.05} min={1} max={5} value={t.multiplier} onChange={(v) => updateTier(t.id, { multiplier: v })} suffix="×" />
              <NumField label="Daily cap" min={0} value={t.dailyCap} onChange={(v) => updateTier(t.id, { dailyCap: v })} suffix="RR" />
              <NumField label="Rank order" min={0} value={t.rank} onChange={(v) => updateTier(t.id, { rank: v })} />
            </div>

            <div className="mt-3 grid gap-2 md:grid-cols-3">
              <NumField label="Min approved reviews" min={0} value={t.requirements.approvedReviews} onChange={(v) => updateTier(t.id, { requirements: { ...t.requirements, approvedReviews: v } })} />
              <NumField label="Min streak (days)" min={0} value={t.requirements.streakDays} onChange={(v) => updateTier(t.id, { requirements: { ...t.requirements, streakDays: v } })} />
              <label className="flex items-end gap-2">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Verified email</span>
                <Toggle label="Verified email" active={t.requirements.verifiedEmail} onChange={(v) => updateTier(t.id, { requirements: { ...t.requirements, verifiedEmail: v } })} />
              </label>
            </div>

            <div className="mt-3">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Perks (one per line)</div>
              <textarea
                value={t.perks.join("\n")}
                onChange={(e) => updateTier(t.id, { perks: e.target.value.split("\n").map((s) => s.trim()).filter(Boolean) })}
                className="mt-1 w-full rounded-md bg-black/30 p-2 text-xs text-white ring-1 ring-white/10 outline-none focus:ring-fuchsia-400/40"
                rows={3}
              />
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function NumField({ label, value, onChange, min = 0, max, step = 1, suffix }: { label: string; value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number; suffix?: string }) {
  return (
    <label className="flex flex-col items-center gap-1">
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
      <div className="flex items-center rounded-lg bg-black/30 ring-1 ring-fuchsia-400/30 text-fuchsia-200">
        <input
          type="number" min={min} max={max} step={step}
          value={value}
          onChange={(e) => onChange(Math.max(min, max !== undefined ? Math.min(max, Number(e.target.value) || 0) : Number(e.target.value) || 0))}
          className="w-20 bg-transparent px-2 py-1.5 text-center font-mono text-sm font-bold outline-none"
        />
        {suffix && <span className="pr-2 text-[10px] font-bold opacity-70">{suffix}</span>}
      </div>
    </label>
  );
}

/* ============================================================ Caps */

function CapsPanel() {
  const caps = useCaps();
  return (
    <div className="space-y-4">
      <Panel
        title="Anti-abuse caps — global daily / weekly limits"
        action={
          <button
            onClick={() => { if (confirm("Reset caps to defaults?")) resetCaps(); }}
            className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-[10px] font-bold text-white ring-1 ring-white/10 hover:bg-white/15"
          >
            <RotateCcw className="h-3 w-3" /> Reset defaults
          </button>
        }
      >
        <Note>
          These caps apply to <b>every user</b>. A higher tier <b>dailyCap</b> overrides the global daily cap (only if larger). Set to <b>0</b> to disable a cap.
        </Note>

        <div className="grid gap-3 md:grid-cols-2">
          <NumField label="Global daily cap (RR/user)" min={0} value={caps.dailyCap} onChange={(v) => updateCaps({ dailyCap: v })} suffix="RR" />
          <NumField label="Global weekly cap (RR/user)" min={0} value={caps.weeklyCap} onChange={(v) => updateCaps({ weeklyCap: v })} suffix="RR" />
        </div>
      </Panel>

      <Panel title="Per-action cooldowns + daily limits">
        <Note>
          <b>Cooldown</b> = minimum seconds between two credits of the same action. <b>Daily limit</b> = max number of times an action can pay out per user per day. Set to <b>0</b> to disable.
        </Note>

        <DataTable head={<><th>Action</th><th>Cooldown (sec)</th><th>Daily limit</th></>}>
          {TIER_ACTIONS.map((a) => (
            <tr key={a.id}>
              <td className="font-semibold text-white">{a.label}<div className="font-mono text-[10px] text-white/40">{a.id}</div></td>
              <td>
                <input
                  type="number" min={0}
                  value={caps.cooldowns[a.id] ?? 0}
                  onChange={(e) => updateCaps({ cooldowns: { [a.id]: Math.max(0, Number(e.target.value) || 0) } })}
                  className="w-28 rounded-md bg-black/30 px-2 py-1 text-right font-mono text-sm font-bold text-amber-200 ring-1 ring-amber-400/30 outline-none"
                />
              </td>
              <td>
                <input
                  type="number" min={0}
                  value={caps.dailyActionLimit[a.id] ?? 0}
                  onChange={(e) => updateCaps({ dailyActionLimit: { [a.id]: Math.max(0, Number(e.target.value) || 0) } })}
                  className="w-24 rounded-md bg-black/30 px-2 py-1 text-right font-mono text-sm font-bold text-fuchsia-200 ring-1 ring-fuchsia-400/30 outline-none"
                />
              </td>
            </tr>
          ))}
        </DataTable>
      </Panel>
    </div>
  );
}
