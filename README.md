# ⚡ Jainil Prajapati — Personal Engineering Platform & Field Notes

> **Live Website:** [jaainil.com](https://jaainil.com)
> **Author:** Jainil Prajapati (Full-Stack & DevOps Engineer, Creator of [Writenex CMS](https://github.com/imjp9/writenex-astro), Contributor to [Dokploy/templates](https://github.com/Dokploy/templates))
> **Contact:** [jainilprajapati9@gmail.com](mailto:jainilprajapati9@gmail.com) • [LinkedIn](https://www.linkedin.com/in/jaainil/) • [GitHub](https://github.com/jaainil) • [npm](https://www.npmjs.com/~imjp)

<div align="center">
  <a href="https://astro.build"><img src="https://astro.badg.es/v2/built-with-astro/large.svg" alt="Built with Astro" width="288" height="48"></a>
</div>

---

## 🌟 Overview

**Field Notes** is a high-performance personal engineering portfolio and technical publishing platform built with **Astro 7**, **React 19**, and **Tailwind CSS 4**. It showcases Jainil's verified work history, open-source contributions, DevOps infrastructure, and 25+ long-form deep-dive technical articles.

At its core is **Jainil's RAG** — a production-grade, multi-tiered Retrieval-Augmented Generation AI system running on PostgreSQL (`pgvector`), Dragonfly in-memory cache, Claude Haiku 5.5 via OpenRouter, and VoyageAI reranking.

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
* **Grounded AI Assistant (Jainil's RAG):** Interactive modal (`⌘K` / `Ctrl+K`) that answers questions exclusively from Jainil's verified resume, profile, and 25+ articles with source citations and output validation.
* **Writenex CMS Integration:** Integrated with `@imjp/writenex-astro` (v1.11.1) — Jainil's open-source Astro CMS integration for MDX content management with colocated images and autosave.
* **25+ Technical Deep Dives:** Long-form engineering articles covering AI infrastructure, Linux kernel internals, telecommunications architecture (JioHotstar feature flagging), GPS systems (NavIC), geopolitics of compute, and web performance.
* **Interactive Margin Notes (Giscus):** GitHub Discussions-backed commenting engine on every technical article with bespoke Primer themes (`public/giscus/theme-*.css`) matching the Lego/Blueprint design tokens, featuring real-time light/dark theme synchronization via `MutationObserver`.
* **AI Engine Optimization (AEO) & WebMCP:** Built-in `llms.txt` generation via `astro-llms-md`, structured JSON-LD schemas (`Person`, `BlogPosting`), and browser-native W3C Web Machine Learning Model Context Protocol (WebMCP) tool integration.
* **Privacy & Cookie Governance:** Built-in privacy management and consent banner powered by `@openpolicy/sdk`.
* **Zero-Tracker Analytics:** Self-hosted privacy-focused analytics using Umami via a directly embedded tracking script.

---

## 🧠 Jainil's RAG — Architecture & Highlights

Jainil's RAG is a multi-tier retrieval-augmented generation engine designed for strict factual accuracy. For full architectural details, schemas, and operational runbooks, see **[RAG.md](RAG.md)**.

```mermaid
flowchart TD
    Q[Question and bounded conversation history] --> R[Injection and identity rails]
    R --> C[Versioned answer cache and coalescing]
    C --> S[Original-query hybrid retrieval]
    S --> D{Decisive standalone match?}
    D -->|Yes| G[Grounded generation]
    D -->|No, or follow-up| E[History-aware query expansion]
    E --> H[Merge hybrid results and assess confidence]
    H -->|Out of domain| N[Refusal]
    H -->|Uncertain, excess candidates| V[Bounded neural reranking]
    H -->|Decisive| G
    V --> G
    G --> O[Output safety and citation validation]
    O -->|No direct evidence| N
    O -->|Valid generated answer| A[Return answer and optionally cache]
    O -->|Invalid or unavailable| F[Uncached, redacted public excerpts]
```

Follow-ups resolve references before retrieval. If embeddings fail, retrieval uses PostgreSQL full-text search. Reranking failures retain the original retrieval order. Private background passages can inform answers under the existing publication policy, but never appear in source metadata or extractive fallbacks.


### Answering and security fixes, 2026-10-15

Generated public answers require valid source tags. Missing or phantom tags trigger an uncached extractive fallback. Grounding rules use a dedicated system message, and biography facts come from retrieved passages. Answer cache v3 includes conversation history, retrieval settings, and the generation model.

The chat endpoint limits the actual body to 32 KiB, rejects browser requests with a different origin, and sends successful responses with `Cache-Control: no-store`. Output checks validate markdown links and complete URLs, including query strings and fragments. Source titles, headings, and snippets pass through redaction. Extractive fallbacks strip embedded markdown links, omit indexing labels, and return at most two excerpts made of complete sentences. They clearly state that a verified AI answer was unavailable.

Query embeddings use up to two attempts, each bounded to four seconds, with a 250 ms retry delay. Permanent client errors do not retry. Embedding failures fall back to keyword retrieval without caching degraded search results. Rewrite and generation calls have abort signals, and timeout timers clear when calls settle.

### RAG Highlights:
1. **Multi-Layer Guardrails (`src/lib/rag/guardrails.ts`):** Zero-token Stage 0 input deflection for prompt injections and identity meta-questions with encoding-bypass normalization (homoglyphs, leetspeak, zero-width joiners) and layered `llm-prompt-guard`. Stage 7.5 output safety filters scanning for prompt-echo exfiltration, redacting PII/secrets, and catching degenerate/gibberish output.
2. **Adaptive retrieval:** Decisive standalone questions use the original query directly. Uncertain queries add two rewrites, and follow-ups resolve references against history before retrieval. Results merge by chunk ID and maximum RRF score.
3. **Adaptive reranking:** Uncertain result sets with more than the requested number of candidates use VoyageAI, with a 4.5-second deadline covering response headers and body. Decisive matches skip reranking.
4. **Lost-in-the-Middle Mitigation:** Context candidates are reordered `[1, 3, 5, 6, 4, 2]` so top-scoring chunks reside at the beginning and end where LLM attention is strongest.
5. **5-Step Grounding Protocol:** Enforced in system instructions with a chain-of-thought verification procedure ensuring every claim traces to an explicit source excerpt.
6. **Two-Tier Distributed Caching:** Dragonfly in-memory store on VPS hosting Tier 1 Answer Cache (2h TTL) and Tier 2 Vector Embedding Cache (7d TTL).
7. **Safe Singleflight Mutex:** Tokenized distributed locks (`SET NX EX 15`) with atomic Lua release scripts prevent cache stampedes during concurrent traffic bursts.
8. **Refusals:** Low-confidence retrieval returns an early refusal. When retrieved passages do not answer the question, generation can return `[NO_ANSWER]`, which becomes a deterministic refusal with no source list.
9. **Adaptive Context Pruning:** After reranking, chunks scoring below 45% of the leader are dropped (top 2 always kept) — context stays as small as possible while large enough to answer, so tail noise never dilutes grounding.
10. **Circuit Breakers & Static Fallback:** Half-open probing isolates upstream API issues; if the text provider experiences an outage or output guards trip, the system immediately returns verified static excerpt summaries.
11. **Document Lifecycle & Privacy Firewall (`src/lib/rag/db.ts`, `ingest.ts`):** Deleted or draft sources are auto-pruned from pgvector on the next ingest via `last_seen_at` tombstones; every ingest run also physically purges all stale answer/search caches; docs marked private (any `pvt/` folder or `private: true` frontmatter) ground answers as `[BACKGROUND]` context but are structurally uncitable — no `[SOURCE: N]` id exists; `hybridSearch` now enforces `AND d.is_private = false` at the SQL level by default, with `includePrivate: true` available exclusively to the chat pipeline so private grounding context still works; enforced and verified by `npm run rag:privacy`.
12. **Automated Quality Gates:** `rag:eval` runs the ground-truth suite (`tests/rag/eval.json`) against regression thresholds (Recall@3, citation validity, refusal accuracy), plus an adversarial suite (`tests/rag/eval-adversarial.json`: out-of-domain, near-domain, and history-anchored follow-up/noise-injection cases). Follow-up cases carry `history`, exercising the conversation-aware pipeline end-to-end. `rag:privacy` audits private-document isolation end-to-end.
13. **Persona Tuning (Default + Personal-Life):** Default answers use a casual, conversational "Jainil thinking out loud" voice — lowercase-leaning, tradeoff-aware, emoji-sparingly, with zero corporate AI filler — while still citing every fact. Questions about Jainil's relationship (keyword-gated against private context) additionally shift into a warm, emotionally expressive persona grounded strictly in `[BACKGROUND]` excerpts, with a fixed code-appended sign-off redirecting back to his work. Persona detection matches the current question and requires retrieved private context.
14. **Conversational Follow-up Memory:** The client sends the last 10 messages with every request; the API sanitizes them (per-turn cap, role validation, citation links `[[N]](url)` collapsed to `[N]`, personal-life closer stripped via global regex), query rewriting resolves pronouns against them, and they are injected into the generation prompt. The answer cache key and singleflight lock hash include the history, so follow-ups never collide with first-ask cached answers. No server-side conversation storage — the chat stays stateless and anonymous.
15. **Security Hardening (2026-08-30):** `expandQueries` OpenRouter chat call now has a dedicated system message treating history as data-not-instructions (with `<conversation_history>` boundary tags), preventing history-injection from hijacking retrieval queries. `clients.ts` validates API keys at startup and throws immediately on missing keys. DB-level `ALTER TABLE` migrations split into individual calls — `node-postgres` silently drops all-but-first in bundled strings. Batch embedding responses now validated per-vector before DB commit; symlink guard added to recursive file walker; `closeCache()` race condition on shutdown patched.

---

## 🎨 Design System & Frontend Architecture

The visual identity is defined in **[DESIGN.md](DESIGN.md)** and implements a distinctive **Instruction Booklet / Toy Blueprint** aesthetic:

* **Color Palette:**
  * Page Sky: `#aee1ff` | Paper: `#ffffff` | Keyline: `#111111`
  * Action Blue: `#147bd1` | Piece Red: `#e53935` | Marker Yellow: `#ffcd00`
  * Dark Mode: Slate-Navy (`#0f1b2d`) background with crisp high-contrast keylines.
* **Typography:** Variable fonts via Fontsource (`@fontsource-variable/rubik`, `@fontsource-variable/jetbrains-mono`, `@fontsource-variable/inter`, `@fontsource-variable/space-grotesk`).
* **Micro-interactions:** Hard shadows (`0 3px 0 var(--keyline)`), tactile button presses (`hover:-translate-y-1`, `active:translate-y-0`), stud-grid backgrounds, and pill badge indicators.
* **Accessibility:** WCAG AA compliant contrast ratios across both light and dark themes, keyboard navigable, screen reader friendly.
* **Themed Discussions (Giscus):** Custom Primer stylesheets (`public/giscus/theme-light.css` & `public/giscus/theme-dark.css`) style embedded GitHub Discussions margin notes with Rubik typography, `#111111` keyline geometry, action blue buttons, and real-time light/dark theme switching.

---

## 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| **Framework & SSG** | [Astro 7](https://astro.build), [React 19](https://react.dev), [Vite](https://vitejs.dev), `@astrojs/node` standalone adapter |
| **Styling & Design** | [Tailwind CSS 4](https://tailwindcss.com), [@tailwindcss/vite](https://www.npmjs.com/package/@tailwindcss/vite), Lucide Icons |
| **CMS Engine** | [@imjp/writenex-astro](https://www.npmjs.com/package/@imjp/writenex-astro) (v1.11.1) |
| **Comments & Community** | [Giscus](https://giscus.app) (GitHub Discussions comments with custom Primer CSS themes) |
| **Vector Database** | [PostgreSQL 16](https://www.postgresql.org) + [pgvector](https://github.com/pgvector/pgvector) (1536-dim HNSW Cosine Index) |
| **In-Memory Cache & Mutex**| [Dragonfly](https://www.dragonflydb.io) (Multi-threaded Redis-compatible engine on VPS) |
| **Dense Embeddings** | OpenAI `text-embedding-3-small` (1536 dimensions via [OpenRouter SDK](https://openrouter.ai)) |
| **Primary Generation LLM** | Claude Haiku 5.5 via OpenRouter ([@openrouter/sdk](https://www.npmjs.com/package/@openrouter/sdk)) |
| **Neural Reranker** | VoyageAI Rerank 2.5 Lite (`voyageai/rerank-2.5-lite` via OpenRouter) |
| **SEO, AEO & Standards** | `astro-llms-md`, `@astrojs/sitemap`, `astro-seo-schema`, W3C WebMCP API |
| **Privacy & Policy** | [@openpolicy/sdk](https://www.npmjs.com/package/@openpolicy/sdk), `@openpolicy/astro` |
| **Analytics** | [Umami](https://umami.is) via a directly embedded tracking script |

---

## 📁 Project Structure

```text
├── public/                     # Static assets, favicon, resume PDF & MD
│   └── giscus/                 # Custom Primer stylesheets for Giscus comments
│       ├── theme-dark.css      # Dark mode booklet theme
│       └── theme-light.css     # Light mode booklet theme
├── src/
│   ├── components/             # Reusable Astro & React components
│   │   ├── AnimatedToc.astro   # Dynamic TOC for technical articles
│   │   ├── Footer.astro        # Site footer with status & links
│   │   ├── GiscusComments.astro# GitHub Discussions margin notes component
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
│   │       ├── generation.ts              # Bounded OpenRouter text generation
│       ├── confidence.ts   # Multi-signal confidence estimator & routing gates
│   │       ├── db.ts           # PostgreSQL pool, schema init & CRUD queries
│   │       ├── embeddings.ts   # OpenRouter dense vector embedding generator
│   │       ├── guardrails.ts   # Input injection/identity rails, normalization & output PII/exfil gate
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
├── scripts/
│   └── rag/                    # Operational & diagnostic scripts
│       ├── chat-cli.ts         # Interactive terminal REPL
│       ├── eval.ts             # 24-case benchmark runner
│       ├── guardrails.test.ts  # Deterministic guardrails security test suite
│       ├── index-content.ts    # Incremental ETL indexer
│       ├── init-db.ts          # Schema & vector index creator
│       ├── search-cli.ts       # Similarity & FTS inspection CLI
│       └── stats.ts            # VPS infrastructure health check
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
npm run dev               # Start Astro development server (automatic type stripping disabled)
npm run check             # Run Astro and TypeScript diagnostics
npm run build             # Build production static site + SSR functions
npm run preview           # Preview local production build
npm run start             # Serve production build on port 3000

# ── Jainil's RAG Operational Suite ──────────────────────────────────────────
npm run rag:init          # Initialize PostgreSQL schema, pgvector & HNSW/GIN indexes
npm run rag:index         # Run incremental ingestion, prune deleted docs & roll KB version
npm run rag:privacy       # Audit private-document isolation (SQL flags + live citation probes)
npm run rag:eval          # Run automated 24-case evaluation benchmark
npm run rag:chat          # Launch interactive terminal AI Chat REPL
npm run rag:search "query"# Inspect raw vector similarity, FTS rank & RRF scores
npm run rag:stats         # Check live PostgreSQL & Dragonfly VPS infrastructure health
npx tsx scripts/rag/guardrails.test.ts # Run deterministic guardrails security test suite
```

The pinned TypeScript 7.0.2 currently blocks `npm run check`. Astro's checker needs the programmatic API available in TypeScript 6.x. `bunx tsc --noEmit` checks TypeScript files but does not replace Astro template diagnostics. The production build and deterministic guardrail tests pass with the current installation.

---

## ⚙️ Environment Configuration

Create a `.env` file in the project root by copying the provided template:

```bash
cp .env.example .env
```

```env
# ── LLM & AI Providers ───────────────────────────────────────────────────────

RAG_MODEL=anthropic/claude-haiku-5.5
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
RAG_MIN_CITATION_VALIDITY=100
RAG_MIN_CITATION_BACKED_ANSWERS=85

# ── Analytics ────────────────────────────────────────────────────────────────
UMAMI_WEBSITE_ID=8169229f-6d5b-4ffc-ac38-9036661b5d94
```

---

## 📊 Automated Evaluation & Benchmarks

Jainil's RAG includes a continuous regression evaluation suite (`scripts/rag/eval.ts`) testing 24 ground-truth queries across 6 categories, plus an adversarial suite (`tests/rag/eval-adversarial.json`) covering out-of-domain, near-domain, and conversation-follow-up cases (with injected-noise history). Run it via `npm run rag:eval -- tests/rag/eval-adversarial.json`. The harness passes each case's optional `history` through to the pipeline, so follow-up resolution is tested end-to-end:

Run the current suites instead of treating a historical report as a production guarantee:

```bash
npm run test:rag
npm run test:guardrails
npm run rag:eval
npm run rag:eval -- tests/rag/eval-adversarial.json
```

The live evaluator disables answer/search caches, while query-embedding caching remains enabled. It measures retrieval recall, citation URL validity, keyword-backed generated answers, refusals, fallback counts, and latency. These checks do not prove that every factual claim follows from its citation. Extractive fallbacks are excluded from generated-answer coverage. Cache-hit latency is not measured by this command.

Verification on 2026-10-15 with `anthropic/claude-haiku-5.5`, using the indexed corpus and configured OpenRouter account:

| Metric | Standard suite |
|---|---|
| Cases | 24 |
| Recall@1 / Recall@3 | 100%, 19/19 positive cases |
| Citation URL validity | 100%, 149/149 links |
| Citation-backed generated answers | 100%, 19/19 |
| Refusal accuracy | 100%, 5/5 |
| Extractive fallbacks | 0 |
| Overall median / P95 | 4356 ms / 7543 ms |

The seven-case adversarial suite also passed: Recall@3 3/3, citation-backed generated answers 3/3, citation URL validity 9/9, and refusals 4/4. Neither suite used extractive fallbacks. The 26 offline regression tests and live privacy audit passed. A separate repeated Claude Code query returned the cached answer in 115 ms; this single probe is not a cache-latency benchmark.

These are results for this corpus and run, not a guarantee of factual accuracy on arbitrary questions. The VoidZero fixture was corrected to ask about JavaScript tooling: its article contains no Vite-specific claim.


If the text provider returns HTTP 429 during a suite, pace the calls with `RAG_EVAL_DELAY_MS=6000 npm run rag:eval`. Provider quota failures produce uncached, clearly labeled excerpts and still fail the generated-answer coverage gate. They are not evidence of faster successful generation.

---

## 🌐 SEO, AEO, WebMCP & Privacy Compliance

* **Answer Engine Optimization (AEO):** Powered by `astro-llms-md`, the site serves `/llms.txt` and `/llms-full.txt` optimized for AI web search agents and crawlers with custom `Content-Signal: ai-train=yes, search=yes, ai-input=yes` directives in `robots.txt`.
* **Structured Data (JSON-LD):** Implements Google Rich Snippets with `Person`, `BlogPosting`, and `BreadcrumbList` schemas via `astro-seo-schema`.
* **W3C WebMCP Protocol:** The browser exposes machine-readable site tools (`getSiteInfo`, `searchArticles`) via the experimental `navigator.modelContext.provideContext()` API.
* **Privacy Compliance:** Governed by `openpolicy.ts` with transparent data collection notices and automated legal routes (`/legal/privacy`, `/legal/terms`, `/legal/cookies`).

---

## 📄 License & Credits

* **Codebase & Architecture:** MIT License © 2026 [Jainil Prajapati](https://jaainil.com).
* **Articles & Written Content:** All technical articles, analysis, and field notes are original works written by Jainil Prajapati under standard publication copyright.

---
*Crafted with precision for **[jaainil.com](https://jaainil.com)** and **Field Notes**.*
