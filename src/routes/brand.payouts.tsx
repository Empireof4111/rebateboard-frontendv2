import { createFileRoute } from "@tanstack/react-router";
import { useBrandAuth } from "@/lib/brand-auth";
import { FirmPayouts } from "@/components/firm/FirmPayouts";

export const Route = createFileRoute("/brand/payouts")({
  component: BrandPayouts,
});

function BrandPayouts() {
  const { brand } = useBrandAuth();
  if (!brand) return null;
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white">Payouts</h1>
        <p className="mt-1 text-sm text-muted-foreground">On-chain payout intelligence — what traders see publicly.</p>
      </div>
      <FirmPayouts firmName={brand.name} />
    </div>
  );
}
