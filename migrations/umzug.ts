import 'dotenv/config';
import { pathToFileURL } from 'node:url';
import { Sequelize } from 'sequelize';
import { SequelizeStorage, Umzug } from 'umzug';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set, cannot run migrations.');
}

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'mysql',
  logging: false,
  define: { underscored: true, charset: 'utf8mb4' },
});

export const migrator = new Umzug({
  migrations: { glob: ['*.migration.js', { cwd: import.meta.dirname }] },
  context: sequelize.getQueryInterface(),
  storage: new SequelizeStorage({ sequelize }),
  logger: console,
});

export type Migration = typeof migrator._types.migration;

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await migrator.runAsCLI();
}
