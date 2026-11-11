import { randomUUID } from 'node:crypto';
import { Logger } from '@nestjs/common';
import {
  BankRateLimitedError,
  BankRejectedError,
  BankTimeoutError,
  BankUnavailableError,
} from '../../business/domain/errors/errors.js';
import { koboToNaira, nairaToKobo } from '../../business/domain/values/money.js';
import type {
  BankInfo,
  BankPaymentStatus,
  BankPort,
  BankTransferStatus,
  CheckoutRequest,
  CheckoutSession,
  NameEnquiry,
  PaymentVerification,
  TransferRequest,
  TransferResult,
  WebhookRegistration,
} from '../../business/ports/bank.port.js';
import type { BankRequestModel } from '../database/models/index.js';
import { RateBudget } from './rate-budget.js';

const REQUEST_TIMEOUT_MS = 20_000;
const BANKS_TTL_MS = 24 * 60 * 60 * 1000;

interface Envelope<T> {
  status?: string;
  data?: T;
  error?: { code?: string; message?: string; field?: string };
  request_id?: string;
}

interface CallOptions {
  body?: unknown;
  idempotencyKey?: string;
  reference?: string;
  testOutcome?: string;
}

type Row = Record<string, unknown>;

export class XtradotBankAdapter implements BankPort {
  private readonly logger = new Logger(XtradotBankAdapter.name);
  private readonly budget: RateBudget;
  private banksCache: { at: number; banks: BankInfo[] } | null = null;

  constructor(
    private readonly baseUrl: string,
    private readonly apiKey: string,
    private readonly intraBankCode: string,
    private readonly merchantId: string,
    callsPerMinute: number,
    private readonly requestLog: typeof BankRequestModel,
  ) {
    this.budget = new RateBudget(callsPerMinute);
  }

  async createCheckout(request: CheckoutRequest): Promise<CheckoutSession> {
    const { data, requestId } = await this.call<Row>('POST', '/payments/checkout', {
      idempotencyKey: request.idempotencyKey,
      reference: request.reference,
      body: {
        merchant_id: this.merchantId,
        amount: Number(koboToNaira(request.amountKobo)),
        currency: 'NGN',
        reference: request.reference,
        narration: request.narration,
        callback_url: request.callbackUrl,
        customer: { email: request.customerEmail, name: request.customerName },
      },
    });
    return { paymentUrl: String(data.payment_url ?? data.checkout_url ?? ''), bankRequestId: requestId };
  }

  async verifyPayment(reference: string): Promise<PaymentVerification> {
    const { data } = await this.call<Row>('GET', `/payments/${encodeURIComponent(reference)}/verify`, { reference });
    return {
      reference,
      status: paymentStatus(data.status),
      amountKobo: nairaToKobo(String(data.amount_paid ?? data.amount ?? 0)),
      feeKobo: nairaToKobo(String(data.fee ?? data.merchant_fee ?? 0)),
      channel: typeof data.channel === 'string' ? data.channel : null,
      paidAt: typeof data.paid_at === 'string' ? new Date(data.paid_at) : null,
    };
  }

  async simulatePayment(reference: string, outcome: 'paid' | 'failed'): Promise<void> {
    await this.call('POST', `/payments/${encodeURIComponent(reference)}/simulate-transfer`, {
      reference,
      idempotencyKey: randomUUID(),
      testOutcome: outcome === 'paid' ? 'successful' : 'failed',
      body: {},
    });
  }

  async listBanks(): Promise<BankInfo[]> {
    if (this.banksCache && Date.now() - this.banksCache.at < BANKS_TTL_MS) return this.banksCache.banks;
    const { data } = await this.call<Row[]>('GET', '/banks');
    const banks = data
      .map((bank) => ({ code: String(bank.nip_code ?? bank.code ?? ''), name: String(bank.name ?? '') }))
      .filter((bank) => bank.code && bank.name);
    this.banksCache = { at: Date.now(), banks };
    return banks;
  }

  async nameEnquiry(bankCode: string, accountNumber: string): Promise<NameEnquiry> {
    const intra = bankCode === this.intraBankCode;
    const { data } = await this.call<Row>(
      'POST',
      intra ? '/transfers/intra/name-enquiry' : '/transfers/interbank/name-enquiry',
      { body: intra ? { account_number: accountNumber } : { destination_bank_code: bankCode, account_number: accountNumber } },
    );
    return {
      bankCode,
      accountNumber,
      accountName: String(data.account_name ?? ''),
      nameEnquiryRef: String(data.name_enquiry_ref ?? ''),
    };
  }

  async transfer(request: TransferRequest): Promise<TransferResult> {
    const intra = request.bankCode === this.intraBankCode;
    const body = {
      source_account: request.sourceAccount,
      destination_account: request.accountNumber,
      name_enquiry_ref: request.nameEnquiryRef,
      amount: Number(koboToNaira(request.amountKobo)),
      narration: request.narration,
      reference: request.reference,
      ...(intra ? {} : { destination_bank_code: request.bankCode }),
    };
    const { data } = await this.call<Row>('POST', intra ? '/transfers/intra' : '/transfers/interbank', {
      body,
      idempotencyKey: request.idempotencyKey,
      reference: request.reference,
    });
    if (!data || typeof data !== 'object') throw new BankUnavailableError();
    return transferResult(request.reference, data);
  }

  async getTransfer(reference: string, bankCode: string): Promise<TransferResult | null> {
    try {
      const { data } =
        bankCode === this.intraBankCode
          ? await this.call<Row>('GET', `/transfers/${encodeURIComponent(reference)}`, { reference })
          : await this.call<Row>('POST', '/transfers/interbank/requery', { reference, body: { reference } });
      return transferResult(reference, data);
    } catch (error) {
      if (error instanceof BankRejectedError && error.httpStatus === 404) return null;
      throw error;
    }
  }

  async registerWebhook(url: string): Promise<WebhookRegistration> {
    const { data } = await this.call<Row>('POST', '/webhooks', {
      idempotencyKey: randomUUID(),
      body: { url, events: ['*'] },
    });
    return { id: String(data.id ?? data.webhook_id ?? ''), secret: String(data.webhook_secret ?? data.secret ?? '') };
  }

  private async call<T>(method: string, path: string, options: CallOptions = {}): Promise<{ data: T; requestId: string | null }> {
    if (!this.budget.take()) throw new BankRateLimitedError();

    const headers: Record<string, string> = { 'x-api-key': this.apiKey, Accept: 'application/json' };
    if (options.body !== undefined) headers['Content-Type'] = 'application/json';
    if (options.idempotencyKey) headers['Idempotency-Key'] = options.idempotencyKey;
    if (options.testOutcome) headers['x-test-outcome'] = options.testOutcome;

    const started = Date.now();
    let response: globalThis.Response;
    try {
      response = await fetch(`${this.baseUrl}${path}`, {
        method,
        headers,
        body: options.body === undefined ? undefined : JSON.stringify(options.body),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    } catch (error) {
      await this.log(method, path, options, null, null, 'NETWORK_ERROR', started);
      if (error instanceof Error && error.name === 'TimeoutError') throw new BankTimeoutError();
      throw new BankUnavailableError();
    }

    const envelope = (await response.json().catch(() => ({}))) as Envelope<T>;
    const requestId = envelope.request_id ?? null;
    await this.log(method, path, options, response.status, requestId, envelope.error?.code ?? null, started);

    if (response.ok && envelope.status !== 'error') return { data: envelope.data as T, requestId };

    const code = envelope.error?.code ?? 'BANK_ERROR';
    const message = envelope.error?.message ?? 'The bank couldn’t complete this request.';
    if (response.status === 504 || code === 'TIMEOUT') throw new BankTimeoutError();
    if (response.status === 429 || code === 'RATE_LIMITED') throw new BankRateLimitedError();
    if (response.status >= 500 || code === 'BANK_UNAVAILABLE') throw new BankUnavailableError();
    if (response.status === 401) {
      this.logger.error(`Bank rejected our key on ${method} ${path} (request ${requestId ?? 'unknown'})`);
      throw new BankUnavailableError();
    }
    throw new BankRejectedError(code, message, response.status === 404 ? 404 : 422);
  }

  private async log(
    method: string,
    path: string,
    options: CallOptions,
    httpStatus: number | null,
    bankRequestId: string | null,
    errorCode: string | null,
    started: number,
  ): Promise<void> {
    await this.requestLog
      .create({
        endpoint: path.slice(0, 200),
        method,
        idempotencyKey: options.idempotencyKey?.slice(0, 64) ?? null,
        ourReference: options.reference ?? null,
        httpStatus,
        bankRequestId,
        errorCode,
        durationMs: Date.now() - started,
      })
      .catch((error: unknown) => this.logger.warn(`Could not log bank request: ${String(error)}`));
  }
}

function paymentStatus(value: unknown): BankPaymentStatus {
  const status = String(value ?? '').toLowerCase();
  if (['successful', 'success', 'paid', 'completed'].includes(status)) return 'successful';
  if (['failed', 'declined', 'cancelled', 'reversed'].includes(status)) return 'failed';
  if (status === 'partial') return 'partial';
  if (status === 'overpaid') return 'overpaid';
  return 'pending';
}

function transferStatus(value: unknown): BankTransferStatus {
  const status = String(value ?? '').toLowerCase();
  if (['successful', 'success', 'completed'].includes(status)) return 'successful';
  if (status === 'failed') return 'failed';
  if (status === 'reversed') return 'reversed';
  return 'pending';
}

function transferResult(reference: string, data: Row): TransferResult {
  return {
    reference: String(data.reference ?? reference),
    status: transferStatus(data.status),
    feeKobo: nairaToKobo(String(data.fee ?? 0)),
    vatKobo: nairaToKobo(String(data.vat ?? 0)),
    stampDutyKobo: nairaToKobo(String(data.stamp_duty ?? 0)),
    sessionId: typeof data.session_id === 'string' ? data.session_id : null,
  };
}
