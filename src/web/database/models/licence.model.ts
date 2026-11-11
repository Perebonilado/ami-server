import { BelongsTo, Column, DataType, Default, ForeignKey, Model, PrimaryKey, Table, Unique } from 'sequelize-typescript';
import { LicenceDuration, LicenceStatus } from '../../../business/domain/values/enums.js';
import { UserModel } from './user.model.js';
import { VideoModel } from './video.model.js';

@Table({ tableName: 'licences', underscored: true })
export class LicenceModel extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @Unique
  @Column({ type: DataType.CHAR(13), allowNull: false })
  declare licenceNumber: string;

  @ForeignKey(() => VideoModel)
  @Column({ type: DataType.UUID, allowNull: false })
  declare videoId: string;

  @ForeignKey(() => UserModel)
  @Column({ type: DataType.UUID, allowNull: false })
  declare buyerId: string;

  @Column({ type: DataType.INTEGER, allowNull: true })
  declare partStartSec: number | null;

  @Column({ type: DataType.INTEGER, allowNull: true })
  declare partEndSec: number | null;

  @Column({ type: DataType.ENUM(...Object.values(LicenceDuration)), allowNull: false })
  declare duration: LicenceDuration;

  @Column({ type: DataType.BIGINT, allowNull: false })
  declare priceKobo: number;

  @Column({ type: DataType.BIGINT, allowNull: false })
  declare platformFeeKobo: number;

  @Column({ type: DataType.BIGINT, allowNull: false })
  declare creatorShareKobo: number;

  @Column({ type: DataType.ENUM(...Object.values(LicenceStatus)), allowNull: false })
  declare status: LicenceStatus;

  @Column({ type: DataType.DATE, allowNull: true })
  declare startsAt: Date | null;

  @Column({ type: DataType.DATE, allowNull: true })
  declare endsAt: Date | null;

  @BelongsTo(() => VideoModel)
  declare video?: VideoModel;

  @BelongsTo(() => UserModel)
  declare buyer?: UserModel;
}
