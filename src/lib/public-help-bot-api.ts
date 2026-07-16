import { apiRequest } from "@/lib/api";

export type PublicHelpBotLink = {
  label: string;
  url: string;
};

export type PublicHelpBotReply = {
  answer: string;
  topic: string;
  confidence: number;
  links: PublicHelpBotLink[];
  suggestions: string[];
};

export async function askPublicHelpBot(message: string, conversationId?: string) {
  const response = await apiRequest<PublicHelpBotReply>("/public-help-bot/chat", {
    method: "POST",
    body: { message, conversationId },
  });

  return response.payload;
}
