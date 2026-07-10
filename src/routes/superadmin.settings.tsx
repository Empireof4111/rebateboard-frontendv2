import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel } from "@/components/superadmin/AdminUI";
import { setBrandApplicationSettings, useBrandApplicationSettings } from "@/lib/tbi-onboarding";
import { ToggleLeft, ToggleRight } from "lucide-react";

export const Route = createFileRoute("/superadmin/settings")({
  component: SettingsAdmin,
});

function SettingsAdmin() {
  const brandApplications = useBrandApplicationSettings();

  return (
    <div>
      <PageHeader title="Platform Settings" subtitle="Brand, legal, regional and operational defaults." />
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Branding">
          <div className="space-y-3 text-sm">
            <Row label="Platform name" value="RebateBoard" />
            <Row label="Support email" value="support@rebateboard.com" />
            <Row label="Default locale" value="en-US" />
            <Row label="Default currency" value="USD" />
          </div>
        </Panel>
        <Panel title="Trust & Safety">
          <div className="space-y-3 text-sm">
            <Row label="Min review evidence" value="1 image OR 1 TX hash" />
            <Row label="Auto-flag threshold" value="3 reports / 24h" />
            <Row label="KYC required for payout" value="Yes (≥ $500)" />
            <Row label="TBI recalc cadence" value="Every 6 hours" />
          </div>
        </Panel>
        <Panel title="Brand Applications">
          <div className="space-y-4 text-sm">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="font-semibold text-white">Public application page</div>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    Turn this off when the review queue is full. Visitors will see a polished closed-state instead of the form.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setBrandApplicationSettings({ enabled: !brandApplications.enabled })}
                  className={`inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-xs font-bold ring-1 transition ${
                    brandApplications.enabled
                      ? "bg-emerald-500/15 text-emerald-200 ring-emerald-400/30"
                      : "bg-white/5 text-muted-foreground ring-white/10"
                  }`}
                >
                  {brandApplications.enabled ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                  {brandApplications.enabled ? "ON" : "OFF"}
                </button>
              </div>
            </div>
            <Row label="Public state" value={brandApplications.enabled ? "Applications open" : "Applications closed"} />
            <Row label="Last changed" value={brandApplications.updatedAt ? new Date(brandApplications.updatedAt).toLocaleString() : "Not changed yet"} />
          </div>
        </Panel>
        <Panel title="Economy">
          <div className="space-y-3 text-sm">
            <Row label="RR → USD rate" value="$0.02" />
            <Row label="Max RR redeem / day" value="5,000 RR" />
            <Row label="Affiliate revenue share" value="20%" />
          </div>
        </Panel>
        <Panel title="Danger zone">
          <div className="space-y-3">
            <button className="w-full rounded-xl bg-amber-500/15 py-2 text-xs font-bold text-amber-300 ring-1 ring-amber-400/30">Force TBI recalculation</button>
            <button className="w-full rounded-xl bg-rose-500/15 py-2 text-xs font-bold text-rose-300 ring-1 ring-rose-400/30">Enable maintenance mode</button>
            <button className="w-full rounded-xl bg-rose-500/15 py-2 text-xs font-bold text-rose-300 ring-1 ring-rose-400/30">Purge cache</button>
          </div>
        </Panel>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-white/5 pb-2 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-white">{value}</span>
    </div>
  );
}
