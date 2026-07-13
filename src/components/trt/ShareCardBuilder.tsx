import { useEffect, useMemo, useRef, useState } from "react";
import {
  BadgeCheck,
  Check,
  Copy,
  Download,
  Eye,
  EyeOff,
  Gauge,
  Globe2,
  Share2,
  ShieldCheck,
  SlidersHorizontal,
  Trophy,
  UserRound,
  X,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/lib/auth";
import { createTrtShareableAsset, type ShareableAssetRecord } from "@/lib/shareable-assets-api";
import { money, summarize, useTrt } from "@/lib/trt-store";

type Preset =
  | "overall"
  | "net_profit"
  | "cashback"
  | "payouts"
  | "best_month"
  | "funded"
  | "trader_level"
  | "streak"
  | "custom";

type Theme = "obsidian" | "royal" | "platinum" | "emerald";
type Ratio = "landscape" | "square" | "story";

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
  { id: "trader_level", label: "Trader Level", title: "Trader Level" },
  { id: "streak", label: "Trading Streak", title: "Trading Streak" },
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
  const { user, token } = useAuth();
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
  const [exportOpen, setExportOpen] = useState(false);
  const [exporting, setExporting] = useState<"png" | "copy" | "social" | "verify" | null>(null);
  const [exportComplete, setExportComplete] = useState(false);
  const [shareSheetOpen, setShareSheetOpen] = useState(false);
  const [verificationRecord, setVerificationRecord] = useState<ShareableAssetRecord | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [firstCardMessage, setFirstCardMessage] = useState(false);
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
  const streakDays = Number((user as { streakDays?: number } | null | undefined)?.streakDays ?? 0);
  const traderName = user?.fullName || user?.name || "RebateBoard Trader";
  const username = user?.username || user?.email?.split("@")[0] || "trader";
  const memberSince = formatMemberSince(user?.joinedAt);
  const assetId = useMemo(() => {
    const seed = (user?.id || username || "trader").toString().replace(/[^a-z0-9]/gi, "").slice(0, 6).toUpperCase();
    return `RB-TRT-${seed || "CARD"}-${new Date().getFullYear()}`;
  }, [user?.id, username]);
  const publicAssetId = verificationRecord?.publicAssetId || assetId;
  const verificationUrl = getVerificationUrl(publicAssetId);

  const achievement = useMemo(() => {
    switch (preset) {
      case "overall":
        return {
          title: "Overall ROI",
          value: summary.roiPct == null ? "Your Story Starts Here" : `${summary.roiPct >= 0 ? "+" : ""}${summary.roiPct.toFixed(0)}%`,
          numeric: summary.roiPct,
          suffix: "%",
        };
      case "net_profit":
        return summary.txCount > 0
          ? { title: "Net Profit", value: money(summary.net), numeric: summary.net, prefix: "$" }
          : { title: "Net Profit", value: "Track Your Edge", numeric: null };
      case "cashback":
        return cashbackTotal > 0
          ? { title: "Cashback Earned", value: money(cashbackTotal), numeric: cashbackTotal, prefix: "$" }
          : { title: "Cashback Earned", value: "Unlock Savings", numeric: null };
      case "payouts":
        return payoutsTotal > 0
          ? { title: "Total Payouts", value: money(payoutsTotal), numeric: payoutsTotal, prefix: "$" }
          : { title: "Total Payouts", value: "Verify Milestones", numeric: null };
      case "best_month":
        return bestMonth > 0
          ? { title: "Best Month", value: money(bestMonth), numeric: bestMonth, prefix: "$" }
          : { title: "Best Month", value: "Build Momentum", numeric: null };
      case "funded":
        return fundedCapital > 0
          ? { title: "Funded Capital", value: money(fundedCapital), numeric: fundedCapital, prefix: "$" }
          : { title: "Funded Capital", value: "Log Capital", numeric: null };
      case "trader_level":
        return { title: "Trader Level", value: traderLevel, numeric: user?.rrBalance ?? null };
      case "streak":
        return {
          title: "Trading Streak",
          value: streakDays > 0 ? `${streakDays} Days` : "Start Your Streak",
          numeric: streakDays > 0 ? streakDays : null,
        };
      case "custom":
        return { title: customTitle || "Signature Achievement", value: customMetric || "Custom", numeric: parseMetric(customMetric) };
    }
  }, [bestMonth, cashbackTotal, customMetric, customTitle, fundedCapital, payoutsTotal, preset, streakDays, summary.net, summary.roiPct, traderLevel, user?.rrBalance]);

  const heroMessage = useMemo(() => getPresetHeroMessage(preset), [preset]);
  const storyCopy = useMemo(() => getPresetStory(preset), [preset]);

  const supportStats = useMemo(() => [
    { label: "Funded Capital", value: fundedCapital > 0 ? money(fundedCapital) : "Awaiting Activity" },
    { label: "Total Payouts", value: payoutsTotal > 0 ? money(payoutsTotal) : "No Activity Yet" },
    { label: "Net Profit", value: summary.txCount > 0 ? money(summary.net) : "Start Tracking" },
  ], [fundedCapital, payoutsTotal, summary.net, summary.txCount]);

  useEffect(() => {
    setVerificationRecord(null);
    setShareSheetOpen(false);
  }, [achievement.title, achievement.value, preset, ratio, theme, vis]);

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

  const displayMetric = animatedNumber == null || preset === "trader_level"
    ? achievement.value
    : formatAnimatedMetric(animatedNumber, achievement.value);

  const renderPerformanceCard = (ref?: typeof cardRef) => {
    const isLandscape = ratio === "landscape";
    const isSquare = ratio === "square";
    const isStory = ratio === "story";
    const shellPadding = isLandscape ? "p-[4.4%]" : isSquare ? "p-[5.2%]" : "p-[6.4%]";
    const metricClass = textMetric
      ? isStory
        ? "text-[3.1rem] leading-[0.95]"
        : isSquare
          ? "text-[clamp(3.4rem,7vw,5.4rem)] leading-[0.92]"
          : "text-[clamp(3.5rem,6.2vw,6.4rem)] leading-[0.9]"
      : isStory
        ? "text-[4.35rem] leading-[0.86]"
        : isSquare
          ? "text-[clamp(4rem,8.4vw,6.4rem)] leading-[0.86]"
          : "text-[clamp(4.3rem,8vw,7rem)] leading-[0.86]";

    const heroBlock = (
      <div className={`transition duration-300 ease-out ${isStory ? "text-center" : ""}`}>
        <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[0.62rem] font-bold uppercase tracking-[0.16em] ${themeSpec.line} ${themeSpec.accent}`}>
          <Trophy className="h-3.5 w-3.5" />
          {achievement.title}
        </div>
        <div
          key={`hero-${preset}-${animateKey}`}
          className={`mt-3 text-sm font-bold uppercase tracking-[0.16em] ${themeSpec.accent} transition-all duration-300 ease-out`}
        >
          {heroMessage}
        </div>
        <div
          key={`${preset}-${ratio}-${animateKey}`}
          className={`mt-3 font-black tracking-[-0.055em] ${textPrimary} ${metricClass} transition-all duration-300 ease-out`}
        >
          {displayMetric}
        </div>
        <div className={`mt-3 ${isStory ? "mx-auto max-w-[19rem] text-base" : "max-w-xl text-sm"} font-medium leading-relaxed ${textMuted}`}>
          {storyCopy}
        </div>
      </div>
    );

    const statsBlock = vis.stats ? (
      <div className={`grid ${isStory ? "grid-cols-1 divide-y" : "grid-cols-3 border-y"} ${themeSpec.line}`}>
        {supportStats.map((stat, index) => (
          <div key={stat.label} className={`${isStory ? "py-3.5 text-center" : isSquare ? "px-3 py-4" : "px-4 py-4"} ${!isStory && index > 0 ? `border-l ${themeSpec.line}` : ""}`}>
            <div className={`text-[0.56rem] font-bold uppercase tracking-[0.18em] ${textMuted}`}>{stat.label}</div>
            <div className={`mt-1 text-base font-bold tabular-nums ${textPrimary}`}>{stat.value}</div>
          </div>
        ))}
      </div>
    ) : null;

    const identityBlock = vis.profile ? (
      <div className={`flex min-w-0 items-center gap-3 ${isStory ? "w-full justify-center text-center" : ""}`}>
        <div className={`grid ${isStory ? "h-14 w-14" : "h-12 w-12"} shrink-0 place-items-center overflow-hidden rounded-2xl border ${themeSpec.line} ${platinum ? "bg-slate-950/5" : "bg-white/[0.055]"}`}>
          {user?.dp ? (
            <img src={user.dp} alt="" className="h-full w-full object-cover" />
          ) : (
            <UserRound className={`h-5 w-5 ${themeSpec.accent}`} />
          )}
        </div>
        <div className="min-w-0">
          <div className={`truncate text-base font-bold ${textPrimary}`}>{traderName}</div>
          <div className={`truncate text-xs font-medium ${textMuted}`}>@{username}</div>
          <div className={`mt-2 flex flex-wrap gap-2 ${isStory ? "justify-center" : ""}`}>
            {vis.country && user?.country && <MetaChip icon={Globe2} label={user.country} platinum={platinum} />}
            {vis.memberSince && <MetaChip icon={BadgeCheck} label={`Member since ${memberSince}`} platinum={platinum} />}
            {vis.traderLevel && <MetaChip icon={Trophy} label={traderLevel} platinum={platinum} premium />}
            {vis.traderTbi && <MetaChip icon={Gauge} label={`Trader TBI ${Math.round(user?.traderScore ?? 0)}/100`} platinum={platinum} />}
          </div>
        </div>
      </div>
    ) : null;

    const verificationBlock = (vis.verification || vis.qr) ? (
      <div className={`flex shrink-0 items-center gap-3 rounded-2xl border ${themeSpec.line} ${platinum ? "bg-white/45" : "bg-black/18"} p-3 backdrop-blur ${isStory ? "w-full justify-between" : ""}`}>
        {vis.verification && (
          <div className={isStory ? "min-w-0 max-w-[220px]" : "min-w-0 max-w-[280px]"}>
            <div className={`flex items-center gap-1.5 text-xs font-bold ${textPrimary}`}>
              <ShieldCheck className={`h-4 w-4 shrink-0 ${themeSpec.accent}`} />
              Verified by RebateBoard
            </div>
            <p className={`mt-1 text-[0.64rem] leading-snug ${textMuted}`}>
              Data verified from platform activity. Asset ID {publicAssetId}
            </p>
            <div className={`mt-1 break-words text-[0.58rem] font-semibold uppercase tracking-[0.12em] ${themeSpec.accent}`}>
              {shortVerificationUrl(verificationUrl)}
            </div>
          </div>
        )}
        {vis.qr && <QrMark platinum={platinum} url={verificationUrl} compact={isLandscape} />}
      </div>
    ) : null;

    return (
      <div
        ref={ref}
        className={`relative mx-auto w-full overflow-hidden rounded-[2rem] bg-gradient-to-br ${themeSpec.shell} ${RATIOS[ratio].className} shadow-[0_18px_58px_rgba(0,0,0,0.34)] ring-1 ${themeSpec.line} transition-[max-width,aspect-ratio,box-shadow,transform] duration-300 ease-out hover:-translate-y-0.5`}
      >
        <div className={`absolute -right-[14%] -top-[22%] h-[46%] w-[38%] rounded-full ${themeSpec.glow} blur-3xl`} />
        <div className={`absolute -bottom-[22%] left-[5%] h-[38%] w-[30%] rounded-full ${themeSpec.glow} blur-3xl`} />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(120deg, transparent 0 28px, currentColor 29px, transparent 30px)",
            backgroundSize: "118px 118px",
            color: platinum ? "#2e174f" : "#ffffff",
          }}
        />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/35 to-transparent" />
        <div className={`relative flex h-full flex-col ${shellPadding}`}>
          <header className="flex items-start justify-between gap-6">
            <Logo heightClass={isStory ? "h-10" : "h-8"} className={platinum ? "[&_*]:text-slate-950" : ""} />
            <div className={`text-right text-[0.62rem] font-semibold uppercase tracking-[0.22em] ${textMuted}`}>
              <div>Trader Performance Card</div>
              <div className="mt-1 opacity-70">Version 1.0</div>
            </div>
          </header>

          {isLandscape ? (
            <main className="grid min-h-0 flex-1 grid-cols-[minmax(0,1.05fr)_minmax(310px,0.72fr)] items-end gap-[5%] pb-[1.5%] pt-[3%]">
              <section className="min-w-0">
                {heroBlock}
                <div className="mt-7">{statsBlock}</div>
              </section>
              <section className="flex min-w-0 flex-col gap-4">
                <div className={`rounded-3xl border ${themeSpec.line} ${platinum ? "bg-white/35" : "bg-white/[0.035]"} p-4 backdrop-blur-sm`}>
                  {identityBlock}
                </div>
                {verificationBlock}
              </section>
            </main>
          ) : isSquare ? (
            <main className="flex min-h-0 flex-1 flex-col justify-between gap-6 pb-[1%] pt-[5%]">
              <section className="max-w-[92%]">{heroBlock}</section>
              <section className="space-y-5">
                {statsBlock}
                <div className="grid items-end gap-4 sm:grid-cols-[minmax(0,0.9fr)_minmax(280px,1fr)]">
                  {identityBlock}
                  {verificationBlock}
                </div>
              </section>
            </main>
          ) : (
            <main className="flex min-h-0 flex-1 flex-col justify-between gap-6 pb-[2%] pt-[8%]">
              {heroBlock}
              <section className="space-y-5">
                {statsBlock}
                {identityBlock}
                {verificationBlock}
              </section>
            </main>
          )}
        </div>
      </div>
    );
  };

  const buildVerificationPayload = () => {
    const visibleFields = (Object.keys(vis) as (keyof Visibility)[]).filter((field) => vis[field]);
    const metadata: Record<string, string | number | null> = {
      presetLabel: PRESETS.find((item) => item.id === preset)?.label || achievement.title,
    };
    if (vis.profile) {
      metadata.traderName = traderName;
      metadata.username = username;
    }
    if (vis.country) metadata.country = user?.country || null;
    if (vis.memberSince) metadata.memberSince = memberSince;
    if (vis.traderLevel) metadata.traderLevel = traderLevel;
    if (vis.traderTbi) metadata.traderTbi = Math.round(user?.traderScore ?? 0);
    return {
      preset,
      format: ratio,
      theme,
      verifiedMetrics: {
        primaryMetric: achievement.value,
        achievement: achievement.title,
        fundedCapital: supportStats[0]?.value ?? null,
        totalPayouts: supportStats[1]?.value ?? null,
        netProfit: supportStats[2]?.value ?? null,
      },
      visibleFields,
      metadata,
    };
  };

  const ensureVerificationRecord = async () => {
    if (verificationRecord) return verificationRecord;
    if (!token) {
      throw new Error("Sign in to create a verified performance card.");
    }
    const record = await createTrtShareableAsset(token, buildVerificationPayload());
    setVerificationRecord(record);
    await waitForNextPaint();
    return record;
  };

  const prepareVerifiedCard = async () => {
    const record = await ensureVerificationRecord();
    await waitForNextPaint();
    if (cardRef.current) await waitForImages(cardRef.current);
    return record;
  };

  const createPngBlob = async () => {
    if (!cardRef.current) return null;
    const mod = await import("html-to-image");
    const { exportWidth, exportHeight } = RATIOS[ratio];
    await document.fonts?.ready;
    await waitForImages(cardRef.current);
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const blob = await mod.toBlob(cardRef.current, {
      pixelRatio: 2,
      backgroundColor: theme === "platinum" ? "#f2edf8" : "#07070c",
      cacheBust: true,
      width: exportWidth,
      height: exportHeight,
      style: {
        width: `${exportWidth}px`,
        height: `${exportHeight}px`,
        maxWidth: "none",
        minWidth: "0",
        transform: "none",
        transformOrigin: "top left",
        overflow: "hidden",
      },
    });
    return blob;
  };

  const exportCard = async (mode: "png" | "copy") => {
    try {
      setExporting(mode);
      await prepareVerifiedCard();
      await new Promise((resolve) => window.setTimeout(resolve, 260));
      const blob = await createPngBlob();
      if (!blob) throw new Error("No card");
      const filename = `rebateboard-${preset}-${ratio}-${Date.now()}.png`;
      if (mode === "copy" && navigator.clipboard && "write" in navigator.clipboard) {
        await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
      } else {
        downloadBlob(blob, filename);
      }
      setExportComplete(true);
      markFirstCardCreated();
    } catch {
      window.alert("We couldn't export this card right now. Please try again.");
    } finally {
      setExporting(null);
    }
  };

  const openVerificationPage = async () => {
    try {
      setExporting("verify");
      const record = await prepareVerifiedCard();
      window.open(getVerificationUrl(record.publicAssetId), "_blank", "noopener,noreferrer");
      setExportComplete(true);
      markFirstCardCreated();
    } catch {
      window.alert("We couldn't open the verification page right now. Please try again.");
    } finally {
      setExporting(null);
    }
  };

  const openShareSheet = async () => {
    try {
      setExporting("social");
      await prepareVerifiedCard();
      setExportComplete(true);
      setShareSheetOpen(true);
      markFirstCardCreated();
    } catch {
      window.alert("We couldn't prepare social sharing right now. Please try again.");
    } finally {
      setExporting(null);
    }
  };

  const markFirstCardCreated = () => {
    if (typeof window === "undefined") return;
    if (window.localStorage.getItem("rebateboard-share-card-created") === "1") return;
    window.localStorage.setItem("rebateboard-share-card-created", "1");
    setFirstCardMessage(true);
  };

  const themeSpec = THEMES[theme];
  const platinum = theme === "platinum";
  const textPrimary = platinum ? "text-slate-950" : "text-white";
  const textMuted = platinum ? "text-slate-700/72" : themeSpec.quietText;
  const textMetric = achievement.numeric == null && !/^[+$]?\d/.test(achievement.value);

  return (
    <div className="grid gap-5 lg:gap-6 xl:grid-cols-[minmax(0,7fr)_minmax(320px,3fr)]">
      <section className="space-y-4 xl:sticky xl:top-5 xl:self-start">
        <div className="rounded-[2.35rem] bg-white/[0.035] p-3 shadow-[0_30px_90px_rgba(0,0,0,0.36)] ring-1 ring-white/8 backdrop-blur-sm transition-all duration-300 ease-out">
          {renderPerformanceCard(cardRef)}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
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
            onClick={() => setPreviewOpen(true)}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-bold text-white transition hover:bg-white/[0.08]"
          >
            <Eye className="h-4 w-4" />
            Full-screen Preview
          </button>
          <button
            type="button"
            onClick={() => {
              setExportComplete(false);
              setExportOpen(true);
            }}
            className="group inline-flex items-center gap-2 rounded-full rb-gradient-primary px-5 py-3 text-sm font-black text-white shadow-[0_0_22px_rgba(192,132,252,0.35)] transition hover:-translate-y-0.5 hover:shadow-[0_0_30px_rgba(192,132,252,0.5)]"
          >
            <Download className="h-4 w-4 transition group-hover:-translate-y-0.5" />
            Export Card
          </button>
        </div>

        {firstCardMessage && (
          <div className="mx-auto max-w-xl rounded-3xl border border-primary/20 bg-primary/10 p-4 text-center shadow-[0_18px_42px_rgba(124,58,237,0.18)]">
            <div className="text-base font-black text-white">Congratulations.</div>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              You created your first RebateBoard Performance Card. Your achievements deserve to be shared.
            </p>
            <button
              type="button"
              onClick={() => setFirstCardMessage(false)}
              className="mt-3 rounded-full border border-white/10 px-4 py-2 text-xs font-bold text-white transition hover:bg-white/[0.06]"
            >
              Got it
            </button>
          </div>
        )}
      </section>

      <aside className="space-y-4 xl:max-h-[calc(100vh-2.5rem)] xl:overflow-y-auto xl:pr-1">
        <ControlPanel title="Story" icon={Trophy}>
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

        <ControlPanel title="Theme" icon={SlidersHorizontal}>
          <div className="grid gap-2">
            {(Object.keys(THEMES) as Theme[]).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setTheme(item)}
                className={`flex items-center justify-between rounded-2xl px-3 py-2 text-sm font-semibold transition ring-1 ${
                  theme === item ? "bg-white/10 text-white ring-white/20" : "bg-white/[0.03] text-muted-foreground ring-white/5"
                }`}
              >
                <span className="inline-flex items-center gap-2">
                  <span className={`h-5 w-5 rounded-full bg-gradient-to-br ${THEMES[item].shell} ring-1 ring-white/20`} />
                  {THEMES[item].label}
                </span>
                {theme === item && <Check className="h-4 w-4 text-primary" />}
              </button>
            ))}
          </div>
        </ControlPanel>

        <ControlPanel title="Layout" icon={SlidersHorizontal}>
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
        </ControlPanel>

        <ControlPanel title="Privacy" icon={Eye}>
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

        <ControlPanel title="Export" icon={Download}>
          <button
            type="button"
            onClick={() => {
              setExportComplete(false);
              setExportOpen(true);
            }}
            className="group flex w-full items-center justify-center gap-2 rounded-2xl rb-gradient-primary px-4 py-4 text-sm font-black text-white shadow-[0_0_22px_rgba(192,132,252,0.28)] transition hover:-translate-y-0.5 hover:shadow-[0_0_30px_rgba(192,132,252,0.4)]"
          >
            <Download className="h-4 w-4 transition group-hover:-translate-y-0.5" />
            Export Card
          </button>
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            Finalize your card, then save, copy, or share it in a format tuned for social platforms.
          </p>
        </ControlPanel>
      </aside>

      {exportOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-md">
          <div className="glass w-full max-w-md rounded-[2rem] p-5 ring-1 ring-white/12">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-lg font-black text-white">
                  {exportComplete ? "Your Performance Card is Ready" : "Export Card"}
                </div>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  {exportComplete
                    ? "Share your verified trading journey with your community."
                    : "Finalize your card, then choose how you want to use it."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setExportOpen(false)}
                className="grid h-9 w-9 place-items-center rounded-full bg-white/[0.06] text-white transition hover:bg-white/[0.1]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {exportComplete && (
              <div className="mt-5 rounded-3xl border border-primary/20 bg-primary/10 p-4 text-sm font-semibold leading-relaxed text-violet-100">
                Your card has been finalized with a public RebateBoard verification record.
              </div>
            )}
            <div className="mt-5 grid gap-3">
              <ExportAction icon={Download} label="Download PNG" busy={exporting === "png"} onClick={() => exportCard("png")} />
              <ExportAction icon={Copy} label="Copy Image" busy={exporting === "copy"} onClick={() => exportCard("copy")} />
              <ExportAction icon={Share2} label="Share to Social" busy={exporting === "social"} onClick={openShareSheet} />
              <ExportAction icon={Eye} label="Open Verification Page" busy={exporting === "verify"} onClick={openVerificationPage} />
              <ExportAction icon={Eye} label="Full-screen Preview" busy={false} onClick={() => setPreviewOpen(true)} />
            </div>
            {shareSheetOpen && (
              <ShareSheet
                caption={getShareCaption(preset, getVerificationUrl((verificationRecord?.publicAssetId || publicAssetId)))}
                verificationUrl={getVerificationUrl((verificationRecord?.publicAssetId || publicAssetId))}
              />
            )}
          </div>
        </div>
      )}

      {previewOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/78 p-3 backdrop-blur-md sm:p-6">
          <button
            type="button"
            onClick={() => setPreviewOpen(false)}
            className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-white/[0.08] text-white ring-1 ring-white/12 transition hover:bg-white/[0.13]"
            aria-label="Close preview"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="mobile-scroll max-h-[90dvh] w-full max-w-6xl overflow-auto rounded-[2rem] bg-white/[0.035] p-3 ring-1 ring-white/10">
            {renderPerformanceCard()}
          </div>
        </div>
      )}
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

function ExportAction({
  icon: Icon,
  label,
  busy,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  busy: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={busy}
      onClick={onClick}
      className="flex items-center justify-between rounded-2xl bg-white/[0.045] px-4 py-3 text-left text-sm font-bold text-white ring-1 ring-white/8 transition hover:bg-white/[0.075] disabled:cursor-wait disabled:opacity-70"
    >
      <span className="inline-flex items-center gap-3">
        <span className="grid h-9 w-9 place-items-center rounded-2xl bg-primary/15 text-primary ring-1 ring-primary/20">
          <Icon className="h-4 w-4" />
        </span>
        {label}
      </span>
      <span className="text-xs font-semibold text-muted-foreground">{busy ? "Finalizing..." : "Ready"}</span>
    </button>
  );
}

function ShareSheet({ caption, verificationUrl }: { caption: string; verificationUrl: string }) {
  const [copied, setCopied] = useState(false);
  const encodedCaption = encodeURIComponent(caption);
  const encodedUrl = encodeURIComponent(verificationUrl);
  const shareTargets = [
    { label: "X", href: `https://twitter.com/intent/tweet?text=${encodedCaption}` },
    { label: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}` },
    { label: "LinkedIn", href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}` },
    { label: "Telegram", href: `https://t.me/share/url?url=${encodedUrl}&text=${encodedCaption}` },
    { label: "WhatsApp", href: `https://wa.me/?text=${encodedCaption}` },
  ];

  const copyCaption = async () => {
    await navigator.clipboard?.writeText(caption);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="mt-5 rounded-3xl border border-white/10 bg-white/[0.035] p-4">
      <div className="text-sm font-black text-white">Share to Social</div>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
        Most platforms accept a caption and verification link. Use Download PNG or Copy Image for the card artwork.
      </p>
      <div className="mt-3 rounded-2xl bg-black/20 p-3 text-xs leading-relaxed text-violet-100 ring-1 ring-white/8">
        {caption}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {shareTargets.map((target) => (
          <a
            key={target.label}
            href={target.href}
            target="_blank"
            rel="noreferrer"
            className="rounded-2xl bg-white/[0.055] px-3 py-2 text-center text-xs font-bold text-white ring-1 ring-white/8 transition hover:bg-white/[0.09]"
          >
            {target.label}
          </a>
        ))}
        <button
          type="button"
          onClick={copyCaption}
          className="rounded-2xl bg-primary/15 px-3 py-2 text-xs font-bold text-violet-100 ring-1 ring-primary/20 transition hover:bg-primary/20"
        >
          {copied ? "Copied" : "Copy Caption"}
        </button>
        <button
          type="button"
          onClick={() => window.open("https://www.instagram.com/", "_blank", "noopener,noreferrer")}
          className="rounded-2xl bg-white/[0.055] px-3 py-2 text-xs font-bold text-white ring-1 ring-white/8 transition hover:bg-white/[0.09]"
        >
          Instagram
        </button>
      </div>
    </div>
  );
}

function getVerificationUrl(publicAssetId: string) {
  const fallback = "https://rebateboard.com";
  if (typeof window === "undefined") return `${fallback}/verify/${publicAssetId}`;
  return `${window.location.origin}/verify/${publicAssetId}`;
}

function shortVerificationUrl(url: string) {
  try {
    const parsed = new URL(url);
    return `${parsed.host}/verify/${parsed.pathname.split("/").filter(Boolean).pop()}`;
  } catch {
    return url;
  }
}

function getShareCaption(preset: Preset, verificationUrl: string) {
  const opening: Record<Preset, string> = {
    overall: "My verified trading performance, tracked with RebateBoard.",
    net_profit: "My verified net performance, tracked with RebateBoard.",
    cashback: "My verified cashback achievement, tracked with RebateBoard.",
    payouts: "A new verified payout milestone.",
    best_month: "My best trading month, verified through RebateBoard.",
    funded: "My funded capital milestone, tracked with RebateBoard.",
    trader_level: "My RebateBoard trader progression, verified by RebateBoard.",
    streak: "My trading consistency milestone, tracked with RebateBoard.",
    custom: "My verified RebateBoard trading achievement.",
  };
  return `${opening[preset]}\n\nView the verified record:\n${verificationUrl}`;
}

function waitForNextPaint() {
  return new Promise<void>((resolve) => {
    window.requestAnimationFrame(() => window.requestAnimationFrame(() => resolve()));
  });
}

async function waitForImages(root: HTMLElement) {
  const images = Array.from(root.querySelectorAll("img"));
  await Promise.all(
    images.map((image) => {
      if (image.complete && image.naturalWidth > 0) return Promise.resolve();
      return new Promise<void>((resolve) => {
        image.onload = () => resolve();
        image.onerror = () => resolve();
      });
    }),
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

function QrMark({ platinum, url, compact = false }: { platinum: boolean; url: string; compact?: boolean }) {
  const src = `https://api.qrserver.com/v1/create-qr-code/?size=192x192&ecc=H&margin=12&data=${encodeURIComponent(url)}`;
  return (
    <div className={`grid ${compact ? "h-14 w-14" : "h-16 w-16"} shrink-0 place-items-center rounded-xl border p-1 ${
      platinum ? "border-slate-950/10 bg-white" : "border-white/12 bg-white"
    }`}>
      <img src={src} alt="Verification QR code" className="h-full w-full rounded-lg object-contain" crossOrigin="anonymous" />
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

function getPresetHeroMessage(preset: Preset) {
  const map: Record<Preset, string> = {
    overall: "Your Performance Speaks.",
    net_profit: "Built Through Discipline.",
    cashback: "Every Dollar Saved Matters.",
    payouts: "Verified Success.",
    best_month: "Your Best Month Yet.",
    funded: "Bigger Opportunities.",
    trader_level: "Progress Earned.",
    streak: "Consistency Wins.",
    custom: "Your Signature Moment.",
  };
  return map[preset];
}

function getPresetStory(preset: Preset) {
  const map: Record<Preset, string> = {
    overall: "A verified growth story from the RebateBoard Trader Return Tracker.",
    net_profit: "Net performance captured from tracked trading activity.",
    cashback: "Trading costs reduced through verified RebateBoard cashback.",
    payouts: "A payout milestone documented through RebateBoard performance tracking.",
    best_month: "A standout month worth turning into a verified achievement.",
    funded: "Funded capital tracked with a clean, institution-grade performance record.",
    trader_level: "Progression earned through activity, discipline, and platform contribution.",
    streak: "Consistency matters. Keep logging meaningful trading activity to build momentum.",
    custom: "A signature RebateBoard achievement designed for sharing.",
  };
  return map[preset];
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.download = filename;
  a.href = url;
  a.click();
  URL.revokeObjectURL(url);
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
