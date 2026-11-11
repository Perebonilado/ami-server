import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { LicenceNotActiveError, LicenceNotFoundError } from '../business/domain/errors/errors.js';
import { LicenceStatus } from '../business/domain/values/enums.js';
import { normaliseLicenceNumber } from '../business/domain/values/licence-number.js';
import type { ClockPort } from '../business/ports/clock.port.js';
import { CLOCK_PORT } from '../business/ports/tokens.js';
import { LicenceModel, VideoModel } from '../web/database/models/index.js';
import { iso, licenceStatus } from './shared/serializers.js';

const LINK_TTL_MS = 15 * 60 * 1000;

@Injectable()
export class DownloadLinkQuery {
  constructor(
    @InjectModel(LicenceModel) private readonly licences: typeof LicenceModel,
    @Inject(CLOCK_PORT) private readonly clock: ClockPort,
  ) {}

  async execute(licenceNumber: string, userId: string) {
    const row = await this.licences.findOne({
      where: { licenceNumber: normaliseLicenceNumber(licenceNumber) },
      include: [{ model: VideoModel, as: 'video' }],
    });
    if (!row || row.buyerId !== userId) throw new LicenceNotFoundError();
    const now = this.clock.now();
    if (licenceStatus(row, now) !== LicenceStatus.ACTIVE) throw new LicenceNotActiveError();
    return { url: (row.video as VideoModel).fileUrl, expiresAt: iso(new Date(now.getTime() + LINK_TTL_MS)) };
  }
}
