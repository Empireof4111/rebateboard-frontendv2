import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { EmptyState, PageHeader, Panel, Pill, StatCard } from "@/components/dashboard/Primitives";
import { useAuth } from "@/lib/auth";
import { apiRequest } from "@/lib/api";
import { uploadMediaFile } from "@/lib/media-api";
import { validateFileSize } from "@/lib/upload-limits";
import { fetchMyReviews } from "@/lib/reviews-api";
import type { ReviewRecord } from "@/lib/reviews-store";
import { summarize, useTrt } from "@/lib/trt-store";
import { useTrades } from "@/lib/trading-plan";
import {
  AlertCircle,
  BadgeCheck,
  Camera,
  CheckCircle2,
  ClipboardCheck,
  FileCheck2,
  IdCard,
  LineChart,
  Loader2,
  Share2,
  Star,
  Trash2,
  Trophy,
  Upload,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  normalizeVerificationStatus,
  verificationApi,
  type VerificationStatus,
} from "@/lib/verification-api";

export const Route = createFileRoute("/dashboard/profile")({
  component: ProfilePage,
});

function formatPct(value: number | null) {
  if (value == null) return "Not tracked";
  return `${value >= 0 ? "+" : ""}${value.toFixed(0)}%`;
}

function ProfilePage() {
  const { user, token, updateProfile } = useAuth();
  const trades = useTrades();
  const trt = useTrt();
  const [reviews, setReviews] = useState<ReviewRecord[]>([]);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [shareStatus, setShareStatus] = useState<string | null>(null);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [profileStatus, setProfileStatus] = useState<string | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>(
    user?.kycStatus ?? "not_started",
  );
  const [verificationLoading, setVerificationLoading] = useState(true);
  const [verificationBusy, setVerificationBusy] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [identityType, setIdentityType] = useState("Passport");
  const [identityNumber, setIdentityNumber] = useState("");
  const [identityDocument, setIdentityDocument] = useState("");
  const [faceImage, setFaceImage] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetchMyReviews()
      .then((data) => {
        if (!cancelled) setReviews(data.page);
      })
      .catch((error) => {
        if (!cancelled) setReviewError(error instanceof Error ? error.message : "Unable to load review history");
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (!token) {
      setVerificationLoading(false);
      return;
    }

    if ((user?.verified ?? 0) > 0 && (user?.kycLevel ?? 0) > 0) {
      setVerificationStatus("verified");
    }

    verificationApi.getCurrent(token)
      .then((response) => {
        if (cancelled) return;
        const record = response.payload;
        setVerificationStatus(normalizeVerificationStatus(record?.status));
        if (record) {
          setIdentityType(record.identityType || "Passport");
          setIdentityNumber(record.identityNumber || "");
          setIdentityDocument(record.identity || "");
          setFaceImage(record.face || "");
        }
      })
      .catch(() => {
        if (!cancelled && (user?.verified ?? 0) <= 0) {
          setVerificationStatus("not_started");
        }
      })
      .finally(() => {
        if (!cancelled) setVerificationLoading(false);
      });

    return () => { cancelled = true; };
  }, [token, user?.kycLevel, user?.verified]);

  const summary = useMemo(() => summarize(trt, "all"), [trt]);
  const approvedReviews = reviews.filter((review) => review.status === "approved").length;
  const avgAdherence = trades.length
    ? Math.round(trades.reduce((sum, trade) => sum + Number(trade.adherence ?? 0), 0) / trades.length)
    : null;
  const achievements = [
    user?.onboardingCompleted ? { label: "Profile completed", icon: CheckCircle2 } : null,
    trades.length > 0 ? { label: "First trade logged", icon: LineChart } : null,
    approvedReviews > 0 ? { label: "Approved reviewer", icon: Star } : null,
    (user?.rrBalance ?? 0) > 0 ? { label: "RR earner", icon: Trophy } : null,
    summary.roiPct != null && summary.roiPct > 0 ? { label: "Positive ROI tracked", icon: ClipboardCheck } : null,
  ].filter(Boolean) as { label: string; icon: typeof CheckCircle2 }[];

  if (!user) return null;

  const initials = (user.fullName || user.name)
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const completion = user.profileCompletion ?? (user.onboardingCompleted ? 100 : 0);
  const username = user.username ? `@${user.username.replace(/^@/, "")}` : "Username not set";
  const memberSince = user.joinedAt
    ? new Date(user.joinedAt).toLocaleDateString(undefined, { month: "short", year: "numeric" })
    : "Not available";

  async function persistAvatar(dp: string) {
    if (!token) return;
    const response = await apiRequest<typeof user>("/user/", {
      method: "PUT",
      token,
      body: { dp },
    });
    updateProfile(response.payload ?? { dp });
  }

  async function uploadAvatar(file?: File) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setProfileStatus("Choose a PNG, JPG, or WebP image.");
      return;
    }
    const sizeError = validateFileSize(file);
    if (sizeError) {
      setProfileStatus(sizeError);
      return;
    }

    setAvatarBusy(true);
    setProfileStatus(null);
    try {
      const uploaded = await uploadMediaFile(file, {
        folder: "users/avatars",
        prefix: `user-${user.id}`,
      });
      await persistAvatar(uploaded.url);
      setProfileStatus("Profile photo updated.");
    } catch (error) {
      setProfileStatus(error instanceof Error ? error.message : "Unable to update profile photo.");
    } finally {
      setAvatarBusy(false);
    }
  }

  async function removeAvatar() {
    setAvatarBusy(true);
    setProfileStatus(null);
    try {
      await persistAvatar("");
      setProfileStatus("Profile photo removed.");
    } catch (error) {
      setProfileStatus(error instanceof Error ? error.message : "Unable to remove profile photo.");
    } finally {
      setAvatarBusy(false);
    }
  }

  async function uploadVerificationAsset(file: File | undefined, kind: "identity" | "face") {
    if (!file) return;
    if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
      setVerificationError("Upload an image or PDF document.");
      return;
    }
    const sizeError = validateFileSize(file);
    if (sizeError) {
      setVerificationError(sizeError);
      return;
    }
    setVerificationBusy(true);
    setVerificationError(null);
    try {
      const uploaded = await uploadMediaFile(file, {
        folder: `users/verification/${user.id}`,
        prefix: kind,
      });
      if (kind === "identity") setIdentityDocument(uploaded.url);
      else setFaceImage(uploaded.url);
    } catch (error) {
      setVerificationError(error instanceof Error ? error.message : "Unable to upload verification file.");
    } finally {
      setVerificationBusy(false);
    }
  }

  async function submitVerification() {
    if (!token) return;
    if (!identityNumber.trim() || !identityDocument || !faceImage) {
      setVerificationError("Add your ID number, identity document, and a clear face photo.");
      return;
    }
    setVerificationBusy(true);
    setVerificationError(null);
    try {
      const response = await verificationApi.submit(token, {
        name: user.fullName || user.name,
        identityType,
        identityNumber: identityNumber.trim(),
        identity: identityDocument,
        face: faceImage,
      });
      setVerificationStatus(normalizeVerificationStatus(response.payload?.status ?? "PENDING"));
    } catch (error) {
      setVerificationError(error instanceof Error ? error.message : "Unable to submit verification.");
    } finally {
      setVerificationBusy(false);
    }
  }

  async function shareProfile() {
    const url = `${window.location.origin}/dashboard/profile`;
    setShareStatus(null);
    try {
      if (navigator.share) {
        await navigator.share({ title: "RebateBoard profile", text: user?.name ?? "RebateBoard trader profile", url });
        setShareStatus("Shared");
        return;
      }
      await navigator.clipboard.writeText(url);
      setShareStatus("Profile link copied");
    } catch {
      setShareStatus("Unable to share profile");
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Profile"
        subtitle="Your trading identity, stats, and history."
        actions={
          <button
            type="button"
            onClick={() => void shareProfile()}
            className="glass-pill inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-white"
          >
            <Share2 className="h-3.5 w-3.5" />
            Share Card
          </button>
        }
      />

      {shareStatus && <div className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-xs text-white">{shareStatus}</div>}

      <Panel title="Identity">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative w-fit">
            <Avatar className="h-20 w-20 rounded-2xl ring-1 ring-white/15">
              <AvatarImage src={user.dp || undefined} alt={`${user.name} profile`} className="object-cover" />
              <AvatarFallback className="rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-600 text-lg font-bold text-white">
                {initials}
              </AvatarFallback>
            </Avatar>
            {avatarBusy && (
              <span className="absolute inset-0 grid place-items-center rounded-2xl bg-[rgba(18,18,25,0.75)]">
                <Loader2 className="h-5 w-5 animate-spin text-white" />
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-xl font-bold text-white">{user.fullName || user.name}</div>
            <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <span className="font-semibold text-fuchsia-200">{username}</span>
              <span>{user.email}</span>
            </div>
            <div className="mt-1 flex flex-wrap gap-2">
              {user.status && <Pill tone={user.status === "ACTIVE" ? "success" : "default"}>{user.status}</Pill>}
              {user.country && <Pill>{user.country}</Pill>}
              {user.onboardingCompleted ? <Pill tone="success">Profile complete</Pill> : <Pill tone="primary">Profile {completion}% complete</Pill>}
            </div>
            <div className="mt-3 grid gap-2 text-xs sm:grid-cols-2 lg:grid-cols-4">
              <IdentityItem label="Full Name" value={user.fullName || user.name} />
              <IdentityItem label="Username" value={username} />
              <IdentityItem label="Country" value={user.country || "Not provided"} />
              <IdentityItem label="Member Since" value={memberSince} />
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <label className="inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-full bg-primary/20 px-3 py-2 text-xs font-semibold text-white ring-1 ring-primary/35 transition hover:bg-primary/30">
                <Camera className="h-3.5 w-3.5" />
                {user.dp ? "Replace photo" : "Upload photo"}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  disabled={avatarBusy}
                  onChange={(event) => void uploadAvatar(event.target.files?.[0])}
                />
              </label>
              {user.dp && (
                <button
                  type="button"
                  onClick={() => void removeAvatar()}
                  disabled={avatarBusy}
                  className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-white/10 px-3 py-2 text-xs font-semibold text-white/80 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Remove
                </button>
              )}
            </div>
            {profileStatus && <p className="mt-2 text-xs text-muted-foreground">{profileStatus}</p>}
          </div>
        </div>
        <div className="mt-5">
          <div className="mb-1.5 flex items-center justify-between text-[11px]">
            <span className="font-medium text-white/80">Profile completion</span>
            <span className="tabular-nums text-fuchsia-200">{completion}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-400 transition-[width] duration-500"
              style={{ width: `${completion}%` }}
            />
          </div>
        </div>
      </Panel>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Trader Score" value={user.traderScore ? user.traderScore.toFixed(1) : "Not scored"} accent="primary" />
        <StatCard label="True ROI" value={formatPct(summary.roiPct)} accent={summary.roiPct != null && summary.roiPct >= 0 ? "success" : "warning"} />
        <StatCard label="Trades" value={trades.length.toLocaleString()} hint={avgAdherence == null ? "No journal data" : `${avgAdherence}% adherence`} accent="primary" />
        <StatCard label="Reviews" value={reviews.length.toLocaleString()} hint={reviewError ?? `${approvedReviews} approved`} accent={reviewError ? "warning" : "success"} />
      </div>

      <Panel title="Achievements">
        {achievements.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {achievements.map(({ label, icon: Icon }) => (
              <Pill key={label} tone="primary"><Icon className="h-3 w-3" />{label}</Pill>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Trophy}
            title="No achievements yet"
            description="Complete your profile, log trades, submit reviews, and earn RR to unlock profile achievements."
          />
        )}
      </Panel>

      <Panel
        title="Verification"
        action={
          verificationLoading
            ? <Pill><Loader2 className="h-3 w-3 animate-spin" />Checking</Pill>
            : <VerificationPill status={verificationStatus} />
        }
      >
        {verificationStatus === "verified" ? (
          <div className="flex items-start gap-3 rounded-xl border border-emerald-400/20 bg-emerald-500/[0.06] p-4">
            <BadgeCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" />
            <div>
              <p className="text-sm font-semibold text-white">Identity verified</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Your account can request withdrawals and use features that require verified identity.
              </p>
            </div>
          </div>
        ) : verificationStatus === "pending" ? (
          <div className="flex items-start gap-3 rounded-xl border border-violet-400/20 bg-violet-500/[0.07] p-4">
            <FileCheck2 className="mt-0.5 h-5 w-5 shrink-0 text-violet-200" />
            <div>
              <p className="text-sm font-semibold text-white">Verification under review</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Your documents were received. Withdrawals will unlock after approval.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {verificationStatus === "rejected" && (
              <div className="flex items-start gap-2 rounded-xl border border-rose-400/20 bg-rose-500/[0.06] p-3 text-xs text-rose-100">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                Your previous verification was not approved. Review the details and submit clear, current documents.
              </div>
            )}
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-1.5">
                <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">Document type</span>
                <select
                  value={identityType}
                  onChange={(event) => setIdentityType(event.target.value)}
                  className="min-h-11 w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 text-sm text-white outline-none focus:border-primary/50"
                >
                  <option>Passport</option>
                  <option>National ID</option>
                  <option>Driver License</option>
                </select>
              </label>
              <label className="space-y-1.5">
                <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">Document number</span>
                <input
                  value={identityNumber}
                  onChange={(event) => setIdentityNumber(event.target.value)}
                  placeholder="Enter document number"
                  className="min-h-11 w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 text-sm text-white outline-none placeholder:text-muted-foreground focus:border-primary/50"
                />
              </label>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <VerificationUpload
                label="Identity document"
                ready={Boolean(identityDocument)}
                accept="image/*,application/pdf"
                onFile={(file) => void uploadVerificationAsset(file, "identity")}
              />
              <VerificationUpload
                label="Face photo"
                ready={Boolean(faceImage)}
                accept="image/*"
                onFile={(file) => void uploadVerificationAsset(file, "face")}
              />
            </div>
            {verificationError && <p className="text-xs text-rose-300">{verificationError}</p>}
            <button
              type="button"
              onClick={() => void submitVerification()}
              disabled={verificationBusy}
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl rb-gradient-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {verificationBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <IdCard className="h-4 w-4" />}
              {verificationStatus === "rejected" ? "Resubmit verification" : "Submit verification"}
            </button>
          </div>
        )}
      </Panel>
    </div>
  );
}

function VerificationPill({ status }: { status: VerificationStatus }) {
  if (status === "verified") return <Pill tone="success"><BadgeCheck className="h-3 w-3" />Verified</Pill>;
  if (status === "pending") return <Pill tone="primary"><FileCheck2 className="h-3 w-3" />Pending</Pill>;
  if (status === "rejected") return <Pill tone="destructive"><AlertCircle className="h-3 w-3" />Rejected</Pill>;
  return <Pill><IdCard className="h-3 w-3" />Not started</Pill>;
}

function IdentityItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
      <div className="text-[9px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</div>
      <div className="mt-1 truncate font-medium text-white/90">{value}</div>
    </div>
  );
}

function VerificationUpload({
  label,
  ready,
  accept,
  onFile,
}: {
  label: string;
  ready: boolean;
  accept: string;
  onFile: (file?: File) => void;
}) {
  return (
    <label className="flex min-h-24 cursor-pointer items-center gap-3 rounded-xl border border-dashed border-white/15 bg-white/[0.025] p-3 transition hover:border-primary/35 hover:bg-primary/[0.06]">
      <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${ready ? "bg-emerald-500/15 text-emerald-300" : "bg-primary/15 text-fuchsia-200"}`}>
        {ready ? <CheckCircle2 className="h-5 w-5" /> : <Upload className="h-5 w-5" />}
      </span>
      <span>
        <span className="block text-sm font-semibold text-white">{label}</span>
        <span className="mt-0.5 block text-xs text-muted-foreground">{ready ? "Uploaded. Select to replace." : "Select a clear file to upload."}</span>
      </span>
      <input type="file" accept={accept} className="hidden" onChange={(event) => onFile(event.target.files?.[0])} />
    </label>
  );
}
