import { Body, Controller, Get, HttpCode, Post, Put, UseGuards } from '@nestjs/common';
import { RequestPayoutHandler } from '../../business/handlers/payouts/request-payout.handler.js';
import { SavePayoutAccountHandler } from '../../business/handlers/payouts/save-payout-account.handler.js';
import { BanksQuery } from '../../query/banks.query.js';
import { PayoutsQuery } from '../../query/payouts.query.js';
import { CurrentUser } from '../security/current-user.decorator.js';
import { SessionGuard } from '../security/session.guard.js';
import type { AuthenticatedUser } from '../security/session.service.js';
import { BankAccountDto, RequestPayoutDto } from '../validation/payout.dto.js';

@Controller()
export class PayoutsController {
  constructor(
    private readonly banksQuery: BanksQuery,
    private readonly payoutsQuery: PayoutsQuery,
    private readonly savePayoutAccountHandler: SavePayoutAccountHandler,
    private readonly requestPayoutHandler: RequestPayoutHandler,
  ) {}

  @Get('banks')
  banks() {
    return this.banksQuery.execute();
  }

  @Get('payouts')
  @UseGuards(SessionGuard)
  payouts(@CurrentUser() user: AuthenticatedUser) {
    return this.payoutsQuery.execute(user.id);
  }

  @Post('payouts/account/enquiry')
  @HttpCode(200)
  @UseGuards(SessionGuard)
  enquiry(@Body() dto: BankAccountDto) {
    return this.banksQuery.nameEnquiry(dto.bankCode, dto.accountNumber);
  }

  @Put('payouts/account')
  @UseGuards(SessionGuard)
  async saveAccount(@CurrentUser() user: AuthenticatedUser, @Body() dto: BankAccountDto) {
    await this.savePayoutAccountHandler.handle({ userId: user.id, ...dto });
    return this.payoutsQuery.execute(user.id);
  }

  @Post('payouts')
  @HttpCode(201)
  @UseGuards(SessionGuard)
  async requestPayout(@CurrentUser() user: AuthenticatedUser, @Body() dto: RequestPayoutDto) {
    const { data } = await this.requestPayoutHandler.handle({ userId: user.id, amountKobo: dto.amountKobo });
    return { payout: data };
  }
}
