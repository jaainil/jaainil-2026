import { openrouter, googleGenAI } from './clients.js';
import { rerankerCircuit } from './circuit.js';
import type { SearchResult } from './types.js';

const PRIMARY_RERANK_MODEL = process.env.RERANK_MODEL || 'voyageai/rerank-2.5-lite';
const FALLBACK_RERANK_MODEL = process.env.RERANK_FALLBACK_MODEL || 'cohere/rerank-4-fast';
const LLM_JUDGE_MODEL = process.env.RERANK_LLM_MODEL || 'nvidia/nemotron-3-super-120b-a12b:free';

export interface RerankerStats {
  attempts: number;
  successes: number;
  timeouts: number;
  errors: number;
  circuitState: string;
  p50Ms: number;
  p95Ms: number;
}

const rerankerLatencies: number[] = [];
let totalAttempts = 0;
let totalSuccesses = 0;
let totalTimeouts = 0;
let totalErrors = 0;

export function getRerankerTelemetry(): RerankerStats {
  const sorted = [...rerankerLatencies].sort((a, b) => a - b);
  const p50Idx = Math.floor(sorted.length * 0.50);
  const p95Idx = Math.floor(sorted.length * 0.95);

  return {
    attempts: totalAttempts,
    successes: totalSuccesses,
    timeouts: totalTimeouts,
    errors: totalErrors,
    circuitState: rerankerCircuit.getState(),
    p50Ms: sorted[p50Idx] || 0,
    p95Ms: sorted[p95Idx] || 0,
  };
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(`${label} timeout`)), ms)),
  ]);
}

/**
 * Applies a ranked index list onto the candidate pool, preserving any
 * candidates the reranker dropped (appended in original order).
 */
function applyRanking(
  candidatePool: SearchResult[],
  ranked: Array<{ index: number; score: number }>,
  topK: number
): SearchResult[] {
  const reranked: SearchResult[] = [];
  for (const item of ranked) {
    if (typeof item.index === 'number' && candidatePool[item.index]) {
      reranked.push({
        ...candidatePool[item.index],
        rrfScore: item.score || candidatePool[item.index].rrfScore,
      });
    }
  }
  for (const candidate of candidatePool) {
    if (!reranked.some((r) => r.id === candidate.id)) {
      reranked.push(candidate);
    }
  }
  return reranked.slice(0, topK).map((item, idx) => ({ ...item, rank: idx + 1 }));
}

/**
 * Dedicated rerank models (voyage/cohere) via the OpenRouter rerank endpoint.
 */
async function rerankEndpoint(
  model: string,
  query: string,
  docs: string[],
  timeoutMs: number
): Promise<Array<{ index: number; score: number }> | null> {
  const apiKey = process.env.OPENROUTER_API_KEY || '';
  if (!apiKey) return null;

  const res = await withTimeout(
    fetch('https://openrouter.ai/api/v1/rerank', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model, query, documents: docs }),
    }),
    timeoutMs,
    model
  );

  if (!res.ok) return null;
  const data: any = await res.json();
  const results = data?.results;
  if (!Array.isArray(results) || results.length === 0) return null;
  return results.map((r: any) => ({ index: r.index, score: r.relevance_score }));
}

/**
 * LLM-judge reranker via OpenRouter chat (free Nvidia), last code fallback.
 */
async function rerankLlmJudge(
  query: string,
  candidatePool: SearchResult[]
): Promise<Array<{ index: number; score: number }> | null> {
  const prompt = `Evaluate passage relevance for query: "${query}"

Passages:
${candidatePool.map((c, i) => `[ID: ${i}] ${c.title} > ${c.heading || 'Main'}\n${c.content.slice(0, 280)}`).join('\n\n---\n\n')}

Output a JSON array of objects with id and score (0.0 to 1.0) ordered by relevance. Example: [{"id":0,"score":0.95}]. JSON ONLY:`;

  const chat: any = await withTimeout(
    openrouter.chat.send({
      chatRequest: {
        model: LLM_JUDGE_MODEL,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.0,
      },
    }),
    4500,
    LLM_JUDGE_MODEL
  );

  const content = chat.choices?.[0]?.message?.content || '';
  const jsonMatch = content.match(/\[[\s\S]*?\]/);
  if (!jsonMatch) return null;
  const ranked = JSON.parse(jsonMatch[0]);
  if (!Array.isArray(ranked) || ranked.length === 0) return null;
  return ranked;
}

/**
 * Three-stage reranker with circuit breaker protection and graceful degradation to RRF:
 * 1. voyageai/rerank-2.5-lite (dedicated rerank endpoint)
 * 2. cohere/rerank-4-fast (dedicated rerank endpoint)
 * 3. nvidia LLM-judge via chat completions
 */
export async function rerankResults(
  query: string,
  candidates: SearchResult[],
  topK = 5
): Promise<SearchResult[]> {
  if (candidates.length <= topK) {
    return candidates;
  }

  // 1. Circuit Breaker Check
  if (rerankerCircuit.isOpen()) {
    return candidates.slice(0, topK); // Degrade to original RRF order immediately
  }

  totalAttempts++;
  const t0 = Date.now();
  const candidatePool = candidates.slice(0, 8);
  const docs = candidatePool.map(
    (c) => `${c.title} > ${c.heading || 'Main'}\n${c.content.slice(0, 500)}`
  );

  try {
    // 2. Primary: voyageai rerank-2.5-lite
    let ranked = await rerankEndpoint(PRIMARY_RERANK_MODEL, query, docs, 4000).catch(() => null);

    // 3. Fallback: cohere rerank-4-fast
    if (!ranked) {
      ranked = await rerankEndpoint(FALLBACK_RERANK_MODEL, query, docs, 4000).catch(() => null);
    }

    // 4. Last code fallback: free Nvidia LLM-judge via chat
    if (!ranked) {
      ranked = await rerankLlmJudge(query, candidatePool).catch(() => null);
    }

    if (ranked) {
      totalSuccesses++;
      rerankerCircuit.recordSuccess();
      rerankerLatencies.push(Date.now() - t0);
      return applyRanking(candidatePool, ranked, topK);
    }

    // All three stages returned unusable shapes — treat as error, degrade
    totalErrors++;
    rerankerCircuit.recordFailure();
  } catch (err: any) {
    if (err?.message?.includes('timeout')) {
      totalTimeouts++;
    } else {
      totalErrors++;
    }
    rerankerCircuit.recordFailure();
  }

  // 5. Graceful Degradation: Return original RRF rank order
  rerankerLatencies.push(Date.now() - t0);
  return candidates.slice(0, topK);
}
