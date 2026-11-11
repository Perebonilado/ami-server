import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op, Transaction } from 'sequelize';
import type { Payment } from '../../business/domain/entities/payment.js';
import { PaymentStatus } from '../../business/domain/values/enums.js';
import type { NewPayment, PaymentRepository } from '../../business/repositories/payment.repository.js';
import { PaymentModel } from '../database/models/index.js';
import { toPaymentEntity } from './mappers.js';

const UNSETTLED = [PaymentStatus.INITIATED, PaymentStatus.PENDING];

@Injectable()
export class SequelizePaymentRepository implements PaymentRepository {
  constructor(@InjectModel(PaymentModel) private readonly payments: typeof PaymentModel) {}

  async findByReference(reference: string, tx?: unknown): Promise<Payment | null> {
    const row = await this.payments.findOne({ where: { reference }, transaction: tx as Transaction | undefined });
    return row ? toPaymentEntity(row) : null;
  }

  async findByReferenceForUpdate(reference: string, tx: unknown): Promise<Payment | null> {
    const row = await this.payments.findOne({
      where: { reference },
      transaction: tx as Transaction,
      lock: Transaction.LOCK.UPDATE,
    });
    return row ? toPaymentEntity(row) : null;
  }

  async findDueForCheck(now: Date, limit: number): Promise<Payment[]> {
    const rows = await this.payments.findAll({
      where: {
        status: { [Op.in]: UNSETTLED },
        paymentUrl: { [Op.not]: null },
        nextCheckAt: { [Op.lte]: now },
      },
      order: [['nextCheckAt', 'ASC']],
      limit,
    });
    return rows.map(toPaymentEntity);
  }

  async recordCheck(reference: string, attempts: number, nextCheckAt: Date | null): Promise<void> {
    await this.payments.update(
      { checkAttempts: attempts, nextCheckAt },
      { where: { reference, status: { [Op.in]: UNSETTLED } } },
    );
  }

  async create(payment: NewPayment, tx?: unknown): Promise<Payment> {
    const row = await this.payments.create({ ...payment }, { transaction: tx as Transaction | undefined });
    return toPaymentEntity(row);
  }

  async save(payment: Payment, tx?: unknown): Promise<void> {
    const { id, ...props } = payment.props;
    await this.payments.update(props, { where: { id }, transaction: tx as Transaction | undefined });
  }
}
