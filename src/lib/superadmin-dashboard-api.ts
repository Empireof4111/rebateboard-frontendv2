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

export type AdminDashboardKpi = {
  label: string;
  value: string;
  delta?: string;
  tone?: "up" | "down" | "flat";
};

export type AdminDashboardOverview = {
  overviewKpis: AdminDashboardKpi[];
  cashbackKpis: AdminDashboardKpi[];
  platformKpis: AdminDashboardKpi[];
  usersByCountry: { country: string; users: number; pct: number }[];
  tradingExperience: { level: string; users: number; pct: number }[];
  monthlySignups: { month: string; count: number }[];
  monthlySignupDeltaLabel?: string;
  claims: {
    id: string;
    user: string;
    partner: string;
    accountId: string;
    type: string;
    amount: number;
    evidence: number;
    status: string;
    submitted: string;
  }[];
  openComplaints: {
    id: string;
    brand: string;
    category: string;
    severity: string;
    status: string;
    time: string;
  }[];
  recentSignups: {
    id: string;
    name: string;
    email: string;
    country: string;
    joined: string;
    verified: boolean;
  }[];
  recentPayouts: {
    id: string;
    user: string;
    amount: number;
    channel: string;
    speed: string;
    status: string;
    submitted: string;
  }[];
  pendingReviews: {
    id: string;
    brand: string;
    user: string;
    rating: number;
    snippet: string;
    flagged: boolean;
    time: string;
  }[];
};

export async function fetchSuperadminDashboardOverview() {
  const response = await apiRequest<AdminDashboardOverview>("/admin-dashboard/overview", {
    method: "GET",
    token: readToken(),
  });
  if (!response.payload) throw new Error("Missing dashboard overview");
  return response.payload;
}
