# 🧠 Jainil's RAG — Architecture, Robustness & Evaluation Guide

Technical documentation for **Jainil's RAG**, a multi-tiered Retrieval-Augmented Generation system for **[jaainil.com](https://jaainil.com)** and **Shravonix**.

> **Verified 2026-08-25.** The performance numbers below come from a live `npm run rag:eval` run against the production VPS database after the fix round (intent word-boundary matching, `models.generateContent` LLM calls, citation regex for grouped sources, about-page indexing from built HTML, reranker timeout 4500ms). Earlier documented numbers did not reproduce and were replaced.

Welcome to the comprehensive technical documentation for **Jainil's RAG**, a production-grade, multi-tiered Retrieval-Augmented Generation system designed for **[jaainil.com](https://jaainil.com)** and **Shravonix**.

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
                                               └─────┬───────────────┬─────┘
                                                     │               │
                                           Decisive Match            Ambiguous Match
                                                     │               │
                                                     ▼               ▼
                                                ⚡ FAST-PATH     🧠 DEEP-PATH
                                                (Skip Rerank)  (LLM-Assisted Reranker
                                                     │          Nvidia 120B / Gemini)
                                                     │               │ (2.5s Timeout / Circuit Breaker)
                                                     │               ▼ (Fallback: Original RRF)
                                                     └───────┬───────┘
                                                             │
                                                             ▼
                                                 ┌───────────────────────┐
                                                 │ Structured Source IDs │ (Top 3–4 chunks)
                                                 │   [SOURCE: 1..K]      │
                                                 └───────────┬───────────┘
                                                             │
                                                             ▼
                                                 ┌───────────────────────┐
                                                 │   Gemini Flash Lite   │ (Interactions API)
                                                 └───────────┬───────────┘
                                                             │
                                                 ┌───────────┴───────────┐
                                                 │                       │
                                              Success                 Failure
                                                 │                429/5xx/timeout
                                                 │                       ▼
                                                 │           ┌───────────────────────┐
                                                 │           │  OpenRouter Fallback  │
                                                 │           │   (Nvidia 120B LLM)   │
                                                 │           └───────────┬───────────┘
                                                 │                       │
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

### B. Circuit Breakers with Half-Open State Probing (`src/lib/rag/circuit.ts`)
* **State Transition Logic**:
  - `CLOSED`: Normal operation.
  - `OPEN`: Triggered after 3 consecutive failures (Cooldown: 45s for reranker, 30s for primary LLM).
  - `HALF_OPEN`: Allows **exactly 1 probe request** through. If probe succeeds $\rightarrow$ resets to `CLOSED`. If probe fails $\rightarrow$ trips back to `OPEN`.

### C. Citation Integrity & Response Quality Gate (`src/lib/rag/chat.ts`)
* **Integrity Checks**:
  1. Validates that every cited `[SOURCE: N]` tag maps to an actual candidate document.
  2. Formats citations into verified markdown hyperlinks `[Title (Section)](URL)`.
  3. Strips unmapped/dangling source tags.
  4. Response is validated against empty, partial, or fallback-error strings before Tier 1 caching.

---

## 💻 3. CLI Commands Reference

All commands are configured in [`package.json`](file:///home/jainil/Downloads/jaainil-2026/package.json):

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
Recall@3:               94.7% (18/19)

🧠 CITATIONS & RESPONSE QUALITY
Citation Validity:            100.0%
Citation-Backed Answer Rate:   94.7% (18/19)
Invalid Cached Responses:         0

🛡️ REFUSAL
Refusal Accuracy:       100.0% (5/5) [Zero hallucinations, rejected in < 80ms]

⚡ ROUTING BREAKDOWN
⚡ Fast-Path:            13
🧠 Deep-Path:            6
🛡️ Early Refusals:       5
────────────────────────────────────
Total Handled:          24/24

⏱️ PERFORMANCE
Answer Cache Hit:       ~10–80ms
Fast-Path P50:          289ms
Deep-Path P50:          2954ms
Overall P50:            290ms
Overall Average:        772ms
Overall P95:            3092ms

📂 CATEGORY PERFORMANCE
- profile     : 100% (3/3)
- projects    : 100% (3/3)
- experience  : 100% (1/1)
- skills      : 100% (2/2)
- article     : 90% (9/10)
- negative    : 100% (5/5)
──────────────────────────────────────────────────────
🎉 EVALUATION PASSED: All regression quality gates met!
```
