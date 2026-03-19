import { defineCollection, z } from 'astro:content';

const articles = defineCollection({
  type: 'data',
  schema: z.object({
    id: z.string(),
    title: z.string(),
    category: z.string(),
    date: z.string(),
    authors: z.array(z.object({
      name: z.string(),
      avatarUrl: z.string(),
    })),
    imageUrl: z.string(),
    readTime: z.string(),
    description: z.string().optional(),
    tags: z.array(z.string()).optional(),
  }),
});

export const collections = {
  articles,
};