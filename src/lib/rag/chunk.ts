import type { ChunkRecord } from './types.js';

export interface ChunkOptions {
  maxChunkChars?: number; // approx 400-600 words / tokens (~1800 chars)
  overlapChars?: number;  // approx 50-80 words / tokens (~300 chars)
  minChunkChars?: number; // minimum chunk size to prevent fragment noise
}

interface RawSection {
  heading: string | null;
  level: number;
  content: string;
}

/**
 * Splits markdown text into hierarchical heading-based sections.
 */
function splitByHeadings(markdown: string): RawSection[] {
  const lines = markdown.split('\n');
  const sections: RawSection[] = [];

  let currentHeading: string | null = null;
  let currentLevel = 0;
  let currentLines: string[] = [];

  for (const line of lines) {
    const headingMatch = line.match(/^(#{1,4})\s+(.+)$/);
    if (headingMatch) {
      // Flush previous section if there's content
      const content = currentLines.join('\n').trim();
      if (content || currentHeading) {
        sections.push({
          heading: currentHeading,
          level: currentLevel,
          content,
        });
      }
      currentHeading = headingMatch[2].trim();
      currentLevel = headingMatch[1].length;
      currentLines = [];
    } else {
      currentLines.push(line);
    }
  }

  // Flush trailing section
  const trailingContent = currentLines.join('\n').trim();
  if (trailingContent || currentHeading) {
    sections.push({
      heading: currentHeading,
      level: currentLevel,
      content: trailingContent,
    });
  }

  return sections;
}

/**
 * Smart hierarchical chunker preserving heading context and paragraph boundaries.
 */
export function chunkDocument(
  content: string,
  docTitle: string,
  options: ChunkOptions = {}
): Omit<ChunkRecord, 'documentId' | 'id'>[] {
  const maxChunkChars = options.maxChunkChars ?? 1800;
  const overlapChars = options.overlapChars ?? 300;
  const minChunkChars = options.minChunkChars ?? 150;

  const sections = splitByHeadings(content);
  const chunks: Omit<ChunkRecord, 'documentId' | 'id'>[] = [];
  let chunkIndex = 0;

  for (const section of sections) {
    const headingPrefix = section.heading
      ? `[Document: ${docTitle}] > [Section: ${section.heading}]\n\n`
      : `[Document: ${docTitle}]\n\n`;

    const sectionBody = section.content.trim();
    if (!sectionBody) continue;

    // If section body comfortably fits in one chunk, keep it intact
    if (headingPrefix.length + sectionBody.length <= maxChunkChars) {
      chunks.push({
        heading: section.heading,
        chunkIndex: chunkIndex++,
        content: headingPrefix + sectionBody,
      });
      continue;
    }

    // Otherwise split by paragraphs with sliding overlap
    const paragraphs = sectionBody.split(/\n\n+/).map((p) => p.trim()).filter(Boolean);
    let currentChunkParagraphs: string[] = [];
    let currentLength = headingPrefix.length;

    for (let i = 0; i < paragraphs.length; i++) {
      const p = paragraphs[i];
      const pLen = p.length + 2; // + newline

      if (currentLength + pLen > maxChunkChars && currentChunkParagraphs.length > 0) {
        // Emit current chunk
        const chunkText = headingPrefix + currentChunkParagraphs.join('\n\n');
        chunks.push({
          heading: section.heading,
          chunkIndex: chunkIndex++,
          content: chunkText,
        });

        // Compute overlap: take trailing paragraphs up to overlapChars
        const overlapParagraphs: string[] = [];
        let accOverlap = 0;
        for (let j = currentChunkParagraphs.length - 1; j >= 0; j--) {
          const prev = currentChunkParagraphs[j];
          if (accOverlap + prev.length <= overlapChars) {
            overlapParagraphs.unshift(prev);
            accOverlap += prev.length;
          } else {
            break;
          }
        }

        currentChunkParagraphs = [...overlapParagraphs, p];
        currentLength = headingPrefix.length + currentChunkParagraphs.join('\n\n').length;
      } else {
        currentChunkParagraphs.push(p);
        currentLength += pLen;
      }
    }

    // Flush remaining paragraphs in section
    if (currentChunkParagraphs.length > 0) {
      const chunkText = headingPrefix + currentChunkParagraphs.join('\n\n');
      if (chunkText.length >= minChunkChars || chunks.length === 0) {
        chunks.push({
          heading: section.heading,
          chunkIndex: chunkIndex++,
          content: chunkText,
        });
      } else if (chunks.length > 0) {
        // Append small leftover to previous chunk if feasible
        chunks[chunks.length - 1].content += '\n\n' + currentChunkParagraphs.join('\n\n');
      }
    }
  }

  return chunks;
}
