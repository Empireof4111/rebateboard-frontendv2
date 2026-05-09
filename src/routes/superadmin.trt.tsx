// Superadmin — Trader ROI Tracker analytics.
// Aggregates the (demo) TRT store. In production this would query a Cloud
// view across all users. The shape is identical so the UI ports cleanly.
import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import {
  Activity, BarChart3, Wallet, Building2, AlertTriangle, TrendingUp, Users,
} from "lucide-react";
import { PageHeader, Panel, Pill, StatCard } from "@/components/dashboard/Primitives";
import {
  useTrt, summarize, breakdownByBrand, breakdownByCategory, generateInsights,
  money, labelCategory,
} from "@/lib/trt-store";

export const Route = createFileRoute("/superadmin/trt")({
  head: () => ({
    meta: [{ title: "Trader ROI Tracker — Admin" }],
  }),
  component: SuperadminTrtPage,
});

function SuperadminTrtPage() {
  const trt = useTrt();
  const all = useMemo(() => summarize(trt, "all"), [trt]);
  const last30 = useMemo(() => summarize(trt, "30d"), [trt]);
  const byBrand = useMemo(() => breakdownByBrand(trt, "all").slice(0, 10), [trt]);
  const byCat = useMemo(() => breakdownByCategory(trt, "all"), [trt]);
  const insights = useMemo(() => generateInsights(trt), [trt]);

  // Derived aggregate metrics
  const customBrands = useMemo(() => {
    const set = new Set<string>();
    for (const t of trt.transactions) if (t.brand.custom) set.add(t.brand.id);
    return set.size;
  }, [trt]);
  const fundedAccounts = trt.accounts.filter((a) => a.status === "funded").length;
  const breachedAccounts = trt.accounts.filter((a) => a.status === "breached").length;
  const avgTx = all.txCount === 0 ? 0 : (all.income + all.expense) / all.txCount;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Trader ROI Tracker — Analytics"
        subtitle="Aggregate spend, income, ROI, and behavioral insights across all traders using the TRT module."
        actions={<Pill tone="primary"><Activity className="h-3 w-3" /> Live</Pill>}
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Total spend" value={money(all.expense)} accent="warning" />
        <StatCard label="Total income" value={money(all.income)} accent="success" />
        <StatCard label="Net" value={money(all.net)} accent={all.net >= 0 ? "success" : "destructive"} trend={all.net >= 0 ? "up" : "down"} />
        <StatCard label="True ROI" value={all.roiPct == null ? "—" : `${all.roiPct.toFixed(0)}%`} accent="primary" />
        <StatCard label="Transactions" value={all.txCount.toString()} />
        <StatCard label="Avg tx size" value={money(avgTx)} />
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Active accounts" value={trt.accounts.length.toString()} accent="primary" />
        <StatCard label="Funded" value={fundedAccounts.toString()} accent="success" />
        <StatCard label="Breached" value={breachedAccounts.toString()} accent="destructive" />
        <StatCard label="Custom brands logged" value={customBrands.toString()} accent="warning" hint="Not in directory" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Spend by brand (top 10)" action={<Building2 className="h-3.5 w-3.5 text-muted-foreground" />}>
          <table className="w-full text-xs">
            <thead className="text-left text-muted-foreground">
              <tr className="border-b border-white/5">
                <th className="py-2 font-medium">Brand</th>
                <th className="text-right font-medium">Spend</th>
                <th className="text-right font-medium">Income</th>
                <th className="text-right font-medium">Net</th>
              </tr>
            </thead>
            <tbody>
              {byBrand.map((b) => {
                const net = b.income - b.expense;
                return (
                  <tr key={b.brand.id} className="border-b border-white/5 text-white/90">
                    <td className="py-2.5">
                      {b.brand.name}
                      {b.brand.custom && <span className="ml-1.5 rounded bg-fuchsia-500/20 px-1 text-[9px] font-bold text-fuchsia-200">CUSTOM</span>}
                    </td>
                    <td className="text-right tabular-nums text-destructive">{money(b.expense)}</td>
                    <td className="text-right tabular-nums text-success">{money(b.income)}</td>
                    <td className={`text-right font-semibold tabular-nums ${net >= 0 ? "text-success" : "text-destructive"}`}>{money(net)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Panel>

        <Panel title="Category mix" action={<Pill>{byCat.length} categories</Pill>}>
          <ul className="space-y-2">
            {byCat
              .map((c) => ({ ...c, total: c.income + c.expense }))
              .sort((a, b) => b.total - a.total)
              .map((c) => {
                const max = Math.max(1, ...byCat.map((x) => x.income + x.expense));
                const pct = (c.total / max) * 100;
                return (
                  <li key={c.category}>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-white/90">{labelCategory(c.category)}</span>
                      <span className="tabular-nums text-muted-foreground">{money(c.total)}</span>
                    </div>
                    <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                      <div className="h-full bg-gradient-to-r from-fuchsia-500 to-violet-600" style={{ width: `${pct}%` }} />
                    </div>
                  </li>
                );
              })}
          </ul>
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="This month vs lifetime" action={<TrendingUp className="h-3.5 w-3.5 text-success" />}>
          <ul className="space-y-2 text-xs">
            <li className="flex justify-between"><span className="text-muted-foreground">30d spend</span><span className="font-semibold text-destructive tabular-nums">{money(last30.expense)}</span></li>
            <li className="flex justify-between"><span className="text-muted-foreground">30d income</span><span className="font-semibold text-success tabular-nums">{money(last30.income)}</span></li>
            <li className="flex justify-between"><span className="text-muted-foreground">30d net</span><span className={`font-semibold tabular-nums ${last30.net >= 0 ? "text-success" : "text-destructive"}`}>{money(last30.net)}</span></li>
            <li className="flex justify-between"><span className="text-muted-foreground">30d txns</span><span className="tabular-nums">{last30.txCount}</span></li>
          </ul>
        </Panel>

        <Panel title="Surfaced insights" action={<Pill tone="primary">Auto</Pill>}>
          {insights.length === 0 ? (
            <p className="text-xs text-muted-foreground">No insights yet — engine activates after a few transactions.</p>
          ) : (
            <ul className="space-y-2 text-xs">
              {insights.slice(0, 4).map((i) => (
                <li key={i.id} className="rounded-lg bg-white/[0.03] p-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white">{i.title}</span>
                    <Pill tone={i.tone === "leak" ? "destructive" : i.tone === "watch" ? "warning" : "success"}>
                      {i.tone}
                    </Pill>
                  </div>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">{i.body}</p>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Risk signals" action={<AlertTriangle className="h-3.5 w-3.5 text-accent" />}>
          <ul className="space-y-2 text-xs text-white/90">
            <li className="rounded-lg bg-white/[0.03] p-2.5">
              <div className="font-semibold">Failed prop fee burden</div>
              <div className="text-[11px] text-muted-foreground">
                Lifetime challenge + reset spend: {money(
                  trt.transactions
                    .filter((t) => t.direction === "expense" && (t.category === "challenge_fee" || t.category === "reset_fee"))
                    .reduce((s, t) => s + t.amount, 0),
                )}
              </div>
            </li>
            <li className="rounded-lg bg-white/[0.03] p-2.5">
              <div className="font-semibold">Custom brand growth</div>
              <div className="text-[11px] text-muted-foreground">
                {customBrands} custom brands created — review for directory inclusion candidates.
              </div>
            </li>
            <li className="rounded-lg bg-white/[0.03] p-2.5">
              <div className="font-semibold">Cost recovery rate</div>
              <div className="text-[11px] text-muted-foreground">
                {all.expense === 0 ? "—" : `${Math.min(100, (all.income / all.expense) * 100).toFixed(0)}% of trader spend recovered`}
              </div>
            </li>
          </ul>
        </Panel>
      </div>

      <Panel title="Latest transactions (across users)" action={<Users className="h-3.5 w-3.5 text-muted-foreground" />}>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="text-left text-muted-foreground">
              <tr className="border-b border-white/5">
                <th className="py-2 font-medium">Date</th>
                <th className="font-medium">Direction</th>
                <th className="font-medium">Type</th>
                <th className="font-medium">Brand</th>
                <th className="text-right font-medium">Amount</th>
              </tr>
            </thead>
            <tbody>
              {trt.transactions.slice(0, 10).map((t) => (
                <tr key={t.id} className="border-b border-white/5 text-white/90">
                  <td className="py-2.5 whitespace-nowrap">{new Date(t.date).toLocaleDateString()}</td>
                  <td className="capitalize">{t.direction}</td>
                  <td>{labelCategory(t.category)}</td>
                  <td>{t.brand.name}</td>
                  <td className={`text-right font-semibold tabular-nums ${t.direction === "income" ? "text-success" : "text-destructive"}`}>
                    {t.direction === "income" ? "+" : "−"}{money(t.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
