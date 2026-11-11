import { Inject, Injectable, Logger, type OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ExpireLicencesHandler } from '../../business/handlers/licensing/expire-licences.handler.js';
import { ConfirmPaymentHandler } from '../../business/handlers/payments/confirm-payment.handler.js';
import { SettlePayoutHandler } from '../../business/handlers/payouts/settle-payout.handler.js';
import { ReceiveWebhookHandler } from '../../business/handlers/webhooks/receive-webhook.handler.js';
import { RegisterWebhookHandler } from '../../business/handlers/webhooks/register-webhook.handler.js';
import { nextCheckAt } from '../../business/domain/values/recheck.js';
import type { ClockPort } from '../../business/ports/clock.port.js';
import { CLOCK_PORT } from '../../business/ports/tokens.js';
import type { PaymentRepository } from '../../business/repositories/payment.repository.js';
import type { PayoutRepository } from '../../business/repositories/payout.repository.js';
import { PAYMENT_REPOSITORY, PAYOUT_REPOSITORY, WEBHOOK_REPOSITORY } from '../../business/repositories/tokens.js';
import type { WebhookRepository } from '../../business/repositories/webhook.repository.js';

const MINUTE = 60 * 1000;
const BATCH = 5;

@Injectable()
export class ScheduledJobs implements OnApplicationBootstrap {
  private readonly logger = new Logger(ScheduledJobs.name);
  private readonly webhookUrl: string | undefined;

  constructor(
    @Inject(PAYMENT_REPOSITORY) private readonly payments: PaymentRepository,
    @Inject(PAYOUT_REPOSITORY) private readonly payouts: PayoutRepository,
    @Inject(WEBHOOK_REPOSITORY) private readonly webhooks: WebhookRepository,
    @Inject(CLOCK_PORT) private readonly clock: ClockPort,
    private readonly confirmPayment: ConfirmPaymentHandler,
    private readonly settlePayout: SettlePayoutHandler,
    private readonly receiveWebhook: ReceiveWebhookHandler,
    private readonly registerWebhook: RegisterWebhookHandler,
    private readonly expireLicences: ExpireLicencesHandler,
    config: ConfigService,
  ) {
    this.webhookUrl = config.get<string>('WEBHOOK_URL') || undefined;
  }

  async onApplicationBootstrap(): Promise<void> {
    await this.ensureWebhook();
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async recheckPayments(): Promise<void> {
    const now = this.clock.now();
    for (const payment of await this.payments.findDueForCheck(now, BATCH)) {
      await this.confirmPayment
        .handle({ reference: payment.reference })
        .catch((error: unknown) => this.logger.warn(`Recheck of payment ${payment.reference} failed: ${String(error)}`));
      const attempts = payment.props.checkAttempts + 1;
      await this.payments.recordCheck(payment.reference, attempts, nextCheckAt(attempts, now));
    }
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async recheckPayouts(): Promise<void> {
    const now = this.clock.now();
    for (const payout of await this.payouts.findDueForCheck(now, BATCH)) {
      await this.settlePayout
        .handle({ reference: payout.reference })
        .catch((error: unknown) => this.logger.warn(`Recheck of payout ${payout.reference} failed: ${String(error)}`));
      const attempts = payout.props.checkAttempts + 1;
      await this.payouts.recordCheck(payout.reference, attempts, nextCheckAt(attempts, now));
    }
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async retryWebhooks(): Promise<void> {
    const pending = await this.webhooks.findUnprocessed(new Date(this.clock.now().getTime() - 2 * MINUTE), 10);
    for (const event of pending) {
      await this.receiveWebhook.handle({ ...event, retry: true });
    }
  }

  @Cron(CronExpression.EVERY_HOUR)
  async hourly(): Promise<void> {
    const { data } = await this.expireLicences.handle();
    if (data.expired) this.logger.log(`Expired ${data.expired} licences`);
    await this.ensureWebhook();
  }

  private async ensureWebhook(): Promise<void> {
    if (!this.webhookUrl) return;
    await this.registerWebhook
      .handle({ url: this.webhookUrl })
      .catch((error: unknown) => this.logger.warn(`Webhook registration failed: ${String(error)}`));
  }
}
