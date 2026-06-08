import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Copy, Check, Share2, QrCode, Twitter, MessageCircle, Send, Mail, Link2,
  Users, MousePointerClick, ShieldCheck, DollarSign, Sparkles, Gift, ExternalLink, Pencil, X,
} from "lucide-react";
import { PageHeader, Panel, StatCard, Pill, EmptyState } from "@/components/dashboard/Primitives";
import { useAuth } from "@/lib/auth";
import { referralApi, type ReferralProfile, type ReferralStats, type ReferralEvent, type ReferralPayout, type RefereeRow } from "@/lib/referral-api";
import { ApiError } from "@/lib/api";

export const Route = createFileRoute("/dashboard/referrals")({
  head: () => ({
    meta: [
      { title: "Referrals — RebateBoard" },
      { name: "description", content: "Share your referral link, track signups, and earn commission + RR for every trader you bring in." },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: ReferralsPage,
});

function fmtUsd(n: number) { return `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`; }
function fmtPct(raw: string | number) {
  const n = typeof raw === "string" ? parseFloat(raw) : raw;
  return `${(n * 100).toFixed(1)}%`;
}
function fmtTime(isoOrMs: string | number) {
  const ms = typeof isoOrMs === "number" ? isoOrMs : Date.parse(isoOrMs);
  const diff = Date.now() - ms;
  const m = Math.floor(diff / 60000), h = Math.floor(m / 60), d = Math.floor(h / 24);
  if (d > 0) return `${d}d ago`;
  if (h > 0) return `${h}h ago`;
  if (m > 0) return `${m}m ago`;
  return "just now";
}

function buildShareUrl(profile: ReferralProfile, source?: string) {
  const identifier = profile.customSlug ?? profile.code;
  const base = `${typeof window !== "undefined" ? window.location.origin : "https://rebateboard.com"}/r/${identifier}`;
  return source ? `${base}?utm_source=${source}` : base;
}

const SLUG_RE = /^[a-z0-9_-]{3,24}$/;

function ReferralsPage() {
  const { token } = useAuth();
  const [profile, setProfile] = useState<ReferralProfile | null>(null);
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [events, setEvents] = useState<ReferralEvent[]>([]);
  const [payouts, setPayouts] = useState<ReferralPayout[]>([]);
  const [referees, setReferees] = useState<RefereeRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [profileRes, statsRes, eventsRes, payoutsRes, refereesRes] = await Promise.allSettled([
        referralApi.getOrCreateProfile(token),
        referralApi.getStats(token),
        referralApi.getEvents(token),
        referralApi.getPayouts(token),
        referralApi.getReferees(token),
      ]);
      if (profileRes.status === "fulfilled" && profileRes.value.payload) setProfile(profileRes.value.payload);
      if (statsRes.status === "fulfilled" && statsRes.value.payload) setStats(statsRes.value.payload);
      if (eventsRes.status === "fulfilled" && eventsRes.value.payload) setEvents(eventsRes.value.payload.page);
      if (payoutsRes.status === "fulfilled" && payoutsRes.value.payload) setPayouts(payoutsRes.value.payload);
      if (refereesRes.status === "fulfilled" && refereesRes.value.payload) setReferees(refereesRes.value.payload);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const [source, setSource] = useState("twitter");
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [editingSlug, setEditingSlug] = useState(false);
  const [slugDraft, setSlugDraft] = useState("");
  const [slugError, setSlugError] = useState<string | null>(null);
  const [savingSlug, setSavingSlug] = useState(false);

  const link = useMemo(() => (profile ? buildShareUrl(profile, source) : ""), [profile, source]);
  const baseLink = useMemo(() => (profile ? buildShareUrl(profile) : ""), [profile]);

  if (loading || !profile || !stats) {
    return <EmptyState icon={Users} title="Loading your referral profile…" />;
  }

  const copy = async (text: string) => {
    try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch {}
  };

  const share = (channel: string) => {
    const msg = encodeURIComponent(`Join RebateBoard with my link and unlock cashback + AI tools for traders 👇 ${link}`);
    const urls: Record<string, string> = {
      twitter: `https://twitter.com/intent/tweet?text=${msg}`,
      whatsapp: `https://wa.me/?text=${msg}`,
      telegram: `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${msg}`,
      email: `mailto:?subject=${encodeURIComponent("Try RebateBoard")}&body=${msg}`,
    };
    if (urls[channel]) window.open(urls[channel], "_blank", "noopener");
  };

  const startSlugEdit = () => { setSlugDraft(profile.customSlug ?? ""); setSlugError(null); setEditingSlug(true); };
  const saveSlug = async () => {
    if (!token) return;
    const v = slugDraft.trim().toLowerCase();
    if (v && !SLUG_RE.test(v)) { setSlugError("3–24 chars, lowercase letters, digits, _ and - only"); return; }
    setSavingSlug(true);
    try {
      const res = await referralApi.updateProfile(token, { customSlug: v || undefined });
      if (res.payload) setProfile(res.payload);
      setEditingSlug(false);
    } catch (e) {
      setSlugError(e instanceof ApiError ? e.message : "Could not save slug");
    } finally {
      setSavingSlug(false);
    }
  };

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&bgcolor=150829&color=FFFFFF&data=${encodeURIComponent(baseLink)}`;
  const earningReferees = referees.filter((r) => r.revenue > 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Referrals"
        subtitle="Every signup with your link earns you commission + RR. No application required — your link is live."
        actions={
          <div className="flex items-center gap-2">
            <Pill tone={profile.status === "active" ? "success" : "destructive"}>
              {profile.status === "active" ? "Active" : "Suspended"}
            </Pill>
            <Pill tone="primary">{profile.commissionPct}% commission</Pill>
            <Pill tone="default">{profile.rrPerSignup} RR / signup</Pill>
          </div>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Clicks" value={stats.clicks.toLocaleString()} hint={`${fmtPct(stats.clickToSignupCvr)} CVR`} trend="up" accent="primary" />
        <StatCard label="Signups" value={stats.signups.toLocaleString()} hint={`${stats.qualified} qualified`} trend="up" accent="success" />
        <StatCard label="Pending" value={fmtUsd(stats.pending)} hint="ready to claim" trend={stats.pending > 0 ? "up" : "neutral"} accent="warning" />
        <StatCard label="Lifetime earned" value={fmtUsd(stats.earned)} hint={`${fmtUsd(stats.paid)} paid`} trend="up" accent="success" />
      </div>

      {/* Link generator */}
      <Panel
        title="Your referral link"
        action={
          <button onClick={startSlugEdit} className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1 text-[11px] text-white/80 hover:bg-white/10">
            <Pencil className="h-3 w-3" /> {profile.customSlug ? "Edit slug" : "Set vanity slug"}
          </button>
        }
      >
        <div className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-fuchsia-500/10 via-violet-500/10 to-transparent p-4">
            <div className="mb-2 flex items-center gap-2 text-[10px] uppercase tracking-wider text-muted-foreground">
              <Sparkles className="h-3 w-3" /> Code:
              <span className="rounded-md bg-white/10 px-2 py-0.5 font-mono text-xs text-white">{profile.code}</span>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="flex flex-1 items-center gap-2 rounded-xl bg-black/30 px-3 py-2 ring-1 ring-white/10">
                <Link2 className="h-4 w-4 text-fuchsia-300" />
                <input readOnly value={link} className="flex-1 bg-transparent text-xs text-white outline-none sm:text-sm" />
              </div>
              <div className="flex items-center gap-2">
                <select value={source} onChange={(e) => setSource(e.target.value)} className="rounded-xl border border-white/10 bg-white/5 px-2 py-2 text-xs text-white" title="Tag this link's traffic source">
                  <option value="twitter">twitter</option>
                  <option value="tiktok">tiktok</option>
                  <option value="youtube">youtube</option>
                  <option value="instagram">instagram</option>
                  <option value="discord">discord</option>
                  <option value="telegram">telegram</option>
                  <option value="newsletter">newsletter</option>
                  <option value="other">other</option>
                </select>
                <button onClick={() => copy(link)} className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-fuchsia-500 to-violet-600 px-4 py-2 text-xs font-semibold text-white shadow-[0_0_20px_rgba(192,132,252,0.45)]">
                  {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
            </div>

            {editingSlug && (
              <div className="mt-3 rounded-xl border border-white/10 bg-black/30 p-3">
                <label className="mb-1 block text-[10px] uppercase tracking-wider text-muted-foreground">Vanity slug — rebateboard.com/r/<b className="text-white">your-name</b></label>
                <div className="flex items-center gap-2">
                  <input autoFocus value={slugDraft} onChange={(e) => { setSlugDraft(e.target.value); setSlugError(null); }} placeholder="aidenpro"
                    className="flex-1 rounded-md bg-white/5 px-3 py-1.5 text-xs text-white outline-none ring-1 ring-white/10 focus:ring-fuchsia-400/40" />
                  <button onClick={saveSlug} disabled={savingSlug} className="rounded-md bg-emerald-500/20 px-3 py-1.5 text-[11px] font-semibold text-emerald-300 ring-1 ring-emerald-400/30 hover:bg-emerald-500/30 disabled:opacity-40">
                    {savingSlug ? "…" : "Save"}
                  </button>
                  <button onClick={() => setEditingSlug(false)} className="grid h-7 w-7 place-items-center rounded-md bg-white/5 text-white/70 hover:bg-white/10"><X className="h-3 w-3" /></button>
                </div>
                {slugError && <p className="mt-1 text-[10px] text-rose-300">{slugError}</p>}
              </div>
            )}

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button onClick={() => share("twitter")} className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1.5 text-[11px] font-medium text-white hover:bg-white/10"><Twitter className="h-3.5 w-3.5 text-sky-400" /> Twitter / X</button>
              <button onClick={() => share("whatsapp")} className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1.5 text-[11px] font-medium text-white hover:bg-white/10"><MessageCircle className="h-3.5 w-3.5 text-emerald-400" /> WhatsApp</button>
              <button onClick={() => share("telegram")} className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1.5 text-[11px] font-medium text-white hover:bg-white/10"><Send className="h-3.5 w-3.5 text-cyan-300" /> Telegram</button>
              <button onClick={() => share("email")} className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1.5 text-[11px] font-medium text-white hover:bg-white/10"><Mail className="h-3.5 w-3.5 text-amber-300" /> Email</button>
              <button onClick={() => setShowQr((v) => !v)} className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1.5 text-[11px] font-medium text-white hover:bg-white/10"><QrCode className="h-3.5 w-3.5 text-fuchsia-300" /> {showQr ? "Hide QR" : "Show QR"}</button>
              <a href={baseLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1.5 text-[11px] font-medium text-white hover:bg-white/10"><ExternalLink className="h-3.5 w-3.5" /> Preview</a>
            </div>

            {showQr && (
              <div className="mt-3 flex justify-center">
                <img src={qrUrl} alt="Referral QR code" width={180} height={180} className="rounded-xl border border-white/10 bg-[#150829] p-2" />
              </div>
            )}
          </div>

          {/* How it works */}
          <div className="grid gap-2 md:grid-cols-3">
            {[
              { icon: Share2, title: "1. Share", body: "Drop your link anywhere — socials, Discord, blog, DMs." },
              { icon: ShieldCheck, title: "2. They sign up", body: "When they create an account & verify, you get RR instantly." },
              { icon: DollarSign, title: "3. You earn", body: `${profile.commissionPct}% of every cashback / payout they generate, for life.` },
            ].map((s) => (
              <div key={s.title} className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
                <div className="flex items-center gap-2">
                  <span className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-fuchsia-500/20 to-violet-500/20 text-fuchsia-300">
                    <s.icon className="h-3.5 w-3.5" />
                  </span>
                  <div className="text-xs font-semibold text-white">{s.title}</div>
                </div>
                <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </Panel>

      {/* Funnel + recent events */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Conversion funnel" compact>
          <div className="space-y-3">
            <FunnelBar label="Clicks" value={stats.clicks} max={Math.max(stats.clicks, 1)} tone="from-sky-400 to-cyan-500" />
            <FunnelBar label="Signups" value={stats.signups} max={Math.max(stats.clicks, 1)} tone="from-fuchsia-400 to-violet-500" />
            <FunnelBar label="Qualified" value={stats.qualified} max={Math.max(stats.clicks, 1)} tone="from-emerald-400 to-teal-500" />
            <FunnelBar label="Earning" value={earningReferees.length} max={Math.max(stats.clicks, 1)} tone="from-amber-400 to-orange-500" />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-center text-[11px]">
            <div className="rounded-lg bg-white/5 p-2">
              <div className="text-[9px] uppercase tracking-wider text-muted-foreground">Click → Signup</div>
              <div className="mt-0.5 font-mono text-sm text-white">{fmtPct(stats.clickToSignupCvr)}</div>
            </div>
            <div className="rounded-lg bg-white/5 p-2">
              <div className="text-[9px] uppercase tracking-wider text-muted-foreground">Signup → Qualified</div>
              <div className="mt-0.5 font-mono text-sm text-white">{fmtPct(stats.signupToQualifiedRate)}</div>
            </div>
          </div>
        </Panel>

        <div className="lg:col-span-2">
          <Panel title="Recent activity" compact>
            {events.length === 0 ? (
              <EmptyState icon={Sparkles} title="No activity yet" description="Share your link to see clicks and signups appear here in real time." />
            ) : (
              <ul className="divide-y divide-white/5">
                {events.slice(0, 8).map((e) => (
                  <li key={e.id} className="flex items-center gap-3 py-2 text-xs">
                    <EventIcon kind={e.kind} />
                    <div className="flex-1">
                      <div className="font-medium text-white">
                        {e.kind === "click" && <>New click {e.source && <span className="text-muted-foreground">· {e.source}</span>}</>}
                        {e.kind === "signup" && <>{e.refereeName ?? e.refereeEmail} signed up</>}
                        {e.kind === "qualified" && <>{e.refereeEmail} qualified (KYC / first deposit)</>}
                        {e.kind === "revenue" && <>Revenue {fmtUsd(e.amount ?? 0)} {e.source && <span className="text-muted-foreground">via {e.source}</span>}</>}
                      </div>
                      {e.refereeEmail && e.kind !== "signup" && <div className="text-[10px] text-muted-foreground">{e.refereeEmail}</div>}
                    </div>
                    <span className="text-[10px] text-muted-foreground">{fmtTime(e.createdAt)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </div>

      {/* Referees table */}
      <Panel title={`Referred users — ${referees.length}`}>
        {referees.length === 0 ? (
          <EmptyState icon={Users} title="No referrals yet" description="Once someone signs up via your link they'll appear here with their lifetime revenue + your commission." />
        ) : (
          <div className="-mx-4 overflow-x-auto px-4">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-white/10 text-[10px] uppercase tracking-wider text-muted-foreground">
                <tr><th className="py-2">User</th><th>Joined</th><th>Status</th><th className="text-right">Revenue</th><th className="text-right">Your commission</th></tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {referees.map((r) => (
                  <tr key={r.email} className="text-white">
                    <td className="py-2">
                      <div className="font-medium">{r.name ?? r.email}</div>
                      <div className="text-[10px] text-muted-foreground">{r.email}</div>
                    </td>
                    <td className="text-muted-foreground">{fmtTime(r.signupAt)}</td>
                    <td>{r.qualified ? <Pill tone="success">Qualified</Pill> : <Pill>Pending</Pill>}</td>
                    <td className="text-right font-mono">{fmtUsd(r.revenue)}</td>
                    <td className="text-right font-mono text-emerald-300">{fmtUsd(r.commission)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {/* Payout history */}
      <Panel title="Payout history">
        {payouts.length === 0 ? (
          <EmptyState icon={Gift} title="No payouts yet" description={`Hit ${fmtUsd(50)} pending and an admin will release it to your wallet.`} />
        ) : (
          <ul className="divide-y divide-white/5">
            {payouts.map((p) => (
              <li key={p.id} className="flex items-center justify-between py-2 text-xs text-white">
                <div>
                  <div className="font-semibold">{fmtUsd(p.amount)} <span className="ml-2 text-[10px] uppercase tracking-wider text-muted-foreground">{p.method}</span></div>
                  {p.note && <div className="text-[10px] text-muted-foreground">{p.note}</div>}
                </div>
                <span className="text-[10px] text-muted-foreground">{fmtTime(p.createdAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}

function FunnelBar({ label, value, max, tone }: { label: string; value: number; max: number; tone: string }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-[11px]">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono text-white">{value.toLocaleString()}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/5">
        <div className={`h-full bg-gradient-to-r ${tone}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function EventIcon({ kind }: { kind: string }) {
  const map: Record<string, { i: React.ElementType; cls: string }> = {
    click:     { i: MousePointerClick, cls: "bg-sky-500/15 text-sky-300 ring-sky-400/30" },
    signup:    { i: Users,             cls: "bg-fuchsia-500/15 text-fuchsia-300 ring-fuchsia-400/30" },
    qualified: { i: ShieldCheck,       cls: "bg-emerald-500/15 text-emerald-300 ring-emerald-400/30" },
    revenue:   { i: DollarSign,        cls: "bg-amber-500/15 text-amber-300 ring-amber-400/30" },
  };
  const { i: Icon, cls } = map[kind] ?? map.click;
  return <span className={`grid h-7 w-7 place-items-center rounded-lg ring-1 ${cls}`}><Icon className="h-3.5 w-3.5" /></span>;
}
