import pg from 'pg';
import { embedText } from '../../src/lib/rag/embeddings.js';
import { closeDb } from '../../src/lib/rag/db.js';

const pool = new pg.Pool({ connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL });

const models = await pool.query(`SELECT embedding_model, embedding_dimension, count(*) FROM chunks GROUP BY 1,2`);
console.log('chunk models:', JSON.stringify(models.rows));

const doc = await pool.query(`SELECT c.embedding, c.embedding_model, c.embedding_dimension, left(c.content, 60) AS preview
  FROM chunks c LIMIT 1`);
const row = doc.rows[0];
console.log('sample doc:', row.embedding_model, 'dim', row.embedding_dimension, '|', row.preview);

const emb = row.embedding;
const dims = typeof emb === 'string' ? JSON.parse(emb) : emb;
console.log('stored dims:', dims.length, 'norm²:', dims.reduce((s: number, x: number) => s + x * x, 0).toFixed(3));

// self-similarity: embed similar text as query, compare with stored doc vector
const qv = await embedText(row.preview, 'RETRIEVAL_QUERY');
const dot = qv.reduce((s, x, i) => s + x * dims[i], 0);
const nq = Math.sqrt(qv.reduce((s, x) => s + x * x, 0));
const nd = Math.sqrt(dims.reduce((s: number, x: number) => s + x * x, 0));
console.log('query-vs-stored cosine:', (dot / (nq * nd)).toFixed(3), '| query norm²:', nq.toFixed(3));

await pool.end();
process.exit(0);
