export interface Author {
  name: string;
  avatarUrl: string;
}

export interface Article {
  id: string;
  title: string;
  category: string;
  date: string;
  authors: Author[];
  imageUrl: string;
  readTime?: string;
  imageAlt?: string;
  description?: string;
  tags?: string[];
}

export interface TocItem {
  id: string;
  title: string;
}
