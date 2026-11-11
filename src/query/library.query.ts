import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { LedgerAccount } from '../business/domain/values/enums.js';
import { sumKobo, toKobo } from '../business/domain/values/money.js';
import type { ClockPort } from '../business/ports/clock.port.js';
import { CLOCK_PORT } from '../business/ports/tokens.js';
import { LedgerEntryModel, LicenceModel, type UserModel, VideoModel } from '../web/database/models/index.js';
import {
  BUYER_INCLUDE,
  CREATOR_INCLUDE,
  iso,
  licenceJson,
  licenceStatus,
  PAID_LICENCE_STATUSES,
  partJson,
  VIDEO_INCLUDE,
  videoJson,
} from './shared/serializers.js';

@Injectable()
export class LibraryQuery {
  constructor(
    @InjectModel(VideoModel) private readonly videos: typeof VideoModel,
    @InjectModel(LicenceModel) private readonly licences: typeof LicenceModel,
    @InjectModel(LedgerEntryModel) private readonly ledger: typeof LedgerEntryModel,
    @Inject(CLOCK_PORT) private readonly clock: ClockPort,
  ) {}

  async execute(userId: string) {
    const now = this.clock.now();
    const mine = await this.videos.findAll({
      where: { creatorId: userId },
      include: [CREATOR_INCLUDE],
      order: [['createdAt', 'DESC']],
    });

    const sales = mine.length
      ? await this.licences.findAll({
          where: { videoId: { [Op.in]: mine.map((video) => video.id) }, status: { [Op.in]: PAID_LICENCE_STATUSES } },
          include: [{ model: VideoModel, as: 'video' }, BUYER_INCLUDE],
          order: [['startsAt', 'DESC']],
        })
      : [];

    const bought = await this.licences.findAll({
      where: { buyerId: userId, status: { [Op.in]: PAID_LICENCE_STATUSES } },
      include: [VIDEO_INCLUDE, BUYER_INCLUDE],
      order: [['startsAt', 'DESC']],
    });

    const balance = await this.ledger.sum('amountKobo', { where: { userId, account: LedgerAccount.CREATOR } });

    return {
      totals: {
        videos: mine.length,
        licencesSold: sales.length,
        earningsKobo: sumKobo(sales.map((sale) => sale.creatorShareKobo)),
        pendingPayoutKobo: toKobo(balance ?? 0),
      },
      videos: mine.map((video) => {
        const sold = sales.filter((sale) => sale.videoId === video.id);
        return {
          ...videoJson(video),
          licencesSold: sold.length,
          earningsKobo: sumKobo(sold.map((sale) => sale.creatorShareKobo)),
        };
      }),
      sales: sales.map((sale) => {
        const video = sale.video as VideoModel;
        const buyer = sale.buyer as UserModel;
        return {
          licenceNumber: sale.licenceNumber,
          videoId: video.id,
          videoTitle: video.title,
          videoThumbnailUrl: video.thumbnailUrl,
          videoPoster: { from: video.posterFrom, to: video.posterTo },
          buyerName: buyer.name,
          buyerBusinessName: buyer.businessName,
          part: partJson(sale),
          duration: sale.duration,
          startsAt: iso(sale.startsAt),
          endsAt: iso(sale.endsAt),
          creatorShareKobo: toKobo(sale.creatorShareKobo),
          status: licenceStatus(sale, now),
        };
      }),
      licences: bought.map((licence) => licenceJson(licence, now)),
    };
  }
}
