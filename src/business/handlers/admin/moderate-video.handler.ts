import { Injectable } from '@nestjs/common';
import { VideoNotFoundError } from '../../domain/errors/errors.js';
import type { VideoStatus } from '../../domain/values/enums.js';
import type { VideoRepository } from '../../repositories/video.repository.js';
import AbstractRequestHandlerTemplate from '../AbstractRequestHandlerTemplate.js';
import { CommandResponse } from '../response/CommandResponse.js';

export interface ModerateVideoRequest {
  videoId: string;
  status: VideoStatus;
}

@Injectable()
export class ModerateVideoHandler extends AbstractRequestHandlerTemplate<ModerateVideoRequest, { videoId: string }> {
  constructor(private readonly videos: VideoRepository) {
    super();
  }

  protected async handleRequest(request: ModerateVideoRequest): Promise<CommandResponse<{ videoId: string }>> {
    const video = await this.videos.findById(request.videoId);
    if (!video) throw new VideoNotFoundError();
    video.props.status = request.status;
    await this.videos.save(video);
    return CommandResponse.of({ videoId: video.id });
  }
}
