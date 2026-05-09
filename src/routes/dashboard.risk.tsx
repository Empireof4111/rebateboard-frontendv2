import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel, Pill, StatCard } from "@/components/dashboard/Primitives";
import { ShieldCheck, AlertTriangle, ShieldAlert } from "lucide-react";

export const Route = createFileRoute("/dashboard/risk")({
  component: RiskPage,
});

function RiskPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Risk Guardrails" subtitle="Real-time rules, violations, and live status." />

      <Panel title="Live Risk State" action={<Pill tone="success">Safe</Pill>}>
        <div className="flex items-center gap-4">
          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-success/15">
            <ShieldCheck className="h-7 w-7 text-success" />
          </div>
          <div>
            <div className="text-xl font-bold text-white">All systems green</div>
            <p className="text-xs text-muted-foreground">0 violations · 4/5 trades used today · 1.2R risked / 3R cap</p>
          </div>
        </div>
      </Panel>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Daily Trades" value="3 / 5" accent="success" />
        <StatCard label="Daily Risk" value="1.2R / 3R" accent="success" />
        <StatCard label="Weekly DD" value="−2.1% / 5%" accent="warning" />
        <StatCard label="Violations" value="0" accent="success" />
      </div>

      <Panel title="Active Rules">
        <ul className="space-y-3 text-xs">
          {[
            { t: "Max 5 trades per day", on: true },
            { t: "Max 1R per trade", on: true },
            { t: "Stop after 2 consecutive losses", on: true },
            { t: "No trading first 30m of NY open", on: false },
          ].map((r) => (
            <li key={r.t} className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2">
              <span className="text-white">{r.t}</span>
              <Pill tone={r.on ? "success" : "default"}>{r.on ? "Active" : "Off"}</Pill>
            </li>
          ))}
        </ul>
      </Panel>

      <Panel title="Recent Warnings" action={<AlertTriangle className="h-4 w-4 text-accent" />}>
        <ul className="space-y-2 text-xs">
          <li className="flex items-center gap-2 rounded-lg bg-warning/10 p-2 text-white"><ShieldAlert className="h-4 w-4 text-accent" /> Approached daily risk cap on Tuesday (2.8R / 3R)</li>
          <li className="flex items-center gap-2 rounded-lg bg-destructive/10 p-2 text-white"><ShieldAlert className="h-4 w-4 text-destructive" /> Took 3rd trade after 2 losses on Friday — rule break</li>
        </ul>
      </Panel>
    </div>
  );
}
