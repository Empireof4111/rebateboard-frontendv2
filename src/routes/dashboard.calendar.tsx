import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { EmptyState, PageHeader, Panel } from "@/components/dashboard/Primitives";
import { openAddTrade } from "@/lib/ui-bus";
import { resolveTradeNetPnl, resolveTradeOutcome, useTrades } from "@/lib/trading-plan";
import { CalendarDays, Plus } from "lucide-react";

export const Route = createFileRoute("/dashboard/calendar")({
  component: CalendarPage,
});

function money(value: number) {
  const sign = value < 0 ? "-" : value > 0 ? "+" : "";
  return `${sign}$${Math.abs(value).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

function calendarGuidance(monthTrades: number) {
  if (monthTrades === 0) {
    return "This month is ready for your first logged trade. Quiet days stay blank, and completed journal results will appear as your PnL heatmap.";
  }
  return "Only days with journal activity are highlighted. Quiet days stay blank so your real trading behavior is easier to scan.";
}

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function CalendarPage() {
  const trades = useTrades();
  const today = new Date();

  const data = useMemo(() => {
    const year = today.getFullYear();
    const month = today.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    const leadingBlanks = firstDay === 0 ? 6 : firstDay - 1;
    const monthTrades = trades.filter((trade) => {
      const date = new Date(trade.createdAt);
      return date.getFullYear() === year && date.getMonth() === month;
    });

    const dayRows = Array.from({ length: leadingBlanks }, () => null as null | { day: number; pnl: number; trades: number; pending: number }).concat(
      Array.from({ length: daysInMonth }, (_, index) => {
        const day = index + 1;
        const dayTrades = monthTrades.filter((trade) => new Date(trade.createdAt).getDate() === day);
        const completed = dayTrades
          .map((trade) => resolveTradeNetPnl(trade))
          .filter((value): value is number => value !== null);
        return {
          day,
          pnl: completed.reduce((sum, value) => sum + value, 0),
          trades: dayTrades.length,
          pending: dayTrades.filter((trade) => resolveTradeOutcome(trade) === "pending").length,
        };
      }),
    );

    const last7 = Array.from({ length: 7 }, (_, offset) => {
      const date = new Date(today);
      date.setDate(today.getDate() - (6 - offset));
      const dayTrades = trades.filter((trade) => sameDay(new Date(trade.createdAt), date));
      const avgAdherence = dayTrades.length
        ? Math.round(dayTrades.reduce((sum, trade) => sum + Number(trade.adherence ?? 0), 0) / dayTrades.length)
        : null;
      return {
        label: date.toLocaleDateString(undefined, { weekday: "short" }),
        avgAdherence,
        trades: dayTrades.length,
      };
    });

    return { dayRows, monthTrades, last7 };
  }, [today, trades]);

  const colorFor = (pnl: number, tradeCount: number) => {
    if (tradeCount === 0) return "bg-white/5 text-muted-foreground";
    if (pnl > 200) return "bg-success/40 text-white";
    if (pnl > 0) return "bg-success/20 text-success";
    if (pnl === 0) return "bg-white/10 text-white/70";
    if (pnl > -200) return "bg-destructive/20 text-destructive";
    return "bg-destructive/40 text-white";
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Calendar" subtitle="PnL heatmap and day-by-day behavior from your trade journal." />

      <Panel title={today.toLocaleDateString(undefined, { month: "long", year: "numeric" })}>
        {trades.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title="No calendar data yet"
            description="Log trades to turn this calendar into a real PnL and discipline heatmap."
            action={
              <button
                type="button"
                onClick={openAddTrade}
                className="inline-flex items-center gap-2 rounded-full rb-gradient-primary px-4 py-2 text-xs font-semibold text-white"
              >
                <Plus className="h-3.5 w-3.5" />
                Add trade
              </button>
            }
          />
        ) : (
          <div className="space-y-4">
            <div className="rounded-2xl border border-white/8 bg-white/[0.035] px-4 py-3 text-sm text-muted-foreground">
              {calendarGuidance(data.monthTrades.length)}
            </div>

            <div className="grid grid-cols-7 gap-2">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
                <div key={day} className="text-center text-[10px] uppercase text-muted-foreground">{day}</div>
              ))}
              {data.dayRows.map((day, index) => {
                if (!day) return <div key={`blank-${index}`} className="min-h-16 rounded-xl bg-transparent" />;

                const hasTrades = day.trades > 0;
                const hasOnlyPendingTrades = hasTrades && day.trades === day.pending;

                return (
                  <div
                    key={day.day}
                    className={`flex min-h-16 flex-col items-center justify-center rounded-xl p-2 ${
                      hasTrades ? colorFor(day.pnl, day.trades) : "bg-white/[0.025] text-muted-foreground/55"
                    }`}
                  >
                    <div className="text-[10px] opacity-70">{day.day}</div>
                    {hasTrades && (
                      <>
                        <div className="text-xs font-semibold">{hasOnlyPendingTrades ? "Open result" : money(day.pnl)}</div>
                        <div className="mt-0.5 text-[9px] opacity-70">{day.trades} trade{day.trades === 1 ? "" : "s"}</div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Panel>

      <Panel title="Behavior per Day (Last 7)">
        {data.last7.some((day) => day.trades > 0) ? (
          <div className="space-y-2">
            {data.last7.map((day) => (
              <div key={day.label} className="flex items-center gap-3 text-xs">
                <span className="w-10 text-muted-foreground">{day.label}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/5">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-accent"
                    style={{ width: `${day.avgAdherence ?? 0}%` }}
                  />
                </div>
                <span className="w-16 text-right font-semibold text-white">
                  {day.avgAdherence == null ? "No trades" : `${day.avgAdherence}%`}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No trades logged in the last 7 days.</p>
        )}
      </Panel>
    </div>
  );
}
