import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { DownloadLinkQuery } from '../../query/download-link.query.js';
import { LicenceCheckQuery } from '../../query/licence-check.query.js';
import { LicenceQuery } from '../../query/licence.query.js';
import { CurrentUser } from '../security/current-user.decorator.js';
import { SessionGuard } from '../security/session.guard.js';
import type { AuthenticatedUser } from '../security/session.service.js';

@Controller()
export class LicencesController {
  constructor(
    private readonly licenceQuery: LicenceQuery,
    private readonly downloadLinkQuery: DownloadLinkQuery,
    private readonly licenceCheckQuery: LicenceCheckQuery,
  ) {}

  @Get('licences/:number')
  @UseGuards(SessionGuard)
  licence(@CurrentUser() user: AuthenticatedUser, @Param('number') licenceNumber: string) {
    return this.licenceQuery.execute(licenceNumber, user);
  }

  @Get('licences/:number/download')
  @UseGuards(SessionGuard)
  download(@CurrentUser() user: AuthenticatedUser, @Param('number') licenceNumber: string) {
    return this.downloadLinkQuery.execute(licenceNumber, user.id);
  }

  @Get('check/:number')
  check(@Param('number') licenceNumber: string) {
    return this.licenceCheckQuery.execute(licenceNumber);
  }
}
