//src/types/teamid.ts

export type Player = {
  id: string;
  fullName: string;
  position?: string;
  username: string;
  photos: string[];
  isCaptain?: boolean;
};

export type Team = {
  id: string;
  name: string;
  logoUrl?: string;
  photos: string[];
  captainId?: string;
  players: Player[];
};