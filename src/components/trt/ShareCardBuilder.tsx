import { useEffect, useMemo, useRef, useState } from "react";
import {
  BadgeCheck,
  Check,
  Download,
  Eye,
  EyeOff,
  Gauge,
  Globe2,
  QrCode,
  ShieldCheck,
  SlidersHorizontal,
  Trophy,
  UserRound,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/lib/auth";
import { money, summarize, useTrt } from "@/lib/trt-store";

type Preset =
  | "overall"
  | "net_profit"
  | "cashback"
  | "payouts"
  | "best_month"
  | "funded"
  | "custom";

type Theme = "obsidian" | "royal" | "platinum" | "midnight" | "emerald";
type Ratio = "landscape" | "square" | "story" | "linkedin";

type Visibility = {
  profile: boolean;
  traderLevel: boolean;
  traderTbi: boolean;
  country: boolean;
  memberSince: boolean;
  verification: boolean;
  qr: boolean;
  stats: boolean;
};

const PRESETS: { id: Preset; label: string; title: string }[] = [
  { id: "overall", label: "Overall ROI", title: "Overall ROI" },
  { id: "net_profit", label: "Net Profit", title: "Net Profit" },
  { id: "cashback", label: "Cashback Earned", title: "Cashback Earned" },
  { id: "payouts", label: "Payout Milestone", title: "Total Payouts" },
  { id: "best_month", label: "Best Month", title: "Best Month" },
  { id: "funded", label: "Funded Capital", title: "Funded Capital" },
  { id: "custom", label: "Custom", title: "Signature Achievement" },
];

const THEMES: Record<Theme, {
  label: string;
  shell: string;
  glow: string;
  accent: string;
  line: string;
  quietText: string;
}> = {
  obsidian: {
    label: "Obsidian Black",
    shell: "from-[#06060a] via-[#0b0911] to-[#111019]",
    glow: "bg-violet-500/14",
    accent: "text-violet-200",
    line: "border-violet-200/14",
    quietText: "text-white/58",
  },
  royal: {
    label: "Royal Violet",
    shell: "from-[#0a0613] via-[#1a0d2f] to-[#231343]",
    glow: "bg-fuchsia-500/16",
    accent: "text-fuchsia-200",
    line: "border-fuchsia-200/16",
    quietText: "text-violet-100/60",
  },
  platinum: {
    label: "Platinum",
    shell: "from-[#e8e4f1] via-[#f7f4fb] to-[#bcb5ca]",
    glow: "bg-violet-500/10",
    accent: "text-violet-700",
    line: "border-violet-950/10",
    quietText: "text-slate-700/70",
  },
  midnight: {
    label: "Midnight Blue",
    shell: "from-[#050913] via-[#0c1324] to-[#111b34]",
    glow: "bg-blue-500/16",
    accent: "text-sky-200",
    line: "border-sky-100/14",
    quietText: "text-slate-200/58",
  },
  emerald: {
    label: "Emerald",
    shell: "from-[#03110d] via-[#071914] to-[#0b241c]",
    glow: "bg-emerald-400/14",
    accent: "text-emerald-200",
    line: "border-emerald-100/14",
    quietText: "text-emerald-50/58",
  },
};

const RATIOS: Record<Ratio, { label: string; className: string; exportWidth: number; exportHeight: number }> = {
  landscape: { label: "Landscape", className: "aspect-[16/9] max-w-[980px]", exportWidth: 1600, exportHeight: 900 },
  square: { label: "Square", className: "aspect-square max-w-[780px]", exportWidth: 1200, exportHeight: 1200 },
  story: { label: "Story", className: "aspect-[9/16] max-w-[440px]", exportWidth: 1080, exportHeight: 1920 },
  linkedin: { label: "LinkedIn Banner", className: "aspect-[4/1] max-w-[1040px]", exportWidth: 1584, exportHeight: 396 },
};

const DEFAULT_VISIBILITY: Visibility = {
  profile: true,
  traderLevel: true,
  traderTbi: true,
  country: true,
  memberSince: true,
  verification: true,
  qr: true,
  stats: true,
};

export function ShareCardBuilder() {
  const { user } = useAuth();
  const trt = useTrt();
  const summary = useMemo(() => summarize(trt, "all"), [trt]);
  const monthly = useMemo(() => summarize(trt, "30d"), [trt]);
  const [preset, setPreset] = useState<Preset>("overall");
  const [theme, setTheme] = useState<Theme>("obsidian");
  const [ratio, setRatio] = useState<Ratio>("landscape");
  const [vis, setVis] = useState<Visibility>(DEFAULT_VISIBILITY);
  const [customTitle, setCustomTitle] = useState("Signature Achievement");
  const [customMetric, setCustomMetric] = useState("+284%");
  const [animateKey, setAnimateKey] = useState(0);
  const [animatedNumber, setAnimatedNumber] = useState<number | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const fundedAccounts = trt.accounts.filter((a) => a.status === "funded" || a.type === "prop_funded");
  const fundedCapital = fundedAccounts.reduce((sum, account) => sum + (account.size ?? 0), 0);
  const payoutsTotal = trt.transactions
    .filter((tx) => tx.category === "payout" && tx.status !== "cancelled")
    .reduce((sum, tx) => sum + tx.amount, 0);
  const cashbackTotal = trt.transactions
    .filter((tx) => tx.category === "rebate" && tx.status !== "cancelled")
    .reduce((sum, tx) => sum + tx.amount, 0);
  const bestMonth = Math.max(monthly.net, summary.net, 0);
  const traderLevel = getTraderLevel(user?.rrBalance ?? 0);
  const traderName = user?.fullName || user?.name || "RebateBoard Trader";
  const username = user?.username || user?.email?.split("@")[0] || "trader";
  const memberSince = formatMemberSince(user?.joinedAt);
  const assetId = useMemo(() => {
    const seed = (user?.id || username || "trader").toString().replace(/[^a-z0-9]/gi, "").slice(0, 6).toUpperCase();
    return `RB-TRT-${seed || "CARD"}-${new Date().getFullYear()}`;
  }, [user?.id, username]);

  const achievement = useMemo(() => {
    switch (preset) {
      case "overall":
        return {
          title: "Overall ROI",
          value: summary.roiPct == null ? "No Data Yet" : `${summary.roiPct >= 0 ? "+" : ""}${summary.roiPct.toFixed(0)}%`,
          numeric: summary.roiPct,
          suffix: "%",
        };
      case "net_profit":
        return { title: "Net Profit", value: money(summary.net), numeric: summary.net, prefix: "$" };
      case "cashback":
        return { title: "Cashback Earned", value: money(cashbackTotal), numeric: cashbackTotal, prefix: "$" };
      case "payouts":
        return { title: "Total Payouts", value: money(payoutsTotal), numeric: payoutsTotal, prefix: "$" };
      case "best_month":
        return { title: "Best Month", value: money(bestMonth), numeric: bestMonth, prefix: "$" };
      case "funded":
        return { title: "Funded Capital", value: money(fundedCapital), numeric: fundedCapital, prefix: "$" };
      case "custom":
        return { title: customTitle || "Signature Achievement", value: customMetric || "Custom", numeric: parseMetric(customMetric) };
    }
  }, [bestMonth, cashbackTotal, customMetric, customTitle, fundedCapital, payoutsTotal, preset, summary.net, summary.roiPct]);

  const supportStats = useMemo(() => [
    { label: "Funded Capital", value: fundedCapital > 0 ? money(fundedCapital) : "Not Logged" },
    { label: "Total Payouts", value: payoutsTotal > 0 ? money(payoutsTotal) : "Not Logged" },
    { label: "Net Profit", value: summary.txCount > 0 ? money(summary.net) : "Not Logged" },
  ], [fundedCapital, payoutsTotal, summary.net, summary.txCount]);

  useEffect(() => {
    if (achievement.numeric == null || Number.isNaN(achievement.numeric)) {
      setAnimatedNumber(null);
      return;
    }
    let frame = 0;
    let raf = 0;
    const totalFrames = 36;
    const start = 0;
    const end = achievement.numeric;
    const tick = () => {
      frame += 1;
      const progress = Math.min(1, frame / totalFrames);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedNumber(start + (end - start) * eased);
      if (progress < 1) raf = window.requestAnimationFrame(tick);
    };
    setAnimatedNumber(0);
    raf = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(raf);
  }, [achievement.numeric, animateKey]);

  const displayMetric = animatedNumber == null
    ? achievement.value
    : formatAnimatedMetric(animatedNumber, achievement.value);

  const exportPng = async () => {
    if (!cardRef.current) return;
    try {
      const mod = await import("html-to-image");
      const { exportWidth, exportHeight } = RATIOS[ratio];
      const url = await mod.toPng(cardRef.current, {
        pixelRatio: 2,
        backgroundColor: theme === "platinum" ? "#f2edf8" : "#07070c",
        width: exportWidth,
        height: exportHeight,
        style: {
          width: `${exportWidth}px`,
          height: `${exportHeight}px`,
        },
      });
      const a = document.createElement("a");
      a.download = `rebateboard-${preset}-${ratio}-${Date.now()}.png`;
      a.href = url;
      a.click();
    } catch {
      window.alert("We couldn't export this card right now. Please try again.");
    }
  };

  const themeSpec = THEMES[theme];
  const platinum = theme === "platinum";
  const textPrimary = platinum ? "text-slate-950" : "text-white";
  const textMuted = platinum ? "text-slate-700/72" : themeSpec.quietText;

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
      <section className="space-y-4">
        <div
          ref={cardRef}
          className={`relative mx-auto w-full overflow-hidden rounded-[2rem] bg-gradient-to-br ${themeSpec.shell} ${RATIOS[ratio].className} shadow-[0_28px_90px_rgba(0,0,0,0.46)] ring-1 ${themeSpec.line}`}
        >
          <div className={`absolute -right-[12%] -top-[20%] h-[55%] w-[45%] rounded-full ${themeSpec.glow} blur-3xl`} />
          <div className={`absolute -bottom-[22%] left-[4%] h-[48%] w-[38%] rounded-full ${themeSpec.glow} blur-3xl`} />
          <div
            className="absolute inset-0 opacity-[0.08]"
            style={{
              backgroundImage:
                "linear-gradient(120deg, transparent 0 24px, currentColor 25px, transparent 26px), linear-gradient(60deg, transparent 0 34px, currentColor 35px, transparent 36px)",
              backgroundSize: "92px 92px",
              color: platinum ? "#2e174f" : "#ffffff",
            }}
          />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/35 to-transparent" />
          <div className="relative flex h-full flex-col p-[6.2%]">
            <header className="flex items-start justify-between gap-6">
              <Logo heightClass={ratio === "linkedin" ? "h-7" : "h-8"} className={platinum ? "[&_*]:text-slate-950" : ""} />
              <div className={`text-right text-[0.62rem] font-semibold uppercase tracking-[0.22em] ${textMuted}`}>
                <div>Trader Performance Card</div>
                <div className="mt-1 opacity-70">Version 1.0</div>
              </div>
            </header>

            <main className={`flex flex-1 flex-col ${ratio === "linkedin" ? "justify-center" : "justify-end"} py-[4%]`}>
              <div className={`max-w-[72%] ${ratio === "story" ? "max-w-full" : ""}`}>
                <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[0.62rem] font-bold uppercase tracking-[0.16em] ${themeSpec.line} ${themeSpec.accent}`}>
                  <Trophy className="h-3.5 w-3.5" />
                  {achievement.title}
                </div>
                <div
                  key={`${preset}-${ratio}-${animateKey}`}
                  className={`mt-4 font-black tracking-[-0.055em] ${textPrimary} ${
                    ratio === "story"
                      ? "text-[4.25rem] leading-[0.86]"
                      : ratio === "linkedin"
                        ? "text-[4.55rem] leading-none"
                        : "text-[clamp(4.2rem,9vw,7.4rem)] leading-[0.88]"
                  }`}
                >
                  {displayMetric}
                </div>
                <div className={`mt-3 max-w-xl text-sm font-medium leading-relaxed ${textMuted}`}>
                  Verified trading performance generated from the RebateBoard Trader Return Tracker.
                </div>
              </div>
            </main>

            {vis.stats && ratio !== "linkedin" && (
              <div className={`grid grid-cols-3 border-y ${themeSpec.line}`}>
                {supportStats.map((stat, index) => (
                  <div key={stat.label} className={`py-4 ${index > 0 ? `border-l ${themeSpec.line} pl-5` : "pr-5"}`}>
                    <div className={`text-[0.58rem] font-bold uppercase tracking-[0.18em] ${textMuted}`}>{stat.label}</div>
                    <div className={`mt-1 text-lg font-bold tabular-nums ${textPrimary}`}>{stat.value}</div>
                  </div>
                ))}
              </div>
            )}

            <footer className={`mt-5 flex items-end justify-between gap-5 ${ratio === "story" ? "flex-col items-start" : ""}`}>
              {vis.profile && (
                <div className="flex min-w-0 items-center gap-3">
                  <div className={`grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-2xl border ${themeSpec.line} ${platinum ? "bg-slate-950/5" : "bg-white/[0.055]"}`}>
                    {user?.dp ? (
                      <img src={user.dp} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <UserRound className={`h-5 w-5 ${themeSpec.accent}`} />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className={`truncate text-base font-bold ${textPrimary}`}>{traderName}</div>
                    <div className={`truncate text-xs font-medium ${textMuted}`}>@{username}</div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {vis.country && user?.country && <MetaChip icon={Globe2} label={user.country} platinum={platinum} />}
                      {vis.memberSince && <MetaChip icon={BadgeCheck} label={`Member since ${memberSince}`} platinum={platinum} />}
                      {vis.traderLevel && <MetaChip icon={Trophy} label={traderLevel} platinum={platinum} premium />}
                      {vis.traderTbi && <MetaChip icon={Gauge} label={`Trader TBI ${Math.round(user?.traderScore ?? 0)}/100`} platinum={platinum} />}
                    </div>
                  </div>
                </div>
              )}

              {(vis.verification || vis.qr) && (
                <div className={`flex shrink-0 items-center gap-3 rounded-2xl border ${themeSpec.line} ${platinum ? "bg-white/45" : "bg-black/18"} p-3 backdrop-blur`}>
                  {vis.verification && (
                    <div className={ratio === "story" ? "max-w-[210px]" : "max-w-[250px]"}>
                      <div className={`flex items-center gap-1.5 text-xs font-bold ${textPrimary}`}>
                        <ShieldCheck className={`h-4 w-4 ${themeSpec.accent}`} />
                        Verified by RebateBoard
                      </div>
                      <p className={`mt-1 text-[0.64rem] leading-snug ${textMuted}`}>
                        Data verified from platform activity. Asset ID {assetId}
                      </p>
                      <div className={`mt-1 text-[0.58rem] font-semibold uppercase tracking-[0.14em] ${themeSpec.accent}`}>
                        rebateboard.com/verify
                      </div>
                    </div>
                  )}
                  {vis.qr && <QrMark platinum={platinum} />}
                </div>
              )}
            </footer>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setAnimateKey((value) => value + 1)}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-bold text-white transition hover:bg-white/[0.08]"
          >
            <Eye className="h-4 w-4" />
            Generate Preview
          </button>
          <button
            type="button"
            onClick={exportPng}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-600 px-4 py-2 text-sm font-bold text-white shadow-[0_0_22px_rgba(192,132,252,0.35)] transition hover:shadow-[0_0_28px_rgba(192,132,252,0.48)]"
          >
            <Download className="h-4 w-4" />
            Download PNG
          </button>
        </div>
      </section>

      <aside className="space-y-4">
        <ControlPanel title="Card Preset" icon={Trophy}>
          <div className="grid gap-2">
            {PRESETS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setPreset(item.id)}
                className={`rounded-2xl px-3 py-2.5 text-left text-sm font-semibold transition ring-1 ${
                  preset === item.id
                    ? "bg-primary/18 text-white ring-primary/35"
                    : "bg-white/[0.03] text-muted-foreground ring-white/5 hover:bg-white/[0.06] hover:text-white"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
          {preset === "custom" && (
            <div className="mt-3 space-y-2">
              <input
                value={customTitle}
                onChange={(event) => setCustomTitle(event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white outline-none transition focus:border-primary/50"
                placeholder="Achievement title"
              />
              <input
                value={customMetric}
                onChange={(event) => setCustomMetric(event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white outline-none transition focus:border-primary/50"
                placeholder="+284%"
              />
            </div>
          )}
        </ControlPanel>

        <ControlPanel title="Format & Theme" icon={SlidersHorizontal}>
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(RATIOS) as Ratio[]).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setRatio(item)}
                className={`rounded-2xl px-3 py-2 text-xs font-bold transition ring-1 ${
                  ratio === item ? "bg-white/10 text-white ring-white/20" : "bg-white/[0.03] text-muted-foreground ring-white/5"
                }`}
              >
                {RATIOS[item].label}
              </button>
            ))}
          </div>
          <div className="mt-3 grid gap-2">
            {(Object.keys(THEMES) as Theme[]).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setTheme(item)}
                className={`flex items-center justify-between rounded-2xl px-3 py-2 text-sm font-semibold transition ring-1 ${
                  theme === item ? "bg-white/10 text-white ring-white/20" : "bg-white/[0.03] text-muted-foreground ring-white/5"
                }`}
              >
                <span>{THEMES[item].label}</span>
                {theme === item && <Check className="h-4 w-4 text-primary" />}
              </button>
            ))}
          </div>
        </ControlPanel>

        <ControlPanel title="Visible Fields" icon={Eye}>
          <div className="space-y-2">
            {(Object.keys(vis) as (keyof Visibility)[]).map((field) => (
              <button
                key={field}
                type="button"
                onClick={() => setVis((current) => ({ ...current, [field]: !current[field] }))}
                className="flex w-full items-center justify-between rounded-2xl bg-white/[0.035] px-3 py-2 text-sm font-semibold text-white/86 ring-1 ring-white/7 transition hover:bg-white/[0.06]"
              >
                <span>{fieldLabel(field)}</span>
                {vis[field] ? <Eye className="h-4 w-4 text-primary" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
              </button>
            ))}
          </div>
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            Private fields stay hidden in the exported image. Export uses high-resolution PNG output for social channels.
          </p>
        </ControlPanel>
      </aside>
    </div>
  );
}

function ControlPanel({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div className="glass rounded-3xl p-4 ring-1 ring-white/10">
      <div className="mb-3 flex items-center gap-2 text-sm font-bold text-white">
        <span className="grid h-8 w-8 place-items-center rounded-2xl bg-primary/15 text-primary ring-1 ring-primary/20">
          <Icon className="h-4 w-4" />
        </span>
        {title}
      </div>
      {children}
    </div>
  );
}

function MetaChip({
  icon: Icon,
  label,
  platinum,
  premium = false,
}: {
  icon: React.ElementType;
  label: string;
  platinum: boolean;
  premium?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[0.6rem] font-bold uppercase tracking-[0.08em] ${
        platinum
          ? premium
            ? "border-violet-950/15 bg-violet-700/10 text-violet-800"
            : "border-slate-950/10 bg-slate-950/5 text-slate-700"
          : premium
            ? "border-violet-200/18 bg-violet-300/10 text-violet-100"
            : "border-white/10 bg-white/[0.045] text-white/65"
      }`}
    >
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
}

function QrMark({ platinum }: { platinum: boolean }) {
  const squares = [
    "col-start-1 row-start-1", "col-start-2 row-start-1", "col-start-3 row-start-1",
    "col-start-1 row-start-2", "col-start-3 row-start-2", "col-start-1 row-start-3",
    "col-start-2 row-start-3", "col-start-3 row-start-3", "col-start-5 row-start-1",
    "col-start-6 row-start-1", "col-start-5 row-start-2", "col-start-7 row-start-2",
    "col-start-6 row-start-3", "col-start-7 row-start-3", "col-start-1 row-start-5",
    "col-start-2 row-start-6", "col-start-3 row-start-5", "col-start-5 row-start-5",
    "col-start-7 row-start-5", "col-start-4 row-start-6", "col-start-6 row-start-6",
    "col-start-5 row-start-7", "col-start-7 row-start-7",
  ];
  return (
    <div className={`grid h-16 w-16 shrink-0 grid-cols-7 grid-rows-7 gap-0.5 rounded-xl border p-2 ${
      platinum ? "border-slate-950/10 bg-white/70" : "border-white/10 bg-white/8"
    }`}>
      {squares.map((position, index) => (
        <span
          key={`${position}-${index}`}
          className={`${position} rounded-[2px] ${platinum ? "bg-slate-950" : "bg-white"}`}
        />
      ))}
      <QrCode className={`col-start-4 row-start-4 h-2.5 w-2.5 ${platinum ? "text-violet-700" : "text-violet-200"}`} />
    </div>
  );
}

function getTraderLevel(rr: number) {
  if (rr >= 5000) return "Elite Trader";
  if (rr >= 2500) return "Platinum Trader";
  if (rr >= 1000) return "Gold Trader";
  if (rr >= 500) return "Silver Trader";
  if (rr >= 100) return "Bronze Trader";
  return "Explorer";
}

function formatMemberSince(value?: string) {
  if (!value) return new Date().getFullYear().toString();
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return new Date().getFullYear().toString();
  return parsed.getFullYear().toString();
}

function parseMetric(value: string) {
  const n = Number(value.replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) ? n : null;
}

function formatAnimatedMetric(value: number, finalValue: string) {
  if (finalValue.includes("%")) {
    return `${value >= 0 ? "+" : ""}${value.toFixed(0)}%`;
  }
  if (finalValue.includes("$")) {
    return money(value);
  }
  if (/^[+-]?\d/.test(finalValue)) {
    return value.toLocaleString(undefined, { maximumFractionDigits: 0 });
  }
  return finalValue;
}

function fieldLabel(field: keyof Visibility) {
  const map: Record<keyof Visibility, string> = {
    profile: "Trader Identity",
    traderLevel: "Trader Level",
    traderTbi: "Trader TBI",
    country: "Country",
    memberSince: "Member Since",
    verification: "Verification Copy",
    qr: "QR Mark",
    stats: "Supporting Stats",
  };
  return map[field];
}
