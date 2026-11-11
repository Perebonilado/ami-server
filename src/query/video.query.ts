import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { VideoNotFoundError } from '../business/domain/errors/errors.js';
import { VideoStatus } from '../business/domain/values/enums.js';
import { VideoModel } from '../web/database/models/index.js';
import { CREATOR_INCLUDE, videoJson } from './shared/serializers.js';

export interface Viewer {
  id: string;
  isAdmin: boolean;
}

@Injectable()
export class VideoQuery {
  constructor(@InjectModel(VideoModel) private readonly videos: typeof VideoModel) {}

  async execute(id: string, viewer: Viewer | null) {
    const row = await this.videos.findByPk(id, { include: [CREATOR_INCLUDE] });
    const canSeeHidden = viewer !== null && (viewer.isAdmin || viewer.id === row?.creatorId);
    if (!row || (row.status !== VideoStatus.LIVE && !canSeeHidden)) throw new VideoNotFoundError();
    return { video: videoJson(row) };
  }
}
