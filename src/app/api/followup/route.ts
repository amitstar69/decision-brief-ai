import { NextRequest, NextResponse } from 'next/server';
  import { checkRateLimit } from '@/lib/rateLimiter';

  const MAX_INPUT_LENGTH = 10000;
  const MAX_QUESTION_LENGTH = 2000;

  type ChatMessage = {
    role: 'system' | 'user' | 'assistant';
    content: string;
  };

  export async function POST(req: NextRequest) {
    try {
      const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
                 req.headers.get('x-real-ip') ||
                 'unknown';

      const rateCheck = checkRateLimit(`followup-${ip}`);

      if (!rateCheck.allowed) {
        const hoursUntilReset = Math.ceil((rateCheck.resetTime - Date.now()) / (1000 * 60 * 60));
        return NextResponse.json(
          { error: `Daily limit reached. Resets in ${hoursUntilReset} hours.` },
          { status: 429 }
        );
      }

      const { notes, summary, question, history } = await req.json();

      if (!notes || !summary || !question) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
      }

      if (typeof notes !== 'string' || typeof summary !== 'string' || typeof question !== 'string') {
        return NextResponse.json({ error: 'Invalid input types' }, { status: 400 });
      }

      if (notes.length > MAX_INPUT_LENGTH || summary.length > MAX_INPUT_LENGTH) {
        return NextResponse.json({ error: 'Content too large' }, { status: 400 });
      }

      if (question.length > MAX_QUESTION_LENGTH) {
        return NextResponse.json({ error: 'Question too long' }, { status: 400 });
      }

      const apiKey = process.env.OPENROUTER_API_KEY;
      if (!apiKey) {
        return NextResponse.json({ error: 'API not configured' }, { status: 500 });
      }

      const systemPrompt = `You are a helpful assistant analyzing meeting notes and decision briefs. 
  Provide concise, actionable answers based on the provided context.

  ORIGINAL NOTES:
  ${notes}

  DECISION BRIEF SUMMARY:
  ${summary}

  Answer questions directly and concisely.`;

      const messages: ChatMessage[] = [
        { role: 'system', content: systemPrompt },
      ];

      if (Array.isArray(history)) {
        history.forEach((msg: any) => {
          if (msg.role && msg.content) {
            messages.push({ role: msg.role, content: msg.content });
          }
        });
      }

      messages.push({ role: 'user', content: question });

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://decision-brief-ai.vercel.app',
          'X-Title': 'Decision Brief AI',
        },
        body: JSON.stringify({
          model: 'openai/gpt-4o-mini',
          messages,
        }),
      });

      if (!response.ok) {
        return NextResponse.json({ error: 'AI service error' }, { status: 503 });
      }

      const data = await response.json();
      const answer = data.choices?.[0]?.message?.content;

      if (!answer) {
        return NextResponse.json({ error: 'No response generated' }, { status: 500 });
      }

      return NextResponse.json({ answer });
    } catch (error) {
      console.error('Error in followup route:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  }
