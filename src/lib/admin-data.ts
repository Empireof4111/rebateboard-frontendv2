// Mock data for the superadmin dashboard. Deterministic so the UI feels stable.

export type AdminKPI = { label: string; value: string; delta: string; tone: "up" | "down" | "flat" };

export const overviewKpis: AdminKPI[] = [
  { label: "Total Users", value: "48,219", delta: "+312 today", tone: "up" },
  { label: "MRR", value: "$184,920", delta: "+8.4% MoM", tone: "up" },
  { label: "Active Brands", value: "127", delta: "+4 this week", tone: "up" },
  { label: "Open Complaints", value: "38", delta: "-12% WoW", tone: "down" },
  { label: "Pending Reviews", value: "214", delta: "Needs moderation", tone: "flat" },
  { label: "RR Circulating", value: "12.4M", delta: "+2.1%", tone: "up" },
  { label: "Payout Volume 30d", value: "$8.2M", delta: "+14%", tone: "up" },
  { label: "TBI Avg Score", value: "82.6", delta: "+1.2", tone: "up" },
];

// New cashback / wallet KPIs added for Mission Control
export const cashbackKpis: AdminKPI[] = [
  { label: "Total Cashback Paid", value: "$1.42M", delta: "+18% MoM", tone: "up" },
  { label: "Pending Cashback", value: "$84,210", delta: "412 users", tone: "flat" },
  { label: "Total Withdrawals", value: "$982K", delta: "+9% MoM", tone: "up" },
  { label: "Active Claims", value: "47", delta: "12 high priority", tone: "down" },
];

export const recentSignups = [
  { id: "u_9f12", name: "Aiden Park", email: "aiden@flowtrade.io", country: "🇸🇬 SG", joined: "2m ago", verified: true },
  { id: "u_9f11", name: "Marta Silva", email: "marta@protrade.com", country: "🇧🇷 BR", joined: "14m ago", verified: false },
  { id: "u_9f10", name: "Liam O'Connor", email: "liam@gmail.com", country: "🇮🇪 IE", joined: "32m ago", verified: true },
  { id: "u_9f0f", name: "Yuki Tanaka", email: "yuki@trade.jp", country: "🇯🇵 JP", joined: "58m ago", verified: true },
  { id: "u_9f0e", name: "Hassan Ali", email: "h.ali@fxking.com", country: "🇦🇪 AE", joined: "1h ago", verified: false },
  { id: "u_9f0d", name: "Elena Rossi", email: "elena@quanttrade.eu", country: "🇮🇹 IT", joined: "2h ago", verified: true },
];

export const adminUsers = [
  ...recentSignups,
  { id: "u_9f0c", name: "James Carter", email: "jc@gmail.com", country: "🇺🇸 US", joined: "3h ago", verified: true },
  { id: "u_9f0b", name: "Priya Nair", email: "priya@traders.in", country: "🇮🇳 IN", joined: "4h ago", verified: true },
  { id: "u_9f0a", name: "Noah Becker", email: "noah@de.fx", country: "🇩🇪 DE", joined: "5h ago", verified: false },
  { id: "u_9f09", name: "Sofia Lopez", email: "sofia@mx.fx", country: "🇲🇽 MX", joined: "6h ago", verified: true },
];

export type AdminBrand = {
  id: string;
  name: string;
  category:
    | "Prop Firm"
    | "Forex Broker"
    | "Crypto Exchange"
    | "Futures Prop Firm"
    | "Crypto Prop Firm"
    | "Stock Prop Firm"
    | "DEX Prop Firm"
    | "Trading Software"
    | "Trading Tool"
    | "Education Provider";
  tbi: number;
  status: "verified" | "review" | "flagged" | "draft";
  payouts: string;
  complaints: number;
  rankOverride?: number | null;
  thumbnail?: string;
  website?: string;
};

export const adminBrands: AdminBrand[] = [
  { id: "b_01", name: "FundingPips", category: "Prop Firm", tbi: 92, status: "verified", payouts: "$1.4M", complaints: 4, website: "https://fundingpips.com" },
  { id: "b_02", name: "FTMO", category: "Prop Firm", tbi: 95, status: "verified", payouts: "$2.8M", complaints: 7, website: "https://ftmo.com" },
  { id: "b_03", name: "Maven Trading", category: "Prop Firm", tbi: 81, status: "verified", payouts: "$420K", complaints: 12 },
  { id: "b_04", name: "The5ers", category: "Prop Firm", tbi: 88, status: "verified", payouts: "$910K", complaints: 3 },
  { id: "b_05", name: "E8 Markets", category: "Prop Firm", tbi: 79, status: "review", payouts: "$310K", complaints: 18 },
  { id: "b_06", name: "Alpha Capital", category: "Prop Firm", tbi: 74, status: "flagged", payouts: "$180K", complaints: 24 },
  { id: "b_07", name: "Bybit", category: "Crypto Exchange", tbi: 86, status: "verified", payouts: "—", complaints: 9, website: "https://bybit.com" },
  { id: "b_08", name: "OKX", category: "Crypto Exchange", tbi: 84, status: "verified", payouts: "—", complaints: 6 },
  { id: "b_09", name: "Exness", category: "Forex Broker", tbi: 89, status: "verified", payouts: "$3.1M", complaints: 11 },
  { id: "b_10", name: "IC Markets", category: "Forex Broker", tbi: 87, status: "verified", payouts: "$2.4M", complaints: 8 },
  { id: "b_11", name: "Apex Trader Funding", category: "Futures Prop Firm", tbi: 82, status: "verified", payouts: "$640K", complaints: 14 },
  { id: "b_12", name: "Crypto Fund Trader", category: "Crypto Prop Firm", tbi: 78, status: "review", payouts: "$210K", complaints: 9 },
  { id: "b_13", name: "TradingView", category: "Trading Software", tbi: 94, status: "verified", payouts: "—", complaints: 2 },
  { id: "b_14", name: "TraderEvolution", category: "Trading Software", tbi: 80, status: "verified", payouts: "—", complaints: 5 },
  { id: "b_15", name: "Edgewonk", category: "Trading Tool", tbi: 83, status: "verified", payouts: "—", complaints: 3 },
  { id: "b_16", name: "Tradezella", category: "Trading Tool", tbi: 81, status: "verified", payouts: "—", complaints: 4 },
];

export const pendingReviews = [
  { id: "r_412", brand: "FTMO", user: "Aiden P.", rating: 5, snippet: "Fastest payout I've ever seen, under 4h…", flagged: false, time: "12m ago" },
  { id: "r_411", brand: "Maven Trading", user: "Marta S.", rating: 1, snippet: "They denied my withdrawal with no reason…", flagged: true, time: "26m ago" },
  { id: "r_410", brand: "E8 Markets", user: "Liam O.", rating: 2, snippet: "Support is slow and dashboard buggy…", flagged: false, time: "1h ago" },
  { id: "r_409", brand: "Alpha Capital", user: "Hassan A.", rating: 1, snippet: "Scam — they keep changing rules mid-challenge.", flagged: true, time: "2h ago" },
  { id: "r_408", brand: "FundingPips", user: "Yuki T.", rating: 5, snippet: "Clean platform, payout in 6h via TRC20.", flagged: false, time: "3h ago" },
];

export type AdminComplaint = {
  id: string;
  brand: string;
  user: string;
  anonymous?: boolean;
  category: string;
  severity: "low" | "medium" | "high";
  status: "pending" | "reviewing" | "responded" | "resolved" | "rejected" | "posted";
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
  evidenceFiles: { name: string; type: "image" | "pdf" | "csv" | "eml"; url: string }[];
  firmReply?: { text: string; date: string };
};

export const openComplaints: AdminComplaint[] = [
  {
    id: "c_88", brand: "Alpha Capital", user: "Hassan A.", category: "Withdrawal Denied",
    severity: "high", status: "reviewing", evidence: 3, time: "1h ago",
    title: "Account banned for ‘reverse trading’ without clear proof",
    description: "After passing Phase 2, my funded account got banned citing reverse trading. I never used a second account. Support replied with a generic email and refused to share trade IDs. I have requested logs three times — still nothing.",
    accountType: "Funded", accountSize: "$100,000", platform: "MT5", tradingStyle: "Manual",
    country: "Germany", expectation: "Account review", credibility: 92, upvotes: 184, comments: 23,
    evidenceFiles: [
      { name: "ban_email.eml", type: "eml", url: "#" },
      { name: "trade_history.csv", type: "csv", url: "#" },
      { name: "support_chat.png", type: "image", url: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600" },
    ],
    firmReply: { text: "We are re-investigating the case with our risk team and will update within 72h.", date: "1 day ago" },
  },
  {
    id: "c_87", brand: "E8 Markets", user: "Marta S.", category: "Account Blocked",
    severity: "high", status: "posted", evidence: 2, time: "3h ago",
    title: "Account blocked mid-payout with no explanation",
    description: "Requested $4,820 payout. The next morning my account was blocked. No email, no warning. Live chat keeps redirecting me to ‘compliance’ which never replies.",
    accountType: "Funded", accountSize: "$50,000", platform: "MT5", tradingStyle: "Manual",
    country: "Spain", expectation: "Payout", credibility: 81, upvotes: 96, comments: 14,
    evidenceFiles: [
      { name: "blocked_screenshot.png", type: "image", url: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600" },
      { name: "payout_request.pdf", type: "pdf", url: "#" },
    ],
  },
  {
    id: "c_86", brand: "Maven Trading", user: "Liam O.", category: "Slippage",
    severity: "medium", status: "responded", evidence: 1, time: "5h ago",
    title: "Massive slippage on NFP — 18 pips on EURUSD limit",
    description: "Placed a sell limit pre-NFP. Got filled 18 pips worse than the trigger. Same setup on my broker account: 0.4 pip slippage. Logs requested twice.",
    accountType: "Challenge", accountSize: "$25,000", platform: "MT4", tradingStyle: "Manual",
    country: "Brazil", expectation: "Explanation", credibility: 64, upvotes: 71, comments: 12,
    evidenceFiles: [
      { name: "fill_chart.png", type: "image", url: "https://images.unsplash.com/photo-1642790551116-18e150f248e3?w=600" },
    ],
    firmReply: { text: "Acknowledged — refund credited to the account.", date: "1 hour ago" },
  },
  {
    id: "c_85", brand: "FTMO", user: "Yuki T.", category: "Rule Dispute",
    severity: "low", status: "resolved", evidence: 4, time: "1d ago",
    title: "Hidden ‘consistency rule’ enforced after payout request",
    description: "Was told my best day exceeded 30% of total profits — rule wasn’t in the contract I signed when I bought the challenge. Resolved after escalation.",
    accountType: "Funded", accountSize: "$200,000", platform: "DXtrade", tradingStyle: "EA",
    country: "Japan", expectation: "Public awareness", credibility: 95, upvotes: 220, comments: 45,
    evidenceFiles: [
      { name: "contract.pdf", type: "pdf", url: "#" },
      { name: "rules_page.png", type: "image", url: "https://images.unsplash.com/photo-1611078489935-0cb964de46d6?w=600" },
      { name: "support_thread.eml", type: "eml", url: "#" },
      { name: "payout_proof.png", type: "image", url: "https://images.unsplash.com/photo-1556742400-b5b7c5121f4a?w=600" },
    ],
    firmReply: { text: "Rules page updated for clarity and the trader’s last payout refunded in full.", date: "2 weeks ago" },
  },
  {
    id: "c_84", brand: "Alpha Capital", user: "Sofia L.", anonymous: true, category: "Bad Support",
    severity: "medium", status: "reviewing", evidence: 0, time: "1d ago",
    title: "Support never replies to verification tickets",
    description: "Opened 4 tickets about KYC re-verification. No response in 9 days. Account stuck in ‘pending’ — cannot trade or withdraw.",
    accountType: "Challenge", accountSize: "$10,000", platform: "MT5", tradingStyle: "Manual",
    country: "Portugal", expectation: "Account review", credibility: 58, upvotes: 22, comments: 4,
    evidenceFiles: [],
  },
];

// Detailed complaint timelines + notes for the upgraded complaints page
export const complaintTimelines = {
  c_88: [
    { stage: "Submitted", actor: "Hassan A.", note: "Filed with 3 evidence files (screenshots, tx hash).", time: "1h ago" },
    { stage: "Reviewing", actor: "Mod team", note: "Assigned to @mod_lia. Brand notified via webhook.", time: "55m ago" },
    { stage: "Brand Response", actor: "Alpha Capital", note: "Pending — reminder sent.", time: "—" },
  ],
  c_87: [
    { stage: "Submitted", actor: "Marta S.", note: "Account blocked screenshot attached.", time: "3h ago" },
    { stage: "Posted", actor: "RB Editorial", note: "Made public on brand page after evidence verified.", time: "2h ago" },
  ],
  c_86: [
    { stage: "Submitted", actor: "Liam O.", note: "Slippage on EURUSD news event.", time: "5h ago" },
    { stage: "Reviewing", actor: "Mod team", note: "Logs requested from broker.", time: "4h ago" },
    { stage: "Responded", actor: "Maven Trading", note: "Acknowledged — refund credited.", time: "1h ago" },
  ],
} as const;

export const recentPayouts = [
  { id: "px_001", brand: "FundingPips", user: "u_9f12", amount: 4820, chain: "TRC20", speed: "2.4h", status: "verified", time: "5m ago" },
  { id: "px_002", brand: "FTMO", user: "u_9f10", amount: 12400, chain: "ERC20", speed: "3.1h", status: "verified", time: "12m ago" },
  { id: "px_003", brand: "Maven Trading", user: "u_9f0d", amount: 1820, chain: "TRC20", speed: "5.6h", status: "pending", time: "22m ago" },
  { id: "px_004", brand: "The5ers", user: "u_9f0a", amount: 7600, chain: "BTC", speed: "1.8h", status: "verified", time: "1h ago" },
  { id: "px_005", brand: "Alpha Capital", user: "u_9f09", amount: 980, chain: "TRC20", speed: "9.2h", status: "flagged", time: "2h ago" },
];

export const tbiQueue = [
  { brand: "Alpha Capital", current: 74, proposed: 68, reason: "12 new flagged complaints", action: "downgrade" },
  { brand: "E8 Markets", current: 79, proposed: 81, reason: "Improved payout speed", action: "upgrade" },
  { brand: "Maven Trading", current: 81, proposed: 78, reason: "Increased complaint rate", action: "downgrade" },
];

// TBI history per brand for trend visualization & override audit
export const tbiHistory = [
  { brand: "FTMO", history: [94, 94, 95, 95, 95, 95], lastChange: "+0.5 (auto, payout speed)", flagged: false },
  { brand: "FundingPips", history: [89, 90, 90, 91, 92, 92], lastChange: "+1 (auto, reviews)", flagged: false },
  { brand: "Maven Trading", history: [85, 84, 83, 82, 81, 81], lastChange: "-2 (auto, complaints)", flagged: false },
  { brand: "Alpha Capital", history: [80, 78, 76, 75, 74, 74], lastChange: "-1 (admin override)", flagged: true },
  { brand: "E8 Markets", history: [82, 81, 80, 79, 79, 79], lastChange: "Pending recalc", flagged: false },
];

export const auditLog = [
  { id: "a_91", actor: "admin@rebateboard.com", action: "Approved review r_408", target: "FundingPips", time: "2m ago" },
  { id: "a_90", actor: "system", action: "Auto-flagged complaint c_88", target: "Alpha Capital", time: "1h ago" },
  { id: "a_89", actor: "mod@rebateboard.com", action: "Banned user u_8f21 (spam)", target: "u_8f21", time: "3h ago" },
  { id: "a_88", actor: "admin@rebateboard.com", action: "Updated TBI weights", target: "system", time: "5h ago" },
  { id: "a_87", actor: "admin@rebateboard.com", action: "Verified payout px_004", target: "The5ers", time: "1d ago" },
  { id: "a_86", actor: "system", action: "Cron: TBI recalculation", target: "127 brands", time: "1d ago" },
];

export const featureFlags = [
  { key: "tbi_v2_engine", label: "TBI v2 Trust Engine", enabled: true, rollout: "100%" },
  { key: "ai_coach_pro", label: "Rebeta Pro tier", enabled: true, rollout: "25%" },
  { key: "wallet_swap", label: "Wallet swap (TRC20↔ERC20)", enabled: false, rollout: "0%" },
  { key: "academy_certs", label: "Academy certifications", enabled: true, rollout: "100%" },
  { key: "social_login_apple", label: "Sign in with Apple", enabled: false, rollout: "0%" },
];

export const apiKeys = [
  { name: "Public Read API", key: "pk_live_•••••a91f", created: "Mar 2026", calls: "1.2M / mo" },
  { name: "Webhooks (Payouts)", key: "wh_•••••4c20", created: "Jan 2026", calls: "82K / mo" },
  { name: "Affiliate API", key: "aff_•••••7e11", created: "Apr 2026", calls: "14K / mo" },
];

export const academyContent = [
  { id: "ac_1", title: "Risk Management 101", author: "RB Team", students: 4280, status: "published", updated: "2d ago" },
  { id: "ac_2", title: "Passing FTMO Phase 1", author: "Aiden P.", students: 2140, status: "published", updated: "5d ago" },
  { id: "ac_3", title: "TRC20 Withdrawal Guide", author: "RB Team", students: 1820, status: "draft", updated: "1d ago" },
  { id: "ac_4", title: "Reading Smart Money", author: "Marta S.", students: 962, status: "review", updated: "8h ago" },
];

export type BlogPost = {
  id: string;
  title: string;
  author: string;
  views: string;
  status: "published" | "draft";
  time: string;
  cover?: string;
  body?: string;
  tag?: string;        // e.g. "Guide", "Comparison"
  excerpt?: string;    // short summary for cards
  readTime?: string;   // e.g. "6 min read"
};

export const blogPosts: BlogPost[] = [
  { id: "bp_1", title: "Why TBI matters in 2026", author: "RB Editorial", views: "12.4K", status: "published", time: "1d ago",
    tag: "Industry", excerpt: "How the Trust & Brand Index reshaped how traders pick brokers and prop firms.", readTime: "6 min read",
    body: "## Why TBI matters\n\nIn 2026 traders no longer rely on flashy marketing pages. The TBI score combines verified payouts, complaint resolution, regulation and community signal into a single number.\n\nA higher TBI means a more trusted partner — and our data shows traders using TBI as their first filter are 3x less likely to file a withdrawal dispute." },
  { id: "bp_2", title: "Top 10 Prop Firms — April Report", author: "RB Editorial", views: "8.7K", status: "published", time: "3d ago",
    tag: "Comparison", excerpt: "Our monthly ranking of the most reliable prop firms based on payouts, rules and trader reviews.", readTime: "9 min read",
    body: "## April 2026 ranking\n\nThe top 10 prop firms this month are dominated by partners with verified payout speeds under 6 hours and complaint resolution rates above 92%.\n\nFTMO, FundingPips and The5ers continue to lead, while Apex Trader Funding climbed two spots after a strong month for futures payouts." },
  { id: "bp_3", title: "Inside a Withdrawal Dispute", author: "Liam O.", views: "0", status: "draft", time: "2h ago",
    tag: "Trader 101", excerpt: "A behind-the-scenes look at how RebateBoard helps traders recover denied payouts.", readTime: "5 min read",
    body: "## A real case\n\nA trader had a $4,820 withdrawal denied by a prop firm citing a vague rule violation. Here's how the dispute was resolved through our complaints engine in under 72 hours." },
];

export type OfferCategory = "Prop Firms" | "Brokers" | "Exchanges" | "Tools" | "Education";
export type OfferMode = "form" | "flyer";
export type OfferTag = "exclusive" | "new" | "limited" | "trending" | "free-account";

export type AdminOffer = {
  id: string;
  brand: string;
  brandId?: string;
  category: OfferCategory;
  title: string;
  description?: string;
  discount?: string;        // e.g. "20% OFF" or "FREE ACCOUNT"
  code?: string;
  ctaUrl?: string;
  partnerTrackingUrl?: string;
  offerType?: string;
  eligibility?: string;
  howToClaim?: string;
  startDate?: string;       // ISO
  expires: string;          // human label ("May 30") or ISO
  limitedTime?: boolean;
  status: "active" | "paused" | "expired";
  uses: number;
  views?: number;
  mode: OfferMode;
  flyerUrl?: string;        // when mode === "flyer"
  accentFrom?: string;      // brand hex (e.g. "#5A22F1")
  accentTo?: string;
  tags?: OfferTag[];
  terms?: string;
  pinned?: boolean;
  createdAt?: string;
};

export const offers: AdminOffer[] = [
  { id: "of_1", brand: "FundingPips", brandId: "b_01", category: "Prop Firms", title: "20% OFF all accounts", description: "20% off all accounts — first order only.", discount: "20% OFF", code: "MATCH", uses: 1240, status: "active", expires: "May 30", mode: "form", accentFrom: "#5A22F1", accentTo: "#7E4DFF", tags: ["exclusive", "trending"], pinned: true, createdAt: "2026-04-22" },
  { id: "of_2", brand: "FTMO", brandId: "b_02", category: "Prop Firms", title: "Free retry on Phase 1", description: "Get a free Phase 1 retry on any FTMO challenge.", discount: "FREE RETRY", code: "FTMO-RETRY", uses: 820, status: "active", expires: "Jun 15", mode: "form", accentFrom: "#22d3ee", accentTo: "#3b82f6", tags: ["new"], createdAt: "2026-04-25" },
  { id: "of_3", brand: "The5ers", brandId: "b_04", category: "Prop Firms", title: "10% OFF + Free account", description: "10% off + credits equivalent to a free account of the same size if reaching payout (first order only).", discount: "10% OFF", code: "MATCH", uses: 410, status: "active", expires: "May 14", mode: "form", accentFrom: "#f59e0b", accentTo: "#ef4444", tags: ["limited", "free-account"], createdAt: "2026-04-28" },
  { id: "of_4", brand: "Goat Funded Trader", category: "Prop Firms", title: "40% OFF + Free account", description: "40% off all accounts + free account upon payout (issued by the firm) — limited time only.", discount: "40% OFF", code: "MATCH40", uses: 612, status: "active", expires: "May 14", mode: "form", accentFrom: "#10b981", accentTo: "#06b6d4", tags: ["exclusive", "limited", "free-account"], pinned: true, createdAt: "2026-04-29" },
  { id: "of_5", brand: "Bybit", brandId: "b_07", category: "Exchanges", title: "30% fee rebate for 30 days", description: "New users get a 30% fee rebate for the first 30 days after signing up via RebateBoard.", discount: "30% REBATE", code: "RBYBIT", uses: 287, status: "active", expires: "Jun 30", mode: "form", accentFrom: "#fbbf24", accentTo: "#f97316", tags: ["new"], createdAt: "2026-04-30" },
  { id: "of_6", brand: "Exness", brandId: "b_09", category: "Brokers", title: "Up to $1,000 deposit bonus", description: "Get up to $1,000 deposit bonus when funding a verified Exness account.", discount: "BONUS", code: "EXN1000", uses: 145, status: "active", expires: "Jul 01", mode: "form", accentFrom: "#0ea5e9", accentTo: "#6366f1", tags: ["trending"], createdAt: "2026-05-01" },
  { id: "of_7", brand: "TradingView", brandId: "b_13", category: "Tools", title: "1 month FREE Premium", description: "Activate one month of TradingView Premium, free for new users.", discount: "1 MONTH FREE", code: "TV-FREE", uses: 902, status: "active", expires: "Jun 10", mode: "form", accentFrom: "#3b82f6", accentTo: "#7e4dff", tags: ["exclusive"], createdAt: "2026-05-02" },
];

// RR ledger (legacy)
export const walletLedger = [
  { id: "tx_001", user: "u_9f12", type: "Earn (Review)", amount: "+12 RR", balance: "1,302 RR", time: "2m ago" },
  { id: "tx_002", user: "u_9f10", type: "Redeem (Discount)", amount: "-200 RR", balance: "82 RR", time: "8m ago" },
  { id: "tx_003", user: "u_9f0d", type: "Earn (Referral)", amount: "+50 RR", balance: "640 RR", time: "22m ago" },
  { id: "tx_004", user: "u_9f0a", type: "Payout (USDT)", amount: "-1,000 RR", balance: "0 RR", time: "1h ago" },
  { id: "tx_005", user: "u_9f09", type: "Earn (Trade Log)", amount: "+8 RR", balance: "412 RR", time: "1h ago" },
];

// === NEW: USD Wallets per user (RebateBoard cash wallet) ===
export type UserWallet = {
  walletId: string;
  userId: string;
  name: string;
  available: number;
  pending: number;
  totalEarned: number;
  totalWithdrawn: number;
  status: "active" | "frozen";
  arr?: number;
};

export const userWallets: UserWallet[] = [
  { walletId: "w_9f12", userId: "u_9f12", name: "Aiden Park", available: 482.4, pending: 124.0, totalEarned: 1820.5, totalWithdrawn: 1214.1, status: "active", arr: 1240 },
  { walletId: "w_9f11", userId: "u_9f11", name: "Marta Silva", available: 220.0, pending: 60.0, totalEarned: 940.0, totalWithdrawn: 660.0, status: "active", arr: 540 },
  { walletId: "w_9f10", userId: "u_9f10", name: "Liam O'Connor", available: 1240.0, pending: 0.0, totalEarned: 4200.5, totalWithdrawn: 2960.5, status: "active", arr: 2120 },
  { walletId: "w_9f0f", userId: "u_9f0f", name: "Yuki Tanaka", available: 88.0, pending: 32.0, totalEarned: 612.4, totalWithdrawn: 492.4, status: "active", arr: 320 },
  { walletId: "w_9f0e", userId: "u_9f0e", name: "Hassan Ali", available: 0.0, pending: 0.0, totalEarned: 240.0, totalWithdrawn: 240.0, status: "frozen", arr: 0 },
  { walletId: "w_9f0d", userId: "u_9f0d", name: "Elena Rossi", available: 312.0, pending: 80.0, totalEarned: 1110.0, totalWithdrawn: 718.0, status: "active", arr: 480 },
];

// === NEW: Cashback engine — per user partner accrual ===
export type CashbackRow = {
  id: string;
  user: string;
  partner: string;
  category: "Forex Broker" | "Prop Firm" | "Crypto Exchange";
  volumeLots: number;
  commissionGenerated: number;
  rebatePercent: number;
  rebateEarned: number;
  rebatePaid: number;
  pending: number;
  status: "approved" | "pending" | "paid" | "flagged";
  updated: string;
};

export const cashbackRows: CashbackRow[] = [
  { id: "cb_001", user: "Aiden Park", partner: "Exness", category: "Forex Broker", volumeLots: 124, commissionGenerated: 1240, rebatePercent: 60, rebateEarned: 744, rebatePaid: 600, pending: 144, status: "approved", updated: "2h ago" },
  { id: "cb_002", user: "Liam O'Connor", partner: "FTMO", category: "Prop Firm", volumeLots: 0, commissionGenerated: 320, rebatePercent: 50, rebateEarned: 160, rebatePaid: 160, pending: 0, status: "paid", updated: "1d ago" },
  { id: "cb_003", user: "Yuki Tanaka", partner: "Bybit", category: "Crypto Exchange", volumeLots: 0, commissionGenerated: 88.5, rebatePercent: 40, rebateEarned: 35.4, rebatePaid: 0, pending: 35.4, status: "pending", updated: "30m ago" },
  { id: "cb_004", user: "Marta Silva", partner: "FundingPips", category: "Prop Firm", volumeLots: 0, commissionGenerated: 420, rebatePercent: 50, rebateEarned: 210, rebatePaid: 150, pending: 60, status: "approved", updated: "4h ago" },
  { id: "cb_005", user: "Hassan Ali", partner: "Alpha Capital", category: "Prop Firm", volumeLots: 0, commissionGenerated: 180, rebatePercent: 50, rebateEarned: 90, rebatePaid: 0, pending: 90, status: "flagged", updated: "1h ago" },
  { id: "cb_006", user: "Elena Rossi", partner: "IC Markets", category: "Forex Broker", volumeLots: 64, commissionGenerated: 580, rebatePercent: 55, rebateEarned: 319, rebatePaid: 240, pending: 79, status: "approved", updated: "6h ago" },
];

// === NEW: Claim system ===
// "rebate-wallet" is the canonical name. "revete-wallet" kept as alias for legacy data.
export type PayoutTarget = "rr-wallet" | "broker-wallet" | "rebate-wallet" | "revete-wallet";
export type PayoutMode = "auto-api" | "manual-claim";

// === NEW: Linked broker / exchange accounts (per user) ===
export type LinkedAccountStatus = "pending-attach" | "active" | "rejected" | "removed";
export type LinkedAccount = {
  id: string;
  user: string;             // display name (demo)
  brand: string;            // partner brand name
  brandCategory: string;    // e.g. "Forex Broker"
  accountId: string;        // trader's account ID at partner
  registeredEmail?: string; // email used at partner
  isNewAccount: boolean;    // true if signed up via our affiliate link
  payoutTarget: PayoutTarget; // default preference for this linked account
  status: LinkedAccountStatus;
  linkedAt: string;
  partnerRequestId?: string;  // FK → partnerRequests
};

// === NEW: Partner attach-request inbox (superadmin) ===
export type PartnerRequestStatus = "queued" | "sent" | "acknowledged" | "rejected";
export type PartnerRequest = {
  id: string;
  user: string;             // requesting trader (demo display)
  brand: string;
  brandCategory: string;
  toEmail: string;          // partner support / partners@brand.com
  subject: string;
  body: string;
  partnerCode?: string;     // our affiliate code injected
  affiliateLink?: string;
  registeredEmail?: string; // trader's email at partner
  accountId: string;
  status: PartnerRequestStatus;
  createdAt: string;
  sentAt?: string;
  linkedAccountId?: string;
};

export const linkedAccounts: LinkedAccount[] = [
  { id: "la_001", user: "Aiden Park", brand: "Exness", brandCategory: "Forex Broker", accountId: "EX-882144", registeredEmail: "aiden@flowtrade.io", isNewAccount: false, payoutTarget: "rebate-wallet", status: "active", linkedAt: "5d ago" },
  { id: "la_002", user: "Aiden Park", brand: "Bybit", brandCategory: "Crypto Exchange", accountId: "BY-71044", registeredEmail: "aiden@flowtrade.io", isNewAccount: true, payoutTarget: "broker-wallet", status: "active", linkedAt: "2d ago" },
];

export const partnerRequests: PartnerRequest[] = [
  {
    id: "pr_001", user: "Aiden Park", brand: "IC Markets", brandCategory: "Forex Broker",
    toEmail: "partners@icmarkets.com", subject: "Account attach request — RebateBoard",
    body: "Dear Partner team,\n\nKindly attach my trading account 12345678 under RebateBoard (partner code: RB-IC-2245).\n\nRegistered email: trader@example.com\n\nThank you,\nAiden Park",
    partnerCode: "RB-IC-2245", affiliateLink: "https://icmarkets.com/?ref=RB-IC-2245",
    registeredEmail: "trader@example.com", accountId: "12345678",
    status: "sent", createdAt: "1d ago", sentAt: "1d ago",
  },
];

export type Claim = {
  id: string;
  user: string;
  partner: string;
  partnerCategory?: string;
  accountId: string;
  type: "Cashback" | "Missing Trade" | "Manual Credit";
  amount: number;
  amountCurrency?: "USD" | "RR" | string;
  evidence: number; // count of attachments
  evidenceUrls?: string[]; // proof images / data URLs
  invoiceUrl?: string;     // single primary invoice / screenshot
  registeredEmail?: string; // proof: email used to register at partner
  orderId?: string;         // proof: order / receipt id
  payoutTarget?: PayoutTarget; // where the cashback should go on approval
  submitted: string;
  status: "pending" | "approved" | "paid" | "rejected";
  note?: string;
  approvedAt?: string;
  approvedBy?: string;
  paidAt?: string;
  paidBy?: string;
  payoutMethod?: string;     // e.g. "USDT TRC20", "Bank wire", "Auto credit"
  payoutTxRef?: string;      // tx hash / wire ref / "auto"
};

export const claims: Claim[] = [
  { id: "cl_201", user: "Aiden Park", partner: "Exness", accountId: "EX-882144", type: "Cashback", amount: 144, evidence: 2, submitted: "2h ago", status: "pending", payoutTarget: "rebate-wallet" },
  { id: "cl_202", user: "Yuki Tanaka", partner: "Bybit", accountId: "BY-71044", type: "Missing Trade", amount: 35.4, evidence: 3, submitted: "30m ago", status: "pending", payoutTarget: "rr-wallet" },
  { id: "cl_203", user: "Hassan Ali", partner: "Alpha Capital", accountId: "AC-66112", type: "Cashback", amount: 90, evidence: 1, submitted: "1h ago", status: "pending", note: "Flagged duplicate IP.", payoutTarget: "broker-wallet" },
  { id: "cl_204", user: "Liam O'Connor", partner: "FTMO", accountId: "FTMO-220194", type: "Cashback", amount: 160, evidence: 4, submitted: "1d ago", status: "paid", payoutTarget: "rebate-wallet", approvedAt: "1d ago", paidAt: "20h ago", paidBy: "@admin", payoutMethod: "Auto credit", payoutTxRef: "auto" },
  { id: "cl_205", user: "Marta Silva", partner: "FundingPips", accountId: "FP-90014", type: "Manual Credit", amount: 30, evidence: 0, submitted: "2d ago", status: "rejected", note: "Insufficient evidence." },
];

// === Affiliates: extend with partner + sub-IB structure ===
export const affiliates = [
  { id: "af_1", name: "Aiden Park", partner: "Exness", structure: "Per lot · $4.00", subIBs: 6, referrals: 142, earned: "$2,840", pending: "$420", tier: "Gold" },
  { id: "af_2", name: "Marta Silva", partner: "FundingPips", structure: "Per sale · 25%", subIBs: 2, referrals: 98, earned: "$1,720", pending: "$180", tier: "Silver" },
  { id: "af_3", name: "Yuki Tanaka", partner: "Bybit", structure: "Per trade · 30%", subIBs: 0, referrals: 64, earned: "$980", pending: "$60", tier: "Silver" },
  { id: "af_4", name: "Hassan Ali", partner: "FTMO", structure: "Per sale · 20%", subIBs: 1, referrals: 31, earned: "$440", pending: "$0", tier: "Bronze" },
];

export const partnerStructures = [
  { partner: "Exness", category: "Forex Broker", model: "Per lot", rate: "$4.00 / lot", subIB: "Up to 3 levels", active: true },
  { partner: "IC Markets", category: "Forex Broker", model: "Per lot", rate: "$3.50 / lot", subIB: "2 levels", active: true },
  { partner: "FTMO", category: "Prop Firm", model: "Per sale", rate: "20% recurring", subIB: "1 level", active: true },
  { partner: "FundingPips", category: "Prop Firm", model: "Per sale", rate: "25% recurring", subIB: "2 levels", active: true },
  { partner: "Bybit", category: "Crypto Exchange", model: "Per trade", rate: "30% commission", subIB: "1 level", active: true },
  { partner: "Alpha Capital", category: "Prop Firm", model: "Per sale", rate: "15% recurring", subIB: "—", active: false },
];

export const disputes = [
  { id: "d_01", user: "u_9f0a", brand: "Alpha Capital", amount: "$980", reason: "Withdrawal denied — chargeback", status: "open", time: "2h ago" },
  { id: "d_02", user: "u_9f12", brand: "E8 Markets", amount: "$1,200", reason: "Account blocked mid-payout", status: "investigating", time: "6h ago" },
  { id: "d_03", user: "u_9f10", brand: "Maven Trading", amount: "$320", reason: "Slippage refund", status: "resolved", time: "1d ago" },
];

export const notifications = [
  { id: "n_1", title: "System maintenance Apr 30 02:00 UTC", channel: "All users", status: "scheduled", reach: "48K" },
  { id: "n_2", title: "New TBI rankings published", channel: "Push + Email", status: "sent", reach: "32K" },
  { id: "n_3", title: "FTMO Spring promo live", channel: "In-app", status: "draft", reach: "—" },
];

export const leaderboardSettings = [
  { metric: "PnL %", weight: 40, enabled: true },
  { metric: "Win Rate", weight: 20, enabled: true },
  { metric: "Risk Score", weight: 20, enabled: true },
  { metric: "Consistency", weight: 15, enabled: true },
  { metric: "Community Karma", weight: 5, enabled: true },
];

// === NEW: Withdrawals queue ===
export type Withdrawal = {
  id: string;
  user: string;
  amount: number;
  method: "USDT TRC20" | "USDT ERC20" | "BTC" | "Bank Wire";
  destination: string;
  status: "pending" | "approved" | "paid" | "rejected";
  time: string;
};

export const withdrawals: Withdrawal[] = [
  { id: "wd_001", user: "Aiden Park", amount: 240, method: "USDT TRC20", destination: "TJfPp…q14a", status: "pending", time: "12m ago" },
  { id: "wd_002", user: "Liam O'Connor", amount: 1200, method: "USDT ERC20", destination: "0x82a…f041", status: "approved", time: "1h ago" },
  { id: "wd_003", user: "Elena Rossi", amount: 180, method: "USDT TRC20", destination: "TR4nM…21bc", status: "pending", time: "2h ago" },
  { id: "wd_004", user: "Yuki Tanaka", amount: 88, method: "BTC", destination: "bc1q9…h70p", status: "paid", time: "1d ago" },
  { id: "wd_005", user: "Hassan Ali", amount: 90, method: "Bank Wire", destination: "AE••••2210", status: "rejected", time: "2d ago" },
];

// === RR rules expanded ===
export const rrEarnRules = [
  { id: "er_1", action: "Submit verified review", reward: 12, enabled: true },
  { id: "er_2", action: "Log a trade", reward: 2, enabled: true },
  { id: "er_3", action: "Refer a friend (KYC pass)", reward: 50, enabled: true },
  { id: "er_4", action: "Submit complaint with evidence", reward: 15, enabled: true },
  { id: "er_5", action: "Complete Academy course", reward: 25, enabled: true },
];

export const rrSpendRules = [
  { id: "sp_1", action: "Convert 100 RR → $1", cost: 100, enabled: true },
  { id: "sp_2", action: "Unlock premium course", cost: 250, enabled: true },
  { id: "sp_3", action: "Boost a brand review", cost: 50, enabled: false },
];

// === FAQs CMS ===
export type Faq = {
  id: string;
  category: "Account" | "Wallet" | "Cashback" | "Claims" | "TBI" | "General";
  question: string;
  answer: string;
  status: "published" | "draft";
  updated: string;
  views: number;
};

export const faqs: Faq[] = [
  { id: "faq_1", category: "Cashback", question: "How is my cashback calculated?", answer: "Cashback is 50% of the affiliate commission your trading activity generates with our partners. Rates per partner are visible in your dashboard.", status: "published", updated: "2d ago", views: 4820 },
  { id: "faq_2", category: "Wallet", question: "When can I withdraw?", answer: "You can request a withdrawal once your available balance is at least $20. TRC20 withdrawals process within 24h.", status: "published", updated: "5d ago", views: 3120 },
  { id: "faq_3", category: "Claims", question: "What evidence do I need to submit a claim?", answer: "Provide your trading account ID, the partner name, and a screenshot or statement showing the missing trade or commission.", status: "published", updated: "1w ago", views: 1840 },
  { id: "faq_4", category: "TBI", question: "How is the TBI score calculated?", answer: "The TBI score combines payout reliability (30%), complaint rate (25%), verified reviews (20%), transparency (15%), and community signal (10%).", status: "published", updated: "3d ago", views: 2240 },
  { id: "faq_5", category: "Account", question: "How do I verify my identity?", answer: "Go to Dashboard → Profile → KYC and upload a government-issued ID + a selfie. Verification usually takes under 2 hours.", status: "draft", updated: "1d ago", views: 0 },
];

// =========================================================================
// === V2.0 Expanded entities — Roles, Inbox, News, Announcements, Popups,
// === Subscribers, Transactions, Offers (extended), Editorial reviews
// =========================================================================

// Mission Control extended KPIs
export const platformKpis: AdminKPI[] = [
  { label: "Active Users", value: "32,140", delta: "66.6% of base", tone: "up" },
  { label: "Inactive Users", value: "15,890", delta: "33% — re-engage", tone: "flat" },
  { label: "Suspended Users", value: "189", delta: "+12 this week", tone: "down" },
  { label: "Brokers", value: "48", delta: "+2 new", tone: "up" },
  { label: "Prop Firms", value: "62", delta: "+3 new", tone: "up" },
  { label: "Futures Prop", value: "11", delta: "+1 new", tone: "up" },
  { label: "Crypto Prop", value: "8", delta: "stable", tone: "flat" },
  { label: "Crypto Exchanges", value: "9", delta: "stable", tone: "flat" },
];

// Country & experience analytics (for Mission Control)
export const usersByCountry = [
  { country: "🇺🇸 United States", users: 8420, pct: 17.5 },
  { country: "🇮🇳 India", users: 6210, pct: 12.9 },
  { country: "🇬🇧 United Kingdom", users: 3890, pct: 8.1 },
  { country: "🇦🇪 UAE", users: 3120, pct: 6.5 },
  { country: "🇧🇷 Brazil", users: 2740, pct: 5.7 },
  { country: "🇩🇪 Germany", users: 2410, pct: 5.0 },
  { country: "🇳🇬 Nigeria", users: 2180, pct: 4.5 },
];

export const tradingExperience = [
  { level: "Beginner (<1yr)", users: 14820, pct: 30.7 },
  { level: "Intermediate (1-3yr)", users: 19210, pct: 39.8 },
  { level: "Advanced (3-5yr)", users: 9180, pct: 19.0 },
  { level: "Pro (5yr+)", users: 5009, pct: 10.4 },
];

export const monthlySignups = [
  { month: "Nov", count: 2840 },
  { month: "Dec", count: 3120 },
  { month: "Jan", count: 3680 },
  { month: "Feb", count: 4120 },
  { month: "Mar", count: 4920 },
  { month: "Apr", count: 5840 },
];

// === ROLES & PERMISSIONS ===
export type Role = {
  id: string;
  name: string;
  description: string;
  status: "active" | "inactive";
  users: number;
  assignedEmails?: string[];
  created: string;
  permissions: string[];
};

// Permissions are grouped so the role editor can render them by section.
// Each permission id maps 1:1 to a sidebar route or a capability inside a page.
export type PermissionGroup = { id: string; label: string; permissions: { id: string; label: string; route?: string }[] };

export const permissionGroups: PermissionGroup[] = [
  {
    id: "core",
    label: "Core",
    permissions: [
      { id: "view_mission_control", label: "View Mission Control", route: "/superadmin" },
      { id: "view_analytics", label: "View Analytics", route: "/superadmin/analytics" },
      { id: "view_journal_analytics", label: "View Journal Analytics", route: "/superadmin/journal-analytics" },
      { id: "manage_daily_tasks", label: "Manage Daily Tasks", route: "/superadmin/daily-tasks" },
      { id: "view_search_analytics", label: "View Search Analytics", route: "/superadmin/search-analytics" },
      { id: "view_users", label: "View Users", route: "/superadmin/users" },
      { id: "edit_users", label: "Edit Users" },
      { id: "manage_roles", label: "Manage Roles & Permissions", route: "/superadmin/roles" },
      { id: "manage_inbox", label: "Manage Inbox", route: "/superadmin/inbox" },
    ],
  },
  {
    id: "brands",
    label: "Brands & Trust",
    permissions: [
      { id: "manage_brands", label: "Manage Brands", route: "/superadmin/brands" },
      { id: "create_brands", label: "Create Brands", route: "/superadmin/brands/new" },
      { id: "manage_offers", label: "Manage Offers & Discounts", route: "/superadmin/offers" },
      { id: "manage_reviews", label: "Moderate Reviews", route: "/superadmin/reviews" },
      { id: "manage_complaints", label: "Manage Complaints", route: "/superadmin/complaints" },
      { id: "manage_tbi", label: "Manage TBI Engine", route: "/superadmin/tbi" },
      { id: "manage_brand_requests", label: "Manage Brand Requests", route: "/superadmin/brand-requests" },
      { id: "manage_backtest", label: "Manage AI Backtest Lab", route: "/superadmin/backtest" },
    ],
  },
  {
    id: "finance",
    label: "Finance & Ops",
    permissions: [
      { id: "manage_wallets", label: "Manage User Wallets", route: "/superadmin/wallets" },
      { id: "approve_withdrawals", label: "Approve Withdrawals", route: "/superadmin/withdrawals" },
      { id: "view_transactions", label: "View Transactions", route: "/superadmin/transactions" },
      { id: "manage_trt", label: "Manage ROI Tracker", route: "/superadmin/trt" },
      { id: "manage_claims", label: "Manage Cashback Claims", route: "/superadmin/claims" },
      { id: "manage_partner_requests", label: "Manage Partner Requests", route: "/superadmin/partner-requests" },
      { id: "manage_cashback", label: "Manage Cashback Engine", route: "/superadmin/cashback" },
      { id: "manage_payouts", label: "Manage Payouts", route: "/superadmin/payouts" },
      { id: "manage_rr_ledger", label: "Manage RR Ledger", route: "/superadmin/wallet" },
      { id: "manage_affiliates", label: "Manage Affiliates / IB", route: "/superadmin/affiliates" },
      { id: "manage_disputes", label: "Manage Disputes", route: "/superadmin/disputes" },
    ],
  },
  {
    id: "growth",
    label: "Growth & Content",
    permissions: [
      { id: "manage_rr", label: "Manage RR Control Center", route: "/superadmin/rr" },
      { id: "manage_rr_purchases", label: "Manage RR Purchases", route: "/superadmin/rr-purchases" },
      { id: "manage_leaderboards", label: "Manage Leaderboards", route: "/superadmin/leaderboards" },
      { id: "manage_academy", label: "Manage Academy", route: "/superadmin/academy" },
      { id: "manage_blog", label: "Manage Blog & News", route: "/superadmin/blog" },
      { id: "manage_news", label: "Manage Company News", route: "/superadmin/news" },
      { id: "manage_faqs", label: "Manage FAQs", route: "/superadmin/faqs" },
      { id: "manage_announcements", label: "Manage Announcements", route: "/superadmin/announcements" },
      { id: "manage_ads", label: "Manage Dashboard Ads", route: "/superadmin/ads" },
      { id: "manage_demo_accounts", label: "Manage Demo Accounts", route: "/superadmin/demo-accounts" },
      { id: "manage_challenge_purchases", label: "Manage Challenge Purchases", route: "/superadmin/challenge-purchases" },
      { id: "manage_top_sellers", label: "Manage Top Sellers", route: "/superadmin/top-sellers" },
      { id: "manage_popups", label: "Manage Pop-ups", route: "/superadmin/popups" },
      { id: "manage_subscribers", label: "Manage Subscribers", route: "/superadmin/subscribers" },
    ],
  },
  {
    id: "system",
    label: "System",
    permissions: [
      { id: "access_audit_log", label: "Access Audit Log", route: "/superadmin/audit" },
      { id: "manage_flags", label: "Manage Feature Flags", route: "/superadmin/flags" },
      { id: "manage_notifications", label: "Manage Notifications", route: "/superadmin/notifications" },
      { id: "manage_api_keys", label: "Manage API Keys", route: "/superadmin/api-keys" },
      { id: "manage_bug_bounty", label: "Manage Bug Bounty", route: "/superadmin/Bug-bounty" },
      { id: "manage_settings", label: "Manage Platform Settings", route: "/superadmin/settings" },
      { id: "export_data", label: "Export Data" },
    ],
  },
];

export const allPermissions: string[] = permissionGroups.flatMap((g) => g.permissions.map((p) => p.id));

// Map route → required permission, for sidebar gating.
export const routePermissionMap: Record<string, string> = Object.fromEntries(
  permissionGroups.flatMap((g) => g.permissions.filter((p) => p.route).map((p) => [p.route as string, p.id])),
);

export const roles: Role[] = [
  { id: "ro_1", name: "Super Admin", description: "Full unrestricted access to every module.", status: "active", users: 3, created: "Jan 2025", permissions: allPermissions },
  {
    id: "ro_2", name: "Finance Admin", description: "Wallets, withdrawals, transactions, cashback, payouts.",
    status: "active", users: 4, created: "Jan 2025",
    permissions: ["view_mission_control", "view_journal_analytics", "manage_daily_tasks", "manage_wallets", "approve_withdrawals", "view_transactions", "manage_claims", "manage_cashback", "manage_payouts", "manage_rr_ledger", "manage_rr_purchases", "manage_affiliates", "manage_disputes", "export_data"],
  },
  {
    id: "ro_3", name: "Content Admin", description: "Blog, Academy, FAQs, News, Announcements, Ads.",
    status: "active", users: 6, created: "Feb 2025",
    permissions: ["view_mission_control", "manage_daily_tasks", "manage_blog", "manage_news", "manage_academy", "manage_faqs", "manage_announcements", "manage_ads", "manage_demo_accounts", "manage_challenge_purchases", "manage_popups", "manage_subscribers", "view_users"],
  },
  {
    id: "ro_4", name: "Support Admin", description: "Inbox, complaints triage, user help.",
    status: "active", users: 8, created: "Feb 2025",
    permissions: ["view_mission_control", "manage_daily_tasks", "view_users", "manage_inbox", "manage_complaints", "manage_disputes"],
  },
  {
    id: "ro_5", name: "Review Moderator", description: "Approves / rejects user reviews and updates TBI impact.",
    status: "active", users: 5, created: "Mar 2025",
    permissions: ["view_mission_control", "manage_reviews", "manage_tbi"],
  },
  {
    id: "ro_6", name: "Complaints Manager", description: "Owns complaint resolution & brand liaison.",
    status: "active", users: 3, created: "Mar 2025",
    permissions: ["view_mission_control", "manage_complaints", "manage_disputes", "view_users", "manage_inbox"],
  },
  {
    id: "ro_7", name: "Partner Manager", description: "Brand onboarding, partner & brand requests, offers.",
    status: "active", users: 2, created: "Apr 2025",
    permissions: ["view_mission_control", "manage_daily_tasks", "manage_brands", "create_brands", "manage_offers", "manage_brand_requests", "manage_partner_requests", "manage_affiliates", "view_users"],
  },
  {
    id: "ro_8", name: "Rewards Manager", description: "RR Control Center, leaderboards, ROI tracker, backtest.",
    status: "active", users: 2, created: "May 2026",
    permissions: ["view_mission_control", "view_journal_analytics", "manage_daily_tasks", "manage_rr", "manage_rr_purchases", "manage_rr_ledger", "manage_demo_accounts", "manage_challenge_purchases", "manage_leaderboards", "manage_trt", "manage_backtest", "view_analytics"],
  },
  {
    id: "ro_9", name: "Analytics Viewer", description: "Read-only access to analytics dashboards.",
    status: "active", users: 4, created: "May 2026",
    permissions: ["view_mission_control", "view_journal_analytics", "manage_daily_tasks", "view_analytics", "view_search_analytics", "view_transactions", "export_data"],
  },
];

// === INBOX ===
export type InboxMessage = {
  id: string;
  user: string;
  email: string;
  subject: string;
  type: "Support" | "Bug" | "Feedback" | "Partnership" | "Other";
  status: "new" | "open" | "replied" | "closed";
  received: string;
  assigned?: string;
  preview: string;
};

export const inboxMessages: InboxMessage[] = [
  { id: "in_001", user: "Aiden Park", email: "aiden@flowtrade.io", subject: "Withdrawal stuck for 3 days", type: "Support", status: "new", received: "12m ago", preview: "Hi team, my TRC20 withdrawal of $240 has been pending since Monday…" },
  { id: "in_002", user: "Marta Silva", email: "marta@protrade.com", subject: "Bug: brand search returns empty", type: "Bug", status: "open", received: "1h ago", assigned: "@mod_lia", preview: "Searching for 'FTMO' returns no results on mobile…" },
  { id: "in_003", user: "Liam O'Connor", email: "liam@gmail.com", subject: "Affiliate partnership", type: "Partnership", status: "replied", received: "3h ago", assigned: "@partner_jay", preview: "I run a 40K subscriber YouTube channel and would like to discuss…" },
  { id: "in_004", user: "Hassan Ali", email: "h.ali@fxking.com", subject: "Cashback missing", type: "Support", status: "new", received: "5h ago", preview: "I traded 80 lots last month but only $40 cashback credited…" },
  { id: "in_005", user: "Yuki Tanaka", email: "yuki@trade.jp", subject: "Love the new design", type: "Feedback", status: "closed", received: "1d ago", assigned: "@admin", preview: "Just wanted to say the new dashboard looks amazing!" },
];

// === NEWSLETTER SUBSCRIBERS ===
export type Subscriber = {
  id: string;
  email: string;
  name?: string;
  source: "Footer" | "Popup" | "Blog" | "Manual";
  status: "active" | "unsubscribed" | "bounced";
  subscribed: string;
};

export const subscribers: Subscriber[] = [
  { id: "sub_001", email: "trader@gmail.com", name: "John D.", source: "Footer", status: "active", subscribed: "2d ago" },
  { id: "sub_002", email: "fxqueen@yahoo.com", name: "Sara M.", source: "Popup", status: "active", subscribed: "5d ago" },
  { id: "sub_003", email: "alex@hotmail.com", source: "Blog", status: "active", subscribed: "1w ago" },
  { id: "sub_004", email: "spam@throwaway.com", source: "Footer", status: "bounced", subscribed: "2w ago" },
  { id: "sub_005", email: "leaver@gmail.com", name: "Tom K.", source: "Popup", status: "unsubscribed", subscribed: "1mo ago" },
];

// === COMPANY NEWS ===
export type NewsItem = {
  id: string;
  title: string;
  excerpt: string;
  status: "draft" | "published";
  published: string;
  author: string;
};

export const companyNews: NewsItem[] = [
  { id: "nw_1", title: "RebateBoard 2.0 launches with TBI Engine", excerpt: "We're rolling out our biggest release yet — a complete trust system…", status: "published", published: "Apr 22, 2026", author: "RB Team" },
  { id: "nw_2", title: "New partnership with FundingPips", excerpt: "Up to 25% cashback now available on all FundingPips challenges.", status: "published", published: "Apr 14, 2026", author: "Partnerships" },
  { id: "nw_3", title: "Q2 roadmap revealed", excerpt: "Auto-payouts, mobile app, and TBI v3 are coming.", status: "draft", published: "—", author: "RB Team" },
];

// === ANNOUNCEMENTS (banners) ===
// Categories:
//  - "Global"  → shown across the platform (top bar, dashboard, etc.)
//  - "Brand"   → shown only on a specific brand page (firm details "Announcement" tab)
// Source:
//  - "Admin"   → posted by RebateBoard staff (auto-approved)
//  - "Brand"   → submitted via the brand dashboard, requires admin approval
export type Announcement = {
  id: string;
  category: "Global" | "Brand";
  message: string;
  cta: string;
  link: string;
  placement: "Top bar" | "Dashboard" | "Brand pages";
  brandId?: string;
  brandName?: string;
  source: "Admin" | "Brand";
  approval: "approved" | "pending" | "rejected";
  submittedBy?: string;
  start: string;
  end: string;
  status: "scheduled" | "active" | "expired";
};

export const announcements: Announcement[] = [
  { id: "an_1", category: "Global", message: "🎉 Spring promo: 25% bonus cashback all week", cta: "See deals", link: "/offers", placement: "Top bar", source: "Admin", approval: "approved", start: "Apr 28", end: "May 5", status: "active" },
  { id: "an_2", category: "Global", message: "New Academy course: Risk Management Pro", cta: "Enroll", link: "/dashboard/academy", placement: "Dashboard", source: "Admin", approval: "approved", start: "May 1", end: "May 31", status: "scheduled" },
  { id: "an_3", category: "Global", message: "Maintenance Apr 30 02:00 UTC", cta: "Details", link: "#", placement: "Top bar", source: "Admin", approval: "approved", start: "Apr 29", end: "Apr 30", status: "active" },
  { id: "an_4", category: "Brand", brandId: "b_01", brandName: "FundingPips", message: "New 25K challenge available — discounted fees this week.", cta: "View challenges", link: "/firm/fundingpips", placement: "Brand pages", source: "Admin", approval: "approved", start: "Apr 28", end: "May 10", status: "active" },
  { id: "an_5", category: "Brand", brandId: "b_02", brandName: "FTMO", message: "Payouts now processed within 24h on all accounts.", cta: "Read more", link: "/firm/ftmo", placement: "Brand pages", source: "Brand", submittedBy: "ops@ftmo.com", approval: "pending", start: "May 2", end: "May 30", status: "scheduled" },
  { id: "an_6", category: "Brand", brandId: "b_05", brandName: "E8 Markets", message: "🎁 Spring giveaway — $5K funded account up for grabs.", cta: "Enter now", link: "/firm/e8-markets", placement: "Brand pages", source: "Brand", submittedBy: "marketing@e8markets.com", approval: "pending", start: "May 1", end: "May 14", status: "scheduled" },
  { id: "an_7", category: "Brand", brandId: "b_04", brandName: "The5ers", message: "Outdated promo banner.", cta: "Learn more", link: "#", placement: "Brand pages", source: "Brand", submittedBy: "team@the5ers.com", approval: "rejected", start: "Apr 1", end: "Apr 10", status: "expired" },
];

// === POPUPS ===
export type Popup = {
  id: string;
  title: string;
  message: string;
  cta: string;
  link: string;
  trigger: "On load" | "After 10s" | "Exit intent" | "Specific page";
  audience: "All" | "Logged in" | "Guests";
  start: string;
  end: string;
  status: "draft" | "active" | "paused";
  views: number;
  clicks: number;
};

export const popups: Popup[] = [
  { id: "po_1", title: "Get 25% cashback this week", message: "Limited time bonus on all FundingPips challenges.", cta: "Claim now", link: "/offers", trigger: "After 10s", audience: "Guests", start: "Apr 28", end: "May 5", status: "active", views: 12480, clicks: 1820 },
  { id: "po_2", title: "Don't miss out!", message: "Join 48K+ traders earning rebates daily.", cta: "Sign up free", link: "/signup", trigger: "Exit intent", audience: "Guests", start: "Apr 1", end: "May 31", status: "active", views: 8920, clicks: 642 },
  { id: "po_3", title: "Verify your account", message: "Complete KYC to unlock withdrawals.", cta: "Verify now", link: "/dashboard/profile", trigger: "On load", audience: "Logged in", start: "—", end: "—", status: "paused", views: 0, clicks: 0 },
];

// === EXTENDED TRANSACTIONS ===
export type Transaction = {
  id: string;
  date: string;
  user: string;
  reference: string;
  type: "Cashback Credit" | "Manual Credit" | "Manual Debit" | "Withdrawal" | "Withdrawal Reversal" | "RR Conversion" | "Adjustment";
  amount: number;
  currency: "USD" | "NGN";
  channel: "System" | "Admin" | "Bank" | "Crypto";
  narration: string;
  status: "pending" | "successful" | "failed" | "reversed";
  createdBy: string;
};

export const transactions: Transaction[] = [
  { id: "tr_001", date: "Apr 29, 14:22", user: "Aiden Park", reference: "REF-882144", type: "Cashback Credit", amount: 74.40, currency: "USD", channel: "System", narration: "Exness rebate Apr W4", status: "successful", createdBy: "system" },
  { id: "tr_002", date: "Apr 29, 12:08", user: "Liam O'Connor", reference: "REF-71044", type: "Withdrawal", amount: 1200, currency: "USD", channel: "Crypto", narration: "USDT ERC20 to 0x82a…", status: "successful", createdBy: "@finance_kim" },
  { id: "tr_003", date: "Apr 29, 09:11", user: "Elena Rossi", reference: "REF-66112", type: "Cashback Credit", amount: 32.00, currency: "USD", channel: "System", narration: "IC Markets rebate", status: "successful", createdBy: "system" },
  { id: "tr_004", date: "Apr 28, 22:30", user: "Hassan Ali", reference: "REF-90014", type: "Manual Debit", amount: 90, currency: "USD", channel: "Admin", narration: "Fraud reversal", status: "successful", createdBy: "@admin" },
  { id: "tr_005", date: "Apr 28, 18:55", user: "Marta Silva", reference: "REF-44021", type: "Manual Credit", amount: 10, currency: "USD", channel: "Admin", narration: "Goodwill credit", status: "successful", createdBy: "@admin" },
  { id: "tr_006", date: "Apr 28, 11:02", user: "Yuki Tanaka", reference: "REF-22119", type: "Withdrawal", amount: 88, currency: "USD", channel: "Crypto", narration: "BTC to bc1q9…", status: "pending", createdBy: "@finance_kim" },
  { id: "tr_007", date: "Apr 27, 16:40", user: "Aiden Park", reference: "REF-99102", type: "RR Conversion", amount: 5, currency: "USD", channel: "System", narration: "500 RR → $5", status: "successful", createdBy: "system" },
  { id: "tr_008", date: "Apr 27, 09:15", user: "Sofia Lopez", reference: "REF-31840", type: "Withdrawal", amount: 420, currency: "USD", channel: "Bank", narration: "SEPA wire", status: "failed", createdBy: "@finance_kim" },
];
