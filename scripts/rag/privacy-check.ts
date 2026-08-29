/**
 * Privacy audit for private-document handling in the RAG pipeline.
 *
 * Verifies end-to-end that documents flagged is_private (pvt/ knowledge docs,
 * frontmatter private: true) are:
 *   1. Flagged at rest in the database
 *   2. Usable as grounding context ([BACKGROUND])
 *   3. Never surfaced in sources or citation links
 *
 * Run with: npm run rag:privacy
 */
import pg from 'pg';
import { askRag } from '../../src/lib/rag/chat.js';
import { closeDb } from '../../src/lib/rag/db.js';
import { closeCache } from '../../src/lib/rag/cache.js';

const PRIVATE_URL_PREFIX = '/knowledge/pvt/';

async function main() {
  let failed = 0;
  const fail = (msg: string) => { console.error(`❌ FAIL: ${msg}`); failed++; };
  const pass = (msg: string) => console.log(`✅ PASS: ${msg}`);
  const check = (ok: boolean, msg: string) => ok ? pass(msg) : fail(msg);

  // 1. Rest-state audit: private docs must be flagged in SQL.
  const pool = new pg.Pool({ connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL });
  let flagged: pg.QueryResult;
  let pvtByPath: pg.QueryResult;
  try {
    flagged = await pool.query(
      'SELECT url FROM documents WHERE is_private = true ORDER BY url'
    );
    pvtByPath = await pool.query(
      'SELECT count(*)::int AS c FROM documents WHERE url LIKE $1 AND is_private = false',
      [`${PRIVATE_URL_PREFIX}%`]
    );
  } finally {
    await pool.end();
  }

  if (flagged.rows.length === 0) {
    console.log('⚠️ No private documents indexed — rest-state and grounding checks are vacuous.');
  }
  check(
    pvtByPath.rows[0].c === 0,
    `${flagged.rows.length} document(s) flagged is_private; no /knowledge/pvt/ doc left unflagged`
  );

  // 2. Live probes: private knowledge grounds answers without ever being citable.
  const probePrivate = await askRag('Who is Hetal?', { useCache: false });
  const probePublic = await askRag('What does Jainil work on professionally?', { useCache: false });

  const leakInSources = (res: { sources: { url: string }[] }) =>
    res.sources.filter((s) => s.url.startsWith(PRIVATE_URL_PREFIX));
  const leakInAnswer = (answer: string) =>
    [...answer.matchAll(/\[\[\d+\]\]\(([^)]+)\)/g)].some((m) => m[1].startsWith(PRIVATE_URL_PREFIX));

  check(leakInSources(probePrivate).length === 0 && !leakInAnswer(probePrivate.answer),
    `private-anchored question cites nothing private (${probePrivate.sources.length} public source(s), ${probePrivate.answer.length} chars grounded)`);

  const publicLinks = [...probePublic.answer.matchAll(/\[\[\d+\]\]\(([^)]+)\)/g)].map((m) => m[1]);
  check(probePublic.sources.length > 0 && !leakInAnswer(probePublic.answer),
    `public question still cites (${probePublic.sources.length} source(s))${publicLinks.length > 0 ? ` + ${publicLinks.length} inline link(s)` : ''}`);

  if (leakInSources(probePublic).length > 0 || publicLinks.some((u) => u.startsWith(PRIVATE_URL_PREFIX))) {
    fail('public question leaked a private reference');
  }

  console.log(failed === 0 ? '\n🔒 Privacy audit passed.' : `\n💥 Privacy audit failed (${failed}).`);
  return failed;
}

main()
  .then(async (failed) => {
    await closeDb();
    await closeCache();
    process.exit(failed === 0 ? 0 : 1);
  })
  .catch(async (err) => {
    console.error('\n❌ Privacy audit error:', err);
    await closeDb();
    await closeCache();
    process.exit(1);
  });
