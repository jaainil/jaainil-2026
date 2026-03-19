import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import keystatic from '@keystatic/astro';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import readingTime from 'astro-reading-time';
import astroLLMsGenerator from 'astro-llms-generate';
import vercel from '@astrojs/vercel';

export default defineConfig({
  output: 'static',
  adapter: vercel(),
  site: 'https://shravonix.com',
  integrations: [
    react(),
    readingTime(),
    mdx(),
    keystatic(),
    sitemap({
      customPages: [
        'https://shravonix.com/llms.txt',
        'https://shravonix.com/llms-small.txt',
        'https://shravonix.com/llms-full.txt',
      ],
    }),
    astroLLMsGenerator({
      title: 'Shravonix Documentation',
      description: 'Complete documentation and content for AI understanding',
      includePatterns: ['**/*'],
      excludePatterns: [],
      i18n: false,
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
