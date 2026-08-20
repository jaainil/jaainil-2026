import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

import umami from '@yeskunall/astro-umami';
import astroLLMsGenerator from 'astro-llms-generate';
import robotsTxt from 'astro-robots-txt';
import compress from '@playform/compress';
import writenex from '@imjp/writenex-astro';

export default defineConfig({
  output: 'static',
  site: 'https://shravonix.com',
  redirects: {
    '/the-art-of-feature-flagging-jiocinemas-approach-to-managing-features-at-scale': '/articles/jio-hotstar-s-feature-flagging-how-they-ship-at-scale',
  },
  integrations: [
    react(),
    mdx(),
    writenex(),
    umami({ id: 'ee167bbd-1971-4780-bac6-fa0ddae9a4df' }),
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
      title: 'Jainil Prajapati — Engineering Portfolio & Technical Blog',
      description: 'DevOps & infrastructure engineering portfolio, projects, and technical writing',
      includePatterns: ['**/*'],
      excludePatterns: [],
      i18n: false,
    }),
    compress({
      CSS: false,
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
