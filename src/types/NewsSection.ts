//src/types/NewsSection.ts

export type NewsPost = {
  id: string;
  title: string;
  content: string;
  imageUrl?: string;
  author: { fullName: string };
  createdAt: string;
};

export type Props = {
  news: NewsPost[];
  setNews: React.Dispatch<React.SetStateAction<NewsPost[]>>;
  userRole: string | null;
};