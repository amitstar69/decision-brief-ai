  import { checkRateLimit } from '@/lib/rateLimiter';

  const MAX_INPUT_LENGTH = 10000;
  const MAX_QUESTION_LENGTH = 2000;

  Replace POST function start (first ~20 lines):

  export async function POST(req: NextRequest) {
    try {
      // Rate limiting - 20 follow-ups per IP per day
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

      // Validation
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

      // Build context-aware system prompt
      const systemPrompt = `
  You are an executive assistant helping answer follow-up questions about a decision brief.

  You have access to:
  1. The original source notes/document
  2. The executive brief that was generated
  3. The conversation history

  Your job:
  - Answer questions accurately using ONLY information from the source notes and brief
  - Be concise and executive-focused (2-4 sentences unless more detail is requested)
  - If the answer isn't in the source material, say "That information wasn't included in the source material"
  - Provide actionable insights when possible
  - Reference specific details from the notes when relevant
  - Use plain text formatting (no markdown symbols)

  Keep responses brief and to the point.
  `.trim();

      // Build conversation history for context
      const messages: ChatMessage[] = [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: `Here are the original notes:\n\n${notes}`,
        },
        {
          role: 'assistant',
          content: `I've reviewed the notes. Here's the executive brief that was generated:\n\n${summary}`,
        },
      ];

      // Add conversation history
      history.forEach((item) => {
        messages.push({
          role: item.role,
          content: item.content,
        });
      });

      // Add the new question
      messages.push({
        role: 'user',
        content: question,
      });

      // Call OpenRouter API
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://github.com/amitstar69/decision-brief-ai',
          'X-Title': 'Decision Brief AI - Follow-up',
        },
        body: JSON.stringify({
          model: 'openai/gpt-4o-mini',
          messages,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('OpenRouter API error:', errorText);
        return NextResponse.json(
          { error: 'OpenRouter API error', details: errorText },
          { status: 502 },
        );
      }

      const data = await response.json();
      const answer: string = data?.choices?.[0]?.message?.content ?? 'No response generated';

      return NextResponse.json({
        answer,
      });
    } catch (error) {
      console.error('Follow-up API error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 },
      );
    }
  }

