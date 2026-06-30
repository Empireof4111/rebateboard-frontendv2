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

export type JournalAnalyticsResponse = {
  dataState: string;
  note: string;
  filters: {
    range: number;
    market: string;
    experience: string;
    withPlanOnly: boolean;
    availableMarkets: string[];
    availableExperiences: string[];
  };
  summary: {
    trackedEntries: number;
    rebateEarned: number;
    commissionTracked: number;
    volumeLots: number;
    activeTraders: number;
    academyPlanners: number;
    academyCompleted: number;
    averageRrBalance: number;
    pendingClaims: number;
  };
  dailyActivity: {
    day: string;
    rebateEarned: number;
    commissionTracked: number;
    entries: number;
    activeTraders: number;
    academyEnrollments: number;
  }[];
  marketMix: {
    name: string;
    value: number;
  }[];
  experienceMix: {
    name: string;
    value: number;
  }[];
  topTraders: {
    userId: number;
    trader: string;
    email: string;
    country: string;
    entries: number;
    rebateEarned: number;
    commissionTracked: number;
    volumeLots: number;
    rrBalance: number;
    academyCourses: number;
  }[];
};

export async function fetchSuperadminJournalAnalytics(params: {
  range: number;
  market: string;
  experience: string;
  withPlanOnly: boolean;
}) {
  const query = new URLSearchParams({
    range: String(params.range),
    market: params.market,
    experience: params.experience,
    withPlanOnly: String(params.withPlanOnly),
  });

  const response = await apiRequest<JournalAnalyticsResponse>(
    `/analytic/journal?${query.toString()}`,
    {
      method: "GET",
      token: readToken(),
    },
  );

  if (!response.payload) throw new Error("Missing journal analytics payload");
  return response.payload;
}
