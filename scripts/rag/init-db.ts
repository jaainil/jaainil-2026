import { initSchema, getDatabaseStats, closeDb } from '../../src/lib/rag/db.js';

async function main() {
  console.log('⚡ Initializing PostgreSQL schema & pgvector extensions on VPS...');
  const start = Date.now();
  await initSchema();
  const stats = await getDatabaseStats();
  console.log('✅ Schema initialized successfully in ' + (Date.now() - start) + 'ms');
  console.log('📊 Current database statistics:');
  console.log(JSON.stringify(stats, null, 2));
  await closeDb();
}

main().catch((err) => {
  console.error('❌ Failed to initialize schema:', err);
  process.exit(1);
});
