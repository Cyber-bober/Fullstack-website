//src/types/PlayerCard.ts

export type PlayerCardProps = {
  player: {
    id: string;
    fullName: string;
    position?: string;
    username: string;
    photos: string[];
    isCaptain?: boolean;
  };
  canManage: boolean;
  isAdmin: boolean;
  onSetCaptain: (userId: string) => void;
  onRemovePlayer: (userId: string) => void;
};