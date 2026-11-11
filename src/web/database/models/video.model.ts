import { BelongsTo, Column, DataType, Default, ForeignKey, Model, PrimaryKey, Table, Unique } from 'sequelize-typescript';
import { VideoCategory, VideoStatus } from '../../../business/domain/values/enums.js';
import { UserModel } from './user.model.js';

@Table({ tableName: 'videos', underscored: true })
export class VideoModel extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @ForeignKey(() => UserModel)
  @Column({ type: DataType.UUID, allowNull: false })
  declare creatorId: string;

  @Column({ type: DataType.STRING(120), allowNull: false })
  declare title: string;

  @Column({ type: DataType.TEXT, allowNull: false })
  declare description: string;

  @Column({ type: DataType.ENUM(...Object.values(VideoCategory)), allowNull: false })
  declare category: VideoCategory;

  @Column({ type: DataType.JSON, allowNull: false })
  declare tags: string[];

  @Column({ type: DataType.JSON, allowNull: false })
  declare aiKeywords: string[];

  @Column({ type: DataType.TEXT, allowNull: false })
  declare searchText: string;

  @Column({ type: DataType.INTEGER, allowNull: false })
  declare durationSec: number;

  @Column({ type: DataType.BIGINT, allowNull: false })
  declare basePriceKobo: number;

  @Unique
  @Column({ type: DataType.CHAR(64), allowNull: false })
  declare fileSha256: string;

  @Column({ type: DataType.STRING(500), allowNull: false })
  declare fileUrl: string;

  @Column({ type: DataType.BIGINT, allowNull: false })
  declare fileSizeBytes: number;

  @Column({ type: DataType.STRING(500), allowNull: false })
  declare previewUrl: string;

  @Column({ type: DataType.TEXT('medium'), allowNull: true })
  declare thumbnailUrl: string | null;

  @Column({ type: DataType.STRING(9), allowNull: false })
  declare posterFrom: string;

  @Column({ type: DataType.STRING(9), allowNull: false })
  declare posterTo: string;

  @Column({ type: DataType.ENUM(...Object.values(VideoStatus)), allowNull: false })
  declare status: VideoStatus;

  @BelongsTo(() => UserModel)
  declare creator?: UserModel;
}
