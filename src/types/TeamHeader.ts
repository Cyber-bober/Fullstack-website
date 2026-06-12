//src/types/TeamHeader.ts

export type TeamHeaderProps = {
  team: {
    id: string;
    name: string;
    logoUrl?: string;
    photos: string[];
    players: any[];
  };
  canManage: boolean;
  uploading: boolean;
  onUploadLogo: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onUploadPhoto: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveLogo: () => void;
  onRemovePhoto: (url: string) => void;
  onAddPlayer: () => void;
};