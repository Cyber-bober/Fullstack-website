// src/types/NewsSection.ts

export interface NewsAuthor {
  id: string;
  fullName: string;
}

export interface NewsPost {
  id: string;
  title: string;
  content: string;
  imageUrl?: string | null;
  createdAt: string;
  author?: NewsAuthor | null;
  authorId?: string;
}

export interface Props {
  news: NewsPost[];
  setNews: (posts: NewsPost[]) => void; 
  userRole?: string | null;
}