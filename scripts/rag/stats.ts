import { getDatabaseStats, closeDb } from '../../src/lib/rag/db.js';
import { getRedisClient, closeCache } from '../../src/lib/rag/cache.js';

function hostFromUrl(url: string | undefined, defaultPort: string): string {
  if (!url) return 'env not set';
  try {
    const u = new URL(url);
    return `${u.hostname}:${u.port || defaultPort}`;
  } catch {
    return 'invalid url';
  }
}

async function main() {
  console.log("📊 Checking Jainil's RAG Infrastructure Status...\n");

  try {
    const stats = await getDatabaseStats();
    console.log(`🐘 PostgreSQL + pgvector (${hostFromUrl(process.env.DATABASE_URL || process.env.POSTGRES_URL, '5432')}):`);
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
      console.log(`\n🐉 Dragonfly / Redis (${hostFromUrl(process.env.DRAGONFLY_URL || process.env.REDIS_URL, '6379')}):`);
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
