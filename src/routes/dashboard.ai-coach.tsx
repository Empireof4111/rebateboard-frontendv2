import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  Bot,
  Brain,
  CircleAlert,
  Loader2,
  Send,
  ShieldCheck,
  Sparkles,
  Target,
} from "lucide-react";
import { PageHeader, Panel, Pill } from "@/components/dashboard/Primitives";
import { useAuth } from "@/lib/auth";
import {
  sendRebetaMessage,
  type RebetaChatMessage,
  type RebetaChatResponse,
} from "@/lib/rebeta-api";

export const Route = createFileRoute("/dashboard/ai-coach")({
  component: RebataPage,
});

type RebataMessage = RebetaChatMessage & {
  id: string;
  error?: boolean;
};

const DEFAULT_PROMPTS = [
  "Explain rebates in simple terms",
  "Review a trade setup",
  "Compare this with TBI data",
];

const ACTION_PROMPTS = [
  {
    title: "Rebate clarity",
    detail: "Cashback, eligibility, pending claims.",
    prompt: "Explain how trading rebates and cashback claims work in simple terms.",
  },
  {
    title: "Trade review",
    detail: "Entry, stop, target, invalidation.",
    prompt: "Help me review this trade setup. Ask me for the missing details first.",
  },
  {
    title: "TBI trust check",
    detail: "Broker risk, complaints, payout signals.",
    prompt: "Explain how I should use TBI trust intelligence before choosing a broker or prop firm.",
  },
];

function RebataPage() {
  const { token, user } = useAuth();
  const [tab, setTab] = useState<"chat" | "insights">("chat");
  const [messages, setMessages] = useState<RebataMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hi, I'm Rebeta. Ask me about trades, rebates, cashback, TBI trust data, broker questions, or trading psychology.",
    },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState(DEFAULT_PROMPTS);
  const [lastResponse, setLastResponse] = useState<RebetaChatResponse | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages, sending]);

  async function submitPrompt(rawPrompt = input) {
    const prompt = rawPrompt.trim();
    if (!prompt || sending) return;

    const history = messages
      .filter((message) => !message.error)
      .slice(-12)
      .map(({ role, content }) => ({ role, content }));

    const userMessage: RebataMessage = {
      id: makeId("user"),
      role: "user",
      content: prompt,
    };

    setMessages((current) => [...current, userMessage]);
    setInput("");
    setSending(true);
    setError(null);

    try {
      const response = await sendRebetaMessage(token, {
        message: prompt,
        messages: history,
        mode: "rebata-workspace",
        language: "auto",
        context: {
          surface: "dashboard.ai-coach",
          user: user
            ? {
                id: user.id,
                name: user.name,
                onboardingCompleted: user.onboardingCompleted,
                onboarding: user.onboarding,
              }
            : null,
        },
      });

      setMessages((current) => [
        ...current,
        {
          id: makeId("assistant"),
          role: "assistant",
          content: response.reply,
        },
      ]);
      setSuggestions(response.suggestions?.length ? response.suggestions : DEFAULT_PROMPTS);
      setLastResponse(response);
    } catch (ex) {
      const message = ex instanceof Error ? ex.message : "Rebeta could not answer right now.";
      setError(message);
      setMessages((current) => [
        ...current,
        {
          id: makeId("error"),
          role: "assistant",
          content: message,
          error: true,
        },
      ]);
    } finally {
      setSending(false);
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    void submitPrompt();
  }

  function sendSuggestion(prompt: string) {
    setTab("chat");
    void submitPrompt(prompt);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rebeta"
        subtitle="Your AI trading, rebate, cashback, and trust intelligence assistant."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Pill tone={lastResponse?.provider === "mock" ? "warning" : "primary"}>
              {lastResponse ? `${lastResponse.provider} / ${lastResponse.model}` : "Ready"}
            </Pill>
            <div className="flex gap-1 rounded-full bg-white/5 p-1">
              <button
                type="button"
                onClick={() => setTab("chat")}
                className={`rounded-full px-3 py-1 text-xs ${tab === "chat" ? "bg-white/15 text-white" : "text-muted-foreground"}`}
              >
                Chat
              </button>
              <button
                type="button"
                onClick={() => setTab("insights")}
                className={`rounded-full px-3 py-1 text-xs ${tab === "insights" ? "bg-white/15 text-white" : "text-muted-foreground"}`}
              >
                Insights
              </button>
            </div>
          </div>
        }
      />

      {tab === "chat" ? (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
          <Panel
            title="Rebeta Chat"
            action={
              <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                <ShieldCheck className="h-3.5 w-3.5 text-accent" />
                Educational
              </span>
            }
          >
            <div className="flex h-[min(62vh,560px)] min-h-[420px] flex-col">
              <div className="flex-1 space-y-3 overflow-y-auto pr-1">
                {messages.map((message) => (
                  <ChatBubble key={message.id} message={message} />
                ))}

                {sending && (
                  <div className="flex gap-2">
                    <CoachAvatar />
                    <div className="inline-flex max-w-[75%] items-center gap-2 rounded-2xl bg-white/5 px-3 py-2 text-xs text-white/75">
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-accent" />
                      Rebeta is thinking through the context...
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>

              {error && (
                <div className="mt-3 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-100">
                  <CircleAlert className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}

              <form onSubmit={onSubmit} className="mt-3 flex items-end gap-2">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      void submitPrompt();
                    }
                  }}
                  placeholder="Ask Rebeta about rebates, trades, TBI, brokers, risk, or strategy..."
                  rows={2}
                  className="max-h-32 min-h-[44px] flex-1 resize-none rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-muted-foreground outline-none focus:border-primary/60"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || sending || !token}
                  aria-label="Send message"
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-r from-fuchsia-500 to-violet-600 text-white shadow-[0_0_24px_rgba(192,132,252,0.38)] transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </button>
              </form>
            </div>
          </Panel>

          <Panel title="Quick Prompts" action={<Sparkles className="h-4 w-4 text-accent" />}>
            <div className="space-y-2">
              {suggestions.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => sendSuggestion(prompt)}
                  disabled={sending}
                  className="flex w-full items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-left text-xs text-white/85 transition hover:border-fuchsia-300/40 hover:bg-white/[0.08] disabled:opacity-50"
                >
                  <span>{prompt}</span>
                  <Send className="h-3.5 w-3.5 shrink-0 text-accent" />
                </button>
              ))}
            </div>

            <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-white">
                <Brain className="h-4 w-4 text-accent" />
                Rebeta Scope
              </div>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Trade education, rebates, cashback, TBI context, risk controls, and psychology. No guaranteed signals.
              </p>
            </div>
          </Panel>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          {ACTION_PROMPTS.map((item) => (
            <Panel
              key={item.title}
              title={item.title}
              action={<Target className="h-4 w-4 text-accent" />}
            >
              <p className="min-h-10 text-xs text-white/85">{item.detail}</p>
              <button
                type="button"
                onClick={() => sendSuggestion(item.prompt)}
                disabled={sending}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-white transition hover:border-fuchsia-300/40 hover:bg-white/[0.08] disabled:opacity-50"
              >
                <Sparkles className="h-3.5 w-3.5 text-accent" />
                Ask Rebeta
              </button>
            </Panel>
          ))}
        </div>
      )}

      <Panel title={`Rebata Action Plan${user?.name ? ` for ${user.name}` : ""}`} action={<Sparkles className="h-4 w-4 text-accent" />}>
        <div className="grid gap-3 md:grid-cols-3">
          {[
            { t: "Pre-trade check", d: "Setup, invalidation, reward, risk." },
            { t: "Daily guardrail", d: "Max trades, max loss, stop rule." },
            { t: "Review loop", d: "Screenshot, mistake tag, next action." },
          ].map((plan) => (
            <button
              key={plan.t}
              type="button"
              onClick={() => sendSuggestion(`Create an action plan for: ${plan.t}.`)}
              disabled={sending}
              className="rounded-xl border border-white/10 bg-white/[0.04] p-4 text-left transition hover:border-fuchsia-300/40 hover:bg-white/[0.08] disabled:opacity-50"
            >
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <Target className="h-4 w-4 text-accent" /> {plan.t}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{plan.d}</p>
            </button>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function ChatBubble({ message }: { message: RebataMessage }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex gap-2 ${isUser ? "justify-end" : ""}`}>
      {!isUser && <CoachAvatar error={message.error} />}
      <div
        className={`max-w-[82%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-xs leading-relaxed sm:text-sm ${
          isUser
            ? "bg-primary/30 text-white"
            : message.error
              ? "border border-red-500/30 bg-red-500/10 text-red-100"
              : "bg-white/5 text-white/90"
        }`}
      >
        {message.content}
      </div>
    </div>
  );
}

function CoachAvatar({ error = false }: { error?: boolean }) {
  return (
    <div
      className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${
        error
          ? "bg-red-500/20 text-red-100 ring-1 ring-red-500/30"
          : "bg-gradient-to-br from-violet-400 to-fuchsia-600 text-white"
      }`}
    >
      {error ? <CircleAlert className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
    </div>
  );
}

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
