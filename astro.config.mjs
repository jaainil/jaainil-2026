import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import keystatic from '@keystatic/astro';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  integrations: [react(), mdx(), keystatic()],
  output: 'static',
  site: 'https://shravonix.com',
  vite: {
    plugins: [tailwindcss()],
  },
});
