//src/types/CalendarSection.ts

export type Match = {
  id: string;
  date: string;
  homeTeam: { name: string };
  awayTeam: { name: string };
  venue?: string;
  status: string;
};

export type Props = {
  matches: Match[];
};