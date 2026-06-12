//src/types/team.ts

export type Team = {
  id: string;
  name: string;
  logoUrl?: string;
  playersCount: number;
  captain?: {
    fullName: string;
  } | null;
};