import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context) {
  const articles = await getCollection('articles');
  const authors = await getCollection('authors');
  
  // Create author map for quick lookup
  const authorMap = new Map(authors.map(a => [a.id, a.data.name]));
  
  // Sort articles newest-first for RSS readers
  const sortedArticles = [...articles].sort(
    (a, b) => new Date(b.data.publishedAt).getTime() - new Date(a.data.publishedAt).getTime()
  );

  return rss({
    title: 'Jainil Prajapati — Tech & DevOps Blog',
    description: 'Engineering deep dives, Linux server administration, containerization, and platform architecture by Jainil Prajapati.',
    site: context.site,
    items: sortedArticles.map((article) => ({
      title: article.data.title,
      pubDate: article.data.publishedAt,
      description: article.data.description,
      link: `/articles/${article.id}/`,
      author: article.data.authors.map(authorId => authorMap.get(authorId) || authorId).join(', '),
      categories: [article.data.category, ...(article.data.tags || [])],
    })),
    customData: `<language>en-us</language>`,
  });
}
