import { apiRequest } from "@/lib/api";

const AUTH_STORAGE_KEY = "rb_auth_session";

type StoredSession = {
  token?: string | null;
};

function readToken() {
  if (typeof window === "undefined") return null;

  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredSession;
    return parsed.token ?? null;
  } catch {
    return null;
  }
}

export type OnboardingAnalyticsResponse = {
  range: number;
  summary: {
    total: number;
    completed: number;
    completionRate: number;
    topMarket: { name: string; value: number } | null;
    topGoal: { name: string; value: number } | null;
  };
  trend: { date: string; signups: number; completed: number }[];
  preferredMarkets: { name: string; value: number }[];
  experience: { name: string; value: number }[];
  monthlyVolume: { name: string; value: number }[];
  acquisitionSource: { name: string; value: number }[];
  primaryGoal: { name: string; value: number }[];
  currentPlatform: { name: string; value: number }[];
  countries: { name: string; value: number }[];
  recentSubmissions: {
    id: number;
    name: string;
    email: string;
    country: string;
    completed: boolean;
    submittedAt: string;
    primaryGoal: string;
  }[];
};

export async function fetchSuperadminOnboardingAnalytics(range: 7 | 30 | 90) {
  const response = await apiRequest<OnboardingAnalyticsResponse>(
    `/analytic/onboarding?range=${range}`,
    {
      method: "GET",
      token: readToken(),
    },
  );

  if (!response.payload) throw new Error("Missing onboarding analytics payload");
  return response.payload;
}
