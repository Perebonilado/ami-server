import { Body, Controller, Headers, HttpCode, Post, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CreateCheckoutHandler } from '../../business/handlers/licensing/create-checkout.handler.js';
import { CurrentUser } from '../security/current-user.decorator.js';
import { ReturnOrigins } from '../security/return-origins.js';
import { SessionGuard } from '../security/session.guard.js';
import type { AuthenticatedUser } from '../security/session.service.js';
import { CheckoutDto } from '../validation/checkout.dto.js';

@Controller('checkout')
@UseGuards(SessionGuard)
export class CheckoutController {
  private readonly returns: ReturnOrigins;

  constructor(
    private readonly createCheckoutHandler: CreateCheckoutHandler,
    config: ConfigService,
  ) {
    this.returns = new ReturnOrigins(config);
  }

  @Post()
  @HttpCode(201)
  async checkout(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CheckoutDto,
    @Headers('origin') origin: string | undefined,
  ) {
    const { data } = await this.createCheckoutHandler.handle({
      buyerId: user.id,
      videoId: dto.videoId,
      part: dto.part ?? null,
      duration: dto.duration,
      callbackUrl: this.returns.callbackFor(origin),
    });
    return data;
  }
}
