import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import type { Request } from 'express';
import { TokenService } from '../../auth/token.service.js';
import type { RevokedTokenRepository } from '../../business/repositories/revoked-token.repository.js';
import { REVOKED_TOKEN_REPOSITORY } from '../../business/repositories/tokens.js';
import { UserModel } from '../database/models/index.js';
import { SESSION_COOKIE } from './session-cookie.js';

export interface AuthenticatedUser {
  id: string;
  isAdmin: boolean;
  suspended: boolean;
  tokenId: string;
  tokenExpiresAt: Date;
}

@Injectable()
export class SessionService {
  constructor(
    private readonly tokens: TokenService,
    @Inject(REVOKED_TOKEN_REPOSITORY) private readonly revokedTokens: RevokedTokenRepository,
    @InjectModel(UserModel) private readonly users: typeof UserModel,
  ) {}

  async read(request: Request): Promise<AuthenticatedUser | null> {
    const token = this.tokenFrom(request);
    const verified = token ? this.tokens.verify(token) : null;
    if (!verified || (await this.revokedTokens.isRevoked(verified.tokenId))) return null;

    const user = await this.users.findByPk(verified.userId);
    if (!user) return null;
    return {
      id: user.id,
      isAdmin: user.isAdmin,
      suspended: user.suspended,
      tokenId: verified.tokenId,
      tokenExpiresAt: verified.expiresAt,
    };
  }

  private tokenFrom(request: Request): string | null {
    const cookies = (request as Request & { cookies?: Record<string, string> }).cookies;
    if (cookies?.[SESSION_COOKIE]) return cookies[SESSION_COOKIE];
    const header = request.headers.authorization;
    return header?.startsWith('Bearer ') ? header.slice('Bearer '.length) : null;
  }
}
