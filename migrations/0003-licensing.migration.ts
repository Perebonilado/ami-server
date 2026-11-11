import { DataTypes, Op } from 'sequelize';
import type { Migration } from './umzug.js';

const timestamps = {
  created_at: { type: DataTypes.DATE, allowNull: false },
  updated_at: { type: DataTypes.DATE, allowNull: false },
};

export const up: Migration = async ({ context: q }) => {
  await q.createTable('licences', {
    id: { type: DataTypes.UUID, primaryKey: true, allowNull: false },
    licence_number: { type: DataTypes.CHAR(13), allowNull: false },
    video_id: { type: DataTypes.UUID, allowNull: false, references: { model: 'videos', key: 'id' } },
    buyer_id: { type: DataTypes.UUID, allowNull: false, references: { model: 'users', key: 'id' } },
    part_start_sec: { type: DataTypes.INTEGER, allowNull: true },
    part_end_sec: { type: DataTypes.INTEGER, allowNull: true },
    duration: { type: DataTypes.ENUM('1m', '3m', '1y', 'forever'), allowNull: false },
    price_kobo: { type: DataTypes.BIGINT, allowNull: false },
    platform_fee_kobo: { type: DataTypes.BIGINT, allowNull: false },
    creator_share_kobo: { type: DataTypes.BIGINT, allowNull: false },
    status: { type: DataTypes.ENUM('pending', 'active', 'expired', 'cancelled'), allowNull: false },
    starts_at: { type: DataTypes.DATE, allowNull: true },
    ends_at: { type: DataTypes.DATE, allowNull: true },
    ...timestamps,
  });
  await q.addIndex('licences', ['licence_number'], { name: 'licences_licence_number_unique', unique: true });
  await q.addIndex('licences', ['video_id'], { name: 'licences_video_id_index' });
  await q.addIndex('licences', ['buyer_id'], { name: 'licences_buyer_id_index' });
  await q.addIndex('licences', ['status', 'ends_at'], { name: 'licences_status_ends_at_index' });
  for (const field of ['price_kobo', 'platform_fee_kobo', 'creator_share_kobo']) {
    await q.addConstraint('licences', {
      type: 'check',
      name: `licences_${field}_not_negative`,
      fields: [field],
      where: { [field]: { [Op.gte]: 0 } },
    });
  }

  await q.createTable('payments', {
    id: { type: DataTypes.UUID, primaryKey: true, allowNull: false },
    licence_id: { type: DataTypes.UUID, allowNull: false, references: { model: 'licences', key: 'id' } },
    buyer_id: { type: DataTypes.UUID, allowNull: false, references: { model: 'users', key: 'id' } },
    reference: { type: DataTypes.STRING(40), allowNull: false },
    idempotency_key: { type: DataTypes.UUID, allowNull: false },
    payment_url: { type: DataTypes.STRING(500), allowNull: true },
    amount_kobo: { type: DataTypes.BIGINT, allowNull: false },
    fee_kobo: { type: DataTypes.BIGINT, allowNull: false, defaultValue: 0 },
    channel: { type: DataTypes.STRING(20), allowNull: true },
    status: {
      type: DataTypes.ENUM('initiated', 'pending', 'paid', 'failed', 'partial', 'overpaid'),
      allowNull: false,
    },
    paid_at: { type: DataTypes.DATE, allowNull: true },
    bank_request_id: { type: DataTypes.STRING(64), allowNull: true },
    check_attempts: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    next_check_at: { type: DataTypes.DATE, allowNull: true },
    ...timestamps,
  });
  await q.addIndex('payments', ['reference'], { name: 'payments_reference_unique', unique: true });
  await q.addIndex('payments', ['idempotency_key'], { name: 'payments_idempotency_key_unique', unique: true });
  await q.addIndex('payments', ['licence_id'], { name: 'payments_licence_id_index' });
  await q.addIndex('payments', ['status', 'next_check_at'], { name: 'payments_status_next_check_at_index' });
  await q.addConstraint('payments', {
    type: 'check',
    name: 'payments_amount_kobo_positive',
    fields: ['amount_kobo'],
    where: { amount_kobo: { [Op.gt]: 0 } },
  });
};

export const down: Migration = async ({ context: q }) => {
  await q.dropTable('payments');
  await q.dropTable('licences');
};
