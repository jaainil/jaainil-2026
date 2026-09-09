export const prerender = true;
import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { marked } from 'marked';
import fs from 'node:fs';

function escapeXml(unsafe) {
  return String(unsafe || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function getArticleImageInfo(imageField, siteUrl) {
  if (!imageField) return null;

  let src = '';
  let format = '';

  if (typeof imageField === 'string') {
    src = imageField;
  } else if (typeof imageField === 'object' && imageField !== null) {
    if ('src' in imageField && typeof imageField.src === 'string') {
      src = imageField.src;
    }
    if ('format' in imageField && typeof imageField.format === 'string') {
      format = imageField.format.toLowerCase();
    }
  }

  if (!src) return null;

  const absoluteUrl = src.startsWith('http://') || src.startsWith('https://')
    ? src
    : new URL(src, siteUrl).toString();

  if (!format) {
    const cleanUrl = absoluteUrl.split('?')[0].toLowerCase();
    if (cleanUrl.endsWith('.png')) format = 'png';
    else if (cleanUrl.endsWith('.jpg') || cleanUrl.endsWith('.jpeg')) format = 'jpeg';
    else if (cleanUrl.endsWith('.webp')) format = 'webp';
    else if (cleanUrl.endsWith('.gif')) format = 'gif';
    else if (cleanUrl.endsWith('.svg')) format = 'svg';
    else if (cleanUrl.endsWith('.avif')) format = 'avif';
  }

  const mimeType = {
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    webp: 'image/webp',
    gif: 'image/gif',
    svg: 'image/svg+xml',
    avif: 'image/avif',
  }[format] || 'image/jpeg';

  return {
    url: absoluteUrl,
    type: mimeType,
  };
}

function makeUrlsAbsolute(html, articlePath, siteUrl) {
  const baseSite = siteUrl.replace(/\/+$/, '');
  const baseArticle = new URL(articlePath, baseSite + '/').toString();

  // Replace src attributes
  let processed = html.replace(/src=(["'])(.*?)\1/gi, (match, quote, src) => {
    if (!src || src.startsWith('http://') || src.startsWith('https://') || src.startsWith('data:')) {
      return match;
    }
    if (src.startsWith('//')) {
      return `src=${quote}https:${src}${quote}`;
    }
    if (src.startsWith('/')) {
      return `src=${quote}${baseSite}${src}${quote}`;
    }
    try {
      const absUrl = new URL(src, baseArticle).toString();
      return `src=${quote}${absUrl}${quote}`;
    } catch {
      return match;
    }
  });

  // Replace href attributes
  processed = processed.replace(/href=(["'])(.*?)\1/gi, (match, quote, href) => {
    if (
      !href ||
      href.startsWith('http://') ||
      href.startsWith('https://') ||
      href.startsWith('mailto:') ||
      href.startsWith('#') ||
      href.startsWith('tel:')
    ) {
      return match;
    }
    if (href.startsWith('//')) {
      return `href=${quote}https:${href}${quote}`;
    }
    if (href.startsWith('/')) {
      return `href=${quote}${baseSite}${href}${quote}`;
    }
    try {
      const absUrl = new URL(href, baseArticle).toString();
      return `href=${quote}${absUrl}${quote}`;
    } catch {
      return match;
    }
  });

  return processed;
}

export async function GET(context) {
  const articles = await getCollection('articles');
  const authors = await getCollection('authors');

  const siteUrl = context.site ? context.site.toString() : 'https://jaainil.com';

  // Create author map for quick lookup
  const authorMap = new Map(authors.map((a) => [a.id, a.data.name]));

  // Sort articles newest-first for RSS readers
  const sortedArticles = [...articles].sort(
    (a, b) => new Date(b.data.publishedAt).getTime() - new Date(a.data.publishedAt).getTime()
  );

  const items = await Promise.all(
    sortedArticles.map(async (article) => {
      const articleLink = `/articles/${article.id}/`;
      const imageInfo = getArticleImageInfo(article.data.imageUrl, siteUrl);

      // Get markdown body
      let rawMarkdown = article.body || '';
      if (!rawMarkdown && article.filePath && fs.existsSync(article.filePath)) {
        const fileContent = fs.readFileSync(article.filePath, 'utf-8');
        rawMarkdown = fileContent.replace(/^---[\s\S]*?---\s*/, '');
      }

      // Render markdown to HTML
      let contentHtml = '';
      if (rawMarkdown) {
        contentHtml = await marked.parse(rawMarkdown, { gfm: true, breaks: false });
        contentHtml = makeUrlsAbsolute(contentHtml, articleLink, siteUrl);
      }

      // Prepend hero cover image to content body if available
      const coverImageHtml = imageInfo
        ? `<p><img src="${imageInfo.url}" alt="${escapeXml(article.data.imageAlt || article.data.title)}" /></p>\n`
        : '';

      const fullContent = coverImageHtml + contentHtml;

      const item = {
        title: article.data.title,
        pubDate: article.data.publishedAt,
        description: article.data.description,
        link: articleLink,
        author: (article.data.authors || []).map((authorId) => authorMap.get(authorId) || authorId).join(', '),
        categories: [article.data.category, ...(article.data.tags || [])],
        content: fullContent,
      };

      if (imageInfo) {
        item.enclosure = {
          url: imageInfo.url,
          length: 0,
          type: imageInfo.type,
        };
        item.customData = `<media:content url="${escapeXml(imageInfo.url)}" medium="image" type="${escapeXml(imageInfo.type)}" /><media:thumbnail url="${escapeXml(imageInfo.url)}" />`;
      }

      return item;
    })
  );

  return rss({
    title: 'Jainil Prajapati — Tech & DevOps Blog',
    description: 'Engineering deep dives, Linux server administration, containerization, and platform architecture by Jainil Prajapati.',
    site: context.site,
    xmlns: {
      atom: 'http://www.w3.org/2005/Atom',
      media: 'http://search.yahoo.com/mrss/',
    },
    items,
    customData: `<language>en-us</language><atom:link href="${new URL('/rss.xml', siteUrl).toString()}" rel="self" type="application/rss+xml"/>`,
  });
}
