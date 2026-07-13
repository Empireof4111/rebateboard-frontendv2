export type LiveNotificationCategory =
  | "cashback"
  | "reviews"
  | "payouts"
  | "promotions"
  | "community"
  | "newBrands"
  | "rrRewards";

export type LiveNotificationPreferences = Record<LiveNotificationCategory, boolean>;

export const LIVE_NOTIFICATION_STORAGE_KEY = "rb_live_notification_preferences_v1";
export const LIVE_NOTIFICATION_EVENT = "rb-live-notification-preferences";

export const LIVE_NOTIFICATION_OPTIONS: Array<{
  key: LiveNotificationCategory;
  label: string;
  hint: string;
}> = [
  { key: "cashback", label: "Cashback", hint: "Cashback offers, claim reminders, and rebate activity." },
  { key: "reviews", label: "Reviews", hint: "Review approvals, proof updates, and community review activity." },
  { key: "payouts", label: "Payouts", hint: "Payout proof, withdrawal, and payment updates." },
  { key: "promotions", label: "Promotions", hint: "Featured campaigns, discounts, and limited-time offers." },
  { key: "community", label: "Community", hint: "Community milestones and social proof updates." },
  { key: "newBrands", label: "New Brands", hint: "New verified brands and directory additions." },
  { key: "rrRewards", label: "RR Rewards", hint: "Reward points, levels, streaks, and bonuses." },
];

export const DEFAULT_LIVE_NOTIFICATION_PREFERENCES: LiveNotificationPreferences =
  LIVE_NOTIFICATION_OPTIONS.reduce((acc, item) => {
    acc[item.key] = true;
    return acc;
  }, {} as LiveNotificationPreferences);

export function readLiveNotificationPreferences(): LiveNotificationPreferences {
  if (typeof window === "undefined") return DEFAULT_LIVE_NOTIFICATION_PREFERENCES;
  try {
    const parsed = JSON.parse(window.localStorage.getItem(LIVE_NOTIFICATION_STORAGE_KEY) || "{}");
    return {
      ...DEFAULT_LIVE_NOTIFICATION_PREFERENCES,
      ...(parsed && typeof parsed === "object" ? parsed : {}),
    };
  } catch {
    return DEFAULT_LIVE_NOTIFICATION_PREFERENCES;
  }
}

export function writeLiveNotificationPreferences(preferences: LiveNotificationPreferences) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LIVE_NOTIFICATION_STORAGE_KEY, JSON.stringify(preferences));
  window.dispatchEvent(new CustomEvent(LIVE_NOTIFICATION_EVENT, { detail: preferences }));
}

export function liveNotificationCategoryFor(input: {
  eventType?: string;
  title?: string;
  message?: string;
  sourceType?: string;
}): LiveNotificationCategory {
  const text = `${input.eventType || ""} ${input.title || ""} ${input.message || ""} ${input.sourceType || ""}`.toLowerCase();
  if (/(cashback|rebate|claim|offer|discount|coupon|deal)/.test(text)) {
    return /(offer|discount|coupon|deal|promo)/.test(text) ? "promotions" : "cashback";
  }
  if (/(review|proof|complaint|rating)/.test(text)) return "reviews";
  if (/(payout|withdraw|paid|payment)/.test(text)) return "payouts";
  if (/(community|comment|follower|member)/.test(text)) return "community";
  if (/(rr|reward|streak|level|points)/.test(text)) return "rrRewards";
  if (/(brand|listed|verified brand|new verified)/.test(text)) return "newBrands";
  return "promotions";
}
