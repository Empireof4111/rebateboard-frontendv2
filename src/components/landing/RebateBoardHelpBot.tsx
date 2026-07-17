import { FormEvent, useMemo, useRef, useState } from "react";
import { Bot, ExternalLink, Loader2, MessageCircle, Send, ShieldCheck, X } from "lucide-react";
import { askPublicHelpBot, type PublicHelpBotLink } from "@/lib/public-help-bot-api";
import { cn } from "@/lib/utils";

type BotMessage = {
  id: string;
  role: "user" | "bot";
  text: string;
  topic?: string;
  links?: PublicHelpBotLink[];
  suggestions?: string[];
};

const STARTER_PROMPTS = [
  "How does RebateBoard cashback work?",
  "What is the Trusted Brand Index?",
  "How do RR rewards work?",
];

function makeId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function RebateBoardHelpBot() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<BotMessage[]>([
    {
      id: "welcome",
      role: "bot",
      topic: "RebateBoard Help",
      text:
        "Hi, I am the RebateBoard Help Bot. Ask me about cashback, TBI, RR rewards, reviews, referrals, Rebeta, or getting started.",
      suggestions: STARTER_PROMPTS,
    },
  ]);
  const conversationId = useMemo(() => makeId(), []);
  const panelRef = useRef<HTMLDivElement>(null);

  async function sendMessage(value: string) {
    const question = value.trim();
    if (!question || sending) return;

    setInput("");
    setSending(true);
    setMessages((current) => [
      ...current,
      { id: makeId(), role: "user", text: question },
    ]);

    try {
      const reply = await askPublicHelpBot(question, conversationId);
      setMessages((current) => [
        ...current,
        {
          id: makeId(),
          role: "bot",
          topic: reply?.topic || "RebateBoard Help",
          text:
            reply?.answer ||
            "I can help with RebateBoard cashback, RR, TBI, reviews, referrals, Rebeta, and support.",
          links: reply?.links || [],
          suggestions: reply?.suggestions || STARTER_PROMPTS,
        },
      ]);
    } catch {
      setMessages((current) => [
        ...current,
        {
          id: makeId(),
          role: "bot",
          topic: "Connection",
          text:
            "I could not reach RebateBoard Help Bot right now. Please try again in a moment or contact support if it is urgent.",
          links: [{ label: "Contact support", url: "/contact" }],
        },
      ]);
    } finally {
      setSending(false);
      window.setTimeout(() => {
        panelRef.current?.querySelector("[data-message-end]")?.scrollIntoView({ behavior: "smooth", block: "end" });
      }, 20);
    }
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendMessage(input);
  }

  return (
    <div className="fixed bottom-5 right-5 z-[80] sm:bottom-6 sm:right-6">
      <div
        className={cn(
          "relative mb-4 w-[calc(100vw-2.5rem)] max-w-[24rem] overflow-hidden rounded-[28px] border border-white/10 bg-[#0d0c14]/82 shadow-[0_24px_80px_rgba(0,0,0,0.5)] backdrop-blur-2xl transition-all duration-200",
          "before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:bg-[radial-gradient(circle_at_18%_0%,rgba(126,77,255,0.2),transparent_36%),linear-gradient(135deg,rgba(255,255,255,0.08),transparent_34%)] before:opacity-90",
          open ? "pointer-events-auto translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0",
        )}
        aria-hidden={!open}
      >
        <div className="relative flex items-center justify-between border-b border-white/10 px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-2xl border border-violet-300/20 bg-violet-500/15 text-violet-100">
              <Bot className="h-5 w-5" />
            </span>
            <div>
              <div className="text-sm font-semibold text-white">RebateBoard Help</div>
              <div className="flex items-center gap-1.5 text-[11px] text-emerald-200/85">
                <ShieldCheck className="h-3 w-3" />
                RebateBoard topics only
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-white/70 transition hover:bg-white/10 hover:text-white"
            aria-label="Close RebateBoard Help"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div ref={panelRef} className="relative max-h-[28rem] space-y-3 overflow-y-auto px-4 py-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "rounded-2xl border px-3.5 py-3 text-sm leading-relaxed",
                message.role === "user"
                  ? "ml-10 border-violet-300/20 bg-violet-500/18 text-white"
                  : "mr-6 border-white/10 bg-white/[0.045] text-white/86",
              )}
            >
              {message.topic && message.role === "bot" && (
                <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-200/80">
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
                      className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-left text-[11px] font-medium text-white/72 transition hover:border-violet-300/30 hover:text-white"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
          {sending && (
            <div className="mr-10 inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.045] px-3.5 py-3 text-sm text-white/70">
              <Loader2 className="h-4 w-4 animate-spin text-violet-200" />
              Checking RebateBoard knowledge...
            </div>
          )}
          <div data-message-end />
        </div>

        <form onSubmit={onSubmit} className="relative border-t border-white/10 p-3">
          <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/25 px-3 py-2 focus-within:border-violet-300/40 focus-within:ring-2 focus-within:ring-violet-500/15">
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask about cashback, TBI, RR..."
              className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/38"
              maxLength={800}
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
        className="group ml-auto flex h-16 w-16 items-center justify-center rounded-[22px] border border-violet-300/25 bg-[#14111f]/86 text-white shadow-[0_20px_55px_rgba(90,34,241,0.34)] backdrop-blur-2xl transition hover:-translate-y-0.5 hover:border-violet-200/45 hover:bg-[#1b1430]"
        aria-label={open ? "Close RebateBoard Help Bot" : "Open RebateBoard Help Bot"}
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-7 w-7 text-violet-100 transition group-hover:scale-105" />}
      </button>
    </div>
  );
}
