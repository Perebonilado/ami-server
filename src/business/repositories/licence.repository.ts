import type { Licence, LicenceProps } from '../domain/entities/licence.js';

export type NewLicence = Omit<LicenceProps, 'id'>;

export interface LicenceRepository {
  findByIdForUpdate(id: string, tx: unknown): Promise<Licence | null>;
  numberExists(licenceNumber: string, tx?: unknown): Promise<boolean>;
  create(licence: NewLicence, tx?: unknown): Promise<Licence>;
  save(licence: Licence, tx?: unknown): Promise<void>;
  expireEnded(now: Date): Promise<number>;
}
