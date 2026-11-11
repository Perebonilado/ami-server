import { Injectable } from '@nestjs/common';
import { LicenceNotFoundError, PaymentNotFoundError, VideoNotFoundError } from '../../domain/errors/errors.js';
import { LedgerAccount, LedgerKind, PaymentStatus } from '../../domain/values/enums.js';
import { money } from '../../domain/values/money.js';
import type { BankPaymentStatus, BankPort } from '../../ports/bank.port.js';
import type { ClockPort } from '../../ports/clock.port.js';
import type { UnitOfWorkPort } from '../../ports/unit-of-work.port.js';
import type { LedgerRepository } from '../../repositories/ledger.repository.js';
import type { LicenceRepository } from '../../repositories/licence.repository.js';
import type { PaymentRepository } from '../../repositories/payment.repository.js';
import type { VideoRepository } from '../../repositories/video.repository.js';
import AbstractRequestHandlerTemplate from '../AbstractRequestHandlerTemplate.js';
import { CommandResponse } from '../response/CommandResponse.js';

const STATUS_FROM_BANK: Record<BankPaymentStatus, PaymentStatus> = {
  pending: PaymentStatus.PENDING,
  successful: PaymentStatus.PAID,
  failed: PaymentStatus.FAILED,
  partial: PaymentStatus.PARTIAL,
  overpaid: PaymentStatus.PAID,
};

export interface ConfirmPaymentResult {
  reference: string;
  status: PaymentStatus;
  licenceNumber: string;
}

@Injectable()
export class ConfirmPaymentHandler extends AbstractRequestHandlerTemplate<{ reference: string }, ConfirmPaymentResult> {
  constructor(
    private readonly unitOfWork: UnitOfWorkPort,
    private readonly payments: PaymentRepository,
    private readonly licences: LicenceRepository,
    private readonly videos: VideoRepository,
    private readonly ledger: LedgerRepository,
    private readonly bank: BankPort,
    private readonly clock: ClockPort,
  ) {
    super();
  }

  protected async handleRequest(request: { reference: string }): Promise<CommandResponse<ConfirmPaymentResult>> {
    const known = await this.payments.findByReference(request.reference);
    if (!known) throw new PaymentNotFoundError();

    const verification = known.isPaid() ? null : await this.bank.verifyPayment(known.reference);

    const result = await this.unitOfWork.runInTransaction(async (tx) => {
      const payment = await this.payments.findByReferenceForUpdate(request.reference, tx);
      if (!payment) throw new PaymentNotFoundError();
      const licence = await this.licences.findByIdForUpdate(payment.licenceId, tx);
      if (!licence) throw new LicenceNotFoundError();

      if (payment.isPaid() || !verification) {
        return { reference: payment.reference, status: payment.status, licenceNumber: licence.licenceNumber };
      }

      let status = STATUS_FROM_BANK[verification.status];
      if (status === PaymentStatus.PAID && money(verification.amountKobo).lt(payment.props.amountKobo)) {
        status = PaymentStatus.PARTIAL;
      }

      if (status !== PaymentStatus.PAID) {
        payment.markStatus(status);
        await this.payments.save(payment, tx);
        return { reference: payment.reference, status, licenceNumber: licence.licenceNumber };
      }

      const now = this.clock.now();
      payment.markPaid({ feeKobo: verification.feeKobo, channel: verification.channel, paidAt: verification.paidAt ?? now });
      await this.payments.save(payment, tx);

      if (licence.isPending()) {
        licence.activate(now);
        await this.licences.save(licence, tx);
      }

      if (!(await this.ledger.hasEntry(LedgerKind.SALE, { licenceId: licence.id }, tx))) {
        const video = await this.videos.findById(licence.props.videoId, tx);
        if (!video) throw new VideoNotFoundError();
        await this.ledger.add(
          [
            {
              account: LedgerAccount.CREATOR,
              userId: video.creatorId,
              amountKobo: licence.props.creatorShareKobo,
              kind: LedgerKind.SALE,
              licenceId: licence.id,
              payoutId: null,
            },
            {
              account: LedgerAccount.PLATFORM,
              userId: null,
              amountKobo: licence.props.platformFeeKobo,
              kind: LedgerKind.SALE,
              licenceId: licence.id,
              payoutId: null,
            },
          ],
          tx,
        );
      }

      return { reference: payment.reference, status: PaymentStatus.PAID, licenceNumber: licence.licenceNumber };
    });

    return CommandResponse.of(result);
  }
}
