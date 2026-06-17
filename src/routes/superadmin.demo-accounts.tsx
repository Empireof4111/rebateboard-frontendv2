import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  CheckCircle2,
  Flame,
  Globe,
  KeyRound,
  Monitor,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { DataTable, PageHeader, Panel, Pill, StatCard } from "@/components/superadmin/AdminUI";
import { toast } from "@/components/superadmin/AdminActions";

export const Route = createFileRoute("/superadmin/demo-accounts")({
  component: DemoAccountsPage,
});

type DemoPlatform = "MT4" | "MT5" | "cTrader" | "DXtrade" | "TradingView";

type DemoAccount = {
  id: string;
  brand: string;
  slug: string;
  plan: string;
  category: string;
  platform: DemoPlatform;
  countries: string;
  accountId: string;
  server: string;
  verified: boolean;
  hot: boolean;
};

const DEMO_ROWS: DemoAccount[] = [
  {
    id: "demo_1",
    brand: "FTMO Pro",
    slug: "ftmo-pro",
    plan: "2-Step Evaluation · 100K",
    category: "Prop Firm",
    platform: "MT5",
    countries: "Global",
    accountId: "5200184",
    server: "FTMO-Demo",
    verified: true,
    hot: true,
  },
  {
    id: "demo_2",
    brand: "FundedNext Stellar",
    slug: "fundednext-stellar",
    plan: "Stellar 2-Step · 50K",
    category: "Prop Firm",
    platform: "MT4",
    countries: "Global",
    accountId: "70034221",
    server: "FundedNext-Demo01",
    verified: true,
    hot: false,
  },
  {
    id: "demo_3",
    brand: "Apex Trader Funding",
    slug: "apex-trader-funding",
    plan: "Static 50K Futures",
    category: "Futures Prop Firm",
    platform: "TradingView",
    countries: "Global",
    accountId: "APX-44211",
    server: "Apex-FuturesLive",
    verified: true,
    hot: true,
  },
  {
    id: "demo_4",
    brand: "The5ers",
    slug: "the5ers",
    plan: "Bootcamp · 100K",
    category: "Prop Firm",
    platform: "MT5",
    countries: "Global",
    accountId: "T5-782144",
    server: "The5ers-Demo02",
    verified: true,
    hot: false,
  },
  {
    id: "demo_5",
    brand: "Maven Trading",
    slug: "maven-trading",
    plan: "1-Step · 25K",
    category: "Prop Firm",
    platform: "cTrader",
    countries: "Global",
    accountId: "MVN-12209",
    server: "Maven-cTrader",
    verified: false,
    hot: false,
  },
  {
    id: "demo_6",
    brand: "Crypto Fund Trader",
    slug: "crypto-fund-trader",
    plan: "Instant · 10K",
    category: "Crypto Prop Firm",
    platform: "DXtrade",
    countries: "Selected regions",
    accountId: "CFT-91024",
    server: "CFT-DX-Live",
    verified: false,
    hot: false,
  },
];

const PLATFORM_OPTIONS: Array<DemoPlatform | "all"> = ["all", "MT4", "MT5", "cTrader", "DXtrade", "TradingView"];

const platformPillClass: Record<DemoPlatform, string> = {
  MT4: "bg-sky-500/15 text-sky-300 ring-sky-400/30",
  MT5: "bg-fuchsia-500/15 text-fuchsia-300 ring-fuchsia-400/30",
  cTrader: "bg-emerald-500/15 text-emerald-300 ring-emerald-400/30",
  DXtrade: "bg-amber-500/15 text-amber-300 ring-amber-400/30",
  TradingView: "bg-violet-500/15 text-violet-300 ring-violet-400/30",
};

function DemoAccountsPage() {
  const [query, setQuery] = useState("");
  const [platformFilter, setPlatformFilter] = useState<DemoPlatform | "all">("all");
  const rows = DEMO_ROWS;

  const filteredRows = useMemo(() => {
    const term = query.trim().toLowerCase();

    return rows.filter((row) => {
      const matchesTerm =
        !term ||
        row.brand.toLowerCase().includes(term) ||
        row.plan.toLowerCase().includes(term) ||
        row.server.toLowerCase().includes(term);

      const matchesPlatform = platformFilter === "all" || row.platform === platformFilter;

      return matchesTerm && matchesPlatform;
    });
  }, [platformFilter, query, rows]);

  const metrics = useMemo(() => {
    const verified = rows.filter((row) => row.verified).length;
    const hot = rows.filter((row) => row.hot).length;
    const platforms = new Set(rows.map((row) => row.platform));

    return {
      total: rows.length,
      verified,
      platforms: platforms.size,
      platformLabels: [...platforms].sort().join(" · "),
      hot,
    };
  }, [rows]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Prop Firm Demo Accounts"
        subtitle="Manage the public demo logins shown on /demo-accounts. Each row is published live."
        actions={
          <>
            <button
              type="button"
              onClick={() => toast.info("Public demo accounts page can be linked once the public route is ready")}
              className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15"
            >
              <Globe className="h-4 w-4" />
              View public page
            </button>
            <button
              type="button"
              onClick={() => toast.success("New demo account flow ready for connection")}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-[0_0_24px_rgba(192,132,252,0.28)]"
            >
              <Plus className="h-4 w-4" />
              New Demo Account
            </button>
          </>
        }
      />

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Demo Accounts" value={String(metrics.total)} delta="Public" tone="flat" />
        <StatCard label="Verified" value={String(metrics.verified)} delta="QA passed" tone="up" />
        <StatCard label="Platforms" value={String(metrics.platforms)} delta={metrics.platformLabels} tone="flat" />
        <StatCard label="Hot Picks" value={String(metrics.hot)} delta="Promoted" tone="up" />
      </div>

      <Panel title={`Demo Accounts — ${filteredRows.length}`} action={<Pill tone="neutral">Published live</Pill>}>
        <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search brand or plan..."
              className="w-full rounded-full border border-white/10 bg-white/[0.04] py-2.5 pl-10 pr-4 text-sm text-white outline-none transition placeholder:text-muted-foreground focus:border-fuchsia-400/40 focus:bg-white/[0.07]"
            />
          </div>

          <select
            value={platformFilter}
            onChange={(event) => setPlatformFilter(event.target.value as DemoPlatform | "all")}
            className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white outline-none transition focus:border-fuchsia-400/40"
          >
            {PLATFORM_OPTIONS.map((platform) => (
              <option key={platform} value={platform} className="bg-[#150829] text-white">
                {platform === "all" ? "All platforms" : platform}
              </option>
            ))}
          </select>
        </div>

        <DataTable
          head={
            <>
              <th>Brand</th>
              <th>Platform</th>
              <th>Plan</th>
              <th>Countries</th>
              <th>Account</th>
              <th>Server</th>
              <th>Flags</th>
              <th>Actions</th>
            </>
          }
        >
          {filteredRows.map((row) => (
            <tr key={row.id}>
              <td>
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-fuchsia-500/70 to-violet-600/70 text-xs font-bold text-white ring-1 ring-white/10">
                    {row.brand
                      .split(" ")
                      .slice(0, 2)
                      .map((word) => word[0])
                      .join("")
                      .slice(0, 2)}
                  </div>
                  <div>
                    <div className="font-semibold text-white">{row.brand}</div>
                    <div className="text-xs text-muted-foreground">{row.slug}</div>
                  </div>
                </div>
              </td>
              <td>
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 ${platformPillClass[row.platform]}`}>
                  {row.platform}
                </span>
              </td>
              <td className="text-white/85">{row.plan}</td>
              <td className="text-xs text-muted-foreground">{row.countries}</td>
              <td className="font-mono text-sm font-semibold text-white">{row.accountId}</td>
              <td className="text-sm text-white/85">{row.server}</td>
              <td>
                <div className="flex flex-wrap gap-1.5">
                  {row.verified ? (
                    <Pill tone="good">
                      <span className="inline-flex items-center gap-1">
                        <ShieldCheck className="h-3 w-3" />
                        Verified
                      </span>
                    </Pill>
                  ) : (
                    <Pill tone="warn">
                      <span className="inline-flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Pending QA
                      </span>
                    </Pill>
                  )}
                  {row.hot ? (
                    <Pill tone="warn">
                      <span className="inline-flex items-center gap-1">
                        <Flame className="h-3 w-3" />
                        Hot
                      </span>
                    </Pill>
                  ) : null}
                </div>
              </td>
              <td>
                <div className="flex items-center gap-2">
                  <IconActionButton
                    label={`Edit ${row.brand}`}
                    icon={Pencil}
                    onClick={() => toast.info(`Editing ${row.brand}`)}
                  />
                  <IconActionButton
                    label={`Rotate credentials for ${row.brand}`}
                    icon={KeyRound}
                    onClick={() => toast.success(`Credential rotation queued for ${row.brand}`)}
                  />
                  <IconActionButton
                    label={`Delete ${row.brand}`}
                    icon={Trash2}
                    tone="danger"
                    onClick={() => toast.error(`${row.brand} removed from demo accounts`)}
                  />
                </div>
              </td>
            </tr>
          ))}
        </DataTable>
      </Panel>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Panel title="Publishing notes" action={<Monitor className="h-3.5 w-3.5 text-fuchsia-300" />}>
          <div className="grid gap-3 md:grid-cols-3">
            <InfoCard
              title="Credential hygiene"
              text="Use login sets created only for demo exposure. Rotate passwords whenever a row is edited or unpublished."
            />
            <InfoCard
              title="Verification policy"
              text="Only QA-passed accounts should carry the verified flag. Pending rows stay visible internally but should not be promoted."
            />
            <InfoCard
              title="Hot pick logic"
              text="Use the hot flag for the few accounts you want highlighted on the public experience without changing the full list."
            />
          </div>
        </Panel>

        <Panel title="Platform mix" action={<Pill tone="neutral">{metrics.platforms} live platforms</Pill>}>
          <div className="space-y-3">
            {PLATFORM_OPTIONS.filter((platform): platform is DemoPlatform => platform !== "all").map((platform) => {
              const count = rows.filter((row) => row.platform === platform).length;
              const pct = rows.length > 0 ? Math.round((count / rows.length) * 100) : 0;

              return (
                <div key={platform}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="font-semibold text-white">{platform}</span>
                    <span className="text-muted-foreground">
                      {count} · {pct}%
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-white/10">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>
      </div>
    </div>
  );
}

function InfoCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 ring-1 ring-white/5">
      <div className="text-sm font-semibold text-white">{title}</div>
      <div className="mt-1 text-xs leading-relaxed text-muted-foreground">{text}</div>
    </div>
  );
}

function IconActionButton({
  icon: Icon,
  label,
  onClick,
  tone = "neutral",
}: {
  icon: typeof Pencil;
  label: string;
  onClick: () => void;
  tone?: "neutral" | "danger";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`grid h-9 w-9 place-items-center rounded-full transition ${
        tone === "danger"
          ? "bg-rose-500/10 text-rose-300 hover:bg-rose-500/20"
          : "bg-white/10 text-white hover:bg-white/15"
      }`}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}
