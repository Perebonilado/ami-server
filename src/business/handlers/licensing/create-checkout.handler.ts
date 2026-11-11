import { Injectable } from '@nestjs/common';
import { OwnVideoError, UserNotFoundError, VideoNotFoundError } from '../../domain/errors/errors.js';
import { LicenceDuration, LicenceStatus, PaymentStatus } from '../../domain/values/enums.js';
import { cleanPart, licencePriceKobo, type LicencePart, splitPrice } from '../../domain/values/pricing.js';
import type { BankPort } from '../../ports/bank.port.js';
import type { ClockPort } from '../../ports/clock.port.js';
import type { IdGeneratorPort } from '../../ports/id-generator.port.js';
import type { UnitOfWorkPort } from '../../ports/unit-of-work.port.js';
import type { LicenceRepository } from '../../repositories/licence.repository.js';
import type { PaymentRepository } from '../../repositories/payment.repository.js';
import type { UserRepository } from '../../repositories/user.repository.js';
import type { VideoRepository } from '../../repositories/video.repository.js';
import AbstractRequestHandlerTemplate from '../AbstractRequestHandlerTemplate.js';
import { CommandResponse } from '../response/CommandResponse.js';

const FIRST_CHECK_AFTER_MS = 2 * 60 * 1000;

export interface CreateCheckoutRequest {
  buyerId: string;
  videoId: string;
  part: LicencePart | null;
  duration: LicenceDuration;
  callbackUrl?: string;
}

export interface CheckoutResult {
  licenceNumber: string;
  paymentReference: string;
  amountKobo: number;
  paymentUrl: string;
}

@Injectable()
export class CreateCheckoutHandler extends AbstractRequestHandlerTemplate<CreateCheckoutRequest, CheckoutResult> {
  constructor(
    private readonly unitOfWork: UnitOfWorkPort,
    private readonly videos: VideoRepository,
    private readonly users: UserRepository,
    private readonly licences: LicenceRepository,
    private readonly payments: PaymentRepository,
    private readonly bank: BankPort,
    private readonly ids: IdGeneratorPort,
    private readonly clock: ClockPort,
    private readonly callbackUrl: string,
  ) {
    super();
  }

  protected async handleRequest(request: CreateCheckoutRequest): Promise<CommandResponse<CheckoutResult>> {
    const video = await this.videos.findById(request.videoId);
    if (!video || !video.isLive()) throw new VideoNotFoundError('This video isn’t available to license.');
    if (video.isOwnedBy(request.buyerId)) throw new OwnVideoError();
    const buyer = await this.users.findById(request.buyerId);
    if (!buyer) throw new UserNotFoundError();

    const part = cleanPart(request.part, video.durationSec);
    const priceKobo = licencePriceKobo(video.basePriceKobo, video.durationSec, part, request.duration);
    const { platformFeeKobo, creatorShareKobo } = splitPrice(priceKobo);

    const { licence, payment } = await this.unitOfWork.runInTransaction(async (tx) => {
      const licence = await this.licences.create(
        {
          licenceNumber: await this.uniqueLicenceNumber(tx),
          videoId: video.id,
          buyerId: buyer.id,
          partStartSec: part?.startSec ?? null,
          partEndSec: part?.endSec ?? null,
          duration: request.duration,
          priceKobo,
          platformFeeKobo,
          creatorShareKobo,
          status: LicenceStatus.PENDING,
          startsAt: null,
          endsAt: null,
        },
        tx,
      );
      const payment = await this.payments.create(
        {
          licenceId: licence.id,
          buyerId: buyer.id,
          reference: this.ids.reference('AMIPAY'),
          idempotencyKey: this.ids.uuid(),
          paymentUrl: null,
          amountKobo: priceKobo,
          feeKobo: 0,
          channel: null,
          status: PaymentStatus.INITIATED,
          paidAt: null,
          bankRequestId: null,
          checkAttempts: 0,
          nextCheckAt: new Date(this.clock.now().getTime() + FIRST_CHECK_AFTER_MS),
        },
        tx,
      );
      return { licence, payment };
    });

    try {
      const session = await this.bank.createCheckout({
        reference: payment.reference,
        idempotencyKey: payment.props.idempotencyKey,
        amountKobo: priceKobo,
        customerEmail: buyer.email,
        customerName: buyer.props.businessName ?? buyer.name,
        narration: `Àmì licence ${licence.licenceNumber}`,
        callbackUrl: request.callbackUrl ?? this.callbackUrl,
      });
      payment.props.paymentUrl = session.paymentUrl;
      payment.props.bankRequestId = session.bankRequestId;
      await this.payments.save(payment);
      return CommandResponse.of({
        licenceNumber: licence.licenceNumber,
        paymentReference: payment.reference,
        amountKobo: priceKobo,
        paymentUrl: session.paymentUrl,
      });
    } catch (error) {
      payment.markStatus(PaymentStatus.FAILED);
      licence.cancel();
      await this.payments.save(payment);
      await this.licences.save(licence);
      throw error;
    }
  }

  private async uniqueLicenceNumber(tx: unknown): Promise<string> {
    for (let attempt = 0; attempt < 10; attempt++) {
      const candidate = this.ids.licenceNumber();
      if (!(await this.licences.numberExists(candidate, tx))) return candidate;
    }
    throw new Error('Could not create a unique licence number');
  }
}
