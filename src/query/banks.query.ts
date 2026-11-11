import { Inject, Injectable } from '@nestjs/common';
import type { BankPort } from '../business/ports/bank.port.js';
import { BANK_PORT } from '../business/ports/tokens.js';

@Injectable()
export class BanksQuery {
  constructor(@Inject(BANK_PORT) private readonly bank: BankPort) {}

  async execute() {
    return { banks: await this.bank.listBanks() };
  }

  async nameEnquiry(bankCode: string, accountNumber: string) {
    const enquiry = await this.bank.nameEnquiry(bankCode, accountNumber);
    return { bankCode, accountNumber, accountName: enquiry.accountName };
  }
}
