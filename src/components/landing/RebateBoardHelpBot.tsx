import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  ExternalLink,
  Loader2,
  Minimize2,
  Send,
  ShieldCheck,
  ThumbsDown,
  ThumbsUp,
  X,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { askPublicHelpBot, type PublicHelpBotLink } from "@/lib/public-help-bot-api";
import { cn } from "@/lib/utils";

type BotMessage = {
  id: string;
  role: "user" | "bot";
  text: string;
  topic?: string;
  intent?: string;
  confidence?: number;
  links?: PublicHelpBotLink[];
  suggestions?: string[];
  feedback?: "yes" | "no";
  escalation?: boolean;
};

const STARTER_PROMPTS = [
  "How cashback works",
  "Explore trusted brands",
  "Account support",
  "Contact the team",
];

const SUPPORT_LINKS: PublicHelpBotLink[] = [
  { label: "Contact support", url: "/contact" },
  { label: "Help Center", url: "/help-center" },
];

function makeId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function recordHelpBotEvent(type: string, detail: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;
  const payload = { type, at: new Date().toISOString(), ...detail };
  window.dispatchEvent(new CustomEvent("rb:public-help-bot", { detail: payload }));

  const debugEnabled =
    import.meta.env.DEV || window.localStorage.getItem("rb_help_bot_debug") === "true";
  if (debugEnabled) {
    console.info("[RebateBoard Support]", payload);
  }
}

export function RebateBoardHelpBot() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<BotMessage[]>([
    {
      id: "welcome",
      role: "bot",
      topic: "RebateBoard Support",
      intent: "welcome",
      text: "Hi, welcome to RebateBoard Support. How can we help you today?",
      suggestions: STARTER_PROMPTS,
    },
  ]);
  const conversationId = useMemo(() => makeId(), []);
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    recordHelpBotEvent("chatbot_opened", { conversationId });
    window.setTimeout(() => inputRef.current?.focus(), 120);
  }, [conversationId, open]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  function scrollToEnd() {
    window.setTimeout(() => {
      panelRef.current?.querySelector("[data-message-end]")?.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    }, 30);
  }

  function latestSupportTopic(currentMessages: BotMessage[]) {
    return [...currentMessages]
      .reverse()
      .find((message) => message.role === "bot" && message.intent && message.intent !== "welcome")
      ?.intent;
  }

  async function sendMessage(value: string) {
    const question = value.trim();
    if (!question || sending) return;

    const previousTopic = latestSupportTopic(messages);
    const userMessage: BotMessage = { id: makeId(), role: "user", text: question };

    setInput("");
    setSending(true);
    setMessages((current) => [...current, userMessage]);
    recordHelpBotEvent("question_submitted", {
      conversationId,
      questionLength: question.length,
      previousTopic,
    });

    try {
      const reply = await askPublicHelpBot(question, conversationId, { previousTopic });
      const botMessage: BotMessage = {
        id: makeId(),
        role: "bot",
        topic: reply?.topic || "RebateBoard Support",
        intent: reply?.intent,
        confidence: reply?.confidence,
        text:
          reply?.answer ||
          "I can help with RebateBoard accounts, cashback, reviews, rewards, listed brands, and platform support.",
        links: reply?.links || SUPPORT_LINKS,
        suggestions: reply?.suggestions || STARTER_PROMPTS,
        escalation: Boolean(reply?.escalation),
      };

      setMessages((current) => [...current, botMessage]);
      recordHelpBotEvent("answer_selected", {
        conversationId,
        intent: botMessage.intent,
        confidence: botMessage.confidence,
        fallback: Boolean(reply?.fallback),
        clarification: Boolean(reply?.clarification),
        escalation: Boolean(reply?.escalation),
      });
    } catch {
      const fallbackMessage: BotMessage = {
        id: makeId(),
        role: "bot",
        topic: "Connection",
        intent: "connection-error",
        text: "I could not reach RebateBoard Support right now. Please try again in a moment or contact the team if it is urgent.",
        links: SUPPORT_LINKS,
        suggestions: ["Contact the team", "Open Help Center", "How cashback works"],
        escalation: true,
      };
      setMessages((current) => [...current, fallbackMessage]);
      recordHelpBotEvent("fallback_triggered", { conversationId, reason: "network_error" });
    } finally {
      setSending(false);
      scrollToEnd();
    }
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendMessage(input);
  }

  function giveFeedback(message: BotMessage, feedback: "yes" | "no") {
    recordHelpBotEvent("answer_feedback", {
      conversationId,
      messageId: message.id,
      intent: message.intent,
      confidence: message.confidence,
      feedback,
    });

    setMessages((current) => {
      const alreadyAnswered = current.find((item) => item.id === message.id)?.feedback;
      const updated = current.map((item) =>
        item.id === message.id ? { ...item, feedback } : item,
      );

      if (feedback === "no" && !alreadyAnswered) {
        updated.push({
          id: makeId(),
          role: "bot",
          topic: "Support options",
          intent: "feedback-escalation",
          text: "Thanks for the note. Let me help you reach the RebateBoard team or open the Help Center for a more exact answer.",
          links: SUPPORT_LINKS,
          suggestions: ["Contact the team", "Open Help Center", "Ask another question"],
          escalation: true,
        });
      }

      return updated;
    });
    scrollToEnd();
  }

  return (
    <div className="fixed bottom-[calc(env(safe-area-inset-bottom)+1rem)] right-4 z-[80] sm:bottom-6 sm:right-6">
      <div
        className={cn(
          "relative mb-3 flex max-h-[min(78dvh,32rem)] w-[calc(100vw-2rem)] max-w-[21.75rem] flex-col overflow-hidden rounded-[26px] border border-white/10 bg-[#0d0c14]/88 shadow-[0_24px_70px_rgba(0,0,0,0.52)] backdrop-blur-2xl transition-all duration-200 sm:max-w-[22.25rem]",
          "before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:bg-[radial-gradient(circle_at_18%_0%,rgba(126,77,255,0.18),transparent_34%),linear-gradient(135deg,rgba(255,255,255,0.075),transparent_36%)] before:opacity-90",
          open
            ? "pointer-events-auto translate-y-0 opacity-100"
            : "pointer-events-none translate-y-3 opacity-0",
        )}
        aria-hidden={!open}
      >
        <div className="relative flex items-center justify-between border-b border-white/10 px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-2xl border border-violet-300/25 bg-violet-500/15 text-violet-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
              <Logo iconOnly heightClass="h-7" />
            </span>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-white">RebateBoard Support</div>
              <div className="flex items-center gap-1.5 text-[11px] text-emerald-200/85">
                <ShieldCheck className="h-3 w-3" />
                Online
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-white/70 transition hover:bg-white/10 hover:text-white"
              aria-label="Minimize RebateBoard Support"
            >
              <Minimize2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-white/70 transition hover:bg-white/10 hover:text-white"
              aria-label="Close RebateBoard Support"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div
          ref={panelRef}
          className="relative flex-1 space-y-3 overflow-y-auto px-3.5 py-4"
          aria-live="polite"
        >
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "rounded-2xl border px-3.5 py-3 text-sm leading-relaxed",
                message.role === "user"
                  ? "ml-8 border-violet-300/20 bg-violet-500/18 text-white"
                  : "mr-5 border-white/10 bg-white/[0.045] text-white/86",
              )}
            >
              {message.topic && message.role === "bot" && (
                <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-violet-200/80">
                  {message.topic}
                </div>
              )}
              <div>{message.text}</div>
              {message.links && message.links.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {message.links.map((link) => (
                    <a
                      key={`${message.id}-${link.url}`}
                      href={link.url}
                      onClick={() =>
                        recordHelpBotEvent("support_link_clicked", {
                          conversationId,
                          intent: message.intent,
                          url: link.url,
                        })
                      }
                      className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs font-semibold text-violet-100 transition hover:border-violet-300/35 hover:bg-violet-500/16"
                    >
                      {link.label}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  ))}
                </div>
              )}
              {message.suggestions && message.role === "bot" && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {message.suggestions.slice(0, 3).map((prompt) => (
                    <button
                      key={`${message.id}-${prompt}`}
                      type="button"
                      onClick={() => void sendMessage(prompt)}
                      disabled={sending}
                      className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-left text-[11px] font-medium text-white/72 transition hover:border-violet-300/30 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              )}
              {message.role === "bot" && message.id !== "welcome" && (
                <div className="mt-3 flex items-center gap-2 border-t border-white/10 pt-2 text-[11px] text-white/50">
                  <span>Was this helpful?</span>
                  <button
                    type="button"
                    onClick={() => giveFeedback(message, "yes")}
                    className={cn(
                      "inline-flex h-7 items-center gap-1 rounded-full border border-white/10 px-2 text-white/65 transition hover:bg-white/10 hover:text-white",
                      message.feedback === "yes" &&
                        "border-emerald-300/30 bg-emerald-400/10 text-emerald-100",
                    )}
                    aria-label="This answer was helpful"
                  >
                    <ThumbsUp className="h-3.5 w-3.5" />
                    Yes
                  </button>
                  <button
                    type="button"
                    onClick={() => giveFeedback(message, "no")}
                    className={cn(
                      "inline-flex h-7 items-center gap-1 rounded-full border border-white/10 px-2 text-white/65 transition hover:bg-white/10 hover:text-white",
                      message.feedback === "no" &&
                        "border-rose-300/30 bg-rose-400/10 text-rose-100",
                    )}
                    aria-label="This answer was not helpful"
                  >
                    <ThumbsDown className="h-3.5 w-3.5" />
                    No
                  </button>
                </div>
              )}
            </div>
          ))}
          {sending && (
            <div className="mr-10 inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.045] px-3.5 py-3 text-sm text-white/70">
              <Loader2 className="h-4 w-4 animate-spin text-violet-200" />
              Finding the best support answer...
            </div>
          )}
          <div data-message-end />
        </div>

        <form onSubmit={onSubmit} className="relative border-t border-white/10 bg-black/15 p-3">
          <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/30 px-3 py-2 focus-within:border-violet-300/40 focus-within:ring-2 focus-within:ring-violet-500/15">
            <input
              ref={inputRef}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask RebateBoard support..."
              className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/38"
              maxLength={800}
              aria-label="Ask RebateBoard support"
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              className="grid h-9 w-9 place-items-center rounded-full bg-violet-500 text-white shadow-[0_10px_26px_rgba(90,34,241,0.36)] transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-45"
              aria-label="Send message"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </form>
      </div>

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={cn(
          "group relative ml-auto flex h-15 w-15 items-center justify-center overflow-hidden rounded-[22px] border border-violet-300/25 bg-[#14111f]/88 text-white shadow-[0_20px_55px_rgba(90,34,241,0.34)] backdrop-blur-2xl transition hover:-translate-y-0.5 hover:border-violet-200/45 hover:bg-[#1b1430]",
          "before:pointer-events-none before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_30%_10%,rgba(126,77,255,0.32),transparent_48%)]",
          !open &&
            "after:absolute after:inset-[-5px] after:rounded-[26px] after:border after:border-violet-300/20 after:opacity-0 after:transition group-hover:after:opacity-100",
        )}
        aria-label={open ? "Close RebateBoard Support" : "Open RebateBoard Support"}
      >
        {open ? (
          <X className="relative h-6 w-6" />
        ) : (
          <span className="relative grid h-9 w-9 place-items-center rounded-2xl bg-violet-500/10">
            <Logo iconOnly heightClass="h-8" />
          </span>
        )}
      </button>
    </div>
  );
}
