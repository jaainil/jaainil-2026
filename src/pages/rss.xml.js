import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context) {
  const articles = await getCollection('articles');
  
  // Sort articles newest-first for RSS readers
  const sortedArticles = [...articles].sort(
    (a, b) => {
      const dateA = a.data.publishedAt || a.data.date;
      const dateB = b.data.publishedAt || b.data.date;
      return new Date(dateB).getTime() - new Date(dateA).getTime();
    }
  );

  return rss({
    title: 'Shravonix - Tech News & Deep Dives',
    description: 'In-depth technical analysis on AI models, browser engines, web frameworks, Linux kernel, and hardware.',
    site: context.site,
    items: sortedArticles.map((article) => ({
      title: article.data.title,
      pubDate: article.data.publishedAt || article.data.date,
      description: article.data.description,
      link: `/articles/${article.id}/`,
      author: article.data.authors.map(a => a.name).join(', '),
      categories: [article.data.category, ...(article.data.tags || [])],
    })),
    customData: `<language>en-us</language>`,
  });
}
