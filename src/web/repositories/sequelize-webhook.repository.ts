import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import type { WebhookEvent, WebhookRepository } from '../../business/repositories/webhook.repository.js';
import { WebhookEventModel, WebhookSubscriptionModel } from '../database/models/index.js';

const MAX_WEBHOOK_ATTEMPTS = 5;

@Injectable()
export class SequelizeWebhookRepository implements WebhookRepository {
  constructor(
    @InjectModel(WebhookEventModel) private readonly events: typeof WebhookEventModel,
    @InjectModel(WebhookSubscriptionModel) private readonly subscriptions: typeof WebhookSubscriptionModel,
  ) {}

  async recordIfNew(event: WebhookEvent): Promise<boolean> {
    const [, created] = await this.events.findOrCreate({
      where: { eventId: event.eventId },
      defaults: { eventId: event.eventId, type: event.type, payload: event.payload ?? {} },
    });
    return created;
  }

  async markProcessed(eventId: string, now: Date): Promise<void> {
    await this.events.update({ processedAt: now, error: null }, { where: { eventId } });
  }

  async markFailed(eventId: string, error: string): Promise<void> {
    await this.events.increment('attempts', { where: { eventId } });
    await this.events.update({ error: error.slice(0, 2000) }, { where: { eventId } });
  }

  async findUnprocessed(receivedBefore: Date, limit: number): Promise<WebhookEvent[]> {
    const rows = await this.events.findAll({
      where: { processedAt: null, attempts: { [Op.lt]: MAX_WEBHOOK_ATTEMPTS }, createdAt: { [Op.lt]: receivedBefore } },
      order: [['createdAt', 'ASC']],
      limit,
    });
    return rows.map((row) => ({ eventId: row.eventId, type: row.type, payload: row.payload }));
  }

  async activeSecret(): Promise<string | null> {
    const row = await this.subscriptions.findOne({ order: [['createdAt', 'DESC']] });
    return row?.secret ?? null;
  }

  async saveSubscription(subscription: { bankWebhookId: string; url: string; secret: string }): Promise<void> {
    await this.subscriptions.create({ ...subscription });
  }
}
