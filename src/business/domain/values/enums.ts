export enum VideoCategory {
  COMEDY = 'Comedy',
  FOOD = 'Food',
  DANCE = 'Dance',
  OWAMBE = 'Owambe',
  LIFESTYLE = 'Lifestyle',
}

export enum VideoStatus {
  LIVE = 'live',
  HIDDEN = 'hidden',
  UNDER_REVIEW = 'under_review',
}

export enum LicenceDuration {
  ONE_MONTH = '1m',
  THREE_MONTHS = '3m',
  ONE_YEAR = '1y',
  FOREVER = 'forever',
}

export enum LicenceStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
}

export enum PaymentStatus {
  INITIATED = 'initiated',
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed',
  PARTIAL = 'partial',
  OVERPAID = 'overpaid',
}

export enum PayoutStatus {
  PENDING = 'pending',
  SUCCESSFUL = 'successful',
  FAILED = 'failed',
  REVERSED = 'reversed',
  UNKNOWN = 'unknown',
}

export enum LedgerAccount {
  CREATOR = 'creator',
  PLATFORM = 'platform',
}

export enum LedgerKind {
  SALE = 'sale',
  PAYOUT = 'payout',
  PAYOUT_REVERSAL = 'payout_reversal',
  ADJUSTMENT = 'adjustment',
}

export const CATEGORIES = Object.values(VideoCategory) as string[];
