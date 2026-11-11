import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { LedgerAccount } from '../business/domain/values/enums.js';
import { toKobo } from '../business/domain/values/money.js';
import { LedgerEntryModel, PayoutAccountModel, PayoutModel } from '../web/database/models/index.js';
import { iso } from './shared/serializers.js';

@Injectable()
export class PayoutsQuery {
  constructor(
    @InjectModel(LedgerEntryModel) private readonly ledger: typeof LedgerEntryModel,
    @InjectModel(PayoutAccountModel) private readonly accounts: typeof PayoutAccountModel,
    @InjectModel(PayoutModel) private readonly payouts: typeof PayoutModel,
  ) {}

  async execute(userId: string) {
    const [balance, account, payouts] = await Promise.all([
      this.ledger.sum('amountKobo', { where: { userId, account: LedgerAccount.CREATOR } }),
      this.accounts.findOne({ where: { userId } }),
      this.payouts.findAll({ where: { userId }, order: [['createdAt', 'DESC']], limit: 50 }),
    ]);

    return {
      balanceKobo: toKobo(balance ?? 0),
      account: account
        ? {
            bankCode: account.bankCode,
            bankName: account.bankName,
            accountNumber: account.accountNumber,
            accountName: account.accountName,
          }
        : null,
      payouts: payouts.map((payout) => ({
        reference: payout.reference,
        amountKobo: toKobo(payout.amountKobo),
        feeKobo: toKobo(payout.feeKobo),
        status: payout.status,
        createdAt: iso(payout.createdAt as Date),
        settledAt: iso(payout.settledAt),
      })),
    };
  }
}
