import { Body, Controller, Get, HttpCode, Logger, Param, Post, Query, Res, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';
import { ConfirmPaymentHandler } from '../../business/handlers/payments/confirm-payment.handler.js';
import { SimulatePaymentHandler } from '../../business/handlers/payments/simulate-payment.handler.js';
import { PaymentStatus } from '../../business/domain/values/enums.js';
import { LicenceQuery } from '../../query/licence.query.js';
import { PaymentSessionQuery } from '../../query/payment-session.query.js';
import { CurrentUser } from '../security/current-user.decorator.js';
import { SessionGuard } from '../security/session.guard.js';
import type { AuthenticatedUser } from '../security/session.service.js';
import { PaymentCallbackDto, SimulatePaymentDto } from '../validation/checkout.dto.js';

@Controller('payments')
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name);
  private readonly frontendUrl: string;

  constructor(
    private readonly confirmPaymentHandler: ConfirmPaymentHandler,
    private readonly simulatePaymentHandler: SimulatePaymentHandler,
    private readonly paymentSessionQuery: PaymentSessionQuery,
    private readonly licenceQuery: LicenceQuery,
    config: ConfigService,
  ) {
    this.frontendUrl = config.getOrThrow<string>('FRONTEND_URL');
  }

  @Get('callback')
  async callback(@Query() dto: PaymentCallbackDto, @Res() response: Response) {
    const reference = encodeURIComponent(dto.reference);
    let target = `${this.frontendUrl}/pay/${reference}?status=failed`;
    try {
      const { data } = await this.confirmPaymentHandler.handle({ reference: dto.reference });
      if (data.status === PaymentStatus.PAID) target = `${this.frontendUrl}/licences/${data.licenceNumber}?paid=1`;
      else if (data.status === PaymentStatus.PENDING || data.status === PaymentStatus.INITIATED) {
        target = `${this.frontendUrl}/pay/${reference}`;
      }
    } catch (error) {
      this.logger.warn(`Payment callback for ${dto.reference} could not be confirmed: ${String(error)}`);
    }
    response.redirect(302, target);
  }

  @Get(':reference')
  @UseGuards(SessionGuard)
  session(@CurrentUser() user: AuthenticatedUser, @Param('reference') reference: string) {
    return this.paymentSessionQuery.execute(reference, user.id);
  }

  @Post(':reference/confirm')
  @HttpCode(200)
  @UseGuards(SessionGuard)
  async confirm(@CurrentUser() user: AuthenticatedUser, @Param('reference') reference: string) {
    await this.paymentSessionQuery.execute(reference, user.id);
    await this.confirmPaymentHandler.handle({ reference });
    return this.paymentSessionQuery.execute(reference, user.id);
  }

  @Post(':reference/simulate')
  @HttpCode(200)
  @UseGuards(SessionGuard)
  async simulate(
    @CurrentUser() user: AuthenticatedUser,
    @Param('reference') reference: string,
    @Body() dto: SimulatePaymentDto,
  ) {
    const { data } = await this.simulatePaymentHandler.handle({ buyerId: user.id, reference, outcome: dto.outcome });
    const { licence } = await this.licenceQuery.execute(data.licenceNumber, user);
    return { status: data.status, licence };
  }
}
