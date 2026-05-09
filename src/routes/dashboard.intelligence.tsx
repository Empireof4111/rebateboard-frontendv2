import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, StatCard, Panel, Pill } from "@/components/dashboard/Primitives";
import { Brain, AlertTriangle, Target, Sparkles } from "lucide-react";

export const Route = createFileRoute("/dashboard/intelligence")({
  component: IntelligencePage,
});

function IntelligencePage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Intelligence" subtitle="Your performance, behavior, and what to fix next." />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Net PnL (30d)" value="+$3,820" trend="up" accent="success" />
        <StatCard label="ROI (30d)" value="+18.4%" trend="up" accent="primary" />
        <StatCard label="Trader Score" value="7.4 / 10" accent="primary" />
        <StatCard label="Mistake Cost" value="−$1,210" hint="Recoverable" accent="warning" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Your Weakest Area" action={<Pill tone="warning">Focus</Pill>}>
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-warning/15">
              <AlertTriangle className="h-5 w-5 text-accent" />
            </div>
            <div>
              <div className="text-base font-semibold text-white">Discipline · 6.2</div>
              <p className="text-xs text-muted-foreground">You break risk rules ~3× per week. Tightening this lifts ROI by an est. +6.8%.</p>
            </div>
          </div>
        </Panel>

        <Panel title="Focus Today" action={<Pill tone="primary">AI</Pill>}>
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary/15">
              <Target className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="text-base font-semibold text-white">Avoid overtrading after losses</div>
              <p className="text-xs text-muted-foreground">Your last 12 revenge trades cost a combined −$840.</p>
            </div>
          </div>
        </Panel>
      </div>

      <Panel title="Behavior Tracking">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 text-xs">
          {[
            { k: "Patience", v: 7.8 },
            { k: "Discipline", v: 6.2 },
            { k: "Risk Mgmt", v: 8.1 },
            { k: "Consistency", v: 7.0 },
          ].map((b) => (
            <div key={b.k}>
              <div className="mb-1 flex justify-between"><span className="text-muted-foreground">{b.k}</span><span className="font-semibold text-white">{b.v}</span></div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                <div className="h-full bg-gradient-to-r from-primary to-accent" style={{ width: `${b.v * 10}%` }} />
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="What-if Simulation" action={<Sparkles className="h-4 w-4 text-accent" />}>
        <p className="text-xs text-muted-foreground">If you removed your worst 10% of trades:</p>
        <div className="mt-3 grid grid-cols-3 gap-3">
          <StatCard label="Net PnL" value="+$5,940" trend="up" accent="success" />
          <StatCard label="ROI" value="+28.1%" trend="up" accent="primary" />
          <StatCard label="Win Rate" value="68%" trend="up" accent="success" />
        </div>
      </Panel>
    </div>
  );
}
