# ⚡ Jainil Prajapati — Personal Engineering Platform & Shravonix

> **Live Website:** [jaainil.com](https://jaainil.com) & [shravonix.com](https://shravonix.com)  
> **Author:** Jainil Prajapati (Full-Stack & DevOps Engineer, Creator of [Writenex CMS](https://github.com/imjp9/writenex-astro), Contributor to [Dokploy/templates](https://github.com/Dokploy/templates))  
> **Contact:** [jainilprajapati9@gmail.com](mailto:jainilprajapati9@gmail.com) • [LinkedIn](https://www.linkedin.com/in/jaainil/) • [GitHub](https://github.com/jaainil) • [npm](https://www.npmjs.com/~imjp)

---

## 🌟 Overview

**Shravonix** is a high-performance personal engineering portfolio and technical publishing platform built with **Astro 7**, **React 19**, and **Tailwind CSS 4**. It showcases Jainil's verified work history, open-source contributions, DevOps infrastructure, and 25+ long-form deep-dive technical articles.

At its core is **Jainil's RAG** — a production-grade, multi-tiered Retrieval-Augmented Generation AI system running on PostgreSQL (`pgvector`), Dragonfly in-memory cache, Google Gemini, and VoyageAI reranking.

---

## 📑 Table of Contents

1. [Key Features & Capabilities](#-key-features--capabilities)
2. [Jainil's RAG — Architecture & Highlights](#-jainils-rag--architecture--highlights)
3. [Design System & Frontend Architecture](#-design-system--frontend-architecture)
4. [Tech Stack](#-tech-stack)
5. [Project Structure](#-project-structure)
6. [CLI Tooling & Operational Commands](#-cli-tooling--operational-commands)
7. [Environment Configuration](#-environment-configuration)
8. [Automated Evaluation & Benchmarks](#-automated-evaluation--benchmarks)
9. [SEO, AEO, WebMCP & Privacy Compliance](#-seo-aeo-webmcp--privacy-compliance)
10. [License & Credits](#-license--credits)

---

## ✨ Key Features & Capabilities

* **Lego / Blueprint Aesthetic:** Custom retro-engineering design system featuring blueprint sky-blue pages, black keylines, stud-grid backgrounds, and tactile action buttons with complete dark mode support.
* **Grounded AI Assistant (Jainil's RAG):** Interactive modal (`⌘K` / `Ctrl+K`) that answers questions exclusively from Jainil's verified resume, profile, and 25+ articles with 100% citation accuracy and zero hallucinations.
* **Writenex CMS Integration:** Integrated with `@imjp/writenex-astro` (v1.9.1) — Jainil's open-source Astro CMS integration for MDX content management with colocated images and autosave.
* **25+ Technical Deep Dives:** Long-form engineering articles covering AI infrastructure, Linux kernel internals, telecommunications architecture (JioHotstar feature flagging), GPS systems (NavIC), geopolitics of compute, and web performance.
* **AI Engine Optimization (AEO) & WebMCP:** Built-in `llms.txt` generation via `astro-aeo`, structured JSON-LD schemas (`Person`, `BlogPosting`), and browser-native W3C Web Machine Learning Model Context Protocol (WebMCP) tool integration.
* **Privacy & Cookie Governance:** Built-in privacy management and consent banner powered by `@openpolicy/sdk`.
* **Zero-Tracker Analytics:** Self-hosted privacy-focused analytics using Umami (`@yeskunall/astro-umami`).

---

## 🧠 Jainil's RAG — Architecture & Highlights

Jainil's RAG is a sub-second, multi-tier retrieval-augmented generation engine designed for strict factual accuracy. For full architectural details, schemas, and operational runbooks, see **[RAG.md](file:///home/jainil/Downloads/code/jaainil-2026/RAG.md)**.

```text
                                       USER QUERY
                                           │
                                           ▼
                             ┌───────────────────────────┐
                             │  Query Normalization &    │ ➔ Lowercase, trim, collapse spaces,
                             │     Intent Classifier     │   strip trailing punctuation.
                             │  (src/lib/rag/intent.ts)  │ ➔ Classify: profile, skills, projects,
                             └─────────────┬─────────────┘   experience, resume, article, general.
                                           │
                                           ▼
                             ┌───────────────────────────┐
                             │   Tier 1: Answer Cache    │─── HIT ───► Instant Return (~10–80ms)
                             │   (Dragonfly on VPS)      │             (rag:answer:v2:<kb>:<hash>)
                             └─────────────┬─────────────┘
                                           │ MISS
                                           ▼
                             ┌───────────────────────────┐
                             │ SINGLEFLIGHT / COALESCING │ ➔ Distributed Mutex: rag:lock:<hash>
                             │ Lock acquired?            │   TTL: 15s | Max Poll: 3.0s (150ms interval)
                             │   YES: Run Pipeline       │ ➔ If lock held by peer, wait for answer cache
                             │   NO:  Wait/Poll Cache    │   and return immediately once populated.
                             └─────────────┬─────────────┘
                                           │ Lock Acquired / Executing
                                           ▼
                             ┌───────────────────────────┐
                             │   Tier 2: Vector Cache    │─── HIT ───► Skip Embed API (~10ms)
                             │   (Dragonfly on VPS)      │             (rag:emb:<model>:<hash>)
                             └─────────────┬─────────────┘
                                           │ MISS
                                           ▼
                                   Embedding Provider
                                 (text-embedding-3-small)
                                           │ (1536-dim dense vector)
                                           ▼
                                 PostgreSQL + pgvector
                                (Parallel Dual Execution)
                                ┌──────────┴──────────┐
                                │                     │
                        pgvector HNSW        PostgreSQL FTS
                        (Cosine Distance)     (GIN tsvector)
                        1 - (embedding <=> q) ts_rank_cd(tsv, query)
                                │                     │
                                └──────────┬──────────┘
                                           │
                                          RRF
                                (Reciprocal Rank Fusion)
                                RRF = 0.65/(60+vRank) + 0.35/(60+tRank)
                                           │
                                           ▼
                             ┌───────────────────────────┐
                             │  Multi-Feature Confidence │ ➔ Checks vector similarity, margin,
                             │         Estimator         │   FTS agreement, and intent match.
                             │(src/lib/rag/confidence.ts)│
                             └─────┬───────────┬─────────┘
                                   │           │
                          Out of Domain        Relevant Match
                                   │           │
                                   ▼           ▼
                            🛡️ EARLY REFUSAL  ┌───────────────────────────┐
                            (0 LLM Tokens,     │   Decision: Margin & FTS  │
                             < 85ms return)    └─────┬───────────┬─────────┘
                                                     │               │
                                           Decisive Match      Ambiguous Match
                                                     │               │
                                                     ▼               ▼
                                                ⚡ FAST-PATH     🧠 DEEP-PATH
                                                (Skip Rerank)  (voyageai/rerank-2.5-lite
                                                     │          via OpenRouter API)
                                                     │               │ (4.5s Timeout / Circuit Breaker)
                                                     │               ▼ (On failure: fallback to RRF order)
                                                     └───────┬───────┘
                                                             │
                                                             ▼
                                                 ┌───────────────────────┐
                                                 │ Structured Source IDs │ ➔ Top 3–4 candidate chunks
                                                 │    [SOURCE: 1..K]     │   formatted with title & URL.
                                                 └───────────┬───────────┘
                                                             │
                                                             ▼
                                                 ┌───────────────────────────┐
                                                 │   gemini-3.5-flash-lite   │ ➔ Primary LLM generation
                                                 │   Circuit Breaker         │   (3 failures → OPEN 30s)
                                                 └───────────┬───────────────┘
                                                             │
                                                 ┌───────────┴───────────┐
                                                 │                       │
                                              Success               Failure / Open
                                                 │                       │
                                                 │              Static chunk summary
                                                 │              (no LLM, raw text excerpts)
                                                 └───────────┬───────────┘
                                                             │
                                                             ▼
                                                 ┌───────────────────────┐
                                                 │  Citation Integrity & │ ➔ Convert [SOURCE: N] to [[N]](url)
                                                 │ Response Quality Gate │ ➔ Silently strip phantom citations
                                                 │ (src/lib/rag/chat.ts) │ ➔ Validate non-trivial response
                                                 └───────────┬───────────┘
                                                             │
                                                             ▼
                                                 ┌───────────────────────┐
                                                 │   Save Tier 1 Cache   │ ➔ TTL: 2 Hours (7200s)
                                                 │  (Validated Answers)  │   Release Singleflight Mutex
                                                 └───────────────────────┘
```

### RAG Highlights:
1. **Parallel Hybrid Search:** PostgreSQL 16 + `pgvector` HNSW cosine distance search running concurrently with GIN `tsvector` full-text search merged via Reciprocal Rank Fusion ($k=60, w_v=0.65, w_t=0.35$).
2. **Two-Tier Distributed Caching:** Dragonfly in-memory store on VPS hosting Tier 1 Answer Cache (2h TTL) and Tier 2 Vector Embedding Cache (7d TTL).
3. **Safe Singleflight Mutex:** Tokenized distributed locks (`SET NX EX 15`) with atomic Lua release scripts prevent cache stampedes during concurrent traffic bursts.
4. **Early Refusal Gate:** Evaluates multi-signal confidence to reject out-of-domain queries in <85ms without consuming any LLM tokens.
5. **Adaptive Fast/Deep Path:** High-confidence decisive matches skip the reranker (Fast-Path, ~1.3s), while ambiguous queries route through `voyageai/rerank-2.5-lite` (Deep-Path, ~2.3s).
6. **Circuit Breakers & Static Fallback:** Half-open probing isolates upstream API issues; if Gemini experiences an outage, the system immediately returns verified static excerpt summaries.

---

## 🎨 Design System & Frontend Architecture

The visual identity is defined in **[DESIGN.md](file:///home/jainil/Downloads/code/jaainil-2026/DESIGN.md)** and implements a distinctive **Instruction Booklet / Toy Blueprint** aesthetic:

* **Color Palette:**
  * Page Sky: `#aee1ff` | Paper: `#ffffff` | Keyline: `#111111`
  * Action Blue: `#147bd1` | Piece Red: `#e53935` | Marker Yellow: `#ffcd00`
  * Dark Mode: Slate-Navy (`#0f1b2d`) background with crisp high-contrast keylines.
* **Typography:** Variable fonts via Fontsource (`@fontsource-variable/rubik`, `@fontsource-variable/jetbrains-mono`, `@fontsource-variable/inter`, `@fontsource-variable/space-grotesk`).
* **Micro-interactions:** Hard shadows (`0 3px 0 var(--keyline)`), tactile button presses (`hover:-translate-y-1`, `active:translate-y-0`), stud-grid backgrounds, and pill badge indicators.
* **Accessibility:** WCAG AA compliant contrast ratios across both light and dark themes, keyboard navigable, screen reader friendly.

---

## 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| **Framework & SSG** | [Astro 7](https://astro.build), [React 19](https://react.dev), [Vite](https://vitejs.dev), [@astrojs/vercel](https://www.npmjs.com/package/@astrojs/vercel) |
| **Styling & Design** | [Tailwind CSS 4](https://tailwindcss.com), [@tailwindcss/vite](https://www.npmjs.com/package/@tailwindcss/vite), Lucide Icons |
| **CMS Engine** | [@imjp/writenex-astro](https://www.npmjs.com/package/@imjp/writenex-astro) (v1.9.1) |
| **Vector Database** | [PostgreSQL 16](https://www.postgresql.org) + [pgvector](https://github.com/pgvector/pgvector) (1536-dim HNSW Cosine Index) |
| **In-Memory Cache & Mutex**| [Dragonfly](https://www.dragonflydb.io) (Multi-threaded Redis-compatible engine on VPS) |
| **Dense Embeddings** | OpenAI `text-embedding-3-small` (1536 dimensions via [OpenRouter SDK](https://openrouter.ai)) |
| **Primary Generation LLM** | Google Gemini 3.5 Flash Lite ([@google/genai](https://www.npmjs.com/package/@google/genai)) |
| **Neural Reranker** | VoyageAI Rerank 2.5 Lite (`voyageai/rerank-2.5-lite` via OpenRouter) |
| **SEO, AEO & Standards** | `astro-aeo`, `@astrojs/sitemap`, `astro-seo-schema`, W3C WebMCP API |
| **Privacy & Policy** | [@openpolicy/sdk](https://www.npmjs.com/package/@openpolicy/sdk), `@openpolicy/astro` |
| **Analytics** | [Umami](https://umami.is) via `@yeskunall/astro-umami` |

---

## 📁 Project Structure

```text
├── public/                     # Static assets, favicon, resume PDF & MD
├── scripts/
│   └── rag/                    # Operational & diagnostic CLI scripts
│       ├── chat-cli.ts         # Interactive terminal REPL & single Q&A CLI
│       ├── eval.ts             # Automated evaluation benchmark test runner
│       ├── index-content.ts    # Incremental knowledge base ETL indexer
│       ├── init-db.ts          # PostgreSQL schema & pgvector index initialiser
│       ├── search-cli.ts       # Raw hybrid search scoring diagnostic
│       └── stats.ts            # VPS database & Dragonfly health check
├── src/
│   ├── components/             # Reusable Astro & React components
│   │   ├── AnimatedToc.astro   # Dynamic TOC for technical articles
│   │   ├── Footer.astro        # Site footer with status & links
│   │   ├── Navbar.astro        # Navigation header with dark mode toggle
│   │   ├── rag/
│   │   │   └── JainilsRAGChat.tsx # Lego-themed AI chat modal (⌘K)
│   │   └── react/
│   │       ├── ArticleInteractive.tsx # Interactive article embeds
│   │       ├── BackToTop.tsx          # Back to top floating button
│   │       └── ReadingProgressBar.tsx # Article reading progress bar
│   ├── content/
│   │   ├── articles/           # 25+ MDX technical articles & field notes
│   │   └── knowledge/          # Standalone knowledge base markdown docs
│   ├── layouts/
│   │   └── BaseLayout.astro    # Master layout with SEO, Schema & WebMCP
│   ├── lib/
│   │   └── rag/                # Core RAG Library Modules
│   │       ├── cache.ts        # Dragonfly client, key hashing & singleflight mutex
│   │       ├── chat.ts         # RAG pipeline orchestration & quality gate
│   │       ├── chunk.ts        # Hierarchical heading-aware markdown chunker
│   │       ├── circuit.ts      # Circuit Breaker state machine (Closed/Open/Half-Open)
│   │       ├── cleaner.ts      # MDX cleaner, YAML parser & HTML text extractor
│   │       ├── clients.ts      # Google GenAI & OpenRouter SDK instances
│   │       ├── confidence.ts   # Multi-signal confidence estimator & routing gates
│   │       ├── db.ts           # PostgreSQL pool, schema init & CRUD queries
│   │       ├── embeddings.ts   # OpenRouter dense vector embedding generator
│   │       ├── index.ts        # RAG barrel export
│   │       ├── ingest.ts       # Incremental ETL hasher & content indexer
│   │       ├── intent.ts       # Zero-latency rule-based query intent classifier
│   │       ├── rerank.ts       # VoyageAI Rerank 2.5 Lite integration & telemetry
│   │       ├── search.ts       # Parallel pgvector + FTS hybrid search with RRF
│   │       └── types.ts        # TypeScript data types & schemas
│   ├── pages/
│   │   ├── 404.astro           # Custom 404 error page
│   │   ├── about.astro         # Personal profile, background & philosophy
│   │   ├── api/
│   │   │   └── rag/
│   │   │       └── chat.ts     # Astro SSR API Route (/api/rag/chat)
│   │   ├── articles/
│   │   │   ├── [slug].astro    # Dynamic article template
│   │   │   └── index.astro     # Articles directory & category filter
│   │   ├── index.astro         # Homepage / Portfolio
│   │   ├── legal/              # Legal policies (privacy, terms, cookies)
│   │   └── rss.xml.js          # RSS feed generator
│   └── styles/
│       └── global.css          # Tailwind CSS v4 & theme variables
├── tests/
│   └── rag/
│       └── eval.json           # 24-question ground truth benchmark suite
├── DESIGN.md                   # Visual design tokens & interface philosophy
├── PRODUCT.md                  # Product vision, audience & evidence summary
├── RAG.md                      # Comprehensive RAG Architecture & System Manual
├── .env.example                # Environment variables template
├── writenex.config.ts          # Writenex CMS collection configuration
└── openpolicy.ts               # OpenPolicy privacy governance configuration
```

---

## 💻 CLI Tooling & Operational Commands

All tasks are accessible through npm scripts configured in `package.json`:

```bash
# ── Local Development ────────────────────────────────────────────────────────
npm run dev               # Start Astro development server (with type stripping)
npm run build             # Build production static site + SSR functions
npm run preview           # Preview local production build
npm run start             # Serve production build on port 3000

# ── Jainil's RAG Operational Suite ──────────────────────────────────────────
npm run rag:init          # Initialize PostgreSQL schema, pgvector & HNSW/GIN indexes
npm run rag:index         # Run incremental content ingestion & roll KB version
npm run rag:eval          # Run automated 24-case evaluation benchmark
npm run rag:chat          # Launch interactive terminal AI Chat REPL
npm run rag:search "query"# Inspect raw vector similarity, FTS rank & RRF scores
npm run rag:stats         # Check live PostgreSQL & Dragonfly VPS infrastructure health
```

---

## ⚙️ Environment Configuration

Create a `.env` file in the project root by copying the provided template:

```bash
cp .env.example .env
```

```env
# ── LLM & AI Providers ───────────────────────────────────────────────────────
GEMINI_API_KEY=your_google_gemini_api_key
GEMINI_MODEL=gemini-3.5-flash-lite

OPENROUTER_API_KEY=your_openrouter_api_key
EMBEDDING_PROVIDER=openrouter
EMBEDDING_MODEL=text-embedding-3-small
EMBEDDING_DIMENSION=1536
RERANK_MODEL=voyageai/rerank-2.5-lite

# ── Database & In-Memory Cache (VPS) ─────────────────────────────────────────
DATABASE_URL=postgres://postgres:password@your-vps-ip:4321/postgres
POSTGRES_URL=postgres://postgres:password@your-vps-ip:4321/postgres
DRAGONFLY_URL=redis://:password@your-vps-ip:4322/0
REDIS_URL=redis://:password@your-vps-ip:4322/0

# ── Knowledge Base Versioning ────────────────────────────────────────────────
KB_VERSION=20260825_1

# ── RAG Evaluation Thresholds (Optional) ────────────────────────────────────
RAG_MIN_RECALL_AT_3=85
RAG_MIN_REFUSAL_ACCURACY=95

# ── Analytics ────────────────────────────────────────────────────────────────
UMAMI_WEBSITE_ID=8169229f-6d5b-4ffc-ac38-9036661b5d94
```

---

## 📊 Automated Evaluation & Benchmarks

Jainil's RAG includes a continuous regression evaluation suite (`scripts/rag/eval.ts`) testing 24 ground-truth queries across 6 categories:

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

🔌 CIRCUIT & RERANKER TELEMETRY
Reranker Circuit State:  CLOSED
Primary LLM Circuit:     CLOSED
Reranker Attempts:       3 (Success: 3, Timeouts: 0, Errors: 0)

📂 Category Performance:
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

## 🌐 SEO, AEO, WebMCP & Privacy Compliance

* **Answer Engine Optimization (AEO):** Powered by `astro-aeo`, the site serves `/llms.txt` and `/llms-full.txt` optimized for AI web search agents and crawlers with custom `Content-Signal: ai-train=yes, search=yes, ai-input=yes` directives in `robots.txt`.
* **Structured Data (JSON-LD):** Implements Google Rich Snippets with `Person`, `BlogPosting`, and `BreadcrumbList` schemas via `astro-seo-schema`.
* **W3C WebMCP Protocol:** The browser exposes machine-readable site tools (`getSiteInfo`, `searchArticles`) via the experimental `navigator.modelContext.provideContext()` API.
* **Privacy Compliance:** Governed by `openpolicy.ts` with transparent data collection notices and automated legal routes (`/legal/privacy`, `/legal/terms`, `/legal/cookies`).

---

## 📄 License & Credits

* **Codebase & Architecture:** MIT License © 2026 [Jainil Prajapati](https://jaainil.com).
* **Articles & Written Content:** All technical articles, analysis, and field notes are original works written by Jainil Prajapati under standard publication copyright.

---
*Crafted with precision for **[jaainil.com](https://jaainil.com)** and **Shravonix**.*
