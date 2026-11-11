import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op, Transaction } from 'sequelize';
import type { Payout } from '../../business/domain/entities/payout.js';
import { PayoutStatus } from '../../business/domain/values/enums.js';
import type { NewPayout, PayoutRepository } from '../../business/repositories/payout.repository.js';
import { PayoutModel } from '../database/models/index.js';
import { toPayoutEntity } from './mappers.js';

const UNSETTLED = [PayoutStatus.PENDING, PayoutStatus.UNKNOWN];

@Injectable()
export class SequelizePayoutRepository implements PayoutRepository {
  constructor(@InjectModel(PayoutModel) private readonly payouts: typeof PayoutModel) {}

  async findByReferenceForUpdate(reference: string, tx: unknown): Promise<Payout | null> {
    const row = await this.payouts.findOne({
      where: { reference },
      transaction: tx as Transaction,
      lock: Transaction.LOCK.UPDATE,
    });
    return row ? toPayoutEntity(row) : null;
  }

  async findDueForCheck(now: Date, limit: number): Promise<Payout[]> {
    const rows = await this.payouts.findAll({
      where: {
        status: { [Op.in]: UNSETTLED },
        nameEnquiryRef: { [Op.not]: null },
        nextCheckAt: { [Op.lte]: now },
      },
      order: [['nextCheckAt', 'ASC']],
      limit,
    });
    return rows.map(toPayoutEntity);
  }

  async recordCheck(reference: string, attempts: number, nextCheckAt: Date | null): Promise<void> {
    await this.payouts.update(
      { checkAttempts: attempts, nextCheckAt },
      { where: { reference, status: { [Op.in]: UNSETTLED } } },
    );
  }

  async markUnknownIfPending(reference: string, nextCheckAt: Date): Promise<void> {
    await this.payouts.update(
      { status: PayoutStatus.UNKNOWN, nextCheckAt },
      { where: { reference, status: PayoutStatus.PENDING } },
    );
  }

  async saveNameEnquiryRef(reference: string, nameEnquiryRef: string): Promise<void> {
    await this.payouts.update({ nameEnquiryRef }, { where: { reference } });
  }

  async create(payout: NewPayout, tx?: unknown): Promise<Payout> {
    const row = await this.payouts.create({ ...payout }, { transaction: tx as Transaction | undefined });
    return toPayoutEntity(row);
  }

  async save(payout: Payout, tx?: unknown): Promise<void> {
    const { id, ...props } = payout.props;
    await this.payouts.update(props, { where: { id }, transaction: tx as Transaction | undefined });
  }
}
