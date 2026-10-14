import { openrouter } from './clients.js';
import { withTimeout } from './rerank.js';

export const RAG_MODEL = process.env.RAG_MODEL || 'anthropic/claude-haiku-5.5';

/** Shared provider boundary for query rewriting and grounded answer generation. */
export async function generateRagText(
  system: string,
  prompt: string,
  { timeoutMs = 15000, maxTokens = 4096, temperature = 0.1 } = {},
): Promise<string> {
  const response = await withTimeout(openrouter.chat.send({
    chatRequest: {
      model: RAG_MODEL,
      stream: false,
      messages: [{ role: 'system', content: system }, { role: 'user', content: prompt }],
      temperature,
      maxTokens,
      reasoning: { effort: 'none' },
    },
  }, { timeoutMs, signal: AbortSignal.timeout(timeoutMs), retries: { strategy: 'none' } }), timeoutMs, 'generation');
  if (!('choices' in response)) throw new Error('Unexpected streaming response');
  const choice = response.choices[0];
  // Never present a provider-truncated completion as a finished answer.
  if (choice?.finishReason !== 'stop') throw new Error('Incomplete generation');
  const content = choice.message.content;
  const text = typeof content === 'string' ? content : (content || [])
    .map((part) => 'text' in part && typeof part.text === 'string' ? part.text : '')
    .join('');
  if (!text.trim()) throw new Error('Empty generation');
  return text.trim();
}
