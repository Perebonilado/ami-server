import BigNumber from 'bignumber.js';
import { BankRejectedError, BankTimeoutError } from '../../business/domain/errors/errors.js';
import { money, toKobo } from '../../business/domain/values/money.js';
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

const BANKS: BankInfo[] = [
  { code: '000014', name: 'Xtradot Bank' },
  { code: '000013', name: 'GTBank' },
  { code: '000015', name: 'Zenith Bank' },
  { code: '000016', name: 'First Bank' },
  { code: '000004', name: 'UBA' },
  { code: '000017', name: 'Wema Bank' },
  { code: '100004', name: 'OPay' },
  { code: '090405', name: 'Moniepoint' },
];

const ACCOUNTS: Record<string, string> = {
  '000014:0987654321': 'Ngozi Adaobi Eze',
  '000014:0987654322': 'Aisha Hauwa Bello',
  '000013:0123987001': 'Chukwuemeka Ifeanyi Nwosu',
  '000015:0123987002': 'Funmilayo Abiola Ogunleye',
  '000016:0123987003': 'Zainab Halima Yusuf',
  '000004:0123987004': 'Tamunotonye Briggs',
  '100004:8031234506': 'Ifeoluwa Grace Adebayo',
};

export class MockBankAdapter implements BankPort {
  private readonly payments = new Map<string, { amountKobo: number; status: BankPaymentStatus; paidAt: Date | null }>();
  private readonly transfers = new Map<string, TransferResult>();
  private enquiries = 0;

  constructor(
    private readonly frontendUrl: string,
    private readonly intraBankCode: string,
  ) {}

  async createCheckout(request: CheckoutRequest): Promise<CheckoutSession> {
    if (!this.payments.has(request.reference)) {
      this.payments.set(request.reference, { amountKobo: request.amountKobo, status: 'pending', paidAt: null });
    }
    return { paymentUrl: `${this.frontendUrl}/pay/${request.reference}`, bankRequestId: null };
  }

  async verifyPayment(reference: string): Promise<PaymentVerification> {
    const payment = this.payments.get(reference) ?? { amountKobo: 0, status: 'pending' as const, paidAt: null };
    return {
      reference,
      status: payment.status,
      amountKobo: payment.status === 'successful' ? payment.amountKobo : 0,
      feeKobo: payment.status === 'successful' ? 5_000 : 0,
      channel: payment.status === 'successful' ? 'transfer' : null,
      paidAt: payment.paidAt,
    };
  }

  async simulatePayment(reference: string, outcome: 'paid' | 'failed'): Promise<void> {
    const payment = this.payments.get(reference) ?? { amountKobo: 0, status: 'pending' as const, paidAt: null };
    if (payment.amountKobo === 0) {
      throw new BankRejectedError('NOT_FOUND', 'The bank has no checkout with this reference.', 404);
    }
    this.payments.set(reference, {
      ...payment,
      status: outcome === 'paid' ? 'successful' : 'failed',
      paidAt: outcome === 'paid' ? new Date() : null,
    });
  }

  async listBanks(): Promise<BankInfo[]> {
    return BANKS;
  }

  async nameEnquiry(bankCode: string, accountNumber: string): Promise<NameEnquiry> {
    const accountName = ACCOUNTS[`${bankCode}:${accountNumber}`];
    if (!accountName) throw new BankRejectedError('ACCOUNT_NOT_FOUND', 'We couldn’t find that account.', 404);
    this.enquiries += 1;
    return { bankCode, accountNumber, accountName, nameEnquiryRef: `NE-MOCK-${this.enquiries}` };
  }

  async transfer(request: TransferRequest): Promise<TransferResult> {
    const existing = this.transfers.get(request.reference);
    if (existing) return existing;

    const intra = request.bankCode === this.intraBankCode;
    const fee = intra ? money(0) : nipFee(request.amountKobo);
    const result: TransferResult = {
      reference: request.reference,
      status: intra ? 'successful' : 'pending',
      feeKobo: toKobo(fee),
      vatKobo: toKobo(fee.times('0.075').integerValue(BigNumber.ROUND_HALF_UP)),
      stampDutyKobo: money(request.amountKobo).gte(1_000_000) ? 5_000 : 0,
      sessionId: intra ? null : `MOCKSESSION${Date.now()}`,
    };
    this.transfers.set(request.reference, result);

    if (money(request.amountKobo).mod(100).eq(2)) {
      this.transfers.set(request.reference, { ...result, status: 'successful' });
      throw new BankTimeoutError();
    }
    if (!intra) setTimeout(() => this.settle(request.reference, 'successful'), 5_000);
    return result;
  }

  async getTransfer(reference: string): Promise<TransferResult | null> {
    return this.transfers.get(reference) ?? null;
  }

  async registerWebhook(): Promise<WebhookRegistration> {
    return { id: 'wh_mock', secret: 'mock-webhook-secret' };
  }

  private settle(reference: string, status: BankTransferStatus): void {
    const transfer = this.transfers.get(reference);
    if (transfer) this.transfers.set(reference, { ...transfer, status });
  }
}

function nipFee(amountKobo: number): BigNumber {
  if (money(amountKobo).lte(500_000)) return money(1_000);
  if (money(amountKobo).lte(5_000_000)) return money(2_500);
  return money(5_000);
}
