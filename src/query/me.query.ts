import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { UserModel } from '../web/database/models/index.js';
import { userJson } from './shared/serializers.js';

@Injectable()
export class MeQuery {
  constructor(@InjectModel(UserModel) private readonly users: typeof UserModel) {}

  async execute(userId: string | null) {
    if (!userId) return { user: null };
    const row = await this.users.findByPk(userId);
    return { user: row ? userJson(row) : null };
  }
}
