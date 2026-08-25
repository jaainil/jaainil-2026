import 'dotenv/config';

export const prerender = false;

import { askRag } from '../../../lib/rag/chat.js';
import { checkRateLimit } from '../../../lib/rag/cache.js';
import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip')
      || 'anonymous';
    const rate = await checkRateLimit(`chat:${ip}`, 20, 60);
    if (!rate.allowed) {
      return new Response(JSON.stringify({ error: 'Rate limit exceeded. Try again shortly.' }), {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(Math.max(1, rate.reset - Math.floor(Date.now() / 1000))),
        },
      });
    }

    const body = await request.json().catch(() => null);
    const question = (body?.question ?? '').trim();
    if (!question) {
      return new Response(JSON.stringify({ error: 'A question is required.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    if (question.length > 500) {
      return new Response(JSON.stringify({ error: 'Question too long (500 chars max).' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const result = await askRag(question, { useCache: true });

    return new Response(
      JSON.stringify({
        answer: result.answer,
        sources: result.sources,
        confidence: result.confidence,
        cached: result.cached,
        model: result.model,
        intent: result.intent,
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('[api/rag/chat]', err);
    return new Response(JSON.stringify({ error: 'RAG service unavailable.' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
