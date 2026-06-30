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

export type SearchAnalyticsEvent = {
  id: string;
  type: "search" | "click" | "no_results";
  term: string;
  resultLabel?: string;
  resultGroup?: string;
  to?: string;
  surface: string;
  sessionId?: string;
  userId?: number | null;
  createdAt: string;
};

export type SearchTrendingConfig = {
  searches: {
    mode: "auto" | "manual";
    items: string[];
    resolved: string[];
  };
  brands: {
    mode: "auto" | "manual";
    items: string[];
    resolved: string[];
  };
  updatedAt: string;
};

export type SuperadminSearchAnalyticsResponse = {
  range: 7 | 30 | 90;
  summary: {
    totalSearches: number;
    totalClicks: number;
    noResults: number;
    ctr: number;
  };
  trend: Array<{
    isoDate: string;
    date: string;
    searches: number;
    clicks: number;
    noResults: number;
  }>;
  topTerms: Array<{ term: string; count: number }>;
  topBrands: Array<{ label: string; count: number; group: string; to: string }>;
  noResultsTerms: Array<{ term: string; count: number }>;
  recentEvents: SearchAnalyticsEvent[];
  eventWindowCount: number;
  trendingConfig: SearchTrendingConfig;
};

export async function fetchSuperadminSearchAnalytics(range: 7 | 30 | 90) {
  const response = await apiRequest<SuperadminSearchAnalyticsResponse>(
    `/search-analytics/admin/dashboard?range=${range}`,
    {
      method: "GET",
      token: readToken(),
    },
  );

  if (!response.payload) throw new Error("Missing search analytics payload");
  return response.payload;
}

export async function updateSuperadminSearchTrendingConfig(input: {
  searchMode: "auto" | "manual";
  searchItems: string[];
  brandMode: "auto" | "manual";
  brandItems: string[];
}) {
  const response = await apiRequest<SuperadminSearchAnalyticsResponse>(
    `/search-analytics/admin/trending`,
    {
      method: "PUT",
      token: readToken(),
      body: input,
    },
  );

  if (!response.payload) throw new Error("Missing updated search analytics payload");
  return response.payload;
}

export async function clearSuperadminSearchAnalyticsEvents() {
  const response = await apiRequest<SuperadminSearchAnalyticsResponse>(
    `/search-analytics/admin/events`,
    {
      method: "DELETE",
      token: readToken(),
    },
  );

  if (!response.payload) throw new Error("Missing cleared search analytics payload");
  return response.payload;
}
