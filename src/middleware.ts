import { defineMiddleware } from 'astro:middleware';

export const onRequest = defineMiddleware(async (context, next) => {
  const { url } = context;
  const { pathname, search } = url;

  // Only redirect standard routes (not static files with extensions, not API, not _astro internal)
  if (
    pathname !== '/' &&
    !pathname.endsWith('/') &&
    !pathname.startsWith('/api/') &&
    !pathname.startsWith('/_astro/') &&
    !pathname.split('/').pop()?.includes('.')
  ) {
    return context.redirect(`${pathname}/${search}`, 301);
  }

  return next();
});
