import { defineCollection } from 'astro:content';
import type { CollectionEntry } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

const authors = defineCollection({
  loader: glob({ 
    pattern: '**/*.mdx', 
    base: './src/content/authors',
  }),
  schema: z.object({
    name: z.string(),
    avatarUrl: z.string(),
    role: z.string().optional(),
    bio: z.string().optional(),
    social: z.object({
      twitter: z.string().optional(),
      github: z.string().optional(),
      linkedin: z.string().optional(),
    }).optional(),
  }),
});

const articles = defineCollection({
  loader: glob({ 
    pattern: '**/index.mdx', 
    base: './src/content/articles',
  }),
  schema: ({ image }) => z.object({
    title: z.string(),
    category: z.string(),
    publishedAt: z.string().or(z.date()).transform((val) => new Date(val)),
    authors: z.array(z.string()).default(['jainil-prajapati']),
    imageUrl: image().optional(),
    imageAlt: z.string().optional(),
    description: z.string(),
    tags: z.array(z.string()).optional(),
    updatedAt: z.string().or(z.date()).transform((val) => new Date(val)).optional(),
  }),
});

export type Article = CollectionEntry<'articles'>;
export type Author = CollectionEntry<'authors'>;

export const collections = {
  articles,
  authors,
};
