// src/types/page.ts

import { NewsPost as NewsPostType } from "./NewsSection";

export interface Match {
  id: string;
  homeTeamId: string;
  awayTeamId: string;
  homeTeam: { id: string; name: string; logoUrl?: string | null };
  awayTeam: { id: string; name: string; logoUrl?: string | null };
  date: string;
  status: string;
  score?: string | null;
  venue?: string | null;
  stats?: string | null;
}

export type NewsPost = NewsPostType;