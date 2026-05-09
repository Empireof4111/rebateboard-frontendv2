// Lightweight CSV parser + smart column auto-mapping for trade imports.
// No external deps. Handles quoted fields, commas in quotes, escaped quotes.

export type CsvRow = Record<string, string>;

export type ParsedCsv = {
  headers: string[];
  rows: CsvRow[];
  rawCount: number;
};

export function parseCsv(text: string): ParsedCsv {
  const cleaned = text.replace(/\r\n?/g, "\n").trim();
  if (!cleaned) return { headers: [], rows: [], rawCount: 0 };

  const lines: string[][] = [];
  let cur: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < cleaned.length; i++) {
    const c = cleaned[i];
    if (inQuotes) {
      if (c === '"') {
        if (cleaned[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ",") { cur.push(field); field = ""; }
      else if (c === "\n") { cur.push(field); lines.push(cur); cur = []; field = ""; }
      else field += c;
    }
  }
  cur.push(field);
  lines.push(cur);

  const headers = (lines.shift() ?? []).map((h) => h.trim());
  const rows = lines
    .filter((l) => l.some((v) => v.trim() !== ""))
    .map((l) => {
      const r: CsvRow = {};
      headers.forEach((h, i) => { r[h] = (l[i] ?? "").trim(); });
      return r;
    });

  return { headers, rows, rawCount: rows.length };
}

// Canonical trade fields we care about.
export const TRADE_FIELDS = [
  "date", "symbol", "side", "entry", "exit", "qty",
  "fees", "commission", "swap", "pnl", "balance", "tradeId",
] as const;
export type TradeField = (typeof TRADE_FIELDS)[number];

const MATCHERS: Record<TradeField, RegExp[]> = {
  date:       [/^date$/i, /time/i, /opened?/i, /closed?/i, /timestamp/i],
  symbol:     [/^symbol$/i, /instrument/i, /pair/i, /market/i, /ticker/i],
  side:       [/^side$/i, /^type$/i, /direction/i, /action/i, /buy.?sell/i],
  entry:      [/entry/i, /open.?price/i, /price.?in/i, /^open$/i],
  exit:       [/exit/i, /close.?price/i, /price.?out/i, /^close$/i],
  qty:        [/qty/i, /quantity/i, /size/i, /volume/i, /lots?/i, /amount/i],
  fees:       [/^fees?$/i, /charge/i],
  commission: [/commission/i, /comm\b/i],
  swap:       [/swap/i, /rollover/i, /funding/i],
  pnl:        [/pnl/i, /p.?l/i, /profit/i, /net/i],
  balance:    [/balance/i, /equity/i],
  tradeId:    [/^id$/i, /trade.?id/i, /ticket/i, /order.?id/i, /deal/i],
};

export function autoMap(headers: string[]): Record<TradeField, string | null> {
  const map = {} as Record<TradeField, string | null>;
  for (const f of TRADE_FIELDS) {
    const found = headers.find((h) => MATCHERS[f].some((rx) => rx.test(h)));
    map[f] = found ?? null;
  }
  return map;
}

export type AggregatedStats = {
  trades: number;
  wins: number;
  losses: number;
  breakeven: number;
  netPnl: number;
  fees: number;
  winRate: number;
  profitFactor: number;
  avgRR: number;
  maxDD: number;
  bestDay: string;
  worstDay: string;
};

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function aggregate(
  rows: CsvRow[],
  map: Record<TradeField, string | null>,
): AggregatedStats {
  const num = (v: string) => {
    const n = parseFloat(String(v ?? "").replace(/[^0-9.\-]/g, ""));
    return isFinite(n) ? n : 0;
  };
  let netPnl = 0, fees = 0, wins = 0, losses = 0, be = 0;
  let grossWin = 0, grossLoss = 0;
  let equity = 0, peak = 0, maxDD = 0;
  const byDay: Record<string, number> = {};
  const rrs: number[] = [];

  for (const r of rows) {
    const pnl = map.pnl ? num(r[map.pnl]) : 0;
    const fee = map.fees ? num(r[map.fees]) : 0;
    const com = map.commission ? num(r[map.commission]) : 0;
    netPnl += pnl;
    fees += Math.abs(fee) + Math.abs(com);

    if (pnl > 0.0001) { wins++; grossWin += pnl; }
    else if (pnl < -0.0001) { losses++; grossLoss += -pnl; }
    else be++;

    if (map.entry && map.exit) {
      const e = num(r[map.entry]); const x = num(r[map.exit]);
      if (e && x) rrs.push(Math.abs((x - e) / e) * 100);
    }

    equity += pnl;
    peak = Math.max(peak, equity);
    maxDD = Math.min(maxDD, equity - peak);

    if (map.date) {
      const d = new Date(r[map.date]);
      if (!isNaN(d.getTime())) {
        const k = DAYS[d.getDay()];
        byDay[k] = (byDay[k] ?? 0) + pnl;
      }
    }
  }

  const total = wins + losses + be;
  const winRate = total ? Math.round((wins / total) * 100) : 0;
  const pf = grossLoss > 0 ? +(grossWin / grossLoss).toFixed(2) : grossWin > 0 ? 99 : 0;
  const avgRR = rrs.length ? +(rrs.reduce((a, b) => a + b, 0) / rrs.length / 100 * 2).toFixed(2) : 1;

  const dayEntries = Object.entries(byDay);
  const best = dayEntries.sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";
  const worst = dayEntries.sort((a, b) => a[1] - b[1])[0]?.[0] ?? "—";

  return {
    trades: total, wins, losses, breakeven: be,
    netPnl: Math.round(netPnl * 100) / 100,
    fees: Math.round(fees * 100) / 100,
    winRate, profitFactor: pf, avgRR,
    maxDD: Math.round(maxDD * 100) / 100,
    bestDay: best, worstDay: worst,
  };
}
