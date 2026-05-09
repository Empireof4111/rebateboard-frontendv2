import { createServerFn } from "@tanstack/react-start";

export type InsightTone = "success" | "warn" | "info" | "danger";
export type Insight = { title: string; text: string; tone: InsightTone };

type ReportSummary = {
  name: string;
  market: string;
  symbol: string;
  timeframe: string;
  range: string;
  netPnl: number;
  winRate: number;
  profitFactor: number;
  avgRR: number;
  trades: number;
  wins: number;
  losses: number;
  maxDD: number;
  bestDay: string;
  worstDay: string;
  source: string;
};

const SYSTEM_PROMPT = `You are RebateBoard's Trade Intelligence Analyst.
You analyze a single trading report (backtest or live trades) and return 4-6 short, actionable insights.

Rules:
- Be specific. Reference numbers from the report.
- Mix wins and warnings. Identify edges, leaks, and behavioral patterns.
- Mention fees/cashback impact when relevant.
- Tone values: "success" (clear edge), "warn" (risk leak), "info" (observation), "danger" (critical).
- Each insight: title <= 6 words, text <= 220 chars.
- Plain text only. No markdown.`;

export const generateInsights = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => {
    const r = data as { report: ReportSummary };
    if (!r?.report) throw new Error("report required");
    return r;
  })
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY missing");

    const userPrompt = `Analyze this report and return insights:\n${JSON.stringify(data.report, null, 2)}`;

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "return_insights",
            description: "Return structured trade intelligence insights.",
            parameters: {
              type: "object",
              properties: {
                insights: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      title: { type: "string" },
                      text: { type: "string" },
                      tone: { type: "string", enum: ["success", "warn", "info", "danger"] },
                    },
                    required: ["title", "text", "tone"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["insights"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "return_insights" } },
      }),
    });

    if (!resp.ok) {
      if (resp.status === 429) throw new Error("Rate limit reached. Try again shortly.");
      if (resp.status === 402) throw new Error("AI credits exhausted. Add funds in Settings → Workspace → Usage.");
      throw new Error(`AI gateway error (${resp.status})`);
    }

    const json = await resp.json();
    const call = json.choices?.[0]?.message?.tool_calls?.[0];
    const args = call?.function?.arguments ? JSON.parse(call.function.arguments) : null;
    const insights: Insight[] = args?.insights ?? [];
    if (!insights.length) throw new Error("No insights returned");
    return { insights };
  });
