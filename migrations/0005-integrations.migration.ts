import { DataTypes } from 'sequelize';
import type { Migration } from './umzug.js';

const timestamps = {
  created_at: { type: DataTypes.DATE, allowNull: false },
  updated_at: { type: DataTypes.DATE, allowNull: false },
};

export const up: Migration = async ({ context: q }) => {
  await q.createTable('webhook_events', {
    id: { type: DataTypes.UUID, primaryKey: true, allowNull: false },
    event_id: { type: DataTypes.STRING(100), allowNull: false },
    type: { type: DataTypes.STRING(60), allowNull: false },
    payload: { type: DataTypes.JSON, allowNull: false },
    processed_at: { type: DataTypes.DATE, allowNull: true },
    attempts: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    error: { type: DataTypes.TEXT, allowNull: true },
    ...timestamps,
  });
  await q.addIndex('webhook_events', ['event_id'], { name: 'webhook_events_event_id_unique', unique: true });
  await q.addIndex('webhook_events', ['processed_at', 'created_at'], { name: 'webhook_events_processed_at_index' });

  await q.createTable('webhook_subscriptions', {
    id: { type: DataTypes.UUID, primaryKey: true, allowNull: false },
    bank_webhook_id: { type: DataTypes.STRING(100), allowNull: false },
    url: { type: DataTypes.STRING(500), allowNull: false },
    secret: { type: DataTypes.STRING(255), allowNull: false },
    ...timestamps,
  });

  await q.createTable('search_intents', {
    id: { type: DataTypes.UUID, primaryKey: true, allowNull: false },
    query_key: { type: DataTypes.STRING(200), allowNull: false },
    keywords: { type: DataTypes.JSON, allowNull: false },
    category: { type: DataTypes.STRING(20), allowNull: true },
    model: { type: DataTypes.STRING(60), allowNull: false },
    expires_at: { type: DataTypes.DATE, allowNull: false },
    ...timestamps,
  });
  await q.addIndex('search_intents', ['query_key'], { name: 'search_intents_query_key_unique', unique: true });

  await q.createTable('bank_requests', {
    id: { type: DataTypes.UUID, primaryKey: true, allowNull: false },
    endpoint: { type: DataTypes.STRING(200), allowNull: false },
    method: { type: DataTypes.STRING(10), allowNull: false },
    idempotency_key: { type: DataTypes.STRING(64), allowNull: true },
    our_reference: { type: DataTypes.STRING(40), allowNull: true },
    http_status: { type: DataTypes.INTEGER, allowNull: true },
    bank_request_id: { type: DataTypes.STRING(64), allowNull: true },
    error_code: { type: DataTypes.STRING(60), allowNull: true },
    duration_ms: { type: DataTypes.INTEGER, allowNull: false },
    created_at: { type: DataTypes.DATE, allowNull: false },
  });
  await q.addIndex('bank_requests', ['our_reference'], { name: 'bank_requests_our_reference_index' });
};

export const down: Migration = async ({ context: q }) => {
  await q.dropTable('bank_requests');
  await q.dropTable('search_intents');
  await q.dropTable('webhook_subscriptions');
  await q.dropTable('webhook_events');
};
