import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { apiRequest } from "@/lib/api";
import { recordOnboardingSubmission } from "@/lib/onboarding-analytics";

export type TradingExperience = "beginner" | "intermediate" | "advanced";
export type MonthlyVolume = "lt1k" | "1k_10k" | "10k_50k" | "gt50k";
export type AcquisitionSource =
  | "tiktok" | "twitter" | "youtube" | "google" | "referral" | "other";
export type PrimaryGoal =
  | "reduce_costs" | "find_brokers" | "track_performance" | "earn_rewards" | "improve_strategy";
export type Market = "forex" | "crypto" | "indices" | "stocks" | "commodities" | "propfirms";

export type OnboardingAnswers = {
  preferredMarkets: Market[];
  currentPlatform: string;
  tradingExperience: TradingExperience | null;
  monthlyVolume: MonthlyVolume | null;
  acquisitionSource: AcquisitionSource | null;
  primaryGoal: PrimaryGoal | null;
};

export type User = {
  id: string;
  walletId: string;
  name: string;
  fullName?: string;
  username?: string;
  email: string;
  country?: string;
  role?: string;
  rrBalance: number;
  traderScore: number;
  joinedAt: string;
  marketingOptIn?: boolean;
  onboardingCompleted: boolean;
  onboarding?: OnboardingAnswers;
  status?: string;
};

export type SignupInput = {
  fullName: string;
  email: string;
  password: string;
  username?: string;
  country?: string;
  marketingOptIn?: boolean;
};

type AuthContextType = {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<User>;
  signup: (input: SignupInput) => Promise<User>;
  verifyOtp: (otp: string) => Promise<User>;
  resendOtp: () => Promise<void>;
  updateProfile: (patch: Partial<User>) => void;
  setOnboarding: (answers: OnboardingAnswers, completed?: boolean) => Promise<void>;
  logout: () => void;
  loading: boolean;
  pendingVerification: boolean;
};

type StoredSession = {
  token: string | null;
  user: User | null;
  pendingIdentity: string | null;
  pendingPassword: string | null;
};

type BackendUser = Partial<User> & {
  id?: string | number;
  walletId?: string | number;
  name?: string;
  fullName?: string;
  username?: string;
  email?: string;
  emailAddress?: string;
  country?: string;
  role?: string;
  rrBalance?: number;
  traderScore?: number;
  joinedAt?: string;
  createdAt?: string;
  marketingOptIn?: boolean;
  onboardingCompleted?: boolean;
  onboarding?: Partial<OnboardingAnswers>;
  status?: string;
};

type LoginResponse = {
  accessToken: string;
  user: BackendUser;
};

const AuthContext = createContext<AuthContextType | null>(null);
const STORAGE_KEY = "rb_auth_session";

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

function normalizeAnswers(raw?: Partial<OnboardingAnswers> | null): OnboardingAnswers {
  return {
    preferredMarkets: Array.isArray(raw?.preferredMarkets) ? raw!.preferredMarkets as Market[] : [],
    currentPlatform: raw?.currentPlatform ?? "",
    tradingExperience: raw?.tradingExperience ?? null,
    monthlyVolume: raw?.monthlyVolume ?? null,
    acquisitionSource: raw?.acquisitionSource ?? null,
    primaryGoal: raw?.primaryGoal ?? null,
  };
}

function normalizeUser(raw: BackendUser | User | null | undefined): User | null {
  if (!raw || raw.id == null) return null;

  const email = raw.email ?? (raw as BackendUser).emailAddress ?? "";
  const fullName = raw.fullName ?? raw.name ?? email.split("@")[0] ?? "Trader";
  const name = raw.name ?? fullName;

  return {
    id: String(raw.id),
    walletId: raw.walletId == null ? "" : String(raw.walletId),
    name,
    fullName,
    username: raw.username,
    email,
    country: raw.country,
    role: raw.role,
    rrBalance: Number(raw.rrBalance ?? 0),
    traderScore: Number(raw.traderScore ?? 0),
    joinedAt: raw.joinedAt ?? (raw as BackendUser).createdAt ?? new Date().toISOString(),
    marketingOptIn: raw.marketingOptIn,
    onboardingCompleted: Boolean(raw.onboardingCompleted),
    onboarding: normalizeAnswers(raw.onboarding),
    status: raw.status,
  };
}

function readSession(): StoredSession | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as StoredSession;
    return {
      token: parsed.token ?? null,
      user: normalizeUser(parsed.user),
      pendingIdentity: parsed.pendingIdentity ?? null,
      pendingPassword: parsed.pendingPassword ?? null,
    };
  } catch {
    return null;
  }
}

function writeSession(session: StoredSession | null) {
  if (typeof window === "undefined") return;

  if (!session) {
    localStorage.removeItem(STORAGE_KEY);
    return;
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [pendingIdentity, setPendingIdentity] = useState<string | null>(null);
  const [pendingPassword, setPendingPassword] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  function syncSession(next: StoredSession) {
    setUser(next.user);
    setToken(next.token);
    setPendingIdentity(next.pendingIdentity);
    setPendingPassword(next.pendingPassword);
    writeSession(next);
  }

  function trackOnboarding(userValue: User, answers: OnboardingAnswers, completed: boolean) {
    try {
      recordOnboardingSubmission({
        userId: String(userValue.id),
        email: userValue.email,
        fullName: userValue.fullName,
        country: userValue.country,
        answers,
        completed,
      });
    } catch {
      // Analytics is best-effort and should not block auth flows.
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      const stored = readSession();
      if (!stored) {
        if (!cancelled) setLoading(false);
        return;
      }

      if (!cancelled) {
        setUser(stored.user);
        setToken(stored.token);
        setPendingIdentity(stored.pendingIdentity);
        setPendingPassword(stored.pendingPassword);
      }

      if (!stored.token) {
        if (!cancelled) setLoading(false);
        return;
      }

      try {
        const response = await apiRequest<BackendUser>("/auth/me", {
          method: "GET",
          token: stored.token,
        });
        const nextUser = normalizeUser(response.payload);
        if (!nextUser) throw new Error("Unable to restore session");

        if (!cancelled) {
          syncSession({
            token: stored.token,
            user: nextUser,
            pendingIdentity: null,
            pendingPassword: null,
          });
        }
      } catch {
        if (!cancelled) {
          syncSession({
            token: null,
            user: stored.user,
            pendingIdentity: stored.pendingIdentity,
            pendingPassword: stored.pendingPassword,
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void restoreSession();

    return () => {
      cancelled = true;
    };
  }, []);

  const login: AuthContextType["login"] = async (email, password) => {
    const response = await apiRequest<LoginResponse>("/auth/login", {
      method: "POST",
      body: { email, password },
    });

    const payload = response.payload;
    if (!payload) throw new Error("Missing login response");

    const nextUser = normalizeUser(payload.user);
    if (!nextUser) throw new Error("Missing user profile");

    syncSession({
      token: payload.accessToken,
      user: nextUser,
      pendingIdentity: null,
      pendingPassword: null,
    });

    return nextUser;
  };

  const signup: AuthContextType["signup"] = async (input) => {
    const response = await apiRequest<BackendUser>("/user/", {
      method: "POST",
      body: input,
    });

    const nextUser = normalizeUser(response.payload);
    if (!nextUser) throw new Error("Missing signup response");

    syncSession({
      token: null,
      user: nextUser,
      pendingIdentity: input.email,
      pendingPassword: input.password,
    });

    return nextUser;
  };

  const verifyOtp: AuthContextType["verifyOtp"] = async (otp) => {
    if (!pendingIdentity || !pendingPassword) {
      throw new Error("Your signup session expired. Please create your account again.");
    }

    await apiRequest<BackendUser>("/user/verify-account", {
      method: "POST",
      body: {
        identity: pendingIdentity,
        otp,
      },
    });

    return login(pendingIdentity, pendingPassword);
  };

  const resendOtp: AuthContextType["resendOtp"] = async () => {
    const identity = pendingIdentity || user?.email;
    if (!identity) {
      throw new Error("We could not determine which account to resend the code to.");
    }

    await apiRequest("/user/resend-otp", {
      method: "POST",
      body: { identity },
    });
  };

  const updateProfile: AuthContextType["updateProfile"] = (patch) => {
    setUser((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...patch };
      writeSession({
        token,
        user: next,
        pendingIdentity,
        pendingPassword,
      });
      return next;
    });
  };

  const setOnboarding: AuthContextType["setOnboarding"] = async (answers, completed = true) => {
    if (!user) throw new Error("You need to be signed in to continue.");

    if (!completed) {
      const nextUser = {
        ...user,
        onboarding: answers,
        onboardingCompleted: false,
      };
      syncSession({
        token,
        user: nextUser,
        pendingIdentity,
        pendingPassword,
      });
      trackOnboarding(nextUser, answers, false);
      return;
    }

    const response = await apiRequest<BackendUser>(`/user/questionnaire/${user.id}`, {
      method: "POST",
      body: {
        preferredMarkets: answers.preferredMarkets,
        currentPlatform: answers.currentPlatform,
        tradingExperience: answers.tradingExperience,
        monthlyVolume: answers.monthlyVolume,
        acquisitionSource: answers.acquisitionSource,
        primaryGoal: answers.primaryGoal,
      },
      token,
    });

    const nextUser = normalizeUser(response.payload);
    if (!nextUser) throw new Error("Missing onboarding response");

    syncSession({
      token,
      user: nextUser,
      pendingIdentity,
      pendingPassword,
    });
    trackOnboarding(nextUser, answers, true);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setPendingIdentity(null);
    setPendingPassword(null);
    writeSession(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        signup,
        verifyOtp,
        resendOtp,
        updateProfile,
        setOnboarding,
        logout,
        loading,
        pendingVerification: Boolean(pendingIdentity && !token),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function usePersonalization() {
  const { user } = useAuth();
  const o = user?.onboarding;
  return {
    markets: o?.preferredMarkets ?? [],
    goal: o?.primaryGoal ?? null,
    experience: o?.tradingExperience ?? null,
    primaryMarketLabel: o?.preferredMarkets?.[0]
      ? marketLabel(o.preferredMarkets[0])
      : null,
    goalLabel: o?.primaryGoal ? goalLabel(o.primaryGoal) : null,
  };
}

export function marketLabel(m: Market): string {
  return ({
    forex: "Forex", crypto: "Crypto", indices: "Indices",
    stocks: "Stocks", commodities: "Commodities", propfirms: "Prop Firms",
  } as const)[m];
}

export function goalLabel(g: PrimaryGoal): string {
  return ({
    reduce_costs: "Reduce trading costs",
    find_brokers: "Find better brokers",
    track_performance: "Track performance",
    earn_rewards: "Earn rewards & cashback",
    improve_strategy: "Improve strategy",
  } as const)[g];
}
