import assert from 'node:assert/strict';
import { test, afterEach } from 'node:test';

// Offline fixtures replace provider/DB I/O; retrieval, routing and output rails stay real.
process.env.OPENROUTER_API_KEY = 'offline-test';
process.env.RAG_MODEL = 'anthropic/claude-haiku-5.5';
process.env.POSTGRES_URL = 'postgres://offline:offline@localhost/offline';
process.env.DRAGONFLY_URL = '';
process.env.REDIS_URL = '';
const { askRag } = await import('../../src/lib/rag/chat.js');
const { openrouter } = await import('../../src/lib/rag/clients.js');
const { getDbPool, closeDb } = await import('../../src/lib/rag/db.js');
const { getAnswerCacheKey } = await import('../../src/lib/rag/cache.js');
const { rerankWithStatus } = await import('../../src/lib/rag/rerank.js');
const { hybridSearch } = await import('../../src/lib/rag/search.js');
const { embedText } = await import('../../src/lib/rag/embeddings.js');
const { isExfil } = await import('../../src/lib/rag/guardrails.js');
const { POST } = await import('../../src/pages/api/rag/chat.js');
const { passesEvaluation } = await import('../../src/lib/rag/evaluation.js');
const { primaryLlmCircuit, rerankerCircuit } = await import('../../src/lib/rag/circuit.js');
const { mock } = await import('node:test');

afterEach(() => {
  mock.restoreAll();
  primaryLlmCircuit.recordSuccess();
  rerankerCircuit.recordSuccess();
});

function setup(answer = 'Jainil builds Writenex, an Astro CMS. [SOURCE: 1]') {
  const calls: any[] = [];
  mock.method(openrouter.chat, 'send', async (input: any) => {
    const request = input.chatRequest;
    calls.push(request);
    return { choices: [{ finishReason: 'stop', message: { role: 'assistant',
      content: request.maxTokens === 256 ? 'Writenex CMS\nWritenex project' : answer } }] };
  });
  mock.method(openrouter.embeddings, 'generate', async () => ({ data: [{ embedding: Array(1536).fill(0.01) }] }));
  mock.method(getDbPool(), 'connect', async () => ({
    release() {},
    async query(sql: string) {
      return { rows: Array.from({ length: 8 }, (_, i) => ({
        id: i + 1, document_id: 1, url: '/about', title: 'About Jainil',
        is_private: false, heading: 'Projects', category: null, published_at: null,
        content: 'Jainil builds Writenex, an Astro CMS.', metadata: {},
        embedding_model: 'text-embedding-3-small', similarity: 0.82 - i * 0.01,
        fts_rank: sql.includes('ts_rank_cd') ? 0.1 : undefined,
      })) };
    },
  }));
  mock.method(globalThis, 'fetch', async () => new Response(JSON.stringify({ results: [{ index: 0, relevance_score: 0.9 }] })));
  return calls;
}

test('decisive standalone retrieval skips rewriting and reranking', async () => {
  const calls = setup();
  const result = await askRag('What is Writenex?', { useCache: false });
  assert.equal(result.trace?.path, 'FAST_PATH');
  assert.equal(calls.length, 1);
  assert.match(result.answer, /\[\[1\]\]\(\/about\)/);
});

test('generation rules use the provider system instruction field', async () => {
  const calls = setup();
  await askRag('What is Writenex?', { useCache: false });
  const generation = calls.at(-1);
  assert.match(generation.messages[0].content, /GROUNDING PROTOCOL/);
  assert.ok(!generation.messages[1].content.includes('GROUNDING PROTOCOL'));
});

for (const answer of [
  'Jainil won an invented engineering award.',
  'Jainil won an invented engineering award. [SOURCE: 999]',
  'Jainil builds Writenex. [SOURCE: 1] He won an invented award. [SOURCE: 999]',
]) {
  test(`unsupported generation falls back to retrieved evidence: ${answer}`, async () => {
    setup(answer);
    const result = await askRag('What is Writenex?', { useCache: false });
    assert.ok(!result.answer.includes('invented'));
    assert.match(result.answer, /Writenex/);
    assert.match(result.answer, /\[\[1\]\]\(\/about\)/);
  });
}

test('answer cache isolates retrieval configuration', () => {
  assert.notEqual(
    getAnswerCacheKey('What is Writenex?', 'kb', { category: 'engineering' }),
    getAnswerCacheKey('What is Writenex?', 'kb', { category: 'personal' }),
  );
});

test('reranker preserves zero relevance and rejects duplicate/invalid indexes', async () => {
  setup();
  mock.method(globalThis, 'fetch', async () => new Response(JSON.stringify({ results: [
    { index: 1, relevance_score: 0 }, { index: 1, relevance_score: 0.8 },
    { index: 0.5, relevance_score: 1 },
  ] })));
  const candidates = Array.from({ length: 3 }, (_, i) => ({
    id: i + 1, documentId: 1, url: '/about', title: 'About', heading: null,
    category: null, publishedAt: null, content: 'Writenex CMS', isPrivate: false,
    vectorScore: 0.8, textScore: 0, rrfScore: 0.01, embeddingModel: 'test',
  }));
  const result = await rerankWithStatus('Writenex', candidates, 2);
  assert.deepEqual(result.results.map((r) => r.id), [2, 1]);
  assert.equal(result.results[0].rrfScore, 0);
});

test('follow-ups rewrite using history before answering', async () => {
  const calls = setup();
  await askRag('How does it work?', { useCache: false, history: [{ role: 'user', content: 'What is Writenex?' }] });
  assert.ok(calls.length >= 2);
  assert.match(calls[0].messages[1].content, /What is Writenex/);
});

test('authentication failures are not retried by the embedding client', async () => {
  let attempts = 0;
  mock.method(openrouter.embeddings, 'generate', async () => {
    attempts++;
    throw Object.assign(new Error('Unauthorized'), { statusCode: 401 });
  });
  await assert.rejects(embedText('Writenex', 'RETRIEVAL_QUERY', false), /Unauthorized/);
  assert.equal(attempts, 1);
});

test('keyword retrieval survives an embedding provider outage', async () => {
  setup();
  mock.method(openrouter.embeddings, 'generate', async () => {
    throw Object.assign(new Error('Unauthorized'), { statusCode: 401 });
  });
  const results = await hybridSearch('Writenex', { useCache: false });
  assert.equal(results[0].url, '/about');
  assert.equal(results[0].vectorScore, 0);
  assert.ok(results[0].textScore > 0);
});

test('invalid reranker payload degrades to original ordering', async () => {
  setup();
  mock.method(globalThis, 'fetch', async () => new Response(JSON.stringify({ results: [
    { index: 999, relevance_score: 0.99 },
  ] })));
  const candidates = Array.from({ length: 3 }, (_, i) => ({
    id: i + 1, documentId: 1, url: '/about', title: 'About', heading: null,
    category: null, publishedAt: null, content: 'Writenex CMS', isPrivate: false,
    vectorScore: 0.8, textScore: 0, rrfScore: 0.01, embeddingModel: 'test',
  }));
  const result = await rerankWithStatus('Writenex', candidates, 2);
  assert.equal(result.ok, false);
  assert.deepEqual(result.results.map((r) => r.id), [1, 2]);
});

for (const link of [
  '[click](javascript:alert%281%29)', '[click](data:text/html,attack)',
  '[click](//evil.example/steal)', '[click](/about?secret=stolen)',
  'https://jaainil.com/about?secret=stolen',
]) {
  test(`output rejects unsafe or unverified link: ${link}`, () => {
    assert.equal(isExfil(link, ['/about']), true);
  });
}

test('source metadata is redacted before returning it to clients', async () => {
  setup();
  mock.method(getDbPool(), 'connect', async () => ({
    release() {}, async query() { return { rows: [{
      id: 1, document_id: 1, url: '/about', title: 'About', is_private: false,
      heading: 'Projects', content: 'Writenex owner accidental@example.com sk-abcdefghijklmnop123456',
      similarity: 0.9, fts_rank: 0.1, embedding_model: 'test',
    }] }; },
  }));
  const result = await askRag('What is Writenex?', { useCache: false });
  assert.ok(!JSON.stringify(result.sources).includes('accidental@example.com'));
  assert.ok(!JSON.stringify(result.sources).includes('sk-abcdefghijklmnop'));
});

test('chat endpoint bounds actual request bytes even with a misleading length header', async () => {
  const request = new Request('https://jaainil.com/api/rag/chat/', {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': '20' },
    body: JSON.stringify({ question: 'What model are you?', unused: 'x'.repeat(40000) }),
  });
  const response = await POST({ request, clientAddress: 'offline-body-test' } as any);
  assert.equal(response.status, 413);
});

test('chat endpoint rejects browser requests from another origin', async () => {
  const request = new Request('https://jaainil.com/api/rag/chat/', {
    method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'https://evil.example' },
    body: JSON.stringify({ question: 'What model are you?' }),
  });
  const response = await POST({ request, clientAddress: 'offline-origin-test' } as any);
  assert.equal(response.status, 403);
});

test('evaluation fails when correct retrieval hides missing or invalid answer citations', () => {
  assert.equal(passesEvaluation({ recallAt3: 100, refusalAccuracy: 100, citationValidity: 100, citationBackedAnswers: 0 }), false);
  assert.equal(passesEvaluation({ recallAt3: 100, refusalAccuracy: 100, citationValidity: 90, citationBackedAnswers: 100 }), false);
  assert.equal(passesEvaluation({ recallAt3: 100, refusalAccuracy: 100, citationValidity: 100, citationBackedAnswers: 100 }), true);
});

test('static fallback cannot emit executable links copied from retrieved content', async () => {
  setup('');
  mock.method(getDbPool(), 'connect', async () => ({
    release() {}, async query() { return { rows: [{
      id: 1, document_id: 1, url: '/about', title: 'About', is_private: false,
      heading: 'Projects', content: 'Writenex [click](javascript:alert%281%29)',
      similarity: 0.9, fts_rank: 0.1, embedding_model: 'test',
    }] }; },
  }));
  const result = await askRag('What is Writenex?', { useCache: false });
  assert.ok(!result.answer.includes('javascript:'));
  assert.equal(result.model, 'extractive-fallback');
});

test('model finding no direct support returns a refusal rather than unrelated excerpts', async () => {
  setup('[NO_ANSWER]');
  const result = await askRag('What is Writenex?', { useCache: false });
  assert.equal(result.model, 'grounded-refusal');
  assert.deepEqual(result.sources, []);
  assert.ok(!result.answer.includes('[NO_ANSWER]'));
});

test('unsafe indexed source URLs cannot become citation links', async () => {
  setup();
  mock.method(getDbPool(), 'connect', async () => ({
    release() {}, async query() { return { rows: [{
      id: 1, document_id: 1, url: 'javascript:alert%281%29', title: 'About', is_private: false,
      heading: 'Projects', content: 'Jainil builds Writenex.',
      similarity: 0.9, fts_rank: 0.1, embedding_model: 'test',
    }] }; },
  }));
  const result = await askRag('What is Writenex?', { useCache: false });
  assert.deepEqual(result.sources, []);
  assert.ok(!result.answer.includes('javascript:'));
});

test('fallback excerpts omit indexing headers and preserve complete sentences', async () => {
  setup('');
  const firstSentence = 'Anthropic published Claude Code v2.1.89 to npm with a source map that exposed the original TypeScript implementation and internal tooling.';
  const secondSentence = 'The accidentally bundled map let readers inspect the client implementation and unpublished features without implying that the repository was officially open source.';
  mock.method(getDbPool(), 'connect', async () => ({
    release() {}, async query() { return { rows: [{
      id: 1, document_id: 1, url: '/articles/claude-code', title: 'Claude Code leak', is_private: false,
      heading: 'What leaked', content: `[Document: Claude Code leak] > [Section: What leaked]\n\n${firstSentence} ${secondSentence}\n\nThis final fragment was cut in the middle`,
      similarity: 0.9, fts_rank: 0.1, embedding_model: 'test',
    }] }; },
  }));
  const result = await askRag('What leaked in Claude Code?', { useCache: false });
  assert.ok(!result.answer.includes('[Document:'));
  assert.ok(!result.answer.includes('[Section:'));
  assert.ok(!result.answer.includes('...'));
  assert.ok(result.answer.includes(secondSentence));
  assert.ok(!result.answer.includes('This final fragment'));
  assert.match(result.answer, /verified AI answer/i);
});

test('answer generation uses Claude Haiku through OpenRouter with a dedicated system message', async () => {
  setup();
  const requests: any[] = [];
  mock.method(openrouter.chat, 'send', async (request: any) => {
    requests.push(request.chatRequest);
    return { choices: [{ finishReason: 'stop', message: { role: 'assistant', content: 'Jainil builds Writenex CMS. [SOURCE: 1]' } }] };
  });
  const result = await askRag('What is Writenex?', { useCache: false });
  assert.equal(result.model, 'anthropic/claude-haiku-5.5');
  assert.equal(requests.length, 1);
  assert.equal(requests[0].model, 'anthropic/claude-haiku-5.5');
  assert.equal(requests[0].messages[0].role, 'system');
  assert.match(requests[0].messages[0].content, /GROUNDING PROTOCOL/);
  assert.match(result.answer, /Writenex/);
});

test('provider token-limit truncation cannot be presented as a completed answer', async () => {
  setup();
  mock.method(openrouter.chat, 'send', async () => ({ choices: [{
    finishReason: 'length', message: { role: 'assistant', content: 'This answer was cut halfway through' },
  }] }));
  const result = await askRag('What is Writenex?', { useCache: false });
  assert.equal(result.model, 'extractive-fallback');
  assert.ok(!result.answer.includes('cut halfway'));
  assert.match(result.answer, /verified AI answer/);
  assert.match(result.answer, /Writenex/);
});

test.after(async () => { await closeDb(); });
