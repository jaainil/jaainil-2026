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
        publishedAt: fields.datetime({ label: 'Published At', description: 'Exact publish time — used to order posts and display the publish date.' }),
        authors: fields.array(fields.object({
          name: fields.text({ label: 'Name', defaultValue: 'Jainil Prajapati' }),
          avatarUrl: fields.text({ label: 'Avatar URL', defaultValue: 'https://picsum.photos/seed/jainil/40/40' }),
        }), { label: 'Authors' }),
        imageUrl: fields.image({ label: 'Cover Image', directory: 'src/content/articles', publicPath: 'src/content/articles/' }),
        imageAlt: fields.text({ label: 'Image Alt Text', multiline: false }),
        description: fields.text({ label: 'Description', multiline: true }),
        tags: fields.array(fields.text({ label: 'Tag' }), { label: 'Tags' }),
        content: fields.mdx({ label: 'Content' }),
      },
    }),
  },
});
