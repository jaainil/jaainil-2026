import { openrouter } from './clients.js';
import { getCached, setCached, getEmbeddingCacheKey } from './cache.js';

export const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL || 'text-embedding-3-small';
export const EMBEDDING_DIMENSION = 1536;

export type TaskType = 'RETRIEVAL_DOCUMENT' | 'RETRIEVAL_QUERY' | 'SEMANTIC_SIMILARITY' | 'CLASSIFICATION';

/**
 * Generates 1536-dim dense vector embedding using OpenRouter SDK.
 * Checks and populates Tier 2 Dragonfly cache.
 */
export async function embedText(
  text: string,
  taskType: TaskType = 'RETRIEVAL_QUERY',
  useCache = true
): Promise<number[]> {
  const cleanText = text.trim() || 'placeholder content';

  // Tier 2: Check Dragonfly query embedding cache
  const cacheKey = taskType === 'RETRIEVAL_QUERY' && useCache
    ? getEmbeddingCacheKey(EMBEDDING_MODEL, cleanText)
    : null;

  if (cacheKey) {
    const cached = await getCached<number[]>(cacheKey);
    if (cached && Array.isArray(cached) && cached.length === EMBEDDING_DIMENSION) {
      return cached;
    }
  }

  let attempts = 0;
  while (attempts < 5) {
      attempts++;
      try {
        const res: any = await openrouter.embeddings.generate({
          requestBody: {
            model: EMBEDDING_MODEL,
            input: cleanText,
          },
        });

      const vector = res.data?.[0]?.embedding;
      if (!vector || vector.length !== EMBEDDING_DIMENSION) {
        throw new Error('Invalid embedding vector dimension from OpenRouter SDK');
      }

      if (cacheKey) {
        // Cache query embedding for 7 days in Dragonfly
        await setCached(cacheKey, vector, 7 * 86400);
      }

      return vector;
    } catch (err: any) {
      if (attempts >= 5) throw err;
      const waitMs = Math.min(Math.pow(2, attempts) * 500, 6000);
      await new Promise((r) => setTimeout(r, waitMs));
    }
  }

  throw new Error('Failed to generate embedding with OpenRouter SDK after retries.');
}

/**
 * Batch embeds an array of texts using OpenRouter SDK in batches of 20.
 */
export async function embedBatch(
  texts: string[],
  taskType: TaskType = 'RETRIEVAL_DOCUMENT',
  batchSize = 20,
  onProgress?: (processed: number, total: number) => void
): Promise<number[][]> {
  const allEmbeddings: number[][] = [];

  for (let i = 0; i < texts.length; i += batchSize) {
    const slice = texts.slice(i, i + batchSize).map((t) => t.trim() || 'placeholder');
    let batchValues: number[][] = [];
    let attempts = 0;
    let batchSucceeded = false;

    while (attempts < 4 && !batchSucceeded) {
      attempts++;
      try {
        const res: any = await openrouter.embeddings.generate({
          requestBody: {
            model: EMBEDDING_MODEL,
            input: slice,
          },
        });

        if (res.data && res.data.length === slice.length) {
          batchValues = res.data.map((d: any) => d.embedding);
          batchSucceeded = true;
        }
      } catch {
        await new Promise((r) => setTimeout(r, Math.pow(2, attempts) * 600));
      }
    }

    // Individual fallback with polite pacing if batch failed
    if (!batchSucceeded || batchValues.length !== slice.length) {
      batchValues = [];
      for (const text of slice) {
        const emb = await embedText(text, taskType, false);
        batchValues.push(emb);
        await new Promise((r) => setTimeout(r, 100));
      }
    }

    for (const v of batchValues) {
      allEmbeddings.push(v);
    }

    if (onProgress) {
      onProgress(Math.min(i + batchSize, texts.length), texts.length);
    }

    if (i + batchSize < texts.length) {
      await new Promise((r) => setTimeout(r, 200));
    }
  }

  return allEmbeddings;
}
