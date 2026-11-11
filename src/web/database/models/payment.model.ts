import { BelongsTo, Column, DataType, Default, ForeignKey, Model, PrimaryKey, Table, Unique } from 'sequelize-typescript';
import { PaymentStatus } from '../../../business/domain/values/enums.js';
import { LicenceModel } from './licence.model.js';
import { UserModel } from './user.model.js';

@Table({ tableName: 'payments', underscored: true })
export class PaymentModel extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @ForeignKey(() => LicenceModel)
  @Column({ type: DataType.UUID, allowNull: false })
  declare licenceId: string;

  @ForeignKey(() => UserModel)
  @Column({ type: DataType.UUID, allowNull: false })
  declare buyerId: string;

  @Unique
  @Column({ type: DataType.STRING(40), allowNull: false })
  declare reference: string;

  @Unique
  @Column({ type: DataType.UUID, allowNull: false })
  declare idempotencyKey: string;

  @Column({ type: DataType.STRING(500), allowNull: true })
  declare paymentUrl: string | null;

  @Column({ type: DataType.BIGINT, allowNull: false })
  declare amountKobo: number;

  @Column({ type: DataType.BIGINT, allowNull: false, defaultValue: 0 })
  declare feeKobo: number;

  @Column({ type: DataType.STRING(20), allowNull: true })
  declare channel: string | null;

  @Column({ type: DataType.ENUM(...Object.values(PaymentStatus)), allowNull: false })
  declare status: PaymentStatus;

  @Column({ type: DataType.DATE, allowNull: true })
  declare paidAt: Date | null;

  @Column({ type: DataType.STRING(64), allowNull: true })
  declare bankRequestId: string | null;

  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 0 })
  declare checkAttempts: number;

  @Column({ type: DataType.DATE, allowNull: true })
  declare nextCheckAt: Date | null;

  @BelongsTo(() => LicenceModel)
  declare licence?: LicenceModel;
}
