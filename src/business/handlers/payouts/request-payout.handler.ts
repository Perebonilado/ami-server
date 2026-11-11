import { Injectable } from '@nestjs/common';
import {
  BankRateLimitedError,
  BankRejectedError,
  InsufficientBalanceError,
  PayoutAccountMissingError,
  PayoutTooSmallError,
  UserNotFoundError,
} from '../../domain/errors/errors.js';
import { LedgerAccount, LedgerKind, PayoutStatus } from '../../domain/values/enums.js';
import { money, toKobo } from '../../domain/values/money.js';
import { MIN_PAYOUT_KOBO } from '../../domain/values/pricing.js';
import type { BankPort, TransferResult } from '../../ports/bank.port.js';
import type { ClockPort } from '../../ports/clock.port.js';
import type { IdGeneratorPort } from '../../ports/id-generator.port.js';
import type { UnitOfWorkPort } from '../../ports/unit-of-work.port.js';
import type { LedgerRepository } from '../../repositories/ledger.repository.js';
import type { PayoutAccountRepository } from '../../repositories/payout-account.repository.js';
import type { PayoutRepository } from '../../repositories/payout.repository.js';
import type { UserRepository } from '../../repositories/user.repository.js';
import AbstractRequestHandlerTemplate from '../AbstractRequestHandlerTemplate.js';
import { CommandResponse } from '../response/CommandResponse.js';
import type { SettlePayoutHandler, SettlePayoutResult } from './settle-payout.handler.js';

const RECHECK_AFTER_MS = 60 * 1000;

export interface RequestPayoutRequest {
  userId: string;
  amountKobo: number;
}

@Injectable()
export class RequestPayoutHandler extends AbstractRequestHandlerTemplate<RequestPayoutRequest, SettlePayoutResult> {
  constructor(
    private readonly unitOfWork: UnitOfWorkPort,
    private readonly users: UserRepository,
    private readonly accounts: PayoutAccountRepository,
    private readonly payouts: PayoutRepository,
    private readonly ledger: LedgerRepository,
    private readonly bank: BankPort,
    private readonly ids: IdGeneratorPort,
    private readonly clock: ClockPort,
    private readonly settlePayout: SettlePayoutHandler,
    private readonly sourceAccount: string,
  ) {
    super();
  }

  protected async handleRequest(request: RequestPayoutRequest): Promise<CommandResponse<SettlePayoutResult>> {
    if (money(request.amountKobo).lt(MIN_PAYOUT_KOBO)) throw new PayoutTooSmallError();
    const account = await this.accounts.findByUserId(request.userId);
    if (!account) throw new PayoutAccountMissingError();

    const payout = await this.unitOfWork.runInTransaction(async (tx) => {
      const user = await this.users.findByIdForUpdate(request.userId, tx);
      if (!user) throw new UserNotFoundError();
      const balance = await this.ledger.creatorBalance(request.userId, tx);
      if (money(balance).lt(request.amountKobo)) throw new InsufficientBalanceError();

      const created = await this.payouts.create(
        {
          userId: request.userId,
          payoutAccountId: account.id,
          bankCode: account.bankCode,
          accountNumber: account.accountNumber,
          amountKobo: request.amountKobo,
          feeKobo: 0,
          vatKobo: 0,
          stampDutyKobo: 0,
          reference: this.ids.reference('AMIPO'),
          idempotencyKey: this.ids.uuid(),
          nameEnquiryRef: null,
          sessionId: null,
          status: PayoutStatus.PENDING,
          settledAt: null,
          checkAttempts: 0,
          nextCheckAt: this.recheckAt(),
        },
        tx,
      );
      await this.ledger.add(
        [
          {
            account: LedgerAccount.CREATOR,
            userId: request.userId,
            amountKobo: toKobo(money(request.amountKobo).negated()),
            kind: LedgerKind.PAYOUT,
            licenceId: null,
            payoutId: created.id,
          },
        ],
        tx,
      );
      return created;
    });

    let nameEnquiryRef: string;
    try {
      nameEnquiryRef = (await this.bank.nameEnquiry(account.bankCode, account.accountNumber)).nameEnquiryRef;
      await this.payouts.saveNameEnquiryRef(payout.reference, nameEnquiryRef);
    } catch (error) {
      await this.settlePayout.handle({ reference: payout.reference, result: { status: 'failed' } });
      throw error;
    }

    let result: TransferResult;
    try {
      result = await this.bank.transfer({
        reference: payout.reference,
        idempotencyKey: payout.props.idempotencyKey,
        sourceAccount: this.sourceAccount,
        bankCode: account.bankCode,
        accountNumber: account.accountNumber,
        nameEnquiryRef,
        amountKobo: payout.amountKobo,
        narration: 'Àmì creator payout',
      });
    } catch (error) {
      if (error instanceof BankRejectedError || error instanceof BankRateLimitedError) {
        await this.settlePayout.handle({ reference: payout.reference, result: { status: 'failed' } });
        throw error;
      }
      this.logger.warn(`Payout ${payout.reference} outcome unknown, will re-check: ${String(error)}`);
      await this.payouts.markUnknownIfPending(payout.reference, this.recheckAt());
      return CommandResponse.of({ reference: payout.reference, status: PayoutStatus.UNKNOWN });
    }

    try {
      const settled = await this.settlePayout.handle({ reference: payout.reference, result });
      return CommandResponse.of(settled.data ?? { reference: payout.reference, status: PayoutStatus.PENDING });
    } catch (error) {
      this.logger.warn(`Payout ${payout.reference} sent but not recorded yet, will re-check: ${String(error)}`);
      return CommandResponse.of({ reference: payout.reference, status: PayoutStatus.PENDING });
    }
  }

  private recheckAt(): Date {
    return new Date(this.clock.now().getTime() + RECHECK_AFTER_MS);
  }
}
