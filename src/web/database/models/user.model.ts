import { Column, DataType, Default, Model, PrimaryKey, Table, Unique } from 'sequelize-typescript';

@Table({ tableName: 'users', underscored: true })
export class UserModel extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @Column({ type: DataType.STRING(120), allowNull: false })
  declare name: string;

  @Unique
  @Column({ type: DataType.STRING(190), allowNull: false })
  declare email: string;

  @Column({ type: DataType.STRING(255), allowNull: false })
  declare passwordHash: string;

  @Column({ type: DataType.STRING(120), allowNull: true })
  declare businessName: string | null;

  @Column({ type: DataType.STRING(500), allowNull: true })
  declare avatarUrl: string | null;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
  declare isAdmin: boolean;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
  declare verified: boolean;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
  declare suspended: boolean;
}
