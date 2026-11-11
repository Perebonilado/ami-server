import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import { CreateCheckoutHandler } from '../../business/handlers/licensing/create-checkout.handler.js';
import { CurrentUser } from '../security/current-user.decorator.js';
import { SessionGuard } from '../security/session.guard.js';
import type { AuthenticatedUser } from '../security/session.service.js';
import { CheckoutDto } from '../validation/checkout.dto.js';

@Controller('checkout')
@UseGuards(SessionGuard)
export class CheckoutController {
  constructor(private readonly createCheckoutHandler: CreateCheckoutHandler) {}

  @Post()
  @HttpCode(201)
  async checkout(@CurrentUser() user: AuthenticatedUser, @Body() dto: CheckoutDto) {
    const { data } = await this.createCheckoutHandler.handle({
      buyerId: user.id,
      videoId: dto.videoId,
      part: dto.part ?? null,
      duration: dto.duration,
    });
    return data;
  }
}
