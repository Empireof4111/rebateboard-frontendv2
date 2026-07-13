import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, Building2, CheckCircle2, FileText, Mail, MessageSquare, Newspaper, ShieldAlert, UserRound } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ApiError } from "@/lib/api";
import { submitContactMessage } from "@/lib/public-engagement-api";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact RebateBoard" },
      { name: "description", content: "Reach RebateBoard trader support, partnerships, media, affiliate, and business teams." },
    ],
  }),
  component: ContactPage,
});

const categories = [
  { label: "Trader Support", icon: UserRound, hint: "Account, reviews, tools, and dashboard help" },
  { label: "Cashback and Claims", icon: FileText, hint: "Claim status, proof, wallet, or withdrawals" },
  { label: "Brand Partnerships", icon: Building2, hint: "Campaigns, listings, and partner operations" },
  { label: "List Your Brand", icon: CheckCircle2, hint: "Applications and brand profile questions" },
  { label: "Affiliate Program", icon: ArrowRight, hint: "Affiliate, creator, and regional partner questions" },
  { label: "Media and Press", icon: Newspaper, hint: "Press facts, interviews, and brand assets" },
  { label: "Complaints and Disputes", icon: ShieldAlert, hint: "Sensitive issues that need review" },
  { label: "General Inquiry", icon: MessageSquare, hint: "Anything else" },
];

function ContactPage() {
  const { user } = useAuth();
  const [category, setCategory] = useState(categories[0].label);
  const [form, setForm] = useState({
    fullName: user?.fullName || user?.name || "",
    email: user?.email || "",
    company: "",
    subject: "",
    message: "",
    consent: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [confirmation, setConfirmation] = useState<{ reference: string; expectedResponse: string } | null>(null);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const result = await submitContactMessage({ ...form, category });
      setConfirmation({ reference: result.reference, expectedResponse: result.expectedResponse });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "We could not submit your message right now.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--rb-bg-canvas)] text-white">
      <SiteHeader />
      <main className="container-app space-y-8 py-8 sm:py-12">
        <section className="rounded-[2rem] border border-white/10 bg-white/[0.045] p-6 shadow-[0_30px_100px_rgba(0,0,0,0.35)] md:p-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/15 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-violet-100 ring-1 ring-primary/20">
              <Mail className="h-3.5 w-3.5" />
              Contact
            </div>
            <h1 className="mt-5 text-4xl font-black leading-tight md:text-6xl">Let’s Talk</h1>
            <p className="mt-4 max-w-2xl text-base leading-8 text-white/68">
              Whether you are a trader seeking support, a brand exploring partnership opportunities, or a member of the media, the RebateBoard team is ready to help.
            </p>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="space-y-3">
            {categories.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => setCategory(item.label)}
                className={`flex w-full items-center gap-4 rounded-3xl border p-4 text-left transition ${
                  category === item.label
                    ? "border-primary/35 bg-primary/15"
                    : "border-white/10 bg-white/[0.04] hover:bg-white/[0.07]"
                }`}
              >
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white/8 text-violet-200 ring-1 ring-white/10">
                  <item.icon className="h-5 w-5" />
                </span>
                <span>
                  <span className="block text-sm font-black text-white">{item.label}</span>
                  <span className="mt-1 block text-xs leading-5 text-white/55">{item.hint}</span>
                </span>
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="rounded-[2rem] border border-white/10 bg-white/[0.045] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.28)] md:p-6">
            {confirmation ? (
              <div className="py-8 text-center">
                <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-emerald-500/15 text-emerald-200 ring-1 ring-emerald-300/25">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <h2 className="mt-5 text-2xl font-black">Message Received</h2>
                <p className="mt-3 text-sm leading-7 text-white/65">
                  Your reference number is <span className="font-mono font-bold text-white">{confirmation.reference}</span>. Expected response: {confirmation.expectedResponse}.
                </p>
              </div>
            ) : (
              <>
                <div>
                  <h2 className="text-2xl font-black">Send us a message</h2>
                  <p className="mt-2 text-sm text-white/60">Selected category: <span className="font-bold text-violet-100">{category}</span></p>
                </div>
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <Field label="Full name"><input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} className={inputCls} required /></Field>
                  <Field label="Email"><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputCls} required /></Field>
                  <Field label="Brand / company (optional)"><input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} className={inputCls} /></Field>
                  <Field label="Subject"><input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className={inputCls} required /></Field>
                  <Field label="Message" span><textarea rows={6} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className={inputCls} required /></Field>
                </div>
                <label className="mt-4 flex items-start gap-3 rounded-2xl bg-white/[0.035] p-3 text-xs leading-5 text-white/65 ring-1 ring-white/8">
                  <input type="checkbox" checked={form.consent} onChange={(e) => setForm({ ...form, consent: e.target.checked })} className="mt-1" />
                  I agree that RebateBoard may use these details to respond to this inquiry and route it to the right team.
                </label>
                {error && <p className="mt-3 rounded-2xl border border-rose-300/20 bg-rose-500/10 p-3 text-sm text-rose-100">{error}</p>}
                <button disabled={submitting} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full rb-gradient-primary px-5 py-3 text-sm font-black text-white disabled:opacity-60">
                  {submitting ? "Sending..." : "Send Message"} <ArrowRight className="h-4 w-4" />
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
