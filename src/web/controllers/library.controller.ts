import { Controller, Get, UseGuards } from '@nestjs/common';
import { LibraryQuery } from '../../query/library.query.js';
import { CurrentUser } from '../security/current-user.decorator.js';
import { SessionGuard } from '../security/session.guard.js';
import type { AuthenticatedUser } from '../security/session.service.js';

@Controller('library')
@UseGuards(SessionGuard)
export class LibraryController {
  constructor(private readonly libraryQuery: LibraryQuery) {}

  @Get()
  library(@CurrentUser() user: AuthenticatedUser) {
    return this.libraryQuery.execute(user.id);
  }
}
