import { apiRequest } from "@/lib/api";

export type RebetaRole = "user" | "assistant";

export type RebetaChatMessage = {
  role: RebetaRole;
  content: string;
};

export type RebetaAttachment = {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  kind: "image" | "text" | "file";
  data?: string;
  text?: string;
};

export type RebetaAction = {
  label: string;
  command: string;
  module?: string;
};

export type RebetaAssistantMessage = {
  role: "assistant";
  content: string;
  suggestions: string[];
};

export type RebetaNextAction = {
  label: string;
  action: string;
  route?: string;
};

export type RebetaChatResponse = {
  success?: boolean;
  message?: RebetaAssistantMessage;
  reply: string;
  provider: "gemini" | "groq" | "mock";
  fallbackUsed: boolean;
  model: string;
  suggestions: string[];
  disclaimer: string;
  intent?: string;
  module?: string;
  confidence?: number;
  language?: string;
  insights?: string[];
  warnings?: string[];
  predictions?: string[];
  actions?: RebetaAction[];
  nextActions?: RebetaNextAction[];
};

export async function sendRebetaMessage(
  token: string | null,
  body: {
    message: string;
    messages?: RebetaChatMessage[];
    mode?: string;
    language?: string;
    selectedLanguage?: string;
    currentPage?: string;
    context?: Record<string, unknown>;
    attachments?: RebetaAttachment[];
  },
) {
  if (!token) throw new Error("You need to be signed in to use Rebeta.");

  const response = await apiRequest<RebetaChatResponse>("/rebeta/chat", {
    method: "POST",
    token,
    body: {
      ...body,
      language: body.selectedLanguage || body.language || "auto",
      context: {
        ...(body.context || {}),
        selectedLanguage: body.selectedLanguage || body.language || "auto",
        currentPage: body.currentPage || body.context?.currentPage || body.context?.surface,
      },
    },
  });

  if (!response.payload) throw new Error("Rebeta returned an empty response.");

  const payload = response.payload as RebetaChatResponse;
  const assistantMessage = payload.message;
  const reply = assistantMessage?.content || payload.reply || "";
  const suggestions = normalizeSuggestions(assistantMessage?.suggestions || payload.suggestions);

  if (!reply.trim()) throw new Error("Rebeta returned an empty response.");

  return {
    ...payload,
    reply,
    suggestions,
    message: {
      role: "assistant",
      content: reply,
      suggestions,
    },
    fallbackUsed: Boolean(payload.fallbackUsed),
    language: payload.language || body.selectedLanguage || body.language || "auto",
    nextActions: normalizeNextActions(payload.nextActions, payload.actions),
  } satisfies RebetaChatResponse;
}


function normalizeSuggestions(value: unknown): string[] {
  const seen = new Set<string>();
  const suggestions = Array.isArray(value) ? value : [];

  return suggestions
    .map((item) => String(item || "").replace(/\*/g, "").trim())
    .filter((item) => {
      const key = item.toLowerCase();
      if (!item || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 3);
}


function normalizeNextActions(value: unknown, legacyActions?: RebetaAction[]): RebetaNextAction[] {
  const raw = Array.isArray(value) && value.length ? value : legacyActions || [];

  return raw
    .map((item) => {
      const record = item as Record<string, unknown>;
      const label = String(record.label || record.title || "").trim();
      const action = String(record.action || record.command || record.prompt || "").trim();
      const route = typeof record.route === "string" ? record.route : undefined;
      return { label, action, route };
    })
    .filter((item) => item.label && item.action)
    .slice(0, 3);
}
