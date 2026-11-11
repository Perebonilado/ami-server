import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import type { Transaction } from 'sequelize';
import type { Video } from '../../business/domain/entities/video.js';
import type { NewVideo, VideoRepository } from '../../business/repositories/video.repository.js';
import { VideoModel } from '../database/models/index.js';
import { toVideoEntity } from './mappers.js';

@Injectable()
export class SequelizeVideoRepository implements VideoRepository {
  constructor(@InjectModel(VideoModel) private readonly videos: typeof VideoModel) {}

  async findById(id: string, tx?: unknown): Promise<Video | null> {
    const row = await this.videos.findByPk(id, { transaction: tx as Transaction | undefined });
    return row ? toVideoEntity(row) : null;
  }

  async findBySha(fileSha256: string, tx?: unknown): Promise<Video | null> {
    const row = await this.videos.findOne({ where: { fileSha256 }, transaction: tx as Transaction | undefined });
    return row ? toVideoEntity(row) : null;
  }

  async create(video: NewVideo, tx?: unknown): Promise<Video> {
    const row = await this.videos.create({ ...video }, { transaction: tx as Transaction | undefined });
    return toVideoEntity(row);
  }

  async save(video: Video, tx?: unknown): Promise<void> {
    const { id, ...props } = video.props;
    await this.videos.update(props, { where: { id }, transaction: tx as Transaction | undefined });
  }
}
