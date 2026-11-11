import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { AdminUpdateUserHandler } from '../../business/handlers/admin/update-user.handler.js';
import { ModerateVideoHandler } from '../../business/handlers/admin/moderate-video.handler.js';
import { AdminOverviewQuery } from '../../query/admin-overview.query.js';
import { MeQuery } from '../../query/me.query.js';
import { VideoQuery } from '../../query/video.query.js';
import { CurrentUser } from '../security/current-user.decorator.js';
import { AdminGuard, SessionGuard } from '../security/session.guard.js';
import type { AuthenticatedUser } from '../security/session.service.js';
import { AdminUpdateUserDto, AdminUpdateVideoDto } from '../validation/admin.dto.js';

@Controller('admin')
@UseGuards(SessionGuard, AdminGuard)
export class AdminController {
  constructor(
    private readonly overviewQuery: AdminOverviewQuery,
    private readonly meQuery: MeQuery,
    private readonly videoQuery: VideoQuery,
    private readonly updateUserHandler: AdminUpdateUserHandler,
    private readonly moderateVideoHandler: ModerateVideoHandler,
  ) {}

  @Get()
  overview() {
    return this.overviewQuery.execute();
  }

  @Patch('users/:id')
  async updateUser(@Param('id') id: string, @Body() dto: AdminUpdateUserDto) {
    await this.updateUserHandler.handle({ userId: id, ...dto });
    return this.meQuery.execute(id);
  }

  @Patch('videos/:id')
  async moderateVideo(@CurrentUser() admin: AuthenticatedUser, @Param('id') id: string, @Body() dto: AdminUpdateVideoDto) {
    await this.moderateVideoHandler.handle({ videoId: id, status: dto.status });
    return this.videoQuery.execute(id, admin);
  }
}
