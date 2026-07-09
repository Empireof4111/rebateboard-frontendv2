/**
 * Reviews store — central source of truth for user-submitted reviews.
 * Wired into:
 *  - public /reviews hub + per-category pages
 *  - brand profile (firm.$firmId) Reviews tab
 *  - superadmin moderation queue (with proofs)
 *  - TBI score recompute on approve
 *  - RR earn (review-approved → RR award handled by rr-rewards later)
 */
import { useEffect, useState } from "react";
import {
  readCollection,
  writeCollection,
  pushCollection,
  newId,
} from "./admin-store";
import { TBI_BRANDS, type TBICategory } from "./tbi-data";

export type ReviewProviderType = "Prop Firm" | "Broker" | "Exchange" | "Tool";

export type ReviewProof = {
  id: string;
  name: string;
  size: number;
  type: string;
  /** data: URL — fine for in-browser demo storage */
  dataUrl: string;
};

export type ReviewRatings = {
  [key: string]: number;
  customerCare: number;
  tradingConditions: number;
  paymentSpeed: number;
  userFriendliness: number;
  payoutSpeed: number;
  overall: number;
};

export type ReviewStatus = "pending" | "approved" | "rejected" | "needs_info";

export type ReviewRecord = {
  id: string;
  /** brand identity */
  providerType: ReviewProviderType;
  reviewType?: string;
  brandSlug: string;
  brandName: string;
  brandLogo?: string;
  brandCategory?: string;
  brandCountry?: string;
  brandTbi?: number;
  brandReviewCount?: number;
  /** reviewer */
  userId?: string;
  userName: string;
  userEmail: string;
  country?: string;
  /** account context */
  accountSize: string;       // "$10k", "$25k", "Custom: $7k"
  experience: string;        // "Less than 1 month" ...
  evaluationSteps?: string;  // "Instant" / "1 Step" ...
  /** ratings + body */
  ratings: ReviewRatings;
  tbiPillars?: Record<string, number>;
  body: string;
  likedMost?: string;
  likedLeast?: string;
  /** proofs */
  proofs: ReviewProof[];
  /** moderation */
  status: ReviewStatus;
  flagged: boolean;
  adminNote?: string;
  submittedAt: string;       // ISO
  decidedAt?: string;
  /** TBI delta computed at approval */
  tbiDelta?: number;
  /** RR awarded */
  rrAwarded?: number;
  helpfulCount?: number;
  verifiedTrader?: boolean;
  activeTrader?: boolean;
  verifiedPayout?: boolean;
  verifiedCashback?: boolean;
  contributedToTbi?: boolean;
  /** brand response */
  brandReply?: { body: string; repliedAt: string; author: string };
  /** admin routing (assigned to brand inbox) */
  assignedToBrand?: boolean;
};

const KEY = "userReviews";

/* ---------- seed ---------- */
const SEED: ReviewRecord[] = [
  {
    id: "rv_seed_1",
    providerType: "Prop Firm",
    brandSlug: "ftmo",
    brandName: "FTMO",
    userName: "Aiden P.",
    userEmail: "aiden@example.com",
    country: "🇬🇧",
    accountSize: "$100k",
    experience: "6-12 months",
    evaluationSteps: "2 Step",
    ratings: { customerCare: 5, tradingConditions: 5, paymentSpeed: 5, userFriendliness: 5, payoutSpeed: 5, overall: 5 },
    body: "Fastest payout I've ever seen, under 4h via TRC20. Dashboard is clean and rules are transparent.",
    likedMost: "Speed of payout and transparent rule book.",
    proofs: [],
    status: "pending",
    flagged: false,
    submittedAt: new Date(Date.now() - 12 * 60_000).toISOString(),
  },
  {
    id: "rv_seed_2",
    providerType: "Prop Firm",
    brandSlug: "fundingpips",
    brandName: "FundingPips",
    userName: "Yuki T.",
    userEmail: "yuki@example.com",
    country: "🇯🇵",
    accountSize: "$50k",
    experience: "3-6 months",
    evaluationSteps: "1 Step",
    ratings: { customerCare: 5, tradingConditions: 4, paymentSpeed: 5, userFriendliness: 5, payoutSpeed: 5, overall: 5 },
    body: "Clean platform, payout in 6h via TRC20. Highly recommend.",
    proofs: [],
    status: "pending",
    flagged: false,
    submittedAt: new Date(Date.now() - 3 * 60 * 60_000).toISOString(),
  },
  {
    id: "rv_seed_3",
    providerType: "Broker",
    brandSlug: "ic-markets",
    brandName: "IC Markets",
    userName: "Marta S.",
    userEmail: "marta@example.com",
    country: "🇪🇸",
    accountSize: "$25k",
    experience: "1-3 months",
    ratings: { customerCare: 1, tradingConditions: 2, paymentSpeed: 1, userFriendliness: 2, payoutSpeed: 1, overall: 1 },
    body: "They denied my withdrawal with no reason. Support stopped responding.",
    likedLeast: "Withdrawal denied without explanation.",
    proofs: [],
    status: "pending",
    flagged: true,
    submittedAt: new Date(Date.now() - 26 * 60_000).toISOString(),
  },
];

/* ---------- helpers ---------- */
export function getAllReviews(): ReviewRecord[] {
  return readCollection<ReviewRecord>(KEY, SEED);
}

export function getReviewsByBrand(slug: string): ReviewRecord[] {
  return getAllReviews().filter((r) => r.brandSlug === slug);
}

export function getApprovedReviewsByBrand(slug: string): ReviewRecord[] {
  return getReviewsByBrand(slug).filter((r) => r.status === "approved");
}

/** Live TBI impact preview before submission. Returns +/− delta on a 0-10 scale. */
export function previewTbiImpact(slug: string, ratings: ReviewRatings): number {
  const brand = TBI_BRANDS.find((b) => b.slug === slug);
  const currentScore = brand?.score ?? 7.0;
  const reviewScore10 = (ratings.overall / 5) * 10;
  // weight: a single review nudges by up to ±0.3 toward review score
  const raw = (reviewScore10 - currentScore) * 0.06;
  return Math.round(raw * 100) / 100;
}

export function submitReview(input: Omit<ReviewRecord, "id" | "status" | "flagged" | "submittedAt">): ReviewRecord {
  const record: ReviewRecord = {
    ...input,
    id: newId("rv"),
    status: "pending",
    flagged: input.body.length < 30 || /scam|fake/i.test(input.body),
    submittedAt: new Date().toISOString(),
  };
  pushCollection<ReviewRecord>(KEY, record, SEED);
  return record;
}

export function setReviewStatus(id: string, status: ReviewStatus, adminNote?: string) {
  const all = getAllReviews();
  const next = all.map((r) => {
    if (r.id !== id) return r;
    const update: ReviewRecord = {
      ...r,
      status,
      adminNote: adminNote ?? r.adminNote,
      decidedAt: new Date().toISOString(),
    };
    if (status === "approved") {
      update.tbiDelta = previewTbiImpact(r.brandSlug, r.ratings);
      update.rrAwarded = 50;
    }
    return update;
  });
  writeCollection(KEY, next);
}

export function toggleReviewFlag(id: string) {
  const all = getAllReviews();
  writeCollection(KEY, all.map((r) => (r.id === id ? { ...r, flagged: !r.flagged } : r)));
}

export function deleteReview(id: string) {
  const all = getAllReviews();
  writeCollection(KEY, all.filter((r) => r.id !== id));
}

export function replyToReview(id: string, body: string, author = "Brand Team") {
  const all = getAllReviews();
  writeCollection(KEY, all.map((r) => r.id === id ? { ...r, brandReply: { body, repliedAt: new Date().toISOString(), author } } : r));
}

export function assignReviewToBrand(id: string, assigned = true) {
  const all = getAllReviews();
  writeCollection(KEY, all.map((r) => r.id === id ? { ...r, assignedToBrand: assigned } : r));
}

/* ---------- React hook ---------- */
export function useReviews(filter?: { brandSlug?: string; status?: ReviewStatus; category?: TBICategory }) {
  const [items, setItems] = useState<ReviewRecord[]>(() => getAllReviews());

  useEffect(() => {
    let mounted = true;
    const i = setInterval(() => {
      if (!mounted) return;
      const next = getAllReviews();
      setItems((prev) => (prev.length === next.length && prev[0]?.id === next[0]?.id ? prev : next));
    }, 600);
    return () => { mounted = false; clearInterval(i); };
  }, []);

  return items.filter((r) => {
    if (filter?.brandSlug && r.brandSlug !== filter.brandSlug) return false;
    if (filter?.status && r.status !== filter.status) return false;
    if (filter?.category && r.providerType !== filter.category) return false;
    return true;
  });
}

/* ---------- categorized brand index for the public hub ---------- */
export function brandsByCategory(category: TBICategory) {
  return TBI_BRANDS.filter((b) => b.category === category);
}
