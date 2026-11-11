import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { sumKobo, toKobo } from '../business/domain/values/money.js';
import { LicenceModel, PaymentModel, UserModel, VideoModel } from '../web/database/models/index.js';
import { BUYER_INCLUDE, CREATOR_INCLUDE, iso, PAID_LICENCE_STATUSES, userJson, VIDEO_INCLUDE, videoJson } from './shared/serializers.js';

@Injectable()
export class AdminOverviewQuery {
  constructor(
    @InjectModel(UserModel) private readonly users: typeof UserModel,
    @InjectModel(VideoModel) private readonly videos: typeof VideoModel,
    @InjectModel(LicenceModel) private readonly licences: typeof LicenceModel,
    @InjectModel(PaymentModel) private readonly payments: typeof PaymentModel,
  ) {}

  async execute() {
    const [users, videos, paid, payments] = await Promise.all([
      this.users.findAll({ order: [['createdAt', 'DESC']] }),
      this.videos.findAll({ include: [CREATOR_INCLUDE], order: [['createdAt', 'DESC']] }),
      this.licences.findAll({ where: { status: { [Op.in]: PAID_LICENCE_STATUSES } } }),
      this.payments.findAll({
        include: [{ model: LicenceModel, as: 'licence', include: [VIDEO_INCLUDE, BUYER_INCLUDE] }],
        order: [['createdAt', 'DESC']],
        limit: 200,
      }),
    ]);

    return {
      counts: {
        users: users.length,
        videos: videos.length,
        licencesSold: paid.length,
        totalValueKobo: sumKobo(paid.map((licence) => licence.priceKobo)),
        feesKobo: sumKobo(paid.map((licence) => licence.platformFeeKobo)),
      },
      users: users.map((user) => ({
        ...userJson(user),
        videoCount: videos.filter((video) => video.creatorId === user.id).length,
        licenceCount: paid.filter((licence) => licence.buyerId === user.id).length,
      })),
      videos: videos.map(videoJson),
      transactions: payments.map((payment) => {
        const licence = payment.licence as LicenceModel;
        const video = licence.video as VideoModel;
        return {
          reference: payment.reference,
          licenceNumber: licence.licenceNumber,
          videoTitle: video.title,
          buyerName: (licence.buyer as UserModel).name,
          creatorName: (video.creator as UserModel).name,
          amountKobo: toKobo(payment.amountKobo),
          platformFeeKobo: toKobo(licence.platformFeeKobo),
          status: payment.status,
          paidAt: iso(payment.paidAt),
        };
      }),
    };
  }
}
