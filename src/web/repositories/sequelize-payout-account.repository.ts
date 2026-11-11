import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import type { Transaction } from 'sequelize';
import type { PayoutAccount, PayoutAccountRepository } from '../../business/repositories/payout-account.repository.js';
import { PayoutAccountModel } from '../database/models/index.js';
import { toPayoutAccount } from './mappers.js';

@Injectable()
export class SequelizePayoutAccountRepository implements PayoutAccountRepository {
  constructor(@InjectModel(PayoutAccountModel) private readonly accounts: typeof PayoutAccountModel) {}

  async findByUserId(userId: string, tx?: unknown): Promise<PayoutAccount | null> {
    const row = await this.accounts.findOne({ where: { userId }, transaction: tx as Transaction | undefined });
    return row ? toPayoutAccount(row) : null;
  }

  async upsert(account: Omit<PayoutAccount, 'id'>, tx?: unknown): Promise<PayoutAccount> {
    const transaction = tx as Transaction | undefined;
    const existing = await this.accounts.findOne({ where: { userId: account.userId }, transaction });
    if (existing) {
      await existing.update({ ...account }, { transaction });
      return toPayoutAccount(existing);
    }
    return toPayoutAccount(await this.accounts.create({ ...account }, { transaction }));
  }
}
