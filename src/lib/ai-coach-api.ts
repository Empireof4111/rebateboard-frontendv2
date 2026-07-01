import { apiRequest } from "@/lib/api";

export type AiCoachRole = "user" | "assistant";

export type AiCoachChatMessage = {
  role: AiCoachRole;
  content: string;
};

export type AiCoachChatResponse = {
  reply: string;
  provider: "gemini" | "groq" | "mock";
  model: string;
  suggestions: string[];
  disclaimer: string;
};

export async function sendAiCoachMessage(
  token: string | null,
  body: {
    message: string;
    messages?: AiCoachChatMessage[];
    mode?: string;
    language?: string;
    context?: Record<string, unknown>;
  },
) {
  if (!token) throw new Error("You need to be signed in to use Rebeta.");

  const response = await apiRequest<AiCoachChatResponse>("/rebeta/chat", {
    method: "POST",
    token,
    body,
  });

  if (!response.payload) throw new Error("Rebeta returned an empty response.");
  return response.payload;
}
