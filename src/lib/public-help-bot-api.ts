import { apiRequest } from "@/lib/api";

export type PublicHelpBotLink = {
  label: string;
  url: string;
};

export type PublicHelpBotReply = {
  answer: string;
  topic: string;
  intent?: string;
  confidence: number;
  links: PublicHelpBotLink[];
  suggestions: string[];
  clarification?: boolean;
  escalation?: boolean;
  fallback?: boolean;
};

export type PublicHelpBotRequestContext = {
  previousTopic?: string;
};

export async function askPublicHelpBot(
  message: string,
  conversationId?: string,
  context: PublicHelpBotRequestContext = {},
) {
  const response = await apiRequest<PublicHelpBotReply>("/public-help-bot/chat", {
    method: "POST",
    body: { message, conversationId, previousTopic: context.previousTopic },
  });

  return response.payload;
}
