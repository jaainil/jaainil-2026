import 'dotenv/config';
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import tailwindcss from '@tailwindcss/vite';
import sitemap, { ChangeFreqEnum } from '@astrojs/sitemap';
import node from '@astrojs/node';

import writenex from '@imjp/writenex-astro';
import icon from 'astro-icon';
import robotsTxt from 'astro-robots-txt';
import llms from 'astro-llms-md';

export default defineConfig({
  output: 'server',
  site: 'https://jaainil.com',
  redirects: {
    '/the-art-of-feature-flagging-jiocinemas-approach-to-managing-features-at-scale': '/articles/jio-hotstar-s-feature-flagging-how-they-ship-at-scale',
  },
  integrations: [
    react(),
    mdx(),
    writenex({
      allowProduction: true,
      remoteCms: {
        enabled: true,
      },
    }),
    icon(),
    robotsTxt({
      policy: [
        {
          userAgent: '*',
          allow: '/',
        },
      ],
    }),
    sitemap({
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
    llms({
      name: 'Jainil Prajapati',
      description: 'Full-Stack Developer & DevOps Engineer. Technical articles, DevOps workflows, Linux systems, and open-source contributions.',
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
  adapter: node({ mode: 'standalone' }),
});
