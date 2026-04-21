import { defineConfig, fields } from "@imjp/writenex-astro/config";

export default defineConfig({
  collections: [
    {
      name: "articles",
      path: "src/content/articles",
      filePattern: "{slug}/index.md",
      previewUrl: "/articles/{slug}",
      schema: {
        title: fields.text({ label: "Title", validation: { isRequired: true } }),
        category: fields.text({ label: "Category", validation: { isRequired: true } }),
        publishedAt: fields.date({ label: "Published At", validation: { isRequired: true } }),
        authors: fields.multiselect({ label: "Authors", options: ["jainil-prajapati"], validation: { isRequired: true } }),
        imageUrl: fields.url({ label: "Image URL", validation: { isRequired: true } }),
        imageAlt: fields.text({ label: "Image Alt" }),
        description: fields.text({ label: "Description", validation: { isRequired: true } }),
        tags: fields.array({ label: "Tags", itemField: fields.text({ label: "Tag" }) }),
        updatedAt: fields.date({ label: "Updated At" }),
      },
    },
    {
      name: "authors",
      path: "src/content/authors",
      filePattern: "{slug}.md",
      schema: {
        name: fields.text({ label: "Name", validation: { isRequired: true } }),
        avatarUrl: fields.url({ label: "Avatar URL", validation: { isRequired: true } }),
        role: fields.text({ label: "Role" }),
        bio: fields.text({ label: "Bio", multiline: true }),
        twitter: fields.text({ label: "Twitter" }),
        github: fields.text({ label: "GitHub" }),
        linkedin: fields.text({ label: "LinkedIn" }),
      },
    },
    {
      name: "categories",
      path: "src/content/categories",
      filePattern: "{slug}.md",
      schema: {
        name: fields.text({ label: "Name", validation: { isRequired: true } }),
        description: fields.text({ label: "Description", validation: { isRequired: true } }),
        color: fields.text({ label: "Color", validation: { isRequired: true } }),
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