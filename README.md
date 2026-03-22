<div align="center">
<img width="1200" height="475" alt="Shravonix Banner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Shravonix

Personal tech blog covering AI, web development, software engineering, and the latest in technology.

**Live Site:** [https://shravonix.com](https://shravonix.com)

## Tech Stack

- **Framework:** Astro 6
- **UI:** React 19 + Tailwind CSS 4
- **Content:** MDX + MarkDoc + Keystatic CMS
- **Icons:** Lucide React
- **SEO:** astro-seo, Sitemap, Schema.org structured data
- **Analytics:** Umami
- **Fonts:** Inter, Space Grotesk, JetBrains Mono (via Fontsource)

## Features

- Blog with MDX articles and author profiles
- Keystatic headless CMS for content management
- RSS feed at `/rss.xml`
- Sitemap generation
- Auto-generated privacy policy, terms, and cookie pages
- Reading progress bar, table of contents, and back-to-top
- Social sharing buttons
- OpenGraph and Twitter card meta tags
- Umami analytics integration
- CI/CD pipeline (GitHub Actions)

## Getting Started

**Prerequisites:** Node.js or Bun

```bash
# Install dependencies
npm install
# or
bun install

# Start dev server
npm run dev
# or
bun run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type check
npm run check

# Clean build output
npm run clean
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
