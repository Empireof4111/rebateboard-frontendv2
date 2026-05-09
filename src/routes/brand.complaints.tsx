import { createFileRoute } from "@tanstack/react-router";
import { useBrandAuth } from "@/lib/brand-auth";
import { FirmComplaints } from "@/components/firm/FirmComplaints";

export const Route = createFileRoute("/brand/complaints")({
  component: BrandComplaints,
});

function BrandComplaints() {
  const { brand } = useBrandAuth();
  if (!brand) return null;
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white">Complaints inbox</h1>
        <p className="mt-1 text-sm text-muted-foreground">Resolve evidence-backed reports from traders.</p>
      </div>
      <FirmComplaints firmName={brand.name} />
    </div>
  );
}
