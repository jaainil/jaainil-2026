# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Hiring managers and engineering managers evaluating Jainil Prajapati for full-stack / DevOps engineering roles. They arrive from a resume link, LinkedIn, or a GitHub profile, skim for 1–3 minutes, and need to answer: is this person real, what have they shipped, can they own infrastructure end to end. Secondary: freelance clients and developers who find the blog through search.

## Product Purpose

Personal portfolio + technical publication. It exists to earn interviews: prove shipping ability (real repos, merged PRs, an npm package), prove operational depth (Linux, Docker, CI/CD, self-hosting), and show communication skill through the Shravonix article archive (~25 published pieces, 5K monthly readers at peak). Success = a hiring manager emails or calls.

## Positioning

Not a bootcamp-grad portfolio. The verifiable differentiators: 10+ merged PRs in Dokploy's official templates repo, author/maintainer of @imjp/writenex-astro on npm (a real Astro CMS integration), grew r/AI_India from 1K to 21K members as moderator, and runs actual self-hosted infrastructure (Proxmox, Nginx, Debian). Every claim links to a checkable artifact.

## Operating Context

Viewed mostly on desktop during work hours by busy evaluators; also opened from phones after career fairs or meetups. Lives alongside a live production blog (Shravonix) on the same domain family; the portfolio homepage must coexist with /articles routes that keep their own layout.

## Capabilities and Constraints

- Static Astro build (Astro 7, Tailwind 4), deployed via Vercel with edge caching.
- Existing routes to preserve: `/`, `/about`, `/articles`, `/articles/[slug]`, legal pages.
- Real facts only: employer Aexaware Infotech (Vadodara), B.E. IT at SVIT (CGPA 7.03), Anand Gujarat base, contact jainilprajapati9@gmail.com / +91 97252 84302.
- Profile photo asset exists at /profile.png.
- Dark mode toggle exists and should survive (site supports both themes).
- User delegated content trimming decisions to design judgment.

## Brand Commitments

Name: Jainil Prajapati. Handles: GitHub @jaainil, npm ~imjp, Reddit u/enough_jainil, LinkedIn /in/jaainil. Voice: plain-spoken engineer, no hype. The user explicitly wants nothing that reads as AI-generated: no terminal/HUD cosplay, no fake status badges, no template monotony.

## Evidence on Hand

Real, verifiable artifacts: Dokploy merged PRs (github.com/Dokploy/templates, author:jaainil), Writenex npm package (@imjp/writenex-astro v1.9.x), live demos (blog-maker.vercel.app, india-ai-tracker.vercel.app, remix-llm-resoures.vercel.app), r/AI_India subreddit, ~25 MDX articles in src/content/articles. No testimonials, awards, or press exist — none may be invented.

## Product Principles

1. Evidence over adjectives — every claim sits next to its link.
2. A hiring manager gets the full picture in one scroll, under two minutes.
3. Written like a person who ships, not a resume generator.
4. The blog proves depth; the portfolio page proves breadth.

## Accessibility & Inclusion

WCAG AA contrast in both themes, keyboard navigable, semantic headings. No motion required for comprehension.
