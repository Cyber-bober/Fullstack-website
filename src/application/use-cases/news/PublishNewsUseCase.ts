import { NewsPost, NewsCategory } from '../../../domain/entities/NewsPost';
import { INewsRepository, PaginatedNews } from '../../../domain/interfaces/INewsRepository';
import { IUserRepository } from '../../../domain/interfaces/IUserRepository';
import { NewsDTO, NewsInput, toNewsDTO } from '../../dtos/NewsDTO';

export class PublishNewsUseCase {
  constructor(
    private readonly newsRepo: INewsRepository,
    private readonly userRepo: IUserRepository,
  ) {}

  async createPost(input: NewsInput, authorId: string): Promise<NewsDTO> {
    const author = await this.userRepo.findById(authorId);
    if (!author) throw new Error('Author not found');
    if (!author.canManageNews()) {
      throw new Error('Only editors and admins can create posts');
    }

    if (!input.title || input.title.length < 3) {
      throw new Error('Title must be at least 3 characters');
    }
    if (!input.content || input.content.length < 10) {
      throw new Error('Content must be at least 10 characters');
    }

    const category = (input.category as NewsCategory) || NewsCategory.GENERAL;

    const post = new NewsPost(
      crypto.randomUUID(),
      authorId,
      input.title,
      input.content,
      new Date(),
      new Date(),
      category,
      input.imageUrl,
      input.matchId,
    );

    post.publish();
    const created = await this.newsRepo.create(post);

    return toNewsDTO(created, {
      id: author.id,
      username: author.username,
      fullName: author.fullName,
    });
  }

  async updatePost(postId: string, input: Partial<NewsInput>, actorId: string): Promise<NewsDTO> {
    const actor = await this.userRepo.findById(actorId);
    if (!actor) throw new Error('Actor not found');

    const post = await this.newsRepo.findById(postId);
    if (!post) throw new Error('Post not found');

    if (!actor.isAdmin() && post.authorId !== actorId) {
      throw new Error('You can only edit your own posts');
    }

    // Convert string category to NewsCategory enum
    const updateData: Partial<Pick<NewsPost, 'title' | 'content' | 'category' | 'imageUrl'>> = {};
    if (input.title !== undefined) updateData.title = input.title;
    if (input.content !== undefined) updateData.content = input.content;
    if (input.category !== undefined) updateData.category = input.category as NewsCategory;
    if (input.imageUrl !== undefined) updateData.imageUrl = input.imageUrl;

    post.update(updateData);
    const updated = await this.newsRepo.update(post);

    return toNewsDTO(updated, {
      id: actor.id,
      username: actor.username,
      fullName: actor.fullName,
    });
  }

  async deletePost(postId: string, actorId: string): Promise<void> {
    const actor = await this.userRepo.findById(actorId);
    if (!actor) throw new Error('Actor not found');

    const post = await this.newsRepo.findById(postId);
    if (!post) throw new Error('Post not found');

    if (!actor.isAdmin() && post.authorId !== actorId) {
      throw new Error('You can only delete your own posts');
    }

    await this.newsRepo.delete(postId);
  }

  async togglePublish(postId: string, actorId: string): Promise<NewsDTO> {
    const actor = await this.userRepo.findById(actorId);
    if (!actor) throw new Error('Actor not found');
    if (!actor.canManageNews()) throw new Error('Permission denied');

    const post = await this.newsRepo.findById(postId);
    if (!post) throw new Error('Post not found');

    if (post.isPublished) {
      post.unpublish();
    } else {
      post.publish();
    }

    const updated = await this.newsRepo.update(post);
    return toNewsDTO(updated, {
      id: actor.id,
      username: actor.username,
      fullName: actor.fullName,
    });
  }

  async getFeed(page: number, pageSize: number): Promise<PaginatedNews> {
    return this.newsRepo.findPublished(page, pageSize);
  }

  async getAllPosts(page: number, pageSize: number, actorId: string): Promise<PaginatedNews> {
    const actor = await this.userRepo.findById(actorId);
    if (!actor || !actor.canManageNews()) throw new Error('Permission denied');
    return this.newsRepo.findAll(page, pageSize);
  }
}
