import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Bell, ExternalLink, ShieldCheck, X } from "lucide-react";
import { Logo } from "@/components/Logo";
import {
  fetchPublicActivityEvents,
  fetchPublicCampaigns,
  trackPublicCampaignClick,
  trackPublicCampaignView,
  type PublicActivityEvent,
  type PublicCampaign,
} from "@/lib/public-engagement-api";
import { useAuth } from "@/lib/auth";
import { brandInitials, firstBrandText, resolveMediaUrl } from "@/lib/brand-assets";
import {
  LIVE_NOTIFICATION_EVENT,
  liveNotificationCategoryFor,
  readLiveNotificationPreferences,
  type LiveNotificationPreferences,
} from "@/lib/notification-preferences";

const POPUP_SUPPRESSED_ROUTES = [
  "/login",
  "/signup",
  "/review",
  "/business/onboarding",
  "/verify",
  "/admin",
  "/superadmin",
];

export function PublicEngagementLayer() {
  const location = useRouterState({ select: (state) => state.location });
  const { user } = useAuth();
  const route = location.pathname;
  const sensitive = POPUP_SUPPRESSED_ROUTES.some((path) => route.startsWith(path));
  const [campaign, setCampaign] = useState<PublicCampaign | null>(null);
  const [activity, setActivity] = useState<PublicActivityEvent | null>(null);
  const [activityQueue, setActivityQueue] = useState<PublicActivityEvent[]>([]);
  const [notificationPreferences, setNotificationPreferences] = useState<LiveNotificationPreferences>(() => readLiveNotificationPreferences());

  useEffect(() => {
    const refresh = () => setNotificationPreferences(readLiveNotificationPreferences());
    window.addEventListener("storage", refresh);
    window.addEventListener(LIVE_NOTIFICATION_EVENT, refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener(LIVE_NOTIFICATION_EVENT, refresh);
    };
  }, []);

  useEffect(() => {
    if (sensitive) return;
    let active = true;
    let timeout: number | undefined;
    let removeExitIntent: (() => void) | undefined;

    const showCampaign = (item: PublicCampaign) => {
      if (!active) return;
      setCampaign(item);
      void trackPublicCampaignView(item.id);
    };

    fetchPublicCampaigns(route, user ? "logged_in" : "guests").then((campaigns) => {
      if (!active) return;
      if (notificationPreferences.promotions === false) {
        setCampaign(null);
        return;
      }
      const eligible = campaigns
        .filter((item) => !isDismissed(item))
        .sort((a, b) => Number(b.priority ?? 0) - Number(a.priority ?? 0))[0];
      if (!eligible) {
        setCampaign(null);
        return;
      }

      const trigger = normalizeTrigger(eligible.trigger);
      if (trigger === "after-delay") {
        timeout = window.setTimeout(() => showCampaign(eligible), 10_000);
        return;
      }

      if (trigger === "exit-intent") {
        const onMouseOut = (event: MouseEvent) => {
          if (event.clientY > 24 || event.relatedTarget) return;
          showCampaign(eligible);
          removeExitIntent?.();
        };
        document.addEventListener("mouseout", onMouseOut);
        removeExitIntent = () => document.removeEventListener("mouseout", onMouseOut);

        // Touch devices do not have a reliable exit-intent signal.
        timeout = window.setTimeout(() => showCampaign(eligible), 12_000);
        return;
      }

      showCampaign(eligible);
    });
    return () => {
      active = false;
      if (timeout) window.clearTimeout(timeout);
      removeExitIntent?.();
    };
  }, [route, sensitive, user, notificationPreferences.promotions]);

  useEffect(() => {
    if (sensitive) return;
    let active = true;
    fetchPublicActivityEvents().then((events) => {
      if (active) {
        setActivityQueue(events.filter((event) => {
          const category = liveNotificationCategoryFor(event);
          return notificationPreferences[category] !== false && !isActivityDismissed(event);
        }));
      }
    });
    return () => {
      active = false;
    };
  }, [sensitive, route, notificationPreferences]);

  useEffect(() => {
    if (sensitive || campaign || activity || activityQueue.length === 0 || document.hidden) return;
    const timer = window.setTimeout(() => {
      setActivity(activityQueue[0]);
      setActivityQueue((current) => current.slice(1));
    }, 1600);
    return () => window.clearTimeout(timer);
  }, [activity, activityQueue, campaign, sensitive]);

  useEffect(() => {
    if (!activity) return;
    const timer = window.setTimeout(() => setActivity(null), 7600);
    return () => window.clearTimeout(timer);
  }, [activity]);

  const campaignHref = useMemo(() => normalizeHref(campaign?.primaryCtaUrl || "/"), [campaign]);
  const campaignExternal = isExternalHref(campaign?.primaryCtaUrl || "");
  const campaignImage = useMemo(() => resolveAssetUrl(campaign?.image), [campaign?.image]);

  if (sensitive) return null;

  return (
    <>
      {campaign && (
        <div className="fixed inset-0 z-[95] grid place-items-center bg-black/65 p-4 backdrop-blur-md" role="dialog" aria-modal="true">
          <div className="relative w-full max-w-xl overflow-hidden rounded-[2rem] border border-white/12 bg-[rgba(18,18,25,0.95)] p-5 text-white shadow-[0_40px_120px_rgba(0,0,0,0.45)]">
            <button
              type="button"
              onClick={() => dismissCampaign(campaign, setCampaign)}
              className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/15"
              aria-label="Close promotion"
            >
              <X className="h-4 w-4" />
            </button>
            {campaignImage && (
              <img src={campaignImage} alt="" className="mb-5 aspect-[16/7] w-full rounded-3xl object-cover ring-1 ring-white/10" />
            )}
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/15 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-violet-100 ring-1 ring-primary/25">
              <Bell className="h-3.5 w-3.5" />
              RebateBoard Update
            </div>
            <h2 className="mt-4 pr-10 text-2xl font-black leading-tight md:text-4xl">{campaign.headline}</h2>
            <p className="mt-3 text-sm leading-7 text-white/70">{campaign.supportingText}</p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              {campaignExternal ? (
                <a
                  href={campaign.primaryCtaUrl}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => {
                    void trackPublicCampaignClick(campaign.id);
                    dismissCampaign(campaign, setCampaign);
                  }}
                  className="inline-flex items-center justify-center gap-2 rounded-full rb-gradient-primary px-5 py-3 text-sm font-black text-white"
                >
                  {campaign.primaryCtaLabel || "Learn more"} <ExternalLink className="h-4 w-4" />
                </a>
              ) : (
                <Link
                  to={campaignHref}
                  onClick={() => {
                    void trackPublicCampaignClick(campaign.id);
                    dismissCampaign(campaign, setCampaign);
                  }}
                  className="inline-flex items-center justify-center gap-2 rounded-full rb-gradient-primary px-5 py-3 text-sm font-black text-white"
                >
                  {campaign.primaryCtaLabel || "Learn more"} <ExternalLink className="h-4 w-4" />
                </Link>
              )}
              <button
                type="button"
                onClick={() => dismissCampaign(campaign, setCampaign)}
                className="rounded-full border border-white/12 px-5 py-3 text-sm font-bold text-white/80 transition hover:bg-white/8"
              >
                Not now
              </button>
            </div>
          </div>
        </div>
      )}

      {activity && (
        <div className="fixed bottom-5 left-4 z-[80] w-[calc(100vw-2rem)] max-w-sm rounded-3xl border border-white/12 bg-[rgba(18,18,25,0.95)] p-4 text-white shadow-[0_24px_80px_rgba(0,0,0,0.38)] backdrop-blur-xl transition-all duration-300 md:bottom-6 md:left-6" aria-live="polite">
          <button
            type="button"
            onClick={() => dismissActivity(activity, setActivity)}
            className="absolute right-3 top-3 text-white/55 transition hover:text-white"
            aria-label="Dismiss activity"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="flex gap-3 pr-6">
            <ActivityLogo activity={activity} />
            <div>
              <div className="flex items-center gap-1.5 text-sm font-black">
                <ShieldCheck className="h-4 w-4 text-emerald-300" />
                {activity.title}
              </div>
              <p className="mt-1 text-xs leading-5 text-white/68">{activity.message}</p>
              {activity.destinationUrl && (
                isExternalHref(activity.destinationUrl) ? (
                  <a href={activity.destinationUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex text-xs font-bold text-violet-200 hover:text-white">
                    View details
                  </a>
                ) : (
                  <Link to={normalizeHref(activity.destinationUrl)} className="mt-2 inline-flex text-xs font-bold text-violet-200 hover:text-white">
                    View details
                  </Link>
                )
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function ActivityLogo({ activity }: { activity: PublicActivityEvent }) {
  const [failed, setFailed] = useState(false);
  const logoUrl = resolveAssetUrl(activity.logoUrl);
  const fallbackLabel = activity.sourceName || activity.brandName || brandNameFromMessage(activity.message) || activity.title;
  const initials = brandInitials(fallbackLabel);

  if (logoUrl && !failed) {
    return (
      <div className="h-11 w-11 shrink-0 overflow-hidden rounded-2xl bg-white/5">
        <img
          src={logoUrl}
          alt={`${fallbackLabel} logo`}
          className="h-full w-full object-cover"
          loading="lazy"
          onError={() => setFailed(true)}
        />
      </div>
    );
  }

  return (
    <div className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-2xl bg-primary/15 text-xs font-black uppercase text-violet-100">
      {initials ? <span>{initials}</span> : <Logo heightClass="h-5" showText={false} />}
    </div>
  );
}

function resolveAssetUrl(value?: string) {
  return resolveMediaUrl(value);
}

function brandNameFromMessage(message: string) {
  const match = message.match(/^(.+?)\s+(?:is|was|has)\s+/i);
  return match?.[1]?.trim() ?? "";
}

function normalizeHref(value: string) {
  if (!value || isExternalHref(value)) return "/" as const;
  return value as "/";
}

function isExternalHref(value: string) {
  return /^https?:\/\//i.test(value) || value.startsWith("mailto:");
}

function normalizeTrigger(value?: string) {
  const trigger = String(value || "").trim().toLowerCase();
  if (trigger.includes("10") || trigger.includes("delay") || trigger.includes("after")) return "after-delay";
  if (trigger.includes("exit")) return "exit-intent";
  return "on-load";
}

function getDismissalTtl(campaign: PublicCampaign) {
  const frequency = String(campaign.frequency || "").trim().toLowerCase();
  if (frequency.includes("session")) return "session";
  if (frequency.includes("always") || frequency.includes("every")) return 0;
  return 24 * 60 * 60 * 1000;
}

function isDismissed(campaign: PublicCampaign) {
  if (typeof window === "undefined") return false;
  const ttl = getDismissalTtl(campaign);
  if (ttl === 0) return false;
  if (ttl === "session") return window.sessionStorage.getItem(campaignDismissalKey(campaign)) === "1";

  const key = campaignDismissalKey(campaign);
  const last = Number(window.localStorage.getItem(key) || 0);
  return Date.now() - last < ttl;
}

function dismissCampaign(campaign: PublicCampaign, setCampaign: (campaign: PublicCampaign | null) => void) {
  try {
    const ttl = getDismissalTtl(campaign);
    if (ttl === "session") {
      window.sessionStorage.setItem(campaignDismissalKey(campaign), "1");
    } else if (ttl !== 0) {
      window.localStorage.setItem(campaignDismissalKey(campaign), String(Date.now()));
    }
  } catch {
    // ignore
  }
  setCampaign(null);
}

function campaignDismissalKey(campaign: PublicCampaign) {
  return `rb_campaign_${campaign.id}_${firstBrandText(campaign.updatedAt, campaign.startAt, campaign.headline)}`;
}

function isActivityDismissed(event: PublicActivityEvent) {
  if (typeof window === "undefined") return false;
  return window.sessionStorage.getItem(`rb_activity_${event.id}`) === "1";
}

function dismissActivity(event: PublicActivityEvent, setActivity: (event: PublicActivityEvent | null) => void) {
  try {
    window.sessionStorage.setItem(`rb_activity_${event.id}`, "1");
  } catch {
    // ignore
  }
  setActivity(null);
}
