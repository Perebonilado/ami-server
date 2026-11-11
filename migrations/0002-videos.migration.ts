import { DataTypes, Op } from 'sequelize';
import type { Migration } from './umzug.js';

export const up: Migration = async ({ context: q }) => {
  await q.createTable('videos', {
    id: { type: DataTypes.UUID, primaryKey: true, allowNull: false },
    creator_id: { type: DataTypes.UUID, allowNull: false, references: { model: 'users', key: 'id' } },
    title: { type: DataTypes.STRING(120), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: false },
    category: { type: DataTypes.ENUM('Comedy', 'Food', 'Dance', 'Owambe', 'Lifestyle'), allowNull: false },
    tags: { type: DataTypes.JSON, allowNull: false },
    ai_keywords: { type: DataTypes.JSON, allowNull: false },
    search_text: { type: DataTypes.TEXT, allowNull: false },
    duration_sec: { type: DataTypes.INTEGER, allowNull: false },
    base_price_kobo: { type: DataTypes.BIGINT, allowNull: false },
    file_sha256: { type: DataTypes.CHAR(64), allowNull: false },
    file_url: { type: DataTypes.STRING(500), allowNull: false },
    file_size_bytes: { type: DataTypes.BIGINT, allowNull: false },
    preview_url: { type: DataTypes.STRING(500), allowNull: false },
    thumbnail_url: { type: DataTypes.TEXT('medium'), allowNull: true },
    poster_from: { type: DataTypes.STRING(9), allowNull: false },
    poster_to: { type: DataTypes.STRING(9), allowNull: false },
    status: { type: DataTypes.ENUM('live', 'hidden', 'under_review'), allowNull: false },
    created_at: { type: DataTypes.DATE, allowNull: false },
    updated_at: { type: DataTypes.DATE, allowNull: false },
  });
  await q.addIndex('videos', ['file_sha256'], { name: 'videos_file_sha256_unique', unique: true });
  await q.addIndex('videos', ['creator_id'], { name: 'videos_creator_id_index' });
  await q.addIndex('videos', ['status', 'category', 'created_at'], { name: 'videos_status_category_created_index' });
  await q.addConstraint('videos', {
    type: 'check',
    name: 'videos_base_price_kobo_minimum',
    fields: ['base_price_kobo'],
    where: { base_price_kobo: { [Op.gte]: 100000 } },
  });
  await q.addConstraint('videos', {
    type: 'check',
    name: 'videos_duration_sec_positive',
    fields: ['duration_sec'],
    where: { duration_sec: { [Op.gt]: 0 } },
  });
};

export const down: Migration = async ({ context: q }) => {
  await q.dropTable('videos');
};
