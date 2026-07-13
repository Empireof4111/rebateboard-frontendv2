import { apiRequest } from "@/lib/api";

export type PublicCampaign = {
  id: number;
  internalName?: string;
  headline: string;
  supportingText: string;
  image?: string;
  primaryCtaLabel?: string;
  primaryCtaUrl?: string;
  audience?: string;
  trigger?: string;
  frequency?: string;
  priority?: number;
  allowedPages?: string[];
  startAt?: string;
  endAt?: string;
  updatedAt?: string;
};

export type PublicActivityEvent = {
  id: string;
  eventType: string;
  sourceType: "brand" | "rebateboard" | "user";
  sourceId?: string;
  sourceName?: string;
  brandId?: string;
  brandName?: string;
  title: string;
  message: string;
  logoUrl?: string;
  destinationUrl?: string;
  visibility?: "public" | "members" | "private";
  occurredAt?: string;
};

export type ContactSubmissionInput = {
  fullName: string;
  email: string;
  category: string;
  subject: string;
  message: string;
  company?: string;
  attachmentUrl?: string;
  consent: boolean;
};

export type AffiliateApplicationInput = {
  fullName: string;
  email: string;
  country?: string;
  companyName?: string;
  website?: string;
  socialLinks?: string[] | string;
  primaryAudience?: string;
  audienceSize?: string;
  promotionChannels?: string;
  industryExperience?: string;
  monthlyReach?: string;
  preferredModel?: string;
  reason: string;
  termsAccepted: boolean;
};

export async function fetchPublicCampaigns(route = "/", audience = "all") {
  const params = new URLSearchParams({ route, audience });
  try {
    const response = await apiRequest<{ page: PublicCampaign[] }>(`/public-engagement/campaigns?${params}`);
    return response.payload?.page ?? [];
  } catch {
    return [];
  }
}

export async function trackPublicCampaignView(id: number) {
  try {
    await apiRequest(`/public-engagement/campaigns/${id}/view`, { method: "POST" });
  } catch {
    // Analytics should never interrupt the user.
  }
}

export async function trackPublicCampaignClick(id: number) {
  try {
    await apiRequest(`/public-engagement/campaigns/${id}/click`, { method: "POST" });
  } catch {
    // Analytics should never interrupt navigation.
  }
}

export async function fetchPublicActivityEvents() {
  try {
    const response = await apiRequest<{ page: PublicActivityEvent[] }>("/public-engagement/activity");
    return response.payload?.page ?? [];
  } catch {
    return [];
  }
}

export async function submitContactMessage(input: ContactSubmissionInput) {
  const response = await apiRequest<{ reference: string; status: string; expectedResponse: string }>("/public-engagement/contact", {
    method: "POST",
    body: input,
  });
  if (!response.payload) throw new Error("Missing contact confirmation");
  return response.payload;
}

export async function submitAffiliateApplication(input: AffiliateApplicationInput) {
  const response = await apiRequest<{ reference: string; status: string; expectedResponse: string }>("/public-engagement/affiliate-application", {
    method: "POST",
    body: input,
  });
  if (!response.payload) throw new Error("Missing affiliate confirmation");
  return response.payload;
}
