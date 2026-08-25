export interface ParsedDocument {
  title: string;
  description: string;
  category: string;
  tags: string[];
  publishedAt: string | null;
  type: 'article' | 'page' | 'guide' | 'doc';
  content: string;
  rawFrontmatter: Record<string, any>;
}

/**
 * Extracts YAML frontmatter and cleaned markdown body from an MD/MDX file.
 */
export function extractFrontmatterAndBody(rawSource: string): { frontmatter: Record<string, any>; body: string } {
  const frontmatterRegex = /^---\s*[\r\n]+([\s\S]*?)[\r\n]+---\s*[\r\n]*/;
  const match = rawSource.match(frontmatterRegex);

  const frontmatter: Record<string, any> = {};
  let body = rawSource;

  if (match) {
    const yamlBlock = match[1];
    body = rawSource.slice(match[0].length);

    // Simple robust YAML parser for standard key-value frontmatter
    const lines = yamlBlock.split(/\r?\n/);
    let currentKey = '';
    let inArray = false;

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;

      if (trimmed.startsWith('- ') && inArray && currentKey) {
        const val = trimmed.slice(2).trim().replace(/^['"](.*)['"]$/, '$1');
        if (Array.isArray(frontmatter[currentKey])) {
          frontmatter[currentKey].push(val);
        }
        continue;
      }

      const colonIdx = line.indexOf(':');
      if (colonIdx !== -1) {
        const key = line.slice(0, colonIdx).trim();
        let value = line.slice(colonIdx + 1).trim();

        if (value === '' || value === '[]') {
          frontmatter[key] = [];
          currentKey = key;
          inArray = true;
        } else if (value.startsWith('[') && value.endsWith(']')) {
          const items = value
            .slice(1, -1)
            .split(',')
            .map((s) => s.trim().replace(/^['"](.*)['"]$/, '$1'))
            .filter(Boolean);
          frontmatter[key] = items;
          currentKey = key;
          inArray = false;
        } else {
          // Clean quotes
          value = value.replace(/^['"](.*)['"]$/, '$1');
          frontmatter[key] = value;
          currentKey = key;
          inArray = false;
        }
      }
    }
  }

  return { frontmatter, body };
}

/**
 * Strips MDX/JSX imports, exports, and React component wrappers while preserving clean text.
 */
export function cleanMarkdownContent(rawBody: string): string {
  let text = rawBody;

  // 1. Remove MDX import statements
  text = text.replace(/^import\s+.*?(?:from\s+['"].*?['"]|['"].*?['"]);?\s*$/gm, '');

  // 2. Remove MDX export statements
  text = text.replace(/^export\s+(?:const|let|var|default|function|type|interface)\s+.*$/gm, '');

  // 3. Remove self-closing JSX components: <AnimatedToc ... />, <ReadingProgressBar />, <img ... />
  text = text.replace(/<[A-Z][A-Za-z0-9_]*\b[^>]*\/>/g, '');

  // 4. Remove paired JSX components but preserve their inner text: <Alert>inner text</Alert> -> inner text
  text = text.replace(/<[A-Z][A-Za-z0-9_]*\b[^>]*>([\s\S]*?)<\/[A-Z][A-Za-z0-9_]*>/g, '$1');

  // 5. Remove HTML tags like <div>, <span>, <br />, etc.
  text = text.replace(/<\/?[a-z][a-z0-9]*\b[^>]*>/gi, '');

  // 6. Clean image links ![alt text](url) -> keep alt text if meaningful
  text = text.replace(/!\[(.*?)\]\([^)]+\)/g, (_, alt) => (alt ? `[Image: ${alt}]` : ''));

  // 7. Clean hyperlinks [link text](url) -> link text
  text = text.replace(/\[(.*?)\]\([^)]+\)/g, '$1');

  // 8. Normalize spacing, tabs, and multiple blank lines
  text = text.replace(/\r\n/g, '\n');
  text = text.replace(/\n{3,}/g, '\n\n');

  return text.trim();
}

/**
 * Parses full MDX article into a structured document object.
 */
export function parseArticleMdx(rawSource: string, fallbackTitle = 'Untitled'): ParsedDocument {
  const { frontmatter, body } = extractFrontmatterAndBody(rawSource);
  const cleanedBody = cleanMarkdownContent(body);

  const title = frontmatter.title || fallbackTitle;
  const description = frontmatter.description || '';
  const category = frontmatter.category || 'tech';
  const tags = Array.isArray(frontmatter.tags) ? frontmatter.tags : [];
  const publishedAt = frontmatter.publishedAt ? new Date(frontmatter.publishedAt).toISOString() : null;

  return {
    title,
    description,
    category,
    tags,
    publishedAt,
    type: 'article',
    content: cleanedBody,
    rawFrontmatter: frontmatter,
  };
}

/**
 * Converts built HTML into clean plain text (drops scripts, styles, tags, entities).
 */
export function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Extracts frontmatter and returns cleaned markdown body.
 */
export function extractFrontmatterAndClean(rawSource: string): { frontmatter: Record<string, any>; cleanContent: string } {
  const { frontmatter, body } = extractFrontmatterAndBody(rawSource);
  const cleanContent = cleanMarkdownContent(body);
  return { frontmatter, cleanContent };
}
