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

export type SellerCategory =
  | "Futures Prop Firm"
  | "Crypto Prop Firm"
  | "Prop Firm"
  | "Forex Broker"
  | "Crypto Exchange"
  | "Trading Software"
  | "Education Provider";

export type TimeRange =
  | "Last 30 days"
  | "This month"
  | "This quarter"
  | "This year"
  | "All time";

export type TopSellerOverrideRecord = {
  pinned: boolean;
  featured: boolean;
  hidden: boolean;
  boost: number;
};

export type TopSellerBrandRecord = {
  id: string;
  name: string;
  slug: string;
  category: string;
  visibility: string;
  status: string;
  tbi: number;
  rankOverride?: number | null;
  thumbnail?: string;
  website?: string;
  primaryColor?: string;
};

export type TopSellerRowRecord = {
  rank: number;
  brand: TopSellerBrandRecord;
  sales: number;
  gmv: number;
  score: number;
  override: TopSellerOverrideRecord;
  status: string;
  updatedAt?: string;
};

export type TopSellerBoardRecord = {
  category: SellerCategory;
  timeRange: TimeRange;
  summary: {
    rankedBrands: number;
    hiddenCount: number;
    overrideCount: number;
    pinnedCount: number;
    featuredCount: number;
    totalSales: number;
    totalGmv: number;
  };
  rows: TopSellerRowRecord[];
};

export async function fetchTopSellerBoard(category: SellerCategory, timeRange: TimeRange) {
  const response = await apiRequest<TopSellerBoardRecord>(
    `/top-seller/list?category=${encodeURIComponent(category)}&timeRange=${encodeURIComponent(timeRange)}`,
    {
      method: "GET",
      token: readToken(),
    },
  );
  if (!response.payload) throw new Error("Missing top sellers payload");
  return response.payload;
}

export async function updateTopSellerOverride(
  brandId: string,
  input: Partial<TopSellerOverrideRecord> & { category: SellerCategory; timeRange: TimeRange },
) {
  const response = await apiRequest<TopSellerBoardRecord>(`/top-seller/override/${brandId}`, {
    method: "PUT",
    body: input,
    token: readToken(),
  });
  if (!response.payload) throw new Error("Missing top sellers payload");
  return response.payload;
}
