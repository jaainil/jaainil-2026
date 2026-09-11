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
  trailingSlash: 'always',
  redirects: {
    '/the-art-of-feature-flagging-jiocinemas-approach-to-managing-features-at-scale': '/articles/jio-hotstar-s-feature-flagging-how-they-ship-at-scale/',
    '/authors/jainil-prajapati': '/about/',
    '/authors/jainil-prajapati/': '/about/',
    '/authors': '/about/',
    '/authors/': '/about/',
    '/cdn-cgi/l/email-protection': '/#contact',
    '/privacy': '/legal/privacy/',
    '/privacy-policy': '/legal/privacy/',
    '/terms': '/legal/terms/',
    '/terms-of-service': '/legal/terms/',
    '/terms-and-conditions': '/legal/terms/',
    '/cookies': '/legal/cookies/',
    '/cookie-policy': '/legal/cookies/',
    '/uses': '/pieces/',
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
      host: 'jaainil.com',
      sitemap: 'https://jaainil.com/sitemap-index.xml',
      policy: [
        {
          userAgent: '*',
          allow: '/',
          disallow: ['/api/', '/cdn-cgi/'],
        },
        {
          userAgent: 'Googlebot',
          allow: '/',
          disallow: ['/api/', '/cdn-cgi/'],
        },
        {
          userAgent: 'Bingbot',
          allow: '/',
          disallow: ['/api/', '/cdn-cgi/'],
        },
        {
          userAgent: 'GPTBot',
          allow: '/',
          disallow: ['/api/', '/cdn-cgi/'],
        },
        {
          userAgent: 'ChatGPT-User',
          allow: '/',
          disallow: ['/api/', '/cdn-cgi/'],
        },
        {
          userAgent: 'PerplexityBot',
          allow: '/',
          disallow: ['/api/', '/cdn-cgi/'],
        },
        {
          userAgent: 'ClaudeBot',
          allow: '/',
          disallow: ['/api/', '/cdn-cgi/'],
        },
        {
          userAgent: 'anthropic-ai',
          allow: '/',
          disallow: ['/api/', '/cdn-cgi/'],
        },
        {
          userAgent: 'Google-Extended',
          allow: '/',
          disallow: ['/api/', '/cdn-cgi/'],
        },
        {
          userAgent: 'Applebot-Extended',
          allow: '/',
          disallow: ['/api/', '/cdn-cgi/'],
        },
        {
          userAgent: 'CCBot',
          allow: '/',
          disallow: ['/api/', '/cdn-cgi/'],
        },
      ],
      transform(content) {
        return content.replace(/User-agent: ([^\r\n]+)/g, (match) => {
          return `${match}\nContent-Signal: ai-train=yes, search=yes, ai-input=yes`;
        });
      },
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
      name: 'Jainil Prajapati (Jaanil)',
      description: 'Official portfolio and technical writings of Jainil Prajapati (also known online as Jaanil or Jaainil). Full-Stack Developer & DevOps Engineer specializing in Next.js, Node.js, Docker, CI/CD pipelines, and Linux systems.',
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
  adapter: node({ mode: 'standalone' }),
});
