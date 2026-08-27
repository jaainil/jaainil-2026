import { rerankerCircuit } from './circuit.js';
import type { SearchResult } from './types.js';

const RERANK_MODEL = process.env.RERANK_MODEL || 'voyageai/rerank-2.5-lite';
const RERANK_TIMEOUT_MS = 4500;

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
 * candidates the reranker dropped (appended in original RRF order).
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
  // Append any candidates the reranker dropped, preserving original order
  for (const candidate of candidatePool) {
    if (!reranked.some((r) => r.id === candidate.id)) {
      reranked.push(candidate);
    }
  }
  return reranked.slice(0, topK).map((item, idx) => ({ ...item, rank: idx + 1 }));
}

/**
 * Single-stage reranker: voyageai/rerank-2.5-lite via the OpenRouter rerank endpoint.
 * Degrades gracefully to original RRF order on failure or circuit-open.
 */
export async function rerankResults(
  query: string,
  candidates: SearchResult[],
  topK = 5
): Promise<SearchResult[]> {
  if (candidates.length <= topK) {
    return candidates;
  }

  // Circuit Breaker: skip if open, return RRF order immediately
  if (rerankerCircuit.isOpen()) {
    return candidates.slice(0, topK);
  }

  totalAttempts++;
  const t0 = Date.now();
  const candidatePool = candidates.slice(0, 8);
  const docs = candidatePool.map(
    (c) => `${c.title} > ${c.heading || 'Main'}\n${c.content.slice(0, 500)}`
  );

  try {
    const apiKey = process.env.OPENROUTER_API_KEY || '';
    if (!apiKey) throw new Error('OPENROUTER_API_KEY not set');

    const res = await withTimeout(
      fetch('https://openrouter.ai/api/v1/rerank', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ model: RERANK_MODEL, query, documents: docs }),
      }),
      RERANK_TIMEOUT_MS,
      RERANK_MODEL
    );

    if (!res.ok) throw new Error(`Rerank API ${res.status}`);
    const data: any = await res.json();
    const results = data?.results;
    if (!Array.isArray(results) || results.length === 0) throw new Error('Empty rerank response');

    const ranked = results.map((r: any) => ({ index: r.index, score: r.relevance_score }));

    totalSuccesses++;
    rerankerCircuit.recordSuccess();
    rerankerLatencies.push(Date.now() - t0);
    if (rerankerLatencies.length > 500) rerankerLatencies.splice(0, rerankerLatencies.length - 500);
    return applyRanking(candidatePool, ranked, topK);

  } catch (err: any) {
    if (err?.message?.includes('timeout')) {
      totalTimeouts++;
    } else {
      totalErrors++;
    }
    rerankerCircuit.recordFailure();
  }

  // Graceful Degradation: return original RRF rank order
  rerankerLatencies.push(Date.now() - t0);
  if (rerankerLatencies.length > 500) rerankerLatencies.splice(0, rerankerLatencies.length - 500);
  return candidates.slice(0, topK);
}
