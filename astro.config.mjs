import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import tailwindcss from '@tailwindcss/vite';
import sitemap, { ChangeFreqEnum } from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';

import aeo from 'astro-aeo';
import umami from '@yeskunall/astro-umami';
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
    aeo({
      site: {
        name: 'Jainil Prajapati',
        description: 'Full-Stack Developer & DevOps Engineer. Technical articles, DevOps workflows, Linux systems, and open-source contributions.',
        profile: {
          enabled: true,
          name: 'Jainil Prajapati',
          description: 'Full-Stack Developer & DevOps Engineer',
          website: 'https://jaainil.com',
          email: 'jainilprajapati9@gmail.com',
          logo: 'https://jaainil.com/profile.png',
          sameAs: [
            'https://github.com/jaainil',
            'https://www.linkedin.com/in/jaainil/',
            'https://www.npmjs.com/~imjp',
            'https://www.reddit.com/user/enough_jainil/',
          ],
          entityType: 'Person',
        },
      },
      markdown: {
        enabled: true,
        frontmatter: true,
      },
      corpus: {
        index: {
          enabled: true,
          sections: [
            { title: 'Home', match: '/' },
            { title: 'About & Profile', match: '/about' },
            { title: 'Articles & Deep Dives', match: '/articles/**' },
            { title: 'Legal Policies', match: '/legal/**' },
          ],
          defaultSection: 'Pages',
        },
        full: {
          enabled: true,
          mode: 'all',
        },
      },
      discovery: {
        sitemap: {
          mode: 'external',
        },
        robots: {
          enabled: true,
          universalAllow: true,
          includeLlmsTxt: true,
          extraLines: [
            'Content-Signal: ai-train=yes, search=yes, ai-input=yes',
          ],
        },
      },
      schema: {
        autoInject: false,
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
  adapter: vercel(),
});
