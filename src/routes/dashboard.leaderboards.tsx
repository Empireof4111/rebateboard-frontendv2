import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel, Pill } from "@/components/dashboard/Primitives";
import { Trophy } from "lucide-react";

export const Route = createFileRoute("/dashboard/leaderboards")({
  component: LeaderboardsPage,
});

const board = [
  { rank: 1, name: "alex_pip", score: 9.6, roi: "+312%" },
  { rank: 2, name: "you", score: 7.4, roi: "+194%" },
  { rank: 3, name: "trader_jane", score: 7.1, roi: "+180%" },
  { rank: 4, name: "ben_fx", score: 6.9, roi: "+162%" },
  { rank: 5, name: "ms_cleo", score: 6.5, roi: "+148%" },
];

function LeaderboardsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Leaderboards" subtitle="Climb the season — earn rewards." actions={<Pill tone="primary"><Trophy className="h-3 w-3" />Season 4</Pill>} />
      <div className="flex flex-wrap gap-2">
        {["ROI", "Discipline", "Consistency", "Improvement", "Trader Score"].map((c) => (
          <button key={c} className="glass-pill rounded-full px-3 py-1.5 text-xs text-white">{c}</button>
        ))}
      </div>
      <Panel title="Top 5 — ROI">
        <ul className="space-y-2">
          {board.map((r) => (
            <li key={r.rank} className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm ${r.name === "you" ? "bg-primary/15 ring-1 ring-primary/40" : "bg-white/5"}`}>
              <div className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-violet-400 to-fuchsia-600 text-xs font-bold text-white">{r.rank}</div>
              <div className="flex-1 font-semibold text-white">{r.name}</div>
              <span className="text-xs text-muted-foreground">Score {r.score}</span>
              <span className="text-sm font-bold text-success">{r.roi}</span>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}
