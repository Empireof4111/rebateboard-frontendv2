import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel, Pill } from "@/components/dashboard/Primitives";
import { CheckCircle2, MessageCircle } from "lucide-react";

export const Route = createFileRoute("/dashboard/community")({
  component: CommunityPage,
});

function CommunityPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Community" subtitle="Discuss strategies, share setups, get answers." />
      <Panel title="Latest Discussions">
        <ul className="space-y-3">
          {[
            { user: "alex_pip", verified: true, title: "How I built a 30% ROI month with one strategy", replies: 42 },
            { user: "trader_jane", verified: true, title: "ICT killzones — does it actually work?", replies: 88 },
            { user: "newbie_22", verified: false, title: "First payout from FTMO — AMA", replies: 17 },
          ].map((p) => (
            <li key={p.title} className="flex items-start gap-3 rounded-xl bg-white/5 p-3">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-violet-400 to-fuchsia-600 text-xs font-bold text-white">{p.user.slice(0, 2).toUpperCase()}</div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-white">{p.user}</span>
                  {p.verified && <Pill tone="success"><CheckCircle2 className="h-3 w-3" />Verified</Pill>}
                </div>
                <div className="mt-0.5 text-sm text-white">{p.title}</div>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground"><MessageCircle className="h-3.5 w-3.5" />{p.replies}</div>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}
