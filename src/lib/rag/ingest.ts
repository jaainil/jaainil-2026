import fs from 'node:fs';
import path from 'node:path';
import { extractFrontmatterAndClean, htmlToText } from './cleaner.js';
import { chunkDocument } from './chunk.js';
import { embedBatch, EMBEDDING_MODEL, EMBEDDING_DIMENSION } from './embeddings.js';
import { initSchema, upsertDocument, replaceDocumentChunks, getDocumentByUrl, getDatabaseStats } from './db.js';
import { setKbVersion, hashString } from './cache.js';
import type { ChunkRecord } from './types.js';

const CONTENT_DIR = path.resolve(process.cwd(), 'src/content/articles');
const RESUME_MD_PATH = path.resolve(process.cwd(), 'public/resume/Jainil.md');
const ABOUT_PAGE_PATH = path.resolve(process.cwd(), 'src/pages/about.astro');

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
 * Ingests all Markdown/MDX technical articles into pgvector and PostgreSQL FTS.
 */
export async function ingestAllArticles(): Promise<{ totalDocuments: number; totalChunks: number; skippedDocuments: number }> {
  console.log('🚀 Starting Incremental RAG Knowledge Base Ingestion...');
  await initSchema();

  let totalDocuments = 0;
  let totalChunks = 0;
  let skippedDocuments = 0;

  // Ingest Profile & Resume
  const profileChunks = await ingestProfilePages();
  totalChunks += profileChunks;

  // Scan directory for technical articles
  const entries = fs.readdirSync(CONTENT_DIR, { withFileTypes: true });

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
      continue;
    }

    totalDocuments++;
    const docId = await upsertDocument({
      url,
      title: frontmatter.title,
      type: 'article',
      category: frontmatter.category,
      description: frontmatter.description,
      tags: frontmatter.tags || [],
      sourceHash,
      publishedAt: frontmatter.publishedAt ? new Date(frontmatter.publishedAt) : null,
    });

    const rawChunks = chunkDocument(cleanContent, frontmatter.title);
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
    console.log(`✅ [Article] Indexed "${frontmatter.title.slice(0, 38)}" (${chunkRecords.length} chunks)`);
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
  console.log(`📊 Current Knowledge Base Stats: ${stats.totalDocuments} documents, ${stats.totalChunks} chunks in pgvector.`);

  return { totalDocuments, totalChunks, skippedDocuments };
}
