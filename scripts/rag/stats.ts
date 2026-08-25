import { getDatabaseStats, closeDb } from '../../src/lib/rag/db.js';
import { getRedisClient, closeCache } from '../../src/lib/rag/cache.js';

async function main() {
  console.log("📊 Checking Jainil's RAG Infrastructure Status...\n");

  try {
    const stats = await getDatabaseStats();
    console.log('🐘 PostgreSQL + pgvector (VPS @ [REDACTED]:4321):');
    console.log(`  - Extension Version: pgvector ${stats.vectorExtensionVersion}`);
    console.log(`  - Documents Indexed: ${stats.documentCount}`);
    console.log(`  - Total Vector Chunks: ${stats.chunkCount}`);
    console.log(`  - Total Relation Size: ${stats.tableSize}`);
    console.log(`  - Last Indexed Timestamp: ${stats.lastIndexedAt || 'Never'}`);
    console.log('  - Breakdown by Category:');
    stats.categories.forEach((c) => {
      console.log(`      * ${c.category}: ${c.count} article(s)`);
    });

    const redis = getRedisClient();
    if (redis) {
      const pingRes = await redis.ping();
      const info = await redis.info('server').catch(() => '');
      const versionMatch = info.match(/dragonfly_version:([^\r\n]+)/) || info.match(/redis_version:([^\r\n]+)/);
      const version = versionMatch ? versionMatch[1] : 'Active';
      console.log(`\n🐉 Dragonfly / Redis (VPS @ [REDACTED]:4322):`);
      console.log(`  - Status: CONNECTED (${pingRes})`);
      console.log(`  - Version: ${version}`);
    }
  } finally {
    await closeDb();
    await closeCache();
  }
}

main().catch((err) => {
  console.error('❌ Status check error:', err);
  process.exit(1);
});
