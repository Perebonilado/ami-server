import { Injectable } from '@nestjs/common';
import type { ClockPort } from '../../ports/clock.port.js';
import type { RevokedTokenRepository } from '../../repositories/revoked-token.repository.js';
import AbstractRequestHandlerTemplate from '../AbstractRequestHandlerTemplate.js';
import { CommandResponse } from '../response/CommandResponse.js';

export interface LogoutRequest {
  userId: string;
  tokenId: string;
  expiresAt: Date;
}

export interface LogoutResult {
  loggedOut: true;
}

@Injectable()
export class LogoutHandler extends AbstractRequestHandlerTemplate<
  LogoutRequest,
  LogoutResult
> {
  constructor(
    private readonly revokedTokens: RevokedTokenRepository,
    private readonly clock: ClockPort,
  ) {
    super();
  }

  protected async handleRequest(
    request: LogoutRequest,
  ): Promise<CommandResponse<LogoutResult>> {
    await this.revokedTokens.revoke({
      tokenId: request.tokenId,
      userId: request.userId,
      expiresAt: request.expiresAt,
    });
    await this.revokedTokens.deleteExpired(this.clock.now());
    return CommandResponse.of({ loggedOut: true });
  }
}
