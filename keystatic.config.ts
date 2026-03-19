import { config, fields, collection } from '@keystatic/core';

export default config({
  storage: {
    kind: 'local',
  },
  collections: {
    articles: collection({
      label: 'Posts',
      slugField: 'title',
      path: 'src/content/articles/*/',
      format: {
        contentField: 'content',
        data: 'yaml',
      },
      schema: {
        title: fields.slug({ name: { label: 'Title' } }),
        category: fields.text({ label: 'Category' }),
        date: fields.date({ label: 'Date' }),
        authors: fields.array(
          fields.object({
            name: fields.text({ label: 'Name' }),
            avatarUrl: fields.text({ label: 'Avatar URL' }),
          })
        ),
        imageUrl: fields.image({ label: 'Cover Image', directory: 'public/images/articles', publicPath: '/images/articles/' }),
        imageAlt: fields.text({ label: 'Image Alt Text', multiline: false }),
        description: fields.text({ label: 'Description', multiline: true }),
        tags: fields.array(fields.text({ label: 'Tag' })),
        content: fields.mdx({ label: 'Content' }),
      },
    }),
  },
});
