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

export type BugBountySeverity = "low" | "medium" | "high" | "critical";
export type BugBountyStatus =
  | "submitted"
  | "triaging"
  | "need_more_info"
  | "duplicate"
  | "accepted"
  | "rejected"
  | "fixed"
  | "rewarded";
export type BugBountyRewardStatus = "pending" | "paid" | "cancelled";

export type BugBountyTimelineEntry = {
  stage: string;
  actor: string;
  note: string;
  time: string;
};

export type BugBountyHistoryEntry = {
  actionType?: string;
  actionDate?: string;
  actionBy?: number;
  actionByUser?: string;
  status?: string;
  severity?: string;
  adminNote?: string;
  duplicateOfId?: number | null;
  rrReward?: number;
  rewardStatus?: string;
};

export type BugBountyReportRecord = {
  id: string;
  reportId: number;
  title: string;
  description: string;
  stepsToReproduce: string;
  expectedBehavior: string;
  actualBehavior: string;
  severity: BugBountySeverity;
  status: BugBountyStatus;
  bugType: string;
  affectedArea: string;
  url: string;
  environment: string;
  attachments: string[];
  reporterName: string;
  reporterEmail: string;
  reportedById: number;
  duplicateOfId: number | null;
  adminNote: string;
  rrReward: number;
  rewardStatus: BugBountyRewardStatus;
  rewardedAt: string | null;
  createdAt: string;
  updatedAt: string;
  timeline: BugBountyTimelineEntry[];
  updateHistory: BugBountyHistoryEntry[];
  suggestedReward: number;
  ageLabel: string;
};

export type BugBountyAdminStats = {
  total: number;
  open: number;
  resolved: number;
  avgTriageHours: number | null;
  bountyPaidRr: number;
  highSeverity: number;
};

export async function fetchAdminBugBountyStats() {
  const response = await apiRequest<BugBountyAdminStats>("/bug-bounty/admin/stats", {
    method: "GET",
    token: readToken(),
  });
  if (!response.payload) throw new Error("Missing bug bounty stats");
  return response.payload;
}

export async function fetchAdminBugBountyReports(search = "") {
  const suffix = search.trim() ? `?q=${encodeURIComponent(search.trim())}` : "";
  const response = await apiRequest<BugBountyReportRecord[]>(`/bug-bounty/admin/list${suffix}`, {
    method: "GET",
    token: readToken(),
  });
  return response.payload ?? [];
}

export async function fetchMyBugBountyReports() {
  const response = await apiRequest<BugBountyReportRecord[]>("/bug-bounty/my-reports", {
    method: "GET",
    token: readToken(),
  });
  return response.payload ?? [];
}

export async function fetchBugBountyReportById(id: string | number) {
  const response = await apiRequest<BugBountyReportRecord>(`/bug-bounty/${id}`, {
    method: "GET",
    token: readToken(),
  });
  if (!response.payload) throw new Error("Missing bug bounty report");
  return response.payload;
}

export async function submitBugBountyReport(input: {
  title: string;
  description: string;
  stepsToReproduce?: string;
  expectedBehavior?: string;
  actualBehavior?: string;
  severity?: BugBountySeverity;
  bugType?: string;
  affectedArea?: string;
  url?: string;
  environment?: string;
  attachments?: string[];
  reporterName?: string;
  reporterEmail?: string;
}) {
  const response = await apiRequest<BugBountyReportRecord>("/bug-bounty/", {
    method: "POST",
    body: input,
    token: readToken(),
  });
  if (!response.payload) throw new Error("Missing bug bounty report");
  return response.payload;
}

export async function moderateBugBountyReport(
  id: string | number,
  input: {
    status?: BugBountyStatus;
    severity?: BugBountySeverity;
    adminNote?: string;
    duplicateOfId?: number;
  },
) {
  const response = await apiRequest<BugBountyReportRecord>(`/bug-bounty/admin/${id}/moderate`, {
    method: "PUT",
    body: input,
    token: readToken(),
  });
  if (!response.payload) throw new Error("Missing bug bounty report");
  return response.payload;
}

export async function rewardBugBountyReport(
  id: string | number,
  input: {
    rrReward?: number;
    adminNote?: string;
  },
) {
  const response = await apiRequest<BugBountyReportRecord>(`/bug-bounty/admin/${id}/reward`, {
    method: "PUT",
    body: input,
    token: readToken(),
  });
  if (!response.payload) throw new Error("Missing bug bounty report");
  return response.payload;
}
