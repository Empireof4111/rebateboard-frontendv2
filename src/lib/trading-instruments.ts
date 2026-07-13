import type { MarketType } from "@/lib/trading-plan";

export type InstrumentSource = "system_seed" | "admin" | "user_custom" | "external_provider";

export type TradingInstrument = {
  id: string;
  symbol: string;
  displayName: string;
  market: MarketType;
  subgroup?: string;
  baseAsset?: string;
  quoteAsset?: string;
  exchange?: string;
  country?: string;
  aliases: string[];
  isPopular: boolean;
  isActive: boolean;
  sortOrder: number;
  source: InstrumentSource;
};

type SeedInput = Omit<TradingInstrument, "id" | "aliases" | "isActive" | "sortOrder" | "source"> & {
  aliases?: string[];
  sortOrder?: number;
};

const clean = (value: string) => value.toUpperCase().replace(/[^A-Z0-9]/g, "");

function instrument(input: SeedInput): TradingInstrument {
  const id = `${input.market}_${clean(input.symbol)}`;
  const aliases = Array.from(new Set([input.symbol, input.displayName, ...(input.aliases ?? [])].map(clean))).filter(Boolean);
  return {
    ...input,
    id,
    aliases,
    isActive: true,
    sortOrder: input.sortOrder ?? 500,
    source: "system_seed",
  };
}

const forexMajors = ["EUR/USD", "GBP/USD", "USD/JPY", "USD/CHF", "USD/CAD", "AUD/USD", "NZD/USD"];
const forexMinors = [
  "EUR/GBP", "EUR/JPY", "EUR/CHF", "EUR/CAD", "EUR/AUD", "EUR/NZD",
  "GBP/JPY", "GBP/CHF", "GBP/CAD", "GBP/AUD", "GBP/NZD",
  "AUD/JPY", "AUD/CAD", "AUD/CHF", "AUD/NZD",
  "CAD/JPY", "CAD/CHF", "CHF/JPY",
  "NZD/JPY", "NZD/CAD", "NZD/CHF",
];
const forexExotics = [
  "USD/ZAR", "USD/TRY", "USD/MXN", "USD/SGD", "USD/HKD", "USD/NOK", "USD/SEK", "USD/DKK",
  "USD/PLN", "USD/HUF", "USD/CZK", "USD/CNH", "USD/THB",
  "EUR/TRY", "EUR/ZAR", "EUR/NOK", "EUR/SEK", "GBP/ZAR", "GBP/TRY",
];

const cryptoBases = [
  "BTC", "ETH", "BNB", "SOL", "XRP", "ADA", "DOGE", "AVAX", "DOT", "LINK", "LTC", "BCH",
  "TRX", "TON", "SHIB", "UNI", "AAVE", "NEAR", "ATOM", "FIL", "OP", "ARB", "INJ", "SUI",
  "SEI", "PEPE", "APT", "POL", "MATIC", "ETC", "XLM", "HBAR", "ICP",
];

const stocks: Array<[string, string, string, string]> = [
  ["AAPL", "Apple", "NASDAQ", "United States"],
  ["MSFT", "Microsoft", "NASDAQ", "United States"],
  ["NVDA", "NVIDIA", "NASDAQ", "United States"],
  ["AMZN", "Amazon", "NASDAQ", "United States"],
  ["META", "Meta Platforms", "NASDAQ", "United States"],
  ["GOOGL", "Alphabet", "NASDAQ", "United States"],
  ["TSLA", "Tesla", "NASDAQ", "United States"],
  ["NFLX", "Netflix", "NASDAQ", "United States"],
  ["AMD", "Advanced Micro Devices", "NASDAQ", "United States"],
  ["INTC", "Intel", "NASDAQ", "United States"],
  ["JPM", "JPMorgan Chase", "NYSE", "United States"],
  ["BAC", "Bank of America", "NYSE", "United States"],
  ["GS", "Goldman Sachs", "NYSE", "United States"],
  ["V", "Visa", "NYSE", "United States"],
  ["MA", "Mastercard", "NYSE", "United States"],
  ["DIS", "Disney", "NYSE", "United States"],
  ["KO", "Coca-Cola", "NYSE", "United States"],
  ["PEP", "PepsiCo", "NASDAQ", "United States"],
  ["WMT", "Walmart", "NYSE", "United States"],
  ["BABA", "Alibaba", "NYSE", "China"],
  ["NIO", "NIO", "NYSE", "China"],
  ["TSM", "Taiwan Semiconductor", "NYSE", "Taiwan"],
  ["ASML", "ASML Holding", "NASDAQ", "Netherlands"],
  ["SAP", "SAP", "NYSE", "Germany"],
  ["SHEL", "Shell", "NYSE", "United Kingdom"],
  ["BP", "BP", "NYSE", "United Kingdom"],
  ["HSBC", "HSBC", "NYSE", "United Kingdom"],
  ["UBER", "Uber", "NYSE", "United States"],
  ["SHOP", "Shopify", "NYSE", "Canada"],
  ["PLTR", "Palantir", "NYSE", "United States"],
  ["COIN", "Coinbase", "NASDAQ", "United States"],
];

const indices: SeedInput[] = [
  { symbol: "US30", displayName: "Dow Jones", market: "indices", subgroup: "US", aliases: ["DJ30", "Dow Jones Industrial Average"], isPopular: true },
  { symbol: "NAS100", displayName: "Nasdaq 100", market: "indices", subgroup: "US", aliases: ["US100", "USTEC"], isPopular: true },
  { symbol: "SPX500", displayName: "S&P 500", market: "indices", subgroup: "US", aliases: ["US500", "SP500"], isPopular: true },
  { symbol: "US2000", displayName: "Russell 2000", market: "indices", subgroup: "US", aliases: ["RUS2000"], isPopular: false },
  { symbol: "UK100", displayName: "FTSE 100", market: "indices", subgroup: "Europe", aliases: ["FTSE100"], isPopular: true },
  { symbol: "GER40", displayName: "DAX 40", market: "indices", subgroup: "Europe", aliases: ["DAX40"], isPopular: true },
  { symbol: "FRA40", displayName: "CAC 40", market: "indices", subgroup: "Europe", aliases: ["CAC40"], isPopular: false },
  { symbol: "EU50", displayName: "Euro Stoxx 50", market: "indices", subgroup: "Europe", aliases: ["EUSTX50"], isPopular: false },
  { symbol: "ESP35", displayName: "IBEX 35", market: "indices", subgroup: "Europe", isPopular: false },
  { symbol: "ITA40", displayName: "Italy 40", market: "indices", subgroup: "Europe", isPopular: false },
  { symbol: "JP225", displayName: "Nikkei 225", market: "indices", subgroup: "Asia", aliases: ["JPN225"], isPopular: true },
  { symbol: "HK50", displayName: "Hang Seng", market: "indices", subgroup: "Asia", aliases: ["HSI"], isPopular: true },
  { symbol: "AUS200", displayName: "ASX 200", market: "indices", subgroup: "Asia-Pacific", isPopular: false },
  { symbol: "CHN50", displayName: "China A50", market: "indices", subgroup: "Asia", isPopular: false },
  { symbol: "INDIA50", displayName: "Nifty 50", market: "indices", subgroup: "Asia", aliases: ["NIFTY50"], isPopular: false },
  { symbol: "VIX", displayName: "Volatility Index", market: "indices", subgroup: "US", aliases: ["Volatility 75"], isPopular: false },
];

const commodities: SeedInput[] = [
  { symbol: "XAU/USD", displayName: "Gold", market: "commodities", subgroup: "Metals", aliases: ["XAUUSD", "Gold"], isPopular: true },
  { symbol: "XAG/USD", displayName: "Silver", market: "commodities", subgroup: "Metals", aliases: ["XAGUSD", "Silver"], isPopular: true },
  { symbol: "XPT/USD", displayName: "Platinum", market: "commodities", subgroup: "Metals", aliases: ["XPTUSD"], isPopular: false },
  { symbol: "XPD/USD", displayName: "Palladium", market: "commodities", subgroup: "Metals", aliases: ["XPDUSD"], isPopular: false },
  { symbol: "WTI", displayName: "WTI Crude Oil", market: "commodities", subgroup: "Energy", aliases: ["USOIL", "WTI Crude"], isPopular: true },
  { symbol: "BRENT", displayName: "Brent Crude Oil", market: "commodities", subgroup: "Energy", aliases: ["UKOIL", "Brent Oil"], isPopular: true },
  { symbol: "NGAS", displayName: "Natural Gas", market: "commodities", subgroup: "Energy", aliases: ["Natural Gas"], isPopular: false },
  { symbol: "COPPER", displayName: "Copper", market: "commodities", subgroup: "Metals", aliases: ["HG"], isPopular: false },
  { symbol: "COFFEE", displayName: "Coffee", market: "commodities", subgroup: "Softs", isPopular: false },
  { symbol: "COCOA", displayName: "Cocoa", market: "commodities", subgroup: "Softs", isPopular: false },
  { symbol: "SUGAR", displayName: "Sugar", market: "commodities", subgroup: "Softs", isPopular: false },
  { symbol: "COTTON", displayName: "Cotton", market: "commodities", subgroup: "Softs", isPopular: false },
  { symbol: "CORN", displayName: "Corn", market: "commodities", subgroup: "Grains", isPopular: false },
  { symbol: "WHEAT", displayName: "Wheat", market: "commodities", subgroup: "Grains", isPopular: false },
  { symbol: "SOYBEANS", displayName: "Soybeans", market: "commodities", subgroup: "Grains", isPopular: false },
];

const futures: SeedInput[] = [
  ["ES", "E-mini S&P 500"], ["MES", "Micro E-mini S&P 500"], ["NQ", "E-mini Nasdaq 100"], ["MNQ", "Micro E-mini Nasdaq 100"],
  ["YM", "E-mini Dow"], ["MYM", "Micro E-mini Dow"], ["RTY", "E-mini Russell 2000"], ["M2K", "Micro Russell 2000"],
  ["CL", "Crude Oil"], ["MCL", "Micro Crude Oil"], ["NG", "Natural Gas"], ["GC", "Gold Futures"],
  ["MGC", "Micro Gold"], ["SI", "Silver Futures"], ["HG", "Copper Futures"], ["ZB", "30-Year Treasury Bond"],
  ["ZN", "10-Year Treasury Note"], ["6E", "Euro FX"], ["6B", "British Pound FX"], ["6J", "Japanese Yen FX"],
].map(([symbol, name]) => ({
  symbol,
  displayName: name,
  market: "futures" as const,
  subgroup: ["ES", "MES", "NQ", "MNQ", "YM", "MYM", "RTY", "M2K"].includes(symbol) ? "Equity Index" : "Futures",
  aliases: [`${symbol} futures`, name],
  isPopular: ["ES", "MES", "NQ", "MNQ", "CL", "GC"].includes(symbol),
}));

export const TRADING_INSTRUMENTS: TradingInstrument[] = [
  ...forexMajors.map((symbol, index) => instrument({ symbol, displayName: symbol, market: "forex", subgroup: "Major pairs", aliases: [symbol.replace("/", "")], isPopular: true, sortOrder: index })),
  ...forexMinors.map((symbol, index) => instrument({ symbol, displayName: symbol, market: "forex", subgroup: "Minor and cross pairs", aliases: [symbol.replace("/", "")], isPopular: index < 6, sortOrder: 50 + index })),
  ...forexExotics.map((symbol, index) => instrument({ symbol, displayName: symbol, market: "forex", subgroup: "Exotic pairs", aliases: [symbol.replace("/", "")], isPopular: index < 5, sortOrder: 140 + index })),
  ...cryptoBases.flatMap((base, baseIndex) => ["USDT", "USDC", "USD"].map((quote, quoteIndex) => instrument({
    symbol: `${base}/${quote}`,
    displayName: `${base}/${quote}`,
    market: "crypto",
    subgroup: quote,
    baseAsset: base,
    quoteAsset: quote,
    aliases: [`${base}${quote}`],
    isPopular: baseIndex < 8 && quote === "USDT",
    sortOrder: baseIndex * 4 + quoteIndex,
  }))),
  ...["ETH/BTC", "SOL/BTC", "BNB/BTC", "XRP/BTC", "SOL/ETH", "LINK/ETH"].map((symbol, index) => instrument({ symbol, displayName: symbol, market: "crypto", subgroup: "Cross pairs", aliases: [symbol.replace("/", "")], isPopular: index < 2, sortOrder: 250 + index })),
  ...stocks.map(([symbol, name, exchange, country], index) => instrument({ symbol, displayName: name, market: "stocks", subgroup: exchange, exchange, country, aliases: [name], isPopular: index < 10, sortOrder: index })),
  ...indices.map(instrument),
  ...commodities.map(instrument),
  ...futures.map(instrument),
];

export function getPopularInstruments(market: MarketType, limit = 12) {
  return TRADING_INSTRUMENTS
    .filter((item) => item.market === market && item.isActive && item.isPopular)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.symbol.localeCompare(b.symbol))
    .slice(0, limit);
}

export function searchTradingInstruments(market: MarketType, query: string, limit = 20) {
  const term = clean(query);
  const list = TRADING_INSTRUMENTS.filter((item) => item.market === market && item.isActive);
  if (!term) return getPopularInstruments(market, limit);
  return list
    .map((item) => {
      const symbol = clean(item.symbol);
      const name = clean(item.displayName);
      const aliasHit = item.aliases.some((alias) => alias.includes(term));
      const score =
        symbol === term ? 0 :
        symbol.startsWith(term) ? 1 :
        name.startsWith(term) ? 2 :
        aliasHit ? 3 :
        symbol.includes(term) || name.includes(term) ? 4 :
        99;
      return { item, score };
    })
    .filter(({ score }) => score < 99)
    .sort((a, b) => a.score - b.score || a.item.sortOrder - b.item.sortOrder || a.item.symbol.localeCompare(b.item.symbol))
    .slice(0, limit)
    .map(({ item }) => item);
}

export function resolveTradingInstrument(market: MarketType, symbol: string) {
  const term = clean(symbol);
  return TRADING_INSTRUMENTS.find((item) => item.market === market && item.aliases.includes(term)) ?? null;
}

export function makeCustomInstrument(market: MarketType, symbol: string): TradingInstrument {
  const display = symbol.trim().toUpperCase();
  return {
    id: `custom_${market}_${clean(display) || Date.now()}`,
    symbol: display || "CUSTOM",
    displayName: display || "Custom instrument",
    market,
    aliases: [clean(display)],
    isPopular: false,
    isActive: true,
    sortOrder: 9999,
    source: "user_custom",
  };
}
