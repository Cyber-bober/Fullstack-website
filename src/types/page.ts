// src/types/page.ts

import { NewsPost as NewsPostType } from "./NewsSection";

export interface Match {
  id: string;
  homeTeam: { name: string };
  awayTeam: { name: string };
  date: string;
  status: string;
  score?: string | null;
}

export type NewsPost = NewsPostType; 