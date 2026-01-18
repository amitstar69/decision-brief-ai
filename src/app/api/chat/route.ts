import { NextRequest, NextResponse } from "next/server";
import { buildExecSystemPrompt } from "@/lib/execPrompt";
import { assertAllowedOrigin, assertAppToken } from "@/lib/security";
import { rateLimitOrThrow } from "@/lib/rateLimit";

const VALID_LENSES = ["Product", "Revenue", "Ops", "Customer", "Risk"] as const;
const MAX_CONTENT_LENGTH = 50000;

type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export async function POST(req: NextRequest) {
  try {
    // 1) Security gates (launch-blocking)
    assertAllowedOrigin(req);
    assertAppToken(req);

    // 2) Durable rate limit: 10 briefs per day
    await rateLimitOrThrow({
      req,
      keyPrefix: "chat",
      limit: 10,
      windowSeconds: 60 * 60 * 24, // 24 hours
    });

    // 3) Parse + validate input
    const { content: rawContent, lens = "Product" } = await req.json();

    if (!rawContent || typeof rawContent !== "string") {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }

    if (rawContent.length > MAX_CONTENT_LENGTH) {
      return NextResponse.json(
        { error: "Content too large (max 50KB)" },
        { status: 400 }
      );
    }

    if (!VALID_LENSES.includes(lens as any)) {
      return NextResponse.json(
        { error: "Invalid lens parameter" },
        { status: 400 }
      );
    }

    // 4) OpenRouter call
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      console.error("OPENROUTER_API_KEY not configured");
      return NextResponse.json(
        { error: "API configuration error" },
        { status: 500 }
      );
    }

    const systemPrompt = buildExecSystemPrompt(lens);
    const messages: ChatMessage[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: rawContent },
    ];

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://decision-brief-ai.vercel.app",
          "X-Title": "Decision Brief AI",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages,
        }),
      }
    );

    if (!response.ok) {
      console.error("OpenRouter API error:", response.status);
      return NextResponse.json(
        { error: "AI service unavailable" },
        { status: 503 }
      );
    }

    const data = await response.json();
    const briefText = data.choices?.[0]?.message?.content;

    if (!briefText) {
      return NextResponse.json(
        { error: "No response from AI" },
        { status: 500 }
      );
    }

    if (!isValidBrief(briefText)) {
      return NextResponse.json(
        { error: "Brief validation failed" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { brief: briefText, lens },
      {
        headers: {
          "X-RateLimit-Limit": "10",
        },
      }
    );
  } catch (error: any) {
    if (error?.message === "RATE_LIMITED") {
      return NextResponse.json(
        { error: "Daily limit reached (10 briefs/day)." },
        { status: 429 }
      );
    }

    if (
      error?.message === "ORIGIN_NOT_ALLOWED" ||
      error?.message === "REFERER_NOT_ALLOWED"
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (
      error?.message === "MISSING_APP_TOKEN" ||
      error?.message === "INVALID_APP_TOKEN"
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.error("Error in chat route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

function isValidBrief(text: string): boolean {
  const requiredHeadings = [
    "DECISION BEING MADE",
    "OPTIONS CONSIDERED",
    "TRADEOFFS",
    "RECOMMENDED DECISION",
    "DECISION OWNER",
    "RISKS & WATCHOUTS",
    "NEXT 3 ACTIONS",
  ];
  const upperText = text.toUpperCase();
  return requiredHeadings.every((heading) =>
    upperText.includes(heading)
  );
}
