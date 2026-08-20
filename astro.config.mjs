import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import tailwindcss from '@tailwindcss/vite';
import sitemap, { ChangeFreqEnum } from '@astrojs/sitemap';

import umami from '@yeskunall/astro-umami';
import astroLLMsGenerator from 'astro-llms-generate';
import robotsTxt from 'astro-robots-txt';
import compress from '@playform/compress';
import writenex from '@imjp/writenex-astro';
import icon from 'astro-icon';

export default defineConfig({
  output: 'static',
  site: 'https://jaainil.com',
  redirects: {
    '/the-art-of-feature-flagging-jiocinemas-approach-to-managing-features-at-scale': '/articles/jio-hotstar-s-feature-flagging-how-they-ship-at-scale',
  },
  integrations: [
    react(),
    mdx(),
    writenex(),
    icon(),
    umami({
      id: '8169229f-6d5b-4ffc-ac38-9036661b5d94',
      endpoint: 'https://umami.altctrlreturn.com',
    }),
    sitemap({
      customPages: [
        'https://jaainil.com/llms.txt',
        'https://jaainil.com/llms-small.txt',
        'https://jaainil.com/llms-full.txt',
      ],
      serialize(item) {
        // Homepage — highest priority
        if (item.url === 'https://jaainil.com/' || item.url === 'https://jaainil.com') {
          item.changefreq = ChangeFreqEnum.DAILY;
          item.priority = 1.0;
          item.lastmod = new Date().toISOString();
          return item;
        }
        // Articles catalog page
        if (item.url === 'https://jaainil.com/articles' || item.url === 'https://jaainil.com/articles/') {
          item.changefreq = ChangeFreqEnum.DAILY;
          item.priority = 0.9;
          item.lastmod = new Date().toISOString();
          return item;
        }
        // Individual article deep dives
        if (/jaainil\.com\/articles\/.+/.test(item.url)) {
          item.changefreq = ChangeFreqEnum.MONTHLY;
          item.priority = 0.8;
          item.lastmod = new Date().toISOString();
          return item;
        }
        // Static portfolio pages (about, legal, etc.)
        item.changefreq = ChangeFreqEnum.MONTHLY;
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
