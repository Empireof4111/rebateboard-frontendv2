import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel } from "@/components/superadmin/AdminUI";
import { featureFlags } from "@/lib/admin-data";
import { useState } from "react";

export const Route = createFileRoute("/superadmin/flags")({
  component: FlagsPage,
});

function FlagsPage() {
  const [flags, setFlags] = useState(featureFlags);
  return (
    <div>
      <PageHeader title="Feature Flags" subtitle="Roll features in/out without a deploy." />
      <Panel title="All flags">
        <ul className="divide-y divide-white/5">
          {flags.map((f, i) => (
            <li key={f.key} className="flex items-center justify-between py-3">
              <div>
                <div className="text-sm font-bold text-white">{f.label}</div>
                <div className="font-mono text-[11px] text-muted-foreground">{f.key} · rollout {f.rollout}</div>
              </div>
              <button
                onClick={() => setFlags((s) => s.map((x, j) => (j === i ? { ...x, enabled: !x.enabled } : x)))}
                className={`relative h-6 w-11 rounded-full transition ${f.enabled ? "rb-gradient-primary" : "bg-white/10"}`}
              >
                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${f.enabled ? "left-5" : "left-0.5"}`} />
              </button>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}
