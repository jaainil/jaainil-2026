import { defineCollection } from 'astro:content';
import type { CollectionEntry } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

const articles = defineCollection({
  loader: glob({ 
    pattern: '**/index.mdx', 
    base: './src/content/articles',
  }),
  schema: ({ image }) => z.object({
    title: z.string(),
    category: z.string(),
    date: z.string(),
    authors: z.array(z.object({
      name: z.string(),
      avatarUrl: z.string(),
    })),
    imageUrl: image(),
    imageAlt: z.string().optional(),
    description: z.string().optional(),
    tags: z.array(z.string()).optional(),
  }),
});

export type Article = CollectionEntry<'articles'>;

export const collections = {
  articles,
};
