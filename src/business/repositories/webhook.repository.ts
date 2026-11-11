export interface WebhookEvent {
  eventId: string;
  type: string;
  payload: unknown;
}

export interface WebhookRepository {
  recordIfNew(event: WebhookEvent): Promise<boolean>;
  markProcessed(eventId: string, now: Date): Promise<void>;
  markFailed(eventId: string, error: string): Promise<void>;
  findUnprocessed(receivedBefore: Date, limit: number): Promise<WebhookEvent[]>;
  activeSecret(): Promise<string | null>;
  saveSubscription(subscription: { bankWebhookId: string; url: string; secret: string }): Promise<void>;
}
