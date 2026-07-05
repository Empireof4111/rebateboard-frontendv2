import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  ArrowRight, ArrowLeft, Check, Sparkles, Mail, Lock, User as UserIcon,
  Globe, AtSign, ShieldCheck, Wallet, Gift, Compass, Building2,
  Eye, EyeOff, MailCheck, RefreshCcw,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import {
  useAuth, type Market, type TradingExperience, type MonthlyVolume,
  type AcquisitionSource, type PrimaryGoal, type OnboardingAnswers,
} from "@/lib/auth";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Create your account - RebateBoard" },
      { name: "description", content: "Join RebateBoard 2.0. Personalize your trader OS in under 2 minutes." },
      { property: "og:title", content: "Create your account - RebateBoard" },
      { property: "og:description", content: "Join RebateBoard 2.0. Personalize your trader OS in under 2 minutes." },
    ],
  }),
  component: SignupPage,
});

type Step = 1 | "verify" | 2 | 3;

const COUNTRIES = [
  "United States", "United Kingdom", "Canada", "Australia", "South Africa",
  "Nigeria", "Kenya", "Germany", "France", "Spain", "Italy", "Netherlands",
  "United Arab Emirates", "Saudi Arabia", "India", "Pakistan", "Singapore",
  "Hong Kong", "Japan", "Brazil", "Mexico", "Argentina", "Other",
];

const MARKETS: { id: Market; label: string; emoji: string }[] = [
  { id: "forex", label: "Forex", emoji: "\u{1F4B1}" },
  { id: "crypto", label: "Crypto", emoji: "\u20BF" },
  { id: "indices", label: "Indices", emoji: "\u{1F4C8}" },
  { id: "stocks", label: "Stocks", emoji: "\u{1F3DB}\uFE0F" },
  { id: "commodities", label: "Commodities", emoji: "\u{1F6E2}\uFE0F" },
  { id: "propfirms", label: "Prop Firms", emoji: "\u{1F3C6}" },
];

const PLATFORMS = [
  "FTMO", "MyForexFunds", "The5ers", "FundedNext", "E8 Funding",
  "IC Markets", "Pepperstone", "Exness", "OANDA", "XM",
  "Binance", "Bybit", "OKX", "Bitget", "Coinbase", "Kraken",
];

const EXPERIENCE: { id: TradingExperience; label: string; hint: string }[] = [
  { id: "beginner", label: "Beginner", hint: "0-6 months" },
  { id: "intermediate", label: "Intermediate", hint: "6-24 months" },
  { id: "advanced", label: "Advanced", hint: "2+ years" },
];

const VOLUME: { id: MonthlyVolume; label: string }[] = [
  { id: "lt1k", label: "Under $1k" },
  { id: "1k_10k", label: "$1k - $10k" },
  { id: "10k_50k", label: "$10k - $50k" },
  { id: "gt50k", label: "$50k+" },
];

const SOURCES: { id: AcquisitionSource; label: string }[] = [
  { id: "tiktok", label: "TikTok" },
  { id: "twitter", label: "Twitter (X)" },
  { id: "youtube", label: "YouTube" },
  { id: "google", label: "Google Search" },
  { id: "referral", label: "Friend / Referral" },
  { id: "other", label: "Other" },
];

const GOALS: { id: PrimaryGoal; label: string; emoji: string }[] = [
  { id: "reduce_costs", label: "Reduce trading costs", emoji: "\u{1F4B8}" },
  { id: "find_brokers", label: "Find better brokers", emoji: "\u{1F3E6}" },
  { id: "track_performance", label: "Track performance", emoji: "\u{1F4CA}" },
  { id: "earn_rewards", label: "Earn rewards / cashback", emoji: "\u{1F381}" },
  { id: "improve_strategy", label: "Improve strategy", emoji: "\u{1F9E0}" },
];

function SignupPage() {
  const {
    signup,
    setOnboarding,
    user,
    loading,
    pendingVerification,
    verifyOtp,
    resendOtp,
  } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>(1);

  useEffect(() => {
    if (loading) return;
    if (user && !user.onboardingCompleted) {
      setStep(pendingVerification ? "verify" : 2);
    }
  }, [loading, pendingVerification, user]);

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      <div className="glow-orb left-[-10%] top-[10%] h-[400px] w-[400px]" />
      <div className="glow-orb right-[-10%] bottom-[5%] h-[500px] w-[500px]" />

      <div className="container-app relative z-10 flex min-h-screen max-w-3xl flex-col items-center justify-center py-10">
        <Link to="/" className="mb-6 inline-flex items-center gap-3" aria-label="RebateBoard home">
          <Logo heightClass="h-10" />
        </Link>

        <Stepper step={step} />

        <div className="glass-strong mt-6 w-full rounded-3xl p-6 md:p-8">
          {step === 1 && (
            <StepAccount
              onDone={async (input) => {
                const u = await signup(input);
                import("@/lib/referral-store").then(({ recordReferralSignup }) =>
                  recordReferralSignup({ refereeName: u.fullName ?? u.name, refereeEmail: u.email }),
                );
                setStep("verify");
              }}
            />
          )}
          {step === "verify" && (
            <StepVerifyEmail
              email={user?.email ?? ""}
              onVerified={async (otp) => {
                await verifyOtp(otp);
                setStep(2);
              }}
              onResend={async () => {
                await resendOtp();
              }}
              onChangeEmail={() => setStep(1)}
            />
          )}
          {step === 2 && (
            <StepQuestionnaire
              initial={user?.onboarding}
              onSkip={async () => {
                await setOnboarding(emptyAnswers(), false);
                setStep(3);
              }}
              onSubmit={async (answers) => {
                await setOnboarding(answers, true);
                setStep(3);
              }}
              onBack={() => setStep(1)}
            />
          )}
          {step === 3 && (
            <StepSuccess
              name={user?.name ?? "Trader"}
              walletId={user?.walletId ?? "-"}
              onExplore={() => navigate({ to: "/dashboard" })}
              onConnect={() => navigate({ to: "/dashboard/accounts" })}
              onOffers={() => navigate({ to: "/dashboard/wallet" })}
            />
          )}
        </div>

        {step === 1 && (
          <p className="mt-4 text-center text-xs text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="text-white underline-offset-2 hover:underline">Sign in</Link>
          </p>
        )}
      </div>
    </div>
  );
}

function emptyAnswers(): OnboardingAnswers {
  return {
    preferredMarkets: [],
    currentPlatform: "",
    tradingExperience: null,
    monthlyVolume: null,
    acquisitionSource: null,
    primaryGoal: null,
  };
}

function Stepper({ step }: { step: Step }) {
  const stepNum: number = step === "verify" ? 1 : (step as number);
  const items = [
    { n: 1, label: step === "verify" ? "Verify email" : "Account" },
    { n: 2, label: "Personalize" },
    { n: 3, label: "Done" },
  ];
  return (
    <div className="flex w-full max-w-md items-center justify-between">
      {items.map((it, i) => {
        const active = stepNum === it.n;
        const done = stepNum > it.n;
        return (
          <div key={it.n} className="flex flex-1 items-center">
            <div className="flex flex-col items-center">
              <div
                className={`grid h-8 w-8 place-items-center rounded-full text-xs font-semibold transition ${
                  done
                    ? "bg-emerald-500 text-white"
                    : active
                    ? "bg-gradient-to-r from-fuchsia-500 to-violet-600 text-white shadow-[0_0_18px_rgba(192,132,252,0.5)]"
                    : "bg-white/10 text-white/60"
                }`}
              >
                {done ? <Check className="h-4 w-4" /> : it.n}
              </div>
              <div className={`mt-1 text-[10px] ${active ? "text-white" : "text-white/50"}`}>{it.label}</div>
            </div>
            {i < items.length - 1 && (
              <div className={`mx-2 h-px flex-1 ${stepNum > it.n ? "bg-emerald-500/60" : "bg-white/10"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function StepAccount({
  onDone,
}: {
  onDone: (input: {
    fullName: string;
    email: string;
    password: string;
    username?: string;
    country?: string;
    marketingOptIn: boolean;
  }) => Promise<void>;
}) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [country, setCountry] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [agree, setAgree] = useState(false);
  const [marketing, setMarketing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (country || typeof navigator === "undefined") return;
    try {
      const region = new Intl.Locale(navigator.language).maximize().region;
      const map: Record<string, string> = {
        US: "United States", GB: "United Kingdom", CA: "Canada", AU: "Australia",
        ZA: "South Africa", NG: "Nigeria", KE: "Kenya", DE: "Germany",
        FR: "France", ES: "Spain", IT: "Italy", NL: "Netherlands",
        AE: "United Arab Emirates", SA: "Saudi Arabia", IN: "India", PK: "Pakistan",
        SG: "Singapore", HK: "Hong Kong", JP: "Japan", BR: "Brazil",
        MX: "Mexico", AR: "Argentina",
      };
      if (region && map[region]) setCountry(map[region]);
    } catch {}
  }, [country]);

  function validate(): string | null {
    if (!fullName.trim()) return "Please enter your full name.";
    if (!/^\S+@\S+\.\S+$/.test(email)) return "Enter a valid email address.";
    if (password.length < 8) return "Password must be at least 8 characters.";
    if (!/[A-Z]/.test(password) || !/\d/.test(password))
      return "Password needs at least 1 uppercase letter and 1 number.";
    if (password !== confirm) return "Passwords do not match.";
    if (!agree) return "You must agree to the Terms & Privacy.";
    return null;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const v = validate();
    if (v) {
      setError(v);
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await onDone({
        fullName: fullName.trim(),
        email: email.trim(),
        password,
        username: username.trim() || undefined,
        country: country || undefined,
        marketingOptIn: marketing,
      });
    } catch (ex) {
      setError(ex instanceof Error ? ex.message : "Unable to create your account.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-white">Create your account</h2>
      <p className="mt-1 text-sm text-muted-foreground">Fast to start. Smart to personalize.</p>

      <button
        type="button"
        disabled
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-white/45"
      >
        <GoogleIcon />
        Continue with Google
        <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-white/40">Soon</span>
      </button>
      <div className="my-5 flex items-center gap-3 text-[11px] text-white/40">
        <div className="h-px flex-1 bg-white/10" /> or sign up with email <div className="h-px flex-1 bg-white/10" />
      </div>

      <form onSubmit={onSubmit} className="grid gap-4 md:grid-cols-2">
        <Field label="Full name" icon={<UserIcon className="h-4 w-4" />} required>
          <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Jane Trader" className={inputCls} />
        </Field>
        <Field label="Email" icon={<Mail className="h-4 w-4" />} required>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@trader.com" className={inputCls} />
        </Field>
        <Field label="Username (optional)" icon={<AtSign className="h-4 w-4" />}>
          <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="@janetrader" className={inputCls} />
        </Field>
        <Field label="Country" icon={<Globe className="h-4 w-4" />}>
          <select value={country} onChange={(e) => setCountry(e.target.value)} className={inputCls}>
            <option value="">Select country...</option>
            {COUNTRIES.map((c) => <option key={c} value={c} className="bg-[#150829]">{c}</option>)}
          </select>
        </Field>
        <PasswordField
          label="Password"
          value={password}
          onChange={setPassword}
          placeholder="At least 8 chars, 1 uppercase, 1 number"
          required
        />
        <PasswordField
          label="Confirm password"
          value={confirm}
          onChange={setConfirm}
          placeholder="Re-enter your password"
          required
        />

        <div className="md:col-span-2 space-y-2 pt-1">
          <label className="flex items-start gap-2 text-xs text-white/80">
            <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-0.5 h-4 w-4 accent-fuchsia-500" />
            <span>I agree to the <a href="#" className="underline">Terms</a> & <a href="#" className="underline">Privacy Policy</a>.</span>
          </label>
          <label className="flex items-start gap-2 text-xs text-white/60">
            <input type="checkbox" checked={marketing} onChange={(e) => setMarketing(e.target.checked)} className="mt-0.5 h-4 w-4 accent-fuchsia-500" />
            <span>Send me product updates, offers, and rebate news.</span>
          </label>
        </div>

        {error && (
          <div className="md:col-span-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="md:col-span-2 group mt-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-fuchsia-500 to-violet-600 px-4 py-3 text-sm font-semibold text-white shadow-[0_0_30px_rgba(192,132,252,0.45)] transition hover:opacity-95 disabled:opacity-60"
        >
          {submitting ? "Creating account..." : "Continue"}
          <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
        </button>
      </form>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
      <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.4-1.6 4-5.5 4-3.3 0-6-2.7-6-6.1S8.7 5.9 12 5.9c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.4 14.6 2.5 12 2.5 6.8 2.5 2.6 6.7 2.6 12s4.2 9.5 9.4 9.5c5.4 0 9-3.8 9-9.2 0-.6-.1-1.1-.2-1.6H12z"/>
    </svg>
  );
}

const inputCls =
  "w-full rounded-xl border border-white/10 bg-white/[0.04] py-2.5 pl-10 pr-3 text-sm text-white placeholder:text-muted-foreground outline-none focus:border-primary/60";

function Field({
  label, icon, required, children,
}: { label: string; icon?: React.ReactNode; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs text-muted-foreground">
        {label} {required && <span className="text-fuchsia-400">*</span>}
      </label>
      <div className="relative">
        {icon && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{icon}</div>}
        {children}
      </div>
    </div>
  );
}

function PasswordField({
  label, value, onChange, placeholder, required,
}: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; required?: boolean }) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label className="mb-1.5 block text-xs text-muted-foreground">
        {label} {required && <span className="text-fuchsia-400">*</span>}
      </label>
      <div className="relative">
        <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder ?? "********"}
          autoComplete="new-password"
          className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-2.5 pl-10 pr-10 text-sm text-white placeholder:text-muted-foreground outline-none focus:border-primary/60"
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? "Hide password" : "Show password"}
          aria-pressed={show}
          className="absolute right-2.5 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-md text-muted-foreground transition hover:bg-white/10 hover:text-white"
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

function StepVerifyEmail({
  email,
  onVerified,
  onResend,
  onChangeEmail,
}: {
  email: string;
  onVerified: (otp: string) => Promise<void>;
  onResend: () => Promise<void>;
  onChangeEmail: () => void;
}) {
  const [entered, setEntered] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [resent, setResent] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);

  async function resend() {
    setResending(true);
    setError(null);
    try {
      await onResend();
      setEntered("");
      setResent(true);
    } catch (ex) {
      setError(ex instanceof Error ? ex.message : "Unable to resend your code.");
    } finally {
      setResending(false);
    }
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (entered.length !== 6) {
      setError("Enter the 6-digit code from your email.");
      return;
    }

    setError(null);
    setVerifying(true);
    try {
      await onVerified(entered);
    } catch (ex) {
      setError(ex instanceof Error ? ex.message : "Unable to verify your account.");
    } finally {
      setVerifying(false);
    }
  }

  return (
    <div>
      <div className="mb-5 flex items-start gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-fuchsia-500/30 to-violet-600/30 text-fuchsia-200">
          <MailCheck className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">Verify your email</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            We sent a 6-digit code to{" "}
            <span className="font-semibold text-white">{email || "your email"}</span>.
            Enter it below to confirm this address belongs to you.
          </p>
        </div>
      </div>

      <div className="mb-5 rounded-xl border border-cyan-400/20 bg-cyan-500/[0.06] px-3 py-2.5 text-[11px] text-cyan-100">
        Use the 6-digit code we sent to your inbox. If you're testing locally, the code may also appear in the backend terminal.
        {resent && <span className="ml-2 text-cyan-200/80">A fresh code has been sent.</span>}
      </div>

      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-xs text-muted-foreground">Verification code</label>
          <input
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={entered}
            onChange={(e) => setEntered(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="******"
            className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-center text-lg font-mono tracking-[0.5em] text-white placeholder:text-muted-foreground outline-none focus:border-primary/60"
          />
        </div>

        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={verifying}
          className="group flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-fuchsia-500 to-violet-600 px-4 py-3 text-sm font-semibold text-white shadow-[0_0_30px_rgba(192,132,252,0.45)] transition hover:opacity-95 disabled:opacity-60"
        >
          {verifying ? "Verifying..." : "Verify & continue"}
          <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
        </button>

        <div className="flex items-center justify-between text-xs">
          <button type="button" onClick={onChangeEmail} className="inline-flex items-center gap-1 text-muted-foreground hover:text-white">
            <ArrowLeft className="h-3.5 w-3.5" /> Wrong email? Edit
          </button>
          <button
            type="button"
            onClick={() => { void resend(); }}
            disabled={resending}
            className="inline-flex items-center gap-1 text-muted-foreground hover:text-white disabled:opacity-60"
          >
            <RefreshCcw className="h-3.5 w-3.5" /> {resending ? "Resending..." : "Resend code"}
          </button>
        </div>
      </form>
    </div>
  );
}

function StepQuestionnaire({
  initial, onSubmit, onSkip, onBack,
}: {
  initial?: OnboardingAnswers;
  onSubmit: (a: OnboardingAnswers) => Promise<void>;
  onSkip: () => Promise<void>;
  onBack: () => void;
}) {
  const [markets, setMarkets] = useState<Market[]>(initial?.preferredMarkets ?? []);
  const [platform, setPlatform] = useState<string>(initial?.currentPlatform ?? "");
  const [exp, setExp] = useState<TradingExperience | null>(initial?.tradingExperience ?? null);
  const [vol, setVol] = useState<MonthlyVolume | null>(initial?.monthlyVolume ?? null);
  const [src, setSrc] = useState<AcquisitionSource | null>(initial?.acquisitionSource ?? null);
  const [goal, setGoal] = useState<PrimaryGoal | null>(initial?.primaryGoal ?? null);
  const [showSuggest, setShowSuggest] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const platformSuggestions = useMemo(() => {
    if (!platform) return [];
    const q = platform.toLowerCase();
    return PLATFORMS.filter((p) => p.toLowerCase().includes(q)).slice(0, 6);
  }, [platform]);

  const canSubmit = markets.length > 0 && exp && goal;

  function toggleMarket(m: Market) {
    setMarkets((prev) => prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]);
  }

  async function submit() {
    if (!canSubmit) return;

    setSaving(true);
    setError(null);
    try {
      await onSubmit({
        preferredMarkets: markets,
        currentPlatform: platform.trim(),
        tradingExperience: exp,
        monthlyVolume: vol,
        acquisitionSource: src,
        primaryGoal: goal,
      });
    } catch (ex) {
      setError(ex instanceof Error ? ex.message : "Unable to save your onboarding answers.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Personalize RebateBoard</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Six quick questions. We'll use them to surface better brokers, ranked TBI brands, and rewards that fit you.
          </p>
        </div>
        <button onClick={() => { void onSkip(); }} className="text-xs text-muted-foreground hover:text-white">Skip for now -&gt;</button>
      </div>

      <div className="mt-6 space-y-7">
        <Question n={1} title="Which markets do you trade?" hint="Select all that apply." required>
          <div className="flex flex-wrap gap-2">
            {MARKETS.map((m) => {
              const on = markets.includes(m.id);
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => toggleMarket(m.id)}
                  className={`rounded-full border px-3 py-1.5 text-xs transition ${on ? "border-fuchsia-400/60 bg-fuchsia-500/15 text-white" : "border-white/10 bg-white/[0.04] text-white/70 hover:text-white"}`}
                >
                  <span className="mr-1">{m.emoji}</span>{m.label}
                </button>
              );
            })}
          </div>
        </Question>

        <Question n={2} title="Current broker, exchange, or prop firm?">
          <div className="relative">
            <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={platform}
              onChange={(e) => { setPlatform(e.target.value); setShowSuggest(true); }}
              onFocus={() => setShowSuggest(true)}
              onBlur={() => setTimeout(() => setShowSuggest(false), 150)}
              placeholder="Type or pick from list"
              className={inputCls}
            />
            {showSuggest && platformSuggestions.length > 0 && (
              <div className="glass-strong absolute z-20 mt-1 w-full rounded-xl p-1 text-sm">
                {platformSuggestions.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); setPlatform(p); setShowSuggest(false); }}
                    className="block w-full rounded-lg px-3 py-1.5 text-left text-white/90 hover:bg-white/10"
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}
          </div>
          <p className="mt-1 text-[11px] text-white/40">Not listed? Type manually.</p>
        </Question>

        <Question n={3} title="Trading experience" required>
          <ChipRow
            options={EXPERIENCE.map((x) => ({ id: x.id, label: x.label, hint: x.hint }))}
            value={exp}
            onChange={(v) => setExp(v as TradingExperience)}
          />
        </Question>

        <Question n={4} title="Monthly trading volume" hint="Optional - helps us match cashback tiers.">
          <ChipRow
            options={VOLUME.map((x) => ({ id: x.id, label: x.label }))}
            value={vol}
            onChange={(v) => setVol(v as MonthlyVolume)}
          />
        </Question>

        <Question n={5} title="How did you hear about us?">
          <ChipRow
            options={SOURCES.map((x) => ({ id: x.id, label: x.label }))}
            value={src}
            onChange={(v) => setSrc(v as AcquisitionSource)}
          />
        </Question>

        <Question n={6} title="Primary goal on RebateBoard" required>
          <div className="grid gap-2 sm:grid-cols-2">
            {GOALS.map((g) => {
              const on = goal === g.id;
              return (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setGoal(g.id)}
                  className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-sm transition ${on ? "border-fuchsia-400/60 bg-fuchsia-500/15 text-white" : "border-white/10 bg-white/[0.04] text-white/80 hover:text-white"}`}
                >
                  <span className="text-lg">{g.emoji}</span>
                  <span>{g.label}</span>
                </button>
              );
            })}
          </div>
        </Question>
      </div>

      {error && (
        <div className="mt-5 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">
          {error}
        </div>
      )}

      <div className="mt-8 flex items-center justify-between gap-3">
        <button onClick={onBack} className="inline-flex items-center gap-1 rounded-full px-3 py-2 text-xs text-white/60 hover:text-white">
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </button>
        <div className="flex items-center gap-2">
          <button onClick={() => { void onSkip(); }} className="rounded-full px-3 py-2 text-xs text-white/60 hover:text-white">Skip</button>
          <button
            onClick={() => { void submit(); }}
            disabled={!canSubmit || saving}
            className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-600 px-4 py-2.5 text-xs font-semibold text-white shadow-[0_0_22px_rgba(192,132,252,0.45)] transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Saving..." : "Finish setup"} <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

function Question({
  n, title, hint, required, children,
}: { n: number; title: string; hint?: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-2 flex items-baseline gap-2">
        <span className="text-[10px] font-semibold text-fuchsia-300/80">Q{n}</span>
        <h3 className="text-sm font-semibold text-white">
          {title} {required && <span className="text-fuchsia-400">*</span>}
        </h3>
      </div>
      {children}
      {hint && <p className="mt-1.5 text-[11px] text-white/40">{hint}</p>}
    </div>
  );
}

function ChipRow({
  options, value, onChange,
}: { options: { id: string; label: string; hint?: string }[]; value: string | null; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const on = value === o.id;
        return (
          <button
            key={o.id}
            type="button"
            onClick={() => onChange(o.id)}
            className={`rounded-full border px-3 py-1.5 text-xs transition ${on ? "border-fuchsia-400/60 bg-fuchsia-500/15 text-white" : "border-white/10 bg-white/[0.04] text-white/70 hover:text-white"}`}
          >
            {o.label}{o.hint && <span className="ml-1.5 text-white/40"> - {o.hint}</span>}
          </button>
        );
      })}
    </div>
  );
}

function StepSuccess({
  name, walletId, onExplore, onConnect, onOffers,
}: { name: string; walletId: string | number; onExplore: () => void; onConnect: () => void; onOffers: () => void }) {
  const first = name.split(" ")[0];
  return (
    <div className="text-center">
      <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-[0_0_40px_rgba(16,185,129,0.55)]">
        <Check className="h-8 w-8 text-white" />
      </div>
      <h2 className="mt-4 text-2xl font-bold text-white">You're in, {first}.</h2>
      <p className="mt-1 text-sm text-muted-foreground">Wallet, rewards, and your trader profile are ready. Let's start earning.</p>

      <div className="mx-auto mt-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] text-white/70">
        <Wallet className="h-3.5 w-3.5 text-emerald-400" />
        Wallet ID <span className="font-mono text-white">{walletId}</span>
        <span className="text-white/30">-</span>
        <Sparkles className="h-3.5 w-3.5 text-amber-300" /> RR balance 0
      </div>

      <div className="mt-7 grid gap-3 sm:grid-cols-3">
        <ActionCard
          icon={<Compass className="h-5 w-5 text-fuchsia-300" />}
          title="Explore Dashboard"
          desc="Your trader OS overview."
          primary
          onClick={onExplore}
        />
        <ActionCard
          icon={<Building2 className="h-5 w-5 text-cyan-300" />}
          title="Connect Broker"
          desc="Track ROI from day one."
          onClick={onConnect}
        />
        <ActionCard
          icon={<Gift className="h-5 w-5 text-emerald-300" />}
          title="View Cashback Offers"
          desc="Start earning rebates."
          onClick={onOffers}
        />
      </div>

      <p className="mt-6 inline-flex items-center gap-1.5 text-[11px] text-white/40">
        <ShieldCheck className="h-3 w-3" /> Your account is now connected to RebateBoard securely.
      </p>
    </div>
  );
}

function ActionCard({
  icon, title, desc, primary, onClick,
}: { icon: React.ReactNode; title: string; desc: string; primary?: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`group rounded-2xl border p-4 text-left transition ${primary ? "border-fuchsia-400/40 bg-gradient-to-br from-fuchsia-500/15 to-violet-600/10 hover:from-fuchsia-500/25" : "border-white/10 bg-white/[0.04] hover:bg-white/[0.08]"}`}
    >
      <div className="flex items-center justify-between">
        {icon}
        <ArrowRight className="h-4 w-4 text-white/40 transition group-hover:translate-x-0.5 group-hover:text-white" />
      </div>
      <div className="mt-3 text-sm font-semibold text-white">{title}</div>
      <div className="mt-0.5 text-[11px] text-white/60">{desc}</div>
    </button>
  );
}
