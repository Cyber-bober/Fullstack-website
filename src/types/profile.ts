// src/types/profile.ts
export interface UserProfile {
  id: string;
  username: string;
  fullName: string;
  city?: string | null;
  position?: string | null;
  contacts?: string | null;
  stats?: string | null;
  birthDate?: Date | string | null;
  photos?: string[] | null;
  team?: { name: string } | null;
  height?: number | null;
  weight?: number | null;
}

export interface ImageCropperProps {
  imageSrc: string;
  onCropComplete: (croppedImage: File) => void;
  onCancel: () => void;
}