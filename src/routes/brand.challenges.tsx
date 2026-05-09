import { createFileRoute } from "@tanstack/react-router";
import { useBrandAuth } from "@/lib/brand-auth";
import { FirmChallenges } from "@/components/firm/FirmChallenges";

export const Route = createFileRoute("/brand/challenges")({
  component: BrandChallenges,
});

function BrandChallenges() {
  const { brand } = useBrandAuth();
  if (!brand) return null;
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white">Challenges & products</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage the challenge plans traders see on your profile.</p>
      </div>
      <FirmChallenges firmName={brand.name} />
    </div>
  );
}
