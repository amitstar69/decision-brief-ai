import { NextRequest, NextResponse } from 'next/server';

  const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

  type QAItem = {
    role: 'user' | 'assistant';
    content: string;
  };

  type ChatMessage = {
    role: 'user' | 'assistant' | 'system';
    content: string;
  };

  export async function POST(req: NextRequest) {
    try {
      if (!OPENROUTER_API_KEY) {
        return NextResponse.json(
          { error: 'Missing OPENROUTER_API_KEY' },
          { status: 500 },
        );
      }

      const body = await req.json();
      const notes: string | undefined = body?.notes;
      const summary: string | undefined = body?.summary;
      const question: string | undefined = body?.question;
      const history: QAItem[] = body?.history || [];

      if (!notes || !summary || !question) {
        return NextResponse.json(
          { error: 'Missing required fields: notes, summary, or question' },
          { status: 400 },
        );
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
