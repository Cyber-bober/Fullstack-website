import { NewsPost, NewsCategory } from '../../domain/entities/NewsPost';
import { UserDTO } from './UserDTO';

export interface NewsDTO {
  id: string;
  title: string;
  content: string;
  preview: string;
  category: string;
  imageUrl?: string;
  matchId?: string;
  isPublished: boolean;
  author: Pick<UserDTO, 'id' | 'username' | 'fullName'>;
  createdAt: string;
  updatedAt: string;
}

export interface NewsInput {
  title: string;
  content: string;
  category?: string;
  imageUrl?: string;
  matchId?: string;
}

export function toNewsDTO(post: NewsPost, author: Pick<UserDTO, 'id' | 'username' | 'fullName'>): NewsDTO {
  return {
    id: post.id,
    title: post.title,
    content: post.content,
    preview: post.getPreview(150),
    category: post.category,
    imageUrl: post.imageUrl,
    matchId: post.matchId,
    isPublished: post.isPublished,
    author,
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt.toISOString(),
  };
}
