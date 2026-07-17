export const REFERRAL_ATTRIBUTION_KEY = "rb_referral_attribution_v1";

export type StoredReferralAttribution = {
  token: string;
  code: string;
  source?: string;
  campaign?: string;
  expiresAt: string;
};

function parseStoredReferral(raw: string | null): StoredReferralAttribution | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as StoredReferralAttribution;
    if (!parsed?.token || !parsed?.expiresAt) return null;
    if (new Date(parsed.expiresAt).getTime() <= Date.now()) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function storeReferralAttribution(value: StoredReferralAttribution) {
  if (typeof window === "undefined") return;
  const raw = JSON.stringify(value);
  sessionStorage.setItem(REFERRAL_ATTRIBUTION_KEY, raw);
  localStorage.setItem(REFERRAL_ATTRIBUTION_KEY, raw);
}

export function readReferralAttribution(): StoredReferralAttribution | null {
  if (typeof window === "undefined") return null;
  const sessionValue = parseStoredReferral(sessionStorage.getItem(REFERRAL_ATTRIBUTION_KEY));
  if (sessionValue) return sessionValue;
  const localValue = parseStoredReferral(localStorage.getItem(REFERRAL_ATTRIBUTION_KEY));
  if (!localValue) clearReferralAttribution();
  return localValue;
}

export function clearReferralAttribution() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(REFERRAL_ATTRIBUTION_KEY);
  localStorage.removeItem(REFERRAL_ATTRIBUTION_KEY);
}
