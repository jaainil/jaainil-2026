import { defineConfig, fields } from "@imjp/writenex-astro/config";

export default defineConfig({
  collections: [
    {
      name: "articles",
      path: "src/content/articles",
      filePattern: "{slug}/index.mdx",
      previewUrl: "/articles/{slug}",
      schema: {
        title: fields.text({ label: "Title", validation: { isRequired: true } }),
        category: fields.select({
          label: "Category",
          options: ["Linux", "Tech", "AI", "Programming", "IoT", "Opinions"],
          defaultValue: "Tech",
        }),
        publishedAt: fields.date({ label: "Published At", validation: { isRequired: true } }),
        imageUrl: fields.image({ label: "Cover Image" }),
        imageAlt: fields.text({ label: "Image Alt" }),
        description: fields.text({ label: "Description", multiline: true, validation: { isRequired: true } }),
        tags: fields.array({ label: "Tags", itemField: fields.text({ label: "Tag" }) }),
        updatedAt: fields.date({ label: "Updated At" }),
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