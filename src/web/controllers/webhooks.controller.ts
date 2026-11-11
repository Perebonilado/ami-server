import { createHash } from 'node:crypto';
import {
  Body,
  Controller,
  Headers,
  HttpCode,
  Inject,
  Post,
  type RawBodyRequest,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import { ReceiveWebhookHandler } from '../../business/handlers/webhooks/receive-webhook.handler.js';
import type { ClockPort } from '../../business/ports/clock.port.js';
import { CLOCK_PORT } from '../../business/ports/tokens.js';
import { WEBHOOK_REPOSITORY } from '../../business/repositories/tokens.js';
import type { WebhookRepository } from '../../business/repositories/webhook.repository.js';
import { verifyWebhookSignature } from '../security/webhook-signature.js';

@Controller('hooks')
export class WebhooksController {
  private readonly configuredSecret: string | undefined;

  constructor(
    private readonly receiveWebhookHandler: ReceiveWebhookHandler,
    @Inject(WEBHOOK_REPOSITORY) private readonly webhooks: WebhookRepository,
    @Inject(CLOCK_PORT) private readonly clock: ClockPort,
    config: ConfigService,
  ) {
    this.configuredSecret = config.get<string>('WEBHOOK_SECRET') || undefined;
  }

  @Post('forge')
  @HttpCode(200)
  async receive(
    @Req() request: RawBodyRequest<Request>,
    @Headers('x-forge-signature') signature: string | undefined,
    @Headers('x-forge-timestamp') timestamp: string | undefined,
    @Headers('x-forge-event') eventHeader: string | undefined,
    @Body() body: Record<string, unknown>,
  ) {
    const secret = this.configuredSecret ?? (await this.webhooks.activeSecret());
    const rawBody = request.rawBody;
    if (!secret || !rawBody || !verifyWebhookSignature({ rawBody, timestamp, signature, secret, now: this.clock.now() })) {
      throw new UnauthorizedException('Invalid webhook signature.');
    }

    const eventId = String(body.event_id ?? body.id ?? createHash('sha256').update(rawBody).digest('hex'));
    const type = String(eventHeader ?? body.event ?? body.type ?? 'unknown');
    const { data } = await this.receiveWebhookHandler.handle({ eventId, type, payload: body, defer: true });
    return { received: true, duplicate: data.duplicate };
  }
}
