import { DataTypes, Op } from 'sequelize';
import type { Migration } from './umzug.js';

const timestamps = {
  created_at: { type: DataTypes.DATE, allowNull: false },
  updated_at: { type: DataTypes.DATE, allowNull: false },
};

export const up: Migration = async ({ context: q }) => {
  await q.createTable('payout_accounts', {
    id: { type: DataTypes.UUID, primaryKey: true, allowNull: false },
    user_id: { type: DataTypes.UUID, allowNull: false, references: { model: 'users', key: 'id' } },
    bank_code: { type: DataTypes.STRING(10), allowNull: false },
    bank_name: { type: DataTypes.STRING(100), allowNull: false },
    account_number: { type: DataTypes.CHAR(10), allowNull: false },
    account_name: { type: DataTypes.STRING(150), allowNull: false },
    verified_at: { type: DataTypes.DATE, allowNull: false },
    ...timestamps,
  });
  await q.addIndex('payout_accounts', ['user_id'], { name: 'payout_accounts_user_id_unique', unique: true });

  await q.createTable('payouts', {
    id: { type: DataTypes.UUID, primaryKey: true, allowNull: false },
    user_id: { type: DataTypes.UUID, allowNull: false, references: { model: 'users', key: 'id' } },
    payout_account_id: { type: DataTypes.UUID, allowNull: false, references: { model: 'payout_accounts', key: 'id' } },
    bank_code: { type: DataTypes.STRING(10), allowNull: false },
    account_number: { type: DataTypes.CHAR(10), allowNull: false },
    amount_kobo: { type: DataTypes.BIGINT, allowNull: false },
    fee_kobo: { type: DataTypes.BIGINT, allowNull: false, defaultValue: 0 },
    vat_kobo: { type: DataTypes.BIGINT, allowNull: false, defaultValue: 0 },
    stamp_duty_kobo: { type: DataTypes.BIGINT, allowNull: false, defaultValue: 0 },
    reference: { type: DataTypes.STRING(40), allowNull: false },
    idempotency_key: { type: DataTypes.UUID, allowNull: false },
    name_enquiry_ref: { type: DataTypes.STRING(100), allowNull: true },
    session_id: { type: DataTypes.STRING(100), allowNull: true },
    status: { type: DataTypes.ENUM('pending', 'successful', 'failed', 'reversed', 'unknown'), allowNull: false },
    settled_at: { type: DataTypes.DATE, allowNull: true },
    check_attempts: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    next_check_at: { type: DataTypes.DATE, allowNull: true },
    ...timestamps,
  });
  await q.addIndex('payouts', ['reference'], { name: 'payouts_reference_unique', unique: true });
  await q.addIndex('payouts', ['idempotency_key'], { name: 'payouts_idempotency_key_unique', unique: true });
  await q.addIndex('payouts', ['user_id', 'created_at'], { name: 'payouts_user_id_created_at_index' });
  await q.addIndex('payouts', ['status', 'next_check_at'], { name: 'payouts_status_next_check_at_index' });
  await q.addConstraint('payouts', {
    type: 'check',
    name: 'payouts_amount_kobo_positive',
    fields: ['amount_kobo'],
    where: { amount_kobo: { [Op.gt]: 0 } },
  });

  await q.createTable('ledger_entries', {
    id: { type: DataTypes.UUID, primaryKey: true, allowNull: false },
    account: { type: DataTypes.ENUM('creator', 'platform'), allowNull: false },
    user_id: { type: DataTypes.UUID, allowNull: true, references: { model: 'users', key: 'id' } },
    amount_kobo: { type: DataTypes.BIGINT, allowNull: false },
    kind: { type: DataTypes.ENUM('sale', 'payout', 'payout_reversal', 'adjustment'), allowNull: false },
    licence_id: { type: DataTypes.UUID, allowNull: true, references: { model: 'licences', key: 'id' } },
    payout_id: { type: DataTypes.UUID, allowNull: true, references: { model: 'payouts', key: 'id' } },
    ...timestamps,
  });
  await q.addIndex('ledger_entries', ['user_id', 'account'], { name: 'ledger_entries_user_id_account_index' });
  await q.addIndex('ledger_entries', ['kind', 'licence_id', 'account'], {
    name: 'ledger_entries_kind_licence_account_unique',
    unique: true,
  });
  await q.addIndex('ledger_entries', ['kind', 'payout_id', 'account'], {
    name: 'ledger_entries_kind_payout_account_unique',
    unique: true,
  });
};

export const down: Migration = async ({ context: q }) => {
  await q.dropTable('ledger_entries');
  await q.dropTable('payouts');
  await q.dropTable('payout_accounts');
};
