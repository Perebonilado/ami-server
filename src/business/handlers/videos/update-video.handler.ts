import { Injectable } from '@nestjs/common';
import { buildSearchText } from '../../domain/entities/video.js';
import { InvalidVideoError, NotVideoOwnerError, UserNotFoundError, VideoNotFoundError } from '../../domain/errors/errors.js';
import { VideoStatus } from '../../domain/values/enums.js';
import { MIN_BASE_KOBO } from '../../domain/values/pricing.js';
import type { UserRepository } from '../../repositories/user.repository.js';
import type { VideoRepository } from '../../repositories/video.repository.js';
import AbstractRequestHandlerTemplate from '../AbstractRequestHandlerTemplate.js';
import { CommandResponse } from '../response/CommandResponse.js';

export interface UpdateVideoRequest {
  userId: string;
  videoId: string;
  title?: string;
  description?: string;
  status?: VideoStatus.LIVE | VideoStatus.HIDDEN;
  basePriceKobo?: number;
}

@Injectable()
export class UpdateVideoHandler extends AbstractRequestHandlerTemplate<UpdateVideoRequest, { videoId: string }> {
  constructor(
    private readonly videos: VideoRepository,
    private readonly users: UserRepository,
  ) {
    super();
  }

  protected async handleRequest(request: UpdateVideoRequest): Promise<CommandResponse<{ videoId: string }>> {
    const video = await this.videos.findById(request.videoId);
    if (!video) throw new VideoNotFoundError();
    if (!video.isOwnedBy(request.userId)) throw new NotVideoOwnerError();

    if (request.title !== undefined) {
      const title = request.title.trim();
      if (!title) throw new InvalidVideoError('Add a title.');
      video.props.title = title;
    }
    if (request.description !== undefined) video.props.description = request.description.trim();
    if (request.basePriceKobo !== undefined) {
      if (request.basePriceKobo < MIN_BASE_KOBO) throw new InvalidVideoError('Set a price of at least ₦1,000.');
      video.props.basePriceKobo = request.basePriceKobo;
    }
    if (request.status !== undefined) {
      if (video.props.status === VideoStatus.UNDER_REVIEW) {
        throw new InvalidVideoError('This video is being reviewed by the Àmì team.');
      }
      video.props.status = request.status;
    }

    const creator = await this.users.findById(video.creatorId);
    if (!creator) throw new UserNotFoundError();
    video.props.searchText = buildSearchText({ ...video.props, creatorName: creator.name });

    await this.videos.save(video);
    return CommandResponse.of({ videoId: video.id });
  }
}
