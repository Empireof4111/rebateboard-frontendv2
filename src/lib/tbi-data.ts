export type TBIStatus = "full" | "partial" | "preliminary";
export type TBICategory = "Prop Firm" | "Broker" | "Exchange" | "Tool";

export interface TBIBrand {
  slug: string;
  name: string;
  category: TBICategory;
  score: number; // 0-10 (or 0-6.5 for preliminary)
  maxScore: number;
  status: TBIStatus;
  confidence: "High" | "Medium" | "Low";
  reviewCount: number;
  verifiedReviews: number;
  country: string;
  regulation: string;
  website: string;
  tag: string;
  logoColor: string;
  breakdown: {
    transparency: number;
    proof: number;
    community: number;
    conditions: number;
    experience: number | null;
  };
  performance?: {
    avgRoi: number;
    avgWinRate: number;
    commonMistake: string;
  };
  flag?: string;
  reviews: { user: string; score: number; comment: string; verified: boolean; date: string }[];
}

export const TBI_BRANDS: TBIBrand[] = [
  {
    slug: "ftmo",
    name: "FTMO",
    category: "Prop Firm",
    score: 9.2,
    maxScore: 10,
    status: "full",
    confidence: "High",
    reviewCount: 412,
    verifiedReviews: 287,
    country: "Czech Republic",
    regulation: "EU Registered Entity",
    website: "ftmo.com",
    tag: "High Payout Reliability",
    logoColor: "from-violet-500 to-violet-600",
    breakdown: { transparency: 9.4, proof: 9.1, community: 9.0, conditions: 9.0, experience: 9.3 },
    performance: { avgRoi: 18, avgWinRate: 61, commonMistake: "Overtrading on news days" },
    reviews: [
      { user: "trader_max", score: 9.5, comment: "Payouts always on time, transparent rules.", verified: true, date: "2 days ago" },
      { user: "fx_jenna", score: 9.0, comment: "Best dashboard in the industry.", verified: true, date: "5 days ago" },
      { user: "swing_lord", score: 8.8, comment: "Slightly strict consistency rule but fair.", verified: false, date: "1 week ago" },
    ],
  },
  {
    slug: "ic-markets",
    name: "IC Markets",
    category: "Broker",
    score: 9.0, maxScore: 10, status: "full", confidence: "High",
    reviewCount: 358, verifiedReviews: 240,
    country: "Australia", regulation: "ASIC, CySEC, FSA", website: "icmarkets.com",
    tag: "Tightest Spreads", logoColor: "from-violet-500 to-violet-600",
    breakdown: { transparency: 9.0, proof: 8.8, community: 8.9, conditions: 9.4, experience: 9.0 },
    performance: { avgRoi: 14, avgWinRate: 58, commonMistake: "Holding through swap" },
    reviews: [
      { user: "scalper_dan", score: 9.3, comment: "Execution is rock solid.", verified: true, date: "3 days ago" },
    ],
  },
  {
    slug: "fundingpips",
    name: "FundingPips",
    category: "Prop Firm",
    score: 8.9, maxScore: 10, status: "full", confidence: "High",
    reviewCount: 296, verifiedReviews: 198,
    country: "UAE", regulation: "DMCC Licensed", website: "fundingpips.com",
    tag: "Fast Payouts", logoColor: "from-violet-500 to-violet-600",
    breakdown: { transparency: 8.7, proof: 8.9, community: 9.0, conditions: 8.8, experience: 9.1 },
    performance: { avgRoi: 22, avgWinRate: 64, commonMistake: "Risking too much on first day" },
    reviews: [{ user: "pip_hunter", score: 9.0, comment: "Payouts within hours. Insane.", verified: true, date: "1 day ago" }],
  },
  {
    slug: "pepperstone",
    name: "Pepperstone",
    category: "Broker",
    score: 8.7, maxScore: 10, status: "full", confidence: "High",
    reviewCount: 412, verifiedReviews: 250,
    country: "Australia", regulation: "ASIC, FCA, CySEC", website: "pepperstone.com",
    tag: "Trusted Veteran", logoColor: "from-violet-500 to-violet-600",
    breakdown: { transparency: 8.9, proof: 8.6, community: 8.7, conditions: 8.8, experience: 8.7 },
    performance: { avgRoi: 12, avgWinRate: 56, commonMistake: "Overleveraging" },
    reviews: [{ user: "vet_trader", score: 8.6, comment: "Reliable for over a decade.", verified: true, date: "4 days ago" }],
  },
  {
    slug: "bybit",
    name: "Bybit",
    category: "Exchange",
    score: 8.6, maxScore: 10, status: "full", confidence: "High",
    reviewCount: 1240, verifiedReviews: 760,
    country: "Dubai", regulation: "VARA Licensed", website: "bybit.com",
    tag: "Deep Liquidity", logoColor: "from-violet-500 to-violet-600",
    breakdown: { transparency: 8.5, proof: 8.4, community: 8.9, conditions: 8.7, experience: 8.6 },
    performance: { avgRoi: 9, avgWinRate: 52, commonMistake: "Chasing pumps" },
    reviews: [{ user: "crypto_kid", score: 8.8, comment: "Best UX in crypto.", verified: true, date: "6 hours ago" }],
  },
  {
    slug: "binance",
    name: "Binance",
    category: "Exchange",
    score: 8.4, maxScore: 10, status: "full", confidence: "High",
    reviewCount: 2104, verifiedReviews: 1320,
    country: "Global", regulation: "Multiple Jurisdictions", website: "binance.com",
    tag: "Largest Volume", logoColor: "from-violet-500 to-violet-600",
    breakdown: { transparency: 8.0, proof: 8.3, community: 8.8, conditions: 8.6, experience: 8.4 },
    performance: { avgRoi: 8, avgWinRate: 51, commonMistake: "FOMO on listings" },
    flag: "Increased complaints about KYC delays in last 30 days",
    reviews: [{ user: "hodl_queen", score: 8.5, comment: "Most pairs anywhere.", verified: true, date: "1 day ago" }],
  },
  {
    slug: "the5ers",
    name: "The5ers",
    category: "Prop Firm",
    score: 8.3, maxScore: 10, status: "full", confidence: "High",
    reviewCount: 178, verifiedReviews: 112,
    country: "Israel", regulation: "Private Entity", website: "the5ers.com",
    tag: "Long-Term Funded", logoColor: "from-violet-500 to-violet-600",
    breakdown: { transparency: 8.4, proof: 8.2, community: 8.1, conditions: 8.3, experience: 8.5 },
    performance: { avgRoi: 16, avgWinRate: 59, commonMistake: "Skipping risk plan" },
    reviews: [{ user: "long_play", score: 8.4, comment: "Real funded path.", verified: true, date: "1 week ago" }],
  },
  {
    slug: "oanda",
    name: "OANDA",
    category: "Broker",
    score: 8.2, maxScore: 10, status: "full", confidence: "High",
    reviewCount: 322, verifiedReviews: 201,
    country: "USA", regulation: "NFA, FCA, ASIC", website: "oanda.com",
    tag: "Top Regulation", logoColor: "from-violet-500 to-violet-600",
    breakdown: { transparency: 8.6, proof: 8.4, community: 7.9, conditions: 8.0, experience: 8.1 },
    performance: { avgRoi: 11, avgWinRate: 55, commonMistake: "Ignoring spreads on minors" },
    reviews: [{ user: "us_trader", score: 8.2, comment: "One of the few solid US options.", verified: true, date: "3 days ago" }],
  },
  {
    slug: "okx",
    name: "OKX",
    category: "Exchange",
    score: 8.1, maxScore: 10, status: "full", confidence: "High",
    reviewCount: 890, verifiedReviews: 540,
    country: "Seychelles", regulation: "Multi-jurisdiction", website: "okx.com",
    tag: "Strong Derivatives", logoColor: "from-violet-500 to-violet-600",
    breakdown: { transparency: 8.0, proof: 8.0, community: 8.3, conditions: 8.2, experience: 8.0 },
    performance: { avgRoi: 7, avgWinRate: 50, commonMistake: "Over-leveraged perps" },
    reviews: [{ user: "perp_pro", score: 8.0, comment: "Smooth perps engine.", verified: true, date: "2 days ago" }],
  },
  {
    slug: "myforexfunds",
    name: "MyForexFunds",
    category: "Prop Firm",
    score: 7.8, maxScore: 10, status: "full", confidence: "Medium",
    reviewCount: 145, verifiedReviews: 84,
    country: "Canada", regulation: "Private Entity", website: "myforexfunds.com",
    tag: "Generous Splits", logoColor: "from-violet-500 to-violet-600",
    breakdown: { transparency: 7.5, proof: 7.7, community: 7.9, conditions: 8.0, experience: 7.9 },
    performance: { avgRoi: 19, avgWinRate: 60, commonMistake: "Trading too many pairs" },
    reviews: [{ user: "indie_fx", score: 7.8, comment: "Good splits, recovering trust.", verified: true, date: "5 days ago" }],
  },
  // Partial / Preliminary brands (not in top 10)
  {
    slug: "nova-funding",
    name: "Nova Funding",
    category: "Prop Firm",
    score: 6.9, maxScore: 10, status: "partial", confidence: "Medium",
    reviewCount: 22, verifiedReviews: 9,
    country: "UK", regulation: "Private Entity", website: "novafunding.io",
    tag: "Emerging", logoColor: "from-violet-500 to-violet-600",
    breakdown: { transparency: 7.0, proof: 6.5, community: 6.4, conditions: 7.4, experience: 7.0 },
    reviews: [{ user: "early_bird", score: 7.0, comment: "Promising, early days.", verified: false, date: "3 weeks ago" }],
  },
  {
    slug: "alphaprop",
    name: "AlphaProp",
    category: "Prop Firm",
    score: 6.1, maxScore: 6.5, status: "preliminary", confidence: "Low",
    reviewCount: 0, verifiedReviews: 0,
    country: "Estonia", regulation: "Private Entity", website: "alphaprop.com",
    tag: "New Listing", logoColor: "from-violet-500 to-violet-600",
    breakdown: { transparency: 6.2, proof: 6.0, community: 0, conditions: 6.1, experience: 0 },
    reviews: [],
  },
  {
    slug: "tradehub-fx",
    name: "TradeHub FX",
    category: "Broker",
    score: 5.9, maxScore: 6.5, status: "preliminary", confidence: "Low",
    reviewCount: 0, verifiedReviews: 0,
    country: "Cyprus", regulation: "CySEC Pending", website: "tradehubfx.com",
    tag: "New Listing", logoColor: "from-violet-500 to-violet-600",
    breakdown: { transparency: 6.0, proof: 5.8, community: 0, conditions: 5.9, experience: 0 },
    reviews: [],
  },
];

export function getTBIBrand(slug: string) {
  return TBI_BRANDS.find((b) => b.slug === slug);
}
