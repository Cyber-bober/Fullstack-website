//src/types/addPlayer.ts

export type SearchUser = {
  id: string;
  fullName: string;
  username: string;
  photos: string[];
  teamId?: string | null;
};

export type AddPlayerFormProps = {
  onAddPlayer: (userId: string) => void;
  addingPlayer: boolean;
};
