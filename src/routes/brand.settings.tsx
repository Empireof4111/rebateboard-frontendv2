import { createFileRoute } from "@tanstack/react-router";
import { useBrandAuth } from "@/lib/brand-auth";
import { useState } from "react";

export const Route = createFileRoute("/brand/settings")({
  component: BrandSettings,
});

function BrandSettings() {
  const { brand, session, signOut } = useBrandAuth();
  const [website, setWebsite] = useState(brand?.website ?? "");
  const [contact, setContact] = useState(session?.contactEmail ?? "");
  if (!brand) return null;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Brand identity and notification preferences.</p>
      </div>

      <div className="glass rounded-2xl p-5 ring-1 ring-white/10">
        <h2 className="text-sm font-bold text-white">Brand identity</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <Field label="Brand name" value={brand.name} readOnly />
          <Field label="Category" value={brand.category} readOnly />
          <Field label="Country" value={brand.country} readOnly />
          <Field label="Regulation" value={brand.regulation} readOnly />
          <Field label="Website" value={website} onChange={setWebsite} />
          <Field label="Contact email" value={contact} onChange={setContact} />
        </div>
      </div>

      <div className="glass rounded-2xl p-5 ring-1 ring-white/10">
        <h2 className="text-sm font-bold text-white">Notifications</h2>
        <ul className="mt-3 space-y-2 text-sm text-white">
          {["New review submitted", "New complaint filed", "Weekly TBI digest", "Payout disputes"].map((n) => (
            <li key={n} className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2"><span>{n}</span><input type="checkbox" defaultChecked className="h-4 w-4 accent-violet-500" /></li>
          ))}
        </ul>
      </div>

      <button onClick={signOut} className="rounded-xl bg-destructive/20 px-4 py-2 text-sm font-semibold text-destructive hover:bg-destructive/30">Sign out of brand</button>
    </div>
  );
}

function Field({ label, value, onChange, readOnly }: { label: string; value: string; onChange?: (v: string) => void; readOnly?: boolean }) {
  return (
    <div>
      <label className="text-[10px] uppercase text-muted-foreground">{label}</label>
      <input value={value} readOnly={readOnly} onChange={onChange ? (e) => onChange(e.target.value) : undefined} className={`mt-1 w-full rounded-xl px-3 py-2 text-sm text-white outline-none ring-1 ring-white/10 ${readOnly ? "bg-white/[0.02] cursor-default" : "bg-white/5 focus:ring-violet-300/40"}`} />
    </div>
  );
}
