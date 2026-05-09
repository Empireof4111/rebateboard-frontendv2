// Mock data engine for the Economic Calendar.
// Deterministic so re-renders feel consistent. Replace with real API later.

export type Impact = "high" | "medium" | "low";
export type AssetClass = "forex" | "crypto" | "indices" | "commodities";

export type EconEvent = {
  id: string;
  // ISO timestamp in UTC. UI converts to user's local TZ.
  time: string;
  country: string; // ISO-2
  currency: string; // e.g. USD, EUR
  flag: string; // emoji
  title: string;
  asset: AssetClass;
  impact: Impact;
  volatilityScore: number; // 0-10
  pairsAffected: string[];
  forecast?: string;
  previous?: string;
  actual?: string; // present if released
  // Last 5 historical reactions: + bullish base / - bearish base
  history: ("up" | "down" | "flat")[];
  // AI insight templates
  insightIfBeat: string;
  insightIfMiss: string;
  bias: "bullish" | "bearish" | "neutral";
  // For released events
  reaction?: {
    movePips: number; // signed
    volatilitySpikePct: number;
    summary: string;
    spark: number[]; // tiny price series
  };
};

export type SessionId = "sydney" | "tokyo" | "london" | "newyork";

export type Session = {
  id: SessionId;
  label: string;
  flag: string;
  // UTC hours
  openUtc: number;
  closeUtc: number;
  liquidity: "low" | "medium" | "high" | "peak";
  volatility: "low" | "medium" | "high";
  pairs: string[];
};

export const SESSIONS: Session[] = [
  { id: "sydney", label: "Sydney", flag: "🇦🇺", openUtc: 22, closeUtc: 7, liquidity: "low", volatility: "low", pairs: ["AUDUSD", "NZDUSD", "AUDJPY"] },
  { id: "tokyo", label: "Tokyo", flag: "🇯🇵", openUtc: 0, closeUtc: 9, liquidity: "medium", volatility: "medium", pairs: ["USDJPY", "AUDJPY", "EURJPY"] },
  { id: "london", label: "London", flag: "🇬🇧", openUtc: 7, closeUtc: 16, liquidity: "peak", volatility: "high", pairs: ["EURUSD", "GBPUSD", "XAUUSD"] },
  { id: "newyork", label: "New York", flag: "🇺🇸", openUtc: 12, closeUtc: 21, liquidity: "peak", volatility: "high", pairs: ["EURUSD", "USDJPY", "NASDAQ", "XAUUSD"] },
];

function inSession(now: Date, s: Session) {
  const h = now.getUTCHours() + now.getUTCMinutes() / 60;
  if (s.openUtc < s.closeUtc) return h >= s.openUtc && h < s.closeUtc;
  // wraps midnight
  return h >= s.openUtc || h < s.closeUtc;
}

export function activeSessions(now = new Date()) {
  return SESSIONS.filter((s) => inSession(now, s));
}

export function nextSessionChange(now = new Date()) {
  // Compute hours until next open or close transition
  const h = now.getUTCHours() + now.getUTCMinutes() / 60;
  const transitions: { session: Session; type: "opens" | "closes"; in: number }[] = [];
  for (const s of SESSIONS) {
    const open = s.openUtc;
    const close = s.closeUtc;
    const dOpen = (open - h + 24) % 24;
    const dClose = (close - h + 24) % 24;
    transitions.push({ session: s, type: "opens", in: dOpen });
    transitions.push({ session: s, type: "closes", in: dClose });
  }
  transitions.sort((a, b) => a.in - b.in);
  return transitions[0];
}

const FLAGS: Record<string, string> = {
  USD: "🇺🇸", EUR: "🇪🇺", GBP: "🇬🇧", JPY: "🇯🇵", AUD: "🇦🇺", NZD: "🇳🇿",
  CAD: "🇨🇦", CHF: "🇨🇭", CNY: "🇨🇳", BTC: "₿", ETH: "Ξ", XAU: "🥇",
};

function spark(seed: number, magnitude = 1): number[] {
  const out: number[] = [];
  let v = 0;
  for (let i = 0; i < 24; i++) {
    const noise = Math.sin(seed * (i + 1) * 1.7) * 0.6 + Math.cos(seed * (i + 2)) * 0.4;
    v += noise * magnitude;
    out.push(Math.round(v * 100) / 100);
  }
  return out;
}

// Build today's set of mock events anchored on "now".
export function buildTodayEvents(now = new Date()): EconEvent[] {
  const dayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0));
  const at = (h: number, m = 0) => new Date(dayStart.getTime() + (h * 60 + m) * 60_000).toISOString();

  const all: EconEvent[] = [
    {
      id: "evt-jpy-bojr",
      time: at(2, 0),
      country: "JP", currency: "JPY", flag: FLAGS.JPY,
      title: "BoJ Policy Rate Decision",
      asset: "forex", impact: "high", volatilityScore: 8.4,
      pairsAffected: ["USDJPY", "EURJPY", "GBPJPY"],
      forecast: "-0.10%", previous: "-0.10%", actual: "-0.10%",
      history: ["down", "flat", "down", "up", "flat"],
      insightIfBeat: "Hawkish surprise → JPY strengthens. Watch USDJPY for sharp downside.",
      insightIfMiss: "Dovish hold → JPY weakens. USDJPY upside continuation likely.",
      bias: "neutral",
      reaction: { movePips: -38, volatilitySpikePct: 140, summary: "USDJPY dropped 38 pips in 12m on dovish tone.", spark: spark(11, 0.6) },
    },
    {
      id: "evt-eur-pmi",
      time: at(8, 30),
      country: "EU", currency: "EUR", flag: FLAGS.EUR,
      title: "Eurozone Manufacturing PMI",
      asset: "forex", impact: "medium", volatilityScore: 5.6,
      pairsAffected: ["EURUSD", "EURGBP"],
      forecast: "47.1", previous: "46.8", actual: "47.4",
      history: ["up", "down", "up", "up", "flat"],
      insightIfBeat: "Beat → EUR firms vs USD. Watch EURUSD for breakout above range high.",
      insightIfMiss: "Miss → EURUSD rejection at resistance, downside continuation.",
      bias: "bullish",
      reaction: { movePips: 22, volatilitySpikePct: 85, summary: "EURUSD +22 pips, brief breakout above resistance.", spark: spark(7, 0.4) },
    },
    {
      id: "evt-gbp-cpi",
      time: at(9, 0),
      country: "GB", currency: "GBP", flag: FLAGS.GBP,
      title: "UK CPI y/y",
      asset: "forex", impact: "high", volatilityScore: 8.1,
      pairsAffected: ["GBPUSD", "EURGBP", "GBPJPY"],
      forecast: "3.4%", previous: "3.2%",
      history: ["up", "up", "down", "up", "up"],
      insightIfBeat: "Hot CPI → GBP rallies. BoE repricing toward higher-for-longer.",
      insightIfMiss: "Cool CPI → GBP softens, EURGBP upside.",
      bias: "bullish",
    },
    {
      id: "evt-usd-cpi",
      time: at(13, 30),
      country: "US", currency: "USD", flag: FLAGS.USD,
      title: "US CPI m/m",
      asset: "forex", impact: "high", volatilityScore: 9.2,
      pairsAffected: ["EURUSD", "USDJPY", "XAUUSD", "NASDAQ"],
      forecast: "0.3%", previous: "0.2%",
      history: ["up", "up", "down", "up", "up"],
      insightIfBeat: "If Actual > Forecast → USD likely strengthens. Watch XAUUSD for sell pressure and NASDAQ pullback.",
      insightIfMiss: "Cool print → USD softens, gold and equities rally on rate-cut bets.",
      bias: "bullish",
    },
    {
      id: "evt-cad-employment",
      time: at(13, 30),
      country: "CA", currency: "CAD", flag: FLAGS.CAD,
      title: "Canada Employment Change",
      asset: "forex", impact: "medium", volatilityScore: 6.0,
      pairsAffected: ["USDCAD", "CADJPY"],
      forecast: "22K", previous: "15K",
      history: ["flat", "up", "down", "up", "down"],
      insightIfBeat: "Strong jobs → CAD firms. USDCAD downside.",
      insightIfMiss: "Soft print → USDCAD upside.",
      bias: "neutral",
    },
    {
      id: "evt-usd-fed",
      time: at(18, 0),
      country: "US", currency: "USD", flag: FLAGS.USD,
      title: "FOMC Member Speech",
      asset: "forex", impact: "medium", volatilityScore: 5.0,
      pairsAffected: ["EURUSD", "XAUUSD"],
      history: ["flat", "up", "flat", "down", "flat"],
      insightIfBeat: "Hawkish remarks → USD bid, gold sells off.",
      insightIfMiss: "Dovish remarks → USD softens, risk-on tone for equities.",
      bias: "neutral",
    },
    {
      id: "evt-btc-etf",
      time: at(15, 0),
      country: "US", currency: "BTC", flag: FLAGS.BTC,
      title: "Spot BTC ETF Net Flows",
      asset: "crypto", impact: "medium", volatilityScore: 6.4,
      pairsAffected: ["BTCUSD", "ETHUSD"],
      forecast: "+$120M", previous: "+$84M",
      history: ["up", "up", "flat", "up", "down"],
      insightIfBeat: "Heavy inflows → BTC continuation higher, ETH follows with beta.",
      insightIfMiss: "Outflows → BTC fades into resistance, alts underperform.",
      bias: "bullish",
    },
    {
      id: "evt-eth-upgrade",
      time: at(20, 0),
      country: "EU", currency: "ETH", flag: FLAGS.ETH,
      title: "Ethereum Network Upgrade Update",
      asset: "crypto", impact: "low", volatilityScore: 3.2,
      pairsAffected: ["ETHUSD", "ETHBTC"],
      history: ["flat", "up", "flat", "flat", "up"],
      insightIfBeat: "Positive dev update → ETH outperforms BTC short-term.",
      insightIfMiss: "Delays → ETHBTC weakness.",
      bias: "neutral",
    },
    {
      id: "evt-xau-inv",
      time: at(15, 30),
      country: "US", currency: "XAU", flag: FLAGS.XAU,
      title: "Gold Inventories Report",
      asset: "commodities", impact: "low", volatilityScore: 3.6,
      pairsAffected: ["XAUUSD"],
      history: ["flat", "down", "flat", "up", "flat"],
      insightIfBeat: "Tight supply read → XAUUSD bid.",
      insightIfMiss: "Loose supply → XAUUSD pulls back into VWAP.",
      bias: "neutral",
    },
    {
      id: "evt-spx-earnings",
      time: at(21, 0),
      country: "US", currency: "USD", flag: FLAGS.USD,
      title: "Mega-Cap Tech Earnings (After Bell)",
      asset: "indices", impact: "high", volatilityScore: 8.7,
      pairsAffected: ["NASDAQ", "SPX500"],
      history: ["up", "down", "up", "up", "up"],
      insightIfBeat: "Beat + raised guidance → NASDAQ gap-up overnight, vol crush in IV.",
      insightIfMiss: "Soft guidance → NASDAQ gap-down, risk-off into Asia session.",
      bias: "bullish",
    },
  ];

  // Mark events whose time is past "now" with synthetic reactions if missing
  const nowMs = now.getTime();
  return all.map((e, i) => {
    const ms = new Date(e.time).getTime();
    if (ms < nowMs && !e.reaction && !e.actual && e.impact !== "low") {
      const dir = e.bias === "bullish" ? 1 : e.bias === "bearish" ? -1 : (i % 2 === 0 ? 1 : -1);
      const mag = Math.round(e.volatilityScore * 12);
      return {
        ...e,
        actual: e.forecast ?? "—",
        reaction: {
          movePips: dir * mag,
          volatilitySpikePct: Math.round(e.volatilityScore * 28),
          summary: `${e.pairsAffected[0]} moved ${dir > 0 ? "+" : "−"}${mag} pips post-release.`,
          spark: spark(i + 3, 0.5 + e.volatilityScore / 12),
        },
      };
    }
    return e;
  });
}

// Build events across a UTC day range (inclusive). Each day reuses today's
// template, with day-suffixed IDs and time anchored to that day in UTC.
export function buildEventsForRange(from: Date, to: Date, now = new Date()): EconEvent[] {
  const startUtc = Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate());
  const endUtc = Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), to.getUTCDate());
  const out: EconEvent[] = [];
  for (let d = startUtc; d <= endUtc; d += 24 * 60 * 60 * 1000) {
    const dayDate = new Date(d);
    const tag = `${dayDate.getUTCFullYear()}${String(dayDate.getUTCMonth() + 1).padStart(2, "0")}${String(dayDate.getUTCDate()).padStart(2, "0")}`;
    const dayEvents = buildTodayEvents(dayDate).map((e) => ({
      ...e,
      id: `${e.id}-${tag}`,
      // re-anchor time to this day, keeping hour/minute
      time: (() => {
        const t = new Date(e.time);
        return new Date(Date.UTC(
          dayDate.getUTCFullYear(), dayDate.getUTCMonth(), dayDate.getUTCDate(),
          t.getUTCHours(), t.getUTCMinutes(),
        )).toISOString();
      })(),
    }));
    // Recompute released/reaction relative to "now" for non-today days
    const nowMs = now.getTime();
    out.push(
      ...dayEvents.map((e, i) => {
        const ms = new Date(e.time).getTime();
        if (ms > nowMs) {
          // future event — clear actual/reaction
          const { actual, reaction, ...rest } = e;
          return { ...rest } as EconEvent;
        }
        if (ms < nowMs && !e.reaction && e.impact !== "low") {
          const dir = e.bias === "bullish" ? 1 : e.bias === "bearish" ? -1 : (i % 2 === 0 ? 1 : -1);
          const mag = Math.round(e.volatilityScore * 12);
          return {
            ...e,
            actual: e.actual ?? e.forecast ?? "—",
            reaction: e.reaction ?? {
              movePips: dir * mag,
              volatilitySpikePct: Math.round(e.volatilityScore * 28),
              summary: `${e.pairsAffected[0]} moved ${dir > 0 ? "+" : "−"}${mag} pips post-release.`,
              spark: spark(i + 3, 0.5 + e.volatilityScore / 12),
            },
          };
        }
        return e;
      })
    );
  }
  return out;
}

export function impactTone(impact: Impact) {
  return impact === "high" ? "destructive" : impact === "medium" ? "warning" : "default";
}

export function volatilityColor(score: number) {
  if (score >= 8) return "from-red-500 to-orange-500";
  if (score >= 6) return "from-orange-500 to-amber-400";
  if (score >= 4) return "from-amber-400 to-emerald-400";
  return "from-emerald-500 to-emerald-300";
}

export function formatLocalTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

export function relativeTime(iso: string, now = new Date()) {
  const diff = new Date(iso).getTime() - now.getTime();
  const abs = Math.abs(diff);
  const m = Math.round(abs / 60_000);
  const h = Math.floor(m / 60);
  const rem = m % 60;
  const text = h > 0 ? `${h}h ${rem}m` : `${m}m`;
  return diff >= 0 ? `in ${text}` : `${text} ago`;
}
