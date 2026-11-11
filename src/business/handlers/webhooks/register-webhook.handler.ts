import { Injectable } from '@nestjs/common';
import type { BankPort } from '../../ports/bank.port.js';
import type { WebhookRepository } from '../../repositories/webhook.repository.js';
import AbstractRequestHandlerTemplate from '../AbstractRequestHandlerTemplate.js';
import { CommandResponse } from '../response/CommandResponse.js';

@Injectable()
export class RegisterWebhookHandler extends AbstractRequestHandlerTemplate<{ url: string }, { registered: boolean }> {
  constructor(
    private readonly bank: BankPort,
    private readonly webhooks: WebhookRepository,
  ) {
    super();
  }

  protected async handleRequest(request: { url: string }): Promise<CommandResponse<{ registered: boolean }>> {
    if (await this.webhooks.activeSecret()) return CommandResponse.of({ registered: false });
    const registration = await this.bank.registerWebhook(request.url);
    await this.webhooks.saveSubscription({
      bankWebhookId: registration.id,
      url: request.url,
      secret: registration.secret,
    });
    return CommandResponse.of({ registered: true });
  }
}
