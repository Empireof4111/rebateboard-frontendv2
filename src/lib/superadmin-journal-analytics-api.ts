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
    completedOnly: boolean;
    userId: number | null;
    availableMarkets: string[];
    availableExperiences: string[];
    availableTraders: { id: number; label: string }[];
  };
  summary: {
    trackedEntries: number;
    completedEntries: number;
    activeTraders: number;
    netPnl: number;
    totalFees: number;
    averageR: number;
    winRate: number;
    lossRate: number;
    profitFactor: number;
    screenshotsAttached: number;
    strategiesUsed: number;
  };
  dailyActivity: {
    day: string;
    netPnl: number;
    entries: number;
    completed: number;
    wins: number;
    losses: number;
    activeTraders: number;
    averageR: number;
  }[];
  marketMix: {
    name: string;
    value: number;
  }[];
  resultMix: {
    name: string;
    value: number;
  }[];
  topTraders: {
    userId: number;
    trader: string;
    email: string;
    country: string;
    entries: number;
    completed: number;
    netPnl: number;
    winRate: number;
    averageR: number;
    screenshots: number;
    lastTradeAt: string | null;
    rrBalance: number;
  }[];
  traderBreakdown: null | {
    userId: number;
    trader: string;
    email: string;
    country: string;
    summary: {
      entries: number;
      completed: number;
      netPnl: number;
      winRate: number;
      averageR: number;
      screenshots: number;
    };
    recentTrades: {
      id: number;
      asset: string;
      market: string;
      direction: string;
      result: string;
      outcome: string;
      netPnl: number;
      rMultiple: number;
      strategy: string;
      session: string;
      tradedAt: string;
    }[];
  };
};

export async function fetchSuperadminJournalAnalytics(params: {
  range: number;
  market: string;
  experience: string;
  completedOnly: boolean;
  userId: number;
}) {
  const query = new URLSearchParams({
    range: String(params.range),
    market: params.market,
    experience: params.experience,
    completedOnly: String(params.completedOnly),
    userId: String(params.userId),
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
