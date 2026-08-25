import readline from 'node:readline';
import { askRag } from '../../src/lib/rag/chat.js';
import { closeDb } from '../../src/lib/rag/db.js';
import { closeCache } from '../../src/lib/rag/cache.js';

async function streamWords(text: string, delayMs = 12): Promise<void> {
  const words = text.split(/(\s+)/);
  for (const word of words) {
    process.stdout.write(word);
    if (word.trim()) {
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  console.log();
}

async function handleQuestion(query: string) {
  process.stdout.write(`\n🔍 Searching Jainil's RAG knowledge base... `);
  const start = Date.now();
  const response = await askRag(query);
  const elapsed = Date.now() - start;

  process.stdout.write(`⚡ Done (${elapsed}ms${response.cached ? ' [Cached]' : ''})\n\n`);

  console.log('============================================================');
  console.log("💡 JAINIL'S RAG ANSWER:");
  console.log('============================================================');
  
  if (response.cached) {
    console.log(response.answer);
  } else {
    await streamWords(response.answer, 8);
  }

  console.log('\n============================================================');
  console.log('📚 CITATIONS & SOURCES:');
  console.log('============================================================');
  if (response.sources.length === 0) {
    console.log('No specific sources cited.');
  } else {
    response.sources.forEach((s, idx) => {
      console.log(`[${idx + 1}] 📄 ${s.title} (${s.heading || 'Main'}) -> ${s.url} (Score: ${s.score})`);
    });
  }
  console.log('------------------------------------------------------------');
  console.log(`⏱️ Latency: ${response.executionTimeMs}ms | Cached: ${response.cached} | Model: ${response.model} | Confidence: ${response.confidence}\n`);
}

async function startInteractive() {
  console.log("============================================================");
  console.log("💬 JAINIL'S RAG — Live Interactive Chat Mode");
  console.log("Ask any question about Jainil's portfolio, resume, or articles.");
  console.log("Type 'exit' or 'quit' to exit.");
  console.log("============================================================\n");

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const promptUser = () => {
    rl.question('Ask Jainil\'s RAG > ', async (input) => {
      const q = input.trim();
      if (!q) {
        promptUser();
        return;
      }
      if (q.toLowerCase() === 'exit' || q.toLowerCase() === 'quit') {
        rl.close();
        return;
      }
      try {
        await handleQuestion(q);
      } catch (err: any) {
        console.error('\n❌ Error generating answer:', err.message);
      }
      promptUser();
    });
  };

  promptUser();

  rl.on('close', async () => {
    console.log('\n👋 Exiting Jainil\'s RAG. Goodbye!');
    await closeDb();
    await closeCache();
    process.exit(0);
  });
}

async function main() {
  const query = process.argv.slice(2).join(' ').trim();
  if (!query) {
    await startInteractive();
    return;
  }

  try {
    await handleQuestion(query);
  } finally {
    await closeDb();
    await closeCache();
  }
}

main().catch((err) => {
  console.error('❌ Chat error:', err);
  process.exit(1);
});
