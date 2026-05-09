// Deterministic synthetic curve + calendar generators driven by report metrics.
// Produces stable, "realistic" looking equity / drawdown / day-PnL data without a backend.

export type EquityPoint = { i: number; equity: number; drawdown: number };

function seeded(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

function hashString(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return Math.abs(h);
}

export function buildEquityCurve(opts: {
  reportId: string;
  trades: number;
  netPnl: number;
  winRate: number;
  avgRR: number;
}): EquityPoint[] {
  const n = Math.max(20, Math.min(opts.trades || 60, 200));
  const rng = seeded(hashString(opts.reportId) || 1);
  const winProb = Math.max(0.05, Math.min(0.95, (opts.winRate || 50) / 100));
  const winSize = Math.max(1, Math.abs(opts.netPnl) / Math.max(n * winProb * (opts.avgRR || 1.5), 1));
  const lossSize = winSize / Math.max(opts.avgRR || 1.5, 0.5);

  let equity = 0;
  let peak = 0;
  const target = opts.netPnl;
  const drift = (target - equity) / n;
  const out: EquityPoint[] = [];

  for (let i = 0; i < n; i++) {
    const win = rng() < winProb;
    const step = (win ? winSize : -lossSize) + drift * 0.6;
    equity += step;
    peak = Math.max(peak, equity);
    out.push({ i, equity: Math.round(equity * 100) / 100, drawdown: Math.round((equity - peak) * 100) / 100 });
  }
  // Force last point to end roughly at netPnl for visual consistency.
  const last = out[out.length - 1];
  const adj = target - last.equity;
  if (Math.abs(adj) > 0.1) {
    for (let i = 0; i < out.length; i++) {
      out[i].equity = Math.round((out[i].equity + (adj * (i + 1)) / out.length) * 100) / 100;
    }
  }
  return out;
}

export function pathFromCurve(points: number[], width = 300, height = 100, pad = 4) {
  if (!points.length) return { line: "", area: "" };
  const min = Math.min(...points, 0);
  const max = Math.max(...points, 0);
  const range = max - min || 1;
  const stepX = (width - pad * 2) / Math.max(points.length - 1, 1);
  const y = (v: number) => height - pad - ((v - min) / range) * (height - pad * 2);
  const x = (i: number) => pad + i * stepX;

  const line = points.map((v, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const area = `${line} L${x(points.length - 1).toFixed(1)},${height} L${x(0).toFixed(1)},${height} Z`;
  return { line, area };
}

export type CalendarDay = { day: number; pnl: number; trades: number; tone: "up" | "down" | "flat" | "warn" };

export function buildCalendar(opts: { reportId: string; netPnl: number; trades: number; bestDay: string }): CalendarDay[] {
  const rng = seeded(hashString(opts.reportId + "cal") || 7);
  const days = 35;
  const tradeBudget = opts.trades || 60;
  const positiveBias = opts.netPnl >= 0 ? 0.58 : 0.42;
  const out: CalendarDay[] = [];
  let remaining = tradeBudget;

  for (let i = 0; i < days; i++) {
    if (i % 7 === 0) { out.push({ day: i + 1, pnl: 0, trades: 0, tone: "flat" }); continue; } // weekends-ish
    const hasTrade = rng() < 0.7 && remaining > 0;
    if (!hasTrade) { out.push({ day: i + 1, pnl: 0, trades: 0, tone: "flat" }); continue; }
    const t = Math.max(1, Math.round(rng() * 4));
    remaining -= t;
    const win = rng() < positiveBias;
    const magnitude = (rng() * 200 + 40) * (Math.abs(opts.netPnl) > 1000 ? 2 : 1);
    const pnl = Math.round((win ? magnitude : -magnitude * 0.8) * 100) / 100;
    const tone: CalendarDay["tone"] = pnl > 0 ? "up" : pnl < -120 ? "warn" : "down";
    out.push({ day: i + 1, pnl, trades: t, tone });
  }
  return out;
}
