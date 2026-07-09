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

export type RebetaNextAction = {
  label: string;
  action: string;
  route?: string;
};

export type RebetaChatResponse = {
  reply: string;
  provider: "gemini" | "groq" | "mock";
  model: string;
  suggestions: string[];
  disclaimer: string;
  intent?: string;
  module?: string;
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
    currentPage?: string;
    context?: Record<string, unknown>;
    attachments?: RebetaAttachment[];
  },
) {
  if (!token) throw new Error("You need to be signed in to use Rebeta.");

  const response = await apiRequest<RebetaChatResponse>("/rebeta/chat", {
    method: "POST",
    token,
    body,
  });

  if (!response.payload) throw new Error("Rebeta returned an empty response.");
  return response.payload;
}
