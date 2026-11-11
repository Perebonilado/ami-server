import type { Payment, PaymentProps } from '../domain/entities/payment.js';

export type NewPayment = Omit<PaymentProps, 'id'>;

export interface PaymentRepository {
  findByReference(reference: string, tx?: unknown): Promise<Payment | null>;
  findByReferenceForUpdate(reference: string, tx: unknown): Promise<Payment | null>;
  findDueForCheck(now: Date, limit: number): Promise<Payment[]>;
  recordCheck(reference: string, attempts: number, nextCheckAt: Date | null): Promise<void>;
  create(payment: NewPayment, tx?: unknown): Promise<Payment>;
  save(payment: Payment, tx?: unknown): Promise<void>;
}
