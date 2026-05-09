import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader, Panel, DataTable, Pill, StatCard } from "@/components/superadmin/AdminUI";
import { ConfirmDialog, toast } from "@/components/superadmin/AdminActions";
import { useAdminCollection, creditWallet } from "@/lib/admin-store";
import { affiliates as seedAff, partnerStructures as seedPart, userWallets } from "@/lib/admin-data";
import { DollarSign, Power } from "lucide-react";

export const Route = createFileRoute("/superadmin/affiliates")({
  component: AffiliatesAdmin,
});

type Affiliate = typeof seedAff[number] & { paid?: boolean };
type PartnerStruct = typeof seedPart[number] & { id: string };

function AffiliatesAdmin() {
  const aff = useAdminCollection<Affiliate>("affiliates", seedAff as Affiliate[]);
  const part = useAdminCollection<PartnerStruct>("partnerStructures", seedPart.map((p) => ({ ...p, id: p.partner })));
  const [paying, setPaying] = useState<Affiliate | null>(null);

  const totalEarned = aff.items.reduce((s, a) => s + Number(String(a.earned).replace(/[^0-9.]/g, "")), 0);
  const totalPending = aff.items.reduce((s, a) => s + Number(String(a.pending).replace(/[^0-9.]/g, "")), 0);

  return (
    <div>
      <PageHeader title="Affiliates / IB" subtitle="Partner commission structures, sub-IB tree, and per-affiliate revenue." />
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Active affiliates" value={String(aff.items.length)} delta="all" tone="up" />
        <StatCard label="Earned" value={`$${totalEarned.toLocaleString()}`} delta="lifetime" tone="up" />
        <StatCard label="Pending payouts" value={`$${totalPending.toLocaleString()}`} delta={`${aff.items.filter((a) => Number(String(a.pending).replace(/[^0-9.]/g, "")) > 0).length} affiliates`} tone="flat" />
        <StatCard label="Sub-IBs" value={String(aff.items.reduce((s, a) => s + a.subIBs, 0))} delta="across network" tone="up" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title={`Top affiliates — ${aff.items.length}`}>
          <DataTable head={<><th>Name</th><th>Partner</th><th>Structure</th><th>Sub-IBs</th><th>Refs</th><th>Earned</th><th>Pending</th><th>Tier</th><th></th></>}>
            {aff.items.map((a) => (
              <tr key={a.id}>
                <td className="font-semibold">{a.name}</td>
                <td>{a.partner}</td>
                <td className="text-xs text-muted-foreground">{a.structure}</td>
                <td className="font-mono">{a.subIBs}</td>
                <td className="font-mono">{a.referrals}</td>
                <td className="font-mono text-emerald-300">{a.earned}</td>
                <td className="font-mono text-amber-300">{a.pending}</td>
                <td><Pill tone={a.tier === "Gold" ? "warn" : "neutral"}>{a.tier}</Pill></td>
                <td className="text-right">
                  <button
                    onClick={() => setPaying(a)}
                    disabled={Number(String(a.pending).replace(/[^0-9.]/g, "")) === 0}
                    className="inline-flex items-center gap-1 rounded-md bg-emerald-500/15 px-2 py-1 text-[10px] font-bold text-emerald-300 ring-1 ring-emerald-400/30 disabled:opacity-30"
                  >
                    <DollarSign className="h-3 w-3" /> Pay
                  </button>
                </td>
              </tr>
            ))}
          </DataTable>
        </Panel>

        <Panel title={`Partner commission structures — ${part.items.length}`}>
          <DataTable head={<><th>Partner</th><th>Category</th><th>Model</th><th>Rate</th><th>Sub-IB</th><th>Status</th><th></th></>}>
            {part.items.map((p) => (
              <tr key={p.id}>
                <td className="font-semibold">{p.partner}</td>
                <td className="text-muted-foreground">{p.category}</td>
                <td>{p.model}</td>
                <td className="font-mono text-fuchsia-300">{p.rate}</td>
                <td className="text-xs">{p.subIB}</td>
                <td>{p.active ? <Pill tone="good">active</Pill> : <Pill tone="neutral">paused</Pill>}</td>
                <td className="text-right">
                  <button
                    onClick={() => { part.update(p.id, { active: !p.active }); toast.success(`${p.partner} ${p.active ? "paused" : "activated"}`); }}
                    title={p.active ? "Pause" : "Activate"}
                    className="grid h-7 w-7 place-items-center rounded-md bg-white/10 text-white"
                  >
                    <Power className="h-3 w-3" />
                  </button>
                </td>
              </tr>
            ))}
          </DataTable>
        </Panel>
      </div>

      <ConfirmDialog
        open={!!paying}
        onClose={() => setPaying(null)}
        onConfirm={() => {
          if (!paying) return;
          const pendingNum = Number(String(paying.pending).replace(/[^0-9.]/g, ""));
          const earnedNum = Number(String(paying.earned).replace(/[^0-9.]/g, "")) + pendingNum;
          aff.update(paying.id, { earned: `$${earnedNum.toLocaleString()}`, pending: "$0", paid: true });
          // Credit affiliate's wallet → logs transaction + audit
          creditWallet({
            walletsSeed: userWallets,
            userKey: paying.name,
            amount: pendingNum,
            narration: `Affiliate commission · ${paying.partner} (${paying.referrals} refs)`,
            type: "Affiliate Payout",
          });
          toast.success(`Paid $${pendingNum} to ${paying.name} · wallet credited`);
        }}
        title={`Pay ${paying?.pending} to ${paying?.name}?`}
        message="Marks the pending balance as paid and rolls it into the lifetime earned total."
        confirmText="Confirm payout"
        tone="primary"
      />
    </div>
  );
}
