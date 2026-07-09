import { createFileRoute, useNavigate, Link, useSearch } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { useAuth } from "../lib/auth";
import { Sparkles, Mail, Lock, ArrowRight, ShieldCheck } from "lucide-react";
import { Logo } from "../components/Logo";
import { useI18n } from "../lib/i18n";

type LoginSearch = { reauth?: string; email?: string; redirect?: string };

export const Route = createFileRoute("/login" as any)({
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
      setError(ex instanceof Error ? ex.message : t("auth.loginFailed"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      <div className="glow-orb left-[-10%] top-[10%] h-[400px] w-[400px]" />
      <div className="glow-orb right-[-10%] bottom-[5%] h-[500px] w-[500px]" />

      <div className="container-app relative z-10 flex min-h-screen max-w-6xl items-center justify-center py-10">
        <div className="grid w-full gap-8 lg:grid-cols-2 lg:gap-16">
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
              {["auth.rebeta", "auth.trueRoi", "auth.riskGuardrails", "auth.rrRewards"].map((key) => (
                <span key={key} className="glass-pill rounded-full px-3 py-1.5 text-xs text-white/90">
                  <Sparkles className="mr-1 inline h-3 w-3 text-accent" />
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
                <label className="mb-1.5 block text-xs text-muted-foreground">{t("auth.password")}</label>
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
                className="group flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-fuchsia-500 to-violet-600 px-4 py-3 text-sm font-semibold text-white shadow-[0_0_30px_rgba(192,132,252,0.45)] transition hover:opacity-95 disabled:opacity-60"
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
    </div>
  );
}
