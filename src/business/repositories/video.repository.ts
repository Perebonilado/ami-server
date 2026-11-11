import type { Video, VideoProps } from '../domain/entities/video.js';

export type NewVideo = Omit<VideoProps, 'id'>;

export interface VideoRepository {
  findById(id: string, tx?: unknown): Promise<Video | null>;
  findBySha(fileSha256: string, tx?: unknown): Promise<Video | null>;
  create(video: NewVideo, tx?: unknown): Promise<Video>;
  save(video: Video, tx?: unknown): Promise<void>;
}
