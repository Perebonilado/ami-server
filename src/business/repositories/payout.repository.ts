import type { Payout, PayoutProps } from '../domain/entities/payout.js';

export type NewPayout = Omit<PayoutProps, 'id'>;

export interface PayoutRepository {
  findByReferenceForUpdate(reference: string, tx: unknown): Promise<Payout | null>;
  findDueForCheck(now: Date, limit: number): Promise<Payout[]>;
  recordCheck(reference: string, attempts: number, nextCheckAt: Date | null): Promise<void>;
  markUnknownIfPending(reference: string, nextCheckAt: Date): Promise<void>;
  saveNameEnquiryRef(reference: string, nameEnquiryRef: string): Promise<void>;
  create(payout: NewPayout, tx?: unknown): Promise<Payout>;
  save(payout: Payout, tx?: unknown): Promise<void>;
}
