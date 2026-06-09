import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Activity, Building2, AlertTriangle, TrendingUp,
} from "lucide-react";
import { PageHeader, Panel, Pill, StatCard } from "@/components/dashboard/Primitives";
import { useAuth } from "@/lib/auth";
import { financeApi } from "@/lib/finance-api";

export const Route = createFileRoute("/superadmin/trt")({
  head: () => ({
    meta: [{ title: "Trader ROI Tracker — Admin" }],
  }),
  component: SuperadminTrtPage,
});

function money(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 });
}

type TrtData = {
  totalSpend: number;
  totalIncome: number;
  net: number;
  trueRoi: number;
  transactions: number;
  avgTxSize: number;
  activeAccounts: number;
  funded: number;
  spendByBrand: { brand: string; spend: number; income: number; net: number }[];
  categoryMix: { category: string; amount: number }[];
};

function SuperadminTrtPage() {
  const { token } = useAuth();
  const [data, setData] = useState<TrtData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    financeApi.getTrtAnalytics(token).then((res) => {
      if (res.success) setData(res.payload as TrtData);
    }).finally(() => setLoading(false));
  }, [token]);

  const d = data;
  const maxBrandSpend = Math.max(1, ...(d?.spendByBrand.map((b) => b.spend) ?? [1]));
  const maxCatAmount = Math.max(1, ...(d?.categoryMix.map((c) => c.amount) ?? [1]));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Trader ROI Tracker — Analytics"
        subtitle="Aggregate spend, income, ROI, and behavioral insights across all traders using the TRT module."
        actions={<Pill tone="primary"><Activity className="h-3 w-3" /> Live</Pill>}
      />

      {loading && (
        <div className="flex items-center justify-center py-24 text-muted-foreground text-sm">Loading TRT analytics…</div>
      )}

      {!loading && (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
            <StatCard label="Total spend" value={money(d?.totalSpend ?? 0)} accent="warning" />
            <StatCard label="Total income" value={money(d?.totalIncome ?? 0)} accent="success" />
            <StatCard label="Net" value={money(d?.net ?? 0)} accent={(d?.net ?? 0) >= 0 ? "success" : "destructive"} trend={(d?.net ?? 0) >= 0 ? "up" : "down"} />
            <StatCard label="True ROI" value={d ? `${d.trueRoi.toFixed(0)}%` : "—"} accent="primary" />
            <StatCard label="Transactions" value={(d?.transactions ?? 0).toString()} />
            <StatCard label="Avg tx size" value={money(d?.avgTxSize ?? 0)} />
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatCard label="Active accounts" value={(d?.activeAccounts ?? 0).toString()} accent="primary" />
            <StatCard label="Funded" value={(d?.funded ?? 0).toString()} accent="success" />
            <StatCard label="Cost recovery" value={d && d.totalSpend > 0 ? `${Math.min(100, (d.totalIncome / d.totalSpend) * 100).toFixed(0)}%` : "—"} accent="warning" />
            <StatCard label="Brands tracked" value={(d?.spendByBrand.length ?? 0).toString()} hint="in directory" />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Panel title="Spend by brand (top 10)" action={<Building2 className="h-3.5 w-3.5 text-muted-foreground" />}>
              {(d?.spendByBrand ?? []).length === 0 ? (
                <p className="text-xs text-muted-foreground py-4">No brand data yet.</p>
              ) : (
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
                    {(d?.spendByBrand ?? []).map((b) => (
                      <tr key={b.brand} className="border-b border-white/5 text-white/90">
                        <td className="py-2.5">
                          <div className="flex items-center gap-2">
                            <span>{b.brand}</span>
                            <div className="h-1.5 w-16 overflow-hidden rounded-full bg-white/5">
                              <div className="h-full bg-fuchsia-500/60" style={{ width: `${(b.spend / maxBrandSpend) * 100}%` }} />
                            </div>
                          </div>
                        </td>
                        <td className="text-right tabular-nums text-destructive">{money(b.spend)}</td>
                        <td className="text-right tabular-nums text-success">{money(b.income)}</td>
                        <td className={`text-right font-semibold tabular-nums ${b.net >= 0 ? "text-success" : "text-destructive"}`}>{money(b.net)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Panel>

            <Panel title="Category mix" action={<Pill>{(d?.categoryMix.length ?? 0)} categories</Pill>}>
              {(d?.categoryMix ?? []).length === 0 ? (
                <p className="text-xs text-muted-foreground py-4">No category data yet.</p>
              ) : (
                <ul className="space-y-2">
                  {(d?.categoryMix ?? []).map((c) => (
                    <li key={c.category}>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-white/90 capitalize">{c.category.replace(/_/g, " ")}</span>
                        <span className="tabular-nums text-muted-foreground">{money(c.amount)}</span>
                      </div>
                      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                        <div className="h-full bg-gradient-to-r from-fuchsia-500 to-violet-600" style={{ width: `${(c.amount / maxCatAmount) * 100}%` }} />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Panel title="Platform totals" action={<TrendingUp className="h-3.5 w-3.5 text-success" />}>
              <ul className="space-y-2 text-xs">
                <li className="flex justify-between"><span className="text-muted-foreground">Total spend</span><span className="font-semibold text-destructive tabular-nums">{money(d?.totalSpend ?? 0)}</span></li>
                <li className="flex justify-between"><span className="text-muted-foreground">Total income</span><span className="font-semibold text-success tabular-nums">{money(d?.totalIncome ?? 0)}</span></li>
                <li className="flex justify-between"><span className="text-muted-foreground">Net</span><span className={`font-semibold tabular-nums ${(d?.net ?? 0) >= 0 ? "text-success" : "text-destructive"}`}>{money(d?.net ?? 0)}</span></li>
                <li className="flex justify-between"><span className="text-muted-foreground">Transactions</span><span className="tabular-nums">{d?.transactions ?? 0}</span></li>
                <li className="flex justify-between"><span className="text-muted-foreground">Avg tx size</span><span className="tabular-nums">{money(d?.avgTxSize ?? 0)}</span></li>
              </ul>
            </Panel>

            <Panel title="Performance signals" action={<Pill tone="primary">Auto</Pill>}>
              {!d ? (
                <p className="text-xs text-muted-foreground">Loading…</p>
              ) : (
                <ul className="space-y-2 text-xs">
                  {d.trueRoi > 20 && (
                    <li className="rounded-lg bg-emerald-500/10 p-2.5">
                      <div className="font-semibold text-emerald-300">Strong ROI</div>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">Platform ROI is {d.trueRoi.toFixed(1)}% — well above breakeven.</p>
                    </li>
                  )}
                  {d.trueRoi < 0 && (
                    <li className="rounded-lg bg-red-500/10 p-2.5">
                      <div className="font-semibold text-red-300">Negative ROI</div>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">Platform spend exceeds income. Review cashback configurations.</p>
                    </li>
                  )}
                  {d.funded < d.activeAccounts * 0.3 && d.activeAccounts > 0 && (
                    <li className="rounded-lg bg-amber-500/10 p-2.5">
                      <div className="font-semibold text-amber-300">Low funded ratio</div>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">Only {d.funded} of {d.activeAccounts} accounts funded — conversion may need attention.</p>
                    </li>
                  )}
                  {d.spendByBrand.length === 0 && (
                    <li className="rounded-lg bg-white/[0.03] p-2.5">
                      <div className="font-semibold">No brand data yet</div>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">Insights activate once cashback entries are recorded.</p>
                    </li>
                  )}
                </ul>
              )}
            </Panel>

            <Panel title="Risk signals" action={<AlertTriangle className="h-3.5 w-3.5 text-accent" />}>
              <ul className="space-y-2 text-xs text-white/90">
                <li className="rounded-lg bg-white/[0.03] p-2.5">
                  <div className="font-semibold">Cost recovery rate</div>
                  <div className="text-[11px] text-muted-foreground">
                    {d && d.totalSpend > 0 ? `${Math.min(100, (d.totalIncome / d.totalSpend) * 100).toFixed(0)}% of spend recovered via rebates` : "No spend data yet"}
                  </div>
                </li>
                <li className="rounded-lg bg-white/[0.03] p-2.5">
                  <div className="font-semibold">Brand concentration</div>
                  <div className="text-[11px] text-muted-foreground">
                    {d && d.spendByBrand.length > 0
                      ? `Top brand accounts for ${Math.round((d.spendByBrand[0].spend / Math.max(d.totalSpend, 1)) * 100)}% of total spend`
                      : "No brand data yet"}
                  </div>
                </li>
                <li className="rounded-lg bg-white/[0.03] p-2.5">
                  <div className="font-semibold">Account funding rate</div>
                  <div className="text-[11px] text-muted-foreground">
                    {d && d.activeAccounts > 0 ? `${d.funded}/${d.activeAccounts} accounts funded (${Math.round((d.funded / d.activeAccounts) * 100)}%)` : "No account data yet"}
                  </div>
                </li>
              </ul>
            </Panel>
          </div>
        </>
      )}
    </div>
  );
}
