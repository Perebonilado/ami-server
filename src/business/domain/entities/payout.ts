import { PayoutStatus } from '../values/enums.js';

export interface PayoutProps {
  id: string;
  userId: string;
  payoutAccountId: string;
  bankCode: string;
  accountNumber: string;
  amountKobo: number;
  feeKobo: number;
  vatKobo: number;
  stampDutyKobo: number;
  reference: string;
  idempotencyKey: string;
  nameEnquiryRef: string | null;
  sessionId: string | null;
  status: PayoutStatus;
  settledAt: Date | null;
  checkAttempts: number;
  nextCheckAt: Date | null;
}

export class Payout {
  constructor(public readonly props: PayoutProps) {}

  get id() {
    return this.props.id;
  }
  get reference() {
    return this.props.reference;
  }
  get status() {
    return this.props.status;
  }
  get amountKobo() {
    return this.props.amountKobo;
  }

  isFinal(): boolean {
    return [PayoutStatus.SUCCESSFUL, PayoutStatus.FAILED, PayoutStatus.REVERSED].includes(this.props.status);
  }

  isReturned(): boolean {
    return this.props.status === PayoutStatus.FAILED || this.props.status === PayoutStatus.REVERSED;
  }
}
