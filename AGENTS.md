# AGENTS.md — Repository Guidance for AI Agents

Welcome! This document provides operational context, architectural ground truth, design guidelines, and safety boundaries for AI coding agents operating on **jaainil-2026** (the personal engineering platform, portfolio, and Shravonix publication of Jainil Prajapati).

---

## 1. Project Overview & Architecture

- **Project:** Personal engineering portfolio + technical publishing platform (**Shravonix**) with an embedded production-grade RAG assistant (**Jainil's RAG**).
- **Author & Maintainer:** Jainil Prajapati (Full-Stack & DevOps Engineer, creator of `@imjp/writenex-astro`, contributor to Dokploy).
- **Core Technologies:**
  - **Framework:** Astro 7.3.x (`output: 'server'` with `@astrojs/node` standalone adapter)
  - **UI Libraries:** React 19 (`@astrojs/react`), Tailwind CSS v4 (`@tailwindcss/vite`), Lucide React icons
  - **Content & CMS:** MDX (`@astrojs/mdx`), `@imjp/writenex-astro` (v1.11.x) for content management
  - **Typography:** Variable fonts via `@fontsource-variable` (`Rubik`, `Inter`, `JetBrains Mono`, `Space Grotesk`)
  - **Search & RAG Engine:** PostgreSQL 16+ with `pgvector` HNSW index, Dragonfly/Redis in-memory cache, Google Gemini (`@google/genai`), VoyageAI reranking, guardrails via `llm-prompt-guard`
  - **SEO & AI Discovery:** `astro-seo`, `astro-robots-txt`, `astro-sitemap`, `astro-llms-md` (`/llms.txt`), Schema.org JSON-LD, WebMCP
  - **Privacy & Compliance:** `@openpolicy/sdk`, privacy-first self-hosted analytics (Umami)

---

## 2. Environment & Commands Runbook

### Package Managers
The repository contains both `bun.lock` and `package.json`. You may use **`bun`** (v1.4+) or **`npm`** (v10+ with Node v22+).

### Development & Build Commands
```bash
# Start local development server (with strip-types flag for Node compatibility)
bun run dev
# or: npm run dev

# Type check across Astro, TS, and MDX
bun run check
# or: npm run check

# Build production bundle (Astro SSR standalone output in dist/)
bun run build
# or: npm run build

# Preview production build locally
bun run preview
# or: npm run preview

# Clean build artifacts
bun run clean
```

### RAG System CLI Commands
All RAG CLI tools read environment variables from `.env`:
```bash
# Initialize pgvector database schema & HNSW indexes
bun run rag:init

# Re-index all markdown content, MDX articles, and resume data
bun run rag:index

# Interactive CLI semantic & hybrid search
bun run rag:search

# Interactive CLI chat with the RAG pipeline
bun run rag:chat

# Display database indexing statistics & token counts
bun run rag:stats

# Run automated RAG evaluation test suite (eval.json & eval-adversarial.json)
bun run rag:eval

# Check privacy rails and PII redaction rules
bun run rag:privacy
```

### Design Detector (Impeccable)
To scan changed UI files against design tokens and craft rules:
```bash
.agent/skills/impeccable/scripts/impeccable detect --json <changed targets>
```

---

## 3. Design Context

<!-- impeccable:agents-design-context 1 -->

### Target Audience & Users
- **Primary Users:** Hiring managers, engineering directors, and technical leads evaluating Jainil Prajapati for full-stack, backend, and DevOps roles.
  - **Evaluation Pattern:** They spend 1–3 minutes skimming from a resume link, LinkedIn, or GitHub profile.
  - **Core Question:** "Is this engineer authentic, what have they built and shipped, and can they own infrastructure end-to-end?"
- **Secondary Users:** Developers reading technical deep dives on Shravonix and freelance/consulting clients.

### Creative North Star: "The Instruction Booklet"
The visual identity is modeled after a physical brick instruction booklet: sky-blue blueprint paper, crisp 2px black keylines, bold numbered build steps, and tangible colored pieces. Depth is printed rather than lit: hard offset shadows with **zero blur**, giving elements the tactile feel of stickers pressed onto paper.

### Palette & Color Roles
| Token | Light Value | Dark Value | Single Semantic Role |
|---|---|---|---|
| `action-blue` | `#147bd1` | `#5aa9f0` | Controls, buttons, active tabs, focus rings, interactive states |
| `piece-red` | `#e53935` | `#ff6b62` | Marks newly added pieces, current step numbers, primary email CTA |
| `marker-yellow` | `#ffcd00` | `#ffcd00` | Position markers, "Open to roles" pill, category chips, toast alerts |
| `page-sky` | `#aee1ff` | `#0f1b2d` | Main page ground |
| `paper` | `#ffffff` | `#17273e` | Cards, reading sheets, callout containers, full-bleed bands |
| `ink` / `keyline` | `#10151b` / `#111111` | `#eaf3fe` / `#dbe9f7` | Typography ink and universal 2px border strokes |
| `plate-gray` | `#d9d9d9` | `#b9bdc1` | Baseplate elements, diagram scaffolding, scrollbar thumbs |
| `ghost-blue` | `#7fa8cc` | `#33404e` | Dashed guide borders for empty seats and subtle panel dividers |

### Strict Design Rules
1. **The Piece Rule:** Red marks what is added; yellow marks status/position; blue operates controls. Never mix their purposes.
2. **The Keyline Rule:** Every interactive control and card container carries a `2px solid var(--keyline)` border and hard offset shadow (`box-shadow: 0 2px/3px/4px 0 var(--keyline)` with **0 blur**).
3. **The One Family Rule:** Use `Rubik Variable` (`ui-sans-serif, system-ui, sans-serif`) across display, headings, labels, and body copy. Vary weight (400–900), not family.
4. **Anti-References (STRICT PROHIBITIONS):**
   - ❌ NO pulsing status dots or glowing neon badges
   - ❌ NO `//` pseudo-code section headers
   - ❌ NO monospace text for headings, navigation, or titles
   - ❌ NO ambient blur shadows or soft gradient glow effects
   - ❌ NO fake cyberpunk/terminal/HUD widgets or "STATUS: ACTIVE" cosplay
   - ❌ Never use red or yellow for body copy on light sky-blue ground (fails WCAG AA contrast)

---

## 4. Coding Standards & Conventions

### Astro & Frontend Conventions
- **Server vs. Client Islands:** Keep Astro components static by default. Only add `client:load` or `client:idle` to interactive React components that require browser state (e.g. `JainilsRAGChat.tsx`, `ReadingProgressBar.tsx`, `BackToTop.tsx`).
- **Tailwind CSS v4:** Use CSS variable tokens and standard Tailwind classes. Keep component styling aligned with `DESIGN.md`.
- **Icons:** Use `astro-icon` with `@iconify-json/lucide` and `@iconify-json/simple-icons` for Astro templates, and `lucide-react` inside React components.
- **Accessibility:** Ensure all interactive elements have semantic labels, aria attributes, keyboard navigability, and pass WCAG AA contrast in both light and dark themes.

### Content Collections & Articles
- Articles live in `src/content/articles/*.mdx`.
- Frontmatter schemas are strictly defined in `src/content.config.ts`.
- Content images should be colocated or stored under `public/`.
- Preserve canonical URLs, redirects, and sitemap metadata when modifying articles.

### RAG System Conventions
- **Accuracy Above All:** The RAG assistant answers strictly from indexed ground truth. Never allow hallucinated credentials, claims, or citations.
- **Singleflight & Concurrency:** Multi-tenant queries utilize distributed mutexes in Dragonfly/Redis (`rag:lock:<hash>`) with a 15-second TTL to avoid redundant pipeline execution.
- **Defense in Depth:** Any user query passes through Stage 0 input rails (`src/lib/rag/guardrails.ts`), encoding normalization, and intent classification before hitting LLMs or vector databases.

---

## 5. Strict Boundaries: What NOT to Do

1. **Never Fabricate Facts or Metrics:**
   - Jainil's credentials, employment at Aexaware Infotech, SVIT degree (CGPA 7.03), contact details, and open-source contributions are strictly factual.
   - Do NOT invent fake awards, customer logos, testimonials, press quotes, or inflated GitHub statistics.
2. **Never Commit Secrets:**
   - Real API keys (`GEMINI_API_KEY`, `VOYAGE_API_KEY`, `POSTGRES_URL`, `DRAGONFLY_URL`, `REDIS_URL`) stay in `.env` (gitignored).
   - Only place placeholder documentation in `.env.example`.
3. **Preserve Established Routes & Redirects:**
   - Do not alter or break core URLs (`/`, `/about`, `/articles`, `/articles/[slug]`, `/legal/*`, `/rss.xml`).
   - Honor redirects configured in `astro.config.mjs`.
4. **Preserve Dual-Theme Support:**
   - Both light mode (Sky/Paper/Ink) and dark mode (Navy/Paper/Light-Ink) must be maintained and verified for any UI modification.

---

## 6. Git & Change Workflow

- **Branch:** Work on feature branches or `main` as directed.
- **Commit Messages:** Follow Conventional Commits:
  - `feat: ...` for new capabilities or articles
  - `fix: ...` for bug fixes or alignment corrections
  - `docs: ...` for documentation improvements
  - `style: ...` or `refactor: ...` for code quality and design adherence
- **Pre-Completion Checklist:**
  1. Run `bun run check` (or `npm run check`) to verify zero TypeScript/Astro diagnostics errors.
  2. Run `bun run build` to verify production bundling passes cleanly.
  3. Ensure no uncommitted scratch files or debug logs remain.
