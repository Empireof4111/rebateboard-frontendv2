import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  Bot,
  Brain,
  CircleAlert,
  Languages,
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
  component: RebetaPage,
});

type RebetaMessage = RebetaChatMessage & {
  id: string;
  error?: boolean;
  suggestions?: string[];
};

type StoredRebetaChat = {
  messages?: RebetaMessage[];
  suggestions?: string[];
  lastResponse?: RebetaChatResponse | null;
  preferredLanguage?: string;
};

const WELCOME_MESSAGE: RebetaMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "Hi, I'm Rebeta. Ask me about trades, rebates, cashback, TBI trust data, broker questions, or trading psychology.",
};

const DEFAULT_PROMPTS = [
  "Explain rebates in simple terms",
  "Review a trade setup",
  "Compare this with TBI data",
];

const LANGUAGE_OPTIONS = [
  "English",
  "Chinese",
  "Spanish",
  "Arabic",
  "French",
  "Japanese",
  "Hindi",
  "German",
  "Russian",
  "Portuguese",
  "Hausa",
  "Yoruba",
  "Igbo",
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

function RebetaPage() {
  const { token, user } = useAuth();
  const [tab, setTab] = useState<"chat" | "insights">("chat");
  const [messages, setMessages] = useState<RebetaMessage[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState(DEFAULT_PROMPTS);
  const [lastResponse, setLastResponse] = useState<RebetaChatResponse | null>(null);
  const [preferredLanguage, setPreferredLanguage] = useState("English");
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const storageKey = `rebeta-chat:${user?.id || "guest"}`;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages, sending]);

  useEffect(() => {
    setHistoryLoaded(false);

    if (typeof window === "undefined") {
      setHistoryLoaded(true);
      return;
    }

    const saved = restoreStoredChat(storageKey);
    setMessages(saved.messages);
    setSuggestions(saved.suggestions);
    setLastResponse(saved.lastResponse);
    setPreferredLanguage(saved.preferredLanguage);
    setError(null);
    setHistoryLoaded(true);
  }, [storageKey]);

  useEffect(() => {
    if (!historyLoaded || typeof window === "undefined") return;

    const payload: StoredRebetaChat = {
      messages: messages.slice(-80),
      suggestions,
      lastResponse,
      preferredLanguage,
    };

    window.localStorage.setItem(storageKey, JSON.stringify(payload));
  }, [historyLoaded, lastResponse, messages, preferredLanguage, storageKey, suggestions]);

  async function submitPrompt(rawPrompt = input) {
    const prompt = rawPrompt.trim();
    if (!prompt || sending) return;

    const history = messages
      .filter((message) => !message.error)
      .slice(-12)
      .map(({ role, content }) => ({ role, content }));

    const userMessage: RebetaMessage = {
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
        mode: "rebeta-workspace",
        language: preferredLanguage,
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

      const cleanedReply = cleanRebetaOutput(response.reply);
      const nextSuggestions = cleanSuggestionList(response.suggestions, DEFAULT_PROMPTS);

      setMessages((current) => [
        ...current,
        {
          id: makeId("assistant"),
          role: "assistant",
          content: cleanedReply,
          suggestions: nextSuggestions,
        },
      ]);
      setSuggestions(nextSuggestions);
      setLastResponse({ ...response, reply: cleanedReply, suggestions: nextSuggestions });
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
            <label className="inline-flex h-8 items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 text-xs text-white/85">
              <Languages className="h-3.5 w-3.5 text-accent" />
              <select
                value={preferredLanguage}
                onChange={(event) => setPreferredLanguage(event.target.value)}
                className="max-w-[130px] bg-transparent text-xs text-white outline-none [color-scheme:dark]"
                aria-label="Rebeta response language"
              >
                {LANGUAGE_OPTIONS.map((language) => (
                  <option key={language} value={language}>
                    {language}
                  </option>
                ))}
              </select>
            </label>
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
              <div className="relative flex-1 overflow-y-auto pr-1">
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 grid place-items-center overflow-hidden"
                >
                  <span className="select-none text-6xl font-black uppercase tracking-normal text-white/[0.035] sm:text-7xl">
                    Rebeta
                  </span>
                </div>

                <div className="relative z-10 space-y-3">
                  {messages.map((message) => (
                    <ChatBubble
                      key={message.id}
                      message={message}
                      disabled={sending}
                      onSuggestion={sendSuggestion}
                    />
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

      <Panel title={`Rebeta Action Plan${user?.name ? ` for ${user.name}` : ""}`} action={<Sparkles className="h-4 w-4 text-accent" />}>
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

function ChatBubble({
  message,
  disabled,
  onSuggestion,
}: {
  message: RebetaMessage;
  disabled: boolean;
  onSuggestion: (prompt: string) => void;
}) {
  const isUser = message.role === "user";
  const showSuggestions = !isUser && !message.error && Boolean(message.suggestions?.length);

  return (
    <div className={`space-y-2 ${isUser ? "flex flex-col items-end" : ""}`}>
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

      {showSuggestions && (
        <div className="ml-10 flex max-w-[82%] flex-wrap gap-2">
          {message.suggestions?.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => onSuggestion(prompt)}
              disabled={disabled}
              className="inline-flex min-h-8 max-w-full items-center gap-1.5 rounded-full border border-fuchsia-300/20 bg-fuchsia-300/[0.08] px-3 py-1.5 text-left text-[11px] leading-snug text-white/85 transition hover:border-fuchsia-300/45 hover:bg-fuchsia-300/[0.13] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Sparkles className="h-3 w-3 shrink-0 text-accent" />
              <span className="min-w-0">{prompt}</span>
            </button>
          ))}
        </div>
      )}
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

function cleanRebetaOutput(text: string) {
  return text.replace(/\*/g, "");
}

function cleanSuggestionList(suggestions: string[] = [], fallback = DEFAULT_PROMPTS) {
  const seen = new Set<string>();

  return [...suggestions, ...fallback]
    .map((suggestion) => cleanRebetaOutput(suggestion).trim())
    .filter((suggestion) => {
      const key = suggestion.toLowerCase();
      if (!suggestion || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 3);
}

function restoreStoredChat(storageKey: string) {
  const fallback = {
    messages: [WELCOME_MESSAGE],
    suggestions: DEFAULT_PROMPTS,
    lastResponse: null,
    preferredLanguage: "English",
  };

  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return fallback;

    const stored = JSON.parse(raw) as StoredRebetaChat;
    const messages = sanitizeStoredMessages(stored.messages);
    const suggestions = cleanSuggestionList(stored.suggestions || DEFAULT_PROMPTS, DEFAULT_PROMPTS);

    return {
      messages: messages.length ? messages : fallback.messages,
      suggestions,
      lastResponse: sanitizeStoredResponse(stored.lastResponse),
      preferredLanguage: sanitizeStoredLanguage(stored.preferredLanguage),
    };
  } catch {
    return fallback;
  }
}

function sanitizeStoredMessages(messages: StoredRebetaChat["messages"]) {
  if (!Array.isArray(messages)) return [];

  return messages
    .filter((message) => message?.role === "user" || message?.role === "assistant")
    .filter((message) => typeof message.content === "string" && message.content.trim())
    .map((message) => ({
      id: typeof message.id === "string" && message.id ? message.id : makeId(message.role),
      role: message.role,
      content: cleanRebetaOutput(message.content),
      error: Boolean(message.error),
      suggestions:
        message.role === "assistant" && !message.error
          ? cleanSuggestionList(message.suggestions || [], [])
          : undefined,
    }))
    .slice(-80);
}

function sanitizeStoredResponse(response: StoredRebetaChat["lastResponse"]) {
  if (!response || typeof response.reply !== "string") return null;

  return {
    reply: cleanRebetaOutput(response.reply),
    provider: response.provider,
    model: response.model,
    suggestions: cleanSuggestionList(response.suggestions || DEFAULT_PROMPTS, DEFAULT_PROMPTS),
    disclaimer: response.disclaimer,
  } satisfies RebetaChatResponse;
}

function sanitizeStoredLanguage(language?: string) {
  return LANGUAGE_OPTIONS.includes(language || "") ? language || "English" : "English";
}
