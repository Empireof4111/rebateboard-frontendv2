import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel, StatCard, Pill } from "@/components/dashboard/Primitives";
import { Sparkles } from "lucide-react";

export const Route = createFileRoute("/dashboard/analytics")({
  component: AnalyticsPage,
});

function Bar({ label, value, max }: { label: string; value: number; max: number }) {
  return (
    <div className="text-xs">
      <div className="mb-1 flex justify-between"><span className="text-muted-foreground">{label}</span><span className="font-semibold text-white">{value > 0 ? "+" : ""}{value}R</span></div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-white/5">
        <div className={`h-full ${value > 0 ? "bg-success" : "bg-destructive"}`} style={{ width: `${(Math.abs(value) / max) * 100}%` }} />
      </div>
    </div>
  );
}

function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Analytics" subtitle="Deep performance breakdowns across every dimension." />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Win Rate" value="62%" trend="up" accent="success" />
        <StatCard label="Avg R" value="+0.42" trend="up" accent="primary" />
        <StatCard label="Profit Factor" value="2.1" trend="up" accent="success" />
        <StatCard label="Max Drawdown" value="−$1,240" trend="down" accent="destructive" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Strategy Performance">
          <div className="space-y-3">
            <Bar label="Strategy A — Breakouts" value={9.4} max={10} />
            <Bar label="Strategy B — Mean Revert" value={4.2} max={10} />
            <Bar label="Strategy C — News" value={-2.1} max={10} />
          </div>
        </Panel>
        <Panel title="Session Performance">
          <div className="space-y-3">
            <Bar label="London" value={7.8} max={10} />
            <Bar label="NY" value={-1.4} max={10} />
            <Bar label="Asia" value={1.2} max={10} />
          </div>
        </Panel>
        <Panel title="Emotion Performance">
          <div className="space-y-3">
            <Bar label="Calm" value={6.5} max={10} />
            <Bar label="FOMO" value={-3.2} max={10} />
            <Bar label="Revenge" value={-4.1} max={10} />
          </div>
        </Panel>
        <Panel title="Firm Performance">
          <div className="space-y-3">
            <Bar label="FTMO" value={5.8} max={10} />
            <Bar label="MyForexFunds" value={2.1} max={10} />
            <Bar label="The5ers" value={-0.8} max={10} />
          </div>
        </Panel>
      </div>

      <Panel title="Best Conditions Engine" action={<Pill tone="primary"><Sparkles className="h-3 w-3" />AI</Pill>}>
        <p className="text-sm text-white">You perform best:</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Pill tone="success">London session</Pill>
          <Pill tone="success">EURUSD</Pill>
          <Pill tone="success">Strategy A · Breakouts</Pill>
          <Pill tone="success">Calm state</Pill>
          <Pill tone="success">Tuesday – Thursday</Pill>
        </div>
      </Panel>
    </div>
  );
}
