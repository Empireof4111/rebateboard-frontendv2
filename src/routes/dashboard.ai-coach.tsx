import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  Bot,
  Brain,
  CircleAlert,
  FileText,
  Image as ImageIcon,
  Languages,
  Loader2,
  Paperclip,
  Plus,
  Send,
  ShieldCheck,
  Sparkles,
  Target,
  X,
} from "lucide-react";
import { PageHeader, Panel, Pill } from "@/components/dashboard/Primitives";
import { useAuth } from "@/lib/auth";
import {
  sendRebetaMessage,
  type RebetaAction,
  type RebetaAttachment,
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
  attachments?: AttachmentPreview[];
  insights?: string[];
  warnings?: string[];
  predictions?: string[];
  actions?: RebetaAction[];
};

type AttachmentPreview = Pick<RebetaAttachment, "id" | "name" | "mimeType" | "size" | "kind">;

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

const MAX_ATTACHMENTS = 4;
const MAX_ATTACHMENT_BYTES = 1_500_000;
const MAX_IMAGE_SOURCE_BYTES = 5_000_000;
const MAX_TEXT_CHARS = 12000;

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
  const [attachments, setAttachments] = useState<RebetaAttachment[]>([]);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
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

  async function submitPrompt(rawPrompt = input, outgoingAttachments = attachments) {
    const typedPrompt = rawPrompt.trim();
    const hasAttachments = outgoingAttachments.length > 0;
    const prompt = typedPrompt || (hasAttachments ? "Analyze the attached file or image." : "");
    if ((!prompt && !hasAttachments) || sending) return;

    const history = messages
      .filter((message) => !message.error)
      .slice(-12)
      .map(({ role, content }) => ({ role, content }));

    const userMessage: RebetaMessage = {
      id: makeId("user"),
      role: "user",
      content: displayPrompt(prompt, outgoingAttachments),
      attachments: outgoingAttachments.map(toAttachmentPreview),
    };

    setMessages((current) => [...current, userMessage]);
    setInput("");
    setAttachments([]);
    setAttachmentError(null);
    setSending(true);
    setError(null);

    try {
      const response = await sendRebetaMessage(token, {
        message: prompt,
        messages: history,
        mode: "rebeta-workspace",
        language: preferredLanguage,
        attachments: outgoingAttachments,
        context: {
          surface: "dashboard.ai-coach",
          attachments: outgoingAttachments.map(toContextAttachment),
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
      const structured = sanitizeStructuredResponse(response);

      setMessages((current) => [
        ...current,
        {
          id: makeId("assistant"),
          role: "assistant",
          content: cleanedReply,
          suggestions: nextSuggestions,
          insights: structured.insights,
          warnings: structured.warnings,
          predictions: structured.predictions,
          actions: structured.actions,
        },
      ]);
      setSuggestions(nextSuggestions);
      setLastResponse({ ...structured, reply: cleanedReply, suggestions: nextSuggestions });
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
    void submitPrompt(prompt, []);
  }

  async function handleFileSelection(fileList: FileList | null) {
    if (!fileList?.length) return;

    const remaining = MAX_ATTACHMENTS - attachments.length;
    const selected = Array.from(fileList).slice(0, Math.max(remaining, 0));
    if (!selected.length) {
      setAttachmentError(`You can attach up to ${MAX_ATTACHMENTS} files at a time.`);
      return;
    }

    setAttachmentError(null);
    const next: RebetaAttachment[] = [];

    for (const file of selected) {
      try {
        next.push(await prepareAttachment(file));
      } catch (error) {
        setAttachmentError(error instanceof Error ? error.message : "Unable to attach that file.");
      }
    }

    if (next.length) {
      setAttachments((current) => [...current, ...next].slice(0, MAX_ATTACHMENTS));
    }
  }

  function removeAttachment(id: string) {
    setAttachments((current) => current.filter((attachment) => attachment.id !== id));
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

              {attachmentError && (
                <div className="mt-3 flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
                  <CircleAlert className="h-4 w-4 shrink-0" />
                  {attachmentError}
                </div>
              )}

              <form onSubmit={onSubmit} className="mt-3 rounded-2xl border border-white/10 bg-white/[0.04] p-2 focus-within:border-primary/60">
                {attachments.length > 0 && (
                  <div className="mb-2 flex flex-wrap gap-2">
                    {attachments.map((attachment) => (
                      <AttachmentChip
                        key={attachment.id}
                        attachment={attachment}
                        onRemove={() => removeAttachment(attachment.id)}
                      />
                    ))}
                  </div>
                )}

                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      void submitPrompt();
                    }
                  }}
                  placeholder="Ask Rebeta about rebates, trades, TBI, brokers, risk, strategy, or an uploaded chart..."
                  rows={2}
                  className="max-h-32 min-h-[54px] w-full resize-none bg-transparent px-2 py-2 text-sm text-white placeholder:text-muted-foreground outline-none"
                />

                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/5 pt-2">
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="image/*,.csv,.txt,.json,.md,.log,.pdf"
                      className="hidden"
                      onChange={(event) => {
                        void handleFileSelection(event.currentTarget.files);
                        event.currentTarget.value = "";
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={sending || attachments.length >= MAX_ATTACHMENTS}
                      aria-label="Attach file"
                      title="Attach image, CSV, or text file"
                      className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-white transition hover:border-fuchsia-300/40 hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                    <label className="inline-flex h-9 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-2.5 text-xs text-white/85">
                      <Languages className="h-3.5 w-3.5 text-accent" />
                      <select
                        value={preferredLanguage}
                        onChange={(event) => setPreferredLanguage(event.target.value)}
                        className="max-w-[132px] bg-transparent text-xs text-white outline-none [color-scheme:dark]"
                        aria-label="Rebeta response language"
                      >
                        {LANGUAGE_OPTIONS.map((language) => (
                          <option key={language} value={language}>
                            {language}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={(!input.trim() && attachments.length === 0) || sending || !token}
                    aria-label="Send message"
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-r from-fuchsia-500 to-violet-600 text-white shadow-[0_0_24px_rgba(192,132,252,0.38)] transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </button>
                </div>
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
  const hasStructuredBlocks =
    !isUser &&
    !message.error &&
    Boolean(message.insights?.length || message.warnings?.length || message.predictions?.length || message.actions?.length);

  return (
    <div className={`space-y-2 ${isUser ? "flex flex-col items-end" : ""}`}>
      <div className={`flex gap-2 ${isUser ? "justify-end" : ""}`}>
        {!isUser && <CoachAvatar error={message.error} />}
        <div className={`max-w-[82%] space-y-2 ${isUser ? "items-end" : ""}`}>
          <div
            className={`whitespace-pre-wrap rounded-2xl px-3 py-2 text-xs leading-relaxed sm:text-sm ${
              isUser
                ? "bg-primary/30 text-white"
                : message.error
                  ? "border border-red-500/30 bg-red-500/10 text-red-100"
                  : "bg-white/5 text-white/90"
            }`}
          >
            {message.content}
          </div>
          {Boolean(message.attachments?.length) && (
            <div className={`flex flex-wrap gap-1.5 ${isUser ? "justify-end" : ""}`}>
              {message.attachments?.map((attachment) => (
                <span
                  key={attachment.id}
                  className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-2 py-1 text-[10px] text-white/70"
                >
                  {attachment.kind === "image" ? <ImageIcon className="h-3 w-3" /> : <Paperclip className="h-3 w-3" />}
                  <span className="truncate">{attachment.name}</span>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {hasStructuredBlocks && (
        <div className="ml-10 grid max-w-[82%] gap-2 md:grid-cols-2">
          <StructuredList title="Insights" items={message.insights} tone="primary" />
          <StructuredList title="Warnings" items={message.warnings} tone="warning" />
          <StructuredList title="Predictions" items={message.predictions} tone="default" />
          {Boolean(message.actions?.length) && (
            <div className="rounded-xl border border-white/10 bg-white/[0.035] p-3">
              <div className="mb-2 text-[11px] font-semibold text-white">Actions</div>
              <div className="flex flex-wrap gap-2">
                {message.actions?.map((action) => (
                  <button
                    key={`${action.label}-${action.command}`}
                    type="button"
                    onClick={() => onSuggestion(action.command)}
                    disabled={disabled}
                    className="rounded-full border border-fuchsia-300/20 bg-fuchsia-300/[0.08] px-2.5 py-1.5 text-left text-[10px] text-white/85 transition hover:border-fuchsia-300/45 hover:bg-fuchsia-300/[0.13] disabled:opacity-50"
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

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

function AttachmentChip({
  attachment,
  onRemove,
}: {
  attachment: RebetaAttachment;
  onRemove: () => void;
}) {
  return (
    <span className="inline-flex max-w-full items-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] px-2.5 py-1.5 text-[11px] text-white/80">
      {attachment.kind === "image" ? (
        <ImageIcon className="h-3.5 w-3.5 shrink-0 text-accent" />
      ) : attachment.kind === "text" ? (
        <FileText className="h-3.5 w-3.5 shrink-0 text-accent" />
      ) : (
        <Paperclip className="h-3.5 w-3.5 shrink-0 text-accent" />
      )}
      <span className="min-w-0 max-w-[180px] truncate">{attachment.name}</span>
      <span className="text-white/35">{formatBytes(attachment.size)}</span>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${attachment.name}`}
        className="grid h-5 w-5 shrink-0 place-items-center rounded-md text-white/50 transition hover:bg-white/10 hover:text-white"
      >
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}

function StructuredList({
  title,
  items,
  tone,
}: {
  title: string;
  items?: string[];
  tone: "primary" | "warning" | "default";
}) {
  if (!items?.length) return null;
  const toneClass =
    tone === "warning"
      ? "border-amber-400/20 bg-amber-400/[0.06] text-amber-100"
      : tone === "primary"
        ? "border-fuchsia-300/20 bg-fuchsia-300/[0.06] text-white/85"
        : "border-white/10 bg-white/[0.035] text-white/75";

  return (
    <div className={`rounded-xl border p-3 ${toneClass}`}>
      <div className="mb-1.5 text-[11px] font-semibold text-white">{title}</div>
      <ul className="space-y-1 text-[11px] leading-relaxed">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

async function prepareAttachment(file: File): Promise<RebetaAttachment> {
  const mimeType = file.type || guessMimeType(file.name);
  const isImage = mimeType.startsWith("image/");
  const isText = isTextLikeFile(file, mimeType);

  if (isImage) {
    if (file.size > MAX_IMAGE_SOURCE_BYTES) {
      throw new Error(`${file.name} is too large. Use an image under ${formatBytes(MAX_IMAGE_SOURCE_BYTES)}.`);
    }

    const data = await readCompressedImage(file);
    const size = estimateBase64Bytes(data);
    if (size > MAX_ATTACHMENT_BYTES) {
      throw new Error(`${file.name} is still too large after compression. Try a smaller screenshot.`);
    }

    return {
      id: makeId("attachment"),
      name: file.name,
      mimeType: "image/jpeg",
      size,
      kind: "image",
      data,
    };
  }

  if (isText) {
    if (file.size > MAX_ATTACHMENT_BYTES) {
      throw new Error(`${file.name} is too large. Use a text or CSV file under ${formatBytes(MAX_ATTACHMENT_BYTES)}.`);
    }

    const text = (await readFileAsText(file)).slice(0, MAX_TEXT_CHARS);
    return {
      id: makeId("attachment"),
      name: file.name,
      mimeType,
      size: file.size,
      kind: "text",
      text,
    };
  }

  if (file.size > MAX_ATTACHMENT_BYTES) {
    throw new Error(`${file.name} is too large. Use a file under ${formatBytes(MAX_ATTACHMENT_BYTES)}.`);
  }

  return {
    id: makeId("attachment"),
    name: file.name,
    mimeType,
    size: file.size,
    kind: "file",
  };
}

function readFileAsText(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error(`Could not read ${file.name}.`));
    reader.readAsText(file);
  });
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error(`Could not read ${file.name}.`));
    reader.readAsDataURL(file);
  });
}

async function readCompressedImage(file: File) {
  const dataUrl = await readFileAsDataUrl(file);
  if (typeof document === "undefined") return dataUrl;

  return new Promise<string>((resolve) => {
    const image = new Image();
    image.onload = () => {
      const maxSide = 1100;
      const ratio = Math.min(1, maxSide / Math.max(image.width, image.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(image.width * ratio));
      canvas.height = Math.max(1, Math.round(image.height * ratio));
      const context = canvas.getContext("2d");
      if (!context) {
        resolve(dataUrl);
        return;
      }
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", 0.72));
    };
    image.onerror = () => resolve(dataUrl);
    image.src = dataUrl;
  });
}

function isTextLikeFile(file: File, mimeType: string) {
  const name = file.name.toLowerCase();
  return (
    mimeType.startsWith("text/") ||
    mimeType.includes("json") ||
    name.endsWith(".csv") ||
    name.endsWith(".json") ||
    name.endsWith(".md") ||
    name.endsWith(".log") ||
    name.endsWith(".txt")
  );
}

function guessMimeType(name: string) {
  const lower = name.toLowerCase();
  if (lower.endsWith(".csv")) return "text/csv";
  if (lower.endsWith(".json")) return "application/json";
  if (lower.endsWith(".md")) return "text/markdown";
  if (lower.endsWith(".pdf")) return "application/pdf";
  return "application/octet-stream";
}

function estimateBase64Bytes(dataUrl: string) {
  const base64 = dataUrl.includes(",") ? dataUrl.split(",").pop() || "" : dataUrl;
  return Math.ceil((base64.length * 3) / 4);
}

function toAttachmentPreview(attachment: RebetaAttachment): AttachmentPreview {
  const { id, name, mimeType, size, kind } = attachment;
  return { id, name, mimeType, size, kind };
}

function toContextAttachment(attachment: RebetaAttachment) {
  const { id, name, mimeType, size, kind, text } = attachment;
  return { id, name, mimeType, size, kind, text };
}

function displayPrompt(prompt: string, attachments: RebetaAttachment[]) {
  if (!attachments.length) return prompt;
  const names = attachments.map((attachment) => attachment.name).join(", ");
  return `${prompt}\n\nAttached: ${names}`;
}

function formatBytes(bytes: number) {
  if (!bytes) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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

function sanitizeStructuredResponse(response: RebetaChatResponse): RebetaChatResponse {
  return {
    ...response,
    reply: cleanRebetaOutput(response.reply),
    suggestions: cleanSuggestionList(response.suggestions || DEFAULT_PROMPTS, DEFAULT_PROMPTS),
    insights: cleanStringList(response.insights, 4),
    warnings: cleanStringList(response.warnings, 3),
    predictions: cleanStringList(response.predictions, 3),
    actions: cleanActionList(response.actions),
  };
}

function cleanStringList(items: unknown, limit: number) {
  if (!Array.isArray(items)) return [];
  const seen = new Set<string>();

  return items
    .map((item) => cleanRebetaOutput(String(item || "")).trim())
    .filter((item) => {
      const key = item.toLowerCase();
      if (!item || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, limit);
}

function cleanActionList(actions: unknown) {
  if (!Array.isArray(actions)) return [];
  const seen = new Set<string>();

  return actions
    .map((action) => ({
      label: cleanRebetaOutput(String(action?.label || "")).trim(),
      command: cleanRebetaOutput(String(action?.command || "")).trim(),
      module: typeof action?.module === "string" ? action.module : undefined,
    }))
    .filter((action) => {
      const key = `${action.label}:${action.command}`.toLowerCase();
      if (!action.label || !action.command || seen.has(key)) return false;
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
      attachments: sanitizeStoredAttachments(message.attachments),
      suggestions:
        message.role === "assistant" && !message.error
          ? cleanSuggestionList(message.suggestions || [], [])
          : undefined,
      insights: cleanStringList(message.insights, 4),
      warnings: cleanStringList(message.warnings, 3),
      predictions: cleanStringList(message.predictions, 3),
      actions: cleanActionList(message.actions),
    }))
    .slice(-80);
}

function sanitizeStoredAttachments(attachments: RebetaMessage["attachments"]) {
  if (!Array.isArray(attachments)) return undefined;
  return attachments
    .filter((attachment) => attachment?.name && attachment?.id)
    .map((attachment) => ({
      id: String(attachment.id),
      name: String(attachment.name),
      mimeType: String(attachment.mimeType || "application/octet-stream"),
      size: Number(attachment.size || 0),
      kind: attachment.kind === "image" || attachment.kind === "text" ? attachment.kind : "file",
    }))
    .slice(0, MAX_ATTACHMENTS);
}

function sanitizeStoredResponse(response: StoredRebetaChat["lastResponse"]) {
  if (!response || typeof response.reply !== "string") return null;

  return {
    reply: cleanRebetaOutput(response.reply),
    provider: response.provider,
    model: response.model,
    suggestions: cleanSuggestionList(response.suggestions || DEFAULT_PROMPTS, DEFAULT_PROMPTS),
    disclaimer: response.disclaimer,
    intent: response.intent,
    module: response.module,
    insights: cleanStringList(response.insights, 4),
    warnings: cleanStringList(response.warnings, 3),
    predictions: cleanStringList(response.predictions, 3),
    actions: cleanActionList(response.actions),
  } satisfies RebetaChatResponse;
}

function sanitizeStoredLanguage(language?: string) {
  return LANGUAGE_OPTIONS.includes(language || "") ? language || "English" : "English";
}
