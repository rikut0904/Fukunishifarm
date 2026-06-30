export type MicroCmsImage = {
  url: string;
  height?: number;
  width?: number;
};

export type BlogCategory = {
  id: string;
  name: string;
};

export type BlogPost = {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  content?: string | null;
  body?: string | null;
  eyecatch?: MicroCmsImage | null;
  category?: BlogCategory | null;
  publishedAt: string;
  revisedAt?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type BlogPostInput = {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
};

export type BlogCatalogResponse = {
  contents: BlogPost[];
  totalCount: number;
  offset: number;
  limit: number;
};

export type PublicBlogCatalogState = {
  posts: BlogPost[] | null;
  errorMessage: string | null;
};

export type PublicBlogPostState = {
  post: BlogPost | null;
  errorMessage: string | null;
};

