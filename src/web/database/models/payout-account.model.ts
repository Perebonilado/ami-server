import { Column, DataType, Default, ForeignKey, Model, PrimaryKey, Table, Unique } from 'sequelize-typescript';
import { UserModel } from './user.model.js';

@Table({ tableName: 'payout_accounts', underscored: true })
export class PayoutAccountModel extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @Unique
  @ForeignKey(() => UserModel)
  @Column({ type: DataType.UUID, allowNull: false })
  declare userId: string;

  @Column({ type: DataType.STRING(10), allowNull: false })
  declare bankCode: string;

  @Column({ type: DataType.STRING(100), allowNull: false })
  declare bankName: string;

  @Column({ type: DataType.CHAR(10), allowNull: false })
  declare accountNumber: string;

  @Column({ type: DataType.STRING(150), allowNull: false })
  declare accountName: string;

  @Column({ type: DataType.DATE, allowNull: false })
  declare verifiedAt: Date;
}
