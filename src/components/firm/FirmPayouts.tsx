import { useEffect, useMemo, useState } from "react";
import {
  Activity, AlertTriangle, BadgeCheck, CheckCircle2, Clock, DollarSign,
  Hash, Star, TrendingUp, Trophy, Zap,
} from "lucide-react";

/* =========================================================================
   FirmPayouts — Brand-scoped payout intelligence panel for the
   Firm Details "Payouts" tab. Branded to match the rest of RebateBoard
   (glass surfaces, fuchsia/violet accents, semantic tokens).
   ========================================================================= */

type RiskLevel = "low" | "medium" | "high";
type Status = "verified" | "pending" | "flagged";
type Chain = "TRC20" | "ERC20" | "BTC";

type Payout = {
  amt: number;
  chain: Chain;
  time: string;
  speed: string;
  status: Status;
  tx: string;
};

type Firm = {
  id: string;
  name: string;
  abbr: string;
  tbi: number;
  stats: {
    totalPaid: string;
    avgSpeed: string;
    reliability: string;
    totalPayouts: string;
    largestPayout: string;
    lastPayout: string;
  };
  deltas: string[];
  scores: { label: string; val: number }[];
  risks: { level: RiskLevel; title: string; body: string }[];
  volData: number[];
  speedDist: number[];
  chainSplit: number[];
  payouts: Payout[];
  rankInLeaderboard: number;
};

/* -------- seeded payout generator -------- */
function seeded(seed: number) {
  let s = seed;
  return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
}
function genPayouts(firmId: string, count = 8): Payout[] {
  const rand = seeded(firmId.split("").reduce((a, c) => a + c.charCodeAt(0), 0));
  const chains: Chain[] = ["TRC20", "ERC20", "BTC"];
  const out: Payout[] = [];
  let mins = 8;
  for (let i = 0; i < count; i++) {
    const r = rand();
    const status: Status = r < 0.7 ? "verified" : r < 0.9 ? "pending" : "flagged";
    const amt = Math.floor(500 + rand() * 14500);
    const ch = chains[Math.floor(rand() * 3)];
    const speedMin = Math.floor(60 + rand() * 480);
    const sh = Math.floor(speedMin / 60);
    const sm = speedMin % 60;
    mins += Math.floor(5 + rand() * 25);
    const hash = ch === "TRC20"
      ? "T" + Math.random().toString(16).slice(2, 10).toUpperCase()
      : "0x" + Math.floor(rand() * 1e16).toString(16).padStart(8, "0");
    out.push({
      amt, chain: ch,
      time: mins < 60 ? `${mins}m ago` : `${Math.floor(mins / 60)}h ago`,
      speed: `${sh}h ${sm}m`, status, tx: hash.slice(0, 10) + "…",
    });
  }
  return out;
}

/* -------- firm registry -------- */
const FIRMS: Firm[] = [
  {
    id: "fundingpips", name: "FundingPips", abbr: "FP", tbi: 8.4,
    stats: { totalPaid: "$12.4M", avgSpeed: "2.1h", reliability: "97%", totalPayouts: "2,841", largestPayout: "$42,000", lastPayout: "8 min ago" },
    deltas: ["+14% vs last month", "+0.3h faster", "+1.2%", "+312", ""],
    scores: [
      { label: "Payout Speed", val: 94 },
      { label: "Reliability", val: 97 },
      { label: "Transparency", val: 88 },
      { label: "Trader Sentiment", val: 91 },
      { label: "Chain Verification", val: 99 },
    ],
    risks: [
      { level: "low", title: "Low risk of delays", body: "97% of payouts settle on-chain within the firm's stated SLA window." },
      { level: "medium", title: "Moderate concentration on TRC20", body: "68% of volume on Tron — limited diversification across L1 settlement rails." },
    ],
    volData: [340, 420, 510, 480, 600, 720, 680, 810, 760, 900, 840, 980],
    speedDist: [38, 42, 14, 6], chainSplit: [68, 28, 4],
    payouts: genPayouts("fundingpips"), rankInLeaderboard: 2,
  },
  {
    id: "ftmo", name: "FTMO", abbr: "FT", tbi: 9.0,
    stats: { totalPaid: "$25.9M", avgSpeed: "2.8h", reliability: "98%", totalPayouts: "3,910", largestPayout: "$48,500", lastPayout: "11 min ago" },
    deltas: ["+9% vs last month", "−0.1h faster", "+0.4%", "+228", ""],
    scores: [
      { label: "Payout Speed", val: 88 },
      { label: "Reliability", val: 98 },
      { label: "Transparency", val: 95 },
      { label: "Trader Sentiment", val: 93 },
      { label: "Chain Verification", val: 96 },
    ],
    risks: [
      { level: "low", title: "Industry-leading reliability", body: "Less than 0.4% of payouts disputed across the last 12 months." },
      { level: "low", title: "Multi-chain settlement", body: "Active across TRC20, ERC20 and BTC with verified treasury wallets." },
    ],
    volData: [620, 710, 690, 820, 900, 1020, 980, 1140, 1080, 1240, 1190, 1320],
    speedDist: [28, 48, 18, 6], chainSplit: [54, 38, 8],
    payouts: genPayouts("ftmo"), rankInLeaderboard: 1,
  },
  {
    id: "maven", name: "Maven Trading", abbr: "MV", tbi: 7.9,
    stats: { totalPaid: "$5.2M", avgSpeed: "1.5h", reliability: "96%", totalPayouts: "1,210", largestPayout: "$22,100", lastPayout: "3 min ago" },
    deltas: ["+22% vs last month", "+0.5h faster", "+0.8%", "+184", ""],
    scores: [
      { label: "Payout Speed", val: 96 },
      { label: "Reliability", val: 92 },
      { label: "Transparency", val: 84 },
      { label: "Trader Sentiment", val: 89 },
      { label: "Chain Verification", val: 93 },
    ],
    risks: [
      { level: "low", title: "Fastest payout speed", body: "Average settlement under 2h, with 52% of payouts confirmed in <2h." },
      { level: "medium", title: "Limited operating history", body: "Founded in 2022 — track record shorter than top-tier incumbents." },
    ],
    volData: [120, 180, 240, 280, 320, 410, 470, 520, 560, 610, 690, 740],
    speedDist: [52, 32, 12, 4], chainSplit: [62, 30, 8],
    payouts: genPayouts("maven"), rankInLeaderboard: 4,
  },
  {
    id: "the5ers", name: "The5ers", abbr: "T5", tbi: 8.1,
    stats: { totalPaid: "$8.4M", avgSpeed: "3.3h", reliability: "94%", totalPayouts: "2,110", largestPayout: "$28,400", lastPayout: "25 min ago" },
    deltas: ["+7% vs last month", "−0.2h slower", "−0.3%", "+96", ""],
    scores: [
      { label: "Payout Speed", val: 78 },
      { label: "Reliability", val: 94 },
      { label: "Transparency", val: 86 },
      { label: "Trader Sentiment", val: 84 },
      { label: "Chain Verification", val: 90 },
    ],
    risks: [
      { level: "medium", title: "Slower than peer average", body: "Average payout time exceeds 3h — slower than the top quartile." },
      { level: "low", title: "Stable reliability record", body: "Reliability has held above 93% for 8 consecutive months." },
    ],
    volData: [280, 320, 380, 410, 460, 520, 560, 600, 640, 690, 720, 760],
    speedDist: [22, 38, 28, 12], chainSplit: [48, 46, 6],
    payouts: genPayouts("the5ers"), rankInLeaderboard: 3,
  },
  {
    id: "e8", name: "E8 Markets", abbr: "E8", tbi: 7.6,
    stats: { totalPaid: "$4.1M", avgSpeed: "2.6h", reliability: "95%", totalPayouts: "1,580", largestPayout: "$19,800", lastPayout: "42 min ago" },
    deltas: ["+11% vs last month", "+0.1h faster", "+0.6%", "+142", ""],
    scores: [
      { label: "Payout Speed", val: 86 },
      { label: "Reliability", val: 95 },
      { label: "Transparency", val: 96 },
      { label: "Trader Sentiment", val: 87 },
      { label: "Chain Verification", val: 94 },
    ],
    risks: [
      { level: "low", title: "Audited treasury", body: "Quarterly attestations published — wallets verified by third party." },
      { level: "medium", title: "US KYC overhead", body: "Some non-US traders report longer KYC verification windows." },
    ],
    volData: [180, 220, 260, 290, 320, 360, 400, 440, 470, 510, 540, 580],
    speedDist: [32, 44, 18, 6], chainSplit: [44, 50, 6],
    payouts: genPayouts("e8"), rankInLeaderboard: 5,
  },
  {
    id: "alpha-capital", name: "Alpha Capital", abbr: "AC", tbi: 7.0,
    stats: { totalPaid: "$1.8M", avgSpeed: "4.8h", reliability: "82%", totalPayouts: "640", largestPayout: "$14,200", lastPayout: "4 hrs ago" },
    deltas: ["+5% vs last month", "−0.6h slower", "−1.4%", "+58", ""],
    scores: [
      { label: "Payout Speed", val: 64 },
      { label: "Reliability", val: 82 },
      { label: "Transparency", val: 72 },
      { label: "Trader Sentiment", val: 70 },
      { label: "Chain Verification", val: 88 },
    ],
    risks: [
      { level: "high", title: "Reliability below threshold", body: "82% reliability — below the 90% community confidence threshold." },
      { level: "medium", title: "Slower payout cadence", body: "Average settlement near 5h — among the slowest in tracked firms." },
    ],
    volData: [60, 90, 110, 130, 160, 190, 210, 240, 260, 290, 310, 340],
    speedDist: [12, 28, 38, 22], chainSplit: [56, 38, 6],
    payouts: genPayouts("alpha-capital"), rankInLeaderboard: 6,
  },
];

function resolveFirm(name: string): Firm {
  const norm = name.toLowerCase().replace(/\s+/g, "");
  return (
    FIRMS.find((f) => f.id.replace(/-/g, "") === norm) ||
    FIRMS.find((f) => f.name.toLowerCase().replace(/\s+/g, "") === norm) ||
    FIRMS.find((f) => norm.includes(f.id.replace(/-/g, ""))) ||
    FIRMS[0]
  );
}

/* -------- Volume bar chart (themed) -------- */
function VolumeChart({ data }: { data: number[] }) {
  const W = 600, H = 200, pad = { l: 40, r: 12, t: 12, b: 26 };
  const max = Math.max(...data) * 1.1;
  const bw = (W - pad.l - pad.r) / data.length - 8;
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const ticks = 4;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} className="block">
      <defs>
        <linearGradient id="fp-bar" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgb(232 121 249)" stopOpacity="1" />
          <stop offset="100%" stopColor="rgb(139 92 246)" stopOpacity="0.7" />
        </linearGradient>
      </defs>
      {Array.from({ length: ticks + 1 }).map((_, i) => {
        const y = pad.t + ((H - pad.t - pad.b) * i) / ticks;
        const v = max - (max * i) / ticks;
        return (
          <g key={i}>
            <line x1={pad.l} x2={W - pad.r} y1={y} y2={y} stroke="rgba(255,255,255,0.06)" />
            <text x={pad.l - 6} y={y + 3} textAnchor="end" fontSize={10} fill="rgba(255,255,255,0.45)">${Math.round(v)}K</text>
          </g>
        );
      })}
      {data.map((v, i) => {
        const h = (v / max) * (H - pad.t - pad.b);
        const x = pad.l + i * ((W - pad.l - pad.r) / data.length) + 4;
        const y = H - pad.b - h;
        const isLast = i === data.length - 1;
        return (
          <g key={i}>
            <rect x={x} y={y} width={bw} height={h} rx={4} fill="url(#fp-bar)" opacity={isLast ? 1 : 0.55}>
              <title>${v}K</title>
            </rect>
            <text x={x + bw / 2} y={H - pad.b + 14} textAnchor="middle" fontSize={9} fill="rgba(255,255,255,0.4)">
              {months[i]}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/* -------- Donut chart -------- */
function Donut({ data, colors, size = 150 }: { data: number[]; colors: string[]; size?: number }) {
  const total = data.reduce((a, b) => a + b, 0) || 1;
  const r = size / 2 - 6;
  const inner = r * 0.62;
  const cx = size / 2, cy = size / 2;
  let acc = 0;
  return (
    <svg width={size} height={size} className="mx-auto block">
      {data.map((v, i) => {
        const start = (acc / total) * Math.PI * 2 - Math.PI / 2;
        acc += v;
        const end = (acc / total) * Math.PI * 2 - Math.PI / 2;
        const large = end - start > Math.PI ? 1 : 0;
        const x1 = cx + r * Math.cos(start), y1 = cy + r * Math.sin(start);
        const x2 = cx + r * Math.cos(end), y2 = cy + r * Math.sin(end);
        const xi2 = cx + inner * Math.cos(end), yi2 = cy + inner * Math.sin(end);
        const xi1 = cx + inner * Math.cos(start), yi1 = cy + inner * Math.sin(start);
        return (
          <path key={i}
            d={`M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} L ${xi2} ${yi2} A ${inner} ${inner} 0 ${large} 0 ${xi1} ${yi1} Z`}
            fill={colors[i]} />
        );
      })}
    </svg>
  );
}

function StatusPill({ s }: { s: Status }) {
  const map: Record<Status, { cls: string; label: string; Icon: typeof CheckCircle2 }> = {
    verified: { cls: "bg-emerald-500/15 text-emerald-300 ring-emerald-400/30", label: "Verified", Icon: CheckCircle2 },
    pending:  { cls: "bg-amber-500/15 text-amber-300 ring-amber-400/30", label: "Pending", Icon: Clock },
    flagged:  { cls: "bg-rose-500/15 text-rose-300 ring-rose-400/30", label: "Flagged", Icon: AlertTriangle },
  };
  const v = map[s];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${v.cls}`}>
      <v.Icon className="h-3 w-3" /> {v.label}
    </span>
  );
}

/* -------- Main component -------- */
export function FirmPayouts({ firmName }: { firmName: string }) {
  const firm = useMemo(() => resolveFirm(firmName), [firmName]);

  const [barWidths, setBarWidths] = useState<number[]>(firm.scores.map(() => 0));
  useEffect(() => {
    setBarWidths(firm.scores.map(() => 0));
    const t = setTimeout(() => setBarWidths(firm.scores.map((s) => s.val)), 80);
    return () => clearTimeout(t);
  }, [firm]);

  const ranked = useMemo(() => [...FIRMS].sort((a, b) => b.tbi - a.tbi), []);

  const STATS = [
    { Icon: DollarSign, label: "Total Paid Out", value: firm.stats.totalPaid, delta: firm.deltas[0], tone: "pos" as const },
    { Icon: Zap, label: "Avg Payout Speed", value: firm.stats.avgSpeed, delta: firm.deltas[1], tone: firm.deltas[1].includes("slower") ? "neg" as const : "pos" as const },
    { Icon: BadgeCheck, label: "Reliability Rate", value: firm.stats.reliability, delta: firm.deltas[2], tone: firm.deltas[2].startsWith("−") ? "neg" as const : "pos" as const },
    { Icon: Hash, label: "Total Payouts", value: firm.stats.totalPayouts, delta: firm.deltas[3], tone: "pos" as const },
    { Icon: Star, label: "Largest Payout", value: firm.stats.largestPayout, delta: firm.deltas[4], tone: "warn" as const },
  ];

  return (
    <div className="space-y-5">
      {/* Header strip */}
      <div className="glass relative overflow-hidden rounded-2xl p-4 ring-1 ring-white/10">
        <div className="pointer-events-none absolute -inset-x-10 -top-20 h-40 bg-fuchsia-500/10 blur-3xl" />
        <div className="relative flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-[rgba(126,77,255,0.18)] text-sm font-bold text-white ring-1 ring-white/10">
              {firm.abbr}
            </div>
            <div>
              <div className="text-base font-bold text-white">{firm.name} · Payout Intelligence</div>
              <div className="text-[11px] text-muted-foreground">
                On-chain verified · TBI <span className="text-fuchsia-300">{firm.tbi.toFixed(1)}</span> · Rank #{firm.rankInLeaderboard}
              </div>
            </div>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 ring-1 ring-emerald-400/30">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            <span className="text-[11px] font-medium text-emerald-300">Live · last payout {firm.stats.lastPayout}</span>
          </div>
        </div>
      </div>

      {/* Stats strip */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {STATS.map((s, i) => (
          <div key={i} className="glass rounded-2xl p-4 ring-1 ring-white/10">
            <div className="flex items-center gap-2 text-fuchsia-300">
              <s.Icon className="h-4 w-4" />
            </div>
            <div className="mt-2 text-2xl font-extrabold tracking-tight text-white">{s.value}</div>
            <div className="mt-0.5 text-[11px] text-muted-foreground">{s.label}</div>
            {s.delta && (
              <div className={`mt-2 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${
                s.tone === "pos" ? "bg-emerald-500/15 text-emerald-300 ring-emerald-400/30"
                : s.tone === "neg" ? "bg-rose-500/15 text-rose-300 ring-rose-400/30"
                : "bg-amber-500/15 text-amber-300 ring-amber-400/30"
              }`}>{s.delta}</div>
            )}
          </div>
        ))}
      </div>

      {/* 2-col grid */}
      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        {/* LEFT */}
        <div className="space-y-5 min-w-0">
          <section className="glass rounded-2xl p-5 ring-1 ring-white/10">
            <header className="mb-4 flex items-baseline justify-between">
              <h3 className="inline-flex items-center gap-2 text-sm font-bold text-white">
                <TrendingUp className="h-4 w-4 text-fuchsia-300" /> Payout Volume — Monthly
              </h3>
              <span className="text-[11px] text-muted-foreground">Last 12 months</span>
            </header>
            <VolumeChart data={firm.volData} />
          </section>

          <section className="glass rounded-2xl p-5 ring-1 ring-white/10">
            <header className="mb-3 flex items-baseline justify-between">
              <h3 className="text-sm font-bold text-white">Recent Payouts</h3>
              <span className="text-[11px] text-muted-foreground">Verified on-chain</span>
            </header>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-white/10">
                    {["Amount","Chain","Time","Speed","Status","TX Hash"].map((h) => (
                      <th key={h} className="px-2.5 pb-2 text-left text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {firm.payouts.map((p, i) => (
                    <tr key={i} className={`transition-colors hover:bg-fuchsia-500/5 ${
                      i === firm.payouts.length - 1 ? "" : "border-b border-white/5"
                    }`}>
                      <td className="px-2.5 py-2.5 font-mono font-semibold text-emerald-300">
                        ${p.amt >= 1000 ? (p.amt / 1000).toFixed(1) + "K" : p.amt}
                      </td>
                      <td className="px-2.5 py-2.5">
                        <span className="rounded-md bg-violet-500/15 px-1.5 py-0.5 font-mono text-[10px] text-violet-200 ring-1 ring-violet-400/20">
                          {p.chain}
                        </span>
                      </td>
                      <td className="px-2.5 py-2.5 text-[11px] text-muted-foreground">{p.time}</td>
                      <td className="px-2.5 py-2.5 font-mono text-[11px] text-muted-foreground">{p.speed}</td>
                      <td className="px-2.5 py-2.5"><StatusPill s={p.status} /></td>
                      <td className="px-2.5 py-2.5 font-mono text-[10px] text-fuchsia-300">{p.tx}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="glass rounded-2xl p-5 ring-1 ring-white/10">
            <header className="mb-3">
              <h3 className="text-sm font-bold text-white">TBI Score Breakdown</h3>
              <div className="mt-0.5 text-[11px] text-muted-foreground">Trust & Blockchain Index</div>
            </header>
            <div className="space-y-2.5">
              {firm.scores.map((s, i) => (
                <div key={s.label} className="flex items-center gap-3">
                  <div className="w-36 text-xs text-muted-foreground">{s.label}</div>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/5">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-fuchsia-400 to-violet-500 transition-all duration-700"
                      style={{ width: `${barWidths[i]}%` }}
                    />
                  </div>
                  <div className="w-9 text-right font-mono text-xs text-white">{s.val}</div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* RIGHT */}
        <div className="space-y-5 min-w-0">
          <section className="glass rounded-2xl p-5 ring-1 ring-white/10">
            <h3 className="mb-3 text-sm font-bold text-white">Payout Speed Distribution</h3>
            <div className="mb-3 flex flex-wrap gap-2">
              {[
                { label: "< 2h", c: "rgb(52 211 153)" },
                { label: "2–6h", c: "rgb(167 139 250)" },
                { label: "6–24h", c: "rgb(251 191 36)" },
                { label: "> 24h", c: "rgb(244 114 182)" },
              ].map((l, i) => (
                <span key={i} className="inline-flex items-center gap-1.5 text-[10.5px] text-muted-foreground">
                  <span className="h-2 w-2 rounded-full" style={{ background: l.c }} />
                  {l.label} <span className="font-mono text-white">{firm.speedDist[i]}%</span>
                </span>
              ))}
            </div>
            <Donut data={firm.speedDist} colors={["rgb(52 211 153)", "rgb(167 139 250)", "rgb(251 191 36)", "rgb(244 114 182)"]} />
          </section>

          <section className="glass rounded-2xl p-5 ring-1 ring-white/10">
            <h3 className="mb-3 text-sm font-bold text-white">Chain Distribution</h3>
            <div className="mb-3 flex flex-wrap gap-2">
              {[
                { label: "TRC20", c: "rgb(56 189 248)" },
                { label: "ERC20", c: "rgb(167 139 250)" },
                { label: "BTC", c: "rgb(251 191 36)" },
              ].map((l, i) => (
                <span key={i} className="inline-flex items-center gap-1.5 text-[10.5px] text-muted-foreground">
                  <span className="h-2 w-2 rounded-full" style={{ background: l.c }} />
                  {l.label} <span className="font-mono text-white">{firm.chainSplit[i]}%</span>
                </span>
              ))}
            </div>
            <Donut data={firm.chainSplit} colors={["rgb(56 189 248)", "rgb(167 139 250)", "rgb(251 191 36)"]} />
          </section>

          <section className="glass rounded-2xl p-5 ring-1 ring-white/10">
            <h3 className="mb-3 text-sm font-bold text-white">Risk Assessment</h3>
            <div className="space-y-2.5">
              {firm.risks.map((r, i) => {
                const map = {
                  low:    { ring: "ring-emerald-400/25 bg-emerald-500/5", text: "text-emerald-300", Icon: CheckCircle2 },
                  medium: { ring: "ring-amber-400/25 bg-amber-500/5", text: "text-amber-300", Icon: AlertTriangle },
                  high:   { ring: "ring-rose-400/25 bg-rose-500/5", text: "text-rose-300", Icon: AlertTriangle },
                }[r.level];
                return (
                  <div key={i} className={`flex items-start gap-2.5 rounded-xl p-2.5 ring-1 ${map.ring}`}>
                    <map.Icon className={`mt-0.5 h-4 w-4 flex-shrink-0 ${map.text}`} />
                    <div>
                      <div className={`text-xs font-semibold ${map.text}`}>{r.title}</div>
                      <div className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">{r.body}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="glass rounded-2xl p-5 ring-1 ring-white/10">
            <header className="mb-3">
              <h3 className="inline-flex items-center gap-2 text-sm font-bold text-white">
                <Trophy className="h-4 w-4 text-amber-300" /> Industry Ranking
              </h3>
              <div className="mt-0.5 text-[11px] text-muted-foreground">By TBI Score</div>
            </header>
            <div>
              {ranked.map((f, i) => {
                const isMe = f.id === firm.id;
                const rankBg = ["bg-amber-500/15 text-amber-300", "bg-white/10 text-white/80", "bg-orange-500/15 text-orange-300"][i] || "bg-white/5 text-muted-foreground";
                return (
                  <div key={f.id} className={`flex items-center gap-2.5 border-b border-white/5 py-2 last:border-0 ${
                    isMe ? "rounded-lg bg-fuchsia-500/10 px-2 ring-1 ring-fuchsia-400/30" : ""
                  }`}>
                    <span className={`grid h-5 w-5 place-items-center rounded text-[10px] font-bold ${rankBg}`}>{i + 1}</span>
                    <span className="grid h-6 w-6 place-items-center rounded-md bg-[rgba(126,77,255,0.18)] text-[9px] font-bold text-white ring-1 ring-white/10">
                      {f.abbr}
                    </span>
                    <span className={`flex-1 text-xs ${isMe ? "font-semibold text-white" : "text-muted-foreground"}`}>
                      {f.name}{isMe && <span className="ml-1.5 text-[10px] text-fuchsia-300">◀ you</span>}
                    </span>
                    <span className="font-mono text-xs text-fuchsia-300">{f.tbi.toFixed(1)}</span>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="glass rounded-2xl p-5 ring-1 ring-white/10">
            <header className="mb-3 flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              <h3 className="inline-flex items-center gap-1.5 text-sm font-bold text-white">
                <Activity className="h-4 w-4 text-emerald-300" /> Live Activity
              </h3>
            </header>
            <div>
              {[
                { c: "bg-emerald-400", body: <><b className="text-white">$2,450</b> paid in 2h 14m</>, t: "8m ago" },
                { c: "bg-violet-400", body: "New payout submitted and verified on-chain", t: "12m ago" },
                { c: "bg-emerald-400", body: <><b className="text-white">$1,800</b> confirmed — TXN verified</>, t: "19m ago" },
                { c: "bg-amber-400", body: "1 payout flagged as pending — processing", t: "31m ago" },
                { c: "bg-emerald-400", body: <><b className="text-white">$4,200</b> — whale payout confirmed</>, t: "44m ago" },
              ].map((a, i) => (
                <div key={i} className="flex items-start gap-2.5 border-b border-white/5 py-2 last:border-0">
                  <span className={`mt-1.5 h-2 w-2 flex-shrink-0 rounded-full ${a.c}`} />
                  <div className="flex-1 text-xs leading-relaxed text-muted-foreground">{a.body}</div>
                  <div className="whitespace-nowrap font-mono text-[11px] text-white/30">{a.t}</div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
