import { Column, DataType, Default, Model, PrimaryKey, Table, Unique } from 'sequelize-typescript';

@Table({ tableName: 'webhook_events', underscored: true })
export class WebhookEventModel extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @Unique
  @Column({ type: DataType.STRING(100), allowNull: false })
  declare eventId: string;

  @Column({ type: DataType.STRING(60), allowNull: false })
  declare type: string;

  @Column({ type: DataType.JSON, allowNull: false })
  declare payload: unknown;

  @Column({ type: DataType.DATE, allowNull: true })
  declare processedAt: Date | null;

  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 0 })
  declare attempts: number;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare error: string | null;
}

@Table({ tableName: 'webhook_subscriptions', underscored: true })
export class WebhookSubscriptionModel extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @Column({ type: DataType.STRING(100), allowNull: false })
  declare bankWebhookId: string;

  @Column({ type: DataType.STRING(500), allowNull: false })
  declare url: string;

  @Column({ type: DataType.STRING(255), allowNull: false })
  declare secret: string;
}

@Table({ tableName: 'search_intents', underscored: true })
export class SearchIntentModel extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @Unique
  @Column({ type: DataType.STRING(200), allowNull: false })
  declare queryKey: string;

  @Column({ type: DataType.JSON, allowNull: false })
  declare keywords: string[];

  @Column({ type: DataType.STRING(20), allowNull: true })
  declare category: string | null;

  @Column({ type: DataType.STRING(60), allowNull: false })
  declare model: string;

  @Column({ type: DataType.DATE, allowNull: false })
  declare expiresAt: Date;
}

@Table({ tableName: 'bank_requests', underscored: true, updatedAt: false })
export class BankRequestModel extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @Column({ type: DataType.STRING(200), allowNull: false })
  declare endpoint: string;

  @Column({ type: DataType.STRING(10), allowNull: false })
  declare method: string;

  @Column({ type: DataType.STRING(64), allowNull: true })
  declare idempotencyKey: string | null;

  @Column({ type: DataType.STRING(40), allowNull: true })
  declare ourReference: string | null;

  @Column({ type: DataType.INTEGER, allowNull: true })
  declare httpStatus: number | null;

  @Column({ type: DataType.STRING(64), allowNull: true })
  declare bankRequestId: string | null;

  @Column({ type: DataType.STRING(60), allowNull: true })
  declare errorCode: string | null;

  @Column({ type: DataType.INTEGER, allowNull: false })
  declare durationMs: number;
}
