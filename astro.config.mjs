import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import keystatic from '@keystatic/astro';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import readingTime from 'astro-reading-time';

export default defineConfig({
  integrations: [
    react(),
    readingTime(),
    mdx(),
    keystatic(),
    sitemap(),
  ],
  output: 'static',
  site: 'https://shravonix.com',
  vite: {
    plugins: [tailwindcss()],
  },
});
