import { useEffect, useMemo, useState, type ReactNode } from "react";
import { BarChart3, ChevronDown, Lock, Megaphone, ShieldCheck, SlidersHorizontal, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { type CookieConsentCategory, type CookiePreferences, useCookieConsent } from "@/lib/cookie-consent";

type OptionalCategory = Exclude<CookieConsentCategory, "essential">;

const categoryConfig: Array<{
  id: CookieConsentCategory;
  title: string;
  description: string;
  details: string;
  icon: typeof ShieldCheck;
}> = [
  {
    id: "essential",
    title: "Essential",
    description: "Required for authentication, security, session management, and core platform features.",
    details: "Includes login sessions, account security, wallet integrity, load safety, and consent storage. These cannot be disabled.",
    icon: Lock,
  },
  {
    id: "functional",
    title: "Functional",
    description: "Remembers choices such as language, theme, filters, and selected preferences.",
    details: "Also covers optional embedded tools such as TradingView or YouTube where they are used as page functionality.",
    icon: SlidersHorizontal,
  },
  {
    id: "analytics",
    title: "Analytics",
    description: "Helps us understand how RebateBoard is used so we can improve performance and usability.",
    details: "Covers product analytics and traffic measurement when analytics tools or internal usage events are enabled.",
    icon: BarChart3,
  },
  {
    id: "personalization",
    title: "Personalization",
    description: "Supports tailored recommendations, dashboard ordering, and more relevant platform experiences.",
    details: "Used for non-essential preferences that make recommendations and content ordering more relevant to your trading profile.",
    icon: Sparkles,
  },
  {
    id: "marketing",
    title: "Marketing",
    description: "Supports campaign measurement, advertising, and remarketing where these tools are enabled.",
    details: "No advertising pixel is loaded by default in this launch build; this setting prepares your preference for future approved tools.",
    icon: Megaphone,
  },
];

export function CookieConsentManager() {
  return (
    <>
      <CookieConsentBanner />
      <CookiePreferencesModal />
    </>
  );
}

function CookieConsentBanner() {
  const { isLoaded, hasResponded, isPreferencesOpen, acceptAll, rejectOptional, openPreferences } = useCookieConsent();

  if (!isLoaded || hasResponded || isPreferencesOpen) return null;

  return (
    <section
      className="fixed inset-x-0 bottom-0 z-[2147482000] mx-auto max-w-3xl rounded-t-[28px] border border-white/10 bg-[rgba(13,12,20,0.88)] p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] text-white shadow-[0_20px_60px_rgba(0,0,0,0.46)] backdrop-blur-2xl sm:inset-x-3 sm:bottom-5 sm:rounded-[26px] sm:p-5"
      aria-label="Cookie consent"
    >
      <div className="pointer-events-none absolute inset-0 rounded-[inherit] bg-[radial-gradient(circle_at_14%_0%,rgba(126,77,255,0.16),transparent_38%),linear-gradient(135deg,rgba(255,255,255,0.055),transparent_38%)]" />
      <div className="relative grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-violet-300/20 bg-violet-500/12 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-violet-200">
            <ShieldCheck className="h-3.5 w-3.5" />
            Privacy control
          </div>
          <h2 className="text-xl font-bold">Your Privacy. Your Choice.</h2>
          <p className="mt-2 text-sm leading-6 text-white/68 sm:max-w-xl">
            RebateBoard uses essential technologies to keep the platform secure and optional cookies to improve functionality, analytics, and personalization.
          </p>
        </div>
        <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto] md:min-w-[430px] md:gap-3">
          <button type="button" onClick={acceptAll} className="rounded-full rb-gradient-primary px-5 py-3 text-sm font-bold text-white shadow-[0_14px_32px_rgba(90,34,241,0.30)] transition hover:brightness-110 focus-visible:ring-2 focus-visible:ring-violet-200/80">
            Accept All
          </button>
          <button type="button" onClick={rejectOptional} className="rounded-full border border-white/18 bg-white/[0.025] px-5 py-3 text-sm font-bold text-white/88 transition hover:border-violet-300/35 hover:bg-white/[0.07] focus-visible:ring-2 focus-visible:ring-white/50">
            Reject Optional
          </button>
          <button type="button" onClick={openPreferences} className="rounded-full px-4 py-3 text-sm font-bold text-violet-200 transition hover:bg-violet-500/12 hover:text-white focus-visible:ring-2 focus-visible:ring-violet-300/60 sm:px-3">
            Manage Preferences
          </button>
        </div>
      </div>
    </section>
  );
}

function CookiePreferencesModal() {
  const {
    preferences,
    isPreferencesOpen,
    closePreferences,
    acceptAll,
    rejectOptional,
    savePreferences,
  } = useCookieConsent();
  const [draft, setDraft] = useState<CookiePreferences>(preferences);

  useEffect(() => {
    if (isPreferencesOpen) setDraft(preferences);
  }, [isPreferencesOpen, preferences]);

  const setCategory = (category: OptionalCategory, value: boolean) => {
    setDraft((current) => ({ ...current, essential: true, [category]: value }));
  };

  const handleAcceptAll = () => {
    acceptAll();
    closePreferences();
  };

  const handleRejectOptional = () => {
    rejectOptional();
    closePreferences();
  };

  const handleSave = () => {
    savePreferences(draft);
    closePreferences();
  };

  return (
    <Dialog open={isPreferencesOpen} onOpenChange={(open) => (open ? undefined : closePreferences())}>
      <DialogContent className="cookie-preferences-modal z-[2147482100] !flex !max-h-[min(92dvh,760px)] max-w-2xl !overflow-hidden border-white/12 bg-[rgba(13,12,20,0.9)] p-0 text-white shadow-[0_24px_80px_rgba(0,0,0,0.52)] backdrop-blur-2xl max-sm:h-[calc(100dvh-0.75rem)] max-sm:w-[calc(100%-0.75rem)] [&>button.absolute]:right-4 [&>button.absolute]:top-4 [&>button.absolute]:h-11 [&>button.absolute]:w-11 [&>button.absolute]:bg-white/[0.06] [&>button.absolute]:text-white/82 [&>button.absolute]:ring-1 [&>button.absolute]:ring-white/12 [&>button.absolute_svg]:h-5 [&>button.absolute_svg]:w-5">
        <div className="pointer-events-none absolute inset-0 rounded-[inherit] bg-[radial-gradient(circle_at_18%_0%,rgba(126,77,255,0.16),transparent_36%),linear-gradient(135deg,rgba(255,255,255,0.06),transparent_42%)]" />
        <div className="relative flex min-h-0 flex-1 flex-col">
          <DialogHeader className="shrink-0 border-b border-white/10 px-5 py-4 pr-16 sm:px-6 sm:py-5">
            <div className="mb-2 inline-flex w-fit items-center gap-2 rounded-full border border-violet-300/20 bg-violet-500/12 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-violet-200">
              <ShieldCheck className="h-3.5 w-3.5" />
              RebateBoard privacy
            </div>
            <DialogTitle className="text-[1.55rem] font-bold leading-tight sm:text-2xl">Cookie Preferences</DialogTitle>
            <DialogDescription className="max-w-xl text-sm leading-6 text-white/64">
              Choose which optional technologies RebateBoard may use. Essential technologies remain active because they are required for security and core platform operation.
            </DialogDescription>
          </DialogHeader>

          <div className="mobile-scroll min-h-0 flex-1 space-y-2.5 overflow-y-auto px-5 py-3.5 sm:px-6 sm:py-4">
            {categoryConfig.map((category) => (
              <CookieCategoryRow
                key={category.id}
                category={category}
                checked={draft[category.id]}
                onCheckedChange={(value) => {
                  if (category.id !== "essential") setCategory(category.id, value);
                }}
              />
            ))}
          </div>

          <div className="shrink-0 border-t border-white/14 bg-[rgba(8,8,13,0.78)] p-4 shadow-[0_-18px_42px_rgba(0,0,0,0.34)] backdrop-blur-xl sm:p-5">
            <div className="grid gap-2 sm:grid-cols-3 sm:gap-3">
              <button type="button" onClick={handleSave} className="rounded-full rb-gradient-primary px-4 py-3 text-sm font-bold text-white shadow-[0_14px_28px_rgba(90,34,241,0.24)] transition hover:brightness-110">
                Save Preferences
              </button>
              <button type="button" onClick={handleAcceptAll} className="rounded-full border border-violet-300/28 bg-violet-500/12 px-4 py-3 text-sm font-bold text-violet-100 transition hover:bg-violet-500/18">
                Accept All
              </button>
              <button type="button" onClick={handleRejectOptional} className="rounded-full border border-white/14 bg-white/[0.035] px-4 py-3 text-sm font-bold text-white/82 transition hover:bg-white/[0.07]">
                Reject Optional
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CookieCategoryRow({
  category,
  checked,
  onCheckedChange,
}: {
  category: (typeof categoryConfig)[number];
  checked: boolean;
  onCheckedChange: (value: boolean) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const Icon = category.icon;
  const isEssential = category.id === "essential";
  const isEnabled = checked || isEssential;
  const statusLabel = isEssential ? "Always Active" : isEnabled ? "Allowed" : "Blocked";

  return (
    <div className={cn("rounded-2xl border p-3.5 transition-colors sm:p-4", isEssential ? "border-white/12 bg-white/[0.045]" : "border-white/10 bg-white/[0.032]")}>
      <div className="flex items-start gap-3">
        <div className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-2xl border", isEssential ? "border-white/14 bg-white/[0.055] text-white/76" : "border-violet-300/18 bg-violet-500/12 text-violet-200")}>
          <Icon className="h-[18px] w-[18px]" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-bold text-white">{category.title}</h3>
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold",
                    isEssential
                      ? "bg-white/[0.075] text-white/70 ring-1 ring-white/12"
                      : isEnabled
                        ? "bg-emerald-400/12 text-emerald-200 ring-1 ring-emerald-300/18"
                        : "bg-white/[0.055] text-white/54 ring-1 ring-white/10",
                  )}
                >
                  {isEssential ? <Lock className="h-3 w-3" /> : null}
                  {statusLabel}
                </span>
              </div>
              <p className="mt-1 text-sm leading-5 text-white/60">{category.description}</p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              <Switch
                checked={isEnabled}
                disabled={isEssential}
                onCheckedChange={onCheckedChange}
                aria-label={`${category.title} cookies ${statusLabel}`}
                className={cn(
                  "data-[state=checked]:bg-violet-500",
                  isEssential ? "cursor-not-allowed opacity-60 data-[state=checked]:bg-white/22" : "",
                )}
              />
              {isEssential ? <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/38">Locked</span> : null}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setExpanded((current) => !current)}
            className="mt-2.5 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-violet-200 transition hover:text-white"
            aria-expanded={expanded}
          >
            {expanded ? "Hide details" : "View details"}
            <ChevronDown className={cn("h-3.5 w-3.5 transition-transform duration-200", expanded ? "rotate-180" : "rotate-0")} />
          </button>
          <div
            className={cn(
              "grid transition-[grid-template-rows,opacity] duration-200 ease-out",
              expanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
            )}
          >
            <div className="min-h-0 overflow-hidden">
              <p className="pt-2 text-xs leading-5 text-white/50">{category.details}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function CookiePreferencesTrigger({ className, children }: { className?: string; children?: ReactNode }) {
  const { openPreferences } = useCookieConsent();
  return (
    <button type="button" onClick={openPreferences} className={cn("transition hover:text-foreground", className)}>
      {children ?? "Cookie Preferences"}
    </button>
  );
}

export function ConsentGate({
  category,
  children,
  fallback,
}: {
  category: OptionalCategory;
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { preferences, openPreferences } = useCookieConsent();
  const allowed = preferences[category] === true;

  const defaultFallback = useMemo(
    () => (
      <div className="grid min-h-[220px] place-items-center rounded-3xl border border-white/10 bg-white/[0.035] p-6 text-center">
        <div>
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl border border-violet-300/18 bg-violet-500/12 text-violet-200">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <h3 className="mt-4 text-lg font-bold text-white">Optional content is paused</h3>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-white/58">
            Enable {category} cookies to load this third-party content.
          </p>
          <button type="button" onClick={openPreferences} className="mt-4 rounded-full rb-gradient-primary px-5 py-2.5 text-sm font-bold text-white">
            Manage Preferences
          </button>
        </div>
      </div>
    ),
    [category, openPreferences],
  );

  return allowed ? <>{children}</> : <>{fallback ?? defaultFallback}</>;
}
