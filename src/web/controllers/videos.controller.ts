import { Body, Controller, Get, HttpCode, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { CreateVideoHandler } from '../../business/handlers/videos/create-video.handler.js';
import { UpdateVideoHandler } from '../../business/handlers/videos/update-video.handler.js';
import { SearchVideosQuery } from '../../query/search-videos.query.js';
import { VideoQuery } from '../../query/video.query.js';
import { CurrentUser, OptionalUser } from '../security/current-user.decorator.js';
import { OptionalSessionGuard, SessionGuard } from '../security/session.guard.js';
import type { AuthenticatedUser } from '../security/session.service.js';
import { CreateVideoDto, UpdateVideoDto, VideoSearchDto } from '../validation/video.dto.js';

@Controller('videos')
export class VideosController {
  constructor(
    private readonly searchVideosQuery: SearchVideosQuery,
    private readonly videoQuery: VideoQuery,
    private readonly createVideoHandler: CreateVideoHandler,
    private readonly updateVideoHandler: UpdateVideoHandler,
  ) {}

  @Get()
  list(@Query() dto: VideoSearchDto) {
    return this.searchVideosQuery.execute(dto);
  }

  @Get(':id')
  @UseGuards(OptionalSessionGuard)
  get(@Param('id') id: string, @OptionalUser() user: AuthenticatedUser | null) {
    return this.videoQuery.execute(id, user);
  }

  @Post()
  @HttpCode(201)
  @UseGuards(SessionGuard)
  async create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateVideoDto) {
    const { data } = await this.createVideoHandler.handle({
      ...dto,
      creatorId: user.id,
      tags: dto.tags ?? [],
      thumbnailDataUrl: dto.thumbnailDataUrl ?? null,
    });
    return this.videoQuery.execute(data.videoId, user);
  }

  @Patch(':id')
  @UseGuards(SessionGuard)
  async update(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: UpdateVideoDto) {
    await this.updateVideoHandler.handle({ ...dto, userId: user.id, videoId: id });
    return this.videoQuery.execute(id, user);
  }
}
