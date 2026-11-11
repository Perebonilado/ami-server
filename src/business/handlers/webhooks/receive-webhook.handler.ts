import { Injectable } from '@nestjs/common';
import type { BankTransferStatus } from '../../ports/bank.port.js';
import type { ClockPort } from '../../ports/clock.port.js';
import type { WebhookEvent, WebhookRepository } from '../../repositories/webhook.repository.js';
import AbstractRequestHandlerTemplate from '../AbstractRequestHandlerTemplate.js';
import type { ConfirmPaymentHandler } from '../payments/confirm-payment.handler.js';
import type { SettlePayoutHandler } from '../payouts/settle-payout.handler.js';
import { CommandResponse } from '../response/CommandResponse.js';

const TRANSFER_STATUSES: BankTransferStatus[] = ['pending', 'successful', 'failed', 'reversed'];

export interface ReceiveWebhookRequest extends WebhookEvent {
  retry?: boolean;
  defer?: boolean;
}

export interface ReceiveWebhookResult {
  eventId: string;
  duplicate: boolean;
  processed: boolean;
}

@Injectable()
export class ReceiveWebhookHandler extends AbstractRequestHandlerTemplate<ReceiveWebhookRequest, ReceiveWebhookResult> {
  constructor(
    private readonly webhooks: WebhookRepository,
    private readonly confirmPayment: ConfirmPaymentHandler,
    private readonly settlePayout: SettlePayoutHandler,
    private readonly clock: ClockPort,
  ) {
    super();
  }

  protected async handleRequest(request: ReceiveWebhookRequest): Promise<CommandResponse<ReceiveWebhookResult>> {
    if (!request.retry && !(await this.webhooks.recordIfNew(request))) {
      return CommandResponse.of({ eventId: request.eventId, duplicate: true, processed: false });
    }

    if (request.defer) {
      setTimeout(() => void this.process(request), 0);
      return CommandResponse.of({ eventId: request.eventId, duplicate: false, processed: false });
    }
    const processed = await this.process(request);
    return CommandResponse.of({ eventId: request.eventId, duplicate: false, processed });
  }

  private async process(event: WebhookEvent): Promise<boolean> {
    try {
      await this.dispatch(event);
      await this.webhooks.markProcessed(event.eventId, this.clock.now());
      return true;
    } catch (error) {
      this.logger.warn(`Webhook ${event.eventId} (${event.type}) failed: ${String(error)}`);
      await this.webhooks.markFailed(event.eventId, error instanceof Error ? error.message : String(error)).catch(() => {});
      return false;
    }
  }

  private async dispatch(event: WebhookEvent): Promise<void> {
    const reference = referenceOf(event.payload);
    if (!reference) return;

    if (event.type.startsWith('payment.')) {
      await this.confirmPayment.handle({ reference });
      return;
    }

    if (event.type.startsWith('transfer.')) {
      const status = event.type.slice('transfer.'.length) as BankTransferStatus;
      if (!TRANSFER_STATUSES.includes(status)) return;
      await this.settlePayout.handle({ reference, result: { status } });
    }
  }
}

function referenceOf(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') return null;
  const body = payload as { reference?: unknown; data?: { reference?: unknown } };
  const reference = body.data?.reference ?? body.reference;
  return typeof reference === 'string' ? reference : null;
}
