import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import type { RevokedTokenRepository } from '../../business/repositories/revoked-token.repository.js';
import { RevokedTokenModel } from '../database/models/index.js';

@Injectable()
export class SequelizeRevokedTokenRepository implements RevokedTokenRepository {
  constructor(@InjectModel(RevokedTokenModel) private readonly tokens: typeof RevokedTokenModel) {}

  async revoke(token: { tokenId: string; userId: string; expiresAt: Date }): Promise<void> {
    await this.tokens.findOrCreate({ where: { tokenId: token.tokenId }, defaults: { ...token } });
  }

  async isRevoked(tokenId: string): Promise<boolean> {
    return (await this.tokens.count({ where: { tokenId } })) > 0;
  }

  async deleteExpired(now: Date): Promise<void> {
    await this.tokens.destroy({ where: { expiresAt: { [Op.lt]: now } } });
  }
}
