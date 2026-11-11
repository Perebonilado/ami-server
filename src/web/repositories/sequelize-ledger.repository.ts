import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import type { Transaction } from 'sequelize';
import { LedgerAccount, type LedgerKind } from '../../business/domain/values/enums.js';
import { toKobo } from '../../business/domain/values/money.js';
import type { LedgerEntry, LedgerRepository } from '../../business/repositories/ledger.repository.js';
import { LedgerEntryModel } from '../database/models/index.js';

@Injectable()
export class SequelizeLedgerRepository implements LedgerRepository {
  constructor(@InjectModel(LedgerEntryModel) private readonly entries: typeof LedgerEntryModel) {}

  async add(entries: LedgerEntry[], tx?: unknown): Promise<void> {
    await this.entries.bulkCreate(
      entries.map((entry) => ({ ...entry })),
      { transaction: tx as Transaction | undefined },
    );
  }

  async creatorBalance(userId: string, tx?: unknown): Promise<number> {
    const total = await this.entries.sum('amountKobo', {
      where: { userId, account: LedgerAccount.CREATOR },
      transaction: tx as Transaction | undefined,
    });
    return toKobo(total ?? 0);
  }

  async hasEntry(kind: LedgerKind, ref: { licenceId?: string; payoutId?: string }, tx?: unknown): Promise<boolean> {
    const where = ref.licenceId ? { kind, licenceId: ref.licenceId } : { kind, payoutId: ref.payoutId };
    return (await this.entries.count({ where, transaction: tx as Transaction | undefined })) > 0;
  }
}
