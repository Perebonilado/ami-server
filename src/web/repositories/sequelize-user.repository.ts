import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Transaction } from 'sequelize';
import type { User } from '../../business/domain/entities/user.js';
import type { NewUser, UserRepository } from '../../business/repositories/user.repository.js';
import { UserModel } from '../database/models/index.js';
import { toUserEntity } from './mappers.js';

@Injectable()
export class SequelizeUserRepository implements UserRepository {
  constructor(@InjectModel(UserModel) private readonly users: typeof UserModel) {}

  async findById(id: string, tx?: unknown): Promise<User | null> {
    const row = await this.users.findByPk(id, { transaction: tx as Transaction | undefined });
    return row ? toUserEntity(row) : null;
  }

  async findByIdForUpdate(id: string, tx: unknown): Promise<User | null> {
    const row = await this.users.findOne({
      where: { id },
      transaction: tx as Transaction,
      lock: Transaction.LOCK.UPDATE,
    });
    return row ? toUserEntity(row) : null;
  }

  async findByEmail(email: string, tx?: unknown): Promise<User | null> {
    const row = await this.users.findOne({ where: { email }, transaction: tx as Transaction | undefined });
    return row ? toUserEntity(row) : null;
  }

  async create(user: NewUser, tx?: unknown): Promise<User> {
    const row = await this.users.create({ ...user }, { transaction: tx as Transaction | undefined });
    return toUserEntity(row);
  }

  async save(user: User, tx?: unknown): Promise<void> {
    const { id, ...props } = user.props;
    await this.users.update(props, { where: { id }, transaction: tx as Transaction | undefined });
  }
}
