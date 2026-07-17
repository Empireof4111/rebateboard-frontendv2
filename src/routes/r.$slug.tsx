import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { referralApi } from "@/lib/referral-api";
import { storeReferralAttribution } from "@/lib/referral-attribution";

export const Route = createFileRoute("/r/$slug")({
  component: ReferralLanding,
});

function ReferralLanding() {
  const { slug } = Route.useParams();
  const [redirect, setRedirect] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function resolveReferral() {
      try {
        const params = new URLSearchParams(window.location.search);
        const response = await referralApi.resolveLink(
          slug,
          params.get("utm_source") || params.get("source") || undefined,
          params.get("utm_campaign") || undefined,
        );
        const payload = response.payload;
        if (payload?.attributionToken) {
          storeReferralAttribution({
            token: payload.attributionToken,
            code: payload.code,
            source: params.get("utm_source") || params.get("source") || undefined,
            campaign: params.get("utm_campaign") || undefined,
            expiresAt: payload.expiresAt,
          });
        }
      } catch {
        // Invalid or expired links should fail closed and simply continue to the public site.
      } finally {
        if (!cancelled) setRedirect(true);
      }
    }

    void resolveReferral();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (redirect) return <Navigate to="/" />;

  return (
    <main className="min-h-screen bg-[#09090d] text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center px-6 text-center">
        <div className="mb-4 h-12 w-12 animate-pulse rounded-2xl border border-white/10 bg-violet-500/20" />
        <p className="text-sm font-semibold text-white">Preparing your RebateBoard link...</p>
        <p className="mt-2 text-sm text-white/55">You will be redirected automatically.</p>
      </div>
    </main>
  );
}
