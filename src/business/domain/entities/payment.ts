import { PaymentStatus } from '../values/enums.js';

export interface PaymentProps {
  id: string;
  licenceId: string;
  buyerId: string;
  reference: string;
  idempotencyKey: string;
  paymentUrl: string | null;
  amountKobo: number;
  feeKobo: number;
  channel: string | null;
  status: PaymentStatus;
  paidAt: Date | null;
  bankRequestId: string | null;
  checkAttempts: number;
  nextCheckAt: Date | null;
}

export class Payment {
  constructor(public readonly props: PaymentProps) {}

  get id() {
    return this.props.id;
  }
  get reference() {
    return this.props.reference;
  }
  get status() {
    return this.props.status;
  }
  get licenceId() {
    return this.props.licenceId;
  }

  isPaid(): boolean {
    return this.props.status === PaymentStatus.PAID;
  }

  isSettled(): boolean {
    return this.props.status === PaymentStatus.PAID || this.props.status === PaymentStatus.FAILED;
  }

  markPaid(input: { feeKobo: number; channel: string | null; paidAt: Date }): void {
    this.props.status = PaymentStatus.PAID;
    this.props.feeKobo = input.feeKobo;
    this.props.channel = input.channel;
    this.props.paidAt = input.paidAt;
  }

  markStatus(status: PaymentStatus): void {
    this.props.status = status;
  }
}
