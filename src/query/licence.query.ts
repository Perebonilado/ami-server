import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { LicenceNotFoundError } from '../business/domain/errors/errors.js';
import { normaliseLicenceNumber } from '../business/domain/values/licence-number.js';
import type { ClockPort } from '../business/ports/clock.port.js';
import { CLOCK_PORT } from '../business/ports/tokens.js';
import { LicenceModel, type VideoModel } from '../web/database/models/index.js';
import { BUYER_INCLUDE, licenceJson, VIDEO_INCLUDE } from './shared/serializers.js';
import type { Viewer } from './video.query.js';

@Injectable()
export class LicenceQuery {
  constructor(
    @InjectModel(LicenceModel) private readonly licences: typeof LicenceModel,
    @Inject(CLOCK_PORT) private readonly clock: ClockPort,
  ) {}

  async execute(licenceNumber: string, viewer: Viewer) {
    const row = await this.licences.findOne({
      where: { licenceNumber: normaliseLicenceNumber(licenceNumber) },
      include: [VIDEO_INCLUDE, BUYER_INCLUDE],
    });
    const creatorId = (row?.video as VideoModel | undefined)?.creatorId;
    if (!row || (row.buyerId !== viewer.id && creatorId !== viewer.id && !viewer.isAdmin)) {
      throw new LicenceNotFoundError();
    }
    return { licence: licenceJson(row, this.clock.now()) };
  }
}
