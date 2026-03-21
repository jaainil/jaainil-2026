import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context) {
  const articles = await getCollection('articles');
  
  return rss({
    title: 'Shravonix - Tech News & Deep Dives',
    description: 'In-depth technical analysis on AI models, browser engines, web frameworks, Linux kernel, and hardware.',
    site: context.site,
    items: articles.map((article) => ({
      title: article.data.title,
      pubDate: article.data.date,
      description: article.data.description,
      link: `/articles/${article.id}/`,
      author: article.data.authors.map(a => a.name).join(', '),
      categories: [article.data.category, ...(article.data.tags || [])],
    })),
    customData: `<language>en-us</language>`,
  });
}
