import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { PaymentNotFoundError } from '../business/domain/errors/errors.js';
import { toKobo } from '../business/domain/values/money.js';
import type { ClockPort } from '../business/ports/clock.port.js';
import { CLOCK_PORT } from '../business/ports/tokens.js';
import { LicenceModel, PaymentModel, type VideoModel } from '../web/database/models/index.js';
import { BUYER_INCLUDE, licenceJson, VIDEO_INCLUDE, videoJson } from './shared/serializers.js';

@Injectable()
export class PaymentSessionQuery {
  constructor(
    @InjectModel(PaymentModel) private readonly payments: typeof PaymentModel,
    @Inject(CLOCK_PORT) private readonly clock: ClockPort,
  ) {}

  async execute(reference: string, userId: string) {
    const row = await this.payments.findOne({
      where: { reference },
      include: [{ model: LicenceModel, as: 'licence', include: [VIDEO_INCLUDE, BUYER_INCLUDE] }],
    });
    if (!row || row.buyerId !== userId) throw new PaymentNotFoundError();
    const licence = row.licence as LicenceModel;
    return {
      reference: row.reference,
      amountKobo: toKobo(row.amountKobo),
      paymentUrl: row.paymentUrl,
      status: row.status,
      licence: licenceJson(licence, this.clock.now()),
      video: videoJson(licence.video as VideoModel),
    };
  }
}
