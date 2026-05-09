// Share Card builder — preview + visibility toggles + PNG export.
import { useMemo, useRef, useState } from "react";
import { Download, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useTrt, summarize, money } from "@/lib/trt-store";

type Preset = "overall" | "payouts" | "rebates" | "funded" | "best_month";

const PRESETS: { id: Preset; label: string }[] = [
  { id: "overall", label: "Overall ROI" },
  { id: "payouts", label: "Payout milestone" },
  { id: "rebates", label: "Rebates earned" },
  { id: "funded", label: "Funded capital" },
  { id: "best_month", label: "Best month" },
];

type Theme = "violet" | "emerald";

type Visibility = {
  avatar: boolean;
  name: boolean;
  handle: boolean;
  funded: boolean;
  payouts: boolean;
  net: boolean;
  roi: boolean;
  period: boolean;
};

export function ShareCardBuilder() {
  const { user } = useAuth();
  const trt = useTrt();
  const summary = useMemo(() => summarize(trt, "all"), [trt]);
  const [preset, setPreset] = useState<Preset>("overall");
  const [theme, setTheme] = useState<Theme>("violet");
  const [vis, setVis] = useState<Visibility>({
    avatar: true, name: true, handle: true, funded: true, payouts: true, net: true, roi: true, period: true,
  });
  const cardRef = useRef<HTMLDivElement>(null);

  const fundedAccounts = trt.accounts.filter((a) => a.status === "funded");
  const fundedCapital = fundedAccounts.reduce((s, a) => s + (a.size ?? 0), 0);
  const payoutsTotal = trt.transactions
    .filter((t) => t.category === "payout" && t.status !== "cancelled")
    .reduce((s, t) => s + t.amount, 0);
  const rebatesTotal = trt.transactions
    .filter((t) => t.category === "rebate" && t.status !== "cancelled")
    .reduce((s, t) => s + t.amount, 0);

  const headlines: Record<Preset, { kicker: string; metric: string }> = {
    overall: { kicker: "Overall ROI", metric: summary.roiPct == null ? "—" : `${summary.roiPct.toFixed(0)}%` },
    payouts: { kicker: "Payouts received", metric: money(payoutsTotal) },
    rebates: { kicker: "Rebates earned", metric: money(rebatesTotal) },
    funded: { kicker: "Funded capital", metric: money(fundedCapital) },
    best_month: { kicker: "Best month net", metric: money(Math.max(summary.net, 0)) },
  };

  const themeMap = {
    violet: "from-fuchsia-500 via-violet-600 to-indigo-700",
    emerald: "from-emerald-500 via-teal-600 to-cyan-700",
  } as const;

  const handle = user?.email?.split("@")[0] ?? "trader";

  const exportPng = async () => {
    if (!cardRef.current) return;
    try {
      const mod = await import("html-to-image");
      const url = await mod.toPng(cardRef.current, { pixelRatio: 2, backgroundColor: "#0d0721" });
      const a = document.createElement("a");
      a.download = `roi-${preset}-${Date.now()}.png`;
      a.href = url;
      a.click();
    } catch {
      alert("PNG export needs the html-to-image package. Install it to enable downloads.");
    }
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
      {/* Preview */}
      <div className="space-y-4">
        <div
          ref={cardRef}
          className={`relative aspect-[1.91/1] w-full overflow-hidden rounded-3xl bg-gradient-to-br ${themeMap[theme]} p-8 shadow-2xl`}
        >
          <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/15 blur-3xl" />
          <div className="absolute -bottom-24 -left-10 h-72 w-72 rounded-full bg-black/30 blur-3xl" />
          <div className="relative flex h-full flex-col">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/70">RebateBoard · Trader ROI</div>
                {vis.period && <div className="mt-1 text-[11px] text-white/60">Lifetime · {new Date().getFullYear()}</div>}
              </div>
              {vis.avatar && (
                <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white/20 text-sm font-bold text-white backdrop-blur ring-1 ring-white/30">
                  {(user?.name ?? "TR").slice(0, 2).toUpperCase()}
                </div>
              )}
            </div>

            <div className="mt-auto">
              <div className="text-xs font-semibold uppercase tracking-widest text-white/70">{headlines[preset].kicker}</div>
              <div className="mt-1 text-5xl font-black tracking-tight text-white drop-shadow-md sm:text-6xl">
                {headlines[preset].metric}
              </div>
              <div className="mt-3 grid grid-cols-3 gap-3 border-t border-white/20 pt-3 text-white">
                {vis.funded && (
                  <Cell label="Funded" value={money(fundedCapital)} />
                )}
                {vis.payouts && (
                  <Cell label="Payouts" value={money(payoutsTotal)} />
                )}
                {vis.net && (
                  <Cell label="Net" value={money(summary.net)} />
                )}
                {vis.roi && summary.roiPct != null && (
                  <Cell label="ROI" value={`${summary.roiPct.toFixed(0)}%`} />
                )}
              </div>
              {(vis.name || vis.handle) && (
                <div className="mt-4 text-xs text-white/80">
                  {vis.name && <span className="font-semibold text-white">{user?.name ?? "Trader"}</span>}
                  {vis.handle && <span className="ml-2 text-white/70">@{handle}</span>}
                </div>
              )}
            </div>
          </div>
        </div>
        <button
          onClick={exportPng}
          className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-600 px-4 py-2 text-sm font-bold text-white shadow-[0_0_22px_rgba(192,132,252,0.45)]"
        >
          <Download className="h-4 w-4" /> Download PNG
        </button>
      </div>

      {/* Controls */}
      <div className="space-y-4">
        <div>
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Preset</div>
          <div className="grid gap-1.5">
            {PRESETS.map((p) => (
              <button
                key={p.id}
                onClick={() => setPreset(p.id)}
                className={`rounded-lg px-3 py-2 text-left text-xs font-semibold transition ring-1 ${preset === p.id ? "bg-primary/20 text-white ring-primary/40" : "bg-white/[0.03] text-muted-foreground ring-white/5 hover:bg-white/[0.06]"}`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Theme</div>
          <div className="grid grid-cols-2 gap-1.5">
            {(["violet", "emerald"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTheme(t)}
                className={`rounded-lg px-2 py-2 text-[11px] font-semibold capitalize transition ring-1 ${theme === t ? "bg-white/10 text-white ring-white/20" : "bg-white/[0.03] text-muted-foreground ring-white/5"}`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Visible fields</div>
          <div className="space-y-1.5">
            {(Object.keys(vis) as (keyof Visibility)[]).map((k) => (
              <button
                key={k}
                onClick={() => setVis({ ...vis, [k]: !vis[k] })}
                className="glass flex w-full items-center justify-between rounded-lg px-3 py-1.5 text-xs text-white/90 ring-1 ring-white/10"
              >
                <span className="capitalize">{k}</span>
                {vis[k] ? <Eye className="h-3.5 w-3.5 text-success" /> : <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />}
              </button>
            ))}
          </div>
          <p className="mt-2 text-[10px] text-muted-foreground">
            Hidden fields stay private and never appear in downloads.
          </p>
        </div>
      </div>
    </div>
  );
}

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[9px] font-bold uppercase tracking-widest text-white/60">{label}</div>
      <div className="mt-0.5 text-sm font-bold tabular-nums">{value}</div>
    </div>
  );
}
