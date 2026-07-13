import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel, DataTable } from "@/components/superadmin/AdminUI";
import { apiKeys } from "@/lib/admin-data";
import { KeyRound, Plus } from "lucide-react";

export const Route = createFileRoute("/superadmin/api-keys")({
  component: ApiKeysAdmin,
});

function ApiKeysAdmin() {
  return (
    <div>
      <PageHeader title="API Keys" subtitle="Manage public, webhook and partner API access."
        actions={<button className="inline-flex items-center gap-1.5 rounded-full rb-gradient-primary px-3 py-1.5 text-xs font-semibold text-white"><Plus className="h-3.5 w-3.5" /> New key</button>}
      />
      <Panel title="Active keys">
        <DataTable head={<><th>Name</th><th>Key</th><th>Created</th><th>Calls</th><th></th></>}>
          {apiKeys.map((k) => (
            <tr key={k.name}>
              <td className="font-semibold"><span className="inline-flex items-center gap-2"><KeyRound className="h-3.5 w-3.5 text-fuchsia-400" />{k.name}</span></td>
              <td className="font-mono text-xs text-muted-foreground">{k.key}</td>
              <td className="text-xs text-muted-foreground">{k.created}</td>
              <td className="font-mono">{k.calls}</td>
              <td className="text-right">
                <button className="rounded-md bg-rose-500/15 px-2 py-1 text-[10px] font-bold text-rose-300 ring-1 ring-rose-400/30">Revoke</button>
              </td>
            </tr>
          ))}
        </DataTable>
      </Panel>
    </div>
  );
}
