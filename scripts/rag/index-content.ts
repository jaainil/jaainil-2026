import { ingestAllArticles } from '../../src/lib/rag/ingest.js';
import { getDatabaseStats, closeDb } from '../../src/lib/rag/db.js';
import { closeCache } from '../../src/lib/rag/cache.js';

async function main() {
  console.log("🚀 Starting Jainil's RAG Ingestion Pipeline...\n");
  try {
    const res = await ingestAllArticles({
      onProgress(title, current, total) {
        console.log(`[${current}/${total}] 📖 ${title}`);
      },
    });

    const stats = await getDatabaseStats();
    console.log("\n📊 Jainil's RAG Database State:");
    console.log(`- Total Documents: ${stats.documentCount}`);
    console.log(`- Total Vector Chunks: ${stats.chunkCount}`);
    console.log(`- Index Table Size: ${stats.tableSize}`);
    console.log(`- Categories Indexed:`, stats.categories.map((c) => `${c.category} (${c.count})`).join(', '));
  } finally {
    await closeDb();
    await closeCache();
  }
}

main().catch((err) => {
  console.error('\n❌ Ingestion error:', err);
  process.exit(1);
});
