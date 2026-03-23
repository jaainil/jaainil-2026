import { config, fields, collection } from '@keystatic/core';

export default config({
  storage: {
    kind: 'local',
  },
  collections: {
    authors: collection({
      label: 'Authors',
      slugField: 'name',
      path: 'src/content/authors/*',
      format: {
        contentField: 'content',
        data: 'yaml',
      },
      schema: {
        name: fields.slug({ name: { label: 'Name' } }),
        avatarUrl: fields.text({ label: 'Avatar URL' }),
        role: fields.text({ label: 'Role', multiline: true }),
        bio: fields.text({ label: 'Bio', multiline: true }),
        social: fields.object({
          twitter: fields.text({ label: 'Twitter' }),
          github: fields.text({ label: 'GitHub' }),
          linkedin: fields.text({ label: 'LinkedIn' }),
        }),
        content: fields.mdx({ label: 'Content' }),
      },
    }),
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
        authors: fields.array(
          fields.relationship({
            label: 'Authors',
            description: 'Select authors for this article',
            collection: 'authors',
          }),
          { label: 'Authors', itemLabel: props => props.value ?? '' }
        ),
        imageUrl: fields.image({ label: 'Cover Image', directory: 'src/content/articles', publicPath: 'src/content/articles/' }),
        imageAlt: fields.text({ label: 'Image Alt Text', multiline: false }),
        description: fields.text({ label: 'Description', multiline: true }),
        tags: fields.array(fields.text({ label: 'Tag' }), { label: 'Tags' }),
        content: fields.mdx({ label: 'Content' }),
      },
    }),
  },
});
