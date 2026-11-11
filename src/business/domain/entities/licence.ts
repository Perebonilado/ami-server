import { LicenceDuration, LicenceStatus } from '../values/enums.js';
import { licenceEndDate } from '../values/pricing.js';

export interface LicenceProps {
  id: string;
  licenceNumber: string;
  videoId: string;
  buyerId: string;
  partStartSec: number | null;
  partEndSec: number | null;
  duration: LicenceDuration;
  priceKobo: number;
  platformFeeKobo: number;
  creatorShareKobo: number;
  status: LicenceStatus;
  startsAt: Date | null;
  endsAt: Date | null;
}

export class Licence {
  constructor(public readonly props: LicenceProps) {}

  get id() {
    return this.props.id;
  }
  get licenceNumber() {
    return this.props.licenceNumber;
  }
  get status() {
    return this.props.status;
  }

  isPending(): boolean {
    return this.props.status === LicenceStatus.PENDING;
  }

  activate(now: Date): void {
    this.props.status = LicenceStatus.ACTIVE;
    this.props.startsAt = now;
    this.props.endsAt = licenceEndDate(now, this.props.duration);
  }

  cancel(): void {
    this.props.status = LicenceStatus.CANCELLED;
  }
}

export function effectiveLicenceStatus(status: LicenceStatus, endsAt: Date | null, now: Date): LicenceStatus {
  if (status === LicenceStatus.ACTIVE && endsAt !== null && endsAt.getTime() <= now.getTime()) {
    return LicenceStatus.EXPIRED;
  }
  return status;
}
