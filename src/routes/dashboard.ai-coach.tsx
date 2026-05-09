import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel, Pill } from "@/components/dashboard/Primitives";
import { useState } from "react";
import { Bot, Send, Sparkles, Target } from "lucide-react";

export const Route = createFileRoute("/dashboard/ai-coach")({
  component: AICoachPage,
});

function AICoachPage() {
  const [tab, setTab] = useState<"chat" | "insights">("chat");
  const [messages, setMessages] = useState([
    { role: "ai", text: "Hey! I've reviewed your last 30 days. Want me to break down your weakest area or build an action plan?" },
  ]);
  const [input, setInput] = useState("");

  const send = () => {
    if (!input.trim()) return;
    setMessages((m) => [
      ...m,
      { role: "user", text: input },
      { role: "ai", text: "Based on your data, the biggest leak is over-trading after 2 losses. I'd cap you at 4 trades/day and skip NY session this week." },
    ]);
    setInput("");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Coach"
        subtitle="Your personal trading coach — chat, insights, and action plans."
        actions={
          <div className="flex gap-1 rounded-full bg-white/5 p-1">
            <button onClick={() => setTab("chat")} className={`rounded-full px-3 py-1 text-xs ${tab === "chat" ? "bg-white/15 text-white" : "text-muted-foreground"}`}>Chat</button>
            <button onClick={() => setTab("insights")} className={`rounded-full px-3 py-1 text-xs ${tab === "insights" ? "bg-white/15 text-white" : "text-muted-foreground"}`}>Auto Insights</button>
          </div>
        }
      />

      {tab === "chat" ? (
        <Panel title="Chat with Coach">
          <div className="flex h-[420px] flex-col">
            <div className="flex-1 space-y-3 overflow-y-auto pr-2">
              {messages.map((m, i) => (
                <div key={i} className={`flex gap-2 ${m.role === "user" ? "justify-end" : ""}`}>
                  {m.role === "ai" && (
                    <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-gradient-to-br from-violet-400 to-fuchsia-600">
                      <Bot className="h-3.5 w-3.5 text-white" />
                    </div>
                  )}
                  <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-xs ${m.role === "user" ? "bg-primary/30 text-white" : "bg-white/5 text-white/90"}`}>
                    {m.text}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
                placeholder="Ask anything about your trading…"
                className="flex-1 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white outline-none focus:border-primary/60"
              />
              <button onClick={send} className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-600 text-white">
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </Panel>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <Panel title="Daily Report" action={<Pill tone="primary">Today</Pill>}>
            <p className="text-xs text-white/85">3 trades, 2 wins. London session win rate 71%. Watch overtrading after 13:00.</p>
          </Panel>
          <Panel title="Weekly Report" action={<Pill>This week</Pill>}>
            <p className="text-xs text-white/85">+4.2R net. Discipline up 0.6 pts. Strategy A is carrying performance.</p>
          </Panel>
          <Panel title="Monthly Review">
            <p className="text-xs text-white/85">+18.4% ROI. You broke risk rules 9× — biggest improvement opportunity.</p>
          </Panel>
        </div>
      )}

      <Panel title="Action Plan Generator" action={<Sparkles className="h-4 w-4 text-accent" />}>
        <div className="grid gap-3 md:grid-cols-3">
          {[
            { t: "Max 4 trades/day", d: "After 2 losses, stop." },
            { t: "Focus Strategy A", d: "Best ROI driver this month." },
            { t: "Avoid NY session", d: "−3.4R last 14 days." },
          ].map((p) => (
            <div key={p.t} className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <Target className="h-4 w-4 text-accent" /> {p.t}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{p.d}</p>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
