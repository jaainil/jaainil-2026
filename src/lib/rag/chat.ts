import { hybridSearch } from './search.js';
import { rerankResults } from './rerank.js';
import {
  getCached,
  setCached,
  getAnswerCacheKey,
  getKbVersion,
  hashString,
  acquireStampedeLock,
  releaseStampedeLock,
  waitForCachedAnswer,
} from './cache.js';
import { classifyQueryIntent } from './intent.js';
import { estimateRetrievalConfidence } from './confidence.js';
import { primaryLlmCircuit } from './circuit.js';
import { googleGenAI, openrouter } from './clients.js';
import type { RAGResponse, RAGSource, SearchOptions, RAGTrace } from './types.js';

const PRIMARY_GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-flash-latest';
const GEMINI_FALLBACK_MODEL = process.env.GEMINI_FALLBACK_MODEL || 'gemini-flash-latest';
const OPENROUTER_FALLBACK_MODEL = process.env.OPENROUTER_FALLBACK_MODEL || 'nvidia/nemotron-3-super-120b-a12b:free';

/**
 * Citation Integrity & Response Quality Gate.
 */
function validateCitationIntegrityAndQuality(
  text: string,
  sources: RAGSource[]
): { formatted: string; isValid: boolean; citationCount: number } {
  let hasInvalid = false;
  let citationCount = 0;

  const formatted = text.replace(/\[SOURCE:([^\]]*)\]/gi, (match, inner: string) => {
    // Tolerates every LLM spelling: [SOURCE: 1], [SOURCE: 1, 2], [SOURCE: 1, SOURCE: 4]
    const ids = (inner.match(/\d+/g) || []).map(Number);
    const seen = new Set<number>();
    const links = ids.map((id) => {
      const source = sources[id - 1];
      if (source) {
        citationCount++;
        if (seen.has(id)) return '';
        seen.add(id);
        return `[[${id}]](${source.url})`;
      }
      hasInvalid = true;
      return '';
    }).filter(Boolean);
    return links.length ? ` ${links.join(' ')}` : '';
  });

  const passesQuality = !hasInvalid && formatted.trim().length > 20 && !formatted.includes('fallback-error');

  return {
    formatted: formatted.trim(),
    isValid: passesQuality,
    citationCount,
  };
}

/**
 * Production RAG pipeline with Singleflight request coalescing, circuit breakers, and Citation Integrity gating.
 */
export async function askRag(
  question: string,
  options: SearchOptions & {
    enableRerank?: boolean;
    useCache?: boolean;
    onToken?: (token: string) => void;
  } = {}
): Promise<RAGResponse> {
  const startTime = Date.now();
  const cleanQuestion = question.trim();
  const intent = options.intent || classifyQueryIntent(cleanQuestion);
  const kbVersion = getKbVersion();
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const queryHash = hashString(cleanQuestion);

  if (!cleanQuestion) {
    return {
      question,
      answer: "Please provide a question to search Jainil's RAG knowledge base.",
      confidence: 0,
      sources: [],
      cached: false,
      model: PRIMARY_GEMINI_MODEL,
      intent: 'general',
      executionTimeMs: 0,
    };
  }

  // 1. Tier 1: Versioned Dragonfly Answer Cache
  const answerCacheKey = options.useCache !== false ? getAnswerCacheKey(cleanQuestion, kbVersion) : null;
  if (answerCacheKey) {
    const cached = await getCached<RAGResponse>(answerCacheKey);
    if (cached) {
      if (options.onToken) options.onToken(cached.answer);
      return {
        ...cached,
        cached: true,
        executionTimeMs: Date.now() - startTime,
      };
    }
  }

  // 2. Singleflight Request Coalescing with Safe Ownership Token
  let isLockHolder = false;
  if (answerCacheKey && options.useCache !== false) {
    isLockHolder = await acquireStampedeLock(queryHash, requestId, 15);
    if (!isLockHolder) {
      const coalescedAnswer = await waitForCachedAnswer<RAGResponse>(answerCacheKey, 3000, 150);
      if (coalescedAnswer) {
        if (options.onToken) options.onToken(coalescedAnswer.answer);
        return {
          ...coalescedAnswer,
          cached: true,
          executionTimeMs: Date.now() - startTime,
        };
      }
      // Re-try acquiring lock after wait before running pipeline
      isLockHolder = await acquireStampedeLock(queryHash, requestId, 15);
    }
  }

  try {
    // 3. Parallel Hybrid Search (pgvector HNSW + PostgreSQL FTS)
    const searchStart = Date.now();
    const candidateLimit = options.limit ?? 4;
    let matches = await hybridSearch(cleanQuestion, {
      ...options,
      intent,
      limit: candidateLimit * 2,
      threshold: 0.18,
    });
    const searchMs = Date.now() - searchStart;

    // 4. Multi-Feature Confidence Assessment & Conservative Early Refusal Gate
    const confidence = estimateRetrievalConfidence(matches, intent);

    if (!confidence.isConfident) {
      const refusal = "I couldn't find sufficient relevant information regarding your question in Jainil's RAG knowledge base.";
      if (options.onToken) options.onToken(refusal);

      const refusalTrace: RAGTrace = {
        requestId,
        query: cleanQuestion,
        intent,
        cacheHit: false,
        path: 'EARLY_REFUSAL',
        confidence,
        latencies: {
          searchMs,
          totalMs: Date.now() - startTime,
        },
        model: 'early-refusal-gate',
        kbVersion,
      };

      const refusalResponse: RAGResponse = {
        question: cleanQuestion,
        answer: refusal,
        confidence: Number(confidence.score.toFixed(3)),
        sources: [],
        cached: false,
        model: 'early-refusal-gate',
        intent,
        executionTimeMs: Date.now() - startTime,
        trace: refusalTrace,
      };

      if (answerCacheKey) await setCached(answerCacheKey, refusalResponse, 3600);
      return refusalResponse;
    }

    // 5. Adaptive Path Selection (Fast-Path vs Deep-Path Rerank)
    let rerankMs = 0;
    let selectedPath: 'FAST_PATH' | 'DEEP_PATH' = 'FAST_PATH';

    const shouldRerank = options.enableRerank === true || (!confidence.isDecisive && options.enableRerank !== false && matches.length > candidateLimit);

    if (shouldRerank) {
      selectedPath = 'DEEP_PATH';
      const rerankStart = Date.now();
      matches = await rerankResults(cleanQuestion, matches, candidateLimit);
      rerankMs = Date.now() - rerankStart;
    } else {
      matches = matches.slice(0, candidateLimit);
    }

    // 6. Structured Context Builder with Explicit Source IDs
    const sources: RAGSource[] = matches.map((m) => ({
      title: m.title,
      url: m.url,
      heading: m.heading,
      snippet: m.content.length > 200 ? m.content.slice(0, 200) + '...' : m.content,
      score: Number(m.rrfScore.toFixed(4)),
    }));

    const contextBlocks = matches.map((m, idx) => {
      const sourceId = idx + 1;
      return `[SOURCE: ${sourceId}]\nURL: ${m.url}\nTITLE: ${m.title}\nSECTION: ${m.heading || 'Overview'}\nCONTENT:\n${m.content}`;
    }).join('\n\n---\n\n');

    const systemInstruction = `You are Jainil's RAG AI Assistant, representing Jainil Prajapati's portfolio, resume, and technical publications (jaainil.com / Shravonix).

Core Facts:
- Jainil Prajapati is a Full-Stack & DevOps Engineer at Aexaware Infotech (Vadodara)
- Creator of Writenex CMS (@imjp/writenex-astro), contributor to Dokploy/templates (10+ merged PRs)
- Contact: jainilprajapati9@gmail.com. Resume lives at /resume/Jainil.pdf and the about page at /about — mention these paths as plain text when relevant, never as links.

Citation & Grounding Rules:
1. Every factual statement must cite its supporting source using [SOURCE: N] (e.g., [SOURCE: 1]).
2. Never write URLs or markdown links yourself — cite sources only via [SOURCE: N] tags; the system converts them into links.
3. Rely strictly on the provided context excerpts. Do not invent facts or infer unmentioned details.
4. Be concise, direct, and technically accurate.`;

    const inputPrompt = `${systemInstruction}\n\nContext Passages:\n${contextBlocks}\n\nUser Question: ${cleanQuestion}\n\nAnswer:`;

    let rawAnswer = '';
    let usedModel = `google/${PRIMARY_GEMINI_MODEL}`;
    const genStart = Date.now();

    // 7. Answer Generation with Half-Open Circuit Breakers & Fallback LLM
    const tryPrimary = !primaryLlmCircuit.isOpen();

    if (tryPrimary) {
      try {
        const res = await googleGenAI.models.generateContent({
          model: PRIMARY_GEMINI_MODEL,
          contents: inputPrompt,
          config: { temperature: 0.1 },
        });

        if (res.text) {
          rawAnswer = res.text.trim();
          primaryLlmCircuit.recordSuccess();
        }
      } catch {
        primaryLlmCircuit.recordFailure();
      }
    }

    // Fallback LLM when primary is failed or circuit is open
    if (!rawAnswer) {
      try {
        const fallbackRes = await googleGenAI.models.generateContent({
          model: GEMINI_FALLBACK_MODEL,
          contents: inputPrompt,
          config: { temperature: 0.1 },
        });
        if (fallbackRes.text) {
          rawAnswer = fallbackRes.text.trim();
          usedModel = `google/${GEMINI_FALLBACK_MODEL}`;
        }
      } catch {
        try {
          const chat: any = await openrouter.chat.send({
            chatRequest: {
              model: OPENROUTER_FALLBACK_MODEL,
              messages: [{ role: 'user', content: inputPrompt }],
              temperature: 0.1,
            },
          });
          if (chat.choices?.[0]?.message?.content) {
            rawAnswer = chat.choices[0].message.content.trim();
            usedModel = OPENROUTER_FALLBACK_MODEL;
          }
        } catch {}
      }
    }

    const generationMs = Date.now() - genStart;

    if (!rawAnswer) {
      rawAnswer = `Based on Jainil's RAG knowledge base:\n\n` +
        matches.map((m, i) => `- **[${m.title}](${m.url})** (${m.heading || 'Overview'}) [SOURCE: ${i + 1}]:\n  ${m.content.slice(0, 250)}...`).join('\n\n');
    }

    // 8. Citation Integrity & Response Quality Gate
    const qualityGate = validateCitationIntegrityAndQuality(rawAnswer, sources);

    if (options.onToken) {
      options.onToken(qualityGate.formatted);
    }

    const totalMs = Date.now() - startTime;

    const trace: RAGTrace = {
      requestId,
      query: cleanQuestion,
      intent,
      cacheHit: false,
      path: selectedPath,
      confidence,
      latencies: {
        searchMs,
        rerankMs: rerankMs > 0 ? rerankMs : undefined,
        generationMs,
        totalMs,
      },
      model: usedModel,
      kbVersion,
    };

    const response: RAGResponse = {
      question: cleanQuestion,
      answer: qualityGate.formatted,
      confidence: Number(confidence.score.toFixed(3)),
      sources,
      cached: false,
      model: usedModel,
      intent,
      executionTimeMs: totalMs,
      trace,
    };

    // 9. Cache Write (Only cache when passing Citation Integrity & Quality)
    if (answerCacheKey && qualityGate.isValid) {
      await setCached(answerCacheKey, response, 7200);
    }

    return response;
  } finally {
    if (isLockHolder) {
      await releaseStampedeLock(queryHash, requestId);
    }
  }
}
