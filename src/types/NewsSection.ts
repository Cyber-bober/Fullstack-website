// src/types/NewsSection.ts

export interface NewsAuthor {
  id: string;
  fullName: string;
  username: string;
}

export interface NewsPost {
  id: string;
  title: string;
  content: string;
  category?: string;
  imageUrl?: string | null;
  isPublished: boolean;
  createdAt: string;
  author?: NewsAuthor | null;
  authorId?: string;
}

export interface Props {
  news: NewsPost[];
  setNews: (posts: NewsPost[]) => void; 
  userRole?: string | null;
  currentUserId?: string;
}