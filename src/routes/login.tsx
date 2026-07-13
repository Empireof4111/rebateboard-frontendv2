import { createFileRoute, useNavigate, Link, useSearch } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { authErrorMessage, useAuth } from "../lib/auth";
import { Mail, Lock, ArrowRight, ShieldCheck, Brain, BarChart3, Gift, X, CheckCircle2, RotateCcw, type LucideIcon } from "lucide-react";
import { Logo } from "../components/Logo";
import { useI18n } from "../lib/i18n";
import { apiRequest } from "../lib/api";

type LoginSearch = { reauth?: string; email?: string; redirect?: string };

const LOGIN_FEATURES: { key: string; icon: LucideIcon }[] = [
  { key: "auth.rebeta", icon: Brain },
  { key: "auth.trueRoi", icon: BarChart3 },
  { key: "auth.riskGuardrails", icon: ShieldCheck },
  { key: "auth.rrRewards", icon: Gift },
];

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Login - RebateBoard" },
      { name: "description", content: "Sign in to your RebateBoard trader operating system." },
    ],
  }),
  validateSearch: (s: Record<string, unknown>): LoginSearch => ({
    reauth: typeof s.reauth === "string" ? s.reauth : undefined,
    email: typeof s.email === "string" ? s.email : undefined,
    redirect: typeof s.redirect === "string" ? s.redirect : undefined,
  }),
  component: LoginPage,
});

function LoginPage() {
  const { t } = useI18n();
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const search = useSearch({ from: "/login" }) as LoginSearch;
  const isReauth = search.reauth === "1" && !!user;
  const [email, setEmail] = useState(search.email || (isReauth ? user!.email : ""));
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recoveryOpen, setRecoveryOpen] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email || !password) {
      setError(t("auth.missingCredentials"));
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const nextUser = await login(email, password);
      const destination = search.redirect
        || (nextUser.role === "ADMIN"
          ? "/superadmin"
          : nextUser.onboardingCompleted
            ? "/dashboard"
            : "/signup");
      navigate({ to: destination as string });
    } catch (ex) {
      setError(authErrorMessage(ex, "login") || t("auth.loginFailed"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      <div className="glow-orb left-[-10%] top-[10%] h-[400px] w-[400px]" />
      <div className="glow-orb right-[-10%] bottom-[5%] h-[500px] w-[500px]" />

      <div className="container-app relative z-10 flex min-h-screen max-w-6xl items-center justify-center py-10">
        <div className="grid w-full gap-5 lg:grid-cols-2 lg:gap-16">
          <div className="flex items-center justify-between gap-3 lg:hidden">
            <Link to="/" className="inline-flex items-center" aria-label="RebateBoard home">
              <Logo heightClass="h-10" />
            </Link>
            <Link
              to="/"
              className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-white/72 transition hover:border-violet-300/30 hover:text-white"
            >
              &larr; {t("auth.home")}
            </Link>
          </div>

          <div className="hidden flex-col justify-center lg:flex">
            <Link to="/" className="mb-3 inline-flex items-center gap-3" aria-label="RebateBoard home">
              <Logo heightClass="h-11" />
            </Link>
            <p className="mb-8 max-w-md text-sm text-muted-foreground">
              Sign in to continue earning cashback and making smarter trading decisions.
            </p>
            <h1 className="text-gradient text-4xl font-bold leading-tight md:text-5xl">
              {t("auth.heroTitle")}
            </h1>
            <p className="mt-4 max-w-md text-sm text-muted-foreground">
              {t("auth.heroSubtitle")}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              {LOGIN_FEATURES.map(({ key, icon: Icon }) => (
                <span key={key} className="glass-pill rounded-full px-3 py-1.5 text-xs text-white/90">
                  <Icon className="mr-1 inline h-3 w-3 text-violet-300" />
                  {t(key)}
                </span>
              ))}
            </div>
          </div>

          <div className="glass-strong rounded-3xl p-6 md:p-8">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">
                {isReauth
                  ? `${t("auth.welcomeBack")}, ${(user!.fullName || user!.name).split(" ")[0]}`
                  : t("auth.welcomeBack")}
              </h2>
              <Link to="/" className="text-xs text-muted-foreground hover:text-white">
                &larr; {t("auth.home")}
              </Link>
            </div>
            <p className="mb-6 text-sm text-muted-foreground">
              Welcome back. Keep tracking rewards, cashback, and trusted brand insights.
            </p>

            {isReauth && (
              <div className="mb-5 flex items-start gap-2 rounded-xl border border-emerald-400/20 bg-emerald-500/[0.06] px-3 py-2.5 text-[11px] text-emerald-100">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
                <span>{t("auth.reauthMessage")}</span>
              </div>
            )}

            <div className="mb-6 flex gap-1 rounded-full bg-white/5 p-1">
              <div className="flex-1 rounded-full bg-white/15 px-3 py-1.5 text-center text-xs font-medium text-white">
                {t("auth.loginTab")}
              </div>
              <Link
                to="/signup"
                className="flex-1 rounded-full px-3 py-1.5 text-center text-xs font-medium text-muted-foreground hover:text-white"
              >
                {t("auth.signupTab")}
              </Link>
            </div>

            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs text-muted-foreground">{t("auth.email")}</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder={t("auth.emailPlaceholder")}
                    className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-muted-foreground outline-none focus:border-primary/60"
                  />
                </div>
              </div>
              <div>
                <div className="mb-1.5 flex items-center justify-between gap-3">
                  <label className="block text-xs text-muted-foreground">{t("auth.password")}</label>
                  <button
                    type="button"
                    onClick={() => setRecoveryOpen(true)}
                    className="text-xs font-medium text-violet-200 transition hover:text-white"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder={t("auth.passwordPlaceholder")}
                    className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-muted-foreground outline-none focus:border-primary/60"
                  />
                </div>
              </div>

              {error && (
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="group flex w-full items-center justify-center gap-2 rounded-xl rb-gradient-primary px-4 py-3 text-sm font-semibold text-white shadow-[0_0_30px_rgba(192,132,252,0.45)] transition hover:opacity-95 disabled:opacity-60"
              >
                {submitting ? t("auth.loggingIn") : t("auth.loginButton")}
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </button>

              <p className="text-center text-[11px] text-muted-foreground">
                {t("auth.loginHelp")}
              </p>
            </form>
          </div>
        </div>
      </div>

      {recoveryOpen && (
        <ForgotPasswordModal
          initialIdentity={email}
          onClose={() => setRecoveryOpen(false)}
          onComplete={(identity) => {
            setEmail(identity);
            setPassword("");
            setRecoveryOpen(false);
          }}
        />
      )}
    </div>
  );
}

type RecoveryStep = "identity" | "otp" | "password" | "complete";

function ForgotPasswordModal({
  initialIdentity,
  onClose,
  onComplete,
}: {
  initialIdentity: string;
  onClose: () => void;
  onComplete: (identity: string) => void;
}) {
  const [step, setStep] = useState<RecoveryStep>("identity");
  const [identity, setIdentity] = useState(initialIdentity || "");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const cleanIdentity = identity.trim().toLowerCase();

  async function requestCode(event?: FormEvent) {
    event?.preventDefault();
    if (!cleanIdentity) {
      setError("Enter the email address on your RebateBoard account.");
      return;
    }

    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await apiRequest("/user/forgot-password", {
        method: "POST",
        body: { identity: cleanIdentity },
      });
      setStep("otp");
      setNotice(`We sent a verification code to ${cleanIdentity}.`);
    } catch (ex) {
      setError(authErrorMessage(ex, "verify") || "We could not send a reset code. Please check the email and try again.");
    } finally {
      setBusy(false);
    }
  }

  async function verifyCode(event: FormEvent) {
    event.preventDefault();
    if (!otp.trim()) {
      setError("Enter the verification code from your email.");
      return;
    }

    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await apiRequest("/user/verify-identity", {
        method: "POST",
        body: { identity: cleanIdentity, otp: otp.trim() },
      });
      setStep("password");
      setNotice("Code verified. Create a new password for your account.");
    } catch (ex) {
      setError(authErrorMessage(ex, "verify") || "That code is invalid or expired.");
    } finally {
      setBusy(false);
    }
  }

  async function resetPassword(event: FormEvent) {
    event.preventDefault();
    if (!isStrongRecoveryPassword(newPassword)) {
      setError("Use at least 8 characters with an uppercase letter, number, and special character.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await apiRequest("/user/reset-password", {
        method: "POST",
        body: { identity: cleanIdentity, newPassword },
      });
      setStep("complete");
    } catch (ex) {
      setError(authErrorMessage(ex, "signup") || "We could not reset your password. Please request a new code and try again.");
    } finally {
      setBusy(false);
    }
  }

  const progress = step === "identity" ? 1 : step === "otp" ? 2 : step === "password" ? 3 : 4;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 px-4 py-6 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="password-recovery-title">
      <div className="glass-strong w-full max-w-md rounded-3xl border border-white/10 p-5 shadow-2xl md:p-6">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-violet-200">Account Recovery</p>
            <h3 id="password-recovery-title" className="mt-2 text-2xl font-bold text-white">
              {step === "complete" ? "Password Updated" : "Reset Your Password"}
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {step === "identity" && "Enter your account email and we’ll send a secure verification code."}
              {step === "otp" && "Enter the code from your email to confirm this is your account."}
              {step === "password" && "Choose a strong new password for your RebateBoard account."}
              {step === "complete" && "Your password has been changed. You can now sign in with the new password."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/10 bg-white/5 p-2 text-muted-foreground transition hover:bg-white/10 hover:text-white"
            aria-label="Close password recovery"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mb-5 grid grid-cols-4 gap-2" aria-label={`Step ${progress} of 4`}>
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className={`h-1.5 rounded-full ${item <= progress ? "bg-violet-400" : "bg-white/10"}`}
            />
          ))}
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-100">
            {error}
          </div>
        )}

        {notice && (
          <div className="mb-4 rounded-xl border border-emerald-400/25 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-100">
            {notice}
          </div>
        )}

        {step === "identity" && (
          <form onSubmit={requestCode} className="space-y-4">
            <RecoveryField
              icon={Mail}
              label="Account email"
              type="email"
              value={identity}
              onChange={setIdentity}
              placeholder="you@example.com"
              autoComplete="email"
            />
            <RecoverySubmit busy={busy} label="Send Reset Code" busyLabel="Sending code..." />
          </form>
        )}

        {step === "otp" && (
          <form onSubmit={verifyCode} className="space-y-4">
            <RecoveryField
              icon={ShieldCheck}
              label="Verification code"
              value={otp}
              onChange={setOtp}
              placeholder="Enter your code"
              inputMode="numeric"
              autoComplete="one-time-code"
            />
            <RecoverySubmit busy={busy} label="Verify Code" busyLabel="Verifying..." />
            <button
              type="button"
              disabled={busy}
              onClick={() => void requestCode()}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-violet-100 transition hover:bg-white/10 disabled:opacity-60"
            >
              <RotateCcw className="h-4 w-4" />
              Resend code
            </button>
          </form>
        )}

        {step === "password" && (
          <form onSubmit={resetPassword} className="space-y-4">
            <RecoveryField
              icon={Lock}
              label="New password"
              type="password"
              value={newPassword}
              onChange={setNewPassword}
              placeholder="Create a strong password"
              autoComplete="new-password"
            />
            <RecoveryField
              icon={Lock}
              label="Confirm password"
              type="password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              placeholder="Re-enter password"
              autoComplete="new-password"
            />
            <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-[11px] text-muted-foreground">
              Use 8+ characters with an uppercase letter, number, and special character.
            </div>
            <RecoverySubmit busy={busy} label="Update Password" busyLabel="Updating..." />
          </form>
        )}

        {step === "complete" && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-2xl border border-emerald-400/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-50">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-300" />
              Your account is ready. Sign in with your new password.
            </div>
            <button
              type="button"
              onClick={() => onComplete(cleanIdentity)}
              className="flex w-full items-center justify-center gap-2 rounded-xl rb-gradient-primary px-4 py-3 text-sm font-semibold text-white transition hover:opacity-95"
            >
              Back to Login
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function RecoveryField({
  icon: Icon,
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  autoComplete,
  inputMode,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  inputMode?: "text" | "numeric" | "decimal" | "tel" | "search" | "email" | "url";
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs text-muted-foreground">{label}</span>
      <span className="relative block">
        <Icon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          required
          placeholder={placeholder}
          autoComplete={autoComplete}
          inputMode={inputMode}
          className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-muted-foreground outline-none transition focus:border-violet-400/70 focus:ring-2 focus:ring-violet-500/20"
        />
      </span>
    </label>
  );
}

function RecoverySubmit({ busy, label, busyLabel }: { busy: boolean; label: string; busyLabel: string }) {
  return (
    <button
      type="submit"
      disabled={busy}
      className="flex w-full items-center justify-center gap-2 rounded-xl rb-gradient-primary px-4 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(90,34,241,0.28)] transition hover:opacity-95 disabled:opacity-60"
    >
      {busy ? busyLabel : label}
      {!busy && <ArrowRight className="h-4 w-4" />}
    </button>
  );
}

function isStrongRecoveryPassword(password: string) {
  return (
    password.length >= 8 &&
    /[0-9]/.test(password) &&
    /[A-Z]/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
  );
}
