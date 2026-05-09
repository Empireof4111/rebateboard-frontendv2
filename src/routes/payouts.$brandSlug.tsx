import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { BRANDS } from "@/lib/payouts-data";
import { useEffect, useMemo, useRef, useState } from "react";

/* =========================================================================
   RebateBoard — Firm Payout Profile Page
   Single-route React rebuild of the spec'd Bloomberg-style payout profile.
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
  color: string;
  colorBg: string;
  founded: string;
  hq: string;
  desc: string;
  tags: { label: string; tone: "verified" | "crypto" | "yellow" }[];
  tbi: number;
  stats: {
    totalPaid: string;
    avgSpeed: string;
    reliability: string;
    totalPayouts: string;
    largestPayout: string;
    lastPayout: string;
  };
  deltas: string[]; // [totalPaid, avgSpeed, reliability, totalPayouts, largestPayout]
  scores: { label: string; val: number; color: string }[];
  risks: { level: RiskLevel; title: string; body: string }[];
  volData: number[]; // 12 months in $K
  speedDist: number[]; // [<2h, 2-6h, 6-24h, >24h]
  chainSplit: number[]; // [TRC20, ERC20, BTC]
  payouts: Payout[];
  rankInLeaderboard: number;
};

/* ---------- Seeded fake payout generator (deterministic per firm) ------- */
function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}
function genPayouts(firmId: string, count = 8): Payout[] {
  const rand = seeded(
    firmId.split("").reduce((a, c) => a + c.charCodeAt(0), 0),
  );
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
    const hash =
      ch === "TRC20"
        ? "T" + Math.random().toString(16).slice(2, 10).toUpperCase()
        : "0x" + Math.floor(rand() * 1e16).toString(16).padStart(8, "0");
    out.push({
      amt,
      chain: ch,
      time: mins < 60 ? `${mins}m ago` : `${Math.floor(mins / 60)}h ago`,
      speed: `${sh}h ${sm}m`,
      status,
      tx: hash.slice(0, 10) + "…",
    });
  }
  return out;
}

/* ---------- Firm data (6 firms per spec) ------------------------------- */
const FIRMS: Firm[] = [
  {
    id: "fundingpips",
    name: "FundingPips",
    abbr: "FP",
    color: "#7C6FF7",
    colorBg: "rgba(124,111,247,0.14)",
    founded: "2021",
    hq: "Dubai, UAE",
    desc: "One of the fastest-growing prop trading firms with verified on-chain payouts and instant funding programs across crypto rails.",
    tags: [
      { label: "verified", tone: "verified" },
      { label: "crypto", tone: "crypto" },
      { label: "top-rated", tone: "verified" },
    ],
    tbi: 8.4,
    stats: {
      totalPaid: "$12.4M",
      avgSpeed: "2.1h",
      reliability: "97%",
      totalPayouts: "2,841",
      largestPayout: "$42,000",
      lastPayout: "8 min ago",
    },
    deltas: ["+14% vs last month", "+0.3h faster", "+1.2%", "+312", ""],
    scores: [
      { label: "Payout Speed", val: 94, color: "#1FD68A" },
      { label: "Reliability", val: 97, color: "#A89BFF" },
      { label: "Transparency", val: 88, color: "#38AAEF" },
      { label: "Trader Sentiment", val: 91, color: "#F6C74A" },
      { label: "Chain Verification", val: 99, color: "#1FD68A" },
    ],
    risks: [
      { level: "low", title: "Low risk of delays", body: "97% of payouts settle on-chain within the firm's stated SLA window." },
      { level: "medium", title: "Moderate concentration on TRC20", body: "68% of volume on Tron — limited diversification across L1 settlement rails." },
    ],
    volData: [340, 420, 510, 480, 600, 720, 680, 810, 760, 900, 840, 980],
    speedDist: [38, 42, 14, 6],
    chainSplit: [68, 28, 4],
    payouts: genPayouts("fundingpips"),
    rankInLeaderboard: 2,
  },
  {
    id: "ftmo",
    name: "FTMO",
    abbr: "FT",
    color: "#F6C74A",
    colorBg: "rgba(246,199,74,0.14)",
    founded: "2015",
    hq: "Prague, Czechia",
    desc: "The most established prop firm by volume — highest TBI score with deep institutional liquidity and the largest single payouts in the industry.",
    tags: [
      { label: "verified", tone: "verified" },
      { label: "top-rated", tone: "verified" },
      { label: "whale-payouts", tone: "yellow" },
    ],
    tbi: 9.0,
    stats: {
      totalPaid: "$25.9M",
      avgSpeed: "2.8h",
      reliability: "98%",
      totalPayouts: "3,910",
      largestPayout: "$48,500",
      lastPayout: "11 min ago",
    },
    deltas: ["+9% vs last month", "−0.1h faster", "+0.4%", "+228", ""],
    scores: [
      { label: "Payout Speed", val: 88, color: "#1FD68A" },
      { label: "Reliability", val: 98, color: "#A89BFF" },
      { label: "Transparency", val: 95, color: "#38AAEF" },
      { label: "Trader Sentiment", val: 93, color: "#F6C74A" },
      { label: "Chain Verification", val: 96, color: "#1FD68A" },
    ],
    risks: [
      { level: "low", title: "Industry-leading reliability", body: "Less than 0.4% of payouts disputed across the last 12 months." },
      { level: "low", title: "Multi-chain settlement", body: "Active across TRC20, ERC20 and BTC with verified treasury wallets." },
    ],
    volData: [620, 710, 690, 820, 900, 1020, 980, 1140, 1080, 1240, 1190, 1320],
    speedDist: [28, 48, 18, 6],
    chainSplit: [54, 38, 8],
    payouts: genPayouts("ftmo"),
    rankInLeaderboard: 1,
  },
  {
    id: "maven",
    name: "Maven Trading",
    abbr: "MV",
    color: "#1FD68A",
    colorBg: "rgba(31,214,138,0.14)",
    founded: "2022",
    hq: "London, UK",
    desc: "Boutique prop firm specializing in whale-tier payouts with the fastest average settlement speed in the industry.",
    tags: [
      { label: "verified", tone: "verified" },
      { label: "whale-payouts", tone: "yellow" },
      { label: "crypto", tone: "crypto" },
    ],
    tbi: 7.9,
    stats: {
      totalPaid: "$5.2M",
      avgSpeed: "1.5h",
      reliability: "96%",
      totalPayouts: "1,210",
      largestPayout: "$22,100",
      lastPayout: "3 min ago",
    },
    deltas: ["+22% vs last month", "+0.5h faster", "+0.8%", "+184", ""],
    scores: [
      { label: "Payout Speed", val: 96, color: "#1FD68A" },
      { label: "Reliability", val: 92, color: "#A89BFF" },
      { label: "Transparency", val: 84, color: "#38AAEF" },
      { label: "Trader Sentiment", val: 89, color: "#F6C74A" },
      { label: "Chain Verification", val: 93, color: "#1FD68A" },
    ],
    risks: [
      { level: "low", title: "Fastest payout speed", body: "Average settlement under 2h, with 52% of payouts confirmed in <2h." },
      { level: "medium", title: "Limited operating history", body: "Founded in 2022 — track record shorter than top-tier incumbents." },
    ],
    volData: [120, 180, 240, 280, 320, 410, 470, 520, 560, 610, 690, 740],
    speedDist: [52, 32, 12, 4],
    chainSplit: [62, 30, 8],
    payouts: genPayouts("maven"),
    rankInLeaderboard: 4,
  },
  {
    id: "the5ers",
    name: "The5ers",
    abbr: "T5",
    color: "#F04E6A",
    colorBg: "rgba(240,78,106,0.14)",
    founded: "2016",
    hq: "Tel Aviv, Israel",
    desc: "Veteran instant-funding prop firm with broad scaling plans — slower payout cadence offset by deep equity ladders.",
    tags: [
      { label: "verified", tone: "verified" },
      { label: "instant-funding", tone: "crypto" },
    ],
    tbi: 8.1,
    stats: {
      totalPaid: "$8.4M",
      avgSpeed: "3.3h",
      reliability: "94%",
      totalPayouts: "2,110",
      largestPayout: "$28,400",
      lastPayout: "25 min ago",
    },
    deltas: ["+7% vs last month", "−0.2h slower", "−0.3%", "+96", ""],
    scores: [
      { label: "Payout Speed", val: 78, color: "#1FD68A" },
      { label: "Reliability", val: 94, color: "#A89BFF" },
      { label: "Transparency", val: 86, color: "#38AAEF" },
      { label: "Trader Sentiment", val: 84, color: "#F6C74A" },
      { label: "Chain Verification", val: 90, color: "#1FD68A" },
    ],
    risks: [
      { level: "medium", title: "Slower than peer average", body: "Average payout time exceeds 3h — slower than the top quartile." },
      { level: "low", title: "Stable reliability record", body: "Reliability has held above 93% for 8 consecutive months." },
    ],
    volData: [280, 320, 380, 410, 460, 520, 560, 600, 640, 690, 720, 760],
    speedDist: [22, 38, 28, 12],
    chainSplit: [48, 46, 6],
    payouts: genPayouts("the5ers"),
    rankInLeaderboard: 3,
  },
  {
    id: "e8",
    name: "E8 Markets",
    abbr: "E8",
    color: "#38AAEF",
    colorBg: "rgba(56,170,239,0.14)",
    founded: "2021",
    hq: "Dallas, USA",
    desc: "US-based prop firm with industry-leading transparency reports and verified treasury attestations published quarterly.",
    tags: [
      { label: "verified", tone: "verified" },
      { label: "top-rated", tone: "verified" },
    ],
    tbi: 7.6,
    stats: {
      totalPaid: "$4.1M",
      avgSpeed: "2.6h",
      reliability: "95%",
      totalPayouts: "1,580",
      largestPayout: "$19,800",
      lastPayout: "42 min ago",
    },
    deltas: ["+11% vs last month", "+0.1h faster", "+0.6%", "+142", ""],
    scores: [
      { label: "Payout Speed", val: 86, color: "#1FD68A" },
      { label: "Reliability", val: 95, color: "#A89BFF" },
      { label: "Transparency", val: 96, color: "#38AAEF" },
      { label: "Trader Sentiment", val: 87, color: "#F6C74A" },
      { label: "Chain Verification", val: 94, color: "#1FD68A" },
    ],
    risks: [
      { level: "low", title: "Audited treasury", body: "Quarterly attestations published — wallets verified by third party." },
      { level: "medium", title: "US KYC overhead", body: "Some non-US traders report longer KYC verification windows." },
    ],
    volData: [180, 220, 260, 290, 320, 360, 400, 440, 470, 510, 540, 580],
    speedDist: [32, 44, 18, 6],
    chainSplit: [44, 50, 6],
    payouts: genPayouts("e8"),
    rankInLeaderboard: 5,
  },
  {
    id: "alpha-capital",
    name: "Alpha Capital",
    abbr: "AC",
    color: "#FF9060",
    colorBg: "rgba(255,144,96,0.14)",
    founded: "2023",
    hq: "Singapore",
    desc: "Newer entrant building out its track record — strong scaling product, but reliability still maturing.",
    tags: [{ label: "verified", tone: "verified" }],
    tbi: 7.0,
    stats: {
      totalPaid: "$1.8M",
      avgSpeed: "4.8h",
      reliability: "82%",
      totalPayouts: "640",
      largestPayout: "$14,200",
      lastPayout: "4 hrs ago",
    },
    deltas: ["+5% vs last month", "−0.6h slower", "−1.4%", "+58", ""],
    scores: [
      { label: "Payout Speed", val: 64, color: "#1FD68A" },
      { label: "Reliability", val: 82, color: "#A89BFF" },
      { label: "Transparency", val: 72, color: "#38AAEF" },
      { label: "Trader Sentiment", val: 70, color: "#F6C74A" },
      { label: "Chain Verification", val: 88, color: "#1FD68A" },
    ],
    risks: [
      { level: "high", title: "Reliability below threshold", body: "82% reliability — below the 90% community confidence threshold." },
      { level: "medium", title: "Slower payout cadence", body: "Average settlement near 5h — among the slowest in tracked firms." },
    ],
    volData: [60, 90, 110, 130, 160, 190, 210, 240, 260, 290, 310, 340],
    speedDist: [12, 28, 38, 22],
    chainSplit: [56, 38, 6],
    payouts: genPayouts("alpha-capital"),
    rankInLeaderboard: 6,
  },
];

/* ---------- Route ------------------------------------------------------- */
export const Route = createFileRoute("/payouts/$brandSlug")({
  loader: ({ params }) => {
    const fallbackSlug = params.brandSlug;
    const firm =
      FIRMS.find((f) => f.id === fallbackSlug) ??
      FIRMS.find((f) => BRANDS.find((b) => b.slug === fallbackSlug)?.name.toLowerCase().includes(f.id)) ??
      FIRMS[0];
    if (!firm) throw notFound();
    return { firm };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.firm.name} Payouts — RebateBoard` },
      { name: "description", content: `On-chain verified payout intelligence for ${loaderData?.firm.name}: speed, reliability, TBI breakdown.` },
    ],
  }),
  notFoundComponent: () => (
    <div className="min-h-screen" style={{ background: "#07090F", color: "#E4E8FF" }}>
      <SiteHeader />
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="text-3xl font-bold">Firm not found</h1>
        <Link to="/payouts" className="mt-4 inline-block" style={{ color: "#A89BFF" }}>← Back to Payouts</Link>
      </div>
    </div>
  ),
  errorComponent: ({ error }) => (
    <div className="min-h-screen p-8" style={{ background: "#07090F", color: "#E4E8FF" }}>{error.message}</div>
  ),
  component: BrandPage,
});

/* ---------- Helpers ----------------------------------------------------- */
const C = {
  bg: "#07090F", surface: "#0C0F1A", card: "#111523", card2: "#161B2E",
  border: "rgba(100,115,210,0.13)", border2: "rgba(100,115,210,0.24)",
  purple: "#7C6FF7", purple2: "#A89BFF",
  green: "#1FD68A", yellow: "#F6C74A", red: "#F04E6A", blue: "#38AAEF",
  text: "#E4E8FF", muted: "#6B74A0", dim: "#353C5C",
};
const FF_DISPLAY = "'Syne', system-ui, sans-serif";
const FF_BODY = "'DM Sans', system-ui, sans-serif";
const FF_MONO = "'DM Mono', ui-monospace, monospace";

/* ---------- TBI Score Ring (animated SVG) ------------------------------ */
function TBIRing({ score, color }: { score: number; color: string }) {
  const r = 36;
  const circ = 2 * Math.PI * r;
  const target = circ - (score / 10) * circ;
  const [offset, setOffset] = useState(circ);
  useEffect(() => {
    setOffset(circ);
    const t = setTimeout(() => setOffset(target), 60);
    return () => clearTimeout(t);
  }, [target, circ]);
  return (
    <div style={{ position: "relative", width: 80, height: 80 }}>
      <svg width={80} height={80}>
        <circle cx={40} cy={40} r={r} stroke={C.dim} strokeWidth={6} fill="none" />
        <circle
          cx={40} cy={40} r={r} stroke={color} strokeWidth={6} fill="none"
          strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
          transform="rotate(-90 40 40)"
          style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(.4,0,.2,1)" }}
        />
      </svg>
      <div style={{
        position: "absolute", inset: 0, display: "grid", placeItems: "center",
        fontFamily: FF_DISPLAY, fontWeight: 800, fontSize: 26, color,
      }}>{score.toFixed(1)}</div>
    </div>
  );
}

/* ---------- Bar chart (Payout Volume) ---------------------------------- */
function VolumeChart({ data, color }: { data: number[]; color: string }) {
  const W = 600, H = 220, pad = { l: 40, r: 12, t: 12, b: 26 };
  const max = Math.max(...data) * 1.1;
  const bw = (W - pad.l - pad.r) / data.length - 8;
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const ticks = 4;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} style={{ display: "block" }}>
      {Array.from({ length: ticks + 1 }).map((_, i) => {
        const y = pad.t + ((H - pad.t - pad.b) * i) / ticks;
        const v = max - (max * i) / ticks;
        return (
          <g key={i}>
            <line x1={pad.l} x2={W - pad.r} y1={y} y2={y} stroke="rgba(100,115,210,0.06)" />
            <text x={pad.l - 6} y={y + 3} textAnchor="end" fontSize={10} fill={C.muted} fontFamily={FF_MONO}>
              ${Math.round(v)}K
            </text>
          </g>
        );
      })}
      {data.map((v, i) => {
        const h = ((v / max) * (H - pad.t - pad.b));
        const x = pad.l + i * ((W - pad.l - pad.r) / data.length) + 4;
        const y = H - pad.b - h;
        const isLast = i === data.length - 1;
        return (
          <g key={i}>
            <rect x={x} y={y} width={bw} height={h} rx={5}
              fill={color} fillOpacity={isLast ? 1 : 0.45}>
              <title>${v}K</title>
            </rect>
            <text x={x + bw / 2} y={H - pad.b + 14} textAnchor="middle" fontSize={10} fill={C.muted} fontFamily={FF_BODY}>
              {months[i]}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/* ---------- Donut chart ------------------------------------------------ */
function Donut({ data, colors, size = 170 }: { data: number[]; colors: string[]; size?: number }) {
  const total = data.reduce((a, b) => a + b, 0) || 1;
  const r = size / 2 - 6;
  const inner = r * 0.65;
  const cx = size / 2, cy = size / 2;
  let acc = 0;
  const slices = data.map((v, i) => {
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
  });
  return <svg width={size} height={size} style={{ display: "block", margin: "0 auto" }}>{slices}</svg>;
}

/* ---------- Tag pill --------------------------------------------------- */
function TagPill({ label, tone }: { label: string; tone: "verified" | "crypto" | "yellow" }) {
  const map = {
    verified: { bg: "rgba(31,214,138,0.10)", bd: "rgba(31,214,138,0.32)", fg: C.green },
    crypto:   { bg: "rgba(124,111,247,0.12)", bd: "rgba(124,111,247,0.34)", fg: C.purple2 },
    yellow:   { bg: "rgba(246,199,74,0.10)", bd: "rgba(246,199,74,0.30)", fg: C.yellow },
  }[tone];
  return (
    <span style={{
      background: map.bg, color: map.fg, border: `1px solid ${map.bd}`,
      padding: "3px 9px", borderRadius: 999, fontSize: 10.5, fontFamily: FF_BODY, fontWeight: 500,
    }}>{label}</span>
  );
}

/* ---------- Status pill ------------------------------------------------ */
function StatusPill({ s }: { s: Status }) {
  const map: Record<Status, { fg: string; bg: string; label: string }> = {
    verified: { fg: C.green, bg: "rgba(31,214,138,0.12)", label: "✓ Verified" },
    pending:  { fg: C.yellow, bg: "rgba(246,199,74,0.12)", label: "◷ Pending" },
    flagged:  { fg: C.red, bg: "rgba(240,78,106,0.12)", label: "⚠ Flagged" },
  };
  const v = map[s];
  return (
    <span style={{
      background: v.bg, color: v.fg, padding: "3px 7px", borderRadius: 4,
      fontSize: 10.5, fontFamily: FF_MONO, fontWeight: 500, whiteSpace: "nowrap",
    }}>{v.label}</span>
  );
}

/* ---------- Section card wrapper -------------------------------------- */
function SecCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={"sec-card " + className} style={{
      background: C.card, border: `1px solid ${C.border}`,
      borderRadius: 14, padding: 20, transition: "border-color .18s",
    }}>{children}</div>
  );
}

/* ---------- Main page -------------------------------------------------- */
function BrandPage() {
  const { firm: initialFirm } = Route.useLoaderData();
  const navigate = useNavigate();
  const [firm, setFirm] = useState<Firm>(initialFirm as unknown as Firm);

  // keep state in sync if URL param changes externally
  useEffect(() => { setFirm(initialFirm as unknown as Firm); }, [initialFirm]);

  const switchFirm = (f: Firm) => {
    setFirm(f);
    navigate({ to: "/payouts/$brandSlug", params: { brandSlug: f.id } });
  };

  // Animated score bar widths
  const [barWidths, setBarWidths] = useState<number[]>(firm.scores.map(() => 0));
  useEffect(() => {
    setBarWidths(firm.scores.map(() => 0));
    const t = setTimeout(() => setBarWidths(firm.scores.map((s) => s.val)), 80);
    return () => clearTimeout(t);
  }, [firm]);

  const ranked = useMemo(
    () => [...FIRMS].sort((a, b) => b.tbi - a.tbi),
    [],
  );

  return (
    <>
      {/* Google Fonts */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500&family=DM+Mono:wght@400;500&display=swap"
      />

      <style>{`
        @keyframes rb-pulse { 0%,100% { opacity:1; transform:scale(1); } 50% { opacity:.45; transform:scale(1.4); } }
        @keyframes rb-fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        .rb-fade { animation: rb-fadeUp .45s ease both; }
        .rb-d1 { animation-delay:.05s } .rb-d2 { animation-delay:.10s } .rb-d3 { animation-delay:.15s }
        .rb-d4 { animation-delay:.20s } .rb-d5 { animation-delay:.25s }
        .rb-scroll::-webkit-scrollbar { height: 0; }
        .rb-scroll { scrollbar-width: none; }
        .rb-sec-card:hover { border-color: ${C.border2} !important; }
        .rb-link:hover { text-decoration: underline; }
        .rb-row:hover { background: rgba(124,111,247,0.04); }
        .rb-btn-primary:hover { background: ${C.purple2}; transform: translateY(-1px); }
        .rb-btn-outline:hover { background: rgba(124,111,247,0.12); }
        .rb-tab:hover { color: ${C.text}; }
      `}</style>

      <div style={{
        background: C.bg, color: C.text, minHeight: "100vh",
        fontFamily: FF_BODY, fontSize: 13,
      }}>
        {/* === STICKY NAV ============================================= */}
        <div style={{
          position: "sticky", top: 0, zIndex: 100,
          background: "rgba(7,9,15,0.88)", backdropFilter: "blur(16px)",
          borderBottom: `1px solid ${C.border}`,
          padding: "0 48px", height: 52, display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <Link to="/" style={{
            fontFamily: FF_DISPLAY, fontWeight: 800, fontSize: 18, letterSpacing: -0.3,
            textDecoration: "none",
          }}>
            <span style={{ color: C.purple2 }}>Rebate</span>
            <span style={{ color: C.text }}>Board</span>
          </Link>
          <div style={{ fontSize: 12, color: C.muted, fontFamily: FF_BODY }}>
            <Link to="/" style={{ color: C.purple2, textDecoration: "none" }} className="rb-link">Home</Link>
            <span style={{ margin: "0 8px" }}>›</span>
            <Link to="/payouts" style={{ color: C.purple2, textDecoration: "none" }} className="rb-link">Payouts</Link>
            <span style={{ margin: "0 8px" }}>›</span>
            <span style={{ color: C.text }}>{firm.name}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{
              width: 8, height: 8, borderRadius: 999, background: C.green,
              animation: "rb-pulse 1.6s ease-in-out infinite",
            }} />
            <span style={{ color: C.green, fontFamily: FF_MONO, fontSize: 11, letterSpacing: 0.4 }}>
              Live Data
            </span>
          </div>
        </div>

        {/* === FIRM SELECTOR TAB BAR ================================= */}
        <div style={{
          background: C.surface, borderBottom: `1px solid ${C.border}`,
          padding: "14px 48px", overflowX: "auto", whiteSpace: "nowrap",
        }} className="rb-scroll">
          <div style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
            <span style={{
              fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: 1.2,
              fontFamily: FF_BODY, marginRight: 6,
            }}>Firm</span>
            {FIRMS.map((f) => {
              const active = f.id === firm.id;
              return (
                <button key={f.id} onClick={() => switchFirm(f)}
                  className="rb-tab"
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 8,
                    background: active ? C.card2 : "transparent",
                    border: `1px solid ${active ? C.border2 : C.border}`,
                    color: active ? C.text : C.muted,
                    padding: "7px 12px", borderRadius: 8, cursor: "pointer",
                    fontFamily: FF_BODY, fontSize: 12, transition: "all .18s",
                  }}>
                  <span style={{
                    width: 22, height: 22, borderRadius: 6,
                    background: f.colorBg, color: f.color,
                    display: "grid", placeItems: "center",
                    fontFamily: FF_DISPLAY, fontWeight: 700, fontSize: 10,
                  }}>{f.abbr}</span>
                  <span>{f.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* === HERO ================================================== */}
        <section style={{ position: "relative", overflow: "hidden", padding: "48px 48px 36px" }} className="rb-fade rb-d1">
          <div style={{
            position: "absolute", top: -80, left: -80, width: 380, height: 380,
            borderRadius: "50%", background: firm.color, filter: "blur(80px)", opacity: 0.18,
            pointerEvents: "none",
          }} />
          <div style={{
            position: "absolute", bottom: -60, right: -40, width: 260, height: 260,
            borderRadius: "50%", background: firm.color, filter: "blur(80px)", opacity: 0.12,
            pointerEvents: "none",
          }} />

          <div style={{
            position: "relative", display: "grid", gridTemplateColumns: "1fr auto",
            gap: 32, alignItems: "start",
          }}>
            <div>
              <div style={{ display: "flex", gap: 18, alignItems: "flex-start" }}>
                <div style={{
                  width: 72, height: 72, borderRadius: 16,
                  background: firm.colorBg, color: firm.color,
                  display: "grid", placeItems: "center",
                  fontFamily: FF_DISPLAY, fontWeight: 800, fontSize: 22,
                  flexShrink: 0,
                }}>{firm.abbr}</div>
                <div>
                  <h1 style={{
                    fontFamily: FF_DISPLAY, fontWeight: 800, fontSize: 30,
                    margin: 0, lineHeight: 1.05, letterSpacing: -0.5,
                  }}>{firm.name}</h1>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
                    {firm.tags.map((t) => <TagPill key={t.label} label={t.label} tone={t.tone} />)}
                  </div>
                  <div style={{ marginTop: 8, fontSize: 11, color: C.muted, fontFamily: FF_BODY }}>
                    Founded {firm.founded} · {firm.hq}
                  </div>
                </div>
              </div>
              <p style={{
                marginTop: 18, fontSize: 13, color: C.muted, lineHeight: 1.6,
                maxWidth: 520, fontFamily: FF_BODY,
              }}>{firm.desc}</p>
              <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
                <Link to="/firm/$firmId" params={{ firmId: firm.id }} className="rb-btn-primary"
                  style={{
                    background: C.purple, color: "#fff", border: "none",
                    padding: "9px 18px", borderRadius: 8,
                    fontFamily: FF_BODY, fontSize: 12, fontWeight: 500,
                    textDecoration: "none", transition: "all .18s", cursor: "pointer",
                  }}>View Full Review</Link>
                <button className="rb-btn-outline" style={{
                  background: "transparent", color: C.purple2,
                  border: `1px solid ${C.purple}`, padding: "9px 18px", borderRadius: 8,
                  fontFamily: FF_BODY, fontSize: 12, fontWeight: 500, cursor: "pointer",
                  transition: "all .18s",
                }}>Submit a Payout</button>
              </div>
            </div>

            {/* TBI Ring */}
            <div style={{ textAlign: "center" }}>
              <TBIRing key={firm.id} score={firm.tbi} color={firm.color} />
              <div style={{
                marginTop: 6, fontSize: 9, color: C.muted, textTransform: "uppercase",
                letterSpacing: 1.4, fontFamily: FF_BODY,
              }}>TBI Score</div>
              <div style={{ marginTop: 8, fontSize: 11, color: C.muted, fontFamily: FF_BODY }}>
                Rank #{firm.rankInLeaderboard} overall
              </div>
              <div style={{ marginTop: 4, fontSize: 11, color: C.green, fontFamily: FF_MONO }}>
                Last payout: {firm.stats.lastPayout}
              </div>
            </div>
          </div>
        </section>

        {/* === TOP STATS STRIP ====================================== */}
        <section style={{
          padding: "0 48px 32px",
          display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10,
        }} className="rb-fade rb-d2">
          {[
            { icon: "💰", label: "Total Paid Out", value: firm.stats.totalPaid, delta: firm.deltas[0], tone: "pos" },
            { icon: "⚡", label: "Avg Payout Speed", value: firm.stats.avgSpeed, delta: firm.deltas[1], tone: firm.deltas[1].includes("slower") ? "neg" : "pos" },
            { icon: "✓",  label: "Reliability Rate", value: firm.stats.reliability, delta: firm.deltas[2], tone: firm.deltas[2].startsWith("−") ? "neg" : "pos" },
            { icon: "#",  label: "Total Payouts", value: firm.stats.totalPayouts, delta: firm.deltas[3], tone: "pos" },
            { icon: "★",  label: "Largest Payout", value: firm.stats.largestPayout, delta: firm.deltas[4], tone: "warn" },
          ].map((s, i) => (
            <div key={i} style={{
              background: C.card, border: `1px solid ${C.border}`,
              borderTop: `2px solid ${firm.color}`,
              borderRadius: 12, padding: "14px 16px",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, color: firm.color, fontSize: 14 }}>
                <span>{s.icon}</span>
              </div>
              <div style={{
                marginTop: 6, fontFamily: FF_DISPLAY, fontWeight: 700, fontSize: 20, color: C.text, letterSpacing: -0.3,
              }}>{s.value}</div>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{s.label}</div>
              {s.delta && (
                <div style={{
                  marginTop: 8, display: "inline-block",
                  fontFamily: FF_MONO, fontSize: 10, padding: "1px 6px", borderRadius: 3,
                  background: s.tone === "pos" ? "rgba(31,214,138,0.12)" : s.tone === "neg" ? "rgba(240,78,106,0.12)" : "rgba(246,199,74,0.12)",
                  color: s.tone === "pos" ? C.green : s.tone === "neg" ? C.red : C.yellow,
                }}>{s.delta}</div>
              )}
            </div>
          ))}
        </section>

        {/* === MAIN 2-COLUMN GRID ================================== */}
        <section style={{
          padding: "0 48px 36px",
          display: "grid", gridTemplateColumns: "1fr 380px", gap: 18,
        }}>
          {/* === LEFT COLUMN === */}
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {/* Volume chart */}
            <SecCard className="rb-fade rb-d3 rb-sec-card">
              <header style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14 }}>
                <h3 style={{ margin: 0, fontFamily: FF_DISPLAY, fontWeight: 700, fontSize: 15, color: C.text }}>
                  Payout Volume — Monthly
                </h3>
                <span style={{ fontSize: 11, color: C.muted }}>Last 12 months</span>
              </header>
              <VolumeChart data={firm.volData} color={firm.color} />
            </SecCard>

            {/* Recent payouts table */}
            <SecCard className="rb-fade rb-d4 rb-sec-card">
              <header style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
                <h3 style={{ margin: 0, fontFamily: FF_DISPLAY, fontWeight: 700, fontSize: 15, color: C.text }}>
                  Recent Payouts
                </h3>
                <a href="#" style={{ color: C.purple2, fontSize: 11, textDecoration: "none" }} className="rb-link">
                  View all →
                </a>
              </header>
              <div style={{ overflowX: "auto" }} className="rb-scroll">
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead>
                    <tr>
                      {["Amount","Chain","Time","Speed","Status","TX Hash"].map((h) => (
                        <th key={h} style={{
                          textAlign: "left", color: C.muted, fontSize: 10,
                          textTransform: "uppercase", letterSpacing: 0.6,
                          padding: "0 10px 10px", fontWeight: 500,
                          borderBottom: `1px solid ${C.border}`,
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {firm.payouts.map((p, i) => (
                      <tr key={i} className="rb-row" style={{
                        borderBottom: i === firm.payouts.length - 1 ? "none" : `1px solid ${C.border}`,
                        transition: "background .15s",
                      }}>
                        <td style={{ padding: 10, fontFamily: FF_MONO, color: C.green, fontWeight: 500 }}>
                          ${p.amt >= 1000 ? (p.amt / 1000).toFixed(1) + "K" : p.amt}
                        </td>
                        <td style={{ padding: 10 }}>
                          <span style={{
                            background: "rgba(124,111,247,0.14)", color: C.purple2,
                            padding: "2px 7px", borderRadius: 4,
                            fontFamily: FF_MONO, fontSize: 10,
                          }}>{p.chain}</span>
                        </td>
                        <td style={{ padding: 10, color: C.muted, fontSize: 11 }}>{p.time}</td>
                        <td style={{ padding: 10, color: C.muted, fontSize: 11, fontFamily: FF_MONO }}>{p.speed}</td>
                        <td style={{ padding: 10 }}><StatusPill s={p.status} /></td>
                        <td style={{ padding: 10 }}>
                          <a href="#" style={{ fontFamily: FF_MONO, fontSize: 10, color: C.purple2, textDecoration: "none" }} className="rb-link">
                            {p.tx}
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SecCard>

            {/* TBI breakdown */}
            <SecCard className="rb-fade rb-d5 rb-sec-card">
              <header style={{ marginBottom: 10 }}>
                <h3 style={{ margin: 0, fontFamily: FF_DISPLAY, fontWeight: 700, fontSize: 15, color: C.text }}>
                  TBI Score Breakdown
                </h3>
                <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>Trust & Blockchain Index</div>
              </header>
              {firm.scores.map((s, i) => (
                <div key={s.label} style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "9px 0",
                  borderBottom: i === firm.scores.length - 1 ? "none" : `1px solid ${C.border}`,
                }}>
                  <div style={{ width: 140, fontSize: 12, color: C.muted }}>{s.label}</div>
                  <div style={{ flex: 1, height: 5, background: C.dim, borderRadius: 3, overflow: "hidden" }}>
                    <div style={{
                      height: "100%", width: `${barWidths[i]}%`, background: s.color,
                      borderRadius: 3, transition: "width 0.8s cubic-bezier(.4,0,.2,1)",
                    }} />
                  </div>
                  <div style={{
                    width: 36, textAlign: "right",
                    fontFamily: FF_MONO, fontSize: 12, color: s.color,
                  }}>{s.val}</div>
                </div>
              ))}
            </SecCard>
          </div>

          {/* === RIGHT COLUMN === */}
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {/* Speed Distribution */}
            <SecCard className="rb-fade rb-d3 rb-sec-card">
              <h3 style={{ margin: "0 0 10px", fontFamily: FF_DISPLAY, fontWeight: 700, fontSize: 14, color: C.text }}>
                Payout Speed Distribution
              </h3>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
                {[
                  { label: "< 2h", c: C.green },
                  { label: "2–6h", c: C.purple },
                  { label: "6–24h", c: C.yellow },
                  { label: "> 24h", c: C.red },
                ].map((l, i) => (
                  <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 10.5, color: C.muted }}>
                    <span style={{ width: 8, height: 8, borderRadius: 999, background: l.c }} />
                    {l.label} <span style={{ fontFamily: FF_MONO, color: C.text }}>{firm.speedDist[i]}%</span>
                  </span>
                ))}
              </div>
              <Donut data={firm.speedDist} colors={[C.green, C.purple, C.yellow, C.red]} />
            </SecCard>

            {/* Chain Distribution */}
            <SecCard className="rb-fade rb-d3 rb-sec-card">
              <h3 style={{ margin: "0 0 10px", fontFamily: FF_DISPLAY, fontWeight: 700, fontSize: 14, color: C.text }}>
                Chain Distribution
              </h3>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
                {[
                  { label: "TRC20", c: C.blue },
                  { label: "ERC20", c: C.purple },
                  { label: "BTC", c: C.yellow },
                ].map((l, i) => (
                  <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 10.5, color: C.muted }}>
                    <span style={{ width: 8, height: 8, borderRadius: 999, background: l.c }} />
                    {l.label} <span style={{ fontFamily: FF_MONO, color: C.text }}>{firm.chainSplit[i]}%</span>
                  </span>
                ))}
              </div>
              <Donut data={firm.chainSplit} colors={[C.blue, C.purple, C.yellow]} />
            </SecCard>

            {/* Risk Assessment */}
            <SecCard className="rb-fade rb-d4 rb-sec-card">
              <h3 style={{ margin: "0 0 12px", fontFamily: FF_DISPLAY, fontWeight: 700, fontSize: 14, color: C.text }}>
                Risk Assessment
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {firm.risks.map((r, i) => {
                  const map = {
                    low:    { bg: "rgba(31,214,138,0.06)", bd: "rgba(31,214,138,0.18)", fg: C.green, ic: "✓" },
                    medium: { bg: "rgba(246,199,74,0.06)", bd: "rgba(246,199,74,0.18)", fg: C.yellow, ic: "⚠" },
                    high:   { bg: "rgba(240,78,106,0.06)", bd: "rgba(240,78,106,0.18)", fg: C.red, ic: "!" },
                  }[r.level];
                  return (
                    <div key={i} style={{
                      background: map.bg, border: `1px solid ${map.bd}`,
                      borderRadius: 10, padding: 10, display: "flex", gap: 10, alignItems: "flex-start",
                    }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: 7,
                        background: map.bg, color: map.fg,
                        display: "grid", placeItems: "center",
                        fontFamily: FF_DISPLAY, fontWeight: 800, fontSize: 13, flexShrink: 0,
                        border: `1px solid ${map.bd}`,
                      }}>{map.ic}</div>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: map.fg }}>{r.title}</div>
                        <div style={{ fontSize: 11, color: C.muted, lineHeight: 1.5, marginTop: 3 }}>{r.body}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </SecCard>

            {/* Industry Ranking */}
            <SecCard className="rb-fade rb-d4 rb-sec-card">
              <header style={{ marginBottom: 10 }}>
                <h3 style={{ margin: 0, fontFamily: FF_DISPLAY, fontWeight: 700, fontSize: 14, color: C.text }}>
                  Industry Ranking
                </h3>
                <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>By TBI Score</div>
              </header>
              {ranked.map((f, i) => {
                const isMe = f.id === firm.id;
                const rankColors = [
                  { bg: "rgba(246,199,74,0.16)", fg: C.yellow },
                  { bg: "rgba(180,180,200,0.14)", fg: "#C9CDE0" },
                  { bg: "rgba(255,144,96,0.16)", fg: "#FF9060" },
                  { bg: "rgba(100,115,210,0.10)", fg: C.muted },
                  { bg: "rgba(100,115,210,0.10)", fg: C.muted },
                  { bg: "rgba(100,115,210,0.10)", fg: C.muted },
                ][i];
                return (
                  <div key={f.id} style={{
                    border: isMe ? `1px solid rgba(124,111,247,.3)` : "none",
                    background: isMe ? "rgba(124,111,247,.05)" : "transparent",
                    borderRadius: 6, padding: isMe ? "2px 8px" : "0",
                    margin: isMe ? "4px -8px" : "0",
                  }}>
                    <div style={{
                      display: "flex", alignItems: "center", gap: 10,
                      padding: "8px 0",
                      borderBottom: i === ranked.length - 1 ? "none" : `1px solid ${C.border}`,
                    }}>
                      <span style={{
                        width: 20, height: 20, borderRadius: 4,
                        background: rankColors.bg, color: rankColors.fg,
                        display: "grid", placeItems: "center",
                        fontFamily: FF_DISPLAY, fontWeight: 700, fontSize: 10,
                      }}>{i + 1}</span>
                      <span style={{
                        width: 22, height: 22, borderRadius: 6,
                        background: f.colorBg, color: f.color,
                        display: "grid", placeItems: "center",
                        fontFamily: FF_DISPLAY, fontWeight: 700, fontSize: 9,
                      }}>{f.abbr}</span>
                      <span style={{
                        flex: 1, fontSize: 12,
                        color: isMe ? C.text : C.muted,
                        fontWeight: isMe ? 600 : 400,
                      }}>
                        {f.name}{isMe && <span style={{ color: C.purple2, marginLeft: 6, fontSize: 10 }}>◀ you</span>}
                      </span>
                      <span style={{ fontFamily: FF_MONO, color: C.purple2, fontSize: 12 }}>{f.tbi.toFixed(1)}</span>
                    </div>
                  </div>
                );
              })}
            </SecCard>

            {/* Live Activity */}
            <SecCard className="rb-fade rb-d5 rb-sec-card">
              <header style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <span style={{
                  width: 8, height: 8, borderRadius: 999, background: C.green,
                  animation: "rb-pulse 1.6s ease-in-out infinite",
                }} />
                <h3 style={{ margin: 0, fontFamily: FF_DISPLAY, fontWeight: 700, fontSize: 14, color: C.text }}>
                  Live Activity
                </h3>
              </header>
              {[
                { c: C.green, body: <><b style={{ color: C.text }}>$2,450</b> paid in 2h 14m</>, t: "8m ago" },
                { c: C.purple, body: "New payout submitted and verified on-chain", t: "12m ago" },
                { c: C.green, body: <><b style={{ color: C.text }}>$1,800</b> confirmed — TXN verified</>, t: "19m ago" },
                { c: C.yellow, body: "1 payout flagged as pending — processing", t: "31m ago" },
                { c: C.green, body: <><b style={{ color: C.text }}>$4,200</b> — whale payout confirmed</>, t: "44m ago" },
              ].map((a, i) => (
                <div key={i} style={{
                  display: "flex", gap: 10, alignItems: "flex-start",
                  padding: "8px 0",
                  borderBottom: i === 4 ? "none" : `1px solid ${C.border}`,
                }}>
                  <span style={{
                    width: 8, height: 8, borderRadius: 999, background: a.c,
                    marginTop: 5, flexShrink: 0,
                  }} />
                  <div style={{ flex: 1, fontSize: 12, color: C.muted, lineHeight: 1.5 }}>{a.body}</div>
                  <div style={{ fontFamily: FF_MONO, fontSize: 11, color: C.dim, whiteSpace: "nowrap" }}>{a.t}</div>
                </div>
              ))}
            </SecCard>
          </div>
        </section>

        {/* === DIVIDER ============================================== */}
        <div style={{ height: 1, background: C.border, margin: "0 48px 32px" }} />

        {/* === CTA STRIP ============================================ */}
        <section style={{ margin: "0 48px 48px", position: "relative" }} className="rb-fade rb-d5">
          <div style={{
            background: C.card2, border: `1px solid ${C.border}`,
            borderRadius: 14, padding: "28px 32px",
            display: "flex", justifyContent: "space-between", alignItems: "center",
            position: "relative", overflow: "hidden",
          }}>
            <div style={{
              position: "absolute", top: -50, right: -40, width: 220, height: 220,
              borderRadius: "50%", background: firm.color, filter: "blur(70px)", opacity: 0.15,
              pointerEvents: "none",
            }} />
            <div style={{ position: "relative" }}>
              <div style={{ fontFamily: FF_DISPLAY, fontWeight: 700, fontSize: 18, color: C.text }}>
                Ready to trade with {firm.name}?
              </div>
              <div style={{ fontSize: 13, color: C.muted, marginTop: 6 }}>
                See our full review, challenge details, and community ratings — all in one place.
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, position: "relative" }}>
              <Link to="/firm/$firmId" params={{ firmId: firm.id }} className="rb-btn-primary"
                style={{
                  background: C.purple, color: "#fff", border: "none",
                  padding: "10px 20px", borderRadius: 8,
                  fontFamily: FF_BODY, fontSize: 12, fontWeight: 500,
                  textDecoration: "none", cursor: "pointer", transition: "all .18s",
                }}>View Full Review</Link>
              <Link to="/compare" className="rb-btn-outline" style={{
                background: "transparent", color: C.purple2,
                border: `1px solid ${C.purple}`, padding: "10px 20px", borderRadius: 8,
                fontFamily: FF_BODY, fontSize: 12, fontWeight: 500,
                textDecoration: "none", cursor: "pointer", transition: "all .18s",
              }}>Compare Firms</Link>
            </div>
          </div>
        </section>
      <SiteFooter />
      </div>
    </>
  );
}
