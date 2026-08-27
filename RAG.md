# 🧠 Jainil's RAG — Architecture, Robustness & Evaluation Guide

Technical documentation for **Jainil's RAG**, a multi-tiered Retrieval-Augmented Generation system for **[jaainil.com](https://jaainil.com)** and **Shravonix**.

> **Last updated 2026-08-27.** Architecture simplified: single LLM (Gemini), single reranker (VoyageAI). All fallback chains removed. 11 bugs found and fixed across two audit passes. Eval numbers from a live `npm run rag:eval` run against the production VPS database.

---

## 🏛️ 1. Complete System Architecture Specification

```text
                                     USER QUESTION
                                           │
                                           ▼
                             ┌───────────────────────────┐
                             │  Query Normalization &    │ (trim, lowercase, strip punctuation,
                             │     Intent Classifier     │  classify: profile/skills/projects/article)
                             └─────────────┬─────────────┘
                                           │
                                           ▼
                             ┌───────────────────────────┐
                             │   Tier 1: Answer Cache    │─── HIT ───► Instant Return (~10–80ms)
                             │   (Dragonfly on VPS)      │
                             │  rag:answer:v2:<kb>:<hash>│
                             └─────────────┬─────────────┘
                                           │ MISS
                                           ▼
                             ┌───────────────────────────┐
                             │ SINGLEFLIGHT / COALESCING │ (Distributed Lock: rag:lock:<hash>
                             │ Lock acquired?            │  Tokenized Mutex | TTL: 15s | Max Poll: 3s)
                             │   YES: Run Pipeline       │
                             │   NO:  Wait/Poll Cache    │
                             └─────────────┬─────────────┘
                                           │
                                           ▼
                             ┌───────────────────────────┐
                             │   Tier 2: Vector Cache    │─── HIT ───► Skip Embed API (~10ms)
                             │   (Dragonfly on VPS)      │
                             │    rag:emb:<model>:<hash> │
                             └─────────────┬─────────────┘
                                           │ MISS
                                           ▼
                                   Embedding Provider
                                 (text-embedding-3-small)
                                           │ (1536-dim vector)
                                           ▼
                                 PostgreSQL + pgvector
                                (Parallel Vector + FTS)
                                ┌──────────┴──────────┐
                                │                     │
                        pgvector HNSW        PostgreSQL FTS
                        (Cosine Distance)     (GIN tsvector)
                                │                     │
                                └──────────┬──────────┘
                                           │
                                          RRF
                                (Reciprocal Rank Fusion)
                                           │
                                           ▼
                             ┌───────────────────────────┐
                             │  Multi-Feature Confidence │
                             │         Estimator         │
                             └─────┬───────────┬─────────┘
                                   │           │
                          Out of Domain        Relevant Match
                                   │           │
                                   ▼           ▼
                            🛡️ EARLY REFUSAL  ┌───────────────────────────┐
                            (0 LLM Tokens)     │   Decision: Margin & FTS  │
                                               └─────┬───────────┬─────────┘
                                                     │               │
                                           Decisive Match      Ambiguous Match
                                                     │               │
                                                     ▼               ▼
                                                ⚡ FAST-PATH     🧠 DEEP-PATH
                                                (Skip Rerank)  (voyageai/rerank-2.5-lite
                                                     │          via OpenRouter Rerank API)
                                                     │               │ (4.5s Timeout / Circuit Breaker)
                                                     │               ▼ (On failure: original RRF order)
                                                     └───────┬───────┘
                                                             │
                                                             ▼
                                                 ┌───────────────────────┐
                                                 │ Structured Source IDs │ (Top 3–4 chunks)
                                                 │   [SOURCE: 1..K]      │
                                                 └───────────┬───────────┘
                                                             │
                                                             ▼
                                                 ┌───────────────────────────┐
                                                 │   gemini-3.5-flash-lite   │ (Google GenAI SDK)
                                                 │   Circuit Breaker         │ (3 failures → OPEN 30s)
                                                 └───────────┬───────────────┘
                                                             │
                                                 ┌───────────┴───────────┐
                                                 │                       │
                                              Success               Failure / Open
                                                 │                       │
                                                 │              Static chunk summary
                                                 │              (no LLM, raw text)
                                                 └───────────┬───────────┘
                                                             │
                                                             ▼
                                                 ┌───────────────────────┐
                                                 │  Citation Integrity & │
                                                 │ Response Quality Gate │
                                                 └───────────┬───────────┘
                                                             │
                                                             ▼
                                                 ┌───────────────────────┐
                                                 │   Save Tier 1 Cache   │ (2 Hours TTL)
                                                 │  (Validated Answers)  │
                                                 └───────────────────────┘
```

---

## 🛡️ 2. Production Robustness & Resiliency Specification

### A. Safe Tokenized Singleflight Mutex (`src/lib/rag/cache.ts`)
* Uses atomic ownership token check (`SET rag:lock:<hash> <token> EX 15 NX`).
* Atomic release via Lua script:
  ```lua
  if redis.call("get", KEYS[1]) == ARGV[1] then
    return redis.call("del", KEYS[1])
  else
    return 0
  end
  ```
* Concurrent requests poll the Answer Cache every 150ms up to 3.0s. If the answer appears, it returns immediately; if still missing after 3.0s, it attempts to re-acquire the lock before executing.
* Redis singleton resets on `'end'` event so a fresh connection is attempted after a drop.

### B. Circuit Breakers with Half-Open State Probing (`src/lib/rag/circuit.ts`)
* **State Transition Logic**:
  - `CLOSED`: Normal operation.
  - `OPEN`: Triggered after 3 consecutive failures (Cooldown: 45s for reranker, 30s for LLM).
  - `HALF_OPEN`: Allows **exactly 1 probe request** through. Probe success → `CLOSED`. Probe failure → `OPEN`.

### C. Citation Integrity & Response Quality Gate (`src/lib/rag/chat.ts`)
* **Integrity Checks**:
  1. Replaces every `[SOURCE: N]` tag with a verified markdown link `[[N]](url)`.
  2. Strips phantom citations (IDs with no matching candidate document) silently — they do not block caching.
  3. Rejects caching only for empty or error-sentinel responses (`length ≤ 20` or contains `'fallback-error'`).

### D. Static Chunk Fallback (`src/lib/rag/chat.ts`)
* When Gemini is unavailable (circuit open, 5xx, timeout), the pipeline surfaces a static bullet-point summary of the top-ranked raw chunks — no LLM tokens consumed, no hallucination risk.
* This replaces the previous three-model fallback chain (Gemini primary → Gemini lite → OpenRouter Nvidia).

---

## 💻 3. CLI Commands Reference

All commands are configured in `package.json`:

```bash
# 1. Automated Evaluation Benchmark (Regression Suite)
npm run rag:eval

# 2. Interactive Terminal Chat (Continuous REPL with live streaming)
npm run rag:chat

# 3. Single Question Q&A
npm run rag:chat "What open source projects has Jainil contributed to?"

# 4. Raw Hybrid Search Inspection
npm run rag:search "Dokploy templates"

# 5. Check Live VPS Database & Cache Health
npm run rag:stats

# 6. Incremental Knowledge Base Ingestion
npm run rag:index
```

---

## 🧪 4. Evaluation Benchmark Report (`npm run rag:eval`)

```text
──────────────────────────────────────────────────────
📊 JAINIL'S RAG EVALUATION REPORT
──────────────────────────────────────────────────────
Total Test Questions:   24

🔍 RETRIEVAL
Recall@1:               94.7% (18/19)
Recall@3:               100% (19/19)

🧠 CITATIONS & RESPONSE QUALITY
Citation Validity:            100% (128/128 valid links)
Citation-Backed Answer Rate:  100% (19/19)
Invalid Cached Responses:     0

🛡️ REFUSAL
Refusal Accuracy:       100% (5/5) [Zero hallucinations, rejected in < 85ms]

⚡ ROUTING BREAKDOWN
⚡ Fast-Path:            16
🧠 Deep-Path:            3
🛡️ Early Refusals:       5
────────────────────────────────────
Total Handled:          24/24

⏱️ PERFORMANCE
Answer Cache Hit:       ~10–80ms
Fast-Path P50:          1388ms
Deep-Path P50:          2382ms
Overall P50:            1271ms
Overall Average:        1153ms
Overall P95:            2382ms

📂 CATEGORY PERFORMANCE
- profile     : 100% (3/3)
- projects    : 100% (3/3)
- experience  : 100% (1/1)
- skills      : 100% (2/2)
- article     : 100% (10/10)
- negative    : 100% (5/5)
──────────────────────────────────────────────────────
🎉 EVALUATION PASSED: All regression quality gates met!
```

---

## ✂️ 5. Simplification — 2026-08-27

The fallback model chains in both `chat.ts` and `rerank.ts` were removed. The system now runs a single model at each stage.

### Motivation

The previous architecture had three LLM layers for generation and three for reranking:

| Stage | Before | After |
|-------|--------|-------|
| LLM generation | `gemini-flash` → `gemini-flash-lite` → OpenRouter Nvidia 120B | `gemini-3.5-flash-lite` only |
| Reranker | `voyageai/rerank-2.5-lite` → `cohere/rerank-4-fast` → Nvidia LLM-judge | `voyageai/rerank-2.5-lite` only |

Problems with the fallback chains:
- **Hard to manage** — each fallback model had its own API shape, timeout budget, and failure mode.
- **Silent confusion** — failures in intermediate fallbacks were swallowed, making it impossible to tell which model actually answered.
- **Compounded latency** — a failing primary + a failing fallback meant the user waited for two full timeouts before reaching the third stage.
- **BUG-01** proved the Nvidia LLM-judge stage was never actually working (wrong field name since launch).
- **BUG-03** proved the Gemini fallback was always redundant (defaulted to the same model as primary).

### What was removed

**`src/lib/rag/rerank.ts`**
- Removed `FALLBACK_RERANK_MODEL` (`cohere/rerank-4-fast`) constant and its call
- Removed `LLM_JUDGE_MODEL` (`nvidia/nemotron-3-super-120b-a12b:free`) constant
- Removed `rerankLlmJudge()` function entirely
- Removed dead `googleGenAI` and `openrouter` imports
- Simplified `rerankResults()` to a single `fetch` call to the OpenRouter rerank endpoint

**`src/lib/rag/chat.ts`**
- Removed `GEMINI_FALLBACK_MODEL` constant and second Gemini call
- Removed `OPENROUTER_FALLBACK_MODEL` constant and all OpenRouter chat calls
- Removed `openrouter` import
- Simplified generation to a single `googleGenAI.models.generateContent()` call
- Renamed `PRIMARY_GEMINI_MODEL` → `GEMINI_MODEL` (no "primary" distinction needed)

### What replaced the fallbacks

| Failure scenario | Old behaviour | New behaviour |
|------------------|---------------|---------------|
| Reranker failure | Try cohere → Try Nvidia LLM-judge → RRF | RRF order immediately |
| LLM failure / circuit open | Try Gemini lite → Try Nvidia 120B → Static chunks | Static chunk summary immediately |

The static chunk fallback for LLM failure is functionally equivalent to what users got at the end of the old chain — raw passage text — but without 3× the timeout overhead.

---

## 🐛 6. Bug Fix Log — 2026-08-27

Full audit of all 15 source files in `src/lib/rag/`, `src/pages/api/rag/`, and `src/components/rag/`. Two passes performed. **11 bugs found and fixed.**

---

### Pass 1 — Initial Audit

#### BUG-01 · `rerank.ts` · 🔴 Critical
**LLM-judge reranker results silently dropped.**

`rerankLlmJudge()` was instructed to output `[{id, score}]` objects but `applyRanking()` read `item.index`. Every result from the Nvidia LLM-judge stage failed the `typeof item.index === 'number'` guard, producing an empty reranked list. The third fallback stage was effectively broken since its launch.

**Resolution:** Fixed in the simplification — the LLM-judge stage was removed entirely.

---

#### BUG-02 · `db.ts` · 🔴 Critical
**Vector dimension migration never triggered.**

pgvector stores `vector(N)` columns with `atttypmod = N + 1` (i.e. `vector(1536)` → `atttypmod = 1537`). The check was `currentDim !== 1536`, which is always false for a correctly created table.

```ts
// Before
if (colCheck.rows.length > 0 && currentDim !== 1536)

// After — pgvector stores vector(N) with atttypmod = N + 1
if (colCheck.rows.length > 0 && currentDim !== 1537)
```

**File:** `src/lib/rag/db.ts`

---

#### BUG-03 · `chat.ts` · 🟠 High
**Gemini fallback was the same model as primary.**

Both `PRIMARY_GEMINI_MODEL` and `GEMINI_FALLBACK_MODEL` defaulted to `'gemini-flash-latest'`. The "fallback" made the identical request and failed for the exact same reason.

**Resolution:** Removed in the simplification — one model: `gemini-3.5-flash-lite`.

---

#### BUG-04 · `chat.ts` · 🟠 High
**Circuit breaker not updated on Gemini fallback success/failure.**

`primaryLlmCircuit.recordSuccess/Failure()` was never called in the fallback branch, so circuit state was inaccurate after any primary failure.

**Resolution:** Removed in the simplification — one generation call, one `recordSuccess/recordFailure`.

---

#### BUG-05 · `ingest.ts` · 🟠 High
**Missing frontmatter title crashes article ingestion.**

`frontmatter.title` was passed directly to `upsertDocument()` without a null guard. A missing `title:` field caused a `NOT NULL` DB constraint error that aborted the entire ingestion run.

```ts
// Before
const docId = await upsertDocument({ title: frontmatter.title, ... });

// After
const articleTitle = frontmatter.title || path.basename(slug).replace(/[-_]/g, ' ');
const docId = await upsertDocument({ title: articleTitle, ... });
```

**File:** `src/lib/rag/ingest.ts`

---

#### BUG-06 · `cache.ts` · 🟡 Medium
**Stale Redis singleton after connection drop.**

Once the ioredis connection permanently closed, `redisClient` stayed non-null, returning a dead client on every subsequent call.

```ts
redisClient.on('end', () => {
  redisClient = null;
});
```

**File:** `src/lib/rag/cache.ts`

---

#### BUG-07 · `rerank.ts` · 🟡 Medium
**`rerankerLatencies` array grows unbounded.**

The telemetry array was never trimmed in long-running server processes. Fixed by capping at 500 entries after each push.

---

### Pass 2 — Deep Re-audit

#### BUG-08 · `chat.ts` · 🟠 High
**Quality gate blocked caching for valid responses containing any phantom citation.**

`hasInvalid = true` whenever the LLM emitted any `[SOURCE: N]` without a matching candidate — even though those tags were already stripped from the formatted output. Valid responses were never cached if the LLM tried even one phantom citation number.

```ts
// Before
const passesQuality = !hasInvalid && formatted.trim().length > 20 && ...;

// After — stripped output is the ground truth
const passesQuality = formatted.trim().length > 20 && !formatted.includes('fallback-error');
```

**File:** `src/lib/rag/chat.ts`

---

#### BUG-09 · `ingest.ts` · 🟠 High
**`fs.readdirSync` on `CONTENT_DIR` without existence guard.**

Every other directory access in the file had an `existsSync` guard. A missing `src/content/articles/` threw `ENOENT` and crashed the entire ingestion run.

```ts
if (!fs.existsSync(CONTENT_DIR)) {
  console.warn(`⚠️ Articles directory not found: ${CONTENT_DIR} — skipping article ingestion.`);
  return { totalDocuments, totalChunks, skippedDocuments };
}
```

**File:** `src/lib/rag/ingest.ts`

---

#### BUG-10 · `JainilsRAGChat.tsx` · 🟡 Medium
**Relative source URLs opened in a new tab.**

All source chip links were hard-coded with `target="_blank"`. Portfolio-internal sources (`/about`, `/resume/Jainil.pdf`) opened a new browser tab instead of navigating within the site.

```tsx
// Before
target="_blank" rel="noopener noreferrer"

// After
target={s.url.startsWith('http') ? '_blank' : undefined}
rel={s.url.startsWith('http') ? 'noopener noreferrer' : undefined}
```

**File:** `src/components/rag/JainilsRAGChat.tsx`

---

#### BUG-11 · `rerank.ts` · 🟢 Low
**Dead import: `googleGenAI` imported but never used.**

`googleGenAI` was imported from `./clients.js` but not referenced anywhere in the reranker.

**Resolution:** Removed in the simplification — `rerank.ts` no longer imports from `clients.js` at all.

---

### Summary Table

| ID | Severity | File | Root Cause |
|----|----------|------|------------|
| BUG-01 | 🔴 Critical | `rerank.ts` | LLM-judge `{id}` not mapped to `{index}` — third rerank stage silently broken |
| BUG-02 | 🔴 Critical | `db.ts` | `atttypmod` off-by-one — vector dimension migration never fired |
| BUG-03 | 🟠 High | `chat.ts` | Gemini fallback defaulted to same model as primary |
| BUG-04 | 🟠 High | `chat.ts` | Circuit breaker not updated on fallback path |
| BUG-05 | 🟠 High | `ingest.ts` | `frontmatter.title` used without null guard — DB NOT NULL crash |
| BUG-06 | 🟡 Medium | `cache.ts` | Redis singleton not cleared on `'end'` — stale dead client returned |
| BUG-07 | 🟡 Medium | `rerank.ts` | Telemetry array grows unbounded in long-running process |
| BUG-08 | 🟠 High | `chat.ts` | Quality gate blocked caching of valid responses with stripped phantom citations |
| BUG-09 | 🟠 High | `ingest.ts` | `readdirSync` without `existsSync` guard — crashes ingestion on missing dir |
| BUG-10 | 🟡 Medium | `JainilsRAGChat.tsx` | Relative source URLs hard-coded to `target="_blank"` |
| BUG-11 | 🟢 Low | `rerank.ts` | Dead `googleGenAI` import |
