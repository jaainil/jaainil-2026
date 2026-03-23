export interface Author {
  id?: string;
  name: string;
  avatarUrl: string;
}

import type { ImageMetadata } from 'astro';

export interface Article {
  id: string;
  title: string;
  category: string;
  publishedAt: string;
  authors: Author[];
  imageUrl: ImageMetadata;
  readTime?: string;
  imageAlt?: string;
  description?: string;
  tags?: string[];
}

export interface TocItem {
  id: string;
  title: string;
}
