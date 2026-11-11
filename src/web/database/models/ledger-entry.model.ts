import { Column, DataType, Default, Model, PrimaryKey, Table } from 'sequelize-typescript';
import { LedgerAccount, LedgerKind } from '../../../business/domain/values/enums.js';

@Table({ tableName: 'ledger_entries', underscored: true })
export class LedgerEntryModel extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @Column({ type: DataType.ENUM(...Object.values(LedgerAccount)), allowNull: false })
  declare account: LedgerAccount;

  @Column({ type: DataType.UUID, allowNull: true })
  declare userId: string | null;

  @Column({ type: DataType.BIGINT, allowNull: false })
  declare amountKobo: number;

  @Column({ type: DataType.ENUM(...Object.values(LedgerKind)), allowNull: false })
  declare kind: LedgerKind;

  @Column({ type: DataType.UUID, allowNull: true })
  declare licenceId: string | null;

  @Column({ type: DataType.UUID, allowNull: true })
  declare payoutId: string | null;
}
