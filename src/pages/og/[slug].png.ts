import type { APIRoute, GetStaticPaths } from 'astro';
import { getCollection } from 'astro:content';
import { ImageResponse } from '@vercel/og';
import { createElement as h } from 'react';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';

// Generate once per build, with no font fetches or rendering on visitor requests.
export const prerender = true;
const require = createRequire(import.meta.url);
const font = readFile(require.resolve('@fontsource/rubik/files/rubik-latin-800-normal.woff'));

export const getStaticPaths: GetStaticPaths = async () => {
  const articles = await getCollection('articles');
  return [
    { params: { slug: 'site' }, props: { title: 'Jainil Prajapati', category: 'Full-Stack & DevOps Engineer' } },
    ...articles.map(({ id, data }) => ({ params: { slug: id }, props: data })),
  ];
};

export const GET: APIRoute = async ({ props }) => {
  const title = props.title as string;
  const fontSize = title.length > 140 ? 48 : title.length > 100 ? 56 : title.length > 65 ? 64 : 76;
  const row = { display: 'flex', alignItems: 'center' } as const;
  return new ImageResponse(
    h('div', { style: { display: 'flex', flexDirection: 'column', width: '100%', height: '100%', background: '#aee1ff', color: '#10151b', padding: 42, fontFamily: 'Rubik Variable', fontWeight: 800 } },
      h('div', { style: { ...row, justifyContent: 'space-between', fontSize: 25, marginBottom: 26 } },
        h('span', null, 'Shravonix'),
        h('span', { style: { background: '#ffcd00', border: '2px solid #111111', borderRadius: 8, padding: '8px 16px', fontSize: 20 } }, props.category)),
      h('div', { style: { display: 'flex', flex: 1, alignItems: 'center', background: '#ffffff', border: '2px solid #111111', borderRadius: 14, boxShadow: '0 6px 0 #111111', padding: '30px 38px' } },
        h('div', { style: { fontSize, lineHeight: 1.12, letterSpacing: '-0.025em' } }, title)),
      h('div', { style: { ...row, justifyContent: 'space-between', fontSize: 22, marginTop: 30 } },
        h('span', null, 'Jainil Prajapati'), h('span', null, 'jaainil.com'))),
    { width: 1200, height: 630, fonts: [{ name: 'Rubik Variable', data: await font, weight: 800, style: 'normal' }], headers: { 'Cache-Control': 'public, max-age=0, must-revalidate' } },
  );
};
