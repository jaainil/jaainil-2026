import pg from 'pg';
import { getKbVersion } from './cache.js';
import type { DocumentRecord, ChunkRecord, DatabaseStats } from './types.js';

const { Pool } = pg;
let pool: pg.Pool | null = null;

export function getDbPool(): pg.Pool {
  if (!pool) {
    const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('POSTGRES_URL or DATABASE_URL is not defined.');
    }
    pool = new Pool({
      connectionString,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });
  }
  return pool;
}

export async function withDb<T>(fn: (client: pg.PoolClient) => Promise<T>): Promise<T> {
  const p = getDbPool();
  const client = await p.connect();
  try {
    return await fn(client);
  } finally {
    client.release();
  }
}

export async function initSchema(): Promise<void> {
  await withDb(async (client) => {
    // 1. Enable pgvector
    await client.query('CREATE EXTENSION IF NOT EXISTS vector;');

    // 2. Documents table (includes source_hash and last_seen_at)
    await client.query(`
      CREATE TABLE IF NOT EXISTS documents (
        id SERIAL PRIMARY KEY,
        url TEXT UNIQUE NOT NULL,
        title TEXT NOT NULL,
        type TEXT NOT NULL DEFAULT 'article',
        category TEXT,
        description TEXT,
        tags TEXT[],
        source_hash TEXT,
        published_at TIMESTAMPTZ,
        indexed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        is_private BOOLEAN NOT NULL DEFAULT false
      );
    `);

    // Ensure columns exist on older tables
    await client.query(`
      ALTER TABLE documents ADD COLUMN IF NOT EXISTS source_hash TEXT;
      ALTER TABLE documents ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ DEFAULT now();
      ALTER TABLE documents ADD COLUMN IF NOT EXISTS is_private BOOLEAN NOT NULL DEFAULT false;
    `);

    // Self-healing backfill: anything under the pvt/ knowledge path is private,
    // even if an older ingest marked it public (e.g. frontmatter url overrides).
    await client.query(`
      UPDATE documents SET is_private = true WHERE url LIKE '/knowledge/pvt/%' AND is_private = false;
    `);

    // Check if document_chunks exists and its vector dimension using canonical format_type
    const colCheck = await client.query(`
      SELECT format_type(atttypid, atttypmod) as fmt 
      FROM pg_attribute 
      WHERE attrelid = 'document_chunks'::regclass AND attname = 'embedding';
    `).catch(() => ({ rows: [] }));

    const fmt = colCheck.rows[0]?.fmt;
    if (colCheck.rows.length > 0 && fmt !== 'vector(1536)') {
      console.log(`🔄 Updating table with vector(1536) for OpenRouter Embeddings + HNSW index...`);
      await client.query('DROP TABLE IF EXISTS document_chunks CASCADE;');
    }

    // 3. Document chunks table (includes content_hash and metadata JSONB)
    await client.query(`
      CREATE TABLE IF NOT EXISTS document_chunks (
        id SERIAL PRIMARY KEY,
        document_id INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
        heading TEXT,
        chunk_index INTEGER NOT NULL,
        content TEXT NOT NULL,
        content_hash TEXT,
        metadata JSONB NOT NULL DEFAULT '{}',
        embedding vector(1536) NOT NULL,
        embedding_model TEXT NOT NULL DEFAULT 'text-embedding-3-small',
        embedding_dimension INTEGER NOT NULL DEFAULT 1536,
        tsv tsvector GENERATED ALWAYS AS (
          to_tsvector('english', coalesce(heading, '') || ' ' || content)
        ) STORED,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    await client.query(`
      ALTER TABLE document_chunks ADD COLUMN IF NOT EXISTS content_hash TEXT;
      ALTER TABLE document_chunks ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';
    `);

    // 4. Indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_chunks_embedding 
      ON document_chunks USING hnsw (embedding vector_cosine_ops);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_chunks_tsv 
      ON document_chunks USING gin (tsv);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_chunks_document 
      ON document_chunks(document_id);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_documents_url 
      ON documents(url);
    `);
  });
}

export async function getDocumentByUrl(url: string): Promise<DocumentRecord | null> {
  return withDb(async (client) => {
    const res = await client.query('SELECT * FROM documents WHERE url = $1 LIMIT 1', [url]);
    if (res.rows.length === 0) return null;
    const r = res.rows[0];
    return {
      id: r.id,
      url: r.url,
      title: r.title,
      type: r.type,
      category: r.category,
      description: r.description,
      tags: r.tags,
      sourceHash: r.source_hash,
      isPrivate: r.is_private,
      publishedAt: r.published_at,
      indexedAt: r.indexed_at,
      lastSeenAt: r.last_seen_at,
    };
  });
}

export async function upsertDocument(doc: DocumentRecord): Promise<number> {
  return withDb(async (client) => {
    const res = await client.query(
      `
      INSERT INTO documents (url, title, type, category, description, tags, source_hash, published_at, indexed_at, last_seen_at, is_private)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, now(), now(), $9)
      ON CONFLICT (url) DO UPDATE SET
        title = EXCLUDED.title,
        type = EXCLUDED.type,
        category = EXCLUDED.category,
        description = EXCLUDED.description,
        tags = EXCLUDED.tags,
        source_hash = EXCLUDED.source_hash,
        published_at = EXCLUDED.published_at,
        indexed_at = now(),
        last_seen_at = now(),
        is_private = EXCLUDED.is_private
      RETURNING id;
      `,
      [
        doc.url,
        doc.title,
        doc.type || 'article',
        doc.category || null,
        doc.description || null,
        doc.tags || [],
        doc.sourceHash || null,
        doc.publishedAt || null,
        doc.isPrivate || false,
      ]
    );
    return res.rows[0].id;
  });
}

export async function replaceDocumentChunks(documentId: number, chunks: ChunkRecord[]): Promise<void> {
  return withDb(async (client) => {
    await client.query('BEGIN');
    try {
      await client.query('DELETE FROM document_chunks WHERE document_id = $1', [documentId]);

      for (const chunk of chunks) {
        if (!chunk.embedding || chunk.embedding.length === 0) {
          throw new Error(`Missing embedding for chunk in document ID ${documentId}`);
        }
        const vectorStr = `[${chunk.embedding.join(',')}]`;
        const model = chunk.embeddingModel || 'text-embedding-3-small';
        const dim = chunk.embeddingDimension || 1536;
        const metaStr = JSON.stringify(chunk.metadata || {});

        await client.query(
          `
          INSERT INTO document_chunks (document_id, heading, chunk_index, content, content_hash, metadata, embedding, embedding_model, embedding_dimension, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7::vector, $8, $9, now())
          `,
          [documentId, chunk.heading, chunk.chunkIndex, chunk.content, chunk.contentHash || null, metaStr, vectorStr, model, dim]
        );
      }
      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    }
  });
}

export async function getDatabaseStats(): Promise<DatabaseStats> {
  return withDb(async (client) => {
    const docCountRes = await client.query('SELECT count(*)::int AS count FROM documents');
    const chunkCountRes = await client.query('SELECT count(*)::int AS count FROM document_chunks');
    const catRes = await client.query(`
      SELECT coalesce(category, 'uncategorized') AS category, count(*)::int AS count 
      FROM documents GROUP BY category ORDER BY count DESC
    `);
    const modelRes = await client.query(`
      SELECT coalesce(embedding_model, 'unknown') AS model, count(*)::int AS count 
      FROM document_chunks GROUP BY embedding_model ORDER BY count DESC
    `);
    const lastIndexedRes = await client.query('SELECT max(indexed_at) AS last_indexed FROM documents');
    const extRes = await client.query("SELECT default_version, installed_version FROM pg_available_extensions WHERE name = 'vector'");
    const sizeRes = await client.query("SELECT pg_size_pretty(pg_total_relation_size('document_chunks')) AS size");

    return {
      documentCount: docCountRes.rows[0]?.count || 0,
      chunkCount: chunkCountRes.rows[0]?.count || 0,
      categories: catRes.rows.map((r) => ({ category: r.category, count: r.count })),
      embeddingModels: modelRes.rows.map((r) => ({ model: r.model, count: r.count })),
      kbVersion: getKbVersion(),
      lastIndexedAt: lastIndexedRes.rows[0]?.last_indexed ? new Date(lastIndexedRes.rows[0].last_indexed).toISOString() : null,
      vectorExtensionVersion: extRes.rows[0]?.installed_version || extRes.rows[0]?.default_version || 'unknown',
      tableSize: sizeRes.rows[0]?.size || '0 bytes',
    };
  });
}

/** DB-server clock (avoids host-vs-VPS skew when pruning). */
export async function getDbNow(): Promise<Date> {
  return withDb(async (client) => {
    const res = await client.query('SELECT now() AS ts');
    return res.rows[0].ts as Date;
  });
}

/** Marks a scanned-but-unchanged document as still present on disk. */
export async function touchDocumentSeen(url: string): Promise<void> {
  await withDb(async (client) => {
    await client.query('UPDATE documents SET last_seen_at = now() WHERE url = $1', [url]);
  });
}

/** Deletes documents not seen during this ingestion run; chunks go via ON DELETE CASCADE. */
export async function pruneStaleDocuments(cutoff: Date): Promise<string[]> {
  return withDb(async (client) => {
    const res = await client.query(
      'DELETE FROM documents WHERE last_seen_at < $1 RETURNING url',
      [cutoff]
    );
    return res.rows.map((r: { url: string }) => r.url);
  });
}

export async function closeDb(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
