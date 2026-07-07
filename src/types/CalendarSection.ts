// src/types/CalendarSection.ts

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

export interface Props {
  matches: Match[];
  onDeleteMatch?: (id: string) => void;
  deletingId?: string | null;
}