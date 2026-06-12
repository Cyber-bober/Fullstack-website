//src/types/LiveSection.ts

export type Match = {
  id: string;
  date: string;
  homeTeam: { name: string };
  awayTeam: { name: string };
  venue?: string;
  status: string;
};

export type MatchEvent = {
  id: string;
  minute?: number;
  text: string;
  createdAt: string;
};

export type Props = {
  matches: Match[];
  userRole: string | null;
};