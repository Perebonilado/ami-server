import { effectiveLicenceStatus } from '../../business/domain/entities/licence.js';
import { LicenceStatus } from '../../business/domain/values/enums.js';
import { toKobo } from '../../business/domain/values/money.js';
import { type LicenceModel, UserModel, VideoModel } from '../../web/database/models/index.js';

export const CREATOR_INCLUDE = { model: UserModel, as: 'creator' };
export const BUYER_INCLUDE = { model: UserModel, as: 'buyer' };
export const VIDEO_INCLUDE = { model: VideoModel, as: 'video', include: [CREATOR_INCLUDE] };
export const PAID_LICENCE_STATUSES = [LicenceStatus.ACTIVE, LicenceStatus.EXPIRED];

export function iso(date: Date | null | undefined): string | null {
  return date ? new Date(date).toISOString() : null;
}

export function userJson(row: UserModel) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    businessName: row.businessName,
    avatarUrl: row.avatarUrl,
    isAdmin: row.isAdmin,
    verified: row.verified,
    suspended: row.suspended,
    createdAt: iso(row.createdAt as Date),
    socialAccounts: [],
  };
}

export function creatorJson(row: UserModel) {
  return {
    id: row.id,
    name: row.name,
    businessName: row.businessName,
    avatarUrl: row.avatarUrl,
    verified: row.verified,
    socialAccounts: [],
  };
}

export function videoJson(row: VideoModel) {
  return {
    id: row.id,
    creator: creatorJson(row.creator as UserModel),
    title: row.title,
    description: row.description,
    category: row.category,
    tags: row.tags ?? [],
    previewUrl: row.previewUrl,
    thumbnailUrl: row.thumbnailUrl,
    poster: { from: row.posterFrom, to: row.posterTo },
    durationSec: row.durationSec,
    fileSha256: row.fileSha256,
    status: row.status,
    createdAt: iso(row.createdAt as Date),
    basePriceKobo: toKobo(row.basePriceKobo),
  };
}

export function videoSummaryJson(row: VideoModel) {
  return {
    id: row.id,
    title: row.title,
    previewUrl: row.previewUrl,
    thumbnailUrl: row.thumbnailUrl,
    poster: { from: row.posterFrom, to: row.posterTo },
    durationSec: row.durationSec,
    creatorName: row.creator?.name ?? '',
  };
}

export function partJson(row: LicenceModel) {
  return row.partStartSec === null || row.partEndSec === null
    ? null
    : { startSec: row.partStartSec, endSec: row.partEndSec };
}

export function licenceStatus(row: LicenceModel, now: Date): LicenceStatus {
  return effectiveLicenceStatus(row.status, row.endsAt, now);
}

export function licenceJson(row: LicenceModel, now: Date) {
  const buyer = row.buyer as UserModel;
  return {
    id: row.id,
    licenceNumber: row.licenceNumber,
    video: videoSummaryJson(row.video as VideoModel),
    buyer: { id: buyer.id, name: buyer.name, businessName: buyer.businessName },
    part: partJson(row),
    duration: row.duration,
    startsAt: iso(row.startsAt),
    endsAt: iso(row.endsAt),
    priceKobo: toKobo(row.priceKobo),
    platformFeeKobo: toKobo(row.platformFeeKobo),
    creatorShareKobo: toKobo(row.creatorShareKobo),
    status: licenceStatus(row, now),
    createdAt: iso(row.createdAt as Date),
  };
}
