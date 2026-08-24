# Schema Report — jaainil.com

Detection method: static scan of `src/**/*.{astro,ts,tsx}` (Astro SSG — all JSON-LD ships in initial HTML, satisfying Google's Dec 2025 JS-rendering guidance).

## Detection

| Format | Found | Where |
|---|---|---|
| JSON-LD | Yes | BaseLayout.astro, index.astro, about.astro, articles/index.astro, articles/[slug].astro |
| Microdata | No | — |
| RDFa | No | — |

## Validation Results

| Schema | Type | File | Status | Issues |
|---|---|---|---|---|
| personSchema | Person (`#person`) | BaseLayout.astro:47 | ✅ | Required props present; absolute URLs; valid sameAs |
| siteSchema | WebSite (`#website`) | BaseLayout.astro:93 | ✅ | Clean @id cross-refs to `#person` |
| articleSchema | TechArticle | BaseLayout.astro:123 | ✅ | headline/dates/image/mainEntityOfPage present; ISO dates |
| breadcrumbSchema | BreadcrumbList | [slug].astro:80 | ✅ | Absolute URLs, correct positions |
| breadcrumbSchema | BreadcrumbList | articles/index.astro:34 | ✅ | Valid |
| webPageSchema | CollectionPage | articles/index.astro:43 | ✅ | Linked to `#website` |
| itemListSchema | ItemList | articles/index.astro:54 | ✅ | numberOfItems + positioned ListItems |
| homePageSchema | ProfilePage | index.astro:234 | ✅ | mainEntity/about ref `#person` |
| profileSchema | ProfilePage + BreadcrumbList | about.astro:9–20 | ✅ | Valid |

## Deprecated-type scan

No HowTo, FAQPage, SpecialAnnouncement, ClaimReview, VehicleListing, EstimatedSalary, LearningVideo, CourseInfo, or Practice Problem found. Nothing to remove.

## Recommendations

None required. Coverage matches page intent: Person/WebSite sitewide, TechArticle+BreadcrumbList on posts, ProfilePage on home/about, CollectionPage+ItemList on the blog index. `generated-schema.json` omitted — every detected block passes, so there is nothing new to generate.

Minor note (no action needed): the `schemaAuthors` fallback in BaseLayout.astro:117 renders raw slugs as author names, but `articles/[slug].astro` always passes `resolvedAuthors`, so it never fires in practice.
