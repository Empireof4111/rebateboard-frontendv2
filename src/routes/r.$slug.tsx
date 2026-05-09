import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { getAllProfiles, captureRefFromUrl } from "@/lib/referral-store";

export const Route = createFileRoute("/r/$slug")({
  component: ReferralLanding,
});

function ReferralLanding() {
  const { slug } = Route.useParams();
  const profile = getAllProfiles().find((p) => p.customSlug?.toLowerCase() === slug.toLowerCase());

  // Stamp ?ref= so captureRefFromUrl picks it up, then send the visitor home.
  useEffect(() => {
    if (profile && typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("ref", profile.code);
      window.history.replaceState({}, "", url.toString());
      captureRefFromUrl();
    }
  }, [profile?.code]);

  if (!profile) return <Navigate to="/" />;
  return <Navigate to="/" search={{ ref: profile.code } as never} />;
}
