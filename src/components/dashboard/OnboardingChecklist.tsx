import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  Circle,
  ClipboardCheck,
  CreditCard,
  FileText,
  LayoutDashboard,
  ShieldCheck,
  Star,
  Trophy,
  Wallet,
} from "lucide-react";
import { useMemo } from "react";
import { useAuth } from "@/lib/auth";

const VISIT_KEY = "rb_dashboard_guidance_v1";

type VisitFlags = {
  programs?: boolean;
  rebeta?: boolean;
};

export type DashboardChecklistSignals = {
  linkedAccounts?: number;
  reviews?: number;
  claims?: number;
  trades?: number;
  hasTradingPlan?: boolean;
  visitedPrograms?: boolean;
  triedRebeta?: boolean;
};

type ChecklistTask = {
  id: string;
  label: string;
  description: string;
  done: boolean;
  to: string;
  icon: typeof Circle;
};

function readVisits(): VisitFlags {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(VISIT_KEY) ?? "{}") as VisitFlags;
  } catch {
    return {};
  }
}

export function markDashboardVisit(key: keyof VisitFlags) {
  if (typeof window === "undefined") return;
  try {
    const current = readVisits();
    window.localStorage.setItem(VISIT_KEY, JSON.stringify({ ...current, [key]: true }));
  } catch {
    // Guidance should never block dashboard navigation.
  }
}

export function useDashboardChecklist(signals: DashboardChecklistSignals = {}) {
  const { user } = useAuth();
  const visits = readVisits();
  const profileCompletion = Number(user?.profileCompletion ?? 0);
  const tasks = useMemo<ChecklistTask[]>(() => {
    const verified = Number(user?.verified ?? 0) > 0 || user?.status === "active";
    const visitedPrograms = Boolean(signals.visitedPrograms || visits.programs);
    const triedRebeta = Boolean(signals.triedRebeta || visits.rebeta);
    return [
      {
        id: "profile",
        label: "Complete Profile",
        description: "Add your trading preferences and payout details.",
        done: profileCompletion >= 80 || Boolean(user?.onboardingCompleted),
        to: "/dashboard/profile",
        icon: ShieldCheck,
      },
      {
        id: "email",
        label: "Verify Email",
        description: "Secure your account and unlock account actions.",
        done: verified,
        to: "/dashboard/settings",
        icon: CheckCircle2,
      },
      {
        id: "account",
        label: "Link Trading Account",
        description: "Connect account details for cashback tracking.",
        done: Number(signals.linkedAccounts ?? 0) > 0,
        to: "/dashboard/wallet",
        icon: CreditCard,
      },
      {
        id: "programs",
        label: "Explore Programs",
        description: "Compare trusted brands and funding options.",
        done: visitedPrograms,
        to: "/dashboard/brands",
        icon: LayoutDashboard,
      },
      {
        id: "review",
        label: "Submit First Review",
        description: "Help improve public trust signals.",
        done: Number(signals.reviews ?? 0) > 0,
        to: "/dashboard/reviews",
        icon: Star,
      },
      {
        id: "cashback",
        label: "Claim First Cashback",
        description: "Submit a claim when you trade with a supported brand.",
        done: Number(signals.claims ?? 0) > 0,
        to: "/dashboard/claims",
        icon: Wallet,
      },
      {
        id: "plan",
        label: "Create Trading Plan",
        description: "Set rules before you start logging trades.",
        done: Boolean(signals.hasTradingPlan),
        to: "/dashboard/trading-plan",
        icon: FileText,
      },
      {
        id: "rebeta",
        label: "Try Rebeta AI",
        description: "Ask Rebeta for a trading or journal review.",
        done: triedRebeta,
        to: "/dashboard/ai-coach",
        icon: Bot,
      },
      {
        id: "rr",
        label: "Earn First RR",
        description: "Earn reward points from verified platform activity.",
        done: Number(user?.rrBalance ?? 0) > 0,
        to: "/dashboard/rewards",
        icon: Trophy,
      },
    ];
  }, [
    profileCompletion,
    signals.claims,
    signals.hasTradingPlan,
    signals.linkedAccounts,
    signals.reviews,
    signals.triedRebeta,
    signals.visitedPrograms,
    user?.onboardingCompleted,
    user?.rrBalance,
    user?.status,
    user?.verified,
    visits.programs,
    visits.rebeta,
  ]);

  const completed = tasks.filter((task) => task.done).length;
  const percent = Math.round((completed / tasks.length) * 100);
  const nextTask = tasks.find((task) => !task.done) ?? tasks[0];
  return { tasks, completed, total: tasks.length, percent, nextTask };
}

export function DashboardChecklist({
  signals,
  variant = "home",
}: {
  signals?: DashboardChecklistSignals;
  variant?: "home" | "settings";
}) {
  const checklist = useDashboardChecklist(signals);
  const visibleTasks = variant === "home"
    ? checklist.tasks.filter((task) => !task.done).slice(0, 5)
    : checklist.tasks;

  if (variant === "home" && checklist.completed === checklist.total) return null;

  return (
    <section className="glass overflow-hidden rounded-2xl border border-primary/20 p-4 sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary/15 text-violet-200 ring-1 ring-primary/25">
              <ClipboardCheck className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-sm font-semibold text-white">Launch Checklist</h2>
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-violet-100 ring-1 ring-white/10">
                  {checklist.completed} / {checklist.total} Completed
                </span>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Complete your setup to personalize RebateBoard, unlock rewards, and get cleaner recommendations.
              </p>
              <div className="mt-3 flex items-center gap-2">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-violet-500 to-violet-400 transition-[width] duration-500"
                    style={{ width: `${checklist.percent}%` }}
                  />
                </div>
                <span className="shrink-0 text-[11px] font-semibold tabular-nums text-violet-200">{checklist.percent}%</span>
              </div>
            </div>
          </div>

          <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {visibleTasks.map((task) => {
              const Icon = task.icon;
              return (
                <Link
                  key={task.id}
                  to={task.to as string}
                  className="group flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2.5 transition hover:border-primary/35 hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
                >
                  <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ring-1 ${
                    task.done
                      ? "bg-emerald-500/15 text-emerald-300 ring-emerald-400/20"
                      : "bg-primary/12 text-violet-200 ring-primary/20"
                  }`}>
                    {task.done ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-semibold text-white">{task.label}</span>
                    <span className="mt-0.5 line-clamp-1 block text-[11px] text-muted-foreground">{task.description}</span>
                  </span>
                  {!task.done && <ArrowRight className="h-3.5 w-3.5 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-violet-200" />}
                </Link>
              );
            })}
          </div>
        </div>

        <Link
          to={checklist.nextTask.to as string}
          className="inline-flex min-h-10 shrink-0 items-center justify-center gap-1.5 rounded-xl rb-gradient-primary px-4 py-2.5 text-xs font-semibold text-white shadow-[0_0_20px_rgba(192,132,252,0.35)] transition hover:brightness-110 active:scale-[0.99]"
        >
          {checklist.completed === checklist.total ? "Review Checklist" : checklist.nextTask.label}
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
      {variant === "settings" && (
        <p className="mt-3 text-[11px] text-muted-foreground">
          Completed checklists are hidden on the dashboard home, but you can always review your setup here.
        </p>
      )}
    </section>
  );
}
