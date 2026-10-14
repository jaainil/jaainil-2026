export interface Author {
  id?: string;
  name: string;
  avatarUrl: string;
}


export interface Article {
  id: string;
  title: string;
  category: string;
  publishedAt: string;
  authors: Author[];
  readTime?: string;
  description?: string;
  tags?: string[];
}

export interface TocItem {
  id: string;
  title: string;
}
