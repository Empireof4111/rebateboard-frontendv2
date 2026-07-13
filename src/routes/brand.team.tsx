import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useBrandAuth } from "@/lib/brand-auth";
import { Plus, Trash2, Mail } from "lucide-react";

export const Route = createFileRoute("/brand/team")({
  component: BrandTeam,
});

type Member = { id: string; email: string; role: "owner" | "manager" | "support"; addedAt: string };

function BrandTeam() {
  const { brand, session } = useBrandAuth();
  const [members, setMembers] = useState<Member[]>(() => [
    { id: "m1", email: session?.contactEmail ?? "owner@brand.com", role: "owner", addedAt: new Date().toISOString() },
  ]);
  const [draft, setDraft] = useState({ email: "", role: "manager" as Member["role"] });

  if (!brand) return null;

  function invite() {
    if (!draft.email.includes("@")) return;
    setMembers((p) => [{ id: `m_${Math.random().toString(36).slice(2, 7)}`, email: draft.email, role: draft.role, addedAt: new Date().toISOString() }, ...p]);
    setDraft({ email: "", role: "manager" });
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white">Team</h1>
        <p className="mt-1 text-sm text-muted-foreground">Invite teammates and assign roles.</p>
      </div>

      <div className="glass flex flex-wrap items-end gap-2 rounded-2xl p-4 ring-1 ring-white/10">
        <div className="flex-1 min-w-[200px]">
          <label className="text-[10px] uppercase text-muted-foreground">Email</label>
          <input value={draft.email} onChange={(e) => setDraft((p) => ({ ...p, email: e.target.value }))} type="email" placeholder="teammate@brand.com" className="mt-1 w-full rounded-xl bg-white/5 px-3 py-2 text-sm text-white outline-none ring-1 ring-white/10 focus:ring-fuchsia-300/40" />
        </div>
        <div>
          <label className="text-[10px] uppercase text-muted-foreground">Role</label>
          <select value={draft.role} onChange={(e) => setDraft((p) => ({ ...p, role: e.target.value as Member["role"] }))} className="mt-1 rounded-xl bg-white/5 px-3 py-2 text-sm text-white ring-1 ring-white/10">
            <option className="bg-[var(--rb-bg-input)]" value="manager">Manager</option>
            <option className="bg-[var(--rb-bg-input)]" value="support">Support</option>
            <option className="bg-[var(--rb-bg-input)]" value="owner">Owner</option>
          </select>
        </div>
        <button onClick={invite} className="inline-flex items-center gap-1.5 rounded-full rb-gradient-primary px-4 py-2 text-xs font-bold text-white"><Plus className="h-3.5 w-3.5" /> Invite</button>
      </div>

      <div className="glass rounded-2xl ring-1 ring-white/10 overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-white/[0.04] text-[10px] uppercase tracking-wider text-muted-foreground"><tr><th className="px-4 py-3 text-left">Member</th><th className="px-4 py-3 text-left">Role</th><th className="px-4 py-3 text-left">Added</th><th /></tr></thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.id} className="border-t border-white/5">
                <td className="px-4 py-3"><div className="flex items-center gap-2 text-white"><Mail className="h-3 w-3 text-muted-foreground" />{m.email}</div></td>
                <td className="px-4 py-3 capitalize text-muted-foreground">{m.role}</td>
                <td className="px-4 py-3 text-muted-foreground">{new Date(m.addedAt).toLocaleDateString()}</td>
                <td className="px-4 py-3 text-right">
                  {m.role !== "owner" && <button onClick={() => setMembers((p) => p.filter((x) => x.id !== m.id))} className="grid h-7 w-7 place-items-center rounded-lg bg-white/5 text-rose-300 hover:bg-rose-500/15"><Trash2 className="h-3 w-3" /></button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
