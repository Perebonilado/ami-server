import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op, Transaction } from 'sequelize';
import type { Licence } from '../../business/domain/entities/licence.js';
import { LicenceStatus } from '../../business/domain/values/enums.js';
import type { LicenceRepository, NewLicence } from '../../business/repositories/licence.repository.js';
import { LicenceModel } from '../database/models/index.js';
import { toLicenceEntity } from './mappers.js';

@Injectable()
export class SequelizeLicenceRepository implements LicenceRepository {
  constructor(@InjectModel(LicenceModel) private readonly licences: typeof LicenceModel) {}

  async findByIdForUpdate(id: string, tx: unknown): Promise<Licence | null> {
    const row = await this.licences.findOne({
      where: { id },
      transaction: tx as Transaction,
      lock: Transaction.LOCK.UPDATE,
    });
    return row ? toLicenceEntity(row) : null;
  }

  async numberExists(licenceNumber: string, tx?: unknown): Promise<boolean> {
    return (await this.licences.count({ where: { licenceNumber }, transaction: tx as Transaction | undefined })) > 0;
  }

  async create(licence: NewLicence, tx?: unknown): Promise<Licence> {
    const row = await this.licences.create({ ...licence }, { transaction: tx as Transaction | undefined });
    return toLicenceEntity(row);
  }

  async save(licence: Licence, tx?: unknown): Promise<void> {
    const { id, ...props } = licence.props;
    await this.licences.update(props, { where: { id }, transaction: tx as Transaction | undefined });
  }

  async expireEnded(now: Date): Promise<number> {
    const [count] = await this.licences.update(
      { status: LicenceStatus.EXPIRED },
      { where: { status: LicenceStatus.ACTIVE, endsAt: { [Op.lte]: now } } },
    );
    return count;
  }
}
