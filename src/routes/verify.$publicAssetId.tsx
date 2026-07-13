import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BadgeCheck, Calendar, CircleAlert, ExternalLink, ShieldCheck, XCircle } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Logo } from "@/components/Logo";
import { verifyShareableAsset, type ShareableAssetRecord } from "@/lib/shareable-assets-api";

export const Route = createFileRoute("/verify/$publicAssetId")({
  head: ({ params }) => ({
    meta: [
      { title: `Verify ${params.publicAssetId} | RebateBoard` },
      { name: "description", content: "Verify an authentic RebateBoard performance card or shareable achievement." },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: VerifyAssetPage,
});

function VerifyAssetPage() {
  const { publicAssetId } = Route.useParams();
  const [record, setRecord] = useState<ShareableAssetRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    verifyShareableAsset(publicAssetId)
      .then((payload) => {
        if (active) setRecord(payload);
      })
      .catch(() => {
        if (active) {
          setRecord({
            publicAssetId,
            assetType: "unknown",
            preset: "",
            format: "",
            theme: "",
            verifiedMetrics: {},
            visibleFields: [],
            status: "invalid",
            integrityValid: false,
          });
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [publicAssetId]);

  const status = record?.status ?? "invalid";
  const valid = status === "verified" && record?.integrityValid !== false;
  const primaryMetric = record?.verifiedMetrics?.primaryMetric ?? record?.verifiedMetrics?.value ?? "Verified achievement";
  const visibleName = record?.visibleFields?.includes("profile") ? String(record?.metadata?.traderName ?? "RebateBoard Trader") : null;

  return (
    <div className="min-h-screen bg-[var(--rb-bg-canvas)] text-foreground">
      <SiteHeader />
      <main className="container-app py-8 sm:py-12">
        <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-violet-950/60 via-[#16072d] to-[#08030f] p-6 shadow-[0_30px_90px_rgba(0,0,0,0.35)] md:p-10">
          <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-fuchsia-500/20 blur-3xl" />
          <div className="absolute -bottom-20 left-10 h-52 w-52 rounded-full bg-violet-500/15 blur-3xl" />

          <div className="relative mx-auto max-w-3xl text-center">
            <Logo heightClass="h-9" className="mx-auto justify-center" />
            {loading ? (
              <div className="mt-12">
                <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl border border-fuchsia-300/20 bg-fuchsia-400/10">
                  <ShieldCheck className="h-7 w-7 animate-pulse text-fuchsia-200" />
                </div>
                <h1 className="mt-5 text-3xl font-black text-white">Verifying RebateBoard record...</h1>
                <p className="mt-3 text-sm text-muted-foreground">Checking the public asset ID and integrity signature.</p>
              </div>
            ) : valid && record ? (
              <div className="mt-10">
                <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl border border-emerald-300/25 bg-emerald-400/12 text-emerald-200 shadow-[0_0_34px_rgba(16,185,129,0.18)]">
                  <BadgeCheck className="h-8 w-8" />
                </div>
                <div className="mt-5 text-[11px] font-black uppercase tracking-[0.24em] text-emerald-200">Verified Record</div>
                <h1 className="mt-3 text-4xl font-black leading-tight text-white md:text-5xl">Verified by RebateBoard</h1>
                <p className="mx-auto mt-3 max-w-xl text-base leading-7 text-muted-foreground">
                  This performance card is authentic and was generated from verified RebateBoard platform activity at the time it was issued.
                </p>

                <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.045] p-5 text-left">
                  <div className="grid gap-4 md:grid-cols-2">
                    <Info label="Primary metric" value={String(primaryMetric)} />
                    {visibleName && <Info label="Trader" value={visibleName} />}
                    <Info label="Asset type" value={humanize(record.assetType)} />
                    <Info label="Issued" value={record.issuedAt ? new Date(record.issuedAt).toLocaleString() : "Verified record"} />
                    <Info label="Public asset ID" value={record.publicAssetId} mono />
                    <Info label="Status" value="Verified" />
                  </div>
                  <div className="mt-5 border-t border-white/10 pt-5">
                    <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Public metrics</div>
                    <div className="mt-3 grid gap-2 sm:grid-cols-3">
                      {Object.entries(record.verifiedMetrics || {})
                        .filter(([key]) => !["primaryMetric", "value"].includes(key))
                        .slice(0, 6)
                        .map(([key, value]) => (
                          <div key={key} className="rounded-2xl bg-white/[0.045] p-3 ring-1 ring-white/8">
                            <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{humanize(key)}</div>
                            <div className="mt-1 truncate text-sm font-bold text-white">{String(value ?? "—")}</div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <InvalidState record={record} publicAssetId={publicAssetId} />
            )}

            {!loading && (
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Link to="/trt" className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/10">
                  Learn about TRT <ExternalLink className="h-4 w-4" />
                </Link>
                <Link to="/signup" className="inline-flex items-center gap-2 rounded-full rb-gradient-primary px-5 py-3 text-sm font-black text-white shadow-[0_0_30px_rgba(192,132,252,0.3)]">
                  Create free account
                </Link>
              </div>
            )}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

function InvalidState({ record, publicAssetId }: { record: ShareableAssetRecord | null; publicAssetId: string }) {
  const revoked = record?.status === "revoked";
  const expired = record?.status === "expired";
  const Icon = revoked || expired ? CircleAlert : XCircle;
  const title = revoked
    ? "This asset has been revoked"
    : expired
      ? "This verification record has expired"
      : "We could not verify this RebateBoard asset";
  const body = revoked
    ? record?.revocationReason || "This asset was previously issued but is no longer considered valid."
    : expired
      ? "This record is no longer active. This does not automatically imply fraud."
      : "The asset ID is unknown, broken, or the URL has been altered.";
  return (
    <div className="mt-10">
      <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl border border-rose-300/20 bg-rose-400/10 text-rose-200">
        <Icon className="h-8 w-8" />
      </div>
      <div className="mt-5 text-[11px] font-black uppercase tracking-[0.24em] text-rose-200">Verification unavailable</div>
      <h1 className="mt-3 text-3xl font-black text-white md:text-5xl">{title}</h1>
      <p className="mx-auto mt-3 max-w-xl text-base leading-7 text-muted-foreground">{body}</p>
      <div className="mx-auto mt-6 max-w-md rounded-2xl border border-white/10 bg-white/[0.045] p-4">
        <Info label="Checked asset ID" value={record?.publicAssetId || publicAssetId} mono />
      </div>
    </div>
  );
}

function Info({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/15 p-4">
      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
        <Calendar className="h-3 w-3" />
        {label}
      </div>
      <div className={`mt-1 break-words text-sm font-bold text-white ${mono ? "font-mono" : ""}`}>{value}</div>
    </div>
  );
}

function humanize(value: string) {
  return value
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}
