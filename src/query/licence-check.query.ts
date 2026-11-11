import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { LicenceStatus } from '../business/domain/values/enums.js';
import { normaliseLicenceNumber } from '../business/domain/values/licence-number.js';
import type { ClockPort } from '../business/ports/clock.port.js';
import { CLOCK_PORT } from '../business/ports/tokens.js';
import { LicenceModel, type UserModel, type VideoModel } from '../web/database/models/index.js';
import { BUYER_INCLUDE, iso, licenceStatus, partJson, VIDEO_INCLUDE, videoSummaryJson } from './shared/serializers.js';

@Injectable()
export class LicenceCheckQuery {
  constructor(
    @InjectModel(LicenceModel) private readonly licences: typeof LicenceModel,
    @Inject(CLOCK_PORT) private readonly clock: ClockPort,
  ) {}

  async execute(licenceNumber: string) {
    const row = await this.licences.findOne({
      where: { licenceNumber: normaliseLicenceNumber(licenceNumber) },
      include: [VIDEO_INCLUDE, BUYER_INCLUDE],
    });
    const status = row ? licenceStatus(row, this.clock.now()) : null;
    if (!row || (status !== LicenceStatus.ACTIVE && status !== LicenceStatus.EXPIRED)) {
      return { status: 'not_found', licence: null };
    }

    const video = row.video as VideoModel;
    const creator = video.creator as UserModel;
    const buyer = row.buyer as UserModel;
    return {
      status: status === LicenceStatus.ACTIVE ? 'valid' : 'expired',
      licence: {
        licenceNumber: row.licenceNumber,
        video: videoSummaryJson(video),
        creator: { name: creator.name, verified: creator.verified },
        buyer: { name: buyer.name, businessName: buyer.businessName },
        part: partJson(row),
        duration: row.duration,
        startsAt: iso(row.startsAt),
        endsAt: iso(row.endsAt),
      },
    };
  }
}
