import { Licence } from '../../business/domain/entities/licence.js';
import { Payment } from '../../business/domain/entities/payment.js';
import { Payout } from '../../business/domain/entities/payout.js';
import { User } from '../../business/domain/entities/user.js';
import { Video } from '../../business/domain/entities/video.js';
import { toKobo } from '../../business/domain/values/money.js';
import type { PayoutAccount } from '../../business/repositories/payout-account.repository.js';
import type {
  LicenceModel,
  PaymentModel,
  PayoutAccountModel,
  PayoutModel,
  UserModel,
  VideoModel,
} from '../database/models/index.js';

export function toUserEntity(row: UserModel): User {
  return new User({
    id: row.id,
    name: row.name,
    email: row.email,
    passwordHash: row.passwordHash,
    businessName: row.businessName,
    avatarUrl: row.avatarUrl,
    isAdmin: row.isAdmin,
    verified: row.verified,
    suspended: row.suspended,
  });
}

export function toVideoEntity(row: VideoModel): Video {
  return new Video({
    id: row.id,
    creatorId: row.creatorId,
    title: row.title,
    description: row.description,
    category: row.category,
    tags: row.tags ?? [],
    aiKeywords: row.aiKeywords ?? [],
    searchText: row.searchText,
    durationSec: row.durationSec,
    basePriceKobo: toKobo(row.basePriceKobo),
    fileSha256: row.fileSha256,
    fileUrl: row.fileUrl,
    fileSizeBytes: toKobo(row.fileSizeBytes),
    previewUrl: row.previewUrl,
    thumbnailUrl: row.thumbnailUrl,
    posterFrom: row.posterFrom,
    posterTo: row.posterTo,
    status: row.status,
  });
}

export function toLicenceEntity(row: LicenceModel): Licence {
  return new Licence({
    id: row.id,
    licenceNumber: row.licenceNumber,
    videoId: row.videoId,
    buyerId: row.buyerId,
    partStartSec: row.partStartSec,
    partEndSec: row.partEndSec,
    duration: row.duration,
    priceKobo: toKobo(row.priceKobo),
    platformFeeKobo: toKobo(row.platformFeeKobo),
    creatorShareKobo: toKobo(row.creatorShareKobo),
    status: row.status,
    startsAt: row.startsAt,
    endsAt: row.endsAt,
  });
}

export function toPaymentEntity(row: PaymentModel): Payment {
  return new Payment({
    id: row.id,
    licenceId: row.licenceId,
    buyerId: row.buyerId,
    reference: row.reference,
    idempotencyKey: row.idempotencyKey,
    paymentUrl: row.paymentUrl,
    amountKobo: toKobo(row.amountKobo),
    feeKobo: toKobo(row.feeKobo),
    channel: row.channel,
    status: row.status,
    paidAt: row.paidAt,
    bankRequestId: row.bankRequestId,
    checkAttempts: row.checkAttempts,
    nextCheckAt: row.nextCheckAt,
  });
}

export function toPayoutEntity(row: PayoutModel): Payout {
  return new Payout({
    id: row.id,
    userId: row.userId,
    payoutAccountId: row.payoutAccountId,
    bankCode: row.bankCode,
    accountNumber: row.accountNumber,
    amountKobo: toKobo(row.amountKobo),
    feeKobo: toKobo(row.feeKobo),
    vatKobo: toKobo(row.vatKobo),
    stampDutyKobo: toKobo(row.stampDutyKobo),
    reference: row.reference,
    idempotencyKey: row.idempotencyKey,
    nameEnquiryRef: row.nameEnquiryRef,
    sessionId: row.sessionId,
    status: row.status,
    settledAt: row.settledAt,
    checkAttempts: row.checkAttempts,
    nextCheckAt: row.nextCheckAt,
  });
}

export function toPayoutAccount(row: PayoutAccountModel): PayoutAccount {
  return {
    id: row.id,
    userId: row.userId,
    bankCode: row.bankCode,
    bankName: row.bankName,
    accountNumber: row.accountNumber,
    accountName: row.accountName,
    verifiedAt: row.verifiedAt,
  };
}
