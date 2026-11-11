import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { UpdateProfileHandler } from '../../business/handlers/identity/update-profile.handler.js';
import { MeQuery } from '../../query/me.query.js';
import { CurrentUser, OptionalUser } from '../security/current-user.decorator.js';
import { OptionalSessionGuard, SessionGuard } from '../security/session.guard.js';
import type { AuthenticatedUser } from '../security/session.service.js';
import { UpdateProfileDto } from '../validation/auth.dto.js';

@Controller('me')
export class MeController {
  constructor(
    private readonly meQuery: MeQuery,
    private readonly updateProfileHandler: UpdateProfileHandler,
  ) {}

  @Get()
  @UseGuards(OptionalSessionGuard)
  me(@OptionalUser() user: AuthenticatedUser | null) {
    return this.meQuery.execute(user?.id ?? null);
  }

  @Patch()
  @UseGuards(SessionGuard)
  async update(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpdateProfileDto) {
    await this.updateProfileHandler.handle({ userId: user.id, ...dto });
    return this.meQuery.execute(user.id);
  }
}
