import { embedText, EMBEDDING_MODEL } from './embeddings.js';
import { withDb } from './db.js';
import { getCached, setCached, getSearchCacheKey, getKbVersion } from './cache.js';
import { classifyQueryIntent } from './intent.js';
import type { SearchResult, SearchOptions } from './types.js';

interface RawDbRow {
  id: number;
  document_id: number;
  url: string;
  title: string;
  is_private: boolean;
  heading: string | null;
  category: string | null;
  published_at: string | null;
  content: string;
  metadata: any;
  similarity?: number;
  fts_rank?: number;
  embedding_model: string;
}

/**
 * Executes parallel Hybrid Search (pgvector HNSW Cosine Search + PostgreSQL websearch FTS).
 */
export async function hybridSearch(
  query: string,
  options: SearchOptions = {}
): Promise<SearchResult[]> {
  const {
    limit = 6,
    threshold = 0.25,
    category,
    type,
    rrfK = 60,
    vectorWeight = 0.65,
    textWeight = 0.35,
    useCache = true,
  } = options;

  const intent = options.intent || classifyQueryIntent(query);
  const cacheKey = useCache
    ? getSearchCacheKey(query, JSON.stringify({ limit, threshold, category, type, intent }), getKbVersion())
    : null;

  if (cacheKey) {
    const cached = await getCached<SearchResult[]>(cacheKey);
    if (cached) return cached;
  }

  // 1. Generate query embedding (Tier 2 Dragonfly Cache)
  const queryVector = await embedText(query, 'RETRIEVAL_QUERY');
  const vectorStr = `[${queryVector.join(',')}]`;

  // 2. Parallel Database Execution
  const [vectorRows, textRows] = await withDb(async (client) => {
    // By default exclude private docs. Chat passes includePrivate:true so that
    // private knowledge chunks can be used as [BACKGROUND] grounding context
    // without ever being surfaced to the user as citable sources.
    let filterClause = options.includePrivate ? '' : ' AND d.is_private = false';
    const queryParams: any[] = [];

    if (category) {
      queryParams.push(category);
      filterClause += ` AND d.category = $${queryParams.length}`;
    }

    if (type) {
      queryParams.push(type);
      filterClause += ` AND d.type = $${queryParams.length}`;
    } else if (intent === 'resume') {
      filterClause += ` AND (d.type = 'resume' OR d.type = 'page')`;
    } else if (intent === 'profile') {
      filterClause += ` AND (d.type = 'page' OR d.type = 'resume')`;
    }

    // A. Vector Cosine Search (pgvector HNSW)
    const vectorParamIndex = queryParams.length + 1;
    const thresholdParamIndex = queryParams.length + 2;
    const vectorLimitParamIndex = queryParams.length + 3;
    const vectorSql = `
      SELECT 
        c.id,
        c.document_id,
        d.url,
        d.title,
        d.is_private,
        c.heading,
        d.category,
        d.published_at,
        c.content,
        c.metadata,
        c.embedding_model,
        1 - (c.embedding <=> $${vectorParamIndex}::vector) AS similarity
      FROM document_chunks c
      JOIN documents d ON c.document_id = d.id
      WHERE (1 - (c.embedding <=> $${vectorParamIndex}::vector)) >= $${thresholdParamIndex}
      ${filterClause}
      ORDER BY c.embedding <=> $${vectorParamIndex}::vector ASC
      LIMIT $${vectorLimitParamIndex};
    `;

    // B. Full-Text Search (GIN tsvector with websearch_to_tsquery)
    const textParamIndex = queryParams.length + 1;
    const textLimitParamIndex = queryParams.length + 2;
    const textSql = `
      SELECT 
        c.id,
        c.document_id,
        d.url,
        d.title,
        d.is_private,
        c.heading,
        d.category,
        d.published_at,
        c.content,
        c.metadata,
        c.embedding_model,
        ts_rank_cd(c.tsv, websearch_to_tsquery('english', $${textParamIndex})) AS fts_rank
      FROM document_chunks c
      JOIN documents d ON c.document_id = d.id
      WHERE c.tsv @@ websearch_to_tsquery('english', $${textParamIndex})
      ${filterClause}
      ORDER BY fts_rank DESC
      LIMIT $${textLimitParamIndex};
    `;

    const fetchLimit = limit * 3;
    const [vRes, tRes] = await Promise.all([
      client.query<RawDbRow>(vectorSql, [...queryParams, vectorStr, threshold, fetchLimit]),
      client.query<RawDbRow>(textSql, [...queryParams, query, fetchLimit]).catch(() => ({ rows: [] as RawDbRow[] })),
    ]);

    return [vRes.rows, tRes.rows];
  });

  // 3. Reciprocal Rank Fusion (RRF)
  const scoreMap = new Map<number, {
    row: RawDbRow;
    vRank: number | null;
    tRank: number | null;
    vectorScore: number;
    textScore: number;
  }>();

  vectorRows.forEach((row, idx) => {
    scoreMap.set(row.id, {
      row,
      vRank: idx + 1,
      tRank: null,
      vectorScore: row.similarity || 0,
      textScore: 0,
    });
  });

  textRows.forEach((row, idx) => {
    const existing = scoreMap.get(row.id);
    if (existing) {
      existing.tRank = idx + 1;
      existing.textScore = row.fts_rank || 0;
    } else {
      scoreMap.set(row.id, {
        row,
        vRank: null,
        tRank: idx + 1,
        vectorScore: 0,
        textScore: row.fts_rank || 0,
      });
    }
  });

  const mergedResults: SearchResult[] = Array.from(scoreMap.values()).map(({ row, vRank, tRank, vectorScore, textScore }) => {
    const rrfVector = vRank ? vectorWeight * (1 / (rrfK + vRank)) : 0;
    const rrfText = tRank ? textWeight * (1 / (rrfK + tRank)) : 0;
    const rrfScore = rrfVector + rrfText;

    return {
      id: row.id,
      documentId: row.document_id,
      url: row.url,
      title: row.title,
      heading: row.heading,
      category: row.category,
      publishedAt: row.published_at ? new Date(row.published_at).toISOString() : null,
      content: row.content,
      isPrivate: row.is_private ?? false,
      vectorScore,
      textScore,
      rrfScore,
      embeddingModel: row.embedding_model || EMBEDDING_MODEL,
      metadata: row.metadata,
    };
  });

  mergedResults.sort((a, b) => b.rrfScore - a.rrfScore);
  const finalResults = mergedResults.slice(0, limit).map((item, idx) => ({
    ...item,
    rank: idx + 1,
  }));

  if (cacheKey && finalResults.length > 0) {
    await setCached(cacheKey, finalResults, 3600);
  }

  return finalResults;
}
