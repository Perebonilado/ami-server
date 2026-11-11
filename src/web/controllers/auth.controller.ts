import { Body, Controller, HttpCode, Post, Req, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { LoginHandler } from '../../business/handlers/identity/login.handler.js';
import { LogoutHandler } from '../../business/handlers/identity/logout.handler.js';
import { SignupHandler } from '../../business/handlers/identity/signup.handler.js';
import { MeQuery } from '../../query/me.query.js';
import { clearSessionCookie, setSessionCookie } from '../security/session-cookie.js';
import { SessionService } from '../security/session.service.js';
import { LoginDto, SignupDto } from '../validation/auth.dto.js';

@Controller('auth')
export class AuthController {
  private readonly secureCookie: boolean;

  constructor(
    private readonly signupHandler: SignupHandler,
    private readonly loginHandler: LoginHandler,
    private readonly logoutHandler: LogoutHandler,
    private readonly meQuery: MeQuery,
    private readonly sessions: SessionService,
    config: ConfigService,
  ) {
    this.secureCookie = config.get<string>('COOKIE_SECURE') === 'true';
  }

  @Post('signup')
  @HttpCode(201)
  async signup(@Body() dto: SignupDto, @Res({ passthrough: true }) response: Response) {
    const { data } = await this.signupHandler.handle(dto);
    setSessionCookie(response, data.token, data.expiresIn, this.secureCookie);
    return this.meQuery.execute(data.userId);
  }

  @Post('login')
  @HttpCode(200)
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) response: Response) {
    const { data } = await this.loginHandler.handle(dto);
    setSessionCookie(response, data.token, data.expiresIn, this.secureCookie);
    return this.meQuery.execute(data.userId);
  }

  @Post('logout')
  @HttpCode(200)
  async logout(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
    const user = await this.sessions.read(request);
    if (user) {
      await this.logoutHandler.handle({ userId: user.id, tokenId: user.tokenId, expiresAt: user.tokenExpiresAt });
    }
    clearSessionCookie(response, this.secureCookie);
    return { ok: true };
  }
}
