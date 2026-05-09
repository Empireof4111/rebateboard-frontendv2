import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel, Pill } from "@/components/dashboard/Primitives";
import { Trophy } from "lucide-react";

export const Route = createFileRoute("/dashboard/tbi")({
  component: TBIPage,
});

const ranked = [
  { rank: 1, name: "FTMO", tbi: 9.2 }, { rank: 2, name: "IC Markets", tbi: 9.0 },
  { rank: 3, name: "Pepperstone", tbi: 8.7 }, { rank: 4, name: "Bybit", tbi: 8.4 },
  { rank: 5, name: "Binance", tbi: 8.1 }, { rank: 6, name: "MyForexFunds", tbi: 7.8 },
];

function TBIPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="TBI Rankings" subtitle="Trust Index across the trading ecosystem." />
      <Panel title="Top Brands">
        <ul className="space-y-2">
          {ranked.map((r) => (
            <li key={r.name} className="flex items-center gap-3 rounded-xl bg-white/5 px-3 py-2 text-sm">
              <div className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-violet-400 to-fuchsia-600 text-xs font-bold text-white">{r.rank}</div>
              <div className="flex-1 font-semibold text-white">{r.name}</div>
              <Pill tone="primary"><Trophy className="h-3 w-3" />{r.tbi}</Pill>
            </li>
          ))}
        </ul>
      </Panel>
      <Panel title="Your Performance vs TBI">
        <p className="text-sm text-white">You perform <b className="text-success">better with MyForexFunds (TBI 7.8)</b> than with FTMO (TBI 9.2).</p>
        <p className="mt-1 text-xs text-muted-foreground">High trust ≠ best for you. Personal data wins.</p>
      </Panel>
    </div>
  );
}
