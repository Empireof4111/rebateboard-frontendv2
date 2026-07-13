import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel } from "@/components/dashboard/Primitives";
import { useAuth } from "@/lib/auth";
import { DashboardChecklist } from "@/components/dashboard/OnboardingChecklist";
import { apiRequest } from "@/lib/api";
import { useEffect, useMemo, useState } from "react";
import {
  LIVE_NOTIFICATION_OPTIONS,
  readLiveNotificationPreferences,
  writeLiveNotificationPreferences,
  type LiveNotificationPreferences,
} from "@/lib/notification-preferences";

export const Route = createFileRoute("/dashboard/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { user, token, logout } = useAuth();
  const [emailPreferences, setEmailPreferences] = useState<Record<string, boolean> | null>(null);
  const [savingPreference, setSavingPreference] = useState<string | null>(null);
  const [sendingTestEmail, setSendingTestEmail] = useState(false);
  const [preferenceError, setPreferenceError] = useState("");
  const [preferenceSaved, setPreferenceSaved] = useState(false);
  const [testEmailStatus, setTestEmailStatus] = useState("");
  const [livePreferences, setLivePreferences] = useState<LiveNotificationPreferences>(() => readLiveNotificationPreferences());

  const preferenceGroups = useMemo(
    () => [
      {
        title: "Money & Rewards",
        items: [
          { key: "cashback", label: "Cashback updates", hint: "Claims, approvals, and payout progress." },
          { key: "wallet", label: "Wallet activity", hint: "Withdrawals, balance changes, and transaction updates." },
          { key: "rewards", label: "RR and Trader Level", hint: "Reward milestones, unlocks, and streak progress." },
        ],
      },
      {
        title: "Trust & Activity",
        items: [
          { key: "reviewsAndComplaints", label: "Reviews and complaints", hint: "Review status, helpful votes, and complaint updates." },
          { key: "tradingIntelligence", label: "Trading intelligence", hint: "Journal, plan, and ROI insights." },
          { key: "rebetaInsights", label: "Rebeta insights", hint: "AI summaries and suggested next actions." },
        ],
      },
      {
        title: "Learning & Community",
        items: [
          { key: "academy", label: "Academy", hint: "Lessons, progress, and learning reminders." },
          { key: "community", label: "Community", hint: "Messages, discussions, and social activity." },
          { key: "affiliate", label: "Affiliate updates", hint: "Referral activity and partner status." },
        ],
      },
      {
        title: "Platform",
        items: [
          { key: "productUpdates", label: "Product updates", hint: "New features and important platform improvements." },
          { key: "newsletter", label: "Newsletter", hint: "Curated transparency, cashback, and trading updates." },
          { key: "promotions", label: "Promotions", hint: "Featured offers and optional marketing campaigns." },
        ],
      },
    ],
    [],
  );

  useEffect(() => {
    if (!token) return;

    let cancelled = false;
    async function loadPreferences() {
      try {
        const response = await apiRequest<Record<string, boolean>>("/email-preferences/", {
          method: "GET",
          token,
        });
        if (!cancelled) setEmailPreferences(response.payload || {});
      } catch {
        if (!cancelled) {
          setPreferenceError("We could not load your email preferences right now.");
        }
      }
    }

    void loadPreferences();
    return () => {
      cancelled = true;
    };
  }, [token]);

  async function updateEmailPreference(key: string, value: boolean) {
    if (!token || !emailPreferences) return;
    const next = { ...emailPreferences, [key]: value, accountSecurity: true };
    setEmailPreferences(next);
    setSavingPreference(key);
    setPreferenceError("");
    setPreferenceSaved(false);

    try {
      const response = await apiRequest<Record<string, boolean>>("/email-preferences/", {
        method: "PUT",
        token,
        body: { preferences: next },
      });
      setEmailPreferences(response.payload || next);
      setPreferenceSaved(true);
      window.setTimeout(() => setPreferenceSaved(false), 1800);
    } catch {
      setPreferenceError("We could not save that preference. Please try again.");
      setEmailPreferences(emailPreferences);
    } finally {
      setSavingPreference(null);
    }
  }

  async function sendTestEmail() {
    if (!token) return;
    setSendingTestEmail(true);
    setPreferenceError("");
    setTestEmailStatus("");

    try {
      await apiRequest("/email-preferences/test-send", {
        method: "POST",
        token,
      });
      setTestEmailStatus("Test email sent. Check your inbox and the delivery log.");
    } catch {
      setPreferenceError("We could not send the test email. Please check SMTP settings and try again.");
    } finally {
      setSendingTestEmail(false);
    }
  }

  function updateLivePreference(key: keyof LiveNotificationPreferences, value: boolean) {
    const next = { ...livePreferences, [key]: value };
    setLivePreferences(next);
    writeLiveNotificationPreferences(next);
    setPreferenceSaved(true);
    window.setTimeout(() => setPreferenceSaved(false), 1800);
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" subtitle="Account, notifications, and privacy." />

      <DashboardChecklist variant="settings" />

      <Panel title="Account">
        <div className="space-y-3 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">Name</span><span className="text-white">{user?.name}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Email</span><span className="text-white">{user?.email}</span></div>
        </div>
      </Panel>

      <Panel title="Live Notification Feed">
        <div className="space-y-4">
          <div className="rounded-2xl border border-violet-300/20 bg-violet-400/10 p-4 text-sm text-violet-50">
            <p className="font-semibold">One live update at a time.</p>
            <p className="mt-1 text-violet-50/70">
              RebateBoard cycles public activity and campaign popups through a single feed. Turn off categories you do not want to see.
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {LIVE_NOTIFICATION_OPTIONS.map((item) => (
              <label
                key={item.key}
                className="flex cursor-pointer items-start justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4 transition hover:border-violet-300/35 hover:bg-white/[0.07]"
              >
                <span>
                  <span className="block text-sm font-semibold text-white">{item.label}</span>
                  <span className="mt-1 block text-xs leading-5 text-white/55">{item.hint}</span>
                </span>
                <span className="relative mt-1 inline-flex h-6 w-11 shrink-0 items-center rounded-full bg-white/10 transition data-[checked=true]:bg-violet-500" data-checked={livePreferences[item.key] !== false}>
                  <input
                    type="checkbox"
                    checked={livePreferences[item.key] !== false}
                    onChange={(event) => updateLivePreference(item.key, event.target.checked)}
                    className="sr-only"
                  />
                  <span className="pointer-events-none h-5 w-5 translate-x-0.5 rounded-full bg-white shadow transition data-[checked=true]:translate-x-5" data-checked={livePreferences[item.key] !== false} />
                </span>
              </label>
            ))}
          </div>
        </div>
      </Panel>

      <Panel title="Email Preferences">
        <div className="space-y-5">
          <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-50">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-semibold">Account and security emails are always on.</p>
                <p className="mt-1 text-emerald-50/75">
                  Verification codes, password resets, legal notices, and critical account alerts are sent for your protection.
                </p>
              </div>
              <button
                type="button"
                onClick={sendTestEmail}
                disabled={sendingTestEmail}
                className="shrink-0 rounded-xl border border-emerald-200/25 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {sendingTestEmail ? "Sending..." : "Send test email"}
              </button>
            </div>
          </div>

          {preferenceError && (
            <div className="rounded-2xl border border-red-400/25 bg-red-500/10 px-4 py-3 text-sm text-red-100">
              {preferenceError}
            </div>
          )}

          {preferenceSaved && (
            <div className="rounded-2xl border border-violet-300/25 bg-violet-400/10 px-4 py-3 text-sm text-violet-100">
              Email preferences saved.
            </div>
          )}

          {testEmailStatus && (
            <div className="rounded-2xl border border-emerald-300/25 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
              {testEmailStatus}
            </div>
          )}

          {!emailPreferences ? (
            <div className="grid gap-3 md:grid-cols-2">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="h-20 animate-pulse rounded-2xl bg-white/5" />
              ))}
            </div>
          ) : (
            <div className="space-y-5">
              {preferenceGroups.map((group) => (
                <section key={group.title} className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-[0.22em] text-violet-100/65">
                    {group.title}
                  </h3>
                  <div className="grid gap-3 md:grid-cols-2">
                    {group.items.map((item) => (
                      <label
                        key={item.key}
                        className="flex cursor-pointer items-start justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4 transition hover:border-violet-300/35 hover:bg-white/[0.07]"
                      >
                        <span>
                          <span className="block text-sm font-semibold text-white">{item.label}</span>
                          <span className="mt-1 block text-xs leading-5 text-white/55">{item.hint}</span>
                        </span>
                        <span className="relative mt-1 inline-flex h-6 w-11 shrink-0 items-center rounded-full bg-white/10 transition data-[checked=true]:bg-violet-500" data-checked={emailPreferences[item.key] !== false}>
                          <input
                            type="checkbox"
                            checked={emailPreferences[item.key] !== false}
                            disabled={savingPreference === item.key}
                            onChange={(event) => updateEmailPreference(item.key, event.target.checked)}
                            className="sr-only"
                          />
                          <span className="pointer-events-none h-5 w-5 translate-x-0.5 rounded-full bg-white shadow transition data-[checked=true]:translate-x-5" data-checked={emailPreferences[item.key] !== false} />
                        </span>
                      </label>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>
      </Panel>

      <Panel title="Privacy">
        <ul className="space-y-3 text-sm text-white">
          <li className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2"><span>Show on leaderboards</span><input type="checkbox" defaultChecked className="h-4 w-4 accent-violet-500" /></li>
          <li className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2"><span>Public profile</span><input type="checkbox" className="h-4 w-4 accent-violet-500" /></li>
        </ul>
      </Panel>

      <button onClick={logout} className="rounded-xl bg-destructive/20 px-4 py-2 text-sm font-semibold text-destructive hover:bg-destructive/30">Log out</button>
    </div>
  );
}
