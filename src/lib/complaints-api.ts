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

export type ComplaintStatus =
  | "pending"
  | "posted"
  | "reviewing"
  | "responded"
  | "resolved"
  | "rejected";
export type ComplaintSeverity = "low" | "medium" | "high";

export type ComplaintTimelineEntry = {
  stage: string;
  actor: string;
  note: string;
  time: string;
};

export type ComplaintEvidenceFile = {
  name: string;
  url: string;
  type: string;
};

export type ComplaintRecord = {
  id: string;
  reportId: number;
  brand: string;
  user: string;
  anonymous?: boolean;
  category: string;
  severity: ComplaintSeverity;
  status: ComplaintStatus;
  evidence: number;
  time: string;
  title: string;
  description: string;
  accountType: string;
  accountSize: string;
  platform: string;
  tradingStyle: string;
  country: string;
  expectation: string;
  credibility: number;
  upvotes: number;
  comments: number;
  evidenceFiles: ComplaintEvidenceFile[];
  firmReply?: { text: string; date: string } | null;
  timeline: ComplaintTimelineEntry[];
  adminNote?: string;
  providerType?: string;
};

export async function fetchAdminComplaints() {
  const response = await apiRequest<ComplaintRecord[]>("/report/admin-list", {
    method: "GET",
    token: readToken(),
  });
  return response.payload ?? [];
}

export async function fetchPublicComplaints(brandSlug?: string) {
  const path = brandSlug
    ? `/report/public-list?brandSlug=${encodeURIComponent(brandSlug)}`
    : "/report/public-list";
  try {
    const response = await apiRequest<ComplaintRecord[]>(path, {
      method: "GET",
    });
    return response.payload ?? [];
  } catch {
    return [];
  }
}

export async function submitComplaint(input: {
  title: string;
  description: string;
  attachments?: string[];
  complaintCategory: string;
  severity: ComplaintSeverity;
  anonymous: boolean;
  accountType: string;
  platform: string;
  tradingStyle: string;
  country: string;
  expectation: string;
  evidenceFiles: Array<Record<string, unknown>>;
  itemId?: number;
  itemType?: string;
  providerType?: string;
  brandSlug?: string;
  brandName?: string;
  name: string;
  emailAddress: string;
  accountId: string;
}) {
  const response = await apiRequest<ComplaintRecord>("/report/", {
    method: "POST",
    body: input,
    token: readToken(),
  });
  if (!response.payload) throw new Error("Missing complaint payload");
  return response.payload;
}

export async function moderateComplaint(
  id: string | number,
  input: {
    status?: ComplaintStatus;
    severity?: ComplaintSeverity;
    adminNote?: string;
    brandResponse?: string;
    anonymous?: boolean;
  },
) {
  const response = await apiRequest<ComplaintRecord>(`/report/${id}/moderate`, {
    method: "PUT",
    body: input,
    token: readToken(),
  });
  if (!response.payload) throw new Error("Missing complaint payload");
  return response.payload;
}

export async function deleteComplaint(id: string | number) {
  await apiRequest(`/report/${id}`, {
    method: "DELETE",
    token: readToken(),
  });
}
