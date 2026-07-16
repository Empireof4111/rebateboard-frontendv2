import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  ArrowRight, ArrowLeft, Check, Mail, Lock, User as UserIcon,
  Globe, AtSign, ShieldCheck, Wallet, Gift, Compass, Building2,
  Eye, EyeOff, MailCheck, RefreshCcw, Search, CircleAlert, CheckCircle2,
  BadgePercent, BarChart3, Bitcoin, Brain, ChartNoAxesCombined, Droplets,
  Landmark, SearchCheck, Trophy, type LucideIcon,
} from "lucide-react";
import { Logo } from "../components/Logo";
import {
  useAuth, type Market, type TradingExperience, type MonthlyVolume,
  type AcquisitionSource, type PrimaryGoal, type OnboardingAnswers,
  authErrorMessage, checkUsernameAvailability,
} from "../lib/auth";
import { fetchPublicAdminBrands, type AdminBrandRecord } from "../lib/admin-brands-api";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Create your account - RebateBoard" },
      { name: "description", content: "Join RebateBoard 2.0. Personalize your trading dashboard in under 2 minutes." },
      { property: "og:title", content: "Create your account - RebateBoard" },
      { property: "og:description", content: "Join RebateBoard 2.0. Personalize your trading dashboard in under 2 minutes." },
    ],
  }),
  component: SignupPage,
});

type Step = 1 | "verify" | 2 | 3;

const COUNTRY_CODES = [
  "AF", "AX", "AL", "DZ", "AS", "AD", "AO", "AI", "AQ", "AG", "AR", "AM", "AW", "AU", "AT", "AZ",
  "BS", "BH", "BD", "BB", "BY", "BE", "BZ", "BJ", "BM", "BT", "BO", "BQ", "BA", "BW", "BV", "BR",
  "IO", "BN", "BG", "BF", "BI", "CV", "KH", "CM", "CA", "KY", "CF", "TD", "CL", "CN", "CX", "CC",
  "CO", "KM", "CG", "CD", "CK", "CR", "CI", "HR", "CU", "CW", "CY", "CZ", "DK", "DJ", "DM", "DO",
  "EC", "EG", "SV", "GQ", "ER", "EE", "SZ", "ET", "FK", "FO", "FJ", "FI", "FR", "GF", "PF", "TF",
  "GA", "GM", "GE", "DE", "GH", "GI", "GR", "GL", "GD", "GP", "GU", "GT", "GG", "GN", "GW", "GY",
  "HT", "HM", "VA", "HN", "HK", "HU", "IS", "IN", "ID", "IR", "IQ", "IE", "IM", "IL", "IT", "JM",
  "JP", "JE", "JO", "KZ", "KE", "KI", "KP", "KR", "KW", "KG", "LA", "LV", "LB", "LS", "LR", "LY",
  "LI", "LT", "LU", "MO", "MG", "MW", "MY", "MV", "ML", "MT", "MH", "MQ", "MR", "MU", "YT", "MX",
  "FM", "MD", "MC", "MN", "ME", "MS", "MA", "MZ", "MM", "NA", "NR", "NP", "NL", "NC", "NZ", "NI",
  "NE", "NG", "NU", "NF", "MK", "MP", "NO", "OM", "PK", "PW", "PS", "PA", "PG", "PY", "PE", "PH",
  "PN", "PL", "PT", "PR", "QA", "RE", "RO", "RU", "RW", "BL", "SH", "KN", "LC", "MF", "PM", "VC",
  "WS", "SM", "ST", "SA", "SN", "RS", "SC", "SL", "SG", "SX", "SK", "SI", "SB", "SO", "ZA", "GS",
  "SS", "ES", "LK", "SD", "SR", "SJ", "SE", "CH", "SY", "TW", "TJ", "TZ", "TH", "TL", "TG", "TK",
  "TO", "TT", "TN", "TR", "TM", "TC", "TV", "UG", "UA", "AE", "GB", "US", "UM", "UY", "UZ", "VU",
  "VE", "VN", "VG", "VI", "WF", "EH", "YE", "ZM", "ZW",
];

const RegionDisplayNames = (Intl as typeof Intl & {
  DisplayNames: new (locales: string[], options: { type: "region" }) => { of(code: string): string | undefined };
}).DisplayNames;

const countryNames = new RegionDisplayNames(["en"], { type: "region" });

const COUNTRIES = COUNTRY_CODES
  .map((code) => ({
    code,
    name: countryNames.of(code) || code,
    flag: countryCodeToFlag(code),
  }))
  .sort((a, b) => a.name.localeCompare(b.name));

function countryCodeToFlag(code: string) {
  return code
    .toUpperCase()
    .replace(/./g, (char) => String.fromCodePoint(127397 + char.charCodeAt(0)));
}

const MARKETS: { id: Market; label: string; icon: LucideIcon }[] = [
  { id: "forex", label: "Forex", icon: BadgePercent },
  { id: "crypto", label: "Crypto", icon: Bitcoin },
  { id: "indices", label: "Indices", icon: ChartNoAxesCombined },
  { id: "stocks", label: "Stocks", icon: Landmark },
  { id: "commodities", label: "Commodities", icon: Droplets },
  { id: "futures", label: "Futures", icon: ChartNoAxesCombined },
  { id: "options", label: "Options", icon: Compass },
  { id: "propfirms", label: "Prop Firms", icon: Trophy },
];

type LiveOnboardingBrand = {
  id: string;
  name: string;
  category: string;
  slug?: string;
  logo?: string;
};

const MARKET_CATEGORY_PRIORITY: Record<Market, string[]> = {
  forex: ["Forex Broker"],
  crypto: ["Crypto Exchange", "Crypto Prop Firm"],
  propfirms: ["Prop Firm", "Futures Prop Firm", "Crypto Prop Firm"],
  futures: ["Futures Prop Firm", "Prop Firm", "Forex Broker"],
  options: ["Trading Platform", "Forex Broker"],
  indices: ["Forex Broker", "Prop Firm"],
  stocks: ["Stock Prop Firm", "Trading Platform", "Forex Broker"],
  commodities: ["Forex Broker", "Prop Firm"],
};

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

const GOALS: { id: PrimaryGoal; label: string; icon: LucideIcon }[] = [
  { id: "reduce_costs", label: "Reduce trading costs", icon: BadgePercent },
  { id: "find_brokers", label: "Find better brokers", icon: SearchCheck },
  { id: "track_performance", label: "Track performance", icon: BarChart3 },
  { id: "earn_rewards", label: "Cashback & RR rewards", icon: Gift },
  { id: "improve_strategy", label: "Improve strategy", icon: Brain },
  { id: "trading_psychology", label: "Trading psychology", icon: Brain },
  { id: "funded_accounts", label: "Funded accounts", icon: Trophy },
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

      <Link
        to="/"
        className="absolute left-4 top-4 z-20 inline-flex items-center gap-3 sm:left-6 sm:top-6"
        aria-label="RebateBoard home"
      >
        <Logo heightClass="h-8" />
      </Link>

      <div className="container-app relative z-10 flex min-h-screen max-w-3xl flex-col items-center justify-start pb-5 pt-12 md:pb-6 md:pt-14 lg:pt-16">
        <Stepper step={step} />

        <div className="glass-strong mt-2 w-full rounded-3xl p-3.5 md:p-4">
          {step === 1 && (
            <StepAccount
              onDone={async (input) => {
                await signup(input);
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
              rrBalance={user?.rrBalance ?? 0}
              onExplore={() => navigate({ to: "/dashboard" })}
              onConnect={() => navigate({ to: "/programs" as any })}
              onOffers={() => navigate({ to: "/dashboard/offers" as any })}
            />
          )}
        </div>

        {step === 1 && (
          <p className="mt-3 text-center text-xs text-muted-foreground">
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
    selectedBrandIds: [],
    currentBrands: [],
    otherBrands: [],
    tradingExperience: null,
    monthlyVolume: null,
    acquisitionSource: null,
    primaryGoal: null,
    interestGoals: [],
  };
}

function Stepper({ step }: { step: Step }) {
  const stepNum: number = step === "verify" ? 1 : (step as number);
  const items = [
    { n: 1, label: step === "verify" ? "Verify email" : "Account", desc: step === "verify" ? "Confirm access" : "Create your account" },
    { n: 2, label: "Personalize", desc: "Tell us about your trading" },
    { n: 3, label: "Done", desc: "Start exploring" },
  ];
  const progress = Math.round((stepNum / items.length) * 100);
  return (
    <div className="relative w-full max-w-lg px-2">
      <div className="mb-3 flex items-center justify-between text-[11px] font-semibold text-white/60">
        <span>Step {stepNum} of {items.length}</span>
        <span>{progress}% complete</span>
      </div>
      <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full rb-gradient-primary transition-all duration-300" style={{ width: `${progress}%` }} />
      </div>
      <div className="absolute left-[16.666%] right-[16.666%] top-[4.45rem] h-px bg-white/10" />
      <div
        className="absolute left-[16.666%] top-[4.45rem] h-px bg-emerald-500/60 transition-all duration-300"
        style={{ width: `${Math.max(0, ((stepNum - 1) / 2) * 66.666)}%` }}
      />
      <div className="relative grid grid-cols-3">
        {items.map((it) => {
          const active = stepNum === it.n;
          const done = stepNum > it.n;
          return (
            <div key={it.n} className="flex flex-col items-center text-center">
              <div
                className={`grid h-8 w-8 place-items-center rounded-full text-xs font-semibold transition ${
                  done
                    ? "bg-emerald-500 text-white"
                    : active
                    ? "rb-gradient-primary text-white shadow-[0_0_18px_rgba(192,132,252,0.5)]"
                    : "bg-white/10 text-white/60"
                }`}
              >
                {done ? <Check className="h-4 w-4" /> : it.n}
              </div>
              <div className={`mt-1 text-[10px] font-medium ${active ? "text-white" : "text-white/50"}`}>{it.label}</div>
              <div className={`hidden max-w-28 text-center text-[9px] sm:block ${active ? "text-white/60" : "text-white/35"}`}>{it.desc}</div>
            </div>
          );
        })}
      </div>
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
  const [usernameStatus, setUsernameStatus] = useState<
    "idle" | "invalid" | "checking" | "available" | "taken" | "error"
  >("idle");

  const normalizedUsername = username.trim();

  useEffect(() => {
    if (!normalizedUsername) {
      setUsernameStatus("idle");
      return;
    }

    if (!/^[A-Za-z0-9_]{3,24}$/.test(normalizedUsername)) {
      setUsernameStatus("invalid");
      return;
    }

    let cancelled = false;
    setUsernameStatus("checking");

    const timer = window.setTimeout(() => {
      void checkUsernameAvailability(normalizedUsername)
        .then((available) => {
          if (!cancelled) setUsernameStatus(available ? "available" : "taken");
        })
        .catch(() => {
          if (!cancelled) setUsernameStatus("error");
        });
    }, 420);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [normalizedUsername]);

  const usernameHelper = (() => {
    if (!normalizedUsername) return "Used for your public profile, reviews, and community identity.";
    if (usernameStatus === "invalid") return "Use 3-24 letters, numbers, or underscores.";
    if (usernameStatus === "checking") return "Checking username availability...";
    if (usernameStatus === "available") return "Username is available.";
    if (usernameStatus === "taken") return "That username is already taken.";
    if (usernameStatus === "error") return "We’ll verify this username when you continue.";
    return "Used for your public profile, reviews, and community identity.";
  })();

  function validate(): string | null {
    if (!fullName.trim()) return "Please enter your full name.";
    if (!/^\S+@\S+\.\S+$/.test(email)) return "Enter a valid email address.";
    if (normalizedUsername && usernameStatus === "invalid") return "Please use a valid username.";
    if (normalizedUsername && usernameStatus === "checking") return "Please wait while we check that username.";
    if (normalizedUsername && usernameStatus === "taken") return "That username is already taken. Please choose another one.";
    if (!isStrongPassword(password)) return "Please complete the password checklist.";
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
        username: normalizedUsername || undefined,
        country: country || undefined,
        marketingOptIn: marketing,
      });
    } catch (err) {
      setError(authErrorMessage(err, "signup"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-white md:text-2xl">Create your account</h2>
      <p className="mt-1 text-sm text-muted-foreground">Join RebateBoard and start making smarter trading decisions.</p>

      <button
        type="button"
        disabled
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-white/45"
      >
        <GoogleIcon />
        Continue with Google
        <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-white/40">Email only</span>
      </button>
      <div className="my-3 flex items-center gap-3 text-[11px] text-white/40">
        <div className="h-px flex-1 bg-white/10" /> or sign up with email <div className="h-px flex-1 bg-white/10" />
      </div>

      <form onSubmit={onSubmit} className="grid gap-2.5 md:grid-cols-2">
        <Field label="Full name" icon={<UserIcon className="h-4 w-4" />} required>
          <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Jane Trader" className={inputCls} />
        </Field>
        <Field label="Email" icon={<Mail className="h-4 w-4" />} required>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@trader.com" className={inputCls} />
        </Field>
        <Field
          label="Username (optional)"
          icon={<AtSign className="h-4 w-4" />}
          helper={usernameHelper}
          helperTone={
            usernameStatus === "available" ? "success" :
            usernameStatus === "taken" || usernameStatus === "invalid" ? "error" :
            "muted"
          }
        >
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value.replace(/\s+/g, ""))}
            placeholder="janetrader"
            className={`${inputCls} pr-10 ${
              usernameStatus === "available" ? "border-emerald-400/50" :
              usernameStatus === "taken" || usernameStatus === "invalid" ? "border-red-400/50" :
              ""
            }`}
          />
          {usernameStatus === "checking" && (
            <RefreshCcw className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-violet-200/70" />
          )}
          {usernameStatus === "available" && (
            <CheckCircle2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-300" />
          )}
          {(usernameStatus === "taken" || usernameStatus === "invalid") && (
            <CircleAlert className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-red-200" />
          )}
        </Field>
        <CountrySelect value={country} onChange={setCountry} />
        <div>
          <PasswordField
            label="Password"
            value={password}
            onChange={setPassword}
            placeholder="8+ chars, number, uppercase, special"
            required
          />
          <PasswordChecklist password={password} />
        </div>
        <PasswordField
          label="Confirm password"
          value={confirm}
          onChange={setConfirm}
          placeholder="Re-enter your password"
          required
        />

        <div className="md:col-span-2 space-y-2 pt-1">
          <label className="flex items-start gap-2 text-xs text-white/80">
            <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-0.5 h-4 w-4 accent-violet-500" />
            <span>I agree to the <a href="#" className="underline">Terms</a> & <a href="#" className="underline">Privacy Policy</a>.</span>
          </label>
          <label className="flex items-start gap-2 text-xs text-white/60">
            <input type="checkbox" checked={marketing} onChange={(e) => setMarketing(e.target.checked)} className="mt-0.5 h-4 w-4 accent-violet-500" />
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
          disabled={submitting || (Boolean(normalizedUsername) && usernameStatus === "checking")}
          className="md:col-span-2 group mt-0.5 flex items-center justify-center gap-2 rounded-xl rb-gradient-primary px-4 py-2.5 text-sm font-semibold text-white shadow-[0_0_30px_rgba(192,132,252,0.45)] transition hover:opacity-95 disabled:opacity-60"
        >
          {submitting ? "Creating account..." : "Continue"}
          <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
        </button>
      </form>
    </div>
  );
}


function isStrongPassword(password: string) {
  return (
    password.length >= 8 &&
    /[0-9]/.test(password) &&
    /[A-Z]/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
  );
}

function PasswordChecklist({ password }: { password: string }) {
  const rules = [
    { label: "8+ characters", ok: password.length >= 8 },
    { label: "One uppercase letter", ok: /[A-Z]/.test(password) },
    { label: "One number", ok: /[0-9]/.test(password) },
    { label: "One special character", ok: /[^A-Za-z0-9]/.test(password) },
  ];

  return (
    <div className="mt-1.5 grid gap-1 rounded-xl border border-white/10 bg-white/[0.03] p-1.5 sm:grid-cols-2">
      {rules.map((rule) => (
        <div key={rule.label} className={`flex items-center gap-2 text-[11px] ${rule.ok ? "text-emerald-200" : "text-white/45"}`}>
          {rule.ok ? <CheckCircle2 className="h-3.5 w-3.5" /> : <CircleAlert className="h-3.5 w-3.5" />}
          {rule.label}
        </div>
      ))}
    </div>
  );
}

function CountrySelect({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const selected = COUNTRIES.find((country) => country.name === value);
  const [query, setQuery] = useState(selected ? `${selected.flag} ${selected.name}` : "");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const next = COUNTRIES.find((country) => country.name === value);
    setQuery(next ? `${next.flag} ${next.name}` : "");
  }, [value]);

  const normalizedQuery = query.replace(/^[^A-Za-z]+/, "").trim().toLowerCase();
  const filtered = COUNTRIES.filter((country) =>
    !normalizedQuery ||
    country.name.toLowerCase().includes(normalizedQuery) ||
    country.code.toLowerCase().includes(normalizedQuery),
  ).slice(0, 12);

  return (
    <Field label="Country" icon={<Globe className="h-4 w-4" />}>
      <input
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
          if (!event.target.value.trim()) onChange("");
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 140)}
        placeholder="Search country..."
        className={inputCls}
      />
      {open && filtered.length > 0 && (
        <div className="glass-strong absolute z-30 mt-1 max-h-56 w-full overflow-y-auto rounded-xl p-1 text-sm">
          {filtered.map((country) => (
            <button
              key={country.code}
              type="button"
              onMouseDown={(event) => {
                event.preventDefault();
                onChange(country.name);
                setQuery(`${country.flag} ${country.name}`);
                setOpen(false);
              }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-white/90 hover:bg-white/10"
            >
              <span>{country.flag}</span>
              <span>{country.name}</span>
              <span className="ml-auto text-[10px] uppercase text-white/35">{country.code}</span>
            </button>
          ))}
        </div>
      )}
    </Field>
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
  "w-full rounded-xl border border-white/10 bg-white/[0.04] py-2 pl-10 pr-3 text-sm text-white placeholder:text-muted-foreground outline-none transition duration-200 focus:border-primary/60 focus:shadow-[0_0_0_4px_rgba(168,85,247,0.12)]";

function Field({
  label, icon, required, helper, helperTone = "muted", children,
}: {
  label: string;
  icon?: React.ReactNode;
  required?: boolean;
  helper?: React.ReactNode;
  helperTone?: "muted" | "success" | "error";
  children: React.ReactNode;
}) {
  const helperClass =
    helperTone === "success"
      ? "text-emerald-200/80"
      : helperTone === "error"
      ? "text-red-200/85"
      : "text-white/40";

  return (
    <div>
      <label className="mb-1.5 block text-xs text-muted-foreground">
        {label} {required && <span className="text-violet-400">*</span>}
      </label>
      <div className="relative">
        {icon && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{icon}</div>}
        {children}
      </div>
      {helper && <p className={`mt-1 text-[11px] ${helperClass}`}>{helper}</p>}
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
        {label} {required && <span className="text-violet-400">*</span>}
      </label>
      <div className="relative">
        <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder ?? "********"}
          autoComplete="new-password"
          className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-2 pl-10 pr-10 text-sm text-white placeholder:text-muted-foreground outline-none transition duration-200 focus:border-primary/60 focus:shadow-[0_0_0_4px_rgba(168,85,247,0.12)]"
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
    } catch (err) {
      const message = authErrorMessage(err, "verify");
      setError(
        message.includes("verify that code")
          ? "We couldn’t send your verification email right now. Please try again shortly."
          : message,
      );
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
    } catch (err) {
      const message = authErrorMessage(err, "verify");
      setError(
        message.includes("verify that code")
          ? "That code didn’t work. Please check it or request a fresh code."
          : message,
      );
    } finally {
      setVerifying(false);
    }
  }

  return (
    <div>
      <div className="mb-5 flex items-start gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[rgba(126,77,255,0.18)] text-violet-200">
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
        Use the 6-digit code we sent to your inbox.
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
          className="group flex w-full items-center justify-center gap-2 rounded-xl rb-gradient-primary px-4 py-3 text-sm font-semibold text-white shadow-[0_0_30px_rgba(192,132,252,0.45)] transition hover:opacity-95 disabled:opacity-60"
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
  const [selectedBrandIds, setSelectedBrandIds] = useState<string[]>(initial?.selectedBrandIds ?? []);
  const [otherBrandName, setOtherBrandName] = useState<string>(initial?.otherBrands?.[0] ?? "");
  const [brandQuery, setBrandQuery] = useState("");
  const [liveBrands, setLiveBrands] = useState<LiveOnboardingBrand[]>([]);
  const [brandsLoading, setBrandsLoading] = useState(true);
  const [exp, setExp] = useState<TradingExperience | null>(initial?.tradingExperience ?? null);
  const [vol, setVol] = useState<MonthlyVolume | null>(initial?.monthlyVolume ?? null);
  const [src, setSrc] = useState<AcquisitionSource | null>(initial?.acquisitionSource ?? null);
  const [goals, setGoals] = useState<PrimaryGoal[]>(initial?.interestGoals?.length ? initial.interestGoals : initial?.primaryGoal ? [initial.primaryGoal] : []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadBrands() {
      setBrandsLoading(true);
      try {
        const records = await fetchPublicAdminBrands();
        if (cancelled) return;
        setLiveBrands(records.map(toLiveOnboardingBrand).filter(Boolean) as LiveOnboardingBrand[]);
      } catch {
        if (!cancelled) setLiveBrands([]);
      } finally {
        if (!cancelled) setBrandsLoading(false);
      }
    }

    void loadBrands();
    return () => {
      cancelled = true;
    };
  }, []);

  const brandOptions = useMemo(() => {
    const priority = new Set(markets.flatMap((market) => MARKET_CATEGORY_PRIORITY[market] || []));
    const query = brandQuery.trim().toLowerCase();

    return [...liveBrands]
      .filter((brand) =>
        !query ||
        brand.name.toLowerCase().includes(query) ||
        brand.category.toLowerCase().includes(query),
      )
      .sort((a, b) => {
        const aPriority = priority.has(a.category) ? 0 : 1;
        const bPriority = priority.has(b.category) ? 0 : 1;
        if (aPriority !== bPriority) return aPriority - bPriority;
        return a.name.localeCompare(b.name);
      })
      .slice(0, 9);
  }, [brandQuery, liveBrands, markets]);

  const groupedBrandOptions = useMemo(() => {
    const selected = liveBrands.filter((brand) => selectedBrandIds.includes(brand.id));
    const popular = brandOptions.filter((brand) => !selectedBrandIds.includes(brand.id)).slice(0, 4);
    const suggested = brandOptions.filter((brand) => !selectedBrandIds.includes(brand.id) && !popular.some((item) => item.id === brand.id));
    return {
      recent: selected,
      popular,
      suggested,
    };
  }, [brandOptions, liveBrands, selectedBrandIds]);

  const canSubmit = markets.length > 0 && exp && goals.length > 0;

  function toggleMarket(m: Market) {
    setMarkets((prev) => prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]);
  }

  function toggleBrand(brand: LiveOnboardingBrand) {
    setSelectedBrandIds((prev) => {
      const next = prev.includes(brand.id) ? prev.filter((id) => id !== brand.id) : [...prev, brand.id];
      const names = liveBrands.filter((item) => next.includes(item.id)).map((item) => item.name);
      setPlatform(names.join(", "));
      return next;
    });
  }

  function toggleGoal(id: PrimaryGoal) {
    setGoals((prev) => prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]);
  }

  async function submit() {
    if (!canSubmit) return;

    setSaving(true);
    setError(null);
    try {
      await onSubmit({
        preferredMarkets: markets,
        currentPlatform: [platform.trim(), otherBrandName.trim()].filter(Boolean).join(", "),
        selectedBrandIds,
        currentBrands: liveBrands.filter((brand) => selectedBrandIds.includes(brand.id)),
        otherBrands: otherBrandName.trim() ? [otherBrandName.trim()] : [],
        tradingExperience: exp,
        monthlyVolume: vol,
        acquisitionSource: src,
        primaryGoal: goals[0] ?? null,
        interestGoals: goals,
      });
    } catch {
      setError("We couldn’t save your trading profile right now. Please try again shortly.");
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

      <div className="mt-5 space-y-5">
        <Question n={1} title="Which markets do you trade?" hint="Select all that apply." required>
          <div className="flex flex-wrap gap-2">
            {MARKETS.map((m) => {
              const on = markets.includes(m.id);
              const Icon = m.icon;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => toggleMarket(m.id)}
                  className={`rounded-full border px-3 py-1.5 text-xs transition ${on ? "border-violet-400/60 bg-violet-500/15 text-white" : "border-white/10 bg-white/[0.04] text-white/70 hover:text-white"}`}
                >
                  <Icon className={`mr-1.5 inline h-3.5 w-3.5 ${on ? "text-violet-100" : "text-violet-300"}`} />
                  {m.label}
                </button>
              );
            })}
          </div>
        </Question>

        <Question n={2} title="Which trading brands do you currently use?" hint="Live RebateBoard brands are prioritized by the markets you selected.">
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={brandQuery}
                onChange={(e) => setBrandQuery(e.target.value)}
                placeholder="Search brokers, prop firms, exchanges..."
                className={inputCls}
              />
            </div>

            <div className="space-y-3">
              {brandsLoading && (
                Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={`brand-skeleton-${index}`}
                    className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-3"
                  >
                    <div className="h-9 w-9 shrink-0 animate-pulse rounded-xl bg-white/10" />
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="h-3 w-2/3 animate-pulse rounded-full bg-white/10" />
                      <div className="h-2.5 w-1/2 animate-pulse rounded-full bg-white/[0.07]" />
                    </div>
                  </div>
                ))
              )}

              {!brandsLoading && (
                <>
                  <BrandOptionGroup title="Recent" brands={groupedBrandOptions.recent} selectedBrandIds={selectedBrandIds} onToggle={toggleBrand} />
                  <BrandOptionGroup title="Popular" brands={groupedBrandOptions.popular} selectedBrandIds={selectedBrandIds} onToggle={toggleBrand} />
                  <BrandOptionGroup title="Suggested" brands={groupedBrandOptions.suggested} selectedBrandIds={selectedBrandIds} onToggle={toggleBrand} />
                </>
              )}
            </div>

            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={otherBrandName}
                onChange={(event) => setOtherBrandName(event.target.value)}
                placeholder="Add another brand not listed yet (optional)"
                className={inputCls}
              />
            </div>
          </div>
        </Question>

        <Question n={3} title="Trading experience" required>
          <ChipRow
            options={EXPERIENCE.map((x) => ({ id: x.id, label: x.label, hint: x.hint }))}
            value={exp}
            onChange={(v) => setExp(v as TradingExperience)}
          />
        </Question>

        <Question n={4} title="Monthly trading volume" hint="Used to personalize cashback recommendations and trading insights.">
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

        <Question n={6} title="Interests and goals on RebateBoard" hint="Select all that apply. Your first choice becomes your primary goal." required>
          <div className="grid gap-2 sm:grid-cols-2">
            {GOALS.map((g) => {
              const on = goals.includes(g.id);
              const Icon = g.icon;
              return (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => toggleGoal(g.id)}
                  className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-sm transition duration-200 ${on ? "scale-[1.02] border-violet-400/60 bg-violet-500/15 text-white shadow-[0_0_18px_rgba(192,132,252,0.16)]" : "border-white/10 bg-white/[0.04] text-white/80 hover:text-white"}`}
                >
                  <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl ${on ? "bg-violet-500/25 text-violet-100" : "bg-violet-500/10 text-violet-300"}`}>
                    <Icon className="h-4 w-4" />
                  </span>
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

      <div className="mt-6 flex items-center justify-between gap-3">
        <button onClick={onBack} className="inline-flex items-center gap-1 rounded-full px-3 py-2 text-xs text-white/60 hover:text-white">
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </button>
        <div className="flex items-center gap-2">
          <button onClick={() => { void onSkip(); }} className="rounded-full px-3 py-2 text-xs text-white/60 hover:text-white">Skip</button>
          <button
            onClick={() => { void submit(); }}
            disabled={!canSubmit || saving}
            className="group inline-flex items-center gap-2 rounded-full rb-gradient-primary px-4 py-2.5 text-xs font-semibold text-white shadow-[0_0_22px_rgba(192,132,252,0.45)] transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Saving..." : "Finish setup"} <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
          </button>
        </div>
      </div>
    </div>
  );
}


function toLiveOnboardingBrand(brand: AdminBrandRecord): LiveOnboardingBrand | null {
  if (!brand?.id || !brand.name) return null;
  const identity = asRecord(brand.identity);
  const profile = asRecord(brand.profile);
  const logo =
    brand.thumbnail ||
    stringValue(identity.logo) ||
    stringValue(identity.logoUrl) ||
    stringValue(profile.logo) ||
    stringValue(profile.logoUrl);

  return {
    id: brand.id,
    name: brand.name,
    category: brand.category || "Other",
    slug: brand.slug,
    logo,
  };
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function stringValue(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function BrandLogo({ brand }: { brand: LiveOnboardingBrand }) {
  return brand.logo ? (
    <img
      src={brand.logo}
      alt={`${brand.name} logo`}
      className="h-9 w-9 shrink-0 rounded-xl object-cover ring-1 ring-white/10"
      loading="lazy"
    />
  ) : (
    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/[0.06] text-xs font-bold text-white ring-1 ring-white/10">
      {brand.name.slice(0, 2).toUpperCase()}
    </div>
  );
}

function BrandOptionGroup({
  title,
  brands,
  selectedBrandIds,
  onToggle,
}: {
  title: string;
  brands: LiveOnboardingBrand[];
  selectedBrandIds: string[];
  onToggle: (brand: LiveOnboardingBrand) => void;
}) {
  if (!brands.length) return null;

  return (
    <div className="space-y-2">
      <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/40">{title}</div>
      <div className="grid gap-2 sm:grid-cols-2">
        {brands.map((brand) => {
          const on = selectedBrandIds.includes(brand.id);
          return (
            <button
              key={`${title}-${brand.id}`}
              type="button"
              onClick={() => onToggle(brand)}
              className={`flex items-center gap-3 rounded-xl border p-3 text-left transition duration-200 ${on ? "scale-[1.01] border-violet-400/60 bg-violet-500/15 text-white shadow-[0_0_22px_rgba(90,34,241,0.18)]" : "border-white/10 bg-white/[0.04] text-white/80 hover:border-white/20 hover:bg-white/[0.07]"}`}
              aria-pressed={on}
            >
              <BrandLogo brand={brand} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">{brand.name}</span>
                <span className="block truncate text-[11px] text-white/45">{brand.category}</span>
              </span>
              <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border text-[10px] ${on ? "border-violet-300 bg-violet-500 text-white" : "border-white/15 text-white/35"}`}>
                {on ? <Check className="h-3 w-3" /> : "+"}
              </span>
            </button>
          );
        })}
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
        <span className="text-[10px] font-semibold text-violet-300/80">Q{n}</span>
        <h3 className="text-sm font-semibold text-white">
          {title} {required && <span className="text-violet-400">*</span>}
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
            className={`rounded-full border px-3 py-1.5 text-xs transition ${on ? "border-violet-400/60 bg-violet-500/15 text-white" : "border-white/10 bg-white/[0.04] text-white/70 hover:text-white"}`}
          >
            {o.label}{o.hint && <span className="ml-1.5 text-white/40"> - {o.hint}</span>}
          </button>
        );
      })}
    </div>
  );
}

function StepSuccess({
  name, walletId, rrBalance, onExplore, onConnect, onOffers,
}: {
  name: string;
  walletId: string | number;
  rrBalance: number;
  onExplore: () => void;
  onConnect: () => void;
  onOffers: () => void;
}) {
  return (
    <div className="text-center">
      <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-[0_0_40px_rgba(16,185,129,0.55)]">
        <Check className="h-8 w-8 text-white" />
      </div>
      <h2 className="mt-4 text-2xl font-bold text-white">Welcome to RebateBoard 🎉</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Your account is ready. Your wallet has been created, your trading profile has been personalized, and you can now explore trusted brands, earn cashback, and build your trading edge.
      </p>

      <div className="mx-auto mt-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] text-white/70">
        <Wallet className="h-3.5 w-3.5 text-emerald-400" />
        Wallet ID <span className="font-mono text-white">{walletId}</span>
        <span className="text-white/30">-</span>
        <Trophy className="h-3.5 w-3.5 text-violet-300" /> RR balance{" "}
        <span className="font-mono text-white">{Number(rrBalance || 0).toLocaleString()}</span>
      </div>

      <div className="mt-7 grid gap-3 sm:grid-cols-3">
        <ActionCard
          icon={<Compass className="h-5 w-5 text-violet-300" />}
          title="Go to Dashboard"
          desc="Your RebateBoard overview."
          primary
          onClick={onExplore}
        />
        <ActionCard
          icon={<Building2 className="h-5 w-5 text-cyan-300" />}
          title="Browse Programs"
          desc="Compare trusted trading brands."
          onClick={onConnect}
        />
        <ActionCard
          icon={<Gift className="h-5 w-5 text-emerald-300" />}
          title="Explore Cashback"
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
      className={`group rounded-2xl border p-4 text-left transition ${primary ? "border-violet-400/40 bg-gradient-to-br from-violet-500/15 to-violet-600/10 hover:from-violet-500/25" : "border-white/10 bg-white/[0.04] hover:bg-white/[0.08]"}`}
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
