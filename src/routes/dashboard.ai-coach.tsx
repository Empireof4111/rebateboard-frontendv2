import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  Bot,
  Brain,
  CircleAlert,
  FileText,
  Languages,
  Loader2,
  Paperclip,
  Plus,
  Send,
  X,
  ShieldCheck,
  Sparkles,
  Target,
} from "lucide-react";
import { PageHeader, Panel, Pill } from "@/components/dashboard/Primitives";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import {
  getRebetaUsage,
  sendRebetaMessage,
  type RebetaChatMessage,
  type RebetaChatResponse,
  type RebetaUsageStatus,
} from "@/lib/rebeta-api";
import { formatUploadLimit, MAX_UPLOAD_BYTES } from "@/lib/upload-limits";

export const Route = createFileRoute("/dashboard/ai-coach")({
  component: RebataPage,
});

type RebataMessage = RebetaChatMessage & {
  id: string;
  error?: boolean;
  suggestions?: string[];
  insights?: string[];
  warnings?: string[];
  predictions?: string[];
  nextActions?: { label: string; action: string; route?: string }[];
  attachments?: RebetaChatAttachment[];
};

type RebetaChatAttachment = {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  kind: "image" | "text" | "file";
  data?: string;
  text?: string;
};

const CHAT_HISTORY_VERSION = "v2";
const MAX_STORED_MESSAGES = 80;
const MAX_ATTACHMENTS_PER_MESSAGE = 2;
const MAX_TEXT_ATTACHMENT_CHARS = 30_000;
const MAX_IMAGE_ATTACHMENT_BYTES = MAX_UPLOAD_BYTES;
const MIN_IMAGE_DIMENSION = 320;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);

const DEFAULT_PROMPTS = [
  "Analyze my last trading week",
  "Help improve my risk management",
  "Review my trading journal",
];

const REBETA_LANGUAGES = [
  { value: "auto", label: "Auto" },
  { value: "English", label: "English" },
  { value: "Spanish", label: "Spanish" },
  { value: "French", label: "French" },
  { value: "Arabic", label: "Arabic" },
  { value: "Portuguese", label: "Portuguese" },
  { value: "Hindi", label: "Hindi" },
  { value: "Urdu", label: "Urdu" },
  { value: "Chinese", label: "Chinese" },
  { value: "Indonesian", label: "Indonesian" },
  { value: "Vietnamese", label: "Vietnamese" },
  { value: "Thai", label: "Thai" },
  { value: "Turkish", label: "Turkish" },
  { value: "Russian", label: "Russian" },
  { value: "German", label: "German" },
  { value: "Italian", label: "Italian" },
  { value: "Japanese", label: "Japanese" },
  { value: "Korean", label: "Korean" },
  { value: "Hausa", label: "Hausa" },
  { value: "Yoruba", label: "Yoruba" },
  { value: "Igbo", label: "Igbo" },
];

const ACTION_PROMPTS = [
  {
    title: "Risk coach",
    detail: "Position size, stop logic, and guardrails.",
    prompt:
      "Help me improve my risk management. Ask for any missing journal or plan details first.",
  },
  {
    title: "Trade review",
    detail: "Entry, stop, target, invalidation.",
    prompt:
      "Help me review this trade setup. Ask me for the missing details first.",
  },
  {
    title: "Trust check",
    detail: "Broker risk, complaints, payout signals.",
    prompt:
      "Explain how I should use TBI trust intelligence before choosing a broker or prop firm.",
  },
];

function RebataPage() {
  const { token, user } = useAuth();
  const [tab, setTab] = useState<"chat" | "insights">("chat");
  const storageKey = `rebeta-chat-history-${CHAT_HISTORY_VERSION}-${user?.id || "guest"}`;
  const [messages, setMessages] = useState<RebataMessage[]>(() =>
    loadStoredMessages(storageKey),
  );
  const [input, setInput] = useState("");
  const [attachments, setAttachments] = useState<RebetaChatAttachment[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState(DEFAULT_PROMPTS);
  const [lastResponse, setLastResponse] = useState<RebetaChatResponse | null>(
    null,
  );
  const [usageStatus, setUsageStatus] = useState<RebetaUsageStatus | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState(
    () => localStorage.getItem("rebeta-language") || "auto",
  );
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages, sending]);

  useEffect(() => {
    setMessages(loadStoredMessages(storageKey));
  }, [storageKey]);

  useEffect(() => {
    storeMessages(storageKey, messages);
  }, [messages, storageKey]);

  useEffect(() => {
    localStorage.setItem("rebeta-language", selectedLanguage);
  }, [selectedLanguage]);

  useEffect(() => {
    if (!token) return;
    let alive = true;
    getRebetaUsage(token)
      .then((status) => {
        if (alive) setUsageStatus(status);
      })
      .catch(() => {
        if (alive) setUsageStatus(null);
      });
    return () => {
      alive = false;
    };
  }, [token]);

  async function submitPrompt(rawPrompt = input) {
    if (usageStatus?.premiumRequired) {
      setError("You've completed your free Rebeta trial. Upgrade to continue using personalized AI trading intelligence.");
      return;
    }
    const prompt =
      rawPrompt.trim() ||
      (attachments.length
        ? "Please analyze the attached file or screenshot and tell me what you can identify, what it means, and the next best steps."
        : "");
    if (!prompt || sending) return;

    const history = messages
      .filter((message) => !message.error)
      .slice(-12)
      .map(({ role, content }) => ({ role, content }));

    const outgoingAttachments = attachments.slice(
      0,
      MAX_ATTACHMENTS_PER_MESSAGE,
    );
    const userMessage: RebataMessage = {
      id: makeId("user"),
      role: "user",
      content: prompt,
      attachments: outgoingAttachments,
    };

    setMessages((current) => [...current, userMessage]);
    setInput("");
    setAttachments([]);
    setUploadError(null);
    setSending(true);
    setError(null);

    try {
      const response = await sendRebetaMessage(token, {
        message: prompt,
        messages: history,
        mode: "rebata-workspace",
        language: selectedLanguage,
        currentPage: window.location.pathname,
        attachments: outgoingAttachments,
        context: {
          clientMessageId: userMessage.id,
          surface: "dashboard.ai-coach",
          currentPage: window.location.pathname,
          selectedLanguage,
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

      if (response.usage) setUsageStatus(response.usage);
      const nextSuggestions = normalizeSuggestions(response.suggestions);

      setMessages((current) => [
        ...current,
        {
          id: makeId("assistant"),
          role: "assistant",
          content: response.reply,
          suggestions: nextSuggestions,
          insights: response.insights || [],
          warnings: response.warnings || [],
          predictions: response.predictions || [],
          nextActions: response.nextActions || [],
        },
      ]);
      setSuggestions(
        nextSuggestions.length === 3 ? nextSuggestions : DEFAULT_PROMPTS,
      );
      setLastResponse(response);
    } catch (ex) {
      if (ex instanceof ApiError) {
        const payload = ex.payload as { usage?: RebetaUsageStatus } | undefined;
        if (payload?.usage) setUsageStatus(payload.usage);
      }
      const message =
        ex instanceof Error ? ex.message : "Rebeta could not answer right now.";
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
    if (usageStatus?.premiumRequired) {
      setError("You've completed your free Rebeta trial. Upgrade to continue using personalized AI trading intelligence.");
      return;
    }
    void submitPrompt(prompt);
  }

  async function handleFileSelection(fileList: FileList | null) {
    if (!fileList?.length) return;

    setUploadError(null);
    const availableSlots = MAX_ATTACHMENTS_PER_MESSAGE - attachments.length;
    const selectedFiles = Array.from(fileList).slice(
      0,
      Math.max(availableSlots, 0),
    );

    if (!selectedFiles.length) {
      setUploadError(
        `You can attach up to ${MAX_ATTACHMENTS_PER_MESSAGE} files per message.`,
      );
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    try {
      const parsedFiles = await Promise.all(
        selectedFiles.map(readRebetaAttachment),
      );
      setAttachments((current) =>
        [...current, ...parsedFiles].slice(0, MAX_ATTACHMENTS_PER_MESSAGE),
      );
    } catch (ex) {
      setUploadError(
        ex instanceof Error ? ex.message : "Rebeta could not read that file.",
      );
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function removeAttachment(id: string) {
    setAttachments((current) =>
      current.filter((attachment) => attachment.id !== id),
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rebeta"
        subtitle="Your AI trading, rebate, cashback, and trust intelligence assistant."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Pill tone="primary">
              <Languages className="mr-1 inline h-3.5 w-3.5" />
              {selectedLanguage === "auto" ? "Auto language" : selectedLanguage}
            </Pill>
            <Pill
              tone={lastResponse?.provider === "mock" ? "warning" : "primary"}
            >
              {lastResponse ? "Rebeta Active" : "Ready"}
            </Pill>
            {usageStatus && (
              <Pill tone={usageStatus.premiumRequired ? "warning" : "primary"}>
                {usageStatus.unlimitedAccess
                  ? "Premium Rebeta"
                  : `${usageStatus.freeUsageRemaining ?? 0} of ${usageStatus.freeUsageLimit} free requests remaining`}
              </Pill>
            )}
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
                <ShieldCheck className="h-3.5 w-3.5 text-fuchsia-300" />
                Educational
              </span>
            }
          >
            <div className="flex min-h-[min(72dvh,640px)] flex-col md:h-[min(62vh,560px)] md:min-h-[420px]">
              <div className="flex-1 space-y-5 overflow-y-auto pr-1">
                {messages.length === 0 && (
                  <div className="rounded-2xl border border-violet-300/15 bg-violet-300/10 p-5">
                    <div className="flex items-center gap-3">
                      <CoachAvatar />
                      <div>
                        <h3 className="text-sm font-semibold text-white">Rebeta is ready to coach your next decision.</h3>
                        <p className="mt-1 text-xs leading-relaxed text-violet-100/75">
                          Ask about your journal, risk, trading plan, cashback, or a brand's trust profile.
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {DEFAULT_PROMPTS.map((prompt) => (
                        <button
                          key={prompt}
                          type="button"
                          onClick={() => sendSuggestion(prompt)}
                          className="rounded-full border border-violet-300/20 bg-black/10 px-3 py-1.5 text-[11px] text-violet-50 transition hover:border-violet-300/45 hover:bg-violet-300/15"
                        >
                          {prompt}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {messages.map((message) => (
                  <ChatBubble
                    key={message.id}
                    message={message}
                    onSuggestionClick={sendSuggestion}
                    sending={sending}
                  />
                ))}

                {sending && (
                  <div className="flex gap-2">
                    <CoachAvatar />
                    <div className="inline-flex max-w-[75%] items-center gap-2 rounded-2xl bg-white/5 px-3 py-2 text-xs text-white/75">
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-fuchsia-300" />
                      Reviewing your trading context...
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

              {uploadError && (
                <div className="mt-3 flex items-center gap-2 rounded-xl border border-orange-400/25 bg-orange-500/10 px-3 py-2 text-xs text-orange-50">
                  <CircleAlert className="h-4 w-4 shrink-0" />
                  {uploadError}
                </div>
              )}

              {attachments.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {attachments.map((attachment) => (
                    <AttachmentChip
                      key={attachment.id}
                      attachment={attachment}
                      onRemove={() => removeAttachment(attachment.id)}
                    />
                  ))}
                </div>
              )}

              {usageStatus?.premiumRequired && (
                <div className="mt-3 rounded-2xl border border-violet-300/25 bg-violet-300/10 p-4">
                  <div className="text-sm font-semibold text-white">You've completed your free Rebeta trial.</div>
                  <p className="mt-1 text-xs leading-relaxed text-violet-100/75">
                    Your previous chats stay available. Upgrade when you're ready to continue with personalized AI trading intelligence.
                  </p>
                  <a
                    href="/pricing"
                    className="mt-3 inline-flex rounded-full rb-gradient-primary px-4 py-2 text-xs font-semibold text-white transition hover:opacity-95"
                  >
                    View Premium
                  </a>
                </div>
              )}

              <form
                onSubmit={onSubmit}
                className="sticky bottom-2 z-10 mt-3 flex items-end gap-2 rounded-[1.35rem] bg-[var(--rb-bg-elevated)]/82 p-1 backdrop-blur-xl md:static md:bg-transparent md:p-0 md:backdrop-blur-0"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,.csv,.txt,.json,.md,.pdf"
                  className="hidden"
                  onChange={(event) =>
                    void handleFileSelection(event.target.files)
                  }
                />

                <div className="flex min-h-[52px] min-w-0 flex-1 flex-wrap items-end gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-2 py-2 focus-within:border-primary/60 sm:flex-nowrap">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={
                      sending ||
                      attachments.length >= MAX_ATTACHMENTS_PER_MESSAGE ||
                      usageStatus?.premiumRequired
                    }
                    aria-label="Add file or screenshot"
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/[0.05] text-white/85 transition hover:border-fuchsia-300/40 hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Plus className="h-4 w-4" />
                  </button>

                  <label className="mb-0.5 inline-flex h-9 shrink-0 items-center gap-1 rounded-xl border border-white/10 bg-white/[0.05] px-2 text-[11px] text-white/80">
                    <Languages className="h-3.5 w-3.5 text-fuchsia-300" />
                    <select
                      value={selectedLanguage}
                      onChange={(event) =>
                        setSelectedLanguage(event.target.value)
                      }
                      className="max-w-[92px] bg-transparent text-[11px] text-white outline-none sm:max-w-[130px]"
                      aria-label="Rebeta response language"
                    >
                      {REBETA_LANGUAGES.map((language) => (
                        <option
                          key={language.value}
                          value={language.value}
                          className="bg-[var(--rb-bg-input)] text-white"
                        >
                          {language.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        void submitPrompt();
                      }
                    }}
                    placeholder="Ask Rebeta or upload a screenshot/CSV for analysis..."
                    rows={1}
                    className="min-h-[36px] min-w-[9rem] flex-1 resize-none border-0 bg-transparent px-1 py-2 text-sm text-white placeholder:text-muted-foreground outline-none [field-sizing:content] max-h-28 sm:min-w-0 sm:max-h-32"
                  />
                </div>

                <button
                  type="submit"
                  disabled={
                    (!input.trim() && !attachments.length) ||
                    sending ||
                    !token ||
                    usageStatus?.premiumRequired
                  }
                  aria-label="Send message"
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl rb-gradient-primary text-white shadow-[0_0_24px_rgba(192,132,252,0.38)] transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {sending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </button>
              </form>
              <p className="mt-2 px-1 text-[11px] leading-relaxed text-muted-foreground">
                PNG, JPG, or WebP screenshots up to {formatUploadLimit(MAX_IMAGE_ATTACHMENT_BYTES)} each. Rebeta optimizes images before analysis. Remove passwords, account numbers, seed phrases, and other sensitive information before uploading.
              </p>
            </div>
          </Panel>

          <Panel
            title="Quick Prompts"
            action={<Sparkles className="h-4 w-4 text-fuchsia-300" />}
          >
            <div className="space-y-2">
              {suggestions.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => sendSuggestion(prompt)}
                  disabled={sending || Boolean(usageStatus?.premiumRequired)}
                  className="flex w-full items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-left text-xs text-white/85 transition hover:border-fuchsia-300/40 hover:bg-white/[0.08] disabled:opacity-50"
                >
                  <span>{prompt}</span>
                  <Send className="h-3.5 w-3.5 shrink-0 text-fuchsia-300" />
                </button>
              ))}
            </div>

            <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-white">
                <Brain className="h-4 w-4 text-fuchsia-300" />
                Rebeta Scope
              </div>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Trading plan context, journal review, risk controls, rebates,
                TBI trust signals, and psychology. No guaranteed signals.
              </p>
            </div>
          </Panel>
        </div>
      ) : (
        <div className="space-y-4">
          {lastResponse && (
            <div className="grid gap-3 lg:grid-cols-3">
              <StructuredCard
                title="Intent"
                items={[
                  lastResponse.intent || "general_question",
                  lastResponse.module || "general_assistant",
                  `Language: ${lastResponse.language || selectedLanguage}`,
                ]}
              />
              <StructuredCard
                title="Insights"
                items={lastResponse.insights || []}
              />
              <StructuredCard
                title="Warnings"
                items={lastResponse.warnings || []}
                tone="warning"
              />
            </div>
          )}
          <div className="grid gap-4 lg:grid-cols-3">
            {ACTION_PROMPTS.map((item) => (
              <Panel
                key={item.title}
                title={item.title}
                action={<Target className="h-4 w-4 text-fuchsia-300" />}
              >
                <p className="min-h-10 text-xs text-white/85">{item.detail}</p>
                <button
                  type="button"
                  onClick={() => sendSuggestion(item.prompt)}
                  disabled={sending}
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-white transition hover:border-fuchsia-300/40 hover:bg-white/[0.08] disabled:opacity-50"
                >
                  <Sparkles className="h-3.5 w-3.5 text-fuchsia-300" />
                  Ask Rebeta
                </button>
              </Panel>
            ))}
          </div>
        </div>
      )}

      <Panel
        title={`Rebeta Action Plan${user?.name ? ` for ${user.name}` : ""}`}
        action={<Sparkles className="h-4 w-4 text-fuchsia-300" />}
      >
        <div className="grid gap-3 md:grid-cols-3">
          {[
            { t: "Pre-trade check", d: "Setup, invalidation, reward, risk." },
            { t: "Daily guardrail", d: "Max trades, max loss, stop rule." },
            { t: "Review loop", d: "Screenshot, mistake tag, next action." },
          ].map((plan) => (
            <button
              key={plan.t}
              type="button"
              onClick={() =>
                sendSuggestion(`Create an action plan for: ${plan.t}.`)
              }
              disabled={sending}
              className="rounded-xl border border-white/10 bg-white/[0.04] p-4 text-left transition hover:border-fuchsia-300/40 hover:bg-white/[0.08] disabled:opacity-50"
            >
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <Target className="h-4 w-4 text-fuchsia-300" /> {plan.t}
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
  onSuggestionClick,
  sending,
}: {
  message: RebataMessage;
  onSuggestionClick: (prompt: string) => void;
  sending: boolean;
}) {
  const isUser = message.role === "user";
  const showSuggestions =
    !isUser && !message.error && message.suggestions?.length === 3;

  return (
    <div className={`flex gap-3 ${isUser ? "justify-end" : ""}`}>
      {!isUser && <CoachAvatar error={message.error} />}
      <div
        className={`flex max-w-[82%] flex-col gap-3 ${isUser ? "items-end" : "items-start"}`}
      >
        <div
          className={`whitespace-pre-wrap rounded-2xl px-4 py-3 text-xs leading-relaxed sm:text-sm ${
            isUser
              ? "bg-primary/30 text-white"
              : message.error
                ? "border border-red-500/30 bg-red-500/10 text-red-100"
                : "bg-white/5 text-white/90"
          }`}
        >
          {message.content}
        </div>

        {isUser && message.attachments?.length ? (
          <div className="flex flex-wrap justify-end gap-2">
            {message.attachments.map((attachment) => (
              <AttachmentChip
                key={attachment.id}
                attachment={attachment}
                compact
              />
            ))}
          </div>
        ) : null}

        {!isUser && !message.error && (
          <div className="w-full space-y-2">
            <MessageList title="Insights" items={message.insights} />
            <MessageList
              title="Warnings"
              items={message.warnings}
              tone="warning"
            />
            <MessageList title="Scenarios" items={message.predictions} />
            {message.nextActions?.length ? (
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-white/70">
                  Next actions
                </div>
                <div className="flex flex-wrap gap-2">
                  {message.nextActions.map((action) => (
                    <button
                      key={`${action.label}-${action.action}`}
                      type="button"
                      onClick={() => onSuggestionClick(action.action)}
                      disabled={sending}
                      className="rounded-full border border-violet-300/20 bg-violet-300/10 px-3 py-1.5 text-left text-[11px] text-violet-50 transition hover:border-violet-300/45 hover:bg-violet-300/15 disabled:opacity-50"
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        )}

        {showSuggestions && (
          <div className="flex w-full flex-wrap gap-2">
            {message.suggestions!.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => onSuggestionClick(suggestion)}
                disabled={sending}
              className="rounded-full border border-violet-300/20 bg-violet-300/10 px-3 py-1.5 text-left text-[11px] text-violet-50 transition hover:border-violet-300/45 hover:bg-violet-300/15 disabled:opacity-50"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function MessageList({
  title,
  items,
  tone = "default",
}: {
  title: string;
  items?: string[];
  tone?: "default" | "warning";
}) {
  const cleanItems = (items || []).filter(Boolean).slice(0, 4);
  if (!cleanItems.length) return null;

  return (
    <div
      className={`rounded-xl border p-3 ${tone === "warning" ? "border-orange-400/20 bg-orange-500/10" : "border-white/10 bg-white/[0.03]"}`}
    >
      <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-white/70">
        {title}
      </div>
      <div className="space-y-1.5">
        {cleanItems.map((item) => (
          <div key={item} className="text-[11px] leading-relaxed text-white/75">
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}

function StructuredCard({
  title,
  items,
  tone = "default",
}: {
  title: string;
  items?: string[];
  tone?: "default" | "warning";
}) {
  const cleanItems = (items || []).filter(Boolean).slice(0, 4);

  return (
    <Panel
      title={title}
      action={
        tone === "warning" ? (
          <CircleAlert className="h-4 w-4 text-orange-200" />
        ) : (
          <Sparkles className="h-4 w-4 text-fuchsia-300" />
        )
      }
    >
      {cleanItems.length ? (
        <div className="space-y-2">
          {cleanItems.map((item) => (
            <div
              key={item}
              className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white/80"
            >
              {item}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          No structured data for this section yet.
        </p>
      )}
    </Panel>
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
      {error ? (
        <CircleAlert className="h-4 w-4" />
      ) : (
        <Bot className="h-4 w-4" />
      )}
    </div>
  );
}

function AttachmentChip({
  attachment,
  onRemove,
  compact = false,
}: {
  attachment: RebetaChatAttachment;
  onRemove?: () => void;
  compact?: boolean;
}) {
  return (
    <div
      className={`inline-flex max-w-full items-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] px-2.5 py-1.5 text-[11px] text-white/80 ${compact ? "max-w-[220px]" : ""}`}
    >
      {attachment.kind === "image" ? (
        <Paperclip className="h-3.5 w-3.5 text-fuchsia-300" />
      ) : (
        <FileText className="h-3.5 w-3.5 text-fuchsia-300" />
      )}
      <span className="truncate">{attachment.name}</span>
      <span className="shrink-0 text-white/40">
        {formatFileSize(attachment.size)}
      </span>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${attachment.name}`}
          className="grid h-5 w-5 shrink-0 place-items-center rounded-full text-white/50 transition hover:bg-white/10 hover:text-white"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}

function welcomeMessage(): RebataMessage {
  return {
    id: "welcome",
    role: "assistant",
    content:
      "Hi, I'm Rebeta. Ask me about trades, rebates, cashback, TBI trust data, broker questions, or trading psychology.",
  };
}

function loadStoredMessages(storageKey: string): RebataMessage[] {
  if (typeof window === "undefined") return [welcomeMessage()];

  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return [welcomeMessage()];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || !parsed.length) return [welcomeMessage()];

    return parsed
      .filter(
        (message) => message?.role === "user" || message?.role === "assistant",
      )
      .map((message) => ({
        ...message,
        id: String(message.id || makeId(message.role)),
        content: String(message.content || ""),
      }))
      .filter((message) => message.content.trim())
      .slice(-MAX_STORED_MESSAGES);
  } catch {
    return [welcomeMessage()];
  }
}

function storeMessages(storageKey: string, messages: RebataMessage[]) {
  if (typeof window === "undefined") return;

  try {
    const safeMessages = messages
      .filter((message) => !message.error)
      .slice(-MAX_STORED_MESSAGES)
      .map((message) => ({
        ...message,
        attachments: message.attachments?.map((attachment) => ({
          id: attachment.id,
          name: attachment.name,
          mimeType: attachment.mimeType,
          size: attachment.size,
          kind: attachment.kind,
        })),
      }));

    localStorage.setItem(storageKey, JSON.stringify(safeMessages));
  } catch {
    // Ignore storage quota/private mode errors so Rebeta chat still works.
  }
}

async function readRebetaAttachment(file: File): Promise<RebetaChatAttachment> {
  const kind = file.type.startsWith("image/")
    ? "image"
    : isTextLikeFile(file)
      ? "text"
      : "file";

  if (kind === "image") {
    if (!ALLOWED_IMAGE_TYPES.has((file.type || "").toLowerCase())) {
      throw new Error("Only PNG, JPG, or WebP screenshots can be analyzed by Rebeta.");
    }
    if (file.size > MAX_IMAGE_ATTACHMENT_BYTES) {
      throw new Error(`Image is larger than ${formatUploadLimit(MAX_IMAGE_ATTACHMENT_BYTES)}. Please upload a smaller screenshot.`);
    }
    const dimensions = await readImageDimensions(file);
    if (dimensions.width < MIN_IMAGE_DIMENSION || dimensions.height < MIN_IMAGE_DIMENSION) {
      throw new Error(`Image resolution is too small. Upload at least ${MIN_IMAGE_DIMENSION} x ${MIN_IMAGE_DIMENSION} pixels.`);
    }

    return {
      id: makeId("attachment"),
      name: file.name,
      mimeType: file.type || "image/png",
      size: file.size,
      kind,
      data: await readFileAsDataUrl(file),
    };
  }

  if (kind === "text") {
    const text = (await file.text()).slice(0, MAX_TEXT_ATTACHMENT_CHARS);
    return {
      id: makeId("attachment"),
      name: file.name,
      mimeType: file.type || inferTextMimeType(file.name),
      size: file.size,
      kind,
      text,
    };
  }

  return {
    id: makeId("attachment"),
    name: file.name,
    mimeType: file.type || "application/octet-stream",
    size: file.size,
    kind,
  };
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () =>
      reject(new Error("Could not read the selected file."));
    reader.readAsDataURL(file);
  });
}

function readImageDimensions(file: File) {
  return new Promise<{ width: number; height: number }>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: image.naturalWidth, height: image.naturalHeight });
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Image could not be processed. Please try another screenshot."));
    };
    image.src = url;
  });
}

function isTextLikeFile(file: File) {
  const name = file.name.toLowerCase();
  return (
    file.type.startsWith("text/") ||
    file.type === "application/json" ||
    name.endsWith(".csv") ||
    name.endsWith(".txt") ||
    name.endsWith(".json") ||
    name.endsWith(".md")
  );
}

function inferTextMimeType(name: string) {
  const lower = name.toLowerCase();
  if (lower.endsWith(".csv")) return "text/csv";
  if (lower.endsWith(".json")) return "application/json";
  if (lower.endsWith(".md")) return "text/markdown";
  return "text/plain";
}

function formatFileSize(size: number) {
  if (!Number.isFinite(size) || size <= 0) return "";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function normalizeSuggestions(value: unknown): string[] {
  const seen = new Set<string>();
  const suggestions = Array.isArray(value) ? value : [];

  return suggestions
    .map((item) =>
      String(item || "")
        .replace(/\*/g, "")
        .trim(),
    )
    .filter((item) => {
      const key = item.toLowerCase();
      if (!item || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 3);
}
