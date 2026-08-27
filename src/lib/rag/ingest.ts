import fs from 'node:fs';
import path from 'node:path';
import { extractFrontmatterAndClean, htmlToText } from './cleaner.js';
import { chunkDocument } from './chunk.js';
import { embedBatch, EMBEDDING_MODEL, EMBEDDING_DIMENSION } from './embeddings.js';
import { initSchema, upsertDocument, replaceDocumentChunks, getDocumentByUrl, getDatabaseStats, getDbNow, touchDocumentSeen, pruneStaleDocuments } from './db.js';
import { setKbVersion, hashString } from './cache.js';
import type { ChunkRecord } from './types.js';

const CONTENT_DIR = path.resolve(process.cwd(), 'src/content/articles');
const RESUME_MD_PATH = path.resolve(process.cwd(), 'public/resume/Jainil.md');
const ABOUT_PAGE_PATH = path.resolve(process.cwd(), 'src/pages/about.astro');
const KNOWLEDGE_DIRS = [
  path.resolve(process.cwd(), 'src/content/knowledge'),
  path.resolve(process.cwd(), 'knowledge'),
];

/**
 * Recursively retrieves all .md and .mdx files within a directory.
 */
function getAllMarkdownFiles(dir: string, fileList: string[] = []): string[] {
  if (!fs.existsSync(dir)) return fileList;
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      getAllMarkdownFiles(fullPath, fileList);
    } else if (entry.name.endsWith('.md') || entry.name.endsWith('.mdx')) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

/**
 * Indexes Jainil's Profile, Resume, and About page with incremental hash checking.
 */
export async function ingestProfilePages(): Promise<number> {
  let indexedChunksCount = 0;

  // 1. Ingest Resume Markdown
  if (fs.existsSync(RESUME_MD_PATH)) {
    const rawResume = fs.readFileSync(RESUME_MD_PATH, 'utf-8');
    const sourceHash = hashString(rawResume);
    const existing = await getDocumentByUrl('/resume/Jainil.pdf');

    if (existing && existing.sourceHash === sourceHash) {
      console.log('⚡ [Resume] Unchanged (matching source hash) — skipping re-embed.');
      await touchDocumentSeen('/resume/Jainil.pdf');
    } else {
      const docId = await upsertDocument({
        url: '/resume/Jainil.pdf',
        title: 'Jainil Prajapati — Resume, Skills, Experience & Projects',
        type: 'resume',
        category: 'Resume',
        description: 'Official verified resume covering Full-Stack, DevOps, Dokploy PRs, and Writenex CMS.',
        tags: ['resume', 'jainil', 'experience', 'skills', 'projects', 'devops', 'dokploy'],
        sourceHash,
        publishedAt: new Date().toISOString(),
      });

      const rawChunks = chunkDocument(rawResume, 'Jainil Prajapati — Resume, Skills, Experience & Projects');
      if (rawChunks.length > 0) {
        const textsToEmbed = rawChunks.map((c) => c.content);
        const embeddings = await embedBatch(textsToEmbed, 'RETRIEVAL_DOCUMENT');
        const chunkRecords: ChunkRecord[] = rawChunks.map((chunk, idx) => ({
          documentId: docId,
          heading: chunk.heading || null,
          chunkIndex: idx,
          content: chunk.content,
          embedding: embeddings[idx],
          embeddingModel: EMBEDDING_MODEL,
          metadata: { charCount: chunk.content.length, type: 'resume' },
        }));

        await replaceDocumentChunks(docId, chunkRecords);
        indexedChunksCount += chunkRecords.length;
        console.log(`✅ [Resume] Indexed ${chunkRecords.length} chunks.`);
      }
    }
  }

  // 2. Ingest About Page — prefer the BUILT page (dist) so indexed text is what visitors actually read,
  // never .astro template source (JSX expressions and style attributes pollute retrieval).
  const ABOUT_BUILT_PATHS = [
    path.resolve(process.cwd(), 'dist/about/index.html'),
    path.resolve(process.cwd(), 'dist/client/about/index.html'),
  ];
  const aboutBuiltPath = ABOUT_BUILT_PATHS.find((p) => fs.existsSync(p));
  let cleanAboutText = '';
  if (aboutBuiltPath) {
    const html = fs.readFileSync(aboutBuiltPath, 'utf-8');
    // Drop the nav/footer chrome; keep the main sheet content
    const mainMatch = html.match(/<main[\s\S]*?<\/main>/i);
    cleanAboutText = htmlToText(mainMatch ? mainMatch[0] : html);
  } else if (fs.existsSync(ABOUT_PAGE_PATH)) {
    console.log('⚠️ [About Page] dist/about/index.html not found — run `npm run build` first for clean indexing. Falling back to source (lower quality).');
    const rawAbout = fs.readFileSync(ABOUT_PAGE_PATH, 'utf-8');
    cleanAboutText = rawAbout
      .replace(/---[\s\S]*?---/, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\{[^{}]*\}/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  if (cleanAboutText) {

    const sourceHash = hashString(cleanAboutText);
    const existing = await getDocumentByUrl('/about');

    if (existing && existing.sourceHash === sourceHash) {
      console.log('⚡ [About Page] Unchanged (matching source hash) — skipping re-embed.');
      await touchDocumentSeen('/about');
    } else {
      const docId = await upsertDocument({
        url: '/about',
        title: 'About Jainil Prajapati — Background, Philosophy & Experience',
        type: 'page',
        category: 'Profile',
        description: 'Personal about page detailing work experience, background, DevOps philosophy, and full-stack engineering.',
        tags: ['about', 'profile', 'experience', 'philosophy'],
        sourceHash,
        publishedAt: new Date().toISOString(),
      });

      const rawChunks = chunkDocument(cleanAboutText, 'About Jainil Prajapati — Background, Philosophy & Experience');
      if (rawChunks.length > 0) {
        const textsToEmbed = rawChunks.map((c) => c.content);
        const embeddings = await embedBatch(textsToEmbed, 'RETRIEVAL_DOCUMENT');
        const chunkRecords: ChunkRecord[] = rawChunks.map((chunk, idx) => ({
          documentId: docId,
          heading: chunk.heading || null,
          chunkIndex: idx,
          content: chunk.content,
          embedding: embeddings[idx],
          embeddingModel: EMBEDDING_MODEL,
          metadata: { charCount: chunk.content.length, type: 'page' },
        }));

        await replaceDocumentChunks(docId, chunkRecords);
        indexedChunksCount += chunkRecords.length;
        console.log(`✅ [About Page] Indexed ${chunkRecords.length} chunks.`);
      }
    }
  }

  return indexedChunksCount;
}

/**
 * Ingests all standalone Markdown/MDX documents from knowledge folders automatically.
 */
export async function ingestKnowledgeDocs(): Promise<{ totalDocuments: number; totalChunks: number; skippedDocuments: number }> {
  let totalDocuments = 0;
  let totalChunks = 0;
  let skippedDocuments = 0;

  for (const knowledgeDir of KNOWLEDGE_DIRS) {
    if (!fs.existsSync(knowledgeDir)) continue;
    const files = getAllMarkdownFiles(knowledgeDir);

    for (const filePath of files) {
      const rawContent = fs.readFileSync(filePath, 'utf-8');
      const { frontmatter, cleanContent } = extractFrontmatterAndClean(rawContent);

      if (frontmatter.draft === true) continue;

      const relPath = path.relative(knowledgeDir, filePath).replace(/\\/g, '/').replace(/\.(md|mdx)$/, '');
      const url = frontmatter.url || `/knowledge/${relPath}`;

      const title = frontmatter.title || 
        cleanContent.match(/^#\s+(.+)$/m)?.[1] || 
        path.basename(filePath, path.extname(filePath)).replace(/[-_]/g, ' ');

      let fmTags = frontmatter.tags as string[] | string | undefined;
      if (typeof fmTags === 'string') fmTags = fmTags.split(',').map((t) => t.trim()).filter(Boolean);
      if (!Array.isArray(fmTags) || fmTags.length === 0) fmTags = ['knowledge'];

      const sourceHash = hashString(rawContent);
      const existingDoc = await getDocumentByUrl(url);

      if (existingDoc && existingDoc.sourceHash === sourceHash) {
        skippedDocuments++;
        await touchDocumentSeen(url);
        continue;
      }

      totalDocuments++;
      const docId = await upsertDocument({
        url,
        title,
        type: frontmatter.type || 'page',
        category: frontmatter.category || 'Knowledge',
        description: frontmatter.description || title,
        tags: fmTags,
        sourceHash,
        publishedAt: frontmatter.publishedAt ? new Date(frontmatter.publishedAt) : new Date(),
      });

      const rawChunks = chunkDocument(cleanContent, title);
      if (rawChunks.length === 0) continue;

      const textsToEmbed = rawChunks.map((c) => c.content);
      const embeddings = await embedBatch(textsToEmbed, 'RETRIEVAL_DOCUMENT');

      const chunkRecords: ChunkRecord[] = rawChunks.map((chunk, idx) => ({
        documentId: docId,
        heading: chunk.heading || null,
        chunkIndex: idx,
        content: chunk.content,
        embedding: embeddings[idx],
        embeddingModel: EMBEDDING_MODEL,
        metadata: {
          charCount: chunk.content.length,
          category: frontmatter.category || 'Knowledge',
          type: frontmatter.type || 'page',
          url,
        },
      }));

      await replaceDocumentChunks(docId, chunkRecords);
      totalChunks += chunkRecords.length;
      console.log(`✅ [Knowledge] Indexed "${title.slice(0, 38)}" (${chunkRecords.length} chunks)`);
    }
  }

  return { totalDocuments, totalChunks, skippedDocuments };
}

/**
 * Ingests all Markdown/MDX technical articles into pgvector and PostgreSQL FTS.
 */
export async function ingestAllArticles(): Promise<{ totalDocuments: number; totalChunks: number; skippedDocuments: number }> {
  console.log('🚀 Starting Incremental RAG Knowledge Base Ingestion...');
  await initSchema();
  // Cutoff for stale-document pruning: everything seen on disk this run gets last_seen_at >= now,
  // anything older than this is a deleted/removed source and gets pruned at the end.
  const runStart = await getDbNow();

  let totalDocuments = 0;
  let totalChunks = 0;
  let skippedDocuments = 0;

  // 1. Ingest Profile & Resume
  const profileChunks = await ingestProfilePages();
  totalChunks += profileChunks;

  // 2. Ingest Knowledge Parent Folder Documents
  const knowledgeRes = await ingestKnowledgeDocs();
  totalDocuments += knowledgeRes.totalDocuments;
  totalChunks += knowledgeRes.totalChunks;
  skippedDocuments += knowledgeRes.skippedDocuments;

  // Scan directory for technical articles
  if (!fs.existsSync(CONTENT_DIR)) {
    console.warn(`⚠️ Articles directory not found: ${CONTENT_DIR} — skipping article ingestion.`);
  }
  const entries = fs.existsSync(CONTENT_DIR) ? fs.readdirSync(CONTENT_DIR, { withFileTypes: true }) : [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const slug = entry.name;
    const articleMdxPath = path.join(CONTENT_DIR, slug, 'index.mdx');
    const articleMdPath = path.join(CONTENT_DIR, slug, 'index.md');

    const filePath = fs.existsSync(articleMdxPath) ? articleMdxPath : fs.existsSync(articleMdPath) ? articleMdPath : null;
    if (!filePath) continue;

    const rawFileContent = fs.readFileSync(filePath, 'utf-8');
    const { frontmatter, cleanContent } = extractFrontmatterAndClean(rawFileContent);

    if (frontmatter.draft === true) {
      continue;
    }

    const url = `/articles/${slug}`;
    const sourceHash = hashString(rawFileContent);
    const existingDoc = await getDocumentByUrl(url);

    if (existingDoc && existingDoc.sourceHash === sourceHash) {
      skippedDocuments++;
      await touchDocumentSeen(url);
      continue;
    }

    totalDocuments++;
    const articleTitle = frontmatter.title || path.basename(slug).replace(/[-_]/g, ' ');
    const docId = await upsertDocument({
      url,
      title: articleTitle,
      type: 'article',
      category: frontmatter.category,
      description: frontmatter.description,
      tags: frontmatter.tags || [],
      sourceHash,
      publishedAt: frontmatter.publishedAt ? new Date(frontmatter.publishedAt) : null,
    });

    const rawChunks = chunkDocument(cleanContent, articleTitle);
    if (rawChunks.length === 0) continue;

    const textsToEmbed = rawChunks.map((c) => c.content);
    const embeddings = await embedBatch(textsToEmbed, 'RETRIEVAL_DOCUMENT');

    const chunkRecords: ChunkRecord[] = rawChunks.map((chunk, idx) => ({
      documentId: docId,
      heading: chunk.heading || null,
      chunkIndex: idx,
      content: chunk.content,
      embedding: embeddings[idx],
      embeddingModel: EMBEDDING_MODEL,
      metadata: {
        charCount: chunk.content.length,
        category: frontmatter.category,
        url,
      },
    }));

    await replaceDocumentChunks(docId, chunkRecords);
    totalChunks += chunkRecords.length;
    console.log(`✅ [Article] Indexed "${articleTitle.slice(0, 38)}" (${chunkRecords.length} chunks)`);
  }

  // Prune documents whose source no longer exists on disk (deleted files, drafts, etc.)
  const prunedUrls = await pruneStaleDocuments(runStart);
  if (prunedUrls.length > 0) {
    console.log(`🧹 Pruned ${prunedUrls.length} stale document(s) (source deleted or draft): ${prunedUrls.join(', ')}`);
  }

  // Roll KB Version in Cache
  const newVersion = `v_${Date.now()}`;
  setKbVersion(newVersion);

  console.log(`\n🎉 Ingestion Complete!`);
  console.log(`- Total Processed Documents: ${totalDocuments}`);
  console.log(`- Unchanged (Skipped):        ${skippedDocuments}`);
  console.log(`- New/Updated Chunks:        ${totalChunks}`);
  console.log(`- Rolled Knowledge Version:  ${newVersion}\n`);

  const stats = await getDatabaseStats();
  console.log(`📊 Current Knowledge Base Stats: ${stats.documentCount} documents, ${stats.chunkCount} chunks in pgvector.`);

  return { totalDocuments, totalChunks, skippedDocuments };
}
