# Shravonix

Personal tech blog covering AI, web development, software engineering, and the latest in technology.

**Live Site:** [https://shravonix.com](https://shravonix.com)

## Tech Stack

- **Framework:** Astro 6
- **UI:** React 19 + Tailwind CSS 4
- **Content:** MDX + MarkDoc
- **Icons:** Lucide React
- **SEO:** astro-seo, Sitemap, Schema.org structured data
- **Analytics:** Umami
- **Fonts:** Inter, Space Grotesk, JetBrains Mono (via Fontsource)

## Features

- Blog with MDX articles and author profiles
- RSS feed at `/rss.xml`
- Sitemap generation
- Auto-generated privacy policy, terms, and cookie pages
- Reading progress bar, table of contents, and back-to-top
- Social sharing buttons
- OpenGraph and Twitter card meta tags
- Umami analytics integration
- CI/CD pipeline (GitHub Actions)

## Getting Started

```bash
# Install dependencies
deno install

# Start dev server
deno task dev

# Build for production
deno task build

# Preview production build
deno task preview

# Type check
deno task check

# Clean build output
deno task clean
```

## Project Structure

```
src/
  components/       # Astro & React components
  content/
    articles/       # Blog posts (MDX)
    authors/        # Author profiles
  layouts/          # Page layouts
  pages/            # Routes
    articles/       # Article listing & detail pages
    legal/          # Privacy, terms, cookies pages
    rss.xml.js      # RSS feed
  styles/           # Global CSS
  types/            # TypeScript interfaces
```

## Environment Variables

Create a `.env` file with the following variables:

| Variable | Description |
|---|---|
| `UMAMI_WEBSITE_ID` | Umami analytics website ID |
| `GEMINI_API_KEY` | For AI content generation |

## License

MIT
