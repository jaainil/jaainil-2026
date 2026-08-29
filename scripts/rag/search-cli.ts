import { hybridSearch } from '../../src/lib/rag/search.js';
import { rerankResults } from '../../src/lib/rag/rerank.js';
import { closeDb } from '../../src/lib/rag/db.js';
import { closeCache } from '../../src/lib/rag/cache.js';

async function main() {
  const query = process.argv.slice(2).join(' ').trim();
  if (!query) {
    console.log('Usage: npm run rag:search "<search query>"');
    console.log('Example: npm run rag:search "Claude Code source leak"');
    process.exit(0);
  }

  console.log(`🔎 Searching Jainil's RAG for: "${query}"...\n`);
  const start = Date.now();

  try {
    let results = await hybridSearch(query, { limit: 8, threshold: 0.25 });
    if (results.length > 5 && process.env.OPENROUTER_API_KEY) {
      console.log('🧠 Reranking top candidates with LLM...');
      results = await rerankResults(query, results, 5);
    } else {
      results = results.slice(0, 5);
    }

    const elapsed = Date.now() - start;

    if (results.length === 0) {
      console.log("⚠️ No matching documents found in Jainil's RAG (low similarity threshold).");
      return;
    }

    console.log(`✅ Found ${results.length} relevant chunks in ${elapsed}ms:\n`);
    results.forEach((r, i) => {
      console.log(`------------------------------------------------------------`);
      console.log(`[${i + 1}] 📄 ${r.title} > ${r.heading || 'Introduction'}`);
      console.log(`    🔗 URL: ${r.url}`);
      console.log(`    ⭐ Scores: Vector=${r.vectorScore.toFixed(3)} | FTS=${r.textScore.toFixed(3)} | RRF=${r.rrfScore.toFixed(4)}`);
      console.log(`    📝 Excerpt:`);
      const excerpt = r.content
        .split('\n')
        .slice(0, 5)
        .map((l) => '       ' + l)
        .join('\n');
      console.log(excerpt);
      console.log('');
    });
  } finally {
    await closeDb();
    await closeCache();
  }
}

main().catch((err) => {
  console.error('❌ Search error:', err);
  process.exit(1);
});
