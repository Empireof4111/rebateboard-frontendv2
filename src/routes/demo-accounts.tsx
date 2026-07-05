import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Copy,
  ExternalLink,
  Flame,
  Globe,
  KeyRound,
  Monitor,
  Search,
  ShieldCheck,
} from "lucide-react";
import { ApiError } from "@/lib/api";
import {
  fetchPublicDemoAccounts,
  type DemoAccountPlatform,
  type DemoAccountRecord,
} from "@/lib/demo-accounts-api";
import { toast } from "@/components/superadmin/AdminActions";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export const Route = createFileRoute("/demo-accounts")({
  component: PublicDemoAccountsPage,
});

const PLATFORM_OPTIONS: Array<DemoAccountPlatform | "all"> = ["all", "MT4", "MT5", "cTrader", "DXtrade", "TradingView"];

const platformPillClass: Record<DemoAccountPlatform, string> = {
  MT4: "bg-sky-500/15 text-sky-300 ring-sky-400/30",
  MT5: "bg-fuchsia-500/15 text-fuchsia-300 ring-fuchsia-400/30",
  cTrader: "bg-emerald-500/15 text-emerald-300 ring-emerald-400/30",
  DXtrade: "bg-amber-500/15 text-amber-300 ring-amber-400/30",
  TradingView: "bg-violet-500/15 text-violet-300 ring-violet-400/30",
};

function PublicDemoAccountsPage() {
  const [rows, setRows] = useState<DemoAccountRecord[]>([]);
  const [stats, setStats] = useState({ total: 0, verified: 0, hot: 0, platforms: 0 });
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [platformFilter, setPlatformFilter] = useState<DemoAccountPlatform | "all">("all");

  useEffect(() => {
    void load();
  }, []);

  async function load(search = "", platform = "") {
    setLoading(true);
    try {
      const board = await fetchPublicDemoAccounts(search, platform);
      setRows(board.rows);
      setStats({
        total: board.stats.total,
        verified: board.stats.verified,
        hot: board.stats.hot,
        platforms: board.stats.platforms,
      });
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Unable to load demo accounts");
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return rows.filter((row) => {
      const matchesPlatform = platformFilter === "all" || row.platform === platformFilter;
      const matchesTerm =
        !term ||
        row.brand.toLowerCase().includes(term) ||
        row.plan.toLowerCase().includes(term) ||
        row.server.toLowerCase().includes(term);
      return matchesPlatform && matchesTerm;
    });
  }, [platformFilter, query, rows]);

  async function copyValue(label: string, value: string) {
    if (!value.trim()) return;
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} copied`);
    } catch {
      toast.error(`Unable to copy ${label.toLowerCase()}`);
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#3d1364_0%,#140821_55%,#0a0613_100%)] text-white">
      <SiteHeader />
      <main className="container-app space-y-6 py-8 sm:py-10">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-fuchsia-200 ring-1 ring-white/10">
              <Monitor className="h-3.5 w-3.5" />
              Live Demo Access
            </div>
            <h1 className="mt-4 text-3xl font-bold text-white md:text-5xl">
              Public Demo Accounts
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/70">
              Explore live demo credentials published by the RebateBoard team so traders can test platforms, execution, and program flow before committing real capital.
            </p>
          </div>

          <div className="grid w-full gap-3 sm:grid-cols-2 xl:w-auto xl:grid-cols-4">
            <PublicStat label="Live Accounts" value={String(stats.total)} hint="Published now" />
            <PublicStat label="Verified" value={String(stats.verified)} hint="QA checked" />
            <PublicStat label="Hot Picks" value={String(stats.hot)} hint="Featured sets" />
            <PublicStat label="Platforms" value={String(stats.platforms)} hint="Terminal mix" />
          </div>
        </div>

        <div className="rounded-[28px] border border-white/10 bg-white/[0.05] p-4 shadow-[0_30px_100px_rgba(10,6,30,0.55)] backdrop-blur-xl">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/45" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search brand, plan, or server..."
                className="w-full rounded-full border border-white/10 bg-white/[0.04] py-3 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-fuchsia-400/40 focus:bg-white/[0.08]"
              />
            </div>
            <select
              value={platformFilter}
              onChange={(event) => setPlatformFilter(event.target.value as DemoAccountPlatform | "all")}
              className="rounded-full border border-white/10 bg-[#1b0d33] px-4 py-3 text-sm text-white outline-none [color-scheme:dark]"
            >
              {PLATFORM_OPTIONS.map((platform) => (
                <option key={platform} value={platform}>
                  {platform === "all" ? "All platforms" : platform}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => void load(query, platformFilter === "all" ? "" : platformFilter)}
              className="rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-600 px-5 py-3 text-sm font-semibold text-white shadow-[0_0_26px_rgba(192,132,252,0.32)]"
            >
              Refresh list
            </button>
          </div>
        </div>

        {loading ? (
          <div className="rounded-[28px] border border-white/10 bg-white/[0.05] px-6 py-16 text-center text-sm text-white/65 backdrop-blur-xl">
            Loading live demo accounts...
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-white/10 bg-white/[0.04] px-6 py-16 text-center backdrop-blur-xl">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-white/10 text-fuchsia-300 ring-1 ring-white/10">
              <Globe className="h-6 w-6" />
            </div>
            <h2 className="mt-4 text-lg font-semibold text-white">No demo accounts match your filters</h2>
            <p className="mt-2 text-sm text-white/65">
              Try another platform or clear your search to see the currently published login sets.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {filtered.map((row) => (
              <article
                key={row.id}
                className="rounded-[28px] border border-white/10 bg-white/[0.05] p-5 shadow-[0_20px_60px_rgba(10,6,30,0.45)] backdrop-blur-xl"
              >
                <div className="flex items-start gap-4">
                  {row.logo ? (
                    <img src={row.logo} alt={row.brand} className="h-14 w-14 rounded-2xl object-cover ring-1 ring-white/10" />
                  ) : (
                    <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-fuchsia-500 to-violet-700 text-sm font-bold text-white ring-1 ring-white/10">
                      {row.brand
                        .split(" ")
                        .slice(0, 2)
                        .map((word) => word[0])
                        .join("")
                        .slice(0, 2)}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="truncate text-lg font-semibold text-white">{row.brand}</h2>
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 ${platformPillClass[row.platform as DemoAccountPlatform] ?? "bg-white/10 text-white ring-white/10"}`}>
                        {row.platform}
                      </span>
                      {row.verified ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-200 ring-1 ring-emerald-400/30">
                          <ShieldCheck className="h-3 w-3" />
                          Verified
                        </span>
                      ) : null}
                      {row.hot ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-200 ring-1 ring-amber-400/30">
                          <Flame className="h-3 w-3" />
                          Hot
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-sm text-white/70">{row.plan}</p>
                    <div className="mt-1 text-xs text-white/45">{row.category} · {row.countries}</div>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 md:grid-cols-2">
                  <CredentialCard icon={KeyRound} label="Account ID" value={row.accountId} onCopy={() => void copyValue("Account ID", row.accountId)} />
                  <CredentialCard icon={ShieldCheck} label="Password" value={row.password || "Not provided"} onCopy={row.password ? () => void copyValue("Password", row.password) : undefined} />
                  <CredentialCard icon={CheckCircle2} label="Investor Password" value={row.investorPassword || "Optional"} onCopy={row.investorPassword ? () => void copyValue("Investor password", row.investorPassword) : undefined} />
                  <CredentialCard icon={Monitor} label="Server" value={row.server || "Use platform default"} onCopy={row.server ? () => void copyValue("Server", row.server) : undefined} />
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-white/55">
                  <span className="rounded-full bg-white/10 px-2.5 py-1 ring-1 ring-white/10">
                    Credential v{row.credentialVersion}
                  </span>
                  {row.lastRotatedAt ? (
                    <span className="rounded-full bg-white/10 px-2.5 py-1 ring-1 ring-white/10">
                      Rotated {new Date(row.lastRotatedAt).toLocaleDateString()}
                    </span>
                  ) : null}
                </div>

                {row.notes ? (
                  <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm leading-relaxed text-white/70">
                    {row.notes}
                  </div>
                ) : null}

                <div className="mt-5 flex flex-wrap gap-3">
                  {row.terminalUrl ? (
                    <a
                      href={row.terminalUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-[0_0_20px_rgba(192,132,252,0.28)]"
                    >
                      Open Platform
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  ) : null}
                  <button
                    type="button"
                    onClick={() =>
                      void copyValue(
                        "Full login summary",
                        `${row.brand}\n${row.plan}\nPlatform: ${row.platform}\nAccount: ${row.accountId}\nPassword: ${row.password}\nInvestor Password: ${row.investorPassword}\nServer: ${row.server}`,
                      )
                    }
                    className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15"
                  >
                    <Copy className="h-4 w-4" />
                    Copy all
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}

function PublicStat({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.05] p-4 backdrop-blur-xl">
      <div className="text-[11px] uppercase tracking-[0.18em] text-white/40">{label}</div>
      <div className="mt-2 text-3xl font-bold text-white">{value}</div>
      <div className="mt-2 text-xs text-white/55">{hint}</div>
    </div>
  );
}

function CredentialCard({
  icon: Icon,
  label,
  value,
  onCopy,
}: {
  icon: typeof KeyRound;
  label: string;
  value: string;
  onCopy?: () => void;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/40">
          <Icon className="h-3.5 w-3.5 text-fuchsia-300" />
          {label}
        </div>
        {onCopy ? (
          <button
            type="button"
            onClick={onCopy}
            className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-white/15"
          >
            <Copy className="h-3 w-3" />
            Copy
          </button>
        ) : null}
      </div>
      <div className="mt-3 break-all text-sm font-semibold text-white">{value}</div>
    </div>
  );
}
