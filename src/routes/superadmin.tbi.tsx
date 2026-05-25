import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  DataTable,
  EmptyState,
  PageHeader,
  Panel,
  Pill,
  StatCard,
  StatusPill,
  Toolbar,
} from "@/components/superadmin/AdminUI";
import { fieldCls, toast } from "@/components/superadmin/AdminActions";
import {
  fetchAdminTbiProfiles,
  type TbiAdminPatch,
  type TbiProfile,
  type TbiState,
  tbiConfidenceTone,
  tbiLabelTone,
  tbiStateLabel,
  tbiStateTone,
  updateAdminTbiProfile,
} from "@/lib/tbi-api";
import { AlertTriangle, Gauge, Shield, SlidersHorizontal } from "lucide-react";

export const Route = createFileRoute("/superadmin/tbi")({
  component: TBIPage,
});

function TBIPage() {
  const [profiles, setProfiles] = useState<TbiProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [stateFilter, setStateFilter] = useState<TbiState | "all">("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const loadProfiles = async (preserveSelection = true) => {
    setLoading(true);
    try {
      const payload = await fetchAdminTbiProfiles();
      setProfiles(payload);
      setError(null);
      if (!preserveSelection) {
        setSelectedId(payload[0]?.id ?? null);
      } else if (payload.length) {
        setSelectedId((current) => current && payload.some((item) => item.id === current) ? current : payload[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load TBI engine.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadProfiles(false);
  }, []);

  const categories = useMemo(
    () => ["all", ...Array.from(new Set(profiles.map((profile) => profile.fullCategory))).sort()],
    [profiles],
  );

  const filtered = useMemo(() => {
    return profiles.filter((profile) => {
      if (category !== "all" && profile.fullCategory !== category) return false;
      if (stateFilter !== "all" && profile.state !== stateFilter) return false;
      if (query) {
        const haystack = `${profile.name} ${profile.fullCategory} ${profile.region}`.toLowerCase();
        if (!haystack.includes(query.toLowerCase())) return false;
      }
      return true;
    });
  }, [profiles, query, category, stateFilter]);

  const selectedProfile = filtered.find((profile) => profile.id === selectedId) ?? profiles.find((profile) => profile.id === selectedId) ?? null;

  const stats = useMemo(() => {
    const full = profiles.filter((profile) => profile.state === "full").length;
    const partial = profiles.filter((profile) => profile.state === "partial").length;
    const preliminary = profiles.filter((profile) => profile.state === "preliminary").length;
    const flagged = profiles.filter((profile) => profile.riskEvents.length > 0 || profile.riskPenalty < 0).length;
    return { full, partial, preliminary, flagged };
  }, [profiles]);

  const savePatch = async (patch: TbiAdminPatch) => {
    if (!selectedProfile) return;
    setSaving(true);
    try {
      const updated = await updateAdminTbiProfile(selectedProfile.id, patch);
      setProfiles((current) => current.map((profile) => (profile.id === updated.id ? updated : profile)));
      toast.success(`${updated.name} TBI settings updated`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to update TBI settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="TBI Engine"
        subtitle="Moderate trust states, inspect raw calculations, control penalties, and decide when a brand is eligible for full public trust visibility."
        actions={
          <button
            onClick={() => void loadProfiles()}
            className="rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-600 px-4 py-2 text-xs font-semibold text-white"
          >
            Refresh engine
          </button>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Full TBI" value={String(stats.full)} delta="rank-eligible" tone="up" />
        <StatCard label="Partial TBI" value={String(stats.partial)} delta="limited data" tone="flat" />
        <StatCard label="Preliminary" value={String(stats.preliminary)} delta="structural only" tone="flat" />
        <StatCard label="Risk pressured" value={String(stats.flagged)} delta="watchlist" tone="down" />
      </div>

      <Toolbar>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search brand or region..."
          className={`${fieldCls} max-w-xs`}
        />
        <select value={category} onChange={(event) => setCategory(event.target.value)} className={fieldCls}>
          {categories.map((entry) => (
            <option key={entry} value={entry}>
              {entry === "all" ? "All categories" : entry}
            </option>
          ))}
        </select>
        <select
          value={stateFilter}
          onChange={(event) => setStateFilter(event.target.value as TbiState | "all")}
          className={fieldCls}
        >
          <option value="all">All states</option>
          <option value="preliminary">Preliminary</option>
          <option value="partial">Partial</option>
          <option value="full">Full</option>
        </select>
      </Toolbar>

      {loading ? (
        <Panel title="TBI profiles">
          <div className="text-sm text-muted-foreground">Loading TBI engine...</div>
        </Panel>
      ) : error ? (
        <Panel title="TBI profiles">
          <div className="text-sm text-rose-300">{error}</div>
        </Panel>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[1.25fr_0.95fr]">
          <Panel title={`Trust profile queue · ${filtered.length}`}>
            {!filtered.length ? (
              <EmptyState title="No TBI profiles found" description="Adjust the filters or make sure admin brands are available." icon={Shield} />
            ) : (
              <DataTable head={<><th>Brand</th><th>State</th><th>Score</th><th>Confidence</th><th>Penalty</th><th>Visibility</th></>}>
                {filtered.map((profile) => (
                  <tr
                    key={profile.id}
                    onClick={() => setSelectedId(profile.id)}
                    className={selectedId === profile.id ? "bg-white/[0.04]" : ""}
                  >
                    <td>
                      <div className="font-semibold">{profile.name}</div>
                      <div className="text-xs text-muted-foreground">{profile.fullCategory}</div>
                    </td>
                    <td>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${tbiStateTone(profile.state)}`}>
                        {tbiStateLabel(profile.state)}
                      </span>
                    </td>
                    <td>
                      <div className="font-mono font-bold text-white">
                        {profile.state === "preliminary"
                          ? `${profile.preliminaryScore.toFixed(1)} / 6.5`
                          : `${profile.finalScore.toFixed(1)} / 10`}
                      </div>
                      <div className={`text-xs ${tbiLabelTone(profile.trustLabel)}`}>{profile.trustLabel}</div>
                    </td>
                    <td className={tbiConfidenceTone(profile.confidence)}>{profile.confidence}</td>
                    <td className={profile.riskPenalty < 0 ? "text-rose-300" : "text-muted-foreground"}>
                      {profile.riskPenalty.toFixed(2)}
                    </td>
                    <td><StatusPill status={profile.visibility} /></td>
                  </tr>
                ))}
              </DataTable>
            )}
          </Panel>

          <Panel
            title={selectedProfile ? `${selectedProfile.name} · Trust Control` : "Trust Control"}
            action={selectedProfile ? <Pill tone="neutral">{selectedProfile.fullCategory}</Pill> : undefined}
          >
            {!selectedProfile ? (
              <div className="text-sm text-muted-foreground">Select a brand to inspect the live TBI engine.</div>
            ) : (
              <TbiControlPanel profile={selectedProfile} saving={saving} onSave={savePatch} />
            )}
          </Panel>
        </div>
      )}
    </div>
  );
}

function TbiControlPanel({
  profile,
  saving,
  onSave,
}: {
  profile: TbiProfile;
  saving: boolean;
  onSave: (patch: TbiAdminPatch) => Promise<void>;
}) {
  const [visibility, setVisibility] = useState(profile.visibility);
  const [status, setStatus] = useState(profile.status);
  const [stateOverride, setStateOverride] = useState<TbiState | "">("");
  const [confidenceOverride, setConfidenceOverride] = useState<"" | "High" | "Medium" | "Low">("");
  const [manualFinalScore, setManualFinalScore] = useState<string>("");
  const [manualRiskPenalty, setManualRiskPenalty] = useState<string>(profile.riskPenalty.toFixed(2));
  const [unlockFullTbi, setUnlockFullTbi] = useState(false);
  const [suspendVisibility, setSuspendVisibility] = useState(profile.visibility === "hidden");

  useEffect(() => {
    setVisibility(profile.visibility);
    setStatus(profile.status);
    setStateOverride("");
    setConfidenceOverride("");
    setManualFinalScore("");
    setManualRiskPenalty(profile.riskPenalty.toFixed(2));
    setUnlockFullTbi(false);
    setSuspendVisibility(profile.visibility === "hidden");
  }, [profile]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Raw" value={profile.rawScore.toFixed(2)} delta={profile.trustEngine.formula} tone="flat" />
        <StatCard label="Final" value={profile.finalScore.toFixed(2)} delta={`${profile.reviewCount} reviews`} tone="up" />
        <StatCard label="Verified reviews" value={String(profile.verifiedReviewCount)} delta={profile.confidence} tone="flat" />
        <StatCard label="Complaints" value={String(profile.complaints.total)} delta={`${profile.complaints.pending} pending`} tone={profile.complaints.pending ? "down" : "flat"} />
      </div>

      <div className="rounded-2xl bg-white/5 p-4">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
          <Gauge className="h-4 w-4 text-fuchsia-300" /> Core engine
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <MetricLine label="User Trust" value={profile.components.ut} />
          <MetricLine label="Payout Reliability" value={profile.components.pr} />
          <MetricLine label="Transparency" value={profile.components.ts} />
          <MetricLine label="Regulation & Compliance" value={profile.components.rc} />
          <MetricLine label="Trading Conditions" value={profile.components.tc} />
          <MetricLine label="Customer Experience" value={profile.components.cx} />
        </div>
      </div>

      <div className="rounded-2xl bg-white/5 p-4">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
          <SlidersHorizontal className="h-4 w-4 text-fuchsia-300" /> Trust state control
        </div>
        <div className="grid gap-3">
          <label className="grid gap-1 text-xs text-muted-foreground">
            Visibility
            <select value={visibility} onChange={(event) => setVisibility(event.target.value)} className={fieldCls}>
              <option value="draft">draft</option>
              <option value="published">published</option>
              <option value="hidden">hidden</option>
              <option value="archived">archived</option>
            </select>
          </label>
          <label className="grid gap-1 text-xs text-muted-foreground">
            Brand status
            <select value={status} onChange={(event) => setStatus(event.target.value)} className={fieldCls}>
              <option value="draft">draft</option>
              <option value="review">review</option>
              <option value="verified">verified</option>
              <option value="flagged">flagged</option>
            </select>
          </label>
          <label className="grid gap-1 text-xs text-muted-foreground">
            Force trust state
            <select value={stateOverride} onChange={(event) => setStateOverride(event.target.value as TbiState | "")} className={fieldCls}>
              <option value="">Auto</option>
              <option value="preliminary">Preliminary</option>
              <option value="partial">Partial</option>
              <option value="full">Full</option>
            </select>
          </label>
          <label className="grid gap-1 text-xs text-muted-foreground">
            Force confidence
            <select
              value={confidenceOverride}
              onChange={(event) => setConfidenceOverride(event.target.value as "" | "High" | "Medium" | "Low")}
              className={fieldCls}
            >
              <option value="">Auto</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </label>
          <label className="grid gap-1 text-xs text-muted-foreground">
            Manual final score
            <input
              value={manualFinalScore}
              onChange={(event) => setManualFinalScore(event.target.value)}
              placeholder="Leave blank for computed score"
              className={fieldCls}
            />
          </label>
          <label className="grid gap-1 text-xs text-muted-foreground">
            Manual risk penalty
            <input
              value={manualRiskPenalty}
              onChange={(event) => setManualRiskPenalty(event.target.value)}
              className={fieldCls}
            />
          </label>
          <label className="flex items-center gap-2 text-sm text-white">
            <input type="checkbox" checked={unlockFullTbi} onChange={(event) => setUnlockFullTbi(event.target.checked)} />
            Unlock full TBI state
          </label>
          <label className="flex items-center gap-2 text-sm text-white">
            <input type="checkbox" checked={suspendVisibility} onChange={(event) => setSuspendVisibility(event.target.checked)} />
            Suspend public visibility
          </label>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            disabled={saving}
            onClick={() =>
              void onSave({
                visibility,
                status,
                stateOverride: stateOverride || undefined,
                confidenceOverride: confidenceOverride || undefined,
                manualFinalScore: manualFinalScore.trim() ? Number(manualFinalScore) : null,
                manualRiskPenalty: Number(manualRiskPenalty),
                unlockFullTbi,
                suspendVisibility,
              })
            }
            className="rounded-xl bg-gradient-to-r from-fuchsia-500 to-violet-600 px-4 py-2 text-xs font-bold text-white disabled:opacity-60"
          >
            {saving ? "Saving..." : "Apply TBI controls"}
          </button>
        </div>
      </div>

      <div className="rounded-2xl bg-white/5 p-4">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
          <AlertTriangle className="h-4 w-4 text-amber-300" /> Risk and change monitoring
        </div>
        <div className="space-y-3">
          {profile.riskEvents.length ? (
            profile.riskEvents.map((event) => (
              <div key={`${event.kind}-${event.title}`} className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="font-semibold text-amber-100">{event.title}</div>
                  <div className="text-xs font-semibold text-amber-300">{event.impact.toFixed(2)}</div>
                </div>
                <div className="mt-1 text-xs text-amber-50/90">{event.detail}</div>
              </div>
            ))
          ) : (
            <div className="text-sm text-muted-foreground">No active risk events on this profile.</div>
          )}
        </div>
      </div>
    </div>
  );
}

function MetricLine({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-black/10 p-3">
      <div className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{label}</div>
      <div className="mt-2 text-xl font-bold text-white">{value.toFixed(2)}</div>
    </div>
  );
}
