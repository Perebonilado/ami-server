import { createHmac, timingSafeEqual } from 'node:crypto';

const TOLERANCE_SEC = 300;

export interface WebhookSignatureInput {
  rawBody: Buffer;
  timestamp: string | undefined;
  signature: string | undefined;
  secret: string;
  now: Date;
}

export function verifyWebhookSignature(input: WebhookSignatureInput): boolean {
  if (!input.timestamp || !input.signature) return false;
  const sentAt = Number(input.timestamp);
  if (!Number.isFinite(sentAt) || Math.abs(input.now.getTime() / 1000 - sentAt) > TOLERANCE_SEC) return false;

  const mac = createHmac('sha256', input.secret).update(`${input.timestamp}.`).update(input.rawBody).digest('hex');
  const expected = Buffer.from(`sha256=${mac}`);
  const received = Buffer.from(input.signature);
  return expected.length === received.length && timingSafeEqual(expected, received);
}
