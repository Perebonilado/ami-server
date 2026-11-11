export type BankPaymentStatus = 'pending' | 'successful' | 'failed' | 'partial' | 'overpaid';
export type BankTransferStatus = 'pending' | 'successful' | 'failed' | 'reversed';

export interface CheckoutRequest {
  reference: string;
  idempotencyKey: string;
  amountKobo: number;
  customerEmail: string;
  customerName: string;
  narration: string;
  callbackUrl: string;
}

export interface CheckoutSession {
  paymentUrl: string;
  bankRequestId: string | null;
}

export interface PaymentVerification {
  reference: string;
  status: BankPaymentStatus;
  amountKobo: number;
  feeKobo: number;
  channel: string | null;
  paidAt: Date | null;
}

export interface BankInfo {
  code: string;
  name: string;
}

export interface NameEnquiry {
  bankCode: string;
  accountNumber: string;
  accountName: string;
  nameEnquiryRef: string;
}

export interface TransferRequest {
  reference: string;
  idempotencyKey: string;
  sourceAccount: string;
  bankCode: string;
  accountNumber: string;
  nameEnquiryRef: string;
  amountKobo: number;
  narration: string;
}

export interface TransferResult {
  reference: string;
  status: BankTransferStatus;
  feeKobo: number;
  vatKobo: number;
  stampDutyKobo: number;
  sessionId: string | null;
}

export interface WebhookRegistration {
  id: string;
  secret: string;
}

export interface BankPort {
  createCheckout(request: CheckoutRequest): Promise<CheckoutSession>;
  verifyPayment(reference: string): Promise<PaymentVerification>;
  simulatePayment(reference: string, outcome: 'paid' | 'failed'): Promise<void>;
  listBanks(): Promise<BankInfo[]>;
  nameEnquiry(bankCode: string, accountNumber: string): Promise<NameEnquiry>;
  transfer(request: TransferRequest): Promise<TransferResult>;
  getTransfer(reference: string, bankCode: string): Promise<TransferResult | null>;
  registerWebhook(url: string): Promise<WebhookRegistration>;
}
