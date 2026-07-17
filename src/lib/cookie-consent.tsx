import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export const COOKIE_CONSENT_VERSION = 1;
export const COOKIE_CONSENT_STORAGE_KEY = "rb_cookie_consent_v1";
const COOKIE_CONSENT_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

export type CookieConsentCategory =
  | "essential"
  | "functional"
  | "analytics"
  | "personalization"
  | "marketing";

export type CookiePreferences = {
  essential: true;
  functional: boolean;
  analytics: boolean;
  personalization: boolean;
  marketing: boolean;
};

export type StoredCookieConsent = {
  version: number;
  preferences: CookiePreferences;
  consentMode: "accept_all" | "reject_optional" | "custom";
  updatedAt: string;
};

export interface ConsentStorageAdapter {
  load(): Promise<StoredCookieConsent | null>;
  save(consent: StoredCookieConsent): Promise<void>;
  clear(): Promise<void>;
}

export const DEFAULT_COOKIE_PREFERENCES: CookiePreferences = {
  essential: true,
  functional: false,
  analytics: false,
  personalization: false,
  marketing: false,
};

const ALL_COOKIE_PREFERENCES: CookiePreferences = {
  essential: true,
  functional: true,
  analytics: true,
  personalization: true,
  marketing: true,
};

function sanitizePreferences(value: unknown): CookiePreferences | null {
  if (!value || typeof value !== "object") return null;
  const source = value as Partial<Record<CookieConsentCategory, unknown>>;
  return {
    essential: true,
    functional: source.functional === true,
    analytics: source.analytics === true,
    personalization: source.personalization === true,
    marketing: source.marketing === true,
  };
}

export function validateStoredCookieConsent(value: unknown): StoredCookieConsent | null {
  if (!value || typeof value !== "object") return null;
  const source = value as Partial<StoredCookieConsent>;
  const preferences = sanitizePreferences(source.preferences);
  if (!preferences) return null;
  if (source.version !== COOKIE_CONSENT_VERSION) return null;
  if (!["accept_all", "reject_optional", "custom"].includes(String(source.consentMode))) return null;
  if (!source.updatedAt || Number.isNaN(Date.parse(source.updatedAt))) return null;
  return {
    version: COOKIE_CONSENT_VERSION,
    preferences,
    consentMode: source.consentMode as StoredCookieConsent["consentMode"],
    updatedAt: source.updatedAt,
  };
}

function readConsentCookie() {
  if (typeof document === "undefined") return null;
  const prefix = `${COOKIE_CONSENT_STORAGE_KEY}=`;
  const cookie = document.cookie
    .split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(prefix));
  if (!cookie) return null;

  try {
    return validateStoredCookieConsent(JSON.parse(decodeURIComponent(cookie.slice(prefix.length))));
  } catch {
    return null;
  }
}

function writeConsentCookie(consent: StoredCookieConsent) {
  if (typeof document === "undefined") return;
  const secureAttribute =
    typeof window !== "undefined" && window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${COOKIE_CONSENT_STORAGE_KEY}=${encodeURIComponent(JSON.stringify(consent))}; path=/; max-age=${COOKIE_CONSENT_MAX_AGE_SECONDS}; SameSite=Lax${secureAttribute}`;
}

function clearConsentCookie() {
  if (typeof document === "undefined") return;
  const secureAttribute =
    typeof window !== "undefined" && window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${COOKIE_CONSENT_STORAGE_KEY}=; path=/; max-age=0; SameSite=Lax${secureAttribute}`;
}

export class LocalConsentStorageAdapter implements ConsentStorageAdapter {
  async load() {
    if (typeof window === "undefined") return null;
    try {
      const raw = window.localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY);
      const stored = raw ? validateStoredCookieConsent(JSON.parse(raw)) : null;
      const cookie = readConsentCookie();
      const consent = stored ?? cookie;
      if (consent && !stored) window.localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, JSON.stringify(consent));
      if (consent && !cookie) writeConsentCookie(consent);
      return consent;
    } catch {
      return readConsentCookie();
    }
  }

  async save(consent: StoredCookieConsent) {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, JSON.stringify(consent));
    writeConsentCookie(consent);
  }

  async clear() {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(COOKIE_CONSENT_STORAGE_KEY);
    clearConsentCookie();
  }
}

function createStoredConsent(
  preferences: CookiePreferences,
  consentMode: StoredCookieConsent["consentMode"],
): StoredCookieConsent {
  return {
    version: COOKIE_CONSENT_VERSION,
    preferences: { ...preferences, essential: true },
    consentMode,
    updatedAt: new Date().toISOString(),
  };
}

export function readStoredCookieConsentSync(): StoredCookieConsent | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY);
    return raw ? validateStoredCookieConsent(JSON.parse(raw)) : readConsentCookie();
  } catch {
    return readConsentCookie();
  }
}

export function hasCookieConsent(category: Exclude<CookieConsentCategory, "essential">) {
  return readStoredCookieConsentSync()?.preferences[category] === true;
}

type CookieConsentContextValue = {
  preferences: CookiePreferences;
  hasResponded: boolean;
  isLoaded: boolean;
  isPreferencesOpen: boolean;
  acceptAll: () => void;
  rejectOptional: () => void;
  savePreferences: (preferences: CookiePreferences) => void;
  openPreferences: () => void;
  closePreferences: () => void;
  resetConsent: () => void;
};

const CookieConsentContext = createContext<CookieConsentContextValue | null>(null);
const defaultLocalConsentAdapter = new LocalConsentStorageAdapter();

export function CookieConsentProvider({
  children,
  adapter = defaultLocalConsentAdapter,
}: {
  children: ReactNode;
  adapter?: ConsentStorageAdapter;
}) {
  const [storedConsent, setStoredConsent] = useState<StoredCookieConsent | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);

  useEffect(() => {
    let active = true;
    adapter.load().then((consent) => {
      if (!active) return;
      setStoredConsent(consent);
      setIsLoaded(true);
    });
    return () => {
      active = false;
    };
  }, [adapter]);

  useEffect(() => {
    function handleStorage(event: StorageEvent) {
      if (event.key !== COOKIE_CONSENT_STORAGE_KEY) return;
      try {
        setStoredConsent(event.newValue ? validateStoredCookieConsent(JSON.parse(event.newValue)) : null);
      } catch {
        setStoredConsent(null);
      }
    }
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || import.meta.env.PROD) return;
    (window as typeof window & { rbResetCookieConsent?: () => void }).rbResetCookieConsent = () => {
      window.localStorage.removeItem(COOKIE_CONSENT_STORAGE_KEY);
      clearConsentCookie();
      window.location.reload();
    };
  }, []);

  const persist = useCallback(
    (consent: StoredCookieConsent) => {
      setStoredConsent(consent);
      void adapter.save(consent);
      window.dispatchEvent(new CustomEvent("rb:cookie-consent", { detail: consent }));
    },
    [adapter],
  );

  const value = useMemo<CookieConsentContextValue>(
    () => ({
      preferences: storedConsent?.preferences ?? DEFAULT_COOKIE_PREFERENCES,
      hasResponded: Boolean(storedConsent),
      isLoaded,
      isPreferencesOpen,
      acceptAll: () => persist(createStoredConsent(ALL_COOKIE_PREFERENCES, "accept_all")),
      rejectOptional: () => persist(createStoredConsent(DEFAULT_COOKIE_PREFERENCES, "reject_optional")),
      savePreferences: (preferences) => persist(createStoredConsent({ ...preferences, essential: true }, "custom")),
      openPreferences: () => setIsPreferencesOpen(true),
      closePreferences: () => setIsPreferencesOpen(false),
      resetConsent: () => {
        setStoredConsent(null);
        void adapter.clear();
      },
    }),
    [adapter, isLoaded, isPreferencesOpen, persist, storedConsent],
  );

  return <CookieConsentContext.Provider value={value}>{children}</CookieConsentContext.Provider>;
}

export function useCookieConsent() {
  const context = useContext(CookieConsentContext);
  if (!context) throw new Error("useCookieConsent must be used within CookieConsentProvider");
  return context;
}
