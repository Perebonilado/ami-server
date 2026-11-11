import { Injectable } from '@nestjs/common';
import { buildSearchText } from '../../domain/entities/video.js';
import {
  DuplicateFileError,
  FileTooLargeError,
  InvalidVideoError,
  UserNotFoundError,
} from '../../domain/errors/errors.js';
import { CATEGORIES, VideoStatus } from '../../domain/values/enums.js';
import { MAX_FILE_BYTES, MIN_BASE_KOBO } from '../../domain/values/pricing.js';
import type { AiPort } from '../../ports/ai.port.js';
import type { UserRepository } from '../../repositories/user.repository.js';
import type { VideoRepository } from '../../repositories/video.repository.js';
import AbstractRequestHandlerTemplate from '../AbstractRequestHandlerTemplate.js';
import { CommandResponse } from '../response/CommandResponse.js';

const POSTERS = [
  ['#E2552D', '#F2C14E'],
  ['#1A141F', '#3B4A6B'],
  ['#1F5E45', '#C9D66B'],
  ['#1D4E89', '#7FC8F8'],
  ['#C7834E', '#F5E6D3'],
];

export interface CreateVideoRequest {
  creatorId: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  basePriceKobo: number;
  rightsConfirmed: boolean;
  fileName: string;
  fileSizeBytes: number;
  fileSha256: string;
  durationSec: number;
  thumbnailDataUrl: string | null;
}

@Injectable()
export class CreateVideoHandler extends AbstractRequestHandlerTemplate<CreateVideoRequest, { videoId: string }> {
  constructor(
    private readonly videos: VideoRepository,
    private readonly users: UserRepository,
    private readonly ai: AiPort,
    private readonly previewPool: string[],
  ) {
    super();
  }

  protected async handleRequest(request: CreateVideoRequest): Promise<CommandResponse<{ videoId: string }>> {
    const title = request.title.trim();
    if (!title) throw new InvalidVideoError('Add a title.');
    if (!CATEGORIES.includes(request.category)) throw new InvalidVideoError('Pick a category.');
    if (!request.rightsConfirmed) {
      throw new InvalidVideoError('Confirm you made the video and have the rights to it.');
    }
    if (request.fileSizeBytes > MAX_FILE_BYTES) throw new FileTooLargeError();
    if (request.basePriceKobo < MIN_BASE_KOBO) throw new InvalidVideoError('Set a price of at least ₦1,000.');

    const fileSha256 = request.fileSha256.toLowerCase();
    const duplicate = await this.videos.findBySha(fileSha256);
    if (duplicate) throw new DuplicateFileError(duplicate.title);

    const creator = await this.users.findById(request.creatorId);
    if (!creator) throw new UserNotFoundError();

    const description = request.description.trim();
    const tags = [...new Set(request.tags.map((tag) => tag.trim().toLowerCase()).filter(Boolean))].slice(0, 10);
    const aiKeywords = await this.ai
      .videoKeywords({ title, description, category: request.category, tags })
      .catch(() => []);

    const pick = Number.parseInt(fileSha256.slice(0, 8), 16);
    const previewUrl = this.previewPool[pick % this.previewPool.length];
    const [posterFrom, posterTo] = POSTERS[pick % POSTERS.length];

    const video = await this.videos.create({
      creatorId: creator.id,
      title,
      description,
      category: request.category,
      tags,
      aiKeywords,
      searchText: buildSearchText({
        title,
        description,
        category: request.category,
        tags,
        aiKeywords,
        creatorName: creator.name,
      }),
      durationSec: Math.max(1, Math.round(request.durationSec)),
      basePriceKobo: request.basePriceKobo,
      fileSha256,
      fileUrl: previewUrl,
      fileSizeBytes: request.fileSizeBytes,
      previewUrl,
      thumbnailUrl: request.thumbnailDataUrl,
      posterFrom,
      posterTo,
      status: VideoStatus.LIVE,
    });

    return CommandResponse.of({ videoId: video.id });
  }
}
