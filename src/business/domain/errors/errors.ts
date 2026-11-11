import { DomainError } from './domain-error.js';

export class InvalidInputError extends DomainError {
  constructor(message: string) {
    super('INVALID_INPUT', 400, message);
  }
}

export class EmailTakenError extends DomainError {
  constructor(message = 'An account with this email already exists. Log in instead.') {
    super('EMAIL_TAKEN', 409, message);
  }
}

export class InvalidCredentialsError extends DomainError {
  constructor(message = 'That email and password don’t match an account.') {
    super('INVALID_CREDENTIALS', 401, message);
  }
}

export class AccountSuspendedError extends DomainError {
  constructor(message = 'This account is suspended. Contact Àmì support.') {
    super('ACCOUNT_SUSPENDED', 403, message);
  }
}

export class UserNotFoundError extends DomainError {
  constructor(message = 'User not found.') {
    super('USER_NOT_FOUND', 404, message);
  }
}

export class VideoNotFoundError extends DomainError {
  constructor(message = 'This video isn’t available.') {
    super('VIDEO_NOT_FOUND', 404, message);
  }
}

export class NotVideoOwnerError extends DomainError {
  constructor(message = 'Only the creator can change this video.') {
    super('NOT_VIDEO_OWNER', 403, message);
  }
}

export class DuplicateFileError extends DomainError {
  constructor(title: string) {
    super('DUPLICATE_FILE', 409, `This exact file is already on Àmì (${title}).`);
  }
}

export class InvalidVideoError extends DomainError {
  constructor(message: string) {
    super('INVALID_VIDEO', 400, message);
  }
}

export class FileTooLargeError extends DomainError {
  constructor(message = 'Videos can be up to 200 MB.') {
    super('FILE_TOO_LARGE', 413, message);
  }
}

export class OwnVideoError extends DomainError {
  constructor(message = 'You can’t license your own video.') {
    super('OWN_VIDEO', 403, message);
  }
}

export class InvalidPartError extends DomainError {
  constructor(message: string) {
    super('INVALID_PART', 400, message);
  }
}

export class LicenceNotFoundError extends DomainError {
  constructor(message = 'No licence with that number.') {
    super('LICENCE_NOT_FOUND', 404, message);
  }
}

export class LicenceNotActiveError extends DomainError {
  constructor(message = 'Only an active licence can be downloaded.') {
    super('LICENCE_NOT_ACTIVE', 403, message);
  }
}

export class PaymentNotFoundError extends DomainError {
  constructor(message = 'We couldn’t find this payment.') {
    super('PAYMENT_NOT_FOUND', 404, message);
  }
}

export class PaymentSimulationDisabledError extends DomainError {
  constructor(message = 'Payment simulation is turned off.') {
    super('SIMULATION_DISABLED', 403, message);
  }
}

export class PayoutAccountMissingError extends DomainError {
  constructor(message = 'Add a bank account for payouts first.') {
    super('PAYOUT_ACCOUNT_MISSING', 409, message);
  }
}

export class InsufficientBalanceError extends DomainError {
  constructor(message = 'That’s more than your available earnings.') {
    super('INSUFFICIENT_BALANCE', 422, message);
  }
}

export class PayoutTooSmallError extends DomainError {
  constructor(message = 'Payouts start at ₦1,000.') {
    super('PAYOUT_TOO_SMALL', 422, message);
  }
}

export class BankUnavailableError extends DomainError {
  constructor(message = 'The bank isn’t responding right now. Try again in a moment.') {
    super('BANK_UNAVAILABLE', 502, message);
  }
}

export class BankRateLimitedError extends DomainError {
  constructor(message = 'Too many bank requests right now. Try again in a minute.') {
    super('BANK_RATE_LIMITED', 429, message);
  }
}

export class BankRejectedError extends DomainError {
  constructor(
    public readonly bankCode: string,
    message: string,
    httpStatus = 422,
  ) {
    super(bankCode, httpStatus, message);
  }
}

export class BankTimeoutError extends DomainError {
  constructor(message = 'The bank didn’t confirm in time. We’re checking the result.') {
    super('BANK_TIMEOUT', 504, message);
  }
}

export class AiUnavailableError extends DomainError {
  constructor(message = 'Search assistance is unavailable.') {
    super('AI_UNAVAILABLE', 503, message);
  }
}
