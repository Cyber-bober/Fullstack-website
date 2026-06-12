//src/types/TeamSection.ts

export type Player = {
  id: string;
  username: string;
  fullName: string;
  position?: string;
  photos: string[];
};

export type Team = {
  id: string;
  name: string;
  captainId?: string;
  players: Player[];
};

export type Props = {
  teams: Team[];
};