import { DataTypes } from 'sequelize';
import type { Migration } from './umzug.js';

const timestamps = {
  created_at: { type: DataTypes.DATE, allowNull: false },
  updated_at: { type: DataTypes.DATE, allowNull: false },
};

export const up: Migration = async ({ context: q }) => {
  await q.createTable('users', {
    id: { type: DataTypes.UUID, primaryKey: true, allowNull: false },
    name: { type: DataTypes.STRING(120), allowNull: false },
    email: { type: DataTypes.STRING(190), allowNull: false },
    password_hash: { type: DataTypes.STRING(255), allowNull: false },
    business_name: { type: DataTypes.STRING(120), allowNull: true },
    avatar_url: { type: DataTypes.STRING(500), allowNull: true },
    is_admin: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    verified: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    suspended: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    ...timestamps,
  });
  await q.addIndex('users', ['email'], { name: 'users_email_unique', unique: true });

  await q.createTable('revoked_tokens', {
    token_id: { type: DataTypes.UUID, primaryKey: true, allowNull: false },
    user_id: { type: DataTypes.UUID, allowNull: false, references: { model: 'users', key: 'id' } },
    expires_at: { type: DataTypes.DATE, allowNull: false },
    created_at: { type: DataTypes.DATE, allowNull: false },
  });
  await q.addIndex('revoked_tokens', ['expires_at'], { name: 'revoked_tokens_expires_at_index' });
};

export const down: Migration = async ({ context: q }) => {
  await q.dropTable('revoked_tokens');
  await q.dropTable('users');
};
