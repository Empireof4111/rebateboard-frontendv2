import { apiRequest } from "@/lib/api";
import type { ReviewRecord, ReviewStatus } from "@/lib/reviews-store";

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

export async function fetchAdminReviews() {
  const response = await apiRequest<ReviewRecord[]>("/review/admin-list", {
    method: "GET",
    token: readToken(),
  });
  return response.payload ?? [];
}

export async function fetchPublicReviews(brandSlug?: string) {
  const path = brandSlug
    ? `/review/public-list?brandSlug=${encodeURIComponent(brandSlug)}`
    : "/review/public-list";
  try {
    const response = await apiRequest<ReviewRecord[]>(path, {
      method: "GET",
      cache: "no-store",
    });
    return response.payload ?? [];
  } catch {
    return [];
  }
}

export type SubmitPublicReviewInput = Omit<
  ReviewRecord,
  "id" | "status" | "flagged" | "submittedAt"
> & {
  title?: string;
  category?: string;
  proofOfUse?: string;
  experienceDuration?: string;
  eveluationStep?: string;
  attachments?: string[];
};

export async function submitPublicReview(input: SubmitPublicReviewInput) {
  const response = await apiRequest<ReviewRecord>("/review/", {
    method: "POST",
    body: input,
    token: readToken(),
  });
  if (!response.payload) throw new Error("Missing review payload");
  return response.payload;
}

export async function moderateAdminReview(
  id: string,
  input: { status?: ReviewStatus; flagged?: boolean; adminNote?: string },
) {
  const response = await apiRequest<ReviewRecord>(`/review/${id}/moderate`, {
    method: "PUT",
    body: input,
    token: readToken(),
  });
  if (!response.payload) throw new Error("Missing review payload");
  return response.payload;
}

export async function setAdminReviewFlag(id: string, flagged?: boolean) {
  const response = await apiRequest<ReviewRecord>(`/review/${id}/flag`, {
    method: "PUT",
    body: flagged === undefined ? {} : { flagged },
    token: readToken(),
  });
  if (!response.payload) throw new Error("Missing review payload");
  return response.payload;
}

export async function deleteAdminReview(id: string) {
  await apiRequest(`/review/${id}`, {
    method: "DELETE",
    token: readToken(),
  });
}
