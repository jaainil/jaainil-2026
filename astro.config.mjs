import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import keystatic from '@keystatic/astro';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import readingTime from 'astro-reading-time';
import astroLLMsGenerator from 'astro-llms-generate';
import robotsTxt from 'astro-robots-txt';
import vercel from '@astrojs/vercel';

export default defineConfig({
  output: 'static',
  site: 'https://shravonix.com',
  adapter: vercel(),
  integrations: [
    react(),
    readingTime(),
    mdx(),
    ...(process.env.NODE_ENV === 'development' ? [keystatic()] : []),
    sitemap({
      customPages: [
        'https://shravonix.com/llms.txt',
        'https://shravonix.com/llms-small.txt',
        'https://shravonix.com/llms-full.txt',
      ],
    }),
    robotsTxt(),
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
