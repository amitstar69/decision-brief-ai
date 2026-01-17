import { NextRequest, NextResponse } from 'next/server';
  import { buildExecSystemPrompt } from '@/lib/execPrompt';
  import { checkRateLimit } from '@/lib/rateLimiter';

  const VALID_LENSES = ['Product', 'Revenue', 'Ops', 'Customer', 'Risk'] as const;
  const MAX_CONTENT_LENGTH = 50000;

  type ChatMessage = {
    role: 'system' | 'user' | 'assistant';
    content: string;
  };

  export async function POST(req: NextRequest) {
    try {
      const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
                 req.headers.get('x-real-ip') ||
                 'unknown';

      const rateCheck = checkRateLimit(ip);

      if (!rateCheck.allowed) {
        const hoursUntilReset = Math.ceil((rateCheck.resetTime - Date.now()) / (1000 * 60 * 60));
        return NextResponse.json(
          {
            error: `Daily limit reached (10 briefs/day). Resets in ${hoursUntilReset} hours.`,
            resetTime: rateCheck.resetTime
          },
          {
            status: 429,
            headers: {
              'X-RateLimit-Limit': '10',
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': rateCheck.resetTime.toString()
            }
          }
        );
      }

      const { content: rawContent, lens = 'Product' } = await req.json();

      if (!rawContent || typeof rawContent !== 'string') {
        return NextResponse.json({ error: 'Content is required' }, { status: 400 });
      }

      if (rawContent.length > MAX_CONTENT_LENGTH) {
        return NextResponse.json({ error: 'Content too large (max 50KB)' }, { status: 400 });
      }

      if (!VALID_LENSES.includes(lens as any)) {
        return NextResponse.json({ error: 'Invalid lens parameter' }, { status: 400 });
      }

      const apiKey = process.env.OPENROUTER_API_KEY;
      if (!apiKey) {
        console.error('OPENROUTER_API_KEY not configured');
        return NextResponse.json({ error: 'API configuration error' }, { status: 500 });
      }

      const systemPrompt = buildExecSystemPrompt(lens);
      const messages: ChatMessage[] = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: rawContent },
      ];

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://decision-brief-ai.vercel.app',
          'X-Title': 'Decision Brief AI',
        },
        body: JSON.stringify({
          model: 'google/gemini-3-flash-preview',
          messages,
        }),
      });

      if (!response.ok) {
        console.error('OpenRouter API error:', response.status);
        return NextResponse.json({ error: 'AI service unavailable' }, { status: 503 });
      }

      const data = await response.json();
      const briefText = data.choices?.[0]?.message?.content;

      if (!briefText) {
        return NextResponse.json({ error: 'No response from AI' }, { status: 500 });
      }

      if (!isValidBrief(briefText)) {
        return NextResponse.json({ error: 'Brief validation failed' }, { status: 500 });
      }

      return NextResponse.json(
        { brief: briefText, lens },
        {
          headers: {
            'X-RateLimit-Limit': '10',
            'X-RateLimit-Remaining': rateCheck.remaining.toString(),
            'X-RateLimit-Reset': rateCheck.resetTime.toString()
          }
        }
      );
    } catch (error) {
      console.error('Error in chat route:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  }

  function isValidBrief(text: string): boolean {
    const requiredHeadings = [
      'DECISION BEING MADE',
      'OPTIONS CONSIDERED',
      'TRADEOFFS',
      'RECOMMENDED DECISION',
      'DECISION OWNER',
      'RISKS & WATCHOUTS',
      'NEXT 3 ACTIONS',
    ];
    const upperText = text.toUpperCase();
    return requiredHeadings.every((heading) => upperText.includes(heading));
  }
