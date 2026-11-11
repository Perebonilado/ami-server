import { Column, DataType, ForeignKey, Model, PrimaryKey, Table } from 'sequelize-typescript';
import { UserModel } from './user.model.js';

@Table({ tableName: 'revoked_tokens', underscored: true, updatedAt: false })
export class RevokedTokenModel extends Model {
  @PrimaryKey
  @Column(DataType.UUID)
  declare tokenId: string;

  @ForeignKey(() => UserModel)
  @Column({ type: DataType.UUID, allowNull: false })
  declare userId: string;

  @Column({ type: DataType.DATE, allowNull: false })
  declare expiresAt: Date;
}
