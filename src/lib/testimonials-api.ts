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

export type TestimonialSource = "facebook" | "rebateboard" | "discord" | "telegram" | "other";

export type FeaturedTestimonial = {
  id: string;
  reviewId?: string;
  reviewerName: string;
  reviewerAvatarUrl?: string;
  reviewerRole?: string;
  reviewerCountry?: string;
  rating: number;
  reviewText: string;
  shortExcerpt?: string;
  source: TestimonialSource;
  sourceLabel: string;
  originalReviewUrl?: string;
  sourceProfileUrl?: string;
  reviewedAt?: string;
  consentConfirmed?: boolean;
  sourceVerified?: boolean;
  isFeatured?: boolean;
  isPublished?: boolean;
  displayOrder: number;
  internalNotes?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type TestimonialInput = Omit<FeaturedTestimonial, "id" | "createdAt" | "updatedAt">;

export async function fetchPublicTestimonials(limit = 9) {
  const response = await apiRequest<FeaturedTestimonial[]>(`/public/testimonials?limit=${limit}`, {
    method: "GET",
    cache: "no-store",
  });
  return response.payload ?? [];
}

export async function fetchAdminTestimonials() {
  const response = await apiRequest<FeaturedTestimonial[]>("/testimonials/admin", {
    method: "GET",
    token: readToken(),
    cache: "no-store",
  });
  return response.payload ?? [];
}

export async function createAdminTestimonial(input: TestimonialInput) {
  const response = await apiRequest<FeaturedTestimonial>("/testimonials/", {
    method: "POST",
    token: readToken(),
    body: input,
  });
  if (!response.payload) throw new Error("Missing testimonial payload");
  return response.payload;
}

export async function updateAdminTestimonial(id: string, input: TestimonialInput) {
  const response = await apiRequest<FeaturedTestimonial>(`/testimonials/${id}`, {
    method: "PUT",
    token: readToken(),
    body: input,
  });
  if (!response.payload) throw new Error("Missing testimonial payload");
  return response.payload;
}

export async function deleteAdminTestimonial(id: string) {
  await apiRequest(`/testimonials/${id}`, {
    method: "DELETE",
    token: readToken(),
  });
}

export async function reorderAdminTestimonials(ids: string[]) {
  const response = await apiRequest<FeaturedTestimonial[]>("/testimonials/reorder", {
    method: "POST",
    token: readToken(),
    body: { ids: ids.map(Number) },
  });
  return response.payload ?? [];
}
