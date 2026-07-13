import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  Brain,
  CalendarDays,
  Clock3,
  Globe2,
  Moon,
  Radio,
  RefreshCw,
  ShieldAlert,
  Timer,
} from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/economic-calendar")({
  head: () => ({
    meta: [
      { title: "Economic Calendar | RebateBoard" },
      {
        name: "description",
        content:
          "Track economic events, trading sessions, session overlaps, and market-preparation guidance before high-impact releases.",
      },
    ],
  }),
  component: EconomicCalendarPage,
});

const TIMEZONE_STORAGE_KEY = "rb_economic_calendar_timezone";

const TIMEZONES = [
  "auto",
  "UTC",
  "America/New_York",
  "Europe/London",
  "Europe/Berlin",
  "Asia/Tokyo",
  "Australia/Sydney",
  "Africa/Lagos",
  "Asia/Dubai",
  "Asia/Singapore",
];

type SessionId = "sydney" | "tokyo" | "london" | "newyork";
type SessionStatus = "opening_soon" | "live" | "overlap" | "closed";

type MarketSession = {
  id: SessionId;
  name: string;
  zone: string;
  openHour: number;
  closeHour: number;
  markets: string[];
  note: string;
};

type SessionState = MarketSession & {
  status: SessionStatus;
  active: boolean;
  localOpen: string;
  localClose: string;
  timeRemaining: string;
  progressPercent: number;
  timelineStart: number;
  timelineEnd: number;
  openDate: Date;
  closeDate: Date;
};

const SESSIONS: MarketSession[] = [
  {
    id: "sydney",
    name: "Sydney",
    zone: "Australia/Sydney",
    openHour: 8,
    closeHour: 17,
    markets: ["AUD", "NZD", "Asia-Pacific indices"],
    note: "Often quieter, useful for AUD/NZD preparation.",
  },
  {
    id: "tokyo",
    name: "Tokyo / Asia",
    zone: "Asia/Tokyo",
    openHour: 9,
    closeHour: 18,
    markets: ["JPY", "AUD/JPY", "Asian indices"],
    note: "Important for JPY pairs and Asia risk tone.",
  },
  {
    id: "london",
    name: "London",
    zone: "Europe/London",
    openHour: 8,
    closeHour: 17,
    markets: ["EUR", "GBP", "Gold", "Major FX"],
    note: "Usually the deepest European liquidity window.",
  },
  {
    id: "newyork",
    name: "New York",
    zone: "America/New_York",
    openHour: 8,
    closeHour: 17,
    markets: ["USD", "CAD", "US indices", "Gold"],
    note: "Important for USD releases and US equity flows.",
  },
];

function EconomicCalendarPage() {
  return <EconomicCalendarExperience />;
}

export function EconomicCalendarExperience({ embedded = false }: { embedded?: boolean }) {
  const browserTz = typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "UTC";
  const [timezone, setTimezone] = useState("auto");
  const [now, setNow] = useState(() => new Date());
  const selectedTimezone = timezone === "auto" ? browserTz : timezone;

  useEffect(() => {
    const saved = window.localStorage.getItem(TIMEZONE_STORAGE_KEY);
    if (saved && TIMEZONES.includes(saved)) setTimezone(saved);
  }, []);

  useEffect(() => {
    window.localStorage.setItem(TIMEZONE_STORAGE_KEY, timezone);
  }, [timezone]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const sessionStates = useMemo(
    () => {
      const states = SESSIONS.map((session) => getSessionState(session, now, selectedTimezone));
      const activeCount = states.filter((session) => session.active).length;
      if (activeCount < 2) return states;
      return states.map((session) => session.active ? { ...session, status: "overlap" as const } : session);
    },
    [now, selectedTimezone],
  );
  const active = sessionStates.filter((session) => session.active);
  const overlap = resolveOverlap(active, selectedTimezone);

  return (
    <div className={embedded ? "text-white" : "min-h-screen bg-[var(--rb-bg-canvas)] text-white"}>
      {!embedded && <SiteHeader />}
      <main className={embedded ? "space-y-6" : "container-app space-y-6 py-8 sm:py-12"}>
        <section className="rounded-[2rem] border border-white/10 bg-white/[0.045] p-6 shadow-[0_30px_100px_rgba(0,0,0,0.35)] md:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/15 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-violet-100 ring-1 ring-primary/20">
                <CalendarDays className="h-3.5 w-3.5" />
                Market Preparation
              </div>
              <h1 className="mt-5 text-4xl font-black leading-tight md:text-6xl">Economic Calendar</h1>
              <p className="mt-4 text-base leading-8 text-white/68">
                Track important market events, active trading sessions, and high-impact releases before they affect forex, crypto, commodities, and global indices.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <a href="#calendar" className="rounded-full rb-gradient-primary px-5 py-3 text-center text-sm font-black text-white">
                View Today’s Events
              </a>
              <a href="#sessions" className="rounded-full border border-white/12 px-5 py-3 text-center text-sm font-bold text-white/80">
                Review Sessions
              </a>
            </div>
          </div>
        </section>

        <section id="sessions" className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.045] p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-2xl font-black">Live Trading Sessions</h2>
                <p className="mt-1 text-sm text-white/58">Session cards, countdowns, and the timeline use one selected timezone.</p>
              </div>
              <label className="flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 py-2 text-sm text-white/75">
                <Globe2 className="h-4 w-4 text-violet-200" />
                <span className="sr-only">Select timezone</span>
                <select
                  value={timezone}
                  onChange={(event) => setTimezone(event.target.value)}
                  className="bg-transparent text-sm text-white outline-none [color-scheme:dark]"
                >
                  {TIMEZONES.map((zone) => (
                    <option key={zone} value={zone}>{zone === "auto" ? `Auto (${browserTz})` : zone}</option>
                  ))}
                </select>
              </label>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {sessionStates.map((session) => (
                <SessionCard key={session.id} session={session} />
              ))}
            </div>
            {overlap && (
              <div className="mt-4 rounded-3xl border border-cyan-300/25 bg-cyan-400/10 p-4 shadow-[0_0_40px_rgba(59,130,246,0.08)]">
                <div className="flex flex-wrap items-center gap-2 text-sm font-black text-cyan-100">
                  <Activity className="h-4 w-4" />
                  {overlap.title}
                  <span className="rounded-full border border-cyan-200/20 bg-cyan-300/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] text-cyan-100">
                    {overlap.window}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-6 text-white/62">{overlap.body}</p>
              </div>
            )}
          </div>

          <SessionTimeline sessions={sessionStates} timezone={selectedTimezone} now={now} />
        </section>

        <section id="calendar" className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          <TradingViewCalendar />
          <aside className="space-y-4">
            <RebetaPreparationCard />
            <article className="rounded-[2rem] border border-white/10 bg-white/[0.045] p-5">
              <div className="flex items-center gap-2 text-sm font-black">
                <ShieldAlert className="h-4 w-4 text-cyan-200" />
                Journal Context
              </div>
              <p className="mt-3 text-sm leading-7 text-white/60">
                Future synchronization can connect trade timestamps, instruments, selected timezone, and verified event proximity. Until a structured event API is connected, Rebeta will not treat TradingView iframe data as internal live data.
              </p>
            </article>
          </aside>
        </section>

        <section className="rounded-[2rem] border border-white/10 bg-white/[0.045] p-6 md:p-8">
          <h2 className="text-3xl font-black">Trading Around Economic News</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[
              "High-impact means the event has historically created larger market reactions, not guaranteed direction.",
              "Spreads may widen and slippage may occur around fast releases.",
              "Prop-firm rules differ. Always confirm whether news trading is allowed.",
              "Review open exposure before major releases, especially correlated positions.",
              "Avoid impulsive entries immediately after a headline without a plan.",
              "Journal your news-adjacent trades so Rebeta can help identify patterns later.",
            ].map((item) => (
              <div key={item} className="rounded-3xl border border-white/10 bg-black/15 p-4 text-sm leading-6 text-white/64">
                {item}
              </div>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/dashboard/trading-plan" className="rounded-full border border-white/12 px-4 py-2 text-sm font-bold text-white/78">Trading Plan</Link>
            <Link to="/dashboard/trades" className="rounded-full border border-white/12 px-4 py-2 text-sm font-bold text-white/78">Trading Journal</Link>
            <Link to="/dashboard/ai-coach" className="rounded-full border border-white/12 px-4 py-2 text-sm font-bold text-white/78">Ask Rebeta</Link>
            <Link to="/academy" className="rounded-full border border-white/12 px-4 py-2 text-sm font-bold text-white/78">Academy</Link>
          </div>
        </section>
      </main>
      {!embedded && <SiteFooter />}
    </div>
  );
}

function SessionCard({ session }: { session: SessionState }) {
  const status = getStatusVisual(session.status);
  const isLive = session.status === "live" || session.status === "overlap";

  return (
    <article
      aria-live={isLive ? "polite" : undefined}
      className={cn(
        "relative overflow-hidden rounded-3xl border p-4 transition",
        status.card,
      )}
    >
      {isLive && <div className="absolute inset-x-5 top-0 h-px bg-emerald-300/80" />}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-black">{session.name}</h3>
          <p className="mt-1 text-xs text-white/55">{session.localOpen} - {session.localClose}</p>
        </div>
        <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em]", status.badge)}>
          {isLive && <span className="h-1.5 w-1.5 rounded-full bg-emerald-200 motion-safe:animate-pulse" aria-hidden="true" />}
          {status.icon}
          {status.label}
        </span>
      </div>
      <div className="mt-4 flex items-center gap-2 text-xs text-white/72">
        <Timer className={cn("h-4 w-4", status.iconTone)} />
        {isLive ? `Closes in ${session.timeRemaining}` : session.status === "opening_soon" ? `Opening soon: ${session.timeRemaining}` : `Opens in ${session.timeRemaining}`}
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/8" aria-label={isLive ? `${session.name} session progress` : undefined}>
        <div
          className={cn("h-full rounded-full transition-[width] duration-500", isLive ? "bg-emerald-300" : session.status === "opening_soon" ? "bg-blue-300/70" : "bg-white/18")}
          style={{ width: `${isLive ? session.progressPercent : 0}%` }}
        />
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {session.markets.map((market) => (
          <span key={market} className="rounded-full bg-white/8 px-2 py-1 text-[10px] font-bold text-white/68">{market}</span>
        ))}
      </div>
      <p className="mt-3 text-xs leading-5 text-white/50">{session.note}</p>
    </article>
  );
}

function TradingViewCalendar() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const loaderRef = useRef<HTMLDivElement | null>(null);
  const [shouldLoad, setShouldLoad] = useState(false);
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    const node = loaderRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      { rootMargin: "360px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !shouldLoad || failed) return;

    setLoaded(false);
    container.innerHTML = "";
    container.className = "tradingview-widget-container h-full w-full";

    const widget = document.createElement("div");
    widget.className = "tradingview-widget-container__widget h-full w-full";

    const copyright = document.createElement("div");
    copyright.className = "tradingview-widget-copyright px-4 pb-4 pt-2 text-xs text-white/45";
    copyright.innerHTML = '<a href="https://www.tradingview.com/economic-calendar/" rel="noopener nofollow" target="_blank"><span class="text-cyan-300">Economic Calendar</span></a><span class="trademark"> by TradingView</span>';

    const script = document.createElement("script");
    script.type = "text/javascript";
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-events.js";
    script.async = true;
    script.innerHTML = JSON.stringify({
      colorTheme: "dark",
      isTransparent: true,
      locale: "en",
      countryFilter: "ar,au,br,ca,cn,fr,de,in,id,it,jp,kr,mx,ru,sa,za,tr,gb,us,eu",
      importanceFilter: "-1,0,1",
      width: "100%",
      height: 750,
    });
    script.onload = () => window.setTimeout(() => setLoaded(true), 650);
    script.onerror = () => setFailed(true);

    container.appendChild(widget);
    container.appendChild(copyright);
    container.appendChild(script);

    return () => {
      container.innerHTML = "";
    };
  }, [failed, retryKey, shouldLoad]);

  return (
    <article ref={loaderRef} className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.045]">
      <div className="border-b border-white/10 p-4">
        <div>
          <h2 className="text-xl font-black">Economic Events</h2>
          <p className="mt-1 text-xs text-white/50">
            Use the controls inside the TradingView calendar to filter by date, country, currency, and impact.
          </p>
        </div>
      </div>
      <div className="relative min-h-[750px] bg-[var(--rb-bg-section)]">
        {(!shouldLoad || (!loaded && !failed)) && <TradingViewSkeleton />}
        {failed ? (
          <div className="grid min-h-[750px] place-items-center p-6 text-center">
            <div>
              <Clock3 className="mx-auto h-10 w-10 text-violet-200" />
              <h3 className="mt-4 text-xl font-black">The economic calendar is temporarily unavailable.</h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-7 text-white/58">Please retry or open TradingView directly while the widget reconnects.</p>
              <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
                <button
                  onClick={() => {
                    setFailed(false);
                    setLoaded(false);
                    setShouldLoad(true);
                    setRetryKey((key) => key + 1);
                  }}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-bold"
                >
                  <RefreshCw className="h-4 w-4" /> Retry
                </button>
                <a href="https://www.tradingview.com/economic-calendar/" target="_blank" rel="noreferrer" className="rounded-full border border-white/12 px-4 py-2 text-sm font-bold text-white/78">
                  Open TradingView Calendar
                </a>
              </div>
            </div>
          </div>
        ) : (
          <div
            ref={containerRef}
            className={cn("h-[750px] w-full transition-opacity duration-300", loaded ? "opacity-100" : "opacity-0")}
          />
        )}
      </div>
      {!failed && (
        <p className="border-t border-white/10 px-4 py-3 text-xs leading-5 text-white/42">
          Economic event data is provided by TradingView. RebateBoard does not modify or independently verify the displayed calendar data.
        </p>
      )}
    </article>
  );
}

function TradingViewSkeleton() {
  return (
    <div className="absolute inset-0 z-10 bg-[var(--rb-bg-section)] p-4" aria-label="Loading economic calendar">
      <div className="grid h-full gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="rounded-3xl border border-white/10 bg-black/15 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/8 pb-4">
            <div className="flex gap-2">
              <Skeleton className="h-9 w-24 rounded-full" />
              <Skeleton className="h-9 w-28 rounded-full" />
              <Skeleton className="h-9 w-20 rounded-full" />
            </div>
            <Skeleton className="h-9 w-36 rounded-full" />
          </div>
          <div className="mt-4 space-y-3">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="grid grid-cols-[72px_minmax(0,1fr)_80px] items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.03] p-3">
                <Skeleton className="h-5 w-14 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-4/5 rounded-full" />
                  <Skeleton className="h-3 w-2/5 rounded-full" />
                </div>
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
            ))}
          </div>
        </div>
        <div className="hidden rounded-3xl border border-white/10 bg-white/[0.035] p-4 lg:block">
          <Skeleton className="h-5 w-40 rounded-full" />
          <div className="mt-5 space-y-3">
            <Skeleton className="h-16 rounded-2xl" />
            <Skeleton className="h-16 rounded-2xl" />
            <Skeleton className="h-16 rounded-2xl" />
            <Skeleton className="h-32 rounded-2xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

function RebetaPreparationCard() {
  return (
    <article className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-primary/14 to-white/[0.035] p-5">
      <div className="flex items-center gap-2 text-sm font-black">
        <Brain className="h-4 w-4 text-violet-200" />
        Rebeta Market Preparation
      </div>
      <p className="mt-3 rounded-2xl border border-white/10 bg-black/15 p-3 text-xs leading-5 text-white/58">
        Current mode: educational guidance. Rebeta is not reading live TradingView iframe data until a structured economic-event API is connected.
      </p>
      <ul className="mt-4 space-y-3 text-sm leading-6 text-white/63">
        {[
          "Review open exposure before high-impact releases.",
          "Check spread and execution conditions.",
          "Confirm your prop firm’s news-trading rules.",
          "Avoid impulsive entries and confirm stop-loss placement.",
          "Journal trades taken near major releases.",
        ].map((item) => (
          <li key={item} className="flex gap-3">
            <span className="mt-2 h-1.5 w-1.5 rounded-full bg-violet-200" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}

function SessionTimeline({ sessions, timezone, now }: { sessions: SessionState[]; timezone: string; now: Date }) {
  const nowMinutes = getMinutesInZone(now, timezone);
  const nowLabel = formatInZone(now, timezone, { hour: "2-digit", minute: "2-digit", hour12: false });

  return (
    <article className="rounded-[2rem] border border-white/10 bg-white/[0.045] p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-black">24h Session Timeline</h2>
          <p className="mt-1 text-sm text-white/55">Current local time: {nowLabel}</p>
        </div>
        <Clock3 className="h-5 w-5 text-violet-200" />
      </div>
      <div className="relative mt-7">
        <div
          className="pointer-events-none absolute bottom-0 top-0 z-20 w-px bg-white shadow-[0_0_18px_rgba(255,255,255,0.45)]"
          style={{ left: `${(nowMinutes / 1440) * 100}%` }}
          aria-hidden="true"
        >
          <span className="absolute -top-6 -translate-x-1/2 whitespace-nowrap rounded-full bg-white px-2 py-0.5 text-[10px] font-black text-[#09090D]">
            Now {nowLabel}
          </span>
        </div>
        <div className="space-y-4">
          {sessions.map((session) => (
            <div key={session.id}>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="font-bold text-white/82">{session.name}</span>
                <span className="text-white/45">{session.localOpen} - {session.localClose}</span>
              </div>
              <div className="relative h-5 overflow-hidden rounded-full bg-white/8">
                {timelineSegments(session).map((segment, index) => (
                  <TimelineSegment key={`${session.id}-${index}`} segment={segment} session={session} nowMinutes={nowMinutes} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      <p className="mt-5 rounded-3xl border border-white/10 bg-black/15 p-4 text-sm leading-6 text-white/58">
        Completed portions are muted, upcoming portions remain visible, and active sessions are highlighted. Use this as preparation context, not a prediction of market direction.
      </p>
    </article>
  );
}

function TimelineSegment({ segment, session, nowMinutes }: { segment: { start: number; end: number }; session: SessionState; nowMinutes: number }) {
  const left = (segment.start / 1440) * 100;
  const width = Math.max(1.2, ((segment.end - segment.start) / 1440) * 100);
  const completedWidth = Math.max(0, Math.min(100, ((nowMinutes - segment.start) / Math.max(1, segment.end - segment.start)) * 100));
  const isLive = session.status === "live" || session.status === "overlap";
  const isCompleted = !isLive && segment.end <= nowMinutes;
  const isUpcoming = !isLive && segment.start > nowMinutes;
  const liveFill = getLiveSegmentFill(session, segment, nowMinutes);

  return (
    <div
      className={cn(
        "absolute inset-y-0 overflow-hidden rounded-full",
        isLive ? "bg-emerald-300/22" : isCompleted ? "bg-white/14" : isUpcoming ? "bg-violet-300/28" : "bg-blue-300/22",
      )}
      style={{ left: `${left}%`, width: `${width}%` }}
    >
      {isLive && (
        <div
          className="h-full rounded-full bg-emerald-300/75 transition-[width] duration-500"
          style={{ width: `${liveFill}%` }}
        />
      )}
      {!isLive && !isUpcoming && !isCompleted && (
        <div className="h-full rounded-full bg-white/18" style={{ width: `${completedWidth}%` }} />
      )}
    </div>
  );
}

function getLiveSegmentFill(session: SessionState, segment: { start: number; end: number }, nowMinutes: number) {
  const segmentLength = Math.max(1, segment.end - segment.start);
  const withinSegment = nowMinutes >= segment.start && nowMinutes <= segment.end;
  const wrapsMidnight = session.timelineEnd <= session.timelineStart;

  if (!wrapsMidnight) {
    return Math.max(0, Math.min(100, ((nowMinutes - segment.start) / segmentLength) * 100));
  }
  if (withinSegment) {
    return Math.max(0, Math.min(100, ((nowMinutes - segment.start) / segmentLength) * 100));
  }
  return segment.start >= session.timelineStart ? 100 : 0;
}

function getSessionState(session: MarketSession, now: Date, displayTimezone: string): SessionState {
  let openDate = dateForZonedSessionTime(now, session.zone, session.openHour);
  let closeDate = dateForZonedSessionTime(now, session.zone, session.closeHour);
  if (session.closeHour <= session.openHour) closeDate = addDays(closeDate, 1);

  if (now.getTime() < openDate.getTime()) {
    const yesterdayOpen = addDays(openDate, -1);
    const yesterdayClose = addDays(closeDate, -1);
    if (now.getTime() >= yesterdayOpen.getTime() && now.getTime() < yesterdayClose.getTime()) {
      openDate = yesterdayOpen;
      closeDate = yesterdayClose;
    }
  } else if (now.getTime() >= closeDate.getTime()) {
    openDate = addDays(openDate, 1);
    closeDate = addDays(closeDate, 1);
  }

  const active = now.getTime() >= openDate.getTime() && now.getTime() < closeDate.getTime();
  const sessionDuration = closeDate.getTime() - openDate.getTime();
  const elapsed = Math.max(0, now.getTime() - openDate.getTime());
  const progressPercent = active ? Math.min(100, Math.max(2, (elapsed / sessionDuration) * 100)) : 0;
  const minutesToOpen = Math.max(0, (openDate.getTime() - now.getTime()) / 60_000);
  const status: SessionStatus = active ? "live" : minutesToOpen <= 60 ? "opening_soon" : "closed";

  return {
    ...session,
    active,
    status,
    localOpen: formatInZone(openDate, displayTimezone, { hour: "2-digit", minute: "2-digit", hour12: false }),
    localClose: formatInZone(closeDate, displayTimezone, { hour: "2-digit", minute: "2-digit", hour12: false }),
    timeRemaining: formatDuration((active ? closeDate.getTime() - now.getTime() : openDate.getTime() - now.getTime()) / 3_600_000),
    progressPercent,
    timelineStart: getMinutesInZone(openDate, displayTimezone),
    timelineEnd: getMinutesInZone(closeDate, displayTimezone),
    openDate,
    closeDate,
  };
}

function dateForZonedSessionTime(reference: Date, timezone: string, hour: number) {
  const parts = zonedDateParts(reference, timezone);
  const wholeHour = Math.floor(hour);
  const minute = Math.round((hour - wholeHour) * 60);
  let guess = new Date(Date.UTC(parts.year, parts.month - 1, parts.day, wholeHour, minute, 0));

  for (let i = 0; i < 3; i += 1) {
    const actual = zonedDateTimeParts(guess, timezone);
    const desiredUtc = Date.UTC(parts.year, parts.month - 1, parts.day, wholeHour, minute, 0);
    const actualUtc = Date.UTC(actual.year, actual.month - 1, actual.day, actual.hour, actual.minute, 0);
    guess = new Date(guess.getTime() + (desiredUtc - actualUtc));
  }

  return guess;
}

function timelineSegments(session: SessionState) {
  const start = session.timelineStart;
  const end = session.timelineEnd;
  if (end > start) return [{ start, end }];
  return [
    { start, end: 1440 },
    { start: 0, end },
  ];
}

function getStatusVisual(status: SessionStatus) {
  if (status === "live") {
    return {
      label: "Live",
      icon: <Radio className="h-3 w-3" aria-hidden="true" />,
      iconTone: "text-emerald-200",
      badge: "bg-emerald-400/20 text-emerald-100 ring-1 ring-emerald-200/35",
      card: "border-emerald-300/45 bg-emerald-300/[0.13] shadow-[0_0_50px_rgba(52,211,153,0.14)]",
    };
  }
  if (status === "overlap") {
    return {
      label: "Live",
      icon: <Activity className="h-3 w-3" aria-hidden="true" />,
      iconTone: "text-cyan-200",
      badge: "bg-emerald-400/20 text-emerald-100 ring-1 ring-emerald-200/35",
      card: "border-cyan-300/40 bg-cyan-300/[0.10] shadow-[0_0_50px_rgba(59,130,246,0.12)]",
    };
  }
  if (status === "opening_soon") {
    return {
      label: "Soon",
      icon: <Clock3 className="h-3 w-3" aria-hidden="true" />,
      iconTone: "text-blue-200",
      badge: "bg-blue-400/16 text-blue-100 ring-1 ring-blue-200/25",
      card: "border-blue-300/24 bg-blue-300/[0.07]",
    };
  }
  return {
    label: "Closed",
    icon: <Moon className="h-3 w-3" aria-hidden="true" />,
    iconTone: "text-white/45",
    badge: "bg-white/8 text-white/55 ring-1 ring-white/10",
    card: "border-white/10 bg-white/[0.035]",
  };
}

function resolveOverlap(activeSessions: SessionState[], timezone: string) {
  const has = (id: SessionId) => activeSessions.some((session) => session.id === id);
  const start = new Date(Math.max(...activeSessions.map((session) => session.openDate.getTime())));
  const end = new Date(Math.min(...activeSessions.map((session) => session.closeDate.getTime())));
  const window = activeSessions.length > 1
    ? `${formatInZone(start, timezone, { hour: "2-digit", minute: "2-digit", hour12: false })} - ${formatInZone(end, timezone, { hour: "2-digit", minute: "2-digit", hour12: false })}`
    : "";

  if (has("london") && has("newyork")) {
    return {
      title: "London-New York Overlap",
      window,
      body: "A typically high-liquidity period for major FX pairs. It can be useful for preparation, but it does not guarantee volatility or direction.",
    };
  }
  if (has("sydney") && has("tokyo")) {
    return {
      title: "Sydney-Tokyo Overlap",
      window,
      body: "A useful Asia-Pacific window for AUD, NZD, and JPY pairs. Liquidity can improve, but direction is never guaranteed.",
    };
  }
  if (activeSessions.length > 1) {
    return {
      title: activeSessions.map((session) => session.name.replace(" / Asia", "")).join(" - ") + " Overlap",
      window,
      body: "Multiple market sessions are open at the same time. Use the overlap as context for planning and risk review, not as a trading signal.",
    };
  }
  return null;
}

function zonedDateParts(date: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const get = (type: string) => Number(parts.find((part) => part.type === type)?.value || 0);
  return { year: get("year"), month: get("month"), day: get("day") };
}

function zonedDateTimeParts(date: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const get = (type: string) => Number(parts.find((part) => part.type === type)?.value || 0);
  const hour = get("hour");
  return { year: get("year"), month: get("month"), day: get("day"), hour: hour === 24 ? 0 : hour, minute: get("minute") };
}

function getMinutesInZone(date: Date, timezone: string) {
  const parts = zonedDateTimeParts(date, timezone);
  return parts.hour * 60 + parts.minute;
}

function formatInZone(date: Date, timezone: string, options: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat("en-US", { timeZone: timezone, ...options }).format(date);
}

function formatDuration(hours: number) {
  const totalMinutes = Math.max(0, Math.round(hours * 60));
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h <= 0) return `${m}m`;
  return `${h}h ${m}m`;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}
