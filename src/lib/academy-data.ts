// Academy curriculum + progress engine.
// Structure: Faculty → Program → Course → Module → Lesson (+ module quiz, course final exam, certificate).
// Pricing: free | paid (cash + RR-unlock). Free courses earn RR on completion.
// Paid courses earn a smaller RR completion bonus.

import { useEffect, useState } from "react";
import { awardRr } from "@/lib/rr-rewards";
import { API_BASE_URL } from "@/lib/api";

export type Level = "Beginner" | "Intermediate" | "Pro";
export type AccessTier = "free" | "paid";

export type QuizQuestion = {
  id: string;
  q: string;
  options: string[];
  correctIndex: number;
  explain?: string;
};

export type Lesson = {
  id: string;
  title: string;
  durationMin: number;
  summary: string;
  body: string; // markdown-lite (rendered as paragraphs)
  videoUrl?: string;
};

export type Module = {
  id: string;
  title: string;
  summary: string;
  lessons: Lesson[];
  quiz: QuizQuestion[]; // module quiz
};

export type Course = {
  id: string;
  title: string;
  tagline: string;
  cover: string; // emoji thumbnail
  level: Level;
  access: AccessTier;
  priceUsd: number; // 0 if free
  priceRr: number;  // RR cost to unlock if paid (0 if free)
  rrReward: number; // RR earned on full completion + cert
  estHours: number;
  rating: number;
  enrolled: number;
  authors: string[];
  outcomes: string[];
  modules: Module[];
  finalExam: QuizQuestion[];
};

export type Program = {
  id: string;
  title: string;
  level: Level;
  summary: string;
  courses: Course[];
};

export type Faculty = {
  id: string;
  slug: string;
  title: string;
  emoji: string;
  tagline: string;
  color: string; // tailwind gradient stops
  programs: Program[];
};

/* ─────────────────── helpers ─────────────────── */

const q = (id: string, prompt: string, options: string[], correctIndex: number, explain?: string): QuizQuestion =>
  ({ id, q: prompt, options, correctIndex, explain });

const lesson = (id: string, title: string, durationMin: number, summary: string, body: string): Lesson =>
  ({ id, title, durationMin, summary, body });

/* ─────────────────── content ─────────────────── */

// Helper to keep file readable: standard short module quiz (3 Qs) + final exam (5 Qs).

function makeCourse(partial: Omit<Course, "rating" | "enrolled" | "authors"> & Partial<Pick<Course, "rating" | "enrolled" | "authors">>): Course {
  return {
    rating: 4.7,
    enrolled: 1200 + Math.floor(Math.random() * 5000),
    authors: ["RebateBoard Academy"],
    ...partial,
  };
}

const PROPFIRM_FOUNDATIONS: Course = makeCourse({
  id: "pf-foundations",
  title: "Prop Firm Foundations",
  tagline: "Understand the prop firm business model — and how to actually pass.",
  cover: "🏛️",
  level: "Beginner",
  access: "free",
  priceUsd: 0,
  priceRr: 0,
  rrReward: 120,
  estHours: 3,
  outcomes: [
    "Compare evaluation vs instant-funding models",
    "Read the real fine print: drawdown, consistency, scaling",
    "Plan a realistic challenge attempt with risk budget",
  ],
  modules: [
    {
      id: "pf-m1",
      title: "The Prop Firm Business Model",
      summary: "Where the money actually comes from and what they want from you.",
      lessons: [
        lesson("pf-m1-l1", "Why prop firms exist", 8,
          "Funded trader programs, the evaluation funnel, and the unit economics behind challenge fees.",
          "Prop firms make most revenue from challenge fees and a smaller share from real funded payouts. Understanding this incentive structure tells you exactly which rules they will enforce strictly (drawdown, consistency) and which exist mostly as marketing."),
        lesson("pf-m1-l2", "Evaluation vs instant funding", 10,
          "Two very different products with different break-even math.",
          "Evaluation = pay a fee, prove yourself, then get a profit split. Instant funding = pay more, trade smaller, no proof phase. We'll calculate the break-even payout each one needs."),
        lesson("pf-m1-l3", "Reading the rule book", 12,
          "Daily drawdown, max drawdown, consistency, news, weekend holding.",
          "Every clause in a prop firm rulebook maps to a specific risk the firm is hedging. We'll decode each one and show which combinations are essentially uncuttable."),
      ],
      quiz: [
        q("pf-m1-q1", "What is the primary revenue source for most prop firms?",
          ["Funded trader payouts", "Challenge / evaluation fees", "Brokerage spreads", "Subscription tiers"], 1,
          "Most firms are profitable from fees, then pay out from a smaller pool of consistent traders."),
        q("pf-m1-q2", "Which rule is hardest to recover from once breached?",
          ["Consistency rule", "Daily drawdown", "Max drawdown", "News restriction"], 2,
          "Max drawdown breach typically ends the account permanently."),
        q("pf-m1-q3", "Instant funding is best when…",
          ["You want the cheapest entry", "You hate evaluations and trade small size", "You want maximum leverage", "You only scalp news"], 1,
          "Instant funding skips evaluation but charges a premium and usually limits size."),
      ],
    },
    {
      id: "pf-m2",
      title: "Risk Engineering for the Challenge",
      summary: "Position sizing rules that survive the rule book, not just the chart.",
      lessons: [
        lesson("pf-m2-l1", "Daily loss budget math", 9,
          "How to size positions so a normal losing day cannot kill the account.",
          "If daily DD is 5%, your worst-case daily loss budget is ~3.5%. Build position sizes around max consecutive losses, not single trades."),
        lesson("pf-m2-l2", "Consistency rule survival", 11,
          "Why one big winning day can fail your account.",
          "Many firms cap your best day at 25–40% of total profit. We'll show you how to stagger size up across the challenge."),
        lesson("pf-m2-l3", "Building the 10-day plan", 10,
          "A boring, repeatable framework that beats hero swings.",
          "Aim for 0.5–1R/day, 5 trading days, 2–4 setups, and a journaling cadence. The plan is the edge."),
      ],
      quiz: [
        q("pf-m2-q1", "If daily DD = 5%, a safe per-trade risk is roughly…",
          ["0.25%–1%", "2%–3%", "5%", "Whatever the setup says"], 0,
          "Sub-1% per trade keeps you alive across consecutive losers."),
        q("pf-m2-q2", "The consistency rule punishes…",
          ["Too many losing trades", "One unusually large winning day", "Holding overnight", "Trading too little"], 1),
        q("pf-m2-q3", "The most important variable in passing is…",
          ["Strategy edge", "Position size discipline", "Market choice", "Account size"], 1),
      ],
    },
  ],
  finalExam: [
    q("pf-fx1", "A 100k account with 5% max DD allows a max account low of…", ["$95,000", "$96,500", "$94,000", "$90,000"], 0),
    q("pf-fx2", "A typical profit split on a funded account is around…", ["10–25%", "30–50%", "70–90%", "100%"], 2),
    q("pf-fx3", "Best response to a losing day near daily DD is…", ["Double size to recover", "Stop trading and review", "Switch to a new strategy", "Move to a higher timeframe"], 1),
    q("pf-fx4", "Consistency rule is best satisfied by…", ["One huge winner", "Steady daily 0.5–1R results", "Avoiding losing trades", "Trading only Fridays"], 1),
    q("pf-fx5", "Instant funding usually trades off…", ["Higher fees for no evaluation", "Lower fees for stricter rules", "Bigger size for a profit split cap", "Free withdrawals"], 0),
  ],
});

const FOREX_BEGINNER: Course = makeCourse({
  id: "fx-beg",
  title: "Forex 101 — From Zero to First Live Trade",
  tagline: "Pairs, pips, lots, leverage, sessions — explained without jargon.",
  cover: "💱",
  level: "Beginner",
  access: "free",
  priceUsd: 0,
  priceRr: 0,
  rrReward: 100,
  estHours: 4,
  outcomes: ["Read any FX quote confidently", "Size positions in lots and pips", "Pick the right session for your style"],
  modules: [
    {
      id: "fx-m1",
      title: "How the FX Market Actually Works",
      summary: "Participants, liquidity, and the 24-hour clock.",
      lessons: [
        lesson("fx-m1-l1", "The four sessions", 8, "Sydney, Tokyo, London, New York and why London/NY overlap matters.", "The London/NY overlap (12:00–16:00 UTC) carries the most volume and the cleanest moves on majors."),
        lesson("fx-m1-l2", "Majors, minors, exotics", 7, "Liquidity tiers and spreads.", "Stick to majors when starting — tighter spreads, less slippage, more predictable behavior around news."),
      ],
      quiz: [
        q("fx-m1-q1", "Highest liquidity overlap is…", ["Sydney/Tokyo", "Tokyo/London", "London/NY", "NY/Sydney"], 2),
        q("fx-m1-q2", "EURUSD is a…", ["Major", "Minor", "Exotic", "Cross"], 0),
        q("fx-m1-q3", "Beginners should mostly trade…", ["Exotics for opportunity", "Majors for predictability", "Crypto-FX pairs", "Anything trending"], 1),
      ],
    },
    {
      id: "fx-m2",
      title: "Pips, Lots & Position Sizing",
      summary: "The math you cannot skip.",
      lessons: [
        lesson("fx-m2-l1", "Pip value across pairs", 10, "Why 1 pip on EURUSD is different from 1 pip on USDJPY.", "On a standard lot of EURUSD, 1 pip ≈ $10. On USDJPY, 1 pip ≈ $6.5–9 depending on the rate."),
        lesson("fx-m2-l2", "The 1% risk rule", 9, "How to convert risk to lot size in 3 steps.", "Risk $ ÷ (stop pips × pip value) = lot size. Memorize this."),
      ],
      quiz: [
        q("fx-m2-q1", "1 standard lot on EURUSD ≈ how much per pip?", ["$1", "$10", "$100", "$1000"], 1),
        q("fx-m2-q2", "Risking 1% on $10k with 50 pip stop on EURUSD ≈", ["0.02 lots", "0.20 lots", "2.0 lots", "10 lots"], 1),
        q("fx-m2-q3", "Pip value is constant across pairs.", ["True", "False", "Only on majors", "Only on minors"], 1),
      ],
    },
  ],
  finalExam: [
    q("fx-fx1", "Best window to trade EURUSD is…", ["Asian session", "London/NY overlap", "Sunday open", "Friday close"], 1),
    q("fx-fx2", "On 100k account, 0.5% risk with 25 pip stop on EURUSD ≈", ["0.2 lots", "2.0 lots", "20 lots", "0.02 lots"], 1),
    q("fx-fx3", "USDJPY pip is the…", ["4th decimal", "2nd decimal", "5th decimal", "1st decimal"], 1),
    q("fx-fx4", "Leverage by itself is risk.", ["True", "False — position size is risk", "Only above 1:100", "Only on exotics"], 1),
    q("fx-fx5", "Spread is widest during…", ["London/NY", "Asian quiet hours", "News releases", "Both B and C"], 3),
  ],
});

const FOREX_PRO: Course = makeCourse({
  id: "fx-pro",
  title: "Forex Pro — Advanced Execution & Edge",
  tagline: "Order flow, liquidity sweeps, session models and high-RR setups.",
  cover: "🧠",
  level: "Pro",
  access: "paid",
  priceUsd: 49,
  priceRr: 4900, // unlock cost in RR
  rrReward: 250,
  estHours: 8,
  outcomes: ["Identify liquidity sweeps and stop runs", "Plan session-based execution models", "Track and grade your edge with statistics"],
  modules: [
    {
      id: "fxp-m1",
      title: "Liquidity & Order Flow",
      summary: "Where stops live and why price reaches for them.",
      lessons: [
        lesson("fxp-m1-l1", "Stop hunts vs reversals", 12, "Tell-tale signs of a liquidity sweep.", "A sweep takes out an obvious high/low and immediately reverses on volume — vs a real breakout, which holds."),
        lesson("fxp-m1-l2", "Session model: Asia → London", 11, "Asia ranges, London sweeps, NY continuation.", "The Asia range is your liquidity map for London. London often sweeps one side, then the daily move starts."),
      ],
      quiz: [
        q("fxp-m1-q1", "A liquidity sweep is identified by…", ["Slow grind through a level", "Sharp wick beyond level + reversal", "Gap open", "Round-number break"], 1),
        q("fxp-m1-q2", "London frequently sweeps the…", ["Daily open", "Asia range high or low", "Weekly close", "NY high"], 1),
        q("fxp-m1-q3", "NY usually delivers…", ["Reversal of London", "Continuation of London", "Random direction", "Range only"], 1),
      ],
    },
  ],
  finalExam: [
    q("fxp-fx1", "Best context for fading a sweep is…", ["No HTF bias", "HTF bias aligned with reversal", "Pure mean reversion", "News imminent"], 1),
    q("fxp-fx2", "Edge is best measured by…", ["Win rate alone", "RR alone", "Expectancy = winRate*avgWin − lossRate*avgLoss", "Number of trades"], 2),
    q("fxp-fx3", "A high-RR setup typically requires…", ["Large stop", "Tight stop near invalidation level", "No stop", "Mental stop"], 1),
    q("fxp-fx4", "Asia range is most useful as…", ["A trade signal", "A liquidity map", "A trend filter", "An exit"], 1),
    q("fxp-fx5", "Position sizing for high-RR setups should be…", ["Larger because RR is higher", "Same as any other trade", "Smaller because invalidation is closer", "Skip stop entirely"], 1),
  ],
});

const RISK_PSYCH: Course = makeCourse({
  id: "risk-psych",
  title: "Risk & Psychology Mastery",
  tagline: "The mental and mathematical guardrails of long-term traders.",
  cover: "🧘",
  level: "Intermediate",
  access: "paid",
  priceUsd: 29,
  priceRr: 2900,
  rrReward: 180,
  estHours: 5,
  outcomes: ["Build a personal risk policy", "Recognize tilt and revenge-trade triggers", "Use journaling to compound edge"],
  modules: [
    {
      id: "rp-m1",
      title: "Your Personal Risk Policy",
      summary: "A one-page document that decides for you when emotions run hot.",
      lessons: [
        lesson("rp-m1-l1", "Per-trade, per-day, per-week limits", 9, "Three numbers that prevent blow-ups.", "0.5–1% per trade, 2–3% per day, 5–7% per week. Hit a limit → done for the period. No exceptions."),
        lesson("rp-m1-l2", "The pre-trade checklist", 8, "If you can't tick all boxes, you don't take it.", "Bias, setup, invalidation, target, size, news, time. Five seconds, every trade."),
      ],
      quiz: [
        q("rp-m1-q1", "Hitting your daily loss limit means…", ["Trade smaller", "Stop for the day", "Switch markets", "Switch timeframe"], 1),
        q("rp-m1-q2", "A risk policy should be…", ["Flexible per setup", "Written and pre-decided", "Revised after losses", "Revised after wins"], 1),
        q("rp-m1-q3", "Pre-trade checklist purpose is…", ["Find more trades", "Filter out impulsive trades", "Speed up entries", "Reduce review time"], 1),
      ],
    },
  ],
  finalExam: [
    q("rp-fx1", "Tilt usually starts after…", ["A single loss", "A streak of losses or one outsized loss", "Boredom", "All of the above"], 3),
    q("rp-fx2", "Best response to tilt is…", ["Increase size to recover", "Stop, walk, journal", "Switch instrument", "Watch news"], 1),
    q("rp-fx3", "Journaling compounds edge by…", ["Catching repeated mistakes", "Confirming biases", "Generating new strategies", "Replacing analysis"], 0),
    q("rp-fx4", "A weekly loss limit protects against…", ["Bad weeks turning into bad months", "Slow markets", "News risk", "Volatility"], 0),
    q("rp-fx5", "Healthy risk per trade range is…", ["3–5%", "0.25–1%", "1.5–2.5%", "Whatever feels right"], 1),
  ],
});

const CRYPTO_BEG: Course = makeCourse({
  id: "cr-beg",
  title: "Crypto Trading 101",
  tagline: "Wallets, exchanges, perps, funding — without the hype.",
  cover: "₿",
  level: "Beginner",
  access: "free",
  priceUsd: 0,
  priceRr: 0,
  rrReward: 90,
  estHours: 3,
  outcomes: ["Differentiate spot vs perpetual futures", "Understand funding rate mechanics", "Avoid common DeFi/CEX pitfalls"],
  modules: [
    {
      id: "cr-m1",
      title: "Spot, Margin & Perpetuals",
      summary: "Three very different products on the same chart.",
      lessons: [
        lesson("cr-m1-l1", "Spot vs perp", 8, "Why a perp can liquidate but spot cannot.", "Spot = own the asset. Perp = leveraged contract that tracks spot via funding. Liquidation only applies with leverage."),
        lesson("cr-m1-l2", "Funding rates explained", 9, "How funding rebalances perp vs spot.", "Positive funding = longs pay shorts. Persistently high funding = crowded long, often a contrarian signal."),
      ],
      quiz: [
        q("cr-m1-q1", "Funding rate mostly affects…", ["Spot holders", "Perpetual futures positions", "Options", "Staking yield"], 1),
        q("cr-m1-q2", "Liquidation can happen on…", ["Spot only", "Perp / margin only", "Both", "Neither"], 1),
        q("cr-m1-q3", "Persistently positive funding suggests…", ["Bearish positioning", "Bullish positioning", "Neutral", "Manipulation"], 1),
      ],
    },
  ],
  finalExam: [
    q("cr-fx1", "Self-custody means…", ["Your funds on an exchange", "You hold the private keys", "Insurance covers losses", "Custodian holds keys"], 1),
    q("cr-fx2", "Funding paid every…", ["Block", "8 hours typically", "24 hours", "1 week"], 1),
    q("cr-fx3", "Cross vs isolated margin…", ["Same thing", "Cross uses entire balance, isolated only allocated", "Isolated uses whole balance", "Cross is safer"], 1),
    q("cr-fx4", "Crypto trades…", ["24/5", "24/7", "9-to-5", "Weekdays only"], 1),
    q("cr-fx5", "First defense against rug pulls is…", ["Buying low caps", "Verifying contract + liquidity locks", "Following influencers", "Using leverage"], 1),
  ],
});

/* ─────────────────── faculties (seed) ─────────────────── */

export const FACULTIES_SEED: Faculty[] = [
  {
    id: "fac-propfirm",
    slug: "propfirm",
    title: "Faculty of Prop Firms",
    emoji: "🏛️",
    tagline: "Pass challenges, scale capital, and survive the rules.",
    color: "from-fuchsia-500 to-violet-600",
    programs: [
      {
        id: "pg-pf-found",
        title: "Funded Trader Foundations",
        level: "Beginner",
        summary: "Everything you need to attempt your first challenge with a real plan.",
        courses: [PROPFIRM_FOUNDATIONS],
      },
    ],
  },
  {
    id: "fac-forex",
    slug: "forex",
    title: "Faculty of Forex",
    emoji: "💱",
    tagline: "From your first pip to professional execution models.",
    color: "from-emerald-500 to-cyan-600",
    programs: [
      {
        id: "pg-fx-beg",
        title: "Forex Beginner Track",
        level: "Beginner",
        summary: "The fundamentals every retail trader needs before going live.",
        courses: [FOREX_BEGINNER],
      },
      {
        id: "pg-fx-pro",
        title: "Forex Pro Track",
        level: "Pro",
        summary: "Advanced execution, liquidity, and edge measurement.",
        courses: [FOREX_PRO],
      },
    ],
  },
  {
    id: "fac-crypto",
    slug: "crypto",
    title: "Faculty of Crypto",
    emoji: "₿",
    tagline: "Spot, perps, DeFi — and the risks they hide.",
    color: "from-amber-500 to-orange-600",
    programs: [
      {
        id: "pg-cr-beg",
        title: "Crypto Beginner Track",
        level: "Beginner",
        summary: "How crypto markets actually work, end-to-end.",
        courses: [CRYPTO_BEG],
      },
    ],
  },
  {
    id: "fac-risk",
    slug: "risk-psychology",
    title: "Faculty of Risk & Psychology",
    emoji: "🧘",
    tagline: "The discipline layer that turns edge into profit.",
    color: "from-rose-500 to-pink-600",
    programs: [
      {
        id: "pg-rp",
        title: "Trader Discipline Program",
        level: "Intermediate",
        summary: "Risk policy, journaling, and behavioural mastery.",
        courses: [RISK_PSYCH],
      },
    ],
  },
];

/* ─────────────────── API → frontend type mappers ─────────────────────────
 * The backend returns numeric ids and uses `question` instead of `q`.
 * These mappers normalise the shape and attach _dbId so mutations know
 * which DB row to target.
 */

function mapQuiz(q: any): QuizQuestion {
  return { id: String(q.id), q: q.question ?? q.q ?? "", options: q.options ?? [], correctIndex: q.correctIndex ?? 0, explain: q.explain, _dbId: q.id } as any;
}
function mapLesson(l: any): Lesson {
  return { id: String(l.id), title: l.title ?? "", durationMin: l.durationMin ?? 8, summary: l.summary ?? "", body: l.body ?? "", videoUrl: l.videoUrl ?? undefined, screenshot: l.screenshot ?? undefined, images: l.images ?? undefined, _dbId: l.id } as any;
}
function mapModule(m: any): Module {
  return { id: String(m.id), title: m.title ?? "", summary: m.summary ?? "", lessons: (m.lessons ?? []).map(mapLesson), quiz: (m.quiz ?? []).map(mapQuiz), _dbId: m.id } as any;
}
function mapCourse(c: any): Course {
  return { id: String(c.id), title: c.title ?? "", tagline: c.tagline ?? "", cover: c.cover ?? "📘", coverImage: c.coverImage ?? undefined, level: (c.level ?? "Beginner") as Level, access: (c.access ?? "free") as AccessTier, priceUsd: Number(c.priceUsd) || 0, priceRr: Number(c.priceRr) || 0, rrReward: Number(c.rrReward) || 50, estHours: Number(c.estHours) || 1, rating: Number(c.rating) || 4.7, enrolled: c.enrolled ?? 0, authors: c.authors ?? [], outcomes: c.outcomes ?? [], modules: (c.modules ?? []).map(mapModule), finalExam: (c.finalExam ?? []).map(mapQuiz), _dbId: c.id } as any;
}
function mapProgram(p: any): Program {
  return { id: String(p.id), title: p.title ?? "", level: (p.level ?? "Beginner") as Level, summary: p.summary ?? "", courses: (p.courses ?? []).map(mapCourse), _dbId: p.id } as any;
}
function mapFaculty(f: any): Faculty {
  return { id: String(f.id), slug: f.slug ?? "", title: f.title ?? "", emoji: f.emoji ?? "🎓", tagline: f.tagline ?? "", color: f.color ?? "from-fuchsia-500 to-violet-600", programs: (f.programs ?? []).map(mapProgram), _dbId: f.id } as any;
}

async function fetchCurriculumFromApi(): Promise<Faculty[] | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/academy/curriculum`);
    const json = await res.json();
    if (json.success && Array.isArray(json.payload)) {
      return (json.payload as any[]).map(mapFaculty);
    }
    return null;
  } catch { return null; }
}

/* ─────────────────── live curriculum store ───────────────────
 * Source of truth is the backend API (/academy/curriculum).
 * localStorage is used only as an instant-render cache — never as
 * the fallback seed.  Dummy FACULTIES_SEED data is never shown.
 */

const CURRICULUM_KEY = "rb-academy-curriculum-v1";
const CURRICULUM_EVT = "rb-academy-curriculum-update";   // optimistic local patch
const CURRICULUM_REFRESH_EVT = "rb-academy-curriculum-refresh"; // triggers API re-fetch

let curriculumCache: Faculty[] = [];

export function getFaculties(): Faculty[] { return curriculumCache; }

export function saveCurriculum(next: Faculty[]) {
  curriculumCache = next;
  if (typeof window !== "undefined") {
    try { localStorage.setItem(CURRICULUM_KEY, JSON.stringify(next)); } catch {}
    window.dispatchEvent(new Event(CURRICULUM_EVT));
  }
}

// Trigger a full re-fetch from the API (call after any mutation completes)
export function refreshCurriculum() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(CURRICULUM_REFRESH_EVT));
  }
}

export function resetCurriculum() {
  // Clear local cache and pull fresh from API
  curriculumCache = [];
  if (typeof window !== "undefined") {
    try { localStorage.removeItem(CURRICULUM_KEY); } catch {}
  }
  refreshCurriculum();
}

export function useFaculties(): Faculty[] {
  const [data, setData] = useState<Faculty[]>([]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const fromApi = await fetchCurriculumFromApi();
      if (cancelled) return;
      if (fromApi !== null) {
        curriculumCache = fromApi;
        setData(fromApi);
        try { localStorage.setItem(CURRICULUM_KEY, JSON.stringify(fromApi)); } catch {}
      }
    };

    // Warm render from cache while API loads
    try {
      const raw = localStorage.getItem(CURRICULUM_KEY);
      if (raw) {
        const cached = JSON.parse(raw) as Faculty[];
        // Only use cache if it looks like API data (items have numeric _dbId), not seed
        if (Array.isArray(cached) && cached.length > 0 && (cached[0] as any)._dbId) {
          curriculumCache = cached;
          setData(cached);
        }
      }
    } catch {}

    load();

    const onLocalPatch = () => { setData([...curriculumCache]); };
    const onRefresh = () => { load(); };

    window.addEventListener(CURRICULUM_EVT, onLocalPatch);
    window.addEventListener(CURRICULUM_REFRESH_EVT, onRefresh);
    return () => {
      cancelled = true;
      window.removeEventListener(CURRICULUM_EVT, onLocalPatch);
      window.removeEventListener(CURRICULUM_REFRESH_EVT, onRefresh);
    };
  }, []);

  return data;
}

/** @deprecated kept for backward-compat; prefer useFaculties()/getFaculties(). */
export const FACULTIES = new Proxy([] as Faculty[], {
  get(_t, prop) {
    const live = getFaculties();
    // @ts-expect-error proxy passthrough
    return live[prop];
  },
  has(_t, prop) { return prop in getFaculties(); },
  ownKeys() { return Reflect.ownKeys(getFaculties()); },
  getOwnPropertyDescriptor(_t, prop) { return Object.getOwnPropertyDescriptor(getFaculties(), prop); },
});

/* ─────────────────── lookup ─────────────────── */

export function getFaculty(slug: string): Faculty | undefined {
  return getFaculties().find((f) => f.slug === slug);
}

export function getCourse(courseId: string): { course: Course; faculty: Faculty; program: Program } | undefined {
  for (const f of getFaculties()) {
    for (const p of f.programs) {
      const c = p.courses.find((x) => x.id === courseId);
      if (c) return { course: c, faculty: f, program: p };
    }
  }
  return undefined;
}

export function allCourses(): Course[] {
  return getFaculties().flatMap((f) => f.programs.flatMap((p) => p.courses));
}

/* ─────────────────── progress store (localStorage) ─────────────────── */

export type CourseProgress = {
  enrolledAt: number;
  unlocked: boolean;        // paid course → unlocked once paid
  completedLessons: string[];
  passedQuizzes: string[];  // module quiz ids that were passed
  finalExamPassed: boolean;
  certIssuedAt?: number;
  rrEarned: number;
};

const KEY_PROGRESS = "rb-academy-progress-v1";
const KEY_RR = "rb-rr-balance-v1";
const KEY_HOLDER = "rb-academy-holder-v1";

type Store = {
  rrBalance: number;
  progress: Record<string, CourseProgress>;
  holderName: string;
};

const DEFAULT_RR = 5000;

function read(): Store {
  if (typeof window === "undefined") return { rrBalance: DEFAULT_RR, progress: {}, holderName: "" };
  try {
    const raw = localStorage.getItem(KEY_PROGRESS);
    const rr = localStorage.getItem(KEY_RR);
    const holder = localStorage.getItem(KEY_HOLDER) ?? "";
    return {
      rrBalance: rr ? Number(rr) : DEFAULT_RR,
      progress: raw ? JSON.parse(raw) : {},
      holderName: holder,
    };
  } catch {
    return { rrBalance: DEFAULT_RR, progress: {}, holderName: "" };
  }
}

function write(store: Store) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY_PROGRESS, JSON.stringify(store.progress));
  localStorage.setItem(KEY_RR, String(store.rrBalance));
  localStorage.setItem(KEY_HOLDER, store.holderName ?? "");
  window.dispatchEvent(new Event("rb-academy-update"));
}

export function useAcademyStore() {
  const [store, setStore] = useState<Store>(() => ({ rrBalance: DEFAULT_RR, progress: {}, holderName: "" }));

  useEffect(() => {
    setStore(read());
    const onUpdate = () => setStore(read());
    window.addEventListener("rb-academy-update", onUpdate);
    window.addEventListener("storage", onUpdate);
    return () => {
      window.removeEventListener("rb-academy-update", onUpdate);
      window.removeEventListener("storage", onUpdate);
    };
  }, []);

  const setHolderName = (name: string) => {
    const s = read();
    s.holderName = name;
    write(s);
  };

  const ensureEnrolled = (courseId: string) => {
    const s = read();
    if (s.progress[courseId]) return;
    s.progress[courseId] = {
      enrolledAt: Date.now(),
      unlocked: false,
      completedLessons: [],
      passedQuizzes: [],
      finalExamPassed: false,
      rrEarned: 0,
    };
    write(s);
  };

  const enroll = (courseId: string) => {
    const s = read();
    const c = getCourse(courseId);
    if (!c) return { ok: false, error: "Course not found" };
    if (!s.progress[courseId]) {
      s.progress[courseId] = {
        enrolledAt: Date.now(), unlocked: c.course.access === "free",
        completedLessons: [], passedQuizzes: [], finalExamPassed: false, rrEarned: 0,
      };
    }
    write(s);
    return { ok: true };
  };

  const unlockWithRr = (courseId: string) => {
    const s = read();
    const found = getCourse(courseId);
    if (!found) return { ok: false, error: "Course not found" };
    if (s.rrBalance < found.course.priceRr) return { ok: false, error: "Insufficient RR balance" };
    s.rrBalance -= found.course.priceRr;
    s.progress[courseId] = {
      ...(s.progress[courseId] ?? { enrolledAt: Date.now(), completedLessons: [], passedQuizzes: [], finalExamPassed: false, rrEarned: 0, unlocked: false }),
      unlocked: true,
    };
    write(s);
    return { ok: true };
  };

  const unlockWithCash = (courseId: string) => {
    // Mocked cash unlock — same effect as RR unlock minus deduction.
    const s = read();
    s.progress[courseId] = {
      ...(s.progress[courseId] ?? { enrolledAt: Date.now(), completedLessons: [], passedQuizzes: [], finalExamPassed: false, rrEarned: 0, unlocked: false }),
      unlocked: true,
    };
    write(s);
    return { ok: true };
  };

  const completeLesson = (courseId: string, lessonId: string) => {
    const s = read();
    if (!s.progress[courseId]) return;
    if (!s.progress[courseId].completedLessons.includes(lessonId)) {
      s.progress[courseId].completedLessons.push(lessonId);
    }
    write(s);
  };

  const passQuiz = (courseId: string, quizId: string) => {
    const s = read();
    if (!s.progress[courseId]) return;
    if (!s.progress[courseId].passedQuizzes.includes(quizId)) {
      s.progress[courseId].passedQuizzes.push(quizId);
    }
    write(s);
  };

  const completeFinalExam = (courseId: string) => {
    const s = read();
    const found = getCourse(courseId);
    if (!s.progress[courseId] || !found) return;
    if (!s.progress[courseId].finalExamPassed) {
      s.progress[courseId].finalExamPassed = true;
      s.progress[courseId].certIssuedAt = Date.now();
      // Admin-controlled RR reward (Superadmin → Rewards → Earn).
      // Premium = paid course unlock OR premium-tier user.
      const isPremium = found.course.access === "paid";
      const res = awardRr("academy_course_complete", {
        premium: isPremium,
        user: s.holderName || "@me",
      });
      if (res.awarded) {
        s.progress[courseId].rrEarned += res.amount;
        // awardRr already updated KEY_RR; re-read to stay consistent
        s.rrBalance = res.newBalance ?? s.rrBalance + res.amount;
      }
    }
    write(s);
  };

  const reset = (courseId: string) => {
    const s = read();
    delete s.progress[courseId];
    write(s);
  };

  return {
    rrBalance: store.rrBalance,
    progress: store.progress,
    holderName: store.holderName,
    setHolderName,
    ensureEnrolled, enroll, unlockWithRr, unlockWithCash,
    completeLesson, passQuiz, completeFinalExam, reset,
  };
}

/* ─────────────────── stats helpers ─────────────────── */

export function courseTotals(course: Course) {
  const lessons = course.modules.reduce((s, m) => s + m.lessons.length, 0);
  const quizzes = course.modules.length;
  return { lessons, quizzes, modules: course.modules.length };
}

export function progressPct(course: Course, p?: CourseProgress): number {
  if (!p) return 0;
  const totals = courseTotals(course);
  const denom = totals.lessons + totals.quizzes + 1; // +1 for final exam
  const num =
    p.completedLessons.length +
    p.passedQuizzes.length +
    (p.finalExamPassed ? 1 : 0);
  return Math.round((Math.min(num, denom) / denom) * 100);
}
