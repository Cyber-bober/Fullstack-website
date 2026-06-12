//src/types/page.ts

export type NewsPost = {
  id: string;
  title: string;
  content: string;
  imageUrl?: string;
  author: { fullName: string };
  createdAt: string;
};

export type Match = {
  id: string;
  date: string;
  homeTeam: { name: string };
  awayTeam: { name: string };
  venue?: string;
  status: string;
};