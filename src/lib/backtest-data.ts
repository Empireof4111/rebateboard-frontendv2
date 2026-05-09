// Mock data + types for AI Backtest Lab (Phase 1)
export type BacktestReport = {
  id: string;
  name: string;
  market: string;
  symbol: string;
  timeframe: string;
  session: string;
  range: string;
  netPnl: number;
  winRate: number;
  profitFactor: number;
  avgRR: number;
  trades: number;
  wins: number;
  losses: number;
  breakeven: number;
  maxDD: number;
  bestDay: string;
  worstDay: string;
  bestMonth: string;
  worstMonth: string;
  longestWin: number;
  longestLoss: number;
  avgDuration: string;
  riskOfRuin: string;
  createdAt: string;
  status: "completed" | "running" | "failed";
  source: "ai-strategy" | "real-trades";
};

export type BacktestTrade = {
  id: string;
  date: string;
  symbol: string;
  side: "Long" | "Short";
  entry: number;
  sl: number;
  tp: number;
  exit: number;
  result: "Win" | "Loss" | "BE";
  rr: number;
  pnl: number;
  fees: number;
  cashback: number;
  notes?: string;
};

export const mockReports: BacktestReport[] = [
  {
    id: "bt-001", name: "London Asian Range Break", market: "Forex", symbol: "EURUSD",
    timeframe: "15m", session: "London", range: "6 months", netPnl: 4823.5, winRate: 58, profitFactor: 1.92,
    avgRR: 2.1, trades: 142, wins: 82, losses: 54, breakeven: 6, maxDD: -812, bestDay: "Tue", worstDay: "Mon",
    bestMonth: "Mar 2025", worstMonth: "Jan 2025", longestWin: 7, longestLoss: 4, avgDuration: "2h 12m",
    riskOfRuin: "Low", createdAt: "2026-04-22", status: "completed", source: "ai-strategy",
  },
  {
    id: "bt-002", name: "BTC Mean Reversion", market: "Crypto", symbol: "BTCUSDT",
    timeframe: "1h", session: "24/7", range: "1 year", netPnl: 12450, winRate: 49, profitFactor: 1.45,
    avgRR: 1.8, trades: 312, wins: 153, losses: 145, breakeven: 14, maxDD: -2840, bestDay: "Sat", worstDay: "Sun",
    bestMonth: "Nov 2025", worstMonth: "Aug 2025", longestWin: 9, longestLoss: 6, avgDuration: "4h 5m",
    riskOfRuin: "Medium", createdAt: "2026-04-18", status: "completed", source: "ai-strategy",
  },
  {
    id: "rt-001", name: "My Live Trading — Q1 2026", market: "Forex", symbol: "Multi",
    timeframe: "Mixed", session: "Mixed", range: "Q1 2026", netPnl: -380, winRate: 41, profitFactor: 0.84,
    avgRR: 1.2, trades: 87, wins: 36, losses: 49, breakeven: 2, maxDD: -1240, bestDay: "Wed", worstDay: "Fri",
    bestMonth: "Feb 2026", worstMonth: "Mar 2026", longestWin: 4, longestLoss: 7, avgDuration: "1h 30m",
    riskOfRuin: "High", createdAt: "2026-04-25", status: "completed", source: "real-trades",
  },
];

export const mockTrades: BacktestTrade[] = Array.from({ length: 12 }).map((_, i) => ({
  id: `t-${i + 1}`,
  date: `2026-03-${String(10 + i).padStart(2, "0")}`,
  symbol: i % 3 === 0 ? "BTCUSDT" : i % 3 === 1 ? "EURUSD" : "GBPUSD",
  side: i % 2 === 0 ? "Long" : "Short",
  entry: 1.085 + i * 0.001,
  sl: 1.082 + i * 0.001,
  tp: 1.091 + i * 0.001,
  exit: 1.09 + i * 0.001,
  result: i % 4 === 3 ? "Loss" : i % 5 === 4 ? "BE" : "Win",
  rr: i % 4 === 3 ? -1 : 2.1,
  pnl: i % 4 === 3 ? -120 : 245,
  fees: 4.2,
  cashback: 1.8,
  notes: i % 3 === 0 ? "Clean break of structure" : undefined,
}));

export const aiInsights = [
  { tone: "success", title: "Best edge: London open", text: "Your strategy nets 68% win rate Tue–Thu during the first 90 minutes of London." },
  { tone: "warn", title: "Risk warning: revenge trading", text: "PnL drops 42% after 2 consecutive losing trades. Consider a daily loss cap." },
  { tone: "info", title: "Cashback impact", text: "With RebateBoard cashback, your net result improves by an estimated +$612 over the period." },
  { tone: "danger", title: "Worst behavior: Monday low-vol", text: "Avoid trading Monday Asia session — 71% of losses cluster here." },
];

export const importSources = [
  "MT4 Statement", "MT5 Statement", "cTrader Export", "TradingView Export",
  "Binance CSV", "Bybit CSV", "OKX CSV", "Prop Firm Dashboard", "Manual CSV", "Wallet Address (read-only)",
];

export const adminMetrics = {
  totalUsers: 1248,
  totalBacktests: 4612,
  reportsUploaded: 982,
  topMarket: "Forex",
  topSymbol: "EURUSD",
  avgWinRate: "53%",
  feesAnalyzed: "$1.24M",
  cashbackImpact: "$184K",
  activeUsers: 312,
  failedImports: 18,
  aiCost: "$642 / mo",
};
