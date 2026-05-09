import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel } from "@/components/dashboard/Primitives";

export const Route = createFileRoute("/dashboard/calendar")({
  component: CalendarPage,
});

function CalendarPage() {
  // Build a 5x7 mock month
  const days = Array.from({ length: 35 }, (_, i) => {
    const seed = (i * 7) % 11;
    const pnl = ((seed - 5) * 60) + (i % 4 === 0 ? 120 : 0);
    return { day: i + 1, pnl };
  });

  const colorFor = (pnl: number) => {
    if (pnl > 200) return "bg-success/40 text-white";
    if (pnl > 0) return "bg-success/20 text-success";
    if (pnl === 0) return "bg-white/5 text-muted-foreground";
    if (pnl > -200) return "bg-destructive/20 text-destructive";
    return "bg-destructive/40 text-white";
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Calendar" subtitle="PnL heatmap & day-by-day behavior." />

      <Panel title="This Month">
        <div className="grid grid-cols-7 gap-2">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
            <div key={d} className="text-center text-[10px] uppercase text-muted-foreground">{d}</div>
          ))}
          {days.map((d) => (
            <div key={d.day} className={`flex flex-col items-center justify-center rounded-xl p-3 ${colorFor(d.pnl)}`}>
              <div className="text-[10px] opacity-70">{d.day}</div>
              <div className="text-xs font-semibold">{d.pnl >= 0 ? "+" : "−"}${Math.abs(d.pnl)}</div>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Behavior per Day (Last 7)">
        <div className="space-y-2">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d, i) => {
            const score = 6 + ((i * 3) % 4) * 0.5;
            return (
              <div key={d} className="flex items-center gap-3 text-xs">
                <span className="w-10 text-muted-foreground">{d}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/5">
                  <div className="h-full bg-gradient-to-r from-primary to-accent" style={{ width: `${score * 10}%` }} />
                </div>
                <span className="w-10 text-right font-semibold text-white">{score.toFixed(1)}</span>
              </div>
            );
          })}
        </div>
      </Panel>
    </div>
  );
}
