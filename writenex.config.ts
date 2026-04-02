import { defineConfig } from "@imjp/writenex-astro";

export default defineConfig({
  collections: [
    {
      name: "articles",
      path: "src/content/articles",
      filePattern: "{slug}/index.md",
      previewUrl: "/articles/{slug}",
      schema: {
        title: { type: "string", required: true },
        category: { type: "string", required: true },
        publishedAt: { type: "date", required: true },
        authors: { type: "array", items: "string", required: true, options: ["jainil-prajapati"] },
        imageUrl: { type: "string", required: true },
        imageAlt: { type: "string" },
        description: { type: "string", required: true },
        tags: { type: "array", items: "string" },
        updatedAt: { type: "date" },
      },
    },
    {
      name: "authors",
      path: "src/content/authors",
      filePattern: "{slug}.md",
      schema: {
        name: { type: "string", required: true },
        avatarUrl: { type: "string", required: true },
        role: { type: "string" },
        bio: { type: "string" },
        twitter: { type: "string" },
        github: { type: "string" },
        linkedin: { type: "string" },
      },
    },
    {
      name: "categories",
      path: "src/content/categories",
      filePattern: "{slug}.md",
      schema: {
        name: { type: "string", required: true },
        description: { type: "string", required: true },
        color: { type: "string", required: true },
      },
    },
  ],
  images: {
    strategy: "colocated",
  },
  editor: {
    autosave: true,
    autosaveInterval: 3000,
  },
});