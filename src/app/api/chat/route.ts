import { NextRequest, NextResponse } from 'next/server';
  import { buildExecSystemPrompt, type ExecLens } from '@/lib/execPrompt';

  const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

  type ChatMessage = {
    role: 'user' | 'assistant' | 'system';
    content: string;
  };

   function isValidBrief(text: string): boolean {
    // Updated to match decision-focused format
    const requiredHeadings = [
      'DECISION BEING MADE',
      'OPTIONS CONSIDERED',
      'TRADEOFFS',
      'RECOMMENDED DECISION',
      'DECISION OWNER',
      'RISKS & WATCHOUTS',
      'NEXT 3 ACTIONS',
    ];

    // Check if all required sections are present
    return requiredHeadings.every((h) => text.toUpperCase().includes(h));
  }


    // Check if all required sections are present
    return requiredHeadings.every((h) => text.toUpperCase().includes(h));
  }


    // Check if all required sections are present
    return requiredHeadings.every((h) => text.toUpperCase().includes(h));
  }

  export async function POST(req: NextRequest) {
    try {
      if (!OPENROUTER_API_KEY) {
        return NextResponse.json(
          { error: 'Missing OPENROUTER_API_KEY' },
          { status: 500 },
        );
      }

      const body = await req.json();
      const rawContent: string | undefined = body?.content;
      const lens: ExecLens = body?.lens || 'Product';

      if (!rawContent || typeof rawContent !== 'string') {
        return NextResponse.json(
          { error: 'Missing "content" string in body' },
          { status: 400 },
        );
      }

      const systemMessage: ChatMessage = {
        role: 'system',
        content: buildExecSystemPrompt(lens),
      };

      const userMessage: ChatMessage = {
        role: 'user',
        content: rawContent,
      };

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://github.com/amitstar69/decision-brief-ai',
          'X-Title': 'Decision Brief AI',
        },
        body: JSON.stringify({
          model: 'openai/gpt-4.1-mini',
          messages: [systemMessage, userMessage],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return NextResponse.json(
          { error: 'OpenRouter API error', details: errorText },
          { status: 502 },
        );
      }

      const data = await response.json();
      const content: string = data?.choices?.[0]?.message?.content ?? '';

      if (!content || !isValidBrief(content)) {
        return NextResponse.json(
          {
            error: 'Brief generation failed validation',
            details: 'Missing one or more required sections.',
          },
          { status: 500 },
        );
      }

      return NextResponse.json({
        brief: content,
        lens,
      });
    } catch {
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 },
      );
    }
  }
