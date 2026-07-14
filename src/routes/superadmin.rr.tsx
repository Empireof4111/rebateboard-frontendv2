import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  RotateCcw, Plus, Trash2, GraduationCap, BookOpen, Star, UserPlus, Flag,
  Instagram, Youtube, Send, MessageCircle, Mail, Coins, ShieldCheck, Check, X,
  TrendingUp, Users, Gift, Activity, ExternalLink, Music2, Flame, Save, RefreshCw,
} from "lucide-react";
import { PageHeader, Panel, StatCard, DataTable, Pill } from "@/components/superadmin/AdminUI";
import { toast } from "@/components/superadmin/AdminActions";
import {
  rrApi,
  type RrAllConfig, type RrRule, type RrTier, type RrCaps,
  type RrSocialRule, type RrStreakConfig, type RrSpendRule, type RrClaim, type RrStats,
} from "@/lib/rr-api";
import { useAuth } from "@/lib/auth";
import { ApiError } from "@/lib/api";

export const Route = createFileRoute("/superadmin/rr")({
  head: () => ({
    meta: [
      { title: "RR Control Center — Superadmin" },
      { name: "description", content: "Single control room for the entire RebateRewards economy." },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: RrControlCenter,
});

type Tab = "overview" | "earn" | "tiers" | "caps" | "social" | "streaks" | "spend" | "claims" | "ledger";

const DEFAULT_CONFIG: RrAllConfig = {
  earn_rules: [],
  tiers: [],
  caps: { dailyCap: 0, weeklyCap: 0, cooldowns: {}, dailyActionLimit: {} },
  social_rules: [],
  streak_config: { enabled: false, qualifier: "any_activity", graceHours: 2, milestones: [] },
  spend_rules: [],
};

function RrControlCenter() {
  const { token } = useAuth();
  const [config, setConfig] = useState<RrAllConfig>(DEFAULT_CONFIG);
  const [stats, setStats] = useState<RrStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("overview");

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [cfgRes, statsRes] = await Promise.allSettled([
        rrApi.getConfig(token),
        rrApi.getStats(token),
      ]);
      if (cfgRes.status === "fulfilled" && cfgRes.value.payload) setConfig(cfgRes.value.payload);
      if (statsRes.status === "fulfilled" && statsRes.value.payload) setStats(statsRes.value.payload);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Failed to load RR config");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const saveKey = useCallback(async (key: keyof RrAllConfig, value: unknown) => {
    if (!token) return;
    setSaving(key);
    try {
      const res = await rrApi.updateConfig(token, key, value);
      if (res.payload !== undefined) {
        setConfig((prev) => ({ ...prev, [key]: res.payload }));
        toast.success("Config saved");
      }
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Save failed");
    } finally {
      setSaving(null);
    }
  }, [token]);

  const resetKey = useCallback(async (key: keyof RrAllConfig) => {
    if (!token || !confirm(`Reset ${key} to defaults?`)) return;
    setSaving(key);
    try {
      const res = await rrApi.resetConfig(token, key);
      if (res.payload !== undefined) {
        setConfig((prev) => ({ ...prev, [key]: res.payload }));
        toast.success("Reset to defaults");
      }
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Reset failed");
    } finally {
      setSaving(null);
    }
  }, [token]);

  return (
    <div>
      <PageHeader
        title="RR Control Center"
        subtitle="One place to manage everything related to RebateRewards — earn, tiers, caps, spend, social tasks, claims, ledger and analytics."
        actions={
          <button onClick={load} className="grid h-7 w-7 place-items-center rounded-md bg-white/5 text-white ring-1 ring-white/10">
            <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
          </button>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-5">
        <StatCard label="RR circulating" value={fmt(stats?.totalRrCirculating ?? 0)} delta="user wallets" tone="up" />
        <StatCard label="Total claims" value={fmt(stats?.totalClaims ?? 0)} delta="all time" tone="up" />
        <StatCard label="Approved" value={fmt(stats?.approvedClaims ?? 0)} delta="credited" tone="up" />
        <StatCard label="Pending review" value={fmt(stats?.pendingClaims ?? 0)} delta={stats?.pendingClaims ? "action needed" : "clear"} tone={stats?.pendingClaims ? "down" : "up"} />
        <StatCard label="Users with RR" value={fmt(stats?.totalUsersWithRr ?? 0)} delta="active holders" tone="flat" />
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {(["overview", "earn", "tiers", "caps", "social", "streaks", "spend", "claims", "ledger"] as Tab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize ring-1 transition ${
              tab === t ? "rb-gradient-primary text-white ring-violet-400/40" : "bg-white/5 text-muted-foreground ring-white/10 hover:text-white"
            }`}
          >
            {t === "claims" && (stats?.pendingClaims ?? 0) > 0 ? `Claims (${stats!.pendingClaims})` : t}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-16 text-center text-sm text-muted-foreground">Loading RR config…</div>
      ) : (
        <>
          {tab === "overview" && <OverviewPanel stats={stats} config={config} />}
          {tab === "earn" && <EarnRulesPanel rules={config.earn_rules} saving={saving === "earn_rules"} onSave={(v) => saveKey("earn_rules", v)} onReset={() => resetKey("earn_rules")} />}
          {tab === "tiers" && <TiersPanel tiers={config.tiers} saving={saving === "tiers"} onSave={(v) => saveKey("tiers", v)} onReset={() => resetKey("tiers")} />}
          {tab === "caps" && <CapsPanel caps={config.caps} saving={saving === "caps"} onSave={(v) => saveKey("caps", v)} onReset={() => resetKey("caps")} />}
          {tab === "social" && <SocialRulesPanel rules={config.social_rules} saving={saving === "social_rules"} onSave={(v) => saveKey("social_rules", v)} onReset={() => resetKey("social_rules")} />}
          {tab === "streaks" && <StreaksPanel cfg={config.streak_config} stats={stats} saving={saving === "streak_config"} onSave={(v) => saveKey("streak_config", v)} onReset={() => resetKey("streak_config")} />}
          {tab === "spend" && <SpendRulesPanel rules={config.spend_rules} saving={saving === "spend_rules"} onSave={(v) => saveKey("spend_rules", v)} onReset={() => resetKey("spend_rules")} />}
          {tab === "claims" && <ClaimsPanel socialRules={config.social_rules} />}
          {tab === "ledger" && <LedgerPanel />}
        </>
      )}
    </div>
  );
}

const fmt = (n: number) => n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n);

/* ============================================================ Shared sub-components */

function Note({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-start gap-2 rounded-xl bg-violet-500/10 px-3 py-2 text-[11px] text-violet-100 ring-1 ring-violet-400/20">
      <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-violet-300" />
      <span>{children}</span>
    </div>
  );
}

function SaveBar({ onSave, onReset, saving }: { onSave: () => void; onReset: () => void; saving: boolean }) {
  return (
    <div className="mt-4 flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2">
      <button onClick={onReset} className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-[10px] font-bold text-white hover:bg-white/15">
        <RotateCcw className="h-3 w-3" /> Reset defaults
      </button>
      <button onClick={onSave} disabled={saving} className="inline-flex items-center gap-1.5 rounded-full rb-gradient-primary px-3 py-1.5 text-[10px] font-bold text-white disabled:opacity-40">
        <Save className="h-3 w-3" /> {saving ? "Saving…" : "Save changes"}
      </button>
    </div>
  );
}

function Toggle({ label, active, onChange }: { label: string; active: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex flex-col items-center gap-1">
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Active</span>
      <button onClick={() => onChange(!active)}
        className={`relative h-6 w-11 rounded-full transition ${active ? "bg-emerald-500/80" : "bg-white/15"}`}
        aria-label={`Toggle ${label}`}
      >
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${active ? "translate-x-5" : "translate-x-0.5"}`} />
      </button>
    </label>
  );
}

function NumField({ label, value, onChange, min = 0, max, step = 1, suffix }: { label: string; value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number; suffix?: string }) {
  return (
    <label className="flex flex-col items-center gap-1">
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
      <div className="flex items-center rounded-lg bg-black/30 ring-1 ring-violet-400/30 text-violet-200">
        <input type="number" min={min} max={max} step={step} value={value}
          onChange={(e) => onChange(Math.max(min, max !== undefined ? Math.min(max, Number(e.target.value) || 0) : Number(e.target.value) || 0))}
          className="w-20 bg-transparent px-2 py-1.5 text-center font-mono text-sm font-bold outline-none" />
        {suffix && <span className="pr-2 text-[10px] font-bold opacity-70">{suffix}</span>}
      </div>
    </label>
  );
}

function LabeledInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)}
        className="mt-0.5 w-full rounded-md bg-black/30 px-2 py-1 text-xs text-white ring-1 ring-white/10 outline-none focus:ring-violet-400/40" />
    </label>
  );
}

function Mini({ icon: Icon, label, value, tone }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; tone?: "warn" }) {
  return (
    <div className={`flex items-center gap-3 rounded-2xl bg-white/[0.04] p-3 ring-1 ${tone === "warn" ? "ring-amber-400/30" : "ring-white/10"}`}>
      <div className="grid h-9 w-9 place-items-center rounded-lg bg-[rgba(126,77,255,0.18)] ring-1 ring-white/10">
        <Icon className="h-4 w-4 text-white" />
      </div>
      <div>
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className="text-lg font-bold text-white">{value}</div>
      </div>
    </div>
  );
}

/* ============================================================ Overview */

function OverviewPanel({ stats, config }: { stats: RrStats | null; config: RrAllConfig }) {
  const earnActive = config.earn_rules.filter((r) => r.enabled).length;
  const socialActive = config.social_rules.filter((r) => r.enabled).length;
  const spendActive = config.spend_rules.filter((r) => r.enabled).length;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Panel title="Economy snapshot">
        <div className="grid grid-cols-2 gap-3">
          <Mini icon={Activity} label="Active earn rules" value={String(earnActive)} />
          <Mini icon={Users} label="Active social tasks" value={String(socialActive)} />
          <Mini icon={Coins} label="Active spend rules" value={String(spendActive)} />
          <Mini icon={Users} label="Users holding RR" value={String(stats?.totalUsersWithRr ?? 0)} />
          <Mini icon={Gift} label="Approved claims" value={String(stats?.approvedClaims ?? 0)} />
          <Mini icon={ShieldCheck} label="Pending review" value={String(stats?.pendingClaims ?? 0)} tone={(stats?.pendingClaims ?? 0) > 0 ? "warn" : undefined} />
        </div>
      </Panel>

      <Panel title="How it works">
        <ol className="space-y-2 text-sm text-white/85">
          <li><b className="text-violet-300">Earn</b> — recurring actions (trade log, review, course) auto-credit RR using rates you set.</li>
          <li><b className="text-violet-300">Social tasks</b> — one-time follow/subscribe rewards. Users submit handle/email; you approve in Claims.</li>
          <li><b className="text-violet-300">Spend</b> — what RR can be redeemed for and at what cost.</li>
          <li><b className="text-violet-300">Ledger</b> — every credit/debit traced back to a user.</li>
          <li><b className="text-violet-300">Analytics</b> — circulating supply, earned vs redeemed, conversion rates.</li>
        </ol>
      </Panel>
    </div>
  );
}

/* ============================================================ Earn Rules */

const EARN_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  academy_course_complete: GraduationCap,
  trade_log: BookOpen,
  review_submit: Star,
  referral_kyc: UserPlus,
  complaint_evidence: Flag,
};

function EarnRulesPanel({ rules, saving, onSave, onReset }: { rules: RrRule[]; saving: boolean; onSave: (v: RrRule[]) => void; onReset: () => void }) {
  const [draft, setDraft] = useState<RrRule[]>(rules);
  useEffect(() => setDraft(rules), [rules]);

  const update = (id: string, patch: Partial<RrRule>) =>
    setDraft((prev) => prev.map((r) => r.id === id ? { ...r, ...patch } : r));

  return (
    <Panel title="Earn rules — recurring auto-credit">
      <Note>
        When a user triggers an action below, the matching tier amount is automatically credited to their RR wallet.
        Toggle off to disable an action entirely. Premium users earn the higher tier.
      </Note>

      <div className="grid gap-3">
        {draft.map((r) => {
          const Icon = EARN_ICONS[r.id] ?? Activity;
          return (
            <div key={r.id}
              className={`grid gap-3 rounded-2xl bg-white/[0.03] p-4 ring-1 transition md:grid-cols-[1fr_auto_auto_auto] md:items-center ${r.enabled ? "ring-white/10" : "opacity-60 ring-white/5"}`}
            >
              <div className="flex items-start gap-3">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[rgba(126,77,255,0.18)] ring-1 ring-white/10">
                  <Icon className="h-4 w-4 text-white" />
                </div>
                <div>
                  <div className="text-sm font-bold text-white">{r.label}</div>
                  <div className="text-[11px] text-muted-foreground">{r.description}</div>
                  <div className="mt-1 font-mono text-[10px] text-white/40">{r.id}</div>
                </div>
              </div>
              <TierInput label="Free" tone="emerald" value={r.freeAmount} disabled={!r.enabled} onChange={(v) => update(r.id, { freeAmount: v })} />
              <TierInput label="Premium" tone="amber" value={r.premiumAmount} disabled={!r.enabled} onChange={(v) => update(r.id, { premiumAmount: v })} />
              <Toggle label={r.label} active={r.enabled} onChange={(v) => update(r.id, { enabled: v })} />
            </div>
          );
        })}
      </div>

      <SaveBar onSave={() => onSave(draft)} onReset={onReset} saving={saving} />
    </Panel>
  );
}

function TierInput({ label, tone, value, onChange, disabled }: { label: string; tone: "emerald" | "amber"; value: number; onChange: (v: number) => void; disabled?: boolean }) {
  const cls = tone === "emerald" ? "ring-emerald-400/30 text-emerald-300" : "ring-amber-400/30 text-amber-300";
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
      <div className={`flex items-center rounded-lg bg-black/30 ring-1 ${cls}`}>
        <input type="number" min={0} value={value} disabled={disabled}
          onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0))}
          className="w-16 bg-transparent px-2 py-1.5 text-center font-mono text-sm font-bold outline-none disabled:cursor-not-allowed" />
        <span className="pr-2 text-[10px] font-bold opacity-70">RR</span>
      </div>
    </div>
  );
}

/* ============================================================ Tiers */

function TiersPanel({ tiers, saving, onSave, onReset }: { tiers: RrTier[]; saving: boolean; onSave: (v: RrTier[]) => void; onReset: () => void }) {
  const [draft, setDraft] = useState<RrTier[]>(tiers);
  useEffect(() => setDraft(tiers), [tiers]);

  const update = (id: string, patch: Partial<RrTier>) =>
    setDraft((prev) => prev.map((t) => t.id === id ? { ...t, ...patch } : t));

  return (
    <Panel title="Contributor tiers — action-based progression">
      <Note>
        Users automatically progress through tiers when they meet ALL requirements: <b>approved reviews</b>, <b>streak days</b>, and (optionally) <b>verified email</b>.
        Each tier applies an <b>earn multiplier</b> on top of base RR and unlocks a higher daily cap.
      </Note>

      <div className="grid gap-3">
        {draft.map((t) => (
          <div key={t.id} className="rounded-2xl bg-white/[0.03] p-4 ring-1 ring-white/10">
            <div className="grid gap-3 md:grid-cols-[1fr_auto_auto_auto] md:items-center">
              <div className="flex items-start gap-3">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[rgba(126,77,255,0.18)] ring-1 ring-white/10 text-sm font-bold text-white">
                  {t.rank}
                </div>
                <div className="min-w-0 flex-1">
                  <input value={t.name} onChange={(e) => update(t.id, { name: e.target.value })}
                    className="w-full rounded-md bg-transparent px-1 py-0.5 text-sm font-bold text-white outline-none ring-1 ring-transparent focus:bg-white/5 focus:ring-white/10" />
                  <div className="font-mono text-[10px] text-white/40">{t.id} · rank {t.rank}</div>
                </div>
              </div>
              <NumField label="Multiplier" step={0.05} min={1} max={5} value={t.multiplier} onChange={(v) => update(t.id, { multiplier: v })} suffix="×" />
              <NumField label="Daily cap" min={0} value={t.dailyCap} onChange={(v) => update(t.id, { dailyCap: v })} suffix="RR" />
              <NumField label="Rank order" min={0} value={t.rank} onChange={(v) => update(t.id, { rank: v })} />
            </div>

            <div className="mt-3 grid gap-2 md:grid-cols-3">
              <NumField label="Min approved reviews" min={0} value={t.requirements.approvedReviews} onChange={(v) => update(t.id, { requirements: { ...t.requirements, approvedReviews: v } })} />
              <NumField label="Min streak (days)" min={0} value={t.requirements.streakDays} onChange={(v) => update(t.id, { requirements: { ...t.requirements, streakDays: v } })} />
              <label className="flex items-end gap-2">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Verified email</span>
                <Toggle label="Verified email" active={t.requirements.verifiedEmail} onChange={(v) => update(t.id, { requirements: { ...t.requirements, verifiedEmail: v } })} />
              </label>
            </div>

            <div className="mt-3">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Perks (one per line)</div>
              <textarea value={t.perks.join("\n")} onChange={(e) => update(t.id, { perks: e.target.value.split("\n").map((s) => s.trim()).filter(Boolean) })}
                className="mt-1 w-full rounded-md bg-black/30 p-2 text-xs text-white ring-1 ring-white/10 outline-none focus:ring-violet-400/40" rows={3} />
            </div>
          </div>
        ))}
      </div>

      <SaveBar onSave={() => onSave(draft)} onReset={onReset} saving={saving} />
    </Panel>
  );
}

/* ============================================================ Caps */

const CAP_ACTIONS = ["trade_log", "review_submit", "referral_kyc", "academy_course_complete", "complaint_evidence"];

function CapsPanel({ caps, saving, onSave, onReset }: { caps: RrCaps; saving: boolean; onSave: (v: RrCaps) => void; onReset: () => void }) {
  const [draft, setDraft] = useState<RrCaps>(caps);
  useEffect(() => setDraft(caps), [caps]);

  return (
    <div className="space-y-4">
      <Panel title="Anti-abuse caps — global daily / weekly limits">
        <Note>
          These caps apply to <b>every user</b>. A higher tier <b>dailyCap</b> overrides the global daily cap (only if larger). Set to <b>0</b> to disable a cap.
        </Note>

        <div className="grid gap-3 md:grid-cols-2">
          <NumField label="Global daily cap (RR/user)" min={0} value={draft.dailyCap} onChange={(v) => setDraft((d) => ({ ...d, dailyCap: v }))} suffix="RR" />
          <NumField label="Global weekly cap (RR/user)" min={0} value={draft.weeklyCap} onChange={(v) => setDraft((d) => ({ ...d, weeklyCap: v }))} suffix="RR" />
        </div>
      </Panel>

      <Panel title="Per-action cooldowns + daily limits">
        <Note>
          <b>Cooldown</b> = minimum seconds between two credits of the same action. <b>Daily limit</b> = max credits per user per day. Set to <b>0</b> to disable.
        </Note>

        <DataTable head={<><th>Action</th><th>Cooldown (sec)</th><th>Daily limit</th></>}>
          {CAP_ACTIONS.map((id) => (
            <tr key={id}>
              <td className="font-semibold text-white">
                {id.replace(/_/g, " ")}
                <div className="font-mono text-[10px] text-white/40">{id}</div>
              </td>
              <td>
                <input type="number" min={0} value={draft.cooldowns[id] ?? 0}
                  onChange={(e) => setDraft((d) => ({ ...d, cooldowns: { ...d.cooldowns, [id]: Math.max(0, Number(e.target.value) || 0) } }))}
                  className="w-28 rounded-md bg-black/30 px-2 py-1 text-right font-mono text-sm font-bold text-amber-200 ring-1 ring-amber-400/30 outline-none" />
              </td>
              <td>
                <input type="number" min={0} value={draft.dailyActionLimit[id] ?? 0}
                  onChange={(e) => setDraft((d) => ({ ...d, dailyActionLimit: { ...d.dailyActionLimit, [id]: Math.max(0, Number(e.target.value) || 0) } }))}
                  className="w-24 rounded-md bg-black/30 px-2 py-1 text-right font-mono text-sm font-bold text-violet-200 ring-1 ring-violet-400/30 outline-none" />
              </td>
            </tr>
          ))}
        </DataTable>

        <SaveBar onSave={() => onSave(draft)} onReset={onReset} saving={saving} />
      </Panel>
    </div>
  );
}

/* ============================================================ Social Rules */

const SOCIAL_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  follow_instagram: Instagram,
  follow_twitter: X,
  subscribe_youtube: Youtube,
  follow_tiktok: Music2,
  join_telegram: Send,
  join_discord: MessageCircle,
  subscribe_newsletter: Mail,
};

function SocialRulesPanel({ rules, saving, onSave, onReset }: { rules: RrSocialRule[]; saving: boolean; onSave: (v: RrSocialRule[]) => void; onReset: () => void }) {
  const [draft, setDraft] = useState<RrSocialRule[]>(rules);
  useEffect(() => setDraft(rules), [rules]);

  const update = (id: string, patch: Partial<RrSocialRule>) =>
    setDraft((prev) => prev.map((r) => r.id === id ? { ...r, ...patch } : r));

  return (
    <Panel title="Social tasks — one-time rewards per user">
      <Note>
        These reward users <b>once per account</b> when they follow/subscribe to our channels. Users submit their
        handle (or email for newsletter) — you approve in the <b>Claims</b> tab. Approved claims auto-credit RR.
      </Note>

      <div className="grid gap-3">
        {draft.map((r) => {
          const Icon = SOCIAL_ICONS[r.id] ?? ExternalLink;
          return (
            <div key={r.id}
              className={`grid gap-3 rounded-2xl bg-white/[0.03] p-4 ring-1 md:grid-cols-[1fr_auto_auto_auto] md:items-center ${r.enabled ? "ring-white/10" : "opacity-60 ring-white/5"}`}
            >
              <div className="flex items-start gap-3">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[rgba(126,77,255,0.18)] ring-1 ring-white/10">
                  <Icon className="h-4 w-4 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-bold text-white">{r.label}</div>
                  <div className="text-[11px] text-muted-foreground">{r.description}</div>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    <LabeledInput label="Official handle" value={r.handle} onChange={(v) => update(r.id, { handle: v })} />
                    <LabeledInput label="URL" value={r.url} onChange={(v) => update(r.id, { url: v })} />
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-center gap-1">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Reward (one-time)</span>
                <div className="flex items-center rounded-lg bg-black/30 ring-1 ring-violet-400/30 text-violet-200">
                  <input type="number" min={0} value={r.reward} disabled={!r.enabled}
                    onChange={(e) => update(r.id, { reward: Math.max(0, Number(e.target.value) || 0) })}
                    className="w-16 bg-transparent px-2 py-1.5 text-center font-mono text-sm font-bold outline-none disabled:cursor-not-allowed" />
                  <span className="pr-2 text-[10px] font-bold opacity-70">RR</span>
                </div>
              </div>

              <div className="flex flex-col items-center gap-1">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Verify by</span>
                <select value={r.verification} disabled={!r.enabled}
                  onChange={(e) => update(r.id, { verification: e.target.value as RrSocialRule["verification"] })}
                  className="rounded-lg bg-black/30 px-2 py-1.5 text-xs font-semibold text-white ring-1 ring-white/10 outline-none"
                >
                  <option value="handle">Handle</option>
                  <option value="email">Email</option>
                  <option value="manual">Manual</option>
                </select>
              </div>

              <Toggle label={r.label} active={r.enabled} onChange={(v) => update(r.id, { enabled: v })} />
            </div>
          );
        })}
      </div>

      <SaveBar onSave={() => onSave(draft)} onReset={onReset} saving={saving} />
    </Panel>
  );
}

/* ============================================================ Spend Rules */

const SPEND_CATS = ["challenge", "cash", "discount", "fees", "academy", "boost", "partner", "badge", "raffle", "other"] as const;

function SpendRulesPanel({ rules, saving, onSave, onReset }: { rules: RrSpendRule[]; saving: boolean; onSave: (v: RrSpendRule[]) => void; onReset: () => void }) {
  const [draft, setDraft] = useState<RrSpendRule[]>(rules);
  useEffect(() => setDraft(rules), [rules]);

  const update = (id: string, patch: Partial<RrSpendRule>) =>
    setDraft((prev) => prev.map((r) => r.id === id ? { ...r, ...patch } : r));

  const remove = (id: string) => {
    if (!confirm("Remove this spend rule?")) return;
    setDraft((prev) => prev.filter((r) => r.id !== id));
  };

  const add = (newRule: Omit<RrSpendRule, "id" | "redeemed">) => {
    const id = `sr-${Math.random().toString(36).slice(2, 8)}`;
    setDraft((prev) => [...prev, { ...newRule, id, redeemed: 0 }]);
  };

  return (
    <Panel title="Spend rules — what RR can be redeemed for">
      <Note>
        Use challenge spend rules to set the RR needed for funded account unlocks. For example: 5K Trading Challenge = 100 RR, 10K Trading Challenge = 200 RR.
      </Note>
      <NewSpendForm onAdd={add} />

      <DataTable head={<><th>Reward</th><th>Category</th><th>Account</th><th>Cost (RR)</th><th>Tier gate</th><th>Stock</th><th>Status</th><th></th></>}>
        {draft.map((r) => (
          <tr key={r.id}>
            <td>
              <input value={r.label} onChange={(e) => update(r.id, { label: e.target.value })}
                className="w-full rounded-md bg-transparent px-2 py-1 text-sm font-semibold text-white outline-none ring-1 ring-transparent focus:bg-white/5 focus:ring-white/10" />
              <input value={r.description} onChange={(e) => update(r.id, { description: e.target.value })}
                className="mt-1 w-full rounded-md bg-transparent px-2 py-1 text-[11px] text-muted-foreground outline-none ring-1 ring-transparent focus:bg-white/5 focus:ring-white/10" />
            </td>
            <td>
              <select value={r.category} onChange={(e) => update(r.id, { category: e.target.value })}
                className="rounded-md bg-black/30 px-2 py-1 text-xs text-white ring-1 ring-white/10 outline-none">
                {SPEND_CATS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </td>
            <td>
              <input value={r.accountSize ?? ""} onChange={(e) => update(r.id, { accountSize: e.target.value.trim() || undefined })}
                placeholder="5K"
                className="w-20 rounded-md bg-black/30 px-2 py-1 text-xs font-semibold text-white ring-1 ring-white/10 outline-none placeholder:text-muted-foreground" />
            </td>
            <td>
              <input type="number" min={0} value={r.cost} onChange={(e) => update(r.id, { cost: Math.max(0, Number(e.target.value) || 0) })}
                className="w-24 rounded-md bg-black/30 px-2 py-1 text-right font-mono text-sm font-bold text-rose-300 ring-1 ring-rose-400/30 outline-none" />
            </td>
            <td>
              <input type="number" min={0} max={4} value={r.tierGate ?? 0} onChange={(e) => update(r.id, { tierGate: Number(e.target.value) || null })}
                className="w-16 rounded-md bg-black/30 px-2 py-1 text-right font-mono text-xs font-bold text-violet-200 ring-1 ring-violet-400/30 outline-none" />
            </td>
            <td>
              <input type="number" min={0} value={r.stock ?? 0} placeholder="∞" onChange={(e) => update(r.id, { stock: Number(e.target.value) > 0 ? Number(e.target.value) : null })}
                className="w-20 rounded-md bg-black/30 px-2 py-1 text-right font-mono text-xs font-bold text-amber-200 ring-1 ring-amber-400/30 outline-none" />
              {r.stock != null && <div className="mt-0.5 text-[9px] text-muted-foreground">{r.redeemed}/{r.stock}</div>}
            </td>
            <td>{r.enabled ? <Pill tone="good">enabled</Pill> : <Pill tone="neutral">disabled</Pill>}</td>
            <td className="text-right">
              <div className="inline-flex items-center gap-1">
                <button onClick={() => update(r.id, { enabled: !r.enabled })} className="rounded-md bg-white/10 px-2 py-1 text-[10px] font-bold text-white">
                  {r.enabled ? "Disable" : "Enable"}
                </button>
                <button onClick={() => remove(r.id)} className="grid h-7 w-7 place-items-center rounded-md bg-white/10 text-rose-300 hover:bg-rose-500/20" aria-label="Remove">
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </td>
          </tr>
        ))}
      </DataTable>

      <SaveBar onSave={() => onSave(draft)} onReset={onReset} saving={saving} />
    </Panel>
  );
}

function NewSpendForm({ onAdd }: { onAdd: (r: Omit<RrSpendRule, "id" | "redeemed">) => void }) {
  const [label, setLabel] = useState("");
  const [description, setDescription] = useState("");
  const [cost, setCost] = useState(100);
  const [category, setCategory] = useState<string>("challenge");
  const [accountSize, setAccountSize] = useState("5K");
  const [show, setShow] = useState(false);

  if (!show) {
    return (
      <button onClick={() => setShow(true)} className="mb-3 inline-flex items-center gap-1 rounded-full rb-gradient-primary px-3 py-1 text-[10px] font-bold text-white">
        <Plus className="h-3 w-3" /> New rule
      </button>
    );
  }

  return (
    <div className="mb-3 grid gap-2 rounded-2xl bg-white/[0.04] p-3 ring-1 ring-white/10 md:grid-cols-[2fr_2fr_1fr_0.8fr_1fr_auto]">
      <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Reward title" className="rounded-md bg-black/30 px-2 py-1.5 text-sm text-white ring-1 ring-white/10 outline-none" />
      <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Short description" className="rounded-md bg-black/30 px-2 py-1.5 text-sm text-white ring-1 ring-white/10 outline-none" />
      <select value={category} onChange={(e) => setCategory(e.target.value)} className="rounded-md bg-black/30 px-2 py-1.5 text-sm text-white ring-1 ring-white/10 outline-none">
        {SPEND_CATS.map((c) => <option key={c} value={c}>{c}</option>)}
      </select>
      <input value={accountSize} onChange={(e) => setAccountSize(e.target.value)} placeholder="Account size" className="rounded-md bg-black/30 px-2 py-1.5 text-sm text-white ring-1 ring-white/10 outline-none" />
      <input type="number" min={0} value={cost} onChange={(e) => setCost(Math.max(0, Number(e.target.value) || 0))} className="rounded-md bg-black/30 px-2 py-1.5 text-right font-mono text-sm text-white ring-1 ring-white/10 outline-none" />
      <div className="flex gap-2">
        <button onClick={() => { if (!label.trim()) return; onAdd({ label, description, cost, category, accountSize: accountSize.trim() || undefined, tierGate: null, stock: null, enabled: true }); setLabel(""); setDescription(""); setAccountSize("5K"); setShow(false); }}
          className="rounded-md rb-gradient-primary px-3 py-1.5 text-xs font-bold text-white">Add</button>
        <button onClick={() => setShow(false)} className="rounded-md bg-white/10 px-3 py-1.5 text-xs font-bold text-white">Cancel</button>
      </div>
    </div>
  );
}

/* ============================================================ Streaks */

function StreaksPanel({ cfg, stats, saving, onSave, onReset }: { cfg: RrStreakConfig; stats: RrStats | null; saving: boolean; onSave: (v: RrStreakConfig) => void; onReset: () => void }) {
  const [draft, setDraft] = useState<RrStreakConfig>(cfg);
  useEffect(() => setDraft(cfg), [cfg]);

  const [newMilestone, setNewMilestone] = useState({ days: 21, reward: 150, label: "" });

  const updateMilestone = (id: string, patch: Partial<typeof draft.milestones[0]>) =>
    setDraft((d) => ({ ...d, milestones: d.milestones.map((m) => m.id === id ? { ...m, ...patch } : m) }));
  const removeMilestone = (id: string) => {
    if (!confirm("Remove this milestone?")) return;
    setDraft((d) => ({ ...d, milestones: d.milestones.filter((m) => m.id !== id) }));
  };
  const addMilestone = () => {
    if (!newMilestone.label.trim()) return;
    setDraft((d) => ({ ...d, milestones: [...d.milestones, { id: `ms-${Math.random().toString(36).slice(2, 8)}`, ...newMilestone, enabled: true }] }));
    setNewMilestone({ days: 21, reward: 150, label: "" });
  };

  return (
    <div className="space-y-4">
      <Panel title="Streak engine — daily activity rewards">
        <Note>
          A user's streak grows by 1 each day they perform the qualifying action. Miss a day → streak resets to 0.
          When the streak hits a milestone, the reward auto-credits to their RR wallet (once per user).
        </Note>

        <div className="mb-4 grid gap-3 md:grid-cols-3">
          <div className="flex items-center justify-between rounded-2xl bg-white/[0.04] p-3 ring-1 ring-white/10">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Engine</div>
              <div className="text-sm font-bold text-white">{draft.enabled ? "Live — auto-rewarding" : "Paused"}</div>
            </div>
            <Toggle label="Streak engine" active={draft.enabled} onChange={(v) => setDraft((d) => ({ ...d, enabled: v }))} />
          </div>
          <label className="rounded-2xl bg-white/[0.04] p-3 ring-1 ring-white/10">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Qualifying action</div>
            <select value={draft.qualifier} onChange={(e) => setDraft((d) => ({ ...d, qualifier: e.target.value as RrStreakConfig["qualifier"] }))}
              className="mt-1 w-full rounded-md bg-black/30 px-2 py-1.5 text-sm text-white ring-1 ring-white/10 outline-none">
              <option value="any_activity">Any activity (login OR trade log)</option>
              <option value="login">Login only</option>
              <option value="trade_log">Log a trade</option>
            </select>
          </label>
          <label className="rounded-2xl bg-white/[0.04] p-3 ring-1 ring-white/10">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Grace window (hours after midnight)</div>
            <input type="number" min={0} max={23} value={draft.graceHours}
              onChange={(e) => setDraft((d) => ({ ...d, graceHours: Math.max(0, Math.min(23, Number(e.target.value) || 0)) }))}
              className="mt-1 w-full rounded-md bg-black/30 px-2 py-1.5 text-sm text-white ring-1 ring-white/10 outline-none" />
          </label>
        </div>

        <DataTable head={<><th>Milestone</th><th>Days</th><th>Reward (RR)</th><th>Status</th><th></th></>}>
          {draft.milestones.map((m) => (
            <tr key={m.id}>
              <td>
                <input value={m.label} onChange={(e) => updateMilestone(m.id, { label: e.target.value })}
                  className="w-full rounded-md bg-transparent px-2 py-1 text-sm font-semibold text-white outline-none ring-1 ring-transparent focus:bg-white/5 focus:ring-white/10" />
              </td>
              <td>
                <input type="number" min={1} value={m.days} onChange={(e) => updateMilestone(m.id, { days: Math.max(1, Number(e.target.value) || 1) })}
                  className="w-20 rounded-md bg-black/30 px-2 py-1 text-right font-mono text-sm font-bold text-amber-200 ring-1 ring-amber-400/30 outline-none" />
              </td>
              <td>
                <input type="number" min={0} value={m.reward} onChange={(e) => updateMilestone(m.id, { reward: Math.max(0, Number(e.target.value) || 0) })}
                  className="w-24 rounded-md bg-black/30 px-2 py-1 text-right font-mono text-sm font-bold text-violet-200 ring-1 ring-violet-400/30 outline-none" />
              </td>
              <td>{m.enabled ? <Pill tone="good">enabled</Pill> : <Pill tone="neutral">disabled</Pill>}</td>
              <td className="text-right">
                <div className="inline-flex items-center gap-1">
                  <button onClick={() => updateMilestone(m.id, { enabled: !m.enabled })} className="rounded-md bg-white/10 px-2 py-1 text-[10px] font-bold text-white">
                    {m.enabled ? "Disable" : "Enable"}
                  </button>
                  <button onClick={() => removeMilestone(m.id)} className="grid h-7 w-7 place-items-center rounded-md bg-white/10 text-rose-300 hover:bg-rose-500/20" aria-label="Remove">
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
            <input type="number" min={1} value={newMilestone.days} onChange={(e) => setNewMilestone((d) => ({ ...d, days: Math.max(1, Number(e.target.value) || 1) }))}
              className="w-20 rounded-md bg-black/30 px-2 py-1.5 text-right font-mono text-sm text-white ring-1 ring-white/10 outline-none" />
          </label>
          <label className="flex flex-col">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Reward (RR)</span>
            <input type="number" min={0} value={newMilestone.reward} onChange={(e) => setNewMilestone((d) => ({ ...d, reward: Math.max(0, Number(e.target.value) || 0) }))}
              className="w-24 rounded-md bg-black/30 px-2 py-1.5 text-right font-mono text-sm text-white ring-1 ring-white/10 outline-none" />
          </label>
          <label className="flex flex-1 flex-col">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Label</span>
            <input value={newMilestone.label} onChange={(e) => setNewMilestone((d) => ({ ...d, label: e.target.value }))} placeholder="e.g. 21-day momentum"
              className="rounded-md bg-black/30 px-2 py-1.5 text-sm text-white ring-1 ring-white/10 outline-none" />
          </label>
          <button onClick={addMilestone} className="inline-flex items-center gap-1 rounded-md rb-gradient-primary px-3 py-1.5 text-xs font-bold text-white">
            <Plus className="h-3 w-3" /> Add
          </button>
        </div>

        <SaveBar onSave={() => onSave(draft)} onReset={onReset} saving={saving} />
      </Panel>

      <Panel title="Live streak analytics">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Mini icon={Flame} label="Active milestones" value={String(draft.milestones.filter((m) => m.enabled).length)} />
          <Mini icon={TrendingUp} label="Grace window" value={`${draft.graceHours}h`} />
          <Mini icon={Activity} label="Qualifier" value={draft.qualifier} />
          <Mini icon={Gift} label="Streaks enabled" value={draft.enabled ? "Yes" : "Paused"} />
        </div>
      </Panel>
    </div>
  );
}

/* ============================================================ Claims */

function ClaimsPanel({ socialRules }: { socialRules: RrSocialRule[] }) {
  const { token } = useAuth();
  const [claims, setClaims] = useState<RrClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"pending" | "approved" | "rejected" | "all">("pending");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [reviewing, setReviewing] = useState<number | null>(null);
  const [rejectId, setRejectId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const load = useCallback(async (p = 0) => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await rrApi.getClaims(token, p, 30, filter === "all" ? undefined : filter);
      if (res.payload) {
        setClaims(p === 0 ? res.payload.page : (prev) => [...prev, ...res.payload!.page]);
        setTotalPages(res.payload.totalPages);
        setPage(p);
      }
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Failed to load claims");
    } finally {
      setLoading(false);
    }
  }, [token, filter]);

  useEffect(() => { load(0); }, [load]);

  const review = async (id: number, status: "approved" | "rejected", reason?: string) => {
    if (!token) return;
    setReviewing(id);
    try {
      const res = await rrApi.reviewClaim(token, id, status, reason);
      if (res.payload) {
        setClaims((prev) => prev.map((c) => c.id === id ? res.payload! : c));
        toast.success(status === "approved" ? "Claim approved — RR credited" : "Claim rejected");
      }
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Review failed");
    } finally {
      setReviewing(null);
      setRejectId(null);
      setRejectReason("");
    }
  };

  return (
    <Panel title="Social claims — verify follows / subscribes"
      action={
        <div className="flex gap-1">
          {(["pending", "approved", "rejected", "all"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`rounded-full px-2.5 py-1 text-[10px] font-bold capitalize ${filter === f ? "bg-white/15 text-white" : "bg-white/5 text-muted-foreground hover:text-white"}`}>{f}</button>
          ))}
        </div>
      }
    >
      {rejectId !== null && (
        <div className="mb-3 flex items-center gap-2 rounded-xl bg-rose-500/10 p-3 ring-1 ring-rose-400/20">
          <input value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Rejection reason (optional)"
            className="flex-1 rounded-md bg-black/30 px-2 py-1.5 text-sm text-white ring-1 ring-white/10 outline-none" />
          <button onClick={() => review(rejectId, "rejected", rejectReason || undefined)} disabled={reviewing === rejectId}
            className="rounded-md bg-rose-500/80 px-3 py-1.5 text-xs font-bold text-white disabled:opacity-40">
            {reviewing === rejectId ? "…" : "Confirm reject"}
          </button>
          <button onClick={() => setRejectId(null)} className="rounded-md bg-white/10 px-3 py-1.5 text-xs font-bold text-white">Cancel</button>
        </div>
      )}

      {loading && claims.length === 0 ? (
        <div className="py-10 text-center text-sm text-muted-foreground">Loading claims…</div>
      ) : claims.length === 0 ? (
        <div className="rounded-2xl bg-white/[0.03] p-6 text-center text-sm text-muted-foreground ring-1 ring-white/10">
          No {filter === "all" ? "" : filter} claims. Users submit from <b>Dashboard → Rewards → Follow &amp; earn</b>.
        </div>
      ) : (
        <DataTable head={<><th>Action</th><th>User</th><th>Proof</th><th>Amount</th><th>Status</th><th>Submitted</th><th></th></>}>
          {claims.map((c) => {
            const rule = socialRules.find((s) => s.id === c.socialId);
            const Icon = SOCIAL_ICONS[c.socialId] ?? ExternalLink;
            return (
              <tr key={c.id}>
                <td>
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-violet-300" />
                    <span className="font-semibold text-white">{rule?.label ?? c.socialId}</span>
                  </div>
                </td>
                <td className="font-mono text-xs">{c.user?.name ?? `User #${c.userId}`}</td>
                <td>
                  <span className="font-mono text-xs text-white/85">{c.proof}</span>
                  {rule?.url && (
                    <a href={rule.url} target="_blank" rel="noreferrer" className="ml-2 inline-flex items-center text-[10px] text-violet-300">
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </td>
                <td className="font-mono font-bold text-emerald-300">+{c.amount} RR</td>
                <td>
                  {c.status === "pending" && <Pill tone="warn">pending</Pill>}
                  {c.status === "approved" && <Pill tone="good">approved</Pill>}
                  {c.status === "rejected" && <Pill tone="bad">rejected</Pill>}
                </td>
                <td className="text-xs text-muted-foreground">{new Date(c.createdAt).toLocaleString()}</td>
                <td className="text-right">
                  {c.status === "pending" && (
                    <div className="inline-flex gap-1">
                      <button onClick={() => review(c.id, "approved")} disabled={reviewing === c.id}
                        className="inline-flex items-center gap-1 rounded-md bg-emerald-500/20 px-2 py-1 text-[10px] font-bold text-emerald-300 ring-1 ring-emerald-400/30 disabled:opacity-40">
                        <Check className="h-3 w-3" /> Approve
                      </button>
                      <button onClick={() => { setRejectId(c.id); setRejectReason(""); }}
                        className="inline-flex items-center gap-1 rounded-md bg-rose-500/20 px-2 py-1 text-[10px] font-bold text-rose-300 ring-1 ring-rose-400/30">
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

      {totalPages > 1 && page < totalPages - 1 && (
        <div className="mt-4 flex justify-center">
          <button onClick={() => load(page + 1)} disabled={loading} className="rounded-full bg-white/10 px-4 py-1.5 text-xs text-white disabled:opacity-40">
            {loading ? "Loading…" : "Load more"}
          </button>
        </div>
      )}
    </Panel>
  );
}

/* ============================================================ Ledger */

function LedgerPanel() {
  const { token } = useAuth();
  const [data, setData] = useState<{ topUsers: any[]; ledger: any[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [awardForm, setAwardForm] = useState<{ userId: string; amount: string; narration: string } | null>(null);
  const [awarding, setAwarding] = useState(false);

  useEffect(() => {
    if (!token) return;
    rrApi.getLedger(token).then((res) => {
      if (res.payload) setData(res.payload);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [token]);

  const doAward = async () => {
    if (!token || !awardForm) return;
    const userId = Number(awardForm.userId);
    const amount = Number(awardForm.amount);
    if (!userId || !amount) { toast.error("Fill in user ID and amount"); return; }
    setAwarding(true);
    try {
      await rrApi.awardRr(token, userId, amount, awardForm.narration || "Manual award");
      toast.success(`Awarded ${amount} RR to user #${userId}`);
      setAwardForm(null);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Award failed");
    } finally {
      setAwarding(false);
    }
  };

  return (
    <div className="grid gap-4">
      <Panel title="Manual RR award"
        action={
          <button onClick={() => setAwardForm(awardForm ? null : { userId: "", amount: "", narration: "" })}
            className="inline-flex items-center gap-1 rounded-full rb-gradient-primary px-3 py-1 text-[10px] font-bold text-white">
            <Plus className="h-3 w-3" /> Award RR
          </button>
        }
      >
        {awardForm && (
          <div className="mb-3 grid gap-2 rounded-2xl bg-white/[0.04] p-3 ring-1 ring-white/10 md:grid-cols-[1fr_1fr_2fr_auto]">
            <input value={awardForm.userId} onChange={(e) => setAwardForm((d) => d && { ...d, userId: e.target.value })} placeholder="User ID" className="rounded-md bg-black/30 px-2 py-1.5 text-sm text-white ring-1 ring-white/10 outline-none" />
            <input type="number" value={awardForm.amount} onChange={(e) => setAwardForm((d) => d && { ...d, amount: e.target.value })} placeholder="Amount (RR)" className="rounded-md bg-black/30 px-2 py-1.5 text-sm text-white ring-1 ring-white/10 outline-none" />
            <input value={awardForm.narration} onChange={(e) => setAwardForm((d) => d && { ...d, narration: e.target.value })} placeholder="Narration" className="rounded-md bg-black/30 px-2 py-1.5 text-sm text-white ring-1 ring-white/10 outline-none" />
            <button onClick={doAward} disabled={awarding} className="rounded-md rb-gradient-primary px-3 py-1.5 text-xs font-bold text-white disabled:opacity-40">
              {awarding ? "…" : "Award"}
            </button>
          </div>
        )}
        <p className="text-xs text-muted-foreground">Use this form to manually credit RR to a user for support resolutions or promotions.</p>
      </Panel>

      <Panel title="Top RR holders">
        {loading ? (
          <div className="py-8 text-center text-sm text-muted-foreground">Loading…</div>
        ) : (
          <DataTable head={<><th>User</th><th>Name</th><th>RR Balance</th></>}>
            {(data?.topUsers ?? []).map((u) => (
              <tr key={u.id}>
                <td className="font-mono text-xs">#{u.id}</td>
                <td className="font-semibold">{u.name ?? u.emailAddress ?? "—"}</td>
                <td className="font-mono font-bold text-violet-300">{Number(u.rrBalance ?? 0).toLocaleString()} RR</td>
              </tr>
            ))}
            {(data?.topUsers ?? []).length === 0 && (
              <tr><td colSpan={3} className="py-8 text-center text-sm text-muted-foreground">No RR holders yet.</td></tr>
            )}
          </DataTable>
        )}
      </Panel>

      <Panel title="RR claim ledger (latest 50)">
        {loading ? (
          <div className="py-8 text-center text-sm text-muted-foreground">Loading…</div>
        ) : (
          <DataTable head={<><th>Date</th><th>User</th><th>Action</th><th>Amount</th><th>Status</th></>}>
            {(data?.ledger ?? []).map((entry) => (
              <tr key={entry.id}>
                <td className="text-xs text-muted-foreground whitespace-nowrap">
                  {new Date(entry.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                </td>
                <td className="font-mono text-xs">{entry.user?.name ?? `User #${entry.userId}`}</td>
                <td className="text-white/80">{entry.socialId ?? entry.narration ?? "—"}</td>
                <td className="font-mono font-bold text-emerald-300">+{Number(entry.amount ?? 0).toLocaleString()} RR</td>
                <td>
                  <Pill tone={entry.status === "approved" ? "good" : entry.status === "pending" ? "warn" : "bad"}>
                    {entry.status}
                  </Pill>
                </td>
              </tr>
            ))}
            {(data?.ledger ?? []).length === 0 && (
              <tr><td colSpan={5} className="py-8 text-center text-sm text-muted-foreground">No entries yet.</td></tr>
            )}
          </DataTable>
        )}
      </Panel>
    </div>
  );
}
