export type TxStatus = "Pending" | "Approved" | "Credited" | "Withdrawn";
export type TxType = "Cashback" | "Referral" | "Transfer" | "Reward" | "Withdrawal";
export type TxSource =
  | "Forex Broker"
  | "Prop Firm"
  | "Crypto Exchange"
  | "Futures Broker"
  | "Internal"
  | "System";

export interface WalletTransaction {
  id: string;
  date: string; // ISO
  source: TxSource;
  brandName: string;
  type: TxType;
  volumeLots?: number;
  commissionGenerated?: number; // USD
  rebatePercent?: number; // 0-100
  amount: number; // final cashback / reward credited (USD). Negative for outgoing
  status: TxStatus;
  note?: string;
}

export interface InternalTransfer {
  id: string;
  date: string;
  direction: "in" | "out";
  counterpartyName: string;
  counterpartyHandle: string; // @username or wallet id
  amount: number;
  status: "Completed" | "Pending";
  note?: string;
}

export const walletSummary = {
  balance: 1842.55,
  totalEarned: 6420.18,
  availableForWithdrawal: 1620.0,
  pendingWithdrawals: 222.55,
  totalWithdrawn: 4577.63,
  cashbackThisMonth: 412.4,
  rrBalance: 1284,
  rrCashValue: 128.4,
};

export const walletTransactions: WalletTransaction[] = [
  {
    id: "tx_001",
    date: "2026-04-27T10:14:00Z",
    source: "Forex Broker",
    brandName: "Exness",
    type: "Cashback",
    volumeLots: 12.4,
    commissionGenerated: 124.0,
    rebatePercent: 60,
    amount: 74.4,
    status: "Credited",
  },
  {
    id: "tx_002",
    date: "2026-04-26T18:02:00Z",
    source: "Prop Firm",
    brandName: "FundingPips",
    type: "Cashback",
    volumeLots: 4.2,
    commissionGenerated: 42.0,
    rebatePercent: 50,
    amount: 21.0,
    status: "Credited",
  },
  {
    id: "tx_003",
    date: "2026-04-25T08:31:00Z",
    source: "Crypto Exchange",
    brandName: "Bybit",
    type: "Cashback",
    volumeLots: 0,
    commissionGenerated: 88.5,
    rebatePercent: 40,
    amount: 35.4,
    status: "Pending",
  },
  {
    id: "tx_004",
    date: "2026-04-24T14:11:00Z",
    source: "Internal",
    brandName: "@trader_max",
    type: "Transfer",
    amount: -120.0,
    status: "Approved",
    note: "Sent to @trader_max",
  },
  {
    id: "tx_005",
    date: "2026-04-23T09:55:00Z",
    source: "System",
    brandName: "Referral Program",
    type: "Referral",
    amount: 50.0,
    status: "Credited",
    note: "Referral signup bonus",
  },
  {
    id: "tx_006",
    date: "2026-04-22T11:20:00Z",
    source: "Forex Broker",
    brandName: "IC Markets",
    type: "Cashback",
    volumeLots: 22.0,
    commissionGenerated: 198.0,
    rebatePercent: 55,
    amount: 108.9,
    status: "Credited",
  },
  {
    id: "tx_007",
    date: "2026-04-20T17:40:00Z",
    source: "System",
    brandName: "RR Conversion",
    type: "Reward",
    amount: 25.0,
    status: "Credited",
    note: "250 RR → $25",
  },
  {
    id: "tx_008",
    date: "2026-04-18T10:00:00Z",
    source: "System",
    brandName: "Withdrawal · USDT (TRC20)",
    type: "Withdrawal",
    amount: -500.0,
    status: "Withdrawn",
  },
  {
    id: "tx_009",
    date: "2026-04-15T13:22:00Z",
    source: "Prop Firm",
    brandName: "FTMO",
    type: "Cashback",
    volumeLots: 8.7,
    commissionGenerated: 87.0,
    rebatePercent: 45,
    amount: 39.15,
    status: "Credited",
  },
  {
    id: "tx_010",
    date: "2026-04-12T09:00:00Z",
    source: "Crypto Exchange",
    brandName: "Binance",
    type: "Cashback",
    volumeLots: 0,
    commissionGenerated: 142.0,
    rebatePercent: 35,
    amount: 49.7,
    status: "Credited",
  },
];

export const internalTransfers: InternalTransfer[] = [
  {
    id: "tr_001",
    date: "2026-04-24T14:11:00Z",
    direction: "out",
    counterpartyName: "Max Trader",
    counterpartyHandle: "@trader_max",
    amount: 120.0,
    status: "Completed",
    note: "Splitting prop firm cost",
  },
  {
    id: "tr_002",
    date: "2026-04-19T16:30:00Z",
    direction: "in",
    counterpartyName: "Anna K.",
    counterpartyHandle: "@annak",
    amount: 60.0,
    status: "Completed",
  },
  {
    id: "tr_003",
    date: "2026-04-10T08:15:00Z",
    direction: "out",
    counterpartyName: "RB Wallet · 0xA1…7d",
    counterpartyHandle: "wal_8821",
    amount: 200.0,
    status: "Completed",
  },
];

export const earningsBySource = [
  { source: "Exness", amount: 1240.5 },
  { source: "IC Markets", amount: 980.2 },
  { source: "Bybit", amount: 612.4 },
  { source: "Binance", amount: 488.9 },
  { source: "FundingPips", amount: 410.1 },
  { source: "FTMO", amount: 322.6 },
];

export const earningsTimeline = [
  { month: "Nov", amount: 320 },
  { month: "Dec", amount: 410 },
  { month: "Jan", amount: 540 },
  { month: "Feb", amount: 612 },
  { month: "Mar", amount: 705 },
  { month: "Apr", amount: 812 },
];

export function txById(id: string) {
  return walletTransactions.find((t) => t.id === id);
}
