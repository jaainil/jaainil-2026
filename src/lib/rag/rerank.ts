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

  if (sorted.length === 0) {
    return {
      attempts: totalAttempts,
      successes: totalSuccesses,
      timeouts: totalTimeouts,
      errors: totalErrors,
      circuitState: rerankerCircuit.getState(),
      p50Ms: 0,
      p95Ms: 0,
    };
  }

  const p50Idx = Math.min(Math.floor(sorted.length * 0.50), sorted.length - 1);
  const p95Idx = Math.min(Math.ceil(sorted.length * 0.95) - 1, sorted.length - 1);

  return {
    attempts: totalAttempts,
    successes: totalSuccesses,
    timeouts: totalTimeouts,
    errors: totalErrors,
    circuitState: rerankerCircuit.getState(),
    p50Ms: sorted[p50Idx],
    p95Ms: sorted[p95Idx],
  };
}

export function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} timeout`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
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
    if (Number.isInteger(item.index) && candidatePool[item.index] &&
        Number.isFinite(item.score) && item.score >= 0 && item.score <= 1 &&
        !reranked.some((r) => r.id === candidatePool[item.index].id)) {
      reranked.push({
        ...candidatePool[item.index],
        rrfScore: item.score,
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
 * `ok` is true only when the reranker actually ranked the candidates.
 */
export async function rerankWithStatus(
  query: string,
  candidates: SearchResult[],
  topK = 5
): Promise<{ results: SearchResult[]; ok: boolean }> {
  if (candidates.length <= topK) {
    return { results: candidates, ok: false };
  }

  // Circuit Breaker: skip if open, return RRF order immediately
  if (rerankerCircuit.isOpen()) {
    return { results: candidates.slice(0, topK), ok: false };
  }

  totalAttempts++;
  const t0 = Date.now();
  const candidatePool = candidates.slice(0, 12);
  const docs = candidatePool.map(
    (c) => `${c.title} > ${c.heading || 'Main'}\n${c.content.slice(0, 800)}`
  );

  try {
    const apiKey = process.env.OPENROUTER_API_KEY || '';
    if (!apiKey) throw new Error('OPENROUTER_API_KEY not set');

    const data: any = await withTimeout(
      (async () => {
        const res = await fetch('https://openrouter.ai/api/v1/rerank', {
          method: 'POST',
          signal: AbortSignal.timeout(RERANK_TIMEOUT_MS),
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ model: RERANK_MODEL, query, documents: docs }),
        });
        if (!res.ok) throw new Error(`Rerank API ${res.status}`);
        return res.json();
      })(),
      RERANK_TIMEOUT_MS,
      RERANK_MODEL
    );

    const results = data?.results;
    if (!Array.isArray(results) || results.length === 0) throw new Error('Empty rerank response');

    const ranked = results
      .filter((r: any) => r && Number.isInteger(r.index) && candidatePool[r.index] &&
        Number.isFinite(r.relevance_score) && r.relevance_score >= 0 && r.relevance_score <= 1)
      .map((r: any) => ({ index: r.index, score: r.relevance_score }));
    if (!ranked.length) throw new Error('Invalid rerank response');

    totalSuccesses++;
    rerankerCircuit.recordSuccess();
    rerankerLatencies.push(Date.now() - t0);
    if (rerankerLatencies.length > 500) rerankerLatencies.splice(0, rerankerLatencies.length - 500);
    return { results: applyRanking(candidatePool, ranked, topK), ok: true };

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
  return { results: candidates.slice(0, topK), ok: false };
}

/** Thin wrapper for callers that only need the ranked list. */
export async function rerankResults(query: string, candidates: SearchResult[], topK = 5): Promise<SearchResult[]> {
  return (await rerankWithStatus(query, candidates, topK)).results;
}
