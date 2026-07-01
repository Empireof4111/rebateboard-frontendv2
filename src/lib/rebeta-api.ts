import { apiRequest } from "@/lib/api";

export type RebetaRole = "user" | "assistant";

export type RebetaChatMessage = {
  role: RebetaRole;
  content: string;
};

export type RebetaChatResponse = {
  reply: string;
  provider: "gemini" | "groq" | "mock";
  model: string;
  suggestions: string[];
  disclaimer: string;
};

export async function sendRebetaMessage(
  token: string | null,
  body: {
    message: string;
    messages?: RebetaChatMessage[];
    mode?: string;
    language?: string;
    context?: Record<string, unknown>;
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
