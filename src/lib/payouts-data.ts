export type BrandPayoutProfile = {
  id: string;
  slug: string;
  name: string;
  logoColor: string;
  websiteUrl?: string;
  tbiScore: number;
  payoutReliabilityScore: number;
  payoutHealthScore: number;
  totalPaidUsd: number;
  totalPayoutCount: number;
  largestPayoutUsd: number;
  averagePayoutUsd: number;
  averagePayoutTimeMinutes: number;
  lastPayoutAt: string;
  verifiedChains: string[];
  status: "active" | "watchlist" | "limited_data" | "flagged";
  badges: string[];
};

export type PayoutTransaction = {
  id: string;
  brandSlug: string;
  brandName: string;
  amountUsd: number;
  originalAmount: number;
  currency: "USDT" | "USDC" | "BTC" | "ETH";
  chain: "TRC20" | "ERC20" | "BEP20" | "BTC";
  txHash: string;
  fromWalletMasked: string;
  toWalletMasked: string;
  payoutRequestedAt: string;
  payoutReceivedAt: string;
  payoutTimeMinutes: number;
  accountSizeUsd: number;
  returnPercent: number;
  region: string;
  verificationStatus: "verified" | "pending" | "flagged";
  explorerUrl: string;
  minutesAgo: number;
};

export const BRANDS: BrandPayoutProfile[] = [
  {
    id: "1", slug: "fundingpips", name: "FundingPips", logoColor: "from-cyan-500 to-blue-600",
    websiteUrl: "https://fundingpips.com", tbiScore: 8.4, payoutReliabilityScore: 97,
    payoutHealthScore: 8.7, totalPaidUsd: 11516754, totalPayoutCount: 11255,
    largestPayoutUsd: 30955, averagePayoutUsd: 1023, averagePayoutTimeMinutes: 134,
    lastPayoutAt: "3 mins ago", verifiedChains: ["TRC20", "ERC20", "BEP20"],
    status: "active", badges: ["Verified", "Fast Payer", "High Activity"],
  },
  {
    id: "2", slug: "the5ers", name: "The5ers", logoColor: "from-violet-500 to-fuchsia-600",
    tbiScore: 8.1, payoutReliabilityScore: 94, payoutHealthScore: 8.3,
    totalPaidUsd: 8420130, totalPayoutCount: 7890, largestPayoutUsd: 28400,
    averagePayoutUsd: 1067, averagePayoutTimeMinutes: 195, lastPayoutAt: "25 mins ago",
    verifiedChains: ["TRC20", "ERC20"], status: "active", badges: ["Verified", "Reliable"],
  },
  {
    id: "3", slug: "maven", name: "Maven Trading", logoColor: "from-emerald-500 to-teal-600",
    tbiScore: 7.9, payoutReliabilityScore: 96, payoutHealthScore: 8.5,
    totalPaidUsd: 5210890, totalPayoutCount: 4120, largestPayoutUsd: 22100,
    averagePayoutUsd: 1264, averagePayoutTimeMinutes: 92, lastPayoutAt: "3 mins ago",
    verifiedChains: ["TRC20", "BEP20"], status: "active", badges: ["Verified", "Fastest Payer"],
  },
  {
    id: "4", slug: "ftmo", name: "FTMO", logoColor: "from-orange-500 to-red-600",
    tbiScore: 9.0, payoutReliabilityScore: 98, payoutHealthScore: 9.1,
    totalPaidUsd: 25890420, totalPayoutCount: 18420, largestPayoutUsd: 48500,
    averagePayoutUsd: 1405, averagePayoutTimeMinutes: 168, lastPayoutAt: "8 mins ago",
    verifiedChains: ["TRC20", "ERC20", "BTC"], status: "active",
    badges: ["Verified", "Most Reliable", "Top Volume"],
  },
  {
    id: "5", slug: "myfundedfx", name: "MyFundedFX", logoColor: "from-pink-500 to-rose-600",
    tbiScore: 7.4, payoutReliabilityScore: 89, payoutHealthScore: 7.6,
    totalPaidUsd: 3120450, totalPayoutCount: 2810, largestPayoutUsd: 18700,
    averagePayoutUsd: 1110, averagePayoutTimeMinutes: 240, lastPayoutAt: "1 hr ago",
    verifiedChains: ["TRC20"], status: "active", badges: ["Verified"],
  },
  {
    id: "6", slug: "alpha-capital", name: "Alpha Capital", logoColor: "from-amber-500 to-yellow-600",
    tbiScore: 7.0, payoutReliabilityScore: 82, payoutHealthScore: 6.8,
    totalPaidUsd: 1820310, totalPayoutCount: 1540, largestPayoutUsd: 14200,
    averagePayoutUsd: 1182, averagePayoutTimeMinutes: 480, lastPayoutAt: "4 hrs ago",
    verifiedChains: ["TRC20", "ERC20"], status: "watchlist",
    badges: ["Verified", "Delay Alert"],
  },
];

export const TRANSACTIONS: PayoutTransaction[] = [
  { id: "tx-001", brandSlug: "fundingpips", brandName: "FundingPips", amountUsd: 1289, originalAmount: 1289, currency: "USDT", chain: "TRC20", txHash: "TAb9k2Lm8Jx4Pq1Rs7Yt6Vw3Zn92ks", fromWalletMasked: "TQ7...9LP", toWalletMasked: "TAb...42X", payoutRequestedAt: "2026-04-17T10:00:00Z", payoutReceivedAt: "2026-04-17T10:04:00Z", payoutTimeMinutes: 4, accountSizeUsd: 50000, returnPercent: 2.58, region: "Europe", verificationStatus: "verified", explorerUrl: "https://tronscan.org/#/transaction/", minutesAgo: 4 },
  { id: "tx-002", brandSlug: "maven", brandName: "Maven Trading", amountUsd: 980, originalAmount: 980, currency: "USDT", chain: "BEP20", txHash: "0x4f3a8b2c9e1d7f6a5b3c2d1e0f9a8b7c6d5e4f3a", fromWalletMasked: "0x4f...8b7c", toWalletMasked: "0xa1...92ef", payoutRequestedAt: "2026-04-17T09:55:00Z", payoutReceivedAt: "2026-04-17T09:58:00Z", payoutTimeMinutes: 3, accountSizeUsd: 25000, returnPercent: 3.92, region: "Africa", verificationStatus: "verified", explorerUrl: "https://bscscan.com/tx/", minutesAgo: 3 },
  { id: "tx-003", brandSlug: "the5ers", brandName: "The5ers", amountUsd: 1250, originalAmount: 1250, currency: "USDC", chain: "ERC20", txHash: "0x9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b", fromWalletMasked: "0x9a...1a0b", toWalletMasked: "0xc3...77ee", payoutRequestedAt: "2026-04-17T08:30:00Z", payoutReceivedAt: "2026-04-17T09:35:00Z", payoutTimeMinutes: 65, accountSizeUsd: 100000, returnPercent: 1.25, region: "Asia", verificationStatus: "verified", explorerUrl: "https://etherscan.io/tx/", minutesAgo: 25 },
  { id: "tx-004", brandSlug: "ftmo", brandName: "FTMO", amountUsd: 3200, originalAmount: 3200, currency: "USDT", chain: "TRC20", txHash: "TBz4k9Mn8Lp2Qr5St7Yv6Wx3Zq84mn", fromWalletMasked: "TBz...84mn", toWalletMasked: "TCa...51yz", payoutRequestedAt: "2026-04-17T09:40:00Z", payoutReceivedAt: "2026-04-17T09:51:00Z", payoutTimeMinutes: 11, accountSizeUsd: 200000, returnPercent: 1.6, region: "North America", verificationStatus: "verified", explorerUrl: "https://tronscan.org/#/transaction/", minutesAgo: 11 },
  { id: "tx-005", brandSlug: "fundingpips", brandName: "FundingPips", amountUsd: 30955, originalAmount: 30955, currency: "USDT", chain: "TRC20", txHash: "TXm2k8Nh4Vp1Lr6Sw9Yt3Bz5Qq77pp", fromWalletMasked: "TXm...77pp", toWalletMasked: "TLp...23cd", payoutRequestedAt: "2026-04-15T12:00:00Z", payoutReceivedAt: "2026-04-15T14:14:00Z", payoutTimeMinutes: 134, accountSizeUsd: 500000, returnPercent: 6.19, region: "Europe", verificationStatus: "verified", explorerUrl: "https://tronscan.org/#/transaction/", minutesAgo: 2880 },
  { id: "tx-006", brandSlug: "myfundedfx", brandName: "MyFundedFX", amountUsd: 750, originalAmount: 750, currency: "USDT", chain: "TRC20", txHash: "TPq6k3Ln9Vm1Wr8St7Yz2Bx5Aa66qq", fromWalletMasked: "TPq...66qq", toWalletMasked: "TRn...09gh", payoutRequestedAt: "2026-04-17T06:00:00Z", payoutReceivedAt: "2026-04-17T10:00:00Z", payoutTimeMinutes: 240, accountSizeUsd: 25000, returnPercent: 3.0, region: "Asia", verificationStatus: "pending", explorerUrl: "https://tronscan.org/#/transaction/", minutesAgo: 60 },
  { id: "tx-007", brandSlug: "alpha-capital", brandName: "Alpha Capital", amountUsd: 1820, originalAmount: 1820, currency: "USDT", chain: "ERC20", txHash: "0x1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d", fromWalletMasked: "0x1c...9c0d", toWalletMasked: "0xe4...44ff", payoutRequestedAt: "2026-04-17T04:00:00Z", payoutReceivedAt: "2026-04-17T08:00:00Z", payoutTimeMinutes: 240, accountSizeUsd: 50000, returnPercent: 3.64, region: "Europe", verificationStatus: "flagged", explorerUrl: "https://etherscan.io/tx/", minutesAgo: 240 },
];

export const GLOBAL_STATS = {
  totalPaidUsd: 56078954,
  totalPayouts: 46035,
  verifiedPercent: 98.7,
  avgPayoutTime: "3h 12m",
  activeFirms: 42,
  largestPayout: 48500,
};

export function fmtUsd(n: number) {
  return "$" + n.toLocaleString("en-US", { maximumFractionDigits: 0 });
}
export function fmtMins(m: number) {
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60); const mm = m % 60;
  if (h < 24) return `${h}h ${mm}m`;
  const d = Math.floor(h / 24); return `${d}d ${h % 24}h`;
}
