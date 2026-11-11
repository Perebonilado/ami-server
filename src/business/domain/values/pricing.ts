import BigNumber from 'bignumber.js';
import { InvalidPartError } from '../errors/errors.js';
import { LicenceDuration } from './enums.js';
import { money, toKobo } from './money.js';

export const PLATFORM_FEE_RATE = '0.15';
export const SUGGESTED_BASE_KOBO = 500_000;
export const MIN_BASE_KOBO = 100_000;
export const MIN_PRICE_KOBO = 100_000;
export const ROUND_TO_KOBO = 50_000;
export const MIN_PART_SHARE = '0.25';
export const MIN_PART_SEC = 2;
export const MIN_PAYOUT_KOBO = 100_000;
export const MAX_FILE_BYTES = 200 * 1024 * 1024;

export interface LicencePart {
  startSec: number;
  endSec: number;
}

const DURATION_RULES: Record<LicenceDuration, { multiplier: number; days: number | null }> = {
  [LicenceDuration.ONE_MONTH]: { multiplier: 1, days: 30 },
  [LicenceDuration.THREE_MONTHS]: { multiplier: 2, days: 90 },
  [LicenceDuration.ONE_YEAR]: { multiplier: 3, days: 365 },
  [LicenceDuration.FOREVER]: { multiplier: 4, days: null },
};

export function cleanPart(part: LicencePart | null | undefined, videoSec: number): LicencePart | null {
  if (!part) return null;
  const startSec = Math.max(0, Math.floor(part.startSec));
  const endSec = Math.min(Math.ceil(videoSec), Math.ceil(part.endSec));
  if (!Number.isFinite(startSec) || !Number.isFinite(endSec)) {
    throw new InvalidPartError('Choose which part of the video you need.');
  }
  if (endSec - startSec < MIN_PART_SEC) {
    throw new InvalidPartError(`A part has to be at least ${MIN_PART_SEC} seconds long.`);
  }
  if (startSec === 0 && endSec >= Math.ceil(videoSec)) return null;
  return { startSec, endSec };
}

export function licencePriceKobo(
  baseKobo: number,
  videoSec: number,
  part: LicencePart | null,
  duration: LicenceDuration,
): number {
  const share =
    part && videoSec > 0
      ? BigNumber.max(MIN_PART_SHARE, money(part.endSec - part.startSec).dividedBy(videoSec))
      : money(1);
  const raw = money(baseKobo).times(share).times(DURATION_RULES[duration].multiplier);
  const rounded = raw.dividedBy(ROUND_TO_KOBO).integerValue(BigNumber.ROUND_CEIL).times(ROUND_TO_KOBO);
  return toKobo(BigNumber.max(MIN_PRICE_KOBO, rounded));
}

export function splitPrice(priceKobo: number): { platformFeeKobo: number; creatorShareKobo: number } {
  const fee = money(priceKobo).times(PLATFORM_FEE_RATE).integerValue(BigNumber.ROUND_HALF_UP);
  return {
    platformFeeKobo: toKobo(fee),
    creatorShareKobo: toKobo(money(priceKobo).minus(fee)),
  };
}

export function licenceEndDate(start: Date, duration: LicenceDuration): Date | null {
  const days = DURATION_RULES[duration].days;
  if (days === null) return null;
  return new Date(start.getTime() + days * 24 * 60 * 60 * 1000);
}
