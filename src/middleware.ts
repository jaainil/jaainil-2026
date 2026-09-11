import { defineMiddleware } from 'astro:middleware';

export const onRequest = defineMiddleware(async (context, next) => {
  const { url } = context;
  const { pathname, search } = url;

  // Redirect legacy /authors/* to /about/
  if (pathname === '/authors' || pathname.startsWith('/authors/')) {
    return context.redirect('/about/', 301);
  }

  // Redirect any cdn-cgi crawler leaks to contact section
  if (pathname.startsWith('/cdn-cgi/')) {
    return context.redirect('/#contact', 301);
  }

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
