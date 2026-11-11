import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import type { UnitOfWorkPort } from '../../business/ports/unit-of-work.port.js';

@Injectable()
export class SequelizeUnitOfWork implements UnitOfWorkPort {
  constructor(@InjectConnection() private readonly sequelize: Sequelize) {}

  runInTransaction<T>(fn: (tx: unknown) => Promise<T>): Promise<T> {
    return this.sequelize.transaction((transaction) => fn(transaction));
  }
}
