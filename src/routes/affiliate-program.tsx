import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, BarChart3, CheckCircle2, Handshake, Link2, Megaphone, ShieldCheck, Users } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ApiError } from "@/lib/api";
import { submitAffiliateApplication } from "@/lib/public-engagement-api";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/affiliate-program")({
  head: () => ({
    meta: [
      { title: "Affiliate Program | RebateBoard" },
      { name: "description", content: "Apply to become a RebateBoard affiliate partner." },
    ],
  }),
  component: AffiliateProgramPage,
});

const benefits = [
  { title: "Transparent tracking", body: "Referral activity, campaigns, and payouts are structured around measurable qualified performance.", icon: BarChart3 },
  { title: "Creator-ready links", body: "Approved partners receive tracking links and campaign context for their audience.", icon: Link2 },
  { title: "Trader-first positioning", body: "Promote a platform built around cashback, reviews, TBI, and useful tools.", icon: ShieldCheck },
  { title: "Long-term growth", body: "Strong affiliates can access campaign opportunities and partner support as RebateBoard scales.", icon: Users },
];

function AffiliateProgramPage() {
  const { user } = useAuth();
  const [form, setForm] = useState({
    fullName: user?.fullName || user?.name || "",
    email: user?.email || "",
    country: user?.country || "",
    companyName: "",
    website: "",
    socialLinks: "",
    primaryAudience: "",
    audienceSize: "",
    promotionChannels: "",
    industryExperience: "",
    monthlyReach: "",
    preferredModel: "Content / community referral",
    reason: "",
    termsAccepted: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [confirmation, setConfirmation] = useState<{ reference: string; expectedResponse: string } | null>(null);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const result = await submitAffiliateApplication({ ...form, socialLinks: form.socialLinks });
      setConfirmation({ reference: result.reference, expectedResponse: result.expectedResponse });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "We could not submit your affiliate application right now.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--rb-bg-canvas)] text-white">
      <SiteHeader />
      <main className="container-app space-y-8 py-8 sm:py-12">
        <section className="grid gap-6 rounded-[2rem] border border-white/10 bg-white/[0.045] p-6 shadow-[0_30px_100px_rgba(0,0,0,0.35)] md:p-10 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/15 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-violet-100 ring-1 ring-primary/20">
              <Handshake className="h-3.5 w-3.5" />
              Affiliate Program
            </div>
            <h1 className="mt-5 text-4xl font-black leading-tight md:text-6xl">Grow With RebateBoard</h1>
            <p className="mt-4 max-w-2xl text-base leading-8 text-white/68">
              Introduce traders to a transparency-first ecosystem and earn through qualified activity, campaign performance, and long-term partner growth.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <a href="#apply" className="inline-flex items-center justify-center gap-2 rounded-full rb-gradient-primary px-5 py-3 text-sm font-black text-white">
                Apply to Become an Affiliate <ArrowRight className="h-4 w-4" />
              </a>
              <Link to="/dashboard/referrals" className="inline-flex items-center justify-center rounded-full border border-white/12 px-5 py-3 text-sm font-bold text-white/80">
                Open Affiliate Dashboard
              </Link>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {benefits.map((item) => (
              <div key={item.title} className="rounded-3xl border border-white/10 bg-white/[0.045] p-4">
                <item.icon className="h-5 w-5 text-violet-200" />
                <h3 className="mt-3 text-sm font-black">{item.title}</h3>
                <p className="mt-2 text-xs leading-5 text-white/58">{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6">
            <h2 className="text-2xl font-black">How it works</h2>
            <div className="mt-5 space-y-4">
              {["Apply", "Get approved", "Receive tracking links", "Refer qualified traders", "Track conversions", "Earn commissions", "Receive payouts"].map((step, index) => (
                <div key={step} className="flex gap-3">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/15 text-xs font-black text-violet-100 ring-1 ring-primary/25">{index + 1}</span>
                  <span className="pt-1 text-sm font-bold">{step}</span>
                </div>
              ))}
            </div>
            <div className="mt-6 rounded-3xl border border-white/10 bg-white/[0.045] p-4 text-sm leading-7 text-white/62">
              Commission structures are based on campaign type, market, and qualified performance. We do not publish fixed rates until terms are assigned.
            </div>
          </div>

          <form id="apply" onSubmit={submit} className="rounded-[2rem] border border-white/10 bg-white/[0.045] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.28)] md:p-6">
            {confirmation ? (
              <div className="py-8 text-center">
                <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-emerald-500/15 text-emerald-200 ring-1 ring-emerald-300/25">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <h2 className="mt-5 text-2xl font-black">Application Received</h2>
                <p className="mt-3 text-sm leading-7 text-white/65">
                  Your reference number is <span className="font-mono font-bold text-white">{confirmation.reference}</span>. Expected review: {confirmation.expectedResponse}.
                </p>
              </div>
            ) : (
              <>
                <div>
                  <h2 className="text-2xl font-black">Affiliate application</h2>
                  <p className="mt-2 text-sm text-white/60">Tell us about your audience and how you plan to introduce traders to RebateBoard.</p>
                </div>
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <Field label="Full name"><input required className={inputCls} value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} /></Field>
                  <Field label="Email"><input required type="email" className={inputCls} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
                  <Field label="Country"><input className={inputCls} value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} /></Field>
                  <Field label="Company / community"><input className={inputCls} value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} /></Field>
                  <Field label="Website"><input className={inputCls} value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} /></Field>
                  <Field label="Audience size"><input className={inputCls} value={form.audienceSize} onChange={(e) => setForm({ ...form, audienceSize: e.target.value })} /></Field>
                  <Field label="Primary audience"><input className={inputCls} value={form.primaryAudience} onChange={(e) => setForm({ ...form, primaryAudience: e.target.value })} /></Field>
                  <Field label="Monthly reach"><input className={inputCls} value={form.monthlyReach} onChange={(e) => setForm({ ...form, monthlyReach: e.target.value })} /></Field>
                  <Field label="Promotion channels" span><input className={inputCls} value={form.promotionChannels} onChange={(e) => setForm({ ...form, promotionChannels: e.target.value })} /></Field>
                  <Field label="Social links" span><textarea rows={3} className={inputCls} value={form.socialLinks} onChange={(e) => setForm({ ...form, socialLinks: e.target.value })} placeholder="One link per line" /></Field>
                  <Field label="Trading-industry experience" span><textarea rows={3} className={inputCls} value={form.industryExperience} onChange={(e) => setForm({ ...form, industryExperience: e.target.value })} /></Field>
                  <Field label="Reason for applying" span><textarea required rows={5} className={inputCls} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} /></Field>
                </div>
                <label className="mt-4 flex items-start gap-3 rounded-2xl bg-white/[0.035] p-3 text-xs leading-5 text-white/65 ring-1 ring-white/8">
                  <input type="checkbox" checked={form.termsAccepted} onChange={(e) => setForm({ ...form, termsAccepted: e.target.checked })} className="mt-1" />
                  I confirm this application is accurate and agree to RebateBoard’s affiliate review process.
                </label>
                {error && <p className="mt-3 rounded-2xl border border-rose-300/20 bg-rose-500/10 p-3 text-sm text-rose-100">{error}</p>}
                <button disabled={submitting} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full rb-gradient-primary px-5 py-3 text-sm font-black text-white disabled:opacity-60">
                  {submitting ? "Submitting..." : "Submit Application"} <Megaphone className="h-4 w-4" />
                </button>
              </>
            )}
          </form>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

const inputCls = "w-full rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-primary/45 focus:bg-white/[0.07]";

function Field({ label, children, span = false }: { label: string; children: React.ReactNode; span?: boolean }) {
  return (
    <label className={span ? "md:col-span-2" : ""}>
      <span className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-white/55">{label}</span>
      {children}
    </label>
  );
}
