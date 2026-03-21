import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import keystatic from '@keystatic/astro';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import readingTime from 'astro-reading-time';
import astroLLMsGenerator from 'astro-llms-generate';
import robotsTxt from 'astro-robots-txt';

export default defineConfig({
  output: 'static',
  site: 'https://shravonix.com',
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
      serialize(item) {
        // Homepage — highest priority, frequent changes
        if (item.url === 'https://shravonix.com/' || item.url === 'https://shravonix.com') {
          item.changefreq = 'daily';
          item.priority = 1.0;
          item.lastmod = new Date().toISOString();
          return item;
        }
        // Articles listing page
        if (item.url === 'https://shravonix.com/articles' || item.url === 'https://shravonix.com/articles/') {
          item.changefreq = 'daily';
          item.priority = 0.9;
          item.lastmod = new Date().toISOString();
          return item;
        }
        // Individual article pages
        if (/shravonix\.com\/articles\/.+/.test(item.url)) {
          item.changefreq = 'monthly';
          item.priority = 0.8;
          item.lastmod = new Date().toISOString();
          return item;
        }
        // About and other static pages
        item.changefreq = 'monthly';
        item.priority = 0.5;
        item.lastmod = new Date().toISOString();
        return item;
      },
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
