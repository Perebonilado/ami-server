import { Injectable } from '@nestjs/common';
import { InvalidInputError } from '../../domain/errors/errors.js';
import type { BankPort } from '../../ports/bank.port.js';
import type { ClockPort } from '../../ports/clock.port.js';
import type { PayoutAccount, PayoutAccountRepository } from '../../repositories/payout-account.repository.js';
import AbstractRequestHandlerTemplate from '../AbstractRequestHandlerTemplate.js';
import { CommandResponse } from '../response/CommandResponse.js';

export interface SavePayoutAccountRequest {
  userId: string;
  bankCode: string;
  accountNumber: string;
}

@Injectable()
export class SavePayoutAccountHandler extends AbstractRequestHandlerTemplate<SavePayoutAccountRequest, PayoutAccount> {
  constructor(
    private readonly bank: BankPort,
    private readonly accounts: PayoutAccountRepository,
    private readonly clock: ClockPort,
  ) {
    super();
  }

  protected async handleRequest(request: SavePayoutAccountRequest): Promise<CommandResponse<PayoutAccount>> {
    const banks = await this.bank.listBanks();
    const bank = banks.find((b) => b.code === request.bankCode);
    if (!bank) throw new InvalidInputError('Choose a bank from the list.');

    const enquiry = await this.bank.nameEnquiry(request.bankCode, request.accountNumber);
    const account = await this.accounts.upsert({
      userId: request.userId,
      bankCode: bank.code,
      bankName: bank.name,
      accountNumber: enquiry.accountNumber,
      accountName: enquiry.accountName,
      verifiedAt: this.clock.now(),
    });
    return CommandResponse.of(account);
  }
}
