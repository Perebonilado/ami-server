import { Column, DataType, Default, ForeignKey, Model, PrimaryKey, Table, Unique } from 'sequelize-typescript';
import { PayoutStatus } from '../../../business/domain/values/enums.js';
import { PayoutAccountModel } from './payout-account.model.js';
import { UserModel } from './user.model.js';

@Table({ tableName: 'payouts', underscored: true })
export class PayoutModel extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @ForeignKey(() => UserModel)
  @Column({ type: DataType.UUID, allowNull: false })
  declare userId: string;

  @ForeignKey(() => PayoutAccountModel)
  @Column({ type: DataType.UUID, allowNull: false })
  declare payoutAccountId: string;

  @Column({ type: DataType.STRING(10), allowNull: false })
  declare bankCode: string;

  @Column({ type: DataType.CHAR(10), allowNull: false })
  declare accountNumber: string;

  @Column({ type: DataType.BIGINT, allowNull: false })
  declare amountKobo: number;

  @Column({ type: DataType.BIGINT, allowNull: false, defaultValue: 0 })
  declare feeKobo: number;

  @Column({ type: DataType.BIGINT, allowNull: false, defaultValue: 0 })
  declare vatKobo: number;

  @Column({ type: DataType.BIGINT, allowNull: false, defaultValue: 0 })
  declare stampDutyKobo: number;

  @Unique
  @Column({ type: DataType.STRING(40), allowNull: false })
  declare reference: string;

  @Unique
  @Column({ type: DataType.UUID, allowNull: false })
  declare idempotencyKey: string;

  @Column({ type: DataType.STRING(100), allowNull: true })
  declare nameEnquiryRef: string | null;

  @Column({ type: DataType.STRING(100), allowNull: true })
  declare sessionId: string | null;

  @Column({ type: DataType.ENUM(...Object.values(PayoutStatus)), allowNull: false })
  declare status: PayoutStatus;

  @Column({ type: DataType.DATE, allowNull: true })
  declare settledAt: Date | null;

  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 0 })
  declare checkAttempts: number;

  @Column({ type: DataType.DATE, allowNull: true })
  declare nextCheckAt: Date | null;
}
