import { Injectable } from '@nestjs/common';
import type { Payout } from '../../domain/entities/payout.js';
import { LedgerAccount, LedgerKind, PayoutStatus } from '../../domain/values/enums.js';
import type { BankPort, BankTransferStatus, TransferResult } from '../../ports/bank.port.js';
import type { ClockPort } from '../../ports/clock.port.js';
import type { UnitOfWorkPort } from '../../ports/unit-of-work.port.js';
import type { LedgerRepository } from '../../repositories/ledger.repository.js';
import type { PayoutRepository } from '../../repositories/payout.repository.js';
import AbstractRequestHandlerTemplate from '../AbstractRequestHandlerTemplate.js';
import { CommandResponse } from '../response/CommandResponse.js';

const STATUS_FROM_BANK: Record<BankTransferStatus, PayoutStatus> = {
  pending: PayoutStatus.PENDING,
  successful: PayoutStatus.SUCCESSFUL,
  failed: PayoutStatus.FAILED,
  reversed: PayoutStatus.REVERSED,
};

export interface SettlePayoutRequest {
  reference: string;
  result?: Partial<TransferResult> & { status: BankTransferStatus };
}

export interface SettlePayoutResult {
  reference: string;
  status: PayoutStatus;
}

@Injectable()
export class SettlePayoutHandler extends AbstractRequestHandlerTemplate<SettlePayoutRequest, SettlePayoutResult | null> {
  constructor(
    private readonly unitOfWork: UnitOfWorkPort,
    private readonly payouts: PayoutRepository,
    private readonly ledger: LedgerRepository,
    private readonly bank: BankPort,
    private readonly clock: ClockPort,
  ) {
    super();
  }

  protected async handleRequest(request: SettlePayoutRequest): Promise<CommandResponse<SettlePayoutResult | null>> {
    const result = request.result ?? (await this.lookup(request.reference));

    const settled = await this.unitOfWork.runInTransaction(async (tx) => {
      const payout = await this.payouts.findByReferenceForUpdate(request.reference, tx);
      if (!payout) return null;
      const reversalOfSuccess = payout.status === PayoutStatus.SUCCESSFUL && result?.status === 'reversed';
      if (!result || (payout.isFinal() && !reversalOfSuccess)) return { reference: payout.reference, status: payout.status };

      this.apply(payout, result);
      await this.payouts.save(payout, tx);

      if (payout.isReturned() && !(await this.ledger.hasEntry(LedgerKind.PAYOUT_REVERSAL, { payoutId: payout.id }, tx))) {
        await this.ledger.add(
          [
            {
              account: LedgerAccount.CREATOR,
              userId: payout.props.userId,
              amountKobo: payout.amountKobo,
              kind: LedgerKind.PAYOUT_REVERSAL,
              licenceId: null,
              payoutId: payout.id,
            },
          ],
          tx,
        );
      }
      return { reference: payout.reference, status: payout.status };
    });

    return CommandResponse.of(settled);
  }

  private apply(payout: Payout, result: Partial<TransferResult> & { status: BankTransferStatus }): void {
    payout.props.status = STATUS_FROM_BANK[result.status];
    if (result.feeKobo !== undefined) payout.props.feeKobo = result.feeKobo;
    if (result.vatKobo !== undefined) payout.props.vatKobo = result.vatKobo;
    if (result.stampDutyKobo !== undefined) payout.props.stampDutyKobo = result.stampDutyKobo;
    if (result.sessionId) payout.props.sessionId = result.sessionId;
    if (payout.props.status === PayoutStatus.SUCCESSFUL) payout.props.settledAt = this.clock.now();
    if (payout.isFinal()) payout.props.nextCheckAt = null;
  }

  private async lookup(reference: string): Promise<TransferResult | null> {
    const payout = await this.unitOfWork.runInTransaction((tx) => this.payouts.findByReferenceForUpdate(reference, tx));
    if (!payout || payout.isFinal()) return null;
    return this.bank.getTransfer(reference, payout.props.bankCode);
  }
}
